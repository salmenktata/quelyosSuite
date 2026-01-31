# -*- coding: utf-8 -*-
"""
DAS2 (Déclaration Honoraires/Commissions) - Quelyos Native
Adapted from OCA l10n-france/l10n_fr_das2
License: AGPL-3.0
"""

import logging
from odoo import models, fields, api
import base64

_logger = logging.getLogger(__name__)


class QuelyosDAS2(models.TransientModel):
    """DAS2 - Déclaration Annuelle Honoraires"""
    
    _name = 'quelyos.finance.das2'
    _description = 'DAS2 Quelyos'
    
    tenant_id = fields.Many2one('quelyos.tenant', required=True)
    year = fields.Integer(string='Année déclaration', required=True)
    company_id = fields.Many2one('res.company', string='Société', required=True)
    
    # Seuil légal DAS2 : 1200€
    minimum_amount = fields.Float(string='Montant minimum', default=1200.0)
    
    # Résultat
    das2_data = fields.Binary(string='Fichier DAS2', readonly=True, attachment=True)
    das2_filename = fields.Char(string='Nom fichier', readonly=True)
    
    def _get_partners_above_threshold(self):
        """Récupère les partenaires au-dessus du seuil"""
        AccountMoveLine = self.env['account.move.line'].sudo()
        
        # Comptes honoraires (classe 6)
        domain = [
            ('tenant_id', '=', self.tenant_id.id),
            ('date', '>=', f'{self.year}-01-01'),
            ('date', '<=', f'{self.year}-12-31'),
            ('account_id.code', '=like', '6%'),  # Comptes de charges
            ('partner_id', '!=', False),
            ('parent_state', '=', 'posted'),
        ]
        
        lines = AccountMoveLine.search(domain)
        
        # Grouper par partenaire
        partners_amounts = {}
        for line in lines:
            partner = line.partner_id
            amount = line.debit
            
            if partner.id not in partners_amounts:
                partners_amounts[partner.id] = {
                    'partner': partner,
                    'amount': 0.0,
                    'lines_count': 0,
                }
            
            partners_amounts[partner.id]['amount'] += amount
            partners_amounts[partner.id]['lines_count'] += 1
        
        # Filtrer par seuil
        return [
            data for data in partners_amounts.values()
            if data['amount'] >= self.minimum_amount
        ]
    
    def generate_das2(self):
        """Génère la déclaration DAS2"""
        self.ensure_one()
        
        partners_data = self._get_partners_above_threshold()
        
        # Format simplifié (en production, générer XML conforme DGFiP)
        das2_content = f"DAS2 - Année {self.year}\n"
        das2_content += f"Société: {self.company_id.name}\n"
        das2_content += f"SIREN: {self.company_id.company_registry or 'N/A'}\n\n"
        das2_content += "Bénéficiaires soumis à déclaration:\n\n"
        
        total_amount = 0.0
        for data in sorted(partners_data, key=lambda x: x['amount'], reverse=True):
            partner = data['partner']
            amount = data['amount']
            total_amount += amount
            
            das2_content += f"{partner.name} ({partner.ref or 'N/A'}): {amount:.2f}€\n"
        
        das2_content += f"\nTotal déclaré: {total_amount:.2f}€\n"
        das2_content += f"Nombre de bénéficiaires: {len(partners_data)}\n"
        
        # Encoder
        das2_bytes = das2_content.encode('utf-8')
        das2_b64 = base64.b64encode(das2_bytes)
        
        filename = f"DAS2_{self.year}_{self.company_id.company_registry or '000'}.txt"
        
        self.write({
            'das2_data': das2_b64,
            'das2_filename': filename,
        })
        
        return {
            'success': True,
            'filename': filename,
            'partners_count': len(partners_data),
            'total_amount': total_amount,
        }
