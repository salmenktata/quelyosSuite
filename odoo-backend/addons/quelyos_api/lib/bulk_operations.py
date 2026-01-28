# -*- coding: utf-8 -*-
"""
Bulk Operations pour Quelyos ERP

Opérations en masse optimisées:
- Import/Export en batch
- Validation parallèle
- Gestion des erreurs partielles
- Progress tracking
- Rollback sélectif
"""

import os
import json
import logging
import uuid
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

_logger = logging.getLogger(__name__)

# Configuration
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
BULK_PREFIX = 'quelyos:bulk:'
DEFAULT_BATCH_SIZE = 100
MAX_BATCH_SIZE = 1000
MAX_WORKERS = 4


# =============================================================================
# TYPES
# =============================================================================

class BulkOperationType(Enum):
    """Types d'opérations bulk"""
    CREATE = 'create'
    UPDATE = 'update'
    DELETE = 'delete'
    UPSERT = 'upsert'


class BulkStatus(Enum):
    """États d'une opération bulk"""
    PENDING = 'pending'
    VALIDATING = 'validating'
    PROCESSING = 'processing'
    COMPLETED = 'completed'
    PARTIAL = 'partial'  # Succès partiel
    FAILED = 'failed'
    CANCELLED = 'cancelled'


@dataclass
class BulkItemResult:
    """Résultat d'un item individuel"""
    index: int
    success: bool
    id: Optional[int] = None
    error: Optional[str] = None
    data: Optional[Dict] = None


@dataclass
class BulkOperationResult:
    """Résultat complet d'une opération bulk"""
    id: str
    status: BulkStatus
    total: int
    processed: int
    succeeded: int
    failed: int
    errors: List[Dict] = field(default_factory=list)
    results: List[BulkItemResult] = field(default_factory=list)
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    duration_ms: Optional[int] = None

    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'status': self.status.value,
            'total': self.total,
            'processed': self.processed,
            'succeeded': self.succeeded,
            'failed': self.failed,
            'errors': self.errors[:10],  # Limiter les erreurs retournées
            'error_count': len(self.errors),
            'started_at': self.started_at,
            'completed_at': self.completed_at,
            'duration_ms': self.duration_ms,
        }


# =============================================================================
# BULK PROCESSOR
# =============================================================================

