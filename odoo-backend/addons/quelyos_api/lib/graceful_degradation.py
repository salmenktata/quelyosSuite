# -*- coding: utf-8 -*-
"""
Graceful Degradation pour Quelyos API

Dégradation progressive des services:
- Fallbacks automatiques
- Mode dégradé intelligent
- Récupération automatique
"""

import os
import json
import logging
from typing import Dict, Any, Optional, Callable, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from functools import wraps

_logger = logging.getLogger(__name__)

REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
DEGRADE_PREFIX = 'quelyos:degrade:'


class DegradationLevel(Enum):
    """Niveaux de dégradation"""
    NORMAL = 'normal'       # Fonctionnement normal
    LIGHT = 'light'         # Dégradation légère (cache + async)
    MEDIUM = 'medium'       # Dégradation moyenne (fonctionnalités réduites)
    HEAVY = 'heavy'         # Dégradation sévère (lecture seule)
    CRITICAL = 'critical'   # Mode maintenance


@dataclass
class DegradationRule:
    """Règle de dégradation"""
    name: str
    condition: Callable[[], bool]  # Condition de déclenchement
    level: DegradationLevel
    fallback: Optional[Callable] = None
    message: str = ''


@dataclass
class FeatureState:
    """État d'une fonctionnalité"""
    name: str
    enabled: bool
    degraded: bool = False
    fallback_active: bool = False
    message: str = ''


class GracefulDegradationManager:
    """Gestionnaire de dégradation progressive"""

    def __init__(self):
        self._redis = None
        self._rules: Dict[str, DegradationRule] = {}
        self._fallbacks: Dict[str, Callable] = {}
        self._current_level = DegradationLevel.NORMAL
        self._feature_states: Dict[str, FeatureState] = {}
        self._init_redis()

    def _init_redis(self):
        try:
            import redis
            self._redis = redis.from_url(REDIS_URL)
            self._redis.ping()
            self._load_state()
        except Exception as e:
            _logger.warning(f"Redis not available: {e}")

    def _load_state(self):
        """Charge l'état depuis Redis"""
        if not self._redis:
            return

        level = self._redis.get(f"{DEGRADE_PREFIX}level")
        if level:
            self._current_level = DegradationLevel(level.decode())

    def _save_state(self):
        """Sauvegarde l'état dans Redis"""
        if not self._redis:
            return

        self._redis.set(f"{DEGRADE_PREFIX}level", self._current_level.value)

    def register_fallback(self, feature: str, fallback: Callable):
        """Enregistre un fallback pour une fonctionnalité"""
        self._fallbacks[feature] = fallback
        _logger.info(f"Registered fallback for: {feature}")

    def register_rule(self, rule: DegradationRule):
        """Enregistre une règle de dégradation"""
        self._rules[rule.name] = rule

    def set_level(self, level: DegradationLevel, reason: str = ''):
        """Définit le niveau de dégradation"""
        old_level = self._current_level
        self._current_level = level
        self._save_state()

        _logger.warning(
            f"Degradation level changed: {old_level.value} -> {level.value}. "
            f"Reason: {reason}"
        )

        # Émettre événement
        if self._redis:
            self._redis.publish(f"{DEGRADE_PREFIX}events", json.dumps({
                'type': 'level_change',
                'old_level': old_level.value,
                'new_level': level.value,
                'reason': reason,
                'timestamp': datetime.utcnow().isoformat(),
            }))

    def get_level(self) -> DegradationLevel:
        """Retourne le niveau de dégradation actuel"""
        return self._current_level

    def check_rules(self):
        """Vérifie les règles et ajuste le niveau"""
        max_level = DegradationLevel.NORMAL

        for name, rule in self._rules.items():
            try:
                if rule.condition():
                    if rule.level.value > max_level.value:
                        max_level = rule.level
                        _logger.info(f"Rule '{name}' triggered level {rule.level.value}")
            except Exception as e:
                _logger.error(f"Error checking rule '{name}': {e}")

        if max_level != self._current_level:
            self.set_level(max_level, f"Auto-triggered by rules")

    def is_feature_enabled(self, feature: str) -> bool:
        """Vérifie si une fonctionnalité est activée"""
        # En mode critique, tout est désactivé sauf lecture
        if self._current_level == DegradationLevel.CRITICAL:
            return feature in ['read', 'health', 'status']

        # En mode heavy, lecture seule
        if self._current_level == DegradationLevel.HEAVY:
            return feature not in ['write', 'delete', 'create', 'payment']

        return True

    def get_fallback(self, feature: str) -> Optional[Callable]:
        """Retourne le fallback pour une fonctionnalité"""
        if self._current_level == DegradationLevel.NORMAL:
            return None

        return self._fallbacks.get(feature)

    def get_status(self) -> Dict[str, Any]:
        """Retourne le statut de dégradation"""
        return {
            'level': self._current_level.value,
            'features': {
                name: {
                    'enabled': state.enabled,
                    'degraded': state.degraded,
                    'fallback_active': state.fallback_active,
                    'message': state.message,
                }
                for name, state in self._feature_states.items()
            },
            'active_rules': [
                name for name, rule in self._rules.items()
                if rule.condition()
            ],
        }


