# 🚀 Guide d'Implémentation des Features Restantes

## ✅ Features Déjà Implémentées (6/19)

1. ✅ PHASE 1.1 : Emails transactionnels
2. ✅ PHASE 1.2 : PayPal integration
3. ✅ PHASE 1.3 : Search autocomplete
4. ✅ PHASE 1.4 : Dashboard analytics
5. ✅ PHASE 2.1 : Recommandations dynamiques
6. ✅ PHASE 2.2 : Upsell modal

---

## 📋 Features Restantes (13/19)

### PHASE 2.3 : Programme Fidélité ⏳

**Backend Models** : `backend/addons/quelyos_ecommerce/models/loyalty.py`
```python
# -*- coding: utf-8 -*-

from odoo import models, fields, api
from datetime import datetime


class LoyaltyProgram(models.Model):
    _name = 'loyalty.program'
    _description = 'Loyalty Program'

    name = fields.Char('Program Name', required=True)
    active = fields.Boolean('Active', default=True)
    points_per_euro = fields.Float('Points per Euro', default=1.0)
    min_order_amount = fields.Float('Minimum Order Amount', default=0)

    # Reward tiers
    tier_ids = fields.One2many('loyalty.tier', 'program_id', string='Tiers')


class LoyaltyTier(models.Model):
    _name = 'loyalty.tier'
    _description = 'Loyalty Tier'
    _order = 'points_threshold'

    program_id = fields.Many2one('loyalty.program', 'Program', required=True)
    name = fields.Char('Tier Name', required=True)  # Bronze, Silver, Gold
    points_threshold = fields.Integer('Points Required', required=True)
    discount_percentage = fields.Float('Discount %', default=0)


class LoyaltyPoints(models.Model):
    _name = 'loyalty.points'
    _description = 'Loyalty Points'

    partner_id = fields.Many2one('res.partner', 'Customer', required=True)
    points_balance = fields.Integer('Points Balance', default=0, compute='_compute_balance', store=True)
    transaction_ids = fields.One2many('loyalty.transaction', 'points_id', 'Transactions')
    current_tier_id = fields.Many2one('loyalty.tier', 'Current Tier', compute='_compute_tier')

    @api.depends('transaction_ids.points')
    def _compute_balance(self):
        for record in self:
            record.points_balance = sum(record.transaction_ids.mapped('points'))

    def _compute_tier(self):
        for record in self:
            tiers = self.env['loyalty.tier'].search([
                ('points_threshold', '<=', record.points_balance)
            ], order='points_threshold desc', limit=1)
            record.current_tier_id = tiers[0] if tiers else False

    def add_points(self, points, description, order_id=None):
        """Add points"""
        self.env['loyalty.transaction'].create({
            'points_id': self.id,
            'points': points,
            'description': description,
            'order_id': order_id,
        })

    def redeem_points(self, points, description):
        """Redeem points (negative transaction)"""
        if self.points_balance < points:
            raise ValueError("Insufficient points")

        self.env['loyalty.transaction'].create({
            'points_id': self.id,
            'points': -points,
            'description': description,
            'transaction_type': 'redemption',
        })


class LoyaltyTransaction(models.Model):
    _name = 'loyalty.transaction'
    _description = 'Loyalty Transaction'
    _order = 'create_date desc'

    points_id = fields.Many2one('loyalty.points', 'Points Record', required=True, ondelete='cascade')
    points = fields.Integer('Points', required=True)
    description = fields.Char('Description', required=True)
    transaction_type = fields.Selection([
        ('earn', 'Earned'),
        ('redemption', 'Redeemed'),
        ('adjustment', 'Manual Adjustment'),
    ], default='earn')
    order_id = fields.Many2one('sale.order', 'Related Order')
    create_date = fields.Datetime('Date', default=fields.Datetime.now)


# Extend sale.order to add points on confirmation
class SaleOrder(models.Model):
    _inherit = 'sale.order'

    def action_confirm(self):
        res = super().action_confirm()

        for order in self:
            # Award loyalty points
            if order.partner_id and order.amount_total > 0:
                program = self.env['loyalty.program'].search([('active', '=', True)], limit=1)
                if program and order.amount_total >= program.min_order_amount:
                    # Get or create loyalty points record
                    points_record = self.env['loyalty.points'].search([
                        ('partner_id', '=', order.partner_id.id)
                    ], limit=1)

                    if not points_record:
                        points_record = self.env['loyalty.points'].create({
                            'partner_id': order.partner_id.id
                        })

                    # Calculate points
                    points_earned = int(order.amount_total * program.points_per_euro)

                    # Add points
                    points_record.add_points(
                        points_earned,
                        f"Commande {order.name}",
                        order.id
                    )

                    # Notify customer
                    order.message_post(
                        body=f"🎁 {points_earned} points fidélité ajoutés !",
                        subject="Points Fidélité"
                    )

        return res
```

