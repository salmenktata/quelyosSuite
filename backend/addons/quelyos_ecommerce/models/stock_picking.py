# -*- coding: utf-8 -*-

from odoo import models, api
import logging

_logger = logging.getLogger(__name__)


class StockPicking(models.Model):
    _inherit = 'stock.picking'

    def button_validate(self):
        """
        Override button_validate to send shipment notification email.
        This is called when a delivery order is validated (goods are shipped).
        """
        # Call parent method to validate the picking
        res = super(StockPicking, self).button_validate()

        # Send shipment notification for outgoing deliveries
        for picking in self:
            if picking.picking_type_code == 'outgoing' and picking.sale_id:
                # Only send for e-commerce orders (with session_id or portal users)
                if picking.sale_id.session_id or (picking.partner_id and picking.partner_id.user_ids):
                    try:
                        # Import email service
                        from ..services.email_service import get_email_service
                        email_service = get_email_service(self.env)
                        email_service.send_shipment_notification(picking)
                    except Exception as e:
                        # Log error but don't block validation
                        _logger.error(f"Failed to send shipment notification for {picking.name}: {str(e)}")

        return res
