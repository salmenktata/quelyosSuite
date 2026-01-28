# -*- coding: utf-8 -*-
"""
Service Registry pour Quelyos ERP

Découverte et gestion des services:
- Enregistrement automatique des services
- Health monitoring
- Load balancing
- Service discovery
- Circuit breaker par service
"""

import os
import time
import json
import logging
import threading
import socket
from typing import Dict, List, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import random

_logger = logging.getLogger(__name__)

# Configuration
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
REGISTRY_PREFIX = 'quelyos:services:'
HEARTBEAT_INTERVAL = 10  # secondes
SERVICE_TTL = 30  # secondes avant expiration


# =============================================================================
# TYPES
# =============================================================================

class ServiceStatus(Enum):
    """États d'un service"""
    HEALTHY = 'healthy'
    DEGRADED = 'degraded'
    UNHEALTHY = 'unhealthy'
    UNKNOWN = 'unknown'


class LoadBalancingStrategy(Enum):
    """Stratégies de load balancing"""
    ROUND_ROBIN = 'round_robin'
    RANDOM = 'random'
    LEAST_CONNECTIONS = 'least_connections'
    WEIGHTED = 'weighted'


@dataclass
class ServiceInstance:
    """Instance d'un service"""
    id: str
    name: str
    host: str
    port: int
    status: ServiceStatus = ServiceStatus.UNKNOWN
    metadata: Dict = field(default_factory=dict)
    weight: int = 100
    connections: int = 0
    last_heartbeat: float = 0
    registered_at: float = 0
    version: str = '1.0.0'

    @property
    def address(self) -> str:
        return f"{self.host}:{self.port}"

    @property
    def url(self) -> str:
        protocol = self.metadata.get('protocol', 'http')
        return f"{protocol}://{self.host}:{self.port}"

    def is_alive(self) -> bool:
        return time.time() - self.last_heartbeat < SERVICE_TTL

    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'name': self.name,
            'host': self.host,
            'port': self.port,
            'status': self.status.value,
            'metadata': self.metadata,
            'weight': self.weight,
            'connections': self.connections,
            'last_heartbeat': self.last_heartbeat,
            'registered_at': self.registered_at,
            'version': self.version,
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'ServiceInstance':
        return cls(
            id=data['id'],
            name=data['name'],
            host=data['host'],
            port=data['port'],
            status=ServiceStatus(data.get('status', 'unknown')),
            metadata=data.get('metadata', {}),
            weight=data.get('weight', 100),
            connections=data.get('connections', 0),
            last_heartbeat=data.get('last_heartbeat', 0),
            registered_at=data.get('registered_at', 0),
            version=data.get('version', '1.0.0'),
        )


# =============================================================================
# SERVICE REGISTRY
# =============================================================================

