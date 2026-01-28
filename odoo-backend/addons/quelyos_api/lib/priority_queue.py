# -*- coding: utf-8 -*-
"""
Request Prioritization pour Quelyos API

Priorisation intelligente des requêtes:
- File d'attente prioritaire
- Fair queuing
- Deadline scheduling
- Admission control
"""

import os
import time
import heapq
import logging
import threading
from typing import Dict, List, Any, Optional, Callable, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import IntEnum
from functools import wraps

_logger = logging.getLogger(__name__)

REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
PRIORITY_PREFIX = 'quelyos:priority:'


class Priority(IntEnum):
    """Niveaux de priorité (plus bas = plus prioritaire)"""
    SYSTEM = 0      # Système (health, metrics)
    CRITICAL = 1    # Critique (auth, paiement)
    HIGH = 2        # Haute (admin)
    NORMAL = 3      # Normale (API standard)
    LOW = 4         # Basse (bulk, export)
    BACKGROUND = 5  # Arrière-plan (analytics)


@dataclass(order=True)
class PrioritizedRequest:
    """Requête avec priorité"""
    priority: int
    deadline: float = field(compare=True)  # Timestamp deadline
    arrival_time: float = field(compare=False)
    request_id: str = field(compare=False)
    handler: Callable = field(compare=False, repr=False)
    args: tuple = field(default_factory=tuple, compare=False)
    kwargs: dict = field(default_factory=dict, compare=False)


class PriorityQueue:
    """File d'attente prioritaire"""

    def __init__(self, max_size: int = 10000):
        self._queue: List[PrioritizedRequest] = []
        self._max_size = max_size
        self._lock = threading.Lock()
        self._not_empty = threading.Condition(self._lock)
        self._not_full = threading.Condition(self._lock)

    def put(
        self,
        request: PrioritizedRequest,
        block: bool = True,
        timeout: float = None
    ) -> bool:
        """
        Ajoute une requête à la file.

        Returns:
            True si ajoutée, False si rejetée
        """
        with self._not_full:
            if len(self._queue) >= self._max_size:
                if not block:
                    return False

                if not self._not_full.wait(timeout):
                    return False

            heapq.heappush(self._queue, request)
            self._not_empty.notify()
            return True

    def get(
        self,
        block: bool = True,
        timeout: float = None
    ) -> Optional[PrioritizedRequest]:
        """
        Récupère la requête la plus prioritaire.
        """
        with self._not_empty:
            if not self._queue:
                if not block:
                    return None

                if not self._not_empty.wait(timeout):
                    return None

            request = heapq.heappop(self._queue)
            self._not_full.notify()
            return request

    def peek(self) -> Optional[PrioritizedRequest]:
        """Regarde la prochaine requête sans la retirer"""
        with self._lock:
            return self._queue[0] if self._queue else None

    def size(self) -> int:
        """Taille actuelle de la file"""
        with self._lock:
            return len(self._queue)

    def is_full(self) -> bool:
        """Vérifie si la file est pleine"""
        with self._lock:
            return len(self._queue) >= self._max_size

    def clear_expired(self) -> int:
        """Supprime les requêtes expirées"""
        now = time.time()
        removed = 0

        with self._lock:
            new_queue = []
            for req in self._queue:
                if req.deadline > now:
                    new_queue.append(req)
                else:
                    removed += 1

            if removed > 0:
                heapq.heapify(new_queue)
                self._queue = new_queue

        return removed


class FairScheduler:
    """
    Scheduler équitable multi-tenant.

    Garantit que chaque tenant a un accès équitable aux ressources.
    """

    def __init__(self, quantum_ms: int = 100):
        self._queues: Dict[str, PriorityQueue] = {}
        self._quantum = quantum_ms / 1000
        self._current_tenant: Optional[str] = None
        self._tenant_times: Dict[str, float] = {}
        self._lock = threading.Lock()

    def get_queue(self, tenant_id: str) -> PriorityQueue:
        """Obtient la file d'un tenant"""
        with self._lock:
            if tenant_id not in self._queues:
                self._queues[tenant_id] = PriorityQueue()
                self._tenant_times[tenant_id] = 0

            return self._queues[tenant_id]

    def next(self) -> Optional[Tuple[str, PrioritizedRequest]]:
        """
        Retourne la prochaine requête de manière équitable.

        Returns:
            Tuple (tenant_id, request) ou None
        """
        with self._lock:
            if not self._queues:
                return None

            # Trouver tenant avec le moins de temps utilisé
            active_tenants = [
                t for t, q in self._queues.items()
                if q.size() > 0
            ]

            if not active_tenants:
                return None

            tenant = min(
                active_tenants,
                key=lambda t: self._tenant_times.get(t, 0)
            )

            request = self._queues[tenant].get(block=False)
            if request:
                return tenant, request

            return None

    def record_time(self, tenant_id: str, elapsed: float):
        """Enregistre le temps utilisé par un tenant"""
        with self._lock:
            self._tenant_times[tenant_id] = \
                self._tenant_times.get(tenant_id, 0) + elapsed

    def reset_times(self):
        """Réinitialise les compteurs de temps"""
        with self._lock:
            for tenant in self._tenant_times:
                self._tenant_times[tenant] = 0


