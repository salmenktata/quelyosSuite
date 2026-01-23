# -*- coding: utf-8 -*-
"""
Email Service for E-commerce
Handles automatic sending of transactional emails
"""

import logging
from odoo import api, models, _

_logger = logging.getLogger(__name__)


class EcommerceEmailService:
    """Service for sending e-commerce transactional emails"""

    def __init__(self, env):
        self.env = env

    def send_order_confirmation(self, order):
        """
        Send order confirmation email to customer

        Args:
            order: sale.order record

        Returns:
            bool: True if email sent successfully
        """
        try:
            template = self.env.ref('quelyos_ecommerce.email_template_order_confirmation', raise_if_not_found=False)
            if not template:
                _logger.warning("Order confirmation email template not found")
                return False

            if not order.partner_id.email:
                _logger.warning(f"No email found for partner {order.partner_id.name}")
                return False

            # Send email
            template.send_mail(order.id, force_send=True, raise_exception=False)
            _logger.info(f"Order confirmation email sent for order {order.name} to {order.partner_id.email}")

            # Log in chatter
            order.message_post(
                body=_("Order confirmation email sent to %s") % order.partner_id.email,
                subject=_("Email Sent"),
                message_type='notification',
            )

            return True

        except Exception as e:
            _logger.error(f"Error sending order confirmation email: {str(e)}")
            return False

    def send_shipment_notification(self, picking):
        """
        Send shipment notification email to customer

        Args:
            picking: stock.picking record

        Returns:
            bool: True if email sent successfully
        """
        try:
            template = self.env.ref('quelyos_ecommerce.email_template_order_shipped', raise_if_not_found=False)
            if not template:
                _logger.warning("Shipment notification email template not found")
                return False

            if not picking.partner_id.email:
                _logger.warning(f"No email found for partner {picking.partner_id.name}")
                return False

            # Only send for outgoing deliveries
            if picking.picking_type_code != 'outgoing':
                return False

            # Send email
            template.send_mail(picking.id, force_send=True, raise_exception=False)
            _logger.info(f"Shipment notification sent for picking {picking.name} to {picking.partner_id.email}")

            # Log in chatter
            picking.message_post(
                body=_("Shipment notification email sent to %s") % picking.partner_id.email,
                subject=_("Email Sent"),
                message_type='notification',
            )

            return True

        except Exception as e:
            _logger.error(f"Error sending shipment notification: {str(e)}")
            return False

    def send_invoice_email(self, invoice):
        """
        Send invoice email to customer

        Args:
            invoice: account.move record

        Returns:
            bool: True if email sent successfully
        """
        try:
            template = self.env.ref('quelyos_ecommerce.email_template_invoice', raise_if_not_found=False)
            if not template:
                _logger.warning("Invoice email template not found")
                return False

            if not invoice.partner_id.email:
                _logger.warning(f"No email found for partner {invoice.partner_id.name}")
                return False

            # Only send for customer invoices
            if invoice.move_type not in ['out_invoice', 'out_refund']:
                return False

            # Send email with PDF attachment
            template.send_mail(invoice.id, force_send=True, raise_exception=False)
            _logger.info(f"Invoice email sent for {invoice.name} to {invoice.partner_id.email}")

            # Log in chatter
            invoice.message_post(
                body=_("Invoice email sent to %s") % invoice.partner_id.email,
                subject=_("Email Sent"),
                message_type='notification',
            )

            return True

        except Exception as e:
            _logger.error(f"Error sending invoice email: {str(e)}")
            return False


def get_email_service(env):
    """
    Factory function to get email service instance

    Args:
        env: Odoo environment

    Returns:
        EcommerceEmailService instance
    """
    return EcommerceEmailService(env)
