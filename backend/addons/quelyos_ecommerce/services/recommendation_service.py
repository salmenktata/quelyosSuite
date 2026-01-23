# -*- coding: utf-8 -*-
"""
Product Recommendation Service
Provides intelligent product recommendations based on:
- Collaborative filtering (frequently bought together)
- Content-based filtering (similar products)
- Popularity-based recommendations
"""

import logging
from collections import Counter
from odoo import models, api

_logger = logging.getLogger(__name__)


class RecommendationService:
    """Service for product recommendations"""

    def __init__(self, env):
        self.env = env

    def get_recommendations(self, product_id, limit=8, user_id=None):
        """
        Get product recommendations

        Args:
            product_id: Product template ID
            limit: Maximum recommendations
            user_id: Optional user ID for personalization

        Returns:
            list: Recommended product IDs with scores
        """
        product = self.env['product.template'].sudo().browse(product_id)
        if not product.exists():
            return []

        # Get recommendations from different strategies
        collaborative = self._get_collaborative_recommendations(product, limit=limit)
        similar = self._get_similar_products(product, limit=limit)
        category_based = self._get_category_recommendations(product, limit=limit)

        # Merge and score recommendations
        recommendations = self._merge_recommendations([
            (collaborative, 3.0),  # Weight: 3.0 - strongest signal
            (similar, 2.0),        # Weight: 2.0
            (category_based, 1.0), # Weight: 1.0 - weakest signal
        ])

        # Remove the source product
        recommendations = [r for r in recommendations if r['id'] != product_id]

        # Limit results
        return recommendations[:limit]

    def _get_collaborative_recommendations(self, product, limit=10):
        """
        Get products frequently bought together

        Args:
            product: Product template
            limit: Max results

        Returns:
            list: Product IDs
        """
        try:
            SaleOrderLine = self.env['sale.order.line'].sudo()

            # Find orders containing this product
            lines_with_product = SaleOrderLine.search([
                ('product_id.product_tmpl_id', '=', product.id),
                ('order_id.state', 'in', ['sale', 'done']),
            ], limit=100)  # Limit for performance

            if not lines_with_product:
                return []

            order_ids = lines_with_product.mapped('order_id').ids

            # Find other products in these orders
            other_lines = SaleOrderLine.search([
                ('order_id', 'in', order_ids),
                ('product_id.product_tmpl_id', '!=', product.id),
                ('product_id.product_tmpl_id.sale_ok', '=', True),
                ('product_id.product_tmpl_id.active', '=', True),
            ])

            # Count product occurrences
            product_counts = Counter(
                other_lines.mapped('product_id.product_tmpl_id').ids
            )

            # Get top products
            top_products = []
            for product_id, count in product_counts.most_common(limit):
                top_products.append({
                    'id': product_id,
                    'score': count,
                })

            return top_products

        except Exception as e:
            _logger.error(f"Error in collaborative filtering: {str(e)}")
            return []

    def _get_similar_products(self, product, limit=10):
        """
        Get similar products based on attributes

        Args:
            product: Product template
            limit: Max results

        Returns:
            list: Product IDs
        """
        try:
            ProductTemplate = self.env['product.template'].sudo()

            domain = [
                ('id', '!=', product.id),
                ('sale_ok', '=', True),
                ('active', '=', True),
            ]

            # Same category
            if product.categ_id:
                domain.append(('categ_id', '=', product.categ_id.id))

            # Similar price range (+/- 30%)
            if product.list_price > 0:
                price_min = product.list_price * 0.7
                price_max = product.list_price * 1.3
                domain.extend([
                    ('list_price', '>=', price_min),
                    ('list_price', '<=', price_max),
                ])

            # Search similar products
            similar_products = ProductTemplate.search(domain, limit=limit)

            return [{'id': p.id, 'score': 1.0} for p in similar_products]

        except Exception as e:
            _logger.error(f"Error finding similar products: {str(e)}")
            return []

    def _get_category_recommendations(self, product, limit=10):
        """
        Get popular products from same category

        Args:
            product: Product template
            limit: Max results

        Returns:
            list: Product IDs
        """
        try:
            if not product.categ_id:
                return []

            ProductTemplate = self.env['product.template'].sudo()

            domain = [
                ('id', '!=', product.id),
                ('categ_id', '=', product.categ_id.id),
                ('sale_ok', '=', True),
                ('active', '=', True),
            ]

            # Order by popularity (view count or sales)
            popular_products = ProductTemplate.search(
                domain,
                limit=limit,
                order='view_count DESC'
            )

            return [{'id': p.id, 'score': 1.0} for p in popular_products]

        except Exception as e:
            _logger.error(f"Error getting category recommendations: {str(e)}")
            return []

    def _merge_recommendations(self, recommendation_lists):
        """
        Merge multiple recommendation lists with weighted scoring

        Args:
            recommendation_lists: List of (recommendations, weight) tuples

        Returns:
            list: Merged and sorted recommendations
        """
        scores = {}

        for recommendations, weight in recommendation_lists:
            for item in recommendations:
                product_id = item['id']
                item_score = item.get('score', 1.0)

                if product_id not in scores:
                    scores[product_id] = 0

                scores[product_id] += item_score * weight

        # Sort by score descending
        sorted_products = sorted(
            scores.items(),
            key=lambda x: x[1],
            reverse=True
        )

        return [{'id': pid, 'score': score} for pid, score in sorted_products]

    def get_upsell_recommendations(self, product_id, limit=4):
        """
        Get upsell recommendations (higher-tier products)

        Args:
            product_id: Product template ID
            limit: Max results

        Returns:
            list: Upsell product IDs
        """
        product = self.env['product.template'].sudo().browse(product_id)
        if not product.exists():
            return []

        ProductTemplate = self.env['product.template'].sudo()

        domain = [
            ('id', '!=', product_id),
            ('sale_ok', '=', True),
            ('active', '=', True),
            ('list_price', '>', product.list_price),  # Higher price
        ]

        # Same category preferred
        if product.categ_id:
            domain.append(('categ_id', '=', product.categ_id.id))

        # Price range: 1.2x to 2x current price
        price_min = product.list_price * 1.2
        price_max = product.list_price * 2.0

        domain.extend([
            ('list_price', '>=', price_min),
            ('list_price', '<=', price_max),
        ])

        # Search upsell products
        upsell_products = ProductTemplate.search(
            domain,
            limit=limit,
            order='list_price ASC'  # Start with closest price
        )

        return [{'id': p.id, 'price': p.list_price} for p in upsell_products]


def get_recommendation_service(env):
    """
    Factory function to get recommendation service

    Args:
        env: Odoo environment

    Returns:
        RecommendationService instance
    """
    return RecommendationService(env)
