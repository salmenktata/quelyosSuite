# -*- coding: utf-8 -*-
import logging
import json
from datetime import datetime, timedelta
from odoo import http
from odoo.http import request
from .super_admin import SuperAdminController
from ..config import get_cors_headers

_logger = logging.getLogger(__name__)


class AdminSettingsController(SuperAdminController):
    """Contrôleur super-admin pour les plans et paramètres"""

    @http.route('/api/super-admin/plans', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def list_plans(self):
        """Liste tous les plans tarifaires"""
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
            Plan = request.env['quelyos.subscription.plan'].sudo()
            plans = Plan.search([], order='sequence, id')

            data = {
                'success': True,
                'data': [self._serialize_plan(p) for p in plans],
            }
            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"List plans error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/plans', type='http', auth='public', methods=['POST'], csrf=False)
    def create_plan(self):
        """Crée un nouveau plan tarifaire"""
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

            Plan = request.env['quelyos.subscription.plan'].sudo()

            # Vérifier doublon code
            existing = Plan.search([('code', '=', data.get('code'))], limit=1)
            if existing:
                return request.make_json_response(
                    {'success': False, 'error': 'Code plan déjà utilisé'},
                    headers=cors_headers,
                    status=409
                )

            features = data.get('features', {})
            enabled_modules = data.get('enabled_modules', ['home'])
            create_vals = {
                'code': data.get('code'),
                'name': data.get('name'),
                'description': data.get('description'),
                'price_monthly': data.get('price_monthly', 0),
                'price_yearly': data.get('price_yearly', 0),
                'max_users': data.get('max_users', 5),
                'max_products': data.get('max_products', 100),
                'max_orders_per_year': data.get('max_orders_per_year', 1000),
                'trial_days': data.get('trial_days', 14),
                'enabled_modules': json.dumps(enabled_modules),
                'feature_wishlist': features.get('wishlist_enabled', False),
                'feature_reviews': features.get('reviews_enabled', False),
                'feature_newsletter': features.get('newsletter_enabled', False),
                'feature_comparison': features.get('product_comparison_enabled', False),
                'feature_guest_checkout': features.get('guest_checkout_enabled', True),
                'feature_api_access': features.get('api_access', False),
                'feature_priority_support': features.get('priority_support', False),
                'feature_custom_domain': features.get('custom_domain', False),
                'active': True,
                'is_default': data.get('is_default', False),
            }

            # Gérer les groupes de sécurité
            if 'group_ids' in data:
                group_ids = data.get('group_ids', [])
                create_vals['group_ids'] = [(6, 0, group_ids)]

            plan = Plan.create(create_vals)

            _logger.info(
                f"[AUDIT] Plan created - User: {request.env.user.login} | "
                f"Plan: {plan.code} (ID: {plan.id})"
            )

            return request.make_json_response({
                'success': True,
                'plan': self._serialize_plan(plan)
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Create plan error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/plans/<int:plan_id>', type='http', auth='public', methods=['PUT', 'OPTIONS'], csrf=False)
    def update_plan(self, plan_id):
        """Met à jour un plan tarifaire"""
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

            Plan = request.env['quelyos.subscription.plan'].sudo()
            plan = Plan.browse(plan_id)

            if not plan.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Plan non trouvé'},
                    headers=cors_headers,
                    status=404
                )

            features = data.get('features', {})
            enabled_modules = data.get('enabled_modules', plan.get_enabled_modules_list())
            update_vals = {
                'name': data.get('name', plan.name),
                'description': data.get('description', plan.description),
                'price_monthly': data.get('price_monthly', plan.price_monthly),
                'price_yearly': data.get('price_yearly', plan.price_yearly),
                'max_users': data.get('max_users', plan.max_users),
                'max_products': data.get('max_products', plan.max_products),
                'max_orders_per_year': data.get('max_orders_per_year', plan.max_orders_per_year),
                'trial_days': data.get('trial_days', plan.trial_days),
                'enabled_modules': json.dumps(enabled_modules),
                'feature_wishlist': features.get('wishlist_enabled', plan.feature_wishlist),
                'feature_reviews': features.get('reviews_enabled', plan.feature_reviews),
                'feature_newsletter': features.get('newsletter_enabled', plan.feature_newsletter),
                'feature_comparison': features.get('product_comparison_enabled', plan.feature_comparison),
                'feature_guest_checkout': features.get('guest_checkout_enabled', plan.feature_guest_checkout),
                'feature_api_access': features.get('api_access', plan.feature_api_access),
                'feature_priority_support': features.get('priority_support', plan.feature_priority_support),
                'feature_custom_domain': features.get('custom_domain', plan.feature_custom_domain),
                'is_default': data.get('is_default', plan.is_default),
            }

            # Gérer les groupes de sécurité
            if 'group_ids' in data:
                group_ids = data.get('group_ids', [])
                update_vals['group_ids'] = [(6, 0, group_ids)]

            plan.write(update_vals)

            _logger.info(
                f"[AUDIT] Plan updated - User: {request.env.user.login} | "
                f"Plan: {plan.code} (ID: {plan.id})"
            )

            return request.make_json_response({
                'success': True,
                'plan': self._serialize_plan(plan)
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Update plan error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    @http.route('/api/super-admin/plans/<int:plan_id>', type='http', auth='public', methods=['DELETE'], csrf=False)
    def archive_plan(self, plan_id):
        """Archive un plan tarifaire (soft delete)"""
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
            Plan = request.env['quelyos.subscription.plan'].sudo()
            plan = Plan.browse(plan_id)

            if not plan.exists():
                return request.make_json_response(
                    {'success': False, 'error': 'Plan non trouvé'},
                    headers=cors_headers,
                    status=404
                )

            plan.active = False

            _logger.info(
                f"[AUDIT] Plan archived - User: {request.env.user.login} | "
                f"Plan: {plan.code} (ID: {plan.id})"
            )

            return request.make_json_response({
                'success': True,
                'message': 'Plan archivé'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Archive plan error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers,
                status=500
            )

    def _serialize_plan(self, plan):
        """Sérialise un plan pour l'API"""
        # Compter les subscribers
        Subscription = request.env['quelyos.subscription'].sudo()
        subscribers_count = Subscription.search_count([
            ('plan_id', '=', plan.id),
            ('state', 'in', ['active', 'trial'])
        ])

        return {
            'id': plan.id,
            'code': plan.code,
            'name': plan.name,
            'description': plan.description or '',
            'price_monthly': plan.price_monthly,
            'price_yearly': plan.price_yearly or plan.price_monthly * 12 * 0.8,
            'max_users': plan.max_users,
            'max_products': plan.max_products,
            'max_orders_per_year': plan.max_orders_per_year,
            'trial_days': plan.trial_days,
            'enabled_modules': plan.get_enabled_modules_list(),
            'features': {
                'wishlist_enabled': getattr(plan, 'feature_wishlist', False),
                'reviews_enabled': getattr(plan, 'feature_reviews', False),
                'newsletter_enabled': getattr(plan, 'feature_newsletter', False),
                'product_comparison_enabled': getattr(plan, 'feature_comparison', False),
                'guest_checkout_enabled': getattr(plan, 'feature_guest_checkout', True),
                'api_access': getattr(plan, 'feature_api_access', False),
                'priority_support': getattr(plan, 'feature_priority_support', False),
                'custom_domain': getattr(plan, 'feature_custom_domain', False),
            },
            'group_ids': [{'id': g.id, 'name': g.name, 'full_name': g.full_name or g.name} for g in plan.group_ids],
            'is_active': plan.active,
            'is_popular': plan.is_popular,
            'is_default': plan.is_default,
            'subscribers_count': subscribers_count,
            'created_at': plan.create_date.isoformat() if plan.create_date else None,
        }

    @http.route('/api/super-admin/users', type='http', auth='public',
                methods=['GET', 'OPTIONS'], csrf=False)
    def list_admin_users(self):
        """Liste des utilisateurs système disponibles pour assignation"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

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
            # Récupérer tous les utilisateurs avec groupe system (super admins)
            users = request.env['res.users'].sudo().search([
                ('groups_id', 'in', request.env.ref('base.group_system').id),
                ('active', '=', True)
            ], order='name')

            return request.make_json_response({
                'success': True,
                'users': [{
                    'id': user.id,
                    'name': user.name,
                    'login': user.login,
                    'email': user.email,
                } for user in users]
            }, headers=cors_headers)

        except Exception as e:
            _logger.exception("Error listing admin users")
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/settings/email', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_email_settings(self):
        """Récupère la configuration SMTP actuelle"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

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
            # Récupérer tous les serveurs SMTP (ordre par sequence)
            servers = request.env['ir.mail_server'].sudo().search([], order='sequence, id')

            data = {
                'success': True,
                'data': [
                    {
                        'id': s.id,
                        'name': s.name,
                        'smtp_host': s.smtp_host,
                        'smtp_port': s.smtp_port,
                        'smtp_user': s.smtp_user,
                        'smtp_pass': '••••••' if s.smtp_pass else None,  # Masquer password
                        'smtp_encryption': s.smtp_encryption,
                        'smtp_authentication': s.smtp_authentication,
                        'active': s.active,
                        'sequence': s.sequence,
                        'from_filter': s.from_filter,
                    }
                    for s in servers
                ],
                'total': len(servers),
            }
            return request.make_json_response(data, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Get email settings error: {e}")
            return request.make_json_response(
                {'success': False, 'error': 'Erreur serveur'},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/settings/email', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def create_or_update_email_settings(self):
        """Créer ou mettre à jour un serveur SMTP"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

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
            payload = json.loads(request.httprequest.data.decode('utf-8'))
            server_id = payload.get('id')

            # Validation des champs requis
            required_fields = ['name', 'smtp_host', 'smtp_port', 'smtp_encryption']
            for field in required_fields:
                if not payload.get(field):
                    return request.make_json_response({
                        'success': False,
                        'error': f'Champ requis: {field}'
                    }, headers=cors_headers, status=400)

            # Valeurs par défaut
            vals = {
                'name': payload['name'],
                'smtp_host': payload['smtp_host'],
                'smtp_port': int(payload['smtp_port']),
                'smtp_encryption': payload['smtp_encryption'],
                'smtp_authentication': payload.get('smtp_authentication', 'login'),
                'smtp_user': payload.get('smtp_user'),
                'active': payload.get('active', True),
                'sequence': payload.get('sequence', 10),
                'from_filter': payload.get('from_filter'),
            }

            # Password : uniquement si fourni et différent de '••••••'
            if payload.get('smtp_pass') and payload['smtp_pass'] != '••••••':
                vals['smtp_pass'] = payload['smtp_pass']

            MailServer = request.env['ir.mail_server'].sudo()

            if server_id:
                # Update existant
                server = MailServer.browse(server_id)
                if not server.exists():
                    return request.make_json_response({
                        'success': False,
                        'error': 'Serveur SMTP introuvable'
                    }, headers=cors_headers, status=404)

                server.write(vals)
                message = 'Serveur SMTP mis à jour'
            else:
                # Créer nouveau
                server = MailServer.create(vals)
                message = 'Serveur SMTP créé'

            _logger.info(
                f"[AUDIT] Email settings {'updated' if server_id else 'created'} - "
                f"User: {request.env.user.login} | Server: {server.name}"
            )

            return request.make_json_response({
                'success': True,
                'message': message,
                'data': {
                    'id': server.id,
                    'name': server.name,
                    'smtp_host': server.smtp_host,
                    'smtp_port': server.smtp_port,
                    'smtp_user': server.smtp_user,
                    'smtp_pass': '••••••' if server.smtp_pass else None,
                    'smtp_encryption': server.smtp_encryption,
                    'smtp_authentication': server.smtp_authentication,
                    'active': server.active,
                    'sequence': server.sequence,
                    'from_filter': server.from_filter,
                }
            }, headers=cors_headers)

        except json.JSONDecodeError:
            return request.make_json_response(
                {'success': False, 'error': 'JSON invalide'},
                headers=cors_headers, status=400
            )
        except Exception as e:
            _logger.error(f"Create/update email settings error: {e}")
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/settings/email/<int:server_id>', type='http', auth='public', methods=['DELETE', 'OPTIONS'], csrf=False)
    def delete_email_server(self, server_id):
        """Supprimer un serveur SMTP"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

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
            server = request.env['ir.mail_server'].sudo().browse(server_id)

            if not server.exists():
                return request.make_json_response({
                    'success': False,
                    'error': 'Serveur SMTP introuvable'
                }, headers=cors_headers, status=404)

            server_name = server.name
            server.unlink()

            _logger.warning(
                f"[AUDIT] Email server DELETED - User: {request.env.user.login} | "
                f"Server: {server_name} (ID: {server_id})"
            )

            return request.make_json_response({
                'success': True,
                'message': 'Serveur SMTP supprimé'
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Delete email server error: {e}")
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=500
            )

    @http.route('/api/super-admin/settings/email/test', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def test_email_server(self):
        """Tester l'envoi d'un email via le serveur SMTP configuré"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

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
            payload = json.loads(request.httprequest.data.decode('utf-8'))
            email_to = payload.get('email_to')
            server_id = payload.get('server_id')

            if not email_to:
                return request.make_json_response({
                    'success': False,
                    'error': 'Email destinataire requis'
                }, headers=cors_headers, status=400)

            # Créer et envoyer email de test
            # Récupérer from_filter du serveur SMTP pour l'utiliser comme expéditeur
            server_from = None
            if server_id:
                server = request.env['ir.mail_server'].sudo().browse(server_id)
                server_from = server.from_filter or 'noreply@quelyos.com'
            else:
                server_from = 'noreply@quelyos.com'

            mail_values = {
                'subject': '[Quelyos] Test Email SMTP',
                'email_from': server_from,  # Utiliser email vérifié (pas username SMTP)
                'body_html': '''
                    <p>Bonjour,</p>
                    <p>Ceci est un email de test pour valider la configuration SMTP de votre plateforme Quelyos.</p>
                    <p><strong>Date:</strong> {}</p>
                    <p>Si vous recevez cet email, la configuration est correcte ✅</p>
                    <p>Cordialement,<br/>Système Quelyos</p>
                '''.format(datetime.now().strftime('%Y-%m-%d %H:%M:%S')),
                'email_to': email_to,
                'auto_delete': False,  # Garder pour debug
            }

            # Si server_id spécifié, forcer utilisation de ce serveur
            if server_id:
                mail_values['mail_server_id'] = server_id

            mail = request.env['mail.mail'].sudo().create(mail_values)
            mail.send()

            # Vérifier le statut après envoi
            if mail.state == 'sent':
                _logger.info(
                    f"[AUDIT] Test email SENT - User: {request.env.user.login} | "
                    f"To: {email_to} | Server ID: {server_id or 'default'}"
                )
                return request.make_json_response({
                    'success': True,
                    'message': f'Email de test envoyé à {email_to}'
                }, headers=cors_headers)
            else:
                error_msg = mail.failure_reason or 'Échec envoi (raison inconnue)'
                _logger.warning(
                    f"[AUDIT] Test email FAILED - User: {request.env.user.login} | "
                    f"To: {email_to} | Error: {error_msg}"
                )
                return request.make_json_response({
                    'success': False,
                    'error': error_msg
                }, headers=cors_headers, status=500)

        except json.JSONDecodeError:
            return request.make_json_response(
                {'success': False, 'error': 'JSON invalide'},
                headers=cors_headers, status=400
            )
        except Exception as e:
            _logger.error(f"Test email error: {e}")
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=500
            )
