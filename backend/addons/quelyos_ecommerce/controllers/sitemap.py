# -*- coding: utf-8 -*-

import json
from datetime import datetime
from odoo import http
from odoo.http import request
from .base_controller import BaseEcommerceController


class SitemapController(BaseEcommerceController):
    """Sitemap generation controller"""

    @http.route('/api/ecommerce/sitemap.xml', type='http', auth='public', csrf=False, methods=['GET'])
    def sitemap_xml(self, **kwargs):
        """Generate sitemap.xml"""
        try:
            # Base URL
            base_url = request.env['ir.config_parameter'].sudo().get_param('web.base.url')
            if not base_url:
                base_url = 'https://example.com'  # Fallback

            xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
            xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

            # Homepage
            xml_content += '  <url>\n'
            xml_content += f'    <loc>{base_url}/</loc>\n'
            xml_content += f'    <lastmod>{datetime.now().strftime("%Y-%m-%d")}</lastmod>\n'
            xml_content += '    <changefreq>daily</changefreq>\n'
            xml_content += '    <priority>1.0</priority>\n'
            xml_content += '  </url>\n'

            # TODO: Re-enable if website_sale module is installed
            # Categories
            # categories = request.env['product.public.category'].sudo().search([])
            # for category in categories:
            #     seo = request.env['seo.metadata'].sudo().search([
            #         ('model_name', '=', 'product.public.category'),
            #         ('res_id', '=', category.id)
            #     ], limit=1)
            #
            #     priority = seo.sitemap_priority if seo else 0.8
            #     changefreq = seo.sitemap_changefreq if seo else 'weekly'
            #
            #     xml_content += '  <url>\n'
            #     xml_content += f'    <loc>{base_url}/category/{category.id}</loc>\n'
            #     xml_content += f'    <lastmod>{category.write_date.strftime("%Y-%m-%d") if category.write_date else datetime.now().strftime("%Y-%m-%d")}</lastmod>\n'
            #     xml_content += f'    <changefreq>{changefreq}</changefreq>\n'
            #     xml_content += f'    <priority>{priority}</priority>\n'
            #     xml_content += '  </url>\n'

            # Products (only published, in stock or allow_out_of_stock_order)
            products = request.env['product.template'].sudo().search([
                ('website_published', '=', True),
                '|',
                ('qty_available', '>', 0),
                ('allow_out_of_stock_order', '=', True)
            ])

            for product in products:
                seo = request.env['seo.metadata'].sudo().search([
                    ('model_name', '=', 'product.template'),
                    ('res_id', '=', product.id)
                ], limit=1)

                priority = seo.sitemap_priority if seo else 0.6
                changefreq = seo.sitemap_changefreq if seo else 'weekly'

                # Use slug if available, otherwise use ID
                product_url = f"{base_url}/product/{product.slug if product.slug else product.id}"

                xml_content += '  <url>\n'
                xml_content += f'    <loc>{product_url}</loc>\n'
                xml_content += f'    <lastmod>{product.write_date.strftime("%Y-%m-%d") if product.write_date else datetime.now().strftime("%Y-%m-%d")}</lastmod>\n'
                xml_content += f'    <changefreq>{changefreq}</changefreq>\n'
                xml_content += f'    <priority>{priority}</priority>\n'
                xml_content += '  </url>\n'

            # Static pages
            static_pages = [
                {'url': '/about', 'priority': 0.5, 'changefreq': 'monthly'},
                {'url': '/contact', 'priority': 0.5, 'changefreq': 'monthly'},
                {'url': '/faq', 'priority': 0.4, 'changefreq': 'monthly'},
            ]

            for page in static_pages:
                xml_content += '  <url>\n'
                xml_content += f'    <loc>{base_url}{page["url"]}</loc>\n'
                xml_content += f'    <lastmod>{datetime.now().strftime("%Y-%m-%d")}</lastmod>\n'
                xml_content += f'    <changefreq>{page["changefreq"]}</changefreq>\n'
                xml_content += f'    <priority>{page["priority"]}</priority>\n'
                xml_content += '  </url>\n'

            xml_content += '</urlset>'

            # Return XML response
            return request.make_response(
                xml_content,
                headers=[
                    ('Content-Type', 'application/xml'),
                    ('Cache-Control', 'public, max-age=3600'),  # Cache for 1 hour
                ]
            )

        except Exception as e:
            return request.make_response(
                '<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>',
                status=500,
                headers=[('Content-Type', 'application/xml')]
            )

    @http.route('/api/ecommerce/sitemap/index.json', type='json', auth='public', methods=['POST'])
    def sitemap_index(self, **kwargs):
        """Get sitemap index (for large sites with multiple sitemaps)"""
        try:
            base_url = request.env['ir.config_parameter'].sudo().get_param('web.base.url')

            # Count total URLs
            # TODO: Re-enable if website_sale module is installed
            # categories_count = request.env['product.public.category'].sudo().search_count([])
            categories_count = 0  # Temporarily disabled until website_sale is installed
            products_count = request.env['product.template'].sudo().search_count([
                ('website_published', '=', True)
            ])

            sitemaps = []

            # If site is large, split into multiple sitemaps
            if products_count > 1000:
                # Product sitemaps (paginated)
                pages = (products_count // 1000) + 1
                for page in range(pages):
                    sitemaps.append({
                        'url': f'{base_url}/api/ecommerce/sitemap/products.xml?page={page}',
                        'lastmod': datetime.now().isoformat(),
                    })

                # Categories sitemap
                sitemaps.append({
                    'url': f'{base_url}/api/ecommerce/sitemap/categories.xml',
                    'lastmod': datetime.now().isoformat(),
                })

            else:
                # Single sitemap
                sitemaps.append({
                    'url': f'{base_url}/api/ecommerce/sitemap.xml',
                    'lastmod': datetime.now().isoformat(),
                })

            return {
                'success': True,
                'data': {
                    'sitemaps': sitemaps,
                    'total_urls': categories_count + products_count + 10,  # +10 for static pages
                }
            }

        except Exception as e:
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/robots.txt', type='http', auth='public', csrf=False, methods=['GET'])
    def robots_txt(self, **kwargs):
        """Generate robots.txt"""
        try:
            base_url = request.env['ir.config_parameter'].sudo().get_param('web.base.url')

            robots_content = "# Robots.txt for Quelyos E-commerce\n\n"
            robots_content += "User-agent: *\n"
            robots_content += "Allow: /\n"
            robots_content += "Disallow: /admin/\n"
            robots_content += "Disallow: /cart/\n"
            robots_content += "Disallow: /checkout/\n"
            robots_content += "Disallow: /account/\n"
            robots_content += "Disallow: /api/\n"
            robots_content += "\n"
            robots_content += f"Sitemap: {base_url}/api/ecommerce/sitemap.xml\n"

            return request.make_response(
                robots_content,
                headers=[
                    ('Content-Type', 'text/plain'),
                    ('Cache-Control', 'public, max-age=86400'),  # Cache for 24 hours
                ]
            )

        except Exception as e:
            return request.make_response(
                "User-agent: *\nDisallow: /",
                headers=[('Content-Type', 'text/plain')]
            )
