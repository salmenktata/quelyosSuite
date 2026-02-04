# -*- coding: utf-8 -*-
import json
import logging
from datetime import datetime
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class ApprovalWorkflowsController(http.Controller):
    """
    Contrôleur Workflows Approbation Factures
    Système validation conditionnelle (montant, type, client)
    """

    def _authenticate_from_header(self):
        """Authentification depuis header Authorization"""
        auth_header = request.httprequest.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header[7:]
        AuthToken = request.env['quelyos.auth_token'].sudo()
        auth_record = AuthToken.search([('token', '=', token), ('expires_at', '>', datetime.now())], limit=1)

        if auth_record and auth_record.user_id:
            return auth_record.user_id
        return None

    def _get_tenant_id(self, user):
        """Récupérer tenant_id de l'utilisateur"""
        if user and user.tenant_id:
            return user.tenant_id.id
        return None

    def _success_response(self, data, message=None):
        """Format réponse succès standardisé"""
        return json.dumps({'success': True, 'data': data, 'message': message})

    def _error_response(self, error, code="ERROR", status=400):
        """Format réponse erreur standardisé"""
        response = json.dumps({'success': False, 'error': error, 'code': code})
        return request.make_response(response, status=status, headers=[('Content-Type', 'application/json')])

    @http.route('/api/finance/invoices/<int:invoice_id>/request-approval', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def request_approval(self, invoice_id, **params):
        """
        Soumettre facture pour approbation
        Crée demande approbation selon workflows configurés
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            data = request.jsonrequest

            AccountMove = request.env['account.move'].sudo()

            invoice = AccountMove.browse(invoice_id)
            if not invoice.exists() or invoice.tenant_id.id != tenant_id:
                return self._error_response("Facture introuvable", "NOT_FOUND", 404)

            if invoice.state != 'draft':
                return self._error_response("Facture déjà validée", "VALIDATION_ERROR", 400)

            # Déterminer workflow applicableapplicable = self._get_applicable_workflows(invoice, tenant_id)

            if not applicable:
                # Pas de workflow requis → valider directement
                invoice.action_post()
                return self._success_response({
                    'invoiceId': invoice.id,
                    'approvalRequired': False,
                    'validated': True,
                }, message="Aucune approbation requise, facture validée")

            # Workflow requis → créer demande approbation
            workflow = applicable[0]
            approvers = workflow.get('approvers', [])

            # Marquer invoice en attente approbation (champ custom)
            invoice.write({
                'x_approval_status': 'pending',  # pending, approved, rejected
                'x_approval_required_by': approvers[0].get('userId') if approvers else None,
                'x_approval_requested_date': datetime.now(),
                'x_approval_requested_by': user.id,
            })

            # Optionnel : Envoyer notification approver
            # TODO: Mail/SMS notification

            return self._success_response({
                'invoiceId': invoice.id,
                'approvalRequired': True,
                'workflow': {
                    'name': workflow.get('name'),
                    'approvers': approvers,
                },
            }, message=f"Demande approbation envoyée à {approvers[0].get('name') if approvers else 'responsable'}")

        except Exception as e:
            _logger.error(f"Erreur request_approval: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    def _get_applicable_workflows(self, invoice, tenant_id):
        """
        Déterminer workflows applicables à une facture
        Basé sur : montant, type, client
        """
        workflows = []

        amount_total = float(invoice.amount_total)

        # Workflow 1 : Montant > 5000€ → Validation Manager
        if amount_total >= 5000:
            # Trouver manager (user avec groupe manager)
            manager_group = request.env.ref('base.group_system', raise_if_not_found=False)
            if manager_group:
                managers = request.env['res.users'].sudo().search([
                    ('groups_id', 'in', manager_group.id),
                    ('tenant_id', '=', tenant_id),
                ], limit=1)

                if managers:
                    workflows.append({
                        'name': 'Validation Manager (> 5000€)',
                        'rule': 'amount_gte_5000',
                        'approvers': [{
                            'userId': managers[0].id,
                            'name': managers[0].name,
                            'email': managers[0].email,
                        }],
                    })

        # Workflow 2 : Client à risque élevé → Double validation
        if invoice.partner_id and invoice.partner_id.x_payment_risk_level == 'high':
            workflows.append({
                'name': 'Double Validation (Client à risque)',
                'rule': 'high_risk_customer',
                'approvers': [],  # TODO: Multiples approvers
            })

        # Workflow 3 : Factures fournisseurs > 10000€ → Validation CFO
        if invoice.move_type == 'in_invoice' and amount_total >= 10000:
            workflows.append({
                'name': 'Validation CFO (Achats > 10000€)',
                'rule': 'supplier_invoice_gte_10000',
                'approvers': [],  # TODO: CFO user
            })

        return workflows

    @http.route('/api/finance/invoices/<int:invoice_id>/approve', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def approve_invoice(self, invoice_id, **params):
        """Approuver facture (user approver)"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            data = request.jsonrequest

            comment = data.get('comment', '')

            AccountMove = request.env['account.move'].sudo()

            invoice = AccountMove.browse(invoice_id)
            if not invoice.exists() or invoice.tenant_id.id != tenant_id:
                return self._error_response("Facture introuvable", "NOT_FOUND", 404)

            if invoice.x_approval_status != 'pending':
                return self._error_response("Facture non en attente approbation", "VALIDATION_ERROR", 400)

            # Vérifier que user est bien l'approver requis
            if invoice.x_approval_required_by and invoice.x_approval_required_by.id != user.id:
                # TODO: Vérifier permissions approver
                pass

            # Approuver
            invoice.write({
                'x_approval_status': 'approved',
                'x_approved_by': user.id,
                'x_approved_date': datetime.now(),
                'x_approval_comment': comment,
            })

            # Valider facture automatiquement
            invoice.action_post()

            return self._success_response({
                'invoiceId': invoice.id,
                'invoiceName': invoice.name,
                'status': 'approved',
            }, message="Facture approuvée et validée")

        except Exception as e:
            _logger.error(f"Erreur approve_invoice: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/invoices/<int:invoice_id>/reject', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def reject_invoice(self, invoice_id, **params):
        """Rejeter facture (user approver)"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            data = request.jsonrequest

            reason = data.get('reason', '')

            if not reason:
                return self._error_response("Raison rejet requise", "VALIDATION_ERROR", 400)

            AccountMove = request.env['account.move'].sudo()

            invoice = AccountMove.browse(invoice_id)
            if not invoice.exists() or invoice.tenant_id.id != tenant_id:
                return self._error_response("Facture introuvable", "NOT_FOUND", 404)

            if invoice.x_approval_status != 'pending':
                return self._error_response("Facture non en attente approbation", "VALIDATION_ERROR", 400)

            # Rejeter
            invoice.write({
                'x_approval_status': 'rejected',
                'x_rejected_by': user.id,
                'x_rejected_date': datetime.now(),
                'x_rejection_reason': reason,
            })

            # Notifier créateur original
            # TODO: Notification mail/SMS

            return self._success_response({
                'invoiceId': invoice.id,
                'status': 'rejected',
            }, message="Facture rejetée")

        except Exception as e:
            _logger.error(f"Erreur reject_invoice: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/approvals/pending', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_pending_approvals(self, **params):
        """Liste factures en attente approbation pour user connecté"""
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            AccountMove = request.env['account.move'].sudo()

            # Factures où user est approver requis
            pending_invoices = AccountMove.search([
                ('tenant_id', '=', tenant_id),
                ('x_approval_status', '=', 'pending'),
                ('x_approval_required_by', '=', user.id),
            ], order='x_approval_requested_date desc', limit=50)

            results = []
            for invoice in pending_invoices:
                results.append({
                    'id': invoice.id,
                    'name': invoice.name,
                    'customer': {
                        'id': invoice.partner_id.id if invoice.partner_id else None,
                        'name': invoice.partner_id.name if invoice.partner_id else None,
                    },
                    'amountTotal': float(invoice.amount_total),
                    'currency': invoice.currency_id.name if invoice.currency_id else 'EUR',
                    'requestedBy': {
                        'id': invoice.x_approval_requested_by.id if invoice.x_approval_requested_by else None,
                        'name': invoice.x_approval_requested_by.name if invoice.x_approval_requested_by else None,
                    },
                    'requestedDate': str(invoice.x_approval_requested_date) if invoice.x_approval_requested_date else None,
                })

            return self._success_response({
                'approvals': results,
                'total': len(results),
            })

        except Exception as e:
            _logger.error(f"Erreur get_pending_approvals: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)
