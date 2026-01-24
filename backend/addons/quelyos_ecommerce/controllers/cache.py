# -*- coding: utf-8 -*-

import json
from odoo import http
from odoo.http import request
from .base_controller import BaseEcommerceController


class CacheController(BaseEcommerceController):
    """Cache management controller"""

    @http.route('/api/ecommerce/cache/clear', type='json', auth='user', methods=['POST'])
    def clear_cache(self, pattern=None, **kwargs):
        """
        Clear cache
        Admin only endpoint for cache management

        Args:
            pattern: Optional pattern to match keys (e.g., 'product:*')
                     If None, clears all e-commerce cache
        """
        try:
            # Check if user has admin rights
            if not request.env.user.has_group('base.group_system'):
                return self._error_response('Unauthorized', 403)

            cache = request.env['redis.cache']

            if pattern:
                # Clear specific pattern
                cache.delete_pattern(pattern)
                message = f'Cache cleared for pattern: {pattern}'
            else:
                # Clear all e-commerce cache patterns
                patterns = [
                    'product:*',
                    'products:*',
                    'category:*',
                    'analytics:*',
                    'search:*',
                    'facets:*',
                    'recommendations:*',
                ]

                for p in patterns:
                    cache.delete_pattern(p)

                message = 'All e-commerce cache cleared'

            return {
                'success': True,
                'message': message
            }

        except Exception as e:
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/cache/stats', type='json', auth='user', methods=['POST'])
    def cache_stats(self, **kwargs):
        """
        Get cache statistics
        Admin only endpoint
        """
        try:
            # Check if user has admin rights
            if not request.env.user.has_group('base.group_system'):
                return self._error_response('Unauthorized', 403)

            cache = request.env['redis.cache']
            client = cache._get_redis_client()

            if not client:
                return {
                    'success': True,
                    'data': {
                        'enabled': False,
                        'message': 'Redis not available'
                    }
                }

            # Get Redis info
            info = client.info()

            return {
                'success': True,
                'data': {
                    'enabled': True,
                    'used_memory': info.get('used_memory_human', 'N/A'),
                    'total_keys': client.dbsize(),
                    'connected_clients': info.get('connected_clients', 0),
                    'uptime_days': info.get('uptime_in_days', 0),
                }
            }

        except Exception as e:
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/cache/warmup', type='json', auth='user', methods=['POST'])
    def warmup_cache(self, **kwargs):
        """
        Warm up cache with popular products
        Admin only endpoint
        """
        try:
            # Check if user has admin rights
            if not request.env.user.has_group('base.group_system'):
                return self._error_response('Unauthorized', 403)

            cache = request.env['redis.cache']

            # Get top 50 most viewed products (from analytics)
            analytics = request.env['ecommerce.analytics'].sudo().search([
                ('event_type', '=', 'product_view')
            ], order='event_count desc', limit=50)

            warmed_count = 0

            for analytic in analytics:
                if analytic.product_id:
                    product = analytic.product_id

                    # Cache product details
                    product_data = product.get_api_data()
                    cache.set(
                        f'product:api:{product.id}',
                        product_data,
                        expire=3600  # 1 hour
                    )

                    # Cache SEO data
                    seo_data = product.get_seo_data(product.id)
                    cache.set(
                        f'product:seo:{product.id}',
                        seo_data,
                        expire=3600
                    )

                    warmed_count += 1

            return {
                'success': True,
                'message': f'Cache warmed up with {warmed_count} products'
            }

        except Exception as e:
            return self._error_response(str(e), 500)


class ProductsControllerCached(BaseEcommerceController):
    """Extended products controller with caching"""

    @http.route('/api/ecommerce/products/list/cached', type='json', auth='public', methods=['POST'])
    def list_products_cached(self, **kwargs):
        """
        Get product list with Redis caching
        Cache key based on filters, sort, limit, offset
        """
        try:
            # Build cache key from request parameters
            import hashlib
            cache_key_data = json.dumps(kwargs, sort_keys=True)
            cache_key_hash = hashlib.md5(cache_key_data.encode()).hexdigest()
            cache_key = f'products:list:{cache_key_hash}'

            # Try to get from cache
            cache = request.env['redis.cache']
            cached_result = cache.get(cache_key)

            if cached_result:
                return {
                    'success': True,
                    'data': cached_result,
                    'cached': True
                }

            # Cache miss - fetch from database
            # Import products controller
            from .products import ProductsController
            products_ctrl = ProductsController()
            result = products_ctrl.list_products(**kwargs)

            if result.get('success'):
                # Cache the result for 5 minutes
                cache.set(cache_key, result.get('data'), expire=300)

            result['cached'] = False
            return result

        except Exception as e:
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/products/<int:product_id>/cached', type='json', auth='public', methods=['POST'])
    def get_product_cached(self, product_id, **kwargs):
        """Get product details with Redis caching"""
        try:
            cache_key = f'product:api:{product_id}'

            # Try to get from cache
            cache = request.env['redis.cache']
            cached_result = cache.get(cache_key)

            if cached_result:
                return {
                    'success': True,
                    'data': cached_result,
                    'cached': True
                }

            # Cache miss - fetch from database
            product = request.env['product.template'].sudo().browse(product_id)

            if not product.exists():
                return self._error_response('Product not found', 404)

            product_data = product.get_api_data()

            # Cache the result for 1 hour
            cache.set(cache_key, product_data, expire=3600)

            return {
                'success': True,
                'data': product_data,
                'cached': False
            }

        except Exception as e:
            return self._error_response(str(e), 500)
