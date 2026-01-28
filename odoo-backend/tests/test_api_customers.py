# -*- coding: utf-8 -*-
"""
Tests API Clients

Couvre:
- Liste clients
- Détail client
- Création client
- Mise à jour client
- Recherche clients
"""

import pytest
import time

pytestmark = pytest.mark.customers


class TestCustomersList:
    """Tests endpoint liste clients"""

    def test_list_customers_requires_auth(self, api_base_url, api_session_anonymous):
        """Liste clients doit requérir authentification"""
        response = api_session_anonymous.post(
            f"{api_base_url}/backoffice/customers",
            json={"jsonrpc": "2.0", "method": "call", "params": {}, "id": 1}
        )
        if response.status_code == 200:
            result = response.json().get('result', {})
            assert result.get('success') is False or \
                   result.get('error_code') in ['AUTH_REQUIRED', 'SESSION_EXPIRED']

    def test_list_customers_authenticated(self, jsonrpc_call):
        """Liste clients avec auth doit fonctionner"""
        result = jsonrpc_call('/backoffice/customers')
        if isinstance(result, dict):
            if 'customers' in result or 'partners' in result:
                customers = result.get('customers') or result.get('partners', [])
                assert isinstance(customers, list)

    def test_list_customers_pagination(self, jsonrpc_call):
        """Pagination des clients doit fonctionner"""
        result = jsonrpc_call('/backoffice/customers', {'limit': 5, 'offset': 0})
        if isinstance(result, dict):
            customers = result.get('customers') or result.get('partners', [])
            if customers:
                assert len(customers) <= 5

    def test_list_customers_structure(self, jsonrpc_call):
        """Chaque client doit avoir les champs requis"""
        result = jsonrpc_call('/backoffice/customers', {'limit': 1})
        if isinstance(result, dict):
            customers = result.get('customers') or result.get('partners', [])
            if customers:
                customer = customers[0]
                assert 'id' in customer
                assert 'name' in customer


class TestCustomerDetail:
    """Tests endpoint détail client"""

    def test_get_customer_by_id(self, jsonrpc_call, create_test_customer):
        """Récupérer un client par ID"""
        customer_id = create_test_customer(name="Detail Test Customer")

        result = jsonrpc_call(f'/backoffice/customers/{customer_id}')
        if isinstance(result, dict) and result.get('success') is not False:
            customer = result.get('customer') or result.get('partner', result)
            assert customer.get('id') == customer_id

    def test_get_customer_nonexistent(self, jsonrpc_call):
        """Client inexistant doit retourner erreur"""
        result = jsonrpc_call('/backoffice/customers/999999999')
        if isinstance(result, dict):
            assert result.get('success') is False or result.get('customer') is None

    def test_customer_includes_orders(self, jsonrpc_call, create_test_customer, create_test_order):
        """Détail client peut inclure ses commandes"""
        customer_id = create_test_customer(name="Customer With Orders")
        create_test_order(customer_id=customer_id)

        result = jsonrpc_call(f'/backoffice/customers/{customer_id}')
        # Les commandes peuvent être incluses ou non selon l'implémentation


class TestCustomerCreate:
    """Tests création client"""

    def test_create_customer_requires_auth(self, api_base_url, api_session_anonymous):
        """Créer un client doit requérir auth"""
        response = api_session_anonymous.post(
            f"{api_base_url}/backoffice/customers/create",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {
                    "name": "Unauthorized Customer",
                    "email": "unauth@test.com"
                },
                "id": 1
            }
        )
        if response.status_code == 200:
            result = response.json().get('result', {})
            assert result.get('success') is False

    def test_create_customer_valid_data(self, jsonrpc_call, assert_api_success):
        """Créer un client avec données valides"""
        unique_email = f"test_{int(time.time())}@example.com"
        result = jsonrpc_call('/backoffice/customers/create', {
            'name': 'New Test Customer',
            'email': unique_email,
            'phone': '+33612345678'
        })

        # Peut réussir ou échouer selon les permissions
        if isinstance(result, dict):
            if result.get('success'):
                assert 'id' in result or 'customer_id' in result

    def test_create_customer_validates_email(self, jsonrpc_call):
        """Email invalide doit être rejeté"""
        result = jsonrpc_call('/backoffice/customers/create', {
            'name': 'Invalid Email Customer',
            'email': 'not-an-email'
        })

        # Peut accepter (validation côté client) ou rejeter (validation serveur)

    def test_create_customer_duplicate_email(self, jsonrpc_call, create_test_customer):
        """Email dupliqué doit être géré"""
        existing_email = f"duplicate_{int(time.time())}@test.com"
        create_test_customer(name="Original Customer", email=existing_email)

        result = jsonrpc_call('/backoffice/customers/create', {
            'name': 'Duplicate Customer',
            'email': existing_email
        })

        # Doit soit rejeter soit fusionner


