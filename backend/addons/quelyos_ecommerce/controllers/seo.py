# -*- coding: utf-8 -*-

import json
from odoo import http
from odoo.http import request
from .base_controller import BaseEcommerceController


class SeoController(BaseEcommerceController):
    """SEO metadata controller for frontend"""

    @http.route('/api/ecommerce/seo/product/<int:product_id>', type='json', auth='public', methods=['POST'])
    def get_product_seo(self, product_id, **kwargs):
        """Get SEO metadata for a product"""
        try:
            product = request.env['product.template'].sudo().browse(product_id)

            if not product.exists():
                return self._error_response('Product not found', 404)

            seo_data = product.get_seo_data(product_id)

            return {
                'success': True,
                'data': seo_data
            }

        except Exception as e:
            return self._error_response(str(e), 500)

    # TODO: Re-enable if website_sale module is installed
    # @http.route('/api/ecommerce/seo/category/<int:category_id>', type='json', auth='public', methods=['POST'])
    # def get_category_seo(self, category_id, **kwargs):
    #     """Get SEO metadata for a category"""
    #     try:
    #         category = request.env['product.public.category'].sudo().browse(category_id)
    #
    #         if not category.exists():
    #             return self._error_response('Category not found', 404)
    #
    #         seo_data = category.get_seo_data(category_id)
    #
    #         return {
    #             'success': True,
    #             'data': seo_data
    #         }
    #
    #     except Exception as e:
    #         return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/seo/breadcrumbs/<int:product_id>', type='json', auth='public', methods=['POST'])
    def get_breadcrumbs(self, product_id, **kwargs):
        """Get breadcrumb structured data for a product"""
        try:
            product = request.env['product.template'].sudo().browse(product_id)

            if not product.exists():
                return self._error_response('Product not found', 404)

            # Build breadcrumb list
            breadcrumb_items = [
                {
                    'position': 1,
                    'name': 'Accueil',
                    'item': request.env['ir.config_parameter'].sudo().get_param('web.base.url') or 'https://example.com'
                }
            ]

            position = 2

            # Add category hierarchy
            if product.public_categ_ids:
                category = product.public_categ_ids[0]  # Take first category

                # Build category path (from parent to child)
                category_path = []
                current = category
                while current:
                    category_path.insert(0, current)
                    current = current.parent_id

                # Add categories to breadcrumb
                for cat in category_path:
                    breadcrumb_items.append({
                        'position': position,
                        'name': cat.name,
                        'item': f"{breadcrumb_items[0]['item']}/category/{cat.id}"
                    })
                    position += 1

            # Add product
            breadcrumb_items.append({
                'position': position,
                'name': product.name,
                'item': f"{breadcrumb_items[0]['item']}/product/{product.slug if product.slug else product.id}"
            })

            # Build Schema.org BreadcrumbList
            structured_data = {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                'itemListElement': [
                    {
                        '@type': 'ListItem',
                        'position': item['position'],
                        'name': item['name'],
                        'item': item['item']
                    }
                    for item in breadcrumb_items
                ]
            }

            return {
                'success': True,
                'data': {
                    'breadcrumbs': breadcrumb_items,
                    'structured_data': structured_data
                }
            }

        except Exception as e:
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/seo/organization', type='json', auth='public', methods=['POST'])
    def get_organization_schema(self, **kwargs):
        """Get Organization schema for homepage"""
        try:
            company = request.env['res.company'].sudo().search([], limit=1)
            base_url = request.env['ir.config_parameter'].sudo().get_param('web.base.url') or 'https://example.com'

            structured_data = {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                'name': company.name if company else 'Quelyos',
                'url': base_url,
                'logo': f'{base_url}/web/image/res.company/{company.id}/logo' if company else '',
                'contactPoint': {
                    '@type': 'ContactPoint',
                    'contactType': 'customer service',
                    'email': company.email if company and company.email else 'contact@quelyos.com',
                    'telephone': company.phone if company and company.phone else '',
                },
                'sameAs': [
                    # Add social media links here
                ]
            }

            return {
                'success': True,
                'data': {
                    'structured_data': structured_data
                }
            }

        except Exception as e:
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/seo/config', type='json', auth='public', methods=['POST'])
    def get_seo_config(self, **kwargs):
        """Get global SEO configuration"""
        try:
            company = request.env['res.company'].sudo().search([], limit=1)
            base_url = request.env['ir.config_parameter'].sudo().get_param('web.base.url') or 'https://example.com'

            # Get ecommerce config
            ecommerce_config = request.env['ecommerce.config'].sudo().search([], limit=1)

            return {
                'success': True,
                'data': {
                    'site_name': company.name if company else 'Quelyos',
                    'base_url': base_url,
                    'default_og_image': f'{base_url}/web/image/res.company/{company.id}/logo' if company else '',
                    'twitter_site': ecommerce_config.twitter_handle if ecommerce_config and hasattr(ecommerce_config, 'twitter_handle') else '',
                    'facebook_app_id': ecommerce_config.facebook_app_id if ecommerce_config and hasattr(ecommerce_config, 'facebook_app_id') else '',
                }
            }

        except Exception as e:
            return self._error_response(str(e), 500)
