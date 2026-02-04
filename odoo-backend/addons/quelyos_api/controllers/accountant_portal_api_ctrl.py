# -*- coding: utf-8 -*-
"""
Contrôleur API Portail Expert-Comptable

Endpoints :
- POST /api/accountant/clients : Liste clients EC (multi-tenant)
- POST /api/accountant/dashboard : Dashboard agrégé tous clients
- POST /api/accountant/client-data : Données temps réel client spécifique
- POST /api/accountant/comments : Gérer commentaires collaboratifs
- POST /api/accountant/validate-period : Valider période comptable
- POST /api/accountant/export-fec : Export FEC client
"""

import logging
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class AccountantPortalAPIController(BaseController):
    """API Portail Expert-Comptable"""

    @http.route('/api/accountant/clients', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def list_clients(self, **params):
        """
        Liste tous les clients de l'EC connecté

        Returns:
        {
          "success": true,
          "data": {
            "clients": [
              {
                "access_id": 1,
                "tenant_id": 5,
                "tenant_name": "Acme Corp",
                "company_name": "ACME SAS",
                "permission_level": "comment",
                "can_export_fec": true,
                "last_access": "2026-02-04T15:30:00",
                "invoice_count": 125
              },
              ...
            ],
            "count": 15
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            PortalAccess = request.env['quelyos.accountant_portal_access'].sudo()

            # Récupérer clients EC
            clients = PortalAccess.get_accountant_clients(user.id)

            return self._success_response({
                'clients': clients,
                'count': len(clients),
            })

        except Exception as e:
            _logger.error(f"Erreur list_clients: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/accountant/dashboard', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def get_dashboard(self, **params):
        """
        Dashboard agrégé tous clients EC

        Returns:
        {
          "success": true,
          "data": {
            "total_clients": 15,
            "total_invoices_month": 450,
            "total_revenue_month": 250000.0,
            "pending_validations": 8,
            "unresolved_comments": 12,
            "recent_activity": [...]
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            PortalAccess = request.env['quelyos.accountant_portal_access'].sudo()
            AccountMove = request.env['account.move'].sudo()
            Comment = request.env['quelyos.accountant_comment'].sudo()

            # Récupérer accès actifs
            accesses = PortalAccess.search([
                ('accountant_id', '=', user.id),
                ('state', '=', 'active'),
            ])

            tenant_ids = accesses.mapped('tenant_id').ids

            # Stats globales
            total_clients = len(tenant_ids)

            # Factures mois en cours
            from datetime import datetime
            first_day_month = datetime.now().replace(day=1)
            total_invoices_month = AccountMove.search_count([
                ('tenant_id', 'in', tenant_ids),
                ('move_type', '=', 'out_invoice'),
                ('state', '=', 'posted'),
                ('invoice_date', '>=', first_day_month),
            ])

            # CA mois en cours
            invoices_month = AccountMove.search([
                ('tenant_id', 'in', tenant_ids),
                ('move_type', '=', 'out_invoice'),
                ('state', '=', 'posted'),
                ('invoice_date', '>=', first_day_month),
            ])
            total_revenue_month = sum(inv.amount_total for inv in invoices_month)

            # Validations en attente
            Validation = request.env['quelyos.accountant_portal_validation'].sudo()
            pending_validations = Validation.search_count([
                ('tenant_id', 'in', tenant_ids),
                ('is_validated', '=', False),
            ])

            # Commentaires non résolus
            unresolved_comments = Comment.search_count([
                ('tenant_id', 'in', tenant_ids),
                ('state', 'in', ['open', 'in_progress']),
            ])

            return self._success_response({
                'total_clients': total_clients,
                'total_invoices_month': total_invoices_month,
                'total_revenue_month': total_revenue_month,
                'pending_validations': pending_validations,
                'unresolved_comments': unresolved_comments,
            })

        except Exception as e:
            _logger.error(f"Erreur get_dashboard: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/accountant/client-data', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def get_client_data(self, **params):
        """
        Données temps réel pour un client spécifique

        Body:
        {
          "tenant_id": 5,
          "period_year": 2026,
          "period_month": 2
        }

        Returns:
        {
          "success": true,
          "data": {
            "invoices": [...],
            "payments": [...],
            "bank_transactions": [...],
            "validation_status": {...},
            "comments": [...]
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            # Paramètres
            data = request.jsonrequest
            tenant_id = data.get('tenant_id')
            period_year = data.get('period_year')
            period_month = data.get('period_month')

            if not tenant_id:
                return self._error_response("tenant_id requis", "VALIDATION_ERROR", 400)

            # Vérifier accès EC
            PortalAccess = request.env['quelyos.accountant_portal_access'].sudo()
            PortalAccess.check_access(user.id, tenant_id, required_permission='readonly')

            # Récupérer données période
            AccountMove = request.env['account.move'].sudo()
            Comment = request.env['quelyos.accountant_comment'].sudo()

            # Factures période
            domain = [
                ('tenant_id', '=', tenant_id),
                ('move_type', '=', 'out_invoice'),
                ('state', '=', 'posted'),
            ]
            if period_year and period_month:
                from datetime import datetime
                first_day = datetime(period_year, period_month, 1)
                if period_month == 12:
                    last_day = datetime(period_year + 1, 1, 1)
                else:
                    last_day = datetime(period_year, period_month + 1, 1)
                domain.extend([
                    ('invoice_date', '>=', first_day),
                    ('invoice_date', '<', last_day),
                ])

            invoices = AccountMove.search(domain, limit=100)

            invoices_data = [{
                'id': inv.id,
                'name': inv.name,
                'partner_name': inv.partner_id.name,
                'invoice_date': inv.invoice_date.isoformat() if inv.invoice_date else None,
                'amount_total': float(inv.amount_total),
                'payment_state': inv.payment_state,
                'has_comments': Comment.search_count([
                    ('document_model', '=', 'account.move'),
                    ('document_id', '=', inv.id),
                    ('state', 'in', ['open', 'in_progress']),
                ]) > 0,
            } for inv in invoices]

            # Validation période
            Validation = request.env['quelyos.accountant_portal_validation'].sudo()
            validation = Validation.search([
                ('tenant_id', '=', tenant_id),
                ('period_year', '=', period_year),
                ('period_month', '=', period_month),
            ], limit=1)

            validation_data = {
                'is_validated': validation.is_validated if validation else False,
                'validation_date': validation.validation_date.isoformat() if validation and validation.validation_date else None,
                'checks': {
                    'invoices_complete': validation.check_invoices_complete if validation else False,
                    'payments_reconciled': validation.check_payments_reconciled if validation else False,
                    'bank_reconciled': validation.check_bank_reconciled if validation else False,
                    'vat_correct': validation.check_vat_correct if validation else False,
                    'expenses_categorized': validation.check_expenses_categorized if validation else False,
                },
                'anomaly_count': validation.anomaly_count if validation else 0,
            } if validation else None

            return self._success_response({
                'invoices': invoices_data,
                'invoice_count': len(invoices_data),
                'validation_status': validation_data,
            })

        except Exception as e:
            _logger.error(f"Erreur get_client_data: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/accountant/comments/create', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def create_comment(self, **params):
        """
        Créer commentaire collaboratif

        Body:
        {
          "tenant_id": 5,
          "document_model": "account.move",
          "document_id": 123,
          "subject": "TVA incorrecte",
          "comment": "<p>@Client La TVA devrait être 10% et non 20%</p>",
          "priority": "warning",
          "category": "anomaly"
        }

        Returns:
        {
          "success": true,
          "data": {
            "comment_id": 42,
            "message": "Commentaire créé et notifications envoyées"
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            # Paramètres
            data = request.jsonrequest
            tenant_id = data.get('tenant_id')
            document_model = data.get('document_model')
            document_id = data.get('document_id')

            if not all([tenant_id, document_model, document_id]):
                return self._error_response("Paramètres manquants", "VALIDATION_ERROR", 400)

            # Vérifier accès EC
            PortalAccess = request.env['quelyos.accountant_portal_access'].sudo()
            PortalAccess.check_access(user.id, tenant_id, required_permission='comment')

            # Créer commentaire
            Comment = request.env['quelyos.accountant_comment'].sudo()
            comment = Comment.create({
                'tenant_id': tenant_id,
                'document_model': document_model,
                'document_id': document_id,
                'subject': data.get('subject', ''),
                'comment': data.get('comment', ''),
                'priority': data.get('priority', 'info'),
                'category': data.get('category', 'question'),
            })

            return self._success_response({
                'comment_id': comment.id,
                'message': 'Commentaire créé et notifications envoyées',
            })

        except Exception as e:
            _logger.error(f"Erreur create_comment: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/accountant/export-fec', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def export_fec(self, **params):
        """
        Exporter FEC client (Fichier Écritures Comptables)

        Body:
        {
          "tenant_id": 5,
          "year": 2026
        }

        Returns:
        {
          "success": true,
          "data": {
            "download_url": "https://...",
            "filename": "12345678_FEC_20260101_20261231.txt",
            "size_bytes": 1024000
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            # Paramètres
            data = request.jsonrequest
            tenant_id = data.get('tenant_id')
            year = data.get('year')

            if not tenant_id or not year:
                return self._error_response("tenant_id et year requis", "VALIDATION_ERROR", 400)

            # Vérifier accès EC + permission export
            PortalAccess = request.env['quelyos.accountant_portal_access'].sudo()
            access = PortalAccess.search([
                ('accountant_id', '=', user.id),
                ('tenant_id', '=', tenant_id),
                ('state', '=', 'active'),
            ], limit=1)

            if not access or not access.can_export_fec:
                return self._error_response("Permission refusée : export FEC non autorisé", "FORBIDDEN", 403)

            # Logger export
            access.log_export_fec()

            # TODO: Implémenter génération FEC réelle (module account_financial_report OCA existe)
            _logger.info(f"Export FEC demandé : tenant {tenant_id}, année {year}, par EC {user.name}")

            return self._success_response({
                'message': 'Export FEC en cours de génération (TODO: implémenter)',
                'download_url': None,
                'filename': f"FEC_{year}.txt",
            })

        except Exception as e:
            _logger.error(f"Erreur export_fec: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)
