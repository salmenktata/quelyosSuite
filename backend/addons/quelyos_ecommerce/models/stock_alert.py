# -*- coding: utf-8 -*-
"""
Stock Alert Subscription System
Notifies customers when out-of-stock products are back in stock
"""

import logging
from datetime import datetime, timedelta
from odoo import models, fields, api
from odoo.exceptions import ValidationError

_logger = logging.getLogger(__name__)


class StockAlertSubscription(models.Model):
    _name = 'stock.alert.subscription'
    _description = 'Stock Alert Subscription'
    _order = 'create_date desc'

    partner_id = fields.Many2one(
        'res.partner',
        string='Customer',
        required=True,
        ondelete='cascade',
        index=True
    )
    product_id = fields.Many2one(
        'product.template',
        string='Product',
        required=True,
        ondelete='cascade',
        index=True
    )
    email = fields.Char(
        string='Email',
        required=True,
        help='Email to send notification to'
    )
    active = fields.Boolean(
        string='Active',
        default=True,
        help='Inactive subscriptions will not receive notifications'
    )
    email_sent = fields.Boolean(
        string='Email Sent',
        default=False,
        help='True if restock notification has been sent'
    )
    email_sent_date = fields.Datetime(
        string='Email Sent Date',
        readonly=True
    )
    create_date = fields.Datetime(
        string='Subscription Date',
        readonly=True
    )

    _sql_constraints = [
        ('unique_partner_product', 'unique(partner_id, product_id, active)',
         'You are already subscribed to alerts for this product!')
    ]

    @api.model
    def _cron_check_restocks(self):
        """
        Cron job to check for restocked products and send notifications
        Runs every hour
        """
        _logger.info("Running stock alert restock check...")

        # Find active subscriptions where email has not been sent
        subscriptions = self.search([
            ('active', '=', True),
            ('email_sent', '=', False),
        ])

        if not subscriptions:
            _logger.info("No active subscriptions to process")
            return

        _logger.info(f"Found {len(subscriptions)} active subscriptions to check")

        # Group by product for efficiency
        products_to_check = {}
        for subscription in subscriptions:
            product_id = subscription.product_id.id
            if product_id not in products_to_check:
                products_to_check[product_id] = []
            products_to_check[product_id].append(subscription)

        # Check stock for each product
        notifications_sent = 0

        for product_id, subs in products_to_check.items():
            product = self.env['product.template'].browse(product_id)

            if not product.exists():
                continue

            # Check if product is now in stock
            # Use qty_available for stock check
            if hasattr(product, 'qty_available') and product.qty_available > 0:
                # Product is back in stock - send notifications
                _logger.info(f"Product {product.name} (ID: {product.id}) is back in stock ({product.qty_available} units)")

                for sub in subs:
                    if sub.send_restock_notification():
                        notifications_sent += 1

        _logger.info(f"Stock alert check complete: {notifications_sent} notifications sent")

    def send_restock_notification(self):
        """Send restock notification email"""
        self.ensure_one()

        if self.email_sent:
            _logger.info(f"Notification already sent for subscription {self.id}")
            return False

        # Get email template
        template = self.env.ref('quelyos_ecommerce.email_template_stock_alert', raise_if_not_found=False)
        if not template:
            _logger.error("Stock alert email template not found")
            return False

        try:
            # Send email
            template.send_mail(self.id, force_send=True, email_values={
                'email_to': self.email,
            })

            # Mark as sent
            self.write({
                'email_sent': True,
                'email_sent_date': fields.Datetime.now(),
            })

            _logger.info(f"Restock notification sent for product {self.product_id.name} to {self.email}")
            return True

        except Exception as e:
            _logger.error(f"Error sending restock notification for subscription {self.id}: {str(e)}")
            return False

    @api.model
    def _cron_cleanup_old_subscriptions(self):
        """
        Cleanup old subscriptions (sent notifications older than 30 days)
        Runs daily
        """
        cutoff_date = datetime.now() - timedelta(days=30)

        old_subscriptions = self.search([
            ('email_sent', '=', True),
            ('email_sent_date', '<', cutoff_date.strftime('%Y-%m-%d %H:%M:%S')),
        ])

        count = len(old_subscriptions)
        old_subscriptions.unlink()

        _logger.info(f"Cleaned up {count} old stock alert subscriptions")


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    stock_alert_subscription_ids = fields.One2many(
        'stock.alert.subscription',
        'product_id',
        string='Stock Alert Subscriptions'
    )
    stock_alert_count = fields.Integer(
        string='Active Stock Alerts',
        compute='_compute_stock_alert_count'
    )

    @api.depends('stock_alert_subscription_ids')
    def _compute_stock_alert_count(self):
        """Count active stock alert subscriptions"""
        for product in self:
            product.stock_alert_count = len(product.stock_alert_subscription_ids.filtered(
                lambda s: s.active and not s.email_sent
            ))
