# -*- coding: utf-8 -*-
"""
Idempotency Keys pour Quelyos ERP

Garantit l'idempotence des requêtes API:
- Évite les doublons lors de retry
- Cache des réponses par clé
- TTL configurable
- Support des requêtes concurrentes

Header: Idempotency-Key: <uuid>
"""

import os
import json
import time
import hashlib
import logging
from typing import Dict, Any, Optional, Tuple
from functools import wraps
from dataclasses import dataclass

_logger = logging.getLogger(__name__)

# Configuration
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
IDEMPOTENCY_PREFIX = 'quelyos:idempotency:'
IDEMPOTENCY_HEADER = 'Idempotency-Key'
DEFAULT_TTL = 86400  # 24 heures
LOCK_TTL = 30  # 30 secondes pour le lock


# =============================================================================
# TYPES
# =============================================================================

@dataclass
class IdempotencyRecord:
    """Enregistrement d'une requête idempotente"""
    key: str
    status: str  # 'processing', 'completed', 'error'
    response: Optional[Dict] = None
    status_code: int = 200
    created_at: float = 0
    completed_at: Optional[float] = None
    request_hash: Optional[str] = None

    def to_dict(self) -> Dict:
        return {
            'key': self.key,
            'status': self.status,
            'response': self.response,
            'status_code': self.status_code,
            'created_at': self.created_at,
            'completed_at': self.completed_at,
            'request_hash': self.request_hash,
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'IdempotencyRecord':
        return cls(**data)


# =============================================================================
# IDEMPOTENCY STORE
# =============================================================================

class IdempotencyStore:
    """
    Store pour les clés d'idempotence.

    Usage:
        store = IdempotencyStore()

        # Vérifier/créer une clé
        record, is_new = store.get_or_create(key, request_hash)

        if not is_new:
            # Requête déjà traitée, retourner la réponse cachée
            return record.response

        # Traiter la requête...

        # Enregistrer la réponse
        store.complete(key, response, status_code)
    """

    def __init__(self):
        self._redis = None
        self._local_cache: Dict[str, IdempotencyRecord] = {}
        self._init_redis()

    def _init_redis(self):
        try:
            import redis
            self._redis = redis.from_url(REDIS_URL)
        except Exception as e:
            _logger.warning(f"Redis not available for idempotency: {e}")

    def get_or_create(
        self,
        key: str,
        request_hash: str,
        ttl: int = DEFAULT_TTL
    ) -> Tuple[Optional[IdempotencyRecord], bool]:
        """
        Récupère ou crée un enregistrement d'idempotence.

        Args:
            key: Clé d'idempotence
            request_hash: Hash de la requête (pour détecter les conflits)
            ttl: Durée de vie en secondes

        Returns:
            Tuple (record, is_new)
        """
        redis_key = f"{IDEMPOTENCY_PREFIX}{key}"

        if self._redis:
            # Essayer d'acquérir avec SET NX
            record_data = self._redis.get(redis_key)

            if record_data:
                record = IdempotencyRecord.from_dict(json.loads(record_data))

                # Vérifier le hash de la requête
                if record.request_hash and record.request_hash != request_hash:
                    raise IdempotencyConflictError(
                        f"Idempotency key '{key}' already used with different request"
                    )

                return record, False

            # Créer un nouvel enregistrement
            record = IdempotencyRecord(
                key=key,
                status='processing',
                created_at=time.time(),
                request_hash=request_hash,
            )

            # SET NX avec TTL
            created = self._redis.set(
                redis_key,
                json.dumps(record.to_dict()),
                nx=True,
                ex=ttl
            )

            if not created:
                # Race condition, récupérer l'existant
                record_data = self._redis.get(redis_key)
                if record_data:
                    return IdempotencyRecord.from_dict(json.loads(record_data)), False

            return record, True

        else:
            # Fallback mémoire locale
            if key in self._local_cache:
                record = self._local_cache[key]
                if record.request_hash and record.request_hash != request_hash:
                    raise IdempotencyConflictError(
                        f"Idempotency key '{key}' already used"
                    )
                return record, False

            record = IdempotencyRecord(
                key=key,
                status='processing',
                created_at=time.time(),
                request_hash=request_hash,
            )
            self._local_cache[key] = record
            return record, True

    def complete(
        self,
        key: str,
        response: Dict,
        status_code: int = 200,
        ttl: int = DEFAULT_TTL
    ):
        """
        Marque une requête comme complétée avec sa réponse.

        Args:
            key: Clé d'idempotence
            response: Réponse à cacher
            status_code: Code HTTP de la réponse
            ttl: Durée de vie en secondes
        """
        redis_key = f"{IDEMPOTENCY_PREFIX}{key}"

        record = IdempotencyRecord(
            key=key,
            status='completed',
            response=response,
            status_code=status_code,
            created_at=time.time(),
            completed_at=time.time(),
        )

        if self._redis:
            self._redis.setex(
                redis_key,
                ttl,
                json.dumps(record.to_dict())
            )
        else:
            self._local_cache[key] = record

    def error(self, key: str, error: str, ttl: int = 300):
        """
        Marque une requête comme échouée.

        Note: TTL court pour permettre retry rapide.
        """
        redis_key = f"{IDEMPOTENCY_PREFIX}{key}"

        record = IdempotencyRecord(
            key=key,
            status='error',
            response={'error': error},
            status_code=500,
            created_at=time.time(),
            completed_at=time.time(),
        )

        if self._redis:
            self._redis.setex(
                redis_key,
                ttl,  # TTL court pour les erreurs
                json.dumps(record.to_dict())
            )
        else:
            self._local_cache[key] = record

    def get(self, key: str) -> Optional[IdempotencyRecord]:
        """Récupère un enregistrement"""
        redis_key = f"{IDEMPOTENCY_PREFIX}{key}"

        if self._redis:
            data = self._redis.get(redis_key)
            if data:
                return IdempotencyRecord.from_dict(json.loads(data))
        else:
            return self._local_cache.get(key)

        return None

    def delete(self, key: str):
        """Supprime un enregistrement"""
        redis_key = f"{IDEMPOTENCY_PREFIX}{key}"

        if self._redis:
            self._redis.delete(redis_key)
        else:
            self._local_cache.pop(key, None)


class IdempotencyConflictError(Exception):
    """Erreur de conflit d'idempotence"""
    pass


# =============================================================================
# DÉCORATEUR
# =============================================================================

def idempotent(ttl: int = DEFAULT_TTL, required: bool = False):
    """
    Décorateur pour rendre un endpoint idempotent.

    Args:
        ttl: Durée de vie du cache en secondes
        required: Si True, refuse les requêtes sans clé

    Usage:
        @idempotent(ttl=3600)
        @http.route('/api/orders', methods=['POST'], ...)
        def create_order(self, **kwargs):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            from odoo.http import request

            # Récupérer la clé d'idempotence
            idempotency_key = request.httprequest.headers.get(IDEMPOTENCY_HEADER)

            if not idempotency_key:
                if required:
                    return {
                        'success': False,
                        'error': f'Header {IDEMPOTENCY_HEADER} is required',
                        'error_code': 'IDEMPOTENCY_KEY_REQUIRED',
                    }
                # Pas de clé, exécuter normalement
                return func(self, *args, **kwargs)

            # Calculer le hash de la requête
            request_data = {
                'method': request.httprequest.method,
                'path': request.httprequest.path,
                'body': request.httprequest.get_data(as_text=True),
            }
            request_hash = hashlib.sha256(
                json.dumps(request_data, sort_keys=True).encode()
            ).hexdigest()

            store = IdempotencyStore()

            try:
                record, is_new = store.get_or_create(
                    idempotency_key,
                    request_hash,
                    ttl
                )
            except IdempotencyConflictError as e:
                return {
                    'success': False,
                    'error': str(e),
                    'error_code': 'IDEMPOTENCY_CONFLICT',
                }

            if not is_new:
                # Requête déjà traitée
                if record.status == 'processing':
                    # Encore en cours
                    return {
                        'success': False,
                        'error': 'Request is still processing',
                        'error_code': 'REQUEST_IN_PROGRESS',
                    }

                if record.status == 'completed':
                    # Retourner la réponse cachée
                    _logger.debug(f"Returning cached response for key: {idempotency_key}")
                    return record.response

                if record.status == 'error':
                    # Permettre retry après erreur
                    pass

            # Exécuter la requête
            try:
                result = func(self, *args, **kwargs)

                # Déterminer le status code
                status_code = 200
                if isinstance(result, dict):
                    if not result.get('success', True):
                        status_code = 400

                store.complete(idempotency_key, result, status_code, ttl)
                return result

            except Exception as e:
                _logger.error(f"Idempotent request failed: {e}")
                store.error(idempotency_key, str(e))
                raise

        return wrapper
    return decorator


# =============================================================================
# HELPERS
# =============================================================================

def generate_idempotency_key() -> str:
    """Génère une clé d'idempotence unique"""
    import uuid
    return str(uuid.uuid4())


def get_idempotency_store() -> IdempotencyStore:
    """Retourne l'instance du store"""
    return IdempotencyStore()
