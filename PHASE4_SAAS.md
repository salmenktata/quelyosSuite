# Phase 4 : Modèle Commercial SaaS - Documentation Complète

## 🎯 Objectif

Transformer Quelyos ERP en une solution SaaS commercialisable avec :
- 3 plans tarifaires (Starter, Pro, Enterprise)
- Gestion automatique des abonnements via Stripe
- Système de quotas et limitations par plan
- Interface de gestion pour clients et administrateurs

---

## 📊 Structure des Plans

### Plan Starter - 29€/mois

**Limites** :
- ✅ 1 utilisateur
- ✅ 1 000 produits maximum
- ✅ 5 000 commandes/an
- ✅ Support email (48h)
- ✅ Toutes les fonctionnalités de base

**Cas d'usage** : Petites boutiques, freelances, MVP

---

### Plan Pro - 79€/mois

**Limites** :
- ✅ 5 utilisateurs
- ✅ 10 000 produits maximum
- ✅ 50 000 commandes/an
- ✅ Support email + chat (24h)
- ✅ Fonctionnalités avancées (analytics, exports, API)
- ✅ Personnalisation thème
- ✅ Multi-entrepôts

**Cas d'usage** : PME, e-commerçants établis

---

### Plan Enterprise - Sur devis

**Limites** :
- ✅ Utilisateurs illimités
- ✅ Produits illimités
- ✅ Commandes illimitées
- ✅ Support dédié (2h)
- ✅ Toutes fonctionnalités Pro +
- ✅ Onboarding personnalisé
- ✅ SLA 99.9%
- ✅ Environnement dédié (optionnel)
- ✅ Développements custom (optionnel)

**Cas d'usage** : Grandes entreprises, multi-sites

---

## 🏗️ Architecture Technique

### 1. Modèles Odoo (Backend)

#### Modèle `quelyos.subscription.plan`

```python
class QuelyosSubscriptionPlan(models.Model):
    _name = 'quelyos.subscription.plan'
    _description = 'Plan d\'abonnement Quelyos'

    name = fields.Char(string='Nom du plan', required=True)  # Starter, Pro, Enterprise
    code = fields.Selection([
        ('starter', 'Starter'),
        ('pro', 'Pro'),
        ('enterprise', 'Enterprise')
    ], string='Code', required=True)

    # Tarification
    price_monthly = fields.Float(string='Prix mensuel (€)', required=True)
    price_yearly = fields.Float(string='Prix annuel (€)')  # -20% si payé annuellement
    stripe_price_id_monthly = fields.Char(string='Stripe Price ID (mensuel)')
    stripe_price_id_yearly = fields.Char(string='Stripe Price ID (annuel)')

    # Limites
    max_users = fields.Integer(string='Nombre max d\'utilisateurs', default=1)
    max_products = fields.Integer(string='Nombre max de produits', default=1000)
    max_orders_per_year = fields.Integer(string='Nombre max de commandes/an', default=5000)

    # Fonctionnalités
    features = fields.Text(string='Fonctionnalités (JSON)', help='Liste des features activées')
    support_level = fields.Selection([
        ('email_48h', 'Email (48h)'),
        ('email_chat_24h', 'Email + Chat (24h)'),
        ('dedicated_2h', 'Support dédié (2h)')
    ], string='Niveau de support', default='email_48h')

    # Marketing
    description = fields.Text(string='Description')
    is_popular = fields.Boolean(string='Plan populaire', default=False)
    display_order = fields.Integer(string='Ordre d\'affichage', default=10)
    active = fields.Boolean(string='Actif', default=True)
```

#### Modèle `quelyos.subscription`

