# -*- coding: utf-8 -*-
"""
FEC Export (Fichier Écritures Comptables) - Quelyos Native
Adapted from OCA l10n-france/l10n_fr_fec
License: AGPL-3.0

Format FEC conforme DGFiP (Article A47 A-1 du Livre des procédures fiscales)
"""

import logging
from odoo import models, fields, api
from datetime import datetime
import csv
import io
import base64

_logger = logging.getLogger(__name__)


class QuelyosFECExport(models.TransientModel):
    """Export FEC - Fichier Écritures Comptables"""
    
    _name = 'quelyos.finance.fec_export'
    _description = 'Export FEC Quelyos'
    
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', required=True)
    fiscal_year_id = fields.Many2one('quelyos.finance.fiscal_year', string='Exercice fiscal', required=True)
    date_from = fields.Date(string='Date début', required=True)
    date_to = fields.Date(string='Date fin', required=True)
    export_type = fields.Selection([
        ('official', 'FEC Officiel (DGFiP)'),
        ('extended', 'FEC Étendu (+ infos)'),
    ], string='Type export', default='official', required=True)
    
    # Résultat export
    fec_data = fields.Binary(string='Fichier FEC', readonly=True, attachment=True)
    fec_filename = fields.Char(string='Nom fichier', readonly=True)
    
    @api.onchange('fiscal_year_id')
    def _onchange_fiscal_year(self):
        """Remplir dates depuis exercice fiscal"""
        if self.fiscal_year_id:
            self.date_from = self.fiscal_year_id.date_from
            self.date_to = self.fiscal_year_id.date_to
    
    def _get_fec_columns_official(self):
        """
        Colonnes FEC officielles (18 colonnes obligatoires)
        Norme FEC : Article A47 A-1
        """
        return [
            'JournalCode',        # Code journal
            'JournalLib',         # Libellé journal
            'EcritureNum',        # Numéro écriture
            'EcritureDate',       # Date écriture (YYYYMMDD)
            'CompteNum',          # Numéro compte
            'CompteLib',          # Libellé compte
            'CompAuxNum',         # Numéro compte auxiliaire (client/fournisseur)
            'CompAuxLib',         # Libellé compte auxiliaire
            'PieceRef',           # Référence pièce
            'PieceDate',          # Date pièce (YYYYMMDD)
            'EcritureLib',        # Libellé écriture
            'Debit',              # Montant débit (virgule décimale)
            'Credit',             # Montant crédit (virgule décimale)
            'EcritureLet',        # Lettrage
            'DateLet',            # Date lettrage (YYYYMMDD)
            'ValidDate',          # Date validation (YYYYMMDD)
            'Montantdevise',      # Montant en devise
            'Idevise',            # Code devise ISO
        ]
    
    def _format_fec_amount(self, amount):
        """Formate un montant pour le FEC (virgule décimale, 2 décimales)"""
        return f"{amount:.2f}".replace('.', ',')
    
    def _format_fec_date(self, date_obj):
        """Formate une date pour le FEC (YYYYMMDD)"""
        if not date_obj:
            return ''
        return date_obj.strftime('%Y%m%d')
    
    def _get_move_lines_for_export(self):
        """Récupère toutes les lignes d'écriture pour l'export FEC"""
        AccountMoveLine = self.env['account.move.line'].sudo()
        
        domain = [
            ('tenant_id', '=', self.tenant_id.id),
            ('date', '>=', self.date_from),
            ('date', '<=', self.date_to),
            ('parent_state', '=', 'posted'),  # Seulement écritures validées
        ]
        
        # Ordre: Journal, Date, Numéro écriture, Ligne
        return AccountMoveLine.search(domain, order='journal_id, date, move_id, id')
    
    def _line_to_fec_row(self, line):
        """
        Convertit une ligne d'écriture en ligne FEC
        Returns: dict avec colonnes FEC
        """
        move = line.move_id
        journal = move.journal_id
        account = line.account_id
        partner = line.partner_id
        
        return {
            'JournalCode': journal.code or '',
            'JournalLib': journal.name or '',
            'EcritureNum': move.name or '',
            'EcritureDate': self._format_fec_date(line.date),
            'CompteNum': account.code or '',
            'CompteLib': account.name or '',
            'CompAuxNum': partner.ref or '' if partner else '',
            'CompAuxLib': partner.name or '' if partner else '',
            'PieceRef': move.ref or '',
            'PieceDate': self._format_fec_date(move.invoice_date or move.date),
            'EcritureLib': line.name or '',
            'Debit': self._format_fec_amount(line.debit),
            'Credit': self._format_fec_amount(line.credit),
            'EcritureLet': line.matching_number or '',
            'DateLet': self._format_fec_date(line.date) if line.reconciled else '',
            'ValidDate': self._format_fec_date(move.date),
            'Montantdevise': self._format_fec_amount(line.amount_currency) if line.currency_id else '',
            'Idevise': line.currency_id.name if line.currency_id else '',
        }
    
    def generate_fec_file(self):
        """
        Génère le fichier FEC et le stocke dans fec_data
        Returns: dict avec success et filename
        """
        self.ensure_one()
        
        lines = self._get_move_lines_for_export()
        
        if not lines:
            raise ValueError("Aucune écriture comptable trouvée pour la période sélectionnée")
        
        # Générer fichier CSV
        output = io.StringIO()
        columns = self._get_fec_columns_official()
        
        writer = csv.DictWriter(
            output,
            fieldnames=columns,
            delimiter='|',  # Séparateur pipe (norme FEC)
            quoting=csv.QUOTE_NONE,
            escapechar='\\',
        )
        
        # Pas d'en-tête dans le FEC officiel
        # writer.writeheader()
        
        # Écrire les lignes
        for line in lines:
            row = self._line_to_fec_row(line)
            writer.writerow(row)
        
        # Encoder en bytes
        fec_content = output.getvalue()
        output.close()
        
        fec_bytes = fec_content.encode('utf-8')
        fec_b64 = base64.b64encode(fec_bytes)
        
        # Nom de fichier FEC : SIREN + FEC + YYYYMMDD (date clôture)
        # Ex: 123456789FEC20261231.txt
        company = self.env.company
        siren = company.company_registry or '000000000'  # À remplacer par vrai SIREN
        date_str = self.date_to.strftime('%Y%m%d')
        filename = f"{siren}FEC{date_str}.txt"
        
        # Stocker résultat
        self.write({
            'fec_data': fec_b64,
            'fec_filename': filename,
        })
        
        return {
            'success': True,
            'filename': filename,
            'lines_count': len(lines),
            'date_from': self.date_from.isoformat(),
            'date_to': self.date_to.isoformat(),
        }
    
    def download_fec(self):
        """Action pour télécharger le fichier FEC"""
        self.ensure_one()
        
        if not self.fec_data:
            raise ValueError("Aucun fichier FEC généré. Appelez d'abord generate_fec_file()")
        
        return {
            'type': 'ir.actions.act_url',
            'url': f'/web/content/{self._name}/{self.id}/fec_data/{self.fec_filename}?download=true',
            'target': 'self',
        }