class BulkProcessor:
    """
    Processeur d'opérations en masse.

    Usage:
        processor = BulkProcessor(env)

        # Créer des produits en masse
        result = processor.bulk_create(
            'product.product',
            products_data,
            batch_size=50
        )

        # Mettre à jour en masse
        result = processor.bulk_update(
            'product.product',
            updates,  # [{'id': 1, 'values': {...}}, ...]
        )

        # Supprimer en masse
        result = processor.bulk_delete(
            'product.product',
            [1, 2, 3, 4, 5]
        )
    """

    def __init__(self, env):
        self.env = env
        self._redis = None
        self._init_redis()

    def _init_redis(self):
        try:
            import redis
            self._redis = redis.from_url(REDIS_URL)
        except Exception:
            pass

    def bulk_create(
        self,
        model: str,
        items: List[Dict],
        batch_size: int = DEFAULT_BATCH_SIZE,
        validate: bool = True,
        on_progress: Callable = None
    ) -> BulkOperationResult:
        """
        Crée des enregistrements en masse.

        Args:
            model: Nom du modèle Odoo
            items: Liste des données à créer
            batch_size: Taille des lots
            validate: Valider avant création
            on_progress: Callback de progression

        Returns:
            Résultat de l'opération
        """
        operation_id = str(uuid.uuid4())
        result = BulkOperationResult(
            id=operation_id,
            status=BulkStatus.PENDING,
            total=len(items),
            processed=0,
            succeeded=0,
            failed=0,
            started_at=datetime.utcnow().isoformat(),
        )

        if not items:
            result.status = BulkStatus.COMPLETED
            return result

        batch_size = min(batch_size, MAX_BATCH_SIZE)
        Model = self.env[model].sudo()

        # Validation
        if validate:
            result.status = BulkStatus.VALIDATING
            self._save_progress(result)

            for i, item in enumerate(items):
                errors = self._validate_item(Model, item)
                if errors:
                    result.errors.append({
                        'index': i,
                        'errors': errors,
                        'data': item,
                    })

            if result.errors:
                result.status = BulkStatus.FAILED
                result.failed = len(result.errors)
                result.completed_at = datetime.utcnow().isoformat()
                return result

        # Traitement par lots
        result.status = BulkStatus.PROCESSING
        self._save_progress(result)

        for batch_start in range(0, len(items), batch_size):
            batch = items[batch_start:batch_start + batch_size]

            try:
                # Créer le lot
                created = Model.create(batch)

                for i, record in enumerate(created):
                    idx = batch_start + i
                    result.results.append(BulkItemResult(
                        index=idx,
                        success=True,
                        id=record.id,
                    ))
                    result.succeeded += 1

            except Exception as e:
                _logger.error(f"Bulk create batch failed: {e}")

                # Essayer item par item
                for i, item in enumerate(batch):
                    idx = batch_start + i
                    try:
                        record = Model.create([item])
                        result.results.append(BulkItemResult(
                            index=idx,
                            success=True,
                            id=record.id,
                        ))
                        result.succeeded += 1
                    except Exception as item_error:
                        result.results.append(BulkItemResult(
                            index=idx,
                            success=False,
                            error=str(item_error),
                        ))
                        result.errors.append({
                            'index': idx,
                            'error': str(item_error),
                        })
                        result.failed += 1

            result.processed = batch_start + len(batch)

            if on_progress:
                on_progress(result.processed, result.total)

            self._save_progress(result)

        # Finaliser
        result.completed_at = datetime.utcnow().isoformat()
        if result.failed == 0:
            result.status = BulkStatus.COMPLETED
        elif result.succeeded > 0:
            result.status = BulkStatus.PARTIAL
        else:
            result.status = BulkStatus.FAILED

        started = datetime.fromisoformat(result.started_at)
        completed = datetime.fromisoformat(result.completed_at)
        result.duration_ms = int((completed - started).total_seconds() * 1000)

        self._save_progress(result)
        return result

    def bulk_update(
        self,
        model: str,
        updates: List[Dict],
        batch_size: int = DEFAULT_BATCH_SIZE,
        on_progress: Callable = None
    ) -> BulkOperationResult:
        """
        Met à jour des enregistrements en masse.

        Args:
            model: Nom du modèle Odoo
            updates: [{'id': 1, 'values': {...}}, ...]
            batch_size: Taille des lots

        Returns:
            Résultat de l'opération
        """
        operation_id = str(uuid.uuid4())
        result = BulkOperationResult(
            id=operation_id,
            status=BulkStatus.PROCESSING,
            total=len(updates),
            processed=0,
            succeeded=0,
            failed=0,
            started_at=datetime.utcnow().isoformat(),
        )

        Model = self.env[model].sudo()

        for i, update in enumerate(updates):
            record_id = update.get('id')
            values = update.get('values', {})

            try:
                record = Model.browse(record_id)
                if record.exists():
                    record.write(values)
                    result.results.append(BulkItemResult(
                        index=i,
                        success=True,
                        id=record_id,
                    ))
                    result.succeeded += 1
                else:
                    result.results.append(BulkItemResult(
                        index=i,
                        success=False,
                        error=f"Record {record_id} not found",
                    ))
                    result.failed += 1

            except Exception as e:
                result.results.append(BulkItemResult(
                    index=i,
                    success=False,
                    error=str(e),
                ))
                result.errors.append({'index': i, 'id': record_id, 'error': str(e)})
                result.failed += 1

            result.processed = i + 1

            if on_progress and i % batch_size == 0:
                on_progress(result.processed, result.total)

        result.completed_at = datetime.utcnow().isoformat()
        result.status = (
            BulkStatus.COMPLETED if result.failed == 0
            else BulkStatus.PARTIAL if result.succeeded > 0
            else BulkStatus.FAILED
        )

        return result

    def bulk_delete(
        self,
        model: str,
        ids: List[int],
        batch_size: int = DEFAULT_BATCH_SIZE
    ) -> BulkOperationResult:
        """
        Supprime des enregistrements en masse.

        Args:
            model: Nom du modèle Odoo
            ids: Liste des IDs à supprimer
            batch_size: Taille des lots

        Returns:
            Résultat de l'opération
        """
        operation_id = str(uuid.uuid4())
        result = BulkOperationResult(
            id=operation_id,
            status=BulkStatus.PROCESSING,
            total=len(ids),
            processed=0,
            succeeded=0,
            failed=0,
            started_at=datetime.utcnow().isoformat(),
        )

        Model = self.env[model].sudo()

        for batch_start in range(0, len(ids), batch_size):
            batch_ids = ids[batch_start:batch_start + batch_size]

            try:
                records = Model.browse(batch_ids)
                existing_ids = records.exists().ids
                records.unlink()

                for record_id in batch_ids:
                    idx = batch_start + batch_ids.index(record_id)
                    if record_id in existing_ids:
                        result.results.append(BulkItemResult(
                            index=idx, success=True, id=record_id
                        ))
                        result.succeeded += 1
                    else:
                        result.results.append(BulkItemResult(
                            index=idx, success=False, id=record_id,
                            error="Record not found"
                        ))
                        result.failed += 1

            except Exception as e:
                for record_id in batch_ids:
                    idx = batch_start + batch_ids.index(record_id)
                    result.results.append(BulkItemResult(
                        index=idx, success=False, id=record_id,
                        error=str(e)
                    ))
                    result.failed += 1

            result.processed = batch_start + len(batch_ids)

        result.completed_at = datetime.utcnow().isoformat()
        result.status = (
            BulkStatus.COMPLETED if result.failed == 0
            else BulkStatus.PARTIAL if result.succeeded > 0
            else BulkStatus.FAILED
        )

        return result

    def bulk_upsert(
        self,
        model: str,
        items: List[Dict],
        key_field: str = 'id',
        batch_size: int = DEFAULT_BATCH_SIZE
    ) -> BulkOperationResult:
        """
        Upsert (create or update) en masse.

        Args:
            model: Nom du modèle Odoo
            items: Liste des données
            key_field: Champ clé pour identifier les existants

        Returns:
            Résultat de l'opération
        """
        to_create = []
        to_update = []

        Model = self.env[model].sudo()

        for i, item in enumerate(items):
            key_value = item.get(key_field)

            if key_value:
                # Chercher l'existant
                existing = Model.search([(key_field, '=', key_value)], limit=1)
                if existing:
                    to_update.append({
                        'id': existing.id,
                        'values': {k: v for k, v in item.items() if k != key_field},
                    })
                else:
                    to_create.append(item)
            else:
                to_create.append(item)

        # Traiter les créations
        create_result = self.bulk_create(model, to_create, batch_size) if to_create else None

        # Traiter les mises à jour
        update_result = self.bulk_update(model, to_update, batch_size) if to_update else None

        # Combiner les résultats
        result = BulkOperationResult(
            id=str(uuid.uuid4()),
            status=BulkStatus.COMPLETED,
            total=len(items),
            processed=len(items),
            succeeded=0,
            failed=0,
            started_at=datetime.utcnow().isoformat(),
            completed_at=datetime.utcnow().isoformat(),
        )

        if create_result:
            result.succeeded += create_result.succeeded
            result.failed += create_result.failed
            result.errors.extend(create_result.errors)

        if update_result:
            result.succeeded += update_result.succeeded
            result.failed += update_result.failed
            result.errors.extend(update_result.errors)

        if result.failed > 0 and result.succeeded > 0:
            result.status = BulkStatus.PARTIAL
        elif result.failed > 0:
            result.status = BulkStatus.FAILED

        return result

    def _validate_item(self, model, item: Dict) -> List[str]:
        """Valide un item avant création"""
        errors = []

        # Validation basique des champs requis
        required_fields = getattr(model, '_get_required_fields', lambda: [])()

        for field in required_fields:
            if field not in item or item[field] is None:
                errors.append(f"Missing required field: {field}")

        return errors

    def _save_progress(self, result: BulkOperationResult):
        """Sauvegarde la progression"""
        if self._redis:
            key = f"{BULK_PREFIX}{result.id}"
            self._redis.setex(key, 3600, json.dumps(result.to_dict()))

    def get_operation(self, operation_id: str) -> Optional[Dict]:
        """Récupère l'état d'une opération"""
        if self._redis:
            key = f"{BULK_PREFIX}{operation_id}"
            data = self._redis.get(key)
            if data:
                return json.loads(data)
        return None


# =============================================================================
# HELPERS
# =============================================================================

def bulk_create(env, model: str, items: List[Dict], **kwargs) -> BulkOperationResult:
    """Helper pour création en masse"""
    return BulkProcessor(env).bulk_create(model, items, **kwargs)


def bulk_update(env, model: str, updates: List[Dict], **kwargs) -> BulkOperationResult:
    """Helper pour mise à jour en masse"""
    return BulkProcessor(env).bulk_update(model, updates, **kwargs)


def bulk_delete(env, model: str, ids: List[int], **kwargs) -> BulkOperationResult:
    """Helper pour suppression en masse"""
    return BulkProcessor(env).bulk_delete(model, ids, **kwargs)