```python
class QuelyosSubscription(models.Model):
    _name = 'quelyos.subscription'
    _description = 'Abonnement client Quelyos'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char(string='Référence', required=True, copy=False, readonly=True, default=lambda self: _('New'))

    # Client
    partner_id = fields.Many2one('res.partner', string='Client', required=True, tracking=True)
    company_id = fields.Many2one('res.company', string='Société', required=True, default=lambda self: self.env.company)

    # Plan et statut
    plan_id = fields.Many2one('quelyos.subscription.plan', string='Plan', required=True, tracking=True)
    state = fields.Selection([
        ('trial', 'Période d\'essai'),
        ('active', 'Actif'),
        ('past_due', 'Paiement en retard'),
        ('cancelled', 'Annulé'),
        ('expired', 'Expiré')
    ], string='Statut', default='trial', required=True, tracking=True)

    # Dates
    start_date = fields.Date(string='Date de début', default=fields.Date.today, required=True)
    trial_end_date = fields.Date(string='Fin période d\'essai')
    next_billing_date = fields.Date(string='Prochaine facturation')
    end_date = fields.Date(string='Date de fin')

    # Facturation
    billing_cycle = fields.Selection([
        ('monthly', 'Mensuel'),
        ('yearly', 'Annuel')
    ], string='Cycle de facturation', default='monthly', required=True)

    stripe_subscription_id = fields.Char(string='Stripe Subscription ID')
    stripe_customer_id = fields.Char(string='Stripe Customer ID')

    # Utilisation actuelle
    current_users_count = fields.Integer(string='Utilisateurs actuels', compute='_compute_current_usage', store=True)
    current_products_count = fields.Integer(string='Produits actuels', compute='_compute_current_usage', store=True)
    current_orders_count = fields.Integer(string='Commandes cette année', compute='_compute_current_usage', store=True)

    # Limites du plan (copie pour historique)
    max_users = fields.Integer(related='plan_id.max_users', string='Max utilisateurs', readonly=True)
    max_products = fields.Integer(related='plan_id.max_products', string='Max produits', readonly=True)
    max_orders_per_year = fields.Integer(related='plan_id.max_orders_per_year', string='Max commandes/an', readonly=True)

    @api.depends('partner_id', 'company_id')
    def _compute_current_usage(self):
        for record in self:
            # Compter les utilisateurs actifs de cette société
            record.current_users_count = self.env['res.users'].search_count([
                ('company_ids', 'in', record.company_id.id),
                ('active', '=', True)
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

    def check_quota_limit(self, resource_type):
        """
        Vérifie si une limite de quota est atteinte.
        :param resource_type: 'users', 'products', 'orders'
        :return: (is_limit_reached: bool, usage: int, limit: int)
        """
        self.ensure_one()

        if resource_type == 'users':
            return (self.current_users_count >= self.max_users,
                    self.current_users_count,
                    self.max_users)
        elif resource_type == 'products':
            return (self.current_products_count >= self.max_products,
                    self.current_products_count,
                    self.max_products)
        elif resource_type == 'orders':
            return (self.current_orders_count >= self.max_orders_per_year,
                    self.current_orders_count,
                    self.max_orders_per_year)

        return (False, 0, 0)
```

---

### 2. Endpoints API (Backend)

#### Controller `quelyos_api/controllers/subscription.py`