class ServiceRegistry:
    """
    Registre de services distribué.

    Usage:
        registry = ServiceRegistry()

        # Enregistrer un service
        registry.register(ServiceInstance(
            id='api-1',
            name='api',
            host='localhost',
            port=8069,
            metadata={'version': '1.0.0'}
        ))

        # Découvrir des services
        instances = registry.discover('api')

        # Obtenir une instance (load balanced)
        instance = registry.get_instance('api')

        # Health check
        registry.health_check('api-1')
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

        self._redis = None
        self._local_services: Dict[str, ServiceInstance] = {}
        self._lb_counters: Dict[str, int] = {}
        self._health_callbacks: Dict[str, Callable] = {}
        self._strategy = LoadBalancingStrategy.ROUND_ROBIN

        self._init_redis()
        self._initialized = True

    def _init_redis(self):
        try:
            import redis
            self._redis = redis.from_url(REDIS_URL)
            self._redis.ping()
            _logger.info("Service registry connected to Redis")
        except Exception as e:
            _logger.warning(f"Redis not available for service registry: {e}")

    def register(
        self,
        instance: ServiceInstance,
        health_check: Callable = None
    ) -> bool:
        """
        Enregistre une instance de service.

        Args:
            instance: Instance à enregistrer
            health_check: Fonction de health check optionnelle

        Returns:
            True si succès
        """
        instance.registered_at = time.time()
        instance.last_heartbeat = time.time()
        instance.status = ServiceStatus.HEALTHY

        # Stocker localement
        self._local_services[instance.id] = instance

        if health_check:
            self._health_callbacks[instance.id] = health_check

        # Stocker dans Redis
        if self._redis:
            key = f"{REGISTRY_PREFIX}{instance.name}:{instance.id}"
            self._redis.setex(
                key,
                SERVICE_TTL,
                json.dumps(instance.to_dict())
            )

            # Ajouter au set du service
            self._redis.sadd(f"{REGISTRY_PREFIX}{instance.name}:instances", instance.id)

        _logger.info(f"Service registered: {instance.name}/{instance.id} at {instance.address}")

        # Démarrer le heartbeat
        self._start_heartbeat(instance)

        return True

    def deregister(self, instance_id: str) -> bool:
        """Désenregistre une instance"""
        instance = self._local_services.pop(instance_id, None)

        if instance and self._redis:
            key = f"{REGISTRY_PREFIX}{instance.name}:{instance_id}"
            self._redis.delete(key)
            self._redis.srem(f"{REGISTRY_PREFIX}{instance.name}:instances", instance_id)

        self._health_callbacks.pop(instance_id, None)
        _logger.info(f"Service deregistered: {instance_id}")

        return True

    def discover(self, service_name: str) -> List[ServiceInstance]:
        """
        Découvre toutes les instances d'un service.

        Args:
            service_name: Nom du service

        Returns:
            Liste des instances disponibles
        """
        instances = []

        if self._redis:
            # Récupérer depuis Redis
            instance_ids = self._redis.smembers(f"{REGISTRY_PREFIX}{service_name}:instances")

            for instance_id in instance_ids:
                key = f"{REGISTRY_PREFIX}{service_name}:{instance_id.decode()}"
                data = self._redis.get(key)

                if data:
                    instance = ServiceInstance.from_dict(json.loads(data))
                    if instance.is_alive():
                        instances.append(instance)
                else:
                    # Nettoyer l'instance expirée
                    self._redis.srem(
                        f"{REGISTRY_PREFIX}{service_name}:instances",
                        instance_id
                    )
        else:
            # Fallback local
            instances = [
                i for i in self._local_services.values()
                if i.name == service_name and i.is_alive()
            ]

        return instances

    def get_instance(
        self,
        service_name: str,
        strategy: LoadBalancingStrategy = None
    ) -> Optional[ServiceInstance]:
        """
        Obtient une instance avec load balancing.

        Args:
            service_name: Nom du service
            strategy: Stratégie de load balancing

        Returns:
            Instance sélectionnée ou None
        """
        instances = self.discover(service_name)

        if not instances:
            return None

        # Filtrer les instances healthy
        healthy = [i for i in instances if i.status == ServiceStatus.HEALTHY]
        if not healthy:
            healthy = instances  # Fallback sur toutes les instances

        strategy = strategy or self._strategy

        if strategy == LoadBalancingStrategy.RANDOM:
            return random.choice(healthy)

        elif strategy == LoadBalancingStrategy.ROUND_ROBIN:
            counter = self._lb_counters.get(service_name, 0)
            instance = healthy[counter % len(healthy)]
            self._lb_counters[service_name] = counter + 1
            return instance

        elif strategy == LoadBalancingStrategy.LEAST_CONNECTIONS:
            return min(healthy, key=lambda i: i.connections)

        elif strategy == LoadBalancingStrategy.WEIGHTED:
            # Weighted random
            total_weight = sum(i.weight for i in healthy)
            r = random.randint(0, total_weight)
            cumulative = 0
            for instance in healthy:
                cumulative += instance.weight
                if r <= cumulative:
                    return instance

        return healthy[0]

    def health_check(self, instance_id: str) -> ServiceStatus:
        """
        Vérifie la santé d'une instance.

        Args:
            instance_id: ID de l'instance

        Returns:
            Statut de santé
        """
        instance = self._local_services.get(instance_id)
        if not instance:
            return ServiceStatus.UNKNOWN

        # Utiliser le callback si disponible
        callback = self._health_callbacks.get(instance_id)
        if callback:
            try:
                is_healthy = callback()
                instance.status = (
                    ServiceStatus.HEALTHY if is_healthy
                    else ServiceStatus.UNHEALTHY
                )
            except Exception as e:
                _logger.warning(f"Health check failed for {instance_id}: {e}")
                instance.status = ServiceStatus.UNHEALTHY
        else:
            # Health check basique (TCP)
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(2)
                result = sock.connect_ex((instance.host, instance.port))
                sock.close()
                instance.status = (
                    ServiceStatus.HEALTHY if result == 0
                    else ServiceStatus.UNHEALTHY
                )
            except Exception:
                instance.status = ServiceStatus.UNHEALTHY

        return instance.status

    def update_status(self, instance_id: str, status: ServiceStatus):
        """Met à jour le statut d'une instance"""
        instance = self._local_services.get(instance_id)
        if instance:
            instance.status = status
            self._update_redis(instance)

    def increment_connections(self, instance_id: str):
        """Incrémente le compteur de connexions"""
        instance = self._local_services.get(instance_id)
        if instance:
            instance.connections += 1

    def decrement_connections(self, instance_id: str):
        """Décrémente le compteur de connexions"""
        instance = self._local_services.get(instance_id)
        if instance:
            instance.connections = max(0, instance.connections - 1)

    def get_all_services(self) -> Dict[str, List[ServiceInstance]]:
        """Retourne tous les services enregistrés"""
        services = {}

        if self._redis:
            # Trouver tous les services
            keys = self._redis.keys(f"{REGISTRY_PREFIX}*:instances")
            for key in keys:
                service_name = key.decode().split(':')[2]
                if service_name not in services:
                    services[service_name] = self.discover(service_name)
        else:
            for instance in self._local_services.values():
                if instance.name not in services:
                    services[instance.name] = []
                services[instance.name].append(instance)

        return services

    def _start_heartbeat(self, instance: ServiceInstance):
        """Démarre le heartbeat pour une instance"""
        def heartbeat():
            while instance.id in self._local_services:
                instance.last_heartbeat = time.time()
                self.health_check(instance.id)
                self._update_redis(instance)
                time.sleep(HEARTBEAT_INTERVAL)

        thread = threading.Thread(target=heartbeat, daemon=True)
        thread.start()

    def _update_redis(self, instance: ServiceInstance):
        """Met à jour l'instance dans Redis"""
        if self._redis:
            key = f"{REGISTRY_PREFIX}{instance.name}:{instance.id}"
            self._redis.setex(
                key,
                SERVICE_TTL,
                json.dumps(instance.to_dict())
            )


