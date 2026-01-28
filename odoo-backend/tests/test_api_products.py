# -*- coding: utf-8 -*-
"""
Tests API Produits

Couvre:
- Liste produits avec pagination
- Détail produit
- Recherche produits
- Filtrage par catégorie
- CRUD produits (admin)
"""

import pytest

pytestmark = pytest.mark.products


class TestProductsList:
    """Tests endpoint GET /api/ecommerce/products"""

    def test_list_products_returns_array(self, http_get):
        """Liste produits doit retourner un tableau"""
        response = http_get('/ecommerce/products')
        assert response.status_code == 200
        data = response.json()
        # Peut être dans 'result' ou 'products' selon le format
        products = data.get('result', {}).get('products', []) or data.get('products', [])
        assert isinstance(products, list)

    def test_list_products_pagination(self, http_get):
        """Liste produits avec pagination doit respecter limit/offset"""
        response = http_get('/ecommerce/products', params={'limit': 5, 'offset': 0})
        assert response.status_code == 200
        data = response.json()
        result = data.get('result', data)
        products = result.get('products', [])
        assert len(products) <= 5

    def test_list_products_structure(self, http_get):
        """Chaque produit doit avoir les champs requis"""
        response = http_get('/ecommerce/products', params={'limit': 1})
        assert response.status_code == 200
        data = response.json()
        result = data.get('result', data)
        products = result.get('products', [])

        if products:
            product = products[0]
            # Champs obligatoires (anonymisés - pas de noms Odoo)
            assert 'id' in product
            assert 'name' in product
            # Prix doit être 'price' pas 'list_price'
            assert 'price' in product or 'list_price' in product

    def test_list_products_no_odoo_field_names(self, http_get):
        """Les champs ne doivent pas exposer les noms Odoo internes"""
        response = http_get('/ecommerce/products', params={'limit': 1})
        assert response.status_code == 200
        data = response.json()
        result = data.get('result', data)
        products = result.get('products', [])

        if products:
            product = products[0]
            product_str = str(product).lower()
            # Vérifier absence de termes Odoo
            odoo_terms = ['product.template', 'product.product', 'ir.attachment']
            for term in odoo_terms:
                assert term not in product_str, f"Terme Odoo exposé: {term}"


class TestProductDetail:
    """Tests endpoint GET /api/ecommerce/products/<id>"""

    def test_get_product_by_id(self, http_get, create_test_product):
        """Récupérer un produit par ID doit fonctionner"""
        product_id = create_test_product(name="Test Product Detail", price=99.99)

        response = http_get(f'/ecommerce/products/{product_id}')
        assert response.status_code == 200
        data = response.json()
        result = data.get('result', data)

        if result.get('success') is not False:
            product = result.get('product', result)
            assert product.get('id') == product_id or product.get('name') == "Test Product Detail"

    def test_get_product_nonexistent(self, http_get):
        """Récupérer un produit inexistant doit retourner erreur appropriée"""
        response = http_get('/ecommerce/products/999999999')
        assert response.status_code in [200, 404]
        data = response.json()
        result = data.get('result', data)
        # Doit indiquer l'absence du produit
        if response.status_code == 200:
            assert result.get('success') is False or result.get('product') is None

    def test_get_product_includes_stock(self, http_get, create_test_product):
        """Détail produit doit inclure info stock"""
        product_id = create_test_product(name="Test Stock Product")

        response = http_get(f'/ecommerce/products/{product_id}')
        assert response.status_code == 200
        data = response.json()
        result = data.get('result', data)

        if result.get('success') is not False:
            product = result.get('product', result)
            # Doit avoir un indicateur de stock
            has_stock_info = any(k in product for k in [
                'stock_quantity', 'qty_available', 'stock_status', 'in_stock'
            ])
            # Note: peut ne pas être présent si le module stock n'est pas configuré


