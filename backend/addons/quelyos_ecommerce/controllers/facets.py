# -*- coding: utf-8 -*-
"""
Faceted Search Controller
Provides facets (filters) for product browsing
"""

import logging
from odoo import http
from odoo.http import request
from .base_controller import BaseEcommerceController

_logger = logging.getLogger(__name__)


class FacetsController(BaseEcommerceController):
    """Controller for product facets and filters"""

    @http.route('/api/ecommerce/products/facets', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_facets(self, category_id=None, **kwargs):
        """
        Get available facets for product filtering

        Args:
            category_id: Optional category ID to filter facets

        Returns:
            dict: Available facets with counts
            {
                "price_ranges": [
                    {"min": 0, "max": 50, "count": 25},
                    {"min": 50, "max": 100, "count": 40},
                    ...
                ],
                "attributes": {
                    "Color": [
                        {"value": "Red", "count": 12},
                        {"value": "Blue", "count": 8},
                        ...
                    ],
                    "Size": [...]
                },
                "brands": [
                    {"name": "Apple", "count": 15},
                    ...
                ]
            }
        """
        try:
            ProductTemplate = request.env['product.template'].sudo()

            # Base domain
            domain = [
                ('sale_ok', '=', True),
                ('active', '=', True),
            ]

            if category_id:
                domain.append(('categ_id', '=', int(category_id)))

            # Get all matching products
            products = ProductTemplate.search(domain)

            # Build price ranges
            price_ranges = self._get_price_ranges(products)

            # Build attribute facets
            attributes_facets = self._get_attribute_facets(products)

            # Build brand facets (if brand field exists)
            brands_facets = self._get_brand_facets(products)

            return self._success_response({
                'price_ranges': price_ranges,
                'attributes': attributes_facets,
                'brands': brands_facets,
                'total_products': len(products),
            })

        except Exception as e:
            _logger.error(f"Error getting facets: {str(e)}")
            return self._error_response(str(e), 500)

    def _get_price_ranges(self, products):
        """
        Calculate price range buckets with product counts

        Returns list of price ranges:
        [{"min": 0, "max": 50, "count": 25, "label": "0€ - 50€"}, ...]
        """
        if not products:
            return []

        # Define price range buckets
        ranges = [
            (0, 50),
            (50, 100),
            (100, 200),
            (200, 500),
            (500, 1000),
            (1000, 999999),  # 1000+
        ]

        price_ranges = []
        for min_price, max_price in ranges:
            count = len(products.filtered(
                lambda p: min_price <= p.list_price < max_price
            ))

            if count > 0:  # Only include ranges with products
                label = f"{min_price}€ - {max_price}€" if max_price < 999999 else f"{min_price}€+"
                price_ranges.append({
                    'min': min_price,
                    'max': max_price,
                    'count': count,
                    'label': label,
                })

        return price_ranges

    def _get_attribute_facets(self, products):
        """
        Get product attributes with counts

        Returns dict of attributes:
        {
            "Color": [{"value": "Red", "count": 12}, ...],
            "Size": [...]
        }
        """
        attributes_facets = {}

        # Get all product template attribute values used by these products
        ProductAttributeValue = request.env['product.template.attribute.value'].sudo()
        ProductAttributeLine = request.env['product.template.attribute.line'].sudo()

        # Get attribute lines for these products
        attribute_lines = ProductAttributeLine.search([
            ('product_tmpl_id', 'in', products.ids)
        ])

        # Group by attribute
        for line in attribute_lines:
            attribute_name = line.attribute_id.name

            if attribute_name not in attributes_facets:
                attributes_facets[attribute_name] = {}

            # Count products with each value
            for value in line.value_ids:
                value_name = value.name

                # Count how many products have this attribute value
                products_with_value = ProductTemplate.search_count([
                    ('id', 'in', products.ids),
                    ('attribute_line_ids.value_ids', 'in', value.id)
                ])

                if value_name in attributes_facets[attribute_name]:
                    attributes_facets[attribute_name][value_name] += products_with_value
                else:
                    attributes_facets[attribute_name][value_name] = products_with_value

        # Convert to list format
        result = {}
        for attr_name, values_dict in attributes_facets.items():
            result[attr_name] = [
                {'value': value, 'count': count}
                for value, count in values_dict.items()
                if count > 0
            ]
            # Sort by count descending
            result[attr_name].sort(key=lambda x: x['count'], reverse=True)

        return result

    def _get_brand_facets(self, products):
        """
        Get brand facets with counts

        Note: This assumes products have a 'brand' or 'manufacturer' field
        If not, this will return empty list
        """
        brands_facets = []

        # Check if product has brand/manufacturer field
        if hasattr(products, 'brand_id'):
            brands = {}
            for product in products:
                if product.brand_id:
                    brand_name = product.brand_id.name
                    if brand_name in brands:
                        brands[brand_name] += 1
                    else:
                        brands[brand_name] = 1

            brands_facets = [
                {'name': brand, 'count': count}
                for brand, count in brands.items()
            ]
            brands_facets.sort(key=lambda x: x['count'], reverse=True)

        return brands_facets
