# -*- coding: utf-8 -*-
"""
Analytics Controller for E-commerce
Provides dashboard metrics and reports
"""

import logging
from datetime import datetime, timedelta
from odoo import http
from odoo.http import request
from .base_controller import BaseEcommerceController

_logger = logging.getLogger(__name__)


class AnalyticsController(BaseEcommerceController):
    """Controller for analytics and reporting"""

    @http.route('/api/ecommerce/analytics/dashboard', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def dashboard(self, period='week'):
        """
        Get dashboard analytics

        Args:
            period: Time period (today, week, month, year, all)

        Returns:
            dict: Analytics data with KPIs
        """
        try:
            # Authenticate user (requires logged in user)
            user = self._authenticate_user()
            if not user:
                return self._error_response("Authentication required", 401)

            # Get date range based on period
            date_from, date_to = self._get_date_range(period)

            # Get KPIs
            revenue = self._get_revenue(date_from, date_to)
            orders_stats = self._get_orders_stats(date_from, date_to)
            top_products = self._get_top_products(date_from, date_to, limit=10)
            top_categories = self._get_top_categories(date_from, date_to, limit=5)
            conversion_metrics = self._get_conversion_metrics(date_from, date_to)

            return self._success_response({
                'period': period,
                'date_from': date_from.strftime('%Y-%m-%d') if date_from else None,
                'date_to': date_to.strftime('%Y-%m-%d'),
                'revenue': revenue,
                'orders': orders_stats,
                'top_products': top_products,
                'top_categories': top_categories,
                'conversion': conversion_metrics,
            })

        except Exception as e:
            _logger.error(f"Error getting dashboard analytics: {str(e)}")
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/analytics/revenue-chart', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def revenue_chart(self, period='month', granularity='day'):
        """
        Get revenue chart data

        Args:
            period: Time period (week, month, year)
            granularity: Data granularity (day, week, month)

        Returns:
            dict: Chart data with labels and values
        """
        try:
            user = self._authenticate_user()
            if not user:
                return self._error_response("Authentication required", 401)

            date_from, date_to = self._get_date_range(period)

            # Get revenue data grouped by granularity
            SaleOrder = request.env['sale.order'].sudo()

            domain = [
                ('state', 'in', ['sale', 'done']),
                ('date_order', '>=', date_from),
                ('date_order', '<=', date_to),
            ]

            # Group by date
            if granularity == 'day':
                date_field = 'date_order:day'
            elif granularity == 'week':
                date_field = 'date_order:week'
            else:  # month
                date_field = 'date_order:month'

            data = SaleOrder.read_group(
                domain,
                ['amount_total'],
                [date_field],
                orderby=date_field
            )

            # Format data for chart
            labels = []
            values = []

            for item in data:
                label = item.get(date_field, '')
                if isinstance(label, tuple):
                    label = label[0] if label else ''

                labels.append(label)
                values.append(item.get('amount_total', 0))

            return self._success_response({
                'labels': labels,
                'values': values,
                'period': period,
                'granularity': granularity,
            })

        except Exception as e:
            _logger.error(f"Error getting revenue chart: {str(e)}")
            return self._error_response(str(e), 500)

    def _get_date_range(self, period):
        """
        Calculate date range based on period

        Args:
            period: today, week, month, year, all

        Returns:
            tuple: (date_from, date_to)
        """
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        date_to = datetime.now()

        if period == 'today':
            date_from = today
        elif period == 'week':
            date_from = today - timedelta(days=7)
        elif period == 'month':
            date_from = today - timedelta(days=30)
        elif period == 'year':
            date_from = today - timedelta(days=365)
        else:  # all
            date_from = None

        return date_from, date_to

    def _get_revenue(self, date_from, date_to):
        """
        Get revenue metrics

        Args:
            date_from: Start date
            date_to: End date

        Returns:
            dict: Revenue data
        """
        SaleOrder = request.env['sale.order'].sudo()

        domain = [
            ('state', 'in', ['sale', 'done']),
            ('date_order', '<=', date_to),
        ]

        if date_from:
            domain.append(('date_order', '>=', date_from))

        # Get total revenue
        orders = SaleOrder.search(domain)
        total_revenue = sum(orders.mapped('amount_total'))

        # Get previous period revenue for comparison
        if date_from:
            period_length = (date_to - date_from).days
            prev_date_from = date_from - timedelta(days=period_length)
            prev_date_to = date_from

            prev_domain = [
                ('state', 'in', ['sale', 'done']),
                ('date_order', '>=', prev_date_from),
                ('date_order', '<', prev_date_to),
            ]

            prev_orders = SaleOrder.search(prev_domain)
            prev_revenue = sum(prev_orders.mapped('amount_total'))

            # Calculate growth
            if prev_revenue > 0:
                growth = ((total_revenue - prev_revenue) / prev_revenue) * 100
            else:
                growth = 100 if total_revenue > 0 else 0
        else:
            growth = None

        return {
            'total': total_revenue,
            'growth_percentage': growth,
            'currency': 'EUR',  # TODO: Get from company
        }

    def _get_orders_stats(self, date_from, date_to):
        """
        Get orders statistics

        Args:
            date_from: Start date
            date_to: End date

        Returns:
            dict: Orders stats
        """
        SaleOrder = request.env['sale.order'].sudo()

        domain = [
            ('state', 'in', ['sale', 'done']),
            ('date_order', '<=', date_to),
        ]

        if date_from:
            domain.append(('date_order', '>=', date_from))

        # Get orders
        orders = SaleOrder.search(domain)

        # Calculate stats
        total_orders = len(orders)
        total_revenue = sum(orders.mapped('amount_total'))
        avg_order_value = total_revenue / total_orders if total_orders > 0 else 0

        # Get order states breakdown
        states = {}
        for state in ['sale', 'done']:
            count = len(orders.filtered(lambda o: o.state == state))
            states[state] = count

        return {
            'total_count': total_orders,
            'average_value': avg_order_value,
            'states': states,
        }

    def _get_top_products(self, date_from, date_to, limit=10):
        """
        Get top selling products

        Args:
            date_from: Start date
            date_to: End date
            limit: Max products

        Returns:
            list: Top products
        """
        SaleOrderLine = request.env['sale.order.line'].sudo()

        domain = [
            ('order_id.state', 'in', ['sale', 'done']),
            ('order_id.date_order', '<=', date_to),
        ]

        if date_from:
            domain.append(('order_id.date_order', '>=', date_from))

        # Group by product
        data = SaleOrderLine.read_group(
            domain,
            ['product_id', 'product_uom_qty', 'price_subtotal'],
            ['product_id'],
            orderby='product_uom_qty desc',
            limit=limit
        )

        results = []
        for item in data:
            product_id = item.get('product_id')
            if not product_id or not isinstance(product_id, tuple):
                continue

            product_id_int = product_id[0]
            product = request.env['product.product'].sudo().browse(product_id_int)
            product_template = product.product_tmpl_id

            results.append({
                'id': product_template.id,
                'name': product.name,
                'slug': product_template.slug,
                'quantity_sold': int(item.get('product_uom_qty', 0)),
                'revenue': item.get('price_subtotal', 0),
                'image': f'/web/image/product.product/{product_id_int}/image_128',
            })

        return results

    def _get_top_categories(self, date_from, date_to, limit=5):
        """
        Get top selling categories

        Args:
            date_from: Start date
            date_to: End date
            limit: Max categories

        Returns:
            list: Top categories
        """
        SaleOrderLine = request.env['sale.order.line'].sudo()

        domain = [
            ('order_id.state', 'in', ['sale', 'done']),
            ('order_id.date_order', '<=', date_to),
        ]

        if date_from:
            domain.append(('order_id.date_order', '>=', date_from))

        # Get all order lines
        lines = SaleOrderLine.search(domain)

        # Group by category
        category_stats = {}
        for line in lines:
            category = line.product_id.product_tmpl_id.categ_id
            if category:
                if category.id not in category_stats:
                    category_stats[category.id] = {
                        'id': category.id,
                        'name': category.name,
                        'quantity': 0,
                        'revenue': 0,
                    }
                category_stats[category.id]['quantity'] += line.product_uom_qty
                category_stats[category.id]['revenue'] += line.price_subtotal

        # Sort by revenue and limit
        sorted_categories = sorted(
            category_stats.values(),
            key=lambda x: x['revenue'],
            reverse=True
        )[:limit]

        return sorted_categories

    def _get_conversion_metrics(self, date_from, date_to):
        """
        Get conversion metrics

        Args:
            date_from: Start date
            date_to: End date

        Returns:
            dict: Conversion metrics
        """
        SaleOrder = request.env['sale.order'].sudo()

        # Get all carts (draft orders)
        cart_domain = [
            ('state', '=', 'draft'),
            ('cart_last_update', '<=', date_to),
        ]

        if date_from:
            cart_domain.append(('cart_last_update', '>=', date_from))

        total_carts = SaleOrder.search_count(cart_domain)

        # Get confirmed orders
        order_domain = [
            ('state', 'in', ['sale', 'done']),
            ('date_order', '<=', date_to),
        ]

        if date_from:
            order_domain.append(('date_order', '>=', date_from))

        total_orders = SaleOrder.search_count(order_domain)

        # Calculate conversion rate
        if total_carts > 0:
            conversion_rate = (total_orders / (total_carts + total_orders)) * 100
        else:
            conversion_rate = 0

        # Get abandoned carts
        abandoned_carts = total_carts - total_orders if total_carts > total_orders else 0

        return {
            'total_carts': total_carts,
            'total_orders': total_orders,
            'abandoned_carts': abandoned_carts,
            'conversion_rate': round(conversion_rate, 2),
        }
