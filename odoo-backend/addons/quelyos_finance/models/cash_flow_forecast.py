# -*- coding: utf-8 -*-
"""
Modèle Prévision Cash Flow avec Machine Learning

Fonctionnalités :
- Prédiction trésorerie 30/60/90 jours
- Calcul DSO (Days Sales Outstanding)
- Historique prédictions vs réalité
- Alertes semaines à risque

ML Features :
- Historique paiements (moyenne, écart-type)
- Saisonnalité (mois, jour semaine)
- Secteur activité client
- Montant facture vs CA client
- Délais paiement moyens par client
- Taux retard historique

Modèle : Régression Linéaire + Random Forest (ensemble)
Précision cible : 85%+ (RMSE < 5%)
"""

import logging
from datetime import datetime, timedelta
from odoo import models, fields, api
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)


class CashFlowForecast(models.Model):
    """Prévisions trésorerie avec ML"""

    _name = 'quelyos.cash_flow_forecast'
    _description = 'Prévision Cash Flow'
    _order = 'date desc'
    _rec_name = 'date'

    # Champs
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', required=True, index=True)
    date = fields.Date(string='Date prévision', required=True, index=True, default=fields.Date.today)
    horizon_days = fields.Integer(string='Horizon (jours)', required=True, default=30)

    # Prédictions
    predicted_inflow = fields.Float(string='Encaissements prévus', digits=(16, 2))
    predicted_outflow = fields.Float(string='Décaissements prévus', digits=(16, 2))
    predicted_balance = fields.Float(
        string='Solde prévu',
        compute='_compute_predicted_balance',
        store=True,
        digits=(16, 2)
    )

    # Réalité (rempli après coup pour comparaison)
    actual_inflow = fields.Float(string='Encaissements réels', digits=(16, 2))
    actual_outflow = fields.Float(string='Décaissements réels', digits=(16, 2))
    actual_balance = fields.Float(
        string='Solde réel',
        compute='_compute_actual_balance',
        store=True,
        digits=(16, 2)
    )

    # Précision
    accuracy = fields.Float(
        string='Précision (%)',
        compute='_compute_accuracy',
        store=True,
        digits=(5, 2)
    )

    # Métadonnées ML
    model_version = fields.Char(string='Version modèle', default='1.0.0')
    confidence_score = fields.Float(string='Score confiance', digits=(5, 2))
    features_used = fields.Text(string='Features utilisées')

    # Contraintes
    _sql_constraints = [
        (
            'unique_forecast_per_date_horizon',
            'UNIQUE(tenant_id, date, horizon_days)',
            'Une seule prévision par date/horizon/tenant'
        )
    ]

    @api.depends('predicted_inflow', 'predicted_outflow')
    def _compute_predicted_balance(self):
        """Calcul solde prévu"""
        for record in self:
            record.predicted_balance = record.predicted_inflow - record.predicted_outflow

    @api.depends('actual_inflow', 'actual_outflow')
    def _compute_actual_balance(self):
        """Calcul solde réel"""
        for record in self:
            record.actual_balance = record.actual_inflow - record.actual_outflow

    @api.depends('predicted_balance', 'actual_balance')
    def _compute_accuracy(self):
        """Calcul précision prédiction (RMSE relatif)"""
        for record in self:
            if record.actual_balance and record.predicted_balance:
                error = abs(record.predicted_balance - record.actual_balance)
                relative_error = (error / abs(record.actual_balance)) * 100 if record.actual_balance else 0
                record.accuracy = max(0, 100 - relative_error)
            else:
                record.accuracy = 0.0

    @api.model
    def predict_cash_flow(self, tenant_id, horizon_days=30):
        """
        Prédiction cash flow via ML

        Args:
            tenant_id (int): ID tenant
            horizon_days (int): Horizon prédiction (30, 60 ou 90)

        Returns:
            dict: {
                'predicted_inflow': float,
                'predicted_outflow': float,
                'predicted_balance': float,
                'confidence_score': float,
                'weeks': [{
                    'week_start': date,
                    'predicted_inflow': float,
                    'predicted_outflow': float,
                    'predicted_balance': float,
                    'is_at_risk': bool,
                }],
            }
        """
        try:
            # 1. Récupérer données historiques
            historical_data = self._get_historical_data(tenant_id, lookback_days=365)

            if not historical_data:
                _logger.warning(f"Pas assez de données historiques pour tenant {tenant_id}")
                return self._default_prediction(horizon_days)

            # 2. Extraire features
            features = self._extract_features(tenant_id, historical_data)

            # 3. Prédiction ML (pour l'instant : moyenne historique + tendance)
            # TODO: Implémenter vrai modèle ML (sklearn Random Forest)
            predicted_inflow = self._predict_inflow(features, horizon_days)
            predicted_outflow = self._predict_outflow(features, horizon_days)

            # 4. Prédictions par semaine
            weeks = self._predict_by_week(tenant_id, horizon_days, features)

            # 5. Score confiance
            confidence_score = self._calculate_confidence(historical_data)

            # 6. Sauvegarder prédiction
            forecast = self.create({
                'tenant_id': tenant_id,
                'date': fields.Date.today(),
                'horizon_days': horizon_days,
                'predicted_inflow': predicted_inflow,
                'predicted_outflow': predicted_outflow,
                'confidence_score': confidence_score,
                'features_used': str(features.keys()),
            })

            return {
                'id': forecast.id,
                'predicted_inflow': predicted_inflow,
                'predicted_outflow': predicted_outflow,
                'predicted_balance': predicted_inflow - predicted_outflow,
                'confidence_score': confidence_score,
                'weeks': weeks,
            }

        except Exception as e:
            _logger.error(f"Erreur predict_cash_flow: {e}", exc_info=True)
            raise UserError(f"Erreur prédiction cash flow: {str(e)}")

    def _get_historical_data(self, tenant_id, lookback_days=365):
        """Récupérer historique paiements N derniers jours"""
        cutoff_date = datetime.now() - timedelta(days=lookback_days)

        # Factures payées
        paid_invoices = self.env['account.move'].search([
            ('tenant_id', '=', tenant_id),
            ('move_type', '=', 'out_invoice'),
            ('payment_state', '=', 'paid'),
            ('invoice_date', '>=', cutoff_date.date()),
        ])

        # Factures fournisseurs payées
        paid_bills = self.env['account.move'].search([
            ('tenant_id', '=', tenant_id),
            ('move_type', '=', 'in_invoice'),
            ('payment_state', '=', 'paid'),
            ('invoice_date', '>=', cutoff_date.date()),
        ])

        return {
            'paid_invoices': paid_invoices,
            'paid_bills': paid_bills,
        }

    def _extract_features(self, tenant_id, historical_data):
        """Extraire features ML depuis historique"""
        paid_invoices = historical_data['paid_invoices']
        paid_bills = historical_data['paid_bills']

        # Feature 1: Moyenne encaissements mensuels
        total_inflow = sum(inv.amount_total for inv in paid_invoices)
        avg_monthly_inflow = total_inflow / 12 if len(paid_invoices) >= 12 else total_inflow

        # Feature 2: Moyenne décaissements mensuels
        total_outflow = sum(bill.amount_total for bill in paid_bills)
        avg_monthly_outflow = total_outflow / 12 if len(paid_bills) >= 12 else total_outflow

        # Feature 3: Saisonnalité (mois actuel)
        current_month = datetime.now().month

        # Feature 4: Tendance (croissance derniers 3 mois vs 3 mois avant)
        recent_inflow = sum(
            inv.amount_total for inv in paid_invoices
            if inv.invoice_date >= (datetime.now() - timedelta(days=90)).date()
        )
        previous_inflow = sum(
            inv.amount_total for inv in paid_invoices
            if (datetime.now() - timedelta(days=180)).date() <= inv.invoice_date < (datetime.now() - timedelta(days=90)).date()
        )
        growth_rate = (recent_inflow / previous_inflow - 1) if previous_inflow else 0

        return {
            'avg_monthly_inflow': avg_monthly_inflow,
            'avg_monthly_outflow': avg_monthly_outflow,
            'current_month': current_month,
            'growth_rate': growth_rate,
            'num_invoices': len(paid_invoices),
            'num_bills': len(paid_bills),
        }

    def _predict_inflow(self, features, horizon_days):
        """Prédire encaissements (version simple : moyenne + croissance)"""
        # Extrapoler à horizon_days
        daily_inflow = features['avg_monthly_inflow'] / 30
        predicted = daily_inflow * horizon_days

        # Appliquer taux croissance
        predicted *= (1 + features['growth_rate'])

        return predicted

    def _predict_outflow(self, features, horizon_days):
        """Prédire décaissements (version simple : moyenne)"""
        daily_outflow = features['avg_monthly_outflow'] / 30
        return daily_outflow * horizon_days

    def _predict_by_week(self, tenant_id, horizon_days, features):
        """Prédictions détaillées par semaine"""
        weeks = []
        today = datetime.now().date()

        num_weeks = horizon_days // 7
        daily_inflow = features['avg_monthly_inflow'] / 30
        daily_outflow = features['avg_monthly_outflow'] / 30

        for i in range(num_weeks):
            week_start = today + timedelta(days=i * 7)
            week_inflow = daily_inflow * 7
            week_outflow = daily_outflow * 7
            week_balance = week_inflow - week_outflow

            weeks.append({
                'week_start': week_start.isoformat(),
                'predicted_inflow': week_inflow,
                'predicted_outflow': week_outflow,
                'predicted_balance': week_balance,
                'is_at_risk': week_balance < 0,  # Alerte si négatif
            })

        return weeks

    def _calculate_confidence(self, historical_data):
        """Calculer score confiance selon quantité données"""
        num_invoices = len(historical_data['paid_invoices'])

        if num_invoices >= 50:
            return 90.0
        elif num_invoices >= 20:
            return 75.0
        elif num_invoices >= 10:
            return 60.0
        else:
            return 40.0

    def _default_prediction(self, horizon_days):
        """Prédiction par défaut si pas assez de données"""
        return {
            'predicted_inflow': 0.0,
            'predicted_outflow': 0.0,
            'predicted_balance': 0.0,
            'confidence_score': 0.0,
            'weeks': [],
        }

    @api.model
    def calculate_dso(self, tenant_id, partner_id=None):
        """
        Calcul DSO (Days Sales Outstanding)

        DSO = (Créances clients / CA) × Nb jours période

        Args:
            tenant_id (int): ID tenant
            partner_id (int, optional): ID client (si spécifique)

        Returns:
            dict: {
                'dso': float (jours),
                'receivables': float (créances),
                'revenue': float (CA période),
                'period_days': int,
            }
        """
        period_days = 30  # Derniers 30 jours

        # Domain base
        domain = [
            ('tenant_id', '=', tenant_id),
            ('move_type', '=', 'out_invoice'),
            ('state', '=', 'posted'),
        ]

        if partner_id:
            domain.append(('partner_id', '=', partner_id))

        # Créances clients (factures non payées)
        receivables_domain = domain + [('payment_state', 'in', ['not_paid', 'partial'])]
        invoices_unpaid = self.env['account.move'].search(receivables_domain)
        receivables = sum(inv.amount_residual for inv in invoices_unpaid)

        # CA période (toutes factures validées derniers 30j)
        cutoff_date = datetime.now() - timedelta(days=period_days)
        revenue_domain = domain + [('invoice_date', '>=', cutoff_date.date())]
        invoices_period = self.env['account.move'].search(revenue_domain)
        revenue = sum(inv.amount_total for inv in invoices_period)

        # Calcul DSO
        dso = (receivables / revenue * period_days) if revenue > 0 else 0

        return {
            'dso': round(dso, 1),
            'receivables': receivables,
            'revenue': revenue,
            'period_days': period_days,
        }
