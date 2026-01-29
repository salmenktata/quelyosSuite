# -*- coding: utf-8 -*-
"""
Modèle pour gérer les refresh tokens d'authentification
Permet de maintenir des sessions longue durée avec rotation sécurisée
"""
import hashlib
import secrets
import logging
from datetime import datetime, timedelta
from odoo import models, fields, api
from odoo.exceptions import AccessDenied

_logger = logging.getLogger(__name__)

# Durée de validité des tokens
SESSION_TOKEN_EXPIRY = 30  # minutes
REFRESH_TOKEN_EXPIRY = 7  # jours


class AuthRefreshToken(models.Model):
    """Tokens de rafraîchissement pour authentification sécurisée"""

    _name = 'auth.refresh.token'
    _description = 'Refresh Tokens'
    _order = 'create_date desc'

    # Champs
    token_hash = fields.Char(
        string='Token Hash',
        required=True,
        index=True,
        help='Hash SHA256 du token (stocké de manière sécurisée)'
    )
    user_id = fields.Many2one(
        'res.users',
        string='User',
        required=True,
        ondelete='cascade',
        index=True
    )
    expires_at = fields.Datetime(
        string='Expiration',
        required=True,
        index=True
    )
    last_used = fields.Datetime(
        string='Dernier Utilisation',
        readonly=True
    )
    ip_address = fields.Char(
        string='IP Address',
        help='Adresse IP ayant généré ce token'
    )
    user_agent = fields.Char(
        string='User Agent',
        help='Navigateur ayant généré ce token'
    )
    revoked = fields.Boolean(
        string='Révoqué',
        default=False,
        index=True,
        help='Token révoqué (logout explicite)'
    )

    _sql_constraints = [
        ('token_hash_unique', 'unique(token_hash)', 'Token hash must be unique')
    ]

    @api.model
    def generate_token(self, user_id, ip_address=None, user_agent=None):
        """
        Génère un nouveau refresh token pour l'utilisateur

        Args:
            user_id (int): ID de l'utilisateur
            ip_address (str): Adresse IP du client
            user_agent (str): User agent du navigateur

        Returns:
            tuple: (token_plain, token_record) - Token en clair et record DB
        """
        # Générer token sécurisé (256 bits = 32 bytes)
        token_plain = secrets.token_urlsafe(32)

        # Hasher le token (SHA256)
        token_hash = hashlib.sha256(token_plain.encode()).hexdigest()

        # Expiration (7 jours par défaut)
        expires_at = fields.Datetime.now() + timedelta(days=REFRESH_TOKEN_EXPIRY)

        # Créer le record
        token_record = self.sudo().create({
            'token_hash': token_hash,
            'user_id': user_id,
            'expires_at': expires_at,
            'ip_address': ip_address,
            'user_agent': user_agent,
        })

        _logger.info(f"Refresh token generated for user {user_id} (expires: {expires_at})")

        return token_plain, token_record

    @api.model
    def validate_token(self, token_plain):
        """
        Valide un refresh token et retourne l'utilisateur associé

        Args:
            token_plain (str): Token en clair

        Returns:
            res.users: Utilisateur associé au token valide

        Raises:
            AccessDenied: Si token invalide, expiré ou révoqué
        """
        # Hasher le token fourni
        token_hash = hashlib.sha256(token_plain.encode()).hexdigest()

        # Chercher le token en DB
        token_record = self.sudo().search([
            ('token_hash', '=', token_hash),
            ('revoked', '=', False),
        ], limit=1)

        if not token_record:
            _logger.warning("Refresh token not found or revoked")
            raise AccessDenied("Invalid refresh token")

        # Vérifier expiration
        if token_record.expires_at < fields.Datetime.now():
            _logger.warning(f"Refresh token expired for user {token_record.user_id.id}")
            token_record.sudo().write({'revoked': True})
            raise AccessDenied("Refresh token expired")

        # Update last_used
        token_record.sudo().write({'last_used': fields.Datetime.now()})

        _logger.info(f"Refresh token validated for user {token_record.user_id.id}")
        return token_record.user_id

    @api.model
    def revoke_token(self, token_plain):
        """
        Révoque un refresh token (logout)

        Args:
            token_plain (str): Token à révoquer

        Returns:
            bool: True si révoqué avec succès
        """
        token_hash = hashlib.sha256(token_plain.encode()).hexdigest()

        token_record = self.sudo().search([
            ('token_hash', '=', token_hash)
        ], limit=1)

        if token_record:
            token_record.sudo().write({'revoked': True})
            _logger.info(f"Refresh token revoked for user {token_record.user_id.id}")
            return True

        return False

    @api.model
    def revoke_all_user_tokens(self, user_id):
        """
        Révoque tous les tokens d'un utilisateur (logout sur tous les appareils)

        Args:
            user_id (int): ID de l'utilisateur

        Returns:
            int: Nombre de tokens révoqués
        """
        tokens = self.sudo().search([
            ('user_id', '=', user_id),
            ('revoked', '=', False)
        ])

        count = len(tokens)
        tokens.sudo().write({'revoked': True})

        _logger.info(f"Revoked {count} refresh tokens for user {user_id}")
        return count

    @api.model
    def cleanup_expired_tokens(self):
        """
        Cron pour nettoyer les tokens expirés (> 30 jours)
        À appeler quotidiennement
        """
        cutoff_date = fields.Datetime.now() - timedelta(days=30)

        expired_tokens = self.sudo().search([
            ('expires_at', '<', cutoff_date)
        ])

        count = len(expired_tokens)
        expired_tokens.sudo().unlink()

        _logger.info(f"Cleaned up {count} expired refresh tokens")
        return count
