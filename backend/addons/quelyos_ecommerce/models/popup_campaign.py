# -*- coding: utf-8 -*-
"""
Marketing Popup Campaign System
Manages popup campaigns with various trigger conditions
"""

import logging
from odoo import models, fields, api
from datetime import datetime

_logger = logging.getLogger(__name__)


class PopupCampaign(models.Model):
    _name = 'popup.campaign'
    _description = 'Marketing Popup Campaign'
    _order = 'priority desc, id desc'

    name = fields.Char('Campaign Name', required=True)
    active = fields.Boolean('Active', default=True)
    priority = fields.Integer('Priority', default=10, help="Higher priority campaigns are shown first")

    # Content
    title = fields.Char('Popup Title', required=True)
    content = fields.Html('Popup Content', required=True)
    image_url = fields.Char('Image URL', help="Optional image for popup")

    # CTA (Call to Action)
    cta_text = fields.Char('CTA Button Text', default='En savoir plus')
    cta_url = fields.Char('CTA URL', help="URL to redirect when CTA is clicked")

    # Secondary CTA
    secondary_cta_text = fields.Char('Secondary CTA Text', help="Optional secondary button (e.g., 'Non merci')")

    # Coupon / Discount
    has_coupon = fields.Boolean('Include Coupon Code', default=False)
    coupon_code = fields.Char('Coupon Code', help="Display this coupon code in popup")
    discount_percentage = fields.Float('Discount %', help="For display purposes")

    # Trigger Conditions
    trigger_type = fields.Selection([
        ('exit_intent', 'Exit Intent'),
        ('time_based', 'Time Based'),
        ('scroll_based', 'Scroll Based'),
        ('immediate', 'Immediate'),
    ], string='Trigger Type', default='time_based', required=True)

    trigger_delay = fields.Integer('Delay (seconds)', default=30,
                                    help="For time-based: seconds after page load")
    trigger_scroll_percentage = fields.Integer('Scroll %', default=50,
                                                help="For scroll-based: percentage of page scroll")

    # Display Settings
    display_frequency = fields.Selection([
        ('once', 'Once per Visitor'),
        ('daily', 'Once per Day'),
        ('session', 'Once per Session'),
        ('always', 'Always (No Limit)'),
    ], string='Display Frequency', default='daily', required=True)

    # Targeting
    target_pages = fields.Selection([
        ('all', 'All Pages'),
        ('homepage', 'Homepage Only'),
        ('products', 'Product Pages'),
        ('cart', 'Cart Page'),
        ('custom', 'Custom URLs'),
    ], string='Target Pages', default='all', required=True)

    custom_urls = fields.Text('Custom URLs', help="One URL per line (for custom targeting)")

    # A/B Testing
    variant_name = fields.Char('Variant Name', help="For A/B testing (A, B, C, etc.)")
    test_percentage = fields.Integer('Test Percentage', default=100,
                                      help="Percentage of visitors who see this variant (0-100)")

    # Analytics
    views_count = fields.Integer('Views', readonly=True, default=0)
    clicks_count = fields.Integer('Clicks', readonly=True, default=0)
    conversion_rate = fields.Float('Conversion Rate', compute='_compute_conversion_rate', store=True)

    # Validity Period
    start_date = fields.Datetime('Start Date')
    end_date = fields.Datetime('End Date')

    @api.depends('views_count', 'clicks_count')
    def _compute_conversion_rate(self):
        for record in self:
            if record.views_count > 0:
                record.conversion_rate = (record.clicks_count / record.views_count) * 100
            else:
                record.conversion_rate = 0.0

    def get_api_data(self):
        """Return popup data for API"""
        self.ensure_one()

        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'image_url': self.image_url,
            'cta_text': self.cta_text,
            'cta_url': self.cta_url,
            'secondary_cta_text': self.secondary_cta_text,
            'has_coupon': self.has_coupon,
            'coupon_code': self.coupon_code if self.has_coupon else None,
            'discount_percentage': self.discount_percentage if self.has_coupon else None,
            'trigger_type': self.trigger_type,
            'trigger_delay': self.trigger_delay if self.trigger_type == 'time_based' else None,
            'trigger_scroll_percentage': self.trigger_scroll_percentage if self.trigger_type == 'scroll_based' else None,
            'display_frequency': self.display_frequency,
            'variant_name': self.variant_name,
        }

    def increment_views(self):
        """Increment view count"""
        self.ensure_one()
        self.sudo().write({'views_count': self.views_count + 1})

    def increment_clicks(self):
        """Increment click count"""
        self.ensure_one()
        self.sudo().write({'clicks_count': self.clicks_count + 1})

    @api.model
    def get_active_campaign(self, page_url=None):
        """
        Get active popup campaign for current page

        Args:
            page_url: Current page URL (for targeting)

        Returns:
            Popup campaign or None
        """
        now = datetime.now()

        # Base domain
        domain = [
            ('active', '=', True),
            '|', ('start_date', '=', False), ('start_date', '<=', now),
            '|', ('end_date', '=', False), ('end_date', '>=', now),
        ]

        # Apply page targeting
        if page_url:
            # Check if specific page targeting applies
            if '/' == page_url or page_url in ['', '/home']:
                domain.append(('target_pages', 'in', ['all', 'homepage']))
            elif '/products' in page_url:
                domain.append(('target_pages', 'in', ['all', 'products']))
            elif '/cart' in page_url:
                domain.append(('target_pages', 'in', ['all', 'cart']))
            else:
                domain.append(('target_pages', 'in', ['all', 'custom']))

        # Get campaigns ordered by priority
        campaigns = self.search(domain, order='priority desc, id desc')

        if not campaigns:
            return None

        # A/B testing: randomly select based on test_percentage
        import random
        for campaign in campaigns:
            if random.randint(1, 100) <= campaign.test_percentage:
                return campaign

        return None
