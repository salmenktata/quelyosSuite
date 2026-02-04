# -*- coding: utf-8 -*-
"""
Modèle NewsletterSubscriber - Gestion des abonnés newsletter

Fonctionnalités :
- Gestion des abonnés avec email, nom, statut
- Segmentation (VIP, Regular, Occasional, New)
- Statistiques d'engagement (taux d'ouverture, clics)
- Historique des campagnes reçues
- Tags personnalisés pour ciblage
"""

from odoo import models, fields, api
from odoo.exceptions import ValidationError
import re


class NewsletterSubscriber(models.Model):
    _name = 'quelyos.newsletter.subscriber'
    _description = 'Abonné Newsletter'
    _order = 'create_date desc'

    # Champs principaux
    name = fields.Char(
        string='Nom',
        help='Nom complet de l\'abonné'
    )
    email = fields.Char(
        string='Email',
        required=True,
        index=True,
        help='Adresse email de l\'abonné'
    )

    # Statut et segmentation
    status = fields.Selection([
        ('subscribed', 'Abonné'),
        ('unsubscribed', 'Désabonné'),
        ('bounced', 'Rebond'),
        ('spam', 'Spam')
    ], string='Statut', default='subscribed', required=True)

    segment = fields.Selection([
        ('vip', 'VIP'),
        ('regular', 'Régulier'),
        ('occasional', 'Occasionnel'),
        ('new', 'Nouveau')
    ], string='Segment', default='new')

    # Tags pour ciblage personnalisé
    tag_ids = fields.Many2many(
        'quelyos.newsletter.tag',
        string='Tags',
        help='Tags pour segmentation fine'
    )

    # Statistiques engagement
    stats_open_rate = fields.Float(
        string='Taux d\'ouverture (%)',
        compute='_compute_stats',
        store=True,
        help='Pourcentage de campagnes ouvertes'
    )
    stats_click_rate = fields.Float(
        string='Taux de clic (%)',
        compute='_compute_stats',
        store=True,
        help='Pourcentage de campagnes avec clic'
    )
    stats_campaigns_received = fields.Integer(
        string='Campagnes reçues',
        compute='_compute_stats',
        store=True
    )

    # Dates
    subscribed_date = fields.Datetime(
        string='Date d\'abonnement',
        default=fields.Datetime.now
    )
    last_activity_date = fields.Datetime(
        string='Dernière activité'
    )

    # Métadonnées
    tenant_id = fields.Many2one(
        'quelyos.tenant',
        string='Tenant',
        required=True,
        index=True,
        ondelete='cascade'
    )
    active = fields.Boolean(default=True)

    # Contraintes SQL
    _sql_constraints = [
        ('email_tenant_unique',
         'UNIQUE(email, tenant_id)',
         'Cet email est déjà abonné à la newsletter.')
    ]

    @api.constrains('email')
    def _check_email_format(self):
        """Valide le format de l'email"""
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        for record in self:
            if record.email and not re.match(email_regex, record.email):
                raise ValidationError(f"Format d'email invalide : {record.email}")

    @api.depends('tenant_id')
    def _compute_stats(self):
        """Calcule les statistiques d'engagement"""
        for record in self:
            # TODO: Calculer à partir des logs de campagne
            # Pour l'instant, valeurs par défaut
            record.stats_open_rate = 0.0
            record.stats_click_rate = 0.0
            record.stats_campaigns_received = 0

    def action_unsubscribe(self):
        """Action de désabonnement"""
        self.write({
            'status': 'unsubscribed',
            'active': False
        })

    def action_resubscribe(self):
        """Action de réabonnement"""
        self.write({
            'status': 'subscribed',
            'active': True
        })


class NewsletterTag(models.Model):
    _name = 'quelyos.newsletter.tag'
    _description = 'Tag Newsletter'

    name = fields.Char(string='Nom', required=True)
    color = fields.Integer(string='Couleur')
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', required=True)

    _sql_constraints = [
        ('name_tenant_unique',
         'UNIQUE(name, tenant_id)',
         'Ce tag existe déjà.')
    ]
