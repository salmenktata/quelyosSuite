# -*- coding: utf-8 -*-

from odoo import models, fields, api
from datetime import datetime, timedelta


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    # E-commerce session
    session_id = fields.Char('Session ID', index=True,
                              help='ID session Portal pour panier invité')
    is_cart = fields.Boolean('Est un panier', compute='_compute_is_cart', store=True)
    cart_created_date = fields.Datetime('Date création panier', default=fields.Datetime.now)
    cart_last_update = fields.Datetime('Dernière modification panier', default=fields.Datetime.now)

    # Informations e-commerce
    frontend_notes = fields.Text('Notes client frontend')
    gift_message = fields.Text('Message cadeau')
    is_gift = fields.Boolean('Est un cadeau')

    @api.depends('state')
    def _compute_is_cart(self):
        """Un panier est une commande en état draft."""
        for order in self:
            order.is_cart = order.state == 'draft'

    def get_cart_data(self):
        """
        Retourne les données du panier formatées pour l'API.

        Returns data in format matching frontend TypeScript Cart interface.
        """
        self.ensure_one()

        lines = []
        for line in self.order_line:
            # Get product template for slug (product.product doesn't have slug, but product.template does)
            product_template = line.product_id.product_tmpl_id

            lines.append({
                'id': line.id,
                'product': {
                    'id': product_template.id,
                    'name': line.product_id.name,
                    'slug': product_template.slug,
                    'image': f'/web/image/product.product/{line.product_id.id}/image_128',
                    'price': line.price_unit,
                },
                'quantity': int(line.product_uom_qty),
                'price_unit': line.price_unit,
                'price_subtotal': line.price_subtotal,
                'price_total': line.price_total,
            })

        return {
            'id': self.id,
            'lines': lines,
            'amount_untaxed': self.amount_untaxed,
            'amount_tax': self.amount_tax,
            'amount_total': self.amount_total,
            'currency': {
                'id': self.currency_id.id,
                'code': self.currency_id.name,  # In Odoo, currency.name is the code (EUR, USD, etc.)
                'symbol': self.currency_id.symbol,
            },
            'line_count': len(self.order_line),
            'item_count': int(sum(line.product_uom_qty for line in self.order_line)),
        }

    @api.model
    def get_or_create_cart(self, partner_id=None, session_id=None):
        """Récupère ou crée le panier actif."""
        domain = [('state', '=', 'draft')]

        if partner_id:
            domain.append(('partner_id', '=', partner_id))
        elif session_id:
            domain.append(('session_id', '=', session_id))
        else:
            return None

        cart = self.search(domain, limit=1, order='cart_last_update desc')

        if not cart:
            # Créer nouveau panier
            vals = {
                'state': 'draft',
                'cart_created_date': fields.Datetime.now(),
                'cart_last_update': fields.Datetime.now(),
            }
            if partner_id:
                vals['partner_id'] = partner_id
            if session_id:
                vals['session_id'] = session_id

            cart = self.create(vals)

        return cart

    def add_cart_line(self, product_id, quantity=1):
        """Ajoute ou met à jour une ligne dans le panier."""
        self.ensure_one()

        if self.state != 'draft':
            raise ValueError("Cannot modify a confirmed order")

        # Chercher ligne existante
        existing_line = self.order_line.filtered(lambda l: l.product_id.id == product_id)

        if existing_line:
            # Mettre à jour quantité
            existing_line.write({'product_uom_qty': existing_line.product_uom_qty + quantity})
        else:
            # Créer nouvelle ligne
            self.env['sale.order.line'].create({
                'order_id': self.id,
                'product_id': product_id,
                'product_uom_qty': quantity,
            })

        self.cart_last_update = fields.Datetime.now()
        return self.get_cart_data()

    def update_cart_line(self, line_id, quantity):
        """Met à jour la quantité d'une ligne."""
        self.ensure_one()

        line = self.order_line.filtered(lambda l: l.id == line_id)
        if not line:
            raise ValueError("Line not found in cart")

        if quantity <= 0:
            line.unlink()
        else:
            line.write({'product_uom_qty': quantity})

        self.cart_last_update = fields.Datetime.now()
        return self.get_cart_data()

    def remove_cart_line(self, line_id):
        """Supprime une ligne du panier."""
        self.ensure_one()

        line = self.order_line.filtered(lambda l: l.id == line_id)
        if line:
            line.unlink()

        self.cart_last_update = fields.Datetime.now()
        return self.get_cart_data()

    def clear_cart(self):
        """Vide le panier."""
        self.ensure_one()
        self.order_line.unlink()
        self.cart_last_update = fields.Datetime.now()
        return self.get_cart_data()

    def validate_cart(self):
        """Valide que le panier peut être converti en commande."""
        self.ensure_one()

        errors = []

        # Vérifier lignes
        if not self.order_line:
            errors.append("Le panier est vide")

        # Vérifier stock
        for line in self.order_line:
            if line.product_id.type == 'product':
                if line.product_id.qty_available < line.product_uom_qty:
                    errors.append(f"Stock insuffisant pour {line.product_id.name}")

        # Vérifier montant minimum
        config = self.env['ecommerce.config'].get_config()
        if self.amount_total < config.get('min_order_amount', 0):
            errors.append(f"Montant minimum de commande: {config['min_order_amount']}")

        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'cart': self.get_cart_data(),
        }

    @api.model
    def cleanup_old_carts(self, days=30):
        """Nettoie les paniers abandonnés."""
        cutoff_date = datetime.now() - timedelta(days=days)
        old_carts = self.search([
            ('state', '=', 'draft'),
            ('cart_last_update', '<', cutoff_date)
        ])
        old_carts.unlink()
        return len(old_carts)

    def action_confirm(self):
        """
        Override action_confirm to send order confirmation email automatically.
        This is called when an order is confirmed (transitions from draft to sale).
        """
        # Call parent method to confirm the order
        res = super(SaleOrder, self).action_confirm()

        # Send order confirmation email for e-commerce orders
        for order in self:
            # Only send for orders that were carts (e-commerce orders)
            # Skip internal orders or manual orders created in backend
            if order.session_id or (order.partner_id and order.partner_id.user_ids):
                try:
                    # Import email service
                    from ..services.email_service import get_email_service
                    email_service = get_email_service(self.env)
                    email_service.send_order_confirmation(order)
                except Exception as e:
                    # Log error but don't block order confirmation
                    import logging
                    _logger = logging.getLogger(__name__)
                    _logger.error(f"Failed to send order confirmation email for {order.name}: {str(e)}")

        return res
