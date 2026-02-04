# -*- coding: utf-8 -*-
"""
API Customer Segmentation RFM
Endpoints pour récupérer les clients avec scoring RFM et export CSV
"""
from odoo import http
from odoo.http import request
from .base import BaseController


class CustomerRFMController(BaseController):

    @http.route('/api/admin/customers/rfm', type='json', auth='public', methods=['POST'], csrf=False)
    def get_customers_rfm(self, **kwargs):
        """
        Récupérer la liste des clients avec leur scoring RFM.

        Params:
            segment: Filtrer par segment ('vip', 'regular', 'occasional', 'at_risk', 'inactive')
            min_spent: Montant minimum dépensé
            min_orders: Nombre minimum de commandes
            limit: Nombre de résultats (défaut: 100)
            offset: Pagination offset

        Returns:
            {
                'success': bool,
                'customers': [{
                    'id': int,
                    'name': str,
                    'email': str,
                    'rfm_segment': str,
                    'rfm_recency_score': int,
                    'rfm_frequency_score': int,
                    'rfm_monetary_score': int,
                    'total_orders': int,
                    'total_spent': float,
                    'average_order_value': float,
                    'days_since_last_order': int,
                    'last_order_date': str
                }],
                'total': int,
                'stats': {
                    'vip': int,
                    'regular': int,
                    'occasional': int,
                    'at_risk': int,
                    'inactive': int
                }
            }
        """
        # Authentifier l'utilisateur backoffice
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error

        # Récupérer le tenant depuis le header
        tenant = self._get_tenant()
        if not tenant:
            return {'success': False, 'error': 'Tenant invalide ou manquant'}

        Partner = request.env['res.partner'].sudo()

        # Construire domain de base (clients avec commandes uniquement)
        domain = [
            ('company_id', '=', tenant.company_id.id),
            ('customer_rank', '>', 0),  # Clients seulement
        ]

        # Filtres optionnels
        segment = kwargs.get('segment')
        if segment:
            domain.append(('x_rfm_segment', '=', segment))

        min_spent = kwargs.get('min_spent')
        if min_spent:
            domain.append(('x_total_spent', '>=', float(min_spent)))

        min_orders = kwargs.get('min_orders')
        if min_orders:
            domain.append(('x_total_orders', '>=', int(min_orders)))

        # Pagination
        limit = kwargs.get('limit', 100)
        offset = kwargs.get('offset', 0)

        # Recherche
        customers = Partner.search(domain, limit=limit, offset=offset, order='x_total_spent DESC')
        total = Partner.search_count(domain)

        # Statistiques par segment (tous clients du tenant)
        all_customers = Partner.search([
            ('company_id', '=', tenant.company_id.id),
            ('customer_rank', '>', 0),
        ])
        stats = {
            'vip': len(all_customers.filtered(lambda c: c.x_rfm_segment == 'vip')),
            'regular': len(all_customers.filtered(lambda c: c.x_rfm_segment == 'regular')),
            'occasional': len(all_customers.filtered(lambda c: c.x_rfm_segment == 'occasional')),
            'at_risk': len(all_customers.filtered(lambda c: c.x_rfm_segment == 'at_risk')),
            'inactive': len(all_customers.filtered(lambda c: c.x_rfm_segment == 'inactive')),
        }

        return {
            'success': True,
            'customers': [{
                'id': c.id,
                'name': c.name,
                'email': c.email or '',
                'phone': c.phone or '',
                'rfm_segment': c.x_rfm_segment or 'inactive',
                'rfm_recency_score': c.x_rfm_recency_score,
                'rfm_frequency_score': c.x_rfm_frequency_score,
                'rfm_monetary_score': c.x_rfm_monetary_score,
                'total_orders': c.x_total_orders,
                'total_spent': c.x_total_spent,
                'average_order_value': c.x_average_order_value,
                'days_since_last_order': c.x_days_since_last_order,
                'last_order_date': c.x_last_order_date.isoformat() if c.x_last_order_date else None,
            } for c in customers],
            'total': total,
            'stats': stats,
        }

    @http.route('/api/admin/customers/rfm/export', type='json', auth='public', methods=['POST'], csrf=False)
    def export_customers_rfm(self, **kwargs):
        """
        Exporter les clients RFM en CSV.

        Params:
            segment: Filtrer par segment (optionnel)

        Returns:
            {
                'success': bool,
                'csv_data': str (base64),
                'filename': str
            }
        """
        # Authentifier l'utilisateur backoffice
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error

        # Récupérer le tenant depuis le header
        tenant = self._get_tenant()
        if not tenant:
            return {'success': False, 'error': 'Tenant invalide ou manquant'}

        import csv
        import base64
        from io import StringIO

        Partner = request.env['res.partner'].sudo()

        # Domain
        domain = [
            ('company_id', '=', tenant.company_id.id),
            ('customer_rank', '>', 0),
        ]

        segment = kwargs.get('segment')
        if segment:
            domain.append(('x_rfm_segment', '=', segment))

        customers = Partner.search(domain, order='x_total_spent DESC')

        # Créer CSV
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow([
            'Nom', 'Email', 'Téléphone', 'Segment RFM',
            'Score Récence', 'Score Fréquence', 'Score Montant',
            'Nombre Commandes', 'Montant Total', 'Panier Moyen',
            'Jours depuis Dernière Commande', 'Dernière Commande'
        ])

        for c in customers:
            writer.writerow([
                c.name,
                c.email or '',
                c.phone or '',
                dict(c._fields['x_rfm_segment'].selection).get(c.x_rfm_segment, ''),
                c.x_rfm_recency_score,
                c.x_rfm_frequency_score,
                c.x_rfm_monetary_score,
                c.x_total_orders,
                f"{c.x_total_spent:.2f}",
                f"{c.x_average_order_value:.2f}",
                c.x_days_since_last_order,
                c.x_last_order_date.strftime('%Y-%m-%d %H:%M') if c.x_last_order_date else ''
            ])

        csv_content = output.getvalue()
        csv_base64 = base64.b64encode(csv_content.encode('utf-8')).decode('utf-8')

        filename = f'customers_rfm_{segment or "all"}_{tenant.id}.csv'

        return {
            'success': True,
            'csv_data': csv_base64,
            'filename': filename
        }

    @http.route('/api/admin/customers/rfm/recompute', type='json', auth='public', methods=['POST'], csrf=False)
    def recompute_rfm_scores(self, **kwargs):
        """
        Recalculer les scores RFM pour tous les clients du tenant.
        Utile après import de données ou pour forcer un refresh.

        Returns:
            {
                'success': bool,
                'message': str,
                'updated': int
            }
        """
        # Authentifier l'utilisateur backoffice
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error

        # Récupérer le tenant depuis le header
        tenant = self._get_tenant()
        if not tenant:
            return {'success': False, 'error': 'Tenant invalide ou manquant'}

        Partner = request.env['res.partner'].sudo()

        # Récupérer tous les clients du tenant
        customers = Partner.search([
            ('company_id', '=', tenant.company_id.id),
            ('customer_rank', '>', 0),
        ])

        # Forcer recalcul
        customers.action_recompute_rfm()

        return {
            'success': True,
            'message': f'Scores RFM recalculés pour {len(customers)} clients',
            'updated': len(customers)
        }
