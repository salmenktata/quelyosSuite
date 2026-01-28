# -*- coding: utf-8 -*-
"""
Distributed Locking pour Quelyos ERP

Verrouillage distribué avec Redis:
- Évite les race conditions entre instances
- Timeout automatique
- Renouvellement de verrou
- Deadlock prevention

Basé sur l'algorithme Redlock de Redis.
"""

import os
import time
import uuid
import logging
from typing import Optional, Callable, Any
from functools import wraps
from contextlib import contextmanager

_logger = logging.getLogger(__name__)

# Configuration
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
LOCK_PREFIX = 'quelyos:lock:'
DEFAULT_LOCK_TIMEOUT = 30  # secondes
DEFAULT_RETRY_DELAY = 0.1  # secondes
DEFAULT_RETRY_COUNT = 10


# =============================================================================
# DISTRIBUTED LOCK
# =============================================================================

class DistributedLock:
    """
    Verrou distribué basé sur Redis.

    Usage:
        lock = DistributedLock('order:123')

        # Avec context manager
        with lock:
            # Code protégé
            process_order(123)

        # Ou manuellement
        if lock.acquire():
            try:
                process_order(123)
            finally:
                lock.release()
    """

    def __init__(
        self,
        name: str,
        timeout: int = DEFAULT_LOCK_TIMEOUT,
        retry_delay: float = DEFAULT_RETRY_DELAY,
        retry_count: int = DEFAULT_RETRY_COUNT,
    ):
        """
        Initialise le verrou.

        Args:
            name: Nom unique du verrou
            timeout: Durée max du verrou en secondes
            retry_delay: Délai entre les tentatives
            retry_count: Nombre max de tentatives
        """
        self.name = name
        self.timeout = timeout
        self.retry_delay = retry_delay
        self.retry_count = retry_count
        self._token = None
        self._redis = None
        self._init_redis()

    def _init_redis(self):
        """Initialise la connexion Redis"""
        try:
            import redis
            self._redis = redis.from_url(REDIS_URL)
        except Exception as e:
            _logger.warning(f"Redis not available for distributed lock: {e}")

    @property
    def key(self) -> str:
        """Clé Redis du verrou"""
        return f"{LOCK_PREFIX}{self.name}"

    def acquire(self, blocking: bool = True) -> bool:
        """
        Acquiert le verrou.

        Args:
            blocking: Si True, attend jusqu'à obtention du verrou

        Returns:
            True si le verrou est acquis
        """
        if not self._redis:
            _logger.warning("Redis not available, lock not acquired")
            return True  # Fallback: pas de verrou

        self._token = str(uuid.uuid4())

        for attempt in range(self.retry_count if blocking else 1):
            # Essayer d'acquérir avec SET NX EX
            acquired = self._redis.set(
                self.key,
                self._token,
                nx=True,  # Only if not exists
                ex=self.timeout  # Expiration
            )

            if acquired:
                _logger.debug(f"Lock acquired: {self.name} (token: {self._token[:8]})")
                return True

            if not blocking:
                return False

            time.sleep(self.retry_delay)

        _logger.warning(f"Failed to acquire lock: {self.name} after {self.retry_count} attempts")
        return False

    def release(self) -> bool:
        """
        Libère le verrou.

        Returns:
            True si le verrou a été libéré
        """
        if not self._redis or not self._token:
            return True

        # Script Lua pour release atomique
        # Ne libère que si le token correspond
        script = """
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
        """

        try:
            result = self._redis.eval(script, 1, self.key, self._token)
            if result:
                _logger.debug(f"Lock released: {self.name}")
                return True
            else:
                _logger.warning(f"Lock was not owned: {self.name}")
                return False
        except Exception as e:
            _logger.error(f"Failed to release lock: {e}")
            return False
        finally:
            self._token = None

    def extend(self, additional_time: int = None) -> bool:
        """
        Prolonge le verrou.

        Args:
            additional_time: Temps supplémentaire (ou timeout par défaut)

        Returns:
            True si le verrou a été prolongé
        """
        if not self._redis or not self._token:
            return False

        additional_time = additional_time or self.timeout

        # Script Lua pour extend atomique
        script = """
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("expire", KEYS[1], ARGV[2])
        else
            return 0
        end
        """

        try:
            result = self._redis.eval(script, 1, self.key, self._token, additional_time)
            if result:
                _logger.debug(f"Lock extended: {self.name} (+{additional_time}s)")
                return True
            return False
        except Exception as e:
            _logger.error(f"Failed to extend lock: {e}")
            return False

    def is_locked(self) -> bool:
        """Vérifie si le verrou est actif"""
        if not self._redis:
            return False
        return self._redis.exists(self.key) > 0

    def owned(self) -> bool:
        """Vérifie si on possède le verrou"""
        if not self._redis or not self._token:
            return False
        return self._redis.get(self.key) == self._token.encode()

    def __enter__(self):
        if not self.acquire():
            raise LockAcquisitionError(f"Could not acquire lock: {self.name}")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release()
        return False


