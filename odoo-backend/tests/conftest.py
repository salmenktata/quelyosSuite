"""
Configuration pytest pour tests Odoo quelyos_api

Tests de parité : vérifier que l'API REST retourne les mêmes données
que celles stockées dans la base de données Odoo.
"""

import pytest
import xmlrpc.client
import json


# Configuration Odoo
ODOO_URL = "http://localhost:8069"
ODOO_DB = "quelyos"
ODOO_USERNAME = "admin"
ODOO_PASSWORD = "admin"


@pytest.fixture(scope="session")
def odoo_connection():
    """Connexion Odoo via XML-RPC pour accès direct à la DB"""
    common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
    uid = common.authenticate(ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, {})

    if not uid:
        raise Exception("Échec authentification Odoo")

    models = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/object')

    return {
        'url': ODOO_URL,
        'db': ODOO_DB,
        'uid': uid,
        'password': ODOO_PASSWORD,
        'models': models,
    }


@pytest.fixture(scope="session")
def api_session():
    """Session authentifiée pour appels API REST"""
    import requests

    session = requests.Session()

    # Login
    response = session.post(
        f"{ODOO_URL}/api/ecommerce/auth/login",
        json={
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "email": ODOO_USERNAME,
                "password": ODOO_PASSWORD
            },
            "id": 1
        }
    )

    result = response.json().get('result', {})
    if not result.get('success'):
        raise Exception(f"Échec login API : {result.get('error')}")

    session_id = result.get('session_id')
    if session_id:
        session.headers.update({'X-Session-Id': session_id})

    return session


@pytest.fixture
def create_test_product(odoo_connection):
    """Fixture pour créer un produit de test et le nettoyer après"""
    created_ids = []

    def _create(name="Test Product", price=100.0):
        conn = odoo_connection
        product_id = conn['models'].execute_kw(
            conn['db'], conn['uid'], conn['password'],
            'product.template', 'create',
            [{
                'name': name,
                'list_price': price,
                'type': 'consu',
                'active': True,
            }]
        )
        created_ids.append(product_id)
        return product_id

    yield _create

    # Cleanup
    if created_ids:
        conn = odoo_connection
        conn['models'].execute_kw(
            conn['db'], conn['uid'], conn['password'],
            'product.template', 'unlink',
            [created_ids]
        )


@pytest.fixture
def create_test_customer(odoo_connection):
    """Fixture pour créer un client de test"""
    created_ids = []

    def _create(name="Test Customer", email="test@example.com"):
        conn = odoo_connection
        partner_id = conn['models'].execute_kw(
            conn['db'], conn['uid'], conn['password'],
            'res.partner', 'create',
            [{
                'name': name,
                'email': email,
                'customer_rank': 1,
            }]
        )
        created_ids.append(partner_id)
        return partner_id

    yield _create

    # Cleanup
    if created_ids:
        conn = odoo_connection
        conn['models'].execute_kw(
            conn['db'], conn['uid'], conn['password'],
            'res.partner', 'unlink',
            [created_ids]
        )
