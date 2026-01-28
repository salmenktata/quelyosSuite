# -*- coding: utf-8 -*-
"""
Multi-tenancy pour Quelyos ERP

Support multi-tenant avec:
- Isolation des données par tenant
- Configuration par tenant
- Quotas par tenant
- Middleware de résolution du tenant

Modèles:
- Par sous-domaine: tenant1.quelyos.com
- Par header: X-Tenant-ID
- Par path: /api/v1/tenant1/...
"""

import os
import logging
import threading
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from functools import wraps
from contextlib import contextmanager

_logger = logging.getLogger(__name__)

# Configuration
TENANT_HEADER = 'X-Tenant-ID'
DEFAULT_TENANT = os.environ.get('DEFAULT_TENANT', 'default')
TENANT_ISOLATION_FIELD = 'tenant_id'


# =============================================================================
# TENANT MODEL
# =============================================================================

@dataclass
class Tenant:
    """Représente un tenant"""
    id: str
    name: str
    domain: Optional[str] = None
    database: Optional[str] = None  # Pour isolation par DB
    schema: Optional[str] = None    # Pour isolation par schéma
    is_active: bool = True
    settings: Dict[str, Any] = field(default_factory=dict)
    quotas: Dict[str, int] = field(default_factory=dict)
    created_at: Optional[str] = None

    @property
    def max_users(self) -> int:
        return self.quotas.get('max_users', 10)

    @property
    def max_products(self) -> int:
        return self.quotas.get('max_products', 1000)

    @property
    def max_orders_per_month(self) -> int:
        return self.quotas.get('max_orders_per_month', 500)

    @property
    def storage_limit_mb(self) -> int:
        return self.quotas.get('storage_limit_mb', 1024)


# =============================================================================
# TENANT CONTEXT
# =============================================================================

class TenantContext:
    """
    Context thread-local pour le tenant courant.

    Usage:
        # Définir le tenant
        TenantContext.set_current('tenant123')

        # Récupérer le tenant
        tenant_id = TenantContext.get_current()

        # Dans un context manager
        with TenantContext.use('tenant123'):
            # Code exécuté dans le contexte du tenant
            ...
    """

    _local = threading.local()

    @classmethod
    def set_current(cls, tenant_id: str):
        """Définit le tenant courant"""
        cls._local.tenant_id = tenant_id

    @classmethod
    def get_current(cls) -> str:
        """Retourne le tenant courant"""
        return getattr(cls._local, 'tenant_id', DEFAULT_TENANT)

    @classmethod
    def clear(cls):
        """Efface le tenant courant"""
        cls._local.tenant_id = None

    @classmethod
    @contextmanager
    def use(cls, tenant_id: str):
        """Context manager pour utiliser un tenant temporairement"""
        previous = cls.get_current()
        cls.set_current(tenant_id)
        try:
            yield
        finally:
            cls.set_current(previous)


# =============================================================================
# TENANT REGISTRY
# =============================================================================

