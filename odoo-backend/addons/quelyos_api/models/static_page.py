# -*- coding: utf-8 -*-
from odoo import models, fields, api

class StaticPage(models.Model):
    _name = 'quelyos.static.page'
    _description = 'Pages statiques CMS'
    _order = 'sequence, id'

    name = fields.Char(string='Titre', required=True)
    slug = fields.Char(string='Slug URL', required=True, index=True)
    content_html = fields.Html(string='Contenu HTML')
    meta_title = fields.Char(string='Meta Title SEO')
    meta_description = fields.Text(string='Meta Description SEO')
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('published', 'Publié')
    ], string='État', default='draft', required=True)
    sequence = fields.Integer(string='Séquence', default=10)
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', required=True, ondelete='cascade')
    active = fields.Boolean(string='Actif', default=True)

    _sql_constraints = [
        ('slug_tenant_unique', 'unique(slug, tenant_id)', 'Le slug doit être unique par tenant !')
    ]

    @api.model
    def create(self, vals):
        if 'slug' in vals and vals['slug']:
            vals['slug'] = vals['slug'].lower().replace(' ', '-')
        return super().create(vals)

    def write(self, vals):
        if 'slug' in vals and vals['slug']:
            vals['slug'] = vals['slug'].lower().replace(' ', '-')
        return super().write(vals)
