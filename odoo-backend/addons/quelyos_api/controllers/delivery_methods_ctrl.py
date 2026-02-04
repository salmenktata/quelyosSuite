# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
from .base import BaseController

class DeliveryMethodsController(BaseController):

    @http.route('/api/admin/delivery-methods', type='json', auth='public', methods=['POST'], csrf=False)
    def get_delivery_methods_with_zones(self, **kwargs):
        """Récupérer toutes les méthodes de livraison avec leurs tarifs par zone"""
        tenant_id = self._authenticate_and_get_tenant()
        if not tenant_id:
            return {'success': False, 'error': 'Non authentifié'}

        Carrier = request.env['delivery.carrier'].sudo()
        ZonePrice = request.env['quelyos.delivery.zone.price'].sudo()

        carriers = Carrier.search([('active', '=', True)])

        methods = []
        for carrier in carriers:
            # Récupérer les tarifs par zone pour cette méthode
            zone_prices = ZonePrice.search([
                ('carrier_id', '=', carrier.id),
                ('tenant_id', '=', tenant_id)
            ])

            zones = [{
                'zone_code': zp.zone_code,
                'zone_label': zp.zone_label,
                'price': zp.price,
                'free_over': zp.free_over,
                'min_days': zp.min_days,
                'max_days': zp.max_days,
                'active': zp.active,
            } for zp in zone_prices]

            methods.append({
                'id': carrier.id,
                'name': carrier.name,
                'delivery_type': carrier.delivery_type,
                'fixed_price': carrier.fixed_price,
                'active': carrier.active,
                'zones': zones,
            })

        return {
            'success': True,
            'methods': methods,
        }

    @http.route('/api/admin/delivery-methods/<int:carrier_id>/zones/save', type='json', auth='public', methods=['POST'], csrf=False)
    def save_zone_prices(self, carrier_id, **kwargs):
        """Sauvegarder les tarifs par zone pour une méthode de livraison"""
        tenant_id = self._authenticate_and_get_tenant()
        if not tenant_id:
            return {'success': False, 'error': 'Non authentifié'}

        ZonePrice = request.env['quelyos.delivery.zone.price'].sudo()
        zones_data = kwargs.get('zones', [])

        # Supprimer les anciennes tarifications
        existing = ZonePrice.search([
            ('carrier_id', '=', carrier_id),
            ('tenant_id', '=', tenant_id)
        ])
        existing.unlink()

        # Créer les nouvelles
        for zone in zones_data:
            ZonePrice.create({
                'carrier_id': carrier_id,
                'tenant_id': tenant_id,
                'zone_code': zone.get('zone_code'),
                'price': float(zone.get('price', 0)),
                'free_over': float(zone.get('free_over', 0)),
                'min_days': int(zone.get('min_days', 2)),
                'max_days': int(zone.get('max_days', 5)),
                'active': zone.get('active', True),
            })

        return {'success': True, 'carrier_id': carrier_id}

    @http.route('/api/ecommerce/delivery/calculate', type='json', auth='public', methods=['POST'], csrf=False)
    def calculate_delivery_price(self, **kwargs):
        """Calculer le prix de livraison pour une zone et montant donnés (frontend e-commerce)"""
        domain = kwargs.get('domain', request.httprequest.headers.get('Origin', ''))
        tenant_id = self._get_tenant_by_domain(domain)

        if not tenant_id:
            return {'success': False, 'error': 'Tenant non trouvé'}

        carrier_id = kwargs.get('carrier_id')
        zone_code = kwargs.get('zone_code', 'grand-tunis')
        order_amount = float(kwargs.get('order_amount', 0))

        ZonePrice = request.env['quelyos.delivery.zone.price'].sudo()
        price = ZonePrice.get_price_for_zone(carrier_id, zone_code, order_amount)
        delivery_time = ZonePrice.get_delivery_time(carrier_id, zone_code)

        return {
            'success': True,
            'price': price,
            'delivery_time': delivery_time,
            'is_free': price == 0.0 and order_amount > 0,
        }

    @http.route('/api/ecommerce/delivery/available-zones', type='json', auth='public', methods=['POST'], csrf=False)
    def get_available_zones(self, **kwargs):
        """Récupérer les zones de livraison disponibles avec méthodes actives"""
        domain = kwargs.get('domain', request.httprequest.headers.get('Origin', ''))
        tenant_id = self._get_tenant_by_domain(domain)

        if not tenant_id:
            return {'success': False, 'error': 'Tenant non trouvé'}

        ZonePrice = request.env['quelyos.delivery.zone.price'].sudo()
        active_zones = ZonePrice.search([
            ('tenant_id', '=', tenant_id),
            ('active', '=', True)
        ])

        # Grouper par zone
        zones_dict = {}
        for zp in active_zones:
            if zp.zone_code not in zones_dict:
                zones_dict[zp.zone_code] = {
                    'code': zp.zone_code,
                    'label': zp.zone_label,
                    'methods': []
                }
            zones_dict[zp.zone_code]['methods'].append({
                'carrier_id': zp.carrier_id.id,
                'carrier_name': zp.carrier_id.name,
                'price': zp.price,
                'free_over': zp.free_over,
                'delivery_time': f"{zp.min_days}-{zp.max_days} jours",
            })

        return {
            'success': True,
            'zones': list(zones_dict.values()),
        }
