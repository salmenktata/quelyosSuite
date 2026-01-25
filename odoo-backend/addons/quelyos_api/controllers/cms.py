# -*- coding: utf-8 -*-
"""
Contrôleurs CMS pour les menus, pages et configuration du site
"""
import logging
from odoo import http, fields
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class QuelyCMS(BaseController):
    """API CMS pour menus, pages et configuration"""

    # ==================== MENUS ====================

    @http.route('/api/ecommerce/menus/<string:code>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_menu(self, code, **kwargs):
        """
        Récupérer un menu par son code

        Args:
            code (str): Code du menu (ex: 'header', 'footer_quick', 'footer_service')

        Returns:
            dict: {
                'success': bool,
                'menu': {
                    'id': int,
                    'name': str,
                    'code': str,
                    'items': [...]
                },
                'error': str
            }
        """
        try:
            _logger.info(f"Récupération du menu: {code}")

            # Récupérer menu depuis modèle quelyos.menu
            menu = request.env['quelyos.menu'].sudo().search([
                ('code', '=', code),
                ('active', '=', True),
                ('parent_id', '=', False)  # Menu racine uniquement
            ], limit=1)

            if not menu:
                _logger.warning(f"Menu non trouvé: {code}")
                # Fallback sur config statique pour compatibilité
                return self._get_static_menu_fallback(code)

            # Construire l'arbre du menu
            menu_tree = menu.get_menu_tree()

            return {
                'success': True,
                'menu': {
                    'id': menu.id,
                    'name': menu.name,
                    'code': menu.code,
                    'items': menu_tree.get('children', [])
                }
            }

        except Exception as e:
            _logger.error(f"Get menu error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    def _get_static_menu_fallback(self, code):
        """Fallback menus statiques si aucune donnée en DB"""
        menus_config = {
            'header': {
                'id': 1,
                'name': 'Menu Principal',
                'code': 'header',
                'items': [
                    {
                        'id': 1,
                        'name': 'Accueil',
                        'url': '/',
                        'link_type': 'url',
                        'icon': None,
                        'css_class': None,
                        'open_in_new_tab': False,
                        'highlight': False,
                        'visibility': 'all',
                        'children': []
                    },
                    {
                        'id': 2,
                        'name': 'Produits',
                        'url': '/products',
                        'link_type': 'url',
                        'icon': None,
                        'css_class': None,
                        'open_in_new_tab': False,
                        'highlight': False,
                        'visibility': 'all',
                        'children': []
                    },
                    {
                        'id': 3,
                        'name': 'Contact',
                        'url': '/contact',
                        'link_type': 'url',
                        'icon': None,
                        'css_class': None,
                        'open_in_new_tab': False,
                        'highlight': False,
                        'visibility': 'all',
                        'children': []
                    }
                ]
            },
            'footer_quick': {
                'id': 2,
                'name': 'Liens Rapides Footer',
                'code': 'footer_quick',
                'items': [
                    {
                        'id': 10,
                        'name': 'À propos',
                        'url': '/about',
                        'link_type': 'page',
                        'icon': None,
                        'css_class': None,
                        'open_in_new_tab': False,
                        'highlight': False,
                        'visibility': 'all',
                        'children': []
                    },
                    {
                        'id': 11,
                        'name': 'Contact',
                        'url': '/contact',
                        'link_type': 'page',
                        'icon': None,
                        'css_class': None,
                        'open_in_new_tab': False,
                        'highlight': False,
                        'visibility': 'all',
                        'children': []
                    }
                ]
            },
            'footer_service': {
                'id': 3,
                'name': 'Service Client Footer',
                'code': 'footer_service',
                'items': [
                    {
                        'id': 20,
                        'name': 'Livraison',
                        'url': '/shipping',
                        'link_type': 'page',
                        'icon': None,
                        'css_class': None,
                        'open_in_new_tab': False,
                        'highlight': False,
                        'visibility': 'all',
                        'children': []
                    },
                    {
                        'id': 21,
                        'name': 'Retours',
                        'url': '/returns',
                        'link_type': 'page',
                        'icon': None,
                        'css_class': None,
                        'open_in_new_tab': False,
                        'highlight': False,
                        'visibility': 'all',
                        'children': []
                    },
                    {
                        'id': 22,
                        'name': 'CGV',
                        'url': '/terms',
                        'link_type': 'page',
                        'icon': None,
                        'css_class': None,
                        'open_in_new_tab': False,
                        'highlight': False,
                        'visibility': 'all',
                        'children': []
                    }
                ]
            }
        }

        menu = menus_config.get(code)
        if not menu:
            _logger.warning(f"Menu fallback non trouvé: {code}")
            return {'success': True, 'menu': None}

        return {'success': True, 'menu': menu}

    @http.route('/api/ecommerce/menus/list', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def list_menus(self, **kwargs):
        """Liste tous les menus (backoffice)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            menus = request.env['quelyos.menu'].sudo().search([
                ('parent_id', '=', False)
            ], order='sequence ASC')

            return {
                'success': True,
                'menus': [{
                    'id': m.id,
                    'code': m.code,
                    'name': m.name,
                    'label': m.label,
                    'url': m.url,
                    'icon': m.icon,
                    'active': m.active,
                    'children_count': len(m.child_ids),
                    'sequence': m.sequence
                } for m in menus]
            }

        except Exception as e:
            _logger.error(f"List menus error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/menus/create', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_menu(self, **kwargs):
        """Créer menu ou item"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            params = self._get_params()

            menu = request.env['quelyos.menu'].sudo().create({
                'name': params.get('name'),
                'code': params.get('code'),
                'label': params.get('label'),
                'url': params.get('url'),
                'icon': params.get('icon'),
                'description': params.get('description'),
                'parent_id': params.get('parent_id'),
                'sequence': params.get('sequence', 10),
                'active': params.get('active', True),
                'open_new_tab': params.get('open_new_tab', False),
                'requires_auth': params.get('requires_auth', False),
                'css_class': params.get('css_class'),
            })

            return {'success': True, 'id': menu.id}

        except Exception as e:
            _logger.error(f"Create menu error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/menus/<int:menu_id>/update', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def update_menu(self, menu_id, **kwargs):
        """Modifier menu"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            menu = request.env['quelyos.menu'].sudo().browse(menu_id)
            if not menu.exists():
                return {'success': False, 'error': 'Menu non trouvé'}

            params = self._get_params()
            menu.write({k: v for k, v in params.items() if k in [
                'name', 'code', 'label', 'url', 'icon', 'description',
                'parent_id', 'sequence', 'active', 'open_new_tab', 'requires_auth', 'css_class'
            ]})

            return {'success': True}

        except Exception as e:
            _logger.error(f"Update menu error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/menus/<int:menu_id>/delete', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def delete_menu(self, menu_id, **kwargs):
        """Supprimer menu (cascade enfants)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            menu = request.env['quelyos.menu'].sudo().browse(menu_id)
            if not menu.exists():
                return {'success': False, 'error': 'Menu non trouvé'}

            menu.unlink()
            return {'success': True}

        except Exception as e:
            _logger.error(f"Delete menu error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/menus/reorder', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def reorder_menus(self, **kwargs):
        """Réordonner menus/items"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error

            params = self._get_params()
            menu_ids = params.get('menu_ids', [])

            # Batch browse pour éviter N+1 queries
            menus = request.env['quelyos.menu'].sudo().browse(menu_ids)
            for index, menu in enumerate(menus):
                if menu.exists():
                    menu.write({'sequence': index * 10})

            return {'success': True}

        except Exception as e:
            _logger.error(f"Reorder menus error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/menus/<int:menu_id>/tree', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_menu_tree(self, menu_id, **kwargs):
        """Récupérer arbre complet d'un menu"""
        try:
            menu = request.env['quelyos.menu'].sudo().browse(menu_id)
            if not menu.exists():
                return {'success': False, 'error': 'Menu non trouvé'}

            return {
                'success': True,
                'tree': menu.get_menu_tree()
            }

        except Exception as e:
            _logger.error(f"Get menu tree error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    # ==================== RECHERCHES POPULAIRES ====================

    @http.route('/api/ecommerce/search/popular', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_popular_searches(self, **kwargs):
        """
        Récupérer les recherches populaires

        Args:
            limit (int): Nombre maximum de résultats (défaut: 5)

        Returns:
            dict: {
                'success': bool,
                'data': {
                    'popular_searches': [
                        {
                            'query': str,
                            'type': 'search' | 'category',
                            'count': int,
                            'category_id': int (optionnel)
                        }
                    ]
                },
                'error': str
            }
        """
        try:
            params = self._get_params()
            limit = params.get('limit', 5)

            _logger.info(f"Récupération des {limit} recherches populaires")

            # Récupérer les catégories les plus populaires (proxy pour recherches populaires)
            Category = request.env['product.public.category'].sudo()
            Product = request.env['product.template'].sudo()

            # Récupérer catégories avec comptage produits via read_group (1 requête au lieu de N)
            categories = Category.search([], limit=limit * 2)
            category_ids = categories.ids

            # Comptage groupé par catégorie (évite N+1 queries)
            product_counts = {}
            if category_ids:
                grouped = Product.read_group(
                    [('public_categ_ids', 'in', category_ids)],
                    ['public_categ_ids'],
                    ['public_categ_ids']
                )
                for g in grouped:
                    if g.get('public_categ_ids'):
                        cat_id = g['public_categ_ids'][0]
                        product_counts[cat_id] = g.get('public_categ_ids_count', 0)

            popular_searches = []
            for category in categories:
                product_count = product_counts.get(category.id, 0)
                if product_count > 0:
                    popular_searches.append({
                        'query': category.name,
                        'type': 'category',
                        'count': product_count,
                        'category_id': category.id
                    })

                    if len(popular_searches) >= limit:
                        break

            # Ajouter quelques recherches génériques si pas assez de catégories
            if len(popular_searches) < limit:
                generic_searches = [
                    {'query': 'nouveautés', 'type': 'search', 'count': 100},
                    {'query': 'promotions', 'type': 'search', 'count': 85},
                    {'query': 'meilleures ventes', 'type': 'search', 'count': 75},
                ]

                for search in generic_searches:
                    if len(popular_searches) >= limit:
                        break
                    popular_searches.append(search)

            return {
                'success': True,
                'data': {
                    'popular_searches': popular_searches[:limit]
                }
            }

        except Exception as e:
            _logger.error(f"Get popular searches error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    # ==================== CONFIGURATION DU SITE ====================

    @http.route('/api/ecommerce/site-config', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_site_config(self, **kwargs):
        """
        Récupérer la configuration globale du site

        Returns:
            dict: Configuration complète du site selon l'interface SiteConfig du frontend
        """
        try:
            _logger.info("Récupération de la configuration du site")

            # Récupérer la configuration depuis ir.config_parameter
            get_param = request.env['ir.config_parameter'].sudo().get_param

            # Configuration de base
            Company = request.env['res.company'].sudo()
            company = Company.search([], limit=1)

            # Helper pour formater le téléphone (format Tunisie)
            def format_phone(phone):
                if not phone:
                    return ''
                # Nettoyer le téléphone
                cleaned = phone.replace(' ', '').replace('-', '').replace('.', '')
                # Format +216XXXXXXXX -> +216 XX XXX XXX
                if cleaned.startswith('+216') and len(cleaned) == 12:
                    return f"+216 {cleaned[4:6]} {cleaned[6:9]} {cleaned[9:]}"
                return phone

            phone = get_param('quelyos.contact_phone', company.phone if company else '+21600000000')
            email = get_param('quelyos.contact_email', company.email if company else 'contact@quelyos.com')
            site_name = get_param('quelyos.site_name', company.name if company else 'Quelyos')

            # Configuration complète selon l'interface SiteConfig du frontend
            config = {
                'brand': {
                    'name': site_name,
                    'slogan': get_param('quelyos.brand_slogan', 'Boutique en ligne'),
                    'description': get_param('quelyos.brand_description', 'Votre boutique en ligne de confiance'),
                    'email': email,
                    'phone': phone,
                    'phoneFormatted': format_phone(phone),
                    'whatsapp': get_param('quelyos.whatsapp', phone.replace('+', '').replace(' ', '') if phone else '21600000000'),
                },
                'social': {
                    'facebook': get_param('quelyos.social_facebook', ''),
                    'instagram': get_param('quelyos.social_instagram', ''),
                    'twitter': get_param('quelyos.social_twitter', ''),
                    'youtube': get_param('quelyos.social_youtube', ''),
                    'linkedin': get_param('quelyos.social_linkedin', ''),
                    'tiktok': get_param('quelyos.social_tiktok', ''),
                },
                'shipping': {
                    'freeThreshold': float(get_param('quelyos.shipping_free_threshold', '150')),
                    'standardDaysMin': int(get_param('quelyos.shipping_standard_days_min', '2')),
                    'standardDaysMax': int(get_param('quelyos.shipping_standard_days_max', '5')),
                    'expressDaysMin': int(get_param('quelyos.shipping_express_days_min', '1')),
                    'expressDaysMax': int(get_param('quelyos.shipping_express_days_max', '2')),
                },
                'returns': {
                    'windowDays': int(get_param('quelyos.returns_window_days', '30')),
                    'refundDaysMin': int(get_param('quelyos.returns_refund_days_min', '7')),
                    'refundDaysMax': int(get_param('quelyos.returns_refund_days_max', '10')),
                    'warrantyYears': int(get_param('quelyos.warranty_years', '2')),
                },
                'customerService': {
                    'hoursStart': int(get_param('quelyos.customer_service_hours_start', '9')),
                    'hoursEnd': int(get_param('quelyos.customer_service_hours_end', '18')),
                    'days': get_param('quelyos.customer_service_days', 'lundi au vendredi'),
                },
                'loyalty': {
                    'pointsRatio': float(get_param('quelyos.loyalty_points_ratio', '1')),
                    'defaultDiscountPercent': float(get_param('quelyos.loyalty_default_discount_percent', '20')),
                },
                'currency': {
                    'code': company.currency_id.name if company and company.currency_id else 'TND',
                    'symbol': get_param('quelyos.currency_symbol', 'TND'),
                },
                'seo': {
                    'siteUrl': get_param('web.base.url', 'http://localhost:3000'),
                    'title': get_param('quelyos.seo_title', f'{site_name} E-commerce'),
                    'description': get_param('quelyos.seo_description', 'Boutique en ligne'),
                },
                'features': {
                    'wishlist': get_param('quelyos.wishlist_enabled', 'True') == 'True',
                    'comparison': get_param('quelyos.comparison_enabled', 'True') == 'True',
                    'reviews': get_param('quelyos.reviews_enabled', 'True') == 'True',
                    'guestCheckout': get_param('quelyos.guest_checkout', 'False') == 'True',
                    'newsletter': get_param('quelyos.newsletter_enabled', 'True') == 'True',
                },
                'newsletter': {
                    'delaySeconds': int(get_param('quelyos.newsletter_delay_seconds', '30')),
                    'exitIntentEnabled': get_param('quelyos.newsletter_exit_intent', 'True') == 'True',
                },
                'assets': {
                    'logoUrl': get_param('quelyos.logo_url', ''),
                    'primaryColor': get_param('quelyos.primary_color', '#01613a'),
                    'secondaryColor': get_param('quelyos.secondary_color', '#c9c18f'),
                }
            }

            return {
                'success': True,
                'data': {
                    'config': config
                }
            }

        except Exception as e:
            _logger.error(f"Get site config error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/site-config/update', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def update_site_config(self, **kwargs):
        """
        Mettre à jour la configuration du site (ADMIN UNIQUEMENT)

        Paramètres supportés:
            - shipping: { freeThreshold, standardDaysMin, standardDaysMax, expressDaysMin, expressDaysMax }
        - returns: { windowDays, refundDaysMin, refundDaysMax, warrantyYears }
        - brand: { name, slogan, description, email, phone, whatsapp }
        - social: { facebook, instagram, twitter, youtube, linkedin, tiktok }
        - loyalty: { pointsRatio, defaultDiscountPercent }
        - features: { wishlist, comparison, reviews, guestCheckout, newsletter }
        - newsletter: { delaySeconds, exitIntentEnabled }
        - assets: { logoUrl, primaryColor, secondaryColor }
        """
        try:
            # Authentifier via le header X-Session-Id (pour les requêtes sans cookies)
            error = self._authenticate_from_header()
            if error:
                return error

            # SECURITE : Vérifier que l'utilisateur a les droits admin

            params = self._get_params()

            set_param = request.env['ir.config_parameter'].sudo().set_param

            # Mapping des paramètres frontend -> Odoo
            param_mapping = {
                # Shipping
                'shipping.freeThreshold': 'quelyos.shipping_free_threshold',
                'shipping.standardDaysMin': 'quelyos.shipping_standard_days_min',
                'shipping.standardDaysMax': 'quelyos.shipping_standard_days_max',
                'shipping.expressDaysMin': 'quelyos.shipping_express_days_min',
                'shipping.expressDaysMax': 'quelyos.shipping_express_days_max',
                # Returns
                'returns.windowDays': 'quelyos.returns_window_days',
                'returns.refundDaysMin': 'quelyos.returns_refund_days_min',
                'returns.refundDaysMax': 'quelyos.returns_refund_days_max',
                'returns.warrantyYears': 'quelyos.warranty_years',
                # Brand
                'brand.name': 'quelyos.site_name',
                'brand.slogan': 'quelyos.brand_slogan',
                'brand.description': 'quelyos.brand_description',
                'brand.email': 'quelyos.contact_email',
                'brand.phone': 'quelyos.contact_phone',
                'brand.whatsapp': 'quelyos.whatsapp',
                # Social
                'social.facebook': 'quelyos.social_facebook',
                'social.instagram': 'quelyos.social_instagram',
                'social.twitter': 'quelyos.social_twitter',
                'social.youtube': 'quelyos.social_youtube',
                'social.linkedin': 'quelyos.social_linkedin',
                'social.tiktok': 'quelyos.social_tiktok',
                # Loyalty
                'loyalty.pointsRatio': 'quelyos.loyalty_points_ratio',
                'loyalty.defaultDiscountPercent': 'quelyos.loyalty_default_discount_percent',
                # Features
                'features.wishlist': 'quelyos.wishlist_enabled',
                'features.comparison': 'quelyos.comparison_enabled',
                'features.reviews': 'quelyos.reviews_enabled',
                'features.guestCheckout': 'quelyos.guest_checkout',
                'features.newsletter': 'quelyos.newsletter_enabled',
                # Newsletter
                'newsletter.delaySeconds': 'quelyos.newsletter_delay_seconds',
                'newsletter.exitIntentEnabled': 'quelyos.newsletter_exit_intent',
                # Assets
                'assets.logoUrl': 'quelyos.logo_url',
                'assets.primaryColor': 'quelyos.primary_color',
                'assets.secondaryColor': 'quelyos.secondary_color',
            }

            updated = []

            # Mapping pour les paramètres plats (utilisés par le backoffice simple)
            flat_param_mapping = {
                'compare_enabled': 'quelyos.feature.compare_enabled',
                'wishlist_enabled': 'quelyos.feature.wishlist_enabled',
                'reviews_enabled': 'quelyos.feature.reviews_enabled',
                'newsletter_enabled': 'quelyos.feature.newsletter_enabled',
            }

            # Traiter les paramètres plats (compare_enabled, wishlist_enabled, etc.)
            for key, odoo_key in flat_param_mapping.items():
                if key in params:
                    value = 'true' if params[key] else 'false'
                    set_param(odoo_key, value)
                    updated.append(key)
                    _logger.info(f"Updated site config: {key} -> {value}")

            # Traiter les paramètres imbriqués
            for section in ['shipping', 'returns', 'brand', 'social', 'loyalty', 'features', 'newsletter', 'assets']:
                if section in params and isinstance(params[section], dict):
                    for key, value in params[section].items():
                        full_key = f"{section}.{key}"
                        if full_key in param_mapping:
                            odoo_key = param_mapping[full_key]
                            # Convertir les booléens en chaînes
                            if isinstance(value, bool):
                                value = 'True' if value else 'False'
                            set_param(odoo_key, str(value))
                            updated.append(full_key)
                            _logger.info(f"Updated site config: {full_key} -> {value}")

            # Récupérer la configuration mise à jour pour les paramètres simples
            get_param = request.env['ir.config_parameter'].sudo().get_param
            config_data = {
                'compare_enabled': get_param('quelyos.feature.compare_enabled', 'true') == 'true',
                'wishlist_enabled': get_param('quelyos.feature.wishlist_enabled', 'true') == 'true',
                'reviews_enabled': get_param('quelyos.feature.reviews_enabled', 'true') == 'true',
                'newsletter_enabled': get_param('quelyos.feature.newsletter_enabled', 'true') == 'true',
            }

            return {
                'success': True,
                'data': config_data,
                'message': f'Configuration mise à jour ({len(updated)} paramètre(s))',
                'updated': updated
            }

        except Exception as e:
            _logger.error(f"Update site config error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    # ==================== HERO SLIDES ====================

    @http.route('/api/ecommerce/hero-slides', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_hero_slides(self, **kwargs):
        """Liste slides actifs pour homepage (cache 5min côté client)"""
        try:
            today = fields.Date.today()
            slides = request.env['quelyos.hero.slide'].sudo().search([
                ('active', '=', True),
                ('start_date', '<=', today),
                ('end_date', '>=', today)
            ], order='sequence ASC')

            return {
                'success': True,
                'slides': [{
                    'id': s.id,
                    'title': s.title,
                    'subtitle': s.subtitle,
                    'description': s.description,
                    'image_url': s.image_url,
                    'cta_text': s.cta_text,
                    'cta_link': s.cta_link,
                    'cta_secondary_text': s.cta_secondary_text,
                    'cta_secondary_link': s.cta_secondary_link,
                    'sequence': s.sequence
                } for s in slides]
            }
        except Exception as e:
            _logger.error(f"Get hero slides error: {e}")
            return {'success': True, 'slides': []}  # Fallback gracieux

    @http.route('/api/ecommerce/hero-slides/create', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_hero_slide(self, **kwargs):
        """Créer slide (ADMIN)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            params = self._get_params()

            slide = request.env['quelyos.hero.slide'].sudo().create({
                'name': params.get('name'),
                'title': params.get('title'),
                'subtitle': params.get('subtitle'),
                'description': params.get('description'),
                'cta_text': params.get('cta_text'),
                'cta_link': params.get('cta_link'),
                'cta_secondary_text': params.get('cta_secondary_text'),
                'cta_secondary_link': params.get('cta_secondary_link'),
                'sequence': params.get('sequence', 10),
                'active': params.get('active', True),
                'start_date': params.get('start_date'),
                'end_date': params.get('end_date'),
            })

            return {'success': True, 'id': slide.id}

        except Exception as e:
            _logger.error(f"Create hero slide error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/hero-slides/<int:slide_id>/update', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def update_hero_slide(self, slide_id, **kwargs):
        """Modifier slide (ADMIN)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            params = self._get_params()

            slide = request.env['quelyos.hero.slide'].sudo().browse(slide_id)
            if not slide.exists():
                return {'success': False, 'error': 'Slide non trouvé'}

            slide.write({k: v for k, v in params.items() if k in [
                'name', 'title', 'subtitle', 'description', 'cta_text', 'cta_link',
                'cta_secondary_text', 'cta_secondary_link', 'sequence', 'active',
                'start_date', 'end_date'
            ]})

            return {'success': True}

        except Exception as e:
            _logger.error(f"Update hero slide error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/hero-slides/<int:slide_id>/delete', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def delete_hero_slide(self, slide_id, **kwargs):
        """Supprimer slide (ADMIN)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            slide = request.env['quelyos.hero.slide'].sudo().browse(slide_id)
            if not slide.exists():
                return {'success': False, 'error': 'Slide non trouvé'}

            slide.unlink()
            return {'success': True}

        except Exception as e:
            _logger.error(f"Delete hero slide error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/hero-slides/reorder', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def reorder_hero_slides(self, **kwargs):
        """Réordonner slides (drag & drop)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            params = self._get_params()
            slide_ids = params.get('slide_ids', [])

            # Batch browse pour éviter N+1 queries
            slides = request.env['quelyos.hero.slide'].sudo().browse(slide_ids)
            for index, slide in enumerate(slides):
                if slide.exists():
                    slide.write({'sequence': index * 10})

            return {'success': True}

        except Exception as e:
            _logger.error(f"Reorder hero slides error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    # ==================== PROMO BANNERS ====================

    @http.route('/api/ecommerce/promo-banners', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_promo_banners(self, **kwargs):
        """Liste bannières actives pour homepage"""
        try:
            today = fields.Date.today()
            banners = request.env['quelyos.promo.banner'].sudo().search([
                ('active', '=', True),
                ('start_date', '<=', today),
                ('end_date', '>=', today)
            ], order='sequence ASC', limit=2)

            return {
                'success': True,
                'banners': [{
                    'id': b.id,
                    'title': b.title,
                    'description': b.description,
                    'tag': b.tag,
                    'gradient': b.gradient,
                    'tag_color': b.tag_color,
                    'button_bg': b.button_bg,
                    'image_url': b.image_url,
                    'cta_text': b.cta_text,
                    'cta_link': b.cta_link,
                    'sequence': b.sequence
                } for b in banners]
            }
        except Exception as e:
            _logger.error(f"Get promo banners error: {e}")
            return {'success': True, 'banners': []}

    @http.route('/api/ecommerce/promo-banners/create', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_promo_banner(self, **kwargs):
        """Créer bannière (ADMIN)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            params = self._get_params()
            banner = request.env['quelyos.promo.banner'].sudo().create({
                'name': params.get('name'),
                'title': params.get('title'),
                'description': params.get('description'),
                'tag': params.get('tag'),
                'gradient': params.get('gradient', 'blue'),
                'tag_color': params.get('tag_color', 'blue'),
                'button_bg': params.get('button_bg', 'white'),
                'cta_text': params.get('cta_text'),
                'cta_link': params.get('cta_link'),
                'sequence': params.get('sequence', 10),
                'active': params.get('active', True),
                'start_date': params.get('start_date'),
                'end_date': params.get('end_date'),
            })

            return {'success': True, 'id': banner.id}

        except Exception as e:
            _logger.error(f"Create promo banner error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/promo-banners/<int:banner_id>/update', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def update_promo_banner(self, banner_id, **kwargs):
        """Modifier bannière (ADMIN)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            params = self._get_params()
            banner = request.env['quelyos.promo.banner'].sudo().browse(banner_id)
            if not banner.exists():
                return {'success': False, 'error': 'Bannière non trouvée'}

            banner.write({k: v for k, v in params.items() if k in [
                'name', 'title', 'description', 'tag', 'gradient', 'tag_color',
                'button_bg', 'cta_text', 'cta_link', 'sequence', 'active',
                'start_date', 'end_date'
            ]})

            return {'success': True}

        except Exception as e:
            _logger.error(f"Update promo banner error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/promo-banners/<int:banner_id>/delete', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def delete_promo_banner(self, banner_id, **kwargs):
        """Supprimer bannière (ADMIN)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            banner = request.env['quelyos.promo.banner'].sudo().browse(banner_id)
            if not banner.exists():
                return {'success': False, 'error': 'Bannière non trouvée'}

            banner.unlink()
            return {'success': True}

        except Exception as e:
            _logger.error(f"Delete promo banner error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/promo-banners/reorder', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def reorder_promo_banners(self, **kwargs):
        """Réordonner bannières"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            params = self._get_params()
            banner_ids = params.get('banner_ids', [])

            # Batch browse pour éviter N+1 queries
            banners = request.env['quelyos.promo.banner'].sudo().browse(banner_ids)
            for index, banner in enumerate(banners):
                if banner.exists():
                    banner.write({'sequence': index * 10})

            return {'success': True}

        except Exception as e:
            _logger.error(f"Reorder promo banners error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    # ==================== PROMO MESSAGES ====================

    @http.route('/api/ecommerce/promo-messages', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_promo_messages(self, **kwargs):
        """Liste messages actifs pour PromoBar"""
        try:
            today = fields.Date.today()
            messages = request.env['quelyos.promo.message'].sudo().search([
                ('active', '=', True),
                ('start_date', '<=', today),
                ('end_date', '>=', today)
            ], order='sequence ASC')

            return {
                'success': True,
                'messages': [{
                    'id': m.id,
                    'text': m.text,
                    'icon': m.icon,
                    'sequence': m.sequence
                } for m in messages]
            }
        except Exception as e:
            _logger.error(f"Get promo messages error: {e}")
            return {'success': True, 'messages': []}

    @http.route('/api/ecommerce/promo-messages/create', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_promo_message(self, **kwargs):
        """Créer message (ADMIN)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            params = self._get_params()
            message = request.env['quelyos.promo.message'].sudo().create({
                'name': params.get('name'),
                'text': params.get('text'),
                'icon': params.get('icon', 'truck'),
                'sequence': params.get('sequence', 10),
                'active': params.get('active', True),
                'start_date': params.get('start_date'),
                'end_date': params.get('end_date'),
            })

            return {'success': True, 'id': message.id}

        except Exception as e:
            _logger.error(f"Create promo message error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/promo-messages/<int:message_id>/update', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def update_promo_message(self, message_id, **kwargs):
        """Modifier message (ADMIN)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            params = self._get_params()
            message = request.env['quelyos.promo.message'].sudo().browse(message_id)
            if not message.exists():
                return {'success': False, 'error': 'Message non trouvé'}

            message.write({k: v for k, v in params.items() if k in [
                'name', 'text', 'icon', 'sequence', 'active', 'start_date', 'end_date'
            ]})

            return {'success': True}

        except Exception as e:
            _logger.error(f"Update promo message error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/promo-messages/<int:message_id>/delete', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def delete_promo_message(self, message_id, **kwargs):
        """Supprimer message (ADMIN)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            message = request.env['quelyos.promo.message'].sudo().browse(message_id)
            if not message.exists():
                return {'success': False, 'error': 'Message non trouvé'}

            message.unlink()
            return {'success': True}

        except Exception as e:
            _logger.error(f"Delete promo message error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/promo-messages/reorder', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def reorder_promo_messages(self, **kwargs):
        """Réordonner messages"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            params = self._get_params()
            message_ids = params.get('message_ids', [])

            for index, message_id in enumerate(message_ids):
                message = request.env['quelyos.promo.message'].sudo().browse(message_id)
                if message.exists():
                    message.write({'sequence': index * 10})

            return {'success': True}

        except Exception as e:
            _logger.error(f"Reorder promo messages error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    # ==================== TRUST BADGES ====================

    @http.route('/api/ecommerce/trust-badges', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_trust_badges(self, **kwargs):
        """Liste badges actifs pour footer"""
        try:
            badges = request.env['quelyos.trust.badge'].sudo().search([
                ('active', '=', True)
            ], order='sequence ASC', limit=4)

            return {
                'success': True,
                'badges': [{
                    'id': b.id,
                    'title': b.title,
                    'subtitle': b.subtitle,
                    'icon': b.icon,
                    'sequence': b.sequence
                } for b in badges]
            }
        except Exception as e:
            _logger.error(f"Get trust badges error: {e}")
            return {'success': True, 'badges': []}

    @http.route('/api/ecommerce/trust-badges/create', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_trust_badge(self, **kwargs):
        """Créer badge (ADMIN)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            params = self._get_params()
            badge = request.env['quelyos.trust.badge'].sudo().create({
                'name': params.get('name'),
                'title': params.get('title'),
                'subtitle': params.get('subtitle'),
                'icon': params.get('icon', 'creditcard'),
                'sequence': params.get('sequence', 10),
                'active': params.get('active', True),
            })

            return {'success': True, 'id': badge.id}

        except Exception as e:
            _logger.error(f"Create trust badge error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/trust-badges/<int:badge_id>/update', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def update_trust_badge(self, badge_id, **kwargs):
        """Modifier badge (ADMIN)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            params = self._get_params()
            badge = request.env['quelyos.trust.badge'].sudo().browse(badge_id)
            if not badge.exists():
                return {'success': False, 'error': 'Badge non trouvé'}

            badge.write({k: v for k, v in params.items() if k in [
                'name', 'title', 'subtitle', 'icon', 'sequence', 'active'
            ]})

            return {'success': True}

        except Exception as e:
            _logger.error(f"Update trust badge error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/trust-badges/<int:badge_id>/delete', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def delete_trust_badge(self, badge_id, **kwargs):
        """Supprimer badge (ADMIN)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            badge = request.env['quelyos.trust.badge'].sudo().browse(badge_id)
            if not badge.exists():
                return {'success': False, 'error': 'Badge non trouvé'}

            badge.unlink()
            return {'success': True}

        except Exception as e:
            _logger.error(f"Delete trust badge error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/trust-badges/reorder', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def reorder_trust_badges(self, **kwargs):
        """Réordonner badges"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            params = self._get_params()
            badge_ids = params.get('badge_ids', [])

            for index, badge_id in enumerate(badge_ids):
                badge = request.env['quelyos.trust.badge'].sudo().browse(badge_id)
                if badge.exists():
                    badge.write({'sequence': index * 10})

            return {'success': True}

        except Exception as e:
            _logger.error(f"Reorder trust badges error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    # ==================== IMAGE UPLOADS ====================

    @http.route('/api/ecommerce/hero-slides/<int:slide_id>/upload-image', type='http', auth='user', methods=['POST'], csrf=False, cors='*')
    def upload_hero_slide_image(self, slide_id, **kwargs):
        """Upload image pour hero slide"""
        try:
            error = self._authenticate_from_header()
            if error:
                return request.make_json_response(error)



            tenant = request.env['quelyos.tenant'].sudo().browse(tenant_id)
            if not tenant.exists():
                return {'success': False, 'error': 'Tenant non trouvé'}

            params = self._get_params()
            theme_data = {}

            # Couleurs
            if 'colors' in params:
                color_mapping = {
                    'primary': 'primary_color',
                    'primary_dark': 'primary_dark',
                    'primary_light': 'primary_light',
                    'secondary': 'secondary_color',
                    'secondary_dark': 'secondary_dark',
                    'secondary_light': 'secondary_light',
                    'accent': 'accent_color',
                    'background': 'background_color',
                    'foreground': 'foreground_color',
                    'muted': 'muted_color',
                    'muted_foreground': 'muted_foreground',
                    'border': 'border_color',
                    'ring': 'ring_color'
                }
                for key, field in color_mapping.items():
                    if key in params['colors']:
                        theme_data[field] = params['colors'][key]

            # Polices
            if 'fonts' in params and 'family' in params['fonts']:
                theme_data['font_family'] = params['fonts']['family']

            # Options
            if 'options' in params:
                if 'enable_dark_mode' in params['options']:
                    theme_data['enable_dark_mode'] = params['options']['enable_dark_mode']
                if 'default_dark' in params['options']:
                    theme_data['default_dark'] = params['options']['default_dark']

            tenant.write(theme_data)

            return {'success': True}

        except Exception as e:
            _logger.error(f"Update tenant theme error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/tenants/<int:tenant_id>/upload-logo', type='http', auth='user', methods=['POST'], csrf=False, cors='*')
    def upload_tenant_logo(self, tenant_id, **kwargs):
        """Upload logo tenant"""
        try:
            error = self._authenticate_from_header()
            if error:
                return request.make_json_response(error)


            tenant = request.env['quelyos.tenant'].sudo().browse(tenant_id)
            if not tenant.exists():
                return request.make_json_response({'success': False, 'error': 'Tenant non trouvé'})

            image_file = request.httprequest.files.get('image')
            if not image_file:
                return request.make_json_response({'success': False, 'error': 'Aucune image fournie'})

            import base64
            image_data = base64.b64encode(image_file.read())
            tenant.write({'logo': image_data, 'logo_filename': image_file.filename})

            return request.make_json_response({'success': True, 'logo_url': tenant.logo_url})

        except Exception as e:
            _logger.error(f"Upload tenant logo error: {e}")
            return request.make_json_response({'success': False, 'error': 'Une erreur est survenue'})

    @http.route('/api/ecommerce/tenants/<int:tenant_id>/upload-favicon', type='http', auth='user', methods=['POST'], csrf=False, cors='*')
    def upload_tenant_favicon(self, tenant_id, **kwargs):
        """Upload favicon tenant"""
        try:
            error = self._authenticate_from_header()
            if error:
                return request.make_json_response(error)


            tenant = request.env['quelyos.tenant'].sudo().browse(tenant_id)
            if not tenant.exists():
                return request.make_json_response({'success': False, 'error': 'Tenant non trouvé'})

            image_file = request.httprequest.files.get('image')
            if not image_file:
                return request.make_json_response({'success': False, 'error': 'Aucune image fournie'})

            import base64
            image_data = base64.b64encode(image_file.read())
            tenant.write({'favicon': image_data, 'favicon_filename': image_file.filename})

            return request.make_json_response({'success': True, 'favicon_url': tenant.favicon_url})

        except Exception as e:
            _logger.error(f"Upload tenant favicon error: {e}")
            return request.make_json_response({'success': False, 'error': 'Une erreur est survenue'})

    # ============================================
    # SEO METADATA
    # ============================================

    @http.route('/api/ecommerce/seo-metadata', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def get_seo_metadata_list(self, **kwargs):
        """Liste toutes les metadata SEO (admin)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            metadata = request.env['quelyos.seo.metadata'].sudo().search([], limit=500, order='id desc')

            return {
                'success': True,
                'metadata': [{
                    'id': m.id,
                    'name': m.name,
                    'page_type': m.page_type,
                    'slug': m.slug,
                    'meta_title': m.meta_title,
                    'meta_description': m.meta_description,
                    'seo_score': m.seo_score,
                    'active': m.active,
                } for m in metadata]
            }

        except Exception as e:
            _logger.error(f"Get SEO metadata list error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/seo-metadata/<string:slug>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_seo_metadata_by_slug(self, slug, **kwargs):
        """Récupérer metadata SEO par slug (public, pour frontend)"""
        try:
            metadata_obj = request.env['quelyos.seo.metadata'].sudo()
            metadata = metadata_obj.get_by_slug(slug)

            if metadata:
                return {'success': True, 'metadata': metadata}
            else:
                return {'success': False, 'error': 'Metadata non trouvé'}

        except Exception as e:
            _logger.error(f"Get SEO metadata by slug error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/seo-metadata/create', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_seo_metadata(self, **kwargs):
        """Créer metadata SEO (admin)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            params = request.jsonrequest
            metadata = request.env['quelyos.seo.metadata'].sudo().create({
                'name': params.get('name'),
                'page_type': params.get('page_type', 'static'),
                'slug': params.get('slug'),
                'meta_title': params.get('meta_title'),
                'meta_description': params.get('meta_description'),
                'og_title': params.get('og_title'),
                'og_description': params.get('og_description'),
                'og_image_url': params.get('og_image_url'),
                'og_type': params.get('og_type', 'website'),
                'twitter_card': params.get('twitter_card', 'summary_large_image'),
                'twitter_title': params.get('twitter_title'),
                'twitter_description': params.get('twitter_description'),
                'twitter_image_url': params.get('twitter_image_url'),
                'schema_type': params.get('schema_type', 'WebPage'),
                'noindex': params.get('noindex', False),
                'nofollow': params.get('nofollow', False),
                'canonical_url': params.get('canonical_url'),
                'keywords': params.get('keywords'),
                'focus_keyword': params.get('focus_keyword'),
                'active': params.get('active', True),
            })

            return {'success': True, 'id': metadata.id}

        except Exception as e:
            _logger.error(f"Create SEO metadata error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/seo-metadata/<int:metadata_id>/update', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def update_seo_metadata(self, metadata_id, **kwargs):
        """Modifier metadata SEO (admin)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            metadata = request.env['quelyos.seo.metadata'].sudo().browse(metadata_id)
            if not metadata.exists():
                return {'success': False, 'error': 'Metadata non trouvé'}

            params = request.jsonrequest
            update_data = {}

            allowed_fields = [
                'name', 'page_type', 'slug', 'meta_title', 'meta_description',
                'og_title', 'og_description', 'og_image_url', 'og_type',
                'twitter_card', 'twitter_title', 'twitter_description', 'twitter_image_url',
                'schema_type', 'noindex', 'nofollow', 'canonical_url',
                'keywords', 'focus_keyword', 'active'
            ]

            for field in allowed_fields:
                if field in params:
                    update_data[field] = params[field]

            metadata.write(update_data)

            return {'success': True}

        except Exception as e:
            _logger.error(f"Update SEO metadata error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/seo-metadata/<int:metadata_id>/delete', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def delete_seo_metadata(self, metadata_id, **kwargs):
        """Supprimer metadata SEO (admin)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            metadata = request.env['quelyos.seo.metadata'].sudo().browse(metadata_id)
            if not metadata.exists():
                return {'success': False, 'error': 'Metadata non trouvé'}

            metadata.unlink()

            return {'success': True}

        except Exception as e:
            _logger.error(f"Delete SEO metadata error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    # ============================================
    # MARKETING POPUPS
    # ============================================

    @http.route('/api/ecommerce/popups/active', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_active_popups(self, page_path='/', **kwargs):
        """Récupérer popups actives pour une page (public, frontend)"""
        try:
            popup_obj = request.env['quelyos.marketing.popup'].sudo()
            popups = popup_obj.get_active_popups(page_path)

            return {'success': True, 'popups': popups}

        except Exception as e:
            _logger.error(f"Get active popups error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/popups', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def get_popups_list(self, **kwargs):
        """Liste toutes les popups (admin)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            popups = request.env['quelyos.marketing.popup'].sudo().search([], limit=100, order='id desc')

            return {
                'success': True,
                'popups': [{
                    'id': p.id,
                    'name': p.name,
                    'popup_type': p.popup_type,
                    'title': p.title,
                    'trigger_type': p.trigger_type,
                    'target_pages': p.target_pages,
                    'active': p.active,
                    'views_count': p.views_count,
                    'clicks_count': p.clicks_count,
                    'conversion_rate': p.conversion_rate,
                } for p in popups]
            }

        except Exception as e:
            _logger.error(f"Get popups list error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/popups/create', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_popup(self, **kwargs):
        """Créer popup (admin)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            params = request.jsonrequest
            popup = request.env['quelyos.marketing.popup'].sudo().create({
                'name': params.get('name'),
                'popup_type': params.get('popup_type', 'promotion'),
                'title': params.get('title'),
                'subtitle': params.get('subtitle'),
                'content': params.get('content'),
                'image_url': params.get('image_url'),
                'cta_text': params.get('cta_text'),
                'cta_link': params.get('cta_link'),
                'cta_color': params.get('cta_color', '#01613a'),
                'show_close_button': params.get('show_close_button', True),
                'close_text': params.get('close_text', 'Non merci'),
                'trigger_type': params.get('trigger_type', 'delay'),
                'trigger_delay': params.get('trigger_delay', 3),
                'trigger_scroll_percent': params.get('trigger_scroll_percent', 50),
                'target_pages': params.get('target_pages', 'all'),
                'custom_pages': params.get('custom_pages'),
                'show_once_per_session': params.get('show_once_per_session', True),
                'show_once_per_user': params.get('show_once_per_user', False),
                'cookie_duration_days': params.get('cookie_duration_days', 30),
                'start_date': params.get('start_date'),
                'end_date': params.get('end_date'),
                'position': params.get('position', 'center'),
                'overlay_opacity': params.get('overlay_opacity', 0.5),
                'max_width': params.get('max_width', 500),
                'background_color': params.get('background_color', '#ffffff'),
                'text_color': params.get('text_color', '#000000'),
                'sequence': params.get('sequence', 10),
                'active': params.get('active', True),
            })

            return {'success': True, 'id': popup.id}

        except Exception as e:
            _logger.error(f"Create popup error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/popups/<int:popup_id>/update', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def update_popup(self, popup_id, **kwargs):
        """Modifier popup (admin)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            popup = request.env['quelyos.marketing.popup'].sudo().browse(popup_id)
            if not popup.exists():
                return {'success': False, 'error': 'Popup non trouvé'}

            params = request.jsonrequest
            update_data = {}

            allowed_fields = [
                'name', 'popup_type', 'title', 'subtitle', 'content', 'image_url',
                'cta_text', 'cta_link', 'cta_color', 'show_close_button', 'close_text',
                'trigger_type', 'trigger_delay', 'trigger_scroll_percent',
                'target_pages', 'custom_pages', 'show_once_per_session', 'show_once_per_user',
                'cookie_duration_days', 'start_date', 'end_date', 'position',
                'overlay_opacity', 'max_width', 'background_color', 'text_color',
                'sequence', 'active'
            ]

            for field in allowed_fields:
                if field in params:
                    update_data[field] = params[field]

            popup.write(update_data)

            return {'success': True}

        except Exception as e:
            _logger.error(f"Update popup error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/popups/<int:popup_id>/delete', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def delete_popup(self, popup_id, **kwargs):
        """Supprimer popup (admin)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            popup = request.env['quelyos.marketing.popup'].sudo().browse(popup_id)
            if not popup.exists():
                return {'success': False, 'error': 'Popup non trouvé'}

            popup.unlink()

            return {'success': True}

        except Exception as e:
            _logger.error(f"Delete popup error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/popups/<int:popup_id>/track-view', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def track_popup_view(self, popup_id, **kwargs):
        """Enregistrer vue popup (analytics)"""
        try:
            popup = request.env['quelyos.marketing.popup'].sudo().browse(popup_id)
            if popup.exists():
                popup.increment_views()
                return {'success': True}
            return {'success': False, 'error': 'Popup non trouvé'}

        except Exception as e:
            _logger.error(f"Track popup view error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/popups/<int:popup_id>/track-click', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def track_popup_click(self, popup_id, **kwargs):
        """Enregistrer clic CTA popup (analytics)"""
        try:
            popup = request.env['quelyos.marketing.popup'].sudo().browse(popup_id)
            if popup.exists():
                popup.increment_clicks()
                return {'success': True}
            return {'success': False, 'error': 'Popup non trouvé'}

        except Exception as e:
            _logger.error(f"Track popup click error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    # ============================================
    # STATIC PAGES
    # ============================================

    @http.route('/api/ecommerce/pages/<string:slug>', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_static_page_by_slug(self, slug, **kwargs):
        """Récupérer page statique par slug (public, frontend)"""
        try:
            page_obj = request.env['quelyos.static.page'].sudo()
            page = page_obj.get_by_slug(slug)

            if page:
                return {'success': True, 'page': page}
            else:
                return {'success': False, 'error': 'Page non trouvée'}

        except Exception as e:
            _logger.error(f"Get static page by slug error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/pages', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def get_static_pages_list(self, **kwargs):
        """Liste toutes les pages statiques (admin)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            pages = request.env['quelyos.static.page'].sudo().search([], limit=200, order='id desc')

            return {
                'success': True,
                'pages': [{
                    'id': p.id,
                    'name': p.name,
                    'slug': p.slug,
                    'title': p.title,
                    'layout': p.layout,
                    'active': p.active,
                    'show_in_footer': p.show_in_footer,
                    'show_in_menu': p.show_in_menu,
                    'views_count': p.views_count,
                    'published_date': p.published_date.isoformat() if p.published_date else None,
                } for p in pages]
            }

        except Exception as e:
            _logger.error(f"Get static pages list error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/pages/footer-links', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_footer_links(self, **kwargs):
        """Récupérer liens footer (public, frontend)"""
        try:
            page_obj = request.env['quelyos.static.page'].sudo()
            links = page_obj.get_footer_links()

            return {'success': True, 'links': links}

        except Exception as e:
            _logger.error(f"Get footer links error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/pages/create', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_static_page(self, **kwargs):
        """Créer page statique (admin)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            params = request.jsonrequest
            page = request.env['quelyos.static.page'].sudo().create({
                'name': params.get('name'),
                'slug': params.get('slug'),
                'title': params.get('title'),
                'subtitle': params.get('subtitle'),
                'content': params.get('content'),
                'layout': params.get('layout', 'default'),
                'show_sidebar': params.get('show_sidebar', False),
                'sidebar_content': params.get('sidebar_content'),
                'header_image_url': params.get('header_image_url'),
                'show_header_image': params.get('show_header_image', False),
                'meta_title': params.get('meta_title'),
                'meta_description': params.get('meta_description'),
                'show_in_footer': params.get('show_in_footer', False),
                'footer_column': params.get('footer_column'),
                'show_in_menu': params.get('show_in_menu', False),
                'menu_position': params.get('menu_position', 100),
                'active': params.get('active', True),
            })

            return {'success': True, 'id': page.id}

        except Exception as e:
            _logger.error(f"Create static page error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/pages/<int:page_id>/update', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def update_static_page(self, page_id, **kwargs):
        """Modifier page statique (admin)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            page = request.env['quelyos.static.page'].sudo().browse(page_id)
            if not page.exists():
                return {'success': False, 'error': 'Page non trouvée'}

            params = request.jsonrequest
            update_data = {}

            allowed_fields = [
                'name', 'slug', 'title', 'subtitle', 'content', 'layout',
                'show_sidebar', 'sidebar_content', 'header_image_url', 'show_header_image',
                'meta_title', 'meta_description', 'show_in_footer', 'footer_column',
                'show_in_menu', 'menu_position', 'active'
            ]

            for field in allowed_fields:
                if field in params:
                    update_data[field] = params[field]

            page.write(update_data)

            return {'success': True}

        except Exception as e:
            _logger.error(f"Update static page error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/pages/<int:page_id>/delete', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def delete_static_page(self, page_id, **kwargs):
        """Supprimer page statique (admin)"""
        try:
            error = self._authenticate_from_header()
            if error:
                return error


            page = request.env['quelyos.static.page'].sudo().browse(page_id)
            if not page.exists():
                return {'success': False, 'error': 'Page non trouvée'}

            page.unlink()

            return {'success': True}

        except Exception as e:
            _logger.error(f"Delete static page error: {e}")
            return {'success': False, 'error': 'Une erreur est survenue'}
