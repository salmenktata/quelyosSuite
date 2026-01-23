# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.exceptions import ValidationError


class ProductReview(models.Model):
    _name = 'product.review'
    _description = 'Product Review'
    _order = 'create_date desc'
    _rec_name = 'title'

    # Relations
    product_id = fields.Many2one(
        'product.template',
        string='Product',
        required=True,
        ondelete='cascade',
        index=True
    )
    partner_id = fields.Many2one(
        'res.partner',
        string='Customer',
        required=True,
        ondelete='cascade',
        index=True
    )

    # Review content
    rating = fields.Integer(
        string='Rating',
        required=True,
        help='Rating from 1 to 5 stars'
    )
    title = fields.Char(
        string='Review Title',
        required=True,
        size=100
    )
    comment = fields.Text(
        string='Comment',
        required=True
    )

    # Metadata
    verified_purchase = fields.Boolean(
        string='Verified Purchase',
        compute='_compute_verified_purchase',
        store=True,
        help='Customer has purchased this product'
    )
    helpful_count = fields.Integer(
        string='Helpful Count',
        default=0,
        help='Number of users who found this review helpful'
    )
    helpful_user_ids = fields.Many2many(
        'res.partner',
        'product_review_helpful_rel',
        'review_id',
        'partner_id',
        string='Users who found this helpful'
    )

    # Images
    image_ids = fields.One2many(
        'product.review.image',
        'review_id',
        string='Images',
        help='Images attached to this review (max 5)'
    )
    image_count = fields.Integer(
        string='Number of Images',
        compute='_compute_image_count'
    )

    # Status
    state = fields.Selection([
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    ], default='pending', string='Status')

    # Audit
    user_name = fields.Char(related='partner_id.name', string='User Name', store=True)
    create_date = fields.Datetime(string='Created Date', readonly=True)

    @api.depends('partner_id', 'product_id')
    def _compute_verified_purchase(self):
        """Check if customer has purchased this product"""
        for review in self:
            if review.partner_id and review.product_id:
                # Check for confirmed orders containing this product
                order_lines = self.env['sale.order.line'].search([
                    ('order_id.partner_id', '=', review.partner_id.id),
                    ('order_id.state', 'in', ['sale', 'done']),
                    ('product_id.product_tmpl_id', '=', review.product_id.id)
                ], limit=1)
                review.verified_purchase = bool(order_lines)
            else:
                review.verified_purchase = False

    @api.depends('image_ids')
    def _compute_image_count(self):
        """Count number of images"""
        for review in self:
            review.image_count = len(review.image_ids)

    @api.constrains('rating')
    def _check_rating(self):
        """Validate rating is between 1 and 5"""
        for review in self:
            if review.rating < 1 or review.rating > 5:
                raise ValidationError('Rating must be between 1 and 5 stars.')

    @api.constrains('comment')
    def _check_comment_length(self):
        """Validate comment length"""
        for review in self:
            if len(review.comment) < 10:
                raise ValidationError('Comment must be at least 10 characters long.')
            if len(review.comment) > 1000:
                raise ValidationError('Comment must not exceed 1000 characters.')

    @api.constrains('image_ids')
    def _check_image_limit(self):
        """Validate max 5 images per review"""
        for review in self:
            if len(review.image_ids) > 5:
                raise ValidationError('Maximum 5 images allowed per review.')

    def action_approve(self):
        """Approve the review"""
        self.write({'state': 'approved'})

    def action_reject(self):
        """Reject the review"""
        self.write({'state': 'rejected'})

    def mark_helpful(self, partner_id):
        """Mark review as helpful by a user"""
        self.ensure_one()
        partner = self.env['res.partner'].browse(partner_id)
        if partner not in self.helpful_user_ids:
            self.helpful_user_ids = [(4, partner_id)]
            self.helpful_count += 1
            return True
        return False

    def get_api_data(self):
        """Return review data formatted for API"""
        self.ensure_one()
        return {
            'id': self.id,
            'user_name': self.user_name,
            'rating': self.rating,
            'title': self.title,
            'comment': self.comment,
            'created_at': self.create_date.isoformat() if self.create_date else None,
            'verified_purchase': self.verified_purchase,
            'helpful_count': self.helpful_count,
            'images': [img.image_url for img in self.image_ids],
        }


class ProductReviewImage(models.Model):
    _name = 'product.review.image'
    _description = 'Product Review Image'
    _order = 'sequence, id'

    review_id = fields.Many2one(
        'product.review',
        string='Review',
        required=True,
        ondelete='cascade'
    )
    image = fields.Binary(
        string='Image',
        required=True,
        attachment=True
    )
    image_url = fields.Char(
        string='Image URL',
        compute='_compute_image_url'
    )
    sequence = fields.Integer(string='Sequence', default=10)

    @api.depends('image')
    def _compute_image_url(self):
        """Generate image URL"""
        for img in self:
            if img.image:
                img.image_url = f'/web/image/product.review.image/{img.id}/image'
            else:
                img.image_url = False


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    review_ids = fields.One2many(
        'product.review',
        'product_id',
        string='Reviews',
        domain=[('state', '=', 'approved')]
    )
    review_count = fields.Integer(
        string='Number of Reviews',
        compute='_compute_review_stats',
        store=True
    )
    average_rating = fields.Float(
        string='Average Rating',
        compute='_compute_review_stats',
        store=True,
        digits=(3, 2)
    )
    rating_distribution = fields.Json(
        string='Rating Distribution',
        compute='_compute_review_stats',
        store=True
    )

    @api.depends('review_ids', 'review_ids.rating', 'review_ids.state')
    def _compute_review_stats(self):
        """Compute review statistics"""
        for product in self:
            approved_reviews = product.review_ids.filtered(lambda r: r.state == 'approved')

            if approved_reviews:
                # Count
                product.review_count = len(approved_reviews)

                # Average rating
                total_rating = sum(approved_reviews.mapped('rating'))
                product.average_rating = total_rating / len(approved_reviews)

                # Distribution
                distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
                for review in approved_reviews:
                    distribution[review.rating] += 1
                product.rating_distribution = distribution
            else:
                product.review_count = 0
                product.average_rating = 0.0
                product.rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}

    def get_review_stats(self):
        """Get review statistics for API"""
        self.ensure_one()
        return {
            'average_rating': self.average_rating,
            'total_reviews': self.review_count,
            'rating_distribution': self.rating_distribution or {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        }