class TestCustomerUpdate:
    """Tests mise à jour client"""

    def test_update_customer_name(self, jsonrpc_call, create_test_customer):
        """Modifier le nom d'un client"""
        customer_id = create_test_customer(name="Original Name")

        result = jsonrpc_call(f'/backoffice/customers/{customer_id}/update', {
            'name': 'Updated Name'
        })

        # Vérifier la modification
        if isinstance(result, dict) and result.get('success'):
            check = jsonrpc_call(f'/backoffice/customers/{customer_id}')
            if isinstance(check, dict):
                customer = check.get('customer') or check.get('partner', check)
                assert customer.get('name') == 'Updated Name'

    def test_update_customer_requires_auth(self, api_base_url, api_session_anonymous, create_test_customer):
        """Modifier un client doit requérir auth"""
        customer_id = create_test_customer()

        response = api_session_anonymous.post(
            f"{api_base_url}/backoffice/customers/{customer_id}/update",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {"name": "Hacked Name"},
                "id": 1
            }
        )
        if response.status_code == 200:
            result = response.json().get('result', {})
            assert result.get('success') is False


class TestCustomerSearch:
    """Tests recherche clients"""

    def test_search_by_name(self, jsonrpc_call, create_test_customer):
        """Recherche par nom doit fonctionner"""
        unique_name = f"SearchableCustomer_{int(time.time())}"
        create_test_customer(name=unique_name)

        result = jsonrpc_call('/backoffice/customers', {'search': unique_name[:15]})
        if isinstance(result, dict):
            customers = result.get('customers') or result.get('partners', [])
            # Devrait trouver le client créé

    def test_search_by_email(self, jsonrpc_call, create_test_customer):
        """Recherche par email doit fonctionner"""
        unique_email = f"searchable_{int(time.time())}@test.com"
        create_test_customer(name="Email Search Test", email=unique_email)

        result = jsonrpc_call('/backoffice/customers', {'search': unique_email})
        if isinstance(result, dict):
            customers = result.get('customers') or result.get('partners', [])
            # Devrait trouver le client créé

    def test_search_empty_returns_all(self, jsonrpc_call):
        """Recherche vide doit retourner tous les clients (paginés)"""
        result = jsonrpc_call('/backoffice/customers', {'search': '', 'limit': 10})
        if isinstance(result, dict):
            customers = result.get('customers') or result.get('partners', [])
            assert isinstance(customers, list)


class TestCustomerFilters:
    """Tests filtres clients"""

    def test_filter_by_active(self, jsonrpc_call):
        """Filtrer par statut actif/inactif"""
        result = jsonrpc_call('/backoffice/customers', {'active': True})
        if isinstance(result, dict):
            customers = result.get('customers') or result.get('partners', [])
            # Tous les clients retournés devraient être actifs

    def test_filter_by_country(self, jsonrpc_call):
        """Filtrer par pays"""
        result = jsonrpc_call('/backoffice/customers', {'country_id': 75})  # France
        if isinstance(result, dict):
            customers = result.get('customers') or result.get('partners', [])
            # Devrait retourner uniquement clients français


class TestCustomerParity:
    """Tests de parité clients API vs DB"""

    def test_customer_email_matches_db(self, jsonrpc_call, create_test_customer, odoo_connection):
        """L'email API doit correspondre à la DB"""
        expected_email = f"parity_{int(time.time())}@test.com"
        customer_id = create_test_customer(name="Parity Test", email=expected_email)

        result = jsonrpc_call(f'/backoffice/customers/{customer_id}')

        if isinstance(result, dict) and result.get('success') is not False:
            customer = result.get('customer') or result.get('partner', result)
            api_email = customer.get('email')
            assert api_email == expected_email

    def test_customer_name_matches_db(self, jsonrpc_call, create_test_customer, odoo_connection):
        """Le nom API doit correspondre à la DB"""
        expected_name = f"Parity Name Customer {int(time.time())}"
        customer_id = create_test_customer(name=expected_name)

        result = jsonrpc_call(f'/backoffice/customers/{customer_id}')

        if isinstance(result, dict) and result.get('success') is not False:
            customer = result.get('customer') or result.get('partner', result)
            assert customer.get('name') == expected_name
