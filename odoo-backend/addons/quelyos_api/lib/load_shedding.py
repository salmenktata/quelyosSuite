# -*- coding: utf-8 -*-
"""
Load Shedding pour Quelyos API

Délestage intelligent sous charge:
- Détection de surcharge
- Rejet gracieux
- Priorisation des requêtes
- Récupération progressive
"""

import os
import time
import logging
import threading
from typing import Dict, Any, Optional, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
from functools import wraps

_logger = logging.getLogger(__name__)

REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
SHEDDING_PREFIX = 'quelyos:shedding:'


class LoadLevel(Enum):
    """Niveaux de charge"""
    NORMAL = 'normal'       # < 70%
    ELEVATED = 'elevated'   # 70-85%
    HIGH = 'high'           # 85-95%
    CRITICAL = 'critical'   # > 95%


class RequestPriority(Enum):
    """Priorités de requêtes"""
    CRITICAL = 0    # Jamais délestées (health, auth)
    HIGH = 1        # Rarement délestées (admin, paiement)
    NORMAL = 2      # Délestées en charge élevée
    LOW = 3         # Délestées en premier (analytics, logs)
    BULK = 4        # Toujours délestées sous charge


@dataclass
class LoadMetrics:
    """Métriques de charge"""
    requests_per_second: float
    avg_response_time_ms: float
    error_rate: float
    queue_depth: int
    memory_usage_percent: float
    cpu_usage_percent: float


class LoadShedder:
    """Gestionnaire de délestage"""

    def __init__(self):
        self._redis = None
        self._current_level = LoadLevel.NORMAL
        self._metrics = LoadMetrics(0, 0, 0, 0, 0, 0)
        self._lock = threading.Lock()
        self._init_redis()

        # Thresholds par niveau
        self._thresholds = {
            LoadLevel.NORMAL: {
                'rps': 1000,
                'response_time_ms': 200,
                'error_rate': 0.01,
            },
            LoadLevel.ELEVATED: {
                'rps': 2000,
                'response_time_ms': 500,
                'error_rate': 0.05,
            },
            LoadLevel.HIGH: {
                'rps': 3000,
                'response_time_ms': 1000,
                'error_rate': 0.10,
            },
            LoadLevel.CRITICAL: {
                'rps': 5000,
                'response_time_ms': 2000,
                'error_rate': 0.20,
            },
        }

        # Probabilités de rejet par niveau/priorité
        self._rejection_probs = {
            LoadLevel.NORMAL: {p: 0 for p in RequestPriority},
            LoadLevel.ELEVATED: {
                RequestPriority.CRITICAL: 0,
                RequestPriority.HIGH: 0,
                RequestPriority.NORMAL: 0.1,
                RequestPriority.LOW: 0.3,
                RequestPriority.BULK: 0.8,
            },
            LoadLevel.HIGH: {
                RequestPriority.CRITICAL: 0,
                RequestPriority.HIGH: 0.1,
                RequestPriority.NORMAL: 0.4,
                RequestPriority.LOW: 0.7,
                RequestPriority.BULK: 1.0,
            },
            LoadLevel.CRITICAL: {
                RequestPriority.CRITICAL: 0,
                RequestPriority.HIGH: 0.3,
                RequestPriority.NORMAL: 0.7,
                RequestPriority.LOW: 0.95,
                RequestPriority.BULK: 1.0,
            },
        }

    def _init_redis(self):
        try:
            import redis
            self._redis = redis.from_url(REDIS_URL)
            self._redis.ping()
        except Exception as e:
            _logger.warning(f"Redis not available: {e}")

    def update_metrics(self, metrics: LoadMetrics):
        """Met à jour les métriques et recalcule le niveau"""
        with self._lock:
            self._metrics = metrics
            self._current_level = self._calculate_level(metrics)

            if self._redis:
                self._redis.hset(f"{SHEDDING_PREFIX}metrics", mapping={
                    'level': self._current_level.value,
                    'rps': metrics.requests_per_second,
                    'response_time_ms': metrics.avg_response_time_ms,
                    'error_rate': metrics.error_rate,
                    'updated_at': datetime.utcnow().isoformat(),
                })

    def _calculate_level(self, metrics: LoadMetrics) -> LoadLevel:
        """Calcule le niveau de charge"""
        # Vérifier chaque niveau du plus critique au normal
        for level in reversed(list(LoadLevel)):
            thresholds = self._thresholds.get(level, {})

            if (metrics.requests_per_second > thresholds.get('rps', float('inf')) or
                metrics.avg_response_time_ms > thresholds.get('response_time_ms', float('inf')) or
                metrics.error_rate > thresholds.get('error_rate', 1.0)):
                return level

        return LoadLevel.NORMAL

    def should_shed(self, priority: RequestPriority = RequestPriority.NORMAL) -> bool:
        """
        Détermine si une requête doit être délestée.

        Returns:
            True si la requête doit être rejetée
        """
        rejection_prob = self._rejection_probs[self._current_level][priority]

        if rejection_prob <= 0:
            return False

        if rejection_prob >= 1:
            return True

        import random
        return random.random() < rejection_prob

    def get_level(self) -> LoadLevel:
        """Retourne le niveau de charge actuel"""
        return self._current_level

    def get_status(self) -> Dict[str, Any]:
        """Retourne le statut complet"""
        return {
            'level': self._current_level.value,
            'metrics': {
                'rps': self._metrics.requests_per_second,
                'response_time_ms': self._metrics.avg_response_time_ms,
                'error_rate': self._metrics.error_rate,
                'queue_depth': self._metrics.queue_depth,
            },
            'rejection_probs': {
                p.name: self._rejection_probs[self._current_level][p]
                for p in RequestPriority
            },
        }

    def manual_override(self, level: LoadLevel, duration_minutes: int = 10):
        """Force un niveau manuellement"""
        self._current_level = level
        _logger.warning(f"Load level manually set to {level.value}")

        if self._redis:
            self._redis.setex(
                f"{SHEDDING_PREFIX}override",
                duration_minutes * 60,
                level.value
            )


