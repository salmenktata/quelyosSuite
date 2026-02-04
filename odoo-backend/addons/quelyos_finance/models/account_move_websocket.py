# -*- coding: utf-8 -*-
"""
Extension account.move pour émission events WebSocket

Émet des notifications temps réel lors des actions sur factures :
- Création facture
- Validation facture
- Paiement reçu
"""

import logging
from odoo import models, api

_logger = logging.getLogger(__name__)


class AccountMoveWebSocket(models.Model):
    _inherit = 'account.move'

    @api.model
    def create(self, vals):
        """Override create pour notifier création facture"""
        # Appeler super() OBLIGATOIRE
        invoice = super(AccountMoveWebSocket, self).create(vals)

        # Notifier si facture client
        if invoice.move_type == 'out_invoice' and invoice.tenant_id:
            try:
                from odoo.addons.quelyos_api.controllers import websocket_ctrl
                websocket_ctrl.notify_invoice_created(invoice)
            except Exception as e:
                _logger.error(f"[WS] Erreur notification invoice.created: {e}", exc_info=True)

        return invoice

    def action_post(self):
        """Override action_post pour notifier validation"""
        # Sauvegarder état avant validation
        was_draft = {inv.id: inv.state == 'draft' for inv in self}

        # Appeler super() OBLIGATOIRE
        result = super(AccountMoveWebSocket, self).action_post()

        # Notifier si passage draft → posted
        for invoice in self:
            if invoice.move_type == 'out_invoice' and invoice.tenant_id:
                if was_draft.get(invoice.id) and invoice.state == 'posted':
                    try:
                        from odoo.addons.quelyos_api.controllers import websocket_ctrl
                        websocket_ctrl.notify_invoice_validated(invoice)
                    except Exception as e:
                        _logger.error(f"[WS] Erreur notification invoice.validated: {e}", exc_info=True)

        return result

    def write(self, vals):
        """Override write pour détecter paiement"""
        # Sauvegarder état paiement avant modification
        payment_state_before = {inv.id: inv.payment_state for inv in self}

        # Appeler super() OBLIGATOIRE
        result = super(AccountMoveWebSocket, self).write(vals)

        # Notifier si passage non payé → payé
        if 'payment_state' in vals or 'amount_residual' in vals:
            for invoice in self:
                if invoice.move_type == 'out_invoice' and invoice.tenant_id:
                    old_state = payment_state_before.get(invoice.id)
                    new_state = invoice.payment_state

                    # Détecter paiement complet
                    if old_state in ['not_paid', 'partial'] and new_state == 'paid':
                        try:
                            from odoo.addons.quelyos_api.controllers import websocket_ctrl
                            websocket_ctrl.notify_invoice_paid(invoice)
                        except Exception as e:
                            _logger.error(f"[WS] Erreur notification invoice.paid: {e}", exc_info=True)

        return result