class TenantRegistry:
    """
    Registre des tenants.

    Usage:
        registry = TenantRegistry()

        # Ajouter un tenant
        registry.register(Tenant(
            id='acme',
            name='ACME Corp',
            domain='acme.quelyos.com',
            quotas={'max_users': 50}
        ))

        # Récupérer un tenant
        tenant = registry.get('acme')

        # Par domaine
        tenant = registry.get_by_domain('acme.quelyos.com')
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

        self._tenants: Dict[str, Tenant] = {}
        self._domain_index: Dict[str, str] = {}  # domain -> tenant_id
        self._redis = None
        self._init_redis()
        self._initialized = True

    def _init_redis(self):
        """Initialise Redis pour le cache des tenants"""
        try:
            import redis
            redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
            self._redis = redis.from_url(redis_url)
        except Exception as e:
            _logger.warning(f"Redis not available for tenant cache: {e}")

    def register(self, tenant: Tenant):
        """Enregistre un nouveau tenant"""
        self._tenants[tenant.id] = tenant

        if tenant.domain:
            self._domain_index[tenant.domain] = tenant.id

        _logger.info(f"Tenant registered: {tenant.id} ({tenant.name})")

    def unregister(self, tenant_id: str):
        """Supprime un tenant"""
        tenant = self._tenants.pop(tenant_id, None)
        if tenant and tenant.domain:
            self._domain_index.pop(tenant.domain, None)

    def get(self, tenant_id: str) -> Optional[Tenant]:
        """Récupère un tenant par ID"""
        return self._tenants.get(tenant_id)

    def get_by_domain(self, domain: str) -> Optional[Tenant]:
        """Récupère un tenant par domaine"""
        tenant_id = self._domain_index.get(domain)
        if tenant_id:
            return self._tenants.get(tenant_id)
        return None

    def list_all(self) -> List[Tenant]:
        """Liste tous les tenants"""
        return list(self._tenants.values())

    def exists(self, tenant_id: str) -> bool:
        """Vérifie si un tenant existe"""
        return tenant_id in self._tenants


# =============================================================================
# TENANT RESOLVER
# =============================================================================

class TenantResolver:
    """
    Résout le tenant à partir d'une requête.

    Ordre de résolution:
    1. Header X-Tenant-ID
    2. Sous-domaine
    3. Path prefix
    4. Tenant par défaut
    """

    def __init__(self):
        self.registry = TenantRegistry()

    def resolve(self, request) -> Tenant:
        """
        Résout le tenant depuis une requête HTTP.

        Args:
            request: Requête Odoo/Werkzeug

        Returns:
            Tenant résolu
        """
        tenant_id = None

        # 1. Header
        tenant_id = request.httprequest.headers.get(TENANT_HEADER)
        if tenant_id and self.registry.exists(tenant_id):
            return self.registry.get(tenant_id)

        # 2. Sous-domaine
        host = request.httprequest.host
        if host:
            # Extraire le sous-domaine (ex: tenant1.quelyos.com -> tenant1)
            parts = host.split('.')
            if len(parts) > 2:
                subdomain = parts[0]
                tenant = self.registry.get(subdomain)
                if tenant:
                    return tenant

            # Ou par le domaine complet
            tenant = self.registry.get_by_domain(host)
            if tenant:
                return tenant

        # 3. Path prefix
        path = request.httprequest.path
        if path.startswith('/api/'):
            parts = path.split('/')
            if len(parts) > 3:
                potential_tenant = parts[2]
                tenant = self.registry.get(potential_tenant)
                if tenant:
                    return tenant

        # 4. Défaut
        default = self.registry.get(DEFAULT_TENANT)
        if not default:
            # Créer un tenant par défaut
            default = Tenant(id=DEFAULT_TENANT, name='Default')
            self.registry.register(default)

        return default


# =============================================================================
# MIDDLEWARE
# =============================================================================

def tenant_middleware(func):
    """
    Middleware pour résoudre et définir le tenant.

    Usage:
        @tenant_middleware
        @http.route('/api/products', ...)
        def get_products(self, **kwargs):
            # Le tenant est automatiquement résolu
            tenant_id = TenantContext.get_current()
            ...
    """
    @wraps(func)
    def wrapper(self, *args, **kwargs):
        from odoo.http import request

        resolver = TenantResolver()
        tenant = resolver.resolve(request)

        if not tenant.is_active:
            return {
                'success': False,
                'error': 'Tenant is inactive',
                'error_code': 'TENANT_INACTIVE',
            }

        TenantContext.set_current(tenant.id)

        try:
            return func(self, *args, **kwargs)
        finally:
            TenantContext.clear()

    return wrapper


# =============================================================================
# DOMAIN FILTER
# =============================================================================

def add_tenant_filter(domain: list) -> list:
    """
    Ajoute le filtre de tenant à un domaine Odoo.

    Usage:
        domain = [('active', '=', True)]
        domain = add_tenant_filter(domain)
        # Résultat: [('active', '=', True), ('tenant_id', '=', 'current_tenant')]
    """
    tenant_id = TenantContext.get_current()
    return domain + [(TENANT_ISOLATION_FIELD, '=', tenant_id)]


def tenant_domain() -> list:
    """Retourne le domaine de filtre pour le tenant courant"""
    tenant_id = TenantContext.get_current()
    return [(TENANT_ISOLATION_FIELD, '=', tenant_id)]


# =============================================================================
# QUOTAS
# =============================================================================

class QuotaChecker:
    """
    Vérifie les quotas d'un tenant.

    Usage:
        checker = QuotaChecker()

        if not checker.can_create_user():
            raise QuotaExceededError('Maximum users reached')
    """

    def __init__(self):
        self.registry = TenantRegistry()

    def get_current_tenant(self) -> Tenant:
        tenant_id = TenantContext.get_current()
        tenant = self.registry.get(tenant_id)
        if not tenant:
            tenant = Tenant(id=tenant_id, name=tenant_id)
        return tenant

    def can_create_user(self, current_count: int) -> bool:
        """Vérifie si on peut créer un utilisateur"""
        tenant = self.get_current_tenant()
        return current_count < tenant.max_users

    def can_create_product(self, current_count: int) -> bool:
        """Vérifie si on peut créer un produit"""
        tenant = self.get_current_tenant()
        return current_count < tenant.max_products

    def can_create_order(self, monthly_count: int) -> bool:
        """Vérifie si on peut créer une commande ce mois"""
        tenant = self.get_current_tenant()
        return monthly_count < tenant.max_orders_per_month

    def check_storage(self, current_mb: int) -> bool:
        """Vérifie le quota de stockage"""
        tenant = self.get_current_tenant()
        return current_mb < tenant.storage_limit_mb

    def get_usage(self, env) -> Dict:
        """Retourne l'usage actuel du tenant"""
        tenant = self.get_current_tenant()
        tenant_filter = tenant_domain()

        return {
            'users': {
                'current': env['res.users'].search_count(tenant_filter),
                'limit': tenant.max_users,
            },
            'products': {
                'current': env['product.product'].search_count(tenant_filter),
                'limit': tenant.max_products,
            },
        }


class QuotaExceededError(Exception):
    """Erreur quand un quota est dépassé"""
    pass


def check_quota(quota_type: str):
    """
    Décorateur pour vérifier un quota avant l'action.

    Usage:
        @check_quota('users')
        def create_user(self, **kwargs):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            checker = QuotaChecker()
            env = self.env if hasattr(self, 'env') else None

            if quota_type == 'users':
                count = env['res.users'].search_count(tenant_domain()) if env else 0
                if not checker.can_create_user(count):
                    raise QuotaExceededError('Maximum users limit reached')

            elif quota_type == 'products':
                count = env['product.product'].search_count(tenant_domain()) if env else 0
                if not checker.can_create_product(count):
                    raise QuotaExceededError('Maximum products limit reached')

            return func(self, *args, **kwargs)

        return wrapper
    return decorator


# =============================================================================
# HELPERS
# =============================================================================

def get_tenant() -> Tenant:
    """Retourne le tenant courant"""
    registry = TenantRegistry()
    return registry.get(TenantContext.get_current())


def get_tenant_id() -> str:
    """Retourne l'ID du tenant courant"""
    return TenantContext.get_current()


def is_multi_tenant() -> bool:
    """Vérifie si le mode multi-tenant est actif"""
    registry = TenantRegistry()
    return len(registry.list_all()) > 1
