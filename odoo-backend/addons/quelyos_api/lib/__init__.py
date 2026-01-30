# -*- coding: utf-8 -*-
"""
Quelyos API Libraries

Bibliothèques utilitaires pour l'API Quelyos:
- rate_limiter: Limitation du taux de requêtes
- audit_log: Journalisation des actions
- cache: Cache avec Redis
- request_id: Traçabilité des requêtes
- webhooks: Système de webhooks
- versioning: Versioning de l'API
- secrets: Gestion sécurisée des secrets
- error_tracking: Suivi des erreurs (Sentry)
- job_queue: File d'attente de tâches
- websocket: Communication temps réel
- validation: Validation des données
- metrics: Métriques Prometheus
- query_builder: Construction sécurisée de requêtes
- event_store: Event Sourcing
- cqrs: Command Query Responsibility Segregation
- distributed_lock: Verrouillage distribué
- encryption: Chiffrement des données
- throttling: Throttling par utilisateur
- saga: Saga Pattern (transactions distribuées)
- db_routing: Read Replicas
- multitenancy: Multi-tenant support
- idempotency: Clés d'idempotence
- bulk_operations: Opérations en masse
- data_transfer: Import/Export
- profiler: Performance Profiling
- migrations: Database Migrations
- service_registry: Service Discovery
- rate_plans: Plans tarifaires API
- coalescing: Request Coalescing
- compression: Response Compression
- ab_testing: A/B Testing
- audit_dashboard: Audit Dashboard API
- health_aggregator: Health Aggregation
- deduplication: Request Deduplication
- graceful_degradation: Graceful Degradation
- cache_headers: HTTP Cache Headers
- api_analytics: API Analytics
- chaos: Chaos Engineering
- sharding: Database Sharding
- cdn: CDN Integration
- batching: Request Batching
- circuit_dashboard: Circuit Breaker Dashboard
- mocking: API Mocking
- load_shedding: Load Shedding
- priority_queue: Request Prioritization
"""

from . import cache
from . import rate_limiter
from . import audit_log
from . import request_id
from . import webhooks
from . import versioning
from . import secrets
from . import error_tracking
from . import job_queue
from . import websocket
from . import validation
from . import metrics
from . import query_builder
from . import event_store
from . import cqrs
from . import distributed_lock
from . import encryption
from . import throttling
from . import saga
from . import db_routing
from . import multitenancy
from . import idempotency
from . import bulk_operations
from . import data_transfer
from . import profiler
from . import migrations
from . import service_registry
from . import rate_plans
from . import coalescing
from . import compression
from . import ab_testing
from . import audit_dashboard
from . import health_aggregator
from . import deduplication
from . import graceful_degradation
from . import cache_headers
from . import api_analytics
from . import chaos
from . import sharding
from . import cdn
from . import batching
from . import circuit_dashboard
from . import mocking
from . import load_shedding
from . import priority_queue
from . import rls_context

# Raccourcis pratiques
from .rate_limiter import rate_limited, RateLimitConfig
from .audit_log import audit_log, AuditAction
from .cache import cached, CacheStrategies
from .request_id import with_request_id
from .webhooks import webhook_trigger
from .versioning import versioned, version_router
from .secrets import get_secret, require_secret
from .error_tracking import track_errors
from .job_queue import async_job, job_handler
from .websocket import realtime_update, get_notification_service
from .validation import validate_input, validate_data
from .metrics import track_request, track_db_query
from .query_builder import QueryBuilder
from .event_store import emit_event, EventType, get_event_store
from .cqrs import CommandBus, QueryBus
from .distributed_lock import distributed_lock, with_lock, exclusive
from .encryption import encrypt, decrypt, encrypt_field, decrypt_field
from .throttling import throttle_user, throttle_api_key, Plan
from .saga import execute_saga, get_saga_orchestrator
from .db_routing import use_read_replica, get_router
from .multitenancy import tenant_middleware, TenantContext, get_tenant
from .idempotency import idempotent
from .bulk_operations import bulk_create, bulk_update, bulk_delete
from .data_transfer import DataExporter, DataImporter
from .profiler import profile, profiler_middleware, enable_profiling
from .migrations import MigrationRunner, migration
from .service_registry import get_registry as get_service_registry, register_service
from .rate_plans import PlanTier, RatePlan, check_rate_plan, get_plan
from .coalescing import coalesce, get_coalescer
from .compression import compressed_response, compress_response
from .ab_testing import ab_test, get_ab_manager, Experiment, Variant
from .audit_dashboard import get_audit_dashboard, AlertSeverity
from .health_aggregator import get_health_aggregator, ServiceStatus
from .deduplication import deduplicate, get_deduplicator
from .graceful_degradation import get_degradation_manager, DegradationLevel
from .cache_headers import with_cache_headers, CacheControl, cache_preset
from .api_analytics import track_api_call, get_analytics
from .chaos import chaos_enabled, get_chaos_monkey, ChaosType
from .sharding import get_shard_router, ShardingStrategy
from .cdn import purge_on_change, get_cdn_manager
from .batching import BatchProcessor, DataLoader
from .circuit_dashboard import get_circuit_dashboard, CircuitState
from .mocking import mock_response, get_mock_server
from .load_shedding import get_load_shedder, LoadLevel
from .priority_queue import Priority, PriorityQueue
from .rls_context import set_rls_tenant, reset_rls_tenant, rls_tenant_context, get_current_rls_tenant
