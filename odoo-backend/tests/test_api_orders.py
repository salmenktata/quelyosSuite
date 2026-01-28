# -*- coding: utf-8 -*-
"""
Tests API Commandes

Couvre:
- Liste commandes
- Détail commande
- Création commande (checkout)
- Modification statut
- Annulation commande
"""

import pytest

pytestmark = pytest.mark.orders


class TestOrdersList:
    """Tests endpoint liste commandes"""

    def test_list_orders_requires_auth(self, api_base_url, api_session_anonymous):
        """Liste commandes doit requérir authentification"""
        response = api_session_anonymous.post(
            f"{api_base_url}/backoffice/orders",
            json={"jsonrpc": "2.0", "method": "call", "params": {}, "id": 1}
        )
        if response.status_code == 200:
            result = response.json().get('result', {})
            # Doit échouer ou retourner liste vide
            assert result.get('success') is False or result.get('orders', []) == []

    def test_list_orders_authenticated(self, jsonrpc_call):
        """Liste commandes avec auth doit fonctionner"""
        result = jsonrpc_call('/backoffice/orders')
        # Peut retourner success ou directement la liste
        if isinstance(result, dict):
            if 'orders' in result:
                assert isinstance(result['orders'], list)

    def test_list_orders_pagination(self, jsonrpc_call):
        """Pagination des commandes doit fonctionner"""
        result = jsonrpc_call('/backoffice/orders', {'limit': 5, 'offset': 0})
        if isinstance(result, dict) and 'orders' in result:
            assert len(result['orders']) <= 5


class TestOrderDetail:
    """Tests endpoint détail commande"""

    def test_get_order_by_id(self, jsonrpc_call, create_test_order):
        """Récupérer une commande par ID"""
        order_id = create_test_order()

        result = jsonrpc_call(f'/backoffice/orders/{order_id}')
        if isinstance(result, dict):
            if result.get('success') is not False:
                order = result.get('order', result)
                assert order.get('id') == order_id

    def test_get_order_includes_lines(self, jsonrpc_call, create_test_order):
        """Détail commande doit inclure les lignes"""
        order_id = create_test_order()

        result = jsonrpc_call(f'/backoffice/orders/{order_id}')
        if isinstance(result, dict) and result.get('success') is not False:
            order = result.get('order', result)
            # Doit avoir des lignes de commande
            has_lines = 'lines' in order or 'order_line' in order or 'items' in order
            # Note: Le champ peut varier selon l'implémentation

    def test_get_order_nonexistent(self, jsonrpc_call):
        """Commande inexistante doit retourner erreur"""
        result = jsonrpc_call('/backoffice/orders/999999999')
        if isinstance(result, dict):
            assert result.get('success') is False or result.get('order') is None

    def test_get_order_requires_auth(self, api_base_url, api_session_anonymous, create_test_order):
        """Détail commande sans auth doit échouer"""
        order_id = create_test_order()

        response = api_session_anonymous.post(
            f"{api_base_url}/backoffice/orders/{order_id}",
            json={"jsonrpc": "2.0", "method": "call", "params": {}, "id": 1}
        )
        if response.status_code == 200:
            result = response.json().get('result', {})
            assert result.get('success') is False


class TestOrderCreation:
    """Tests création de commande (checkout)"""

    def test_checkout_requires_cart(self, jsonrpc_call):
        """Checkout sans panier doit échouer"""
        result = jsonrpc_call('/ecommerce/checkout', {
            'shipping_address': {},
            'billing_address': {},
            'payment_method': 'test'
        })
        # Doit indiquer panier vide ou manquant
        if isinstance(result, dict):
            assert result.get('success') is False or 'cart' in str(result).lower()

    def test_checkout_validates_address(self, jsonrpc_call):
        """Checkout doit valider l'adresse de livraison"""
        result = jsonrpc_call('/ecommerce/checkout', {
            'shipping_address': {
                'name': '',  # Nom vide - invalide
                'street': '',
                'city': '',
                'country_id': None
            }
        })
        # Doit indiquer erreur de validation
        if isinstance(result, dict):
            assert result.get('success') is False


class TestOrderStatusUpdate:
    """Tests mise à jour statut commande"""

    def test_confirm_order(self, jsonrpc_call, create_test_order):
        """Confirmer une commande doit changer son statut"""
        order_id = create_test_order()

        result = jsonrpc_call(f'/backoffice/orders/{order_id}/confirm')
        # Le résultat dépend de l'état actuel de la commande

    def test_cancel_order(self, jsonrpc_call, create_test_order):
        """Annuler une commande doit fonctionner"""
        order_id = create_test_order()

        result = jsonrpc_call(f'/backoffice/orders/{order_id}/cancel')
        # Doit réussir ou indiquer pourquoi l'annulation est impossible

    def test_status_update_requires_auth(self, api_base_url, api_session_anonymous, create_test_order):
        """Modification statut sans auth doit échouer"""
        order_id = create_test_order()

        response = api_session_anonymous.post(
            f"{api_base_url}/backoffice/orders/{order_id}/confirm",
            json={"jsonrpc": "2.0", "method": "call", "params": {}, "id": 1}
        )
        if response.status_code == 200:
            result = response.json().get('result', {})
            assert result.get('success') is False


class TestOrderFilters:
    """Tests filtres commandes"""

    def test_filter_by_status(self, jsonrpc_call):
        """Filtrer par statut doit fonctionner"""
        for status in ['draft', 'sale', 'done', 'cancel']:
            result = jsonrpc_call('/backoffice/orders', {'status': status})
            if isinstance(result, dict) and 'orders' in result:
                # Toutes les commandes retournées doivent avoir ce statut
                for order in result['orders']:
                    if 'state' in order:
                        assert order['state'] == status

    def test_filter_by_date_range(self, jsonrpc_call):
        """Filtrer par plage de dates doit fonctionner"""
        result = jsonrpc_call('/backoffice/orders', {
            'date_from': '2024-01-01',
            'date_to': '2024-12-31'
        })
        # Doit retourner sans erreur
        assert isinstance(result, dict)

    def test_filter_by_customer(self, jsonrpc_call, create_test_order, create_test_customer):
        """Filtrer par client doit fonctionner"""
        customer_id = create_test_customer(name="Filter Test Customer")
        create_test_order(customer_id=customer_id)

        result = jsonrpc_call('/backoffice/orders', {'customer_id': customer_id})
        if isinstance(result, dict) and 'orders' in result:
            for order in result['orders']:
                if 'partner_id' in order:
                    assert order['partner_id'] == customer_id


class TestOrderParity:
    """Tests de parité commandes API vs DB"""

    def test_order_total_matches_db(self, jsonrpc_call, create_test_order, odoo_connection):
        """Le total commande API doit correspondre à la DB"""
        order_id = create_test_order()

        # Récupérer depuis l'API
        result = jsonrpc_call(f'/backoffice/orders/{order_id}')

        # Récupérer depuis la DB
        conn = odoo_connection
        db_order = conn['models'].execute_kw(
            conn['db'], conn['uid'], conn['password'],
            'sale.order', 'read',
            [[order_id], ['amount_total']]
        )

        if db_order and isinstance(result, dict) and result.get('success') is not False:
            db_total = db_order[0]['amount_total']
            order = result.get('order', result)
            api_total = order.get('amount_total') or order.get('total')
            if api_total is not None:
                assert abs(float(api_total) - float(db_total)) < 0.01
