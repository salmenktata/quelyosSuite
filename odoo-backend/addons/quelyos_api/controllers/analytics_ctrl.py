# -*- coding: utf-8 -*-
import logging
import math
from datetime import datetime, timedelta
from odoo import http, fields
from odoo.http import request
from ..config import is_origin_allowed, get_cors_headers
from ..lib.cache import get_cache_service, CacheTTL
from ..lib.rate_limiter import check_rate_limit, RateLimitConfig
from ..lib.validation import sanitize_string, sanitize_dict, validate_no_injection
from .base import BaseController

_logger = logging.getLogger(__name__)


class QuelyosAnalyticsAPI(BaseController):
    """API contrôleur pour les statistiques e-commerce"""

    @http.route('/api/ecommerce/analytics/stats', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_analytics_stats(self, **kwargs):
        """Statistiques globales (admin uniquement)"""
        try:
            # Total produits
            total_products = request.env['product.product'].sudo().search_count([])

            # Total clients
            total_customers = request.env['res.partner'].sudo().search_count([
                ('customer_rank', '>', 0)
            ])

            # Commandes
            total_orders = request.env['sale.order'].sudo().search_count([])
            confirmed_orders = request.env['sale.order'].sudo().search_count([
                ('state', 'in', ['sale', 'done'])
            ])

            # Chiffre d'affaires total
            confirmed_orders_obj = request.env['sale.order'].sudo().search([
                ('state', 'in', ['sale', 'done'])
            ])
            total_revenue = sum(confirmed_orders_obj.mapped('amount_total'))

            # Commandes en attente
            pending_orders = request.env['sale.order'].sudo().search_count([
                ('state', '=', 'draft')
            ])

            # Produits en rupture de stock (filtrage côté Python car qty_available est calculé)
            # Limite à 50000 produits actifs pour éviter surcharge mémoire sur très gros catalogues
            all_products = request.env['product.product'].sudo().search(
                [('active', '=', True)],
                limit=50000
            )
            out_of_stock_products = len([p for p in all_products if p.qty_available <= 0])

            # Dernières commandes (5 dernières)
            recent_orders = request.env['sale.order'].sudo().search(
                [],
                limit=5,
                order='date_order desc'
            )

            recent_orders_data = [{
                'id': o.id,
                'name': o.name,
                'date_order': o.date_order.isoformat() if o.date_order else None,
                'state': o.state,
                'amount_total': o.amount_total,
                'customer': {
                    'id': o.partner_id.id,
                    'name': o.partner_id.name,
                } if o.partner_id else None,
            } for o in recent_orders]

            # Top 5 produits les plus vendus
            order_lines = request.env['sale.order.line'].sudo().search([
                ('order_id.state', 'in', ['sale', 'done'])
            ])

            # Compter les ventes par produit
            product_sales = {}
            for line in order_lines:
                product_id = line.product_id.id
                if product_id not in product_sales:
                    product_sales[product_id] = {
                        'id': product_id,
                        'name': line.product_id.name,
                        'qty_sold': 0,
                        'revenue': 0,
                    }
                product_sales[product_id]['qty_sold'] += line.product_uom_qty
                product_sales[product_id]['revenue'] += line.price_total

            # Trier et prendre les 5 meilleurs
            top_products = sorted(
                product_sales.values(),
                key=lambda x: x['qty_sold'],
                reverse=True
            )[:5]

            # Alertes de stock (produits en rupture ou stock faible)
            # Filtrage côté Python car qty_available est un champ calculé
            sale_products = request.env['product.template'].sudo().search([('sale_ok', '=', True)])
            low_stock_products = [p for p in sale_products if p.qty_available <= 5]
            # Trier par stock croissant et limiter à 10
            low_stock_products.sort(key=lambda p: p.qty_available)
            stock_alert_products = low_stock_products[:10]

            stock_alerts = []
            for p in stock_alert_products:
                qty = p.qty_available
                if qty <= 0:
                    alert_level = 'critical'
                    alert_message = 'Rupture de stock'
                else:
                    alert_level = 'warning'
                    alert_message = f'Stock faible ({int(qty)} restants)'

                stock_alerts.append({
                    'id': p.id,
                    'name': p.name,
                    'default_code': p.default_code or '',
                    'qty_available': qty,
                    'alert_level': alert_level,
                    'alert_message': alert_message,
                    'image': f'/web/image/product.template/{p.id}/image_128' if p.image_128 else None,
                })

            # Compter les alertes par niveau (filtrage côté Python)
            low_stock_count = len([p for p in sale_products if 0 < p.qty_available <= 5])

            return {
                'success': True,
                'data': {
                    'totals': {
                        'products': total_products,
                        'customers': total_customers,
                        'orders': total_orders,
                        'confirmed_orders': confirmed_orders,
                        'pending_orders': pending_orders,
                        'out_of_stock_products': out_of_stock_products,
                        'low_stock_products': low_stock_count,
                        'revenue': total_revenue,
                    },
                    'recent_orders': recent_orders_data,
                    'top_products': top_products,
                    'stock_alerts': stock_alerts,
                }
            }

        except Exception as e:
            _logger.error(f"Get analytics stats error: {e}")
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/analytics/revenue-chart', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_revenue_chart(self, **kwargs):
        """Graphique évolution du chiffre d'affaires par période"""
        try:
            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            params = self._get_params()
            period = params.get('period', '30d')  # 7d, 30d, 12m, custom

            from datetime import datetime, timedelta
            from dateutil.relativedelta import relativedelta

            today = datetime.now().date()

            if period == '7d':
                start_date = today - timedelta(days=7)
                group_by = 'day'
            elif period == '30d':
                start_date = today - timedelta(days=30)
                group_by = 'day'
            elif period == '12m':
                start_date = today - relativedelta(months=12)
                group_by = 'month'
            elif period == 'custom':
                start_date = datetime.strptime(params.get('start_date'), '%Y-%m-%d').date()
                end_date = datetime.strptime(params.get('end_date', today.isoformat()), '%Y-%m-%d').date()
                group_by = params.get('group_by', 'day')
            else:
                start_date = today - timedelta(days=30)
                group_by = 'day'

            # Récupérer les commandes confirmées sur la période
            orders = request.env['sale.order'].sudo().search([
                ('state', 'in', ['sale', 'done']),
                ('date_order', '>=', start_date.isoformat()),
            ])

            # Grouper par période
            chart_data = {}
            for order in orders:
                if not order.date_order:
                    continue

                date = order.date_order.date()
                if group_by == 'day':
                    key = date.isoformat()
                elif group_by == 'month':
                    key = date.strftime('%Y-%m')
                else:
                    key = date.isoformat()

                if key not in chart_data:
                    chart_data[key] = {'revenue': 0, 'orders': 0}

                chart_data[key]['revenue'] += order.amount_total
                chart_data[key]['orders'] += 1

            # Convertir en liste triée
            data = [
                {
                    'period': key,
                    'revenue': round(values['revenue'], 2),
                    'orders': values['orders']
                }
                for key, values in sorted(chart_data.items())
            ]

            return {
                'success': True,
                'data': data,
                'period': period,
                'group_by': group_by
            }

        except Exception as e:
            _logger.error(f"Get revenue chart error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/analytics/orders-chart', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_orders_chart(self, **kwargs):
        """Graphique évolution du nombre de commandes par période et par état"""
        try:
            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            params = self._get_params()
            period = params.get('period', '30d')

            from datetime import datetime, timedelta
            from dateutil.relativedelta import relativedelta

            today = datetime.now().date()

            if period == '7d':
                start_date = today - timedelta(days=7)
                group_by = 'day'
            elif period == '30d':
                start_date = today - timedelta(days=30)
                group_by = 'day'
            elif period == '12m':
                start_date = today - relativedelta(months=12)
                group_by = 'month'
            else:
                start_date = today - timedelta(days=30)
                group_by = 'day'

            # Récupérer toutes les commandes sur la période
            orders = request.env['sale.order'].sudo().search([
                ('date_order', '>=', start_date.isoformat()),
            ])

            # Grouper par période et par état
            chart_data = {}
            for order in orders:
                if not order.date_order:
                    continue

                date = order.date_order.date()
                if group_by == 'day':
                    key = date.isoformat()
                elif group_by == 'month':
                    key = date.strftime('%Y-%m')
                else:
                    key = date.isoformat()

                if key not in chart_data:
                    chart_data[key] = {
                        'total': 0,
                        'draft': 0,
                        'sent': 0,
                        'sale': 0,
                        'done': 0,
                        'cancel': 0
                    }

                chart_data[key]['total'] += 1
                if order.state in chart_data[key]:
                    chart_data[key][order.state] += 1

            # Convertir en liste triée
            data = [
                {
                    'period': key,
                    'total': values['total'],
                    'confirmed': values['sale'] + values['done'],
                    'pending': values['draft'] + values['sent'],
                    'cancelled': values['cancel']
                }
                for key, values in sorted(chart_data.items())
            ]

            return {
                'success': True,
                'data': data,
                'period': period,
                'group_by': group_by
            }

        except Exception as e:
            _logger.error(f"Get orders chart error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/analytics/conversion-funnel', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_conversion_funnel(self, **kwargs):
        """Funnel de conversion : visiteurs → panier → commande → paiement"""
        try:
            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            params = self._get_params()
            period = params.get('period', '30d')

            from datetime import datetime, timedelta
            today = datetime.now().date()

            if period == '7d':
                start_date = today - timedelta(days=7)
            elif period == '30d':
                start_date = today - timedelta(days=30)
            elif period == '12m':
                start_date = today - timedelta(days=365)
            else:
                start_date = today - timedelta(days=30)

            # Total commandes créées (paniers)
            total_carts = request.env['sale.order'].sudo().search_count([
                ('date_order', '>=', start_date.isoformat()),
            ])

            # Commandes avec au moins 1 ligne (panier rempli)
            carts_with_items = request.env['sale.order'].sudo().search_count([
                ('date_order', '>=', start_date.isoformat()),
                ('order_line', '!=', False),
            ])

            # Commandes confirmées
            confirmed_orders = request.env['sale.order'].sudo().search_count([
                ('date_order', '>=', start_date.isoformat()),
                ('state', 'in', ['sale', 'done']),
            ])

            # Commandes payées (factures payées)
            paid_orders = request.env['sale.order'].sudo().search([
                ('date_order', '>=', start_date.isoformat()),
                ('state', 'in', ['sale', 'done']),
            ])

            paid_count = 0
            for order in paid_orders:
                # Vérifier si la facture existe et est payée
                invoices = request.env['account.move'].sudo().search([
                    ('invoice_origin', '=', order.name),
                    ('payment_state', '=', 'paid'),
                ])
                if invoices:
                    paid_count += 1

            # Calculer les taux de conversion
            funnel_data = [
                {
                    'stage': 'Paniers créés',
                    'count': total_carts,
                    'percentage': 100.0,
                    'color': '#6366f1'
                },
                {
                    'stage': 'Paniers remplis',
                    'count': carts_with_items,
                    'percentage': round((carts_with_items / total_carts * 100) if total_carts > 0 else 0, 1),
                    'color': '#8b5cf6'
                },
                {
                    'stage': 'Commandes confirmées',
                    'count': confirmed_orders,
                    'percentage': round((confirmed_orders / total_carts * 100) if total_carts > 0 else 0, 1),
                    'color': '#10b981'
                },
                {
                    'stage': 'Commandes payées',
                    'count': paid_count,
                    'percentage': round((paid_count / total_carts * 100) if total_carts > 0 else 0, 1),
                    'color': '#059669'
                }
            ]

            return {
                'success': True,
                'data': funnel_data,
                'period': period
            }

        except Exception as e:
            _logger.error(f"Get conversion funnel error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/analytics/top-categories', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_top_categories(self, **kwargs):
        """Top catégories les plus vendues avec graphique"""
        try:
            if not request.env.user.has_group('base.group_system'):
                return {'success': False, 'error': 'Insufficient permissions'}

            params = self._get_params()
            limit = int(params.get('limit', 10))

            # Récupérer toutes les lignes de commandes confirmées
            order_lines = request.env['sale.order.line'].sudo().search([
                ('order_id.state', 'in', ['sale', 'done'])
            ])

            # Compter les ventes par catégorie
            category_sales = {}
            for line in order_lines:
                if not line.product_id or not line.product_id.categ_id:
                    continue

                category = line.product_id.categ_id
                category_id = category.id

                if category_id not in category_sales:
                    category_sales[category_id] = {
                        'id': category_id,
                        'name': category.complete_name or category.name,
                        'qty_sold': 0,
                        'revenue': 0,
                    }

                category_sales[category_id]['qty_sold'] += line.product_uom_qty
                category_sales[category_id]['revenue'] += line.price_total

            # Trier et prendre les top N
            top_categories = sorted(
                category_sales.values(),
                key=lambda x: x['revenue'],
                reverse=True
            )[:limit]

            # Arrondir les revenues
            for cat in top_categories:
                cat['revenue'] = round(cat['revenue'], 2)
                cat['qty_sold'] = int(cat['qty_sold'])

            return {
                'success': True,
                'data': top_categories
            }

        except Exception as e:
            _logger.error(f"Get top categories error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}
