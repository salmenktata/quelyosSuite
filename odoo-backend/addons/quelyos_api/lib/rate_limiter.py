# -*- coding: utf-8 -*-
"""
Rate Limiter pour API Quelyos

Protège les endpoints contre:
- Brute force attacks (login)
- DDoS / abus API
- Scraping excessif

Algorithme: Sliding Window avec Redis
Fallback: Token Bucket en mémoire (single worker only)
"""

import os
import time
import logging
from functools import wraps
from collections import defaultdict
from threading import Lock

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

_logger = logging.getLogger(__name__)


# =============================================================================
# CONFIGURATION
# =============================================================================

class RateLimitConfig:
    """Configuration des limites par type d'endpoint"""

    # Limites par défaut (requêtes / fenêtre en secondes)
    DEFAULT = (100, 60)           # 100 req/min

    # Endpoints sensibles
    LOGIN = (5, 60)               # 5 tentatives/min (brute force protection)
    LOGIN_FAILED = (3, 300)       # 3 échecs puis blocage 5 min
    PASSWORD_RESET = (3, 3600)    # 3 demandes/heure

    # API publique
    PRODUCTS_LIST = (60, 60)      # 60 req/min
    PRODUCTS_SEARCH = (30, 60)    # 30 recherches/min
    PRODUCT_DETAIL = (120, 60)    # 120 req/min

    # API authentifiée (plus permissive)
    BACKOFFICE = (200, 60)        # 200 req/min
    CHECKOUT = (20, 60)           # 20 checkouts/min

    # Endpoints critiques
    PAYMENT = (10, 60)            # 10 tentatives paiement/min
    EXPORT = (5, 300)             # 5 exports/5 min (données sensibles)


# =============================================================================
# RATE LIMITER REDIS (Production)
# =============================================================================

class RedisRateLimiter:
    """
    Rate limiter distribué avec Redis.
    Utilise l'algorithme Sliding Window Log.
    """

    def __init__(self):
        self.redis_client = None
        self.enabled = False

        if not REDIS_AVAILABLE:
            _logger.warning("Rate limiter: Redis non disponible")
            return

        try:
            redis_host = os.environ.get('REDIS_HOST', 'localhost')
            redis_port = int(os.environ.get('REDIS_PORT', 6379))
            redis_db = int(os.environ.get('REDIS_RATE_LIMIT_DB', 1))  # DB séparée

            self.redis_client = redis.Redis(
                host=redis_host,
                port=redis_port,
                db=redis_db,
                decode_responses=True,
                socket_connect_timeout=1,
                socket_timeout=1,
            )
            self.redis_client.ping()
            self.enabled = True
            _logger.info(f"Rate limiter Redis enabled ({redis_host}:{redis_port}/db{redis_db})")

        except Exception as e:
            _logger.warning(f"Rate limiter Redis disabled: {e}")

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> tuple:
        """
        Vérifie si une requête est autorisée.

        Args:
            key: Identifiant unique (IP, user_id, etc.)
            max_requests: Nombre max de requêtes
            window_seconds: Fenêtre de temps en secondes

        Returns:
            tuple: (allowed: bool, remaining: int, reset_time: int)
        """
        if not self.enabled:
            return (True, max_requests, 0)

        try:
            now = time.time()
            window_start = now - window_seconds
            redis_key = f"rate:{key}"

            pipe = self.redis_client.pipeline()

            # Supprimer les entrées hors fenêtre
            pipe.zremrangebyscore(redis_key, 0, window_start)

            # Compter les requêtes dans la fenêtre
            pipe.zcard(redis_key)

            # Ajouter la requête actuelle
            pipe.zadd(redis_key, {str(now): now})

            # Définir l'expiration
            pipe.expire(redis_key, window_seconds + 1)

            results = pipe.execute()
            current_count = results[1]

            remaining = max(0, max_requests - current_count - 1)
            reset_time = int(now + window_seconds)

            if current_count >= max_requests:
                _logger.warning(f"Rate limit exceeded: {key} ({current_count}/{max_requests})")
                return (False, 0, reset_time)

            return (True, remaining, reset_time)

        except Exception as e:
            _logger.error(f"Rate limiter error: {e}")
            return (True, max_requests, 0)  # Fail open

    def get_remaining(self, key: str, max_requests: int, window_seconds: int) -> int:
        """Retourne le nombre de requêtes restantes"""
        if not self.enabled:
            return max_requests

        try:
            now = time.time()
            window_start = now - window_seconds
            redis_key = f"rate:{key}"

            # Nettoyer et compter
            self.redis_client.zremrangebyscore(redis_key, 0, window_start)
            current_count = self.redis_client.zcard(redis_key)

            return max(0, max_requests - current_count)

        except Exception:
            return max_requests

    def reset(self, key: str):
        """Reset le compteur pour une clé"""
        if self.enabled:
            try:
                self.redis_client.delete(f"rate:{key}")
            except Exception:
                pass


