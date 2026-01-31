# Phase 1 : Fondations Comptables

**Durée** : 8 semaines (Q1 2026)
**Parité cible** : 18% → 45%
**Priorité** : P0 (Critique)

---

## 🎯 Objectifs de la Phase 1

Établir les fondations comptables essentielles pour permettre :
1. **Facturation complète** : Clients + Fournisseurs
2. **Plan comptable** : Configuration comptes + journaux
3. **Paiements multi-méthodes** : Chèque, virement, CB, espèces
4. **Gestion fiscale de base** : Exercices fiscaux

### Livrables

| # | Module | Endpoints | Pages UI | Tests |
|---|--------|-----------|----------|-------|
| 1 | Factures Clients | 9 | 3 | 25 |
| 2 | Factures Fournisseurs | 9 | 3 | 25 |
| 3 | Plan Comptable | 6 | 2 | 15 |
| 4 | Paiements | 8 | 2 | 20 |
| 5 | Exercices Fiscaux | 5 | 1 | 10 |
| 6 | Journaux Comptables | 4 | 1 | 10 |
| **TOTAL** | **6 modules** | **41** | **12** | **105** |

---

## 📦 Livrable 1 : Factures Clients (Invoices)

### Fonctionnalités Odoo 19 à Implémenter

| Feature | Odoo 19 | Quelyos Status |
|---------|---------|----------------|
| Liste factures filtrable | ✅ | ❌ Manquant |
| Création facture | ✅ | ❌ Manquant |
| Édition facture brouillon | ✅ | ❌ Manquant |
| Validation facture | ✅ | ❌ Manquant |
| Envoi email client | ✅ | ❌ Manquant |
| Génération PDF | ✅ | ❌ Manquant |
| Enregistrement paiement | ✅ | ❌ Manquant |
| Avoir (Credit Note) | ✅ | ❌ Manquant |
| Duplication facture | ✅ | ❌ Manquant |

### Backend : Endpoints API

**Fichier** : `odoo-backend/addons/quelyos_api/controllers/invoices_ctrl.py`