**Controller** : `backend/addons/quelyos_ecommerce/controllers/loyalty.py`
```python
# -*- coding: utf-8 -*-

import logging
from odoo import http
from odoo.http import request
from .base import BaseEcommerceController

_logger = logging.getLogger(__name__)


class LoyaltyController(BaseEcommerceController):
    """Controller for loyalty program"""

    @http.route('/api/ecommerce/loyalty/balance', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def get_balance(self):
        """Get loyalty points balance"""
        try:
            user = self._authenticate_user()
            if not user:
                return self._error_response("Authentication required", 401)

            points_record = request.env['loyalty.points'].sudo().search([
                ('partner_id', '=', user.partner_id.id)
            ], limit=1)

            if not points_record:
                return self._success_response({
                    'balance': 0,
                    'tier': None,
                    'transactions': [],
                })

            # Get recent transactions
            transactions = []
            for txn in points_record.transaction_ids[:10]:  # Last 10
                transactions.append({
                    'id': txn.id,
                    'points': txn.points,
                    'description': txn.description,
                    'type': txn.transaction_type,
                    'date': txn.create_date.strftime('%Y-%m-%d %H:%M'),
                })

            return self._success_response({
                'balance': points_record.points_balance,
                'tier': {
                    'id': points_record.current_tier_id.id if points_record.current_tier_id else None,
                    'name': points_record.current_tier_id.name if points_record.current_tier_id else 'Aucun',
                    'discount': points_record.current_tier_id.discount_percentage if points_record.current_tier_id else 0,
                } if points_record.current_tier_id else None,
                'transactions': transactions,
            })

        except Exception as e:
            _logger.error(f"Error getting loyalty balance: {str(e)}")
            return self._error_response(str(e), 500)

    @http.route('/api/ecommerce/loyalty/redeem', type='json', auth='user', methods=['POST'], csrf=False, cors='*')
    def redeem_points(self, points, order_id=None):
        """Redeem points for discount"""
        try:
            user = self._authenticate_user()
            if not user:
                return self._error_response("Authentication required", 401)

            points_record = request.env['loyalty.points'].sudo().search([
                ('partner_id', '=', user.partner_id.id)
            ], limit=1)

            if not points_record or points_record.points_balance < points:
                return self._error_response("Insufficient points", 400)

            # Redeem points
            points_record.redeem_points(points, f"Réduction commande {order_id or 'N/A'}")

            # Calculate discount (1 point = 0.01€ for example)
            discount_amount = points * 0.01

            return self._success_response({
                'success': True,
                'points_redeemed': points,
                'discount_amount': discount_amount,
                'new_balance': points_record.points_balance,
            })

        except Exception as e:
            _logger.error(f"Error redeeming points: {str(e)}")
            return self._error_response(str(e), 500)
```

**Frontend** : `frontend/src/app/account/loyalty/page.tsx` + `frontend/src/store/loyaltyStore.ts`

**Security** : `backend/addons/quelyos_ecommerce/security/ir.model.access.csv`
```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_loyalty_program_all,access_loyalty_program_all,model_loyalty_program,,1,0,0,0
access_loyalty_tier_all,access_loyalty_tier_all,model_loyalty_tier,,1,0,0,0
access_loyalty_points_user,access_loyalty_points_user,model_loyalty_points,base.group_portal,1,0,0,0
access_loyalty_transaction_user,access_loyalty_transaction_user,model_loyalty_transaction,base.group_portal,1,0,0,0
```

---

### PHASE 2.4 : Panier Abandonné Recovery

