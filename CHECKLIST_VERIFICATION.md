# ✅ Checklist de Vérification - QuelyosERP E-commerce

Ce document contient la checklist complète pour vérifier que toutes les 19 fonctionnalités sont opérationnelles.

## 📋 Pré-requis

- [ ] Odoo 19 est démarré sur http://localhost:8069
- [ ] Frontend Next.js est démarré sur http://localhost:3000
- [ ] Le module `quelyos_ecommerce` est installé/mis à jour dans Odoo

### Installation/Mise à jour du Module

Si le module n'est pas encore installé, utilisez une de ces méthodes:

**Option 1: Ligne de commande**
```bash
cd /Users/salmenktata/Projets/GitHub/QuelyosERP/backend
./odoo-bin -u quelyos_ecommerce -d [nom_base_de_donnees]
```

**Option 2: Interface Odoo**
1. Ouvrir http://localhost:8069
2. Aller dans Apps
3. Rechercher "Quelyos E-commerce API"
4. Cliquer sur "Upgrade" (ou "Install" si premier install)

---

## 🤖 Tests Automatisés

Lancez le script de vérification automatique:

```bash
./verify_implementation.sh
```

Ce script teste automatiquement tous les endpoints API backend et les routes frontend.

---

## 📝 Tests Manuels - Backend (Odoo)

### Phase 1: Features Core

#### 1.1 - API de Liste Produits ✅
- [ ] Ouvrir Odoo → E-commerce → Catalogue → Produits
- [ ] Vérifier que la liste des produits s'affiche
- [ ] Tester l'endpoint: `curl -X POST http://localhost:8069/api/ecommerce/products/list -H "Content-Type: application/json" -d '{"limit": 10}'`
- [ ] **Résultat attendu**: JSON avec liste de produits

#### 1.2 - Filtres Avancés ✅
- [ ] Tester avec filtres: `curl -X POST http://localhost:8069/api/ecommerce/products/list -H "Content-Type: application/json" -d '{"filters": {"in_stock": true}}'`
- [ ] **Résultat attendu**: Seulement les produits en stock
- [ ] Vérifier les filtres disponibles: `min_price`, `max_price`, `category_id`, `in_stock`, `website_published`

#### 1.3 - SEO Slugs ✅
- [ ] Ouvrir un produit dans Odoo
- [ ] Vérifier que le champ "Slug" est présent dans l'onglet "E-commerce"
- [ ] Vérifier qu'un slug est auto-généré à partir du nom du produit
- [ ] Tester: `curl -X POST http://localhost:8069/api/ecommerce/products/by-slug -H "Content-Type: application/json" -d '{"slug": "nom-du-produit"}'`

---

### Phase 2: Shopping Cart & Checkout

#### 2.1 - Gestion du Panier ✅
- [ ] Tester l'API panier: `curl -X POST http://localhost:8069/api/ecommerce/cart -H "Content-Type: application/json"`
- [ ] Ajouter un produit: `curl -X POST http://localhost:8069/api/ecommerce/cart/add -H "Content-Type: application/json" -d '{"product_id": 1, "quantity": 2}'`
- [ ] Vérifier le panier dans Odoo → E-commerce → Commandes

#### 2.2 - Processus de Checkout ✅
- [ ] Tester: `curl -X POST http://localhost:8069/api/ecommerce/checkout/info`
- [ ] Vérifier que les informations client et panier sont retournées

#### 2.3 - Multi-step Checkout ✅
- [ ] Tester les étapes:
  - Informations: `/api/ecommerce/checkout/info`
  - Livraison: `/api/ecommerce/checkout/shipping`
  - Paiement: `/api/ecommerce/checkout/payment`
  - Validation: `/api/ecommerce/checkout/validate`

#### 2.4 - Alertes Stock ✅
- [ ] Vérifier le modèle `product.stock.alert` dans Odoo
- [ ] Créer une alerte stock pour un produit
- [ ] Vérifier que l'alerte apparaît dans E-commerce → Configuration

#### 2.5 - Paniers Abandonnés ✅
- [ ] Créer un panier avec des produits
- [ ] Attendre (ou simuler via cron)
- [ ] Vérifier dans Odoo → E-commerce → Commandes → Paniers Abandonnés
- [ ] Vérifier que le statut "abandoned" apparaît

