# -*- coding: utf-8 -*-
"""
Controller API étendu pour le module Store.
Gère: Reviews, FAQ, Collections, Flash Sales, Bundles, Testimonials, Blog, Loyalty, Tickets
"""
import json
import logging
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class StoreExtendedController(BaseController):
    """Controller pour les fonctionnalités étendues du Store"""

    # =========================================================================
    # REVIEWS (Avis clients)
    # =========================================================================

    @http.route('/api/admin/reviews', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_reviews(self, **kwargs):
        """Liste des avis (admin)"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            domain = [('company_id', '=', company.id)]

            # Filtres
            if kwargs.get('state'):
                domain.append(('state', '=', kwargs['state']))
            if kwargs.get('product_id'):
                domain.append(('product_id', '=', kwargs['product_id']))
            if kwargs.get('rating'):
                domain.append(('rating', '=', int(kwargs['rating'])))

            reviews = request.env['quelyos.product.review'].sudo().search(
                domain, limit=kwargs.get('limit', 50), offset=kwargs.get('offset', 0),
                order='create_date desc'
            )
            total = request.env['quelyos.product.review'].sudo().search_count(domain)

            return {
                'success': True,
                'reviews': [r.to_dict() for r in reviews],
                'total': total,
            }
        except Exception as e:
            _logger.error(f'Error fetching reviews: {e}')
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/reviews/<int:review_id>/approve', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def approve_review(self, review_id):
        """Approuver un avis"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            review = request.env['quelyos.product.review'].sudo().browse(review_id)
            if review.exists():
                review.action_approve()
                return {'success': True, 'review': review.to_dict()}
            return {'success': False, 'error': 'Review not found'}
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/reviews/<int:review_id>/reject', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def reject_review(self, review_id, reason=None):
        """Rejeter un avis"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            review = request.env['quelyos.product.review'].sudo().browse(review_id)
            if review.exists():
                review.write({'rejection_reason': reason})
                review.action_reject()
                return {'success': True, 'review': review.to_dict()}
            return {'success': False, 'error': 'Review not found'}
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    # =========================================================================
    # REVIEWS - PUBLIC API (pour vitrine-client)
    # =========================================================================

    @http.route('/api/products/<int:product_id>/reviews', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_product_reviews(self, product_id, limit=10, offset=0):
        """Récupérer les avis approuvés d'un produit (API publique)"""
        try:
            domain = [
                ('product_id', '=', product_id),
                ('state', '=', 'approved'),
            ]

            reviews = request.env['quelyos.product.review'].sudo().search(
                domain, limit=limit, offset=offset, order='create_date desc'
            )
            total = request.env['quelyos.product.review'].sudo().search_count(domain)

            # Calculer la note moyenne et distribution
            all_reviews = request.env['quelyos.product.review'].sudo().search([
                ('product_id', '=', product_id),
                ('state', '=', 'approved'),
            ])

            avg_rating = 0
            rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            if all_reviews:
                ratings = [r.rating for r in all_reviews]
                avg_rating = sum(ratings) / len(ratings)
                for r in all_reviews:
                    rating_distribution[r.rating] = rating_distribution.get(r.rating, 0) + 1

            return {
                'success': True,
                'reviews': [{
                    'id': r.id,
                    'authorName': r.author_name,
                    'rating': r.rating,
                    'title': r.title,
                    'content': r.content,
                    'pros': r.pros,
                    'cons': r.cons,
                    'verifiedPurchase': r.verified_purchase,
                    'sellerReply': r.seller_reply,
                    'sellerReplyDate': r.seller_reply_date.isoformat() if r.seller_reply_date else None,
                    'helpfulYes': r.helpful_yes,
                    'helpfulNo': r.helpful_no,
                    'createdAt': r.create_date.isoformat() if r.create_date else None,
                } for r in reviews],
                'total': total,
                'avgRating': round(avg_rating, 1),
                'ratingDistribution': rating_distribution,
            }
        except Exception as e:
            _logger.error(f'Error fetching product reviews: {e}')
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/products/<int:product_id>/reviews/submit', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def submit_product_review(self, product_id, rating, content, title=None, author_name=None, author_email=None, pros=None, cons=None):
        """Soumettre un nouvel avis (API publique)"""
        try:
            # Vérifier que le produit existe
            product = request.env['product.product'].sudo().browse(product_id)
            if not product.exists():
                return {'success': False, 'error': 'Product not found'}

            # Déterminer l'auteur
            partner_id = None
            if request.env.user and request.env.user.partner_id:
                partner_id = request.env.user.partner_id.id
                if not author_name:
                    author_name = request.env.user.partner_id.name
                if not author_email:
                    author_email = request.env.user.partner_id.email

            if not author_name:
                author_name = 'Anonyme'

            # Créer l'avis (en attente de modération)
            review = request.env['quelyos.product.review'].sudo().create({
                'product_id': product_id,
                'rating': int(rating),
                'title': title or '',
                'content': content,
                'author_name': author_name,
                'author_email': author_email or '',
                'partner_id': partner_id,
                'pros': pros or '',
                'cons': cons or '',
                'state': 'pending',
                'company_id': product.company_id.id if product.company_id else request.env.company.id,
            })

            return {
                'success': True,
                'message': 'Votre avis a été soumis et sera publié après modération.',
                'reviewId': review.id,
            }
        except Exception as e:
            _logger.error(f'Error submitting review: {e}')
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/reviews/<int:review_id>/helpful', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def mark_review_helpful(self, review_id, helpful=True):
        """Marquer un avis comme utile ou non"""
        try:
            review = request.env['quelyos.product.review'].sudo().browse(review_id)
            if not review.exists() or review.state != 'approved':
                return {'success': False, 'error': 'Review not found'}

            if helpful:
                review.helpful_yes += 1
            else:
                review.helpful_no += 1

            return {
                'success': True,
                'helpfulYes': review.helpful_yes,
                'helpfulNo': review.helpful_no,
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/reviews/<int:review_id>/reply', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def reply_review(self, review_id, reply):
        """Répondre à un avis"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            review = request.env['quelyos.product.review'].sudo().browse(review_id)
            if review.exists():
                review.action_reply(reply)
                return {'success': True, 'review': review.to_dict()}
            return {'success': False, 'error': 'Review not found'}
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    # =========================================================================
    # FAQ
    # =========================================================================

    @http.route('/api/admin/faq/categories', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_faq_categories(self):
        """Liste des catégories FAQ"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            categories = request.env['quelyos.faq.category'].sudo().search([
                ('company_id', '=', company.id)
            ])
            return {
                'success': True,
                'categories': [c.to_dict() for c in categories],
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/faq/categories/save', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def save_faq_category(self, **kwargs):
        """Créer/modifier une catégorie FAQ"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            Category = request.env['quelyos.faq.category'].sudo()

            vals = {
                'name': kwargs.get('name'),
                'code': kwargs.get('code'),
                'icon': kwargs.get('icon'),
                'sequence': kwargs.get('sequence', 10),
                'company_id': company.id,
            }

            if kwargs.get('id'):
                cat = Category.browse(kwargs['id'])
                cat.write(vals)
            else:
                cat = Category.create(vals)

            return {'success': True, 'category': cat.to_dict()}
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/faq', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_faqs(self, category_id=None):
        """Liste des FAQ"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            domain = [('company_id', '=', company.id)]
            if category_id:
                domain.append(('category_id', '=', category_id))

            faqs = request.env['quelyos.faq'].sudo().search(domain, order='sequence')
            return {
                'success': True,
                'faqs': [f.to_dict() for f in faqs],
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/faq/save', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def save_faq(self, **kwargs):
        """Créer/modifier une FAQ"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            FAQ = request.env['quelyos.faq'].sudo()

            vals = {
                'question': kwargs.get('question'),
                'answer': kwargs.get('answer'),
                'category_id': kwargs.get('category_id'),
                'sequence': kwargs.get('sequence', 10),
                'is_published': kwargs.get('is_published', True),
                'is_featured': kwargs.get('is_featured', False),
            }

            if kwargs.get('id'):
                faq = FAQ.browse(kwargs['id'])
                faq.write(vals)
            else:
                faq = FAQ.create(vals)

            return {'success': True, 'faq': faq.to_dict()}
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/faq/<int:faq_id>/delete', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def delete_faq(self, faq_id):
        """Supprimer une FAQ"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            faq = request.env['quelyos.faq'].sudo().browse(faq_id)
            if faq.exists():
                faq.unlink()
                return {'success': True}
            return {'success': False, 'error': 'FAQ not found'}
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/faq/public', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_public_faqs(self, category_code=None, **kwargs):
        """Récupérer les FAQ publiées pour le frontend vitrine"""
        try:
            company = request.env.company
            Category = request.env['quelyos.faq.category'].sudo()
            categories = Category.search([
                '|', ('company_id', '=', company.id), ('company_id', '=', False)
            ], order='sequence')
            categories_data = [{
                'id': c.id,
                'name': c.name,
                'code': c.code,
                'icon': c.icon,
            } for c in categories]
            FAQ = request.env['quelyos.faq'].sudo()
            domain = [
                ('is_published', '=', True),
                '|', ('company_id', '=', company.id), ('company_id', '=', False)
            ]
            if category_code:
                cat = Category.search([('code', '=', category_code)], limit=1)
                if cat:
                    domain.append(('category_id', '=', cat.id))
            faqs = FAQ.search(domain, order='sequence')
            faqs_data = [{
                'id': f.id,
                'question': f.question,
                'answer': f.answer,
                'categoryId': f.category_id.id if f.category_id else None,
                'categoryCode': f.category_id.code if f.category_id else None,
                'categoryName': f.category_id.name if f.category_id else None,
                'isFeatured': f.is_featured,
            } for f in faqs]
            return {
                'success': True,
                'data': {
                    'categories': categories_data,
                    'faqs': faqs_data,
                }
            }
        except Exception as e:
            _logger.error(f"Get public FAQs error: {e}", exc_info=True)
            return {'success': False, 'error': 'Erreur serveur'}

    # =========================================================================
    # COLLECTIONS
    # =========================================================================

    @http.route('/api/admin/collections', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_collections(self):
        """Liste des collections"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            collections = request.env['quelyos.collection'].sudo().search([
                ('company_id', '=', company.id)
            ], order='sequence')
            return {
                'success': True,
                'collections': [c.to_dict() for c in collections],
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/collections/save', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def save_collection(self, **kwargs):
        """Créer/modifier une collection"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            Collection = request.env['quelyos.collection'].sudo()

            vals = {
                'name': kwargs.get('name'),
                'slug': kwargs.get('slug'),
                'description': kwargs.get('description'),
                'short_description': kwargs.get('short_description'),
                'is_published': kwargs.get('is_published', False),
                'is_featured': kwargs.get('is_featured', False),
                'date_start': kwargs.get('date_start'),
                'date_end': kwargs.get('date_end'),
                'company_id': company.id,
            }

            if kwargs.get('product_ids'):
                vals['product_ids'] = [(6, 0, kwargs['product_ids'])]

            if kwargs.get('id'):
                col = Collection.browse(kwargs['id'])
                col.write(vals)
            else:
                col = Collection.create(vals)

            return {'success': True, 'collection': col.to_dict()}
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    # =========================================================================
    # FLASH SALES
    # =========================================================================

    @http.route('/api/admin/flash-sales', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_flash_sales(self):
        """Liste des ventes flash"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            sales = request.env['quelyos.flash.sale'].sudo().search([
                ('company_id', '=', company.id)
            ], order='date_start desc')
            return {
                'success': True,
                'flashSales': [s.to_dict() for s in sales],
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/flash-sales/save', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def save_flash_sale(self, **kwargs):
        """Créer/modifier une vente flash"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            FlashSale = request.env['quelyos.flash.sale'].sudo()

            vals = {
                'name': kwargs.get('name'),
                'description': kwargs.get('description'),
                'date_start': kwargs.get('date_start'),
                'date_end': kwargs.get('date_end'),
                'is_active': kwargs.get('is_active', True),
                'background_color': kwargs.get('background_color', '#ef4444'),
                'company_id': company.id,
            }

            if kwargs.get('id'):
                sale = FlashSale.browse(kwargs['id'])
                sale.write(vals)
            else:
                sale = FlashSale.create(vals)

            # Gérer les lignes produits
            if kwargs.get('products'):
                sale.line_ids.unlink()
                for p in kwargs['products']:
                    request.env['quelyos.flash.sale.line'].sudo().create({
                        'flash_sale_id': sale.id,
                        'product_id': p['product_id'],
                        'original_price': p['original_price'],
                        'flash_price': p['flash_price'],
                        'qty_available': p.get('qty_available', 100),
                    })

            return {'success': True, 'flashSale': sale.to_dict()}
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    # =========================================================================
    # BUNDLES
    # =========================================================================

    @http.route('/api/admin/bundles', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_bundles(self):
        """Liste des bundles"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            bundles = request.env['quelyos.bundle'].sudo().search([
                ('company_id', '=', company.id)
            ], order='sequence')
            return {
                'success': True,
                'bundles': [b.to_dict() for b in bundles],
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/bundles/save', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def save_bundle(self, **kwargs):
        """Créer/modifier un bundle"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            Bundle = request.env['quelyos.bundle'].sudo()

            vals = {
                'name': kwargs.get('name'),
                'slug': kwargs.get('slug'),
                'description': kwargs.get('description'),
                'bundle_price': kwargs.get('bundle_price'),
                'is_published': kwargs.get('is_published', False),
                'company_id': company.id,
            }

            if kwargs.get('id'):
                bundle = Bundle.browse(kwargs['id'])
                bundle.write(vals)
            else:
                bundle = Bundle.create(vals)

            # Gérer les lignes produits
            if kwargs.get('products'):
                bundle.line_ids.unlink()
                for p in kwargs['products']:
                    request.env['quelyos.bundle.line'].sudo().create({
                        'bundle_id': bundle.id,
                        'product_id': p['product_id'],
                        'quantity': p.get('quantity', 1),
                    })

            return {'success': True, 'bundle': bundle.to_dict()}
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    # =========================================================================
    # TESTIMONIALS
    # =========================================================================

    @http.route('/api/admin/testimonials', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_testimonials(self):
        """Liste des témoignages"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            testimonials = request.env['quelyos.testimonial'].sudo().search([
                ('company_id', '=', company.id)
            ], order='sequence')
            return {
                'success': True,
                'testimonials': [t.to_dict() for t in testimonials],
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/testimonials/save', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def save_testimonial(self, **kwargs):
        """Créer/modifier un témoignage"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            Testimonial = request.env['quelyos.testimonial'].sudo()

            vals = {
                'customer_name': kwargs.get('customer_name'),
                'customer_title': kwargs.get('customer_title'),
                'customer_company': kwargs.get('customer_company'),
                'content': kwargs.get('content'),
                'rating': kwargs.get('rating', 5),
                'is_published': kwargs.get('is_published', False),
                'is_featured': kwargs.get('is_featured', False),
                'display_on': kwargs.get('display_on', 'homepage'),
                'company_id': company.id,
            }

            if kwargs.get('id'):
                testimonial = Testimonial.browse(kwargs['id'])
                testimonial.write(vals)
            else:
                testimonial = Testimonial.create(vals)

            return {'success': True, 'testimonial': testimonial.to_dict()}
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    # =========================================================================
    # BLOG
    # =========================================================================

    @http.route('/api/admin/blog/categories', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_blog_categories(self):
        """Liste des catégories blog"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            categories = request.env['quelyos.blog.category'].sudo().search([
                ('company_id', '=', company.id)
            ])
            return {
                'success': True,
                'categories': [c.to_dict() for c in categories],
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/blog/posts', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_blog_posts(self, **kwargs):
        """Liste des articles blog"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            domain = [('company_id', '=', company.id)]

            if kwargs.get('category_id'):
                domain.append(('category_id', '=', kwargs['category_id']))
            if kwargs.get('state'):
                domain.append(('state', '=', kwargs['state']))

            posts = request.env['quelyos.blog.post'].sudo().search(
                domain, limit=kwargs.get('limit', 50), order='published_date desc'
            )
            return {
                'success': True,
                'posts': [p.to_dict(include_content=False) for p in posts],
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/blog/posts/<int:post_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_blog_post(self, post_id):
        """Détail d'un article"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            post = request.env['quelyos.blog.post'].sudo().browse(post_id)
            if post.exists():
                return {'success': True, 'post': post.to_dict()}
            return {'success': False, 'error': 'Post not found'}
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/blog/posts/save', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def save_blog_post(self, **kwargs):
        """Créer/modifier un article"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            Post = request.env['quelyos.blog.post'].sudo()

            vals = {
                'title': kwargs.get('title'),
                'slug': kwargs.get('slug'),
                'excerpt': kwargs.get('excerpt'),
                'content': kwargs.get('content'),
                'category_id': kwargs.get('category_id'),
                'state': kwargs.get('state', 'draft'),
                'is_featured': kwargs.get('is_featured', False),
            }

            if kwargs.get('id'):
                post = Post.browse(kwargs['id'])
                post.write(vals)
            else:
                post = Post.create(vals)

            return {'success': True, 'post': post.to_dict()}
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    # =========================================================================
    # LOYALTY
    # =========================================================================

    @http.route('/api/admin/loyalty/program', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_loyalty_program(self):
        """Récupérer le programme de fidélité"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            program = request.env['quelyos.loyalty.program'].sudo().search([
                ('company_id', '=', company.id)
            ], limit=1)
            if program:
                return {'success': True, 'program': program.to_dict()}
            return {'success': True, 'program': None}
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/loyalty/program/save', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def save_loyalty_program(self, **kwargs):
        """Créer/modifier le programme de fidélité"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            Program = request.env['quelyos.loyalty.program'].sudo()

            vals = {
                'name': kwargs.get('name'),
                'is_active': kwargs.get('is_active', True),
                'points_per_currency': kwargs.get('points_per_currency', 1),
                'points_value': kwargs.get('points_value', 0.01),
                'min_points_redeem': kwargs.get('min_points_redeem', 100),
                'company_id': company.id,
            }

            program = Program.search([('company_id', '=', company.id)], limit=1)
            if program:
                program.write(vals)
            else:
                program = Program.create(vals)

            # Gérer les niveaux
            if kwargs.get('levels'):
                program.level_ids.unlink()
                for level in kwargs['levels']:
                    request.env['quelyos.loyalty.level'].sudo().create({
                        'program_id': program.id,
                        'name': level['name'],
                        'min_points': level['min_points'],
                        'points_multiplier': level.get('points_multiplier', 1),
                        'discount_percent': level.get('discount_percent', 0),
                        'free_shipping': level.get('free_shipping', False),
                        'color': level.get('color', '#6b7280'),
                    })

            return {'success': True, 'program': program.to_dict()}
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/loyalty/members', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_loyalty_members(self, **kwargs):
        """Liste des membres fidélité"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            members = request.env['quelyos.loyalty.member'].sudo().search([
                ('company_id', '=', company.id)
            ], limit=kwargs.get('limit', 50), order='current_points desc')
            return {
                'success': True,
                'members': [m.to_dict() for m in members],
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    # =========================================================================
    # TICKETS (SAV)
    # =========================================================================

    @http.route('/api/admin/tickets', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_tickets(self, **kwargs):
        """Liste des tickets"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            domain = [('company_id', '=', company.id)]

            if kwargs.get('state'):
                domain.append(('state', '=', kwargs['state']))
            if kwargs.get('category'):
                domain.append(('category', '=', kwargs['category']))
            if kwargs.get('priority'):
                domain.append(('priority', '=', kwargs['priority']))

            tickets = request.env['quelyos.ticket'].sudo().search(
                domain, limit=kwargs.get('limit', 50), order='create_date desc'
            )
            total = request.env['quelyos.ticket'].sudo().search_count(domain)

            return {
                'success': True,
                'tickets': [t.to_dict() for t in tickets],
                'total': total,
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/tickets/<int:ticket_id>', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_ticket(self, ticket_id):
        """Détail d'un ticket"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            ticket = request.env['quelyos.ticket'].sudo().browse(ticket_id)
            if ticket.exists():
                data = ticket.to_dict()
                data['messages'] = [m.to_dict() for m in ticket.ticket_message_ids]
                return {'success': True, 'ticket': data}
            return {'success': False, 'error': 'Ticket not found'}
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/tickets/<int:ticket_id>/reply', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def reply_ticket(self, ticket_id, content):
        """Répondre à un ticket"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            ticket = request.env['quelyos.ticket'].sudo().browse(ticket_id)
            if ticket.exists():
                request.env['quelyos.ticket.message'].sudo().create({
                    'ticket_id': ticket_id,
                    'content': content,
                    'author_id': request.env.user.partner_id.id,
                })
                if ticket.state == 'new':
                    ticket.action_open()
                return {'success': True, 'ticket': ticket.to_dict()}
            return {'success': False, 'error': 'Ticket not found'}
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/tickets/<int:ticket_id>/status', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def update_ticket_status(self, ticket_id, state, resolution=None):
        """Mettre à jour le statut d'un ticket"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            ticket = request.env['quelyos.ticket'].sudo().browse(ticket_id)
            if ticket.exists():
                if state == 'resolved':
                    ticket.write({'resolution': resolution})
                    ticket.action_resolve()
                elif state == 'closed':
                    ticket.action_close()
                elif state == 'open':
                    ticket.action_open()
                elif state == 'pending':
                    ticket.action_pending()
                return {'success': True, 'ticket': ticket.to_dict()}
            return {'success': False, 'error': 'Ticket not found'}
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    # =========================================================================
    # SALES REPORTS
    # =========================================================================

    @http.route('/api/admin/reports/sales', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_sales_report(self, date_from=None, date_to=None):
        """Rapport de ventes"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            domain = [
                ('company_id', '=', company.id),
                ('state', 'in', ['sale', 'done'])
            ]
            if date_from:
                domain.append(('date_order', '>=', date_from))
            if date_to:
                domain.append(('date_order', '<=', date_to))

            orders = request.env['sale.order'].sudo().search(domain)

            # Calculs
            total_revenue = sum(o.amount_total for o in orders)
            total_orders = len(orders)
            avg_order_value = total_revenue / total_orders if total_orders > 0 else 0

            # Top produits
            product_sales = {}
            for order in orders:
                for line in order.order_line:
                    pid = line.product_id.product_tmpl_id.id
                    if pid not in product_sales:
                        product_sales[pid] = {
                            'id': pid,
                            'name': line.product_id.name,
                            'quantity': 0,
                            'revenue': 0,
                        }
                    product_sales[pid]['quantity'] += line.product_uom_qty
                    product_sales[pid]['revenue'] += line.price_subtotal

            top_products = sorted(
                product_sales.values(),
                key=lambda x: x['revenue'],
                reverse=True
            )[:10]

            return {
                'success': True,
                'report': {
                    'totalRevenue': total_revenue,
                    'totalOrders': total_orders,
                    'avgOrderValue': round(avg_order_value, 2),
                    'topProducts': top_products,
                }
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    # =========================================================================
    # WISHLIST ANALYTICS
    # =========================================================================

    @http.route('/api/admin/analytics/wishlist', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_wishlist_analytics(self):
        """Analytiques wishlist - produits les plus ajoutés en favoris"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()

            # Requête SQL directe pour performance
            query = """
                SELECT
                    pt.id as product_id,
                    pt.name as product_name,
                    COUNT(DISTINCT wl.partner_id) as wishlist_count
                FROM quelyos_wishlist_item wl
                JOIN product_product pp ON pp.id = wl.product_id
                JOIN product_template pt ON pt.id = pp.product_tmpl_id
                WHERE pt.company_id = %s OR pt.company_id IS NULL
                GROUP BY pt.id, pt.name
                ORDER BY wishlist_count DESC
                LIMIT 20
            """

            try:
                request.env.cr.execute(query, (company.id,))
                results = request.env.cr.dictfetchall()
            except Exception:
                # Table n'existe peut-être pas
                results = []

            return {
                'success': True,
                'products': results,
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    # =========================================================================
    # STOCK ALERTS
    # =========================================================================

    @http.route('/api/admin/stock/alerts', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_stock_alerts(self, threshold=10):
        """Produits avec stock faible"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()

            # Récupérer tous les produits stockables
            all_products = request.env['product.product'].sudo().search([
                ('type', '=', 'product'),
                '|',
                ('company_id', '=', company.id),
                ('company_id', '=', False),
            ])

            # Filtrer en Python car qty_available est un champ calculé
            low_stock = []
            out_of_stock = []

            for p in all_products:
                qty = p.qty_available
                if qty <= 0:
                    out_of_stock.append({
                        'id': p.id,
                        'name': p.name,
                        'sku': p.default_code or '',
                    })
                elif qty <= threshold:
                    low_stock.append({
                        'id': p.id,
                        'name': p.name,
                        'sku': p.default_code or '',
                        'qtyAvailable': qty,
                        'virtualAvailable': p.virtual_available,
                    })

            # Trier par quantité et limiter
            low_stock = sorted(low_stock, key=lambda x: x['qtyAvailable'])[:50]
            out_of_stock = out_of_stock[:50]

            return {
                'success': True,
                'lowStock': low_stock,
                'outOfStock': out_of_stock,
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    # =========================================================================
    # PRODUCT ATTRIBUTES
    # =========================================================================

    @http.route('/api/admin/attributes', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_attributes(self):
        """Liste des attributs produits"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            attributes = request.env['product.attribute'].sudo().search([])
            return {
                'success': True,
                'attributes': [{
                    'id': a.id,
                    'name': a.name,
                    'displayType': a.display_type,
                    'createVariant': a.create_variant,
                    'values': [{
                        'id': v.id,
                        'name': v.name,
                    } for v in a.value_ids],
                } for a in attributes],
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/attributes/save', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def save_attribute(self, **kwargs):
        """Créer/modifier un attribut"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            Attribute = request.env['product.attribute'].sudo()

            vals = {
                'name': kwargs.get('name'),
                'display_type': kwargs.get('display_type', 'radio'),
                'create_variant': kwargs.get('create_variant', 'always'),
            }

            if kwargs.get('id'):
                attr = Attribute.browse(kwargs['id'])
                attr.write(vals)
            else:
                attr = Attribute.create(vals)

            # Gérer les valeurs
            if kwargs.get('values'):
                existing_ids = [v['id'] for v in kwargs['values'] if v.get('id')]
                attr.value_ids.filtered(lambda v: v.id not in existing_ids).unlink()

                for val in kwargs['values']:
                    if val.get('id'):
                        request.env['product.attribute.value'].sudo().browse(val['id']).write({
                            'name': val['name']
                        })
                    else:
                        request.env['product.attribute.value'].sudo().create({
                            'attribute_id': attr.id,
                            'name': val['name'],
                        })

            return {'success': True, 'attribute': {
                'id': attr.id,
                'name': attr.name,
            }}
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    # =========================================================================
    # IMPORT/EXPORT
    # =========================================================================

    @http.route('/api/admin/products/export', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def export_products(self, format='csv'):
        """Exporter les produits"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            products = request.env['product.template'].sudo().search([
                '|',
                ('company_id', '=', company.id),
                ('company_id', '=', False),
            ])

            data = []
            for p in products:
                data.append({
                    'id': p.id,
                    'name': p.name,
                    'sku': p.default_code or '',
                    'price': p.list_price,
                    'cost': p.standard_price,
                    'category': p.categ_id.name if p.categ_id else '',
                    'type': p.type,
                    'active': p.active,
                    'description': p.description_sale or '',
                })

            return {
                'success': True,
                'products': data,
                'count': len(data),
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/products/import', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def import_products(self, products):
        """Importer des produits"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            Product = request.env['product.template'].sudo()

            created = 0
            updated = 0
            errors = []

            for idx, p in enumerate(products):
                try:
                    vals = {
                        'name': p.get('name'),
                        'default_code': p.get('sku'),
                        'list_price': float(p.get('price', 0)),
                        'standard_price': float(p.get('cost', 0)),
                        'type': p.get('type', 'consu'),
                        'sale_ok': True,
                        'purchase_ok': True,
                    }

                    # Chercher catégorie
                    if p.get('category'):
                        categ = request.env['product.category'].sudo().search([
                            ('name', '=', p['category'])
                        ], limit=1)
                        if categ:
                            vals['categ_id'] = categ.id

                    # Update ou create
                    existing = None
                    if p.get('id'):
                        existing = Product.browse(int(p['id']))
                    elif p.get('sku'):
                        existing = Product.search([
                            ('default_code', '=', p['sku'])
                        ], limit=1)

                    if existing and existing.exists():
                        existing.write(vals)
                        updated += 1
                    else:
                        Product.create(vals)
                        created += 1

                except Exception as e:
                    errors.append(f"Ligne {idx + 1}: {str(e)}")

            return {
                'success': True,
                'created': created,
                'updated': updated,
                'errors': errors,
            }
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    # =========================================================================
    # TRENDING PRODUCTS (Produits Tendance)
    # =========================================================================

    @http.route('/api/ecommerce/trending-products', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_trending_products_public(self, **kwargs):
        """
        Liste des produits tendance (API publique pour frontend)
        Retourne les produits marqués comme tendance, triés par score
        """
        try:
            domain = [
                ('sale_ok', '=', True),
                ('active', '=', True),
                ('x_is_trending', '=', True),
            ]

            products = request.env['product.template'].sudo().search(
                domain,
                order='x_trending_score desc, x_social_mentions desc',
                limit=kwargs.get('limit', 6)
            )

            result = []
            for p in products:
                result.append({
                    'id': p.id,
                    'name': p.name,
                    'slug': p.website_slug or p.name.lower().replace(' ', '-'),
                    'price': p.list_price,
                    'image_url': f'/web/image/product.template/{p.id}/image_1920' if p.image_1920 else None,
                    'social_mentions': p.x_social_mentions or 0,
                    'trending_score': p.x_trending_score or 0,
                })

            return {
                'success': True,
                'products': result,
                'total': len(result),
            }
        except Exception as e:
            _logger.error(f'Error fetching trending products: {e}')
            return {'success': True, 'products': [], 'total': 0}

    @http.route('/api/admin/trending-products', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_trending_products_admin(self, **kwargs):
        """Liste des produits pour gestion tendance (admin)"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            domain = [
                ('company_id', '=', company.id),
                ('sale_ok', '=', True),
            ]

            # Filtrer uniquement les tendances si demandé
            if kwargs.get('trending_only'):
                domain.append(('x_is_trending', '=', True))

            # Recherche par nom
            if kwargs.get('search'):
                domain.append(('name', 'ilike', kwargs['search']))

            products = request.env['product.template'].sudo().search(
                domain,
                order='x_is_trending desc, x_trending_score desc',
                limit=kwargs.get('limit', 50),
                offset=kwargs.get('offset', 0)
            )
            total = request.env['product.template'].sudo().search_count(domain)

            result = []
            for p in products:
                result.append({
                    'id': p.id,
                    'name': p.name,
                    'image_url': f'/web/image/product.template/{p.id}/image_128' if p.image_128 else None,
                    'price': p.list_price,
                    'is_trending': p.x_is_trending,
                    'trending_score': p.x_trending_score or 0,
                    'social_mentions': p.x_social_mentions or 0,
                    'is_bestseller': p.x_is_bestseller,
                    'is_featured': p.x_is_featured,
                })

            return {
                'success': True,
                'products': result,
                'total': total,
            }
        except Exception as e:
            _logger.error(f'Error fetching trending products admin: {e}')
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/trending-products/<int:product_id>/toggle', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def toggle_trending(self, product_id, **kwargs):
        """Activer/désactiver le statut tendance d'un produit"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            product = request.env['product.template'].sudo().browse(product_id)
            if not product.exists():
                return {'success': False, 'error': 'Produit non trouvé'}

            product.write({
                'x_is_trending': not product.x_is_trending
            })

            return {
                'success': True,
                'is_trending': product.x_is_trending,
            }
        except Exception as e:
            _logger.error(f'Error toggling trending: {e}')
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/trending-products/<int:product_id>/update', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def update_trending_data(self, product_id, **kwargs):
        """Mettre à jour les données de tendance d'un produit"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            product = request.env['product.template'].sudo().browse(product_id)
            if not product.exists():
                return {'success': False, 'error': 'Produit non trouvé'}

            vals = {}
            if 'is_trending' in kwargs:
                vals['x_is_trending'] = kwargs['is_trending']
            if 'trending_score' in kwargs:
                vals['x_trending_score'] = int(kwargs['trending_score'])
            if 'social_mentions' in kwargs:
                vals['x_social_mentions'] = int(kwargs['social_mentions'])

            if vals:
                product.write(vals)

            return {
                'success': True,
                'product': {
                    'id': product.id,
                    'name': product.name,
                    'is_trending': product.x_is_trending,
                    'trending_score': product.x_trending_score,
                    'social_mentions': product.x_social_mentions,
                }
            }
        except Exception as e:
            _logger.error(f'Error updating trending data: {e}')
            return {'success': False, 'error': 'Erreur serveur'}

    # =========================================================================
    # LIVE EVENTS (Live Shopping)
    # =========================================================================

    @http.route('/api/ecommerce/live-events', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_live_events_public(self, **kwargs):
        """
        Liste des événements live à venir ou en cours (API publique pour frontend)
        Retourne uniquement les événements planifiés ou en direct
        """
        try:
            domain = [
                ('active', '=', True),
                ('state', 'in', ['scheduled', 'live']),
            ]

            events = request.env['quelyos.live.event'].sudo().search(
                domain, order='scheduled_at asc', limit=kwargs.get('limit', 10)
            )

            return {
                'success': True,
                'liveEvents': [e.to_dict() for e in events],
                'total': len(events),
            }
        except Exception as e:
            _logger.error(f'Error fetching public live events: {e}')
            return {'success': True, 'liveEvents': [], 'total': 0}

    @http.route('/api/admin/live-events', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def get_live_events(self, **kwargs):
        """Liste des événements live (admin)"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            domain = [('company_id', '=', company.id)]

            # Filtres optionnels
            if kwargs.get('state'):
                domain.append(('state', '=', kwargs['state']))
            if kwargs.get('active') is not None:
                domain.append(('active', '=', kwargs['active']))

            events = request.env['quelyos.live.event'].sudo().search(
                domain,
                order='scheduled_at desc',
                limit=kwargs.get('limit', 50),
                offset=kwargs.get('offset', 0)
            )
            total = request.env['quelyos.live.event'].sudo().search_count(domain)

            return {
                'success': True,
                'liveEvents': [e.to_dict() for e in events],
                'total': total,
            }
        except Exception as e:
            _logger.error(f'Error fetching live events: {e}')
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/live-events/save', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def save_live_event(self, **kwargs):
        """Créer ou modifier un événement live"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            company = self._get_company_from_tenant()
            LiveEvent = request.env['quelyos.live.event'].sudo()

            vals = {
                'name': kwargs.get('name'),
                'description': kwargs.get('description'),
                'host_name': kwargs.get('hostName') or kwargs.get('host_name'),
                'scheduled_at': kwargs.get('scheduledAt') or kwargs.get('scheduled_at'),
                'duration_minutes': kwargs.get('durationMinutes', 60),
                'thumbnail_url': kwargs.get('thumbnailUrl') or kwargs.get('thumbnail_url'),
                'state': kwargs.get('state', 'draft'),
                'notify_subscribers': kwargs.get('notifySubscribers', True),
                'reminder_hours': kwargs.get('reminderHours', 24),
                'stream_url': kwargs.get('streamUrl'),
                'chat_enabled': kwargs.get('chatEnabled', True),
                'active': kwargs.get('active', True),
                'company_id': company.id,
            }

            # Gérer les produits associés
            product_ids = kwargs.get('productIds') or kwargs.get('product_ids')
            if product_ids:
                vals['product_ids'] = [(6, 0, product_ids)]

            if kwargs.get('id'):
                event = LiveEvent.browse(kwargs['id'])
                if not event.exists():
                    return {'success': False, 'error': 'Événement non trouvé'}
                event.write(vals)
            else:
                event = LiveEvent.create(vals)

            return {'success': True, 'liveEvent': event.to_dict()}
        except Exception as e:
            _logger.error(f'Error saving live event: {e}')
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/live-events/<int:event_id>/delete', type='jsonrpc', auth='user', methods=['POST'], csrf=False)
    def delete_live_event(self, event_id):
        """Supprimer un événement live"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            event = request.env['quelyos.live.event'].sudo().browse(event_id)
            if event.exists():
                event.unlink()
                return {'success': True}
            return {'success': False, 'error': 'Événement non trouvé'}
        except Exception as e:
            _logger.error(f'Error deleting live event: {e}')
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/live-events/<int:event_id>/go-live', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def go_live(self, event_id):
        """Démarrer un live"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            event = request.env['quelyos.live.event'].sudo().browse(event_id)
            if event.exists():
                event.action_go_live()
                return {'success': True, 'liveEvent': event.to_dict()}
            return {'success': False, 'error': 'Événement non trouvé'}
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/live-events/<int:event_id>/end', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def end_live(self, event_id):
        """Terminer un live"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            event = request.env['quelyos.live.event'].sudo().browse(event_id)
            if event.exists():
                event.action_end()
                return {'success': True, 'liveEvent': event.to_dict()}
            return {'success': False, 'error': 'Événement non trouvé'}
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    @http.route('/api/admin/live-events/<int:event_id>/schedule', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
    def schedule_live(self, event_id):
        """Planifier un événement (passer de brouillon à planifié)"""
        auth_error = self._require_backoffice_auth()
        if auth_error:
            return auth_error
        try:
            event = request.env['quelyos.live.event'].sudo().browse(event_id)
            if event.exists():
                event.action_schedule()
                return {'success': True, 'liveEvent': event.to_dict()}
            return {'success': False, 'error': 'Événement non trouvé'}
        except Exception as e:
            return {'success': False, 'error': 'Erreur serveur'}

    def _get_company_from_tenant(self):
        """Helper pour récupérer la company du tenant"""
        tenant_domain = request.httprequest.headers.get('X-Tenant-Domain')
        if tenant_domain:
            tenant = request.env['quelyos.tenant'].sudo().search([
                ('domain', '=', tenant_domain)
            ], limit=1)
            if tenant and tenant.company_id:
                return tenant.company_id
        return request.env.company
