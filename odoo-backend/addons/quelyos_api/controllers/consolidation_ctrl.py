# -*- coding: utf-8 -*-
"""Contrôleur Consolidation Multi-Sociétés"""

import logging
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class ConsolidationController(BaseController):
    """API Consolidation Financière Multi-Entités"""

    @http.route('/api/finance/consolidation/entities', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_entities(self, **params):
        """
        Liste sociétés du groupe consolidé
        
        Query params:
        - include_inactive: bool
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            
            # TODO: Récupérer depuis res.company avec hiérarchie groupe
            entities = [
                {
                    'id': 1,
                    'name': 'Quelyos France SAS',
                    'code': 'FR001',
                    'currency': 'EUR',
                    'consolidationPercent': 100.0,
                    'parent': None,
                    'type': 'parent',
                },
                {
                    'id': 2,
                    'name': 'Quelyos Belgium SPRL',
                    'code': 'BE001',
                    'currency': 'EUR',
                    'consolidationPercent': 80.0,
                    'parent': 1,
                    'type': 'subsidiary',
                },
                {
                    'id': 3,
                    'name': 'Quelyos Switzerland SA',
                    'code': 'CH001',
                    'currency': 'CHF',
                    'consolidationPercent': 60.0,
                    'parent': 1,
                    'type': 'subsidiary',
                },
            ]
            
            return self._success_response({'entities': entities})

        except Exception as e:
            _logger.error(f"Erreur get_entities: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/consolidation/balance-sheet', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_consolidated_balance_sheet(self, **params):
        """
        Bilan consolidé groupe
        
        Query params:
        - date_at: YYYY-MM-DD (date du bilan)
        - entity_ids: list[int] (filtrer entités, default: toutes)
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            
            # TODO: Agréger bilans de toutes entités
            # - Conversion devises au taux du jour
            # - Éliminations inter-sociétés
            # - Application pourcentages consolidation
            
            balance_sheet = {
                'assets': {
                    'fixed': {
                        'label': 'Actif Immobilisé',
                        'quelyosFrance': 500000.0,
                        'quelyosBelgium': 200000.0,
                        'quelyosSwitzerland': 150000.0,
                        'eliminations': -50000.0,
                        'consolidated': 800000.0,
                    },
                    'current': {
                        'label': 'Actif Circulant',
                        'quelyosFrance': 300000.0,
                        'quelyosBelgium': 120000.0,
                        'quelyosSwitzerland': 80000.0,
                        'eliminations': -30000.0,
                        'consolidated': 470000.0,
                    },
                    'total': {
                        'label': 'Total Actif',
                        'consolidated': 1270000.0,
                    },
                },
                'liabilities': {
                    'equity': {
                        'label': 'Capitaux Propres',
                        'consolidated': 800000.0,
                    },
                    'longTerm': {
                        'label': 'Dettes Long Terme',
                        'consolidated': 300000.0,
                    },
                    'current': {
                        'label': 'Dettes Court Terme',
                        'consolidated': 170000.0,
                    },
                    'total': {
                        'label': 'Total Passif',
                        'consolidated': 1270000.0,
                    },
                },
            }
            
            return self._success_response(balance_sheet)

        except Exception as e:
            _logger.error(f"Erreur get_consolidated_balance_sheet: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/consolidation/profit-loss', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_consolidated_profit_loss(self, **params):
        """
        Compte de résultat consolidé
        
        Query params:
        - date_from: YYYY-MM-DD
        - date_to: YYYY-MM-DD
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            
            profit_loss = {
                'revenue': {
                    'label': 'Chiffre d\'Affaires',
                    'consolidated': 1500000.0,
                },
                'costOfSales': {
                    'label': 'Coût des Ventes',
                    'consolidated': -600000.0,
                },
                'grossProfit': {
                    'label': 'Marge Brute',
                    'consolidated': 900000.0,
                },
                'operatingExpenses': {
                    'label': 'Charges Opérationnelles',
                    'consolidated': -500000.0,
                },
                'ebitda': {
                    'label': 'EBITDA',
                    'consolidated': 400000.0,
                },
                'netProfit': {
                    'label': 'Résultat Net',
                    'consolidated': 280000.0,
                },
            }
            
            return self._success_response(profit_loss)

        except Exception as e:
            _logger.error(f"Erreur get_consolidated_profit_loss: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/consolidation/eliminations', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_eliminations(self, **params):
        """
        Écritures d'élimination inter-sociétés
        
        Query params:
        - period: YYYY-MM
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            
            # Types éliminations : ventes inter-sociétés, prêts, dividendes, participations
            eliminations = [
                {
                    'id': 1,
                    'type': 'inter_company_sales',
                    'label': 'Ventes inter-sociétés',
                    'debit': 50000.0,
                    'credit': 50000.0,
                    'entities': ['Quelyos France', 'Quelyos Belgium'],
                },
                {
                    'id': 2,
                    'type': 'inter_company_loans',
                    'label': 'Prêts inter-sociétés',
                    'debit': 30000.0,
                    'credit': 30000.0,
                    'entities': ['Quelyos France', 'Quelyos Switzerland'],
                },
            ]
            
            return self._success_response({'eliminations': eliminations})

        except Exception as e:
            _logger.error(f"Erreur get_eliminations: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)
