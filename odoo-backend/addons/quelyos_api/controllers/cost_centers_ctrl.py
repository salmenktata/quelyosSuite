# -*- coding: utf-8 -*-
"""Contrôleur Centres de Coûts"""

import logging
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class CostCentersController(BaseController):
    """API Gestion Centres de Coûts"""

    @http.route('/api/finance/cost-centers', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_cost_centers(self, **params):
        """
        Liste centres de coûts
        
        Query params:
        - active_only: bool
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            
            cost_centers = [
                {
                    'id': 1,
                    'name': 'Direction Générale',
                    'code': 'DG',
                    'type': 'operational',
                    'budget': 500000.0,
                    'actual': 420000.0,
                    'variance': -80000.0,
                    'variancePercent': -16.0,
                },
                {
                    'id': 2,
                    'name': 'Commercial',
                    'code': 'SALES',
                    'type': 'revenue',
                    'budget': 300000.0,
                    'actual': 340000.0,
                    'variance': 40000.0,
                    'variancePercent': 13.3,
                },
                {
                    'id': 3,
                    'name': 'Production',
                    'code': 'PROD',
                    'type': 'operational',
                    'budget': 800000.0,
                    'actual': 750000.0,
                    'variance': -50000.0,
                    'variancePercent': -6.25,
                },
            ]
            
            return self._success_response({'costCenters': cost_centers})

        except Exception as e:
            _logger.error(f"Erreur get_cost_centers: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/cost-centers/<int:center_id>/report', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def get_cost_center_report(self, center_id, **params):
        """
        Rapport détaillé par centre de coûts
        
        Query params:
        - period: YYYY-MM
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            
            report = {
                'center': {
                    'id': center_id,
                    'name': 'Commercial',
                    'code': 'SALES',
                },
                'summary': {
                    'budget': 300000.0,
                    'actual': 340000.0,
                    'variance': 40000.0,
                },
                'byCategory': [
                    {
                        'category': 'Salaires',
                        'budget': 180000.0,
                        'actual': 190000.0,
                        'variance': 10000.0,
                    },
                    {
                        'category': 'Marketing',
                        'budget': 80000.0,
                        'actual': 100000.0,
                        'variance': 20000.0,
                    },
                    {
                        'category': 'Déplacements',
                        'budget': 40000.0,
                        'actual': 50000.0,
                        'variance': 10000.0,
                    },
                ],
            }
            
            return self._success_response(report)

        except Exception as e:
            _logger.error(f"Erreur get_cost_center_report: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/cost-centers/comparison', type='json', auth='public', methods=['GET', 'OPTIONS'], csrf=False)
    def compare_cost_centers(self, **params):
        """
        Comparaison entre centres de coûts
        
        Query params:
        - period: YYYY-MM
        - metric: budget|actual|variance
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            
            comparison = [
                {
                    'centerName': 'Direction Générale',
                    'budget': 500000.0,
                    'actual': 420000.0,
                    'efficiency': 84.0,
                },
                {
                    'centerName': 'Commercial',
                    'budget': 300000.0,
                    'actual': 340000.0,
                    'efficiency': 113.3,
                },
                {
                    'centerName': 'Production',
                    'budget': 800000.0,
                    'actual': 750000.0,
                    'efficiency': 93.75,
                },
            ]
            
            return self._success_response({'comparison': comparison})

        except Exception as e:
            _logger.error(f"Erreur compare_cost_centers: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)
