# -*- coding: utf-8 -*-
from odoo import models, fields, api
from odoo.exceptions import ValidationError


class MarketingCampaignVariant(models.Model):
    """
    Variantes A/B/C pour campagnes marketing.
    Permet de tester plusieurs versions (subject, contenu) et sélectionner la gagnante.
    """
    _name = 'quelyos.marketing.campaign.variant'
    _description = 'Marketing Campaign Variant (A/B Testing)'
    _order = 'campaign_id, variant_letter'

    name = fields.Char(
        string='Nom',
        compute='_compute_name',
        store=True,
        help='Nom affiché de la variante (ex: "Campagne Hiver - Variante A")'
    )

    # Campagne parente
    campaign_id = fields.Many2one(
        'quelyos.marketing.campaign',
        string='Campagne',
        required=True,
        ondelete='cascade',
        index=True,
        help='Campagne parente contenant cette variante'
    )

    # Identifiant de la variante
    variant_letter = fields.Selection([
        ('A', 'Variante A'),
        ('B', 'Variante B'),
        ('C', 'Variante C'),
    ], string='Lettre', required=True, default='A', help='Identifiant de la variante')

    # Contenu spécifique à la variante
    subject = fields.Char(
        string='Objet email',
        required=True,
        help='Objet de l\'email pour cette variante'
    )

    body = fields.Html(
        string='Corps email',
        required=True,
        help='Contenu HTML de l\'email pour cette variante'
    )

    # Statistiques
    stats_sent = fields.Integer(
        string='Envoyés',
        default=0,
        readonly=True,
        help='Nombre d\'emails envoyés pour cette variante'
    )

    stats_delivered = fields.Integer(
        string='Livrés',
        default=0,
        readonly=True,
        help='Nombre d\'emails livrés'
    )

    stats_opened = fields.Integer(
        string='Ouverts',
        default=0,
        readonly=True,
        help='Nombre d\'emails ouverts'
    )

    stats_clicked = fields.Integer(
        string='Cliqués',
        default=0,
        readonly=True,
        help='Nombre de clics sur liens'
    )

    stats_bounced = fields.Integer(
        string='Bounces',
        default=0,
        readonly=True,
        help='Nombre d\'emails en bounce'
    )

    stats_unsubscribed = fields.Integer(
        string='Désabonnés',
        default=0,
        readonly=True,
        help='Nombre de désabonnements suite à cet envoi'
    )

    # Métriques calculées
    open_rate = fields.Float(
        string='Taux d\'ouverture (%)',
        compute='_compute_rates',
        store=True,
        help='Pourcentage d\'ouvertures par rapport aux emails livrés'
    )

    click_rate = fields.Float(
        string='Taux de clic (%)',
        compute='_compute_rates',
        store=True,
        help='Pourcentage de clics par rapport aux emails ouverts'
    )

    bounce_rate = fields.Float(
        string='Taux de bounce (%)',
        compute='_compute_rates',
        store=True,
        help='Pourcentage de bounces par rapport aux emails envoyés'
    )

    conversion_score = fields.Float(
        string='Score de conversion',
        compute='_compute_rates',
        store=True,
        help='Score composite pondéré : 40% open + 40% click + 20% (1-bounce)'
    )

    # Sélection du gagnant
    is_winner = fields.Boolean(
        string='Variante gagnante',
        default=False,
        help='Cette variante a été sélectionnée comme gagnante'
    )

    # Multi-tenant
    company_id = fields.Many2one(
        'res.company',
        string='Société',
        related='campaign_id.company_id',
        store=True,
        readonly=True
    )

    _sql_constraints = [
        ('variant_unique', 'UNIQUE(campaign_id, variant_letter)',
         'Une seule variante par lettre par campagne'),
    ]

    @api.depends('campaign_id.name', 'variant_letter')
    def _compute_name(self):
        """Générer nom basé sur campagne et variante"""
        for record in self:
            if record.campaign_id and record.variant_letter:
                record.name = f"{record.campaign_id.name} - Variante {record.variant_letter}"
            else:
                record.name = "Variante sans nom"

    @api.depends('stats_sent', 'stats_delivered', 'stats_opened', 'stats_clicked', 'stats_bounced')
    def _compute_rates(self):
        """Calculer taux d'ouverture, clic, bounce et score composite"""
        for record in self:
            # Taux d'ouverture = (ouverts / livrés) * 100
            if record.stats_delivered > 0:
                record.open_rate = round((record.stats_opened / record.stats_delivered) * 100, 2)
            else:
                record.open_rate = 0.0

            # Taux de clic = (cliqués / ouverts) * 100
            if record.stats_opened > 0:
                record.click_rate = round((record.stats_clicked / record.stats_opened) * 100, 2)
            else:
                record.click_rate = 0.0

            # Taux de bounce = (bounces / envoyés) * 100
            if record.stats_sent > 0:
                record.bounce_rate = round((record.stats_bounced / record.stats_sent) * 100, 2)
            else:
                record.bounce_rate = 0.0

            # Score composite : open_rate (40%) + click_rate (40%) + (100 - bounce_rate) (20%)
            # Ce score permet de comparer globalement les performances
            record.conversion_score = round(
                (record.open_rate * 0.4) +
                (record.click_rate * 0.4) +
                ((100 - record.bounce_rate) * 0.2),
                2
            )

    @api.constrains('campaign_id', 'variant_letter')
    def _check_max_variants(self):
        """Limiter à 3 variantes par campagne"""
        for record in self:
            count = self.search_count([('campaign_id', '=', record.campaign_id.id)])
            if count > 3:
                raise ValidationError(
                    "Maximum 3 variantes par campagne (A, B, C)"
                )

    def action_select_as_winner(self):
        """Marquer cette variante comme gagnante"""
        self.ensure_one()

        # Réinitialiser tous les gagnants de cette campagne
        self.search([
            ('campaign_id', '=', self.campaign_id.id),
            ('is_winner', '=', True),
        ]).write({'is_winner': False})

        # Marquer celle-ci comme gagnante
        self.write({'is_winner': True})

        # Copier le contenu gagnant dans la campagne parente
        self.campaign_id.write({
            'subject': self.subject,
            'body': self.body,
        })

        return True

    def increment_stat(self, stat_name):
        """Incrémenter une statistique (+1)"""
        self.ensure_one()
        if stat_name in ['stats_sent', 'stats_delivered', 'stats_opened', 'stats_clicked', 'stats_bounced', 'stats_unsubscribed']:
            self.write({stat_name: getattr(self, stat_name) + 1})

    def to_dict(self):
        """Sérialisation pour API"""
        return {
            'id': self.id,
            'name': self.name,
            'campaign_id': self.campaign_id.id,
            'campaign_name': self.campaign_id.name,
            'variant_letter': self.variant_letter,
            'subject': self.subject,
            'body': self.body,
            'stats_sent': self.stats_sent,
            'stats_delivered': self.stats_delivered,
            'stats_opened': self.stats_opened,
            'stats_clicked': self.stats_clicked,
            'stats_bounced': self.stats_bounced,
            'stats_unsubscribed': self.stats_unsubscribed,
            'open_rate': self.open_rate,
            'click_rate': self.click_rate,
            'bounce_rate': self.bounce_rate,
            'conversion_score': self.conversion_score,
            'is_winner': self.is_winner,
        }
