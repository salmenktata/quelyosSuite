# -*- coding: utf-8 -*-
"""
Request Coalescing pour Quelyos ERP

Fusion des requêtes identiques en temps réel:
- Évite les requêtes redondantes
- Partage des résultats entre requêtes similaires
- Réduit la charge serveur
- Cache intelligent par requête
"""

import os
import time
import json
import hashlib
import logging
import threading
from typing import Dict, Any, Optional, Callable
from dataclasses import dataclass
from functools import wraps
from concurrent.futures import Future

_logger = logging.getLogger(__name__)

REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
COALESCE_PREFIX = 'quelyos:coalesce:'
DEFAULT_WINDOW_MS = 100  # Fenêtre de coalescence


# =============================================================================
# TYPES
# =============================================================================

@dataclass
class CoalescedRequest:
    """Requête en attente de coalescence"""
    key: str
    created_at: float
    futures: list
    result: Optional[Any] = None
    error: Optional[Exception] = None
    completed: bool = False


# =============================================================================
# COALESCER
# =============================================================================

class RequestCoalescer:
    """
    Coalescence de requêtes.

    Usage:
        coalescer = RequestCoalescer()

        # Plusieurs appels identiques dans la même fenêtre
        # seront fusionnés en une seule exécution
        result = coalescer.coalesce(
            'get_product_123',
            lambda: fetch_product(123),
            window_ms=100
        )
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self._pending: Dict[str, CoalescedRequest] = {}
        self._locks: Dict[str, threading.Lock] = {}
        self._redis = None
        self._init_redis()
        self._initialized = True

    def _init_redis(self):
        try:
            import redis
            self._redis = redis.from_url(REDIS_URL)
        except Exception:
            pass

    def _get_lock(self, key: str) -> threading.Lock:
        if key not in self._locks:
            self._locks[key] = threading.Lock()
        return self._locks[key]

    def coalesce(
        self,
        key: str,
        func: Callable,
        window_ms: int = DEFAULT_WINDOW_MS,
        cache_ttl: int = 0
    ) -> Any:
        """
        Coalesce une requête.

        Args:
            key: Clé unique pour identifier les requêtes similaires
            func: Fonction à exécuter
            window_ms: Fenêtre de coalescence en ms
            cache_ttl: TTL du cache en secondes (0 = pas de cache)

        Returns:
            Résultat de la fonction
        """
        # Vérifier le cache
        if cache_ttl > 0:
            cached = self._get_cached(key)
            if cached is not None:
                return cached

        lock = self._get_lock(key)

        with lock:
            # Vérifier si une requête est déjà en cours
            if key in self._pending:
                pending = self._pending[key]

                # Si dans la fenêtre de coalescence, attendre le résultat
                if time.time() - pending.created_at < (window_ms / 1000):
                    future = Future()
                    pending.futures.append(future)

                    # Libérer le lock et attendre
                    lock.release()
                    try:
                        result = future.result(timeout=30)
                        return result
                    finally:
                        lock.acquire()

            # Créer une nouvelle requête coalescée
            request = CoalescedRequest(
                key=key,
                created_at=time.time(),
                futures=[],
            )
            self._pending[key] = request

        # Exécuter la fonction (hors du lock)
        try:
            result = func()
            request.result = result
            request.completed = True

            # Cache si demandé
            if cache_ttl > 0:
                self._set_cached(key, result, cache_ttl)

            # Notifier les futures en attente
            for future in request.futures:
                future.set_result(result)

            return result

        except Exception as e:
            request.error = e
            request.completed = True

            # Notifier les futures en attente
            for future in request.futures:
                future.set_exception(e)

            raise

        finally:
            # Nettoyer
            with lock:
                if key in self._pending:
                    del self._pending[key]

    def _get_cached(self, key: str) -> Optional[Any]:
        if not self._redis:
            return None

        data = self._redis.get(f"{COALESCE_PREFIX}cache:{key}")
        if data:
            return json.loads(data)
        return None

    def _set_cached(self, key: str, value: Any, ttl: int):
        if self._redis:
            self._redis.setex(
                f"{COALESCE_PREFIX}cache:{key}",
                ttl,
                json.dumps(value, default=str)
            )

    def get_stats(self) -> Dict:
        """Retourne les statistiques"""
        return {
            'pending_requests': len(self._pending),
            'active_locks': len(self._locks),
        }


# =============================================================================
# BATCH COALESCER
# =============================================================================

class BatchCoalescer:
    """
    Coalescence par batch.

    Accumule les requêtes individuelles et les exécute en batch.

    Usage:
        batch = BatchCoalescer()

        # Ces appels seront regroupés
        result1 = batch.add('get_products', [1, 2, 3], fetch_products_batch)
        result2 = batch.add('get_products', [4, 5], fetch_products_batch)

        # Exécute un seul appel: fetch_products_batch([1,2,3,4,5])
    """

    def __init__(self, window_ms: int = 50, max_batch_size: int = 100):
        self._window_ms = window_ms
        self._max_batch_size = max_batch_size
        self._batches: Dict[str, Dict] = {}
        self._locks: Dict[str, threading.Lock] = {}
        self._timers: Dict[str, threading.Timer] = {}

    def add(
        self,
        batch_key: str,
        items: list,
        batch_func: Callable,
        item_key_func: Callable = None
    ) -> Dict:
        """
        Ajoute des items à un batch.

        Args:
            batch_key: Clé du batch
            items: Items à ajouter
            batch_func: Fonction qui traite le batch
            item_key_func: Fonction pour extraire la clé d'un item

        Returns:
            Dict avec les résultats par item
        """
        if batch_key not in self._locks:
            self._locks[batch_key] = threading.Lock()

        lock = self._locks[batch_key]

        with lock:
            if batch_key not in self._batches:
                self._batches[batch_key] = {
                    'items': [],
                    'futures': {},
                    'func': batch_func,
                    'key_func': item_key_func or (lambda x: x),
                }

            batch = self._batches[batch_key]

            # Créer les futures pour ces items
            futures = {}
            for item in items:
                key = batch['key_func'](item)
                if key not in batch['futures']:
                    future = Future()
                    batch['futures'][key] = future
                    batch['items'].append(item)
                futures[key] = batch['futures'][key]

            # Déclencher si batch plein
            if len(batch['items']) >= self._max_batch_size:
                self._execute_batch(batch_key)
            else:
                # Programmer l'exécution
                self._schedule_batch(batch_key)

        # Attendre les résultats
        results = {}
        for key, future in futures.items():
            try:
                results[key] = future.result(timeout=30)
            except Exception as e:
                results[key] = {'error': str(e)}

        return results

    def _schedule_batch(self, batch_key: str):
        """Programme l'exécution du batch"""
        if batch_key in self._timers:
            self._timers[batch_key].cancel()

        timer = threading.Timer(
            self._window_ms / 1000,
            self._execute_batch,
            args=[batch_key]
        )
        timer.start()
        self._timers[batch_key] = timer

    def _execute_batch(self, batch_key: str):
        """Exécute le batch"""
        lock = self._locks.get(batch_key)
        if not lock:
            return

        with lock:
            batch = self._batches.pop(batch_key, None)
            if batch_key in self._timers:
                self._timers[batch_key].cancel()
                del self._timers[batch_key]

        if not batch or not batch['items']:
            return

        try:
            # Exécuter la fonction batch
            results = batch['func'](batch['items'])

            # Distribuer les résultats
            for item in batch['items']:
                key = batch['key_func'](item)
                future = batch['futures'].get(key)
                if future:
                    result = results.get(key) if isinstance(results, dict) else results
                    future.set_result(result)

        except Exception as e:
            _logger.error(f"Batch execution failed: {e}")
            for future in batch['futures'].values():
                future.set_exception(e)


# =============================================================================
# DÉCORATEUR
# =============================================================================

def coalesce(
    key_func: Callable = None,
    window_ms: int = DEFAULT_WINDOW_MS,
    cache_ttl: int = 0
):
    """
    Décorateur pour coalescence automatique.

    Usage:
        @coalesce(key_func=lambda id: f'product:{id}', cache_ttl=60)
        def get_product(product_id):
            return fetch_product(product_id)
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Générer la clé
            if key_func:
                key = key_func(*args, **kwargs)
            else:
                key = hashlib.md5(
                    f"{func.__name__}:{args}:{kwargs}".encode()
                ).hexdigest()

            coalescer = RequestCoalescer()
            return coalescer.coalesce(
                key,
                lambda: func(*args, **kwargs),
                window_ms=window_ms,
                cache_ttl=cache_ttl
            )

        return wrapper
    return decorator


# =============================================================================
# HELPERS
# =============================================================================

def get_coalescer() -> RequestCoalescer:
    """Retourne l'instance du coalescer"""
    return RequestCoalescer()
