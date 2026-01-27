# -*- coding: utf-8 -*-
"""
Controller d'authentification SSO pour le backoffice
"""
import logging
import os
from werkzeug.utils import redirect as werkzeug_redirect
from odoo import http
from odoo.http import request
from odoo.addons.web.controllers.home import Home
from ..config import get_cors_headers

_logger = logging.getLogger(__name__)

# URL de login frontend (configurable via env)
FRONTEND_LOGIN_URL = os.environ.get('FRONTEND_LOGIN_URL', 'http://localhost:3000/superadmin/login')


class AuthController(http.Controller):
    """Authentification SSO pour accès backoffice depuis le frontend"""

    @http.route('/api/auth/passkey/start', type='http', auth='none', methods=['POST', 'OPTIONS'], csrf=False)
    def passkey_start(self, **kwargs):
        """
        Endpoint CORS-enabled pour démarrer l'authentification passkey.
        """
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        # Handle preflight
        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        try:
            # Start passkey auth
            auth_options = request.env['auth.passkey.key'].sudo()._start_auth()

            import json
            response = request.make_response(
                json.dumps({'success': True, 'options': auth_options}),
                headers=[('Content-Type', 'application/json')] + list(cors_headers.items())
            )
            return response

        except Exception as e:
            import json
            _logger.error(f"Passkey start error: {e}")
            response = request.make_response(
                json.dumps({'success': False, 'error': str(e)}),
                headers=[('Content-Type', 'application/json')] + list(cors_headers.items())
            )
            response.status_code = 400
            return response

    @http.route('/api/auth/sso-login', type='json', auth='none', methods=['POST', 'OPTIONS'], csrf=False)
    def sso_login(self, **kwargs):
        """
        Authentification SSO - valide les credentials et crée une session Odoo.

        Returns:
            dict: {success: bool, redirect_url: str} ou {error: str}
        """
        # Handle CORS preflight
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=cors_headers)

        try:
            params = request.jsonrequest
            login = params.get('login', '').strip()
            password = params.get('password', '')
            db = params.get('db') or request.db

            if not login or not password:
                return {'success': False, 'error': 'Login et mot de passe requis'}

            # Authenticate user
            uid = request.session.authenticate(db, login, password)

            if not uid:
                return {'success': False, 'error': 'Identifiants invalides'}

            # Get session info
            session_id = request.session.sid

            _logger.info(f"SSO login successful for user {login} (uid={uid})")

            return {
                'success': True,
                'uid': uid,
                'session_id': session_id,
                'redirect_url': '/web'
            }

        except Exception as e:
            _logger.error(f"SSO login error: {e}")
            return {'success': False, 'error': 'Erreur de connexion'}

    @http.route('/api/auth/user-info', type='json', auth='user', methods=['POST'], csrf=False)
    def get_user_info(self, **kwargs):
        """
        Récupère les informations de l'utilisateur connecté incluant ses groupes de sécurité.

        Returns:
            dict: {
                success: bool,
                user: {
                    id: int,
                    name: str,
                    email: str,
                    login: str,
                    groups: [str] - Liste des noms de groupes (ex: ['Quelyos Stock User', ...])
                }
            }
        """
        try:
            user = request.env.user

            # Récupérer uniquement les groupes Quelyos
            quelyos_groups = user.groups_id.filtered(lambda g: 'Quelyos' in g.name)

            return {
                'success': True,
                'user': {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email or '',
                    'login': user.login,
                    'groups': quelyos_groups.mapped('name'),
                }
            }
        except Exception as e:
            _logger.error(f"Get user info error: {e}")
            return {'success': False, 'error': 'Erreur lors de la récupération des informations utilisateur'}

    @http.route('/api/auth/sso-redirect', type='http', auth='none', methods=['GET', 'POST'], csrf=False)
    def sso_redirect(self, **kwargs):
        """
        Endpoint de redirection SSO - authentifie et redirige vers Odoo /web.
        Appelé directement par le navigateur (form submit ou redirect).
        """
        login = kwargs.get('login', '').strip()
        password = kwargs.get('password', '')
        db = kwargs.get('db') or request.db
        redirect_url = kwargs.get('redirect', '/web')
        logout_redirect = kwargs.get('logout_redirect', FRONTEND_LOGIN_URL)

        if not login or not password:
            return request.redirect(f'{logout_redirect}?error=missing_credentials')

        try:
            # Odoo 19: authenticate takes env and credential dict
            from odoo.addons.web.controllers.home import ensure_db
            ensure_db()

            # Initialize env for authentication
            if request.env.uid is None:
                request.env["ir.http"]._auth_method_public()

            credential = {
                'login': login,
                'password': password,
                'db': db,
                'type': 'password',
            }

            auth_info = request.session.authenticate(request.env, credential)

            if not auth_info or not auth_info.get('uid'):
                return request.redirect(f'{logout_redirect}?error=invalid_credentials')

            # Store logout redirect URL in session
            request.session['logout_redirect'] = logout_redirect

            _logger.info(f"SSO redirect login successful for user {login} (uid={auth_info['uid']})")
            return request.redirect(redirect_url)

        except Exception as e:
            _logger.error(f"SSO redirect error: {e}")
            return request.redirect(f'{logout_redirect}?error=server_error')

    @http.route('/auth/passkey-page', type='http', auth='none', methods=['GET'], csrf=False)
    def passkey_page(self, redirect=None, **kwargs):
        """
        Page de login Passkey hébergée sur Odoo (même origine que l'enregistrement).
        """
        redirect_url = redirect or '/web'

        html = f'''<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connexion Passkey - Quelyos</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }}
        .container {{
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid rgba(139, 92, 246, 0.3);
            border-radius: 16px;
            padding: 48px;
            text-align: center;
            max-width: 400px;
            width: 90%;
        }}
        .icon {{
            width: 64px;
            height: 64px;
            margin: 0 auto 24px;
            background: linear-gradient(135deg, #7c3aed, #4f46e5);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        }}
        .icon svg {{ width: 32px; height: 32px; color: white; }}
        h1 {{ color: white; font-size: 24px; margin-bottom: 12px; }}
        p {{ color: #94a3b8; margin-bottom: 32px; }}
        .btn {{
            width: 100%;
            padding: 16px 24px;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }}
        .btn-primary {{
            background: linear-gradient(135deg, #7c3aed, #4f46e5);
            color: white;
        }}
        .btn-primary:hover {{ transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124, 58, 237, 0.4); }}
        .btn-primary:disabled {{ opacity: 0.5; cursor: not-allowed; transform: none; }}
        .btn-secondary {{
            background: transparent;
            border: 1px solid rgba(148, 163, 184, 0.3);
            color: #94a3b8;
            margin-top: 16px;
        }}
        .btn-secondary:hover {{ border-color: rgba(148, 163, 184, 0.5); color: white; }}
        .error {{
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #fca5a5;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 24px;
            display: none;
        }}
        .spinner {{
            width: 20px;
            height: 20px;
            border: 2px solid transparent;
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }}
        @keyframes spin {{ to {{ transform: rotate(360deg); }} }}
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"/>
            </svg>
        </div>
        <h1>Connexion Passkey</h1>
        <p>Utilisez votre empreinte, Face ID ou clé de sécurité</p>

        <div class="error" id="error"></div>

        <button class="btn btn-primary" id="passkeyBtn" onclick="startPasskey()">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"/>
            </svg>
            <span>Authentification Passkey</span>
        </button>

        <a href="{FRONTEND_LOGIN_URL}" class="btn btn-secondary">
            Retour au login classique
        </a>
    </div>

    <script>
        const redirectUrl = '{redirect_url}';

        async function startPasskey() {{
            const btn = document.getElementById('passkeyBtn');
            const errorDiv = document.getElementById('error');

            btn.disabled = true;
            btn.innerHTML = '<div class="spinner"></div><span>Authentification...</span>';
            errorDiv.style.display = 'none';

            try {{
                // 1. Get options from Odoo
                const optRes = await fetch('/auth/passkey/start-auth', {{
                    method: 'POST',
                    headers: {{ 'Content-Type': 'application/json' }},
                    body: JSON.stringify({{ jsonrpc: '2.0', method: 'call', params: {{}}, id: 1 }})
                }});
                const optData = await optRes.json();

                if (optData.error || !optData.result) {{
                    throw new Error('Aucun passkey enregistré');
                }}

                const options = optData.result;

                // Convert base64url to ArrayBuffer
                const b64ToBuffer = (b64) => {{
                    const binary = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                    return bytes.buffer;
                }};

                // 2. Get credential
                const credential = await navigator.credentials.get({{
                    publicKey: {{
                        challenge: b64ToBuffer(options.challenge),
                        timeout: options.timeout || 60000,
                        rpId: options.rpId || location.hostname,
                        allowCredentials: options.allowCredentials?.map(c => ({{
                            id: b64ToBuffer(c.id),
                            type: c.type
                        }})),
                        userVerification: options.userVerification || 'preferred'
                    }}
                }});

                if (!credential) throw new Error('Authentification annulée');

                // Convert to base64url
                const bufferToB64 = (buf) => {{
                    const bytes = new Uint8Array(buf);
                    let binary = '';
                    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
                    return btoa(binary).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
                }};

                const response = credential.response;
                const webauthnResponse = JSON.stringify({{
                    id: credential.id,
                    rawId: bufferToB64(credential.rawId),
                    type: credential.type,
                    response: {{
                        clientDataJSON: bufferToB64(response.clientDataJSON),
                        authenticatorData: bufferToB64(response.authenticatorData),
                        signature: bufferToB64(response.signature),
                        userHandle: response.userHandle ? bufferToB64(response.userHandle) : null
                    }}
                }});

                // 3. Submit to Odoo
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = '/api/auth/passkey-login';

                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'webauthn_response';
                input.value = webauthnResponse;
                form.appendChild(input);

                const redirInput = document.createElement('input');
                redirInput.type = 'hidden';
                redirInput.name = 'redirect';
                redirInput.value = redirectUrl;
                form.appendChild(redirInput);

                document.body.appendChild(form);
                form.submit();

            }} catch (err) {{
                console.error('Passkey error:', err);
                errorDiv.textContent = err.message || 'Erreur d\\'authentification';
                errorDiv.style.display = 'block';
                btn.disabled = false;
                btn.innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"/></svg><span>Réessayer</span>';
            }}
        }}

        // Auto-start if passkey supported
        if (window.PublicKeyCredential) {{
            // Small delay for page to render
            setTimeout(startPasskey, 500);
        }}
    </script>
</body>
</html>'''

        return request.make_response(html, headers=[('Content-Type', 'text/html')])

    @http.route('/api/auth/passkey-login', type='http', auth='none', methods=['POST'], csrf=False)
    def passkey_login(self, **kwargs):
        """
        Endpoint SSO pour authentification Passkey.
        Évite les conflits avec le module website.
        """
        webauthn_response = kwargs.get('webauthn_response')
        redirect_url = kwargs.get('redirect', '/web')

        if not webauthn_response:
            return werkzeug_redirect(f'{FRONTEND_LOGIN_URL}?error=missing_passkey', code=302)

        try:
            import json
            from odoo.addons.web.controllers.home import ensure_db
            ensure_db()

            # Initialize env
            if request.env.uid is None:
                request.env["ir.http"]._auth_method_public()

            credential = {
                'type': 'webauthn',
                'webauthn_response': webauthn_response,
            }

            auth_info = request.session.authenticate(request.env, credential)

            if not auth_info or not auth_info.get('uid'):
                _logger.warning("Passkey authentication failed")
                return werkzeug_redirect(f'{FRONTEND_LOGIN_URL}?error=passkey_failed', code=302)

            _logger.info(f"Passkey login successful (uid={auth_info['uid']})")
            return werkzeug_redirect(redirect_url, code=302)

        except Exception as e:
            _logger.error(f"Passkey login error: {e}")
            return werkzeug_redirect(f'{FRONTEND_LOGIN_URL}?error=passkey_error', code=302)


