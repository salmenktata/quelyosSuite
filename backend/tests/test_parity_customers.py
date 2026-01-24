"""
Tests de parité : Clients

Vérifier que l'API REST /api/ecommerce/customers retourne exactement
les mêmes données que res.partner Odoo.
"""

import pytest


class TestCustomersParity:
    """Tests de parité pour les clients"""

    def test_api_customers_list_matches_odoo_partners(self, odoo_connection, api_session):
        """L'API /customers doit retourner les mêmes clients que res.partner Odoo"""
        conn = odoo_connection

        # 1. Récupérer clients depuis DB Odoo
        odoo_customers = conn['models'].execute_kw(
            conn['db'], conn['uid'], conn['password'],
            'res.partner', 'search_read',
            [[('customer_rank', '>', 0)]],
            {'fields': ['id', 'name', 'email', 'phone'], 'limit': 10, 'order': 'name asc'}
        )

        # 2. Récupérer clients depuis API REST
        response = api_session.post(
            f"{conn['url']}/api/ecommerce/customers",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {"limit": 10},
                "id": 1
            }
        )

        api_result = response.json().get('result', {})
        assert api_result.get('success'), f"API failed: {api_result.get('error')}"

        api_customers = api_result.get('data', {}).get('customers', [])

        # 3. Vérifier que les IDs correspondent
        odoo_ids = {c['id'] for c in odoo_customers}
        api_ids = {c['id'] for c in api_customers}

        common_ids = odoo_ids & api_ids
        assert len(common_ids) > 0, "Aucun client commun entre Odoo et API"

        # 4. Vérifier cohérence des données pour quelques clients
        for customer_id in list(common_ids)[:3]:
            odoo_customer = next(c for c in odoo_customers if c['id'] == customer_id)
            api_customer = next(c for c in api_customers if c['id'] == customer_id)

            assert odoo_customer['name'] == api_customer['name'], \
                f"Nom différent pour client {customer_id}"
            assert odoo_customer['email'] == api_customer['email'], \
                f"Email différent pour client {customer_id}"

    def test_api_customer_detail_matches_odoo_partner(self, odoo_connection, api_session, create_test_customer):
        """L'API /customers/:id doit retourner les mêmes détails que res.partner Odoo"""
        conn = odoo_connection

        # Créer un client de test
        customer_id = create_test_customer(
            name="Client Test Parité",
            email="test.parite@example.com"
        )

        # 1. Récupérer depuis DB Odoo
        odoo_customer = conn['models'].execute_kw(
            conn['db'], conn['uid'], conn['password'],
            'res.partner', 'read',
            [customer_id],
            {'fields': ['id', 'name', 'email', 'phone', 'street', 'city', 'zip']}
        )[0]

        # 2. Récupérer depuis API REST
        response = api_session.post(
            f"{conn['url']}/api/ecommerce/customers/{customer_id}",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {},
                "id": 1
            }
        )

        api_result = response.json().get('result', {})
        assert api_result.get('success'), f"API failed: {api_result.get('error')}"

        api_customer = api_result.get('customer', {})

        # 3. Vérifier parité des champs
        assert api_customer['id'] == odoo_customer['id']
        assert api_customer['name'] == odoo_customer['name']
        assert api_customer['email'] == odoo_customer['email']

    def test_api_customer_orders_count_matches_sale_orders(self, odoo_connection, api_session):
        """Le nombre de commandes retourné par l'API doit correspondre aux sale.order Odoo"""
        conn = odoo_connection

        # Récupérer quelques clients depuis l'API
        response = api_session.post(
            f"{conn['url']}/api/ecommerce/customers",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {"limit": 5},
                "id": 1
            }
        )

        api_result = response.json().get('result', {})
        assert api_result.get('success'), "API failed"

        api_customers = api_result.get('data', {}).get('customers', [])

        if not api_customers:
            pytest.skip("Aucun client pour tester")

        # Vérifier le nombre de commandes pour le premier client
        customer = api_customers[0]
        customer_id = customer['id']
        api_orders_count = customer.get('orders_count', 0)

        # Compter les commandes dans Odoo DB
        odoo_orders_count = conn['models'].execute_kw(
            conn['db'], conn['uid'], conn['password'],
            'sale.order', 'search_count',
            [[('partner_id', '=', customer_id), ('state', 'in', ['sale', 'done'])]]
        )

        assert api_orders_count == odoo_orders_count, \
            f"Nombre de commandes différent : API={api_orders_count}, Odoo={odoo_orders_count}"

    def test_api_export_customers_includes_all_odoo_customers(self, odoo_connection, api_session):
        """L'export CSV doit inclure tous les clients Odoo"""
        conn = odoo_connection

        # 1. Compter clients dans Odoo DB
        odoo_count = conn['models'].execute_kw(
            conn['db'], conn['uid'], conn['password'],
            'res.partner', 'search_count',
            [[('customer_rank', '>', 0)]]
        )

        # 2. Exporter via API
        response = api_session.post(
            f"{conn['url']}/api/ecommerce/customers/export",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {"search": ""},
                "id": 1
            }
        )

        api_result = response.json().get('result', {})
        assert api_result.get('success'), f"API failed: {api_result.get('error')}"

        api_count = api_result.get('data', {}).get('total', 0)

        # 3. Vérifier que tous les clients sont exportés
        assert api_count == odoo_count, \
            f"Export incomplet : API={api_count}, Odoo={odoo_count}"
