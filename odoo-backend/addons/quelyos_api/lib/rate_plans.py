# -*- coding: utf-8 -*-
"""
API Rate Plans pour Quelyos ERP

Gestion des plans tarifaires API:
- Plans avec quotas différents
- Billing par usage
- Overage handling
- Usage tracking
- Plan upgrades/downgrades
"""

import os
import time
import json
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from functools import wraps

_logger = logging.getLogger(__name__)

REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
PLANS_PREFIX = 'quelyos:plans:'


# =============================================================================
# PLAN DEFINITIONS
# =============================================================================

class PlanTier(Enum):
    """Niveaux de plans"""
    FREE = 'free'
    STARTER = 'starter'
    PROFESSIONAL = 'professional'
    ENTERPRISE = 'enterprise'
    UNLIMITED = 'unlimited'


@dataclass
class RatePlanLimits:
    """Limites d'un plan"""
    requests_per_minute: int
    requests_per_hour: int
    requests_per_day: int
    requests_per_month: int
    max_payload_size_kb: int = 1024
    max_response_size_kb: int = 5120
    max_batch_size: int = 100
    concurrent_requests: int = 10
    webhooks_enabled: bool = False
    priority_support: bool = False
    sla_uptime: float = 99.0


@dataclass
class RatePlan:
    """Définition d'un plan"""
    tier: PlanTier
    name: str
    description: str
    limits: RatePlanLimits
    price_monthly: float = 0
    price_yearly: float = 0
    overage_price_per_1k: float = 0  # Prix par 1000 requêtes en dépassement
    features: List[str] = field(default_factory=list)
    is_active: bool = True


# Plans prédéfinis
RATE_PLANS: Dict[PlanTier, RatePlan] = {
    PlanTier.FREE: RatePlan(
        tier=PlanTier.FREE,
        name='Free',
        description='Pour les projets personnels et tests',
        limits=RatePlanLimits(
            requests_per_minute=30,
            requests_per_hour=500,
            requests_per_day=5000,
            requests_per_month=100000,
            max_batch_size=10,
            concurrent_requests=2,
        ),
        features=['API REST', 'Documentation', 'Support communautaire'],
    ),
    PlanTier.STARTER: RatePlan(
        tier=PlanTier.STARTER,
        name='Starter',
        description='Pour les petites entreprises',
        limits=RatePlanLimits(
            requests_per_minute=100,
            requests_per_hour=3000,
            requests_per_day=50000,
            requests_per_month=1000000,
            max_batch_size=50,
            concurrent_requests=5,
            webhooks_enabled=True,
        ),
        price_monthly=49,
        price_yearly=490,
        overage_price_per_1k=0.50,
        features=['API REST', 'Webhooks', 'Support email', 'Analytics basique'],
    ),
    PlanTier.PROFESSIONAL: RatePlan(
        tier=PlanTier.PROFESSIONAL,
        name='Professional',
        description='Pour les entreprises en croissance',
        limits=RatePlanLimits(
            requests_per_minute=500,
            requests_per_hour=20000,
            requests_per_day=500000,
            requests_per_month=10000000,
            max_batch_size=100,
            concurrent_requests=20,
            webhooks_enabled=True,
            priority_support=True,
            sla_uptime=99.5,
        ),
        price_monthly=199,
        price_yearly=1990,
        overage_price_per_1k=0.30,
        features=[
            'API REST', 'Webhooks', 'Support prioritaire',
            'Analytics avancé', 'SLA 99.5%', 'Multi-environnements'
        ],
    ),
    PlanTier.ENTERPRISE: RatePlan(
        tier=PlanTier.ENTERPRISE,
        name='Enterprise',
        description='Pour les grandes entreprises',
        limits=RatePlanLimits(
            requests_per_minute=2000,
            requests_per_hour=100000,
            requests_per_day=2000000,
            requests_per_month=50000000,
            max_payload_size_kb=10240,
            max_response_size_kb=51200,
            max_batch_size=500,
            concurrent_requests=100,
            webhooks_enabled=True,
            priority_support=True,
            sla_uptime=99.9,
        ),
        price_monthly=999,
        price_yearly=9990,
        overage_price_per_1k=0.10,
        features=[
            'API REST', 'Webhooks', 'Support dédié 24/7',
            'Analytics temps réel', 'SLA 99.9%', 'IP dédiée',
            'Audit logs', 'SSO/SAML'
        ],
    ),
    PlanTier.UNLIMITED: RatePlan(
        tier=PlanTier.UNLIMITED,
        name='Unlimited',
        description='Usage illimité (interne)',
        limits=RatePlanLimits(
            requests_per_minute=100000,
            requests_per_hour=10000000,
            requests_per_day=100000000,
            requests_per_month=1000000000,
            max_payload_size_kb=102400,
            max_response_size_kb=102400,
            max_batch_size=10000,
            concurrent_requests=1000,
            webhooks_enabled=True,
            priority_support=True,
            sla_uptime=99.99,
        ),
        features=['Tout inclus'],
    ),
}