# Singleton
_degradation_manager = None


def get_degradation_manager() -> GracefulDegradationManager:
    """Retourne le gestionnaire de dégradation"""
    global _degradation_manager
    if _degradation_manager is None:
        _degradation_manager = GracefulDegradationManager()
    return _degradation_manager


def with_fallback(feature: str, fallback_value: Any = None):
    """
    Décorateur pour exécuter avec fallback en cas de dégradation.

    Usage:
        @with_fallback('search', fallback_value=[])
        def search_products(self, query):
            # Recherche complète
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            manager = get_degradation_manager()

            # Vérifier si fonctionnalité activée
            if not manager.is_feature_enabled(feature):
                _logger.warning(f"Feature '{feature}' disabled due to degradation")
                return fallback_value

            # Vérifier fallback
            fallback = manager.get_fallback(feature)
            if fallback:
                try:
                    return fallback(*args, **kwargs)
                except Exception as e:
                    _logger.error(f"Fallback for '{feature}' failed: {e}")
                    return fallback_value

            # Exécution normale
            return func(self, *args, **kwargs)

        return wrapper
    return decorator


def degradable(
    feature: str,
    fallback_func: Callable = None,
    disabled_response: Any = None
):
    """
    Décorateur plus complet pour dégradation.

    Usage:
        def simple_search(query):
            # Recherche simplifiée dans le cache
            return cache.get(f'search:{query}', [])

        @degradable('full_search', fallback_func=simple_search)
        def full_search(self, query, filters=None):
            # Recherche complète avec tous les filtres
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            manager = get_degradation_manager()
            level = manager.get_level()

            # Mode critique
            if level == DegradationLevel.CRITICAL:
                if disabled_response is not None:
                    return disabled_response
                return {
                    'success': False,
                    'error': 'Service temporarily unavailable',
                    'error_code': 'SERVICE_DEGRADED',
                }

            # Mode dégradé avec fallback
            if level in [DegradationLevel.MEDIUM, DegradationLevel.HEAVY]:
                if fallback_func:
                    try:
                        return fallback_func(*args, **kwargs)
                    except Exception as e:
                        _logger.error(f"Fallback failed for {feature}: {e}")

            # Mode normal ou léger
            try:
                return func(self, *args, **kwargs)
            except Exception as e:
                # En cas d'erreur, essayer fallback
                if fallback_func and level != DegradationLevel.NORMAL:
                    try:
                        return fallback_func(*args, **kwargs)
                    except Exception:
                        pass
                raise

        return wrapper
    return decorator
