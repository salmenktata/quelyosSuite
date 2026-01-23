# -*- coding: utf-8 -*-
"""
Search Controller for E-commerce
Provides autocomplete and advanced search capabilities
"""

import logging
from odoo import http
from odoo.http import request
from .base_controller import BaseEcommerceController

_logger = logging.getLogger(__name__)


class SearchController(BaseEcommerceController):
    """Controller for search functionality"""

    @http.route('/api/ecommerce/search/autocomplete', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def autocomplete(self, query='', limit=10, include_categories=True):
        """
        Autocomplete search endpoint

        Args:
            query: Search query string
            limit: Maximum number of results (default: 10, max: 20)
            include_categories: Whether to include category suggestions

        Returns:
            dict: Autocomplete suggestions with products and categories
        """
        try:
            if not query or len(query) < 2:
                return self._success_response({
                    'products': [],
                    'categories': [],
                    'query': query,
                })

            # Limit maximum results
            limit = min(int(limit), 20)

            # Search products
            products = self._search_products(query, limit)

            # Search categories if requested
            categories = []
            if include_categories:
                categories = self._search_categories(query, limit=5)

            return self._success_response({
                'products': products,
                'categories': categories,
                'query': query,
                'total_products': len(products),
                'total_categories': len(categories),
            })

        except Exception as e:
            _logger.error(f"Error in autocomplete search: {str(e)}")
            return self._error_response(str(e), 500)

    def _search_products(self, query, limit):
        """
        Search products by name, code, or description

        Args:
            query: Search query
            limit: Max results

        Returns:
            list: Product data
        """
        ProductTemplate = request.env['product.template'].sudo()

        # Build search domain (case-insensitive search on multiple fields)
        query_lower = query.lower()
        domain = [
            '|', '|',
            ('name', 'ilike', query),
            ('default_code', 'ilike', query),  # SKU/Reference
            ('description_sale', 'ilike', query),
            ('sale_ok', '=', True),  # Only sellable products
            ('active', '=', True),
        ]

        # Search products ordered by relevance (exact match first)
        products = ProductTemplate.search(domain, limit=limit, order='name')

        # Format results
        results = []
        for product in products:
            # Highlight matched term
            highlight = self._get_highlight(product.name, query)

            # Get primary image
            image_url = f'/web/image/product.template/{product.id}/image_128'

            # Get first variant price (or product price if no variants)
            price = product.list_price
            if product.product_variant_ids:
                price = product.product_variant_ids[0].list_price

            results.append({
                'id': product.id,
                'name': product.name,
                'highlight': highlight,
                'slug': product.slug,
                'image': image_url,
                'price': price,
                'currency': product.currency_id.name,
                'category': product.categ_id.name if product.categ_id else None,
                'category_id': product.categ_id.id if product.categ_id else None,
                'default_code': product.default_code or None,  # SKU
            })

        return results

    def _search_categories(self, query, limit=5):
        """
        Search categories by name

        Args:
            query: Search query
            limit: Max results

        Returns:
            list: Category data
        """
        Category = request.env['product.public.category'].sudo()

        domain = [
            ('name', 'ilike', query),
        ]

        categories = Category.search(domain, limit=limit, order='name')

        results = []
        for category in categories:
            # Count products in category
            product_count = request.env['product.template'].sudo().search_count([
                ('public_categ_ids', 'in', [category.id]),
                ('sale_ok', '=', True),
                ('active', '=', True),
            ])

            # Get category image (if available)
            image_url = None
            if category.image_128:
                image_url = f'/web/image/product.public.category/{category.id}/image_128'

            results.append({
                'id': category.id,
                'name': category.name,
                'highlight': self._get_highlight(category.name, query),
                'product_count': product_count,
                'image': image_url,
            })

        return results

    def _get_highlight(self, text, query):
        """
        Generate highlighted text with query match

        Args:
            text: Original text
            query: Search query

        Returns:
            str: Text with <mark> tags around matched query
        """
        if not text or not query:
            return text

        # Case-insensitive replace with highlight
        import re
        pattern = re.compile(re.escape(query), re.IGNORECASE)
        return pattern.sub(lambda m: f"<mark>{m.group(0)}</mark>", text)

    @http.route('/api/ecommerce/search', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def search(self, query='', category_id=None, price_min=None, price_max=None,
               sort='relevance', limit=24, offset=0):
        """
        Full search endpoint with filters

        Args:
            query: Search query string
            category_id: Filter by category ID
            price_min: Minimum price filter
            price_max: Maximum price filter
            sort: Sort order (relevance, price_asc, price_desc, name)
            limit: Results per page
            offset: Pagination offset

        Returns:
            dict: Search results with filters and pagination
        """
        try:
            ProductTemplate = request.env['product.template'].sudo()

            # Build domain
            domain = [
                ('sale_ok', '=', True),
                ('active', '=', True),
            ]

            # Add search query
            if query and len(query) >= 2:
                domain.extend([
                    '|', '|',
                    ('name', 'ilike', query),
                    ('default_code', 'ilike', query),
                    ('description_sale', 'ilike', query),
                ])

            # Add category filter
            if category_id:
                domain.append(('public_categ_ids', 'in', [int(category_id)]))

            # Add price filters
            if price_min is not None:
                domain.append(('list_price', '>=', float(price_min)))
            if price_max is not None:
                domain.append(('list_price', '<=', float(price_max)))

            # Determine sort order
            order_map = {
                'price_asc': 'list_price ASC',
                'price_desc': 'list_price DESC',
                'name': 'name ASC',
                'newest': 'create_date DESC',
                'relevance': 'name ASC',  # Default
            }
            order = order_map.get(sort, 'name ASC')

            # Count total results
            total_count = ProductTemplate.search_count(domain)

            # Search with pagination
            products = ProductTemplate.search(
                domain,
                limit=int(limit),
                offset=int(offset),
                order=order
            )

            # Format results
            results = []
            for product in products:
                results.append(product.get_api_data())

            # Calculate pagination info
            total_pages = (total_count + limit - 1) // limit
            current_page = (offset // limit) + 1

            return self._success_response({
                'products': results,
                'pagination': {
                    'total': total_count,
                    'limit': limit,
                    'offset': offset,
                    'current_page': current_page,
                    'total_pages': total_pages,
                    'has_next': offset + limit < total_count,
                    'has_prev': offset > 0,
                },
                'filters': {
                    'query': query,
                    'category_id': category_id,
                    'price_min': price_min,
                    'price_max': price_max,
                    'sort': sort,
                },
            })

        except Exception as e:
            _logger.error(f"Error in search: {str(e)}")
            return self._error_response(str(e), 500)
