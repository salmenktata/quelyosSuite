# -*- coding: utf-8 -*-
"""
Balance Âgée des Créances (Aged Receivables) - Quelyos Native
Adapted from OCA account-financial-reporting/aged_partner_balance
License: AGPL-3.0
"""

import logging
from odoo import models, fields, api
from datetime import datetime, timedelta

_logger = logging.getLogger(__name__)


class QuelyosAgedReceivables(models.TransientModel):
    """Balance Âgée des Créances - 30/60/90 jours"""
    
    _name = 'quelyos.finance.aged_receivables'
    _description = 'Balance Âgée Créances Quelyos'
    
    # Champs de filtrage
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', required=True)
    date_at = fields.Date(string='Date de référence', required=True, default=fields.Date.context_today)
    partner_ids = fields.Many2many('res.partner', string='Partenaires')
    account_type = fields.Selection([
        ('receivable', 'Clients (Créances)'),
        ('payable', 'Fournisseurs (Dettes)'),
    ], string='Type', default='receivable', required=True)
    
    def _get_aged_periods(self):
        """Retourne les bornes des périodes d'ancienneté"""
        date_at = self.date_at
        
        return {
            'current': (date_at - timedelta(days=30), date_at),  # 0-30 jours
            'period1': (date_at - timedelta(days=60), date_at - timedelta(days=31)),  # 31-60 jours
            'period2': (date_at - timedelta(days=90), date_at - timedelta(days=61)),  # 61-90 jours
            'period3': (None, date_at - timedelta(days=91)),  # >90 jours
        }
    
    def _compute_partner_aging(self, partner):
        """Calcule le vieillissement des créances pour un partenaire"""
        AccountMoveLine = self.env['account.move.line'].sudo()
        periods = self._get_aged_periods()
        
        # Récupérer toutes les lignes non lettrées du partenaire
        domain = [
            ('tenant_id', '=', self.tenant_id.id),
            ('partner_id', '=', partner.id),
            ('account_id.account_type', '=', self.account_type),
            ('reconciled', '=', False),  # Non lettré
            ('parent_state', '=', 'posted'),  # Écriture validée
            ('date', '<=', self.date_at),
        ]
        
        lines = AccountMoveLine.search(domain)
        
        aging = {
            'current': 0.0,
            'period1': 0.0,
            'period2': 0.0,
            'period3': 0.0,
        }
        
        for line in lines:
            amount = line.debit - line.credit if self.account_type == 'receivable' else line.credit - line.debit
            
            # Déterminer dans quelle période tombe cette ligne
            line_date = line.date
            
            if periods['current'][0] <= line_date <= periods['current'][1]:
                aging['current'] += amount
            elif periods['period1'][0] <= line_date <= periods['period1'][1]:
                aging['period1'] += amount
            elif periods['period2'][0] <= line_date <= periods['period2'][1]:
                aging['period2'] += amount
            else:  # period3
                aging['period3'] += amount
        
        return aging
    
    def generate_report(self):
        """Génère le rapport de balance âgée"""
        self.ensure_one()
        
        # Récupérer tous les partenaires concernés
        if self.partner_ids:
            partners = self.partner_ids
        else:
            # Tous les partenaires avec des lignes non lettrées
            Partner = self.env['res.partner'].sudo()
            domain = [('tenant_id', '=', self.tenant_id.id)]
            partners = Partner.search(domain)
        
        partners_data = []
        totals = {
            'current': 0.0,
            'period1': 0.0,
            'period2': 0.0,
            'period3': 0.0,
            'total': 0.0,
        }
        
        for partner in partners:
            aging = self._compute_partner_aging(partner)
            partner_total = sum(aging.values())
            
            # Ne garder que les partenaires avec un solde non nul
            if partner_total != 0:
                partners_data.append({
                    'id': partner.id,
                    'name': partner.name,
                    'ref': partner.ref or '',
                    'current': aging['current'],
                    'period1': aging['period1'],
                    'period2': aging['period2'],
                    'period3': aging['period3'],
                    'total': partner_total,
                })
                
                # Cumul totaux
                for period in ['current', 'period1', 'period2', 'period3']:
                    totals[period] += aging[period]
                totals['total'] += partner_total
        
        # Trier par montant total décroissant
        partners_data.sort(key=lambda x: x['total'], reverse=True)
        
        return {
            'partners': partners_data,
            'totals': totals,
            'dateAt': self.date_at.isoformat() if self.date_at else None,
            'accountType': self.account_type,
            'periods': {
                'current': '0-30 jours',
                'period1': '31-60 jours',
                'period2': '61-90 jours',
                'period3': '> 90 jours',
            }
        }
