# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
from datetime import timedelta

class HeroSlide(models.Model):
    _name = 'quelyos.hero.slide'
    _description = 'Hero Slider Homepage'
    _order = 'sequence, id'

    # Identification
    name = fields.Char('Nom interne', required=True, help='Usage interne uniquement')
    sequence = fields.Integer('Ordre affichage', default=10, help='Ordre croissant')
    active = fields.Boolean('Actif', default=True)

    # Contenu
    title = fields.Char('Titre principal', required=True, size=100, translate=True)
    subtitle = fields.Char('Sous-titre', size=100, translate=True)
    description = fields.Text('Description', size=250, translate=True)

    # Image
    image = fields.Binary('Image (1200x600px)', attachment=True)
    image_external_url = fields.Char('URL Image Externe', size=500, help='URL Unsplash/Pexels ou autre')
    image_url = fields.Char('URL Image', compute='_compute_image_url', store=False)

    # CTA Principal
    cta_text = fields.Char('Texte CTA Principal', required=True, size=50, translate=True)
    cta_link = fields.Char('Lien CTA Principal', required=True, size=255)

    # CTA Secondaire (optionnel)
    cta_secondary_text = fields.Char('Texte CTA Secondaire', size=50, translate=True)
    cta_secondary_link = fields.Char('Lien CTA Secondaire', size=255)

    # Planification
    start_date = fields.Date('Date début', default=fields.Date.today)
    end_date = fields.Date('Date fin', default=lambda self: fields.Date.today() + timedelta(days=365))

    @api.depends('image', 'image_external_url')
    def _compute_image_url(self):
        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
        for slide in self:
            # Priorité : URL externe > Image uploadée
            if slide.image_external_url:
                slide.image_url = slide.image_external_url
            elif slide.image:
                slide.image_url = f'{base_url}/web/image/quelyos.hero.slide/{slide.id}/image'
            else:
                slide.image_url = False

    @api.constrains('start_date', 'end_date')
    def _check_dates(self):
        for slide in self:
            if slide.end_date and slide.start_date and slide.end_date < slide.start_date:
                raise ValidationError(_('La date de fin doit être après la date de début.'))
