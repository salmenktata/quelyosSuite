# -*- coding: utf-8 -*-
"""
Admin Session Management - Suivi et révocation des sessions actives.
"""

from odoo import models, fields, api
from datetime import datetime, timedelta
import hashlib
import logging

_logger = logging.getLogger(__name__)


class AdminSession(models.Model):
    """Sessions actives des administrateurs"""
    _name = 'quelyos.admin.session'
    _description = 'Admin Session'
    _order = 'last_activity desc'

    user_id = fields.Many2one(
        'res.users',
        string='Utilisateur',
        required=True,
        index=True,
        ondelete='cascade',
    )
    session_token = fields.Char(
        'Token Session',
        required=True,
        index=True,
    )
    ip_address = fields.Char('Adresse IP', index=True)
    user_agent = fields.Char('User Agent')
    device_info = fields.Char('Appareil', compute='_compute_device_info', store=True)
    location = fields.Char('Localisation')
    created_at = fields.Datetime('Créé le', default=fields.Datetime.now)
    last_activity = fields.Datetime('Dernière activité', default=fields.Datetime.now)
    expires_at = fields.Datetime('Expire le')
    is_active = fields.Boolean('Active', default=True, index=True)
    is_current = fields.Boolean('Session courante', default=False)
    revoked_at = fields.Datetime('Révoqué le')
    revoked_by = fields.Many2one('res.users', string='Révoqué par')
    revoke_reason = fields.Char('Raison révocation')

    @api.depends('user_agent')
    def _compute_device_info(self):
        for record in self:
            ua = record.user_agent or ''
            if 'Mobile' in ua or 'Android' in ua or 'iPhone' in ua:
                device = 'Mobile'
            elif 'Tablet' in ua or 'iPad' in ua:
                device = 'Tablet'
            else:
                device = 'Desktop'

            if 'Chrome' in ua:
                browser = 'Chrome'
            elif 'Firefox' in ua:
                browser = 'Firefox'
            elif 'Safari' in ua:
                browser = 'Safari'
            elif 'Edge' in ua:
                browser = 'Edge'
            else:
                browser = 'Unknown'

            record.device_info = f"{device} - {browser}"

    @api.model
    def create_session(self, user_id, session_token, ip_address, user_agent, expires_hours=24):
        """Crée une nouvelle session"""
        # Hash du token pour stockage sécurisé
        token_hash = hashlib.sha256(session_token.encode()).hexdigest()

        session = self.sudo().create({
            'user_id': user_id,
            'session_token': token_hash,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'expires_at': datetime.now() + timedelta(hours=expires_hours),
        })

        _logger.info(f"Admin session created for user {user_id} from IP {ip_address}")
        return session

    @api.model
    def update_activity(self, session_token):
        """Met à jour l'activité d'une session"""
        token_hash = hashlib.sha256(session_token.encode()).hexdigest()
        session = self.sudo().search([
            ('session_token', '=', token_hash),
            ('is_active', '=', True)
        ], limit=1)

        if session:
            session.last_activity = fields.Datetime.now()
            return True
        return False

    @api.model
    def get_user_sessions(self, user_id, current_token=None):
        """Récupère toutes les sessions actives d'un utilisateur"""
        sessions = self.sudo().search([
            ('user_id', '=', user_id),
            ('is_active', '=', True),
            '|',
            ('expires_at', '>', fields.Datetime.now()),
            ('expires_at', '=', False)
        ])

        current_hash = None
        if current_token:
            current_hash = hashlib.sha256(current_token.encode()).hexdigest()

        result = []
        for s in sessions:
            result.append({
                'id': s.id,
                'ip_address': s.ip_address,
                'device_info': s.device_info,
                'location': s.location or 'Unknown',
                'created_at': s.created_at.isoformat() if s.created_at else None,
                'last_activity': s.last_activity.isoformat() if s.last_activity else None,
                'is_current': s.session_token == current_hash,
            })

        return result

    def revoke(self, revoked_by_id=None, reason=None):
        """Révoque une session"""
        self.write({
            'is_active': False,
            'revoked_at': fields.Datetime.now(),
            'revoked_by': revoked_by_id,
            'revoke_reason': reason,
        })
        _logger.warning(f"Session {self.id} revoked for user {self.user_id.id}")

    @api.model
    def revoke_all_except_current(self, user_id, current_token):
        """Révoque toutes les sessions sauf la courante"""
        current_hash = hashlib.sha256(current_token.encode()).hexdigest()
        sessions = self.sudo().search([
            ('user_id', '=', user_id),
            ('is_active', '=', True),
            ('session_token', '!=', current_hash)
        ])
        count = len(sessions)
        sessions.revoke(revoked_by_id=user_id, reason='User requested logout all')
        return count

    @api.model
    def cleanup_expired(self):
        """Nettoie les sessions expirées (cron job)"""
        expired = self.sudo().search([
            ('is_active', '=', True),
            ('expires_at', '<', fields.Datetime.now())
        ])
        expired.write({'is_active': False})
        _logger.info(f"Cleaned up {len(expired)} expired sessions")
        return len(expired)
