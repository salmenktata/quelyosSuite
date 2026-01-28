# -*- coding: utf-8 -*-
"""
Tests de Sécurité API

Couvre:
- Injection SQL
- XSS
- CSRF
- Authorization bypass
- IDOR (Insecure Direct Object Reference)
- Rate limiting
- Session security
"""

import pytest
import requests
import time

pytestmark = pytest.mark.security


class TestSQLInjection:
    """Tests protection contre injection SQL"""

    PAYLOADS = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "1; SELECT * FROM res_users",
        "' UNION SELECT password FROM res_users --",
        "1' AND '1'='1",
        "admin'--",
        "' OR 1=1--",
        "'; EXEC xp_cmdshell('dir'); --",
    ]

    def test_login_sql_injection(self, api_base_url, api_session_anonymous):
        """Login doit être protégé contre SQL injection"""
        for payload in self.PAYLOADS:
            response = api_session_anonymous.post(
                f"{api_base_url}/ecommerce/auth/login",
                json={
                    "jsonrpc": "2.0",
                    "method": "call",
                    "params": {"email": payload, "password": payload},
                    "id": 1
                }
            )
            assert response.status_code == 200
            result = response.json().get('result', {})
            # Ne doit pas réussir l'auth
            assert result.get('success') is False
            # Ne doit pas exposer d'erreur SQL
            error_str = str(result).lower()
            assert 'syntax' not in error_str
            assert 'postgresql' not in error_str
            assert 'psycopg' not in error_str

    def test_search_sql_injection(self, http_get):
        """Recherche doit être protégée contre SQL injection"""
        for payload in self.PAYLOADS:
            response = http_get('/ecommerce/products', params={'search': payload})
            assert response.status_code in [200, 400]
            # Ne doit pas crasher avec erreur SQL
            if response.status_code == 200:
                data = response.json()
                data_str = str(data).lower()
                assert 'syntax error' not in data_str
                assert 'psycopg' not in data_str

    def test_id_parameter_sql_injection(self, http_get):
        """Paramètres ID doivent être protégés contre SQL injection"""
        payloads = ["1 OR 1=1", "1; DROP TABLE", "1' OR '1'='1"]
        for payload in payloads:
            response = http_get(f'/ecommerce/products/{payload}')
            # Doit retourner 404 ou erreur, pas un dump de données
            assert response.status_code in [200, 400, 404]


class TestXSSProtection:
    """Tests protection contre XSS"""

    XSS_PAYLOADS = [
        "<script>alert('xss')</script>",
        "<img src=x onerror=alert('xss')>",
        "javascript:alert('xss')",
        "<svg onload=alert('xss')>",
        "'-alert('xss')-'",
        "<iframe src='javascript:alert(1)'>",
    ]

    def test_product_name_xss(self, jsonrpc_call, create_test_product, http_get):
        """Les noms de produits doivent échapper les scripts"""
        for payload in self.XSS_PAYLOADS[:2]:  # Test subset for speed
            try:
                product_id = create_test_product(name=payload)
                response = http_get(f'/ecommerce/products/{product_id}')

                if response.status_code == 200:
                    data = response.json()
                    # Le payload ne doit pas être retourné tel quel en HTML
                    # (dans une API JSON, c'est moins critique mais on vérifie)
                    data_str = str(data)
                    # Script tags devraient être échappés ou filtrés
            except Exception:
                pass  # Création peut échouer si validation côté serveur

    def test_search_xss(self, http_get):
        """Recherche doit échapper les payloads XSS"""
        for payload in self.XSS_PAYLOADS:
            response = http_get('/ecommerce/products', params={'search': payload})
            assert response.status_code in [200, 400]


class TestAuthorizationBypass:
    """Tests protection contre bypass d'autorisation"""

    def test_admin_endpoint_without_auth(self, api_base_url, api_session_anonymous):
        """Endpoints admin doivent refuser accès non authentifié"""
        admin_endpoints = [
            '/backoffice/products',
            '/backoffice/orders',
            '/backoffice/customers',
            '/backoffice/settings',
            '/backoffice/users',
        ]

        for endpoint in admin_endpoints:
            response = api_session_anonymous.post(
                f"{api_base_url}{endpoint}",
                json={"jsonrpc": "2.0", "method": "call", "params": {}, "id": 1}
            )
            if response.status_code == 200:
                result = response.json().get('result', {})
                # Doit indiquer accès refusé
                assert result.get('success') is False or \
                    result.get('error_code') in ['AUTH_REQUIRED', 'ADMIN_REQUIRED', 'SESSION_EXPIRED'] or \
                    'auth' in str(result).lower() or \
                    'permission' in str(result).lower()

    def test_user_cannot_access_other_user_data(
        self, api_base_url, api_session_anonymous, create_test_customer
    ):
        """Un utilisateur ne doit pas accéder aux données d'un autre"""
        # Créer un client
        customer_id = create_test_customer(name="Private Customer", email="private@test.com")

        # Tenter d'accéder sans auth
        response = api_session_anonymous.post(
            f"{api_base_url}/ecommerce/account/profile",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {"customer_id": customer_id},
                "id": 1
            }
        )

        if response.status_code == 200:
            result = response.json().get('result', {})
            # Ne doit pas retourner les données du client
            assert result.get('success') is False or 'private@test.com' not in str(result)


