# -*- coding: utf-8 -*-
"""
Contrôleurs CMS pour les menus, pages et configuration du site
"""
import logging
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class QuelyCMS(http.Controller):
    """API CMS pour menus, pages et configuration"""

    def _get_params(self):
        """Extrait les paramètres de la requête JSON-RPC"""
        return request.params if hasattr(request, 'params') and request.params else {}

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

            # Configuration des menus statiques
            # TODO: Implémenter avec website.menu d'Odoo ou créer un modèle custom
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
                _logger.warning(f"Menu non trouvé: {code}")
                return {
                    'success': False,
                    'error': f'Menu {code} non trouvé'
                }

            return {
                'success': True,
                'menu': menu
            }

        except Exception as e:
            _logger.error(f"Get menu error: {e}")
            return {'success': False, 'error': str(e)}

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

            # Récupérer les catégories et compter les produits pour chacune
            categories = Category.search([], limit=limit * 2)  # Récupérer plus pour filtrer

            popular_searches = []
            for category in categories:
                # Compter les produits dans cette catégorie
                product_count = Product.search_count([('public_categ_ids', 'in', category.id)])

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
            return {'success': False, 'error': str(e)}

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
            return {'success': False, 'error': str(e)}