```python
from odoo import http
from odoo.http import request
import json
import logging

_logger = logging.getLogger(__name__)

class SubscriptionController(http.Controller):

    @http.route('/api/ecommerce/subscription/plans', type='json', auth='public', methods=['POST'], csrf=False, cors='*')
    def get_subscription_plans(self, **kwargs):
        """Liste tous les plans d'abonnement disponibles."""
        try:
            plans = request.env['quelyos.subscription.plan'].sudo().search([
                ('active', '=', True)
            ], order='display_order')

            plans_data = []
            for plan in plans:
                features = json.loads(plan.features) if plan.features else []

                plans_data.append({
                    'id': plan.id,
                    'name': plan.name,
                    'code': plan.code,
                    'price_monthly': plan.price_monthly,
                    'price_yearly': plan.price_yearly,
                    'max_users': plan.max_users,
                    'max_products': plan.max_products,
                    'max_orders_per_year': plan.max_orders_per_year,
                    'support_level': plan.support_level,
                    'features': features,
                    'description': plan.description,
                    'is_popular': plan.is_popular
                })

            return {'success': True, 'data': plans_data}

        except Exception as e:
            _logger.error(f"Error getting subscription plans: {str(e)}")
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/subscription/current', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def get_current_subscription(self, **kwargs):
        """Retourne l'abonnement actuel de l'utilisateur connecté."""
        try:
            user = request.env.user
            company = user.company_id

            subscription = request.env['quelyos.subscription'].search([
                ('company_id', '=', company.id),
                ('state', 'in', ['trial', 'active', 'past_due'])
            ], limit=1)

            if not subscription:
                return {'success': False, 'error': 'No active subscription found'}

            # Vérifier les quotas
            users_limit = subscription.check_quota_limit('users')
            products_limit = subscription.check_quota_limit('products')
            orders_limit = subscription.check_quota_limit('orders')

            return {
                'success': True,
                'data': {
                    'id': subscription.id,
                    'name': subscription.name,
                    'plan': {
                        'name': subscription.plan_id.name,
                        'code': subscription.plan_id.code
                    },
                    'state': subscription.state,
                    'billing_cycle': subscription.billing_cycle,
                    'start_date': subscription.start_date.isoformat() if subscription.start_date else None,
                    'trial_end_date': subscription.trial_end_date.isoformat() if subscription.trial_end_date else None,
                    'next_billing_date': subscription.next_billing_date.isoformat() if subscription.next_billing_date else None,
                    'usage': {
                        'users': {
                            'current': users_limit[1],
                            'limit': users_limit[2],
                            'is_limit_reached': users_limit[0]
                        },
                        'products': {
                            'current': products_limit[1],
                            'limit': products_limit[2],
                            'is_limit_reached': products_limit[0]
                        },
                        'orders': {
                            'current': orders_limit[1],
                            'limit': orders_limit[2],
                            'is_limit_reached': orders_limit[0]
                        }
                    }
                }
            }

        except Exception as e:
            _logger.error(f"Error getting current subscription: {str(e)}")
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/subscription/create', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def create_subscription(self, plan_id, billing_cycle='monthly', **kwargs):
        """Crée un nouvel abonnement pour l'utilisateur."""
        try:
            user = request.env.user
            company = user.company_id

            # Vérifier si abonnement actif existe déjà
            existing = request.env['quelyos.subscription'].search([
                ('company_id', '=', company.id),
                ('state', 'in', ['trial', 'active'])
            ], limit=1)

            if existing:
                return {'success': False, 'error': 'Active subscription already exists'}

            # Créer l'abonnement
            plan = request.env['quelyos.subscription.plan'].browse(plan_id)
            if not plan.exists():
                return {'success': False, 'error': 'Invalid plan'}

            subscription = request.env['quelyos.subscription'].create({
                'partner_id': user.partner_id.id,
                'company_id': company.id,
                'plan_id': plan.id,
                'billing_cycle': billing_cycle,
                'state': 'trial',
                'trial_end_date': fields.Date.today() + timedelta(days=14)  # 14 jours d'essai
            })

            return {
                'success': True,
                'data': {
                    'id': subscription.id,
                    'name': subscription.name,
                    'state': subscription.state
                }
            }

        except Exception as e:
            _logger.error(f"Error creating subscription: {str(e)}")
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/subscription/upgrade', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def upgrade_subscription(self, plan_id, **kwargs):
        """Upgrade le plan d'abonnement actuel."""
        try:
            user = request.env.user
            company = user.company_id

            subscription = request.env['quelyos.subscription'].search([
                ('company_id', '=', company.id),
                ('state', 'in', ['trial', 'active'])
            ], limit=1)

            if not subscription:
                return {'success': False, 'error': 'No active subscription'}

            new_plan = request.env['quelyos.subscription.plan'].browse(plan_id)
            if not new_plan.exists():
                return {'success': False, 'error': 'Invalid plan'}

            # Upgrade immédiat
            subscription.write({'plan_id': new_plan.id})

            # TODO: Calculer prorata et facturer via Stripe

            return {'success': True, 'message': 'Subscription upgraded successfully'}

        except Exception as e:
            _logger.error(f"Error upgrading subscription: {str(e)}")
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/subscription/cancel', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def cancel_subscription(self, **kwargs):
        """Annule l'abonnement à la fin de la période."""
        try:
            user = request.env.user
            company = user.company_id

            subscription = request.env['quelyos.subscription'].search([
                ('company_id', '=', company.id),
                ('state', 'in', ['trial', 'active'])
            ], limit=1)

            if not subscription:
                return {'success': False, 'error': 'No active subscription'}

            # Annulation à la fin de la période
            subscription.write({'state': 'cancelled'})

            # TODO: Annuler via Stripe API

            return {'success': True, 'message': 'Subscription will be cancelled at the end of the billing period'}

        except Exception as e:
            _logger.error(f"Error cancelling subscription: {str(e)}")
            return {'success': False, 'error': str(e)}

    @http.route('/api/ecommerce/subscription/check-quota', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def check_quota(self, resource_type, **kwargs):
        """
        Vérifie si un quota est atteint.
        :param resource_type: 'users', 'products', 'orders'
        """
        try:
            user = request.env.user
            company = user.company_id

            subscription = request.env['quelyos.subscription'].search([
                ('company_id', '=', company.id),
                ('state', 'in', ['trial', 'active'])
            ], limit=1)

            if not subscription:
                return {'success': False, 'error': 'No active subscription'}

            is_limit_reached, current, limit = subscription.check_quota_limit(resource_type)

            return {
                'success': True,
                'data': {
                    'is_limit_reached': is_limit_reached,
                    'current': current,
                    'limit': limit,
                    'percentage': (current / limit * 100) if limit > 0 else 0
                }
            }

        except Exception as e:
            _logger.error(f"Error checking quota: {str(e)}")
            return {'success': False, 'error': str(e)}
```