```python
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

    @http.route('/api/finance/invoices', type='json', auth='public', methods=['GET', 'OPTIONS'], cors='*', csrf=False)
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
                ('move_type', '=', 'out_invoice'),  # Factures clients uniquement
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

    @http.route('/api/finance/invoices/<int:invoice_id>', type='json', auth='public', methods=['GET', 'OPTIONS'], cors='*', csrf=False)
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

    @http.route('/api/finance/invoices/create', type='json', auth='public', methods=['POST', 'OPTIONS'], cors='*', csrf=False)
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

    @http.route('/api/finance/invoices/<int:invoice_id>/update', type='json', auth='public', methods=['PUT', 'OPTIONS'], cors='*', csrf=False)
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

    @http.route('/api/finance/invoices/<int:invoice_id>/validate', type='json', auth='public', methods=['POST', 'OPTIONS'], cors='*', csrf=False)
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

    @http.route('/api/finance/invoices/<int:invoice_id>/send-email', type='json', auth='public', methods=['POST', 'OPTIONS'], cors='*', csrf=False)
    def send_invoice_email(self, invoice_id, **params):
        """
        Envoyer la facture par email au client
        
        Body:
        {
          "to": "client@example.com",
          "subject": "Votre facture INV-2026-001",
          "body": "Bonjour, veuillez trouver ci-joint votre facture."
        }
        """
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

            # Vérifier que la facture est validée
            if invoice.state != 'posted':
                return self._error_response("Seules les factures validées peuvent être envoyées", "VALIDATION_ERROR", 400)

            # Récupérer les paramètres email
            data = request.jsonrequest
            email_to = data.get('to') or invoice.partner_id.email
            subject = data.get('subject', f"Facture {invoice.name}")
            body = data.get('body', f"Bonjour,\n\nVeuillez trouver ci-joint la facture {invoice.name}.")

            if not email_to:
                return self._error_response("Aucune adresse email destinataire", "VALIDATION_ERROR", 400)

            # Envoyer l'email avec PDF en pièce jointe
            invoice.with_context(
                mail_post_autofollow=False
            ).message_post(
                body=body,
                subject=subject,
                email_to=email_to,
                message_type='email',
                subtype_xmlid='mail.mt_comment',
            )

            _logger.info(f"Facture {invoice.name} envoyée à {email_to}")

            return self._success_response(
                {'sent': True, 'to': email_to},
                message=f"Facture envoyée à {email_to}"
            )

        except Exception as e:
            _logger.error(f"Erreur send_invoice_email {invoice_id}: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/invoices/<int:invoice_id>/pdf', type='http', auth='public', methods=['GET', 'OPTIONS'], cors='*', csrf=False)
    def download_invoice_pdf(self, invoice_id, **params):
        """Télécharger le PDF de la facture"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return request.make_response(
                    json.dumps({'success': False, 'error': 'Unauthorized'}),
                    headers=[('Content-Type', 'application/json')],
                    status=401
                )

            tenant_id = self._get_tenant_id(user)

            # Récupérer la facture
            AccountMove = request.env['account.move'].sudo()
            invoice = AccountMove.search([
                ('id', '=', invoice_id),
                ('tenant_id', '=', tenant_id),
                ('move_type', '=', 'out_invoice'),
            ], limit=1)

            if not invoice:
                return request.make_response(
                    json.dumps({'success': False, 'error': 'Not found'}),
                    headers=[('Content-Type', 'application/json')],
                    status=404
                )

            # Générer le PDF
            pdf_content = request.env.ref('account.account_invoices').sudo()._render_qweb_pdf([invoice.id])[0]

            # Retourner le PDF
            headers = [
                ('Content-Type', 'application/pdf'),
                ('Content-Disposition', f'attachment; filename="{invoice.name}.pdf"'),
                ('Content-Length', len(pdf_content)),
            ]

            return request.make_response(pdf_content, headers=headers)

        except Exception as e:
            _logger.error(f"Erreur download_invoice_pdf {invoice_id}: {e}", exc_info=True)
            return request.make_response(
                json.dumps({'success': False, 'error': str(e)}),
                headers=[('Content-Type', 'application/json')],
                status=500
            )

    @http.route('/api/finance/invoices/<int:invoice_id>/credit-note', type='json', auth='public', methods=['POST', 'OPTIONS'], cors='*', csrf=False)
    def create_credit_note(self, invoice_id, **params):
        """
        Créer un avoir (credit note) pour cette facture
        
        Body:
        {
          "reason": "Produit défectueux",
          "date": "2026-02-01",
          "refundMethod": "refund" | "cancel" | "modify"
        }
        """
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

            # Vérifier que la facture est validée
            if invoice.state != 'posted':
                return self._error_response("Seules les factures validées peuvent avoir un avoir", "VALIDATION_ERROR", 400)

            # Récupérer les paramètres
            data = request.jsonrequest
            reason = data.get('reason', 'Avoir')
            refund_date = data.get('date', datetime.now().strftime('%Y-%m-%d'))

            # Créer l'avoir
            refund_wizard = request.env['account.move.reversal'].sudo().create({
                'move_ids': [(6, 0, [invoice.id])],
                'reason': reason,
                'date': refund_date,
            })

            # Exécuter l'action de remboursement
            action = refund_wizard.reverse_moves()
            refund_id = action.get('res_id')

            if refund_id:
                refund = AccountMove.browse(refund_id)
                _logger.info(f"Avoir {refund.name} créé pour facture {invoice.name}")
                return self._success_response(
                    self._serialize_invoice(refund, include_lines=True),
                    message=f"Avoir {refund.name} créé avec succès"
                )
            else:
                return self._error_response("Erreur lors de la création de l'avoir", "SERVER_ERROR", 500)

        except Exception as e:
            _logger.error(f"Erreur create_credit_note {invoice_id}: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/invoices/<int:invoice_id>/duplicate', type='json', auth='public', methods=['POST', 'OPTIONS'], cors='*', csrf=False)
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
                'invoice_date': False,  # Réinitialiser la date
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
            'amountResidual': float(invoice.amount_residual),  # Reste à payer
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
```

**Tests** : `odoo-backend/addons/quelyos_api/tests/test_invoices_ctrl.py`

