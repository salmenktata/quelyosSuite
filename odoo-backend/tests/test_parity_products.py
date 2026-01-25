"""
Tests de parité : Produits

Vérifier que l'API REST /api/ecommerce/products retourne exactement
les mêmes données que celles stockées dans product.template Odoo.
"""

import pytest


class TestProductsParity:
    """Tests de parité pour les produits"""

    def test_api_products_list_matches_odoo_db(self, odoo_connection, api_session):
        """L'API /products doit retourner les mêmes produits que la DB Odoo"""
        conn = odoo_connection

        # 1. Récupérer produits depuis DB Odoo directement
        odoo_products = conn['models'].execute_kw(
            conn['db'], conn['uid'], conn['password'],
            'product.template', 'search_read',
            [[('active', '=', True)]],
            {'fields': ['id', 'name', 'list_price', 'qty_available'], 'limit': 10}
        )

        # 2. Récupérer produits depuis API REST
        response = api_session.post(
            f"{conn['url']}/api/ecommerce/products",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {"limit": 10},
                "id": 1
            }
        )

        api_result = response.json().get('result', {})
        assert api_result.get('success'), f"API failed: {api_result.get('error')}"

        api_products = api_result.get('data', {}).get('products', [])

        # 3. Vérifier que les IDs correspondent
        odoo_ids = {p['id'] for p in odoo_products}
        api_ids = {p['id'] for p in api_products}

        # Au moins quelques IDs communs (peut y avoir filtrage côté API)
        common_ids = odoo_ids & api_ids
        assert len(common_ids) > 0, "Aucun produit commun entre Odoo et API"

        # 4. Pour les produits communs, vérifier cohérence des données
        for product_id in list(common_ids)[:5]:  # Vérifier 5 premiers
            odoo_product = next(p for p in odoo_products if p['id'] == product_id)
            api_product = next(p for p in api_products if p['id'] == product_id)

            assert odoo_product['name'] == api_product['name'], \
                f"Nom différent pour produit {product_id}"
            assert abs(odoo_product['list_price'] - api_product['price']) < 0.01, \
                f"Prix différent pour produit {product_id}"

    def test_api_product_detail_matches_odoo_db(self, odoo_connection, api_session, create_test_product):
        """L'API /products/:id doit retourner les mêmes détails que la DB Odoo"""
        conn = odoo_connection

        # Créer un produit de test
        product_id = create_test_product(name="Test Parité Produit", price=99.99)

        # 1. Récupérer depuis DB Odoo
        odoo_product = conn['models'].execute_kw(
            conn['db'], conn['uid'], conn['password'],
            'product.template', 'read',
            [product_id],
            {'fields': ['id', 'name', 'list_price', 'description', 'active']}
        )[0]

        # 2. Récupérer depuis API REST
        response = api_session.post(
            f"{conn['url']}/api/ecommerce/products/{product_id}",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {},
                "id": 1
            }
        )

        api_result = response.json().get('result', {})
        assert api_result.get('success'), f"API failed: {api_result.get('error')}"

        api_product = api_result.get('data', {}).get('product', {})

        # 3. Vérifier parité des champs
        assert api_product['id'] == odoo_product['id']
        assert api_product['name'] == odoo_product['name']
        assert abs(api_product['price'] - odoo_product['list_price']) < 0.01

    def test_api_product_create_writes_to_odoo_db(self, odoo_connection, api_session):
        """Créer un produit via API doit l'écrire dans la DB Odoo"""
        conn = odoo_connection

        # 1. Créer via API
        response = api_session.post(
            f"{conn['url']}/api/ecommerce/products/create",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {
                    "name": "Produit Test Parité Create",
                    "price": 149.99,
                    "description": "Test création via API"
                },
                "id": 1
            }
        )

        api_result = response.json().get('result', {})
        assert api_result.get('success'), f"API failed: {api_result.get('error')}"

        product_id = api_result.get('data', {}).get('product', {}).get('id')
        assert product_id, "Pas d'ID retourné par l'API"

        try:
            # 2. Vérifier qu'il existe bien dans Odoo DB
            odoo_product = conn['models'].execute_kw(
                conn['db'], conn['uid'], conn['password'],
                'product.template', 'read',
                [product_id],
                {'fields': ['id', 'name', 'list_price']}
            )

            assert len(odoo_product) == 1, "Produit non trouvé dans Odoo DB"
            assert odoo_product[0]['name'] == "Produit Test Parité Create"
            assert abs(odoo_product[0]['list_price'] - 149.99) < 0.01

        finally:
            # Cleanup
            conn['models'].execute_kw(
                conn['db'], conn['uid'], conn['password'],
                'product.template', 'unlink',
                [[product_id]]
            )

    def test_api_product_stock_matches_odoo_quants(self, odoo_connection, api_session):
        """Les quantités en stock de l'API doivent correspondre aux stock.quant Odoo"""
        conn = odoo_connection

        # Récupérer quelques produits avec stock depuis l'API
        response = api_session.post(
            f"{conn['url']}/api/ecommerce/stock/products",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {"limit": 5},
                "id": 1
            }
        )

        api_result = response.json().get('result', {})
        assert api_result.get('success'), "API stock failed"

        api_products = api_result.get('data', {}).get('products', [])

        if not api_products:
            pytest.skip("Aucun produit en stock pour tester")

        # Vérifier parité stock pour premier produit
        api_product = api_products[0]
        product_id = api_product['id']

        # Récupérer qty_available depuis product.product (pas template)
        product_products = conn['models'].execute_kw(
            conn['db'], conn['uid'], conn['password'],
            'product.product', 'search_read',
            [[('product_tmpl_id', '=', product_id)]],
            {'fields': ['id', 'qty_available'], 'limit': 1}
        )

        if product_products:
            odoo_qty = product_products[0]['qty_available']
            api_qty = api_product['qty_available']

            assert abs(odoo_qty - api_qty) < 0.01, \
                f"Stock différent : Odoo={odoo_qty}, API={api_qty}"