---

### 3. Intégration Stripe Subscriptions

#### Webhook Handler `quelyos_api/controllers/stripe_webhook.py`

```python
from odoo import http
from odoo.http import request
import stripe
import logging

_logger = logging.getLogger(__name__)

class StripeWebhookController(http.Controller):

    @http.route('/api/ecommerce/stripe/webhook', type='http', auth='public', methods=['POST'], csrf=False, cors='*')
    def stripe_webhook(self, **kwargs):
        """Gère les webhooks Stripe pour les abonnements."""
        try:
            payload = request.httprequest.data
            sig_header = request.httprequest.headers.get('Stripe-Signature')

            # Récupérer la clé secrète webhook depuis config
            webhook_secret = request.env['ir.config_parameter'].sudo().get_param('stripe_webhook_secret')

            # Vérifier la signature
            try:
                event = stripe.Webhook.construct_event(
                    payload, sig_header, webhook_secret
                )
            except ValueError as e:
                _logger.error(f"Invalid payload: {str(e)}")
                return request.make_response('Invalid payload', status=400)
            except stripe.error.SignatureVerificationError as e:
                _logger.error(f"Invalid signature: {str(e)}")
                return request.make_response('Invalid signature', status=400)

            # Traiter les événements
            if event['type'] == 'customer.subscription.created':
                self._handle_subscription_created(event['data']['object'])

            elif event['type'] == 'customer.subscription.updated':
                self._handle_subscription_updated(event['data']['object'])

            elif event['type'] == 'customer.subscription.deleted':
                self._handle_subscription_deleted(event['data']['object'])

            elif event['type'] == 'invoice.paid':
                self._handle_invoice_paid(event['data']['object'])

            elif event['type'] == 'invoice.payment_failed':
                self._handle_invoice_payment_failed(event['data']['object'])

            return request.make_response('Success', status=200)

        except Exception as e:
            _logger.error(f"Error processing Stripe webhook: {str(e)}")
            return request.make_response('Error', status=500)

    def _handle_subscription_created(self, stripe_subscription):
        """Traite la création d'un abonnement Stripe."""
        try:
            subscription = request.env['quelyos.subscription'].sudo().search([
                ('stripe_subscription_id', '=', stripe_subscription['id'])
            ], limit=1)

            if subscription:
                subscription.write({
                    'state': 'active',
                    'next_billing_date': datetime.fromtimestamp(stripe_subscription['current_period_end']).date()
                })
                _logger.info(f"Subscription {subscription.name} activated")

        except Exception as e:
            _logger.error(f"Error handling subscription created: {str(e)}")

    def _handle_subscription_updated(self, stripe_subscription):
        """Traite la mise à jour d'un abonnement Stripe."""
        try:
            subscription = request.env['quelyos.subscription'].sudo().search([
                ('stripe_subscription_id', '=', stripe_subscription['id'])
            ], limit=1)

            if subscription:
                # Mettre à jour les informations
                state_mapping = {
                    'active': 'active',
                    'past_due': 'past_due',
                    'canceled': 'cancelled',
                    'unpaid': 'past_due'
                }

                subscription.write({
                    'state': state_mapping.get(stripe_subscription['status'], 'active'),
                    'next_billing_date': datetime.fromtimestamp(stripe_subscription['current_period_end']).date()
                })
                _logger.info(f"Subscription {subscription.name} updated")

        except Exception as e:
            _logger.error(f"Error handling subscription updated: {str(e)}")

    def _handle_subscription_deleted(self, stripe_subscription):
        """Traite l'annulation d'un abonnement Stripe."""
        try:
            subscription = request.env['quelyos.subscription'].sudo().search([
                ('stripe_subscription_id', '=', stripe_subscription['id'])
            ], limit=1)

            if subscription:
                subscription.write({
                    'state': 'cancelled',
                    'end_date': fields.Date.today()
                })
                _logger.info(f"Subscription {subscription.name} cancelled")

        except Exception as e:
            _logger.error(f"Error handling subscription deleted: {str(e)}")

    def _handle_invoice_paid(self, invoice):
        """Traite le paiement d'une facture Stripe."""
        try:
            subscription_id = invoice.get('subscription')
            if subscription_id:
                subscription = request.env['quelyos.subscription'].sudo().search([
                    ('stripe_subscription_id', '=', subscription_id)
                ], limit=1)

                if subscription and subscription.state == 'past_due':
                    subscription.write({'state': 'active'})
                    _logger.info(f"Subscription {subscription.name} payment received")

        except Exception as e:
            _logger.error(f"Error handling invoice paid: {str(e)}")

    def _handle_invoice_payment_failed(self, invoice):
        """Traite l'échec de paiement d'une facture Stripe."""
        try:
            subscription_id = invoice.get('subscription')
            if subscription_id:
                subscription = request.env['quelyos.subscription'].sudo().search([
                    ('stripe_subscription_id', '=', subscription_id)
                ], limit=1)

                if subscription:
                    subscription.write({'state': 'past_due'})
                    _logger.warning(f"Subscription {subscription.name} payment failed")

                    # Envoyer email de relance
                    # TODO: Template email

        except Exception as e:
            _logger.error(f"Error handling invoice payment failed: {str(e)}")
```

