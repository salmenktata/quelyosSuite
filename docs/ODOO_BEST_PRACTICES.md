# 📚 Bonnes Pratiques Odoo - Quand Utiliser les Modules Par Défaut vs Standalone

> **Principe FONDAMENTAL** : Toujours réutiliser et étendre les modules Odoo existants avant de créer du standalone.

## 🎯 Règle d'Or

**❓ Avant de créer un nouveau module ou modèle, demandez-vous TOUJOURS :**

```
1. Est-ce qu'un module Odoo standard fait déjà cela ?
   → OUI : Étendre ce module (héritage)
   → NON : Continuer à l'étape 2

2. Est-ce qu'un modèle Odoo existe pour ce type de données ?
   → OUI : Étendre ce modèle (_inherit)
   → NON : Créer un nouveau modèle

3. Est-ce qu'une vue/interface Odoo existe déjà ?
   → OUI : Hériter et ajouter des champs/onglets
   → NON : Créer une nouvelle vue
```

---

## ✅ FAIRE : Réutiliser et Étendre

### Exemple 1 : Gestion des Commandes E-commerce

**❌ MAUVAIS** : Créer un modèle `ecommerce.order`
```python
class EcommerceOrder(models.Model):
    _name = 'ecommerce.order'

    partner_id = fields.Many2one('res.partner')
    total = fields.Float()
    # ... Dupliquer toute la logique de sale.order
```

**✅ BON** : Étendre `sale.order` existant
```python
class SaleOrder(models.Model):
    _inherit = 'sale.order'

    # Ajouter seulement les champs e-commerce spécifiques
    session_id = fields.Char('Session ID')
    frontend_notes = fields.Text('Notes client')
    is_gift = fields.Boolean('Est un cadeau')
```

**Avantages** :
- ✅ Toutes les commandes dans un seul endroit : Sales → Orders
- ✅ Réutilisation de toute la logique existante (facturation, paiement, livraison)
- ✅ Pas de duplication de code
- ✅ Compatibilité avec d'autres modules Odoo

---

### Exemple 2 : Catalogue Produits E-commerce

**❌ MAUVAIS** : Créer `ecommerce.product`
```python
class EcommerceProduct(models.Model):
    _name = 'ecommerce.product'

    name = fields.Char()
    price = fields.Float()
    image = fields.Binary()
    # ... Dupliquer product.template
```

**✅ BON** : Étendre `product.template`
```python
class ProductTemplate(models.Model):
    _inherit = 'product.template'

    # Ajouter seulement les champs e-commerce
    slug = fields.Char('URL Slug', compute='_compute_slug')
    meta_title = fields.Char('SEO Title')
    is_featured = fields.Boolean('Mis en avant')
```

**Avantages** :
- ✅ Un seul catalogue produits (back-office + e-commerce)
- ✅ Gestion stock commune
- ✅ Synchronisation automatique
- ✅ Utilisation des modules existants (variants, catégories, etc.)

---

### Exemple 3 : Vues et Interfaces

**❌ MAUVAIS** : Créer un menu séparé avec toutes nouvelles vues
```xml
<!-- Dupliquer toute l'interface sales -->
<menuitem name="E-commerce Orders"/>
<record id="view_ecommerce_order_form">
    <!-- Recréer tout le formulaire -->
</record>
```

**✅ BON** : Hériter et ajouter un onglet
```xml
<!-- Hériter de la vue existante -->
<record id="view_order_form_ecommerce" model="ir.ui.view">
    <field name="inherit_id" ref="sale.view_order_form"/>
    <field name="arch" type="xml">
        <notebook position="inside">
            <page string="E-commerce" name="ecommerce">
                <!-- Ajouter seulement les infos e-commerce -->
            </page>
        </notebook>
    </field>
</record>
```

**Avantages** :
- ✅ Interface centralisée : Sales → Orders
- ✅ Pas de maintenance double
- ✅ Meilleure UX (un seul endroit pour tout)

---

## 🆕 Créer du Standalone : Quand ?

### ✅ Créer un nouveau modèle SI :

1. **Nouveau concept métier** qui n'existe pas dans Odoo
   ```python
   # Exemple : Wishlist (n'existe pas en standard)
   class ProductWishlist(models.Model):
       _name = 'product.wishlist'
   ```

2. **Configuration spécifique** à votre module
   ```python
   # Exemple : Config e-commerce (spécifique au projet)
   class EcommerceConfig(models.Model):
       _name = 'ecommerce.config'
   ```

3. **Relations N-N** spécifiques
   ```python
   # Exemple : Comparateur produits
   class ProductComparison(models.Model):
       _name = 'product.comparison'
   ```

### ❌ NE PAS créer de nouveau modèle pour :

- ❌ Commandes (utiliser `sale.order`)
- ❌ Produits (utiliser `product.template` / `product.product`)
- ❌ Clients (utiliser `res.partner`)
- ❌ Paiements (utiliser `payment.transaction`)
- ❌ Livraison (utiliser `delivery.carrier`)
- ❌ Factures (utiliser `account.move`)

---

## 📋 Checklist de Décision

Avant de coder, répondez à ces questions :

### Question 1 : Type de Données
```
Mes données ressemblent à :
□ Des commandes → Hériter sale.order
□ Des produits → Hériter product.template
□ Des clients → Hériter res.partner
□ Des paiements → Utiliser payment.transaction
□ Autre chose → Créer nouveau modèle
```

### Question 2 : Interface Utilisateur
```
Pour l'interface backoffice :
□ Une page similaire existe (Sales, Inventory, etc.)
  → Hériter et ajouter des champs/filtres
□ Besoin d'une page complètement différente
  → Créer une nouvelle interface
```

