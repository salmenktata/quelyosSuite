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

    @http.route('/api/finance/invoices/quick-create', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def quick_create_invoice(self, **params):
        """
        Création rapide de facture (wizard 3 étapes)

        Body:
        {
          "customerId": 123,  // OU customerData pour création rapide
          "customerData": {   // Optionnel si customerId fourni
            "name": "Client Express",
            "email": "client@example.com",
            "phone": "+33612345678"
          },
          "invoiceDate": "2026-02-04",
          "dueDate": "2026-03-04",
          "reference": "REF-001",
          "note": "Merci pour votre confiance",
          "lines": [
            {
              "productId": 456,  // Optionnel
              "description": "Service de conseil",
              "quantity": 2,
              "unitPrice": 100.0,
              "taxIds": [1]
            }
          ],
          "validate": false  // true pour valider directement
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

            # Valider lignes
            if not data.get('lines'):
                return self._error_response("Au moins une ligne de facture requise", "VALIDATION_ERROR", 400)

            # Gérer client (existant ou création rapide)
            customer_id = data.get('customerId')

            if not customer_id and data.get('customerData'):
                # Création rapide d'un client
                Partner = request.env['res.partner'].sudo()
                customer_data = data['customerData']

                # Vérifier si le client existe déjà par email
                existing = Partner.search([
                    ('email', '=', customer_data.get('email')),
                    ('tenant_id', '=', tenant_id)
                ], limit=1)

                if existing:
                    customer_id = existing.id
                else:
                    # Créer nouveau client
                    customer = Partner.create({
                        'name': customer_data.get('name'),
                        'email': customer_data.get('email'),
                        'phone': customer_data.get('phone', ''),
                        'tenant_id': tenant_id,
                        'customer_rank': 1,
                    })
                    customer_id = customer.id
                    _logger.info(f"Client {customer.name} créé rapidement (ID: {customer.id})")

            if not customer_id:
                return self._error_response("customerId ou customerData requis", "VALIDATION_ERROR", 400)

            # Préparer valeurs facture
            data['customerId'] = customer_id
            vals = self._prepare_invoice_values(data, tenant_id)

            # Créer facture
            AccountMove = request.env['account.move'].sudo()
            invoice = AccountMove.create(vals)

            _logger.info(f"Facture express {invoice.name} créée (ID: {invoice.id})")

            # Valider si demandé
            if data.get('validate', False):
                invoice.action_post()
                _logger.info(f"Facture {invoice.name} validée automatiquement")

            return self._success_response(
                self._serialize_invoice(invoice, include_lines=True),
                message=f"Facture {invoice.name} créée avec succès"
            )

        except Exception as e:
            _logger.error(f"Erreur quick_create_invoice: {e}", exc_info=True)
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

    @http.route('/api/finance/invoices/<int:invoice_id>/create-credit-note', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def create_credit_note(self, invoice_id, **params):
        """
        Créer avoir (credit note) depuis facture

        Body:
        {
          "amount": 1234.56,  // Optionnel, si partiel
          "reason": "Retour marchandise"
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            data = request.jsonrequest

            # Récupérer facture origine
            AccountMove = request.env['account.move'].sudo()
            invoice = AccountMove.search([
                ('id', '=', invoice_id),
                ('tenant_id', '=', tenant_id),
                ('move_type', '=', 'out_invoice'),
                ('state', '=', 'posted'),
            ], limit=1)

            if not invoice:
                return self._error_response("Facture introuvable ou non validée", "NOT_FOUND", 404)

            # Montant avoir (total ou partiel)
            credit_amount = float(data.get('amount')) if data.get('amount') else float(invoice.amount_total)
            reason = data.get('reason', 'Avoir sur facture')

            # Créer avoir
            credit_note_vals = {
                'move_type': 'out_refund',
                'partner_id': invoice.partner_id.id,
                'invoice_date': invoice.invoice_date,
                'tenant_id': tenant_id,
                'ref': f"Avoir facture {invoice.name}",
                'narration': reason,
                'reversed_entry_id': invoice.id,  # Lien facture origine
            }

            # Si avoir partiel, ajuster lignes
            if credit_amount < float(invoice.amount_total):
                # Créer ligne unique avec montant partiel
                credit_note_vals['invoice_line_ids'] = [(0, 0, {
                    'name': f'Avoir partiel sur {invoice.name}',
                    'quantity': 1,
                    'price_unit': credit_amount,
                })]
            else:
                # Avoir total: copier lignes facture avec quantités négatives
                lines = []
                for line in invoice.invoice_line_ids:
                    lines.append((0, 0, {
                        'product_id': line.product_id.id if line.product_id else False,
                        'name': line.name,
                        'quantity': line.quantity,
                        'price_unit': line.price_unit,
                        'tax_ids': [(6, 0, line.tax_ids.ids)],
                    }))
                credit_note_vals['invoice_line_ids'] = lines

            credit_note = AccountMove.create(credit_note_vals)

            _logger.info(f"Avoir {credit_note.name} créé depuis facture {invoice.name}")

            return self._success_response(
                {
                    'creditNote': self._serialize_invoice(credit_note, include_lines=True),
                    'originInvoice': self._serialize_invoice(invoice),
                },
                message=f"Avoir {credit_note.name} créé avec succès"
            )

        except Exception as e:
            _logger.error(f"Erreur create_credit_note {invoice_id}: {e}", exc_info=True)
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

    @http.route('/api/finance/invoices/<int:invoice_id>/payment-link', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_invoice_payment_link(self, invoice_id, **params):
        """
        Générer un Payment Link Stripe pour payer une facture

        Returns:
        {
          "paymentUrl": "https://checkout.stripe.com/...",
          "paymentLinkId": "plink_...",
          "expiresAt": "2026-02-10T12:00:00Z"
        }
        """
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
                ('state', '=', 'posted'),  # Seulement factures validées
            ], limit=1)

            if not invoice:
                return self._error_response("Facture introuvable ou non validée", "NOT_FOUND", 404)

            # Vérifier si déjà payée
            if invoice.payment_state == 'paid':
                return self._error_response("Cette facture est déjà payée", "ALREADY_PAID", 400)

            # Importer Stripe
            try:
                import stripe
            except ImportError:
                return self._error_response("Stripe non configuré", "STRIPE_NOT_CONFIGURED", 503)

            # Récupérer clé Stripe
            stripe_key = request.env['ir.config_parameter'].sudo().get_param('payment.stripe.secret_key')
            if not stripe_key:
                return self._error_response("Stripe non configuré", "STRIPE_NOT_CONFIGURED", 503)

            stripe.api_key = stripe_key

            # Calculer montant restant à payer
            amount_residual = float(invoice.amount_residual)
            if amount_residual <= 0:
                return self._error_response("Aucun montant à payer", "NO_AMOUNT_DUE", 400)

            amount_cents = int(amount_residual * 100)

            # Créer Payment Link Stripe
            payment_link = stripe.PaymentLink.create(
                line_items=[{
                    'price_data': {
                        'currency': invoice.currency_id.name.lower(),
                        'product_data': {
                            'name': f'Facture {invoice.name}',
                            'description': f'Client: {invoice.partner_id.name}',
                        },
                        'unit_amount': amount_cents,
                    },
                    'quantity': 1,
                }],
                metadata={
                    'invoice_id': invoice.id,
                    'invoice_name': invoice.name,
                    'tenant_id': tenant_id,
                    'customer_id': invoice.partner_id.id,
                },
                after_completion={
                    'type': 'redirect',
                    'redirect': {
                        'url': f'{request.httprequest.host_url}payment-success?invoice={invoice.name}',
                    },
                },
            )

            _logger.info(f"Payment Link créé pour facture {invoice.name}: {payment_link.id}")

            return self._success_response({
                'paymentUrl': payment_link.url,
                'paymentLinkId': payment_link.id,
                'amount': amount_residual,
                'currency': invoice.currency_id.name,
            })

        except Exception as e:
            _logger.error(f"Erreur get_invoice_payment_link {invoice_id}: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/invoices/stripe-webhook', type='http', auth='none', methods=['POST'], csrf=False)
    def invoice_payment_webhook(self, **kwargs):
        """
        Webhook Stripe pour paiements de factures
        Gère checkout.session.completed pour Payment Links
        """
        payload = request.httprequest.data
        sig_header = request.httprequest.headers.get('Stripe-Signature')

        # Récupérer clés Stripe
        stripe_key = request.env['ir.config_parameter'].sudo().get_param('payment.stripe.secret_key')
        webhook_secret = request.env['ir.config_parameter'].sudo().get_param('payment.stripe.webhook_secret')

        if not stripe_key or not webhook_secret:
            _logger.error("Stripe webhook: Configuration manquante")
            return request.make_response('Webhook configuration error', status=400)

        try:
            import stripe
            stripe.api_key = stripe_key

            # Vérifier signature Stripe
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        except ValueError:
            _logger.error("Stripe webhook: Payload invalide")
            return request.make_response('Invalid payload', status=400)
        except stripe.error.SignatureVerificationError:
            _logger.error("Stripe webhook: Signature invalide")
            return request.make_response('Invalid signature', status=400)
        except ImportError:
            _logger.error("Stripe webhook: Librairie stripe manquante")
            return request.make_response('Stripe not configured', status=503)

        # Traiter événement
        event_type = event['type']
        _logger.info(f"Stripe webhook facture reçu: {event_type}")

        if event_type == 'checkout.session.completed':
            session = event['data']['object']
            self._handle_invoice_payment_success(session)

        return request.make_response('Success', status=200)

    def _handle_invoice_payment_success(self, session):
        """
        Gérer succès paiement facture via Payment Link

        Actions:
        1. Créer account.payment
        2. Réconcilier avec la facture
        3. Logger transaction
        """
        try:
            metadata = session.get('metadata', {})
            invoice_id = metadata.get('invoice_id')

            if not invoice_id:
                _logger.warning("Webhook: invoice_id manquant dans metadata")
                return

            invoice_id = int(invoice_id)

            # Récupérer la facture
            invoice = request.env['account.move'].sudo().browse(invoice_id)
            if not invoice.exists():
                _logger.warning(f"Webhook: Facture {invoice_id} introuvable")
                return

            # Vérifier si déjà payée
            if invoice.payment_state == 'paid':
                _logger.info(f"Webhook: Facture {invoice.name} déjà payée")
                return

            # Récupérer montant payé (en centimes)
            amount_cents = session.get('amount_total', 0)
            amount = amount_cents / 100.0

            # Créer le paiement
            payment_vals = {
                'payment_type': 'inbound',
                'partner_type': 'customer',
                'partner_id': invoice.partner_id.id,
                'amount': amount,
                'currency_id': invoice.currency_id.id,
                'date': request.env['fields'].Date.today(),
                'ref': f"Paiement Stripe - {invoice.name}",
                'journal_id': self._get_stripe_journal_id(),
            }

            payment = request.env['account.payment'].sudo().create(payment_vals)
            payment.action_post()

            # Réconcilier avec la facture
            lines_to_reconcile = (payment.line_ids + invoice.line_ids).filtered(
                lambda l: l.account_id.account_type in ('asset_receivable', 'liability_payable') and not l.reconciled
            )

            if lines_to_reconcile:
                lines_to_reconcile.reconcile()

            _logger.info(
                f"Paiement Stripe créé et réconcilié pour facture {invoice.name}: "
                f"{amount} {invoice.currency_id.name}"
            )

        except Exception as e:
            _logger.error(f"Erreur handling invoice payment: {e}", exc_info=True)

    def _get_stripe_journal_id(self):
        """Récupérer le journal Stripe (ou journal banque par défaut)"""
        # Chercher journal nommé "Stripe"
        journal = request.env['account.journal'].sudo().search([
            ('name', 'ilike', 'stripe'),
            ('type', '=', 'bank'),
        ], limit=1)

        if journal:
            return journal.id

        # Sinon, prendre premier journal banque
        journal = request.env['account.journal'].sudo().search([
            ('type', '=', 'bank'),
        ], limit=1)

        return journal.id if journal else False

    @http.route('/api/finance/invoices/bulk-remind', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def bulk_remind_invoices(self, **params):
        """
        Envoyer des relances automatiques pour plusieurs factures impayées

        Body:
        {
          "invoiceIds": [123, 456, 789],
          "templateId": 42  // Optionnel, sinon utilise template par défaut
        }

        Returns:
        {
          "success": true,
          "sent": 3,
          "failed": 0,
          "details": [...]
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
            invoice_ids = data.get('invoiceIds', [])

            if not invoice_ids:
                return self._error_response("Aucune facture sélectionnée", "VALIDATION_ERROR", 400)

            # Récupérer les factures
            AccountMove = request.env['account.move'].sudo()
            invoices = AccountMove.search([
                ('id', 'in', invoice_ids),
                ('tenant_id', '=', tenant_id),
                ('move_type', '=', 'out_invoice'),
                ('state', '=', 'posted'),
                ('payment_state', '!=', 'paid'),
            ])

            if not invoices:
                return self._error_response("Aucune facture impayée trouvée", "NOT_FOUND", 404)

            sent_count = 0
            failed_count = 0
            details = []

            for invoice in invoices:
                try:
                    # Calculer jours de retard
                    days_overdue = 0
                    if invoice.invoice_date_due:
                        from datetime import date
                        today = date.today()
                        due_date = invoice.invoice_date_due
                        if due_date < today:
                            days_overdue = (today - due_date).days

                    # Préparer contexte email
                    email_context = {
                        'invoice_name': invoice.name,
                        'customer_name': invoice.partner_id.name,
                        'amount_residual': invoice.amount_residual,
                        'currency': invoice.currency_id.symbol,
                        'due_date': invoice.invoice_date_due.strftime('%d/%m/%Y') if invoice.invoice_date_due else 'Non définie',
                        'days_overdue': days_overdue,
                    }

                    # Email simple (sans template pour l'instant)
                    email_values = {
                        'email_to': invoice.partner_id.email,
                        'email_from': user.email or 'noreply@quelyos.com',
                        'subject': f'Relance facture {invoice.name}',
                        'body_html': self._generate_reminder_email_body(email_context),
                        'model': 'account.move',
                        'res_id': invoice.id,
                        'author_id': user.partner_id.id,
                    }

                    # Envoyer l'email
                    mail = request.env['mail.mail'].sudo().create(email_values)
                    mail.send()

                    sent_count += 1
                    details.append({
                        'invoiceId': invoice.id,
                        'invoiceName': invoice.name,
                        'customerEmail': invoice.partner_id.email,
                        'status': 'sent'
                    })

                    _logger.info(f"Relance envoyée pour facture {invoice.name} à {invoice.partner_id.email}")

                except Exception as e:
                    failed_count += 1
                    details.append({
                        'invoiceId': invoice.id,
                        'invoiceName': invoice.name,
                        'status': 'failed',
                        'error': str(e)
                    })
                    _logger.error(f"Erreur envoi relance facture {invoice.name}: {e}")

            return self._success_response({
                'sent': sent_count,
                'failed': failed_count,
                'total': len(invoices),
                'details': details
            }, message=f"{sent_count} relance(s) envoyée(s) avec succès")

        except Exception as e:
            _logger.error(f"Erreur bulk_remind_invoices: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/invoices/bulk-remind-async', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def bulk_remind_async(self, **params):
        """
        Relances multiples ASYNCHRONES (job queue)

        Retourne immédiatement job_id pour polling frontend

        Body:
        {
          "invoice_ids": [1, 2, 3, ...],  # Optionnel, sinon toutes impayées
          "overdue_only": true             # Optionnel, défaut false
        }

        Returns:
        {
          "success": true,
          "data": {
            "job_id": "bulk_reminder_abc123def",
            "invoice_count": 150,
            "message": "Job créé, traitement en cours..."
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            # Paramètres
            data = request.jsonrequest
            invoice_ids = data.get('invoice_ids', [])
            overdue_only = data.get('overdue_only', False)

            # Si aucun ID fourni, récupérer toutes factures impayées
            if not invoice_ids:
                domain = [
                    ('tenant_id', '=', user.tenant_id.id),
                    ('move_type', '=', 'out_invoice'),
                    ('state', '=', 'posted'),
                    ('payment_state', 'in', ['not_paid', 'partial']),
                ]

                if overdue_only:
                    from datetime import date
                    today = date.today()
                    domain.append(('invoice_date_due', '<', today))

                AccountMove = request.env['account.move'].sudo()
                invoices = AccountMove.search(domain)
                invoice_ids = invoices.ids

            if not invoice_ids:
                return self._error_response("Aucune facture à traiter", "VALIDATION_ERROR", 400)

            # Créer job asynchrone
            import json
            BulkReminderJob = request.env['quelyos.bulk_reminder_job'].sudo()

            job = BulkReminderJob.create({
                'tenant_id': user.tenant_id.id,
                'user_id': user.id,
                'invoice_ids': json.dumps(invoice_ids),
            })

            # Démarrer traitement immédiatement (ou via cron)
            # Pour l'instant, traitement synchrone après retour API
            # TODO: Utiliser queue.job ou odoo cron
            job.with_delay().action_process_job()  # Si queue_job installé
            # Sinon : job.action_process_job()  # Synchrone mais dans commit séparé

            _logger.info(
                f"Job relances bulk créé : {job.job_id} "
                f"({len(invoice_ids)} factures)"
            )

            return self._success_response({
                'job_id': job.job_id,
                'invoice_count': len(invoice_ids),
                'message': f'Job créé, traitement de {len(invoice_ids)} facture(s) en cours...',
            })

        except Exception as e:
            _logger.error(f"Erreur bulk_remind_async: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/invoices/bulk-remind-status/<string:job_id>', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def bulk_remind_status(self, job_id, **params):
        """
        Récupérer status job relances (polling frontend)

        Args:
            job_id (str): Job ID retourné par /bulk-remind-async

        Returns:
        {
          "success": true,
          "data": {
            "job_id": "bulk_reminder_abc123def",
            "state": "processing",  # pending, processing, completed, failed
            "progress": 65,         # 0-100
            "invoice_count": 150,
            "processed_count": 98,
            "sent_count": 95,
            "failed_count": 3,
            "duration": 45,         # secondes
            "results": [...]        # Si completed
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            # Récupérer status job
            BulkReminderJob = request.env['quelyos.bulk_reminder_job'].sudo()
            status = BulkReminderJob.get_job_status(job_id)

            if not status.get('found'):
                return self._error_response("Job introuvable", "NOT_FOUND", 404)

            return self._success_response(status)

        except Exception as e:
            _logger.error(f"Erreur bulk_remind_status: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    def _generate_reminder_email_body(self, context):
        """Générer le corps d'email de relance"""
        return f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #e74c3c;">Relance de paiement</h2>
            <p>Bonjour {context['customer_name']},</p>
            <p>Nous vous contactons concernant la facture <strong>{context['invoice_name']}</strong> d'un montant de <strong>{context['amount_residual']:.2f} {context['currency']}</strong>.</p>
            <p>Date d'échéance : <strong>{context['due_date']}</strong></p>
            {f"<p style='color: #e74c3c;'><strong>Cette facture est en retard de {context['days_overdue']} jour(s).</strong></p>" if context['days_overdue'] > 0 else ""}
            <p>Nous vous remercions de bien vouloir procéder au règlement dans les meilleurs délais.</p>
            <p>Pour toute question, n'hésitez pas à nous contacter.</p>
            <p>Cordialement,<br/>L'équipe Quelyos</p>
        </body>
        </html>
        """

    @http.route('/api/finance/invoices/bulk-remind-sms', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def bulk_remind_sms(self, **params):
        """Relances SMS multiples (nécessite Twilio configuré)"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            data = request.jsonrequest
            invoice_ids = data.get('invoiceIds', [])

            if not invoice_ids:
                return self._error_response("invoiceIds requis", "VALIDATION_ERROR", 400)

            # Vérifier config Twilio
            twilio_sid = request.env['ir.config_parameter'].sudo().get_param('twilio.account_sid')
            twilio_token = request.env['ir.config_parameter'].sudo().get_param('twilio.auth_token')
            twilio_phone = request.env['ir.config_parameter'].sudo().get_param('twilio.phone_number')

            if not all([twilio_sid, twilio_token, twilio_phone]):
                return self._error_response("Twilio non configuré", "TWILIO_NOT_CONFIGURED", 503)

            # Récupérer factures
            invoices = request.env['account.move'].sudo().search([
                ('id', 'in', invoice_ids),
                ('tenant_id', '=', tenant_id),
                ('move_type', '=', 'out_invoice'),
                ('state', '=', 'posted'),
                ('payment_state', '!=', 'paid'),
            ])

            sent_count = 0
            failed_count = 0

            try:
                from twilio.rest import Client
                twilio_client = Client(twilio_sid, twilio_token)
            except ImportError:
                return self._error_response("Librairie twilio non installée", "TWILIO_NOT_INSTALLED", 503)

            for invoice in invoices:
                if not invoice.partner_id.mobile:
                    failed_count += 1
                    continue

                try:
                    message_body = f"Relance facture {invoice.name} : {float(invoice.amount_residual):.2f} EUR. Échéance : {invoice.invoice_date_due.strftime('%d/%m/%Y') if invoice.invoice_date_due else 'Non définie'}."

                    twilio_client.messages.create(
                        body=message_body,
                        from_=twilio_phone,
                        to=invoice.partner_id.mobile
                    )

                    sent_count += 1
                    _logger.info(f"SMS envoyé pour facture {invoice.name} à {invoice.partner_id.mobile}")
                except Exception as e:
                    failed_count += 1
                    _logger.error(f"Erreur envoi SMS facture {invoice.name}: {e}")

            return self._success_response({
                'sent': sent_count,
                'failed': failed_count,
                'total': len(invoices),
            }, message=f"{sent_count} SMS envoyé(s)")

        except Exception as e:
            _logger.error(f"Erreur bulk_remind_sms: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/invoices/bulk-remind-whatsapp', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def bulk_remind_whatsapp(self, **params):
        """Relances WhatsApp multiples (nécessite Twilio WhatsApp configuré)"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            data = request.jsonrequest
            invoice_ids = data.get('invoiceIds', [])

            if not invoice_ids:
                return self._error_response("invoiceIds requis", "VALIDATION_ERROR", 400)

            # Vérifier config
            twilio_sid = request.env['ir.config_parameter'].sudo().get_param('twilio.account_sid')
            twilio_token = request.env['ir.config_parameter'].sudo().get_param('twilio.auth_token')
            twilio_whatsapp = request.env['ir.config_parameter'].sudo().get_param('twilio.whatsapp_number')

            if not all([twilio_sid, twilio_token, twilio_whatsapp]):
                return self._error_response("Twilio WhatsApp non configuré", "TWILIO_NOT_CONFIGURED", 503)

            invoices = request.env['account.move'].sudo().search([
                ('id', 'in', invoice_ids),
                ('tenant_id', '=', tenant_id),
                ('move_type', '=', 'out_invoice'),
                ('state', '=', 'posted'),
                ('payment_state', '!=', 'paid'),
            ])

            sent_count = 0
            failed_count = 0

            try:
                from twilio.rest import Client
                twilio_client = Client(twilio_sid, twilio_token)
            except ImportError:
                return self._error_response("Librairie twilio non installée", "TWILIO_NOT_INSTALLED", 503)

            for invoice in invoices:
                if not invoice.partner_id.mobile:
                    failed_count += 1
                    continue

                try:
                    message_body = f"Bonjour,\n\nRelance de paiement\nFacture : {invoice.name}\nMontant : {float(invoice.amount_residual):.2f} EUR\nÉchéance : {invoice.invoice_date_due.strftime('%d/%m/%Y') if invoice.invoice_date_due else 'Non définie'}\n\nMerci de procéder au règlement."

                    twilio_client.messages.create(
                        body=message_body,
                        from_=f'whatsapp:{twilio_whatsapp}',
                        to=f'whatsapp:{invoice.partner_id.mobile}'
                    )

                    sent_count += 1
                    _logger.info(f"WhatsApp envoyé pour facture {invoice.name}")
                except Exception as e:
                    failed_count += 1
                    _logger.error(f"Erreur WhatsApp facture {invoice.name}: {e}")

            return self._success_response({
                'sent': sent_count,
                'failed': failed_count,
                'total': len(invoices),
            }, message=f"{sent_count} WhatsApp envoyé(s)")

        except Exception as e:
            _logger.error(f"Erreur bulk_remind_whatsapp: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/invoices/ocr-extract', type='http', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def ocr_extract_supplier_invoice(self, **params):
        """
        OCR extraction facture fournisseur depuis PDF/image
        Upload fichier → extraction texte → parsing données structurées
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)

            # Récupérer fichier uploadé
            file_upload = request.httprequest.files.get('file')
            if not file_upload:
                return self._error_response("Fichier requis", "VALIDATION_ERROR", 400)

            # Vérifier type MIME
            allowed_types = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
            if file_upload.content_type not in allowed_types:
                return self._error_response("Type fichier non supporté (PDF, PNG, JPG uniquement)", "VALIDATION_ERROR", 400)

            # Lire contenu fichier
            file_content = file_upload.read()
            file_name = file_upload.filename

            extracted_data = {}
            extraction_method = 'none'

            # Tentative 1 : Extraction avec pytesseract (OCR open-source)
            try:
                import pytesseract
                from PIL import Image
                import io

                if file_upload.content_type == 'application/pdf':
                    # Convertir PDF en images
                    try:
                        from pdf2image import convert_from_bytes
                        images = convert_from_bytes(file_content, first_page=1, last_page=1, dpi=300)
                        if images:
                            image = images[0]
                        else:
                            raise Exception("PDF vide")
                    except ImportError:
                        return self._error_response("pdf2image non installé (requis pour OCR PDF)", "OCR_UNAVAILABLE", 503)
                else:
                    # Image directe
                    image = Image.open(io.BytesIO(file_content))

                # Extraction texte OCR
                text = pytesseract.image_to_string(image, lang='fra')
                extracted_data = self._parse_invoice_text(text)
                extraction_method = 'tesseract'

            except ImportError as e:
                _logger.warning(f"pytesseract non disponible: {e}")
                # Tentative 2 : Google Vision API (si configuré)
                try:
                    vision_key = request.env['ir.config_parameter'].sudo().get_param('google.vision_api_key')
                    if vision_key:
                        import base64
                        import requests as req

                        # Encoder fichier base64
                        file_b64 = base64.b64encode(file_content).decode('utf-8')

                        # Appel Google Vision API
                        vision_url = f"https://vision.googleapis.com/v1/images:annotate?key={vision_key}"
                        payload = {
                            "requests": [{
                                "image": {"content": file_b64},
                                "features": [{"type": "DOCUMENT_TEXT_DETECTION"}]
                            }]
                        }

                        response = req.post(vision_url, json=payload, timeout=30)
                        if response.status_code == 200:
                            result = response.json()
                            if 'responses' in result and result['responses']:
                                text_annotations = result['responses'][0].get('textAnnotations', [])
                                if text_annotations:
                                    text = text_annotations[0].get('description', '')
                                    extracted_data = self._parse_invoice_text(text)
                                    extraction_method = 'google_vision'
                        else:
                            _logger.error(f"Google Vision API error: {response.text}")

                except Exception as vision_err:
                    _logger.error(f"Google Vision fallback failed: {vision_err}")

            except Exception as ocr_err:
                _logger.error(f"OCR extraction failed: {ocr_err}", exc_info=True)

            # Si aucune extraction réussie, retourner données vides pour saisie manuelle
            if not extracted_data or extraction_method == 'none':
                extracted_data = {
                    'supplier': {'name': '', 'vat': '', 'address': ''},
                    'invoiceNumber': '',
                    'invoiceDate': '',
                    'dueDate': '',
                    'totalAmount': 0.0,
                    'taxAmount': 0.0,
                    'untaxedAmount': 0.0,
                    'lines': [],
                    'raw_text': '',
                }
                extraction_method = 'manual'

            return json.dumps({
                'success': True,
                'data': {
                    'extractedData': extracted_data,
                    'extractionMethod': extraction_method,
                    'fileName': file_name,
                    'confidence': 'high' if extraction_method in ['tesseract', 'google_vision'] else 'manual',
                }
            })

        except Exception as e:
            _logger.error(f"Erreur ocr_extract: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    def _parse_invoice_text(self, text):
        """
        Parse texte OCR pour extraire données structurées facture
        Regex + heuristiques pour identifier numéro, dates, montants, fournisseur
        """
        import re
        from datetime import datetime

        data = {
            'supplier': {'name': '', 'vat': '', 'address': ''},
            'invoiceNumber': '',
            'invoiceDate': '',
            'dueDate': '',
            'totalAmount': 0.0,
            'taxAmount': 0.0,
            'untaxedAmount': 0.0,
            'lines': [],
            'raw_text': text,
        }

        lines = text.split('\n')

        # Extraction numéro de facture (patterns courants)
        invoice_patterns = [
            r'(?:facture|invoice|n°|no|num|#)\s*:?\s*([A-Z0-9\-]+)',
            r'(?:FA|INV|F)\s*(\d{4,})',
        ]
        for pattern in invoice_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                data['invoiceNumber'] = match.group(1).strip()
                break

        # Extraction dates (format français DD/MM/YYYY ou DD-MM-YYYY)
        date_pattern = r'(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})'
        dates_found = re.findall(date_pattern, text)
        if len(dates_found) >= 1:
            data['invoiceDate'] = dates_found[0]
        if len(dates_found) >= 2:
            data['dueDate'] = dates_found[1]

        # Extraction montants (patterns TTC, HT, TVA)
        amount_patterns = [
            (r'(?:total\s*TTC|montant\s*total)\s*:?\s*([0-9\s,.]+)\s*€?', 'totalAmount'),
            (r'(?:total\s*HT|sous-total)\s*:?\s*([0-9\s,.]+)\s*€?', 'untaxedAmount'),
            (r'(?:TVA|tva)\s*:?\s*([0-9\s,.]+)\s*€?', 'taxAmount'),
        ]

        for pattern, key in amount_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(' ', '').replace(',', '.')
                try:
                    data[key] = float(amount_str)
                except:
                    pass

        # Extraction fournisseur (première ligne non vide souvent = nom société)
        for line in lines[:10]:  # Chercher dans les 10 premières lignes
            line = line.strip()
            if len(line) > 3 and not re.match(r'^\d', line):  # Pas une ligne commençant par chiffre
                data['supplier']['name'] = line
                break

        # Extraction TVA intra (pattern FR + 11 chiffres)
        vat_match = re.search(r'(FR\s?\d{11})', text)
        if vat_match:
            data['supplier']['vat'] = vat_match.group(1).replace(' ', '')

        # Extraction lignes de facture (optionnel, complexe)
        # Pour simplifier, on ne parse pas les lignes individuelles ici
        # L'utilisateur pourra les saisir manuellement après validation

        return data

    @http.route('/api/finance/invoices/create-from-ocr', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def create_supplier_invoice_from_ocr(self, **params):
        """
        Créer facture fournisseur (account.move in_invoice) depuis données OCR validées
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            data = request.jsonrequest

            # Données requises
            supplier_name = data.get('supplierName')
            invoice_number = data.get('invoiceNumber')
            invoice_date = data.get('invoiceDate')
            total_amount = data.get('totalAmount', 0.0)

            if not all([supplier_name, invoice_number, invoice_date]):
                return self._error_response("Fournisseur, numéro et date requis", "VALIDATION_ERROR", 400)

            Partner = request.env['res.partner'].sudo()
            AccountMove = request.env['account.move'].sudo()

            # Rechercher ou créer fournisseur
            supplier = Partner.search([
                ('name', '=', supplier_name),
                ('tenant_id', '=', tenant_id),
            ], limit=1)

            if not supplier:
                supplier = Partner.create({
                    'name': supplier_name,
                    'supplier_rank': 1,
                    'customer_rank': 0,
                    'tenant_id': tenant_id,
                    'vat': data.get('supplierVat', ''),
                })

            # Créer facture fournisseur (in_invoice)
            invoice_vals = {
                'move_type': 'in_invoice',
                'partner_id': supplier.id,
                'tenant_id': tenant_id,
                'ref': invoice_number,  # Référence fournisseur
                'invoice_date': invoice_date,
                'invoice_date_due': data.get('dueDate') or invoice_date,
                'invoice_line_ids': [],
            }

            # Ajouter lignes si fournies
            lines_data = data.get('lines', [])
            if lines_data:
                for line in lines_data:
                    invoice_vals['invoice_line_ids'].append((0, 0, {
                        'name': line.get('description', 'Prestation'),
                        'quantity': line.get('quantity', 1.0),
                        'price_unit': line.get('unitPrice', 0.0),
                    }))
            else:
                # Si pas de lignes, créer une ligne générique avec montant total
                invoice_vals['invoice_line_ids'].append((0, 0, {
                    'name': 'Facture fournisseur (à détailler)',
                    'quantity': 1.0,
                    'price_unit': total_amount,
                }))

            invoice = AccountMove.create(invoice_vals)

            return self._success_response({
                'invoice': {
                    'id': invoice.id,
                    'name': invoice.name,
                    'ref': invoice.ref,
                    'supplierId': supplier.id,
                    'supplierName': supplier.name,
                    'invoiceDate': str(invoice.invoice_date),
                    'state': invoice.state,
                    'amountTotal': float(invoice.amount_total),
                }
            }, message="Facture fournisseur créée avec succès")

        except Exception as e:
            _logger.error(f"Erreur create_supplier_invoice_from_ocr: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/invoices/stats', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_invoice_stats(self, **params):
        """
        Statistiques agrégées factures clients (optimisé PostgreSQL)

        Calcule côté backend pour éviter transfert massif données.
        Réutilisable par modules Finance/CRM/Dashboard.

        Returns:
        {
          "totalInvoiced": 150000.0,    // Total facturé (toutes factures validées)
          "totalPaid": 120000.0,         // Total payé
          "totalPending": 25000.0,       // Total en attente (non payé)
          "totalOverdue": 5000.0,        // Total en retard (échéance dépassée)
          "count": 142,                  // Nombre total factures
          "avgAmount": 1056.34           // Montant moyen facture
        }
        """
        try:
            # Authentification
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            # Récupérer tenant_id (isolation SaaS)
            tenant_id = self._get_tenant_id(user)
            if not tenant_id:
                return self._error_response("Tenant non trouvé", "FORBIDDEN", 403)

            # Requête SQL optimisée (1 seule query au lieu de N)
            # PostgreSQL calcule directement les agrégats
            query = """
                SELECT
                    COUNT(id) as invoice_count,
                    COALESCE(SUM(amount_total), 0) as total_invoiced,
                    COALESCE(SUM(CASE WHEN payment_state = 'paid' THEN amount_total ELSE 0 END), 0) as total_paid,
                    COALESCE(SUM(CASE WHEN payment_state IN ('not_paid', 'partial') THEN amount_residual ELSE 0 END), 0) as total_pending,
                    COALESCE(SUM(CASE
                        WHEN invoice_date_due < CURRENT_DATE
                        AND payment_state != 'paid'
                        AND state = 'posted'
                        THEN amount_residual
                        ELSE 0
                    END), 0) as total_overdue,
                    COALESCE(AVG(amount_total), 0) as avg_amount
                FROM account_move
                WHERE tenant_id = %s
                  AND move_type = 'out_invoice'
                  AND state = 'posted'
            """

            # Exécuter requête
            request.env.cr.execute(query, (tenant_id,))
            result = request.env.cr.dictfetchone()

            # Formater réponse
            stats = {
                'totalInvoiced': float(result['total_invoiced']) if result['total_invoiced'] else 0.0,
                'totalPaid': float(result['total_paid']) if result['total_paid'] else 0.0,
                'totalPending': float(result['total_pending']) if result['total_pending'] else 0.0,
                'totalOverdue': float(result['total_overdue']) if result['total_overdue'] else 0.0,
                'count': int(result['invoice_count']) if result['invoice_count'] else 0,
                'avgAmount': float(result['avg_amount']) if result['avg_amount'] else 0.0,
            }

            _logger.info(f"Stats factures calculées pour tenant {tenant_id}: {stats['count']} factures")

            return self._success_response(stats)

        except Exception as e:
            _logger.error(f"Erreur get_invoice_stats: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)
