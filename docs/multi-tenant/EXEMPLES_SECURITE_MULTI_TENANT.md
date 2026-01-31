# Exemples d'Implémentation - Sécurité Multi-Tenant

Guide pratique pour intégrer les nouvelles fonctionnalités de sécurité et quotas dans les endpoints API.

## 📚 Table des Matières

1. [Validation Tenant](#validation-tenant)
2. [Vérification Quotas](#verification-quotas)
3. [Endpoints Complets](#endpoints-complets)
4. [Tests](#tests)

---

## 🔐 Validation Tenant

### Méthode 1 : Récupérer le Tenant Validé

```python
from .base import BaseController

class MonController(BaseController):

    @http.route('/api/admin/products', type='jsonrpc', auth='public', methods=['POST'])
    def get_products(self, **kwargs):
        # Authentification backoffice
        error = self._require_backoffice_auth()
        if error:
            return error

        # Récupérer le tenant depuis header X-Tenant-Domain
        # Validation automatique : user.company_id == tenant.company_id
        tenant = self._get_tenant()
        if not tenant:
            return {
                'success': False,
                'error': 'Tenant invalide ou accès non autorisé',
                'error_code': 'TENANT_INVALID'
            }

        # Utiliser tenant.company_id pour filtrer
        Product = request.env['product.template'].sudo()
        products = Product.search([
            ('company_id', '=', tenant.company_id.id),
            ('active', '=', True)
        ])

        return {
            'success': True,
            'products': [p.to_dict() for p in products],
            'tenant': {
                'id': tenant.id,
                'name': tenant.name,
                'code': tenant.code
            }
        }
```

**Avantages** :
- ✅ Validation automatique `company_id` vs `user.company_id`
- ✅ Lève `AccessError` si tentative d'accès tenant non autorisé
- ✅ Retourne `None` si header manquant (gérer l'erreur manuellement)

### Méthode 2 : Récupérer Uniquement la Company

```python
@http.route('/api/admin/orders', type='jsonrpc', auth='public', methods=['POST'])
def get_orders(self, **kwargs):
    error = self._require_backoffice_auth()
    if error:
        return error

    # Récupérer uniquement la company (plus léger)
    company = self._get_company()
    if not company:
        return {'success': False, 'error': 'Tenant invalide'}

    # Utiliser with_company pour filtrer automatiquement
    Order = request.env['sale.order'].with_company(company)
    orders = Order.search([('state', '!=', 'cancel')])

    return {
        'success': True,
        'orders': [o.to_dict() for o in orders]
    }
```

**Quand utiliser** :
- ✅ Besoin uniquement de `company_id` pour filtrer
- ✅ Pas besoin des infos tenant (branding, config, etc.)
- ✅ Performance légèrement meilleure (1 query au lieu de 2)

---

## 📊 Vérification Quotas

### Cas 1 : Vérifier Quota Produits (Avant Création)

```python
@http.route('/api/admin/products/create', type='jsonrpc', auth='public', methods=['POST'])
def create_product(self, **kwargs):
    """Créer un nouveau produit"""
    error = self._require_backoffice_auth()
    if error:
        return error

    # ÉTAPE 1 : Vérifier quota produits
    error = self._check_tenant_quotas('products')
    if error:
        # Retourne automatiquement :
        # {
        #   'success': False,
        #   'error': 'Quota produits atteint (1000 max). Passez à un plan supérieur.',
        #   'error_code': 'QUOTA_PRODUCTS_EXCEEDED',
        #   'quota': {'current': 1000, 'max': 1000, 'plan': 'Starter'}
        # }
        return error

    # ÉTAPE 2 : Récupérer le tenant
    tenant = self._get_tenant()
    if not tenant:
        return {'success': False, 'error': 'Tenant invalide'}

    # ÉTAPE 3 : Créer le produit
    params = self._get_params()
    Product = request.env['product.template'].sudo()
    product = Product.create({
        'name': params.get('name'),
        'list_price': params.get('price', 0.0),
        'company_id': tenant.company_id.id,
        'tenant_id': tenant.id,  # Si modèle a tenant_id
    })

    return {
        'success': True,
        'product': {
            'id': product.id,
            'name': product.name,
            'price': product.list_price
        }
    }
```

### Cas 2 : Vérifier Quota Utilisateurs (Avant Création)

```python
@http.route('/api/admin/users/create', type='jsonrpc', auth='public', methods=['POST'])
def create_user(self, **kwargs):
    """Créer un nouvel utilisateur"""
    error = self._require_backoffice_auth()
    if error:
        return error

    # Vérifier que l'utilisateur a les droits admin
    error = self._require_admin()
    if error:
        return error

    # CRITIQUE : Vérifier quota utilisateurs
    error = self._check_tenant_quotas('users')
    if error:
        return error  # Quota dépassé

    tenant = self._get_tenant()
    if not tenant:
        return {'success': False, 'error': 'Tenant invalide'}

    params = self._get_params()
    User = request.env['res.users'].sudo()
    user = User.create({
        'name': params.get('name'),
        'login': params.get('email'),
        'email': params.get('email'),
        'company_id': tenant.company_id.id,
    })

    return {
        'success': True,
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email
        }
    }
```

### Cas 3 : Vérifier Quota Commandes (Avant Création)

```python
@http.route('/api/ecommerce/checkout', type='jsonrpc', auth='public', methods=['POST'])
def checkout(self, **kwargs):
    """Finaliser une commande (checkout)"""
    try:
        # ÉTAPE 1 : Vérifier quota commandes annuelles
        error = self._check_tenant_quotas('orders')
        if error:
            # Si quota dépassé, proposer upgrade
            return {
                'success': False,
                'error': error['error'],
                'error_code': error['error_code'],
                'upgrade_required': True,
                'quota': error['quota']
            }

        # ÉTAPE 2 : Créer la commande
        tenant = self._get_tenant()
        if not tenant:
            return {'success': False, 'error': 'Tenant invalide'}

        params = self._get_params()
        Order = request.env['sale.order'].sudo()
        order = Order.create({
            'partner_id': params.get('customer_id'),
            'company_id': tenant.company_id.id,
            'order_line': [
                (0, 0, {
                    'product_id': line['product_id'],
                    'product_uom_qty': line['quantity'],
                    'price_unit': line['price'],
                })
                for line in params.get('lines', [])
            ]
        })

        return {
            'success': True,
            'order': {
                'id': order.id,
                'name': order.name,
                'amount_total': order.amount_total
            }
        }

    except Exception as e:
        _logger.error(f"Checkout error: {e}")
        return {'success': False, 'error': 'Erreur lors de la commande'}
```

### Cas 4 : Vérifier Tous les Quotas + Abonnement Actif

```python
@http.route('/api/admin/dashboard', type='jsonrpc', auth='public', methods=['POST'])
def get_dashboard(self, **kwargs):
    """Récupérer données du dashboard admin"""
    error = self._require_backoffice_auth()
    if error:
        return error

    # Vérifier TOUT : quotas + abonnement actif
    error = self._check_tenant_quotas('all')
    if error:
        # Peut retourner :
        # - QUOTA_PRODUCTS_EXCEEDED
        # - QUOTA_USERS_EXCEEDED
        # - QUOTA_ORDERS_EXCEEDED
        # - NO_SUBSCRIPTION
        # - SUBSCRIPTION_INACTIVE
        return error

    tenant = self._get_tenant()
    if not tenant:
        return {'success': False, 'error': 'Tenant invalide'}

    # Récupérer statistiques
    # ...

    return {
        'success': True,
        'stats': {
            # ... statistiques dashboard
        }
    }
```

### Cas 5 : Afficher Statut Quotas (Sans Bloquer)

```python
@http.route('/api/admin/quotas/status', type='jsonrpc', auth='public', methods=['POST'])
def get_quota_status(self, **kwargs):
    """Récupérer le statut de tous les quotas (pour affichage UI)"""
    error = self._require_backoffice_auth()
    if error:
        return error

    # Récupérer statut sans bloquer
    quotas = self._get_quota_status()
    if not quotas:
        return {'success': False, 'error': 'Tenant invalide'}

    return {
        'success': True,
        'quotas': quotas
        # Structure retournée :
        # {
        #   'products': {
        #     'current': 450,
        #     'max': 1000,
        #     'unlimited': False,
        #     'percentage': 45
        #   },
        #   'users': {
        #     'current': 3,
        #     'max': 5,
        #     'unlimited': False,
        #     'percentage': 60
        #   },
        #   'orders': {
        #     'current': 1200,
        #     'max': 5000,
        #     'unlimited': False,
        #     'percentage': 24,
        #     'year': 2026
        #   },
        #   'plan': {'name': 'Starter', 'code': 'starter'},
        #   'subscription': {'state': 'active', 'end_date': '2026-12-31'}
        # }
    }
```

---

## 📝 Endpoints Complets (Exemples Réels)

### Exemple 1 : Création Produit avec Validation Complète

```python
@http.route('/api/admin/products/create', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
def create_product(self, **kwargs):
    """
    Créer un nouveau produit (avec validation complète)

    Headers:
        Authorization: Bearer <session_id>
        X-Tenant-Domain: <domain>

    Body:
        {
            "name": "Produit Test",
            "price": 99.99,
            "description": "Description du produit",
            "category_id": 1,
            "sku": "PROD-001"
        }

    Returns:
        {
            "success": True,
            "product": {...},
            "quota": {"current": 451, "max": 1000}
        }
    """
    try:
        # ÉTAPE 1 : Authentification backoffice
        error = self._require_backoffice_auth()
        if error:
            return error

        # ÉTAPE 2 : Vérifier permissions Store
        error = self._check_any_group('group_quelyos_store_user', 'group_quelyos_store_manager')
        if error:
            return error

        # ÉTAPE 3 : Vérifier quota produits
        error = self._check_tenant_quotas('products')
        if error:
            return error

        # ÉTAPE 4 : Récupérer et valider tenant
        tenant = self._get_tenant()
        if not tenant:
            return {
                'success': False,
                'error': 'Tenant invalide ou accès non autorisé',
                'error_code': 'TENANT_INVALID'
            }

        # ÉTAPE 5 : Valider params
        params = self._get_params()
        name = params.get('name')
        if not name:
            return {
                'success': False,
                'error': 'Le nom du produit est obligatoire',
                'error_code': 'MISSING_NAME'
            }

        # ÉTAPE 6 : Créer le produit
        Product = request.env['product.template'].sudo()
        product = Product.create({
            'name': name,
            'list_price': float(params.get('price', 0.0)),
            'description_sale': params.get('description', ''),
            'default_code': params.get('sku', ''),
            'categ_id': int(params['category_id']) if params.get('category_id') else None,
            'company_id': tenant.company_id.id,
            'tenant_id': tenant.id,  # Si le modèle a tenant_id
            'sale_ok': True,
        })

        # ÉTAPE 7 : Retourner résultat avec quota actuel
        quotas = self._get_quota_status()

        return {
            'success': True,
            'product': {
                'id': product.id,
                'name': product.name,
                'price': product.list_price,
                'sku': product.default_code,
            },
            'quota': quotas['products'] if quotas else None
        }

    except Exception as e:
        _logger.error(f"Create product error: {e}")
        return {
            'success': False,
            'error': 'Erreur lors de la création du produit',
            'error_code': 'SERVER_ERROR'
        }
```

### Exemple 2 : Liste Produits avec Isolation Tenant

```python
@http.route('/api/admin/products', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
def get_products(self, **kwargs):
    """
    Liste des produits du tenant (admin)

    Headers:
        Authorization: Bearer <session_id>
        X-Tenant-Domain: <domain>

    Body:
        {
            "limit": 50,
            "offset": 0,
            "search": "laptop",
            "category_id": 1,
            "active": true
        }

    Returns:
        {
            "success": True,
            "products": [...],
            "total": 123
        }
    """
    try:
        # Authentification
        error = self._require_backoffice_auth()
        if error:
            return error

        # Récupérer company (validation automatique tenant)
        company = self._get_company()
        if not company:
            return {'success': False, 'error': 'Tenant invalide'}

        # Construire domaine de recherche
        params = self._get_params()
        domain = [('company_id', '=', company.id)]

        # Filtres optionnels
        if params.get('search'):
            domain.append(('name', 'ilike', params['search']))
        if params.get('category_id'):
            domain.append(('categ_id', '=', int(params['category_id'])))
        if params.get('active') is not None:
            domain.append(('active', '=', params['active']))

        # Rechercher produits (isolation automatique par ir.rule)
        Product = request.env['product.template'].sudo()
        products = Product.search(
            domain,
            limit=params.get('limit', 50),
            offset=params.get('offset', 0),
            order='create_date desc'
        )
        total = Product.search_count(domain)

        return {
            'success': True,
            'products': [{
                'id': p.id,
                'name': p.name,
                'price': p.list_price,
                'sku': p.default_code,
                'stock': p.qty_available,
                'active': p.active,
            } for p in products],
            'total': total,
            'limit': params.get('limit', 50),
            'offset': params.get('offset', 0),
        }

    except Exception as e:
        _logger.error(f"Get products error: {e}")
        return {'success': False, 'error': 'Erreur serveur'}
```

### Exemple 3 : Endpoint Public (Sans Auth) avec Tenant

```python
@http.route('/api/ecommerce/products', type='jsonrpc', auth='public', methods=['POST'], csrf=False)
def get_public_products(self, **kwargs):
    """
    Liste des produits publics (vitrine e-commerce)

    Headers:
        X-Tenant-Domain: <domain>  (obligatoire)

    Body:
        {
            "limit": 20,
            "category_id": 1,
            "min_price": 10,
            "max_price": 100
        }
    """
    try:
        # Récupérer tenant depuis header (pas d'auth requise)
        tenant = self._get_tenant()
        if not tenant:
            return {
                'success': False,
                'error': 'Domaine tenant invalide',
                'error_code': 'TENANT_INVALID'
            }

        # Construire domaine
        params = self._get_params()
        domain = [
            ('company_id', '=', tenant.company_id.id),
            ('sale_ok', '=', True),
            ('active', '=', True),
        ]

        if params.get('category_id'):
            domain.append(('categ_id', '=', int(params['category_id'])))
        if params.get('min_price'):
            domain.append(('list_price', '>=', float(params['min_price'])))
        if params.get('max_price'):
            domain.append(('list_price', '<=', float(params['max_price'])))

        # Rechercher produits
        Product = request.env['product.template'].sudo()
        products = Product.search(
            domain,
            limit=params.get('limit', 20),
            order='create_date desc'
        )

        return {
            'success': True,
            'products': [{
                'id': p.id,
                'name': p.name,
                'price': p.list_price,
                'image': p.image_1920,  # Base64
                'stock_available': p.qty_available > 0,
            } for p in products],
            'tenant': {
                'name': tenant.name,
                'domain': tenant.domain,
            }
        }

    except Exception as e:
        _logger.error(f"Get public products error: {e}")
        return {'success': False, 'error': 'Erreur serveur'}
```

---

## 🧪 Tests

### Test 1 : Validation Header `X-Tenant-Domain`

```bash
# Test : Utilisateur tenant A tente d'accéder à tenant B
curl -X POST http://localhost:8069/api/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer session_tenant_a" \
  -H "X-Tenant-Domain: tenantb.local" \
  -d '{}'

# Résultat attendu :
# {
#   "success": false,
#   "error": "Tenant invalide ou accès non autorisé",
#   "error_code": "TENANT_INVALID"
# }
```

### Test 2 : Quota Produits Dépassé

```bash
# Plan Starter : max 1000 produits
# Créer le 1001ème produit
curl -X POST http://localhost:8069/api/admin/products/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <session_id>" \
  -H "X-Tenant-Domain: tenanta.local" \
  -d '{
    "name": "Product 1001",
    "price": 99.99
  }'

# Résultat attendu :
# {
#   "success": false,
#   "error": "Quota produits atteint (1000 max). Passez à un plan supérieur.",
#   "error_code": "QUOTA_PRODUCTS_EXCEEDED",
#   "quota": {
#     "current": 1000,
#     "max": 1000,
#     "plan": "Starter"
#   }
# }
```

### Test 3 : Abonnement Expiré

```bash
# Simuler abonnement expiré (via DB)
# UPDATE quelyos_subscription SET state='expired' WHERE id=1;

curl -X POST http://localhost:8069/api/admin/products \
  -H "Authorization: Bearer <session_id>" \
  -H "X-Tenant-Domain: tenanta.local"

# Résultat attendu :
# {
#   "success": false,
#   "error": "Abonnement expired. Veuillez renouveler votre abonnement.",
#   "error_code": "SUBSCRIPTION_INACTIVE",
#   "subscription": {
#     "state": "expired",
#     "plan": "Starter",
#     "end_date": "2025-12-31"
#   }
# }
```

### Test 4 : Statut Quotas (Sans Blocage)

```bash
curl -X POST http://localhost:8069/api/admin/quotas/status \
  -H "Authorization: Bearer <session_id>" \
  -H "X-Tenant-Domain: tenanta.local"

# Résultat attendu :
# {
#   "success": true,
#   "quotas": {
#     "products": {"current": 450, "max": 1000, "percentage": 45},
#     "users": {"current": 3, "max": 5, "percentage": 60},
#     "orders": {"current": 1200, "max": 5000, "percentage": 24, "year": 2026},
#     "plan": {"name": "Starter", "code": "starter"},
#     "subscription": {"state": "active", "end_date": "2026-12-31"}
#   }
# }
```

---

## 📌 Bonnes Pratiques

### DO ✅

1. **Toujours vérifier les quotas AVANT création**
   ```python
   error = self._check_tenant_quotas('products')
   if error:
       return error
   ```

2. **Utiliser `_get_tenant()` pour validation automatique**
   ```python
   tenant = self._get_tenant()
   if not tenant:
       return {'error': 'Tenant invalide'}
   ```

3. **Utiliser `_get_company()` si pas besoin des données tenant**
   ```python
   company = self._get_company()
   products = Product.with_company(company).search([...])
   ```

4. **Retourner le statut quota après création**
   ```python
   quotas = self._get_quota_status()
   return {
       'success': True,
       'data': {...},
       'quota': quotas['products']
   }
   ```

### DON'T ❌

1. **Ne PAS faire confiance au header sans validation**
   ```python
   # ❌ DANGER : Pas de validation
   tenant_domain = request.httprequest.headers.get('X-Tenant-Domain')
   tenant = Tenant.search([('domain', '=', tenant_domain)])
   # → Utiliser _get_tenant() à la place
   ```

2. **Ne PAS créer de ressources sans vérifier les quotas**
   ```python
   # ❌ DANGER : Pas de vérification quota
   product = Product.create({...})
   # → Appeler _check_tenant_quotas() avant
   ```

3. **Ne PAS exposer des données d'autres tenants**
   ```python
   # ❌ DANGER : Pas de filtre company_id
   products = Product.search([('active', '=', True)])
   # → Toujours filtrer par company_id ou utiliser _get_company()
   ```

4. **Ne PAS ignorer les erreurs de validation**
   ```python
   # ❌ DANGER : Ignorer l'erreur
   tenant = self._get_tenant()
   products = Product.search([('company_id', '=', tenant.company_id.id)])
   # → tenant peut être None si validation échoue
   ```

---

## 🔗 Références

- [STRATEGIE_MULTI_TENANT.md](STRATEGIE_MULTI_TENANT.md) - Stratégie globale
- [API_CONVENTIONS.md](../.claude/API_CONVENTIONS.md) - Conventions API
- [LOGME.md](LOGME.md) - Logging sécurisé

**Document créé** : 2026-01-29
**Version** : 1.0
**Auteur** : Claude Code (Quelyos DevOps)
