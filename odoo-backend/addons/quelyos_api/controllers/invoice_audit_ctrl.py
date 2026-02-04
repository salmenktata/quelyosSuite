# -*- coding: utf-8 -*-
"""
Contrôleur API Audit Trail Factures

Endpoints :
- POST /api/finance/invoices/audit-trail : Historique modifications facture
- POST /api/finance/invoices/audit-export : Export PDF piste d'audit
"""

import logging
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class InvoiceAuditController(BaseController):
    """API Audit Trail factures"""

    @http.route('/api/finance/invoices/audit-trail', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def get_audit_trail(self, **params):
        """
        Récupère l'historique complet des modifications d'une facture

        Body:
        {
          "invoice_id": 123
        }

        Returns:
        {
          "success": true,
          "data": {
            "audit_entries": [
              {
                "id": 1,
                "date": "2026-02-04T10:30:00",
                "user_name": "John Doe",
                "user_email": "john@example.com",
                "changes": [
                  {
                    "field_name": "amount_total",
                    "field_label": "Montant Total",
                    "old_value": "1000.00",
                    "new_value": "1200.00",
                    "diff_percent": 20.0
                  }
                ],
                "reason": "Correction erreur saisie TVA"
              }
            ],
            "invoice_name": "INV/2026/0001",
            "current_state": "posted",
            "modification_count": 5
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            # Paramètres
            data = request.jsonrequest
            invoice_id = data.get('invoice_id')

            if not invoice_id:
                return self._error_response("invoice_id requis", "VALIDATION_ERROR", 400)

            # Récupérer facture
            AccountMove = request.env['account.move'].sudo()
            invoice = AccountMove.browse(invoice_id)

            if not invoice.exists():
                return self._error_response("Facture introuvable", "NOT_FOUND", 404)

            # Vérifier accès tenant
            if invoice.tenant_id and invoice.tenant_id.id != user.tenant_id.id:
                return self._error_response("Accès refusé", "FORBIDDEN", 403)

            # Récupérer historique via mail.tracking.value
            # Odoo stocke automatiquement les modifications si le modèle hérite de mail.thread
            audit_entries = self._get_tracking_history(invoice)

            return self._success_response({
                'audit_entries': audit_entries,
                'invoice_name': invoice.name or f"#{invoice.id}",
                'current_state': invoice.state,
                'modification_count': len(audit_entries),
            })

        except Exception as e:
            _logger.error(f"Erreur get_audit_trail: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    def _get_tracking_history(self, record):
        """
        Récupère l'historique des modifications depuis mail.tracking.value

        Args:
            record: Recordset Odoo (account.move)

        Returns:
            list: Entrées audit trail avec détails changements
        """
        # Récupérer messages avec tracking
        messages = request.env['mail.message'].sudo().search([
            ('model', '=', record._name),
            ('res_id', '=', record.id),
            ('tracking_value_ids', '!=', False),
        ], order='date desc')

        audit_entries = []

        for message in messages:
            changes = []

            for tracking in message.tracking_value_ids:
                # Labels lisibles pour champs courants factures
                field_labels = {
                    'amount_total': 'Montant Total',
                    'amount_untaxed': 'Montant HT',
                    'amount_tax': 'Montant TVA',
                    'partner_id': 'Client',
                    'invoice_date': 'Date Facture',
                    'invoice_date_due': 'Date Échéance',
                    'payment_state': 'État Paiement',
                    'state': 'État',
                    'payment_reference': 'Référence Paiement',
                    'ref': 'Référence',
                    'invoice_payment_term_id': 'Conditions Paiement',
                }

                field_label = field_labels.get(
                    tracking.field_id.name,
                    tracking.field_id.field_description
                )

                # Formater valeurs selon type champ
                old_value = tracking.old_value_char or tracking.old_value_integer or \
                           tracking.old_value_float or tracking.old_value_monetary or \
                           tracking.old_value_datetime or tracking.old_value_text or ''

                new_value = tracking.new_value_char or tracking.new_value_integer or \
                           tracking.new_value_float or tracking.new_value_monetary or \
                           tracking.new_value_datetime or tracking.new_value_text or ''

                # Calculer diff % si montants
                diff_percent = None
                if tracking.field_id.ttype in ['float', 'monetary'] and old_value and new_value:
                    try:
                        old_val = float(old_value)
                        new_val = float(new_value)
                        if old_val != 0:
                            diff_percent = round(((new_val - old_val) / old_val) * 100, 2)
                    except (ValueError, TypeError):
                        pass

                changes.append({
                    'field_name': tracking.field_id.name,
                    'field_label': field_label,
                    'old_value': str(old_value),
                    'new_value': str(new_value),
                    'diff_percent': diff_percent,
                })

            # Extraire raison modification si présente dans body
            reason = None
            if message.body:
                # Parser HTML pour extraire raison (si ajoutée manuellement)
                import re
                match = re.search(r'Raison\s*:\s*([^<]+)', message.body)
                if match:
                    reason = match.group(1).strip()

            audit_entries.append({
                'id': message.id,
                'date': message.date.isoformat() if message.date else None,
                'user_name': message.author_id.name if message.author_id else 'Système',
                'user_email': message.author_id.email if message.author_id else None,
                'changes': changes,
                'reason': reason,
            })

        return audit_entries

    @http.route('/api/finance/invoices/audit-export', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def export_audit_trail(self, **params):
        """
        Exporte la piste d'audit au format PDF

        Body:
        {
          "invoice_id": 123
        }

        Returns:
        {
          "success": true,
          "data": {
            "pdf_url": "https://...",
            "filename": "audit_trail_INV_2026_0001.pdf"
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            # Paramètres
            data = request.jsonrequest
            invoice_id = data.get('invoice_id')

            if not invoice_id:
                return self._error_response("invoice_id requis", "VALIDATION_ERROR", 400)

            # Récupérer facture
            AccountMove = request.env['account.move'].sudo()
            invoice = AccountMove.browse(invoice_id)

            if not invoice.exists():
                return self._error_response("Facture introuvable", "NOT_FOUND", 404)

            # Vérifier accès tenant
            if invoice.tenant_id and invoice.tenant_id.id != user.tenant_id.id:
                return self._error_response("Accès refusé", "FORBIDDEN", 403)

            # TODO: Générer PDF avec audit trail
            # Utiliser reportlab ou wkhtmltopdf pour générer PDF
            # Inclure : timeline modifications, avant/après, signatures, etc.

            _logger.info(
                f"Export audit trail demandé : facture {invoice.name}, "
                f"par utilisateur {user.name}"
            )

            return self._success_response({
                'message': 'Export PDF audit trail en cours de génération (TODO: implémenter)',
                'pdf_url': None,
                'filename': f"audit_trail_{invoice.name.replace('/', '_')}.pdf" if invoice.name else 'audit_trail.pdf',
            })

        except Exception as e:
            _logger.error(f"Erreur export_audit_trail: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/invoices/add-audit-note', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def add_audit_note(self, **params):
        """
        Ajouter une note d'audit / raison de modification

        Body:
        {
          "invoice_id": 123,
          "note": "Correction erreur saisie TVA suite audit EC"
        }

        Returns:
        {
          "success": true,
          "data": {
            "message": "Note ajoutée à l'historique"
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            # Paramètres
            data = request.jsonrequest
            invoice_id = data.get('invoice_id')
            note = data.get('note')

            if not invoice_id or not note:
                return self._error_response("invoice_id et note requis", "VALIDATION_ERROR", 400)

            # Récupérer facture
            AccountMove = request.env['account.move'].sudo()
            invoice = AccountMove.browse(invoice_id)

            if not invoice.exists():
                return self._error_response("Facture introuvable", "NOT_FOUND", 404)

            # Vérifier accès tenant
            if invoice.tenant_id and invoice.tenant_id.id != user.tenant_id.id:
                return self._error_response("Accès refusé", "FORBIDDEN", 403)

            # Ajouter note via message_post (apparaît dans chatter)
            invoice.message_post(
                body=f"<p><b>📝 Note Audit</b></p><p>{note}</p>",
                subject="Note d'Audit",
                message_type='comment',
                subtype_xmlid='mail.mt_note',
            )

            _logger.info(
                f"Note audit ajoutée : facture {invoice.name}, "
                f"par utilisateur {user.name}"
            )

            return self._success_response({
                'message': 'Note ajoutée à l\'historique',
            })

        except Exception as e:
            _logger.error(f"Erreur add_audit_note: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)