---

### 4. Middleware de Vérification des Quotas

#### Mixin `quelyos_api/models/subscription_mixin.py`

```python
from odoo import models, api
from odoo.exceptions import UserError

class SubscriptionQuotaMixin(models.AbstractModel):
    _name = 'subscription.quota.mixin'
    _description = 'Mixin pour vérifier les quotas d\'abonnement'

    @api.model
    def check_subscription_quota(self, resource_type):
        """
        Vérifie le quota avant création d'une ressource.
        Lance une exception si limite atteinte.
        """
        company = self.env.user.company_id

        subscription = self.env['quelyos.subscription'].search([
            ('company_id', '=', company.id),
            ('state', 'in', ['trial', 'active'])
        ], limit=1)

        if not subscription:
            raise UserError("Aucun abonnement actif trouvé.")

        is_limit_reached, current, limit = subscription.check_quota_limit(resource_type)

        if is_limit_reached:
            raise UserError(
                f"Limite de {resource_type} atteinte ({current}/{limit}).\n"
                f"Veuillez upgrader votre plan pour continuer."
            )

        return True


# Exemple d'utilisation dans product.template
class ProductTemplateWithQuota(models.Model):
    _inherit = 'product.template'

    @api.model_create_multi
    def create(self, vals_list):
        # Vérifier quota produits avant création
        self.env['subscription.quota.mixin'].check_subscription_quota('products')
        return super().create(vals_list)


# Exemple d'utilisation dans res.users
class ResUsersWithQuota(models.Model):
    _inherit = 'res.users'

    @api.model_create_multi
    def create(self, vals_list):
        # Vérifier quota utilisateurs avant création
        self.env['subscription.quota.mixin'].check_subscription_quota('users')
        return super().create(vals_list)
```

---

## 🎨 Interfaces Utilisateur

### 1. Page Pricing Publique (Frontend Next.js)

#### `frontend/src/app/pricing/page.tsx`

