# -*- coding: utf-8 -*-
"""
Request Batching pour Quelyos API

Agrégation de requêtes multiples:
- Batch API endpoint
- DataLoader pattern
- Coalescing automatique
"""

import os
import json
import logging
import threading
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime
from dataclasses import dataclass
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, Future
import time

_logger = logging.getLogger(__name__)

REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')


@dataclass
class BatchRequest:
    """Requête individuelle dans un batch"""
    id: str
    method: str  # GET, POST, etc.
    path: str
    body: Optional[Dict] = None
    headers: Optional[Dict] = None


@dataclass
class BatchResponse:
    """Réponse individuelle d'un batch"""
    id: str
    status: int
    body: Any
    headers: Optional[Dict] = None


class BatchProcessor:
    """Processeur de requêtes batch"""

    def __init__(self, max_batch_size: int = 50, max_workers: int = 10):
        self._max_batch_size = max_batch_size
        self._executor = ThreadPoolExecutor(max_workers=max_workers)
        self._handlers: Dict[str, Callable] = {}

    def register_handler(self, path_pattern: str, handler: Callable):
        """Enregistre un handler pour un pattern de chemin"""
        self._handlers[path_pattern] = handler

    def process_batch(
        self,
        requests: List[BatchRequest],
        context: Dict[str, Any] = None
    ) -> List[BatchResponse]:
        """
        Traite un batch de requêtes.

        Args:
            requests: Liste des requêtes
            context: Contexte partagé (auth, etc.)

        Returns:
            Liste des réponses dans le même ordre
        """
        if len(requests) > self._max_batch_size:
            return [BatchResponse(
                id=r.id,
                status=400,
                body={'error': f'Batch too large (max {self._max_batch_size})'}
            ) for r in requests]

        # Grouper par path pour optimisation
        grouped = defaultdict(list)
        for req in requests:
            grouped[req.path].append(req)

        # Traiter en parallèle
        futures: Dict[str, Future] = {}
        for req in requests:
            future = self._executor.submit(
                self._process_single,
                req,
                context
            )
            futures[req.id] = future

        # Collecter résultats
        responses = []
        for req in requests:
            try:
                response = futures[req.id].result(timeout=30)
                responses.append(response)
            except Exception as e:
                responses.append(BatchResponse(
                    id=req.id,
                    status=500,
                    body={'error': str(e)}
                ))

        return responses

    def _process_single(
        self,
        req: BatchRequest,
        context: Dict[str, Any]
    ) -> BatchResponse:
        """Traite une requête individuelle"""
        try:
            # Trouver handler
            handler = self._find_handler(req.path)
            if not handler:
                return BatchResponse(
                    id=req.id,
                    status=404,
                    body={'error': f'No handler for path: {req.path}'}
                )

            # Exécuter
            result = handler(
                method=req.method,
                path=req.path,
                body=req.body,
                headers=req.headers,
                context=context
            )

            return BatchResponse(
                id=req.id,
                status=200,
                body=result
            )

        except Exception as e:
            _logger.error(f"Batch request {req.id} failed: {e}")
            return BatchResponse(
                id=req.id,
                status=500,
                body={'error': str(e)}
            )

    def _find_handler(self, path: str) -> Optional[Callable]:
        """Trouve le handler pour un chemin"""
        # Match exact
        if path in self._handlers:
            return self._handlers[path]

        # Match pattern (simple wildcard)
        for pattern, handler in self._handlers.items():
            if '*' in pattern:
                prefix = pattern.split('*')[0]
                if path.startswith(prefix):
                    return handler

        return None


