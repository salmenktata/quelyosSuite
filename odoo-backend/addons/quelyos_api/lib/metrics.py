# -*- coding: utf-8 -*-
"""
Metrics & Observability pour Quelyos ERP

Collecte de métriques avec Prometheus:
- Compteurs de requêtes
- Histogrammes de latence
- Jauges d'état système
- Métriques business

Compatible avec l'exporteur Prometheus standard.
"""

import os
import time
import logging
from typing import Dict, Any, Optional
from functools import wraps
from datetime import datetime

_logger = logging.getLogger(__name__)

# Configuration
METRICS_ENABLED = os.environ.get('METRICS_ENABLED', 'true').lower() == 'true'
METRICS_PREFIX = 'quelyos_'

# Essayer d'importer prometheus_client
try:
    from prometheus_client import Counter, Histogram, Gauge, Summary, Info
    from prometheus_client import CollectorRegistry, generate_latest, CONTENT_TYPE_LATEST
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False
    _logger.info("prometheus_client not installed. Metrics will be collected in-memory only.")


# =============================================================================
# REGISTRY
# =============================================================================

if PROMETHEUS_AVAILABLE:
    # Créer un registre dédié pour éviter les conflits
    REGISTRY = CollectorRegistry()
else:
    REGISTRY = None


# =============================================================================
# MÉTRIQUES API
# =============================================================================

if PROMETHEUS_AVAILABLE and METRICS_ENABLED:
    # Compteur de requêtes HTTP
    http_requests_total = Counter(
        f'{METRICS_PREFIX}http_requests_total',
        'Total HTTP requests',
        ['method', 'endpoint', 'status'],
        registry=REGISTRY
    )

    # Histogramme de latence
    http_request_duration = Histogram(
        f'{METRICS_PREFIX}http_request_duration_seconds',
        'HTTP request latency',
        ['method', 'endpoint'],
        buckets=[.005, .01, .025, .05, .075, .1, .25, .5, .75, 1.0, 2.5, 5.0],
        registry=REGISTRY
    )

    # Requêtes en cours
    http_requests_in_progress = Gauge(
        f'{METRICS_PREFIX}http_requests_in_progress',
        'Number of HTTP requests in progress',
        ['method', 'endpoint'],
        registry=REGISTRY
    )

    # Erreurs API
    api_errors_total = Counter(
        f'{METRICS_PREFIX}api_errors_total',
        'Total API errors',
        ['error_type', 'endpoint'],
        registry=REGISTRY
    )
else:
    http_requests_total = None
    http_request_duration = None
    http_requests_in_progress = None
    api_errors_total = None


# =============================================================================
# MÉTRIQUES BUSINESS
# =============================================================================

if PROMETHEUS_AVAILABLE and METRICS_ENABLED:
    # Commandes
    orders_total = Counter(
        f'{METRICS_PREFIX}orders_total',
        'Total orders placed',
        ['status', 'channel'],
        registry=REGISTRY
    )

    orders_revenue = Counter(
        f'{METRICS_PREFIX}orders_revenue_total',
        'Total order revenue',
        ['currency'],
        registry=REGISTRY
    )

    # Produits
    products_total = Gauge(
        f'{METRICS_PREFIX}products_total',
        'Total number of products',
        ['status'],
        registry=REGISTRY
    )

    products_stock_level = Gauge(
        f'{METRICS_PREFIX}products_stock_level',
        'Product stock levels',
        ['product_id', 'warehouse'],
        registry=REGISTRY
    )

    low_stock_products = Gauge(
        f'{METRICS_PREFIX}products_low_stock',
        'Number of products with low stock',
        registry=REGISTRY
    )

    # Clients
    customers_total = Gauge(
        f'{METRICS_PREFIX}customers_total',
        'Total number of customers',
        registry=REGISTRY
    )

    # Sessions
    active_sessions = Gauge(
        f'{METRICS_PREFIX}active_sessions',
        'Number of active user sessions',
        registry=REGISTRY
    )
else:
    orders_total = None
    orders_revenue = None
    products_total = None
    products_stock_level = None
    low_stock_products = None
    customers_total = None
    active_sessions = None


# =============================================================================
# MÉTRIQUES SYSTÈME
# =============================================================================

if PROMETHEUS_AVAILABLE and METRICS_ENABLED:
    # Base de données
    db_connections = Gauge(
        f'{METRICS_PREFIX}db_connections',
        'Number of database connections',
        ['state'],
        registry=REGISTRY
    )

    db_query_duration = Histogram(
        f'{METRICS_PREFIX}db_query_duration_seconds',
        'Database query duration',
        ['operation'],
        buckets=[.001, .005, .01, .025, .05, .1, .25, .5, 1.0, 2.5],
        registry=REGISTRY
    )

    # Cache
    cache_hits = Counter(
        f'{METRICS_PREFIX}cache_hits_total',
        'Cache hits',
        ['cache_type'],
        registry=REGISTRY
    )

    cache_misses = Counter(
        f'{METRICS_PREFIX}cache_misses_total',
        'Cache misses',
        ['cache_type'],
        registry=REGISTRY
    )

    # Jobs
    job_queue_size = Gauge(
        f'{METRICS_PREFIX}job_queue_size',
        'Number of jobs in queue',
        ['queue'],
        registry=REGISTRY
    )

    jobs_processed = Counter(
        f'{METRICS_PREFIX}jobs_processed_total',
        'Total jobs processed',
        ['queue', 'status'],
        registry=REGISTRY
    )
else:
    db_connections = None
    db_query_duration = None
    cache_hits = None
    cache_misses = None
    job_queue_size = None
    jobs_processed = None


# =============================================================================
# DÉCORATEURS
# =============================================================================

