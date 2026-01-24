# -*- coding: utf-8 -*-
"""
Abandoned Cart Recovery System
Tracks abandoned carts and sends recovery emails
"""

import logging
import uuid
from datetime import datetime, timedelta
from odoo import models, fields, api
from odoo.http import request

_logger = logging.getLogger(__name__)


class AbandonedCart(models.Model):
    _name = 'abandoned.cart'
    _description = 'Abandoned Cart'
    _order = 'create_date desc'

    name = fields.Char('Name', compute='_compute_name', store=True)
    session_id = fields.Char('Session ID', index=True)
    partner_id = fields.Many2one('res.partner', 'Customer', index=True)
    email = fields.Char('Email', required=True)

    # Cart details
    cart_data = fields.Text('Cart Data (JSON)')
    product_count = fields.Integer('Product Count')
    total_amount = fields.Float('Total Amount')

    # Recovery tracking
    recovery_token = fields.Char('Recovery Token', default=lambda self: str(uuid.uuid4()), index=True, copy=False)
    recovery_url = fields.Char('Recovery URL', compute='_compute_recovery_url')

    # Status
    state = fields.Selection([
        ('pending', 'Pending'),
        ('email_sent', 'Email Sent'),
        ('reminded', 'Reminded'),
        ('recovered', 'Recovered'),
        ('expired', 'Expired'),
    ], default='pending', string='State', index=True)

    # Email tracking
    email_sent_date = fields.Datetime('Email Sent Date')
    email_opened_date = fields.Datetime('Email Opened Date')
    reminder_sent_date = fields.Datetime('Reminder Sent Date')
    recovered_date = fields.Datetime('Recovered Date')

    # Recovery order
    order_id = fields.Many2one('sale.order', 'Recovered Order')

    # Coupon incentive
    coupon_code = fields.Char('Recovery Coupon Code')
    # TODO: Fix comodel name - coupon.code model doesn't exist
    # coupon_id = fields.Many2one('coupon.code', 'Recovery Coupon')

    @api.depends('partner_id', 'email', 'session_id')
    def _compute_name(self):
        for record in self:
            if record.partner_id:
                record.name = f"Abandoned Cart - {record.partner_id.name}"
            elif record.email:
                record.name = f"Abandoned Cart - {record.email}"
            else:
                record.name = f"Abandoned Cart - {record.session_id}"

    @api.depends('recovery_token')
    def _compute_recovery_url(self):
        base_url = self.env['ir.config_parameter'].sudo().get_param('web.base.url')
        for record in self:
            if record.recovery_token:
                # Frontend URL for cart recovery
                frontend_url = base_url.replace(':8069', ':3000')  # Adjust port for Next.js
                record.recovery_url = f"{frontend_url}/cart/recover?token={record.recovery_token}"
            else:
                record.recovery_url = False

    def send_recovery_email(self, with_coupon=False):
        """Send abandoned cart recovery email"""
        self.ensure_one()

        if self.state in ['recovered', 'expired']:
            _logger.info(f"Skipping email for cart {self.id} - state: {self.state}")
            return False

        # Create coupon if requested
        # TODO: Fix coupon_id field
        # if with_coupon and not self.coupon_id:
        #     self._create_recovery_coupon()

        # Get email template
        template = self.env.ref('quelyos_ecommerce.email_template_cart_abandoned', raise_if_not_found=False)
        if not template:
            _logger.error("Abandoned cart email template not found")
            return False

        # Send email
        try:
            template.send_mail(self.id, force_send=True, email_values={
                'email_to': self.email,
            })

            # Update state
            if self.state == 'email_sent':
                self.write({
                    'state': 'reminded',
                    'reminder_sent_date': fields.Datetime.now(),
                })
            else:
                self.write({
                    'state': 'email_sent',
                    'email_sent_date': fields.Datetime.now(),
                })

            _logger.info(f"Recovery email sent for cart {self.id}")
            return True

        except Exception as e:
            _logger.error(f"Error sending recovery email for cart {self.id}: {str(e)}")
            return False

    def _create_recovery_coupon(self):
        """Create a special coupon for cart recovery"""
        self.ensure_one()

        # Generate unique coupon code
        code = f"RECOVER10-{self.recovery_token[:8].upper()}"

        # Check if coupon program exists
        coupon_program = self.env['coupon.program'].search([
            ('name', '=', 'Abandoned Cart Recovery')
        ], limit=1)

        if not coupon_program:
            # Create coupon program
            coupon_program = self.env['coupon.program'].create({
                'name': 'Abandoned Cart Recovery',
                'program_type': 'promotion_program',
                'discount_type': 'percentage',
                'discount_percentage': 10.0,
                'validity_duration': 7,  # Valid for 7 days
                'maximum_use_number': 1,
            })

        # Create coupon code
        try:
            coupon = self.env['coupon.code'].create({
                'code': code,
                'program_id': coupon_program.id,
                'partner_id': self.partner_id.id if self.partner_id else False,
            })

            self.write({
                'coupon_code': code,
                # TODO: Fix coupon_id field
                # 'coupon_id': coupon.id,
            })

            _logger.info(f"Recovery coupon created: {code}")

        except Exception as e:
            _logger.error(f"Error creating recovery coupon: {str(e)}")

    def mark_as_recovered(self, order_id):
        """Mark cart as recovered"""
        self.ensure_one()

        self.write({
            'state': 'recovered',
            'recovered_date': fields.Datetime.now(),
            'order_id': order_id,
        })

        _logger.info(f"Cart {self.id} marked as recovered - Order {order_id}")

    @api.model
    def _cron_detect_abandoned_carts(self):
        """
        Cron job to detect abandoned carts
        Runs every hour to find carts inactive for > 1 hour
        """
        _logger.info("Running abandoned cart detection...")

        # Cutoff time: 1 hour ago
        cutoff_time = datetime.now() - timedelta(hours=1)

        # Find recent orders that might have abandoned carts
        # Look for sale.orders in draft/sent state (not confirmed)
        abandoned_orders = self.env['sale.order'].search([
            ('state', 'in', ['draft', 'sent']),
            ('write_date', '<', cutoff_time.strftime('%Y-%m-%d %H:%M:%S')),
            ('session_id', '!=', False),  # E-commerce orders
            ('partner_id.email', '!=', False),  # Has email
        ])

        carts_created = 0

        for order in abandoned_orders:
            # Check if already tracked
            existing = self.search([
                ('session_id', '=', order.session_id),
                ('state', 'in', ['pending', 'email_sent', 'reminded']),
            ], limit=1)

            if existing:
                continue

            # Check if cart has products
            if not order.order_line:
                continue

            # Create abandoned cart record
            cart_data = {
                'products': []
            }

            total_amount = 0
            for line in order.order_line:
                if line.product_id:
                    cart_data['products'].append({
                        'id': line.product_id.id,
                        'name': line.product_id.name,
                        'quantity': line.product_uom_qty,
                        'price': line.price_unit,
                    })
                    total_amount += line.price_subtotal

            import json
            self.create({
                'session_id': order.session_id,
                'partner_id': order.partner_id.id,
                'email': order.partner_id.email,
                'cart_data': json.dumps(cart_data),
                'product_count': len(order.order_line),
                'total_amount': total_amount,
                'state': 'pending',
            })

            carts_created += 1

        _logger.info(f"Abandoned cart detection complete: {carts_created} carts found")

    @api.model
    def _cron_send_recovery_emails(self):
        """
        Cron job to send recovery emails
        - First email: 1 hour after abandonment (no coupon)
        - Second email (reminder): 24 hours after abandonment (with 10% coupon)
        """
        _logger.info("Running recovery email sender...")

        # First email: pending carts older than 1 hour
        cutoff_first = datetime.now() - timedelta(hours=1)
        pending_carts = self.search([
            ('state', '=', 'pending'),
            ('create_date', '<', cutoff_first.strftime('%Y-%m-%d %H:%M:%S')),
        ], limit=50)  # Process max 50 at a time

        for cart in pending_carts:
            cart.send_recovery_email(with_coupon=False)

        # Second email (reminder): carts with email_sent older than 24 hours
        cutoff_reminder = datetime.now() - timedelta(hours=24)
        reminder_carts = self.search([
            ('state', '=', 'email_sent'),
            ('email_sent_date', '<', cutoff_reminder.strftime('%Y-%m-%d %H:%M:%S')),
        ], limit=50)

        for cart in reminder_carts:
            cart.send_recovery_email(with_coupon=True)

        _logger.info(f"Recovery emails sent: {len(pending_carts)} first emails, {len(reminder_carts)} reminders")

    @api.model
    def _cron_expire_old_carts(self):
        """
        Cron job to expire old abandoned carts (older than 7 days)
        """
        cutoff_date = datetime.now() - timedelta(days=7)

        expired_carts = self.search([
            ('state', 'in', ['pending', 'email_sent', 'reminded']),
            ('create_date', '<', cutoff_date.strftime('%Y-%m-%d %H:%M:%S')),
        ])

        expired_carts.write({'state': 'expired'})

        _logger.info(f"Expired {len(expired_carts)} old abandoned carts")
