# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
from datetime import timedelta

class PromoBanner(models.Model):
    _name = 'quelyos.promo.banner'
    _description = 'Bannières Promotionnelles Homepage'
    _order = 'sequence, id'

    # Identification
    name = fields.Char('Nom interne', required=True)
    sequence = fields.Integer('Ordre affichage', default=10)
    active = fields.Boolean('Actif', default=True)

    # Contenu
    title = fields.Char('Titre', required=True, size=100, translate=True)
    description = fields.Char('Description', size=150, translate=True)
    tag = fields.Char('Tag (badge)', size=30, translate=True)

    # Style
    gradient = fields.Selection([
        ('blue', 'Bleu'),
        ('purple', 'Violet'),
        ('orange', 'Orange'),
        ('green', 'Vert'),
        ('red', 'Rouge'),
    ], string='Gradient', default='blue', required=True)

    tag_color = fields.Selection([
        ('blue', 'Bleu'),
        ('secondary', 'Secondaire'),
        ('orange', 'Orange'),
        ('red', 'Rouge'),
    ], string='Couleur Tag', default='blue')

    button_bg = fields.Selection([
        ('white', 'Blanc'),
        ('black', 'Noir'),
        ('primary', 'Primaire'),
    ], string='Fond Bouton', default='white')

    # Image
    image = fields.Binary('Image', attachment=True)
    image_url = fields.Char('URL Image', compute='_compute_image_url', store=False)

    # CTA
    cta_text = fields.Char('Texte Bouton', required=True, size=50, translate=True)
    cta_link = fields.Char('Lien Bouton', required=True, size=255)

    # Planification
    start_date = fields.Date('Date début', default=fields.Date.today)
    end_date = fields.Date('Date fin', default=lambda self: fields.Date.today() + timedelta(days=365))

    @api.depends('image')
    def _compute_image_url(self):
        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
        for banner in self:
            if banner.image:
                banner.image_url = f'{base_url}/web/image/quelyos.promo.banner/{banner.id}/image'
            else:
                banner.image_url = False

    @api.constrains('start_date', 'end_date')
    def _check_dates(self):
        for banner in self:
            if banner.end_date and banner.start_date and banner.end_date < banner.start_date:
                raise ValidationError(_('La date de fin doit être après la date de début.'))
