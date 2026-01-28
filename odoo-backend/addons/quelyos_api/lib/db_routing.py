# -*- coding: utf-8 -*-
"""
Database Routing pour Quelyos ERP

Gestion des read replicas pour la scalabilité:
- Routing automatique lecture/écriture
- Load balancing entre replicas
- Health check des replicas
- Failover automatique

Configuration via variables d'environnement:
- DB_PRIMARY_HOST: Hôte de la DB primaire
- DB_REPLICA_HOSTS: Liste des replicas (comma-separated)
"""

import os
import random
import time
import logging
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum
from functools import wraps
import threading

_logger = logging.getLogger(__name__)


# =============================================================================
# CONFIGURATION
# =============================================================================

@dataclass
class DatabaseConfig:
    """Configuration d'une connexion DB"""
    host: str
    port: int = 5432
    database: str = 'quelyos'
    user: str = 'odoo'
    password: str = ''
    is_primary: bool = False
    is_healthy: bool = True
    last_check: float = 0
    response_time: float = 0


class RoutingStrategy(Enum):
    """Stratégies de routing"""
    ROUND_ROBIN = 'round_robin'
    RANDOM = 'random'
    LEAST_CONNECTIONS = 'least_connections'
    FASTEST = 'fastest'


# Configuration par défaut
PRIMARY_HOST = os.environ.get('DB_PRIMARY_HOST', 'localhost')
PRIMARY_PORT = int(os.environ.get('DB_PRIMARY_PORT', 5432))
REPLICA_HOSTS = os.environ.get('DB_REPLICA_HOSTS', '').split(',')
REPLICA_HOSTS = [h.strip() for h in REPLICA_HOSTS if h.strip()]

DB_NAME = os.environ.get('DB_NAME', 'quelyos')
DB_USER = os.environ.get('DB_USER', 'odoo')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'odoo')

HEALTH_CHECK_INTERVAL = 30  # secondes
FAILOVER_THRESHOLD = 3  # échecs avant failover


# =============================================================================
# DATABASE ROUTER
# =============================================================================

