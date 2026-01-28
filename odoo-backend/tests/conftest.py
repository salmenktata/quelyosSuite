# -*- coding: utf-8 -*-
"""
Configuration pytest pour tests Odoo quelyos_api

Tests de parité : vérifier que l'API REST retourne les mêmes données
que celles stockées dans la base de données Odoo.

Tests de sécurité : vérifier authentification, autorisation, rate limiting.
Tests fonctionnels : vérifier les workflows CRUD complets.
"""

import pytest
import xmlrpc.client
import requests
import os
import time
from typing import Generator, Dict, Any, Callable


# Configuration Odoo (via env vars pour CI/CD)
ODOO_URL = os.environ.get("ODOO_URL", "http://localhost:8069")
ODOO_DB = os.environ.get("ODOO_DB", "quelyos")
ODOO_USERNAME = os.environ.get("ODOO_USERNAME", "admin")
ODOO_PASSWORD = os.environ.get("ODOO_PASSWORD", "admin")

# Timeouts
REQUEST_TIMEOUT = 30


# ============================================================================
# FIXTURES DE CONNEXION
# ============================================================================

@pytest.fixture(scope="session")
def odoo_connection() -> Dict[str, Any]:
    """Connexion Odoo via XML-RPC pour accès direct à la DB"""
    common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
    uid = common.authenticate(ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, {})

    if not uid:
        pytest.skip("Odoo non accessible - tests ignorés")

    models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object')

    return {
        'url': ODOO_URL,
        'db': ODOO_DB,
        'uid': uid,
        'password': ODOO_PASSWORD,
        'models': models,
    }


@pytest.fixture(scope="session")
def api_base_url() -> str:
    """URL de base pour les appels API"""
    return f"{ODOO_URL}/api"


@pytest.fixture(scope="session")
def api_session(api_base_url: str) -> requests.Session:
    """Session authentifiée pour appels API REST (admin)"""
    session = requests.Session()
    session.headers.update({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    })

    # Login admin
    response = session.post(
        f"{api_base_url}/ecommerce/auth/login",
        json={
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "email": ODOO_USERNAME,
                "password": ODOO_PASSWORD
            },
            "id": 1
        },
        timeout=REQUEST_TIMEOUT
    )

    result = response.json().get('result', {})
    if not result.get('success'):
        pytest.skip(f"Login API échoué: {result.get('error')}")

    session_id = result.get('session_id')
    if session_id:
        session.headers.update({'X-Session-Id': session_id})

    return session


@pytest.fixture(scope="function")
def api_session_anonymous() -> requests.Session:
    """Session non authentifiée pour tester les endpoints publics"""
    session = requests.Session()
    session.headers.update({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    })
    return session


# ============================================================================
# FIXTURES DE CRÉATION DE DONNÉES DE TEST
# ============================================================================

@pytest.fixture
def create_test_product(odoo_connection: Dict) -> Generator[Callable, None, None]:
    """Fixture pour créer un produit de test et le nettoyer après"""
    created_ids = []

    def _create(
        name: str = "Test Product",
        price: float = 100.0,
        sku: str = None,
        active: bool = True
    ) -> int:
        conn = odoo_connection
        product_data = {
            'name': name,
            'list_price': price,
            'type': 'consu',
            'active': active,
            'sale_ok': True,
            'purchase_ok': False,
        }
        if sku:
            product_data['default_code'] = sku

        product_id = conn['models'].execute_kw(
            conn['db'], conn['uid'], conn['password'],
            'product.template', 'create',
            [product_data]
        )
        created_ids.append(product_id)
        return product_id

    yield _create

    # Cleanup
    if created_ids:
        conn = odoo_connection
        try:
            conn['models'].execute_kw(
                conn['db'], conn['uid'], conn['password'],
                'product.template', 'unlink',
                [created_ids]
            )
        except Exception:
            pass  # Ignore cleanup errors


@pytest.fixture
def create_test_customer(odoo_connection: Dict) -> Generator[Callable, None, None]:
    """Fixture pour créer un client de test"""
    created_ids = []

    def _create(
        name: str = "Test Customer",
        email: str = None,
        phone: str = None
    ) -> int:
        if email is None:
            email = f"test_{int(time.time())}@example.com"

        conn = odoo_connection
        partner_id = conn['models'].execute_kw(
            conn['db'], conn['uid'], conn['password'],
            'res.partner', 'create',
            [{
                'name': name,
                'email': email,
                'phone': phone,
                'customer_rank': 1,
            }]
        )
        created_ids.append(partner_id)
        return partner_id

    yield _create

    # Cleanup
    if created_ids:
        conn = odoo_connection
        try:
            conn['models'].execute_kw(
                conn['db'], conn['uid'], conn['password'],
                'res.partner', 'unlink',
                [created_ids]
            )
        except Exception:
            pass


@pytest.fixture
def create_test_category(odoo_connection: Dict) -> Generator[Callable, None, None]:
    """Fixture pour créer une catégorie de test"""
    created_ids = []

    def _create(name: str = "Test Category", parent_id: int = None) -> int:
        conn = odoo_connection
        data = {'name': name}
        if parent_id:
            data['parent_id'] = parent_id

        categ_id = conn['models'].execute_kw(
            conn['db'], conn['uid'], conn['password'],
            'product.category', 'create',
            [data]
        )
        created_ids.append(categ_id)
        return categ_id

    yield _create

    # Cleanup
    if created_ids:
        conn = odoo_connection
        try:
            conn['models'].execute_kw(
                conn['db'], conn['uid'], conn['password'],
                'product.category', 'unlink',
                [created_ids]
            )
        except Exception:
            pass


