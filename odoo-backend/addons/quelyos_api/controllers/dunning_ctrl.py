# -*- coding: utf-8 -*-
"""
Contrôleur API Dunning - Gestion Paiements Échoués

Endpoints :
- POST /api/finance/subscriptions/dunning/dashboard : Dashboard dunning (à risque)
- POST /api/finance/subscriptions/dunning/attempts : Liste tentatives
- POST /api/finance/subscriptions/dunning/retry : Retry manuel immédiat
- POST /api/finance/subscriptions/dunning/skip : Ignorer tentative planifiée
- POST /api/finance/subscriptions/dunning/stats : Statistiques dunning
"""

import logging
from datetime import datetime, timedelta
from odoo import http
from odoo.http import request
from .base import BaseController

_logger = logging.getLogger(__name__)


class DunningController(BaseController):
    """API Dunning - Retry Paiements Échoués"""

    @http.route('/api/finance/subscriptions/dunning/dashboard', type='json', auth='public', methods=['POST'], csrf=False)
    def get_dunning_dashboard(self, **params):
        """
        Dashboard dunning : Subscriptions à risque + tentatives en cours

        Returns:
        {
          "success": true,
          "data": {
            "at_risk_subscriptions": [
              {
                "id": 42,
                "partner_name": "ACME Corp",
                "plan_name": "Pro",
                "mrr": 299.0,
                "state": "past_due",
                "last_attempt": {
                  "attempt_number": 2,
                  "attempt_date": "2026-02-03T10:00:00Z",
                  "state": "failed",
                  "failure_reason": "insufficient_funds"
                },
                "next_attempt": {
                  "scheduled_date": "2026-02-07T10:00:00Z",
                  "days_until": 4
                }
              }
            ],
            "summary": {
              "total_at_risk": 12,
              "total_mrr_at_risk": 3588.0,
              "scheduled_retries_today": 5,
              "success_rate_last_30_days": 42.5
            }
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = user.tenant_id.id
            Subscription = request.env['quelyos.subscription'].sudo()
            DunningAttempt = request.env['quelyos.dunning.attempt'].sudo()

            # Subscriptions à risque (past_due)
            at_risk_subs = Subscription.search([
                ('tenant_id', '=', tenant_id),
                ('state', '=', 'past_due'),
            ])

            at_risk_data = []
            total_mrr_at_risk = 0.0

            for sub in at_risk_subs:
                # Dernière tentative
                last_attempt = DunningAttempt.search([
                    ('subscription_id', '=', sub.id),
                ], order='attempt_date desc', limit=1)

                # Prochaine tentative planifiée
                next_attempt = DunningAttempt.search([
                    ('subscription_id', '=', sub.id),
                    ('state', '=', 'scheduled'),
                ], order='scheduled_date asc', limit=1)

                last_attempt_data = None
                if last_attempt:
                    last_attempt_data = {
                        'attempt_number': last_attempt.attempt_number,
                        'attempt_date': last_attempt.attempt_date.isoformat() if last_attempt.attempt_date else None,
                        'state': last_attempt.state,
                        'failure_reason': last_attempt.failure_reason,
                    }

                next_attempt_data = None
                if next_attempt:
                    days_until = (next_attempt.scheduled_date.date() - datetime.now().date()).days if next_attempt.scheduled_date else 0
                    next_attempt_data = {
                        'scheduled_date': next_attempt.scheduled_date.isoformat() if next_attempt.scheduled_date else None,
                        'days_until': days_until,
                        'attempt_number': next_attempt.attempt_number,
                    }

                at_risk_data.append({
                    'id': sub.id,
                    'partner_name': sub.partner_id.name,
                    'plan_name': sub.plan_id.name,
                    'mrr': sub.mrr,
                    'state': sub.state,
                    'last_attempt': last_attempt_data,
                    'next_attempt': next_attempt_data,
                })

                total_mrr_at_risk += sub.mrr

            # Stats summary
            today = datetime.now().date()
            scheduled_today = DunningAttempt.search_count([
                ('tenant_id', '=', tenant_id),
                ('state', '=', 'scheduled'),
                ('scheduled_date', '>=', datetime.combine(today, datetime.min.time())),
                ('scheduled_date', '<', datetime.combine(today + timedelta(days=1), datetime.min.time())),
            ])

            # Taux succès 30 derniers jours
            thirty_days_ago = datetime.now() - timedelta(days=30)
            recent_attempts = DunningAttempt.search([
                ('tenant_id', '=', tenant_id),
                ('attempt_date', '>=', thirty_days_ago),
                ('state', 'in', ['success', 'failed']),
            ])

            success_count = len(recent_attempts.filtered(lambda a: a.state == 'success'))
            total_count = len(recent_attempts)
            success_rate = (success_count / total_count * 100) if total_count > 0 else 0.0

            summary = {
                'total_at_risk': len(at_risk_subs),
                'total_mrr_at_risk': round(total_mrr_at_risk, 2),
                'scheduled_retries_today': scheduled_today,
                'success_rate_last_30_days': round(success_rate, 2),
            }

            return self._success_response({
                'at_risk_subscriptions': at_risk_data,
                'summary': summary,
            })

        except Exception as e:
            _logger.error(f"Erreur get_dunning_dashboard: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/subscriptions/dunning/attempts', type='json', auth='public', methods=['POST'], csrf=False)
    def get_dunning_attempts(self, **params):
        """
        Liste tentatives dunning (historique)

        Query params:
        - subscription_id: Filtrer par subscription
        - state: Filtrer par état (scheduled, success, failed)
        - limit: Nombre max résultats (default: 50)

        Returns:
        {
          "success": true,
          "data": {
            "attempts": [...]
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            data = request.jsonrequest
            tenant_id = user.tenant_id.id
            DunningAttempt = request.env['quelyos.dunning.attempt'].sudo()

            # Filtres
            domain = [('tenant_id', '=', tenant_id)]

            subscription_id = data.get('subscription_id')
            if subscription_id:
                domain.append(('subscription_id', '=', int(subscription_id)))

            state = data.get('state')
            if state:
                domain.append(('state', '=', state))

            limit = data.get('limit', 50)

            # Recherche
            attempts = DunningAttempt.search(domain, order='attempt_date desc', limit=limit)

            # Formater
            attempts_data = [{
                'id': a.id,
                'subscription_id': a.subscription_id.id,
                'subscription_name': a.subscription_id.name,
                'partner_name': a.partner_id.name,
                'attempt_number': a.attempt_number,
                'attempt_date': a.attempt_date.isoformat() if a.attempt_date else None,
                'scheduled_date': a.scheduled_date.isoformat() if a.scheduled_date else None,
                'state': a.state,
                'amount': a.amount,
                'failure_reason': a.failure_reason,
                'email_sent': a.email_sent,
            } for a in attempts]

            return self._success_response({
                'attempts': attempts_data,
                'count': len(attempts_data),
            })

        except Exception as e:
            _logger.error(f"Erreur get_dunning_attempts: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/subscriptions/dunning/retry', type='json', auth='public', methods=['POST'], csrf=False)
    def retry_payment_now(self, **params):
        """
        Retry manuel immédiat (bypass planification)

        Body:
        {
          "subscription_id": 42
        }

        Returns:
        {
          "success": true,
          "data": {
            "message": "Retry déclenché",
            "attempt_id": 123,
            "result": "success" | "failed"
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            data = request.jsonrequest
            subscription_id = data.get('subscription_id')

            if not subscription_id:
                return self._error_response("subscription_id requis", "VALIDATION_ERROR", 400)

            DunningAttempt = request.env['quelyos.dunning.attempt'].sudo()
            Subscription = request.env['quelyos.subscription'].sudo()

            subscription = Subscription.browse(int(subscription_id))

            if not subscription.exists():
                return self._error_response("Subscription introuvable", "NOT_FOUND", 404)

            # Créer tentative immédiate
            attempt = DunningAttempt.create({
                'subscription_id': subscription.id,
                'attempt_number': 0,  # Manuel = 0
                'scheduled_date': datetime.now(),
                'state': 'scheduled',
                'amount': subscription.mrr,
                'notes': 'Retry manuel déclenché par utilisateur',
            })

            # Traiter immédiatement
            result = attempt.action_process_retry()

            return self._success_response({
                'message': 'Retry déclenché',
                'attempt_id': attempt.id,
                'result': 'success' if result else 'failed',
            })

        except Exception as e:
            _logger.error(f"Erreur retry_payment_now: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/subscriptions/dunning/skip', type='json', auth='public', methods=['POST'], csrf=False)
    def skip_attempt(self, **params):
        """
        Ignorer tentative planifiée

        Body:
        {
          "attempt_id": 123
        }

        Returns:
        {
          "success": true,
          "data": {
            "message": "Tentative ignorée"
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            data = request.jsonrequest
            attempt_id = data.get('attempt_id')

            if not attempt_id:
                return self._error_response("attempt_id requis", "VALIDATION_ERROR", 400)

            DunningAttempt = request.env['quelyos.dunning.attempt'].sudo()
            attempt = DunningAttempt.browse(int(attempt_id))

            if not attempt.exists():
                return self._error_response("Tentative introuvable", "NOT_FOUND", 404)

            if attempt.state != 'scheduled':
                return self._error_response("Seules tentatives planifiées peuvent être ignorées", "VALIDATION_ERROR", 400)

            # Marquer comme ignorée
            attempt.write({
                'state': 'skipped',
                'notes': 'Ignorée manuellement par utilisateur',
            })

            return self._success_response({
                'message': 'Tentative ignorée',
            })

        except Exception as e:
            _logger.error(f"Erreur skip_attempt: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    @http.route('/api/finance/subscriptions/dunning/stats', type='json', auth='public', methods=['POST'], csrf=False)
    def get_dunning_stats(self, **params):
        """
        Statistiques dunning (mensuel)

        Returns:
        {
          "success": true,
          "data": {
            "current_month": {
              "total_attempts": 45,
              "success_count": 19,
              "failed_count": 26,
              "success_rate": 42.22,
              "revenue_recovered": 5681.0,
              "revenue_lost": 7794.0
            }
          }
        }
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = user.tenant_id.id
            DunningAttempt = request.env['quelyos.dunning.attempt'].sudo()

            # Mois en cours
            today = datetime.now().date()
            month_start = today.replace(day=1)
            next_month = month_start.replace(day=28) + timedelta(days=4)
            month_end = (next_month - timedelta(days=next_month.day)).replace(day=1) + timedelta(days=31)
            month_end = month_end.replace(day=1) - timedelta(days=1)

            # Tentatives du mois
            attempts = DunningAttempt.search([
                ('tenant_id', '=', tenant_id),
                ('attempt_date', '>=', datetime.combine(month_start, datetime.min.time())),
                ('attempt_date', '<=', datetime.combine(month_end, datetime.max.time())),
                ('state', 'in', ['success', 'failed']),
            ])

            success_attempts = attempts.filtered(lambda a: a.state == 'success')
            failed_attempts = attempts.filtered(lambda a: a.state == 'failed')

            total_attempts = len(attempts)
            success_count = len(success_attempts)
            failed_count = len(failed_attempts)
            success_rate = (success_count / total_attempts * 100) if total_attempts > 0 else 0.0

            revenue_recovered = sum(success_attempts.mapped('amount'))
            revenue_lost = sum(failed_attempts.mapped('amount'))

            return self._success_response({
                'current_month': {
                    'total_attempts': total_attempts,
                    'success_count': success_count,
                    'failed_count': failed_count,
                    'success_rate': round(success_rate, 2),
                    'revenue_recovered': round(revenue_recovered, 2),
                    'revenue_lost': round(revenue_lost, 2),
                }
            })

        except Exception as e:
            _logger.error(f"Erreur get_dunning_stats: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)
