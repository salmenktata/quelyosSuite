# -*- coding: utf-8 -*-
"""
Modèle User TOTP pour 2FA/MFA.

Stocke les secrets TOTP et codes de backup des utilisateurs.
"""

from odoo import models, fields, api
from odoo.exceptions import ValidationError, AccessDenied
import logging

_logger = logging.getLogger(__name__)


class UserTOTP(models.Model):
    """
    Configuration TOTP par utilisateur.
    Un utilisateur peut avoir un seul enregistrement TOTP actif.
    """
    _name = 'quelyos.user.totp'
    _description = 'User TOTP Configuration'
    _rec_name = 'user_id'

    user_id = fields.Many2one(
        'res.users',
        string='Utilisateur',
        required=True,
        index=True,
        ondelete='cascade',
    )
    secret = fields.Char(
        'Secret TOTP',
        required=True,
        help="Secret en base32 pour génération des codes TOTP",
    )
    is_enabled = fields.Boolean(
        '2FA Activé',
        default=False,
        help="True si l'utilisateur a confirmé l'activation du 2FA",
    )
    enabled_at = fields.Datetime(
        'Activé le',
        readonly=True,
    )
    backup_codes_hash = fields.Text(
        'Codes de backup (hashes)',
        help="Hashes JSON des codes de backup restants",
    )
    last_used_at = fields.Datetime(
        'Dernière utilisation',
        readonly=True,
    )
    failed_attempts = fields.Integer(
        'Tentatives échouées',
        default=0,
    )
    locked_until = fields.Datetime(
        'Bloqué jusqu\'à',
    )

    _sql_constraints = [
        ('user_unique', 'UNIQUE(user_id)', 'Un utilisateur ne peut avoir qu\'une configuration TOTP'),
    ]

    @api.model
    def setup_totp(self, user_id: int) -> dict:
        """
        Initialise le 2FA pour un utilisateur (génère secret, pas encore activé).

        Args:
            user_id: ID de l'utilisateur

        Returns:
            dict: {secret, qr_code, backup_codes}
        """
        from ..lib.totp_auth import (
            generate_secret,
            get_provisioning_uri,
            get_qr_code_data_uri,
            generate_backup_codes,
            hash_backup_code,
            format_secret_for_display,
        )
        import json

        # Vérifier si déjà configuré et activé
        existing = self.sudo().search([('user_id', '=', user_id), ('is_enabled', '=', True)])
        if existing:
            raise ValidationError("Le 2FA est déjà activé pour cet utilisateur")

        # Supprimer config précédente non activée
        old_pending = self.sudo().search([('user_id', '=', user_id), ('is_enabled', '=', False)])
        old_pending.unlink()

        # Récupérer l'email de l'utilisateur
        user = self.env['res.users'].sudo().browse(user_id)
        if not user.exists():
            raise ValidationError("Utilisateur non trouvé")

        email = user.email or user.login

        # Générer secret et codes de backup
        secret = generate_secret()
        backup_codes = generate_backup_codes()
        backup_hashes = [hash_backup_code(code) for code in backup_codes]

        # Créer l'enregistrement (pas encore activé)
        self.sudo().create({
            'user_id': user_id,
            'secret': secret,
            'is_enabled': False,
            'backup_codes_hash': json.dumps(backup_hashes),
        })

        # Générer QR code
        qr_code = get_qr_code_data_uri(secret, email)
        provisioning_uri = get_provisioning_uri(secret, email)

        _logger.info(f"TOTP setup initiated for user {user_id}")

        return {
            'secret': format_secret_for_display(secret),
            'secret_raw': secret,
            'qr_code': qr_code,
            'provisioning_uri': provisioning_uri,
            'backup_codes': backup_codes,
        }

    @api.model
    def confirm_totp(self, user_id: int, code: str) -> bool:
        """
        Confirme l'activation du 2FA en vérifiant le premier code.

        Args:
            user_id: ID de l'utilisateur
            code: Code TOTP à vérifier

        Returns:
            bool: True si activé avec succès
        """
        from ..lib.totp_auth import verify_totp_code

        totp_config = self.sudo().search([
            ('user_id', '=', user_id),
            ('is_enabled', '=', False)
        ], limit=1)

        if not totp_config:
            raise ValidationError("Aucune configuration TOTP en attente")

        # Vérifier le code
        if not verify_totp_code(totp_config.secret, code):
            totp_config.failed_attempts += 1
            _logger.warning(f"TOTP confirmation failed for user {user_id}")
            raise ValidationError("Code TOTP invalide")

        # Activer le 2FA
        totp_config.write({
            'is_enabled': True,
            'enabled_at': fields.Datetime.now(),
            'failed_attempts': 0,
        })

        _logger.info(f"TOTP enabled for user {user_id}")

        return True

    @api.model
    def verify_totp(self, user_id: int, code: str) -> bool:
        """
        Vérifie un code TOTP pour un utilisateur.

        Args:
            user_id: ID de l'utilisateur
            code: Code TOTP ou code de backup

        Returns:
            bool: True si le code est valide

        Raises:
            AccessDenied: Si le compte est bloqué ou code invalide
        """
        from ..lib.totp_auth import verify_totp_code, verify_backup_code
        import json
        from datetime import datetime, timedelta

        totp_config = self.sudo().search([
            ('user_id', '=', user_id),
            ('is_enabled', '=', True)
        ], limit=1)

        if not totp_config:
            # Pas de 2FA activé, considérer comme valide
            return True

        # Vérifier si bloqué
        if totp_config.locked_until and totp_config.locked_until > fields.Datetime.now():
            remaining = (totp_config.locked_until - datetime.now()).total_seconds()
            raise AccessDenied(f"Compte temporairement bloqué. Réessayez dans {int(remaining)} secondes.")

        # Essayer d'abord comme code TOTP
        if verify_totp_code(totp_config.secret, code):
            totp_config.write({
                'last_used_at': fields.Datetime.now(),
                'failed_attempts': 0,
                'locked_until': False,
            })
            return True

        # Essayer comme code de backup
        if totp_config.backup_codes_hash:
            backup_hashes = json.loads(totp_config.backup_codes_hash)
            is_valid, used_hash = verify_backup_code(code, backup_hashes)

            if is_valid:
                # Supprimer le code utilisé
                backup_hashes.remove(used_hash)
                totp_config.write({
                    'backup_codes_hash': json.dumps(backup_hashes),
                    'last_used_at': fields.Datetime.now(),
                    'failed_attempts': 0,
                    'locked_until': False,
                })
                _logger.info(f"Backup code used for user {user_id}, {len(backup_hashes)} remaining")
                return True

        # Code invalide
        totp_config.failed_attempts += 1

        # Bloquer après 5 tentatives
        if totp_config.failed_attempts >= 5:
            totp_config.locked_until = fields.Datetime.now() + timedelta(minutes=15)
            _logger.warning(f"TOTP locked for user {user_id} after {totp_config.failed_attempts} attempts")

        raise AccessDenied("Code 2FA invalide")

    @api.model
    def disable_totp(self, user_id: int, code: str) -> bool:
        """
        Désactive le 2FA pour un utilisateur (nécessite vérification du code).

        Args:
            user_id: ID de l'utilisateur
            code: Code TOTP actuel pour confirmer

        Returns:
            bool: True si désactivé avec succès
        """
        # Vérifier le code d'abord
        self.verify_totp(user_id, code)

        # Supprimer la configuration
        totp_config = self.sudo().search([
            ('user_id', '=', user_id),
            ('is_enabled', '=', True)
        ])

        if totp_config:
            totp_config.unlink()
            _logger.info(f"TOTP disabled for user {user_id}")

        return True

    @api.model
    def is_totp_enabled(self, user_id: int) -> bool:
        """
        Vérifie si le 2FA est activé pour un utilisateur.

        Args:
            user_id: ID de l'utilisateur

        Returns:
            bool: True si 2FA activé
        """
        return bool(self.sudo().search_count([
            ('user_id', '=', user_id),
            ('is_enabled', '=', True)
        ]))

    @api.model
    def regenerate_backup_codes(self, user_id: int, code: str) -> list:
        """
        Régénère les codes de backup (invalide les anciens).

        Args:
            user_id: ID de l'utilisateur
            code: Code TOTP pour vérification

        Returns:
            list: Nouveaux codes de backup
        """
        from ..lib.totp_auth import generate_backup_codes, hash_backup_code
        import json

        # Vérifier le code
        self.verify_totp(user_id, code)

        totp_config = self.sudo().search([
            ('user_id', '=', user_id),
            ('is_enabled', '=', True)
        ], limit=1)

        if not totp_config:
            raise ValidationError("2FA non activé")

        # Générer nouveaux codes
        new_codes = generate_backup_codes()
        new_hashes = [hash_backup_code(c) for c in new_codes]

        totp_config.backup_codes_hash = json.dumps(new_hashes)

        _logger.info(f"Backup codes regenerated for user {user_id}")

        return new_codes
