# -*- coding: utf-8 -*-
"""
Balance Générale (Trial Balance) - Quelyos Native
Adapted from OCA account-financial-reporting/trial_balance
License: AGPL-3.0
"""

import logging
from odoo import models, fields, api

_logger = logging.getLogger(__name__)


class QuelyosTrialBalance(models.TransientModel):
    """Balance Générale - Tous les comptes"""
    
    _name = 'quelyos.finance.trial_balance'
    _description = 'Balance Générale Quelyos'
    
    # Champs de filtrage
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', required=True)
    date_from = fields.Date(string='Date début', required=True)
    date_to = fields.Date(string='Date fin', required=True)
    journal_ids = fields.Many2many('account.journal', string='Journaux')
    account_ids = fields.Many2many('account.account', string='Comptes')
    partner_ids = fields.Many2many('res.partner', string='Partenaires')
    hide_zero_balance = fields.Boolean(string='Masquer soldes nuls', default=True)
    show_partner_details = fields.Boolean(string='Détails partenaires', default=False)
    
    def _get_initial_balance(self, account):
        """Calcule le solde initial d'un compte avant date_from"""
        AccountMoveLine = self.env['account.move.line'].sudo()
        
        domain = [
            ('tenant_id', '=', self.tenant_id.id),
            ('account_id', '=', account.id),
            ('date', '<', self.date_from),
            ('parent_state', '=', 'posted'),
        ]
        
        lines = AccountMoveLine.search(domain)
        
        initial_debit = sum(line.debit for line in lines)
        initial_credit = sum(line.credit for line in lines)
        
        return initial_debit - initial_credit
    
    def _get_period_movements(self, account):
        """Calcule les mouvements de la période pour un compte"""
        AccountMoveLine = self.env['account.move.line'].sudo()
        
        domain = [
            ('tenant_id', '=', self.tenant_id.id),
            ('account_id', '=', account.id),
            ('date', '>=', self.date_from),
            ('date', '<=', self.date_to),
            ('parent_state', '=', 'posted'),
        ]
        
        if self.journal_ids:
            domain.append(('journal_id', 'in', self.journal_ids.ids))
        
        if self.partner_ids:
            domain.append(('partner_id', 'in', self.partner_ids.ids))
        
        lines = AccountMoveLine.search(domain)
        
        period_debit = sum(line.debit for line in lines)
        period_credit = sum(line.credit for line in lines)
        
        return period_debit, period_credit
    
    def generate_report(self):
        """Génère la balance générale"""
        self.ensure_one()
        
        Account = self.env['account.account'].sudo()
        
        # Récupérer les comptes
        if self.account_ids:
            accounts = self.account_ids
        else:
            # Tous les comptes du tenant
            domain = [('tenant_id', '=', self.tenant_id.id)]
            accounts = Account.search(domain, order='code')
        
        balance_lines = []
        totals = {
            'initialBalance': 0.0,
            'debit': 0.0,
            'credit': 0.0,
            'endBalance': 0.0,
        }
        
        for account in accounts:
            initial_balance = self._get_initial_balance(account)
            period_debit, period_credit = self._get_period_movements(account)
            end_balance = initial_balance + period_debit - period_credit
            
            # Masquer soldes nuls si demandé
            if self.hide_zero_balance and end_balance == 0 and period_debit == 0 and period_credit == 0:
                continue
            
            balance_lines.append({
                'accountId': account.id,
                'code': account.code or '',
                'name': account.name or '',
                'accountType': account.account_type or '',
                'initialBalance': initial_balance,
                'debit': period_debit,
                'credit': period_credit,
                'endBalance': end_balance,
            })
            
            # Cumul totaux
            totals['initialBalance'] += initial_balance
            totals['debit'] += period_debit
            totals['credit'] += period_credit
            totals['endBalance'] += end_balance
        
        return {
            'lines': balance_lines,
            'totals': totals,
            'dateFrom': self.date_from.isoformat() if self.date_from else None,
            'dateTo': self.date_to.isoformat() if self.date_to else None,
            'hideZeroBalance': self.hide_zero_balance,
        }