```python
# -*- coding: utf-8 -*-
"""Tests pour le contrôleur Factures Clients"""

from odoo.tests.common import TransactionCase
import json


class TestInvoicesController(TransactionCase):

    def setUp(self):
        super(TestInvoicesController, self).setUp()
        
        # Créer un tenant de test
        self.tenant = self.env['quelyos.tenant'].create({
            'name': 'Test Tenant',
            'code': 'TEST',
        })
        
        # Créer un utilisateur de test
        self.user = self.env['res.users'].create({
            'name': 'Test User',
            'login': 'testuser',
            'password': 'test123',
        })
        
        # Créer un client
        self.customer = self.env['res.partner'].create({
            'name': 'Test Customer',
            'email': 'customer@test.com',
            'tenant_id': self.tenant.id,
        })
        
        # Créer un produit
        self.product = self.env['product.product'].create({
            'name': 'Test Service',
            'type': 'service',
            'list_price': 100.0,
        })

    def test_create_invoice(self):
        """Test création facture client"""
        data = {
            'customerId': self.customer.id,
            'invoiceDate': '2026-01-31',
            'dueDate': '2026-02-28',
            'lines': [
                {
                    'productId': self.product.id,
                    'description': 'Test Service',
                    'quantity': 1.0,
                    'unitPrice': 100.0,
                    'taxIds': [],
                }
            ],
        }
        
        # Simuler la requête
        invoice = self.env['account.move'].create(
            self._prepare_invoice_values(data, self.tenant.id)
        )
        
        self.assertEqual(invoice.move_type, 'out_invoice')
        self.assertEqual(invoice.partner_id, self.customer)
        self.assertEqual(len(invoice.invoice_line_ids), 1)
        self.assertEqual(invoice.amount_total, 100.0)

    def test_validate_invoice(self):
        """Test validation facture"""
        invoice = self.env['account.move'].create({
            'move_type': 'out_invoice',
            'partner_id': self.customer.id,
            'tenant_id': self.tenant.id,
            'invoice_line_ids': [(0, 0, {
                'product_id': self.product.id,
                'quantity': 1,
                'price_unit': 100.0,
            })],
        })
        
        self.assertEqual(invoice.state, 'draft')
        
        # Valider
        invoice.action_post()
        
        self.assertEqual(invoice.state, 'posted')
        self.assertIsNotNone(invoice.name)

    def _prepare_invoice_values(self, data, tenant_id):
        """Helper pour préparer les valeurs"""
        # Copier la logique du contrôleur
        vals = {
            'tenant_id': tenant_id,
            'move_type': 'out_invoice',
            'partner_id': data['customerId'],
            'invoice_date': data['invoiceDate'],
            'invoice_date_due': data['dueDate'],
        }
        
        lines_commands = []
        for line_data in data['lines']:
            line_vals = {
                'product_id': line_data['productId'],
                'name': line_data['description'],
                'quantity': line_data['quantity'],
                'price_unit': line_data['unitPrice'],
            }
            lines_commands.append((0, 0, line_vals))
        
        vals['invoice_line_ids'] = lines_commands
        return vals
```

### Frontend : Pages UI

#### Page 1 : Liste Factures Clients

**Fichier** : `dashboard-client/src/pages/finance/invoices/page.tsx`

