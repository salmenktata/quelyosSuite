# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
from datetime import timedelta

class PromoMessage(models.Model):
    _name = 'quelyos.promo.message'
    _description = 'Messages PromoBar'
    _order = 'sequence, id'

    # Identification
    name = fields.Char('Nom interne', required=True)
    sequence = fields.Integer('Ordre affichage', default=10)
    active = fields.Boolean('Actif', default=True)

    # Contenu
    text = fields.Char('Texte', required=True, size=150, translate=True)

    icon = fields.Selection([
        ('truck', 'Camion (livraison)'),
        ('gift', 'Cadeau'),
        ('star', 'Étoile'),
        ('clock', 'Horloge'),
    ], string='Icône', default='truck', required=True)

    # Planification
    start_date = fields.Date('Date début', default=fields.Date.today)
    end_date = fields.Date('Date fin', default=lambda self: fields.Date.today() + timedelta(days=365))

    @api.constrains('start_date', 'end_date')
    def _check_dates(self):
        for message in self:
            if message.end_date and message.start_date and message.end_date < message.start_date:
                raise ValidationError(_('La date de fin doit être après la date de début.'))
