# -*- coding: utf-8 -*-
"""
Service de cache Redis pour optimiser les performances des endpoints API.

Impact attendu:
- Backend response: 500ms → 5ms (-99%)
- LCP frontend: 3.4s → 2.0s (-41%)
- Score Lighthouse: 79 → 92+ (+13 points)
"""

import os
import json
import hashlib
import logging
from datetime import timedelta

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logging.warning("redis-py not installed. Cache will be disabled. Install with: pip3 install redis")

_logger = logging.getLogger(__name__)


class CacheService:
    """Service de cache Redis avec fallback gracieux"""

    def __init__(self):
        self.redis_client = None
        self.enabled = False

        if not REDIS_AVAILABLE:
            _logger.warning("Redis cache disabled: redis-py not installed")
            return

        try:
            # Configuration depuis environnement (docker-compose)
            redis_host = os.environ.get('REDIS_HOST', 'localhost')
            redis_port = int(os.environ.get('REDIS_PORT', 6379))
            redis_db = int(os.environ.get('REDIS_DB', 0))

            self.redis_client = redis.Redis(
                host=redis_host,
                port=redis_port,
                db=redis_db,
                decode_responses=True,  # Auto-decode bytes → str
                socket_connect_timeout=2,
                socket_timeout=2,
            )

            # Test connexion
            self.redis_client.ping()
            self.enabled = True
            _logger.info(f"✅ Redis cache enabled ({redis_host}:{redis_port})")

        except Exception as e:
            _logger.warning(f"Redis cache disabled: {str(e)}")
            self.redis_client = None
            self.enabled = False

    def _generate_key(self, prefix, **kwargs):
        """
        Génère une clé de cache unique basée sur les paramètres.

        Exemple:
        >>> _generate_key('products', limit=12, category=5)
        'products:limit=12:category=5:hash123abc'
        """
        # Trier les paramètres pour consistance
        sorted_params = sorted(kwargs.items())
        params_str = ':'.join(f"{k}={v}" for k, v in sorted_params if v is not None)

        # Hash pour éviter clés trop longues
        params_hash = hashlib.md5(params_str.encode()).hexdigest()[:8]

        if params_str:
            return f"{prefix}:{params_str}:{params_hash}"
        return f"{prefix}:all:{params_hash}"

    def get(self, key):
        """
        Récupère une valeur du cache.

        Returns:
            dict | None: Données désérialisées ou None si absent/erreur
        """
        if not self.enabled:
            return None

        try:
            cached = self.redis_client.get(key)
            if cached:
                _logger.debug(f"✅ Cache HIT: {key}")
                return json.loads(cached)

            _logger.debug(f"❌ Cache MISS: {key}")
            return None

        except Exception as e:
            _logger.error(f"Redis GET error: {str(e)}")
            return None

    def set(self, key, value, ttl=300):
        """
        Stocke une valeur dans le cache avec TTL.

        Args:
            key (str): Clé de cache
            value (dict|list): Données à cacher (sérialisables JSON)
            ttl (int): Time-To-Live en secondes (défaut: 5min)

        Returns:
            bool: True si succès, False sinon
        """
        if not self.enabled:
            return False

        try:
            serialized = json.dumps(value, ensure_ascii=False)
            self.redis_client.setex(key, ttl, serialized)
            _logger.debug(f"✅ Cache SET: {key} (TTL: {ttl}s)")
            return True

        except Exception as e:
            _logger.error(f"Redis SET error: {str(e)}")
            return False

    def delete(self, key):
        """Supprime une clé du cache"""
        if not self.enabled:
            return False

        try:
            self.redis_client.delete(key)
            _logger.debug(f"✅ Cache DELETE: {key}")
            return True

        except Exception as e:
            _logger.error(f"Redis DELETE error: {str(e)}")
            return False

    def invalidate_pattern(self, pattern):
        """
        Invalide toutes les clés matchant un pattern.

        Exemple:
        >>> invalidate_pattern('products:*')
        Supprime: products:all, products:category=5, etc.
        """
        if not self.enabled:
            return False

        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                self.redis_client.delete(*keys)
                _logger.info(f"✅ Cache invalidated: {len(keys)} keys ({pattern})")
            return True

        except Exception as e:
            _logger.error(f"Redis INVALIDATE error: {str(e)}")
            return False

    def get_stats(self):
        """Récupère les statistiques Redis"""
        if not self.enabled:
            return {'enabled': False}

        try:
            info = self.redis_client.info('stats')
            return {
                'enabled': True,
                'total_commands': info.get('total_commands_processed', 0),
                'keyspace_hits': info.get('keyspace_hits', 0),
                'keyspace_misses': info.get('keyspace_misses', 0),
                'hit_rate': self._calculate_hit_rate(
                    info.get('keyspace_hits', 0),
                    info.get('keyspace_misses', 0)
                ),
            }
        except Exception as e:
            _logger.error(f"Redis STATS error: {str(e)}")
            return {'enabled': True, 'error': str(e)}

    @staticmethod
    def _calculate_hit_rate(hits, misses):
        """Calcule le taux de hit cache"""
        total = hits + misses
        if total == 0:
            return 0.0
        return round((hits / total) * 100, 2)


# Instance singleton
_cache_service = None

def get_cache_service():
    """
    Retourne l'instance singleton du service de cache.

    Usage:
    >>> from odoo.addons.quelyos_api.lib.cache import get_cache_service
    >>> cache = get_cache_service()
    >>> cache.set('my_key', {'data': 'value'}, ttl=300)
    """
    global _cache_service
    if _cache_service is None:
        _cache_service = CacheService()
    return _cache_service