# =============================================================================
# SERVICE CLIENT
# =============================================================================

class ServiceClient:
    """
    Client pour appeler des services découverts.

    Usage:
        client = ServiceClient()

        # Appeler un service
        response = client.call('payment-service', '/api/charge', {
            'amount': 100,
            'currency': 'EUR'
        })
    """

    def __init__(self):
        self.registry = ServiceRegistry()

    def call(
        self,
        service_name: str,
        path: str,
        data: Dict = None,
        method: str = 'POST',
        timeout: int = 30
    ) -> Dict:
        """
        Appelle un service.

        Args:
            service_name: Nom du service
            path: Path de l'endpoint
            data: Données à envoyer
            method: Méthode HTTP
            timeout: Timeout en secondes

        Returns:
            Réponse du service
        """
        import requests

        instance = self.registry.get_instance(service_name)
        if not instance:
            raise ServiceNotFoundError(f"No instance found for service: {service_name}")

        url = f"{instance.url}{path}"

        try:
            self.registry.increment_connections(instance.id)

            response = requests.request(
                method=method,
                url=url,
                json=data,
                timeout=timeout,
            )

            return response.json()

        except Exception as e:
            self.registry.update_status(instance.id, ServiceStatus.UNHEALTHY)
            raise ServiceCallError(f"Failed to call {service_name}: {e}")

        finally:
            self.registry.decrement_connections(instance.id)


class ServiceNotFoundError(Exception):
    """Service non trouvé"""
    pass


class ServiceCallError(Exception):
    """Erreur d'appel de service"""
    pass


# =============================================================================
# HELPERS
# =============================================================================

def get_registry() -> ServiceRegistry:
    """Retourne l'instance du registre"""
    return ServiceRegistry()


def register_service(
    name: str,
    host: str = None,
    port: int = None,
    **metadata
) -> ServiceInstance:
    """Helper pour enregistrer rapidement un service"""
    import uuid

    host = host or socket.gethostname()
    port = port or 8069

    instance = ServiceInstance(
        id=f"{name}-{uuid.uuid4().hex[:8]}",
        name=name,
        host=host,
        port=port,
        metadata=metadata,
    )

    ServiceRegistry().register(instance)
    return instance