```tsx
import { Metadata } from 'next';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Tarifs - Quelyos ERP',
  description: 'Choisissez le plan qui correspond à vos besoins'
};

const plans = [
  {
    name: 'Starter',
    price: 29,
    code: 'starter',
    description: 'Parfait pour démarrer votre activité',
    popular: false,
    features: [
      { name: '1 utilisateur', included: true },
      { name: 'Jusqu\'à 1 000 produits', included: true },
      { name: '5 000 commandes/an', included: true },
      { name: 'Support email (48h)', included: true },
      { name: 'Toutes fonctionnalités de base', included: true },
      { name: 'Analytics avancés', included: false },
      { name: 'Multi-entrepôts', included: false },
      { name: 'API', included: false }
    ]
  },
  {
    name: 'Pro',
    price: 79,
    code: 'pro',
    description: 'Pour les e-commerçants en croissance',
    popular: true,
    features: [
      { name: 'Jusqu\'à 5 utilisateurs', included: true },
      { name: 'Jusqu\'à 10 000 produits', included: true },
      { name: '50 000 commandes/an', included: true },
      { name: 'Support email + chat (24h)', included: true },
      { name: 'Toutes fonctionnalités Starter +', included: true },
      { name: 'Analytics avancés', included: true },
      { name: 'Multi-entrepôts', included: true },
      { name: 'API complète', included: true },
      { name: 'Personnalisation thème', included: true },
      { name: 'Exports CSV/Excel', included: true }
    ]
  },
  {
    name: 'Enterprise',
    price: null,
    code: 'enterprise',
    description: 'Solutions sur-mesure pour grandes entreprises',
    popular: false,
    features: [
      { name: 'Utilisateurs illimités', included: true },
      { name: 'Produits illimités', included: true },
      { name: 'Commandes illimitées', included: true },
      { name: 'Support dédié (2h)', included: true },
      { name: 'Toutes fonctionnalités Pro +', included: true },
      { name: 'Onboarding personnalisé', included: true },
      { name: 'SLA 99.9%', included: true },
      { name: 'Environnement dédié', included: true },
      { name: 'Développements custom', included: true }
    ]
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Tarifs simples et transparents
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
            Choisissez le plan qui correspond à vos besoins. Changez ou annulez à tout moment.
          </p>

          {/* Toggle mensuel/annuel */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className="text-gray-900 dark:text-white font-medium">Mensuel</span>
            <button
              type="button"
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 dark:bg-gray-700 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
              role="switch"
              aria-checked="false"
            >
              <span className="translate-x-0 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
            </button>
            <span className="text-gray-900 dark:text-white font-medium">
              Annuel <span className="text-sm text-green-600 dark:text-green-400">(-20%)</span>
            </span>
          </div>
        </div>

        {/* Plans */}
        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.code}
              className={`relative rounded-2xl border-2 p-8 shadow-sm ${
                plan.popular
                  ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-600 dark:ring-indigo-500'
                  : 'border-gray-200 dark:border-gray-700'
              } bg-white dark:bg-gray-800 transition-all duration-200 hover:shadow-lg`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex rounded-full bg-indigo-600 px-4 py-1 text-sm font-semibold text-white">
                    Le plus populaire
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {plan.description}
                </p>

                <div className="mt-6">
                  {plan.price ? (
                    <>
                      <span className="text-5xl font-bold text-gray-900 dark:text-white">
                        {plan.price}€
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">/mois</span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      Sur devis
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className={`mt-8 w-full rounded-lg px-6 py-3 text-center text-sm font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                  }`}
                >
                  {plan.price ? 'Commencer l\'essai gratuit' : 'Nous contacter'}
                </button>

                {plan.price && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    14 jours d'essai gratuit. Aucune carte bancaire requise.
                  </p>
                )}
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    {feature.included ? (
                      <CheckIcon className="h-5 w-5 flex-shrink-0 text-green-500" />
                    ) : (
                      <XMarkIcon className="h-5 w-5 flex-shrink-0 text-gray-300 dark:text-gray-600" />
                    )}
                    <span
                      className={`text-sm ${
                        feature.included
                          ? 'text-gray-700 dark:text-gray-300'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
            Questions fréquentes
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* FAQ items */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Puis-je changer de plan à tout moment ?
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements sont appliqués immédiatement avec un prorata.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Que se passe-t-il si je dépasse mes limites ?
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Vous serez notifié par email lorsque vous approchez de vos limites (80%). Au-delà, vous devrez upgrader pour continuer à ajouter des ressources.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                L'essai gratuit est-il vraiment gratuit ?
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Oui ! Aucune carte bancaire n'est requise pour démarrer votre essai de 14 jours. Vous ne serez facturé que si vous choisissez de continuer après la période d'essai.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Puis-je annuler mon abonnement ?
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Oui, vous pouvez annuler à tout moment. L'accès reste actif jusqu'à la fin de votre période de facturation en cours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 2. Interface Backoffice - Gestion Abonnements

#### `backoffice/src/pages/Subscriptions.tsx`

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Subscription } from '../types';

