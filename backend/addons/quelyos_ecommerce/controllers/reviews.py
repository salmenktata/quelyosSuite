# -*- coding: utf-8 -*-

import base64
from odoo import http
from odoo.http import request
from odoo.exceptions import ValidationError


class ReviewsController(http.Controller):

    @http.route('/api/ecommerce/products/<int:product_id>/reviews', type='json', auth='public', methods=['GET'], csrf=False)
    def get_product_reviews(self, product_id, limit=10, offset=0, sort_by='recent', **kwargs):
        """
        Get reviews for a product
        
        Args:
            product_id: Product template ID
            limit: Number of reviews to return (default 10)
            offset: Offset for pagination (default 0)
            sort_by: Sort method: 'recent', 'helpful', 'highest', 'lowest'
        
        Returns:
            {
                'reviews': [...],
                'stats': {...},
                'total': int
            }
        """
        try:
            product = request.env['product.template'].sudo().browse(product_id)
            if not product.exists():
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            # Build domain
            domain = [
                ('product_id', '=', product_id),
                ('state', '=', 'approved')
            ]

            # Determine order
            order_map = {
                'recent': 'create_date desc',
                'helpful': 'helpful_count desc, create_date desc',
                'highest': 'rating desc, create_date desc',
                'lowest': 'rating asc, create_date desc'
            }
            order = order_map.get(sort_by, 'create_date desc')

            # Get reviews
            Review = request.env['product.review'].sudo()
            total = Review.search_count(domain)
            reviews = Review.search(domain, limit=limit, offset=offset, order=order)

            # Get stats
            stats = product.sudo().get_review_stats()

            return {
                'success': True,
                'reviews': [review.get_api_data() for review in reviews],
                'stats': stats,
                'total': total
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/ecommerce/products/<int:product_id>/reviews', type='json', auth='user', methods=['POST'], csrf=False)
    def submit_review(self, product_id, rating, title, comment, images=None, **kwargs):
        """
        Submit a new product review
        
        Args:
            product_id: Product template ID
            rating: Rating (1-5)
            title: Review title
            comment: Review comment
            images: List of base64 encoded images (optional)
        
        Returns:
            {
                'success': bool,
                'review': {...} or 'error': str
            }
        """
        try:
            # Get current user
            partner = request.env.user.partner_id
            if not partner:
                return {
                    'success': False,
                    'error': 'User not authenticated'
                }

            # Validate product exists
            product = request.env['product.template'].sudo().browse(product_id)
            if not product.exists():
                return {
                    'success': False,
                    'error': 'Product not found'
                }

            # Check if user already reviewed this product
            existing_review = request.env['product.review'].sudo().search([
                ('product_id', '=', product_id),
                ('partner_id', '=', partner.id)
            ], limit=1)

            if existing_review:
                return {
                    'success': False,
                    'error': 'You have already reviewed this product'
                }

            # Create review
            review_data = {
                'product_id': product_id,
                'partner_id': partner.id,
                'rating': int(rating),
                'title': title,
                'comment': comment,
                'state': 'pending'  # Requires admin approval
            }

            review = request.env['product.review'].sudo().create(review_data)

            # Handle images if provided
            if images and isinstance(images, list):
                for idx, image_data in enumerate(images[:5]):  # Max 5 images
                    try:
                        # Assume image_data is base64 encoded
                        request.env['product.review.image'].sudo().create({
                            'review_id': review.id,
                            'image': image_data,
                            'sequence': idx + 1
                        })
                    except Exception as img_error:
                        # Log error but don't fail the review
                        pass

            return {
                'success': True,
                'review': review.get_api_data(),
                'message': 'Review submitted successfully. It will be visible after approval.'
            }

        except ValidationError as e:
            return {
                'success': False,
                'error': str(e)
            }
        except Exception as e:
            return {
                'success': False,
                'error': 'An error occurred while submitting your review'
            }

    @http.route('/api/ecommerce/reviews/<int:review_id>/helpful', type='json', auth='user', methods=['POST'], csrf=False)
    def mark_review_helpful(self, review_id, **kwargs):
        """
        Mark a review as helpful
        
        Args:
            review_id: Review ID
        
        Returns:
            {'success': bool, 'helpful_count': int}
        """
        try:
            partner = request.env.user.partner_id
            if not partner:
                return {
                    'success': False,
                    'error': 'User not authenticated'
                }

            review = request.env['product.review'].sudo().browse(review_id)
            if not review.exists():
                return {
                    'success': False,
                    'error': 'Review not found'
                }

            # Mark as helpful
            success = review.mark_helpful(partner.id)

            return {
                'success': success,
                'helpful_count': review.helpful_count,
                'message': 'Marked as helpful' if success else 'Already marked as helpful'
            }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
