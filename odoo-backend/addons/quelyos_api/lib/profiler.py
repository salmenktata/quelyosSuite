# -*- coding: utf-8 -*-
"""
Performance Profiler pour Quelyos ERP

Profilage des performances:
- Temps d'exécution des méthodes
- Queries SQL lentes
- Utilisation mémoire
- Détection de N+1 queries
- Flamegraphs
"""

import os
import time
import logging
import functools
import threading
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime
from contextlib import contextmanager
import traceback

_logger = logging.getLogger(__name__)

# Configuration
PROFILER_ENABLED = os.environ.get('PROFILER_ENABLED', 'false').lower() == 'true'
SLOW_QUERY_THRESHOLD_MS = int(os.environ.get('SLOW_QUERY_THRESHOLD_MS', 100))
N_PLUS_ONE_THRESHOLD = 5  # Nombre de requêtes similaires avant alerte


# =============================================================================
# TYPES
# =============================================================================

@dataclass
class ProfilerSpan:
    """Un span de profilage (une opération)"""
    name: str
    start_time: float
    end_time: Optional[float] = None
    duration_ms: Optional[float] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    children: List['ProfilerSpan'] = field(default_factory=list)
    sql_queries: List[Dict] = field(default_factory=list)
    parent: Optional['ProfilerSpan'] = None

    def stop(self):
        self.end_time = time.time()
        self.duration_ms = (self.end_time - self.start_time) * 1000

    def to_dict(self) -> Dict:
        return {
            'name': self.name,
            'duration_ms': self.duration_ms,
            'metadata': self.metadata,
            'sql_query_count': len(self.sql_queries),
            'children': [c.to_dict() for c in self.children],
        }


@dataclass
class SQLQuery:
    """Enregistrement d'une requête SQL"""
    query: str
    duration_ms: float
    timestamp: float
    stack: Optional[str] = None
    params: Optional[tuple] = None


# =============================================================================
# PROFILER CONTEXT
# =============================================================================

class ProfilerContext:
    """
    Context thread-local pour le profilage.

    Usage:
        with ProfilerContext.span('my_operation'):
            # Code à profiler
            ...

        # Récupérer les résultats
        results = ProfilerContext.get_results()
    """

    _local = threading.local()

    @classmethod
    def _get_state(cls):
        if not hasattr(cls._local, 'state'):
            cls._local.state = {
                'enabled': PROFILER_ENABLED,
                'root': None,
                'current': None,
                'sql_queries': [],
                'n_plus_one_patterns': {},
            }
        return cls._local.state

    @classmethod
    @contextmanager
    def span(cls, name: str, **metadata):
        """Crée un span de profilage"""
        state = cls._get_state()

        if not state['enabled']:
            yield
            return

        span = ProfilerSpan(
            name=name,
            start_time=time.time(),
            metadata=metadata,
        )

        # Lier au parent
        if state['current']:
            span.parent = state['current']
            state['current'].children.append(span)
        else:
            state['root'] = span

        # Définir comme courant
        previous = state['current']
        state['current'] = span

        try:
            yield span
        finally:
            span.stop()
            state['current'] = previous

    @classmethod
    def record_sql(cls, query: str, duration_ms: float, params: tuple = None):
        """Enregistre une requête SQL"""
        state = cls._get_state()

        if not state['enabled']:
            return

        sql = SQLQuery(
            query=query,
            duration_ms=duration_ms,
            timestamp=time.time(),
            params=params,
            stack=traceback.format_stack()[-5:-1] if duration_ms > SLOW_QUERY_THRESHOLD_MS else None,
        )

        state['sql_queries'].append(sql)

        # Enregistrer dans le span courant
        if state['current']:
            state['current'].sql_queries.append({
                'query': query[:200],
                'duration_ms': duration_ms,
            })

        # Détection N+1
        cls._detect_n_plus_one(query)

    @classmethod
    def _detect_n_plus_one(cls, query: str):
        """Détecte les patterns N+1"""
        state = cls._get_state()

        # Normaliser la requête (remplacer les IDs)
        import re
        normalized = re.sub(r'\b\d+\b', '?', query)
        normalized = re.sub(r"'[^']*'", '?', normalized)

        if normalized not in state['n_plus_one_patterns']:
            state['n_plus_one_patterns'][normalized] = 0

        state['n_plus_one_patterns'][normalized] += 1

        if state['n_plus_one_patterns'][normalized] == N_PLUS_ONE_THRESHOLD:
            _logger.warning(f"Potential N+1 query detected: {query[:100]}...")

    @classmethod
    def get_results(cls) -> Dict:
        """Récupère les résultats du profilage"""
        state = cls._get_state()

        if not state['root']:
            return {}

        # Trouver les requêtes lentes
        slow_queries = [
            {'query': q.query[:200], 'duration_ms': q.duration_ms}
            for q in state['sql_queries']
            if q.duration_ms > SLOW_QUERY_THRESHOLD_MS
        ]

        # N+1 patterns
        n_plus_one = [
            {'pattern': p[:100], 'count': c}
            for p, c in state['n_plus_one_patterns'].items()
            if c >= N_PLUS_ONE_THRESHOLD
        ]

        return {
            'spans': state['root'].to_dict(),
            'total_duration_ms': state['root'].duration_ms,
            'sql_query_count': len(state['sql_queries']),
            'slow_queries': slow_queries,
            'n_plus_one_patterns': n_plus_one,
            'timestamp': datetime.utcnow().isoformat(),
        }

    @classmethod
    def clear(cls):
        """Réinitialise le contexte"""
        state = cls._get_state()
        state['root'] = None
        state['current'] = None
        state['sql_queries'] = []
        state['n_plus_one_patterns'] = {}

    @classmethod
    def enable(cls):
        """Active le profiler"""
        cls._get_state()['enabled'] = True

    @classmethod
    def disable(cls):
        """Désactive le profiler"""
        cls._get_state()['enabled'] = False

    @classmethod
    def is_enabled(cls) -> bool:
        """Vérifie si le profiler est actif"""
        return cls._get_state()['enabled']


