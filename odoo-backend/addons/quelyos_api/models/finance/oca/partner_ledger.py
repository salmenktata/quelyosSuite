# -*- coding: utf-8 -*-
"""
Grand Livre Auxiliaire (Partner Ledger) - Quelyos Native
Adapted from OCA account-financial-reporting/account_financial_report
License: AGPL-3.0
"""

import logging
from odoo import models, fields, api
from datetime import datetime

_logger = logging.getLogger(__name__)


class QuelyosPartnerLedger(models.TransientModel):
    """Grand Livre Auxiliaire - Rapport par Partenaire"""
    
    _name = 'quelyos.finance.partner_ledger'
    _description = 'Grand Livre Auxiliaire Quelyos'
    
    # Champs de filtrage
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', required=True)
    partner_id = fields.Many2one('res.partner', string='Partenaire')
    date_from = fields.Date(string='Date début', required=True)
    date_to = fields.Date(string='Date fin', required=True)
    account_ids = fields.Many2many('account.account', string='Comptes')
    show_partner_details = fields.Boolean(string='Détails partenaire', default=True)
    
    def _get_account_move_lines(self):
        """
        Récupère les écritures comptables filtrées
        Adapted from OCA account_financial_report
        """
        domain = [
            ('tenant_id', '=', self.tenant_id.id),
            ('date', '>=', self.date_from),
            ('date', '<=', self.date_to),
            ('parent_state', '=', 'posted'),  # Seulement écritures validées
        ]
        
        if self.partner_id:
            domain.append(('partner_id', '=', self.partner_id.id))
        
        if self.account_ids:
            domain.append(('account_id', 'in', self.account_ids.ids))
        
        AccountMoveLine = self.env['account.move.line'].sudo()
        return AccountMoveLine.search(domain, order='date, id')
    
    def _compute_partner_ledger_data(self):
        """
        Calcule les données du grand livre auxiliaire
        Returns dict with structure:
        {
            'partner': {...},
            'lines': [...],
            'totalDebit': float,
            'totalCredit': float,
            'balance': float
        }
        """
        lines = self._get_account_move_lines()
        
        ledger_lines = []
        total_debit = 0.0
        total_credit = 0.0
        running_balance = 0.0
        
        for line in lines:
            debit = line.debit or 0.0
            credit = line.credit or 0.0
            running_balance += debit - credit
            
            ledger_lines.append({
                'id': line.id,
                'date': line.date.isoformat() if line.date else None,
                'move': line.move_id.name or '',
                'moveId': line.move_id.id,
                'account': line.account_id.code or '',
                'accountName': line.account_id.name or '',
                'label': line.name or '',
                'debit': debit,
                'credit': credit,
                'balance': running_balance,
                'currency': line.currency_id.name if line.currency_id else 'EUR',
                'reconciled': line.reconciled,
            })
            
            total_debit += debit
            total_credit += credit
        
        partner_data = {}
        if self.partner_id:
            partner_data = {
                'id': self.partner_id.id,
                'name': self.partner_id.name,
                'ref': self.partner_id.ref or '',
                'email': self.partner_id.email or '',
                'phone': self.partner_id.phone or '',
            }
        
        return {
            'partner': partner_data,
            'lines': ledger_lines,
            'totalDebit': total_debit,
            'totalCredit': total_credit,
            'balance': total_debit - total_credit,
            'dateFrom': self.date_from.isoformat() if self.date_from else None,
            'dateTo': self.date_to.isoformat() if self.date_to else None,
        }
    
    def generate_report(self):
        """Génère le rapport et retourne les données"""
        self.ensure_one()
        return self._compute_partner_ledger_data()


class QuelyosPartnerLedgerLine(models.TransientModel):
    """Ligne de Grand Livre Auxiliaire (pour stockage temporaire si nécessaire)"""
    
    _name = 'quelyos.finance.partner_ledger.line'
    _description = 'Ligne Grand Livre Auxiliaire'
    _order = 'date, id'
    
    report_id = fields.Many2one('quelyos.finance.partner_ledger', required=True, ondelete='cascade')
    tenant_id = fields.Many2one('quelyos.tenant', related='report_id.tenant_id', store=True)
    
    date = fields.Date(string='Date')
    move_id = fields.Many2one('account.move', string='Écriture')
    move_name = fields.Char(string='N° Écriture')
    account_id = fields.Many2one('account.account', string='Compte')
    partner_id = fields.Many2one('res.partner', string='Partenaire')
    label = fields.Char(string='Libellé')
    
    debit = fields.Monetary(string='Débit', currency_field='currency_id')
    credit = fields.Monetary(string='Crédit', currency_field='currency_id')
    balance = fields.Monetary(string='Solde', currency_field='currency_id')
    currency_id = fields.Many2one('res.currency', string='Devise', default=lambda self: self.env.company.currency_id)
    
    reconciled = fields.Boolean(string='Lettré')
