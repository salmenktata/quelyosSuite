# -*- coding: utf-8 -*-
import logging
import json
from datetime import datetime, timedelta
from odoo import http
from odoo.http import request
from odoo.exceptions import AccessDenied
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

            # Vérifier doublon code + plan_type
            existing = Plan.search([
                ('code', '=', data.get('code')),
                ('plan_type', '=', data.get('plan_type', 'module')),
            ], limit=1)
            if existing:
                return request.make_json_response(
                    {'success': False, 'error': 'Code plan déjà utilisé pour ce type'},
                    headers=cors_headers,
                    status=409
                )

            features = data.get('features', {})
            plan_type = data.get('plan_type', 'module')
            create_vals = {
                'code': data.get('code'),
                'name': data.get('name'),
                'description': data.get('description'),
                'plan_type': plan_type,
                'price_monthly': data.get('price_monthly', 0),
                'price_yearly': data.get('price_yearly', 0),
                'max_users': data.get('max_users', 5),
                'max_products': data.get('max_products', 100),
                'max_orders_per_year': data.get('max_orders_per_year', 1000),
                'trial_days': data.get('trial_days', 14),
                'original_price': data.get('original_price', 0),
                'badge_text': data.get('badge_text') or False,
                'cta_text': data.get('cta_text', 'Essai gratuit 30 jours'),
                'cta_href': data.get('cta_href', '/register'),
                'yearly_discount_pct': data.get('yearly_discount_pct', 20),
                'features_marketing': json.dumps(data.get('features_marketing', [])),
                'icon_name': data.get('icon_name', 'Layers'),
                'color_theme': data.get('color_theme', 'emerald'),
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

            # Champs modulaires selon le type de plan
            if plan_type == 'module':
                create_vals['module_key'] = data.get('module_key') or False
                create_vals['limit_name'] = data.get('limit_name') or False
                create_vals['limit_included'] = data.get('limit_included', 0)
                create_vals['surplus_price'] = data.get('surplus_price', 0)
                create_vals['surplus_unit'] = data.get('surplus_unit', 500)

            if plan_type == 'user_pack':
                create_vals['pack_size'] = data.get('pack_size', 5)

            if plan_type == 'solution':
                create_vals['solution_slug'] = data.get('solution_slug') or False
                solution_modules = data.get('solution_modules', [])
                create_vals['solution_modules'] = json.dumps(solution_modules) if isinstance(solution_modules, list) else solution_modules or '[]'

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
            plan_type = data.get('plan_type', plan.plan_type)
            update_vals = {
                'name': data.get('name', plan.name),
                'description': data.get('description', plan.description),
                'plan_type': plan_type,
                'price_monthly': data.get('price_monthly', plan.price_monthly),
                'price_yearly': data.get('price_yearly', plan.price_yearly),
                'max_users': data.get('max_users', plan.max_users),
                'max_products': data.get('max_products', plan.max_products),
                'max_orders_per_year': data.get('max_orders_per_year', plan.max_orders_per_year),
                'trial_days': data.get('trial_days', plan.trial_days),
                'original_price': data.get('original_price', plan.original_price),
                'badge_text': data.get('badge_text', plan.badge_text) or False,
                'cta_text': data.get('cta_text', plan.cta_text),
                'cta_href': data.get('cta_href', plan.cta_href),
                'yearly_discount_pct': data.get('yearly_discount_pct', plan.yearly_discount_pct),
                'icon_name': data.get('icon_name', plan.icon_name),
                'color_theme': data.get('color_theme', plan.color_theme),
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

            # Champs modulaires selon le type de plan
            if plan_type == 'module':
                update_vals['module_key'] = data.get('module_key', plan.module_key) or False
                update_vals['limit_name'] = data.get('limit_name', plan.limit_name) or False
                update_vals['limit_included'] = data.get('limit_included', plan.limit_included)
                update_vals['surplus_price'] = data.get('surplus_price', plan.surplus_price)
                update_vals['surplus_unit'] = data.get('surplus_unit', plan.surplus_unit)

            if plan_type == 'user_pack':
                update_vals['pack_size'] = data.get('pack_size', plan.pack_size)

            if plan_type == 'solution':
                update_vals['solution_slug'] = data.get('solution_slug', plan.solution_slug) or False
                if 'solution_modules' in data:
                    solution_modules = data['solution_modules']
                    update_vals['solution_modules'] = json.dumps(solution_modules) if isinstance(solution_modules, list) else solution_modules or '[]'

            # features_marketing : seulement si fourni
            if 'features_marketing' in data:
                update_vals['features_marketing'] = json.dumps(data['features_marketing'])

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

    @http.route('/api/super-admin/plans/seed-defaults', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def seed_default_plans(self):
        """Insère ou met à jour la configuration par défaut des plans tarifaires"""
        origin = request.httprequest.headers.get('Origin', '')
        cors_headers = get_cors_headers(origin)

        if request.httprequest.method == 'OPTIONS':
            response = request.make_response('', headers=list(cors_headers.items()))
            response.status_code = 204
            return response

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
            created = 0
            updated = 0

            defaults = self._get_default_plans()

            for plan_data in defaults:
                existing = Plan.search([
                    ('code', '=', plan_data['code']),
                ], limit=1)

                if existing:
                    existing.write(plan_data)
                    updated += 1
                else:
                    Plan.create(plan_data)
                    created += 1

            _logger.info(
                f"[AUDIT] Plans seed - User: {request.env.user.login} | "
                f"Created: {created}, Updated: {updated}"
            )

            return request.make_json_response({
                'success': True,
                'message': f'{created} créés, {updated} mis à jour',
                'created': created,
                'updated': updated,
            }, headers=cors_headers)

        except Exception as e:
            _logger.error(f"Seed default plans error: {e}")
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers,
                status=500
            )

    def _get_default_plans(self):
        """Retourne la liste des plans par défaut"""
        common = {
            'max_users': 5,
            'max_products': 500,
            'max_orders_per_year': 5000,
            'trial_days': 30,
            'cta_text': 'Essai gratuit 30 jours',
            'cta_href': '/register',
            'yearly_discount_pct': 22,
            'feature_guest_checkout': True,
            'active': True,
            'support_level': 'email_chat_24h',
        }

        plans = []

        # ── Plan de base ──
        plans.append({
            **common,
            'code': 'base',
            'name': 'Quelyos Base',
            'description': 'Accès plateforme + 1 module au choix',
            'plan_type': 'base',
            'price_monthly': 9,
            'price_yearly': 84,
            'icon_name': 'Layers',
            'color_theme': 'emerald',
            'is_default': True,
            'sequence': 1,
            'features_marketing': json.dumps([
                '5 utilisateurs inclus',
                '1 module au choix',
                'Essai gratuit 30 jours',
                'Support email & chat',
            ]),
            'enabled_modules': json.dumps(['home']),
        })

        # ── 9 modules ──
        modules_data = [
            ('mod_finance', 'Finance', 'finance', 9, 84, 'Trésorerie, budgets, prévisions, export FEC', 'Wallet', 'emerald', 10,
             ['Trésorerie temps réel', 'Budgets et prévisions IA', 'Export FEC comptable', 'Multi-devises'],
             'transactions', 500, 3, 500),
            ('mod_store', 'Boutique', 'store', 19, 180, 'Catalogue, commandes, promotions, thèmes', 'Store', 'indigo', 20,
             ['Catalogue produits', 'Gestion commandes', 'Promotions & coupons', 'Thèmes personnalisables'],
             'products', 500, 5, 500),
            ('mod_stock', 'Stock', 'stock', 9, 84, 'Inventaire, mouvements, valorisation', 'Package', 'amber', 30,
             ['Inventaire temps réel', 'Mouvements de stock', 'Valorisation FIFO/LIFO', 'Alertes rupture'],
             None, 0, 0, 0),
            ('mod_crm', 'CRM', 'crm', 12, 112, 'Pipeline, opportunités, facturation', 'Users', 'violet', 40,
             ['Pipeline commercial', 'Gestion opportunités', 'Facturation intégrée', 'Rapports ventes'],
             'contacts', 1000, 3, 1000),
            ('mod_marketing', 'Marketing', 'marketing', 9, 84, 'Campagnes email/SMS, listes diffusion', 'Megaphone', 'emerald', 50,
             ['Campagnes email', 'SMS marketing', 'Listes de diffusion', 'Analytics campagnes'],
             None, 0, 0, 0),
            ('mod_hr', 'RH', 'hr', 12, 112, 'Employés, congés, contrats, compétences', 'UserCog', 'emerald', 60,
             ['Fiches employés', 'Gestion congés', 'Contrats de travail', 'Compétences & formations'],
             'employees', 25, 5, 25),
            ('mod_support', 'Support', 'support', 5, 48, 'Tickets, FAQ, base de connaissances', 'LifeBuoy', 'emerald', 70,
             ['Système tickets', 'FAQ publique', 'Base de connaissances', 'SLA configurable'],
             'tickets_month', 50, 2, 50),
            ('mod_pos', 'Point de Vente', 'pos', 15, 140, 'Terminal, kiosk, cuisine, analytics', 'Monitor', 'amber', 80,
             ['Terminal de vente', 'Mode kiosk', 'Écran cuisine', 'Analytics POS'],
             None, 0, 0, 0),
            ('mod_maintenance', 'GMAO', 'maintenance', 9, 84, 'Maintenance équipements, planning', 'Wrench', 'emerald', 90,
             ['Gestion équipements', 'Planning maintenance', 'Ordres de travail', 'Historique interventions'],
             'equipments', 50, 3, 50),
        ]

        for code, name, module_key, price, yearly, desc, icon, color, seq, features, limit_name, limit_inc, surplus_p, surplus_u in modules_data:
            plan = {
                **common,
                'code': code,
                'name': name,
                'description': desc,
                'plan_type': 'module',
                'price_monthly': price,
                'price_yearly': yearly,
                'icon_name': icon,
                'color_theme': color,
                'sequence': 100 + seq,
                'module_key': module_key,
                'features_marketing': json.dumps(features),
                'enabled_modules': json.dumps([module_key]),
            }
            if limit_name:
                plan['limit_name'] = limit_name
                plan['limit_included'] = limit_inc
                plan['surplus_price'] = surplus_p
                plan['surplus_unit'] = surplus_u
            plans.append(plan)

        # ── 12 solutions métier ──
        solutions_data = [
            ('sol_restaurant', 'Quelyos Resto', 'restaurant', 45, 420, 'Solution complète restauration', 'UtensilsCrossed', 'amber', 10,
             ['pos', 'stock', 'finance', 'crm', 'marketing'], ['Point de Vente', 'Stock temps réel', 'Finance intégrée', 'CRM', 'Marketing']),
            ('sol_commerce', 'Quelyos Commerce', 'commerce', 45, 420, 'Commerce physique + digital', 'ShoppingBag', 'indigo', 20,
             ['store', 'pos', 'stock', 'crm'], ['Boutique en ligne', 'Point de Vente', 'Stock', 'CRM']),
            ('sol_ecommerce', 'Quelyos Store', 'ecommerce', 45, 420, 'E-commerce complet', 'Globe', 'emerald', 30,
             ['store', 'stock', 'marketing', 'finance', 'crm'], ['Boutique en ligne', 'Stock', 'Marketing', 'Finance', 'CRM']),
            ('sol_services', 'Quelyos Pro', 'services', 35, 324, 'Entreprises de services', 'Briefcase', 'violet', 40,
             ['crm', 'finance', 'hr', 'marketing'], ['CRM', 'Finance', 'RH', 'Marketing']),
            ('sol_sante', 'Quelyos Care', 'sante', 29, 276, 'Cabinets & cliniques', 'Heart', 'emerald', 50,
             ['crm', 'finance', 'marketing', 'support'], ['CRM', 'Finance', 'Marketing', 'Support']),
            ('sol_btp', 'Quelyos Build', 'btp', 35, 324, 'BTP & construction', 'HardHat', 'amber', 60,
             ['maintenance', 'stock', 'finance', 'crm'], ['GMAO', 'Stock', 'Finance', 'CRM']),
            ('sol_hotellerie', 'Quelyos Hotel', 'hotellerie', 39, 360, 'Hôtellerie & hébergement', 'Hotel', 'emerald', 70,
             ['support', 'maintenance', 'finance', 'crm', 'marketing'], ['Support', 'GMAO', 'Finance', 'CRM', 'Marketing']),
            ('sol_associations', 'Quelyos Club', 'associations', 19, 180, 'Associations & ONG', 'HandHeart', 'emerald', 80,
             ['crm', 'finance', 'marketing'], ['CRM (adhérents)', 'Finance', 'Marketing']),
            ('sol_industrie', 'Quelyos Industrie', 'industrie', 35, 324, 'PME industrielles & ateliers', 'Factory', 'emerald', 90,
             ['maintenance', 'stock', 'finance', 'hr'], ['GMAO', 'Stock', 'Finance', 'RH']),
            ('sol_immobilier', 'Quelyos Immo', 'immobilier', 29, 276, 'Agences & gestion immobilière', 'Home', 'violet', 100,
             ['crm', 'finance', 'marketing', 'support'], ['CRM', 'Finance', 'Marketing', 'Support']),
            ('sol_education', 'Quelyos Edu', 'education', 35, 324, 'Formation & enseignement', 'GraduationCap', 'indigo', 110,
             ['crm', 'finance', 'marketing', 'hr'], ['CRM', 'Finance', 'Marketing', 'RH']),
            ('sol_logistique', 'Quelyos Logistique', 'logistique', 35, 324, 'Transport & entreposage', 'Truck', 'emerald', 120,
             ['stock', 'maintenance', 'finance', 'crm'], ['Stock', 'GMAO', 'Finance', 'CRM']),
        ]

        for code, name, slug, price, yearly, desc, icon, color, seq, modules, features in solutions_data:
            plans.append({
                **common,
                'code': code,
                'name': name,
                'description': desc,
                'plan_type': 'solution',
                'price_monthly': price,
                'price_yearly': yearly,
                'icon_name': icon,
                'color_theme': color,
                'sequence': 200 + seq,
                'solution_slug': slug,
                'solution_modules': json.dumps(modules),
                'features_marketing': json.dumps(features),
                'enabled_modules': json.dumps(modules),
            })

        # ── Pack utilisateurs ──
        plans.append({
            **common,
            'code': 'user_pack_5',
            'name': 'Pack +5 Utilisateurs',
            'description': '+5 utilisateurs supplémentaires',
            'plan_type': 'user_pack',
            'price_monthly': 15,
            'price_yearly': 140,
            'icon_name': 'Users',
            'color_theme': 'amber',
            'sequence': 400,
            'pack_size': 5,
            'features_marketing': json.dumps([
                '+5 utilisateurs',
                'Accès à tous les modules souscrits',
                'Support inclus',
            ]),
            'enabled_modules': json.dumps(['home']),
        })

        # ── Enterprise ──
        plans.append({
            **common,
            'code': 'enterprise',
            'name': 'Enterprise',
            'description': 'Solution sur mesure pour grandes entreprises',
            'plan_type': 'enterprise',
            'price_monthly': 0,
            'price_yearly': 0,
            'icon_name': 'Building2',
            'color_theme': 'violet',
            'sequence': 500,
            'features_marketing': json.dumps([
                'Utilisateurs illimités',
                'Tous les modules inclus',
                'SLA garanti 99.9%',
                'Account manager dédié',
                'Migration & onboarding',
                'API avancée',
            ]),
            'feature_api_access': True,
            'feature_priority_support': True,
            'feature_custom_domain': True,
            'enabled_modules': json.dumps(['home']),
        })

        return plans

    def _serialize_plan(self, plan):
        """Sérialise un plan pour l'API super-admin"""
        # Compter les subscribers
        Subscription = request.env['quelyos.subscription'].sudo()
        subscribers_count = Subscription.search_count([
            ('plan_id', '=', plan.id),
            ('state', 'in', ['active', 'trial'])
        ])

        try:
            features_marketing = json.loads(plan.features_marketing or '[]')
        except (json.JSONDecodeError, TypeError):
            features_marketing = []

        result = {
            'id': plan.id,
            'code': plan.code,
            'name': plan.name,
            'description': plan.description or '',
            'plan_type': plan.plan_type or 'module',
            'price_monthly': plan.price_monthly,
            'price_yearly': plan.price_yearly or plan.price_monthly * 12 * 0.8,
            'max_users': plan.max_users,
            'max_products': plan.max_products,
            'max_orders_per_year': plan.max_orders_per_year,
            'trial_days': plan.trial_days,
            'original_price': plan.original_price or 0,
            'badge_text': plan.badge_text or '',
            'cta_text': plan.cta_text or 'Essai gratuit 30 jours',
            'cta_href': plan.cta_href or '/register',
            'yearly_discount_pct': plan.yearly_discount_pct or 20,
            'features_marketing': features_marketing,
            'icon_name': plan.icon_name or 'Layers',
            'color_theme': plan.color_theme or 'emerald',
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
            # Nouveaux champs modulaires
            'module_key': plan.module_key or None,
            'limit_name': plan.limit_name or None,
            'limit_included': plan.limit_included,
            'surplus_price': plan.surplus_price,
            'surplus_unit': plan.surplus_unit,
            'users_included': plan.users_included,
            'pack_size': plan.pack_size,
            'solution_slug': plan.solution_slug or None,
        }

        # Modules inclus pour solutions métier
        if plan.plan_type == 'solution':
            try:
                result['solution_modules'] = json.loads(plan.solution_modules or '[]')
            except (json.JSONDecodeError, TypeError):
                result['solution_modules'] = []

        return result

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

        try:
            self._check_super_admin()
        except AccessDenied as e:
            return request.make_json_response(
                {'success': False, 'error': str(e)},
                headers=cors_headers, status=403
            )

        try:
            # Récupérer tous les utilisateurs avec groupe system (super admins)
            group = request.env.ref('base.group_system')
            users = group.sudo().user_ids.filtered(lambda u: u.active).sorted('name')

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
