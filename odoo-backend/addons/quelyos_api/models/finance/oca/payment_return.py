# -*- coding: utf-8 -*-
"""
Retours Paiements - Quelyos Native
Adapted from OCA account-payment/account_payment_return
License: AGPL-3.0
"""

import logging
from odoo import models, fields, api

_logger = logging.getLogger(__name__)


class QuelyosPaymentReturn(models.Model):
    """Retour de Paiement (rejet, impayé)"""
    
    _name = 'quelyos.finance.payment_return'
    _description = 'Retour Paiement Quelyos'
    _order = 'date desc'
    
    tenant_id = fields.Many2one('quelyos.tenant', required=True)
    name = fields.Char(string='Référence', required=True, default='/')
    date = fields.Date(string='Date retour', required=True, default=fields.Date.context_today)
    
    payment_id = fields.Many2one('account.payment', string='Paiement d origine', required=True)
    amount = fields.Monetary(string='Montant retourné', currency_field='currency_id')
    currency_id = fields.Many2one('res.currency', default=lambda self: self.env.company.currency_id)
    
    reason = fields.Selection([
        ('insufficient_funds', 'Provision insuffisante'),
        ('account_closed', 'Compte clôturé'),
        ('invalid_account', 'Compte invalide'),
        ('other', 'Autre'),
    ], string='Motif retour')
    
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('confirmed', 'Confirmé'),
        ('posted', 'Comptabilisé'),
    ], default='draft')
    
    move_id = fields.Many2one('account.move', string='Écriture comptable', readonly=True)
    
    def action_confirm(self):
        """Confirme le retour"""
        self.write({'state': 'confirmed'})
    
    def action_post(self):
        """Comptabilise le retour et crée l'écriture d'annulation"""
        for record in self:
            # Créer écriture inverse du paiement
            AccountMove = self.env['account.move'].sudo()
            
            original_payment = record.payment_id
            
            move_vals = {
                'tenant_id': record.tenant_id.id,
                'journal_id': original_payment.journal_id.id,
                'ref': f"Retour {original_payment.name}",
                'date': record.date,
                'line_ids': [
                    # Inverse des lignes du paiement original
                    (0, 0, {
                        'account_id': original_payment.destination_account_id.id,
                        'debit': record.amount,
                        'credit': 0.0,
                    }),
                    (0, 0, {
                        'account_id': original_payment.outstanding_account_id.id,
                        'debit': 0.0,
                        'credit': record.amount,
                    }),
                ],
            }
            
            move = AccountMove.create(move_vals)
            move.action_post()
            
            record.write({
                'move_id': move.id,
                'state': 'posted',
            })
