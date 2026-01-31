# -*- coding: utf-8 -*-
"""
Rapprochement Bancaire Avancé - Quelyos Native
Adapted from OCA account-reconcile/account_reconcile_oca
License: AGPL-3.0
"""

import logging
from odoo import models, fields, api

_logger = logging.getLogger(__name__)


class QuelyosAdvancedReconciliation(models.TransientModel):
    """Rapprochement Bancaire Avancé avec suggestions ML"""
    
    _name = 'quelyos.finance.advanced_reconciliation'
    _description = 'Rapprochement Bancaire Avancé'
    
    tenant_id = fields.Many2one('quelyos.tenant', required=True)
    bank_statement_id = fields.Many2one('account.bank.statement', string='Relevé bancaire')
    
    def _find_matching_candidates(self, statement_line):
        """
        Trouve les candidats de rapprochement pour une ligne bancaire
        Utilise algorithme de matching (montant, date, partenaire)
        """
        AccountMoveLine = self.env['account.move.line'].sudo()
        
        # Critères de recherche
        amount = abs(statement_line.amount)
        date = statement_line.date
        partner = statement_line.partner_id
        
        domain = [
            ('tenant_id', '=', self.tenant_id.id),
            ('reconciled', '=', False),
            ('account_id.account_type', 'in', ['asset_receivable', 'liability_payable']),
            ('parent_state', '=', 'posted'),
        ]
        
        # Critère montant (tolérance ±1€)
        domain.extend([
            ('balance', '>=', amount - 1.0),
            ('balance', '<=', amount + 1.0),
        ])
        
        # Critère partenaire (optionnel)
        if partner:
            domain.append(('partner_id', '=', partner.id))
        
        candidates = AccountMoveLine.search(domain, limit=20)
        
        # Calculer score de matching
        scored_candidates = []
        for candidate in candidates:
            score = self._compute_matching_score(statement_line, candidate)
            scored_candidates.append({
                'moveLineId': candidate.id,
                'moveName': candidate.move_id.name,
                'partner': candidate.partner_id.name if candidate.partner_id else '',
                'amount': candidate.balance,
                'date': candidate.date.isoformat() if candidate.date else None,
                'score': score,
            })
        
        # Trier par score décroissant
        scored_candidates.sort(key=lambda x: x['score'], reverse=True)
        
        return scored_candidates
    
    def _compute_matching_score(self, statement_line, move_line):
        """
        Calcule un score de matching (0-100)
        Basé sur: montant, date, partenaire, communication
        """
        score = 0
        
        # Montant (40 points max)
        amount_diff = abs(abs(statement_line.amount) - abs(move_line.balance))
        if amount_diff == 0:
            score += 40
        elif amount_diff < 1.0:
            score += 30
        elif amount_diff < 5.0:
            score += 20
        
        # Date (30 points max)
        if statement_line.date and move_line.date:
            date_diff = abs((statement_line.date - move_line.date).days)
            if date_diff == 0:
                score += 30
            elif date_diff <= 3:
                score += 20
            elif date_diff <= 7:
                score += 10
        
        # Partenaire (20 points max)
        if statement_line.partner_id and move_line.partner_id:
            if statement_line.partner_id.id == move_line.partner_id.id:
                score += 20
        
        # Communication (10 points max)
        if statement_line.payment_ref and move_line.name:
            if statement_line.payment_ref.lower() in move_line.name.lower():
                score += 10
        
        return score
    
    def suggest_reconciliations(self):
        """Suggère des rapprochements pour tout le relevé"""
        self.ensure_one()
        
        suggestions = []
        
        for line in self.bank_statement_id.line_ids:
            if not line.is_reconciled:
                candidates = self._find_matching_candidates(line)
                suggestions.append({
                    'statementLineId': line.id,
                    'amount': line.amount,
                    'date': line.date.isoformat() if line.date else None,
                    'partner': line.partner_id.name if line.partner_id else '',
                    'candidates': candidates[:5],  # Top 5
                })
        
        return {
            'suggestions': suggestions,
            'total_lines': len(self.bank_statement_id.line_ids),
            'unreconciled': len([s for s in suggestions if s['candidates']]),
        }
