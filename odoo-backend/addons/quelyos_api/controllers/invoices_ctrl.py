# -*- coding: utf-8 -*-
"""
Contrôleur Factures Clients (Customer Invoices)
Gère le CRUD et les actions sur account.move (type = 'out_invoice')
"""

import logging
import json
from datetime import datetime
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class InvoicesController(BaseController):
    """API Factures Clients"""

    @http.route('/api/finance/invoices', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_invoices(self, **params):
        """
        Liste des factures clients avec filtres et pagination
        
        Query params:
        - status: draft|posted|cancel|all (default: all)
        - payment_state: not_paid|in_payment|paid|partial|all (default: all)
        - customer_id: int (filter by partner)
        - date_from: YYYY-MM-DD
        - date_to: YYYY-MM-DD
        - limit: int (default: 50)
        - offset: int (default: 0)
        - sort: field,direction (ex: invoice_date,desc)
        """
        try:
            # Authentification
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            # Récupérer tenant_id
            tenant_id = self._get_tenant_id(user)
            if not tenant_id:
                return self._error_response("Tenant non trouvé", "FORBIDDEN", 403)

            # Paramètres de filtrage
            status = params.get('status', 'all')
            payment_state = params.get('payment_state', 'all')
            customer_id = params.get('customer_id')
            date_from = params.get('date_from')
            date_to = params.get('date_to')
            limit = int(params.get('limit', 50))
            offset = int(params.get('offset', 0))
            sort_param = params.get('sort', 'invoice_date,desc')

            # Construire domain
            domain = [
                ('tenant_id', '=', tenant_id),
                ('move_type', '=', 'out_invoice'),
            ]

            if status != 'all':
                domain.append(('state', '=', status))

            if payment_state != 'all':
                domain.append(('payment_state', '=', payment_state))

            if customer_id:
                domain.append(('partner_id', '=', int(customer_id)))

            if date_from:
                domain.append(('invoice_date', '>=', date_from))

            if date_to:
                domain.append(('invoice_date', '<=', date_to))

            # Ordre de tri
            sort_field, sort_direction = sort_param.split(',') if ',' in sort_param else ('invoice_date', 'desc')
            order = f"{sort_field} {sort_direction}"

            # Recherche
            AccountMove = request.env['account.move'].sudo()
            invoices = AccountMove.search(domain, limit=limit, offset=offset, order=order)
            total_count = AccountMove.search_count(domain)

            # Sérialisation
            data = {
                'invoices': [self._serialize_invoice(inv) for inv in invoices],
                'total': total_count,
                'limit': limit,
                'offset': offset,
            }

            return self._success_response(data)

        except Exception as e:
            _logger.error(f"Erreur get_invoices: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/invoices/<int:invoice_id>', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_invoice(self, invoice_id, **params):
        """Détail d'une facture client"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            if not tenant_id:
                return self._error_response("Tenant non trouvé", "FORBIDDEN", 403)

            # Récupérer la facture
            AccountMove = request.env['account.move'].sudo()
            invoice = AccountMove.search([
                ('id', '=', invoice_id),
                ('tenant_id', '=', tenant_id),
                ('move_type', '=', 'out_invoice'),
            ], limit=1)

            if not invoice:
                return self._error_response("Facture introuvable", "NOT_FOUND", 404)

            # Sérialiser avec lignes de facture
            data = self._serialize_invoice(invoice, include_lines=True)
            return self._success_response(data)

        except Exception as e:
            _logger.error(f"Erreur get_invoice {invoice_id}: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/invoices/create', type='json', auth='user', methods=['POST', 'OPTIONS'], csrf=False)
    def create_invoice(self, **params):
        """
        Créer une nouvelle facture client
        
        Body:
        {
          "customerId": 123,
          "invoiceDate": "2026-01-31",
          "dueDate": "2026-02-28",
          "reference": "INV-2026-001",
          "lines": [
            {
              "productId": 456,
              "description": "Prestation de service",
              "quantity": 1.0,
              "unitPrice": 1000.0,
              "taxIds": [1, 2]
            }
          ],
          "note": "Merci pour votre confiance"
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            if not tenant_id:
                return self._error_response("Tenant non trouvé", "FORBIDDEN", 403)

            # Valider les champs requis
            data = request.jsonrequest
            if not data.get('customerId'):
                return self._error_response("Customer ID requis", "VALIDATION_ERROR", 400)

            if not data.get('lines'):
                return self._error_response("Au moins une ligne de facture requise", "VALIDATION_ERROR", 400)

            # Préparer les valeurs
            vals = self._prepare_invoice_values(data, tenant_id)

            # Créer la facture
            AccountMove = request.env['account.move'].sudo()
            invoice = AccountMove.create(vals)

            _logger.info(f"Facture client {invoice.name} créée (ID: {invoice.id})")

            return self._success_response(
                self._serialize_invoice(invoice, include_lines=True),
                message=f"Facture {invoice.name} créée avec succès"
            )

        except Exception as e:
            _logger.error(f"Erreur create_invoice: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/invoices/<int:invoice_id>/update', type='json', auth='user', methods=['PUT', 'OPTIONS'], csrf=False)
    def update_invoice(self, invoice_id, **params):
        """Modifier une facture client (état brouillon uniquement)"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)

            # Récupérer la facture
            AccountMove = request.env['account.move'].sudo()
            invoice = AccountMove.search([
                ('id', '=', invoice_id),
                ('tenant_id', '=', tenant_id),
                ('move_type', '=', 'out_invoice'),
            ], limit=1)

            if not invoice:
                return self._error_response("Facture introuvable", "NOT_FOUND", 404)

            # Vérifier que la facture est en brouillon
            if invoice.state != 'draft':
                return self._error_response(
                    "Seules les factures brouillon peuvent être modifiées",
                    "VALIDATION_ERROR",
                    400
                )

            # Préparer les valeurs
            data = request.jsonrequest
            vals = self._prepare_invoice_values(data, tenant_id, update=True)

            # Mettre à jour
            invoice.write(vals)

            _logger.info(f"Facture {invoice.name} mise à jour")

            return self._success_response(
                self._serialize_invoice(invoice, include_lines=True),
                message="Facture mise à jour avec succès"
            )

        except Exception as e:
            _logger.error(f"Erreur update_invoice {invoice_id}: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/invoices/<int:invoice_id>/validate', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def validate_invoice(self, invoice_id, **params):
        """Valider (poster) une facture client"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)

            # Récupérer la facture
            AccountMove = request.env['account.move'].sudo()
            invoice = AccountMove.search([
                ('id', '=', invoice_id),
                ('tenant_id', '=', tenant_id),
                ('move_type', '=', 'out_invoice'),
            ], limit=1)

            if not invoice:
                return self._error_response("Facture introuvable", "NOT_FOUND", 404)

            # Vérifier l'état
            if invoice.state != 'draft':
                return self._error_response("Cette facture est déjà validée", "VALIDATION_ERROR", 400)

            # Valider (action_post crée les écritures comptables)
            invoice.action_post()

            _logger.info(f"Facture {invoice.name} validée")

            return self._success_response(
                self._serialize_invoice(invoice, include_lines=True),
                message=f"Facture {invoice.name} validée avec succès"
            )

        except Exception as e:
            _logger.error(f"Erreur validate_invoice {invoice_id}: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/invoices/<int:invoice_id>/duplicate', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def duplicate_invoice(self, invoice_id, **params):
        """Dupliquer une facture client"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)

            # Récupérer la facture
            AccountMove = request.env['account.move'].sudo()
            invoice = AccountMove.search([
                ('id', '=', invoice_id),
                ('tenant_id', '=', tenant_id),
                ('move_type', '=', 'out_invoice'),
            ], limit=1)

            if not invoice:
                return self._error_response("Facture introuvable", "NOT_FOUND", 404)

            # Dupliquer
            new_invoice = invoice.copy({
                'invoice_date': False,
                'date': False,
            })

            _logger.info(f"Facture {invoice.name} dupliquée en {new_invoice.name}")

            return self._success_response(
                self._serialize_invoice(new_invoice, include_lines=True),
                message=f"Facture dupliquée : {new_invoice.name}"
            )

        except Exception as e:
            _logger.error(f"Erreur duplicate_invoice {invoice_id}: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    # ─────────────────────────────────────────────────────────────────────
    # HELPER METHODS
    # ─────────────────────────────────────────────────────────────────────

    def _prepare_invoice_values(self, data, tenant_id, update=False):
        """Préparer les valeurs pour create/update (accepte camelCase + snake_case)"""
        vals = {}

        # Tenant (requis en création)
        if not update:
            vals['tenant_id'] = tenant_id

        # Type de facture
        vals['move_type'] = 'out_invoice'

        # Client
        if 'customerId' in data or 'customer_id' in data:
            vals['partner_id'] = data.get('customerId') or data.get('customer_id')

        # Dates
        if 'invoiceDate' in data or 'invoice_date' in data:
            vals['invoice_date'] = data.get('invoiceDate') or data.get('invoice_date')

        if 'dueDate' in data or 'due_date' in data:
            vals['invoice_date_due'] = data.get('dueDate') or data.get('due_date')

        # Référence
        if 'reference' in data:
            vals['ref'] = data['reference']

        # Note
        if 'note' in data:
            vals['narration'] = data['note']

        # Lignes de facture
        if 'lines' in data:
            lines_commands = []
            for line_data in data['lines']:
                line_vals = {
                    'product_id': line_data.get('productId') or line_data.get('product_id'),
                    'name': line_data.get('description', ''),
                    'quantity': line_data.get('quantity', 1.0),
                    'price_unit': line_data.get('unitPrice') or line_data.get('unit_price', 0.0),
                }

                # Taxes
                tax_ids = line_data.get('taxIds') or line_data.get('tax_ids', [])
                if tax_ids:
                    line_vals['tax_ids'] = [(6, 0, tax_ids)]

                lines_commands.append((0, 0, line_vals))

            vals['invoice_line_ids'] = lines_commands

        return vals

    def _serialize_invoice(self, invoice, include_lines=False):
        """Convertir account.move en format frontend (camelCase)"""
        data = {
            'id': invoice.id,
            'name': invoice.name,
            'state': invoice.state,
            'paymentState': invoice.payment_state,
            'customer': {
                'id': invoice.partner_id.id,
                'name': invoice.partner_id.name,
                'email': invoice.partner_id.email or '',
            },
            'invoiceDate': invoice.invoice_date.isoformat() if invoice.invoice_date else None,
            'dueDate': invoice.invoice_date_due.isoformat() if invoice.invoice_date_due else None,
            'reference': invoice.ref or '',
            'amountUntaxed': float(invoice.amount_untaxed),
            'amountTax': float(invoice.amount_tax),
            'amountTotal': float(invoice.amount_total),
            'amountResidual': float(invoice.amount_residual),
            'currency': {
                'id': invoice.currency_id.id,
                'name': invoice.currency_id.name,
                'symbol': invoice.currency_id.symbol,
            },
            'note': invoice.narration or '',
            'createdAt': invoice.create_date.isoformat() if invoice.create_date else None,
            'updatedAt': invoice.write_date.isoformat() if invoice.write_date else None,
        }

        if include_lines:
            data['lines'] = [
                {
                    'id': line.id,
                    'product': {
                        'id': line.product_id.id if line.product_id else None,
                        'name': line.product_id.name if line.product_id else '',
                    },
                    'description': line.name or '',
                    'quantity': float(line.quantity),
                    'unitPrice': float(line.price_unit),
                    'subtotal': float(line.price_subtotal),
                    'taxes': [
                        {'id': tax.id, 'name': tax.name, 'rate': float(tax.amount)}
                        for tax in line.tax_ids
                    ],
                }
                for line in invoice.invoice_line_ids
            ]

        return data
