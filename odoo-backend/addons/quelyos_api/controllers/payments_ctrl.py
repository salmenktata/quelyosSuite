# -*- coding: utf-8 -*-
"""Contrôleur Paiements"""

import logging
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class PaymentsController(BaseController):
    """API Paiements"""

    @http.route('/api/finance/payments', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def get_payments(self, **params):
        """Liste des paiements"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            
            Payment = request.env['account.payment'].sudo()
            payments = Payment.search([('tenant_id', '=', tenant_id)], limit=50)

            data = {
                'payments': [self._serialize_payment(p) for p in payments],
                'total': len(payments),
            }

            return self._success_response(data)

        except Exception as e:
            _logger.error(f"Erreur get_payments: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    def _serialize_payment(self, payment):
        return {
            'id': payment.id,
            'name': payment.name,
            'amount': float(payment.amount),
            'date': payment.date.isoformat() if payment.date else None,
            'paymentType': payment.payment_type,
        }