# TTL recommandés par type de données
class CacheTTL:
    """Constantes TTL (Time-To-Live) recommandées"""
    PRODUCTS_LIST = 300      # 5 minutes - Liste produits
    PRODUCT_DETAIL = 600     # 10 minutes - Détail produit
    CATEGORIES = 3600        # 1 heure - Catégories (changent rarement)
    STATIC_PAGES = 1800      # 30 minutes - Pages statiques/CMS
    USER_SESSION = 900       # 15 minutes - Données session utilisateur
    CART = 300               # 5 minutes - Panier
    SITE_CONFIG = 3600       # 1 heure - Configuration site
    SEARCH_RESULTS = 180     # 3 minutes - Résultats recherche
    PRICELISTS = 1800        # 30 minutes - Listes de prix
    STOCK_SUMMARY = 60       # 1 minute - Résumé stock (données volatiles)
    DASHBOARD_STATS = 300    # 5 minutes - Stats dashboard


# =============================================================================
# HELPERS DE CACHE STRATÉGIQUES
# =============================================================================

def cached(prefix: str, ttl: int = 300, key_args: list = None):
    """
    Décorateur pour cacher le résultat d'une fonction.

    Usage:
        @cached('products', ttl=CacheTTL.PRODUCTS_LIST, key_args=['category_id', 'limit'])
        def get_products(self, category_id=None, limit=20):
            ...

    Args:
        prefix: Préfixe de la clé cache
        ttl: Time-To-Live en secondes
        key_args: Liste des arguments à inclure dans la clé cache
    """
    from functools import wraps

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache = get_cache_service()

            # Construire la clé
            if key_args:
                key_params = {k: kwargs.get(k) for k in key_args if k in kwargs}
            else:
                key_params = kwargs

            cache_key = cache._generate_key(prefix, **key_params)

            # Vérifier le cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result

            # Exécuter et cacher
            result = func(*args, **kwargs)

            if result is not None:
                cache.set(cache_key, result, ttl)

            return result

        # Ajouter méthode pour invalider
        def invalidate(**kwargs):
            cache = get_cache_service()
            if kwargs:
                cache_key = cache._generate_key(prefix, **kwargs)
                cache.delete(cache_key)
            else:
                cache.invalidate_pattern(f"{prefix}:*")

        wrapper.invalidate = invalidate
        wrapper.cache_prefix = prefix

        return wrapper
    return decorator


class CacheStrategies:
    """
    Stratégies de cache prédéfinies pour les cas d'usage courants.
    """

    @staticmethod
    def cache_products_list(result: dict, params: dict) -> bool:
        """Cache la liste des produits"""
        cache = get_cache_service()
        key = cache._generate_key('products:list', **params)
        return cache.set(key, result, CacheTTL.PRODUCTS_LIST)

    @staticmethod
    def get_cached_products_list(params: dict) -> dict | None:
        """Récupère la liste des produits depuis le cache"""
        cache = get_cache_service()
        key = cache._generate_key('products:list', **params)
        return cache.get(key)

    @staticmethod
    def cache_product_detail(product_id: int, result: dict) -> bool:
        """Cache le détail d'un produit"""
        cache = get_cache_service()
        key = f"products:detail:{product_id}"
        return cache.set(key, result, CacheTTL.PRODUCT_DETAIL)

    @staticmethod
    def get_cached_product_detail(product_id: int) -> dict | None:
        """Récupère le détail d'un produit depuis le cache"""
        cache = get_cache_service()
        key = f"products:detail:{product_id}"
        return cache.get(key)

    @staticmethod
    def invalidate_product(product_id: int = None):
        """Invalide le cache d'un produit ou de tous les produits"""
        cache = get_cache_service()
        if product_id:
            cache.delete(f"products:detail:{product_id}")
        cache.invalidate_pattern("products:list:*")

    @staticmethod
    def cache_categories(result: list) -> bool:
        """Cache les catégories"""
        cache = get_cache_service()
        return cache.set("categories:all", result, CacheTTL.CATEGORIES)

    @staticmethod
    def get_cached_categories() -> list | None:
        """Récupère les catégories depuis le cache"""
        cache = get_cache_service()
        return cache.get("categories:all")

    @staticmethod
    def invalidate_categories():
        """Invalide le cache des catégories"""
        cache = get_cache_service()
        cache.invalidate_pattern("categories:*")

    @staticmethod
    def cache_site_config(tenant_id: int, config: dict) -> bool:
        """Cache la configuration site d'un tenant"""
        cache = get_cache_service()
        key = f"config:tenant:{tenant_id}"
        return cache.set(key, config, CacheTTL.SITE_CONFIG)

    @staticmethod
    def get_cached_site_config(tenant_id: int) -> dict | None:
        """Récupère la configuration site depuis le cache"""
        cache = get_cache_service()
        key = f"config:tenant:{tenant_id}"
        return cache.get(key)

    @staticmethod
    def cache_dashboard_stats(user_id: int, stats: dict) -> bool:
        """Cache les stats dashboard d'un utilisateur"""
        cache = get_cache_service()
        key = f"dashboard:stats:{user_id}"
        return cache.set(key, stats, CacheTTL.DASHBOARD_STATS)

    @staticmethod
    def get_cached_dashboard_stats(user_id: int) -> dict | None:
        """Récupère les stats dashboard depuis le cache"""
        cache = get_cache_service()
        key = f"dashboard:stats:{user_id}"
        return cache.get(key)
