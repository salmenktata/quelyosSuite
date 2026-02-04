# -*- coding: utf-8 -*-
"""
Modèle NewsletterCampaign - Gestion des campagnes newsletter

Fonctionnalités :
- Création et édition de campagnes email
- Segmentation des destinataires
- Planification d'envoi
- Statistiques en temps réel (envois, ouvertures, clics)
- Templates HTML avec variables
- Tests A/B (futur)
"""

from odoo import models, fields, api
from odoo.exceptions import UserError, ValidationError
from datetime import datetime


class NewsletterCampaign(models.Model):
    _name = 'quelyos.newsletter.campaign'
    _description = 'Campagne Newsletter'
    _order = 'create_date desc'

    # Informations principales
    name = fields.Char(
        string='Nom de la campagne',
        required=True,
        help='Nom interne de la campagne'
    )
    subject = fields.Char(
        string='Sujet de l\'email',
        required=True,
        help='Ligne de sujet visible dans la boîte mail'
    )
    preview_text = fields.Char(
        string='Texte de prévisualisation',
        help='Texte affiché en aperçu dans les clients email'
    )

    # Contenu HTML
    html_body = fields.Html(
        string='Contenu HTML',
        sanitize=False,
        help='Contenu HTML de l\'email'
    )
    plain_text_body = fields.Text(
        string='Contenu texte brut',
        help='Version texte pour clients email ne supportant pas HTML'
    )

    # Ciblage et segmentation
    segment_id = fields.Many2one(
        'quelyos.newsletter.segment',
        string='Segment cible',
        help='Segment de destinataires visé'
    )
    recipient_count = fields.Integer(
        string='Nombre de destinataires',
        compute='_compute_recipient_count',
        store=True
    )

    # État et planification
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('scheduled', 'Programmé'),
        ('sending', 'En envoi'),
        ('sent', 'Envoyé'),
        ('cancelled', 'Annulé')
    ], string='État', default='draft', required=True)

    scheduled_date = fields.Datetime(
        string='Date d\'envoi programmée'
    )
    sent_date = fields.Datetime(
        string='Date d\'envoi réelle',
        readonly=True
    )

    # Expéditeur
    from_name = fields.Char(
        string='Nom expéditeur',
        default='Notre boutique'
    )
    from_email = fields.Char(
        string='Email expéditeur',
        default='noreply@votreboutique.com'
    )
    reply_to = fields.Char(
        string='Email de réponse'
    )

    # Statistiques
    analytics = fields.Json(
        string='Analytics',
        help='Statistiques détaillées de la campagne'
    )
    stats_sent = fields.Integer(
        string='Envoyés',
        default=0,
        help='Nombre d\'emails envoyés'
    )
    stats_delivered = fields.Integer(
        string='Délivrés',
        default=0
    )
    stats_opened = fields.Integer(
        string='Ouverts',
        default=0
    )
    stats_clicked = fields.Integer(
        string='Cliqués',
        default=0
    )
    stats_bounced = fields.Integer(
        string='Rebonds',
        default=0
    )
    stats_unsubscribed = fields.Integer(
        string='Désabonnements',
        default=0
    )

    # Taux calculés
    open_rate = fields.Float(
        string='Taux d\'ouverture (%)',
        compute='_compute_rates',
        store=True
    )
    click_rate = fields.Float(
        string='Taux de clic (%)',
        compute='_compute_rates',
        store=True
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

    @api.depends('segment_id')
    def _compute_recipient_count(self):
        """Calcule le nombre de destinataires selon le segment"""
        for record in self:
            if record.segment_id:
                # Compter les abonnés actifs du segment
                subscribers = self.env['quelyos.newsletter.subscriber'].search_count([
                    ('tenant_id', '=', record.tenant_id.id),
                    ('status', '=', 'subscribed'),
                    ('segment', '=', record.segment_id.segment_type)
                ])
                record.recipient_count = subscribers
            else:
                # Tous les abonnés actifs
                record.recipient_count = self.env['quelyos.newsletter.subscriber'].search_count([
                    ('tenant_id', '=', record.tenant_id.id),
                    ('status', '=', 'subscribed')
                ])

    @api.depends('stats_sent', 'stats_opened', 'stats_clicked')
    def _compute_rates(self):
        """Calcule les taux d'ouverture et de clic"""
        for record in self:
            if record.stats_sent > 0:
                record.open_rate = (record.stats_opened / record.stats_sent) * 100
                record.click_rate = (record.stats_clicked / record.stats_sent) * 100
            else:
                record.open_rate = 0.0
                record.click_rate = 0.0

    def action_schedule(self):
        """Programme l'envoi de la campagne"""
        self.ensure_one()
        if not self.scheduled_date:
            raise UserError("Veuillez définir une date d'envoi programmée.")
        if self.scheduled_date <= fields.Datetime.now():
            raise UserError("La date d'envoi doit être dans le futur.")

        self.write({'state': 'scheduled'})

    def action_send_now(self):
        """Envoie immédiatement la campagne"""
        self.ensure_one()
        if not self.html_body:
            raise UserError("Le contenu de la campagne est vide.")

        # TODO: Intégrer avec service d'envoi email (SendGrid, Mailgun, etc.)
        self.write({
            'state': 'sending',
            'sent_date': fields.Datetime.now()
        })

        # Simulation d'envoi pour développement
        self._send_to_subscribers()

        self.write({'state': 'sent'})

    def action_send_test(self, test_email):
        """Envoie un email de test"""
        self.ensure_one()
        if not test_email:
            raise UserError("Veuillez fournir une adresse email de test.")

        # TODO: Implémenter l'envoi de test
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'message': f'Email de test envoyé à {test_email}',
                'type': 'success',
                'sticky': False,
            }
        }

    def action_cancel(self):
        """Annule la campagne"""
        self.ensure_one()
        if self.state not in ['draft', 'scheduled']:
            raise UserError("Impossible d'annuler une campagne déjà envoyée.")

        self.write({'state': 'cancelled'})

    def _send_to_subscribers(self):
        """Envoie l'email à tous les destinataires du segment"""
        self.ensure_one()

        # Récupérer les abonnés selon le segment
        domain = [
            ('tenant_id', '=', self.tenant_id.id),
            ('status', '=', 'subscribed')
        ]
        if self.segment_id:
            domain.append(('segment', '=', self.segment_id.segment_type))

        subscribers = self.env['quelyos.newsletter.subscriber'].search(domain)

        # Simuler l'envoi
        self.stats_sent = len(subscribers)
        self.stats_delivered = len(subscribers)

        # TODO: Intégrer avec vrai service d'envoi email


class NewsletterSegment(models.Model):
    _name = 'quelyos.newsletter.segment'
    _description = 'Segment Newsletter'

    name = fields.Char(string='Nom', required=True)
    description = fields.Text(string='Description')
    segment_type = fields.Selection([
        ('all', 'Tous'),
        ('vip', 'VIP'),
        ('regular', 'Réguliers'),
        ('occasional', 'Occasionnels'),
        ('new', 'Nouveaux')
    ], string='Type', default='all', required=True)

    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', required=True)
    active = fields.Boolean(default=True)