# =============================================================================
# USAGE TRACKING
# =============================================================================

@dataclass
class UsageRecord:
    """Enregistrement d'usage"""
    api_key: str
    plan: PlanTier
    period: str  # YYYY-MM
    requests_count: int = 0
    bandwidth_bytes: int = 0
    errors_count: int = 0
    overage_requests: int = 0
    overage_cost: float = 0


class UsageTracker:
    """
    Tracker d'usage API.

    Usage:
        tracker = UsageTracker()

        # Enregistrer une requête
        tracker.record_request(api_key, bytes_sent=1024, bytes_received=2048)

        # Obtenir l'usage
        usage = tracker.get_usage(api_key)

        # Vérifier les limites
        allowed, info = tracker.check_limits(api_key)
    """

    def __init__(self):
        self._redis = None
        self._init_redis()

    def _init_redis(self):
        try:
            import redis
            self._redis = redis.from_url(REDIS_URL)
        except Exception as e:
            _logger.warning(f"Redis not available: {e}")

    def record_request(
        self,
        api_key: str,
        bytes_sent: int = 0,
        bytes_received: int = 0,
        is_error: bool = False
    ):
        """Enregistre une requête"""
        if not self._redis:
            return

        now = datetime.utcnow()
        period = now.strftime('%Y-%m')

        pipe = self._redis.pipeline()

        # Compteurs par période
        day_key = f"{PLANS_PREFIX}usage:{api_key}:{now.strftime('%Y-%m-%d')}"
        month_key = f"{PLANS_PREFIX}usage:{api_key}:{period}"

        pipe.hincrby(day_key, 'requests', 1)
        pipe.hincrby(day_key, 'bandwidth', bytes_sent + bytes_received)
        pipe.expire(day_key, 86400 * 35)  # 35 jours

        pipe.hincrby(month_key, 'requests', 1)
        pipe.hincrby(month_key, 'bandwidth', bytes_sent + bytes_received)
        pipe.expire(month_key, 86400 * 400)  # ~13 mois

        if is_error:
            pipe.hincrby(day_key, 'errors', 1)
            pipe.hincrby(month_key, 'errors', 1)

        # Rate limiting windows
        minute_key = f"{PLANS_PREFIX}rate:{api_key}:minute:{now.minute}"
        hour_key = f"{PLANS_PREFIX}rate:{api_key}:hour:{now.hour}"

        pipe.incr(minute_key)
        pipe.expire(minute_key, 60)
        pipe.incr(hour_key)
        pipe.expire(hour_key, 3600)

        pipe.execute()

    def get_usage(self, api_key: str, period: str = None) -> Dict:
        """Récupère l'usage pour une période"""
        if not self._redis:
            return {}

        period = period or datetime.utcnow().strftime('%Y-%m')
        month_key = f"{PLANS_PREFIX}usage:{api_key}:{period}"

        data = self._redis.hgetall(month_key)

        return {
            'period': period,
            'requests': int(data.get(b'requests', 0)),
            'bandwidth_bytes': int(data.get(b'bandwidth', 0)),
            'errors': int(data.get(b'errors', 0)),
        }

    def get_current_rates(self, api_key: str) -> Dict:
        """Récupère les taux actuels"""
        if not self._redis:
            return {}

        now = datetime.utcnow()

        minute_key = f"{PLANS_PREFIX}rate:{api_key}:minute:{now.minute}"
        hour_key = f"{PLANS_PREFIX}rate:{api_key}:hour:{now.hour}"
        day_key = f"{PLANS_PREFIX}usage:{api_key}:{now.strftime('%Y-%m-%d')}"
        month_key = f"{PLANS_PREFIX}usage:{api_key}:{now.strftime('%Y-%m')}"

        pipe = self._redis.pipeline()
        pipe.get(minute_key)
        pipe.get(hour_key)
        pipe.hget(day_key, 'requests')
        pipe.hget(month_key, 'requests')
        results = pipe.execute()

        return {
            'requests_this_minute': int(results[0] or 0),
            'requests_this_hour': int(results[1] or 0),
            'requests_today': int(results[2] or 0),
            'requests_this_month': int(results[3] or 0),
        }

    def check_limits(self, api_key: str, plan: PlanTier) -> tuple:
        """
        Vérifie si les limites sont respectées.

        Returns:
            Tuple (allowed, info)
        """
        rate_plan = RATE_PLANS.get(plan)
        if not rate_plan:
            return False, {'error': 'Invalid plan'}

        rates = self.get_current_rates(api_key)
        limits = rate_plan.limits

        info = {
            'plan': plan.value,
            'rates': rates,
            'limits': {
                'minute': limits.requests_per_minute,
                'hour': limits.requests_per_hour,
                'day': limits.requests_per_day,
                'month': limits.requests_per_month,
            },
        }

        # Vérifier minute
        if rates['requests_this_minute'] >= limits.requests_per_minute:
            info['exceeded'] = 'minute'
            info['retry_after'] = 60
            return False, info

        # Vérifier heure
        if rates['requests_this_hour'] >= limits.requests_per_hour:
            info['exceeded'] = 'hour'
            info['retry_after'] = 3600
            return False, info

        # Vérifier jour
        if rates['requests_today'] >= limits.requests_per_day:
            info['exceeded'] = 'day'
            info['retry_after'] = 86400
            return False, info

        # Vérifier mois (avec overage possible)
        if rates['requests_this_month'] >= limits.requests_per_month:
            if rate_plan.overage_price_per_1k > 0:
                info['overage'] = True
                info['overage_count'] = rates['requests_this_month'] - limits.requests_per_month
            else:
                info['exceeded'] = 'month'
                return False, info

        return True, info

    def calculate_overage_cost(self, api_key: str, plan: PlanTier, period: str = None) -> float:
        """Calcule le coût du dépassement"""
        rate_plan = RATE_PLANS.get(plan)
        if not rate_plan or rate_plan.overage_price_per_1k <= 0:
            return 0

        usage = self.get_usage(api_key, period)
        limit = rate_plan.limits.requests_per_month

        overage = max(0, usage['requests'] - limit)
        cost = (overage / 1000) * rate_plan.overage_price_per_1k

        return round(cost, 2)


