# -*- coding: utf-8 -*-

from odoo import models, api
import logging

_logger = logging.getLogger(__name__)


class AccountMove(models.Model):
    _inherit = 'account.move'

    def action_post(self):
        """
        Override action_post to send invoice email when invoice is posted.
        This is called when an invoice transitions from draft to posted.
        """
        # Call parent method to post the invoice
        res = super(AccountMove, self).action_post()

        # Send invoice email for customer invoices
        for move in self:
            if move.move_type in ['out_invoice', 'out_refund']:
                # Check if this is an e-commerce order invoice
                # (has related sale order with session_id or portal user)
                is_ecommerce = False

                if move.invoice_origin:
                    # Try to find related sale order
                    sale_order = self.env['sale.order'].search([
                        ('name', '=', move.invoice_origin)
                    ], limit=1)

                    if sale_order and (sale_order.session_id or (sale_order.partner_id and sale_order.partner_id.user_ids)):
                        is_ecommerce = True

                if is_ecommerce:
                    try:
                        # Import email service
                        from ..services.email_service import get_email_service
                        email_service = get_email_service(self.env)
                        email_service.send_invoice_email(move)
                    except Exception as e:
                        # Log error but don't block posting
                        _logger.error(f"Failed to send invoice email for {move.name}: {str(e)}")

        return res
