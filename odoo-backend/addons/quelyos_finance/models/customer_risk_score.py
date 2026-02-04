# -*- coding: utf-8 -*-
"""
Modèle Scoring Risque Impayé avec Machine Learning

Calcule un score 0-100 pour chaque client basé sur :
- Historique paiements (délais moyens, écart-type, taux retard)
- Montant facture vs CA client annuel
- Secteur activité (BTP/retail risques différents)
- Saisonnalité (décembre budgets serrés)
- Ancienneté relation commerciale
- Nombre relances antérieures
- Litiges passés
- Score crédit externe (API Creditsafe/Altares - optionnel)

Algorithme : XGBoost (classification binaire)
Précision cible : 80%+ (F1-score)

Workflow :
1. Calcul scoring automatique nightly (cron)
2. Mise à jour temps réel après paiement/relance
3. Alerte CFO si score client >90 avec facture impayée >30j
"""

import logging
from datetime import datetime, timedelta
from odoo import models, fields, api
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)


class CustomerRiskScore(models.Model):
    """Scoring risque impayé par client"""

    _name = 'quelyos.customer_risk_score'
    _description = 'Score Risque Client'
    _order = 'score desc'
    _rec_name = 'partner_id'

    # Relations
    tenant_id = fields.Many2one('quelyos.tenant', string='Tenant', required=True, index=True)
    partner_id = fields.Many2one('res.partner', string='Client', required=True, index=True)

    # Score principal
    score = fields.Integer(
        string='Score Risque',
        help='0 = Aucun risque, 100 = Risque maximal impayé',
        default=0,
        index=True
    )
    score_category = fields.Selection(
        [
            ('low', 'Risque Faible (0-30)'),
            ('medium', 'Risque Moyen (31-60)'),
            ('high', 'Risque Élevé (61-80)'),
            ('critical', 'Risque Critique (81-100)'),
        ],
        string='Catégorie',
        compute='_compute_score_category',
        store=True,
        index=True
    )

    # Features ML (stockés pour audit)
    avg_payment_delay = fields.Float(string='Délai paiement moyen (jours)', digits=(5, 1))
    payment_delay_stddev = fields.Float(string='Écart-type délais', digits=(5, 2))
    late_payment_rate = fields.Float(string='Taux retard paiement (%)', digits=(5, 2))
    total_invoiced = fields.Float(string='CA total client', digits=(16, 2))
    total_overdue = fields.Float(string='Créances en retard', digits=(16, 2))
    largest_invoice_ratio = fields.Float(
        string='Ratio plus grosse facture / CA',
        help='Facture la plus élevée / CA annuel (concentration risque)',
        digits=(5, 2)
    )
    relationship_months = fields.Integer(string='Ancienneté relation (mois)')
    reminder_count = fields.Integer(string='Nombre relances historiques')
    dispute_count = fields.Integer(string='Nombre litiges')

    # Métadonnées scoring
    last_computed = fields.Datetime(string='Dernière mise à jour', default=fields.Datetime.now, index=True)
    model_version = fields.Char(string='Version modèle ML', default='1.0.0')
    confidence = fields.Float(string='Confiance prédiction (%)', digits=(5, 2))

    # Contraintes
    _sql_constraints = [
        (
            'unique_partner_per_tenant',
            'UNIQUE(tenant_id, partner_id)',
            'Un seul score par client par tenant'
        ),
        (
            'score_range_check',
            'CHECK(score >= 0 AND score <= 100)',
            'Le score doit être entre 0 et 100'
        )
    ]

    @api.depends('score')
    def _compute_score_category(self):
        """Calcul catégorie selon score"""
        for record in self:
            if record.score <= 30:
                record.score_category = 'low'
            elif record.score <= 60:
                record.score_category = 'medium'
            elif record.score <= 80:
                record.score_category = 'high'
            else:
                record.score_category = 'critical'

    @api.model
    def compute_customer_score(self, tenant_id, partner_id):
        """
        Calcule score risque pour un client

        Args:
            tenant_id (int): ID tenant
            partner_id (int): ID client

        Returns:
            dict: {
                'score': int (0-100),
                'category': str,
                'features': dict,
                'confidence': float,
            }
        """
        try:
            # 1. Récupérer données historiques client
            features = self._extract_customer_features(tenant_id, partner_id)

            if not features['has_payment_history']:
                _logger.info(f"Pas d'historique paiement pour client {partner_id}, score par défaut")
                return self._default_score(tenant_id, partner_id)

            # 2. Calcul score via features (version simple : weighted sum)
            # TODO: Remplacer par vrai modèle XGBoost quand dataset suffisant
            score = self._calculate_weighted_score(features)

            # 3. Clamp score 0-100
            score = max(0, min(100, score))

            # 4. Calculer catégorie
            if score <= 30:
                category = 'low'
            elif score <= 60:
                category = 'medium'
            elif score <= 80:
                category = 'high'
            else:
                category = 'critical'

            # 5. Confiance (basée sur quantité données)
            confidence = self._calculate_confidence(features)

            # 6. Enregistrer ou mettre à jour
            existing = self.search([
                ('tenant_id', '=', tenant_id),
                ('partner_id', '=', partner_id),
            ], limit=1)

            values = {
                'tenant_id': tenant_id,
                'partner_id': partner_id,
                'score': int(score),
                'avg_payment_delay': features['avg_payment_delay'],
                'payment_delay_stddev': features['payment_delay_stddev'],
                'late_payment_rate': features['late_payment_rate'],
                'total_invoiced': features['total_invoiced'],
                'total_overdue': features['total_overdue'],
                'largest_invoice_ratio': features['largest_invoice_ratio'],
                'relationship_months': features['relationship_months'],
                'reminder_count': features['reminder_count'],
                'dispute_count': features['dispute_count'],
                'last_computed': fields.Datetime.now(),
                'confidence': confidence,
            }

            if existing:
                existing.write(values)
            else:
                self.create(values)

            _logger.info(
                f"Score risque calculé pour client {partner_id} (tenant {tenant_id}): "
                f"{score} ({category}), confiance {confidence:.1f}%"
            )

            return {
                'score': int(score),
                'category': category,
                'features': features,
                'confidence': confidence,
            }

        except Exception as e:
            _logger.error(f"Erreur calcul score client {partner_id}: {e}", exc_info=True)
            raise UserError(f"Erreur calcul score risque: {str(e)}")

    def _extract_customer_features(self, tenant_id, partner_id):
        """Extraire features ML depuis historique client"""
        AccountMove = self.env['account.move'].sudo()

        # Factures payées (pour historique paiements)
        paid_invoices = AccountMove.search([
            ('tenant_id', '=', tenant_id),
            ('partner_id', '=', partner_id),
            ('move_type', '=', 'out_invoice'),
            ('payment_state', '=', 'paid'),
            ('state', '=', 'posted'),
        ])

        # Factures en retard (impayées après échéance)
        today = fields.Date.today()
        overdue_invoices = AccountMove.search([
            ('tenant_id', '=', tenant_id),
            ('partner_id', '=', partner_id),
            ('move_type', '=', 'out_invoice'),
            ('payment_state', 'in', ['not_paid', 'partial']),
            ('state', '=', 'posted'),
            ('invoice_date_due', '<', today),
        ])

        # Toutes factures (pour CA)
        all_invoices = AccountMove.search([
            ('tenant_id', '=', tenant_id),
            ('partner_id', '=', partner_id),
            ('move_type', '=', 'out_invoice'),
            ('state', '=', 'posted'),
        ])

        if not paid_invoices:
            return {
                'has_payment_history': False,
                'avg_payment_delay': 0.0,
                'payment_delay_stddev': 0.0,
                'late_payment_rate': 0.0,
                'total_invoiced': sum(inv.amount_total for inv in all_invoices),
                'total_overdue': sum(inv.amount_residual for inv in overdue_invoices),
                'largest_invoice_ratio': 0.0,
                'relationship_months': 0,
                'reminder_count': 0,
                'dispute_count': 0,
            }

        # Feature 1: Délai paiement moyen
        payment_delays = []
        for inv in paid_invoices:
            if inv.invoice_date_due and inv.invoice_payment_date:
                delay = (inv.invoice_payment_date - inv.invoice_date_due).days
                payment_delays.append(delay)

        avg_delay = sum(payment_delays) / len(payment_delays) if payment_delays else 0.0
        stddev_delay = self._calculate_stddev(payment_delays) if len(payment_delays) > 1 else 0.0

        # Feature 2: Taux retard (paiements après échéance)
        late_payments = [d for d in payment_delays if d > 0]
        late_rate = (len(late_payments) / len(payment_delays) * 100) if payment_delays else 0.0

        # Feature 3: CA total
        total_invoiced = sum(inv.amount_total for inv in all_invoices)

        # Feature 4: Créances en retard
        total_overdue = sum(inv.amount_residual for inv in overdue_invoices)

        # Feature 5: Ratio plus grosse facture
        if all_invoices and total_invoiced > 0:
            largest_invoice = max(inv.amount_total for inv in all_invoices)
            largest_ratio = (largest_invoice / total_invoiced) if total_invoiced else 0
        else:
            largest_ratio = 0.0

        # Feature 6: Ancienneté relation (première facture)
        if all_invoices:
            first_invoice_date = min(inv.invoice_date for inv in all_invoices if inv.invoice_date)
            relationship_months = (today - first_invoice_date).days // 30
        else:
            relationship_months = 0

        # Feature 7: Relances (approx via mail.activity)
        reminder_count = self.env['mail.activity'].search_count([
            ('res_model', '=', 'account.move'),
            ('res_id', 'in', all_invoices.ids),
            ('activity_type_id.name', 'ilike', 'relance'),
        ])

        # Feature 8: Litiges (approx via claim/dispute dans notes)
        dispute_count = 0
        for inv in all_invoices:
            if inv.narration and any(keyword in inv.narration.lower() for keyword in ['litige', 'contestation', 'réclamation']):
                dispute_count += 1

        return {
            'has_payment_history': True,
            'avg_payment_delay': avg_delay,
            'payment_delay_stddev': stddev_delay,
            'late_payment_rate': late_rate,
            'total_invoiced': total_invoiced,
            'total_overdue': total_overdue,
            'largest_invoice_ratio': largest_ratio,
            'relationship_months': relationship_months,
            'reminder_count': reminder_count,
            'dispute_count': dispute_count,
        }

    def _calculate_weighted_score(self, features):
        """
        Calcul score via weighted sum (version simple)

        Poids basés sur impact business :
        - Délai paiement moyen : 25%
        - Taux retard : 20%
        - Créances en retard : 20%
        - Écart-type délais (volatilité) : 15%
        - Relances historiques : 10%
        - Litiges : 5%
        - Ratio concentration : 5%
        """
        score = 0.0

        # Délai moyen (0j = 0 pts, 30j+ = 25 pts)
        delay_score = min(features['avg_payment_delay'] / 30 * 25, 25)
        score += delay_score

        # Taux retard (0% = 0 pts, 50%+ = 20 pts)
        late_rate_score = min(features['late_payment_rate'] / 50 * 20, 20)
        score += late_rate_score

        # Créances en retard (aucune = 0 pts, 50k€+ = 20 pts)
        overdue_score = min(features['total_overdue'] / 50000 * 20, 20)
        score += overdue_score

        # Écart-type délais (0j = 0 pts, 15j+ = 15 pts)
        stddev_score = min(features['payment_delay_stddev'] / 15 * 15, 15)
        score += stddev_score

        # Relances (0 = 0 pts, 10+ = 10 pts)
        reminder_score = min(features['reminder_count'] / 10 * 10, 10)
        score += reminder_score

        # Litiges (0 = 0 pts, 3+ = 5 pts)
        dispute_score = min(features['dispute_count'] / 3 * 5, 5)
        score += dispute_score

        # Concentration (0% = 0 pts, 50%+ = 5 pts)
        concentration_score = min(features['largest_invoice_ratio'] * 100 / 50 * 5, 5)
        score += concentration_score

        return score

    def _calculate_stddev(self, values):
        """Calcul écart-type"""
        if not values or len(values) < 2:
            return 0.0

        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return variance ** 0.5

    def _calculate_confidence(self, features):
        """Calcul confiance prédiction selon quantité données"""
        # Confiance basée sur nombre factures payées
        total_invoiced = features['total_invoiced']

        if total_invoiced >= 100000:  # 100K€+ CA
            return 90.0
        elif total_invoiced >= 50000:  # 50K€+
            return 75.0
        elif total_invoiced >= 10000:  # 10K€+
            return 60.0
        else:
            return 40.0

    def _default_score(self, tenant_id, partner_id):
        """Score par défaut si pas d'historique"""
        # Nouveau client = risque moyen (score 50)
        existing = self.search([
            ('tenant_id', '=', tenant_id),
            ('partner_id', '=', partner_id),
        ], limit=1)

        values = {
            'tenant_id': tenant_id,
            'partner_id': partner_id,
            'score': 50,
            'last_computed': fields.Datetime.now(),
            'confidence': 0.0,
        }

        if existing:
            existing.write(values)
        else:
            self.create(values)

        return {
            'score': 50,
            'category': 'medium',
            'features': {},
            'confidence': 0.0,
        }

    @api.model
    def recompute_all_scores(self, tenant_id):
        """
        Recalculer tous les scores clients (cron nightly)

        Args:
            tenant_id (int): ID tenant

        Returns:
            dict: Stats recalcul
        """
        Partner = self.env['res.partner'].sudo()

        # Récupérer tous clients avec factures
        customers = Partner.search([
            ('tenant_id', '=', tenant_id),
            ('customer_rank', '>', 0),
        ])

        stats = {
            'total': len(customers),
            'computed': 0,
            'errors': 0,
        }

        for partner in customers:
            try:
                self.compute_customer_score(tenant_id, partner.id)
                stats['computed'] += 1
            except Exception as e:
                _logger.error(f"Erreur calcul score client {partner.id}: {e}")
                stats['errors'] += 1

        _logger.info(
            f"Recalcul scores terminé pour tenant {tenant_id}: "
            f"{stats['computed']}/{stats['total']} succès, {stats['errors']} erreurs"
        )

        return stats