class HomeOverride(Home):
    """Override du controller Home pour bloquer l'accès direct à /web/login"""

    @http.route('/web/login', type='http', auth='none', methods=['GET', 'POST'], csrf=False)
    def web_login(self, redirect=None, **kw):
        """
        Override de /web/login - redirige vers le frontend si non authentifié.
        Seuls les utilisateurs déjà authentifiés peuvent accéder à cette page.
        """
        # Si l'utilisateur est déjà authentifié, laisser passer
        if request.session.uid:
            return super().web_login(redirect=redirect, **kw)

        # Si c'est une requête POST, vérifier si c'est un login valide
        if request.httprequest.method == 'POST':
            # Autoriser les requêtes avec webauthn_response (Passkey)
            if kw.get('webauthn_response'):
                _logger.info("Passkey authentication attempt")
                return super().web_login(redirect=redirect, **kw)
            # Vérifier si ça vient de notre endpoint SSO (referer)
            referer = request.httprequest.headers.get('Referer', '')
            if '/api/auth/sso-redirect' in referer or 'localhost:3000' in referer:
                return super().web_login(redirect=redirect, **kw)

        # Sinon, rediriger vers le frontend login (URL externe absolue)
        _logger.info(f"Blocked direct access to /web/login, redirecting to {FRONTEND_LOGIN_URL}")
        return werkzeug_redirect(FRONTEND_LOGIN_URL, code=302)

    @http.route(['/web', '/odoo', '/odoo/<path:subpath>'], type='http', auth='none')
    def web_client(self, s_action=None, **kw):
        """
        Override de /web et /odoo - redirige vers le frontend si non authentifié.
        """
        if not request.session.uid:
            return werkzeug_redirect(FRONTEND_LOGIN_URL, code=302)
        return super().web_client(s_action=s_action, **kw)

    @http.route('/', type='http', auth='none', sitemap=False)
    def index(self, **kw):
        """
        Override de / - redirige vers le frontend si non authentifié.
        """
        if not request.session.uid:
            return werkzeug_redirect(FRONTEND_LOGIN_URL, code=302)
        # Si authentifié, rediriger vers /web
        return werkzeug_redirect('/web', code=302)

    @http.route(['/web/database/selector', '/web/database/manager', '/web/database/<path:subpath>'], type='http', auth='none', csrf=False)
    def block_database_manager(self, **kw):
        """
        Bloque l'accès aux pages de gestion de base de données.
        """
        _logger.warning(f"Blocked access to database manager from {request.httprequest.remote_addr}")
        return werkzeug_redirect(FRONTEND_LOGIN_URL, code=302)

    @http.route('/web/session/logout', type='http', auth='none')
    def logout(self, redirect=None, **kw):
        """
        Override de /web/session/logout - déconnecte et redirige vers la bonne page de login.
        Utilise logout_redirect stocké en session ou FRONTEND_LOGIN_URL par défaut.
        """
        # Get logout redirect before clearing session
        logout_url = request.session.get('logout_redirect', FRONTEND_LOGIN_URL)
        request.session.logout(keep_db=True)
        _logger.info(f"User logged out, redirecting to {logout_url}")
        return werkzeug_redirect(logout_url, code=302)

    @http.route('/robots.txt', type='http', auth='public', sitemap=False)
    def robots_txt_override(self, **kw):
        """
        Robots.txt - bloque l'indexation de /web et /web/login
        Override avec priorité plus haute
        """
        content = """User-agent: *
Disallow: /web
Disallow: /web/login
Disallow: /web/session
Disallow: /api/
Disallow: /xmlrpc
Disallow: /jsonrpc

# Only allow public pages
Allow: /
"""
        return request.make_response(
            content,
            headers=[('Content-Type', 'text/plain; charset=utf-8')]
        )