@pytest.fixture
def create_test_order(
    odoo_connection: Dict,
    create_test_customer: Callable,
    create_test_product: Callable
) -> Generator[Callable, None, None]:
    """Fixture pour créer une commande de test"""
    created_ids = []

    def _create(
        customer_id: int = None,
        product_id: int = None,
        quantity: float = 1.0
    ) -> int:
        conn = odoo_connection

        # Créer client si non fourni
        if customer_id is None:
            customer_id = create_test_customer()

        # Créer produit si non fourni
        if product_id is None:
            product_id = create_test_product()

        # Récupérer la variante du produit
        variant_ids = conn['models'].execute_kw(
            conn['db'], conn['uid'], conn['password'],
            'product.product', 'search',
            [[('product_tmpl_id', '=', product_id)]]
        )

        if not variant_ids:
            raise ValueError(f"Aucune variante trouvée pour le produit {product_id}")

        # Créer la commande
        order_id = conn['models'].execute_kw(
            conn['db'], conn['uid'], conn['password'],
            'sale.order', 'create',
            [{
                'partner_id': customer_id,
                'order_line': [(0, 0, {
                    'product_id': variant_ids[0],
                    'product_uom_qty': quantity,
                })]
            }]
        )
        created_ids.append(order_id)
        return order_id

    yield _create

    # Cleanup
    if created_ids:
        conn = odoo_connection
        try:
            # Annuler puis supprimer
            conn['models'].execute_kw(
                conn['db'], conn['uid'], conn['password'],
                'sale.order', 'action_cancel',
                [created_ids]
            )
            conn['models'].execute_kw(
                conn['db'], conn['uid'], conn['password'],
                'sale.order', 'unlink',
                [created_ids]
            )
        except Exception:
            pass


# ============================================================================
# HELPERS DE TEST
# ============================================================================

@pytest.fixture
def jsonrpc_call(api_session: requests.Session, api_base_url: str) -> Callable:
    """Helper pour appels JSON-RPC standardisés"""
    def _call(endpoint: str, params: Dict = None, method: str = "call") -> Dict:
        response = api_session.post(
            f"{api_base_url}{endpoint}",
            json={
                "jsonrpc": "2.0",
                "method": method,
                "params": params or {},
                "id": int(time.time() * 1000)
            },
            timeout=REQUEST_TIMEOUT
        )
        assert response.status_code == 200, f"HTTP {response.status_code}: {response.text}"
        data = response.json()
        if 'error' in data:
            return {'success': False, 'error': data['error']}
        return data.get('result', data)

    return _call


@pytest.fixture
def http_get(api_session: requests.Session, api_base_url: str) -> Callable:
    """Helper pour appels HTTP GET"""
    def _get(endpoint: str, params: Dict = None) -> requests.Response:
        return api_session.get(
            f"{api_base_url}{endpoint}",
            params=params,
            timeout=REQUEST_TIMEOUT
        )
    return _get


@pytest.fixture
def http_post(api_session: requests.Session, api_base_url: str) -> Callable:
    """Helper pour appels HTTP POST"""
    def _post(endpoint: str, data: Dict = None) -> requests.Response:
        return api_session.post(
            f"{api_base_url}{endpoint}",
            json=data,
            timeout=REQUEST_TIMEOUT
        )
    return _post


# ============================================================================
# FIXTURES DE VALIDATION
# ============================================================================

@pytest.fixture
def assert_api_success() -> Callable:
    """Assertion helper pour réponses API réussies"""
    def _assert(result: Dict, message: str = ""):
        assert isinstance(result, dict), f"Résultat non dict: {result}"
        assert result.get('success') is True, f"API failure {message}: {result.get('error', result)}"
    return _assert


@pytest.fixture
def assert_api_error() -> Callable:
    """Assertion helper pour réponses API en erreur"""
    def _assert(result: Dict, expected_code: str = None, message: str = ""):
        assert isinstance(result, dict), f"Résultat non dict: {result}"
        assert result.get('success') is False, f"Expected failure {message}: {result}"
        if expected_code:
            assert result.get('error_code') == expected_code, \
                f"Expected error_code={expected_code}, got {result.get('error_code')}"
    return _assert


# ============================================================================
# MARKERS PERSONNALISÉS
# ============================================================================

def pytest_configure(config):
    """Enregistre les markers personnalisés"""
    config.addinivalue_line("markers", "auth: tests d'authentification")
    config.addinivalue_line("markers", "products: tests produits")
    config.addinivalue_line("markers", "orders: tests commandes")
    config.addinivalue_line("markers", "customers: tests clients")
    config.addinivalue_line("markers", "stock: tests stock")
    config.addinivalue_line("markers", "finance: tests finance")
    config.addinivalue_line("markers", "security: tests sécurité")
    config.addinivalue_line("markers", "slow: tests lents (> 5s)")
    config.addinivalue_line("markers", "integration: tests d'intégration")
