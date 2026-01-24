# -*- coding: utf-8 -*-

from odoo import models, fields, api
from datetime import datetime


class LoyaltyProgram(models.Model):
    _name = 'loyalty.program'
    _description = 'Loyalty Program'

    name = fields.Char('Program Name', required=True, default='Programme Fidélité Quelyos')
    active = fields.Boolean('Active', default=True)
    points_per_euro = fields.Float('Points per Euro', default=1.0, help='Points earned per euro spent')
    min_order_amount = fields.Float('Minimum Order Amount', default=0, help='Minimum order amount to earn points')
    points_to_euro_rate = fields.Float('Points to Euro Rate', default=0.01, help='1 point = X euros discount')

    # Reward tiers
    tier_ids = fields.One2many('loyalty.tier', 'program_id', string='Reward Tiers')

    def get_points_for_amount(self, amount):
        """Calculate points for given amount"""
        self.ensure_one()
        if amount < self.min_order_amount:
            return 0
        return int(amount * self.points_per_euro)

    def get_discount_for_points(self, points):
        """Calculate discount amount for given points"""
        self.ensure_one()
        return points * self.points_to_euro_rate


class LoyaltyTier(models.Model):
    _name = 'loyalty.tier'
    _description = 'Loyalty Tier'
    _order = 'points_threshold'

    program_id = fields.Many2one('loyalty.program', 'Program', required=True, ondelete='cascade')
    name = fields.Char('Tier Name', required=True)  # Bronze, Silver, Gold, Platinum
    points_threshold = fields.Integer('Points Required', required=True)
    discount_percentage = fields.Float('Extra Discount %', default=0, help='Additional discount for this tier')
    color = fields.Char('Badge Color', default='#808080')


class LoyaltyPoints(models.Model):
    _name = 'loyalty.points'
    _description = 'Customer Loyalty Points'

    partner_id = fields.Many2one('res.partner', 'Customer', required=True, ondelete='cascade', index=True)
    points_balance = fields.Integer('Points Balance', default=0, compute='_compute_balance', store=True)
    lifetime_points = fields.Integer('Lifetime Points Earned', default=0, compute='_compute_lifetime_points', store=True)
    transaction_ids = fields.One2many('loyalty.transaction', 'points_id', 'Transactions')
    current_tier_id = fields.Many2one('loyalty.tier', 'Current Tier', compute='_compute_tier', store=True)

    _sql_constraints = [
        ('partner_unique', 'unique(partner_id)', 'Only one loyalty points record per customer!')
    ]

    @api.depends('transaction_ids.points')
    def _compute_balance(self):
        """Calculate current points balance"""
        for record in self:
            record.points_balance = sum(record.transaction_ids.mapped('points'))

    @api.depends('transaction_ids.points')
    def _compute_lifetime_points(self):
        """Calculate total points earned (not redeemed)"""
        for record in self:
            earned_txns = record.transaction_ids.filtered(lambda t: t.transaction_type == 'earn')
            record.lifetime_points = sum(earned_txns.mapped('points'))

    @api.depends('lifetime_points')
    def _compute_tier(self):
        """Determine current tier based on lifetime points"""
        for record in self:
            # Get the highest tier the customer qualifies for
            tiers = self.env['loyalty.tier'].search([
                ('points_threshold', '<=', record.lifetime_points)
            ], order='points_threshold desc', limit=1)

            record.current_tier_id = tiers[0] if tiers else False

    def add_points(self, points, description, order_id=None):
        """Add points to customer account"""
        self.ensure_one()
        self.env['loyalty.transaction'].create({
            'points_id': self.id,
            'points': points,
            'description': description,
            'order_id': order_id,
            'transaction_type': 'earn',
        })

    def redeem_points(self, points, description, order_id=None):
        """Redeem points (negative transaction)"""
        self.ensure_one()

        if self.points_balance < points:
            raise ValueError(f"Insufficient points. Balance: {self.points_balance}, Required: {points}")

        self.env['loyalty.transaction'].create({
            'points_id': self.id,
            'points': -points,
            'description': description,
            'order_id': order_id,
            'transaction_type': 'redemption',
        })

        return True

    def adjust_points(self, points, description):
        """Manual adjustment of points (admin only)"""
        self.ensure_one()
        self.env['loyalty.transaction'].create({
            'points_id': self.id,
            'points': points,
            'description': description,
            'transaction_type': 'adjustment',
        })


