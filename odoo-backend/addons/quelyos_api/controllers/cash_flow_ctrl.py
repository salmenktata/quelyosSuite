# -*- coding: utf-8 -*-
"""
Contrôleur Cash Flow Forecasting & DSO

Endpoints :
- POST /api/finance/cash-flow/predict : Prédiction trésorerie 30/60/90j
- POST /api/finance/dso/calculate : Calcul DSO global ou par client
- POST /api/finance/cash-flow/history : Historique prédictions
"""

import logging
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class CashFlowController(BaseController):
    """API Cash Flow Forecasting"""

    @http.route('/api/finance/cash-flow/predict', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def predict_cash_flow(self, **params):
        """
        Prédiction cash flow 30/60/90 jours

        Body:
        {
          "horizon_days": 30  // 30, 60 ou 90
        }

        Returns:
        {
          "success": true,
          "data": {
            "predicted_inflow": 150000.0,
            "predicted_outflow": 120000.0,
            "predicted_balance": 30000.0,
            "confidence_score": 85.0,
            "weeks": [
              {
                "week_start": "2026-02-10",
                "predicted_inflow": 37500.0,
                "predicted_outflow": 30000.0,
                "predicted_balance": 7500.0,
                "is_at_risk": false
              },
              // ... autres semaines
            ]
          }
        }
        """
        try:
            # Authentification
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            if not tenant_id:
                return self._error_response("Tenant non trouvé", "FORBIDDEN", 403)

            # Paramètres
            data = request.jsonrequest
            horizon_days = int(data.get('horizon_days', 30))

            # Validation
            if horizon_days not in [30, 60, 90]:
                return self._error_response(
                    "horizon_days doit être 30, 60 ou 90",
                    "VALIDATION_ERROR",
                    400
                )

            # Prédiction ML
            CashFlowForecast = request.env['quelyos.cash_flow_forecast'].sudo()
            prediction = CashFlowForecast.predict_cash_flow(tenant_id, horizon_days)

            _logger.info(
                f"Prédiction cash flow {horizon_days}j pour tenant {tenant_id}: "
                f"solde prévu {prediction['predicted_balance']:.2f}"
            )

            return self._success_response(prediction)

        except Exception as e:
            _logger.error(f"Erreur predict_cash_flow: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/dso/calculate', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def calculate_dso(self, **params):
        """
        Calcul DSO (Days Sales Outstanding)

        Body:
        {
          "partner_id": 123  // Optionnel, si calcul pour client spécifique
        }

        Returns:
        {
          "success": true,
          "data": {
            "dso": 45.3,  // Jours
            "receivables": 75000.0,  // Créances
            "revenue": 150000.0,  // CA période
            "period_days": 30,
            "benchmark": {
              "industry_avg": 30.0,  // Moyenne industrie (si disponible)
              "status": "warning"  // "good", "warning", "critical"
            }
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            if not tenant_id:
                return self._error_response("Tenant non trouvé", "FORBIDDEN", 403)

            # Paramètres
            data = request.jsonrequest
            partner_id = data.get('partner_id')

            # Calcul DSO
            CashFlowForecast = request.env['quelyos.cash_flow_forecast'].sudo()
            dso_data = CashFlowForecast.calculate_dso(tenant_id, partner_id)

            # Ajout benchmark (valeurs indicatives par secteur)
            # TODO: Récupérer vraies stats secteur depuis API externe
            industry_avg = 30.0  # E-commerce moyenne
            dso = dso_data['dso']

            if dso <= industry_avg:
                status = 'good'
            elif dso <= industry_avg * 1.5:
                status = 'warning'
            else:
                status = 'critical'

            dso_data['benchmark'] = {
                'industry_avg': industry_avg,
                'status': status,
            }

            _logger.info(f"DSO calculé pour tenant {tenant_id}: {dso:.1f} jours")

            return self._success_response(dso_data)

        except Exception as e:
            _logger.error(f"Erreur calculate_dso: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/cash-flow/history', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def get_cash_flow_history(self, **params):
        """
        Historique prédictions vs réalité (pour tracking précision)

        Body:
        {
          "limit": 10  // Dernières N prédictions
        }

        Returns:
        {
          "success": true,
          "data": {
            "forecasts": [
              {
                "date": "2026-02-01",
                "horizon_days": 30,
                "predicted_balance": 30000.0,
                "actual_balance": 28500.0,
                "accuracy": 95.0,
                "confidence_score": 85.0
              },
              // ...
            ],
            "avg_accuracy": 92.5  // Moyenne précision
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            if not tenant_id:
                return self._error_response("Tenant non trouvé", "FORBIDDEN", 403)

            # Paramètres
            data = request.jsonrequest
            limit = int(data.get('limit', 10))

            # Récupérer historique
            CashFlowForecast = request.env['quelyos.cash_flow_forecast'].sudo()
            forecasts = CashFlowForecast.search([
                ('tenant_id', '=', tenant_id),
            ], limit=limit, order='date desc')

            # Sérialiser
            forecasts_data = [{
                'id': f.id,
                'date': f.date.isoformat() if f.date else None,
                'horizon_days': f.horizon_days,
                'predicted_inflow': float(f.predicted_inflow),
                'predicted_outflow': float(f.predicted_outflow),
                'predicted_balance': float(f.predicted_balance),
                'actual_inflow': float(f.actual_inflow) if f.actual_inflow else None,
                'actual_outflow': float(f.actual_outflow) if f.actual_outflow else None,
                'actual_balance': float(f.actual_balance) if f.actual_balance else None,
                'accuracy': float(f.accuracy) if f.accuracy else None,
                'confidence_score': float(f.confidence_score) if f.confidence_score else None,
            } for f in forecasts]

            # Calculer précision moyenne
            accuracies = [f['accuracy'] for f in forecasts_data if f['accuracy']]
            avg_accuracy = sum(accuracies) / len(accuracies) if accuracies else 0.0

            return self._success_response({
                'forecasts': forecasts_data,
                'avg_accuracy': round(avg_accuracy, 1),
                'count': len(forecasts_data),
            })

        except Exception as e:
            _logger.error(f"Erreur get_cash_flow_history: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)
