# -*- coding: utf-8 -*-
"""
Database Sharding pour Quelyos API

Partitionnement horizontal des données:
- Sharding par tenant
- Sharding par hash
- Sharding par range
- Routing automatique
"""

import os
import hashlib
import logging
from typing import Dict, Any, Optional, List, Callable
from dataclasses import dataclass
from enum import Enum
from functools import wraps

_logger = logging.getLogger(__name__)


class ShardingStrategy(Enum):
    """Stratégies de sharding"""
    HASH = 'hash'       # Hash de la clé
    RANGE = 'range'     # Range de valeurs
    TENANT = 'tenant'   # Par tenant
    MODULO = 'modulo'   # Modulo simple
    LOOKUP = 'lookup'   # Table de lookup


@dataclass
class ShardConfig:
    """Configuration d'un shard"""
    id: str
    host: str
    port: int = 5432
    database: str = 'odoo'
    user: str = 'odoo'
    password: str = ''
    read_only: bool = False
    weight: int = 1  # Pour load balancing


@dataclass
class ShardingRule:
    """Règle de sharding"""
    table: str
    key_column: str
    strategy: ShardingStrategy
    config: Dict[str, Any] = None


class ShardRouter:
    """Routeur de shards"""

    def __init__(self):
        self._shards: Dict[str, ShardConfig] = {}
        self._rules: Dict[str, ShardingRule] = {}
        self._connections: Dict[str, Any] = {}
        self._lookup_cache: Dict[str, str] = {}

    def register_shard(self, config: ShardConfig):
        """Enregistre un shard"""
        self._shards[config.id] = config
        _logger.info(f"Registered shard: {config.id} ({config.host}:{config.port})")

    def register_rule(self, rule: ShardingRule):
        """Enregistre une règle de sharding"""
        self._rules[rule.table] = rule
        _logger.info(f"Registered sharding rule for table: {rule.table}")

    def get_shard_id(
        self,
        table: str,
        key_value: Any
    ) -> str:
        """Détermine le shard pour une clé donnée"""
        rule = self._rules.get(table)
        if not rule:
            # Pas de règle = shard par défaut
            return 'default'

        shard_ids = list(self._shards.keys())
        if not shard_ids:
            return 'default'

        if rule.strategy == ShardingStrategy.HASH:
            return self._hash_shard(key_value, shard_ids)

        elif rule.strategy == ShardingStrategy.MODULO:
            return self._modulo_shard(key_value, shard_ids)

        elif rule.strategy == ShardingStrategy.RANGE:
            return self._range_shard(key_value, rule.config or {})

        elif rule.strategy == ShardingStrategy.TENANT:
            return self._tenant_shard(key_value)

        elif rule.strategy == ShardingStrategy.LOOKUP:
            return self._lookup_shard(key_value)

        return 'default'

    def _hash_shard(self, key: Any, shard_ids: List[str]) -> str:
        """Sharding par hash"""
        hash_value = int(hashlib.md5(str(key).encode()).hexdigest(), 16)
        index = hash_value % len(shard_ids)
        return shard_ids[index]

    def _modulo_shard(self, key: Any, shard_ids: List[str]) -> str:
        """Sharding par modulo"""
        try:
            index = int(key) % len(shard_ids)
            return shard_ids[index]
        except (ValueError, TypeError):
            return self._hash_shard(key, shard_ids)

    def _range_shard(self, key: Any, config: Dict[str, Any]) -> str:
        """Sharding par range"""
        ranges = config.get('ranges', {})
        # ranges = {'shard1': (0, 1000), 'shard2': (1001, 2000)}

        try:
            key_int = int(key)
            for shard_id, (min_val, max_val) in ranges.items():
                if min_val <= key_int <= max_val:
                    return shard_id
        except (ValueError, TypeError):
            pass

        return config.get('default', 'default')

    def _tenant_shard(self, tenant_id: Any) -> str:
        """Sharding par tenant"""
        # Mapping tenant -> shard
        return f"tenant_{tenant_id}"

    def _lookup_shard(self, key: Any) -> str:
        """Sharding par lookup table"""
        cache_key = str(key)
        if cache_key in self._lookup_cache:
            return self._lookup_cache[cache_key]

        # TODO: Lookup dans table de mapping
        # Pour l'instant, fallback sur hash
        shard_id = self._hash_shard(key, list(self._shards.keys()))
        self._lookup_cache[cache_key] = shard_id
        return shard_id

    def get_connection(self, shard_id: str):
        """Obtient une connexion au shard"""
        if shard_id in self._connections:
            return self._connections[shard_id]

        config = self._shards.get(shard_id)
        if not config:
            raise ValueError(f"Unknown shard: {shard_id}")

        try:
            import psycopg2
            conn = psycopg2.connect(
                host=config.host,
                port=config.port,
                database=config.database,
                user=config.user,
                password=config.password,
            )
            self._connections[shard_id] = conn
            return conn
        except ImportError:
            _logger.error("psycopg2 not installed")
            raise

    def execute_on_shard(
        self,
        shard_id: str,
        query: str,
        params: tuple = None
    ) -> List[Any]:
        """Exécute une requête sur un shard spécifique"""
        conn = self.get_connection(shard_id)
        cursor = conn.cursor()
        cursor.execute(query, params)

        if cursor.description:
            return cursor.fetchall()
        conn.commit()
        return []

    def execute_on_all(
        self,
        query: str,
        params: tuple = None,
        aggregate: Callable = None
    ) -> List[Any]:
        """Exécute sur tous les shards et agrège les résultats"""
        results = []

        for shard_id in self._shards.keys():
            try:
                shard_results = self.execute_on_shard(shard_id, query, params)
                results.extend(shard_results)
            except Exception as e:
                _logger.error(f"Error on shard {shard_id}: {e}")

        if aggregate:
            return aggregate(results)

        return results

    def scatter_gather(
        self,
        query: str,
        params: tuple = None,
        order_by: str = None,
        limit: int = None
    ) -> List[Any]:
        """Pattern scatter-gather pour requêtes distribuées"""
        all_results = self.execute_on_all(query, params)

        # Tri si spécifié
        if order_by and all_results:
            # Simplification: tri par premier élément
            all_results.sort(key=lambda x: x[0] if x else None)

        # Limite
        if limit:
            all_results = all_results[:limit]

        return all_results


