# -*- coding: utf-8 -*-
"""Contrôleur Comptabilité Analytique Avancée"""

import logging
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class AnalyticsAccountingController(BaseController):
    """API Comptabilité Analytique Multi-Axes"""

    @http.route('/api/finance/analytics/axes', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_axes(self, **params):
        """
        Liste axes analytiques configurés
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            
            # TODO: Récupérer depuis account.analytic.plan
            axes = [
                {'id': 1, 'name': 'Projets', 'code': 'PROJ', 'active': True},
                {'id': 2, 'name': 'Départements', 'code': 'DEPT', 'active': True},
                {'id': 3, 'name': 'Produits', 'code': 'PROD', 'active': True},
                {'id': 4, 'name': 'Zones Géographiques', 'code': 'GEO', 'active': True},
            ]
            
            return self._success_response({'axes': axes})

        except Exception as e:
            _logger.error(f"Erreur get_axes: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/analytics/accounts', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_analytic_accounts(self, **params):
        """
        Liste comptes analytiques par axe
        
        Query params:
        - axis_id: int (filtrer par axe)
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            axis_id = params.get('axis_id')
            
            # TODO: Récupérer depuis account.analytic.account
            accounts = [
                {
                    'id': 1,
                    'name': 'Projet Alpha',
                    'code': 'PROJ-001',
                    'axisId': 1,
                    'balance': 125000.0,
                },
                {
                    'id': 2,
                    'name': 'Projet Beta',
                    'code': 'PROJ-002',
                    'axisId': 1,
                    'balance': 85000.0,
                },
                {
                    'id': 3,
                    'name': 'Commercial',
                    'code': 'DEPT-SALES',
                    'axisId': 2,
                    'balance': 200000.0,
                },
            ]
            
            if axis_id:
                accounts = [a for a in accounts if a['axisId'] == int(axis_id)]
            
            return self._success_response({'accounts': accounts})

        except Exception as e:
            _logger.error(f"Erreur get_analytic_accounts: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/analytics/distribution', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_distribution(self, **params):
        """
        Répartition montants par axe analytique
        
        Query params:
        - axis_id: int
        - date_from: YYYY-MM-DD
        - date_to: YYYY-MM-DD
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            
            distribution = [
                {
                    'accountId': 1,
                    'accountName': 'Projet Alpha',
                    'debit': 150000.0,
                    'credit': 25000.0,
                    'balance': 125000.0,
                    'percentage': 45.0,
                },
                {
                    'accountId': 2,
                    'accountName': 'Projet Beta',
                    'debit': 100000.0,
                    'credit': 15000.0,
                    'balance': 85000.0,
                    'percentage': 30.5,
                },
            ]
            
            return self._success_response({'distribution': distribution})

        except Exception as e:
            _logger.error(f"Erreur get_distribution: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/analytics/cross-analysis', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_cross_analysis(self, **params):
        """
        Analyse croisée multi-axes (ex: Projet x Département)
        
        Query params:
        - axis1_id: int
        - axis2_id: int
        - date_from: YYYY-MM-DD
        - date_to: YYYY-MM-DD
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            
            # Matrice croisée : lignes = axe 1, colonnes = axe 2
            cross_data = {
                'axis1': {'id': 1, 'name': 'Projets'},
                'axis2': {'id': 2, 'name': 'Départements'},
                'matrix': [
                    {
                        'axis1Account': 'Projet Alpha',
                        'commercial': 50000.0,
                        'marketing': 30000.0,
                        'technique': 45000.0,
                        'total': 125000.0,
                    },
                    {
                        'axis1Account': 'Projet Beta',
                        'commercial': 40000.0,
                        'marketing': 20000.0,
                        'technique': 25000.0,
                        'total': 85000.0,
                    },
                ],
            }
            
            return self._success_response(cross_data)

        except Exception as e:
            _logger.error(f"Erreur get_cross_analysis: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)
