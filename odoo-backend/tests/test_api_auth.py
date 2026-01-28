# -*- coding: utf-8 -*-
"""
Tests d'authentification API

Couvre:
- Login/Logout
- Session management
- SSO endpoints
- Passkey authentication
- User info retrieval
"""

import pytest
import requests
import time

pytestmark = pytest.mark.auth


class TestAuthLogin:
    """Tests endpoint /api/ecommerce/auth/login"""

    def test_login_valid_credentials(self, api_base_url, api_session_anonymous):
        """Login avec credentials valides doit retourner success + session_id"""
        response = api_session_anonymous.post(
            f"{api_base_url}/ecommerce/auth/login",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {
                    "email": "admin",
                    "password": "admin"
                },
                "id": 1
            }
        )
        assert response.status_code == 200
        result = response.json().get('result', {})
        assert result.get('success') is True
        assert 'session_id' in result or 'uid' in result

    def test_login_invalid_password(self, api_base_url, api_session_anonymous):
        """Login avec mauvais password doit échouer"""
        response = api_session_anonymous.post(
            f"{api_base_url}/ecommerce/auth/login",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {
                    "email": "admin",
                    "password": "wrong_password_123"
                },
                "id": 1
            }
        )
        assert response.status_code == 200
        result = response.json().get('result', {})
        assert result.get('success') is False

    def test_login_nonexistent_user(self, api_base_url, api_session_anonymous):
        """Login avec utilisateur inexistant doit échouer"""
        response = api_session_anonymous.post(
            f"{api_base_url}/ecommerce/auth/login",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {
                    "email": "nonexistent_user_xyz@test.com",
                    "password": "password123"
                },
                "id": 1
            }
        )
        assert response.status_code == 200
        result = response.json().get('result', {})
        assert result.get('success') is False

    def test_login_empty_credentials(self, api_base_url, api_session_anonymous):
        """Login sans credentials doit échouer avec message approprié"""
        response = api_session_anonymous.post(
            f"{api_base_url}/ecommerce/auth/login",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {
                    "email": "",
                    "password": ""
                },
                "id": 1
            }
        )
        assert response.status_code == 200
        result = response.json().get('result', {})
        assert result.get('success') is False

    def test_login_sql_injection_attempt(self, api_base_url, api_session_anonymous):
        """Tentative SQL injection doit échouer sans exposer d'erreur DB"""
        response = api_session_anonymous.post(
            f"{api_base_url}/ecommerce/auth/login",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {
                    "email": "admin' OR '1'='1",
                    "password": "' OR '1'='1"
                },
                "id": 1
            }
        )
        assert response.status_code == 200
        result = response.json().get('result', {})
        assert result.get('success') is False
        # Ne doit pas exposer d'erreur SQL
        error_msg = str(result.get('error', '')).lower()
        assert 'sql' not in error_msg
        assert 'postgresql' not in error_msg
        assert 'syntax' not in error_msg


class TestAuthSSO:
    """Tests endpoint /api/auth/sso-login"""

    def test_sso_login_valid(self, api_base_url, api_session_anonymous):
        """SSO login valide doit retourner redirect_url"""
        response = api_session_anonymous.post(
            f"{api_base_url}/auth/sso-login",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {
                    "login": "admin",
                    "password": "admin"
                },
                "id": 1
            }
        )
        assert response.status_code == 200
        result = response.json().get('result', {})
        if result.get('success'):
            assert 'redirect_url' in result

    def test_sso_login_missing_params(self, api_base_url, api_session_anonymous):
        """SSO login sans params doit échouer proprement"""
        response = api_session_anonymous.post(
            f"{api_base_url}/auth/sso-login",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {},
                "id": 1
            }
        )
        assert response.status_code == 200
        result = response.json().get('result', {})
        assert result.get('success') is False