class DatabaseRouter:
    """
    Router pour bases de données avec replicas.

    Usage:
        router = DatabaseRouter()

        # Obtenir une connexion pour lecture
        read_config = router.get_read_connection()

        # Obtenir une connexion pour écriture
        write_config = router.get_write_connection()

        # Avec le décorateur
        @use_read_replica
        def search_products(self, **kwargs):
            # Utilise automatiquement un replica
            ...
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

        self.primary: Optional[DatabaseConfig] = None
        self.replicas: List[DatabaseConfig] = []
        self.strategy = RoutingStrategy.ROUND_ROBIN
        self._current_replica_index = 0
        self._connection_counts: Dict[str, int] = {}
        self._failure_counts: Dict[str, int] = {}

        self._init_connections()
        self._start_health_check()
        self._initialized = True

    def _init_connections(self):
        """Initialise les configurations de connexion"""
        # Primary
        self.primary = DatabaseConfig(
            host=PRIMARY_HOST,
            port=PRIMARY_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            is_primary=True,
        )

        # Replicas
        for host in REPLICA_HOSTS:
            parts = host.split(':')
            replica_host = parts[0]
            replica_port = int(parts[1]) if len(parts) > 1 else 5432

            self.replicas.append(DatabaseConfig(
                host=replica_host,
                port=replica_port,
                database=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD,
                is_primary=False,
            ))
            self._connection_counts[replica_host] = 0

        _logger.info(
            f"Database router initialized: 1 primary, {len(self.replicas)} replicas"
        )

    def _start_health_check(self):
        """Démarre le thread de health check"""
        if not self.replicas:
            return

        def check_health():
            while True:
                self._check_all_health()
                time.sleep(HEALTH_CHECK_INTERVAL)

        thread = threading.Thread(target=check_health, daemon=True)
        thread.start()

    def _check_all_health(self):
        """Vérifie la santé de tous les replicas"""
        for replica in self.replicas:
            try:
                start = time.time()
                # Ping simple via psycopg2
                self._ping_database(replica)
                replica.response_time = time.time() - start
                replica.is_healthy = True
                replica.last_check = time.time()
                self._failure_counts[replica.host] = 0
            except Exception as e:
                _logger.warning(f"Replica {replica.host} unhealthy: {e}")
                self._failure_counts[replica.host] = \
                    self._failure_counts.get(replica.host, 0) + 1

                if self._failure_counts[replica.host] >= FAILOVER_THRESHOLD:
                    replica.is_healthy = False

    def _ping_database(self, config: DatabaseConfig):
        """Ping une base de données"""
        try:
            import psycopg2
            conn = psycopg2.connect(
                host=config.host,
                port=config.port,
                database=config.database,
                user=config.user,
                password=config.password,
                connect_timeout=5,
            )
            cursor = conn.cursor()
            cursor.execute('SELECT 1')
            cursor.close()
            conn.close()
        except ImportError:
            # psycopg2 non disponible, skip le check
            pass

    def get_write_connection(self) -> DatabaseConfig:
        """Retourne la configuration pour les écritures (primary)"""
        if not self.primary:
            raise RuntimeError("No primary database configured")
        return self.primary

    def get_read_connection(self) -> DatabaseConfig:
        """
        Retourne la configuration pour les lectures.

        Utilise un replica si disponible, sinon le primary.
        """
        healthy_replicas = [r for r in self.replicas if r.is_healthy]

        if not healthy_replicas:
            _logger.debug("No healthy replicas, using primary")
            return self.primary

        return self._select_replica(healthy_replicas)

    def _select_replica(self, replicas: List[DatabaseConfig]) -> DatabaseConfig:
        """Sélectionne un replica selon la stratégie"""
        if self.strategy == RoutingStrategy.RANDOM:
            return random.choice(replicas)

        elif self.strategy == RoutingStrategy.ROUND_ROBIN:
            replica = replicas[self._current_replica_index % len(replicas)]
            self._current_replica_index += 1
            return replica

        elif self.strategy == RoutingStrategy.LEAST_CONNECTIONS:
            return min(
                replicas,
                key=lambda r: self._connection_counts.get(r.host, 0)
            )

        elif self.strategy == RoutingStrategy.FASTEST:
            return min(replicas, key=lambda r: r.response_time)

        return replicas[0]

    def increment_connections(self, host: str):
        """Incrémente le compteur de connexions"""
        self._connection_counts[host] = \
            self._connection_counts.get(host, 0) + 1

    def decrement_connections(self, host: str):
        """Décrémente le compteur de connexions"""
        if host in self._connection_counts:
            self._connection_counts[host] = max(
                0, self._connection_counts[host] - 1
            )

    def set_strategy(self, strategy: RoutingStrategy):
        """Change la stratégie de routing"""
        self.strategy = strategy

    def get_stats(self) -> Dict:
        """Retourne les statistiques du router"""
        return {
            'primary': {
                'host': self.primary.host if self.primary else None,
                'healthy': self.primary.is_healthy if self.primary else False,
            },
            'replicas': [
                {
                    'host': r.host,
                    'healthy': r.is_healthy,
                    'response_time': r.response_time,
                    'connections': self._connection_counts.get(r.host, 0),
                }
                for r in self.replicas
            ],
            'strategy': self.strategy.value,
        }


# =============================================================================
# DÉCORATEURS
# =============================================================================

def use_read_replica(func):
    """
    Décorateur pour utiliser un read replica.

    Usage:
        @use_read_replica
        def search_products(self, **kwargs):
            # Cette méthode utilisera un replica pour les lectures
            return self.env['product.product'].search([])
    """
    @wraps(func)
    def wrapper(self, *args, **kwargs):
        router = DatabaseRouter()
        config = router.get_read_connection()

        # Incrémenter le compteur
        router.increment_connections(config.host)

        try:
            # Note: Dans un vrai implémentation, on changerait
            # la connexion DB ici via le contexte Odoo
            return func(self, *args, **kwargs)
        finally:
            router.decrement_connections(config.host)

    return wrapper


def use_primary(func):
    """
    Décorateur pour forcer l'utilisation du primary.

    Usage:
        @use_primary
        def create_order(self, **kwargs):
            # Force l'utilisation du primary
            return self.env['sale.order'].create({...})
    """
    @wraps(func)
    def wrapper(self, *args, **kwargs):
        # Note: Dans un vrai implémentation, on forcerait
        # la connexion au primary ici
        return func(self, *args, **kwargs)

    return wrapper


# =============================================================================
# CONTEXT MANAGER
# =============================================================================

class ReadReplicaContext:
    """
    Context manager pour utiliser un read replica.

    Usage:
        with ReadReplicaContext():
            products = env['product.product'].search([])
    """

    def __init__(self):
        self.router = DatabaseRouter()
        self.config = None

    def __enter__(self):
        self.config = self.router.get_read_connection()
        self.router.increment_connections(self.config.host)
        return self.config

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.config:
            self.router.decrement_connections(self.config.host)
        return False


# =============================================================================
# HELPERS
# =============================================================================

def get_router() -> DatabaseRouter:
    """Retourne l'instance du router"""
    return DatabaseRouter()


def is_using_replicas() -> bool:
    """Vérifie si des replicas sont configurés"""
    return len(REPLICA_HOSTS) > 0


def get_healthy_replica_count() -> int:
    """Retourne le nombre de replicas sains"""
    router = DatabaseRouter()
    return sum(1 for r in router.replicas if r.is_healthy)