# =============================================================================
# RATE LIMITER IN-MEMORY (Fallback)
# =============================================================================

class MemoryRateLimiter:
    """
    Rate limiter en mémoire pour environnements sans Redis.
    ATTENTION: Ne fonctionne pas avec plusieurs workers Odoo!
    """

    def __init__(self):
        self.requests = defaultdict(list)
        self.lock = Lock()
        _logger.warning("Using in-memory rate limiter (single worker only)")

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> tuple:
        """Vérifie si une requête est autorisée"""
        now = time.time()
        window_start = now - window_seconds

        with self.lock:
            # Nettoyer les anciennes entrées
            self.requests[key] = [t for t in self.requests[key] if t > window_start]

            current_count = len(self.requests[key])
            remaining = max(0, max_requests - current_count - 1)
            reset_time = int(now + window_seconds)

            if current_count >= max_requests:
                return (False, 0, reset_time)

            self.requests[key].append(now)
            return (True, remaining, reset_time)

    def get_remaining(self, key: str, max_requests: int, window_seconds: int) -> int:
        now = time.time()
        window_start = now - window_seconds

        with self.lock:
            self.requests[key] = [t for t in self.requests[key] if t > window_start]
            return max(0, max_requests - len(self.requests[key]))

    def reset(self, key: str):
        with self.lock:
            self.requests.pop(key, None)


# =============================================================================
# SINGLETON & HELPERS
# =============================================================================

_rate_limiter = None


def get_rate_limiter():
    """Retourne l'instance singleton du rate limiter"""
    global _rate_limiter
    if _rate_limiter is None:
        _rate_limiter = RedisRateLimiter()
        if not _rate_limiter.enabled:
            _rate_limiter = MemoryRateLimiter()
    return _rate_limiter


def rate_limit_key(request, prefix: str = "api") -> str:
    """
    Génère une clé unique pour le rate limiting.

    Priorité:
    1. User ID (si authentifié)
    2. Session ID
    3. IP address
    """
    # Utilisateur authentifié
    if hasattr(request, 'env') and request.env.user and not request.env.user._is_public():
        return f"{prefix}:user:{request.env.user.id}"

    # Session
    if hasattr(request, 'session') and request.session.sid:
        return f"{prefix}:session:{request.session.sid}"

    # IP (avec proxy)
    ip = request.httprequest.headers.get('X-Forwarded-For', '').split(',')[0].strip()
    if not ip:
        ip = request.httprequest.remote_addr or 'unknown'

    return f"{prefix}:ip:{ip}"


def check_rate_limit(request, limit_config: tuple = None, endpoint_name: str = "api"):
    """
    Vérifie le rate limit pour une requête.

    Args:
        request: Objet request Odoo
        limit_config: Tuple (max_requests, window_seconds) ou None pour défaut
        endpoint_name: Nom de l'endpoint pour la clé

    Returns:
        dict | None: Erreur si limit dépassée, None si OK
    """
    if limit_config is None:
        limit_config = RateLimitConfig.DEFAULT

    max_requests, window_seconds = limit_config
    key = rate_limit_key(request, endpoint_name)
    limiter = get_rate_limiter()

    allowed, remaining, reset_time = limiter.is_allowed(key, max_requests, window_seconds)

    if not allowed:
        return {
            'success': False,
            'error': 'Too many requests. Please try again later.',
            'error_code': 'RATE_LIMIT_EXCEEDED',
            'retry_after': reset_time - int(time.time()),
            'limit': max_requests,
            'window': window_seconds,
        }

    return None


def add_rate_limit_headers(response, key: str, limit_config: tuple):
    """Ajoute les headers de rate limit à la réponse"""
    max_requests, window_seconds = limit_config
    limiter = get_rate_limiter()
    remaining = limiter.get_remaining(key, max_requests, window_seconds)

    response.headers['X-RateLimit-Limit'] = str(max_requests)
    response.headers['X-RateLimit-Remaining'] = str(remaining)
    response.headers['X-RateLimit-Window'] = str(window_seconds)

    return response


# =============================================================================
# DÉCORATEUR POUR ENDPOINTS
# =============================================================================

def rate_limited(limit_config: tuple = None, endpoint_name: str = None):
    """
    Décorateur pour appliquer le rate limiting à un endpoint.

    Usage:
        @http.route('/api/products', ...)
        @rate_limited(RateLimitConfig.PRODUCTS_LIST, 'products')
        def get_products(self, **kwargs):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            from odoo.http import request

            config = limit_config or RateLimitConfig.DEFAULT
            name = endpoint_name or func.__name__

            error = check_rate_limit(request, config, name)
            if error:
                import json
                response = request.make_response(
                    json.dumps(error),
                    headers=[('Content-Type', 'application/json')]
                )
                response.status_code = 429
                return response

            return func(self, *args, **kwargs)

        return wrapper
    return decorator