class AdmissionController:
    """
    Contrôleur d'admission des requêtes.

    Décide si une requête peut être acceptée basé sur:
    - Capacité actuelle
    - Priorité
    - Deadline
    """

    def __init__(
        self,
        max_concurrent: int = 100,
        max_queue_time_ms: int = 5000
    ):
        self._max_concurrent = max_concurrent
        self._max_queue_time = max_queue_time_ms / 1000
        self._current_count = 0
        self._lock = threading.Lock()

    def try_admit(
        self,
        priority: Priority,
        deadline: float = None
    ) -> bool:
        """
        Tente d'admettre une requête.

        Returns:
            True si admise, False sinon
        """
        with self._lock:
            # Calcul de la capacité disponible par priorité
            reserved = {
                Priority.SYSTEM: 0.1,      # 10% réservés
                Priority.CRITICAL: 0.2,
                Priority.HIGH: 0.3,
                Priority.NORMAL: 0.5,
                Priority.LOW: 0.7,
                Priority.BACKGROUND: 0.9,
            }

            max_for_priority = int(self._max_concurrent * reserved[priority])

            if self._current_count >= max_for_priority:
                _logger.debug(
                    f"Admission rejected: priority={priority.name}, "
                    f"current={self._current_count}, max={max_for_priority}"
                )
                return False

            # Vérifier deadline
            if deadline:
                time_to_deadline = deadline - time.time()
                if time_to_deadline < self._max_queue_time:
                    _logger.debug(f"Admission rejected: deadline too close")
                    return False

            self._current_count += 1
            return True

    def release(self):
        """Libère une place"""
        with self._lock:
            self._current_count = max(0, self._current_count - 1)

    def get_stats(self) -> Dict[str, Any]:
        """Retourne les statistiques"""
        with self._lock:
            return {
                'current_concurrent': self._current_count,
                'max_concurrent': self._max_concurrent,
                'utilization': self._current_count / self._max_concurrent,
            }


# Singletons
_priority_queue = None
_admission_controller = None


def get_priority_queue() -> PriorityQueue:
    """Retourne la file prioritaire"""
    global _priority_queue
    if _priority_queue is None:
        _priority_queue = PriorityQueue()
    return _priority_queue


def get_admission_controller() -> AdmissionController:
    """Retourne le contrôleur d'admission"""
    global _admission_controller
    if _admission_controller is None:
        _admission_controller = AdmissionController()
    return _admission_controller


def prioritized(
    priority: Priority = Priority.NORMAL,
    deadline_ms: int = 30000
):
    """
    Décorateur pour requêtes prioritaires.

    Usage:
        @prioritized(priority=Priority.HIGH, deadline_ms=5000)
        def important_action(self):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            controller = get_admission_controller()
            deadline = time.time() + (deadline_ms / 1000)

            # Tenter admission
            if not controller.try_admit(priority, deadline):
                return {
                    'success': False,
                    'error': 'Server too busy',
                    'error_code': 'ADMISSION_REJECTED',
                    'retry_after': 5,
                }

            try:
                return func(self, *args, **kwargs)
            finally:
                controller.release()

        return wrapper
    return decorator


def with_deadline(timeout_ms: int):
    """
    Décorateur pour requêtes avec deadline.

    Usage:
        @with_deadline(5000)  # 5 secondes max
        def time_sensitive_action(self):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            import signal

            def timeout_handler(signum, frame):
                raise TimeoutError(f"Request exceeded deadline of {timeout_ms}ms")

            # Set alarm (Unix only)
            try:
                old_handler = signal.signal(signal.SIGALRM, timeout_handler)
                signal.setitimer(signal.ITIMER_REAL, timeout_ms / 1000)
            except (ValueError, AttributeError):
                # Windows ou autre
                old_handler = None

            try:
                return func(self, *args, **kwargs)
            except TimeoutError:
                return {
                    'success': False,
                    'error': 'Request timed out',
                    'error_code': 'DEADLINE_EXCEEDED',
                }
            finally:
                if old_handler is not None:
                    signal.setitimer(signal.ITIMER_REAL, 0)
                    signal.signal(signal.SIGALRM, old_handler)

        return wrapper
    return decorator
