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
