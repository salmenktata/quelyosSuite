# -*- coding: utf-8 -*-
"""
A/B Testing pour Quelyos API

Tests A/B côté serveur:
- Assignation cohérente par utilisateur
- Variants multiples avec poids
- Tracking des conversions
- Analytics intégrées
"""

import os
import json
import hashlib
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime
from functools import wraps

_logger = logging.getLogger(__name__)

REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
AB_PREFIX = 'quelyos:ab:'


@dataclass
class Variant:
    """Variante d'un test A/B"""
    name: str
    weight: int = 1  # Poids relatif
    config: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Experiment:
    """Expérimentation A/B"""
    id: str
    name: str
    variants: List[Variant]
    enabled: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    targeting: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        # Calculer poids total
        self._total_weight = sum(v.weight for v in self.variants)

    def get_variant_for_user(self, user_id: str) -> Variant:
        """Assigne une variante de manière déterministe"""
        # Hash cohérent: même user = même variante
        hash_input = f"{self.id}:{user_id}"
        hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
        bucket = hash_value % self._total_weight

        cumulative = 0
        for variant in self.variants:
            cumulative += variant.weight
            if bucket < cumulative:
                return variant

        return self.variants[-1]


class ABTestingManager:
    """Gestionnaire des tests A/B"""

    def __init__(self):
        self._redis = None
        self._experiments: Dict[str, Experiment] = {}
        self._init_redis()

    def _init_redis(self):
        try:
            import redis
            self._redis = redis.from_url(REDIS_URL)
            self._redis.ping()
        except Exception as e:
            _logger.warning(f"Redis not available for A/B testing: {e}")

    def register_experiment(self, experiment: Experiment):
        """Enregistre une expérimentation"""
        self._experiments[experiment.id] = experiment

        # Persister dans Redis
        if self._redis:
            key = f"{AB_PREFIX}experiments:{experiment.id}"
            self._redis.hset(key, mapping={
                'name': experiment.name,
                'enabled': str(experiment.enabled),
                'variants': json.dumps([
                    {'name': v.name, 'weight': v.weight, 'config': v.config}
                    for v in experiment.variants
                ]),
            })

        _logger.info(f"Registered A/B experiment: {experiment.id}")

    def get_experiment(self, experiment_id: str) -> Optional[Experiment]:
        """Récupère une expérimentation"""
        return self._experiments.get(experiment_id)

    def get_variant(
        self,
        experiment_id: str,
        user_id: str,
        context: Dict[str, Any] = None
    ) -> Optional[Variant]:
        """
        Obtient la variante pour un utilisateur.

        Args:
            experiment_id: ID de l'expérimentation
            user_id: ID de l'utilisateur
            context: Contexte pour le ciblage

        Returns:
            Variante assignée ou None
        """
        experiment = self._experiments.get(experiment_id)
        if not experiment or not experiment.enabled:
            return None

        # Vérifier dates
        now = datetime.utcnow()
        if experiment.start_date and now < experiment.start_date:
            return None
        if experiment.end_date and now > experiment.end_date:
            return None

        # Vérifier ciblage
        if experiment.targeting and context:
            if not self._matches_targeting(experiment.targeting, context):
                return None

        # Obtenir variante
        variant = experiment.get_variant_for_user(user_id)

        # Tracker l'exposition
        self._track_exposure(experiment_id, user_id, variant.name)

        return variant

    def _matches_targeting(
        self,
        targeting: Dict[str, Any],
        context: Dict[str, Any]
    ) -> bool:
        """Vérifie si le contexte correspond au ciblage"""
        for key, rule in targeting.items():
            value = context.get(key)

            if isinstance(rule, list):
                # Liste de valeurs acceptées
                if value not in rule:
                    return False
            elif isinstance(rule, dict):
                # Règles complexes
                if 'min' in rule and value < rule['min']:
                    return False
                if 'max' in rule and value > rule['max']:
                    return False
                if 'regex' in rule:
                    import re
                    if not re.match(rule['regex'], str(value)):
                        return False
            else:
                # Valeur exacte
                if value != rule:
                    return False

        return True

    def _track_exposure(
        self,
        experiment_id: str,
        user_id: str,
        variant_name: str
    ):
        """Enregistre une exposition"""
        if not self._redis:
            return

        now = datetime.utcnow()
        day_key = now.strftime('%Y-%m-%d')

        # Compteur d'expositions par variante par jour
        key = f"{AB_PREFIX}exposures:{experiment_id}:{day_key}"
        self._redis.hincrby(key, variant_name, 1)
        self._redis.expire(key, 86400 * 90)  # 90 jours

        # Tracking par utilisateur (pour éviter double comptage)
        user_key = f"{AB_PREFIX}users:{experiment_id}:{user_id}"
        if not self._redis.exists(user_key):
            self._redis.hset(user_key, mapping={
                'variant': variant_name,
                'first_seen': now.isoformat(),
            })
            self._redis.expire(user_key, 86400 * 90)

    def track_conversion(
        self,
        experiment_id: str,
        user_id: str,
        event: str,
        value: float = 1.0
    ):
        """
        Enregistre une conversion.

        Args:
            experiment_id: ID de l'expérimentation
            user_id: ID de l'utilisateur
            event: Type d'événement (purchase, signup, etc.)
            value: Valeur de la conversion
        """
        if not self._redis:
            return

        # Récupérer la variante de l'utilisateur
        user_key = f"{AB_PREFIX}users:{experiment_id}:{user_id}"
        user_data = self._redis.hgetall(user_key)

        if not user_data:
            return

        variant = user_data.get(b'variant', b'').decode()
        if not variant:
            return

        now = datetime.utcnow()
        day_key = now.strftime('%Y-%m-%d')

        # Compteur de conversions
        conv_key = f"{AB_PREFIX}conversions:{experiment_id}:{event}:{day_key}"
        self._redis.hincrbyfloat(conv_key, variant, value)
        self._redis.expire(conv_key, 86400 * 90)

        _logger.debug(
            f"Tracked conversion: {experiment_id}/{event} "
            f"user={user_id} variant={variant} value={value}"
        )

    def get_results(self, experiment_id: str) -> Dict[str, Any]:
        """Récupère les résultats d'une expérimentation"""
        if not self._redis:
            return {}

        experiment = self._experiments.get(experiment_id)
        if not experiment:
            return {}

        results = {
            'experiment_id': experiment_id,
            'name': experiment.name,
            'variants': {},
        }

        # Agréger les expositions
        pattern = f"{AB_PREFIX}exposures:{experiment_id}:*"
        for key in self._redis.scan_iter(pattern):
            data = self._redis.hgetall(key)
            for variant, count in data.items():
                v_name = variant.decode()
                if v_name not in results['variants']:
                    results['variants'][v_name] = {
                        'exposures': 0,
                        'conversions': {},
                    }
                results['variants'][v_name]['exposures'] += int(count)

        # Agréger les conversions
        pattern = f"{AB_PREFIX}conversions:{experiment_id}:*"
        for key in self._redis.scan_iter(pattern):
            # Extraire event du key
            parts = key.decode().split(':')
            event = parts[-2] if len(parts) > 2 else 'default'

            data = self._redis.hgetall(key)
            for variant, value in data.items():
                v_name = variant.decode()
                if v_name in results['variants']:
                    if event not in results['variants'][v_name]['conversions']:
                        results['variants'][v_name]['conversions'][event] = 0
                    results['variants'][v_name]['conversions'][event] += float(value)

        # Calculer taux de conversion
        for v_name, v_data in results['variants'].items():
            exposures = v_data['exposures']
            for event, conversions in v_data['conversions'].items():
                if exposures > 0:
                    v_data[f'{event}_rate'] = conversions / exposures

        return results


# Singleton
_ab_manager = None


def get_ab_manager() -> ABTestingManager:
    """Retourne le gestionnaire A/B singleton"""
    global _ab_manager
    if _ab_manager is None:
        _ab_manager = ABTestingManager()
    return _ab_manager


def ab_test(experiment_id: str, default_variant: str = 'control'):
    """
    Décorateur pour appliquer un test A/B.

    Usage:
        @ab_test('checkout_flow')
        def checkout(self, variant, **kwargs):
            if variant.name == 'new_checkout':
                return self._new_checkout(**kwargs)
            return self._old_checkout(**kwargs)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            from odoo.http import request

            # Obtenir user_id
            user_id = str(request.env.uid) if hasattr(request, 'env') else 'anonymous'

            # Obtenir variante
            manager = get_ab_manager()
            variant = manager.get_variant(experiment_id, user_id)

            if not variant:
                # Créer variante par défaut
                variant = Variant(name=default_variant)

            # Injecter la variante
            kwargs['variant'] = variant

            return func(self, *args, **kwargs)

        return wrapper
    return decorator
