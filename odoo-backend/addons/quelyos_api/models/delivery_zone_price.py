# -*- coding: utf-8 -*-
from odoo import models, fields, api

class DeliveryZonePrice(models.Model):
    _name = 'quelyos.delivery.zone.price'
    _description = 'Tarification livraison par zone géographique'
    _order = 'carrier_id, zone_code'

    carrier_id = fields.Many2one('delivery.carrier', string='Méthode de livraison', required=True, ondelete='cascade')
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', required=True, ondelete='cascade', index=True)

    # Zone géographique
    zone_code = fields.Selection([
        ('grand-tunis', 'Grand Tunis'),
        ('nord', 'Nord'),
        ('centre', 'Centre'),
        ('sud', 'Sud'),
        ('international', 'International'),
    ], string='Zone', required=True)
    zone_label = fields.Char(string='Libellé zone', compute='_compute_zone_label', store=True)

    # Tarification
    price = fields.Float(string='Prix livraison', default=0.0, help='Prix fixe pour cette zone')
    free_over = fields.Float(string='Gratuit si >', default=0.0, help='Livraison gratuite si montant commande > X')

    # Délais
    min_days = fields.Integer(string='Délai min (jours)', default=2)
    max_days = fields.Integer(string='Délai max (jours)', default=5)

    # Activation
    active = fields.Boolean(string='Actif', default=True, help='Méthode disponible pour cette zone')

    _sql_constraints = [
        ('carrier_zone_unique', 'unique(carrier_id, zone_code, tenant_id)',
         'Une seule tarification par méthode et par zone !')
    ]

    @api.depends('zone_code')
    def _compute_zone_label(self):
        """Calculer le libellé de la zone"""
        zone_labels = {
            'grand-tunis': 'Grand Tunis',
            'nord': 'Nord',
            'centre': 'Centre',
            'sud': 'Sud',
            'international': 'International',
        }
        for record in self:
            record.zone_label = zone_labels.get(record.zone_code, record.zone_code)

    @api.model
    def get_price_for_zone(self, carrier_id, zone_code, order_amount=0):
        """Calculer le prix de livraison pour une zone et montant donnés"""
        pricing = self.search([
            ('carrier_id', '=', carrier_id),
            ('zone_code', '=', zone_code),
            ('active', '=', True)
        ], limit=1)

        if not pricing:
            # Fallback sur le prix fixe du carrier
            carrier = self.env['delivery.carrier'].browse(carrier_id)
            return carrier.fixed_price if carrier else 0.0

        # Si seuil livraison gratuite atteint
        if pricing.free_over > 0 and order_amount >= pricing.free_over:
            return 0.0

        return pricing.price

    @api.model
    def get_delivery_time(self, carrier_id, zone_code):
        """Obtenir le délai de livraison pour une zone"""
        pricing = self.search([
            ('carrier_id', '=', carrier_id),
            ('zone_code', '=', zone_code),
            ('active', '=', True)
        ], limit=1)

        if pricing:
            return f"{pricing.min_days}-{pricing.max_days} jours"
        return "2-5 jours"  # Fallback
