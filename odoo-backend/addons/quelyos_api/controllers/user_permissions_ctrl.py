# -*- coding: utf-8 -*-
import json
import logging
from odoo import http
from odoo.http import request
from ..config import get_cors_headers
from ..lib.jwt_auth import require_jwt_auth
from ..lib.audit_log import AuditLogger, AuditAction
from ..models.user_permission import MODULE_PAGES

_logger = logging.getLogger(__name__)
_audit = AuditLogger()


class UserPermissionsController(http.Controller):
    """Gestion des permissions utilisateur (Manager → User) au sein d'un tenant."""

    def _get_cors_headers(self):
        origin = request.httprequest.headers.get('Origin', '')
        return get_cors_headers(origin)

    def _get_tenant_for_user(self, user_id):
        """Retourne le tenant de l'utilisateur."""
        user = request.env['res.users'].sudo().browse(user_id)
        if not user.exists():
            return None
        tenant = request.env['quelyos.tenant'].sudo().search([
            ('company_id', '=', user.company_id.id)
        ], limit=1)
        return tenant if tenant.exists() else None

    def _is_tenant_manager(self, user, tenant):
        """Vérifie si l'utilisateur est le manager (admin) du tenant.
        Le manager est :
        - L'admin initial du tenant (admin_email match)
        - OU le premier utilisateur interne du tenant (plus petit ID)
        - OU un user sans aucune permission custom (= il a reçu les groupes du plan directement)
        """
        if not tenant or not user:
            return False

        # Admin initial du tenant (email match)
        if tenant.admin_email and user.login == tenant.admin_email:
            return True

        # Premier utilisateur interne du tenant = manager
        first_user = request.env['res.users'].sudo().search([
            ('company_id', '=', tenant.company_id.id),
            ('active', '=', True),
            ('share', '=', False),
        ], order='id asc', limit=1)
        if first_user and first_user.id == user.id:
            return True

        # Si l'utilisateur a des permissions custom, il n'est PAS le manager
        perm_count = request.env['quelyos.user.permission'].sudo().search_count([
            ('user_id', '=', user.id),
            ('tenant_id', '=', tenant.id),
        ])
        if perm_count > 0:
            return False

        # Vérifier s'il a le groupe Access Rights (super admin)
        group_names = []
        for g in user.group_ids:
            name = g.name
            if isinstance(name, dict):
                name = name.get('en_US') or next(iter(name.values()), '')
            group_names.append(name)

        return 'Access Rights' in group_names

    def _send_invitation_email(self, new_user, email, temp_password, tenant, invited_by):
        """Envoie un email d'invitation avec les identifiants temporaires."""
        company = tenant.company_id
        base_url = request.env['ir.config_parameter'].sudo().get_param('web.base.url', 'https://app.quelyos.com')
        # Utiliser le domaine frontend du tenant si disponible
        login_url = f"{base_url}/login"

        subject = f"Invitation à rejoindre {tenant.name}"
        body_html = f"""
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #333; margin-bottom: 20px;">Bienvenue dans l&apos;équipe !</h1>
    <p style="color: #666; line-height: 1.6;">
        Bonjour <strong>{new_user.name}</strong>,
    </p>
    <p style="color: #666; line-height: 1.6;">
        <strong>{invited_by.name}</strong> vous a invité à rejoindre
        l&apos;espace <strong>{tenant.name}</strong>.
    </p>
    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 10px; color: #333; font-weight: bold;">Vos identifiants :</p>
        <p style="margin: 5px 0; color: #666;">Email : <strong>{email}</strong></p>
        <p style="margin: 5px 0; color: #666;">Mot de passe : <strong>{temp_password}</strong></p>
    </div>
    <p style="color: #e91e63; font-size: 13px;">
        Nous vous recommandons de changer votre mot de passe lors de votre première connexion.
    </p>
    <a href="{login_url}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
        Se connecter
    </a>
    <p style="color: #999; font-size: 12px; margin-top: 30px;">
        Cet email a été envoyé automatiquement par {tenant.name}.
    </p>
</div>
"""

        mail_values = {
            'subject': subject,
            'body_html': body_html,
            'email_from': company.email or 'noreply@quelyos.com',
            'email_to': email,
            'auto_delete': True,
        }
        mail = request.env['mail.mail'].sudo().create(mail_values)
        mail.send()

    # =========================================================================
    # GET /api/auth/my-permissions — Permissions de l'utilisateur connecté
    # =========================================================================

    @http.route('/api/auth/my-permissions', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    @require_jwt_auth
    def get_my_permissions(self, **kwargs):
        cors_headers = self._get_cors_headers()

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        try:
            claims = self.jwt_claims
            user_id = claims.get('uid')
            tenant = self._get_tenant_for_user(user_id)

            if not tenant:
                return request.make_json_response({
                    'success': True,
                    'permissions': {'modules': {}, 'is_manager': False},
                }, headers=cors_headers)

            PermModel = request.env['quelyos.user.permission']
            permissions = PermModel.get_user_permissions(user_id, tenant.id)

            # Si manager, accès full à tous les modules du plan
            if permissions['is_manager']:
                user = request.env['res.users'].sudo().browse(user_id)
                if self._is_tenant_manager(user, tenant):
                    permissions['is_manager'] = True

            return request.make_json_response({
                'success': True,
                'permissions': permissions,
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"[my-permissions] Error: {e}", exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': str(e),
            }, headers=cors_headers, status=500)

    # =========================================================================
    # GET /api/tenant/team — Liste des utilisateurs du tenant
    # =========================================================================

    @http.route('/api/tenant/team', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    @require_jwt_auth
    def get_team(self, **kwargs):
        cors_headers = self._get_cors_headers()

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        try:
            claims = self.jwt_claims
            user_id = claims.get('uid')
            user = request.env['res.users'].sudo().browse(user_id)
            tenant = self._get_tenant_for_user(user_id)

            if not tenant:
                return request.make_json_response({
                    'success': False,
                    'error': 'Tenant non trouvé',
                }, headers=cors_headers, status=404)

            if not self._is_tenant_manager(user, tenant):
                return request.make_json_response({
                    'success': False,
                    'error': 'Accès refusé : vous devez être manager',
                }, headers=cors_headers, status=403)

            # Lister les users du même tenant (même company)
            team_users = request.env['res.users'].sudo().search([
                ('company_id', '=', tenant.company_id.id),
                ('active', '=', True),
                ('share', '=', False),  # Exclure les portail users
            ])

            PermModel = request.env['quelyos.user.permission']
            members = []
            for member in team_users:
                perms = PermModel.get_user_permissions(member.id, tenant.id)
                is_mgr = self._is_tenant_manager(member, tenant)

                # Groupes de l'utilisateur
                groups = []
                for g in member.group_ids:
                    name = g.name
                    if isinstance(name, dict):
                        name = name.get('en_US') or next(iter(name.values()), '')
                    groups.append(name)

                members.append({
                    'id': member.id,
                    'name': member.name,
                    'email': member.email or member.login,
                    'login': member.login,
                    'is_manager': is_mgr,
                    'groups': groups,
                    'permissions': perms['modules'],
                    'created_at': member.create_date.isoformat() if member.create_date else None,
                })

            # Modules activés par le plan du tenant
            plan_modules = ['home']
            if tenant.plan_id:
                plan_modules = tenant.plan_id.get_enabled_modules_list()
            elif tenant.subscription_id and tenant.subscription_id.plan_id:
                plan_modules = tenant.subscription_id.plan_id.get_enabled_modules_list()

            return request.make_json_response({
                'success': True,
                'team': members,
                'tenant': {
                    'id': tenant.id,
                    'name': tenant.name,
                    'code': tenant.code,
                },
                'plan_modules': plan_modules,
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"[team] Error: {e}", exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': str(e),
            }, headers=cors_headers, status=500)

    # =========================================================================
    # GET /api/tenant/team/<user_id>/permissions
    # =========================================================================

    @http.route('/api/tenant/team/<int:target_user_id>/permissions', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    @require_jwt_auth
    def get_user_permissions(self, target_user_id, **kwargs):
        cors_headers = self._get_cors_headers()

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        try:
            claims = self.jwt_claims
            user_id = claims.get('uid')
            user = request.env['res.users'].sudo().browse(user_id)
            tenant = self._get_tenant_for_user(user_id)

            if not tenant or not self._is_tenant_manager(user, tenant):
                return request.make_json_response({
                    'success': False,
                    'error': 'Accès refusé',
                }, headers=cors_headers, status=403)

            PermModel = request.env['quelyos.user.permission']
            permissions = PermModel.get_user_permissions(target_user_id, tenant.id)

            return request.make_json_response({
                'success': True,
                'user_id': target_user_id,
                'permissions': permissions,
                'available_modules': list(MODULE_PAGES.keys()),
                'module_pages': MODULE_PAGES,
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"[user-permissions] Error: {e}", exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': str(e),
            }, headers=cors_headers, status=500)

    # =========================================================================
    # POST /api/tenant/team/<user_id>/permissions — Définir permissions
    # =========================================================================

    @http.route('/api/tenant/team/<int:target_user_id>/permissions', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    @require_jwt_auth
    def set_user_permissions(self, target_user_id, **kwargs):
        cors_headers = self._get_cors_headers()

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        try:
            claims = self.jwt_claims
            user_id = claims.get('uid')
            user = request.env['res.users'].sudo().browse(user_id)
            tenant = self._get_tenant_for_user(user_id)

            if not tenant or not self._is_tenant_manager(user, tenant):
                return request.make_json_response({
                    'success': False,
                    'error': 'Accès refusé',
                }, headers=cors_headers, status=403)

            # Interdire de modifier ses propres permissions
            if target_user_id == user_id:
                return request.make_json_response({
                    'success': False,
                    'error': 'Impossible de modifier vos propres permissions',
                }, headers=cors_headers, status=400)

            # Vérifier que l'utilisateur cible est dans le même tenant
            target_user = request.env['res.users'].sudo().browse(target_user_id)
            if not target_user.exists() or target_user.company_id.id != tenant.company_id.id:
                return request.make_json_response({
                    'success': False,
                    'error': 'Utilisateur non trouvé dans ce tenant',
                }, headers=cors_headers, status=404)

            body = request.get_json_data()
            permissions = body.get('permissions', {})

            PermModel = request.env['quelyos.user.permission']

            # permissions = {'finance': {'level': 'full', 'pages': {...}}, ...}
            for module_id, config in permissions.items():
                if module_id not in MODULE_PAGES:
                    continue

                access_level = config.get('level', 'none')
                if access_level not in ('none', 'read', 'full'):
                    access_level = 'none'

                page_perms = config.get('pages', {})

                PermModel.set_user_permissions(
                    user_id=target_user_id,
                    tenant_id=tenant.id,
                    module_id=module_id,
                    access_level=access_level,
                    page_permissions=page_perms,
                    granted_by=user_id,
                )

            # Retourner les permissions mises à jour
            updated = PermModel.get_user_permissions(target_user_id, tenant.id)

            # Audit log
            _audit.log(
                action=AuditAction.USER_PERMISSION_CHANGE,
                user_id=user_id,
                user_login=user.login,
                resource_type='res.users',
                resource_id=target_user_id,
                details={
                    'target_user': target_user.name,
                    'permissions': permissions,
                },
                request=request,
            )

            return request.make_json_response({
                'success': True,
                'permissions': updated,
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"[set-permissions] Error: {e}", exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': str(e),
            }, headers=cors_headers, status=500)

    # =========================================================================
    # POST /api/tenant/team/invite — Inviter un utilisateur
    # =========================================================================

    @http.route('/api/tenant/team/invite', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    @require_jwt_auth
    def invite_user(self, **kwargs):
        cors_headers = self._get_cors_headers()

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        try:
            claims = self.jwt_claims
            user_id = claims.get('uid')
            user = request.env['res.users'].sudo().browse(user_id)
            tenant = self._get_tenant_for_user(user_id)

            if not tenant or not self._is_tenant_manager(user, tenant):
                return request.make_json_response({
                    'success': False,
                    'error': 'Accès refusé',
                }, headers=cors_headers, status=403)

            body = request.get_json_data()
            email = body.get('email', '').strip().lower()
            name = body.get('name', '').strip()
            permissions = body.get('permissions', {})

            if not email:
                return request.make_json_response({
                    'success': False,
                    'error': 'Email requis',
                }, headers=cors_headers, status=400)

            # Vérifier si l'utilisateur existe déjà
            existing = request.env['res.users'].sudo().search([
                ('login', '=', email)
            ], limit=1)

            if existing:
                # Vérifier s'il est dans le même tenant
                if existing.company_id.id == tenant.company_id.id:
                    return request.make_json_response({
                        'success': False,
                        'error': 'Cet utilisateur fait déjà partie de votre équipe',
                    }, headers=cors_headers, status=409)
                else:
                    return request.make_json_response({
                        'success': False,
                        'error': 'Cet email est déjà utilisé dans un autre espace',
                    }, headers=cors_headers, status=409)

            # Quota check
            from ..lib.tenant_security import check_quota_users
            quota_error = check_quota_users(tenant)
            if quota_error:
                return request.make_json_response({
                    'success': False,
                    'error': 'Quota utilisateurs atteint pour votre plan',
                }, headers=cors_headers, status=403)

            import secrets
            temp_password = secrets.token_urlsafe(12)

            # Créer le partner
            partner = request.env['res.partner'].sudo().create({
                'name': name or email.split('@')[0].title(),
                'email': email,
                'company_id': tenant.company_id.id,
            })

            # Groupes de base uniquement (Home User)
            base_group = request.env.ref('base.group_user')
            home_user_group = request.env['res.groups'].sudo().search([
                ('name', 'ilike', 'Quelyos Home User')
            ], limit=1)

            group_ids = [base_group.id]
            if home_user_group:
                group_ids.append(home_user_group.id)

            # Créer l'utilisateur
            new_user = request.env['res.users'].sudo().create({
                'name': partner.name,
                'login': email,
                'password': temp_password,
                'partner_id': partner.id,
                'company_id': tenant.company_id.id,
                'company_ids': [(4, tenant.company_id.id)],
                'group_ids': [(6, 0, group_ids)],
            })

            # Appliquer les permissions initiales
            PermModel = request.env['quelyos.user.permission']
            for module_id, config in permissions.items():
                if module_id not in MODULE_PAGES:
                    continue
                access_level = config.get('level', 'none')
                page_perms = config.get('pages', {})
                PermModel.set_user_permissions(
                    user_id=new_user.id,
                    tenant_id=tenant.id,
                    module_id=module_id,
                    access_level=access_level,
                    page_permissions=page_perms,
                    granted_by=user_id,
                )

            # Envoyer l'email d'invitation
            try:
                self._send_invitation_email(
                    new_user, email, temp_password, tenant, user
                )
            except Exception as mail_err:
                _logger.warning(f"[invite] Email envoi échoué: {mail_err}")

            # Audit log
            _audit.log(
                action=AuditAction.USER_CREATE,
                user_id=user_id,
                user_login=user.login,
                resource_type='res.users',
                resource_id=new_user.id,
                details={
                    'invited_email': email,
                    'invited_name': new_user.name,
                    'tenant': tenant.name,
                    'permissions': permissions,
                },
                request=request,
            )

            return request.make_json_response({
                'success': True,
                'user': {
                    'id': new_user.id,
                    'name': new_user.name,
                    'email': email,
                    'temp_password': temp_password,
                },
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"[invite] Error: {e}", exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': str(e),
            }, headers=cors_headers, status=500)

    # =========================================================================
    # DELETE /api/tenant/team/<user_id> — Retirer un utilisateur
    # =========================================================================

    @http.route('/api/tenant/team/<int:target_user_id>', type='http', auth='public', methods=['DELETE', 'OPTIONS'], csrf=False)
    @require_jwt_auth
    def remove_user(self, target_user_id, **kwargs):
        cors_headers = self._get_cors_headers()

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        try:
            claims = self.jwt_claims
            user_id = claims.get('uid')
            user = request.env['res.users'].sudo().browse(user_id)
            tenant = self._get_tenant_for_user(user_id)

            if not tenant or not self._is_tenant_manager(user, tenant):
                return request.make_json_response({
                    'success': False,
                    'error': 'Accès refusé',
                }, headers=cors_headers, status=403)

            if target_user_id == user_id:
                return request.make_json_response({
                    'success': False,
                    'error': 'Impossible de vous retirer vous-même',
                }, headers=cors_headers, status=400)

            target_user = request.env['res.users'].sudo().browse(target_user_id)
            if not target_user.exists() or target_user.company_id.id != tenant.company_id.id:
                return request.make_json_response({
                    'success': False,
                    'error': 'Utilisateur non trouvé',
                }, headers=cors_headers, status=404)

            # Désactiver l'utilisateur (soft delete)
            target_user.sudo().write({'active': False})

            # Supprimer les permissions
            perms = request.env['quelyos.user.permission'].sudo().search([
                ('user_id', '=', target_user_id),
                ('tenant_id', '=', tenant.id),
            ])
            perms.unlink()

            # Audit log
            _audit.log(
                action=AuditAction.USER_DELETE,
                user_id=user_id,
                user_login=user.login,
                resource_type='res.users',
                resource_id=target_user_id,
                details={
                    'removed_user': target_user.name,
                    'removed_email': target_user.login,
                    'tenant': tenant.name,
                },
                request=request,
            )

            return request.make_json_response({
                'success': True,
                'message': f'Utilisateur {target_user.name} retiré',
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"[remove-user] Error: {e}", exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': str(e),
            }, headers=cors_headers, status=500)

    # =========================================================================
    # GET /api/tenant/team/module-pages — Config des pages par module
    # =========================================================================

    @http.route('/api/tenant/team/module-pages', type='http', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    @require_jwt_auth
    def get_module_pages(self, **kwargs):
        cors_headers = self._get_cors_headers()

        if request.httprequest.method == 'OPTIONS':
            return request.make_response('', headers=list(cors_headers.items()))

        return request.make_json_response({
            'success': True,
            'module_pages': MODULE_PAGES,
        }, headers=cors_headers)
