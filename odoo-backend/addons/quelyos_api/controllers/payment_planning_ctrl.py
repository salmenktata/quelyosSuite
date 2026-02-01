# -*- coding: utf-8 -*-
"""
Contrôleur Planification Paiements Fournisseurs
Endpoints : /api/ecommerce/payment-planning/*
"""

from odoo import http
from odoo.http import request
import json
from datetime import datetime, timedelta
import logging

_logger = logging.getLogger(__name__)


class PaymentPlanningController(http.Controller):
    """Optimisation et planification paiements fournisseurs"""

    @http.route('/api/ecommerce/payment-planning/scenarios', type='http', auth='user', methods=['GET'], csrf=False)
    def list_scenarios(self, **params):
        """
        Liste scénarios de paiement sauvegardés
        
        Note : Fonctionnalité placeholder - retourne liste vide
        TODO : Implémenter modèle quelyos.payment.scenario
        """
        try:
            # Placeholder : retourner liste vide
            # Dans une implémentation complète, créer un modèle quelyos.payment.scenario
            
            return request.make_json_response({
                'success': True,
                'scenarios': [],
                'total_count': 0,
            })
            
        except Exception as e:
            _logger.error("Error listing payment scenarios: %s", str(e), exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': str(e),
            }, status=500)


    @http.route('/api/ecommerce/payment-planning/optimize', type='http', auth='user', methods=['POST'], csrf=False)
    def optimize_payment_plan(self, **params):
        """
        Optimise plan de paiement selon stratégie
        
        Body JSON :
            - strategy : BY_DUE_DATE | BY_IMPORTANCE | MINIMIZE_PENALTIES | MAXIMIZE_DISCOUNTS | OPTIMIZE_CASH_FLOW
            - maxDailyAmount : montant max par jour (optionnel)
            - targetCashReserve : réserve trésorerie cible
            - tenant_id : ID tenant (optionnel)
        """
        try:
            # Parse body
            body = json.loads(request.httprequest.data.decode('utf-8'))
            strategy = body.get('strategy', 'BY_DUE_DATE')
            max_daily_amount = body.get('maxDailyAmount')
            target_cash_reserve = body.get('targetCashReserve', 10000)
            tenant_id = body.get('tenant_id')
            
            # Récupérer factures non payées
            domain = [
                ('move_type', '=', 'in_invoice'),
                ('state', '=', 'posted'),
                ('payment_state', '!=', 'paid'),
            ]
            
            if tenant_id:
                domain.append(('tenant_id', '=', int(tenant_id)))
            
            invoices = request.env['account.move'].sudo().search(domain, order='invoice_date_due asc')
            
            # Calculer trésorerie disponible (simplifié)
            # Dans une vraie implémentation, récupérer depuis compte bancaire
            available_cash = 50000  # Placeholder
            
            # Générer plan selon stratégie
            plan = self._generate_payment_plan(invoices, strategy, max_daily_amount, target_cash_reserve, available_cash)
            
            # Calculer métriques
            metrics = self._calculate_metrics(plan, invoices)
            
            return request.make_json_response({
                'success': True,
                'plan': plan,
                'metrics': metrics,
                'availableCash': available_cash,
                'targetCashReserve': target_cash_reserve,
                'strategy': strategy,
            })
            
        except Exception as e:
            _logger.error("Error optimizing payment plan: %s", str(e), exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': str(e),
            }, status=500)


    def _generate_payment_plan(self, invoices, strategy, max_daily_amount, target_cash_reserve, available_cash):
        """Génère plan de paiement optimisé"""
        plan = []
        today = datetime.now().date()
        
        # Trier selon stratégie
        sorted_invoices = self._sort_by_strategy(invoices, strategy)
        
        # Affecter dates paiement
        current_date = today
        daily_total = 0
        
        for inv in sorted_invoices:
            amount = inv.amount_residual
            days_late = 0
            days_early = 0
            
            # Calculer retard/avance
            if inv.invoice_date_due:
                delta = (current_date - inv.invoice_date_due).days
                if delta > 0:
                    days_late = delta
                elif delta < 0:
                    days_early = abs(delta)
            
            # Calculer pénalités/remises (simplifié)
            penalty = days_late * 0.5 if days_late > 0 else 0
            discount = days_early * 0.2 if days_early > 0 else 0
            total_cost = amount + penalty - discount
            
            # Vérifier contraintes
            can_pay = True
            reason = "Planifié"
            status = "scheduled"
            
            if max_daily_amount and (daily_total + amount) > max_daily_amount:
                current_date += timedelta(days=1)
                daily_total = 0
            
            if (available_cash - total_cost) < target_cash_reserve:
                can_pay = False
                status = "insufficient_funds"
                reason = "Fonds insuffisants"
            
            if can_pay:
                scheduled_date = current_date.isoformat()
                daily_total += amount
                available_cash -= total_cost
            else:
                scheduled_date = None
            
            # Calculer score priorité (0-100)
            score = self._calculate_priority_score(inv, strategy, days_late, days_early)
            
            plan.append({
                'invoiceId': str(inv.id),
                'supplierId': str(inv.partner_id.id),
                'supplierName': inv.partner_id.name,
                'invoiceNumber': inv.name,
                'amount': amount,
                'penalty': penalty,
                'discount': discount,
                'totalCost': total_cost,
                'daysLate': days_late if days_late > 0 else None,
                'daysEarly': days_early if days_early > 0 else None,
                'dueDate': inv.invoice_date_due.isoformat() if inv.invoice_date_due else None,
                'scheduledDate': scheduled_date,
                'score': score,
                'status': status,
                'reason': reason,
            })
        
        return plan


    def _sort_by_strategy(self, invoices, strategy):
        """Trie factures selon stratégie"""
        if strategy == 'BY_DUE_DATE':
            return sorted(invoices, key=lambda inv: inv.invoice_date_due or datetime.max.date())
        
        elif strategy == 'MINIMIZE_PENALTIES':
            # Prioriser factures proches échéance
            today = datetime.now().date()
            return sorted(invoices, key=lambda inv: 
                abs((inv.invoice_date_due - today).days) if inv.invoice_date_due else 999)
        
        elif strategy == 'MAXIMIZE_DISCOUNTS':
            # Payer en avance pour remises
            return sorted(invoices, key=lambda inv: inv.invoice_date_due or datetime.min.date())
        
        elif strategy == 'BY_IMPORTANCE':
            # Prioriser montants élevés
            return sorted(invoices, key=lambda inv: inv.amount_residual, reverse=True)
        
        else:  # OPTIMIZE_CASH_FLOW
            # Équilibre entre tous facteurs
            return sorted(invoices, key=lambda inv: inv.invoice_date_due or datetime.max.date())


    def _calculate_priority_score(self, inv, strategy, days_late, days_early):
        """Calcule score priorité 0-100"""
        score = 50  # Score base
        
        if days_late > 0:
            score += min(days_late * 2, 50)  # Max +50 pour retard
        elif days_early > 0:
            score -= min(days_early, 30)  # Max -30 pour avance
        
        if strategy == 'BY_IMPORTANCE' and inv.amount_residual > 10000:
            score += 20
        
        return max(0, min(100, score))


    def _calculate_metrics(self, plan, invoices):
        """Calcule métriques du plan"""
        total_invoices = len(invoices)
        scheduled = len([p for p in plan if p['status'] == 'scheduled'])
        insufficient = len([p for p in plan if p['status'] == 'insufficient_funds'])
        
        total_amount = sum(p['amount'] for p in plan)
        total_penalties = sum(p.get('penalty', 0) for p in plan)
        total_discounts = sum(p.get('discount', 0) for p in plan)
        total_cost = sum(p.get('totalCost', 0) for p in plan)
        
        payments_on_time = len([p for p in plan if p['status'] == 'scheduled' and (p.get('daysLate', 0) or 0) == 0])
        payments_late = len([p for p in plan if p.get('daysLate', 0) and p['daysLate'] > 0])
        
        return {
            'totalInvoices': total_invoices,
            'scheduledInvoices': scheduled,
            'insufficientFunds': insufficient,
            'totalAmount': total_amount,
            'totalPenalties': total_penalties,
            'totalDiscounts': total_discounts,
            'totalCost': total_cost,
            'netSavings': total_discounts - total_penalties,
            'paymentsOnTime': payments_on_time,
            'paymentsLate': payments_late,
            'onTimeRate': (payments_on_time / total_invoices * 100) if total_invoices > 0 else 0,
            'averagePaymentDelay': f"{payments_late / total_invoices:.1f} jours" if total_invoices > 0 else "0 jours",
        }


    @http.route('/api/ecommerce/payment-planning/export-excel', type='http', auth='user', methods=['POST'], csrf=False)
    def export_excel(self, **params):
        """
        Exporte plan paiement en Excel
        
        Note : Fonctionnalité placeholder
        TODO : Implémenter export Excel avec xlsxwriter
        """
        try:
            # Placeholder : retourner erreur 501 Not Implemented
            return request.make_json_response({
                'success': False,
                'error': 'Export Excel non implémenté - TODO',
            }, status=501)
            
        except Exception as e:
            _logger.error("Error exporting payment plan: %s", str(e), exc_info=True)
            return request.make_json_response({
                'success': False,
                'error': str(e),
            }, status=500)
