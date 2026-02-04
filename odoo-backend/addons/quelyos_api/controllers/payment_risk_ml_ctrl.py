# -*- coding: utf-8 -*-
import json
import logging
from datetime import datetime, timedelta
from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)


class PaymentRiskMLController(http.Controller):
    """
    Contrôleur ML Prédiction Retards de Paiement
    Scoring prédictif basé sur historique comportemental client
    """

    def _authenticate_from_header(self):
        """Authentification depuis header Authorization"""
        auth_header = request.httprequest.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header[7:]
        AuthToken = request.env['quelyos.auth_token'].sudo()
        auth_record = AuthToken.search([('token', '=', token), ('expires_at', '>', datetime.now())], limit=1)

        if auth_record and auth_record.user_id:
            return auth_record.user_id
        return None

    def _get_tenant_id(self, user):
        """Récupérer tenant_id de l'utilisateur"""
        if user and user.tenant_id:
            return user.tenant_id.id
        return None

    def _success_response(self, data, message=None):
        """Format réponse succès standardisé"""
        return json.dumps({'success': True, 'data': data, 'message': message})

    def _error_response(self, error, code="ERROR", status=400):
        """Format réponse erreur standardisé"""
        response = json.dumps({'success': False, 'error': error, 'code': code})
        return request.make_response(response, status=status, headers=[('Content-Type', 'application/json')])

    @http.route('/api/finance/payment-risk/predict', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def predict_payment_risk(self, **params):
        """
        Prédiction risque retard paiement pour un client
        Scoring ML basé sur : historique paiements, délais moyens, fréquence retards, montants
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            data = request.jsonrequest

            # Client à analyser
            customer_id = data.get('customerId')
            if not customer_id:
                return self._error_response("customerId requis", "VALIDATION_ERROR", 400)

            Partner = request.env['res.partner'].sudo()
            AccountMove = request.env['account.move'].sudo()

            customer = Partner.browse(int(customer_id))
            if not customer.exists() or customer.tenant_id.id != tenant_id:
                return self._error_response("Client introuvable", "NOT_FOUND", 404)

            # Récupérer factures client (12 derniers mois)
            date_from = datetime.now().date() - timedelta(days=365)
            invoices = AccountMove.search([
                ('partner_id', '=', customer.id),
                ('tenant_id', '=', tenant_id),
                ('move_type', '=', 'out_invoice'),
                ('state', '=', 'posted'),
                ('invoice_date', '>=', str(date_from)),
            ], order='invoice_date desc')

            if not invoices:
                return self._success_response({
                    'riskScore': 0,
                    'riskLevel': 'unknown',
                    'confidence': 'low',
                    'message': 'Pas assez de données historiques (nouveau client)',
                    'features': {},
                })

            # Feature Engineering (extraction caractéristiques)
            features = self._extract_payment_features(invoices, customer)

            # Scoring (algorithme heuristique pondéré)
            risk_score = self._calculate_risk_score(features)

            # Classification
            risk_level = self._classify_risk(risk_score)

            # Confiance basée sur volume données
            confidence = 'high' if len(invoices) >= 10 else ('medium' if len(invoices) >= 5 else 'low')

            # Recommandations
            recommendations = self._generate_recommendations(risk_level, features)

            return self._success_response({
                'customerId': customer.id,
                'customerName': customer.name,
                'riskScore': round(risk_score, 2),
                'riskLevel': risk_level,
                'confidence': confidence,
                'features': features,
                'recommendations': recommendations,
                'invoicesAnalyzed': len(invoices),
            })

        except Exception as e:
            _logger.error(f"Erreur predict_payment_risk: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)

    def _extract_payment_features(self, invoices, customer):
        """Extraction features pour ML scoring"""
        total_invoices = len(invoices)
        paid_invoices = invoices.filtered(lambda inv: inv.payment_state == 'paid')
        late_invoices = []

        total_amount = 0.0
        total_delay_days = 0
        delays_count = 0

        for invoice in paid_invoices:
            total_amount += float(invoice.amount_total)

            # Calculer retard si payé après échéance
            if invoice.invoice_date_due and invoice.invoice_payment_date:
                due_date = invoice.invoice_date_due
                payment_date = invoice.invoice_payment_date

                if payment_date > due_date:
                    delay_days = (payment_date - due_date).days
                    total_delay_days += delay_days
                    delays_count += 1
                    late_invoices.append(invoice)

        # Features calculées
        late_payment_rate = (len(late_invoices) / total_invoices * 100) if total_invoices > 0 else 0
        avg_delay_days = (total_delay_days / delays_count) if delays_count > 0 else 0
        avg_invoice_amount = (total_amount / len(paid_invoices)) if paid_invoices else 0

        # Unpaid invoices overdue
        now = datetime.now().date()
        overdue_invoices = invoices.filtered(
            lambda inv: inv.payment_state != 'paid' and inv.invoice_date_due and inv.invoice_date_due < now
        )
        overdue_amount = sum(float(inv.amount_residual) for inv in overdue_invoices)

        # Payment terms (délai paiement moyen accordé)
        avg_payment_term_days = 30  # Default
        if paid_invoices and paid_invoices[0].invoice_payment_term_id:
            # Approximation basée sur le terme de paiement le plus récent
            payment_term = paid_invoices[0].invoice_payment_term_id
            # TODO: Calculer jours réels depuis payment_term.line_ids
            avg_payment_term_days = 30  # Simplification

        return {
            'totalInvoices': total_invoices,
            'paidInvoices': len(paid_invoices),
            'lateInvoices': len(late_invoices),
            'latePaymentRate': round(late_payment_rate, 2),
            'avgDelayDays': round(avg_delay_days, 2),
            'avgInvoiceAmount': round(avg_invoice_amount, 2),
            'overdueInvoices': len(overdue_invoices),
            'overdueAmount': round(overdue_amount, 2),
            'avgPaymentTermDays': avg_payment_term_days,
            'customerAgeDays': (datetime.now().date() - customer.create_date.date()).days if customer.create_date else 0,
        }

    def _calculate_risk_score(self, features):
        """
        Calcul score risque (0-100) avec pondération features
        100 = Risque très élevé, 0 = Aucun risque
        """
        score = 0.0

        # Critère 1 : Taux retards (poids 35%)
        late_rate = features['latePaymentRate']
        if late_rate >= 50:
            score += 35
        elif late_rate >= 30:
            score += 25
        elif late_rate >= 15:
            score += 15
        elif late_rate > 0:
            score += 5

        # Critère 2 : Délai moyen retard (poids 25%)
        avg_delay = features['avgDelayDays']
        if avg_delay >= 30:
            score += 25
        elif avg_delay >= 15:
            score += 18
        elif avg_delay >= 7:
            score += 10
        elif avg_delay > 0:
            score += 5

        # Critère 3 : Factures impayées en cours (poids 20%)
        overdue_count = features['overdueInvoices']
        if overdue_count >= 3:
            score += 20
        elif overdue_count == 2:
            score += 12
        elif overdue_count == 1:
            score += 5

        # Critère 4 : Montant impayé (poids 15%)
        overdue_amount = features['overdueAmount']
        avg_amount = features['avgInvoiceAmount']
        if avg_amount > 0:
            overdue_ratio = overdue_amount / avg_amount
            if overdue_ratio >= 3:
                score += 15
            elif overdue_ratio >= 2:
                score += 10
            elif overdue_ratio >= 1:
                score += 5

        # Critère 5 : Ancienneté client (poids 5%) - Bonus nouveaux clients
        customer_age_days = features['customerAgeDays']
        if customer_age_days < 90:
            score += 5  # Nouveau client = plus risqué

        return min(score, 100)  # Cap à 100

    def _classify_risk(self, score):
        """Classification niveau risque depuis score"""
        if score >= 70:
            return 'critical'
        elif score >= 50:
            return 'high'
        elif score >= 30:
            return 'medium'
        elif score >= 15:
            return 'low'
        else:
            return 'minimal'

    def _generate_recommendations(self, risk_level, features):
        """Génération recommandations actions basées sur risque"""
        recommendations = []

        if risk_level in ['critical', 'high']:
            recommendations.append("Exiger paiement avant livraison ou paiement à la commande")
            recommendations.append("Limiter ligne de crédit ou demander garantie bancaire")
            recommendations.append("Relances automatiques dès échéance dépassée")

            if features['overdueAmount'] > 0:
                recommendations.append(f"Recouvrer {features['overdueAmount']:.2f}€ impayés immédiatement")

        if risk_level == 'medium':
            recommendations.append("Réduire délais paiement (passer de 30j à 15j)")
            recommendations.append("Relances proactives avant échéance")
            recommendations.append("Suivi rapproché des paiements")

        if risk_level in ['low', 'minimal']:
            recommendations.append("Client fiable, maintenir conditions actuelles")
            if features['latePaymentRate'] > 0:
                recommendations.append("Rappel courtois si léger retard occasionnel")

        # Recommandation spécifique nouveaux clients
        if features['customerAgeDays'] < 90:
            recommendations.append("Nouveau client : surveiller premiers paiements")

        return recommendations

    @http.route('/api/finance/payment-risk/batch-predict', type='json', auth='public', methods=['POST', 'OPTIONS'], csrf=False)
    def batch_predict_payment_risk(self, **params):
        """
        Prédiction risque pour plusieurs clients (batch)
        Retourne top clients à risque triés par score décroissant
        """
        try:
            user = self._authenticate_from_header()
            if not user:
                return self._error_response("Session expirée", "UNAUTHORIZED", 401)

            tenant_id = self._get_tenant_id(user)
            data = request.jsonrequest

            # Paramètres
            top_n = int(data.get('topN', 20))
            min_risk_level = data.get('minRiskLevel', 'medium')  # minimal, low, medium, high, critical

            Partner = request.env['res.partner'].sudo()
            AccountMove = request.env['account.move'].sudo()

            # Récupérer tous clients avec factures
            customers_with_invoices = AccountMove.search([
                ('tenant_id', '=', tenant_id),
                ('move_type', '=', 'out_invoice'),
                ('state', '=', 'posted'),
            ]).mapped('partner_id')

            customers_with_invoices = customers_with_invoices.filtered(lambda p: p.customer_rank > 0)

            # Prédiction pour chaque client
            predictions = []
            for customer in customers_with_invoices[:100]:  # Limiter batch pour perfs
                try:
                    # Factures client (12 mois)
                    date_from = datetime.now().date() - timedelta(days=365)
                    invoices = AccountMove.search([
                        ('partner_id', '=', customer.id),
                        ('tenant_id', '=', tenant_id),
                        ('move_type', '=', 'out_invoice'),
                        ('state', '=', 'posted'),
                        ('invoice_date', '>=', str(date_from)),
                    ])

                    if len(invoices) < 3:  # Skip clients avec trop peu de données
                        continue

                    features = self._extract_payment_features(invoices, customer)
                    risk_score = self._calculate_risk_score(features)
                    risk_level = self._classify_risk(risk_score)

                    # Filtrer par niveau min
                    risk_levels_order = ['minimal', 'low', 'medium', 'high', 'critical']
                    if risk_levels_order.index(risk_level) >= risk_levels_order.index(min_risk_level):
                        predictions.append({
                            'customerId': customer.id,
                            'customerName': customer.name,
                            'riskScore': round(risk_score, 2),
                            'riskLevel': risk_level,
                            'latePaymentRate': features['latePaymentRate'],
                            'overdueAmount': features['overdueAmount'],
                            'avgDelayDays': features['avgDelayDays'],
                        })

                except Exception as customer_err:
                    _logger.warning(f"Skip customer {customer.id}: {customer_err}")
                    continue

            # Trier par score décroissant et limiter top N
            predictions.sort(key=lambda x: x['riskScore'], reverse=True)
            predictions = predictions[:top_n]

            return self._success_response({
                'predictions': predictions,
                'totalAnalyzed': len(customers_with_invoices),
                'highRiskCount': len([p for p in predictions if p['riskLevel'] in ['high', 'critical']]),
            })

        except Exception as e:
            _logger.error(f"Erreur batch_predict_payment_risk: {e}", exc_info=True)
            return self._error_response(str(e), "SERVER_ERROR", 500)
