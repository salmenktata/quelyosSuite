# -*- coding: utf-8 -*-
"""
Modèle Password History pour anti-réutilisation des mots de passe.

Stocke les hashes des anciens mots de passe pour empêcher
leur réutilisation lors d'un changement de mot de passe.
"""

from odoo import models, fields, api
import logging

_logger = logging.getLogger(__name__)


class PasswordHistory(models.Model):
    """
    Historique des mots de passe utilisateur.

    Conserve les N derniers hashes pour empêcher la réutilisation.
    Les hashes sont stockés, pas les mots de passe en clair.
    """
    _name = 'quelyos.password.history'
    _description = 'Password History'
    _order = 'create_date desc'

    user_id = fields.Many2one(
        'res.users',
        string='Utilisateur',
        required=True,
        index=True,
        ondelete='cascade',
    )
    password_hash = fields.Char(
        'Hash mot de passe',
        required=True,
        help="Hash du mot de passe (jamais le mot de passe en clair)",
    )

    @api.model
    def cleanup_old_history(self, max_records_per_user: int = 5):
        """
        Nettoie l'historique en gardant seulement les N derniers par utilisateur.

        Args:
            max_records_per_user: Nombre de records à garder par utilisateur
        """
        # Récupérer tous les utilisateurs avec historique
        users = self.sudo().search([]).mapped('user_id')

        total_deleted = 0
        for user in users:
            old_records = self.sudo().search([
                ('user_id', '=', user.id)
            ], order='create_date desc', offset=max_records_per_user)

            if old_records:
                total_deleted += len(old_records)
                old_records.unlink()

        if total_deleted:
            _logger.info(f"Password history cleanup: {total_deleted} old records deleted")

        return total_deleted
