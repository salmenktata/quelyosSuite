# -*- coding: utf-8 -*-
"""
Grand Livre Général (General Ledger) - Quelyos Native
Adapted from OCA account-financial-reporting/general_ledger
License: AGPL-3.0
"""

import logging
from odoo import models, fields, api

_logger = logging.getLogger(__name__)


class QuelyosGeneralLedger(models.TransientModel):
    """Grand Livre Général - Toutes les écritures comptables"""
    
    _name = 'quelyos.finance.general_ledger'
    _description = 'Grand Livre Général Quelyos'
    
    # Champs de filtrage
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', required=True)
    date_from = fields.Date(string='Date début', required=True)
    date_to = fields.Date(string='Date fin', required=True)
    journal_ids = fields.Many2many('account.journal', string='Journaux')
    account_ids = fields.Many2many('account.account', string='Comptes')
    partner_ids = fields.Many2many('res.partner', string='Partenaires')
    centralize = fields.Boolean(string='Centraliser par compte', default=False)
    show_analytic = fields.Boolean(string='Afficher analytique', default=False)
    
    def _get_account_lines(self, account):
        """Récupère toutes les lignes d'un compte pour la période"""
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
        
        return AccountMoveLine.search(domain, order='date, move_id, id')
    
    def _get_initial_balance(self, account):
        """Solde initial du compte avant la période"""
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
    
    def _format_account_data(self, account):
        """Formate les données d'un compte pour le rapport"""
        initial_balance = self._get_initial_balance(account)
        lines = self._get_account_lines(account)
        
        formatted_lines = []
        running_balance = initial_balance
        total_debit = 0.0
        total_credit = 0.0
        
        for line in lines:
            debit = line.debit or 0.0
            credit = line.credit or 0.0
            running_balance += debit - credit
            total_debit += debit
            total_credit += credit
            
            line_data = {
                'id': line.id,
                'date': line.date.isoformat() if line.date else None,
                'moveId': line.move_id.id,
                'moveName': line.move_id.name or '',
                'journalCode': line.journal_id.code or '',
                'partner': line.partner_id.name if line.partner_id else '',
                'label': line.name or '',
                'debit': debit,
                'credit': credit,
                'balance': running_balance,
                'reconciled': line.reconciled,
            }
            
            if self.show_analytic and line.analytic_account_id:
                line_data['analyticAccount'] = line.analytic_account_id.name
            
            formatted_lines.append(line_data)
        
        return {
            'accountId': account.id,
            'code': account.code or '',
            'name': account.name or '',
            'initialBalance': initial_balance,
            'lines': formatted_lines,
            'totalDebit': total_debit,
            'totalCredit': total_credit,
            'endBalance': running_balance,
        }
    
    def generate_report(self):
        """Génère le grand livre général"""
        self.ensure_one()
        
        Account = self.env['account.account'].sudo()
        
        # Récupérer comptes
        if self.account_ids:
            accounts = self.account_ids
        else:
            domain = [('tenant_id', '=', self.tenant_id.id)]
            accounts = Account.search(domain, order='code')
        
        accounts_data = []
        grand_totals = {
            'initialBalance': 0.0,
            'debit': 0.0,
            'credit': 0.0,
            'endBalance': 0.0,
        }
        
        for account in accounts:
            account_data = self._format_account_data(account)
            
            # Ne garder que comptes avec mouvements ou solde
            if account_data['lines'] or account_data['initialBalance'] != 0:
                accounts_data.append(account_data)
                
                # Cumul totaux généraux
                grand_totals['initialBalance'] += account_data['initialBalance']
                grand_totals['debit'] += account_data['totalDebit']
                grand_totals['credit'] += account_data['totalCredit']
                grand_totals['endBalance'] += account_data['endBalance']
        
        return {
            'accounts': accounts_data,
            'totals': grand_totals,
            'dateFrom': self.date_from.isoformat() if self.date_from else None,
            'dateTo': self.date_to.isoformat() if self.date_to else None,
            'centralize': self.centralize,
        }
