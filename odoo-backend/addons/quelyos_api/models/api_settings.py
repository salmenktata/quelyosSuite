# -*- coding: utf-8 -*-
from odoo import models, fields, api

class ApiSettings(models.Model):
    _name = 'quelyos.api.settings'
    _description = 'API Settings for External Services'

    name = fields.Char(string='Setting Name', required=True, index=True)
    value = fields.Char(string='Value')
    description = fields.Text(string='Description')
    category = fields.Selection([
        ('images', 'Image Search APIs'),
        ('payment', 'Payment APIs'),
        ('shipping', 'Shipping APIs'),
        ('other', 'Other')
    ], string='Category', default='other')
    is_active = fields.Boolean(string='Active', default=True)

    _sql_constraints = [
        ('name_unique', 'UNIQUE(name)', 'Setting name must be unique')
    ]

    @api.model
    def get_setting(self, name, default=None):
        """Get a setting value by name"""
        setting = self.search([('name', '=', name), ('is_active', '=', True)], limit=1)
        return setting.value if setting else default

    @api.model
    def set_setting(self, name, value, description=None, category='other'):
        """Set or update a setting"""
        setting = self.search([('name', '=', name)], limit=1)
        if setting:
            setting.write({'value': value, 'is_active': True})
        else:
            self.create({
                'name': name,
                'value': value,
                'description': description,
                'category': category,
                'is_active': True
            })
        return True

    @api.model
    def get_image_api_settings(self):
        """Get all image API settings"""
        settings = self.search([('category', '=', 'images')])
        return {
            setting.name: {
                'value': setting.value or '',
                'description': setting.description or '',
                'is_active': setting.is_active
            }
            for setting in settings
        }
