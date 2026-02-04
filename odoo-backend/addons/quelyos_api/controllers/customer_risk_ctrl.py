# -*- coding: utf-8 -*-
"""
Contrôleur API Scoring Risque & Relances IA

Endpoints :
- POST /api/finance/customer-risk/score : Calculer score risque client
- POST /api/finance/customer-risk/list : Liste scores tous clients
- POST /api/finance/reminders/sequences : Liste séquences relances configurées
- POST /api/finance/reminders/create-sequence : Créer séquence relance
- POST /api/finance/reminders/trigger : Forcer relance manuelle
- POST /api/finance/reminders/stats : Statistiques relances
"""

import logging
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class CustomerRiskController(BaseController):
    """API Scoring Risque Impayé & Relances"""

    @http.route('/api/finance/customer-risk/score', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def get_customer_risk_score(self, **params):
        """
        Calculer ou récupérer score risque client

        Body:
        {
          "partner_id": 123,  // ID client
          "force_recompute": false  // Force recalcul (sinon cache)
        }

        Returns:
        {
          "success": true,
          "data": {
            "score": 75,
            "category": "high",
            "last_computed": "2026-02-04T21:30:00",
            "confidence": 82.5,
            "features": {
              "avg_payment_delay": 12.5,
              "late_payment_rate": 35.0,
              "total_overdue": 15000.0,
              ...
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
            force_recompute = data.get('force_recompute', False)

            if not partner_id:
                return self._error_response("partner_id requis", "VALIDATION_ERROR", 400)

            RiskScore = request.env['quelyos.customer_risk_score'].sudo()

            # Récupérer score existant
            existing_score = RiskScore.search([
                ('tenant_id', '=', tenant_id),
                ('partner_id', '=', partner_id),
            ], limit=1)

            # Forcer recalcul ou score pas à jour (>7 jours)
            if force_recompute or not existing_score:
                score_data = RiskScore.compute_customer_score(tenant_id, partner_id)
            else:
                score_data = {
                    'score': existing_score.score,
                    'category': existing_score.score_category,
                    'confidence': existing_score.confidence,
                    'features': {
                        'avg_payment_delay': existing_score.avg_payment_delay,
                        'late_payment_rate': existing_score.late_payment_rate,
                        'total_overdue': existing_score.total_overdue,
                        'relationship_months': existing_score.relationship_months,
                        'reminder_count': existing_score.reminder_count,
                    }
                }
                score_data['last_computed'] = existing_score.last_computed.isoformat() if existing_score.last_computed else None

            _logger.info(
                f"Score risque récupéré pour client {partner_id} (tenant {tenant_id}): "
                f"{score_data['score']} ({score_data['category']})"
            )

            return self._success_response(score_data)

        except Exception as e:
            _logger.error(f"Erreur get_customer_risk_score: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/customer-risk/list', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def list_customer_risk_scores(self, **params):
        """
        Liste scores risque tous clients

        Body:
        {
          "category": "high",  // Optionnel : filtrer par catégorie (low/medium/high/critical)
          "min_score": 70,  // Optionnel : score minimum
          "limit": 50,
          "offset": 0
        }

        Returns:
        {
          "success": true,
          "data": {
            "scores": [
              {
                "partner_id": 123,
                "partner_name": "Acme Corp",
                "score": 85,
                "category": "critical",
                "total_overdue": 25000.0,
                "last_computed": "2026-02-04T..."
              },
              ...
            ],
            "count": 45
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
            category = data.get('category')
            min_score = data.get('min_score')
            limit = int(data.get('limit', 50))
            offset = int(data.get('offset', 0))

            RiskScore = request.env['quelyos.customer_risk_score'].sudo()

            # Domaine filtres
            domain = [('tenant_id', '=', tenant_id)]
            if category:
                domain.append(('score_category', '=', category))
            if min_score:
                domain.append(('score', '>=', min_score))

            # Récupérer scores
            scores = RiskScore.search(domain, limit=limit, offset=offset, order='score desc')
            total_count = RiskScore.search_count(domain)

            # Sérialiser
            scores_data = [{
                'id': s.id,
                'partner_id': s.partner_id.id,
                'partner_name': s.partner_id.name,
                'score': s.score,
                'category': s.score_category,
                'total_overdue': float(s.total_overdue),
                'avg_payment_delay': float(s.avg_payment_delay),
                'late_payment_rate': float(s.late_payment_rate),
                'confidence': float(s.confidence),
                'last_computed': s.last_computed.isoformat() if s.last_computed else None,
            } for s in scores]

            return self._success_response({
                'scores': scores_data,
                'count': total_count,
            })

        except Exception as e:
            _logger.error(f"Erreur list_customer_risk_scores: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/reminders/sequences', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def list_reminder_sequences(self, **params):
        """
        Liste séquences relances configurées

        Returns:
        {
          "success": true,
          "data": {
            "sequences": [
              {
                "id": 1,
                "name": "Relance courtoise J+5",
                "days_after_due": 5,
                "risk_score_min": 70,
                "action_email": true,
                "email_tone": "friendly",
                "total_sent": 150,
                "conversion_rate": 25.5
              },
              ...
            ]
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

            Sequence = request.env['quelyos.payment_reminder_sequence'].sudo()

            sequences = Sequence.search([
                ('tenant_id', '=', tenant_id),
                ('active', '=', True),
            ], order='days_after_due asc')

            sequences_data = [{
                'id': seq.id,
                'name': seq.name,
                'days_after_due': seq.days_after_due,
                'risk_score_min': seq.risk_score_min,
                'action_email': seq.action_email,
                'action_sms': seq.action_sms,
                'action_call': seq.action_call,
                'action_suspend_delivery': seq.action_suspend_delivery,
                'action_notify_legal': seq.action_notify_legal,
                'email_tone': seq.email_tone,
                'email_send_time': seq.email_send_time,
                'ab_testing_enabled': seq.ab_testing_enabled,
                'total_sent': seq.total_sent,
                'total_opened': seq.total_opened,
                'total_paid': seq.total_paid,
                'conversion_rate': float(seq.conversion_rate),
            } for seq in sequences]

            return self._success_response({
                'sequences': sequences_data,
                'count': len(sequences_data),
            })

        except Exception as e:
            _logger.error(f"Erreur list_reminder_sequences: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/reminders/stats', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def get_reminder_stats(self, **params):
        """
        Statistiques globales relances

        Returns:
        {
          "success": true,
          "data": {
            "total_sent": 1250,
            "total_opened": 850,
            "total_paid": 320,
            "avg_conversion_rate": 25.6,
            "by_tone": {
              "friendly": {"sent": 500, "conversion": 28.0},
              "formal": {"sent": 750, "conversion": 23.5}
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

            Sequence = request.env['quelyos.payment_reminder_sequence'].sudo()

            sequences = Sequence.search([('tenant_id', '=', tenant_id)])

            # Agrégats globaux
            total_sent = sum(seq.total_sent for seq in sequences)
            total_opened = sum(seq.total_opened for seq in sequences)
            total_paid = sum(seq.total_paid for seq in sequences)
            avg_conversion = (total_paid / total_sent * 100) if total_sent > 0 else 0.0

            # Stats par ton
            by_tone = {}
            for tone in ['friendly', 'neutral', 'formal', 'strict']:
                seqs_tone = sequences.filtered(lambda s: s.email_tone == tone)
                tone_sent = sum(seq.total_sent for seq in seqs_tone)
                tone_paid = sum(seq.total_paid for seq in seqs_tone)
                by_tone[tone] = {
                    'sent': tone_sent,
                    'conversion': (tone_paid / tone_sent * 100) if tone_sent > 0 else 0.0,
                }

            return self._success_response({
                'total_sent': total_sent,
                'total_opened': total_opened,
                'total_paid': total_paid,
                'avg_conversion_rate': round(avg_conversion, 2),
                'by_tone': by_tone,
            })

        except Exception as e:
            _logger.error(f"Erreur get_reminder_stats: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)
