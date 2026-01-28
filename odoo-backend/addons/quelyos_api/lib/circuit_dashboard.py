# -*- coding: utf-8 -*-
"""
Circuit Breaker Dashboard pour Quelyos API

Monitoring et contrôle des circuit breakers:
- État de tous les circuits
- Historique des transitions
- Contrôle manuel
- Alertes
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

_logger = logging.getLogger(__name__)

REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
CB_PREFIX = 'quelyos:circuit:'


class CircuitState(Enum):
    """États du circuit breaker"""
    CLOSED = 'closed'       # Normal
    OPEN = 'open'           # Bloqué
    HALF_OPEN = 'half_open' # Test


@dataclass
class CircuitInfo:
    """Informations sur un circuit"""
    name: str
    state: CircuitState
    failure_count: int
    success_count: int
    last_failure: Optional[datetime]
    last_success: Optional[datetime]
    last_state_change: Optional[datetime]
    config: Dict[str, Any]


class CircuitBreakerDashboard:
    """Dashboard pour circuit breakers"""

    def __init__(self):
        self._redis = None
        self._circuits: Dict[str, CircuitInfo] = {}
        self._init_redis()

    def _init_redis(self):
        try:
            import redis
            self._redis = redis.from_url(REDIS_URL)
            self._redis.ping()
        except Exception as e:
            _logger.warning(f"Redis not available: {e}")

    def register_circuit(
        self,
        name: str,
        failure_threshold: int = 5,
        reset_timeout: int = 60,
        half_open_requests: int = 3
    ):
        """Enregistre un circuit breaker"""
        config = {
            'failure_threshold': failure_threshold,
            'reset_timeout': reset_timeout,
            'half_open_requests': half_open_requests,
        }

        self._circuits[name] = CircuitInfo(
            name=name,
            state=CircuitState.CLOSED,
            failure_count=0,
            success_count=0,
            last_failure=None,
            last_success=None,
            last_state_change=datetime.utcnow(),
            config=config,
        )

        if self._redis:
            self._redis.hset(f"{CB_PREFIX}config:{name}", mapping=config)

        _logger.info(f"Registered circuit breaker: {name}")

    def record_success(self, name: str):
        """Enregistre un succès"""
        if name not in self._circuits:
            return

        circuit = self._circuits[name]
        circuit.success_count += 1
        circuit.last_success = datetime.utcnow()

        # Si half-open et assez de succès -> fermer
        if circuit.state == CircuitState.HALF_OPEN:
            if circuit.success_count >= circuit.config['half_open_requests']:
                self._transition(name, CircuitState.CLOSED)
                circuit.failure_count = 0

        self._save_metrics(name)

    def record_failure(self, name: str, error: str = ''):
        """Enregistre un échec"""
        if name not in self._circuits:
            return

        circuit = self._circuits[name]
        circuit.failure_count += 1
        circuit.last_failure = datetime.utcnow()

        # Enregistrer historique
        self._record_event(name, 'failure', error)

        # Si assez d'échecs -> ouvrir
        if circuit.state == CircuitState.CLOSED:
            if circuit.failure_count >= circuit.config['failure_threshold']:
                self._transition(name, CircuitState.OPEN)

        # Si half-open -> rouvrir
        elif circuit.state == CircuitState.HALF_OPEN:
            self._transition(name, CircuitState.OPEN)

        self._save_metrics(name)

    def _transition(self, name: str, new_state: CircuitState):
        """Effectue une transition d'état"""
        circuit = self._circuits[name]
        old_state = circuit.state
        circuit.state = new_state
        circuit.last_state_change = datetime.utcnow()

        if new_state == CircuitState.CLOSED:
            circuit.failure_count = 0
            circuit.success_count = 0

        self._record_event(name, 'transition', f"{old_state.value} -> {new_state.value}")

        _logger.warning(
            f"Circuit '{name}' transitioned: {old_state.value} -> {new_state.value}"
        )

    def _record_event(self, name: str, event_type: str, details: str = ''):
        """Enregistre un événement"""
        if not self._redis:
            return

        event = {
            'type': event_type,
            'details': details,
            'timestamp': datetime.utcnow().isoformat(),
        }

        key = f"{CB_PREFIX}history:{name}"
        self._redis.lpush(key, json.dumps(event))
        self._redis.ltrim(key, 0, 999)  # Garder 1000 derniers
        self._redis.expire(key, 86400 * 7)  # 7 jours

    def _save_metrics(self, name: str):
        """Sauvegarde les métriques"""
        if not self._redis:
            return

        circuit = self._circuits[name]
        key = f"{CB_PREFIX}metrics:{name}"

        self._redis.hset(key, mapping={
            'state': circuit.state.value,
            'failure_count': circuit.failure_count,
            'success_count': circuit.success_count,
            'last_failure': circuit.last_failure.isoformat() if circuit.last_failure else '',
            'last_success': circuit.last_success.isoformat() if circuit.last_success else '',
            'last_state_change': circuit.last_state_change.isoformat() if circuit.last_state_change else '',
        })

    def get_state(self, name: str) -> Optional[CircuitState]:
        """Retourne l'état d'un circuit"""
        if name in self._circuits:
            return self._circuits[name].state
        return None

    def is_open(self, name: str) -> bool:
        """Vérifie si un circuit est ouvert"""
        state = self.get_state(name)
        return state == CircuitState.OPEN

    def try_half_open(self, name: str) -> bool:
        """Tente de passer en half-open après timeout"""
        if name not in self._circuits:
            return False

        circuit = self._circuits[name]

        if circuit.state != CircuitState.OPEN:
            return False

        # Vérifier timeout
        if circuit.last_state_change:
            elapsed = (datetime.utcnow() - circuit.last_state_change).total_seconds()
            if elapsed >= circuit.config['reset_timeout']:
                self._transition(name, CircuitState.HALF_OPEN)
                circuit.success_count = 0
                return True

        return False

    def force_open(self, name: str, reason: str = 'manual'):
        """Force l'ouverture d'un circuit"""
        if name in self._circuits:
            self._transition(name, CircuitState.OPEN)
            self._record_event(name, 'force_open', reason)

    def force_close(self, name: str, reason: str = 'manual'):
        """Force la fermeture d'un circuit"""
        if name in self._circuits:
            self._transition(name, CircuitState.CLOSED)
            self._record_event(name, 'force_close', reason)

    def get_all_circuits(self) -> Dict[str, Dict[str, Any]]:
        """Retourne l'état de tous les circuits"""
        result = {}

        for name, circuit in self._circuits.items():
            result[name] = {
                'state': circuit.state.value,
                'failure_count': circuit.failure_count,
                'success_count': circuit.success_count,
                'last_failure': circuit.last_failure.isoformat() if circuit.last_failure else None,
                'last_success': circuit.last_success.isoformat() if circuit.last_success else None,
                'last_state_change': circuit.last_state_change.isoformat() if circuit.last_state_change else None,
                'config': circuit.config,
            }

        return result

    def get_history(self, name: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Retourne l'historique d'un circuit"""
        if not self._redis:
            return []

        key = f"{CB_PREFIX}history:{name}"
        events = self._redis.lrange(key, 0, limit - 1)

        return [json.loads(e) for e in events]

    def get_summary(self) -> Dict[str, Any]:
        """Retourne un résumé de tous les circuits"""
        total = len(self._circuits)
        by_state = {
            'closed': 0,
            'open': 0,
            'half_open': 0,
        }

        for circuit in self._circuits.values():
            by_state[circuit.state.value] += 1

        return {
            'total_circuits': total,
            'by_state': by_state,
            'healthy': by_state['closed'],
            'unhealthy': by_state['open'] + by_state['half_open'],
            'health_percent': (by_state['closed'] / total * 100) if total > 0 else 100,
        }


# Singleton
_cb_dashboard = None


def get_circuit_dashboard() -> CircuitBreakerDashboard:
    """Retourne le dashboard circuit breaker"""
    global _cb_dashboard
    if _cb_dashboard is None:
        _cb_dashboard = CircuitBreakerDashboard()
    return _cb_dashboard
