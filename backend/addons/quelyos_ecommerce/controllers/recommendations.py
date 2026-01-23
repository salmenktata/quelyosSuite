# -*- coding: utf-8 -*-
"""
Recommendations Controller for E-commerce
Provides product recommendation endpoints
"""

import logging
from odoo import http
from odoo.http import request
from .base_controller import BaseEcommerceController

_logger = logging.getLogger(__name__)


class RecommendationsController(BaseEcommerceController):
    """Controller for product recommendations"""

    @http.route('/api/ecommerce/products/<int:product_id>/recommendations', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_recommendations(self, product_id, limit=8):
        """
        Get product recommendations

        Args:
            product_id: Product template ID
            limit: Maximum recommendations (default: 8, max: 20)

        Returns:
            dict: List of recommended products
        """
        try:
            # Limit maximum results
            limit = min(int(limit), 20)

            # Get recommendation service
            from ..services.recommendation_service import get_recommendation_service
            rec_service = get_recommendation_service(request.env)

            # Get authenticated user (optional)
            user = self._authenticate_user(raise_exception=False)
            user_id = user.id if user else None

            # Get recommendations
            recommendations = rec_service.get_recommendations(
                product_id,
                limit=limit,
                user_id=user_id
            )

            # Get product data for each recommendation
            ProductTemplate = request.env['product.template'].sudo()
            products = []

            for rec in recommendations:
                product = ProductTemplate.browse(rec['id'])
                if product.exists() and product.sale_ok and product.active:
                    products.append(product.get_api_data())

            return self._success_response({
                'products': products,
                'total': len(products),
                'source_product_id': product_id,
            })

        except Exception as e:
            _logger.error(f"Error getting recommendations: {str(e)}")
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/products/<int:product_id>/upsell', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_upsell(self, product_id, limit=4):
        """
        Get upsell recommendations (higher-tier products)

        Args:
            product_id: Product template ID
            limit: Maximum recommendations (default: 4)

        Returns:
            dict: List of upsell products
        """
        try:
            limit = min(int(limit), 10)

            # Get recommendation service
            from ..services.recommendation_service import get_recommendation_service
            rec_service = get_recommendation_service(request.env)

            # Get upsell recommendations
            upsell_products = rec_service.get_upsell_recommendations(
                product_id,
                limit=limit
            )

            # Get product data
            ProductTemplate = request.env['product.template'].sudo()
            products = []

            for rec in upsell_products:
                product = ProductTemplate.browse(rec['id'])
                if product.exists() and product.sale_ok and product.active:
                    data = product.get_api_data()
                    data['upsell_price_diff'] = rec['price'] - ProductTemplate.browse(product_id).list_price
                    products.append(data)

            return self._success_response({
                'products': products,
                'total': len(products),
                'source_product_id': product_id,
            })

        except Exception as e:
            _logger.error(f"Error getting upsell recommendations: {str(e)}")
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/products/frequently-bought-together', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def frequently_bought_together(self, product_ids, limit=4):
        """
        Get products frequently bought together with given products

        Args:
            product_ids: List of product template IDs
            limit: Maximum recommendations

        Returns:
            dict: List of products
        """
        try:
            if not product_ids or not isinstance(product_ids, list):
                return self._error_response("product_ids must be a list", 400)

            limit = min(int(limit), 10)

            # Get recommendation service
            from ..services.recommendation_service import get_recommendation_service
            rec_service = get_recommendation_service(request.env)

            # Collect recommendations from all products
            all_recommendations = {}

            for product_id in product_ids:
                recommendations = rec_service._get_collaborative_recommendations(
                    request.env['product.template'].sudo().browse(product_id),
                    limit=limit * 2
                )

                for rec in recommendations:
                    pid = rec['id']
                    if pid not in all_recommendations:
                        all_recommendations[pid] = 0
                    all_recommendations[pid] += rec['score']

            # Remove source products
            for pid in product_ids:
                all_recommendations.pop(pid, None)

            # Sort by score and limit
            sorted_products = sorted(
                all_recommendations.items(),
                key=lambda x: x[1],
                reverse=True
            )[:limit]

            # Get product data
            ProductTemplate = request.env['product.template'].sudo()
            products = []

            for product_id, score in sorted_products:
                product = ProductTemplate.browse(product_id)
                if product.exists() and product.sale_ok and product.active:
                    products.append(product.get_api_data())

            return self._success_response({
                'products': products,
                'total': len(products),
            })

        except Exception as e:
            _logger.error(f"Error getting frequently bought together: {str(e)}")
            return self._error_response(str(e), 500)