class DataLoader:
    """
    DataLoader pattern pour batching automatique.

    Accumule les requêtes pendant une fenêtre temporelle
    puis les exécute en batch.
    """

    def __init__(
        self,
        batch_fn: Callable[[List[Any]], Dict[Any, Any]],
        batch_window_ms: int = 10,
        max_batch_size: int = 100
    ):
        self._batch_fn = batch_fn
        self._batch_window_ms = batch_window_ms
        self._max_batch_size = max_batch_size

        self._pending: Dict[Any, List[threading.Event]] = defaultdict(list)
        self._results: Dict[Any, Any] = {}
        self._lock = threading.Lock()
        self._batch_scheduled = False

    def load(self, key: Any) -> Any:
        """
        Charge une valeur par clé.

        Les appels sont automatiquement batchés.
        """
        event = threading.Event()

        with self._lock:
            self._pending[key].append(event)

            # Programmer batch si nécessaire
            if not self._batch_scheduled:
                self._batch_scheduled = True
                threading.Timer(
                    self._batch_window_ms / 1000,
                    self._execute_batch
                ).start()

        # Attendre résultat
        event.wait(timeout=30)

        with self._lock:
            return self._results.get(key)

    def load_many(self, keys: List[Any]) -> Dict[Any, Any]:
        """Charge plusieurs valeurs"""
        events = []

        with self._lock:
            for key in keys:
                event = threading.Event()
                self._pending[key].append(event)
                events.append((key, event))

            if not self._batch_scheduled:
                self._batch_scheduled = True
                threading.Timer(
                    self._batch_window_ms / 1000,
                    self._execute_batch
                ).start()

        # Attendre tous les résultats
        for key, event in events:
            event.wait(timeout=30)

        with self._lock:
            return {key: self._results.get(key) for key in keys}

    def _execute_batch(self):
        """Exécute le batch accumulé"""
        with self._lock:
            self._batch_scheduled = False

            if not self._pending:
                return

            # Collecter les clés
            keys = list(self._pending.keys())

            # Limiter taille
            if len(keys) > self._max_batch_size:
                keys = keys[:self._max_batch_size]

        try:
            # Exécuter batch
            results = self._batch_fn(keys)

            with self._lock:
                # Stocker résultats
                for key, value in results.items():
                    self._results[key] = value

                    # Notifier les waiters
                    for event in self._pending.get(key, []):
                        event.set()

                    # Cleanup
                    self._pending.pop(key, None)

        except Exception as e:
            _logger.error(f"DataLoader batch failed: {e}")

            with self._lock:
                # Notifier erreur
                for key in keys:
                    for event in self._pending.get(key, []):
                        event.set()
                    self._pending.pop(key, None)

    def clear(self, key: Any = None):
        """Vide le cache"""
        with self._lock:
            if key:
                self._results.pop(key, None)
            else:
                self._results.clear()


class BatchAPIEndpoint:
    """Endpoint générique pour batch API"""

    def __init__(self, processor: BatchProcessor = None):
        self._processor = processor or BatchProcessor()

    def handle(self, requests_data: List[Dict]) -> List[Dict]:
        """
        Gère une requête batch.

        Input format:
        [
            {"id": "1", "method": "GET", "path": "/api/products/1"},
            {"id": "2", "method": "POST", "path": "/api/orders", "body": {...}}
        ]

        Output format:
        [
            {"id": "1", "status": 200, "body": {...}},
            {"id": "2", "status": 201, "body": {...}}
        ]
        """
        # Parser requests
        requests = [
            BatchRequest(
                id=r.get('id', str(i)),
                method=r.get('method', 'GET'),
                path=r.get('path', ''),
                body=r.get('body'),
                headers=r.get('headers'),
            )
            for i, r in enumerate(requests_data)
        ]

        # Traiter
        responses = self._processor.process_batch(requests)

        # Formater réponses
        return [
            {
                'id': r.id,
                'status': r.status,
                'body': r.body,
                'headers': r.headers,
            }
            for r in responses
        ]


# Singleton
_batch_processor = None


def get_batch_processor() -> BatchProcessor:
    """Retourne le processeur batch"""
    global _batch_processor
    if _batch_processor is None:
        _batch_processor = BatchProcessor()
    return _batch_processor


def create_dataloader(model: str, field: str = 'id'):
    """
    Crée un DataLoader pour un modèle Odoo.

    Usage:
        product_loader = create_dataloader('product.product')
        product = product_loader.load(123)
    """
    def batch_load(ids):
        # Cette fonction sera appelée avec une liste d'IDs
        # Elle doit retourner un dict {id: record}
        try:
            from odoo import api, SUPERUSER_ID
            from odoo.modules.registry import Registry

            db_name = os.environ.get('PGDATABASE', 'odoo')
            registry = Registry(db_name)

            with registry.cursor() as cr:
                env = api.Environment(cr, SUPERUSER_ID, {})
                records = env[model].browse(ids)
                return {r[field]: r.read()[0] if r.exists() else None for r in records}
        except Exception as e:
            _logger.error(f"DataLoader batch_load failed: {e}")
            return {}

    return DataLoader(batch_load)
