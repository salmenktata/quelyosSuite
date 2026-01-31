# -*- coding: utf-8 -*-
"""Contrôleur Rapports OCA (account-financial-reporting)"""

import logging
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class OCAReportsController(BaseController):
    """API Rapports Financiers OCA"""

    @http.route('/api/finance/reports/partner-ledger', type='json', auth='public', methods=['GET', 'OPTIONS'], cors='*', csrf=False)
    def get_partner_ledger(self, **params):
        """
        Grand Livre Auxiliaire par Partenaire
        
        Query params:
        - partner_id: int (filter by partner)
        - date_from: YYYY-MM-DD
        - date_to: YYYY-MM-DD
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            partner_id = params.get('partner_id')
            date_from = params.get('date_from')
            date_to = params.get('date_to')

            # Simuler données Partner Ledger
            # En production, utiliser account_financial_report.report_partner_ledger
            ledger_data = {
                'partner': {
                    'id': partner_id or 1,
                    'name': 'Client Test',
                },
                'lines': [
                    {
                        'date': '2026-01-15',
                        'move': 'INV/2026/001',
                        'debit': 1000.0,
                        'credit': 0.0,
                        'balance': 1000.0,
                    },
                    {
                        'date': '2026-01-20',
                        'move': 'BILL/2026/001',
                        'debit': 0.0,
                        'credit': 500.0,
                        'balance': 500.0,
                    },
                ],
                'totalDebit': 1000.0,
                'totalCredit': 500.0,
                'balance': 500.0,
            }

            return self._success_response(ledger_data)

        except Exception as e:
            _logger.error(f"Erreur get_partner_ledger: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/reports/aged-receivables', type='json', auth='public', methods=['GET', 'OPTIONS'], cors='*', csrf=False)
    def get_aged_receivables(self, **params):
        """
        Balance Âgée des Créances (30/60/90 jours)
        
        Query params:
        - date_at: YYYY-MM-DD (date de référence, default: aujourd'hui)
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)

            # Simuler données Aged Receivables
            # En production, utiliser account_financial_report.report_aged_partner_balance
            aged_data = {
                'partners': [
                    {
                        'id': 1,
                        'name': 'Client A',
                        'current': 1000.0,       # 0-30 jours
                        'period1': 500.0,        # 30-60 jours
                        'period2': 300.0,        # 60-90 jours
                        'period3': 200.0,        # >90 jours
                        'total': 2000.0,
                    },
                    {
                        'id': 2,
                        'name': 'Client B',
                        'current': 3000.0,
                        'period1': 0.0,
                        'period2': 0.0,
                        'period3': 0.0,
                        'total': 3000.0,
                    },
                ],
                'totals': {
                    'current': 4000.0,
                    'period1': 500.0,
                    'period2': 300.0,
                    'period3': 200.0,
                    'total': 5000.0,
                },
            }

            return self._success_response(aged_data)

        except Exception as e:
            _logger.error(f"Erreur get_aged_receivables: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/reports/trial-balance', type='json', auth='public', methods=['GET', 'OPTIONS'], cors='*', csrf=False)
    def get_trial_balance(self, **params):
        """
        Balance Générale
        
        Query params:
        - date_from: YYYY-MM-DD
        - date_to: YYYY-MM-DD
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)

            # Simuler balance générale
            trial_balance = {
                'accounts': [
                    {
                        'code': '411000',
                        'name': 'Clients',
                        'debit': 50000.0,
                        'credit': 45000.0,
                        'balance': 5000.0,
                    },
                    {
                        'code': '512000',
                        'name': 'Banque',
                        'debit': 30000.0,
                        'credit': 25000.0,
                        'balance': 5000.0,
                    },
                ],
                'totals': {
                    'debit': 80000.0,
                    'credit': 70000.0,
                    'balance': 10000.0,
                },
            }

            return self._success_response(trial_balance)

        except Exception as e:
            _logger.error(f"Erreur get_trial_balance: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/reports/fec-export', type='http', auth='public', methods=['GET', 'OPTIONS'], cors='*', csrf=False)
    def export_fec(self, **params):
        """
        Export FEC (Fichier des Écritures Comptables) conforme DGFiP
        
        Query params:
        - year: int (année fiscale)
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return request.make_response('Unauthorized', status=401)

            tenant_id = self._get_tenant_id(user)
            year = params.get('year', 2026)

            # Simuler export FEC
            # En production, utiliser l10n_fr_fec
            fec_content = f"""JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise
VE|Ventes|INV001|{year}0115|411000|Clients|1|Client Test|INV001|{year}0115|Facture vente|1000.00|0.00||||1000.00|EUR
VE|Ventes|INV001|{year}0115|707000|Ventes produits|||||Facture vente|0.00|1000.00||||1000.00|EUR"""

            filename = f"fec-{year}.txt"
            headers = [
                ('Content-Type', 'text/plain; charset=utf-8'),
                ('Content-Disposition', f'attachment; filename="{filename}"'),
            ]

            return request.make_response(fec_content.encode('utf-8'), headers=headers)

        except Exception as e:
            _logger.error(f"Erreur export_fec: {e}", exc_info=True)
            return request.make_response(str(e), status=500)
