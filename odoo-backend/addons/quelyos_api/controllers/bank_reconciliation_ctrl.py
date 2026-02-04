# -*- coding: utf-8 -*-
"""Contrôleur Rapprochement Bancaire AI"""

import logging
from datetime import datetime
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class BankReconciliationController(BaseController):
    """API Rapprochement Bancaire avec suggestions AI"""

    @http.route('/api/finance/bank-reconciliation/suggest', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def suggest_matches(self, **params):
        """
        Suggérer correspondances entre transactions bancaires et factures

        Body:
        {
          "transactions": [
            {"id": "TRX001", "date": "2026-02-01", "amount": 1234.56, "reference": "CLIENT ABC"}
          ]
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            if not tenant_id:
                return self._error_response("Tenant non trouvé", "FORBIDDEN", 403)

            data = request.jsonrequest
            transactions = data.get('transactions', [])

            if not transactions:
                return self._error_response("Aucune transaction fournie", "VALIDATION_ERROR", 400)

            # Récupérer factures non payées
            AccountMove = request.env['account.move'].sudo()
            unpaid_invoices = AccountMove.search([
                ('tenant_id', '=', tenant_id),
                ('move_type', '=', 'out_invoice'),
                ('state', '=', 'posted'),
                ('payment_state', 'in', ['not_paid', 'partial']),
            ])

            _logger.info(f"Rapprochement: {len(transactions)} transactions, {len(unpaid_invoices)} factures")

            matches = []

            for trx in transactions:
                trx_id = trx.get('id')
                trx_date_str = trx.get('date')
                trx_amount = float(trx.get('amount', 0))
                trx_reference = (trx.get('reference', '') + ' ' + trx.get('description', '')).lower()

                trx_date = datetime.strptime(trx_date_str, '%Y-%m-%d').date() if trx_date_str else None

                suggestions = []

                for invoice in unpaid_invoices:
                    score = 0
                    reasons = []

                    # Montant exact (+40)
                    if abs(float(invoice.amount_residual) - trx_amount) < 0.01:
                        score += 40
                        reasons.append("Montant exact")
                    elif abs(float(invoice.amount_residual) - trx_amount) / trx_amount < 0.05:
                        score += 20
                        reasons.append("Montant proche")

                    # Date proche ±3j (+30)
                    if trx_date and invoice.invoice_date:
                        date_diff = abs((invoice.invoice_date - trx_date).days)
                        if date_diff <= 3:
                            score += 30
                            reasons.append(f"Date proche ({date_diff}j)")
                        elif date_diff <= 7:
                            score += 15

                    # Référence client (+20)
                    if invoice.partner_id.name.lower() in trx_reference:
                        score += 20
                        reasons.append("Nom client")

                    # Numéro facture (+20)
                    if invoice.name.lower() in trx_reference:
                        score += 20
                        reasons.append("Réf facture")

                    if score >= 30:
                        suggestions.append({
                            'invoiceId': invoice.id,
                            'invoiceName': invoice.name,
                            'customerName': invoice.partner_id.name,
                            'amount': float(invoice.amount_residual),
                            'date': invoice.invoice_date.isoformat() if invoice.invoice_date else None,
                            'confidenceScore': min(score, 100),
                            'reasons': reasons,
                        })

                suggestions.sort(key=lambda x: x['confidenceScore'], reverse=True)
                suggestions = suggestions[:3]

                matches.append({
                    'transactionId': trx_id,
                    'suggestions': suggestions,
                })

            return self._success_response({
                'matches': matches,
                'totalTransactions': len(transactions),
                'totalInvoices': len(unpaid_invoices),
            })

        except Exception as e:
            _logger.error(f"Erreur suggest_matches: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/bank-reconciliation/validate', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def validate_match(self, **params):
        """Valider rapprochement transaction <> facture"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            data = request.jsonrequest
            invoice_id = data.get('invoiceId')
            amount = float(data.get('amount', 0))
            trx_date = data.get('date')
            reference = data.get('reference', '')

            if not invoice_id:
                return self._error_response("invoiceId requis", "VALIDATION_ERROR", 400)

            # Récupérer facture
            AccountMove = request.env['account.move'].sudo()
            invoice = AccountMove.search([
                ('id', '=', invoice_id),
                ('tenant_id', '=', tenant_id),
            ], limit=1)

            if not invoice:
                return self._error_response("Facture introuvable", "NOT_FOUND", 404)

            # Créer paiement
            AccountPayment = request.env['account.payment'].sudo()

            payment_vals = {
                'payment_type': 'inbound',
                'partner_type': 'customer',
                'partner_id': invoice.partner_id.id,
                'amount': amount,
                'date': trx_date or datetime.now().date(),
                'ref': f"Rapprochement: {reference}",
                'journal_id': request.env['account.journal'].sudo().search([
                    ('type', '=', 'bank'),
                    ('company_id', '=', invoice.company_id.id)
                ], limit=1).id,
            }

            payment = AccountPayment.create(payment_vals)
            payment.action_post()

            # Rapprocher
            lines = payment.line_ids.filtered(lambda l: l.account_id.account_type in ('asset_receivable', 'liability_payable'))
            lines |= invoice.line_ids.filtered(lambda l: l.account_id.account_type in ('asset_receivable', 'liability_payable'))

            if lines:
                lines.reconcile()

            _logger.info(f"Paiement {payment.name} rapproché avec {invoice.name}")

            return self._success_response({
                'paymentId': payment.id,
                'paymentName': payment.name,
                'invoiceId': invoice.id,
                'paymentState': invoice.payment_state,
            }, message=f"Paiement {payment.name} enregistré")

        except Exception as e:
            _logger.error(f"Erreur validate_match: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)
