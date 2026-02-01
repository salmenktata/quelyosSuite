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

    @http.route('/api/ecommerce/search/autocomplete', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
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

    # Dictionnaire de synonymes français pour la recherche sémantique
    SYNONYMS = {
        'telephone': ['smartphone', 'mobile', 'portable', 'gsm', 'iphone', 'samsung'],
        'smartphone': ['telephone', 'mobile', 'portable', 'gsm'],
        'ordinateur': ['pc', 'laptop', 'portable', 'ordi', 'macbook', 'chromebook'],
        'pc': ['ordinateur', 'laptop', 'desktop'],
        'ecouteurs': ['casque', 'airpods', 'earbuds', 'audio'],
        'casque': ['ecouteurs', 'headphones', 'audio'],
        'montre': ['smartwatch', 'bracelet', 'connectee'],
        'tablette': ['ipad', 'tab', 'slate'],
        'television': ['tv', 'ecran', 'tele'],
        'tv': ['television', 'ecran', 'tele'],
        'chaussures': ['sneakers', 'baskets', 'tennis', 'souliers'],
        'vetements': ['habits', 'fringues', 'textile'],
        'sac': ['sacoche', 'valise', 'bagage'],
        'accessoires': ['bijoux', 'montres', 'ceintures'],
        'beaute': ['cosmetiques', 'maquillage', 'soins'],
        'enfant': ['bebe', 'junior', 'kids'],
        'femme': ['feminin', 'ladies', 'dame'],
        'homme': ['masculin', 'men', 'monsieur'],
        'sport': ['fitness', 'gym', 'running', 'athletisme'],
        'maison': ['deco', 'decoration', 'interieur', 'meuble'],
        'cuisine': ['cuisson', 'electromenager', 'ustensiles'],
        'jardin': ['exterieur', 'plantes', 'terrasse'],
        'pas cher': ['discount', 'promo', 'soldes', 'economique', 'abordable'],
        'luxe': ['premium', 'haut de gamme', 'prestige'],
        'nouveau': ['nouveaute', 'recent', 'dernier'],
    }

    def _expand_query_with_synonyms(self, query):
        """Expands query with synonyms"""
        query_lower = query.lower()
        expanded_terms = [query_lower]

        for key, synonyms in self.SYNONYMS.items():
            if key in query_lower:
                expanded_terms.extend(synonyms)
            for syn in synonyms:
                if syn in query_lower:
                    expanded_terms.append(key)
                    expanded_terms.extend([s for s in synonyms if s != syn])

        return list(set(expanded_terms))

    def _levenshtein_distance(self, s1, s2):
        """Calcule la distance de Levenshtein entre deux chaînes"""
        if len(s1) < len(s2):
            return self._levenshtein_distance(s2, s1)
        if len(s2) == 0:
            return len(s1)

        prev_row = range(len(s2) + 1)
        for i, c1 in enumerate(s1):
            curr_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = prev_row[j + 1] + 1
                deletions = curr_row[j] + 1
                substitutions = prev_row[j] + (c1 != c2)
                curr_row.append(min(insertions, deletions, substitutions))
            prev_row = curr_row
        return prev_row[-1]

    def _fuzzy_match(self, query, text, threshold=0.7):
        """Vérifie si query correspond approximativement à text"""
        query = query.lower()
        text = text.lower()

        if query in text:
            return True

        words = text.split()
        for word in words:
            if len(word) >= 3:
                distance = self._levenshtein_distance(query, word)
                max_len = max(len(query), len(word))
                similarity = 1 - (distance / max_len)
                if similarity >= threshold:
                    return True
        return False

    def _calculate_relevance_score(self, product, query_terms, original_query):
        """Calcule un score de pertinence pour un produit"""
        score = 0
        name_lower = product.name.lower()
        desc_lower = (product.description_sale or '').lower()

        # Correspondance exacte dans le nom (score élevé)
        if original_query.lower() in name_lower:
            score += 100

        # Correspondance dans le nom
        for term in query_terms:
            if term in name_lower:
                score += 50
            elif self._fuzzy_match(term, name_lower, 0.8):
                score += 25

        # Correspondance dans la description
        for term in query_terms:
            if term in desc_lower:
                score += 10

        # Boost pour les produits populaires/bestsellers
        if hasattr(product, 'is_bestseller') and product.is_bestseller:
            score += 20
        if hasattr(product, 'is_featured') and product.is_featured:
            score += 15

        # Boost pour les produits en stock
        if product.qty_available > 0:
            score += 10

        return score

    @http.route('/api/ecommerce/search/semantic', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def search_semantic(self, **kwargs):
        """
        Recherche sémantique intelligente avec synonymes et fuzzy matching

        Args:
            query (str): Terme de recherche
            limit (int, optional): Nombre de résultats (défaut: 20)
            category_id (int, optional): Filtrer par catégorie

        Returns:
            dict: Produits triés par pertinence avec score
        """
        try:
            params = self._get_params()
            query = params.get('query', '').strip()
            limit = int(params.get('limit', 20))
            category_id = params.get('category_id')

            if not query or len(query) < 2:
                return {'success': True, 'data': {'products': [], 'query_expansion': []}}

            # Expansion de la requête avec synonymes
            expanded_terms = self._expand_query_with_synonyms(query)

            Product = request.env['product.template'].sudo()

            # Construire le domaine de recherche
            base_domain = [('website_published', '=', True)]

            if category_id:
                base_domain.append(('public_categ_ids', 'in', [int(category_id)]))

            # Recherche avec tous les termes (OR)
            search_domain = ['|'] * (len(expanded_terms) - 1)
            for term in expanded_terms:
                search_domain.append(('name', 'ilike', term))

            full_domain = base_domain + search_domain

            # Récupérer les produits (plus que limit pour filtrer ensuite)
            products = Product.search(full_domain, limit=limit * 3)

            # Calculer les scores et trier
            scored_products = []
            for product in products:
                score = self._calculate_relevance_score(product, expanded_terms, query)
                if score > 0:
                    image_url = None
                    if product.image_1920:
                        image_url = f'/web/image/product.template/{product.id}/image_1920'

                    slug = product.name.lower().replace(' ', '-').replace('/', '-')

                    scored_products.append({
                        'id': product.id,
                        'name': product.name,
                        'slug': slug,
                        'price': product.list_price,
                        'compare_at_price': product.compare_list_price if hasattr(product, 'compare_list_price') and product.compare_list_price > product.list_price else None,
                        'image_url': image_url,
                        'category': product.public_categ_ids[0].name if product.public_categ_ids else None,
                        'in_stock': product.qty_available > 0,
                        'is_bestseller': getattr(product, 'is_bestseller', False),
                        'relevance_score': score,
                    })

            # Trier par score de pertinence
            scored_products.sort(key=lambda x: x['relevance_score'], reverse=True)

            # Limiter les résultats
            results = scored_products[:limit]

            _logger.info(f"Semantic search for '{query}' expanded to {expanded_terms}, found {len(results)} results")

            return {
                'success': True,
                'data': {
                    'products': results,
                    'query_expansion': expanded_terms if len(expanded_terms) > 1 else [],
                    'total_found': len(scored_products),
                }
            }

        except Exception as e:
            _logger.error(f"Semantic search error: {e}", exc_info=True)
            return {'success': False, 'error': 'Une erreur est survenue'}

    @http.route('/api/ecommerce/products/facets', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
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
