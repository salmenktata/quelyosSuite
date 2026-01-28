# -*- coding: utf-8 -*-
"""
Request Throttling per User pour Quelyos ERP

Limitation des requêtes par utilisateur avec:
- Quotas par utilisateur
- Quotas par API key
- Quotas par plan (free/pro/enterprise)
- Burst handling
- Overflow graceful degradation
"""

import os
import time
import logging
from typing import Dict, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
from functools import wraps

_logger = logging.getLogger(__name__)

# Configuration
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
THROTTLE_PREFIX = 'quelyos:throttle:'


# =============================================================================
# PLANS & QUOTAS
# =============================================================================

class Plan(Enum):
    """Plans utilisateur"""
    FREE = 'free'
    PRO = 'pro'
    ENTERPRISE = 'enterprise'
    UNLIMITED = 'unlimited'


@dataclass
class Quota:
    """Configuration de quota"""
    requests_per_minute: int
    requests_per_hour: int
    requests_per_day: int
    burst_size: int = 10  # Requêtes en burst autorisées
    burst_period: int = 1  # Période du burst en secondes


# Quotas par plan
PLAN_QUOTAS: Dict[Plan, Quota] = {
    Plan.FREE: Quota(
        requests_per_minute=30,
        requests_per_hour=500,
        requests_per_day=5000,
        burst_size=5,
    ),
    Plan.PRO: Quota(
        requests_per_minute=100,
        requests_per_hour=3000,
        requests_per_day=50000,
        burst_size=20,
    ),
    Plan.ENTERPRISE: Quota(
        requests_per_minute=500,
        requests_per_hour=20000,
        requests_per_day=500000,
        burst_size=50,
    ),
    Plan.UNLIMITED: Quota(
        requests_per_minute=10000,
        requests_per_hour=1000000,
        requests_per_day=10000000,
        burst_size=1000,
    ),
}


# =============================================================================
# THROTTLER
# =============================================================================

class UserThrottler:
    """
    Throttler par utilisateur.

    Usage:
        throttler = UserThrottler()

        # Vérifier si la requête est autorisée
        allowed, info = throttler.check(user_id='123', plan=Plan.PRO)

        if not allowed:
            return {'error': 'Rate limit exceeded', 'retry_after': info['retry_after']}

        # Ou avec décorateur
        @throttle_user(plan_getter=get_user_plan)
        def my_endpoint(self, **kwargs):
            ...
    """

    def __init__(self):
        self._redis = None
        self._init_redis()

    def _init_redis(self):
        try:
            import redis
            self._redis = redis.from_url(REDIS_URL)
            self._redis.ping()
        except Exception as e:
            _logger.warning(f"Redis not available for throttling: {e}")

    def check(
        self,
        user_id: str,
        plan: Plan = Plan.FREE,
        endpoint: str = None
    ) -> Tuple[bool, Dict]:
        """
        Vérifie si la requête est autorisée.

        Args:
            user_id: Identifiant utilisateur
            plan: Plan de l'utilisateur
            endpoint: Endpoint appelé (pour stats)

        Returns:
            Tuple (autorisé, info)
        """
        if not self._redis:
            return True, {}

        quota = PLAN_QUOTAS.get(plan, PLAN_QUOTAS[Plan.FREE])
        now = time.time()

        # Clés Redis
        minute_key = f"{THROTTLE_PREFIX}{user_id}:minute:{int(now // 60)}"
        hour_key = f"{THROTTLE_PREFIX}{user_id}:hour:{int(now // 3600)}"
        day_key = f"{THROTTLE_PREFIX}{user_id}:day:{int(now // 86400)}"
        burst_key = f"{THROTTLE_PREFIX}{user_id}:burst"

        pipe = self._redis.pipeline()

        # Incrémenter les compteurs
        pipe.incr(minute_key)
        pipe.expire(minute_key, 60)
        pipe.incr(hour_key)
        pipe.expire(hour_key, 3600)
        pipe.incr(day_key)
        pipe.expire(day_key, 86400)

        # Burst: sliding window
        pipe.zremrangebyscore(burst_key, 0, now - quota.burst_period)
        pipe.zadd(burst_key, {str(now): now})
        pipe.zcard(burst_key)
        pipe.expire(burst_key, quota.burst_period + 1)

        results = pipe.execute()

        minute_count = results[0]
        hour_count = results[2]
        day_count = results[4]
        burst_count = results[7]

        # Vérifier les limites
        info = {
            'minute': {'current': minute_count, 'limit': quota.requests_per_minute},
            'hour': {'current': hour_count, 'limit': quota.requests_per_hour},
            'day': {'current': day_count, 'limit': quota.requests_per_day},
            'burst': {'current': burst_count, 'limit': quota.burst_size},
        }

        # Vérifier burst
        if burst_count > quota.burst_size:
            info['exceeded'] = 'burst'
            info['retry_after'] = quota.burst_period
            return False, info

        # Vérifier minute
        if minute_count > quota.requests_per_minute:
            info['exceeded'] = 'minute'
            info['retry_after'] = 60 - (now % 60)
            return False, info

        # Vérifier heure
        if hour_count > quota.requests_per_hour:
            info['exceeded'] = 'hour'
            info['retry_after'] = 3600 - (now % 3600)
            return False, info

        # Vérifier jour
        if day_count > quota.requests_per_day:
            info['exceeded'] = 'day'
            info['retry_after'] = 86400 - (now % 86400)
            return False, info

        return True, info

    def get_usage(self, user_id: str) -> Dict:
        """Retourne les statistiques d'usage actuelles"""
        if not self._redis:
            return {}

        now = time.time()

        minute_key = f"{THROTTLE_PREFIX}{user_id}:minute:{int(now // 60)}"
        hour_key = f"{THROTTLE_PREFIX}{user_id}:hour:{int(now // 3600)}"
        day_key = f"{THROTTLE_PREFIX}{user_id}:day:{int(now // 86400)}"

        pipe = self._redis.pipeline()
        pipe.get(minute_key)
        pipe.get(hour_key)
        pipe.get(day_key)
        results = pipe.execute()

        return {
            'minute': int(results[0] or 0),
            'hour': int(results[1] or 0),
            'day': int(results[2] or 0),
        }

    def reset(self, user_id: str, window: str = 'all') -> bool:
        """Réinitialise les compteurs d'un utilisateur"""
        if not self._redis:
            return True

        now = time.time()

        if window == 'all':
            pattern = f"{THROTTLE_PREFIX}{user_id}:*"
            keys = self._redis.keys(pattern)
            if keys:
                self._redis.delete(*keys)
        elif window == 'minute':
            key = f"{THROTTLE_PREFIX}{user_id}:minute:{int(now // 60)}"
            self._redis.delete(key)
        elif window == 'hour':
            key = f"{THROTTLE_PREFIX}{user_id}:hour:{int(now // 3600)}"
            self._redis.delete(key)

        return True


# Instance singleton
_throttler = None


def get_throttler() -> UserThrottler:
    """Retourne l'instance du throttler"""
    global _throttler
    if _throttler is None:
        _throttler = UserThrottler()
    return _throttler


# =============================================================================
# DÉCORATEUR
# =============================================================================

def throttle_user(
    plan_getter: callable = None,
    user_getter: callable = None,
    on_exceeded: callable = None
):
    """
    Décorateur pour throttler par utilisateur.

    Args:
        plan_getter: Fonction (request) -> Plan
        user_getter: Fonction (request) -> user_id
        on_exceeded: Fonction appelée quand limite atteinte

    Usage:
        def get_user_plan(request):
            user = request.env.user
            return Plan.PRO if user.has_group('sales.group_sale_manager') else Plan.FREE

        @throttle_user(plan_getter=get_user_plan)
        @http.route('/api/products', ...)
        def get_products(self, **kwargs):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            from odoo.http import request

            # Obtenir l'utilisateur
            if user_getter:
                user_id = user_getter(request)
            else:
                user_id = str(request.env.uid) if hasattr(request, 'env') else 'anonymous'

            # Obtenir le plan
            if plan_getter:
                plan = plan_getter(request)
            else:
                plan = Plan.FREE

            # Vérifier le throttling
            throttler = get_throttler()
            allowed, info = throttler.check(user_id, plan)

            if not allowed:
                if on_exceeded:
                    return on_exceeded(info)

                return {
                    'success': False,
                    'error': 'Rate limit exceeded',
                    'error_code': 'RATE_LIMIT_EXCEEDED',
                    'exceeded': info.get('exceeded'),
                    'retry_after': info.get('retry_after'),
                    'limits': info,
                }

            # Ajouter les headers de rate limit à la réponse
            # (si le framework le supporte)

            return func(self, *args, **kwargs)

        return wrapper
    return decorator


# =============================================================================
# API KEY THROTTLING
# =============================================================================

class APIKeyThrottler:
    """
    Throttler par API Key.

    Permet des quotas différents par clé API.
    """

    def __init__(self):
        self._throttler = get_throttler()
        self._key_plans: Dict[str, Plan] = {}

    def register_key(self, api_key: str, plan: Plan):
        """Enregistre une clé API avec son plan"""
        self._key_plans[api_key] = plan

    def check(self, api_key: str) -> Tuple[bool, Dict]:
        """Vérifie si la requête est autorisée pour cette clé"""
        plan = self._key_plans.get(api_key, Plan.FREE)
        return self._throttler.check(f"apikey:{api_key}", plan)


def throttle_api_key():
    """Décorateur pour throttler par API key"""
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            from odoo.http import request

            # Obtenir l'API key
            api_key = request.httprequest.headers.get('X-API-Key', '')
            if not api_key:
                return {
                    'success': False,
                    'error': 'API key required',
                    'error_code': 'API_KEY_REQUIRED',
                }

            # Vérifier
            throttler = APIKeyThrottler()
            allowed, info = throttler.check(api_key)

            if not allowed:
                return {
                    'success': False,
                    'error': 'API rate limit exceeded',
                    'error_code': 'API_RATE_LIMIT_EXCEEDED',
                    'retry_after': info.get('retry_after'),
                }

            return func(self, *args, **kwargs)

        return wrapper
    return decorator