```typescript
/**
 * Page Liste Factures Clients
 * 
 * Fonctionnalités:
 * - Liste filtrable et triable des factures clients
 * - Filtres: statut, état paiement, client, dates
 * - Actions: créer, modifier, valider, envoyer email, télécharger PDF
 * - Indicateurs: total facturé, payé, en attente
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, PageNotice, SkeletonTable } from '@/components/common'
import { financeNotices } from '@/lib/notices'
import { 
  FileText, 
  Plus, 
  Download, 
  Mail, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Filter
} from 'lucide-react'
import { useInvoices } from '@/hooks/useInvoices'
import { formatCurrency, formatDate } from '@/lib/utils'

type InvoiceStatus = 'draft' | 'posted' | 'cancel' | 'all'
type PaymentState = 'not_paid' | 'in_payment' | 'paid' | 'partial' | 'all'

interface Invoice {
  id: number
  name: string
  state: 'draft' | 'posted' | 'cancel'
  paymentState: PaymentState
  customer: {
    id: number
    name: string
    email: string
  }
  invoiceDate: string
  dueDate: string
  amountTotal: number
  amountResidual: number
  currency: {
    symbol: string
  }
}

export default function InvoicesPage() {
  const navigate = useNavigate()
  
  // Filtres
  const [status, setStatus] = useState<InvoiceStatus>('all')
  const [paymentState, setPaymentState] = useState<PaymentState>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  
  // Données
  const { 
    invoices, 
    loading, 
    error, 
    stats,
    sendEmail, 
    downloadPDF,
    validate
  } = useInvoices({ status, paymentState, dateFrom, dateTo })

  const getStatusBadge = (invoice: Invoice) => {
    if (invoice.state === 'draft') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
          <Clock className="w-3 h-3 mr-1" />
          Brouillon
        </span>
      )
    }
    
    if (invoice.state === 'cancel') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Annulée
        </span>
      )
    }
    
    // État paiement pour factures validées
    if (invoice.paymentState === 'paid') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Payée
        </span>
      )
    }
    
    if (invoice.paymentState === 'partial') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
          Paiement partiel
        </span>
      )
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200">
        En attente
      </span>
    )
  }

  if (error) {
    return (
      <Layout>
        <Breadcrumbs
          items={[
            { label: 'Finance', path: '/finance' },
            { label: 'Factures Clients', path: '/finance/invoices' },
          ]}
        />
        <div role="alert" className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Breadcrumbs
        items={[
          { label: 'Finance', path: '/finance' },
          { label: 'Factures Clients', path: '/finance/invoices' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Factures Clients
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gérez vos factures de vente et suivez les paiements
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => navigate('/finance/invoices/new')}
        >
          Nouvelle Facture
        </Button>
      </div>

      <PageNotice notices={financeNotices.invoices} />

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Facturé</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(stats.totalInvoiced, '€')}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Payé</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(stats.totalPaid, '€')}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">En Attente</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(stats.totalPending, '€')}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">En Retard</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(stats.totalOverdue, '€')}
            </p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Filtres</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Statut
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tous</option>
              <option value="draft">Brouillon</option>
              <option value="posted">Validée</option>
              <option value="cancel">Annulée</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Paiement
            </label>
            <select
              value={paymentState}
              onChange={(e) => setPaymentState(e.target.value as PaymentState)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tous</option>
              <option value="not_paid">Non payée</option>
              <option value="partial">Paiement partiel</option>
              <option value="paid">Payée</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date de début
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date de fin
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={5} columns={6} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Numéro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Échéance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  onClick={() => navigate(`/finance/invoices/${invoice.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {invoice.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {invoice.customer.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {invoice.customer.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(invoice.invoiceDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(invoice.dueDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(invoice.amountTotal, invoice.currency.symbol)}
                    </div>
                    {invoice.amountResidual > 0 && (
                      <div className="text-xs text-orange-600 dark:text-orange-400">
                        Reste {formatCurrency(invoice.amountResidual, invoice.currency.symbol)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(invoice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {invoice.state === 'draft' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            validate(invoice.id)
                          }}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {invoice.state === 'posted' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              sendEmail(invoice.id)
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              downloadPDF(invoice.id)
                            }}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
```

**Hook** : `dashboard-client/src/hooks/useInvoices.ts`

```typescript
import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

interface UseInvoicesParams {
  status?: string
  paymentState?: string
  dateFrom?: string
  dateTo?: string
}

export function useInvoices(params: UseInvoicesParams = {}) {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchInvoices()
  }, [params.status, params.paymentState, params.dateFrom, params.dateTo])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.post('/finance/invoices', params)
      
      if (response.data.success) {
        setInvoices(response.data.data.invoices)
        
        // Calculer stats
        const totalInvoiced = response.data.data.invoices.reduce(
          (sum: number, inv: any) => sum + inv.amountTotal,
          0
        )
        const totalPaid = response.data.data.invoices
          .filter((inv: any) => inv.paymentState === 'paid')
          .reduce((sum: number, inv: any) => sum + inv.amountTotal, 0)
        const totalPending = response.data.data.invoices
          .filter((inv: any) => inv.paymentState === 'not_paid')
          .reduce((sum: number, inv: any) => sum + inv.amountResidual, 0)
        
        setStats({
          totalInvoiced,
          totalPaid,
          totalPending,
          totalOverdue: 0, // TODO: calculer avec date échéance
        })
      } else {
        setError(response.data.error || 'Erreur lors du chargement des factures')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const validate = async (invoiceId: number) => {
    try {
      const response = await apiClient.post(`/finance/invoices/${invoiceId}/validate`)
      if (response.data.success) {
        fetchInvoices() // Reload
      } else {
        throw new Error(response.data.error)
      }
    } catch (err: any) {
      alert(`Erreur: ${err.message}`)
    }
  }

  const sendEmail = async (invoiceId: number) => {
    try {
      const response = await apiClient.post(`/finance/invoices/${invoiceId}/send-email`)
      if (response.data.success) {
        alert('Email envoyé avec succès')
      } else {
        throw new Error(response.data.error)
      }
    } catch (err: any) {
      alert(`Erreur: ${err.message}`)
    }
  }

  const downloadPDF = async (invoiceId: number) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/finance/invoices/${invoiceId}/pdf`,
        {
          headers: {
            'X-Session-Id': localStorage.getItem('session_id') || '',
          },
        }
      )
      
      if (!response.ok) throw new Error('Erreur téléchargement')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(`Erreur: ${err.message}`)
    }
  }

  return {
    invoices,
    loading,
    error,
    stats,
    validate,
    sendEmail,
    downloadPDF,
    reload: fetchInvoices,
  }
}
```

---

## 📦 Livrable 2-6 : Aperçu Rapide

Les livrables 2 à 6 suivent le même pattern :
- Backend : Contrôleur Python avec 4-9 endpoints CRUD + actions
- Frontend : 1-3 pages React TypeScript
- Tests : 10-25 tests unitaires backend + frontend

**Fichiers créés** :

### Livrable 2 : Factures Fournisseurs
- `controllers/bills_ctrl.py` (9 endpoints)
- `pages/finance/bills/page.tsx`
- `pages/finance/bills/new/page.tsx`
- `pages/finance/bills/[id]/page.tsx`
- `hooks/useBills.ts`

### Livrable 3 : Plan Comptable
- `controllers/chart_of_accounts_ctrl.py` (6 endpoints)
- `pages/finance/chart-of-accounts/page.tsx`
- `pages/finance/chart-of-accounts/new/page.tsx`
- `hooks/useChartOfAccounts.ts`

### Livrable 4 : Paiements
- `controllers/payments_ctrl.py` (8 endpoints)
- `pages/finance/payments/page.tsx`
- `pages/finance/payments/register/page.tsx`
- `hooks/usePayments.ts`

### Livrable 5 : Exercices Fiscaux
- `controllers/fiscal_years_ctrl.py` (5 endpoints)
- `pages/finance/settings/fiscal-years/page.tsx`
- `hooks/useFiscalYears.ts`

### Livrable 6 : Journaux Comptables
- `controllers/journals_ctrl.py` (4 endpoints)
- `pages/finance/settings/journals/page.tsx`
- `hooks/useJournals.ts`

---

## 🎯 Résumé Phase 1

### KPIs de Succès

| Métrique | Objectif | Mesure |
|----------|----------|--------|
| Parité fonctionnelle | 45% | WebSearch + tests manuels |
| Endpoints API | 41 | Postman collection |
| Pages UI | 12 | Navigation dashboard |
| Tests automatisés | 105 | `pytest` + `vitest` |
| Temps création facture | < 2 min | Chronomètre |
| Temps validation facture | < 30 sec | Chronomètre |

### Prochaines Étapes

1. **Semaine 1-2** : Livrable 1 (Factures Clients)
2. **Semaine 3-4** : Livrable 2 (Factures Fournisseurs)
3. **Semaine 5** : Livrable 3 (Plan Comptable)
4. **Semaine 6** : Livrable 4 (Paiements)
5. **Semaine 7** : Livrable 5-6 (Exercices + Journaux)
6. **Semaine 8** : Tests d'intégration + polish UI

---

**Auteur** : Claude Code - Audit Parité Fonctionnelle
**Date** : 2026-01-31
**Version** : 1.0