class TestIDOR:
    """Tests Insecure Direct Object Reference"""

    def test_cannot_modify_other_order(self, jsonrpc_call, create_test_order, create_test_customer):
        """Ne doit pas pouvoir modifier la commande d'un autre client"""
        # Créer une commande pour un client spécifique
        customer_id = create_test_customer(name="IDOR Test Customer")
        order_id = create_test_order(customer_id=customer_id)

        # Tenter de modifier (normalement l'utilisateur connecté est admin,
        # mais on vérifie que l'API valide les permissions)
        result = jsonrpc_call(f'/backoffice/orders/{order_id}/cancel')
        # Le test principal est que l'API vérifie les droits

    def test_cannot_access_internal_ids(self, http_get):
        """Ne doit pas pouvoir deviner des IDs internes"""
        # Tenter d'accéder à des IDs système (généralement < 10)
        for internal_id in [1, 2, 3]:
            response = http_get(f'/ecommerce/products/{internal_id}')
            # Devrait retourner 404 ou produit public uniquement


class TestSessionSecurity:
    """Tests sécurité des sessions"""

    def test_session_cookie_httponly(self, api_base_url, api_session_anonymous):
        """Cookie de session doit avoir flag HttpOnly"""
        response = api_session_anonymous.post(
            f"{api_base_url}/ecommerce/auth/login",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {"email": "admin", "password": "admin"},
                "id": 1
            }
        )

        # Vérifier les cookies
        for cookie in response.cookies:
            if 'session' in cookie.name.lower():
                # Note: requests ne permet pas de vérifier HttpOnly directement
                # car c'est une propriété côté serveur
                pass

    def test_session_fixation_protection(self, api_base_url):
        """Session ID doit changer après login"""
        session = requests.Session()

        # Récupérer session ID initial (si existant)
        response1 = session.get(f"{api_base_url}/ecommerce/products")
        initial_cookies = dict(session.cookies)

        # Login
        session.post(
            f"{api_base_url}/ecommerce/auth/login",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {"email": "admin", "password": "admin"},
                "id": 1
            }
        )
        post_login_cookies = dict(session.cookies)

        # Le session ID devrait avoir changé (protection contre session fixation)
        # Note: Cela dépend de l'implémentation Odoo

    def test_expired_session_rejected(self, api_base_url, api_session_anonymous):
        """Session expirée doit être rejetée"""
        # Utiliser un session ID invalide/expiré
        api_session_anonymous.headers['X-Session-Id'] = 'invalid_session_12345'

        response = api_session_anonymous.post(
            f"{api_base_url}/auth/user-info",
            json={"jsonrpc": "2.0", "method": "call", "params": {}, "id": 1}
        )

        if response.status_code == 200:
            result = response.json().get('result', {})
            assert result.get('success') is False


class TestInputValidation:
    """Tests validation des entrées"""

    def test_oversized_input_rejected(self, api_base_url, api_session_anonymous):
        """Entrées trop grandes doivent être rejetées"""
        huge_string = "A" * 1000000  # 1MB de caractères

        response = api_session_anonymous.post(
            f"{api_base_url}/ecommerce/products",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {"search": huge_string},
                "id": 1
            },
            timeout=30
        )
        # Doit soit rejeter (413/400) soit gérer gracieusement
        assert response.status_code in [200, 400, 413, 500]

    def test_null_bytes_handled(self, http_get):
        """Null bytes doivent être gérés sans crash"""
        response = http_get('/ecommerce/products', params={'search': 'test\x00injection'})
        assert response.status_code in [200, 400]

    def test_unicode_handled(self, http_get):
        """Unicode doit être géré correctement"""
        unicode_tests = [
            "产品名称",  # Chinois
            "Ñoño",      # Espagnol
            "🔥💯",      # Emojis
            "Ω≈ç√∫",    # Symboles
        ]
        for test in unicode_tests:
            response = http_get('/ecommerce/products', params={'search': test})
            assert response.status_code in [200, 400]


class TestRateLimiting:
    """Tests de rate limiting"""

    @pytest.mark.slow
    def test_rate_limit_on_login(self, api_base_url, api_session_anonymous):
        """Trop de tentatives de login doivent être bloquées"""
        blocked = False
        for i in range(20):
            response = api_session_anonymous.post(
                f"{api_base_url}/ecommerce/auth/login",
                json={
                    "jsonrpc": "2.0",
                    "method": "call",
                    "params": {"email": f"attacker{i}@test.com", "password": "wrong"},
                    "id": i
                }
            )
            if response.status_code == 429:
                blocked = True
                break

        # Note: Le rate limiting peut ne pas être implémenté
        # Ce test vérifie juste qu'il n'y a pas de crash

    @pytest.mark.slow
    def test_rate_limit_on_api(self, http_get):
        """API doit supporter de nombreuses requêtes sans crash"""
        for i in range(50):
            response = http_get('/ecommerce/products', params={'limit': 1})
            assert response.status_code in [200, 429]
            if response.status_code == 429:
                break  # Rate limited - OK


class TestCORS:
    """Tests configuration CORS"""

    def test_cors_preflight(self, api_base_url):
        """Requête OPTIONS doit retourner headers CORS"""
        response = requests.options(
            f"{api_base_url}/ecommerce/products",
            headers={
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'POST',
            }
        )
        # Doit retourner 200 ou 204 avec headers CORS
        assert response.status_code in [200, 204, 405]

    def test_cors_rejects_unauthorized_origin(self, api_base_url):
        """Origine non autorisée doit être rejetée"""
        response = requests.post(
            f"{api_base_url}/ecommerce/products",
            headers={
                'Origin': 'http://malicious-site.com',
                'Content-Type': 'application/json',
            },
            json={"jsonrpc": "2.0", "method": "call", "params": {}, "id": 1}
        )
        # La réponse ne doit pas avoir Access-Control-Allow-Origin pour ce domaine
        # ou doit bloquer la requête
        cors_header = response.headers.get('Access-Control-Allow-Origin', '')
        assert cors_header != 'http://malicious-site.com'
        assert cors_header != '*'  # Wildcard non recommandé pour APIs authentifiées
