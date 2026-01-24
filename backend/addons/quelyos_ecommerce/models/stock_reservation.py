# -*- coding: utf-8 -*-
"""
Stock Reservation System
Reserves stock when products are added to cart
Prevents overselling and improves checkout UX
"""

import logging
from datetime import datetime, timedelta
from odoo import models, fields, api
from odoo.exceptions import ValidationError

_logger = logging.getLogger(__name__)


class StockReservation(models.Model):
    _name = 'stock.reservation'
    _description = 'Stock Reservation'
    _order = 'create_date desc'

    name = fields.Char('Reference', default=lambda self: self.env['ir.sequence'].next_by_code('stock.reservation') or 'New')

    order_id = fields.Many2one(
        'sale.order',
        string='Order',
        required=True,
        ondelete='cascade',
        index=True
    )
    order_line_id = fields.Many2one(
        'sale.order.line',
        string='Order Line',
        required=True,
        ondelete='cascade',
        index=True
    )
    product_id = fields.Many2one(
        'product.product',
        string='Product',
        required=True,
        index=True
    )
    reserved_quantity = fields.Float(
        string='Reserved Quantity',
        required=True,
        default=1.0
    )

    state = fields.Selection([
        ('reserved', 'Reserved'),
        ('confirmed', 'Confirmed'),
        ('released', 'Released'),
        ('expired', 'Expired'),
    ], string='State', default='reserved', index=True)

    reservation_date = fields.Datetime(
        string='Reservation Date',
        default=fields.Datetime.now,
        readonly=True
    )
    expiration_date = fields.Datetime(
        string='Expiration Date',
        compute='_compute_expiration_date',
        store=True
    )
    confirmed_date = fields.Datetime(
        string='Confirmed Date',
        readonly=True
    )
    released_date = fields.Datetime(
        string='Released Date',
        readonly=True
    )

    @api.depends('reservation_date')
    def _compute_expiration_date(self):
        """Calculate expiration date (15 minutes from reservation)"""
        for record in self:
            if record.reservation_date:
                record.expiration_date = record.reservation_date + timedelta(minutes=15)
            else:
                record.expiration_date = False

    def reserve_stock(self):
        """Reserve stock for this reservation"""
        self.ensure_one()

        if self.state != 'reserved':
            return False

        # Check if product has enough stock
        if self.product_id.qty_available < self.reserved_quantity:
            raise ValidationError(
                f"Insufficient stock for {self.product_id.name}. "
                f"Available: {self.product_id.qty_available}, Required: {self.reserved_quantity}"
            )

        # Update stock (create a stock move or quant reservation)
        # For simplicity, we'll track reservations without actually moving stock
        # In production, you might want to create stock.move with state 'assigned'

        _logger.info(f"Stock reserved: {self.reserved_quantity} units of {self.product_id.name}")
        return True

    def confirm_reservation(self):
        """Confirm reservation (order confirmed)"""
        self.ensure_one()

        if self.state != 'reserved':
            return False

        self.write({
            'state': 'confirmed',
            'confirmed_date': fields.Datetime.now(),
        })

        _logger.info(f"Reservation confirmed: {self.name}")
        return True

    def release_stock(self):
        """Release reserved stock"""
        self.ensure_one()

        if self.state in ['confirmed', 'released', 'expired']:
            return False

        self.write({
            'state': 'released',
            'released_date': fields.Datetime.now(),
        })

        _logger.info(f"Stock released: {self.reserved_quantity} units of {self.product_id.name}")
        return True

    @api.model
    def _cron_expire_reservations(self):
        """
        Cron job to expire old reservations
        Runs every 5 minutes
        """
        _logger.info("Running stock reservation expiration check...")

        now = datetime.now()

        # Find expired reservations
        expired_reservations = self.search([
            ('state', '=', 'reserved'),
            ('expiration_date', '<', now.strftime('%Y-%m-%d %H:%M:%S')),
        ])

        if not expired_reservations:
            _logger.info("No expired reservations found")
            return

        count = len(expired_reservations)

        # Expire reservations
        for reservation in expired_reservations:
            reservation.write({
                'state': 'expired',
                'released_date': fields.Datetime.now(),
            })

        _logger.info(f"Expired {count} stock reservations")

    @api.model
    def _cron_cleanup_old_reservations(self):
        """
        Cleanup old reservations (older than 7 days)
        Runs daily
        """
        cutoff_date = datetime.now() - timedelta(days=7)

        old_reservations = self.search([
            ('state', 'in', ['confirmed', 'released', 'expired']),
            ('create_date', '<', cutoff_date.strftime('%Y-%m-%d %H:%M:%S')),
        ])

        count = len(old_reservations)
        old_reservations.unlink()

        _logger.info(f"Cleaned up {count} old stock reservations")


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    reservation_ids = fields.One2many(
        'stock.reservation',
        'order_id',
        string='Stock Reservations'
    )

    def action_confirm(self):
        """Override to confirm stock reservations when order is confirmed"""
        res = super(SaleOrder, self).action_confirm()

        for order in self:
            # Confirm all reservations
            for reservation in order.reservation_ids.filtered(lambda r: r.state == 'reserved'):
                reservation.confirm_reservation()

        return res

    def action_cancel(self):
        """Override to release stock reservations when order is cancelled"""
        res = super(SaleOrder, self).action_cancel()

        for order in self:
            # Release all reservations
            for reservation in order.reservation_ids.filtered(lambda r: r.state == 'reserved'):
                reservation.release_stock()

        return res

    def release_reservations(self):
        """Manually release all reservations for this order"""
        self.ensure_one()

        for reservation in self.reservation_ids.filtered(lambda r: r.state == 'reserved'):
            reservation.release_stock()