# Singleton
_load_shedder = None


def get_load_shedder() -> LoadShedder:
    """Retourne le gestionnaire de délestage"""
    global _load_shedder
    if _load_shedder is None:
        _load_shedder = LoadShedder()
    return _load_shedder


def shed_on_load(priority: RequestPriority = RequestPriority.NORMAL):
    """
    Décorateur pour délestage automatique.

    Usage:
        @shed_on_load(priority=RequestPriority.LOW)
        def heavy_analytics(self):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            shedder = get_load_shedder()

            if shedder.should_shed(priority):
                level = shedder.get_level()
                _logger.info(
                    f"Request shed: {func.__name__} "
                    f"(priority={priority.name}, level={level.value})"
                )

                return {
                    'success': False,
                    'error': 'Service temporarily overloaded',
                    'error_code': 'SERVICE_OVERLOADED',
                    'retry_after': 30,  # Retry dans 30s
                }

            return func(self, *args, **kwargs)

        return wrapper
    return decorator


class AdaptiveLoadShedder:
    """Délesteur adaptatif basé sur les métriques en temps réel"""

    def __init__(self, target_latency_ms: float = 200):
        self._target_latency = target_latency_ms
        self._recent_latencies: list = []
        self._window_size = 100
        self._current_rejection_rate = 0.0
        self._lock = threading.Lock()

    def record_latency(self, latency_ms: float):
        """Enregistre une latence et ajuste le taux de rejet"""
        with self._lock:
            self._recent_latencies.append(latency_ms)

            # Garder uniquement la fenêtre
            if len(self._recent_latencies) > self._window_size:
                self._recent_latencies.pop(0)

            # Calculer nouvelle moyenne
            avg_latency = sum(self._recent_latencies) / len(self._recent_latencies)

            # Ajuster taux de rejet (AIMD - Additive Increase Multiplicative Decrease)
            if avg_latency > self._target_latency:
                # Augmenter rejet
                self._current_rejection_rate = min(
                    0.9,
                    self._current_rejection_rate + 0.1
                )
            else:
                # Diminuer rejet
                self._current_rejection_rate = max(
                    0,
                    self._current_rejection_rate * 0.9
                )

    def should_shed(self) -> bool:
        """Détermine si délester"""
        if self._current_rejection_rate <= 0:
            return False

        import random
        return random.random() < self._current_rejection_rate

    def get_rejection_rate(self) -> float:
        """Retourne le taux de rejet actuel"""
        return self._current_rejection_rate