---

### Phase 3: Customer Features

#### 3.1 - Wishlist ✅
- [ ] Tester: `curl -X POST http://localhost:8069/api/ecommerce/wishlist`
- [ ] Ajouter un produit: `curl -X POST http://localhost:8069/api/ecommerce/wishlist/add -H "Content-Type: application/json" -d '{"product_id": 1}'`
- [ ] Vérifier dans Odoo → E-commerce → Wishlists

#### 3.2 - Système d'Avis ✅
- [ ] Aller dans Odoo → E-commerce → Avis Produits
- [ ] Créer un avis pour un produit
- [ ] Vérifier les champs: rating, comment, verified_purchase, status
- [ ] Tester: `curl -X POST http://localhost:8069/api/ecommerce/products/1/reviews`

#### 3.3 - Espace Client ✅
- [ ] Tester: `curl -X POST http://localhost:8069/api/ecommerce/customer/info`
- [ ] Vérifier: `curl -X POST http://localhost:8069/api/ecommerce/customer/orders`
- [ ] Vérifier: `curl -X POST http://localhost:8069/api/ecommerce/customer/addresses`

#### 3.4 - Analytics Dashboard ✅
- [ ] Aller dans Odoo → E-commerce → Analytics
- [ ] Vérifier les métriques affichées
- [ ] Tester l'API: `curl -X POST http://localhost:8069/api/ecommerce/analytics/dashboard`
- [ ] Vérifier: vues produits, ajouts panier, conversions, revenus

#### 3.5 - Système de Coupons ✅
- [ ] Aller dans Odoo → E-commerce → Coupons
- [ ] Créer un nouveau coupon avec code "TEST10"
- [ ] Tester: `curl -X POST http://localhost:8069/api/ecommerce/coupon/validate -H "Content-Type: application/json" -d '{"code": "TEST10"}'`
- [ ] Vérifier les types: percentage, fixed_amount, free_shipping

---

### Phase 4: Performance & SEO

#### 4.4 - SEO Avancé ✅

**Backend SEO Metadata**
- [ ] Aller dans Odoo → E-commerce → Catalogue → SEO Metadata
- [ ] Créer une métadonnée SEO pour un produit
- [ ] Vérifier les champs:
  - Meta Title, Meta Description
  - Open Graph (og:title, og:image, etc.)
  - Twitter Cards
  - Schema.org Type

**API SEO**
- [ ] Tester: `curl -X POST http://localhost:8069/api/ecommerce/seo/product/1`
- [ ] Tester: `curl -X POST http://localhost:8069/api/ecommerce/seo/breadcrumbs/1`
- [ ] Tester: `curl -X POST http://localhost:8069/api/ecommerce/seo/organization`

**Sitemap & Robots**
- [ ] Tester: `curl http://localhost:8069/api/ecommerce/sitemap.xml`
- [ ] Vérifier que le XML contient les produits

#### 4.5 - Cache Redis ✅

**Configuration Redis**
- [ ] Aller dans Odoo → Quelyos → Configuration → Gestion Cache
- [ ] Vérifier la documentation Redis affichée
- [ ] Si Redis installé, configurer les paramètres système:
  - `redis.host` = localhost
  - `redis.port` = 6379
  - `redis.db` = 0

**API Cache** (Nécessite privilèges admin)
- [ ] Tester stats: `curl -X POST http://localhost:8069/api/ecommerce/cache/stats`
- [ ] Tester clear: `curl -X POST http://localhost:8069/api/ecommerce/cache/clear`
- [ ] Tester warmup: `curl -X POST http://localhost:8069/api/ecommerce/cache/warmup`

**Endpoints Cached**
- [ ] Tester: `curl -X POST http://localhost:8069/api/ecommerce/products/list/cached -H "Content-Type: application/json" -d '{"limit": 10}'`
- [ ] Tester: `curl -X POST http://localhost:8069/api/ecommerce/products/1/cached`

---

## 🌐 Tests Manuels - Frontend (Next.js)

