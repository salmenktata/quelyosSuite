# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError, UserError
from datetime import datetime, timedelta
import logging

_logger = logging.getLogger(__name__)


class Subscription(models.Model):
    _name = 'quelyos.subscription'
    _description = 'Abonnement client Quelyos'
    _inherit = ['mail.thread', 'mail.activity.mixin']
    _order = 'create_date desc'

    name = fields.Char(
        string='Référence',
        required=True,
        copy=False,
        readonly=True,
        default=lambda self: _('New')
    )

    # Client
    partner_id = fields.Many2one(
        'res.partner',
        string='Client',
        required=True,
        tracking=True,
        ondelete='restrict',
        help='Client propriétaire de cet abonnement'
    )

    company_id = fields.Many2one(
        'res.company',
        string='Société',
        required=True,
        default=lambda self: self.env.company,
        help='Société Odoo associée à cet abonnement'
    )

    # Plan et statut
    plan_id = fields.Many2one(
        'quelyos.subscription.plan',
        string='Plan',
        required=True,
        tracking=True,
        ondelete='restrict',
        help='Plan d\'abonnement souscrit'
    )

    state = fields.Selection([
        ('trial', 'Période d\'essai'),
        ('active', 'Actif'),
        ('past_due', 'Paiement en retard'),
        ('cancelled', 'Annulé'),
        ('expired', 'Expiré')
    ], string='Statut', default='trial', required=True, tracking=True)

    # Dates
    start_date = fields.Date(
        string='Date de début',
        default=fields.Date.today,
        required=True,
        tracking=True
    )

    trial_end_date = fields.Date(
        string='Fin période d\'essai',
        help='Date de fin de la période d\'essai gratuite'
    )

    next_billing_date = fields.Date(
        string='Prochaine facturation',
        help='Date du prochain prélèvement'
    )

    end_date = fields.Date(
        string='Date de fin',
        tracking=True,
        help='Date de fin effective de l\'abonnement'
    )

    # Facturation
    billing_cycle = fields.Selection([
        ('monthly', 'Mensuel'),
        ('yearly', 'Annuel')
    ], string='Cycle de facturation', default='monthly', required=True, tracking=True)

    stripe_subscription_id = fields.Char(
        string='Stripe Subscription ID',
        help='ID de l\'abonnement dans Stripe (ex: sub_xxx)'
    )

    stripe_customer_id = fields.Char(
        string='Stripe Customer ID',
        help='ID du client dans Stripe (ex: cus_xxx)'
    )

    # Utilisation actuelle (computed fields)
    current_users_count = fields.Integer(
        string='Utilisateurs actuels',
        compute='_compute_current_usage',
        store=True,
        help='Nombre d\'utilisateurs actifs actuellement'
    )

    current_products_count = fields.Integer(
        string='Produits actuels',
        compute='_compute_current_usage',
        store=True,
        help='Nombre de produits actifs actuellement'
    )

    current_orders_count = fields.Integer(
        string='Commandes cette année',
        compute='_compute_current_usage',
        store=True,
        help='Nombre de commandes confirmées cette année civile'
    )

    # Limites du plan (related pour faciliter l'accès)
    max_users = fields.Integer(
        related='plan_id.max_users',
        string='Max utilisateurs',
        readonly=True,
        store=True
    )

    max_products = fields.Integer(
        related='plan_id.max_products',
        string='Max produits',
        readonly=True,
        store=True
    )

    max_orders_per_year = fields.Integer(
        related='plan_id.max_orders_per_year',
        string='Max commandes/an',
        readonly=True,
        store=True
    )

    # Champs calculés pour les indicateurs
    users_usage_percentage = fields.Float(
        string='% Utilisation Utilisateurs',
        compute='_compute_usage_percentages',
        store=True
    )

    products_usage_percentage = fields.Float(
        string='% Utilisation Produits',
        compute='_compute_usage_percentages',
        store=True
    )

    orders_usage_percentage = fields.Float(
        string='% Utilisation Commandes',
        compute='_compute_usage_percentages',
        store=True
    )

    # Champs calculés pour le Super Admin
    mrr = fields.Float(
        string='MRR (€)',
        compute='_compute_mrr',
        store=True,
        help='Monthly Recurring Revenue pour cet abonnement'
    )

    price = fields.Float(
        string='Prix actuel',
        compute='_compute_mrr',
        store=True,
        help='Prix selon le cycle de facturation'
    )

    # Relation inverse vers tenant
    tenant_ids = fields.One2many(
        'quelyos.tenant',
        'subscription_id',
        string='Tenants'
    )

    # ═══════════════════════════════════════════════════════════════════════════
    # HEALTH SCORE (SaaS monitoring)
    # ═══════════════════════════════════════════════════════════════════════════

    health_score = fields.Integer(
        string='Score Santé',
        compute='_compute_health_score',
        store=True,
        help='Score global de santé client (0-100)'
    )

    health_status = fields.Selection([
        ('healthy', 'Sain'),
        ('at_risk', 'À risque'),
        ('critical', 'Critique'),
    ], string='Statut Santé', compute='_compute_health_score', store=True)

    usage_score = fields.Float(
        string='Score Usage',
        compute='_compute_health_score',
        store=True,
        help='Score basé sur l\'utilisation des quotas'
    )

    payment_health = fields.Float(
        string='Santé Paiement',
        compute='_compute_health_score',
        store=True,
        help='Score basé sur l\'état des paiements'
    )

    engagement_score = fields.Float(
        string='Score Engagement',
        compute='_compute_health_score',
        store=True,
        help='Score basé sur l\'activité récente'
    )

    churn_risk = fields.Float(
        string='Risque Churn',
        compute='_compute_health_score',
        store=True,
        help='Probabilité de désabonnement (0-100)'
    )

    @api.depends('state', 'trial_end_date', 'users_usage_percentage', 'products_usage_percentage',
                 'orders_usage_percentage', 'current_users_count')
    def _compute_health_score(self):
        """
        Calcule le score de santé client basé sur plusieurs facteurs.
        Score de base: 100 points
        Déductions:
        - -30 si état past_due
        - -15 à -0 si trial proche expiration (progressif)
        - -10 à -40 selon usage quotas (>70% = -10, >80% = -20, >90% = -40)
        Bonus:
        - Engagement si utilisateurs actifs
        """
        today = fields.Date.today()

        for record in self:
            base_score = 100
            payment_score = 100.0
            usage_penalty = 0.0
            engagement = 50.0  # Score par défaut
            trial_penalty = 0.0

            # 1. Pénalité paiement
            if record.state == 'past_due':
                payment_score = 0.0
                base_score -= 30
            elif record.state == 'cancelled':
                payment_score = 0.0
                base_score -= 50

            # 2. Pénalité trial proche expiration
            if record.state == 'trial' and record.trial_end_date:
                days_remaining = (record.trial_end_date - today).days
                if days_remaining <= 0:
                    trial_penalty = 20
                elif days_remaining <= 3:
                    trial_penalty = 15
                elif days_remaining <= 7:
                    trial_penalty = 10
                elif days_remaining <= 14:
                    trial_penalty = 5
                base_score -= trial_penalty

            # 3. Score usage (pénalité si proche des limites)
            max_usage = max(
                record.users_usage_percentage or 0,
                record.products_usage_percentage or 0,
                record.orders_usage_percentage or 0
            )
            if max_usage > 95:
                usage_penalty = 40
            elif max_usage > 90:
                usage_penalty = 30
            elif max_usage > 80:
                usage_penalty = 20
            elif max_usage > 70:
                usage_penalty = 10
            base_score -= usage_penalty
            usage_score_val = max(0, 100 - usage_penalty * 2.5)

            # 4. Engagement score (basé sur nombre d'utilisateurs actifs)
            if record.current_users_count >= 5:
                engagement = 100.0
            elif record.current_users_count >= 3:
                engagement = 80.0
            elif record.current_users_count >= 1:
                engagement = 60.0
            else:
                engagement = 30.0
                base_score -= 10

            # Calcul final
            final_score = max(0, min(100, base_score))

            # Détermination du statut
            if final_score >= 70:
                health_status = 'healthy'
            elif final_score >= 40:
                health_status = 'at_risk'
            else:
                health_status = 'critical'

            # Calcul risque churn (inverse du score)
            churn_risk_val = max(0, min(100, 100 - final_score))

            record.health_score = final_score
            record.health_status = health_status
            record.usage_score = usage_score_val
            record.payment_health = payment_score
            record.engagement_score = engagement
            record.churn_risk = churn_risk_val

    @api.depends('plan_id', 'plan_id.price_monthly', 'plan_id.price_yearly', 'billing_cycle', 'state')
    def _compute_mrr(self):
        """Calcule le MRR (Monthly Recurring Revenue) pour cet abonnement."""
        for record in self:
            if record.state not in ('active', 'trial') or not record.plan_id:
                record.mrr = 0.0
                record.price = 0.0
                continue

            if record.billing_cycle == 'yearly':
                record.price = record.plan_id.price_yearly or 0.0
                record.mrr = record.price / 12 if record.price else 0.0
            else:
                record.price = record.plan_id.price_monthly or 0.0
                record.mrr = record.price

    @api.depends('partner_id', 'company_id')
    def _compute_current_usage(self):
        """Calcule l'utilisation actuelle des ressources."""
        for record in self:
            if not record.company_id:
                record.current_users_count = 0
                record.current_products_count = 0
                record.current_orders_count = 0
                continue

            # Compter les utilisateurs actifs de cette société
            record.current_users_count = self.env['res.users'].search_count([
                ('company_ids', 'in', record.company_id.id),
                ('active', '=', True),
                ('share', '=', False)  # Exclure les utilisateurs portail
            ])

            # Compter les produits actifs
            record.current_products_count = self.env['product.template'].search_count([
                ('company_id', '=', record.company_id.id),
                ('active', '=', True)
            ])

            # Compter les commandes de l'année en cours
            year_start = fields.Date.today().replace(month=1, day=1)
            record.current_orders_count = self.env['sale.order'].search_count([
                ('company_id', '=', record.company_id.id),
                ('date_order', '>=', year_start),
                ('state', 'in', ['sale', 'done'])
            ])

    @api.depends('current_users_count', 'current_products_count', 'current_orders_count',
                 'max_users', 'max_products', 'max_orders_per_year')
    def _compute_usage_percentages(self):
        """Calcule les pourcentages d'utilisation des quotas."""
        for record in self:
            # Users
            if record.max_users > 0:
                record.users_usage_percentage = (record.current_users_count / record.max_users) * 100
            else:
                record.users_usage_percentage = 0

            # Products
            if record.max_products > 0:
                record.products_usage_percentage = (record.current_products_count / record.max_products) * 100
            else:
                record.products_usage_percentage = 0

            # Orders
            if record.max_orders_per_year > 0:
                record.orders_usage_percentage = (record.current_orders_count / record.max_orders_per_year) * 100
            else:
                record.orders_usage_percentage = 0

    @api.model_create_multi
    def create(self, vals_list):
        """Génère une référence unique à la création."""
        for vals in vals_list:
            if vals.get('name', _('New')) == _('New'):
                vals['name'] = self.env['ir.sequence'].next_by_code('subscription') or _('New')

            # Si période d'essai et pas de date de fin définie, calculer 14 jours
            if vals.get('state') == 'trial' and not vals.get('trial_end_date'):
                start = vals.get('start_date', fields.Date.today())
                if isinstance(start, str):
                    start = fields.Date.from_string(start)
                vals['trial_end_date'] = start + timedelta(days=14)

        subscriptions = super().create(vals_list)

        # Assigner automatiquement les groupes du plan aux utilisateurs
        for subscription in subscriptions:
            subscription._assign_plan_groups_to_users()

        return subscriptions

    def write(self, vals):
        """Gère le changement de plan et réassigne les groupes."""
        # Détecter si le plan change
        plan_changed = 'plan_id' in vals

        # Sauvegarder l'ancien plan si changement
        old_plans = {}
        if plan_changed:
            for subscription in self:
                old_plans[subscription.id] = subscription.plan_id

        # Effectuer la modification
        result = super().write(vals)

        # Si le plan a changé, réassigner les groupes
        if plan_changed:
            for subscription in self:
                # Retirer les groupes de l'ancien plan
                old_plan = old_plans.get(subscription.id)
                if old_plan and old_plan.group_ids:
                    users = self.env['res.users'].sudo().search([
                        ('company_ids', 'in', subscription.company_id.id),
                        ('active', '=', True),
                        ('share', '=', False),
                    ])
                    for user in users:
                        user.write({
                            'groups_id': [(3, group.id) for group in old_plan.group_ids]
                        })

                # Assigner les groupes du nouveau plan
                subscription._assign_plan_groups_to_users()
                subscription.message_post(
                    body=_("Plan d'abonnement modifié. Groupes d'accès mis à jour.")
                )

        return result

    def check_quota_limit(self, resource_type):
        """
        Vérifie si une limite de quota est atteinte.

        :param resource_type: 'users', 'products', 'orders'
        :return: (is_limit_reached: bool, usage: int, limit: int)
        """
        self.ensure_one()

        # Forcer le recalcul de l'utilisation
        self._compute_current_usage()

        if resource_type == 'users':
            limit = self.max_users
            usage = self.current_users_count
            # 0 = illimité
            is_limit_reached = (usage >= limit) if limit > 0 else False
            return (is_limit_reached, usage, limit)

        elif resource_type == 'products':
            limit = self.max_products
            usage = self.current_products_count
            is_limit_reached = (usage >= limit) if limit > 0 else False
            return (is_limit_reached, usage, limit)

        elif resource_type == 'orders':
            limit = self.max_orders_per_year
            usage = self.current_orders_count
            is_limit_reached = (usage >= limit) if limit > 0 else False
            return (is_limit_reached, usage, limit)

        return (False, 0, 0)

    def action_activate(self):
        """Active l'abonnement (sortie de trial ou past_due)."""
        for record in self:
            record.write({'state': 'active'})
            record._assign_plan_groups_to_users()
            record.message_post(body=_("Abonnement activé"))

    def action_cancel(self):
        """Annule l'abonnement."""
        for record in self:
            record._remove_plan_groups_from_users()
            record.write({
                'state': 'cancelled',
                'end_date': fields.Date.today()
            })
            record.message_post(body=_("Abonnement annulé"))

    def action_mark_past_due(self):
        """Marque l'abonnement en retard de paiement et envoie email."""
        template = self.env.ref('quelyos_api.email_template_payment_failed', raise_if_not_found=False)

        for record in self:
            record.write({'state': 'past_due'})
            record.message_post(body=_("Paiement en retard"), subtype_xmlid='mail.mt_note')

            # Envoyer email de relance
            if template:
                try:
                    template.send_mail(record.id, force_send=True)
                    _logger.info(f"Payment failed email sent for subscription {record.name}")
                except Exception as e:
                    _logger.error(f"Failed to send payment failed email for {record.name}: {e}")

    def action_expire(self):
        """Expire l'abonnement."""
        for record in self:
            record._remove_plan_groups_from_users()
            record.write({
                'state': 'expired',
                'end_date': fields.Date.today()
            })
            record.message_post(body=_("Abonnement expiré"))

    @api.constrains('trial_end_date', 'start_date')
    def _check_trial_dates(self):
        """Vérifie que la date de fin d'essai est après la date de début."""
        for record in self:
            if record.trial_end_date and record.start_date:
                if record.trial_end_date < record.start_date:
                    raise ValidationError(_('La date de fin d\'essai doit être après la date de début.'))

    @api.constrains('end_date', 'start_date')
    def _check_end_date(self):
        """Vérifie que la date de fin est après la date de début."""
        for record in self:
            if record.end_date and record.start_date:
                if record.end_date < record.start_date:
                    raise ValidationError(_('La date de fin doit être après la date de début.'))

    def name_get(self):
        """Affichage personnalisé de l'abonnement."""
        result = []
        for record in self:
            name = f"{record.name} - {record.partner_id.name} ({record.plan_id.name})"
            result.append((record.id, name))
        return result

    def _assign_plan_groups_to_users(self):
        """
        Assigne les groupes du plan d'abonnement à tous les utilisateurs du tenant.
        Cette méthode est appelée automatiquement lors de :
        - Création d'un nouvel abonnement
        - Changement de plan d'abonnement
        - Activation d'un abonnement
        """
        for subscription in self:
            if not subscription.plan_id or not subscription.plan_id.group_ids:
                continue

            # Récupérer tous les utilisateurs actifs de la company
            users = self.env['res.users'].sudo().search([
                ('company_ids', 'in', subscription.company_id.id),
                ('active', '=', True),
                ('share', '=', False),  # Exclure les utilisateurs portail
            ])

            # Assigner les groupes du plan à chaque utilisateur
            for user in users:
                user.write({
                    'groups_id': [(4, group.id) for group in subscription.plan_id.group_ids]
                })

            _logger.info(
                f"Assigned {len(subscription.plan_id.group_ids)} groups from plan {subscription.plan_id.name} "
                f"to {len(users)} users of company {subscription.company_id.name}"
            )

    def _remove_plan_groups_from_users(self):
        """
        Retire les groupes du plan d'abonnement de tous les utilisateurs du tenant.
        Cette méthode est appelée lors de :
        - Expiration d'un abonnement
        - Annulation d'un abonnement
        """
        for subscription in self:
            if not subscription.plan_id or not subscription.plan_id.group_ids:
                continue

            # Récupérer tous les utilisateurs de la company
            users = self.env['res.users'].sudo().search([
                ('company_ids', 'in', subscription.company_id.id),
                ('active', '=', True),
                ('share', '=', False),
            ])

            # Retirer les groupes du plan de chaque utilisateur
            for user in users:
                user.write({
                    'groups_id': [(3, group.id) for group in subscription.plan_id.group_ids]
                })

            _logger.info(
                f"Removed {len(subscription.plan_id.group_ids)} groups from {len(users)} users "
                f"of company {subscription.company_id.name}"
            )

    @api.model
    def _cron_check_trial_expiry(self):
        """
        Cron job pour vérifier les périodes d'essai expirées.
        À lancer quotidiennement.
        """
        today = fields.Date.today()
        expired_trials = self.search([
            ('state', '=', 'trial'),
            ('trial_end_date', '<', today)
        ])

        for subscription in expired_trials:
            # Si pas de Stripe subscription ID, expirer l'abonnement
            if not subscription.stripe_subscription_id:
                subscription.action_expire()
                _logger.info(f"Trial expired for subscription {subscription.name}")
            else:
                # Si Stripe subscription existe, vérifier son statut via webhook
                _logger.info(f"Trial ended for subscription {subscription.name}, waiting for Stripe confirmation")

    @api.model
    def _cron_check_quota_warnings(self):
        """
        Cron job pour envoyer des alertes à 80% des quotas.
        À lancer quotidiennement.
        """
        active_subscriptions = self.search([
            ('state', 'in', ['trial', 'active'])
        ])

        for subscription in active_subscriptions:
            warnings = []

            # Vérifier users (80%)
            if subscription.users_usage_percentage >= 80:
                warnings.append(f"Utilisateurs: {subscription.current_users_count}/{subscription.max_users}")

            # Vérifier produits (80%)
            if subscription.products_usage_percentage >= 80:
                warnings.append(f"Produits: {subscription.current_products_count}/{subscription.max_products}")

            # Vérifier commandes (80%)
            if subscription.orders_usage_percentage >= 80:
                warnings.append(f"Commandes: {subscription.current_orders_count}/{subscription.max_orders_per_year}")

            if warnings:
                # Envoyer email d'alerte
                body = f"""
                    <p>Votre abonnement <strong>{subscription.plan_id.name}</strong> approche de ses limites :</p>
                    <ul>
                        {''.join([f'<li>{w}</li>' for w in warnings])}
                    </ul>
                    <p>Pensez à upgrader votre plan pour continuer à utiliser toutes les fonctionnalités.</p>
                """
                subscription.message_post(
                    body=body,
                    subject=_("Alerte quota abonnement"),
                    partner_ids=[subscription.partner_id.id],
                    subtype_xmlid='mail.mt_comment'
                )
                _logger.info(f"Quota warning sent for subscription {subscription.name}")

    @api.model
    def get_mrr_breakdown(self):
        """
        Calcule MRR par plan et retourne le total.
        MRR = Monthly Recurring Revenue
        """
        plans = self.env['quelyos.subscription.plan'].search([])
        result = {}
        total_mrr = 0

        for plan in plans:
            # Subscriptions mensuelles actives
            subs_monthly = self.search([
                ('plan_id', '=', plan.id),
                ('state', '=', 'active'),
                ('billing_cycle', '=', 'monthly')
            ])

            # Subscriptions annuelles actives (diviser par 12 pour MRR)
            subs_yearly = self.search([
                ('plan_id', '=', plan.id),
                ('state', '=', 'active'),
                ('billing_cycle', '=', 'yearly')
            ])

            mrr_monthly = sum(s.plan_id.price_monthly for s in subs_monthly)
            mrr_yearly = sum(s.plan_id.price_yearly / 12 for s in subs_yearly)
            plan_mrr = mrr_monthly + mrr_yearly

            result[plan.code] = plan_mrr
            total_mrr += plan_mrr

        result['total'] = total_mrr
        return result

    @api.model
    def get_churn_analysis(self, months=12):
        """
        Calcule le churn rate sur N mois.
        Churn rate = (Subscriptions annulées/expirées) / (Subscriptions actives début mois) * 100
        """
        result = []
        today = fields.Date.today()

        for i in range(months):
            # Calculer le mois cible
            start_month = today - timedelta(days=30 * (i + 1))
            end_month = today - timedelta(days=30 * i)

            # Subscriptions actives au début du mois
            active_start = self.search_count([
                ('state', '=', 'active'),
                ('start_date', '<=', start_month)
            ])

            # Subscriptions qui ont churné pendant ce mois
            churned = self.search_count([
                ('state', 'in', ['cancelled', 'expired']),
                ('end_date', '>=', start_month),
                ('end_date', '<', end_month)
            ])

            # Calculer churn rate
            churn_rate = (churned / active_start * 100) if active_start > 0 else 0

            result.append({
                'month': start_month.strftime('%Y-%m'),
                'churn_rate': round(churn_rate, 2),
                'churned_count': churned,
                'active_start_count': active_start,
            })

        return result

    @api.model
    def _cron_send_trial_ending_reminders(self):
        """
        Envoie un email 7 jours avant la fin de la période d'essai.
        À lancer quotidiennement.
        """
        target_date = fields.Date.today() + timedelta(days=7)
        trials = self.search([
            ('state', '=', 'trial'),
            ('trial_end_date', '=', target_date)
        ])

        template = self.env.ref('quelyos_api.email_template_trial_ending_soon', raise_if_not_found=False)
        if not template:
            _logger.error("Email template 'email_template_trial_ending_soon' not found")
            return

        for sub in trials:
            try:
                template.send_mail(sub.id, force_send=True)
                _logger.info(f"Trial ending reminder sent for subscription {sub.name}")
            except Exception as e:
                _logger.error(f"Failed to send trial ending email for {sub.name}: {e}")

    # ═══════════════════════════════════════════════════════════════════════════
    # DUNNING (Payment Collection Automation)
    # ═══════════════════════════════════════════════════════════════════════════

    dunning_step_ids = fields.One2many(
        'quelyos.dunning.step',
        'subscription_id',
        string='Étapes de relance',
    )

    def _create_dunning_steps(self):
        """Crée les étapes de dunning quand une subscription passe en past_due"""
        DunningStep = self.env['quelyos.dunning.step']
        DunningConfig = self.env['quelyos.dunning.config']
        config = DunningConfig.get_config()

        for subscription in self:
            # Supprimer anciennes étapes pending
            subscription.dunning_step_ids.filtered(lambda s: s.state == 'pending').unlink()

            today = fields.Date.today()

            # Créer les étapes selon la config
            steps_data = [
                (1, config.step1_days, 'email_soft'),
                (2, config.step2_days, 'email_urgent'),
            ]

            # Ajouter suspension et annulation si stratégie aggressive
            if config.strategy == 'aggressive':
                steps_data.extend([
                    (3, config.step3_days, 'suspend'),
                    (4, config.step4_days, 'cancel'),
                ])

            for step_num, days, action in steps_data:
                DunningStep.create({
                    'subscription_id': subscription.id,
                    'step_number': step_num,
                    'days_overdue': days,
                    'action': action,
                    'scheduled_date': today + timedelta(days=days),
                    'state': 'pending',
                })

            _logger.info(f"[DUNNING] Created {len(steps_data)} dunning steps for {subscription.name}")

    def _skip_pending_dunning_steps(self):
        """Skip toutes les étapes pending quand paiement reçu"""
        for subscription in self:
            pending_steps = subscription.dunning_step_ids.filtered(lambda s: s.state == 'pending')
            pending_steps.write({
                'state': 'skipped',
                'notes': 'Paiement reçu - étape ignorée',
            })
            if pending_steps:
                _logger.info(f"[DUNNING] Skipped {len(pending_steps)} steps for {subscription.name} (payment received)")

    @api.model
    def _cron_process_dunning(self):
        """
        Cron job pour traiter les étapes de dunning.
        Exécuté quotidiennement à 9h.
        """
        DunningConfig = self.env['quelyos.dunning.config']
        config = DunningConfig.get_config()

        if not config.enabled:
            _logger.info("[DUNNING] Dunning disabled in config, skipping")
            return

        today = fields.Date.today()

        # 1. Créer les étapes dunning pour les nouvelles subscriptions past_due
        new_past_due = self.search([
            ('state', '=', 'past_due'),
            ('dunning_step_ids', '=', False),  # Pas encore d'étapes
        ])
        new_past_due._create_dunning_steps()

        # 2. Exécuter les étapes dont la date est arrivée
        DunningStep = self.env['quelyos.dunning.step']
        due_steps = DunningStep.search([
            ('state', '=', 'pending'),
            ('scheduled_date', '<=', today),
        ])

        executed_count = 0
        for step in due_steps:
            # Vérifier que la subscription est toujours past_due
            if step.subscription_id.state != 'past_due':
                step.action_skip()
                continue

            try:
                step._execute_step()
                executed_count += 1
            except Exception as e:
                _logger.error(f"[DUNNING] Error executing step #{step.id}: {e}")
                step.notes = f"Erreur: {str(e)}"

        _logger.info(f"[DUNNING] Cron completed: {len(new_past_due)} new subscriptions, {executed_count} steps executed")

    def write(self, vals):
        """Override write pour gérer le changement d'état vers/depuis past_due"""
        # Détecter changement d'état
        state_changing = 'state' in vals
        old_states = {sub.id: sub.state for sub in self}

        result = super().write(vals)

        if state_changing:
            for subscription in self:
                old_state = old_states.get(subscription.id)
                new_state = vals.get('state')

                # Si passage en past_due, créer les étapes de dunning
                if new_state == 'past_due' and old_state != 'past_due':
                    subscription._create_dunning_steps()

                # Si sortie de past_due (paiement reçu), skip les étapes pending
                if old_state == 'past_due' and new_state in ('active', 'trial'):
                    subscription._skip_pending_dunning_steps()

        return result