def track_request(endpoint: str = None):
    """
    Décorateur pour tracker les métriques d'une requête HTTP.

    Usage:
        @track_request('/api/products')
        def get_products(self, **kwargs):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            if not METRICS_ENABLED or not PROMETHEUS_AVAILABLE:
                return func(self, *args, **kwargs)

            from odoo.http import request as odoo_request

            method = odoo_request.httprequest.method
            ep = endpoint or odoo_request.httprequest.path

            # Incrémenter requêtes en cours
            if http_requests_in_progress:
                http_requests_in_progress.labels(method=method, endpoint=ep).inc()

            start_time = time.time()
            status = '200'

            try:
                result = func(self, *args, **kwargs)

                # Déterminer le statut
                if isinstance(result, dict) and not result.get('success', True):
                    status = '400'

                return result

            except Exception as e:
                status = '500'
                if api_errors_total:
                    api_errors_total.labels(
                        error_type=type(e).__name__,
                        endpoint=ep
                    ).inc()
                raise

            finally:
                duration = time.time() - start_time

                # Métriques
                if http_requests_total:
                    http_requests_total.labels(
                        method=method,
                        endpoint=ep,
                        status=status
                    ).inc()

                if http_request_duration:
                    http_request_duration.labels(
                        method=method,
                        endpoint=ep
                    ).observe(duration)

                if http_requests_in_progress:
                    http_requests_in_progress.labels(method=method, endpoint=ep).dec()

        return wrapper
    return decorator


def track_db_query(operation: str = 'query'):
    """
    Décorateur pour tracker les requêtes DB.

    Usage:
        @track_db_query('select')
        def search(self, ...):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not METRICS_ENABLED or not db_query_duration:
                return func(*args, **kwargs)

            start_time = time.time()
            try:
                return func(*args, **kwargs)
            finally:
                duration = time.time() - start_time
                db_query_duration.labels(operation=operation).observe(duration)

        return wrapper
    return decorator


def track_cache(cache_type: str = 'default'):
    """
    Décorateur pour tracker les hits/misses du cache.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)

            if METRICS_ENABLED and PROMETHEUS_AVAILABLE:
                # Supposer que None = miss, sinon = hit
                if result is None:
                    if cache_misses:
                        cache_misses.labels(cache_type=cache_type).inc()
                else:
                    if cache_hits:
                        cache_hits.labels(cache_type=cache_type).inc()

            return result
        return wrapper
    return decorator


# =============================================================================
# HELPERS
# =============================================================================

def record_order(amount: float, currency: str = 'EUR', status: str = 'confirmed', channel: str = 'web'):
    """Enregistre une métrique de commande"""
    if not METRICS_ENABLED:
        return

    if orders_total:
        orders_total.labels(status=status, channel=channel).inc()

    if orders_revenue:
        orders_revenue.labels(currency=currency).inc(amount)


def update_stock_metric(product_id: int, quantity: float, warehouse: str = 'main'):
    """Met à jour la métrique de stock"""
    if METRICS_ENABLED and products_stock_level:
        products_stock_level.labels(
            product_id=str(product_id),
            warehouse=warehouse
        ).set(quantity)


def update_low_stock_count(count: int):
    """Met à jour le compteur de produits en rupture"""
    if METRICS_ENABLED and low_stock_products:
        low_stock_products.set(count)


def update_session_count(count: int):
    """Met à jour le compteur de sessions actives"""
    if METRICS_ENABLED and active_sessions:
        active_sessions.set(count)


# =============================================================================
# EXPORT
# =============================================================================

def get_metrics() -> bytes:
    """Retourne les métriques au format Prometheus"""
    if not PROMETHEUS_AVAILABLE:
        return b'# Prometheus client not installed\n'

    return generate_latest(REGISTRY)


def get_metrics_content_type() -> str:
    """Retourne le content-type pour les métriques"""
    if PROMETHEUS_AVAILABLE:
        return CONTENT_TYPE_LATEST
    return 'text/plain'


# =============================================================================
# IN-MEMORY METRICS (fallback)
# =============================================================================

class InMemoryMetrics:
    """Métriques en mémoire quand Prometheus n'est pas disponible"""

    def __init__(self):
        self._counters: Dict[str, int] = {}
        self._gauges: Dict[str, float] = {}
        self._histograms: Dict[str, list] = {}

    def inc_counter(self, name: str, labels: Dict = None, value: int = 1):
        key = self._make_key(name, labels)
        self._counters[key] = self._counters.get(key, 0) + value

    def set_gauge(self, name: str, value: float, labels: Dict = None):
        key = self._make_key(name, labels)
        self._gauges[key] = value

    def observe(self, name: str, value: float, labels: Dict = None):
        key = self._make_key(name, labels)
        if key not in self._histograms:
            self._histograms[key] = []
        self._histograms[key].append(value)

    def get_stats(self) -> Dict:
        return {
            'counters': self._counters.copy(),
            'gauges': self._gauges.copy(),
            'histograms': {k: self._calc_histogram_stats(v) for k, v in self._histograms.items()},
        }

    def _make_key(self, name: str, labels: Dict = None) -> str:
        if not labels:
            return name
        label_str = ','.join(f'{k}={v}' for k, v in sorted(labels.items()))
        return f'{name}{{{label_str}}}'

    def _calc_histogram_stats(self, values: list) -> Dict:
        if not values:
            return {'count': 0}
        return {
            'count': len(values),
            'sum': sum(values),
            'avg': sum(values) / len(values),
            'min': min(values),
            'max': max(values),
        }


# Instance fallback
_in_memory_metrics = InMemoryMetrics()


def get_in_memory_metrics() -> InMemoryMetrics:
    """Retourne l'instance de métriques en mémoire"""
    return _in_memory_metrics
