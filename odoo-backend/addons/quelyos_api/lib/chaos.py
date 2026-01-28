# -*- coding: utf-8 -*-
"""
Chaos Engineering pour Quelyos API

Tests de résilience automatisés:
- Injection de latence
- Simulation de pannes
- Tests de charge
- Validation des fallbacks
"""

import os
import random
import logging
import time
from typing import Dict, Any, Optional, Callable, List
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
from functools import wraps

_logger = logging.getLogger(__name__)

REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
CHAOS_PREFIX = 'quelyos:chaos:'

# Activer uniquement en dev/staging
CHAOS_ENABLED = os.environ.get('CHAOS_ENABLED', 'false').lower() == 'true'


class ChaosType(Enum):
    """Types de chaos"""
    LATENCY = 'latency'           # Injection de latence
    ERROR = 'error'               # Injection d'erreurs
    TIMEOUT = 'timeout'           # Simulation timeout
    PARTIAL_FAILURE = 'partial'   # Échec partiel
    RESOURCE_EXHAUSTION = 'resource'  # Épuisement ressources


@dataclass
class ChaosExperiment:
    """Expérience de chaos"""
    id: str
    name: str
    type: ChaosType
    target: str  # Service/endpoint ciblé
    probability: float = 0.1  # 10% par défaut
    config: Dict[str, Any] = None
    enabled: bool = False
    start_time: datetime = None
    end_time: datetime = None


class ChaosMonkey:
    """Gestionnaire de chaos engineering"""

    def __init__(self):
        self._redis = None
        self._experiments: Dict[str, ChaosExperiment] = {}
        self._init_redis()

    def _init_redis(self):
        try:
            import redis
            self._redis = redis.from_url(REDIS_URL)
            self._redis.ping()
        except Exception as e:
            _logger.warning(f"Redis not available for chaos: {e}")

    def register_experiment(self, experiment: ChaosExperiment):
        """Enregistre une expérience de chaos"""
        if not CHAOS_ENABLED:
            _logger.warning("Chaos engineering disabled. Set CHAOS_ENABLED=true")
            return

        self._experiments[experiment.id] = experiment
        _logger.info(f"Registered chaos experiment: {experiment.name}")

    def enable_experiment(self, experiment_id: str, duration_minutes: int = 10):
        """Active une expérience pour une durée limitée"""
        if experiment_id not in self._experiments:
            return False

        exp = self._experiments[experiment_id]
        exp.enabled = True
        exp.start_time = datetime.utcnow()
        exp.end_time = exp.start_time + timedelta(minutes=duration_minutes)

        _logger.warning(
            f"CHAOS ENABLED: {exp.name} for {duration_minutes} minutes"
        )

        if self._redis:
            self._redis.setex(
                f"{CHAOS_PREFIX}active:{experiment_id}",
                duration_minutes * 60,
                'enabled'
            )

        return True

    def disable_experiment(self, experiment_id: str):
        """Désactive une expérience"""
        if experiment_id in self._experiments:
            self._experiments[experiment_id].enabled = False

            if self._redis:
                self._redis.delete(f"{CHAOS_PREFIX}active:{experiment_id}")

            _logger.info(f"Chaos experiment disabled: {experiment_id}")

    def should_inject(self, target: str) -> Optional[ChaosExperiment]:
        """Vérifie si on doit injecter du chaos"""
        if not CHAOS_ENABLED:
            return None

        now = datetime.utcnow()

        for exp in self._experiments.values():
            if not exp.enabled:
                continue

            # Vérifier durée
            if exp.end_time and now > exp.end_time:
                exp.enabled = False
                continue

            # Vérifier target
            if exp.target != '*' and exp.target != target:
                continue

            # Probabilité
            if random.random() < exp.probability:
                return exp

        return None

    def inject_latency(self, min_ms: int = 100, max_ms: int = 2000):
        """Injecte de la latence"""
        delay = random.randint(min_ms, max_ms) / 1000
        _logger.debug(f"Chaos: Injecting {delay*1000:.0f}ms latency")
        time.sleep(delay)

    def inject_error(self, error_rate: float = 0.1) -> bool:
        """Retourne True si on doit lever une erreur"""
        return random.random() < error_rate

    def get_status(self) -> Dict[str, Any]:
        """Retourne le statut du chaos monkey"""
        return {
            'enabled': CHAOS_ENABLED,
            'experiments': {
                exp_id: {
                    'name': exp.name,
                    'type': exp.type.value,
                    'target': exp.target,
                    'enabled': exp.enabled,
                    'probability': exp.probability,
                }
                for exp_id, exp in self._experiments.items()
            },
        }


# Singleton
_chaos_monkey = None


def get_chaos_monkey() -> ChaosMonkey:
    """Retourne le chaos monkey singleton"""
    global _chaos_monkey
    if _chaos_monkey is None:
        _chaos_monkey = ChaosMonkey()
    return _chaos_monkey


def chaos_enabled(target: str = '*'):
    """
    Décorateur pour activer le chaos sur un endpoint.

    Usage:
        @chaos_enabled('products')
        def get_products(self):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            if not CHAOS_ENABLED:
                return func(self, *args, **kwargs)

            monkey = get_chaos_monkey()
            experiment = monkey.should_inject(target)

            if experiment:
                if experiment.type == ChaosType.LATENCY:
                    config = experiment.config or {}
                    monkey.inject_latency(
                        min_ms=config.get('min_ms', 100),
                        max_ms=config.get('max_ms', 2000)
                    )

                elif experiment.type == ChaosType.ERROR:
                    raise Exception(f"Chaos injection: Simulated error for {target}")

                elif experiment.type == ChaosType.TIMEOUT:
                    config = experiment.config or {}
                    time.sleep(config.get('timeout', 30))

                elif experiment.type == ChaosType.PARTIAL_FAILURE:
                    # Exécuter mais corrompre résultat
                    result = func(self, *args, **kwargs)
                    if isinstance(result, dict):
                        result['_chaos_partial'] = True
                        # Supprimer certaines clés aléatoirement
                        keys = list(result.keys())
                        for key in random.sample(keys, min(2, len(keys))):
                            if key != 'success':
                                result.pop(key, None)
                    return result

            return func(self, *args, **kwargs)

        return wrapper
    return decorator


# Expériences pré-configurées
DEFAULT_EXPERIMENTS = [
    ChaosExperiment(
        id='latency_spike',
        name='Latency Spike',
        type=ChaosType.LATENCY,
        target='*',
        probability=0.05,
        config={'min_ms': 500, 'max_ms': 3000},
    ),
    ChaosExperiment(
        id='random_errors',
        name='Random Errors',
        type=ChaosType.ERROR,
        target='*',
        probability=0.02,
    ),
    ChaosExperiment(
        id='db_slowdown',
        name='Database Slowdown',
        type=ChaosType.LATENCY,
        target='database',
        probability=0.1,
        config={'min_ms': 1000, 'max_ms': 5000},
    ),
]


def init_default_experiments():
    """Initialise les expériences par défaut"""
    if CHAOS_ENABLED:
        monkey = get_chaos_monkey()
        for exp in DEFAULT_EXPERIMENTS:
            monkey.register_experiment(exp)