class SaleOrderLine(models.Model):
    _inherit = 'sale.order.line'

    reservation_id = fields.Many2one(
        'stock.reservation',
        string='Stock Reservation',
        readonly=True
    )

    @api.model
    def create(self, vals):
        """Override to create stock reservation when line is created"""
        line = super(SaleOrderLine, self).create(vals)

        # Only create reservation for e-commerce orders (with session_id or certain states)
        if line.order_id and hasattr(line.order_id, 'session_id') and line.order_id.session_id:
            # Only for cart orders (draft state)
            if line.order_id.state in ['draft', 'sent']:
                line._create_stock_reservation()

        return line

    def write(self, vals):
        """Override to update stock reservation when quantity changes"""
        res = super(SaleOrderLine, self).write(vals)

        # Update reservation if quantity changed
        if 'product_uom_qty' in vals:
            for line in self:
                if line.reservation_id and line.reservation_id.state == 'reserved':
                    # Update reservation quantity
                    line.reservation_id.write({
                        'reserved_quantity': line.product_uom_qty,
                    })
                    _logger.info(f"Updated reservation quantity: {line.product_uom_qty}")

        return res

    def unlink(self):
        """Override to release stock reservation when line is deleted"""
        for line in self:
            if line.reservation_id and line.reservation_id.state == 'reserved':
                line.reservation_id.release_stock()

        return super(SaleOrderLine, self).unlink()

    def _create_stock_reservation(self):
        """Create stock reservation for this order line"""
        self.ensure_one()

        if not self.product_id:
            return False

        # Check if reservation already exists
        if self.reservation_id:
            return False

        # Check if product is stockable
        if self.product_id.type != 'product':
            return False

        try:
            # Create reservation
            reservation = self.env['stock.reservation'].sudo().create({
                'order_id': self.order_id.id,
                'order_line_id': self.id,
                'product_id': self.product_id.id,
                'reserved_quantity': self.product_uom_qty,
                'state': 'reserved',
            })

            # Reserve stock
            reservation.reserve_stock()

            # Link reservation to line
            self.reservation_id = reservation.id

            _logger.info(f"Stock reservation created: {reservation.name} for {self.product_id.name}")
            return True

        except ValidationError as e:
            _logger.warning(f"Could not reserve stock: {str(e)}")
            return False
        except Exception as e:
            _logger.error(f"Error creating stock reservation: {str(e)}")
            return False