export default function Subscriptions() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions', page],
    queryFn: () => api.getSubscriptions({ limit, offset: (page - 1) * limit })
  });

  const getStateColor = (state: string) => {
    const colors = {
      trial: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      past_due: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      expired: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[state as keyof typeof colors] || colors.active;
  };

  const getStateLabel = (state: string) => {
    const labels = {
      trial: 'Essai',
      active: 'Actif',
      past_due: 'Paiement en retard',
      cancelled: 'Annulé',
      expired: 'Expiré'
    };
    return labels[state as keyof typeof labels] || state;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const subscriptions = data?.data || [];
  const total = data?.total || 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Abonnements
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gérez tous les abonnements clients
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total abonnements</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {total}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Actifs</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {subscriptions.filter((s: Subscription) => s.state === 'active').length}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">En essai</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {subscriptions.filter((s: Subscription) => s.state === 'trial').length}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Annulés ce mois</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {subscriptions.filter((s: Subscription) => s.state === 'cancelled').length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Cycle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Prochaine facturation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Utilisation
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {subscriptions.map((subscription: Subscription) => (
              <tr key={subscription.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {subscription.partner_name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {subscription.partner_email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {subscription.plan_name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStateColor(subscription.state)}`}>
                    {getStateLabel(subscription.state)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {subscription.billing_cycle === 'monthly' ? 'Mensuel' : 'Annuel'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {subscription.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString('fr-FR') : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-xs">
                    <div className="text-gray-600 dark:text-gray-400">
                      Produits: {subscription.current_products_count}/{subscription.max_products}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Users: {subscription.current_users_count}/{subscription.max_users}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Précédent
          </button>
          <span className="px-4 py-2 text-gray-900 dark:text-white">
            Page {page} sur {Math.ceil(total / limit)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / limit)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 📄 Documentation Légale

### CGV SaaS Template

```markdown
# Conditions Générales de Vente - Quelyos ERP SaaS

**Dernière mise à jour : [DATE]**

## 1. Objet

Les présentes Conditions Générales de Vente (CGV) régissent la fourniture du service SaaS Quelyos ERP.

## 2. Définitions

- **Service** : Plateforme SaaS Quelyos ERP accessible via https://app.quelyos.com
- **Client** : Toute personne morale ou physique ayant souscrit un abonnement
- **Abonnement** : Contrat de fourniture du Service pour une durée déterminée

## 3. Tarification

### 3.1 Plans disponibles

- **Starter** : 29€ HT/mois
- **Pro** : 79€ HT/mois
- **Enterprise** : Sur devis

### 3.2 Facturation

- Paiement mensuel ou annuel (-20%)
- Prélèvement automatique le 1er de chaque mois
- TVA applicable selon législation en vigueur

### 3.3 Période d'essai

- 14 jours gratuits sans engagement
- Aucune carte bancaire requise
- Accès complet au plan choisi

## 4. Quotas et Limitations

### 4.1 Limites par plan

Chaque plan inclut des limites de ressources :
- Nombre d'utilisateurs
- Nombre de produits
- Nombre de commandes par an

### 4.2 Dépassement

En cas de dépassement :
1. Notification email à 80% de la limite
2. Blocage de la création au-delà de 100%
3. Upgrade recommandé pour continuer

## 5. Données et Sécurité

### 5.1 Propriété des données

Le Client reste propriétaire de toutes ses données.

### 5.2 Sauvegarde

- Sauvegarde quotidienne automatique
- Rétention 30 jours
- Export disponible à tout moment

### 5.3 Sécurité

- Chiffrement SSL/TLS
- Hébergement sécurisé (AWS/OVH)
- Conformité RGPD

## 6. Durée et Résiliation

### 6.1 Durée

L'abonnement est souscrit pour une durée d'un mois ou un an, renouvelable tacitement.

### 6.2 Résiliation par le Client

- Sans préavis ni pénalité
- Accès jusqu'à la fin de la période facturée
- Export des données disponible 30 jours

### 6.3 Résiliation par Quelyos

En cas de :
- Non-paiement persistant
- Violation des CGV
- Utilisation frauduleuse

Préavis de 15 jours, sauf urgence.

## 7. Support et Disponibilité

### 7.1 Support

- **Starter** : Email (48h)
- **Pro** : Email + Chat (24h)
- **Enterprise** : Support dédié (2h)

### 7.2 Disponibilité

- Objectif 99.5% (Starter/Pro)
- Objectif 99.9% (Enterprise avec SLA)
- Maintenance programmée hors heures ouvrées

## 8. Responsabilité

### 8.1 Limitations

Quelyos ne peut être tenu responsable :
- Des dommages indirects
- De la perte de données due au Client
- Des interruptions de service indépendantes de sa volonté

### 8.2 Indemnisation

La responsabilité de Quelyos est limitée au montant des sommes payées sur les 12 derniers mois.

## 9. Modification des CGV

Quelyos se réserve le droit de modifier les CGV. Les Clients seront notifiés 30 jours avant.

## 10. Droit applicable

Les présentes CGV sont soumises au droit français.

---

**Contact** : [EMAIL] | [TÉLÉPHONE]
```

---

## 🚀 Roadmap d'Implémentation

### Sprint 1 (Semaine 1) - Backend

- [ ] Créer modèles Odoo (`quelyos.subscription.plan`, `quelyos.subscription`)
- [ ] Développer endpoints API (plans, abonnement actuel, upgrade, cancel)
- [ ] Implémenter système de quotas (mixin + vérifications)
- [ ] Créer données initiales (3 plans avec features)
- [ ] Tests unitaires backend

### Sprint 2 (Semaine 2) - Stripe

- [ ] Configurer Stripe Subscriptions (products + prices)
- [ ] Implémenter webhooks Stripe
- [ ] Intégrer création d'abonnement avec Stripe
- [ ] Tester workflow complet paiement
- [ ] Gérer les cas d'erreur (payment_failed, etc.)

### Sprint 3 (Semaine 3) - Frontend

- [ ] Page `/pricing` publique avec 3 plans
- [ ] Page espace client `/account/subscription`
- [ ] Dashboard utilisation quotas avec progress bars
- [ ] Modal upgrade de plan
- [ ] Stripe Elements pour paiement
- [ ] Tests E2E parcours complet

### Sprint 4 (Semaine 4) - Backoffice

- [ ] Page admin Subscriptions (liste tous abonnements)
- [ ] Page admin Plans (gestion plans)
- [ ] Dashboard analytics SaaS (MRR, churn, etc.)
- [ ] Notifications email automatiques
- [ ] Tests finaux + bug fixes

### Sprint 5 (Semaine 5) - Legal & Launch

- [ ] Rédiger CGV/CGU SaaS complètes
- [ ] Page `/legal` avec CGV/CGU/Mentions légales
- [ ] Politique de confidentialité RGPD
- [ ] Documentation utilisateur
- [ ] Mise en production

---

## 📈 KPIs à Suivre

### Métriques Business

- **MRR (Monthly Recurring Revenue)** : CA mensuel récurrent
- **ARR (Annual Recurring Revenue)** : CA annuel récurrent
- **Churn Rate** : Taux d'attrition mensuel
- **CAC (Customer Acquisition Cost)** : Coût d'acquisition client
- **LTV (Lifetime Value)** : Valeur vie client
- **LTV/CAC Ratio** : Ratio rentabilité (cible > 3)

### Métriques Produit

- **Trial-to-Paid Conversion** : Taux conversion essai → payant (cible > 20%)
- **Active Subscriptions** : Nombre abonnements actifs
- **Upgrade Rate** : Taux upgrade Starter → Pro (cible > 15%)
- **Time to First Value** : Temps avant première utilisation productive

### Métriques Usage

- **DAU/MAU** : Daily/Monthly Active Users
- **Feature Adoption** : Taux utilisation fonctionnalités clés
- **Quota Usage** : % utilisation quotas par plan
- **Support Tickets** : Nombre tickets par plan

---

## 🎯 Prochaines Étapes

1. ✅ Créer documentation complète (ce fichier)
2. ⏳ Développer modèles backend Odoo
3. ⏳ Implémenter API endpoints
4. ⏳ Intégrer Stripe Subscriptions
5. ⏳ Créer interfaces utilisateur
6. ⏳ Tests et validation
7. ⏳ Déploiement production

---

**Temps estimé total** : 5 semaines (1 développeur full-time)

**Prêt pour production** : Fin Février 2026
