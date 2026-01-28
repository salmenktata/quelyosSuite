# -*- coding: utf-8 -*-
"""
Health Aggregator pour Quelyos ERP

Agrégation de la santé multi-services:
- Check de tous les services
- Score de santé global
- Détection automatique de dégradation
- Historique de disponibilité
"""

import os
import json
import logging
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib.request
import urllib.error

_logger = logging.getLogger(__name__)

REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
HEALTH_PREFIX = 'quelyos:health:'


class ServiceStatus(Enum):
    """Statuts de service"""
    HEALTHY = 'healthy'
    DEGRADED = 'degraded'
    UNHEALTHY = 'unhealthy'
    UNKNOWN = 'unknown'


@dataclass
class ServiceHealth:
    """Santé d'un service"""
    name: str
    status: ServiceStatus
    response_time_ms: float = 0
    last_check: datetime = None
    message: str = ''
    details: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ServiceConfig:
    """Configuration d'un service à monitorer"""
    name: str
    url: str
    timeout: float = 5.0
    healthy_threshold_ms: float = 1000
    degraded_threshold_ms: float = 3000
    required: bool = True  # Service critique?


class HealthAggregator:
    """Agrégateur de santé multi-services"""

    def __init__(self):
        self._redis = None
        self._services: Dict[str, ServiceConfig] = {}
        self._executor = ThreadPoolExecutor(max_workers=10)
        self._init_redis()
        self._register_default_services()

    def _init_redis(self):
        try:
            import redis
            self._redis = redis.from_url(REDIS_URL)
            self._redis.ping()
        except Exception as e:
            _logger.warning(f"Redis not available for health aggregator: {e}")

    def _register_default_services(self):
        """Enregistre les services par défaut"""
        default_services = [
            ServiceConfig(
                name='odoo',
                url=os.environ.get('ODOO_URL', 'http://localhost:8069') + '/web/health',
                timeout=5.0,
                required=True,
            ),
            ServiceConfig(
                name='redis',
                url='redis://localhost:6379',
                timeout=2.0,
                required=True,
            ),
            ServiceConfig(
                name='postgresql',
                url='postgresql://localhost:5432',
                timeout=3.0,
                required=True,
            ),
            ServiceConfig(
                name='dashboard',
                url=os.environ.get('DASHBOARD_URL', 'http://localhost:5175') + '/health',
                timeout=5.0,
                required=False,
            ),
            ServiceConfig(
                name='vitrine',
                url=os.environ.get('VITRINE_URL', 'http://localhost:3000') + '/api/health',
                timeout=5.0,
                required=False,
            ),
            ServiceConfig(
                name='ecommerce',
                url=os.environ.get('ECOMMERCE_URL', 'http://localhost:3001') + '/api/health',
                timeout=5.0,
                required=False,
            ),
        ]

        for service in default_services:
            self._services[service.name] = service

    def register_service(self, config: ServiceConfig):
        """Enregistre un service à monitorer"""
        self._services[config.name] = config
        _logger.info(f"Registered health check for: {config.name}")

    def _check_http_service(self, config: ServiceConfig) -> ServiceHealth:
        """Check un service HTTP"""
        start = datetime.utcnow()

        try:
            req = urllib.request.Request(
                config.url,
                headers={'User-Agent': 'Quelyos-Health-Check/1.0'}
            )
            with urllib.request.urlopen(req, timeout=config.timeout) as response:
                elapsed = (datetime.utcnow() - start).total_seconds() * 1000

                # Déterminer statut
                if elapsed < config.healthy_threshold_ms:
                    status = ServiceStatus.HEALTHY
                elif elapsed < config.degraded_threshold_ms:
                    status = ServiceStatus.DEGRADED
                else:
                    status = ServiceStatus.DEGRADED

                return ServiceHealth(
                    name=config.name,
                    status=status,
                    response_time_ms=elapsed,
                    last_check=datetime.utcnow(),
                    message=f"HTTP {response.status}",
                    details={'status_code': response.status},
                )

        except urllib.error.URLError as e:
            return ServiceHealth(
                name=config.name,
                status=ServiceStatus.UNHEALTHY,
                response_time_ms=(datetime.utcnow() - start).total_seconds() * 1000,
                last_check=datetime.utcnow(),
                message=str(e.reason),
            )
        except Exception as e:
            return ServiceHealth(
                name=config.name,
                status=ServiceStatus.UNHEALTHY,
                last_check=datetime.utcnow(),
                message=str(e),
            )

    def _check_redis_service(self, config: ServiceConfig) -> ServiceHealth:
        """Check Redis"""
        start = datetime.utcnow()

        try:
            import redis
            r = redis.from_url(config.url)
            r.ping()
            elapsed = (datetime.utcnow() - start).total_seconds() * 1000

            return ServiceHealth(
                name=config.name,
                status=ServiceStatus.HEALTHY if elapsed < config.healthy_threshold_ms
                    else ServiceStatus.DEGRADED,
                response_time_ms=elapsed,
                last_check=datetime.utcnow(),
                message='PONG',
            )
        except Exception as e:
            return ServiceHealth(
                name=config.name,
                status=ServiceStatus.UNHEALTHY,
                last_check=datetime.utcnow(),
                message=str(e),
            )

    def _check_postgresql_service(self, config: ServiceConfig) -> ServiceHealth:
        """Check PostgreSQL"""
        start = datetime.utcnow()

        try:
            import psycopg2
            # Extraire les infos de connexion
            conn = psycopg2.connect(
                host='localhost',
                port=5432,
                user=os.environ.get('PGUSER', 'odoo'),
                password=os.environ.get('PGPASSWORD', 'odoo'),
                database=os.environ.get('PGDATABASE', 'odoo'),
                connect_timeout=int(config.timeout),
            )
            cur = conn.cursor()
            cur.execute('SELECT 1')
            cur.close()
            conn.close()

            elapsed = (datetime.utcnow() - start).total_seconds() * 1000

            return ServiceHealth(
                name=config.name,
                status=ServiceStatus.HEALTHY if elapsed < config.healthy_threshold_ms
                    else ServiceStatus.DEGRADED,
                response_time_ms=elapsed,
                last_check=datetime.utcnow(),
                message='Connected',
            )
        except ImportError:
            return ServiceHealth(
                name=config.name,
                status=ServiceStatus.UNKNOWN,
                last_check=datetime.utcnow(),
                message='psycopg2 not installed',
            )
        except Exception as e:
            return ServiceHealth(
                name=config.name,
                status=ServiceStatus.UNHEALTHY,
                last_check=datetime.utcnow(),
                message=str(e),
            )

    def check_service(self, name: str) -> ServiceHealth:
        """Check un service spécifique"""
        config = self._services.get(name)
        if not config:
            return ServiceHealth(
                name=name,
                status=ServiceStatus.UNKNOWN,
                message='Service not registered',
            )

        if config.url.startswith('redis://'):
            health = self._check_redis_service(config)
        elif config.url.startswith('postgresql://'):
            health = self._check_postgresql_service(config)
        else:
            health = self._check_http_service(config)

        # Sauvegarder dans Redis
        self._save_health(health)

        return health

    def check_all(self) -> Dict[str, ServiceHealth]:
        """Check tous les services en parallèle"""
        results: Dict[str, ServiceHealth] = {}
        futures = {}

        for name, config in self._services.items():
            future = self._executor.submit(self.check_service, name)
            futures[future] = name

        for future in as_completed(futures, timeout=30):
            name = futures[future]
            try:
                results[name] = future.result()
            except Exception as e:
                results[name] = ServiceHealth(
                    name=name,
                    status=ServiceStatus.UNKNOWN,
                    message=str(e),
                )

        return results

    def get_aggregated_health(self) -> Dict[str, Any]:
        """Retourne la santé agrégée de tous les services"""
        services = self.check_all()

        # Calculer score global
        total_score = 0
        max_score = 0
        critical_down = False

        for name, health in services.items():
            config = self._services.get(name)
            weight = 2 if config and config.required else 1

            if health.status == ServiceStatus.HEALTHY:
                total_score += 100 * weight
            elif health.status == ServiceStatus.DEGRADED:
                total_score += 50 * weight
            elif health.status == ServiceStatus.UNHEALTHY:
                if config and config.required:
                    critical_down = True

            max_score += 100 * weight

        health_score = (total_score / max_score * 100) if max_score > 0 else 0

        # Déterminer statut global
        if critical_down:
            global_status = ServiceStatus.UNHEALTHY
        elif health_score >= 90:
            global_status = ServiceStatus.HEALTHY
        elif health_score >= 50:
            global_status = ServiceStatus.DEGRADED
        else:
            global_status = ServiceStatus.UNHEALTHY

        return {
            'status': global_status.value,
            'score': round(health_score, 1),
            'timestamp': datetime.utcnow().isoformat(),
            'services': {
                name: {
                    'status': h.status.value,
                    'response_time_ms': h.response_time_ms,
                    'message': h.message,
                    'last_check': h.last_check.isoformat() if h.last_check else None,
                }
                for name, h in services.items()
            },
            'summary': {
                'healthy': sum(1 for h in services.values() if h.status == ServiceStatus.HEALTHY),
                'degraded': sum(1 for h in services.values() if h.status == ServiceStatus.DEGRADED),
                'unhealthy': sum(1 for h in services.values() if h.status == ServiceStatus.UNHEALTHY),
                'unknown': sum(1 for h in services.values() if h.status == ServiceStatus.UNKNOWN),
            },
        }

    def _save_health(self, health: ServiceHealth):
        """Sauvegarde l'état de santé dans Redis"""
        if not self._redis:
            return

        # État actuel
        key = f"{HEALTH_PREFIX}current:{health.name}"
        self._redis.setex(key, 300, json.dumps({
            'status': health.status.value,
            'response_time_ms': health.response_time_ms,
            'message': health.message,
            'timestamp': health.last_check.isoformat() if health.last_check else None,
        }))

        # Historique (pour uptime)
        now = datetime.utcnow()
        history_key = f"{HEALTH_PREFIX}history:{health.name}:{now.strftime('%Y-%m-%d')}"
        self._redis.lpush(history_key, json.dumps({
            'status': health.status.value,
            'timestamp': now.isoformat(),
        }))
        self._redis.ltrim(history_key, 0, 1440)  # Max 1 par minute
        self._redis.expire(history_key, 86400 * 30)

    def get_uptime(self, service_name: str, days: int = 7) -> Dict[str, Any]:
        """Calcule l'uptime d'un service"""
        if not self._redis:
            return {'uptime_percent': 100, 'message': 'No data'}

        now = datetime.utcnow()
        total_checks = 0
        healthy_checks = 0

        for day_offset in range(days):
            date = now - timedelta(days=day_offset)
            key = f"{HEALTH_PREFIX}history:{service_name}:{date.strftime('%Y-%m-%d')}"

            entries = self._redis.lrange(key, 0, -1)
            for entry in entries:
                data = json.loads(entry)
                total_checks += 1
                if data['status'] in ['healthy', 'degraded']:
                    healthy_checks += 1

        uptime = (healthy_checks / total_checks * 100) if total_checks > 0 else 100

        return {
            'service': service_name,
            'period_days': days,
            'total_checks': total_checks,
            'healthy_checks': healthy_checks,
            'uptime_percent': round(uptime, 2),
        }


# Singleton
_health_aggregator = None


def get_health_aggregator() -> HealthAggregator:
    """Retourne l'agrégateur de santé singleton"""
    global _health_aggregator
    if _health_aggregator is None:
        _health_aggregator = HealthAggregator()
    return _health_aggregator