# =============================================================================
# SUBSCRIPTION MANAGER
# =============================================================================

@dataclass
class Subscription:
    """Abonnement d'un client"""
    id: str
    api_key: str
    plan: PlanTier
    status: str  # active, cancelled, suspended
    started_at: str
    expires_at: Optional[str] = None
    billing_cycle: str = 'monthly'  # monthly, yearly
    metadata: Dict = field(default_factory=dict)


class SubscriptionManager:
    """
    Gestionnaire d'abonnements.

    Usage:
        manager = SubscriptionManager()

        # Créer un abonnement
        sub = manager.create('api_key_123', PlanTier.PROFESSIONAL)

        # Mettre à niveau
        manager.upgrade('sub_id', PlanTier.ENTERPRISE)

        # Annuler
        manager.cancel('sub_id')
    """

    def __init__(self):
        self._redis = None
        self._init_redis()

    def _init_redis(self):
        try:
            import redis
            self._redis = redis.from_url(REDIS_URL)
        except Exception:
            pass

    def create(
        self,
        api_key: str,
        plan: PlanTier,
        billing_cycle: str = 'monthly'
    ) -> Subscription:
        """Crée un nouvel abonnement"""
        import uuid

        sub = Subscription(
            id=f"sub_{uuid.uuid4().hex[:16]}",
            api_key=api_key,
            plan=plan,
            status='active',
            started_at=datetime.utcnow().isoformat(),
            billing_cycle=billing_cycle,
        )

        if self._redis:
            self._redis.hset(
                f"{PLANS_PREFIX}subscriptions",
                api_key,
                json.dumps({
                    'id': sub.id,
                    'plan': plan.value,
                    'status': sub.status,
                    'started_at': sub.started_at,
                    'billing_cycle': billing_cycle,
                })
            )

        return sub

    def get(self, api_key: str) -> Optional[Subscription]:
        """Récupère un abonnement"""
        if not self._redis:
            return None

        data = self._redis.hget(f"{PLANS_PREFIX}subscriptions", api_key)
        if not data:
            return None

        d = json.loads(data)
        return Subscription(
            id=d['id'],
            api_key=api_key,
            plan=PlanTier(d['plan']),
            status=d['status'],
            started_at=d['started_at'],
            billing_cycle=d.get('billing_cycle', 'monthly'),
        )

    def upgrade(self, api_key: str, new_plan: PlanTier) -> bool:
        """Met à niveau un abonnement"""
        sub = self.get(api_key)
        if not sub:
            return False

        sub.plan = new_plan

        if self._redis:
            self._redis.hset(
                f"{PLANS_PREFIX}subscriptions",
                api_key,
                json.dumps({
                    'id': sub.id,
                    'plan': new_plan.value,
                    'status': sub.status,
                    'started_at': sub.started_at,
                    'billing_cycle': sub.billing_cycle,
                })
            )

        _logger.info(f"Subscription {api_key} upgraded to {new_plan.value}")
        return True

    def cancel(self, api_key: str) -> bool:
        """Annule un abonnement"""
        sub = self.get(api_key)
        if not sub:
            return False

        sub.status = 'cancelled'

        if self._redis:
            self._redis.hset(
                f"{PLANS_PREFIX}subscriptions",
                api_key,
                json.dumps({
                    'id': sub.id,
                    'plan': sub.plan.value,
                    'status': 'cancelled',
                    'started_at': sub.started_at,
                    'billing_cycle': sub.billing_cycle,
                })
            )

        return True


