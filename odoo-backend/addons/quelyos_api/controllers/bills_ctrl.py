# -*- coding: utf-8 -*-
"""Contrôleur Factures Fournisseurs (Vendor Bills)"""

import logging
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class BillsController(BaseController):
    """API Factures Fournisseurs"""

    @http.route('/api/finance/bills', type='json', auth='public', methods=['GET', 'OPTIONS'], cors='*', csrf=False)
    def get_bills(self, **params):
        """Liste des factures fournisseurs"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            
            domain = [
                ('tenant_id', '=', tenant_id),
                ('move_type', '=', 'in_invoice'),
            ]

            AccountMove = request.env['account.move'].sudo()
            bills = AccountMove.search(domain, limit=50, order='invoice_date desc')

            data = {
                'bills': [self._serialize_bill(bill) for bill in bills],
                'total': len(bills),
            }

            return self._success_response(data)

        except Exception as e:
            _logger.error(f"Erreur get_bills: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/bills/create', type='json', auth='public', methods=['POST', 'OPTIONS'], cors='*', csrf=False)
    def create_bill(self, **params):
        """Créer facture fournisseur"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            data = request.jsonrequest

            vals = {
                'tenant_id': tenant_id,
                'move_type': 'in_invoice',
                'partner_id': data.get('vendorId'),
                'invoice_date': data.get('invoiceDate'),
                'ref': data.get('reference'),
            }

            AccountMove = request.env['account.move'].sudo()
            bill = AccountMove.create(vals)

            return self._success_response(self._serialize_bill(bill))

        except Exception as e:
            _logger.error(f"Erreur create_bill: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    def _serialize_bill(self, bill):
        """Convertir en format frontend"""
        return {
            'id': bill.id,
            'name': bill.name,
            'state': bill.state,
            'vendor': {
                'id': bill.partner_id.id,
                'name': bill.partner_id.name,
            },
            'invoiceDate': bill.invoice_date.isoformat() if bill.invoice_date else None,
            'amountTotal': float(bill.amount_total),
        }