class LoyaltyTransaction(models.Model):
    _name = 'loyalty.transaction'
    _description = 'Loyalty Points Transaction'
    _order = 'create_date desc'

    points_id = fields.Many2one('loyalty.points', 'Points Record', required=True, ondelete='cascade', index=True)
    partner_id = fields.Many2one(related='points_id.partner_id', string='Customer', store=True, index=True)
    points = fields.Integer('Points', required=True, help='Positive for earned, negative for redeemed')
    description = fields.Char('Description', required=True)
    transaction_type = fields.Selection([
        ('earn', 'Earned'),
        ('redemption', 'Redeemed'),
        ('adjustment', 'Manual Adjustment'),
        ('expiration', 'Expired'),
    ], default='earn', required=True, index=True)
    order_id = fields.Many2one('sale.order', 'Related Order', ondelete='set null')
    create_date = fields.Datetime('Transaction Date', default=fields.Datetime.now, readonly=True)
    create_uid = fields.Many2one('res.users', 'Created By', readonly=True)


# Extend res.partner to add loyalty points relation
class ResPartner(models.Model):
    _inherit = 'res.partner'

    loyalty_points_id = fields.Many2one('loyalty.points', string='Loyalty Points', ondelete='cascade')
    loyalty_balance = fields.Integer(related='loyalty_points_id.points_balance', string='Points Balance', readonly=True)
    loyalty_tier = fields.Many2one(related='loyalty_points_id.current_tier_id', string='Loyalty Tier', readonly=True)

    def get_or_create_loyalty_points(self):
        """Get or create loyalty points record for partner"""
        self.ensure_one()

        if not self.loyalty_points_id:
            loyalty_points = self.env['loyalty.points'].create({
                'partner_id': self.id
            })
            return loyalty_points

        return self.loyalty_points_id


# Extend sale.order to add points on confirmation
class SaleOrder(models.Model):
    _inherit = 'sale.order'

    loyalty_points_earned = fields.Integer('Points Earned', compute='_compute_loyalty_points', store=True)
    loyalty_points_used = fields.Integer('Points Used', default=0)
    loyalty_discount_amount = fields.Float('Loyalty Discount', default=0)

    @api.depends('amount_total', 'state')
    def _compute_loyalty_points(self):
        """Calculate points that will be earned from this order"""
        for order in self:
            program = self.env['loyalty.program'].search([('active', '=', True)], limit=1)
            if program and order.state in ['sale', 'done']:
                order.loyalty_points_earned = program.get_points_for_amount(order.amount_total)
            else:
                order.loyalty_points_earned = 0

    def action_confirm(self):
        """Award loyalty points on order confirmation"""
        res = super(SaleOrder, self).action_confirm()

        for order in self:
            # Award loyalty points
            if order.partner_id and order.amount_total > 0:
                program = self.env['loyalty.program'].search([('active', '=', True)], limit=1)

                if program and order.amount_total >= program.min_order_amount:
                    # Get or create loyalty points record
                    points_record = order.partner_id.get_or_create_loyalty_points()

                    # Calculate points
                    points_earned = program.get_points_for_amount(order.amount_total)

                    if points_earned > 0:
                        # Add points
                        points_record.add_points(
                            points_earned,
                            f"Commande {order.name}",
                            order.id
                        )

                        # Notify customer
                        order.message_post(
                            body=f"🎁 <strong>{points_earned} points fidélité</strong> ajoutés à votre compte !",
                            subject="Points Fidélité Gagnés",
                            message_type='notification',
                        )

        return res

    def apply_loyalty_discount(self, points_to_use):
        """Apply loyalty points as discount to order"""
        self.ensure_one()

        if self.state != 'draft':
            raise ValueError("Can only apply loyalty discount to draft orders")

        # Get program
        program = self.env['loyalty.program'].search([('active', '=', True)], limit=1)
        if not program:
            raise ValueError("No active loyalty program")

        # Get customer points
        points_record = self.partner_id.loyalty_points_id
        if not points_record or points_record.points_balance < points_to_use:
            raise ValueError("Insufficient loyalty points")

        # Calculate discount
        discount_amount = program.get_discount_for_points(points_to_use)

        # Cannot discount more than order total
        if discount_amount > self.amount_total:
            discount_amount = self.amount_total
            # Recalculate points needed
            points_to_use = int(discount_amount / program.points_to_euro_rate)

        # Apply discount (create discount line)
        self.env['sale.order.line'].create({
            'order_id': self.id,
            'name': f'Réduction Fidélité ({points_to_use} points)',
            'product_id': self.env.ref('product.product_product_1').id,  # Use a generic product
            'product_uom_qty': 1,
            'price_unit': -discount_amount,
        })

        # Record usage
        self.write({
            'loyalty_points_used': points_to_use,
            'loyalty_discount_amount': discount_amount,
        })

        # Redeem points
        points_record.redeem_points(
            points_to_use,
            f"Utilisé sur commande {self.name}",
            self.id
        )

        return True