### Navigation Générale
- [ ] Ouvrir http://localhost:3000
- [ ] Vérifier que la page d'accueil se charge sans erreur 404
- [ ] Vérifier la console du navigateur (pas d'erreurs API)

### Liste Produits
- [ ] Aller sur /products
- [ ] Vérifier que les produits s'affichent
- [ ] Tester les filtres (prix, catégorie, stock)
- [ ] Vérifier la pagination

### Page Produit
- [ ] Cliquer sur un produit
- [ ] Vérifier que l'URL utilise le slug: `/product/nom-du-produit`
- [ ] Vérifier les métadonnées SEO dans le `<head>` (Inspecter → Elements)
- [ ] Vérifier le JSON-LD structured data (chercher `<script type="application/ld+json">`)
- [ ] Vérifier les breadcrumbs en haut de page

### Panier
- [ ] Ajouter un produit au panier
- [ ] Vérifier que le compteur du panier se met à jour
- [ ] Ouvrir le panier (/cart)
- [ ] Modifier la quantité
- [ ] Supprimer un article

### Checkout
- [ ] Procéder au checkout depuis le panier
- [ ] Vérifier les étapes multiples:
  - Étape 1: Informations client
  - Étape 2: Adresse de livraison
  - Étape 3: Méthode de livraison
  - Étape 4: Paiement
  - Étape 5: Confirmation

### Wishlist
- [ ] Ajouter un produit à la wishlist (icône cœur)
- [ ] Aller sur /wishlist
- [ ] Vérifier que le produit apparaît
- [ ] Retirer un produit de la wishlist

### Compte Client
- [ ] Se connecter (/login)
- [ ] Aller sur /account
- [ ] Vérifier les sections:
  - Informations personnelles
  - Commandes passées
  - Adresses
  - Wishlist

### Avis Produits
- [ ] Sur une page produit, voir les avis existants
- [ ] Soumettre un nouvel avis
- [ ] Vérifier que l'avis apparaît (après approbation si configuré)

### SEO Frontend
- [ ] Ouvrir http://localhost:3000/robots.txt
- [ ] Vérifier que le contenu est correct (User-agent, Disallow, Sitemap)
- [ ] Ouvrir http://localhost:3000/sitemap.xml
- [ ] Vérifier que le XML contient:
  - URLs statiques (/, /products, /about, /contact)
  - URLs dynamiques des produits
- [ ] Sur n'importe quelle page, inspecter le `<head>`:
  - Vérifier `<title>` personnalisé
  - Vérifier `<meta name="description">`
  - Vérifier Open Graph tags (`<meta property="og:*">`)
  - Vérifier Twitter Cards (`<meta name="twitter:*">`)

### Cache Frontend
- [ ] Vérifier que le hook `useCachedProducts` est utilisé dans les composants
- [ ] Observer les performances de chargement
- [ ] Si Redis activé, vérifier qu'un indicateur de cache apparaît

---

## 🔧 Vérification de la Configuration

### Backend - Odoo

**Menus Odoo**
- [ ] E-commerce → Catalogue → Produits
- [ ] E-commerce → Catalogue → Catégories
- [ ] E-commerce → Catalogue → SEO Metadata
- [ ] E-commerce → Commandes → Toutes les Commandes
- [ ] E-commerce → Commandes → Paniers Abandonnés
- [ ] E-commerce → Wishlists
- [ ] E-commerce → Avis Produits
- [ ] E-commerce → Analytics
- [ ] E-commerce → Rapports → Rapport Ventes
- [ ] E-commerce → Coupons
- [ ] Quelyos → Configuration → E-commerce
- [ ] Quelyos → Configuration → Gestion Cache

**Fichiers Backend**
- [ ] `backend/addons/quelyos_ecommerce/__manifest__.py` - Tous les fichiers listés
- [ ] `backend/addons/quelyos_ecommerce/models/` - Tous les modèles créés
- [ ] `backend/addons/quelyos_ecommerce/controllers/` - Tous les contrôleurs créés
- [ ] `backend/addons/quelyos_ecommerce/views/` - Toutes les vues XML créées
- [ ] `backend/addons/quelyos_ecommerce/security/ir.model.access.csv` - Droits d'accès

### Frontend - Next.js

**Fichiers Frontend**
- [ ] `frontend/src/lib/odoo/client.ts` - Client API avec tous les endpoints
- [ ] `frontend/src/app/sitemap.xml/route.ts` - Sitemap dynamique
- [ ] `frontend/src/app/robots.txt/route.ts` - Robots.txt dynamique
- [ ] `frontend/src/lib/seo/metadata.ts` - Utilitaires SEO
- [ ] `frontend/src/components/seo/StructuredData.tsx` - Composant structured data
- [ ] `frontend/src/components/seo/Breadcrumbs.tsx` - Composant breadcrumbs
- [ ] `frontend/src/hooks/useCachedProducts.ts` - Hook cache

---

## 📊 Résumé des Tests

### Progression

| Phase | Fonctionnalité | Status |
|-------|----------------|--------|
| 1.1 | API Liste Produits | ⏳ À tester |
| 1.2 | Filtres Avancés | ⏳ À tester |
| 1.3 | SEO Slugs | ⏳ À tester |
| 2.1 | Gestion Panier | ⏳ À tester |
| 2.2 | Checkout Process | ⏳ À tester |
| 2.3 | Multi-step Checkout | ⏳ À tester |
| 2.4 | Alertes Stock | ⏳ À tester |
| 2.5 | Paniers Abandonnés | ⏳ À tester |
| 3.1 | Wishlist | ⏳ À tester |
| 3.2 | Système d'Avis | ⏳ À tester |
| 3.3 | Espace Client | ⏳ À tester |
| 3.4 | Analytics | ⏳ À tester |
| 3.5 | Coupons | ⏳ À tester |
| 4.4 | SEO Avancé | ⏳ À tester |
| 4.5 | Cache Redis | ⏳ À tester |

**Total: 0/19 testés**

Mettez à jour ce tableau au fur et à mesure de vos tests en remplaçant ⏳ par:
- ✅ pour les tests réussis
- ❌ pour les tests échoués
- ⚠️ pour les tests partiels

---

## 🚀 Prochaines Étapes Après Vérification

Une fois tous les tests passés:

1. **Configuration Email** (Optionnel mais recommandé)
   - Configurer SMTP dans Odoo pour les emails transactionnels
   - Tester les emails de panier abandonné
   - Tester les alertes de stock

2. **Installation Redis** (Optionnel pour performance)
   - Suivre les instructions dans `README_REDIS.md`
   - Démarrer Redis: `docker-compose -f docker-compose.redis.yml up -d`
   - Configurer les paramètres dans Odoo
   - Relancer les tests de cache

3. **Optimisations Production**
   - Activer les optimisations Next.js
   - Configurer le cache CDN
   - Mettre en place les backups
   - Configurer la surveillance (monitoring)

4. **Documentation Utilisateur**
   - Former les utilisateurs aux menus Odoo
   - Créer un guide d'utilisation
   - Documenter les workflows

---

## 🐛 Dépannage

### Le module ne s'installe pas
```bash
# Vérifier les logs Odoo
tail -f /var/log/odoo/odoo.log

# Vérifier les dépendances dans __manifest__.py
# Vérifier les fichiers XML (pas d'erreurs de syntaxe)
```

### Les endpoints retournent 404
- Le module n'est pas installé/mis à jour
- Les contrôleurs ne sont pas chargés
- Vérifier `__init__.py` importe bien les contrôleurs

### Les données ne s'affichent pas
- Vérifier les droits d'accès dans `ir.model.access.csv`
- Vérifier que les données de démo existent
- Vérifier les logs Odoo pour les erreurs

### Le frontend affiche des erreurs
- Vérifier que le backend Odoo répond
- Vérifier les variables d'environnement `.env.local`
- Vérifier la console du navigateur
- Vérifier que `client.ts` utilise les bons endpoints

---

## 📝 Notes

- Date de vérification: _________________
- Vérificateur: _________________
- Version Odoo: 19.0
- Version Frontend: Next.js 14
- Commentaires: _________________

---

**Félicitations!** 🎉 Une fois tous les tests passés, votre plateforme e-commerce QuelyosERP est pleinement opérationnelle!