class LockAcquisitionError(Exception):
    """Erreur lors de l'acquisition d'un verrou"""
    pass


# =============================================================================
# DÉCORATEURS
# =============================================================================

def with_lock(
    lock_name: str = None,
    timeout: int = DEFAULT_LOCK_TIMEOUT,
    blocking: bool = True
):
    """
    Décorateur pour protéger une fonction avec un verrou.

    Usage:
        @with_lock('process_order')
        def process_order(order_id):
            ...

        # Ou avec le nom dynamique
        @with_lock(lambda args, kwargs: f"order:{kwargs.get('order_id')}")
        def process_order(order_id):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Déterminer le nom du verrou
            if callable(lock_name):
                name = lock_name(args, kwargs)
            elif lock_name:
                name = lock_name
            else:
                name = func.__name__

            lock = DistributedLock(name, timeout=timeout)

            if not lock.acquire(blocking=blocking):
                raise LockAcquisitionError(f"Could not acquire lock for {func.__name__}")

            try:
                return func(*args, **kwargs)
            finally:
                lock.release()

        return wrapper
    return decorator


def exclusive(resource_type: str):
    """
    Décorateur pour accès exclusif à une ressource.

    Usage:
        @exclusive('product')
        def update_product(product_id, **data):
            ...

    Le premier argument de la fonction sera utilisé comme identifiant de ressource.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Le premier arg est l'ID de la ressource
            resource_id = args[0] if args else kwargs.get('id') or kwargs.get(f'{resource_type}_id')
            lock_name = f"{resource_type}:{resource_id}"

            with DistributedLock(lock_name):
                return func(*args, **kwargs)

        return wrapper
    return decorator


# =============================================================================
# CONTEXT MANAGER
# =============================================================================

@contextmanager
def distributed_lock(name: str, timeout: int = DEFAULT_LOCK_TIMEOUT):
    """
    Context manager pour verrou distribué.

    Usage:
        with distributed_lock('inventory:update'):
            update_inventory()
    """
    lock = DistributedLock(name, timeout=timeout)
    if not lock.acquire():
        raise LockAcquisitionError(f"Could not acquire lock: {name}")
    try:
        yield lock
    finally:
        lock.release()


# =============================================================================
# SEMAPHORE DISTRIBUÉ
# =============================================================================

class DistributedSemaphore:
    """
    Sémaphore distribué permettant N accès concurrents.

    Usage:
        semaphore = DistributedSemaphore('api:external', max_concurrent=5)

        with semaphore:
            call_external_api()
    """

    def __init__(self, name: str, max_concurrent: int = 5, timeout: int = 30):
        self.name = name
        self.max_concurrent = max_concurrent
        self.timeout = timeout
        self._redis = None
        self._slot = None
        self._init_redis()

    def _init_redis(self):
        try:
            import redis
            self._redis = redis.from_url(REDIS_URL)
        except Exception as e:
            _logger.warning(f"Redis not available for semaphore: {e}")

    @property
    def key(self) -> str:
        return f"{LOCK_PREFIX}semaphore:{self.name}"

    def acquire(self) -> bool:
        if not self._redis:
            return True

        token = str(uuid.uuid4())

        for slot in range(self.max_concurrent):
            slot_key = f"{self.key}:{slot}"
            acquired = self._redis.set(slot_key, token, nx=True, ex=self.timeout)
            if acquired:
                self._slot = (slot_key, token)
                _logger.debug(f"Semaphore slot {slot} acquired: {self.name}")
                return True

        return False

    def release(self) -> bool:
        if not self._redis or not self._slot:
            return True

        slot_key, token = self._slot
        script = """
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
        """
        result = self._redis.eval(script, 1, slot_key, token)
        self._slot = None
        return bool(result)

    def __enter__(self):
        if not self.acquire():
            raise LockAcquisitionError(f"Semaphore full: {self.name}")
        return self

    def __exit__(self, *args):
        self.release()
        return False


# =============================================================================
# HELPERS
# =============================================================================

def get_lock(name: str, timeout: int = DEFAULT_LOCK_TIMEOUT) -> DistributedLock:
    """Crée un nouveau verrou distribué"""
    return DistributedLock(name, timeout=timeout)


def is_locked(name: str) -> bool:
    """Vérifie si une ressource est verrouillée"""
    lock = DistributedLock(name)
    return lock.is_locked()
