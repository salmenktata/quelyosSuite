# -*- coding: utf-8 -*-

from odoo import http
from odoo.http import request
from odoo.addons.quelyos_ecommerce.controllers.base_controller import BaseEcommerceController
from odoo.addons.quelyos_ecommerce.controllers.rate_limiter import rate_limit
import logging

_logger = logging.getLogger(__name__)


class EcommerceProductsController(BaseEcommerceController):
    """Controller pour l'API Produits avec sécurité renforcée."""

    @http.route('/api/ecommerce/products', type='json', auth='public', methods=['GET', 'POST'], csrf=False, cors='*')
    @rate_limit(limit=100, window=60)
    def get_products(self, **kwargs):
        """
        Liste les produits avec filtres et pagination.

        Query params:
        - category_id: int
        - search: str
        - price_min: float
        - price_max: float
        - is_featured: bool
        - is_new: bool
        - is_bestseller: bool
        - attribute_value_ids: list[int]
        - limit: int (default 24)
        - offset: int (default 0)
        - sort: str ('name', 'price_asc', 'price_desc', 'newest', 'popular', 'featured')

        Returns:
        {
            "products": [...],
            "total": 150,
            "facets": {
                "categories": [...],
                "attributes": [...],
                "price_range": {"min": 0, "max": 1000}
            }
        }
        """
        try:
            params = kwargs or {}

            # Get configuration
            config = request.env['ecommerce.config'].sudo().get_config()

            # Build filters dict
            filters = {}
            if params.get('category_id'):
                filters['category_id'] = params['category_id']
            if params.get('price_min') is not None:
                filters['price_min'] = params['price_min']
            if params.get('price_max') is not None:
                filters['price_max'] = params['price_max']
            if params.get('attribute_value_ids'):
                filters['attribute_value_ids'] = params['attribute_value_ids']
            if params.get('is_featured'):
                filters['is_featured'] = params['is_featured']
            if params.get('is_new'):
                filters['is_new'] = params['is_new']
            if params.get('is_bestseller'):
                filters['is_bestseller'] = params['is_bestseller']

            # Pagination with validation
            input_validator = request.env['input.validator']
            limit = input_validator.validate_positive_int(
                params.get('limit', config.get('products_per_page', 24)),
                'limit'
            )
            offset = input_validator.validate_positive_int(params.get('offset', 0), 'offset')

            # Limiter la pagination pour éviter abus
            if limit > 100:
                limit = 100

            # Search query (sanitize)
            search = input_validator.validate_string(
                params.get('search', ''),
                field_name='search',
                max_length=200
            )

            # Sort order (whitelist)
            sort = params.get('sort', 'name')
            order_mapping = {
                'name': 'name ASC',
                'price_asc': 'list_price ASC',
                'price_desc': 'list_price DESC',
                'newest': 'create_date DESC',
                'popular': 'view_count DESC',
                'featured': 'featured_order ASC, create_date DESC',
            }
            order = order_mapping.get(sort, 'name ASC')

            # Use product service
            product_service = request.env['product.service'].sudo()
            result = product_service.get_products_with_facets(
                filters=filters,
                limit=limit,
                offset=offset,
                search=search,
                order=order
            )

            return self._success_response({
                'products': result['products'],
                'total': result['total'],
                'facets': result['facets'],
            })

        except Exception as e:
            return self._handle_error(e, "récupération des produits")

    @http.route('/api/ecommerce/products/<int:product_id>', type='json', auth='public', methods=['GET', 'POST'], csrf=False, cors='*')
    @rate_limit(limit=100, window=60)
    def get_product(self, product_id, **kwargs):
        """
        Récupère le détail d'un produit par ID.

        Returns: Product data with variants
        """
        try:
            # Validation product_id
            input_validator = request.env['input.validator']
            product_id = input_validator.validate_id(product_id, 'product_id')

            product = request.env['product.template'].sudo().browse(product_id)

            if not product.exists():
                return self._handle_error(
                    Exception('Produit non trouvé'),
                    "récupération du produit"
                )

            # Incrémenter le compteur de vues
            product.increment_view_count()

            return self._success_response({
                'product': product.get_api_data(include_variants=True)
            })

        except Exception as e:
            return self._handle_error(e, f"récupération du produit {product_id}")

    @http.route('/api/ecommerce/products/slug/<string:slug>', type='json', auth='public', methods=['GET', 'POST'], csrf=False, cors='*')
    @rate_limit(limit=100, window=60)
    def get_product_by_slug(self, slug, **kwargs):
        """
        Récupère le détail d'un produit par slug (pour URLs SEO).

        Returns: Product data with variants
        """
        try:
            # Validation slug (sanitize)
            input_validator = request.env['input.validator']
            slug = input_validator.validate_string(slug, field_name='slug', max_length=200)

            product = request.env['product.template'].sudo().search([('slug', '=', slug)], limit=1)

            if not product:
                return self._handle_error(
                    Exception('Produit non trouvé'),
                    "récupération du produit"
                )

            # Incrémenter le compteur de vues
            product.increment_view_count()

            return self._success_response({
                'product': product.get_api_data(include_variants=True)
            })

        except Exception as e:
            return self._handle_error(e, f"récupération du produit {slug}")

    @http.route('/api/ecommerce/categories', type='json', auth='public', methods=['GET', 'POST'], csrf=False, cors='*')
    @rate_limit(limit=100, window=60)
    def get_categories(self, include_featured_products=False, featured_limit=4, **kwargs):
        """
        Liste toutes les catégories de produits avec comptage optimisé.

        Args:
            include_featured_products: Include featured products for each category (for mega menu)
            featured_limit: Number of featured products per category (default: 4)

        Returns:
        {
            "categories": [
                {
                    "id": 1,
                    "name": "Electronics",
                    "parent_id": null,
                    "child_count": 3,
                    "product_count": 25,
                    "image_url": "...",
                    "subcategories": [...],
                    "featured_products": [...]
                }
            ]
        }
        """
        try:
            # Get all categories
            categories = request.env['product.category'].sudo().search([])

            # Optimisation: Compter tous les produits par catégorie en 1 requête SQL (read_group)
            product_counts = {}
            if categories:
                domain = [('sale_ok', '=', True), ('active', '=', True), ('categ_id', 'in', categories.ids)]
                groups = request.env['product.template'].sudo().read_group(
                    domain,
                    ['categ_id'],
                    ['categ_id']
                )
                product_counts = {g['categ_id'][0]: g['categ_id_count'] for g in groups}

            # Build categories data
            categories_data = []
            for cat in categories:
                cat_data = {
                    'id': cat.id,
                    'name': cat.name,
                    'parent_id': cat.parent_id.id if cat.parent_id else None,
                    'parent_name': cat.parent_id.name if cat.parent_id else None,
                    'child_count': len(cat.child_id),
                    'product_count': product_counts.get(cat.id, 0),
                    'image_url': None,
                    'subcategories': [],
                }

                # Get category image (if exists)
                # Note: Odoo product.category doesn't have image by default
                # You may need to add image field to product.category model
                # For now, we'll use the first product's image from this category
                if include_featured_products:
                    first_product = request.env['product.template'].sudo().search([
                        ('categ_id', '=', cat.id),
                        ('sale_ok', '=', True),
                        ('active', '=', True),
                    ], limit=1)
                    if first_product and first_product.image_1920:
                        cat_data['image_url'] = f"/web/image/product.template/{first_product.id}/image_1920"

                # Get subcategories
                if cat.child_id:
                    for child in cat.child_id:
                        cat_data['subcategories'].append({
                            'id': child.id,
                            'name': child.name,
                            'product_count': product_counts.get(child.id, 0),
                        })

                # Get featured products (best-selling or newest)
                if include_featured_products and product_counts.get(cat.id, 0) > 0:
                    featured_products = request.env['product.template'].sudo().search([
                        ('categ_id', '=', cat.id),
                        ('sale_ok', '=', True),
                        ('active', '=', True),
                    ], limit=featured_limit, order='create_date desc')

                    cat_data['featured_products'] = []
                    for product in featured_products:
                        cat_data['featured_products'].append({
                            'id': product.id,
                            'name': product.name,
                            'slug': product.slug if hasattr(product, 'slug') else product.name.lower().replace(' ', '-'),
                            'price': product.list_price,
                            'image_url': f"/web/image/product.template/{product.id}/image_128" if product.image_1920 else None,
                        })

                categories_data.append(cat_data)

            return self._success_response({
                'categories': categories_data
            })

        except Exception as e:
            return self._handle_error(e, "récupération des catégories")

    @http.route('/api/ecommerce/categories/<int:category_id>/products', type='json', auth='public', methods=['GET', 'POST'], csrf=False, cors='*')
    @rate_limit(limit=100, window=60)
    def get_category_products(self, category_id, **kwargs):
        """
        Liste les produits d'une catégorie spécifique.
        """
        try:
            # Validation category_id
            input_validator = request.env['input.validator']
            category_id = input_validator.validate_id(category_id, 'category_id')

            params = kwargs or {}
            params['category_id'] = category_id
            return self.get_products(**params)

        except Exception as e:
            return self._handle_error(e, f"récupération des produits de la catégorie {category_id}")

    @http.route('/api/ecommerce/products/featured', type='json', auth='public', methods=['GET', 'POST'], csrf=False, cors='*')
    @rate_limit(limit=100, window=60)
    def get_featured_products(self, **kwargs):
        """
        Récupère les produits mis en avant pour la page d'accueil.

        Query params:
        - limit: int (default 8)
        """
        try:
            params = kwargs or {}

            # Validation limit
            input_validator = request.env['input.validator']
            limit = input_validator.validate_positive_int(params.get('limit', 8), 'limit')

            # Limiter pour éviter abus
            if limit > 50:
                limit = 50

            products = request.env['product.template'].sudo().search([
                ('is_featured', '=', True),
                ('sale_ok', '=', True)
            ], limit=limit, order='featured_order, name')

            products_data = [p.get_api_data(include_variants=False) for p in products]

            return self._success_response({
                'products': products_data,
                'total': len(products),
            })

        except Exception as e:
            return self._handle_error(e, "récupération des produits featured")
