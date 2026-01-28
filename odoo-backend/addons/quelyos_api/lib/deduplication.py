# -*- coding: utf-8 -*-
"""
Request Deduplication pour Quelyos API

Déduplication des requêtes en vol:
- Évite les doubles soumissions
- Gestion des requêtes concurrentes identiques
- Timeout automatique
"""

import os
import json
import logging
import hashlib
import threading
from typing import Dict, Any, Optional, Callable
from datetime import datetime
from functools import wraps

_logger = logging.getLogger(__name__)

REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
DEDUP_PREFIX = 'quelyos:dedup:'
DEFAULT_TTL = 5  # 5 secondes


class RequestDeduplicator:
    """Déduplicateur de requêtes"""

    def __init__(self):
        self._redis = None
        self._local_locks: Dict[str, threading.Event] = {}
        self._local_results: Dict[str, Any] = {}
        self._init_redis()

    def _init_redis(self):
        try:
            import redis
            self._redis = redis.from_url(REDIS_URL)
            self._redis.ping()
        except Exception as e:
            _logger.warning(f"Redis not available for deduplication: {e}")

    def _compute_key(self, *args, **kwargs) -> str:
        """Calcule une clé unique pour la requête"""
        content = json.dumps({
            'args': [str(a) for a in args],
            'kwargs': {k: str(v) for k, v in sorted(kwargs.items())},
        }, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()[:16]

    def execute_once(
        self,
        key: str,
        func: Callable,
        *args,
        ttl: int = DEFAULT_TTL,
        **kwargs
    ) -> Any:
        """
        Exécute une fonction une seule fois pour des requêtes identiques.

        Args:
            key: Clé unique de la requête
            func: Fonction à exécuter
            ttl: Durée de vie du lock en secondes
            *args, **kwargs: Arguments de la fonction

        Returns:
            Résultat de la fonction
        """
        full_key = f"{DEDUP_PREFIX}{key}"

        # Mode Redis
        if self._redis:
            return self._execute_once_redis(full_key, func, args, kwargs, ttl)

        # Mode local (fallback)
        return self._execute_once_local(full_key, func, args, kwargs, ttl)

    def _execute_once_redis(
        self,
        key: str,
        func: Callable,
        args: tuple,
        kwargs: dict,
        ttl: int
    ) -> Any:
        """Exécution avec Redis"""
        # Essayer d'acquérir le lock
        acquired = self._redis.set(
            f"{key}:lock",
            'processing',
            nx=True,
            ex=ttl
        )

        if acquired:
            # Premier arrivé: exécuter
            try:
                result = func(*args, **kwargs)

                # Stocker le résultat
                self._redis.setex(
                    f"{key}:result",
                    ttl,
                    json.dumps({
                        'success': True,
                        'data': result if isinstance(result, (dict, list, str, int, float, bool, type(None))) else str(result),
                    })
                )

                return result

            except Exception as e:
                # Stocker l'erreur
                self._redis.setex(
                    f"{key}:result",
                    ttl,
                    json.dumps({
                        'success': False,
                        'error': str(e),
                    })
                )
                raise

            finally:
                # Libérer le lock
                self._redis.delete(f"{key}:lock")

        else:
            # Requête en cours: attendre le résultat
            import time
            max_wait = ttl
            waited = 0

            while waited < max_wait:
                result_data = self._redis.get(f"{key}:result")
                if result_data:
                    result = json.loads(result_data)
                    if result['success']:
                        return result['data']
                    else:
                        raise Exception(f"Deduplicated request failed: {result['error']}")

                time.sleep(0.1)
                waited += 0.1

            # Timeout: exécuter quand même
            _logger.warning(f"Deduplication timeout for {key}, executing anyway")
            return func(*args, **kwargs)

    def _execute_once_local(
        self,
        key: str,
        func: Callable,
        args: tuple,
        kwargs: dict,
        ttl: int
    ) -> Any:
        """Exécution en mode local (sans Redis)"""
        # Vérifier si déjà en cours
        if key in self._local_locks:
            event = self._local_locks[key]
            event.wait(timeout=ttl)

            if key in self._local_results:
                result = self._local_results[key]
                if isinstance(result, Exception):
                    raise result
                return result

        # Créer event
        event = threading.Event()
        self._local_locks[key] = event

        try:
            result = func(*args, **kwargs)
            self._local_results[key] = result
            return result

        except Exception as e:
            self._local_results[key] = e
            raise

        finally:
            event.set()
            # Cleanup après TTL
            def cleanup():
                import time
                time.sleep(ttl)
                self._local_locks.pop(key, None)
                self._local_results.pop(key, None)

            threading.Thread(target=cleanup, daemon=True).start()

    def is_duplicate(self, key: str) -> bool:
        """Vérifie si une requête est en cours de traitement"""
        full_key = f"{DEDUP_PREFIX}{key}:lock"

        if self._redis:
            return self._redis.exists(full_key) > 0

        return key in self._local_locks


# Singleton
_deduplicator = None


def get_deduplicator() -> RequestDeduplicator:
    """Retourne le déduplicateur singleton"""
    global _deduplicator
    if _deduplicator is None:
        _deduplicator = RequestDeduplicator()
    return _deduplicator


def deduplicate(key_func: Callable = None, ttl: int = DEFAULT_TTL):
    """
    Décorateur pour dédupliquer les requêtes.

    Args:
        key_func: Fonction (args, kwargs) -> str pour générer la clé
        ttl: Durée de vie de la déduplication

    Usage:
        @deduplicate(key_func=lambda a, k: f"order:{k.get('order_id')}")
        def process_payment(self, order_id, **kwargs):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            dedup = get_deduplicator()

            # Générer la clé
            if key_func:
                key = key_func(args, kwargs)
            else:
                key = dedup._compute_key(func.__name__, *args, **kwargs)

            return dedup.execute_once(key, func, self, *args, ttl=ttl, **kwargs)

        return wrapper
    return decorator