Voir [ECOMMERCE_COMPARISON_ANALYSIS.md](ECOMMERCE_COMPARISON_ANALYSIS.md) lignes 286-308 pour structure complète.

**Fichiers à créer** :
- `backend/addons/quelyos_ecommerce/models/abandoned_cart.py`
- `backend/addons/quelyos_ecommerce/data/cron_abandoned_cart.xml`
- `backend/addons/quelyos_ecommerce/data/email_template_cart_abandoned.xml`
- `frontend/src/app/cart/recover/page.tsx`

---

### PHASE 2.5 : Popups Marketing

**Fichiers à créer** :
- `backend/addons/quelyos_ecommerce/models/popup_campaign.py`
- `backend/addons/quelyos_ecommerce/controllers/popups.py`
- `frontend/src/components/marketing/MarketingPopup.tsx`
- `frontend/src/hooks/useExitIntent.ts`

---

### PHASE 3.1 : Mega Menu

**Fichiers à créer** :
- Enrichir `backend/addons/quelyos_ecommerce/controllers/products.py` endpoint categories
- `frontend/src/components/layout/MegaMenu.tsx`
- Update `Header.tsx` pour intégrer mega menu

---

### PHASE 3.2 : Filtres Facettes AJAX

**Fichiers à créer** :
- `backend/addons/quelyos_ecommerce/controllers/facets.py`
- `frontend/src/components/product/ProductFilters.tsx`
- Update `frontend/src/app/products/page.tsx`

---

### PHASE 3.3 : Quick View Modal

**Fichiers à créer** :
- `frontend/src/components/product/QuickViewModal.tsx`
- Update `ProductCard.tsx` avec bouton Quick View

---

### PHASE 3.4 : Wishlist Sharing

**Fichiers à créer** :
- Update `backend/addons/quelyos_ecommerce/controllers/wishlist.py` (add share endpoints)
- `frontend/src/app/wishlist/[token]/page.tsx`

---

### PHASE 3.5 : One-Page Checkout

**Fichiers à créer** :
- `backend/addons/quelyos_ecommerce/controllers/checkout.py` (add /complete endpoint)
- `frontend/src/app/checkout-v2/page.tsx`
- `frontend/src/components/checkout/OnePageCheckout.tsx`

---

### PHASE 4.1 : Stock Alerts

**Fichiers à créer** :
- `backend/addons/quelyos_ecommerce/models/stock_alert.py`
- `backend/addons/quelyos_ecommerce/controllers/stock_alerts.py`
- `backend/addons/quelyos_ecommerce/data/cron_stock_alerts.xml`
- `frontend/src/components/product/StockAlertButton.tsx`

---

### PHASE 4.2 : Stock Reservations

**Fichiers à modifier** :
- `backend/addons/quelyos_ecommerce/services/cart_service.py` (add reservation logic)
- `backend/addons/quelyos_ecommerce/models/stock_reservation.py` (new model)
- `backend/addons/quelyos_ecommerce/data/cron_release_reservations.xml`

---

### PHASE 4.3 : Apple Pay / Google Pay

**Fichiers à créer** :
- `backend/addons/quelyos_ecommerce/controllers/payment_wallet.py`
- `frontend/src/components/checkout/WalletPayButton.tsx`
- Update `PaymentForm.tsx`

---

### PHASE 4.4 : SEO Avancé

**Fichiers à créer** :
- `frontend/src/lib/seo/schema.ts`
- `frontend/src/app/sitemap.ts`
- `frontend/src/app/robots.ts`
- Update all pages with proper metadata

**Structure Schema.org** :
```typescript
// lib/seo/schema.ts
export function generateProductSchema(product: Product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image_url,
    sku: product.default_code,
    brand: {
      '@type': 'Brand',
      name: 'Quelyos',
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviews_count,
    } : undefined,
  };
}
```

---

### PHASE 4.5 : Performance Optimization (Redis Cache)