# Singleton
_shard_router = None


def get_shard_router() -> ShardRouter:
    """Retourne le routeur de shards"""
    global _shard_router
    if _shard_router is None:
        _shard_router = ShardRouter()
    return _shard_router


def sharded(table: str, key_param: str = 'id'):
    """
    Décorateur pour requêtes shardées.

    Usage:
        @sharded('orders', key_param='order_id')
        def get_order(self, order_id):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            router = get_shard_router()

            # Extraire la clé
            key_value = kwargs.get(key_param)
            if key_value is None and args:
                key_value = args[0]

            # Déterminer shard
            shard_id = router.get_shard_id(table, key_value)

            # Injecter shard_id
            kwargs['_shard_id'] = shard_id

            return func(self, *args, **kwargs)

        return wrapper
    return decorator


class CrossShardQuery:
    """Helper pour requêtes cross-shard"""

    def __init__(self, router: ShardRouter = None):
        self._router = router or get_shard_router()

    def select(
        self,
        table: str,
        columns: List[str] = None,
        where: str = None,
        params: tuple = None,
        order_by: str = None,
        limit: int = None
    ) -> List[Dict[str, Any]]:
        """SELECT distribué"""
        cols = ', '.join(columns) if columns else '*'
        query = f"SELECT {cols} FROM {table}"

        if where:
            query += f" WHERE {where}"

        results = self._router.scatter_gather(
            query,
            params,
            order_by=order_by,
            limit=limit
        )

        # Convertir en dicts
        if columns:
            return [dict(zip(columns, row)) for row in results]

        return results

    def count(self, table: str, where: str = None, params: tuple = None) -> int:
        """COUNT distribué"""
        query = f"SELECT COUNT(*) FROM {table}"
        if where:
            query += f" WHERE {where}"

        def aggregate_counts(results):
            return sum(r[0] for r in results if r)

        results = self._router.execute_on_all(query, params, aggregate_counts)
        return results if isinstance(results, int) else 0
