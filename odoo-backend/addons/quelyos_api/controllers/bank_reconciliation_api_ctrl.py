# -*- coding: utf-8 -*-
"""
Contrôleur API Rapprochement Bancaire

Endpoints :
- POST /api/finance/bank/transactions : Liste transactions à réconcilier
- POST /api/finance/bank/match-auto : Lancer matching automatique
- POST /api/finance/bank/match-manual : Réconcilier manuellement
- POST /api/finance/bank/connections : Liste connexions bancaires
- POST /api/finance/bank/sync : Synchroniser transactions depuis API
- POST /api/finance/bank/stats : Statistiques réconciliation
"""

import logging
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class BankReconciliationAPIController(BaseController):
    """API Rapprochement Bancaire"""

    @http.route('/api/finance/bank/transactions', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def list_bank_transactions(self, **params):
        """
        Liste transactions bancaires à réconcilier

        Body:
        {
          "state": "pending",  // Filtrer par état (pending/matched/manual/split/excluded)
          "date_from": "2026-01-01",
          "date_to": "2026-02-04",
          "bank_account_id": 123,  // Optionnel
          "limit": 50,
          "offset": 0
        }

        Returns:
        {
          "success": true,
          "data": {
            "transactions": [
              {
                "id": 1,
                "transaction_date": "2026-02-03",
                "label": "VIR SEPA ACME CORP",
                "amount": 1500.50,
                "state": "pending",
                "category": "customer_payment",
                "matching_confidence": null,
                "matched_invoice": null
              },
              ...
            ],
            "count": 42,
            "stats": {
              "pending": 25,
              "matched": 15,
              "manual": 2
            }
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            if not tenant_id:
                return self._error_response("Tenant non trouvé", "FORBIDDEN", 403)

            # Paramètres
            data = request.jsonrequest
            state = data.get('state', 'pending')
            date_from = data.get('date_from')
            date_to = data.get('date_to')
            bank_account_id = data.get('bank_account_id')
            limit = int(data.get('limit', 50))
            offset = int(data.get('offset', 0))

            BankTransaction = request.env['quelyos.bank_transaction'].sudo()

            # Domaine filtres
            domain = [('tenant_id', '=', tenant_id)]
            if state:
                domain.append(('state', '=', state))
            if date_from:
                domain.append(('transaction_date', '>=', date_from))
            if date_to:
                domain.append(('transaction_date', '<=', date_to))
            if bank_account_id:
                domain.append(('bank_account_id', '=', bank_account_id))

            # Récupérer transactions
            transactions = BankTransaction.search(domain, limit=limit, offset=offset, order='transaction_date desc')
            total_count = BankTransaction.search_count(domain)

            # Sérialiser
            transactions_data = [{
                'id': txn.id,
                'transaction_date': txn.transaction_date.isoformat() if txn.transaction_date else None,
                'value_date': txn.value_date.isoformat() if txn.value_date else None,
                'label': txn.label,
                'label_normalized': txn.label_normalized,
                'amount': float(txn.amount),
                'currency': txn.currency_id.name,
                'transaction_type': txn.transaction_type,
                'category': txn.category,
                'state': txn.state,
                'source_type': txn.source_type,
                'bank_account': txn.bank_account_id.acc_number if txn.bank_account_id else None,
                'matched_invoice_id': txn.matched_invoice_id.id if txn.matched_invoice_id else None,
                'matched_invoice_name': txn.matched_invoice_id.name if txn.matched_invoice_id else None,
                'matching_confidence': float(txn.matching_confidence) if txn.matching_confidence else None,
            } for txn in transactions]

            # Stats globales
            stats = {
                'pending': BankTransaction.search_count([('tenant_id', '=', tenant_id), ('state', '=', 'pending')]),
                'matched': BankTransaction.search_count([('tenant_id', '=', tenant_id), ('state', '=', 'matched')]),
                'manual': BankTransaction.search_count([('tenant_id', '=', tenant_id), ('state', '=', 'manual')]),
            }

            return self._success_response({
                'transactions': transactions_data,
                'count': total_count,
                'stats': stats,
            })

        except Exception as e:
            _logger.error(f"Erreur list_bank_transactions: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/bank/match-auto', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def match_auto(self, **params):
        """
        Lancer matching automatique pour transactions

        Body:
        {
          "transaction_ids": [1, 2, 3]  // Liste IDs transactions à traiter
        }

        Returns:
        {
          "success": true,
          "data": {
            "total": 3,
            "matched": 2,
            "unmatched": 1,
            "results": [
              {
                "transaction_id": 1,
                "matched": true,
                "invoice_id": 456,
                "invoice_name": "INV/2026/0001",
                "confidence": 95.5
              },
              ...
            ]
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            if not tenant_id:
                return self._error_response("Tenant non trouvé", "FORBIDDEN", 403)

            # Paramètres
            data = request.jsonrequest
            transaction_ids = data.get('transaction_ids', [])

            if not transaction_ids:
                return self._error_response("transaction_ids requis", "VALIDATION_ERROR", 400)

            BankTransaction = request.env['quelyos.bank_transaction'].sudo()

            # Récupérer transactions
            transactions = BankTransaction.search([
                ('id', 'in', transaction_ids),
                ('tenant_id', '=', tenant_id),
                ('state', '=', 'pending'),
            ])

            if not transactions:
                return self._error_response("Aucune transaction pending trouvée", "NOT_FOUND", 404)

            # Traiter chaque transaction
            results = []
            matched_count = 0

            for txn in transactions:
                result = txn.action_match_automatically()

                if result.get('success'):
                    matched_count += 1
                    results.append({
                        'transaction_id': txn.id,
                        'matched': True,
                        'invoice_id': result['invoice'].id,
                        'invoice_name': result['invoice'].name,
                        'confidence': result.get('confidence', 0),
                    })
                else:
                    results.append({
                        'transaction_id': txn.id,
                        'matched': False,
                        'message': result.get('message', 'Aucune correspondance'),
                    })

            _logger.info(
                f"Matching automatique terminé : {matched_count}/{len(transactions)} "
                f"transactions réconciliées pour tenant {tenant_id}"
            )

            return self._success_response({
                'total': len(transactions),
                'matched': matched_count,
                'unmatched': len(transactions) - matched_count,
                'results': results,
            })

        except Exception as e:
            _logger.error(f"Erreur match_auto: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/bank/match-manual', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def match_manual(self, **params):
        """
        Réconcilier manuellement transaction avec facture

        Body:
        {
          "transaction_id": 1,
          "invoice_id": 456
        }

        Returns:
        {
          "success": true,
          "message": "Transaction réconciliée manuellement"
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            if not tenant_id:
                return self._error_response("Tenant non trouvé", "FORBIDDEN", 403)

            # Paramètres
            data = request.jsonrequest
            transaction_id = data.get('transaction_id')
            invoice_id = data.get('invoice_id')

            if not transaction_id or not invoice_id:
                return self._error_response("transaction_id et invoice_id requis", "VALIDATION_ERROR", 400)

            BankTransaction = request.env['quelyos.bank_transaction'].sudo()
            AccountMove = request.env['account.move'].sudo()

            # Vérifier transaction
            txn = BankTransaction.search([
                ('id', '=', transaction_id),
                ('tenant_id', '=', tenant_id),
            ], limit=1)

            if not txn:
                return self._error_response("Transaction non trouvée", "NOT_FOUND", 404)

            # Vérifier facture
            invoice = AccountMove.search([
                ('id', '=', invoice_id),
                ('tenant_id', '=', tenant_id),
                ('move_type', '=', 'out_invoice'),
                ('state', '=', 'posted'),
            ], limit=1)

            if not invoice:
                return self._error_response("Facture non trouvée", "NOT_FOUND", 404)

            # Appliquer matching manuel
            txn.write({
                'state': 'manual',
                'matched_invoice_id': invoice.id,
                'matched_amount': abs(txn.amount),
                'matching_confidence': 100.0,  # Manuel = confiance maximale
            })

            # Générer écritures comptables
            txn._generate_accounting_entry(invoice)

            _logger.info(
                f"Matching manuel appliqué : transaction {txn.id} <-> facture {invoice.name}"
            )

            return self._success_response({
                'message': f'Transaction réconciliée avec facture {invoice.name}',
            })

        except Exception as e:
            _logger.error(f"Erreur match_manual: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/bank/connections', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def list_connections(self, **params):
        """
        Liste connexions bancaires configurées

        Returns:
        {
          "success": true,
          "data": {
            "connections": [
              {
                "id": 1,
                "name": "Stripe Main Account",
                "provider": "stripe",
                "state": "active",
                "last_sync": "2026-02-04T10:30:00",
                "total_transactions": 1250,
                "total_matched": 1180
              },
              ...
            ]
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            if not tenant_id:
                return self._error_response("Tenant non trouvé", "FORBIDDEN", 403)

            BankConnection = request.env['quelyos.bank_connection'].sudo()

            connections = BankConnection.search([('tenant_id', '=', tenant_id)])

            connections_data = [{
                'id': conn.id,
                'name': conn.name,
                'provider': conn.provider,
                'state': conn.state,
                'sync_frequency': conn.sync_frequency,
                'auto_reconcile': conn.auto_reconcile,
                'last_sync': conn.last_sync.isoformat() if conn.last_sync else None,
                'last_error': conn.last_error,
                'total_transactions': conn.total_transactions,
                'total_matched': conn.total_matched,
                'bank_account': conn.bank_account_id.acc_number if conn.bank_account_id else None,
            } for conn in connections]

            return self._success_response({
                'connections': connections_data,
                'count': len(connections_data),
            })

        except Exception as e:
            _logger.error(f"Erreur list_connections: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/bank/stats', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def get_stats(self, **params):
        """
        Statistiques réconciliation globales

        Returns:
        {
          "success": true,
          "data": {
            "total_transactions": 1500,
            "pending": 120,
            "matched_auto": 1200,
            "matched_manual": 150,
            "excluded": 30,
            "success_rate": 90.0,
            "avg_confidence": 88.5
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            if not tenant_id:
                return self._error_response("Tenant non trouvé", "FORBIDDEN", 403)

            BankTransaction = request.env['quelyos.bank_transaction'].sudo()

            # Compter par état
            total = BankTransaction.search_count([('tenant_id', '=', tenant_id)])
            pending = BankTransaction.search_count([('tenant_id', '=', tenant_id), ('state', '=', 'pending')])
            matched_auto = BankTransaction.search_count([('tenant_id', '=', tenant_id), ('state', '=', 'matched')])
            matched_manual = BankTransaction.search_count([('tenant_id', '=', tenant_id), ('state', '=', 'manual')])
            excluded = BankTransaction.search_count([('tenant_id', '=', tenant_id), ('state', '=', 'excluded')])

            # Taux succès
            success_rate = ((matched_auto + matched_manual) / total * 100) if total > 0 else 0

            # Confiance moyenne (seulement matchés auto)
            matched_txns = BankTransaction.search([
                ('tenant_id', '=', tenant_id),
                ('state', '=', 'matched'),
            ])
            avg_confidence = sum(txn.matching_confidence or 0 for txn in matched_txns) / len(matched_txns) if matched_txns else 0

            return self._success_response({
                'total_transactions': total,
                'pending': pending,
                'matched_auto': matched_auto,
                'matched_manual': matched_manual,
                'excluded': excluded,
                'success_rate': round(success_rate, 1),
                'avg_confidence': round(avg_confidence, 1),
            })

        except Exception as e:
            _logger.error(f"Erreur get_stats: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)
