# -*- coding: utf-8 -*-
"""
Contrôleur Search & Facets pour l'e-commerce
"""
import logging
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class QuelyosSearch(http.Controller):
    """API Search & Facets pour frontend e-commerce"""

    def _get_params(self):
        """Extrait les paramètres de la requête JSON-RPC"""
        return request.params if hasattr(request, 'params') and request.params else {}

    # ==================== RECHERCHE ====================

    @http.route('/api/ecommerce/search/autocomplete', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def search_autocomplete(self, **kwargs):
        """
        Recherche autocomplete avec suggestions

        Args:
            query (str): Terme de recherche
            limit (int, optional): Nombre de suggestions (défaut: 5)

        Returns:
            dict: {
                'success': bool,
                'data': {
                    'suggestions': [
                        {
                            'type': 'product' | 'category',
                            'id': int,
                            'name': str,
                            'slug': str,
                            'image_url': str,
                            'price': float,
                            'category': str (si type=product)
                        }
                    ]
                }
            }
        """
        try:
            params = self._get_params()
            query = params.get('query', '').strip()
            limit = params.get('limit', 5)

            if not query or len(query) < 2:
                return {
                    'success': True,
                    'data': {
                        'suggestions': []
                    }
                }

            Product = request.env['product.template'].sudo()
            Category = request.env['product.public.category'].sudo()

            suggestions = []

            # Rechercher dans les produits (max 3)
            products = Product.search([
                ('name', 'ilike', query),
                ('website_published', '=', True)
            ], limit=min(limit, 3), order='name ASC')

            for product in products:
                image_url = None
                if product.image_1920:
                    image_url = f'/web/image/product.template/{product.id}/image_1920'

                slug = product.name.lower().replace(' ', '-').replace('/', '-')

                suggestions.append({
                    'type': 'product',
                    'id': product.id,
                    'name': product.name,
                    'slug': slug,
                    'image_url': image_url,
                    'price': product.list_price,
                    'category': product.public_categ_ids[0].name if product.public_categ_ids else None
                })

            # Rechercher dans les catégories (max 2)
            if len(suggestions) < limit:
                remaining = limit - len(suggestions)
                categories = Category.search([
                    ('name', 'ilike', query)
                ], limit=min(remaining, 2), order='name ASC')

                for category in categories:
                    image_url = None
                    if category.image_1920:
                        image_url = f'/web/image/product.public.category/{category.id}/image_1920'

                    slug = category.name.lower().replace(' ', '-').replace('/', '-')

                    suggestions.append({
                        'type': 'category',
                        'id': category.id,
                        'name': category.name,
                        'slug': slug,
                        'image_url': image_url,
                        'price': None,
                        'category': None
                    })

            _logger.info(f"Autocomplete search for '{query}' returned {len(suggestions)} suggestions")

            return {
                'success': True,
                'data': {
                    'suggestions': suggestions
                }
            }

        except Exception as e:
            _logger.error(f"Autocomplete search error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }

    @http.route('/api/ecommerce/products/facets', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_products_facets(self, **kwargs):
        """
        Récupérer les filtres dynamiques (facets) pour les produits

        Args:
            category_id (int, optional): Filtrer par catégorie
            search (str, optional): Filtrer par terme de recherche

        Returns:
            dict: {
                'success': bool,
                'data': {
                    'facets': {
                        'categories': [
                            {
                                'id': int,
                                'name': str,
                                'count': int (nombre de produits)
                            }
                        ],
                        'price_ranges': [
                            {
                                'label': str (ex: '0-50'),
                                'min': float,
                                'max': float,
                                'count': int
                            }
                        ],
                        'attributes': {
                            'Couleur': [
                                {
                                    'id': int,
                                    'name': str,
                                    'count': int
                                }
                            ],
                            'Taille': [...]
                        },
                        'brands': [
                            {
                                'id': int,
                                'name': str,
                                'count': int
                            }
                        ],
                        'in_stock': {
                            'available': int (produits en stock),
                            'out_of_stock': int
                        }
                    }
                }
            }
        """
        try:
            params = self._get_params()
            category_id = params.get('category_id')
            search = params.get('search', '').strip()

            Product = request.env['product.template'].sudo()
            Category = request.env['product.public.category'].sudo()
            Attribute = request.env['product.attribute'].sudo()

            # Construire le domaine de recherche de base
            domain = [('website_published', '=', True)]

            if category_id:
                domain.append(('public_categ_ids', 'in', [category_id]))

            if search:
                domain.append(('name', 'ilike', search))

            # Récupérer tous les produits matchant
            products = Product.search(domain)

            facets = {
                'categories': [],
                'price_ranges': [],
                'attributes': {},
                'brands': [],
                'in_stock': {
                    'available': 0,
                    'out_of_stock': 0
                }
            }

            # Facets catégories (compter produits par catégorie)
            category_counts = {}
            for product in products:
                for category in product.public_categ_ids:
                    if category.id not in category_counts:
                        category_counts[category.id] = {
                            'id': category.id,
                            'name': category.name,
                            'count': 0
                        }
                    category_counts[category.id]['count'] += 1

            facets['categories'] = sorted(category_counts.values(), key=lambda x: x['count'], reverse=True)

            # Facets prix (ranges prédéfinis)
            price_ranges = [
                {'label': '0-50', 'min': 0, 'max': 50, 'count': 0},
                {'label': '50-100', 'min': 50, 'max': 100, 'count': 0},
                {'label': '100-200', 'min': 100, 'max': 200, 'count': 0},
                {'label': '200-500', 'min': 200, 'max': 500, 'count': 0},
                {'label': '500+', 'min': 500, 'max': 999999, 'count': 0},
            ]

            for product in products:
                price = product.list_price
                for range_obj in price_ranges:
                    if range_obj['min'] <= price < range_obj['max']:
                        range_obj['count'] += 1
                        break

            facets['price_ranges'] = [r for r in price_ranges if r['count'] > 0]

            # Facets attributs (couleur, taille, etc.)
            attribute_counts = {}
            for product in products:
                for variant in product.product_variant_ids:
                    for value in variant.product_template_attribute_value_ids:
                        attribute_name = value.attribute_id.name
                        value_name = value.name

                        if attribute_name not in attribute_counts:
                            attribute_counts[attribute_name] = {}

                        if value_name not in attribute_counts[attribute_name]:
                            attribute_counts[attribute_name][value_name] = {
                                'id': value.id,
                                'name': value_name,
                                'count': 0
                            }

                        attribute_counts[attribute_name][value_name]['count'] += 1

            # Convertir en liste triée
            for attr_name, values in attribute_counts.items():
                facets['attributes'][attr_name] = sorted(values.values(), key=lambda x: x['count'], reverse=True)

            # Facets stock (disponibilité)
            for product in products:
                if product.type == 'product':
                    if product.qty_available > 0:
                        facets['in_stock']['available'] += 1
                    else:
                        facets['in_stock']['out_of_stock'] += 1
                else:
                    # Service/consommable toujours disponible
                    facets['in_stock']['available'] += 1

            _logger.info(f"Facets calculated for {len(products)} products")

            return {
                'success': True,
                'data': {
                    'facets': facets
                }
            }

        except Exception as e:
            _logger.error(f"Get facets error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }
