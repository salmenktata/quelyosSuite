# -*- coding: utf-8 -*-
"""
Contrôleur SEO pour l'e-commerce
"""
import logging
from odoo import http
from odoo.http import request
from datetime import datetime

_logger = logging.getLogger(__name__)


class QuelyosSEO(http.Controller):
    """API SEO pour frontend e-commerce"""

    def _get_params(self):
        """Extrait les paramètres de la requête JSON-RPC"""
        return request.params if hasattr(request, 'params') and request.params else {}

    # ==================== SITEMAP ====================

    @http.route('/api/ecommerce/seo/sitemap.xml', type='http', auth='public', methods=['GET'], csrf=False)
    def get_sitemap(self, **kwargs):
        """
        Générer le sitemap XML pour le SEO

        Returns:
            XML: Sitemap au format XML standard
        """
        try:
            Product = request.env['product.template'].sudo()
            Category = request.env['product.public.category'].sudo()
            IrParam = request.env['ir.config_parameter'].sudo()

            # Récupérer l'URL du site
            site_url = IrParam.get_param('quelyos.site_url', 'https://quelyos.com')
            site_url = site_url.rstrip('/')

            # Construire le XML
            xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
            xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

            # Page d'accueil
            xml_content += '  <url>\n'
            xml_content += f'    <loc>{site_url}/</loc>\n'
            xml_content += f'    <lastmod>{datetime.now().strftime("%Y-%m-%d")}</lastmod>\n'
            xml_content += '    <changefreq>daily</changefreq>\n'
            xml_content += '    <priority>1.0</priority>\n'
            xml_content += '  </url>\n'

            # Pages statiques
            static_pages = [
                {'path': '/products', 'priority': '0.9', 'changefreq': 'daily'},
                {'path': '/categories', 'priority': '0.8', 'changefreq': 'weekly'},
                {'path': '/about', 'priority': '0.5', 'changefreq': 'monthly'},
                {'path': '/contact', 'priority': '0.5', 'changefreq': 'monthly'},
            ]

            for page in static_pages:
                xml_content += '  <url>\n'
                xml_content += f'    <loc>{site_url}{page["path"]}</loc>\n'
                xml_content += f'    <lastmod>{datetime.now().strftime("%Y-%m-%d")}</lastmod>\n'
                xml_content += f'    <changefreq>{page["changefreq"]}</changefreq>\n'
                xml_content += f'    <priority>{page["priority"]}</priority>\n'
                xml_content += '  </url>\n'

            # Catégories (limit pour éviter surcharge mémoire)
            categories = Category.search([], limit=500)
            for category in categories:
                slug = category.name.lower().replace(' ', '-').replace('/', '-')
                xml_content += '  <url>\n'
                xml_content += f'    <loc>{site_url}/categories/{slug}</loc>\n'
                xml_content += f'    <lastmod>{category.write_date.strftime("%Y-%m-%d") if category.write_date else datetime.now().strftime("%Y-%m-%d")}</lastmod>\n'
                xml_content += '    <changefreq>weekly</changefreq>\n'
                xml_content += '    <priority>0.7</priority>\n'
                xml_content += '  </url>\n'

            # Produits publiés (limit pour sitemap performant)
            products = Product.search([('website_published', '=', True)], limit=5000)
            for product in products:
                slug = product.name.lower().replace(' ', '-').replace('/', '-')
                xml_content += '  <url>\n'
                xml_content += f'    <loc>{site_url}/products/{slug}</loc>\n'
                xml_content += f'    <lastmod>{product.write_date.strftime("%Y-%m-%d") if product.write_date else datetime.now().strftime("%Y-%m-%d")}</lastmod>\n'
                xml_content += '    <changefreq>weekly</changefreq>\n'
                xml_content += '    <priority>0.6</priority>\n'
                xml_content += '  </url>\n'

            xml_content += '</urlset>'

            _logger.info(f"Sitemap generated with {len(categories)} categories and {len(products)} products")

            return request.make_response(
                xml_content,
                headers=[
                    ('Content-Type', 'application/xml; charset=utf-8'),
                    ('Cache-Control', 'public, max-age=86400'),  # Cache 24h
                ]
            )

        except Exception as e:
            _logger.error(f"Sitemap generation error: {e}", exc_info=True)
            return request.make_response(
                '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
                headers=[('Content-Type', 'application/xml; charset=utf-8')]
            )

    @http.route('/api/ecommerce/seo/robots.txt', type='http', auth='public', methods=['GET'], csrf=False)
    def get_robots_txt(self, **kwargs):
        """
        Générer le fichier robots.txt pour le SEO

        Returns:
            Text: Contenu du robots.txt
        """
        try:
            IrParam = request.env['ir.config_parameter'].sudo()

            # Récupérer l'URL du site
            site_url = IrParam.get_param('quelyos.site_url', 'https://quelyos.com')
            site_url = site_url.rstrip('/')

            # Récupérer les paramètres de configuration
            allow_indexing = IrParam.get_param('quelyos.seo_allow_indexing', 'True') == 'True'

            robots_content = ''

            if allow_indexing:
                # Configuration SEO-friendly (production)
                robots_content += 'User-agent: *\n'
                robots_content += 'Allow: /\n'
                robots_content += '\n'
                robots_content += '# Bloquer les URLs sensibles\n'
                robots_content += 'Disallow: /admin/\n'
                robots_content += 'Disallow: /cart/\n'
                robots_content += 'Disallow: /checkout/\n'
                robots_content += 'Disallow: /account/\n'
                robots_content += 'Disallow: /api/\n'
                robots_content += 'Disallow: /search?\n'
                robots_content += '\n'
                robots_content += '# Sitemap\n'
                robots_content += f'Sitemap: {site_url}/api/ecommerce/seo/sitemap.xml\n'
            else:
                # Bloquer tous les robots (staging/development)
                robots_content += 'User-agent: *\n'
                robots_content += 'Disallow: /\n'

            _logger.info(f"Robots.txt generated (allow_indexing={allow_indexing})")

            return request.make_response(
                robots_content,
                headers=[
                    ('Content-Type', 'text/plain; charset=utf-8'),
                    ('Cache-Control', 'public, max-age=86400'),  # Cache 24h
                ]
            )

        except Exception as e:
            _logger.error(f"Robots.txt generation error: {e}", exc_info=True)
            return request.make_response(
                'User-agent: *\nDisallow: /',
                headers=[('Content-Type', 'text/plain; charset=utf-8')]
            )

    @http.route('/api/ecommerce/seo/metadata', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_metadata(self, **kwargs):
        """
        Récupérer les métadonnées SEO pour une page

        Args:
            page_type (str): Type de page ('home', 'product', 'category', 'static')
            resource_id (int, optional): ID de la ressource (produit, catégorie)
            slug (str, optional): Slug de la ressource

        Returns:
            dict: {
                'success': bool,
                'data': {
                    'title': str,
                    'description': str,
                    'keywords': str,
                    'og_title': str (Open Graph),
                    'og_description': str,
                    'og_image': str,
                    'og_type': str,
                    'canonical_url': str
                }
            }
        """
        try:
            params = self._get_params()
            page_type = params.get('page_type', 'home')
            resource_id = params.get('resource_id')
            slug = params.get('slug')

            IrParam = request.env['ir.config_parameter'].sudo()
            site_url = IrParam.get_param('quelyos.site_url', 'https://quelyos.com').rstrip('/')
            site_name = IrParam.get_param('quelyos.site_name', 'Quelyos E-commerce')

            metadata = {
                'title': '',
                'description': '',
                'keywords': '',
                'og_title': '',
                'og_description': '',
                'og_image': '',
                'og_type': 'website',
                'canonical_url': site_url
            }

            if page_type == 'home':
                # Page d'accueil
                metadata['title'] = IrParam.get_param('quelyos.seo_title', f'{site_name} - Boutique en ligne')
                metadata['description'] = IrParam.get_param('quelyos.seo_description', 'Découvrez nos produits de qualité')
                metadata['keywords'] = IrParam.get_param('quelyos.seo_keywords', 'e-commerce, boutique en ligne, produits')
                metadata['og_title'] = metadata['title']
                metadata['og_description'] = metadata['description']
                metadata['og_image'] = IrParam.get_param('quelyos.logo_url', f'{site_url}/logo.png')
                metadata['canonical_url'] = site_url

            elif page_type == 'product':
                # Page produit
                if not resource_id:
                    return {
                        'success': False,
                        'error': 'resource_id requis pour page_type=product'
                    }

                Product = request.env['product.template'].sudo()
                product = Product.browse(resource_id)

                if not product.exists():
                    return {
                        'success': False,
                        'error': 'Produit non trouvé'
                    }

                product_slug = slug or product.name.lower().replace(' ', '-').replace('/', '-')

                metadata['title'] = f'{product.name} | {site_name}'
                metadata['description'] = (product.description_sale or product.name)[:160]
                metadata['keywords'] = f'{product.name}, {", ".join([cat.name for cat in product.public_categ_ids[:3]])}'
                metadata['og_title'] = product.name
                metadata['og_description'] = metadata['description']
                metadata['og_type'] = 'product'
                metadata['canonical_url'] = f'{site_url}/products/{product_slug}'

                if product.image_1920:
                    metadata['og_image'] = f'{site_url}/web/image/product.template/{product.id}/image_1920'

            elif page_type == 'category':
                # Page catégorie
                if not resource_id:
                    return {
                        'success': False,
                        'error': 'resource_id requis pour page_type=category'
                    }

                Category = request.env['product.public.category'].sudo()
                category = Category.browse(resource_id)

                if not category.exists():
                    return {
                        'success': False,
                        'error': 'Catégorie non trouvée'
                    }

                category_slug = slug or category.name.lower().replace(' ', '-').replace('/', '-')

                metadata['title'] = f'{category.name} | {site_name}'
                metadata['description'] = f'Découvrez tous nos produits dans la catégorie {category.name}'
                metadata['keywords'] = f'{category.name}, produits, boutique'
                metadata['og_title'] = f'{category.name} - {site_name}'
                metadata['og_description'] = metadata['description']
                metadata['canonical_url'] = f'{site_url}/categories/{category_slug}'

                if category.image_1920:
                    metadata['og_image'] = f'{site_url}/web/image/product.public.category/{category.id}/image_1920'

            elif page_type == 'static':
                # Pages statiques (about, contact, etc.)
                page_slug = params.get('page_slug', 'page')

                static_pages_meta = {
                    'about': {
                        'title': f'À propos | {site_name}',
                        'description': 'Découvrez notre histoire et nos valeurs',
                    },
                    'contact': {
                        'title': f'Contact | {site_name}',
                        'description': 'Contactez-nous pour toute question',
                    },
                    'legal': {
                        'title': f'Mentions légales | {site_name}',
                        'description': 'Mentions légales et conditions d\'utilisation',
                    },
                    'privacy': {
                        'title': f'Politique de confidentialité | {site_name}',
                        'description': 'Notre politique de protection des données',
                    },
                }

                page_meta = static_pages_meta.get(page_slug, {
                    'title': f'{page_slug.title()} | {site_name}',
                    'description': site_name
                })

                metadata['title'] = page_meta['title']
                metadata['description'] = page_meta['description']
                metadata['og_title'] = metadata['title']
                metadata['og_description'] = metadata['description']
                metadata['canonical_url'] = f'{site_url}/{page_slug}'

            _logger.info(f"Metadata generated for page_type={page_type}, resource_id={resource_id}")

            return {
                'success': True,
                'data': metadata
            }

        except Exception as e:
            _logger.error(f"Get metadata error: {e}", exc_info=True)
            return {
                'success': False,
                'error': 'Une erreur est survenue'
            }