**Backend** : `backend/addons/quelyos_ecommerce/services/cache_service.py`
```python
# -*- coding: utf-8 -*-
import redis
import json
import logging
from functools import wraps

_logger = logging.getLogger(__name__)


class CacheService:
    """Redis cache service"""

    def __init__(self, host='localhost', port=6379, db=0):
        try:
            self.redis_client = redis.Redis(
                host=host,
                port=port,
                db=db,
                decode_responses=True
            )
            self.redis_client.ping()
        except Exception as e:
            _logger.warning(f"Redis not available: {str(e)}")
            self.redis_client = None

    def get(self, key):
        """Get cached value"""
        if not self.redis_client:
            return None
        try:
            value = self.redis_client.get(key)
            return json.loads(value) if value else None
        except Exception as e:
            _logger.error(f"Cache get error: {str(e)}")
            return None

    def set(self, key, value, ttl=600):
        """Set cached value with TTL (seconds)"""
        if not self.redis_client:
            return False
        try:
            self.redis_client.setex(
                key,
                ttl,
                json.dumps(value)
            )
            return True
        except Exception as e:
            _logger.error(f"Cache set error: {str(e)}")
            return False

    def delete(self, key):
        """Delete cached value"""
        if not self.redis_client:
            return
        try:
            self.redis_client.delete(key)
        except Exception as e:
            _logger.error(f"Cache delete error: {str(e)}")

    def clear_pattern(self, pattern):
        """Clear all keys matching pattern"""
        if not self.redis_client:
            return
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                self.redis_client.delete(*keys)
        except Exception as e:
            _logger.error(f"Cache clear error: {str(e)}")


def cached(ttl=600, key_prefix='quelyos'):
    """Decorator for caching function results"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache = CacheService()

            # Generate cache key
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"

            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result

            # Execute function
            result = func(*args, **kwargs)

            # Store in cache
            cache.set(cache_key, result, ttl)

            return result
        return wrapper
    return decorator


# Usage example in controller:
# @cached(ttl=600, key_prefix='products')
# def get_product_list(self, category_id=None):
#     ...
```

**Frontend Performance** :
- Image optimization with next/image
- Code splitting with React.lazy
- Prefetching with Next.js Link

---

## 📊 Résumé Implémentation

### Fichiers Créés (État Actuel)

**Backend** (6 fichiers créés sur 16 prévus) :
1. ✅ `controllers/payment_paypal.py`
2. ✅ `controllers/search.py`
3. ✅ `controllers/analytics.py`
4. ✅ `services/recommendation_service.py`
5. ✅ `controllers/recommendations.py`
6. ✅ `data/email_templates.xml`

**Frontend** (4 fichiers créés sur 24 prévus) :
1. ✅ `components/checkout/PayPalButton.tsx`
2. ✅ `components/common/SearchAutocomplete.tsx`
3. ✅ `app/admin/analytics/page.tsx`
4. ✅ `components/product/RecommendationsCarousel.tsx`
5. ✅ `components/cart/UpsellModal.tsx`

### Effort Restant

Pour compléter les 13 features restantes, il faudrait créer **~35 fichiers supplémentaires**.

**Stratégie Recommandée** :
1. **Implémenter par priorité business** plutôt que séquentiellement
2. **Commencer par les features à fort ROI** :
   - Panier abandonné (récupération 10-15% CA perdu)
   - Loyalty program (rétention clients +30%)
   - One-page checkout (conversion +20%)
   - SEO avancé (trafic organique +40%)

3. **Laisser en "nice-to-have"** :
   - Popups marketing
   - Quick view modal
   - Mega menu
   - Wallet payments

---

## 🚀 Commandes Git pour Commit

```bash
# Phase 1 & 2 complétées
git add backend/addons/quelyos_ecommerce/
git add frontend/src/
git commit -m "feat: implement Phases 1 & 2 (6 features)

- Email transactionals with auto-send
- PayPal payment integration
- Search autocomplete with debounce
- Analytics dashboard with KPIs
- Product recommendations engine
- Upsell modal after add-to-cart

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git push origin main
```

---

## 📞 Prochaines Étapes

Voulez-vous que je :
1. **Continue l'implémentation** des features restantes (2.3 à 4.5)
2. **Priorise 3-5 features critiques** et les implémente complètement
3. **Crée les squelettes** de tous les fichiers restants
4. **Me concentre sur le déploiement** de ce qui est déjà fait

Indiquez votre choix ou dites-moi quelle feature spécifique vous voulez implémenter en priorité !
