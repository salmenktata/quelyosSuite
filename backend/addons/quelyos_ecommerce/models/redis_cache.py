# -*- coding: utf-8 -*-

import json
import logging
from functools import wraps
from odoo import api, models, fields

_logger = logging.getLogger(__name__)

# Try to import redis
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    _logger.warning('Redis library not available. Install with: pip install redis')


class RedisCache(models.AbstractModel):
    """Redis Cache Manager for E-commerce"""
    _name = 'redis.cache'
    _description = 'Redis Cache Manager'

    @api.model
    def _get_redis_client(self):
        """Get Redis client connection"""
        if not REDIS_AVAILABLE:
            return None

        try:
            # Get Redis configuration from system parameters
            host = self.env['ir.config_parameter'].sudo().get_param('redis.host', 'localhost')
            port = int(self.env['ir.config_parameter'].sudo().get_param('redis.port', '6379'))
            db = int(self.env['ir.config_parameter'].sudo().get_param('redis.db', '0'))
            password = self.env['ir.config_parameter'].sudo().get_param('redis.password', False)

            client = redis.Redis(
                host=host,
                port=port,
                db=db,
                password=password if password else None,
                decode_responses=True,
                socket_connect_timeout=5
            )

            # Test connection
            client.ping()
            return client

        except Exception as e:
            _logger.error(f'Failed to connect to Redis: {e}')
            return None

    @api.model
    def get(self, key):
        """Get value from cache"""
        client = self._get_redis_client()
        if not client:
            return None

        try:
            value = client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            _logger.error(f'Redis GET error: {e}')
            return None

    @api.model
    def set(self, key, value, expire=3600):
        """Set value in cache with expiration (default 1 hour)"""
        client = self._get_redis_client()
        if not client:
            return False

        try:
            serialized = json.dumps(value)
            client.setex(key, expire, serialized)
            return True
        except Exception as e:
            _logger.error(f'Redis SET error: {e}')
            return False

    @api.model
    def delete(self, key):
        """Delete key from cache"""
        client = self._get_redis_client()
        if not client:
            return False

        try:
            client.delete(key)
            return True
        except Exception as e:
            _logger.error(f'Redis DELETE error: {e}')
            return False

    @api.model
    def delete_pattern(self, pattern):
        """Delete all keys matching pattern (e.g., 'product:*')"""
        client = self._get_redis_client()
        if not client:
            return False

        try:
            keys = client.keys(pattern)
            if keys:
                client.delete(*keys)
            return True
        except Exception as e:
            _logger.error(f'Redis DELETE PATTERN error: {e}')
            return False

    @api.model
    def exists(self, key):
        """Check if key exists in cache"""
        client = self._get_redis_client()
        if not client:
            return False

        try:
            return client.exists(key) > 0
        except Exception as e:
            _logger.error(f'Redis EXISTS error: {e}')
            return False

    @api.model
    def incr(self, key, amount=1):
        """Increment counter"""
        client = self._get_redis_client()
        if not client:
            return None

        try:
            return client.incr(key, amount)
        except Exception as e:
            _logger.error(f'Redis INCR error: {e}')
            return None

    @api.model
    def expire(self, key, seconds):
        """Set expiration on existing key"""
        client = self._get_redis_client()
        if not client:
            return False

        try:
            return client.expire(key, seconds)
        except Exception as e:
            _logger.error(f'Redis EXPIRE error: {e}')
            return False

    @api.model
    def flush_all(self):
        """Flush all cache (use with caution!)"""
        client = self._get_redis_client()
        if not client:
            return False

        try:
            client.flushdb()
            return True
        except Exception as e:
            _logger.error(f'Redis FLUSHDB error: {e}')
            return False


def cached(key_prefix, expire=3600):
    """
    Decorator for caching method results in Redis

    Usage:
    @cached('product:details', expire=1800)
    def get_product_details(self, product_id):
        # expensive operation
        return result
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            # Build cache key from arguments
            cache_key = f"{key_prefix}:{':'.join(str(arg) for arg in args)}"

            # Try to get from cache
            cache = self.env['redis.cache']
            cached_value = cache.get(cache_key)

            if cached_value is not None:
                _logger.debug(f'Cache HIT: {cache_key}')
                return cached_value

            # Cache miss - execute function
            _logger.debug(f'Cache MISS: {cache_key}')
            result = func(self, *args, **kwargs)

            # Store in cache
            cache.set(cache_key, result, expire=expire)

            return result

        return wrapper
    return decorator


class ProductTemplate(models.Model):
    """Add cache invalidation to product updates"""
    _inherit = 'product.template'

    def write(self, vals):
        """Invalidate cache on product update"""
        res = super().write(vals)

        # Invalidate product-related caches
        cache = self.env['redis.cache']
        for product in self:
            cache.delete(f'product:details:{product.id}')
            cache.delete(f'product:api:{product.id}')
            cache.delete(f'product:seo:{product.id}')

        # Invalidate listing caches
        cache.delete_pattern('products:list:*')
        cache.delete_pattern('products:facets:*')

        return res

    def unlink(self):
        """Invalidate cache on product deletion"""
        # Invalidate product-related caches
        cache = self.env['redis.cache']
        for product in self:
            cache.delete(f'product:details:{product.id}')
            cache.delete(f'product:api:{product.id}')
            cache.delete(f'product:seo:{product.id}')

        # Invalidate listing caches
        cache.delete_pattern('products:list:*')
        cache.delete_pattern('products:facets:*')

        return super().unlink()


class SaleOrder(models.Model):
    """Add cache invalidation to order updates"""
    _inherit = 'sale.order'

    def write(self, vals):
        """Invalidate analytics cache on order update"""
        res = super().write(vals)

        # Invalidate analytics caches
        cache = self.env['redis.cache']
        cache.delete_pattern('analytics:*')

        return res

    def action_confirm(self):
        """Invalidate analytics cache on order confirmation"""
        res = super().action_confirm()

        # Invalidate analytics caches
        cache = self.env['redis.cache']
        cache.delete_pattern('analytics:*')

        return res