# =============================================================================
# DÉCORATEURS
# =============================================================================

def profile(name: str = None, **metadata):
    """
    Décorateur pour profiler une fonction.

    Usage:
        @profile('my_operation')
        def my_function():
            ...

        @profile()
        def another_function():
            # Utilise le nom de la fonction
            ...
    """
    def decorator(func):
        span_name = name or func.__name__

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            with ProfilerContext.span(span_name, **metadata):
                return func(*args, **kwargs)

        return wrapper
    return decorator


def profile_method(func):
    """Décorateur pour profiler une méthode de classe"""
    @functools.wraps(func)
    def wrapper(self, *args, **kwargs):
        class_name = self.__class__.__name__
        method_name = func.__name__
        span_name = f"{class_name}.{method_name}"

        with ProfilerContext.span(span_name):
            return func(self, *args, **kwargs)

    return wrapper


# =============================================================================
# SQL PROFILER PATCH
# =============================================================================

class SQLProfiler:
    """
    Patch pour profiler les requêtes SQL Odoo.

    Usage:
        # Au démarrage de l'application
        SQLProfiler.patch()

        # Pour désactiver
        SQLProfiler.unpatch()
    """

    _original_execute = None
    _patched = False

    @classmethod
    def patch(cls):
        """Patche cursor.execute pour profiler les queries"""
        if cls._patched:
            return

        try:
            from odoo.sql_db import Cursor

            cls._original_execute = Cursor.execute

            def profiled_execute(self, query, params=None, log_exceptions=True):
                start = time.time()
                try:
                    return cls._original_execute(self, query, params, log_exceptions)
                finally:
                    duration_ms = (time.time() - start) * 1000
                    ProfilerContext.record_sql(query, duration_ms, params)

            Cursor.execute = profiled_execute
            cls._patched = True
            _logger.info("SQL Profiler enabled")

        except Exception as e:
            _logger.warning(f"Could not patch SQL profiler: {e}")

    @classmethod
    def unpatch(cls):
        """Restaure cursor.execute original"""
        if not cls._patched or not cls._original_execute:
            return

        try:
            from odoo.sql_db import Cursor
            Cursor.execute = cls._original_execute
            cls._patched = False
            _logger.info("SQL Profiler disabled")
        except Exception:
            pass


# =============================================================================
# MEMORY PROFILER
# =============================================================================

class MemoryProfiler:
    """
    Profiler mémoire simple.

    Usage:
        with MemoryProfiler.track() as mem:
            # Code à profiler
            ...

        print(f"Memory used: {mem.delta_mb} MB")
    """

    @dataclass
    class MemoryStats:
        start_mb: float = 0
        end_mb: float = 0
        delta_mb: float = 0
        peak_mb: float = 0

    @classmethod
    @contextmanager
    def track(cls):
        """Suit l'utilisation mémoire"""
        stats = cls.MemoryStats()

        try:
            import tracemalloc
            tracemalloc.start()
            stats.start_mb = cls._get_memory_usage()

            yield stats

            stats.end_mb = cls._get_memory_usage()
            stats.delta_mb = stats.end_mb - stats.start_mb

            current, peak = tracemalloc.get_traced_memory()
            stats.peak_mb = peak / (1024 * 1024)
            tracemalloc.stop()

        except ImportError:
            yield stats

    @staticmethod
    def _get_memory_usage() -> float:
        """Retourne l'usage mémoire en MB"""
        try:
            import psutil
            process = psutil.Process()
            return process.memory_info().rss / (1024 * 1024)
        except ImportError:
            return 0


# =============================================================================
# MIDDLEWARE
# =============================================================================

def profiler_middleware(func):
    """
    Middleware pour profiler automatiquement les endpoints.

    Usage:
        @profiler_middleware
        @http.route('/api/products', ...)
        def get_products(self, **kwargs):
            ...
    """
    @functools.wraps(func)
    def wrapper(self, *args, **kwargs):
        from odoo.http import request

        # Vérifier si le profiling est demandé
        should_profile = (
            ProfilerContext.is_enabled() or
            request.httprequest.headers.get('X-Profile', '').lower() == 'true'
        )

        if not should_profile:
            return func(self, *args, **kwargs)

        # Activer temporairement si demandé par header
        was_enabled = ProfilerContext.is_enabled()
        if not was_enabled:
            ProfilerContext.enable()

        ProfilerContext.clear()

        endpoint = request.httprequest.path
        method = request.httprequest.method

        try:
            with ProfilerContext.span(f"{method} {endpoint}"):
                result = func(self, *args, **kwargs)

            # Ajouter les résultats de profiling à la réponse
            if isinstance(result, dict):
                profile_results = ProfilerContext.get_results()
                result['_profiling'] = profile_results

            return result

        finally:
            if not was_enabled:
                ProfilerContext.disable()
            ProfilerContext.clear()

    return wrapper


# =============================================================================
# HELPERS
# =============================================================================

def get_profiler_results() -> Dict:
    """Récupère les résultats du profiler courant"""
    return ProfilerContext.get_results()


def enable_profiling():
    """Active le profiling globalement"""
    ProfilerContext.enable()
    SQLProfiler.patch()


def disable_profiling():
    """Désactive le profiling globalement"""
    ProfilerContext.disable()
    SQLProfiler.unpatch()
