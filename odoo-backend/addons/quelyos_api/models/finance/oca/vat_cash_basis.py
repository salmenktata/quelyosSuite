# -*- coding: utf-8 -*-
"""
TVA sur Encaissements - Quelyos Native
Adapted from OCA l10n-france/l10n_fr_vat_cash_basis
License: AGPL-3.0
"""

import logging
from odoo import models, fields, api

_logger = logging.getLogger(__name__)


class QuelyosVATCashBasis(models.Model):
    """TVA sur Encaissements - Configuration"""
    
    _name = 'quelyos.finance.vat_cash_basis'
    _description = 'TVA sur Encaissements Quelyos'
    
    tenant_id = fields.Many2one('quelyos.tenant', required=True)
    name = fields.Char(string='Nom', required=True)
    active = fields.Boolean(default=True)
    
    # Configuration
    cash_basis_journal_id = fields.Many2one('account.journal', string='Journal TVA encaissement')
    transition_account_id = fields.Many2one('account.account', string='Compte transition TVA')
    
    # Comptes TVA concernés
    vat_account_ids = fields.Many2many('account.account', string='Comptes TVA')
    
    def create_cash_basis_entry(self, payment, invoice):
        """
        Crée l'écriture de TVA lors du paiement
        Appelé depuis account.payment.register
        """
        self.ensure_one()
        
        if not invoice.tax_line_ids:
            return False
        
        AccountMove = self.env['account.move'].sudo()
        
        # Calculer TVA à transférer
        vat_amount = sum(line.price_total for line in invoice.tax_line_ids)
        
        move_vals = {
            'tenant_id': self.tenant_id.id,
            'journal_id': self.cash_basis_journal_id.id,
            'ref': f"TVA encaissement {invoice.name}",
            'date': payment.date,
            'line_ids': [
                # Débit compte transition
                (0, 0, {
                    'account_id': self.transition_account_id.id,
                    'debit': vat_amount,
                    'credit': 0.0,
                }),
                # Crédit compte TVA
                (0, 0, {
                    'account_id': invoice.tax_line_ids[0].account_id.id,
                    'debit': 0.0,
                    'credit': vat_amount,
                }),
            ],
        }
        
        move = AccountMove.create(move_vals)
        move.action_post()
        
        return move