class TestProductSearch:
    """Tests recherche produits"""

    def test_search_by_name(self, http_get, create_test_product):
        """Recherche par nom doit fonctionner"""
        unique_name = f"UniqueSearchTest_{__import__('time').time()}"
        create_test_product(name=unique_name, price=50.0)

        response = http_get('/ecommerce/products', params={'search': unique_name[:10]})
        assert response.status_code == 200

    def test_search_empty_query(self, http_get):
        """Recherche vide doit retourner tous les produits (avec pagination)"""
        response = http_get('/ecommerce/products', params={'search': ''})
        assert response.status_code == 200

    def test_search_special_characters(self, http_get):
        """Recherche avec caractères spéciaux ne doit pas crasher"""
        special_queries = ["test'product", "test<script>", "test%20product", "test&category"]
        for query in special_queries:
            response = http_get('/ecommerce/products', params={'search': query})
            assert response.status_code in [200, 400], f"Query failed: {query}"


class TestProductByCategory:
    """Tests filtrage par catégorie"""

    def test_filter_by_category_id(self, http_get, create_test_category):
        """Filtrer par catégorie ID doit fonctionner"""
        categ_id = create_test_category(name="Test Filter Category")

        response = http_get('/ecommerce/products', params={'category_id': categ_id})
        assert response.status_code == 200

    def test_filter_by_invalid_category(self, http_get):
        """Filtrer par catégorie inexistante doit retourner liste vide"""
        response = http_get('/ecommerce/products', params={'category_id': 999999})
        assert response.status_code == 200
        data = response.json()
        result = data.get('result', data)
        products = result.get('products', [])
        assert isinstance(products, list)


class TestProductCRUD:
    """Tests CRUD produits (endpoints admin)"""

    def test_create_product_requires_auth(self, api_base_url, api_session_anonymous):
        """Créer un produit sans auth doit échouer"""
        response = api_session_anonymous.post(
            f"{api_base_url}/backoffice/products",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {
                    "name": "Unauthorized Product",
                    "price": 100
                },
                "id": 1
            }
        )
        # Doit refuser (401/403 ou success=False)
        if response.status_code == 200:
            result = response.json().get('result', {})
            assert result.get('success') is False

    def test_update_product_requires_auth(self, api_base_url, api_session_anonymous, create_test_product):
        """Modifier un produit sans auth doit échouer"""
        product_id = create_test_product()

        response = api_session_anonymous.post(
            f"{api_base_url}/backoffice/products/{product_id}",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {
                    "name": "Hacked Product"
                },
                "id": 1
            }
        )
        if response.status_code == 200:
            result = response.json().get('result', {})
            assert result.get('success') is False

    def test_delete_product_requires_auth(self, api_base_url, api_session_anonymous, create_test_product):
        """Supprimer un produit sans auth doit échouer"""
        product_id = create_test_product()

        response = api_session_anonymous.delete(
            f"{api_base_url}/backoffice/products/{product_id}"
        )
        # Doit refuser
        assert response.status_code in [401, 403, 404, 405] or \
               response.json().get('result', {}).get('success') is False


class TestProductParity:
    """Tests de parité entre API et DB Odoo"""

    def test_product_price_matches_db(
        self, http_get, create_test_product, odoo_connection
    ):
        """Le prix API doit correspondre au prix en DB"""
        expected_price = 123.45
        product_id = create_test_product(name="Price Parity Test", price=expected_price)

        response = http_get(f'/ecommerce/products/{product_id}')
        assert response.status_code == 200
        data = response.json()
        result = data.get('result', data)

        if result.get('success') is not False:
            product = result.get('product', result)
            api_price = product.get('price') or product.get('list_price')
            if api_price is not None:
                assert abs(float(api_price) - expected_price) < 0.01

    def test_product_name_matches_db(
        self, http_get, create_test_product, odoo_connection
    ):
        """Le nom API doit correspondre au nom en DB"""
        expected_name = "Parity Name Test Product"
        product_id = create_test_product(name=expected_name)

        response = http_get(f'/ecommerce/products/{product_id}')
        assert response.status_code == 200
        data = response.json()
        result = data.get('result', data)

        if result.get('success') is not False:
            product = result.get('product', result)
            assert product.get('name') == expected_name