# =============================================================================
# DÉCORATEUR
# =============================================================================

def check_rate_plan(get_api_key: callable = None, get_plan: callable = None):
    """
    Décorateur pour vérifier le plan et les limites.

    Usage:
        @check_rate_plan(
            get_api_key=lambda r: r.headers.get('X-API-Key'),
            get_plan=lambda r: get_plan_for_key(r.headers.get('X-API-Key'))
        )
        def my_endpoint(self, **kwargs):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            from odoo.http import request

            # Obtenir l'API key
            api_key = (
                get_api_key(request) if get_api_key
                else request.httprequest.headers.get('X-API-Key')
            )

            if not api_key:
                return {
                    'success': False,
                    'error': 'API key required',
                    'error_code': 'API_KEY_REQUIRED',
                }

            # Obtenir le plan
            plan = (
                get_plan(request) if get_plan
                else PlanTier.FREE
            )

            # Vérifier les limites
            tracker = UsageTracker()
            allowed, info = tracker.check_limits(api_key, plan)

            if not allowed:
                return {
                    'success': False,
                    'error': 'Rate limit exceeded',
                    'error_code': 'RATE_LIMIT_EXCEEDED',
                    'plan': plan.value,
                    'exceeded': info.get('exceeded'),
                    'retry_after': info.get('retry_after'),
                }

            # Exécuter et tracker
            result = func(self, *args, **kwargs)

            # Enregistrer l'usage
            is_error = isinstance(result, dict) and not result.get('success', True)
            tracker.record_request(api_key, is_error=is_error)

            return result

        return wrapper
    return decorator


# =============================================================================
# HELPERS
# =============================================================================

def get_plan(tier: PlanTier) -> RatePlan:
    """Récupère un plan"""
    return RATE_PLANS.get(tier)


def get_all_plans() -> List[Dict]:
    """Retourne tous les plans disponibles"""
    return [
        {
            'tier': p.tier.value,
            'name': p.name,
            'description': p.description,
            'price_monthly': p.price_monthly,
            'price_yearly': p.price_yearly,
            'features': p.features,
            'limits': {
                'requests_per_month': p.limits.requests_per_month,
                'requests_per_day': p.limits.requests_per_day,
            },
        }
        for p in RATE_PLANS.values()
        if p.is_active
    ]