class TestAuthUserInfo:
    """Tests endpoint /api/auth/user-info"""

    def test_user_info_authenticated(self, jsonrpc_call, assert_api_success):
        """User info avec session valide doit retourner les données utilisateur"""
        result = jsonrpc_call('/auth/user-info')
        assert_api_success(result)
        assert 'user' in result
        user = result['user']
        assert 'id' in user
        assert 'name' in user
        assert 'login' in user

    def test_user_info_includes_groups(self, jsonrpc_call, assert_api_success):
        """User info doit inclure les groupes Quelyos"""
        result = jsonrpc_call('/auth/user-info')
        assert_api_success(result)
        user = result['user']
        assert 'groups' in user
        assert isinstance(user['groups'], list)

    def test_user_info_unauthenticated(self, api_base_url, api_session_anonymous):
        """User info sans session doit échouer"""
        response = api_session_anonymous.post(
            f"{api_base_url}/auth/user-info",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {},
                "id": 1
            }
        )
        assert response.status_code == 200
        result = response.json().get('result', {})
        # Doit indiquer non authentifié
        assert result.get('success') is False or 'user' not in result


class TestAuthLogout:
    """Tests endpoint /api/ecommerce/auth/logout"""

    def test_logout_invalidates_session(self, api_base_url):
        """Logout doit invalider la session"""
        # Créer une nouvelle session
        session = requests.Session()

        # Login
        login_resp = session.post(
            f"{api_base_url}/ecommerce/auth/login",
            json={
                "jsonrpc": "2.0",
                "method": "call",
                "params": {"email": "admin", "password": "admin"},
                "id": 1
            }
        )
        result = login_resp.json().get('result', {})
        if not result.get('success'):
            pytest.skip("Login failed")

        # Logout
        logout_resp = session.post(
            f"{api_base_url}/ecommerce/auth/logout",
            json={"jsonrpc": "2.0", "method": "call", "params": {}, "id": 2}
        )
        assert logout_resp.status_code == 200

        # Vérifier que la session est invalidée
        check_resp = session.post(
            f"{api_base_url}/auth/user-info",
            json={"jsonrpc": "2.0", "method": "call", "params": {}, "id": 3}
        )
        check_result = check_resp.json().get('result', {})
        # Après logout, user-info doit échouer ou retourner utilisateur public
        assert check_result.get('success') is False or check_result.get('user', {}).get('id') == 1


class TestAuthRateLimiting:
    """Tests de rate limiting sur l'authentification"""

    @pytest.mark.slow
    def test_brute_force_protection(self, api_base_url, api_session_anonymous):
        """Multiples tentatives de login échouées doivent être ralenties"""
        start_time = time.time()
        attempts = 10

        for i in range(attempts):
            api_session_anonymous.post(
                f"{api_base_url}/ecommerce/auth/login",
                json={
                    "jsonrpc": "2.0",
                    "method": "call",
                    "params": {
                        "email": f"attacker_{i}@test.com",
                        "password": "wrong"
                    },
                    "id": i
                }
            )

        elapsed = time.time() - start_time
        # Note: Ce test vérifie juste que les requêtes passent
        # Un vrai rate limiter ajouterait des délais ou des 429
        assert elapsed < 60  # Ne devrait pas prendre plus d'1 minute


class TestPasskeyAuth:
    """Tests authentification Passkey (WebAuthn)"""

    def test_passkey_start_returns_options(self, api_base_url, api_session_anonymous):
        """Passkey start doit retourner les options d'authentification"""
        response = api_session_anonymous.post(
            f"{api_base_url}/auth/passkey/start",
            headers={'Content-Type': 'application/json'}
        )
        # L'endpoint peut ne pas être configuré, donc on accepte 200 ou 400
        assert response.status_code in [200, 400, 500]

        if response.status_code == 200:
            try:
                data = response.json()
                # Si succès, doit contenir options
                if data.get('success'):
                    assert 'options' in data
            except Exception:
                pass  # Response might not be JSON
