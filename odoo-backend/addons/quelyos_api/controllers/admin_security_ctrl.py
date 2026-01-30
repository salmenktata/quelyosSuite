# -*- coding: utf-8 -*-
import logging
import json
from datetime import datetime, timedelta
from odoo import http
from odoo.http import request
from .super_admin import SuperAdminController

_logger = logging.getLogger(__name__)


class AdminSecurityController(SuperAdminController):
    """Contrôleur super-admin pour la sécurité (CORS, WAF, sessions, API keys)"""

    @http.route('/api/super-admin/settings/cors', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_cors_entries(self):
        """Liste les entrées CORS whitelist"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            CorsEntry = request.env['quelyos.cors.entry'].sudo()
            entries = CorsEntry.search([], order='domain')

            ICP = request.env['ir.config_parameter'].sudo()
            allow_credentials = ICP.get_param('quelyos.cors.allow_credentials', 'true') == 'true'
            max_age = int(ICP.get_param('quelyos.cors.max_age', '3600'))

            data = {
                'success': True,
                'entries': [self._serialize_cors_entry(e) for e in entries],
                'allow_credentials': allow_credentials,
                'max_age_seconds': max_age,
            }
            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List CORS entries error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/settings/cors', type='http', auth='public', methods=['POST'], csrf=False)
    def add_cors_entry(self):
        """Ajoute un domaine à la whitelist CORS"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            data = json.loads(request.httprequest.data.decode('utf-8')) if request.httprequest.data else {}
            domain = data.get('domain', '').strip().lower()

            if not domain:
                return request.make_json_response(
                    {'success': False, 'error': 'Domaine requis'},
                    headers=cors_headers,
                    status=400
                )

            # Vérifier doublon
            CorsEntry = request.env['quelyos.cors.entry'].sudo()
            existing = CorsEntry.search([('domain', '=', domain)], limit=1)
            if existing:
                return request.make_json_response(
                    {'success': False, 'error': 'Domaine déjà configuré'},
                    headers=cors_headers,
                    status=409
                )

            entry = CorsEntry.create({
                'domain': domain,
                'is_active': True,
                'created_by': request.env.user.login,
            })

            _logger.info(
                f"[AUDIT] CORS entry added - User: {request.env.user.login} | "
                f"Domain: {domain}"
            )

            return request.make_json_response({
                'success': True,
                'entry': self._serialize_cors_entry(entry)
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Add CORS entry error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/settings/cors/<int:entry_id>', type='http', auth='public', methods=['PATCH', 'OPTIONS'], csrf=False)
    def update_cors_entry(self, entry_id):
        """Met à jour une entrée CORS (toggle active)"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            data = json.loads(request.httprequest.data.decode('utf-8')) if request.httprequest.data else {}

            CorsEntry = request.env['quelyos.cors.entry'].sudo()
            entry = CorsEntry.browse(entry_id)

            if not entry.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Entrée non trouvée'},
                    headers=cors_headers,
                    status=404
                )

            if 'is_active' in data:
                entry.is_active = data['is_active']
                _logger.info(
                    f"[AUDIT] CORS entry toggled - User: {request.env.user.login} | "
                    f"Domain: {entry.domain} | Active: {entry.is_active}"
                )

            return request.make_json_response({
                'success': True,
                'entry': self._serialize_cors_entry(entry)
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Update CORS entry error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/settings/cors/<int:entry_id>', type='http', auth='public', methods=['DELETE'], csrf=False)
    def delete_cors_entry(self, entry_id):
        """Supprime une entrée CORS"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            CorsEntry = request.env['quelyos.cors.entry'].sudo()
            entry = CorsEntry.browse(entry_id)

            if not entry.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Entrée non trouvée'},
                    headers=cors_headers,
                    status=404
                )

            domain = entry.domain
            entry.unlink()

            _logger.info(
                f"[AUDIT] CORS entry deleted - User: {request.env.user.login} | "
                f"Domain: {domain}"
            )

            return request.make_json_response({
                'success': True,
                'message': 'Domaine supprimé'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Delete CORS entry error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    def _serialize_cors_entry(self, entry):
        """Sérialise une entrée CORS pour l'API"""
        return {
            'id': entry.id,
            'domain': entry.domain,
            'tenant_id': entry.tenant_id.id if entry.tenant_id else None,
            'tenant_name': entry.tenant_id.name if entry.tenant_id else None,
            'created_at': entry.create_date.isoformat() if entry.create_date else None,
            'created_by': entry.created_by,
            'is_active': entry.is_active,
        }

    @http.route('/api/super-admin/sessions', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_sessions(self, user_id=None):
        """Liste les sessions actives (toutes ou par utilisateur)"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            AdminSession = request.env['quelyos.admin.session'].sudo()
            domain = [('is_active', '=', True)]
            if user_id:
                domain.append(('user_id', '=', int(user_id)))

            sessions = AdminSession.search(domain, order='last_activity desc', limit=100)

            data = [{
                'id': s.id,
                'user_id': s.user_id.id,
                'user_name': s.user_id.name,
                'user_login': s.user_id.login,
                'ip_address': s.ip_address,
                'device_info': s.device_info,
                'location': s.location or 'Unknown',
                'created_at': s.created_at.isoformat() if s.created_at else None,
                'last_activity': s.last_activity.isoformat() if s.last_activity else None,
                'is_current': s.user_id.id == request.env.user.id,
            } for s in sessions]

            return request.make_json_response({
                'success': True,
                'data': data,
                'total': len(data)
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List sessions error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/sessions/<int:session_id>/revoke', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def revoke_session(self, session_id):
        """Révoque une session spécifique"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            AdminSession = request.env['quelyos.admin.session'].sudo()
            session = AdminSession.browse(session_id)

            if not session.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Session non trouvée'},
                    headers=cors_headers, status=404
                )

            session.revoke(revoked_by_id=request.env.user.id, reason='Revoked by super admin')

            _logger.info(f"[AUDIT] Session revoked by {request.env.user.login}: {session_id}")

            return request.make_json_response({
                'success': True,
                'message': 'Session révoquée'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Revoke session error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/sessions/revoke-user/<int:target_user_id>', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def revoke_user_sessions(self, target_user_id):
        """Révoque toutes les sessions d'un utilisateur"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            AdminSession = request.env['quelyos.admin.session'].sudo()
            sessions = AdminSession.search([
                ('user_id', '=', target_user_id),
                ('is_active', '=', True)
            ])

            count = len(sessions)
            sessions.revoke(revoked_by_id=request.env.user.id, reason='All sessions revoked by super admin')

            _logger.info(f"[AUDIT] {count} sessions revoked for user {target_user_id} by {request.env.user.login}")

            return request.make_json_response({
                'success': True,
                'message': f'{count} sessions révoquées',
                'count': count
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Revoke user sessions error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/ip-whitelist', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_ip_whitelist(self):
        """Liste les règles IP whitelist"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            IPWhitelist = request.env['quelyos.ip.whitelist'].sudo()
            rules = IPWhitelist.search([], order='sequence, id')

            data = [{
                'id': r.id,
                'name': r.name,
                'ip_address': r.ip_address,
                'ip_type': r.ip_type,
                'is_active': r.is_active,
                'sequence': r.sequence,
                'user_ids': [{'id': u.id, 'name': u.name} for u in r.user_ids],
                'valid_from': r.valid_from.isoformat() if r.valid_from else None,
                'valid_until': r.valid_until.isoformat() if r.valid_until else None,
                'notes': r.notes,
            } for r in rules]

            # Statut global
            status = IPWhitelist.get_whitelist_status()

            return request.make_json_response({
                'success': True,
                'data': data,
                'status': status,
                'current_ip': request.httprequest.remote_addr
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List IP whitelist error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/ip-whitelist', type='http', auth='public', methods=['POST'], csrf=False)
    def create_ip_whitelist(self):
        """Crée une règle IP whitelist"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            body = request.get_json_data() or {}
            name = body.get('name')
            ip_address = body.get('ip_address')

            if not name or not ip_address:
                return request.make_json_response(
                    {'success': False, 'error': 'Nom et adresse IP requis'},
                    headers=cors_headers, status=400
                )

            IPWhitelist = request.env['quelyos.ip.whitelist'].sudo()
            rule = IPWhitelist.create({
                'name': name,
                'ip_address': ip_address,
                'is_active': body.get('is_active', True),
                'notes': body.get('notes'),
                'sequence': body.get('sequence', 10),
            })

            _logger.info(f"[AUDIT] IP whitelist rule created by {request.env.user.login}: {ip_address}")

            return request.make_json_response({
                'success': True,
                'id': rule.id,
                'message': 'Règle créée'
            }, headers=cors_headers)

        except ValueError as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=400
            )

        except Exception as e:
            _logger.error(f"Create IP whitelist error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/ip-whitelist/<int:rule_id>', type='http', auth='public', methods=['DELETE', 'OPTIONS'], csrf=False)
    def delete_ip_whitelist(self, rule_id):
        """Supprime une règle IP whitelist"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            IPWhitelist = request.env['quelyos.ip.whitelist'].sudo()
            rule = IPWhitelist.browse(rule_id)

            if not rule.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Règle non trouvée'},
                    headers=cors_headers, status=404
                )

            ip_address = rule.ip_address
            rule.unlink()

            _logger.info(f"[AUDIT] IP whitelist rule deleted by {request.env.user.login}: {ip_address}")

            return request.make_json_response({
                'success': True,
                'message': 'Règle supprimée'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Delete IP whitelist error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/api-keys', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_api_keys(self):
        """Liste toutes les clés API"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            APIKey = request.env['quelyos.api.key'].sudo()
            keys = APIKey.search([], order='create_date desc')

            data = [{
                'id': k.id,
                'name': k.name,
                'key_prefix': k.key_prefix,
                'description': k.description,
                'user_id': k.user_id.id,
                'user_name': k.user_id.name,
                'tenant_id': k.tenant_id.id if k.tenant_id else None,
                'tenant_name': k.tenant_id.name if k.tenant_id else None,
                'scope': k.scope,
                'rate_limit': k.rate_limit,
                'is_active': k.is_active,
                'created_at': k.create_date.isoformat() if k.create_date else None,
                'expires_at': k.expires_at.isoformat() if k.expires_at else None,
                'last_used_at': k.last_used_at.isoformat() if k.last_used_at else None,
                'usage_count': k.usage_count,
            } for k in keys]

            return request.make_json_response({
                'success': True,
                'data': data,
                'total': len(data)
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List API keys error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/api-keys', type='http', auth='public', methods=['POST'], csrf=False)
    def create_api_key(self):
        """Crée une nouvelle clé API"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            body = request.get_json_data() or {}
            name = body.get('name')

            if not name:
                return request.make_json_response(
                    {'success': False, 'error': 'Nom requis'},
                    headers=cors_headers, status=400
                )

            APIKey = request.env['quelyos.api.key'].sudo()
            record, plain_key = APIKey.generate_key(
                name=name,
                user_id=body.get('user_id', request.env.user.id),
                scope=body.get('scope', 'read'),
                tenant_id=body.get('tenant_id'),
                expires_days=body.get('expires_days'),
                description=body.get('description'),
                rate_limit=body.get('rate_limit', 60),
                ip_restrictions=body.get('ip_restrictions'),
                allowed_endpoints=body.get('allowed_endpoints'),
            )

            _logger.info(f"[AUDIT] API key created by {request.env.user.login}: {record.key_prefix}...")

            return request.make_json_response({
                'success': True,
                'id': record.id,
                'key_prefix': record.key_prefix,
                'api_key': plain_key,  # IMPORTANT: retourné UNE SEULE FOIS
                'message': 'Clé API créée. Copiez-la maintenant, elle ne sera plus affichée!'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Create API key error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/api-keys/<int:key_id>/revoke', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def revoke_api_key(self, key_id):
        """Révoque une clé API"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            APIKey = request.env['quelyos.api.key'].sudo()
            key = APIKey.browse(key_id)

            if not key.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Clé non trouvée'},
                    headers=cors_headers, status=404
                )

            key.revoke()

            _logger.info(f"[AUDIT] API key revoked by {request.env.user.login}: {key.key_prefix}...")

            return request.make_json_response({
                'success': True,
                'message': 'Clé API révoquée'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Revoke API key error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/security/alerts', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_security_alerts(self, status=None, severity=None, limit=50):
        """Liste les alertes de sécurité"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            SecurityAlert = request.env['quelyos.security.alert'].sudo()
            alerts = SecurityAlert.get_recent_alerts(
                limit=int(limit),
                status=status,
                severity=severity
            )
            summary = SecurityAlert.get_alerts_summary(hours=24)

            return request.make_json_response({
                'success': True,
                'data': alerts,
                'summary': summary,
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List security alerts error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/security/alerts/<int:alert_id>/acknowledge', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def acknowledge_alert(self, alert_id):
        """Marque une alerte comme prise en compte"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            SecurityAlert = request.env['quelyos.security.alert'].sudo()
            alert = SecurityAlert.browse(alert_id)

            if not alert.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Alerte non trouvée'},
                    headers=cors_headers, status=404
                )

            alert.acknowledge()

            return request.make_json_response({
                'success': True,
                'message': 'Alerte prise en compte'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Acknowledge alert error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/security/alerts/<int:alert_id>/resolve', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def resolve_alert(self, alert_id):
        """Résout une alerte"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            body = request.get_json_data() or {}
            notes = body.get('notes')
            is_false_positive = body.get('is_false_positive', False)

            SecurityAlert = request.env['quelyos.security.alert'].sudo()
            alert = SecurityAlert.browse(alert_id)

            if not alert.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Alerte non trouvée'},
                    headers=cors_headers, status=404
                )

            alert.resolve(notes=notes, is_false_positive=is_false_positive)

            return request.make_json_response({
                'success': True,
                'message': 'Alerte résolue'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Resolve alert error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/security/summary', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def security_summary(self):
        """Résumé global de la sécurité"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            # Alertes
            SecurityAlert = request.env['quelyos.security.alert'].sudo()
            alerts_summary = SecurityAlert.get_alerts_summary(hours=24)

            # Sessions actives
            AdminSession = request.env['quelyos.admin.session'].sudo()
            active_sessions = AdminSession.search_count([('is_active', '=', True)])

            # IP Whitelist
            IPWhitelist = request.env['quelyos.ip.whitelist'].sudo()
            whitelist_status = IPWhitelist.get_whitelist_status()

            # API Keys
            APIKey = request.env['quelyos.api.key'].sudo()
            active_keys = APIKey.search_count([('is_active', '=', True)])
            keys_used_today = APIKey.search_count([
                ('is_active', '=', True),
                ('last_used_at', '>=', datetime.now().replace(hour=0, minute=0, second=0))
            ])

            return request.make_json_response({
                'success': True,
                'alerts': alerts_summary,
                'sessions': {
                    'active': active_sessions,
                },
                'ip_whitelist': whitelist_status,
                'api_keys': {
                    'active': active_keys,
                    'used_today': keys_used_today,
                },
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Security summary error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/security/rate-limits', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def rate_limits_list(self):
        """Liste des règles de rate limiting"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            RateLimitRule = request.env['quelyos.rate.limit.rule'].sudo()
            rules = RateLimitRule.search([], order='priority desc')

            return request.make_json_response({
                'success': True,
                'rules': [{
                    'id': rule.id,
                    'name': rule.name,
                    'active': rule.active,
                    'priority': rule.priority,
                    'target_type': rule.target_type,
                    'endpoint_pattern': rule.endpoint_pattern,
                    'requests_limit': rule.requests_limit,
                    'time_window': rule.time_window,
                    'burst_limit': rule.burst_limit,
                    'action_type': rule.action_type,
                    'block_duration': rule.block_duration,
                    'total_hits': rule.total_hits,
                    'total_blocks': rule.total_blocks,
                    'last_triggered': rule.last_triggered.isoformat() if rule.last_triggered else None,
                } for rule in rules]
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Rate limits list error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/security/rate-limits', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def rate_limits_create(self):
        """Créer une règle de rate limiting"""
        if not request.session.uid:
            return {'success': False, 'error': 'Non authentifié'}

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return {'success': False, 'error': str(e)}

        try:
            data = request.jsonrequest
            RateLimitRule = request.env['quelyos.rate.limit.rule'].sudo()

            rule = RateLimitRule.create({
                'name': data.get('name'),
                'active': data.get('active', True),
                'priority': data.get('priority', 10),
                'target_type': data.get('target_type', 'endpoint'),
                'endpoint_pattern': data.get('endpoint_pattern'),
                'ip_address': data.get('ip_address'),
                'requests_limit': data.get('requests_limit', 100),
                'time_window': data.get('time_window', 60),
                'burst_limit': data.get('burst_limit', 20),
                'action_type': data.get('action_type', 'block'),
                'block_duration': data.get('block_duration', 300),
            })

            return {'success': True, 'id': rule.id}

        except Exception as e:
            _logger.error(f"Rate limit create error: {e}")
            return {'success': False, 'error': str(e)}

    @http.route('/api/super-admin/security/rate-limits/<int:rule_id>', type='jsonrpc', auth='public', methods=['PUT', 'DELETE'], csrf=False)
    def rate_limits_update_delete(self, rule_id):
        """Modifier ou supprimer une règle de rate limiting"""
        if not request.session.uid:
            return {'success': False, 'error': 'Non authentifié'}

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return {'success': False, 'error': str(e)}

        try:
            RateLimitRule = request.env['quelyos.rate.limit.rule'].sudo()
            rule = RateLimitRule.browse(rule_id)

            if not rule.exists():
                return {'success': False, 'error': 'Règle non trouvée'}

            if request.httprequest.method == 'DELETE':
                rule.unlink()
                return {'success': True}

            # PUT - Update
            data = request.jsonrequest
            vals = {}
            for field in ['name', 'active', 'priority', 'target_type', 'endpoint_pattern',
                          'requests_limit', 'time_window', 'burst_limit', 'action_type', 'block_duration']:
                if field in data:
                    vals[field] = data[field]

            if vals:
                rule.write(vals)

            return {'success': True}

        except Exception as e:
            _logger.error(f"Rate limit update/delete error: {e}")
            return {'success': False, 'error': str(e)}

    @http.route('/api/super-admin/audit-logs', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def audit_logs_list(self):
        """Liste des logs d'audit avec filtres et pagination"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            params = request.httprequest.args
            filters = {
                'user_id': params.get('user_id'),
                'category': params.get('category'),
                'severity': params.get('severity'),
                'success': params.get('success') == 'true' if params.get('success') else None,
                'date_from': params.get('date_from'),
                'date_to': params.get('date_to'),
                'search': params.get('search'),
                'ip_address': params.get('ip_address'),
                'resource_type': params.get('resource_type'),
            }
            # Nettoyer les None
            filters = {k: v for k, v in filters.items() if v is not None}

            offset = int(params.get('offset', 0))
            limit = min(int(params.get('limit', 50)), 200)

            AuditLog = request.env['quelyos.audit.log'].sudo()
            result = AuditLog.search_logs(filters=filters, offset=offset, limit=limit)

            return request.make_json_response({
                'success': True,
                **result
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Audit logs list error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/audit-logs/export', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def audit_logs_export(self):
        """Export des logs d'audit en CSV"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            params = request.httprequest.args
            filters = {
                'user_id': params.get('user_id'),
                'category': params.get('category'),
                'severity': params.get('severity'),
                'date_from': params.get('date_from'),
                'date_to': params.get('date_to'),
            }
            filters = {k: v for k, v in filters.items() if v is not None}

            AuditLog = request.env['quelyos.audit.log'].sudo()
            csv_content = AuditLog.export_csv(filters=filters)

            response = request.make_response(
                csv_content,
                headers={
                    **cors_headers,
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': f'attachment; filename=audit_logs_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv',
                }
            )
            return response

        except Exception as e:
            _logger.error(f"Audit logs export error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/audit-logs/stats', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def audit_logs_stats(self):
        """Statistiques des logs d'audit"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            days = int(request.httprequest.args.get('days', 7))
            AuditLog = request.env['quelyos.audit.log'].sudo()
            stats = AuditLog.get_statistics(days=days)

            return request.make_json_response({
                'success': True,
                **stats
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Audit logs stats error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/security/waf-rules', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def waf_rules_list(self):
        """Liste des règles WAF"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            WAFRule = request.env['quelyos.waf.rule'].sudo()
            rules = WAFRule.get_all_rules()

            return request.make_json_response({
                'success': True,
                'rules': rules
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"WAF rules list error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/security/waf-rules', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def waf_rules_create(self):
        """Créer une règle WAF"""
        if not request.session.uid:
            return {'success': False, 'error': 'Non authentifié'}

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return {'success': False, 'error': str(e)}

        try:
            data = request.jsonrequest
            WAFRule = request.env['quelyos.waf.rule'].sudo()

            rule = WAFRule.create({
                'name': data.get('name'),
                'active': data.get('active', True),
                'priority': data.get('priority', 10),
                'rule_type': data.get('rule_type', 'custom_pattern'),
                'pattern': data.get('pattern'),
                'pattern_flags': data.get('pattern_flags', 'i'),
                'inspect_target': data.get('inspect_target', 'all'),
                'action': data.get('action', 'block'),
                'block_response_code': data.get('block_response_code', 403),
                'block_message': data.get('block_message', 'Request blocked by security rules'),
                'exclude_ips': data.get('exclude_ips'),
                'exclude_endpoints': data.get('exclude_endpoints'),
                'description': data.get('description'),
                'cwe_id': data.get('cwe_id'),
                'owasp_category': data.get('owasp_category'),
            })

            return {'success': True, 'id': rule.id}

        except Exception as e:
            _logger.error(f"WAF rule create error: {e}")
            return {'success': False, 'error': str(e)}

    @http.route('/api/super-admin/security/waf-rules/<int:rule_id>', type='jsonrpc', auth='public', methods=['PUT', 'DELETE'], csrf=False)
    def waf_rules_update_delete(self, rule_id):
        """Modifier ou supprimer une règle WAF"""
        if not request.session.uid:
            return {'success': False, 'error': 'Non authentifié'}

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return {'success': False, 'error': str(e)}

        try:
            WAFRule = request.env['quelyos.waf.rule'].sudo()
            rule = WAFRule.browse(rule_id)

            if not rule.exists():
                return {'success': False, 'error': 'Règle non trouvée'}

            if request.httprequest.method == 'DELETE':
                rule.unlink()
                return {'success': True}

            # PUT - Update
            data = request.jsonrequest
            vals = {}
            for field in ['name', 'active', 'priority', 'rule_type', 'pattern', 'pattern_flags',
                          'inspect_target', 'action', 'block_response_code', 'block_message',
                          'exclude_ips', 'exclude_endpoints', 'description', 'cwe_id', 'owasp_category']:
                if field in data:
                    vals[field] = data[field]

            if vals:
                rule.write(vals)

            return {'success': True}

        except Exception as e:
            _logger.error(f"WAF rule update/delete error: {e}")
            return {'success': False, 'error': str(e)}

    @http.route('/api/super-admin/security/waf-rules/init-defaults', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def waf_rules_init_defaults(self):
        """Initialiser les règles WAF par défaut"""
        if not request.session.uid:
            return {'success': False, 'error': 'Non authentifié'}

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return {'success': False, 'error': str(e)}

        try:
            WAFRule = request.env['quelyos.waf.rule'].sudo()
            WAFRule.init_default_rules()
            return {'success': True, 'message': 'Règles par défaut initialisées'}

        except Exception as e:
            _logger.error(f"WAF init defaults error: {e}")
            return {'success': False, 'error': str(e)}

    @http.route('/api/super-admin/security/waf/logs', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def waf_logs_list(self):
        """Liste des logs WAF récents"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            limit = min(int(request.httprequest.args.get('limit', 100)), 500)
            WAFLog = request.env['quelyos.waf.log'].sudo()
            logs = WAFLog.get_recent_logs(limit=limit)

            return request.make_json_response({
                'success': True,
                'logs': logs
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"WAF logs list error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/security/waf/stats', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def waf_stats(self):
        """Statistiques WAF"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers, status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            days = int(request.httprequest.args.get('days', 7))
            WAFLog = request.env['quelyos.waf.log'].sudo()
            stats = WAFLog.get_statistics(days=days)

            return request.make_json_response({
                'success': True,
                **stats
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"WAF stats error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/security-groups', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_security_groups(self):
        """Liste les groupes de sécurité disponibles pour les plans"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

        if not request.session.uid:
            return request.make_json_response(
                {'success': False, 'error': 'Non authentifié'},
                headers=cors_headers,
                status=401
            )

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=403
            )

        try:
            Groups = request.env['res.groups'].sudo()
            # Récupérer tous les groupes triés par nom
            groups = Groups.search([], order='name')

            # Exclure certains groupes système trop techniques
            excluded_names = ['Portal', 'Public', 'Anonymous']

            result_groups = []
            for g in groups:
                full_name = g.full_name or g.name
                # Ignorer les groupes Portal/Public/Anonymous
                if any(excl in full_name for excl in excluded_names):
                    continue
                # Extraire la catégorie depuis full_name (format: "Module / Group")
                category = 'Général'
                if ' / ' in full_name:
                    category = full_name.split(' / ')[0]
                result_groups.append({
                    'id': g.id,
                    'name': g.name,
                    'full_name': full_name,
                    'category': category,
                })

            data = {
                'success': True,
                'data': result_groups,
            }
            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List security groups error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )
