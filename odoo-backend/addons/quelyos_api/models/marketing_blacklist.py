# -*- coding: utf-8 -*-
from odoo import models, fields, api
import secrets
import hashlib


class MarketingBlacklist(models.Model):
    """Liste noire marketing pour désabonnements (RGPD)"""
    _name = 'quelyos.marketing.blacklist'
    _description = 'Marketing Blacklist'
    _order = 'create_date desc'

    email = fields.Char(string='Email', required=True, index=True)
    token = fields.Char(string='Token', required=True, index=True, readonly=True)

    # Source du désabonnement
    campaign_id = fields.Many2one(
        'quelyos.marketing.campaign',
        string='Campagne',
        help='Campagne depuis laquelle le désabonnement a eu lieu'
    )

    # Métadonnées
    reason = fields.Selection([
        ('user_request', 'Demande utilisateur'),
        ('spam_complaint', 'Plainte spam'),
        ('hard_bounce', 'Rebond permanent'),
        ('manual', 'Ajout manuel'),
    ], string='Raison', default='user_request')

    notes = fields.Text(string='Notes')
    active = fields.Boolean(default=True)

    company_id = fields.Many2one(
        'res.company',
        string='Société',
        default=lambda self: self.env.company
    )

    _sql_constraints = [
        ('email_unique', 'UNIQUE(email, company_id)',
         'Cet email est déjà dans la liste noire'),
    ]

    @api.model
    def create(self, vals):
        """Générer token unique lors de la création"""
        if not vals.get('token'):
            vals['token'] = self._generate_token(vals.get('email', ''))
        return super().create(vals)

    def _generate_token(self, email):
        """Générer token sécurisé pour unsubscribe link"""
        random_part = secrets.token_urlsafe(16)
        email_hash = hashlib.sha256(email.encode()).hexdigest()[:8]
        return f"{email_hash}_{random_part}"

    @api.model
    def is_blacklisted(self, email):
        """Vérifier si email est blacklisté"""
        return bool(self.search_count([
            ('email', '=', email.lower()),
            ('active', '=', True)
        ]))

    @api.model
    def add_to_blacklist(self, email, campaign_id=None, reason='user_request'):
        """Ajouter email à la blacklist"""
        existing = self.search([
            ('email', '=', email.lower()),
            ('company_id', '=', self.env.company.id)
        ], limit=1)

        if existing:
            existing.write({'active': True, 'reason': reason})
            return existing

        return self.create({
            'email': email.lower(),
            'campaign_id': campaign_id,
            'reason': reason,
        })

    @api.model
    def remove_from_blacklist(self, email):
        """Retirer email de la blacklist (opt-in)"""
        records = self.search([
            ('email', '=', email.lower()),
            ('active', '=', True)
        ])
        records.write({'active': False})
        return len(records)

    def get_unsubscribe_url(self, base_url):
        """Générer URL de désabonnement"""
        self.ensure_one()
        return f"{base_url}/unsubscribe/{self.token}"