### Question 3 : Logique Métier
```
La logique à implémenter :
□ Est proche d'un flux Odoo existant (vente, achat, stock)
  → Étendre le module correspondant
□ Est totalement nouvelle et isolée
  → Créer un nouveau module
```

---

## 🏆 Cas d'Usage du Projet Quelyos

### ✅ Ce qu'on a BIEN fait

1. **Commandes E-commerce** → Étendu `sale.order`
   - Ajout champs : `session_id`, `frontend_notes`, `is_gift`
   - Utilisation de Sales → Orders pour tout gérer
   - ✅ Pas de duplication

2. **Produits** → Étendu `product.template`
   - Ajout champs SEO : `slug`, `meta_title`, `is_featured`
   - Utilisation du catalogue Odoo existant
   - ✅ Un seul catalogue pour tout

3. **Checkout** → Réutilisé `payment.provider` et `delivery.carrier`
   - Pas de recréation des systèmes de paiement
   - ✅ Compatible avec tous les providers Odoo

### ✅ Nouveau modèle : OK car spécifique

1. **Wishlist** (`product.wishlist`)
   - Concept qui n'existe pas en standard
   - ✅ Justifié

2. **Config E-commerce** (`ecommerce.config`)
   - Configuration spécifique au module
   - ✅ Justifié

---

## 🔍 Modules Odoo à Connaître

### Modules Essentiels (Toujours Étendre)

| Module Odoo | Modèle Principal | Quand l'utiliser |
|-------------|------------------|------------------|
| `sale` | `sale.order` | Commandes, devis, ventes |
| `product` | `product.template`, `product.product` | Catalogue produits |
| `stock` | `stock.quant` | Inventaire, stock |
| `account` | `account.move` | Facturation, comptabilité |
| `payment` | `payment.provider`, `payment.transaction` | Paiements en ligne |
| `delivery` | `delivery.carrier` | Modes de livraison |
| `portal` | `res.users`, `res.partner` | Utilisateurs clients |
| `website` | - | Site web (si nécessaire) |

### Modules Optionnels (Selon Besoin)

| Module | Utilité | Quand l'installer |
|--------|---------|-------------------|
| `sale_management` | Gestion avancée ventes | Toujours avec `sale` |
| `stock_account` | Stock + Compta | Si gestion stock précise |
| `sale_stock` | Vente + Livraison | Si produits physiques |
| `website_sale` | E-commerce intégré | ❌ Pas pour headless |

---

## 📖 Exemple Complet : Module E-commerce

### Architecture Recommandée

```python
# backend/addons/quelyos_ecommerce/

# __manifest__.py
{
    'depends': [
        'sale',           # Pour sale.order
        'product',        # Pour product.template
        'stock',          # Pour stock
        'payment',        # Pour paiements
        'delivery',       # Pour livraison
        'portal',         # Pour auth clients
    ],
}

# models/sale_order.py - ÉTENDRE
class SaleOrder(models.Model):
    _inherit = 'sale.order'

    session_id = fields.Char()  # Nouveau champ
    frontend_notes = fields.Text()  # Nouveau champ

# models/product_template.py - ÉTENDRE
class ProductTemplate(models.Model):
    _inherit = 'product.template'

    slug = fields.Char()  # Nouveau champ SEO
    is_featured = fields.Boolean()  # Nouveau champ

# models/wishlist.py - CRÉER (n'existe pas)
class ProductWishlist(models.Model):
    _name = 'product.wishlist'  # Nouveau modèle

    partner_id = fields.Many2one('res.partner')
    product_id = fields.Many2one('product.product')
```

---

## 🚨 Anti-Patterns à Éviter

### 1. ❌ Dupliquer des Modèles Existants

```python
# ❌ MAUVAIS
class MyCustomProduct(models.Model):
    _name = 'my.custom.product'
    name = fields.Char()
    price = fields.Float()

# ✅ BON
class ProductTemplate(models.Model):
    _inherit = 'product.template'
    custom_field = fields.Char()
```

### 2. ❌ Créer des Menus Séparés Inutiles

```xml
<!-- ❌ MAUVAIS -->
<menuitem name="Mon E-commerce"/>
<menuitem name="Mes Commandes" parent="Mon E-commerce"/>

<!-- ✅ BON -->
<!-- Utiliser Sales → Orders avec filtres -->
<filter string="E-commerce" domain="[('session_id', '!=', False)]"/>
```

### 3. ❌ Réinventer la Roue

```python
# ❌ MAUVAIS - Recréer un système de paiement
class MyPayment(models.Model):
    _name = 'my.payment'

# ✅ BON - Utiliser payment.transaction
tx = request.env['payment.transaction'].create({...})
```

---

## 💡 Résumé en 3 Points

1. **TOUJOURS** chercher si un module Odoo fait déjà ce dont vous avez besoin
2. **ÉTENDRE** plutôt que recréer (héritage `_inherit`)
3. **CRÉER** du nouveau seulement si vraiment spécifique à votre besoin

---

## 📚 Ressources

- [Documentation Odoo - Model Inheritance](https://www.odoo.com/documentation/19.0/developer/reference/backend/orm.html#inheritance)
- [Documentation Odoo - View Inheritance](https://www.odoo.com/documentation/19.0/developer/reference/backend/views.html#inheritance)
- [Odoo Apps Store](https://apps.odoo.com/) - Voir ce qui existe déjà

---

**🎯 Règle Finale : "Don't reinvent the wheel, extend it"**
