# -*- coding: utf-8 -*-
"""
Modèle pour les événements Live Shopping.
Permet de planifier et gérer des sessions de vente en direct.
"""
import logging
from datetime import datetime
from odoo import models, fields, api

_logger = logging.getLogger(__name__)


class LiveEvent(models.Model):
    """Événement de Live Shopping"""
    _name = 'quelyos.live.event'
    _description = 'Live Shopping Event'
    _order = 'scheduled_at desc'

    name = fields.Char('Titre', required=True)
    description = fields.Text('Description')
    thumbnail = fields.Binary('Image de couverture', attachment=True)
    thumbnail_url = fields.Char('URL image externe')

    scheduled_at = fields.Datetime('Date et heure', required=True)
    duration_minutes = fields.Integer('Durée (minutes)', default=60)

    host_name = fields.Char('Présentateur', required=True)
    host_avatar = fields.Binary('Avatar présentateur', attachment=True)

    product_ids = fields.Many2many(
        'product.template',
        'live_event_product_rel',
        'event_id',
        'product_id',
        string='Produits présentés'
    )
    product_count = fields.Integer('Nombre de produits', compute='_compute_product_count', store=True)

    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('scheduled', 'Planifié'),
        ('live', 'En direct'),
        ('ended', 'Terminé'),
        ('cancelled', 'Annulé'),
    ], string='Statut', default='draft', required=True)

    is_live = fields.Boolean('En direct', compute='_compute_is_live', store=True)
    viewers_count = fields.Integer('Nombre de viewers', default=0)

    # Notifications
    notify_subscribers = fields.Boolean('Notifier les abonnés', default=True)
    reminder_hours = fields.Integer('Rappel (heures avant)', default=24)

    # Streaming
    stream_url = fields.Char('URL du stream')
    chat_enabled = fields.Boolean('Chat activé', default=True)

    active = fields.Boolean('Actif', default=True)
    sequence = fields.Integer('Séquence', default=10)

    company_id = fields.Many2one(
        'res.company',
        string='Société',
        required=True,
        default=lambda self: self.env.company
    )

    @api.depends('product_ids')
    def _compute_product_count(self):
        for event in self:
            event.product_count = len(event.product_ids)

    @api.depends('state')
    def _compute_is_live(self):
        for event in self:
            event.is_live = event.state == 'live'

    def action_schedule(self):
        """Planifier l'événement"""
        self.write({'state': 'scheduled'})

    def action_go_live(self):
        """Démarrer le live"""
        self.write({'state': 'live'})

    def action_end(self):
        """Terminer le live"""
        self.write({'state': 'ended'})

    def action_cancel(self):
        """Annuler l'événement"""
        self.write({'state': 'cancelled'})

    def action_reset_draft(self):
        """Remettre en brouillon"""
        self.write({'state': 'draft'})

    def to_dict(self):
        """Convertir en dictionnaire pour l'API"""
        self.ensure_one()

        # Générer URL thumbnail
        thumbnail_url = None
        if self.thumbnail:
            thumbnail_url = f'/web/image/quelyos.live.event/{self.id}/thumbnail'
        elif self.thumbnail_url:
            thumbnail_url = self.thumbnail_url

        # Avatar host
        host_avatar_url = None
        if self.host_avatar:
            host_avatar_url = f'/web/image/quelyos.live.event/{self.id}/host_avatar'

        return {
            'id': self.id,
            'name': self.name,
            'title': self.name,  # Alias pour compatibilité frontend
            'description': self.description or '',
            'thumbnail': thumbnail_url,
            'thumbnailUrl': thumbnail_url,
            'scheduledAt': self.scheduled_at.isoformat() if self.scheduled_at else None,
            'durationMinutes': self.duration_minutes,
            'hostName': self.host_name,
            'host': self.host_name,  # Alias
            'hostAvatar': host_avatar_url,
            'productIds': self.product_ids.ids,
            'productCount': self.product_count,
            'state': self.state,
            'isLive': self.is_live,
            'viewersCount': self.viewers_count,
            'viewers': self.viewers_count,  # Alias
            'notifySubscribers': self.notify_subscribers,
            'reminderHours': self.reminder_hours,
            'streamUrl': self.stream_url,
            'chatEnabled': self.chat_enabled,
            'active': self.active,
            'sequence': self.sequence,
        }
