# Changelog - Quelyos ERP

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère à [Semantic Versioning](https://semver.org/lang/fr/).

## [1.0.0] - 2026-01-23

### 🎉 Version Initiale - Production Ready

#### Ajouté

**Backend Odoo 19:**
- ✨ Module `quelyos_branding` complet
  - Personnalisation interface Odoo (couleurs, logo, favicon)
  - Templates email personnalisés
  - Masquage fonctionnalités Enterprise Odoo
  - Configuration via Settings

- ✨ Module `quelyos_ecommerce` complet
  - **API REST:** 40+ endpoints JSON-RPC
  - **Authentification:** Login/Logout/Register Portal Odoo
  - **Produits:** Gestion catalogue avec SEO (slugs, metadata)
  - **Panier:** Gestion panier invité + authentifié
  - **Checkout:** Validation, livraison, paiement, confirmation
  - **Coupons:** Système réduction avec validations
  - **Avis Produits:** Modération, réponses vendeur
  - **Analytics:** Dashboard temps réel (TransientModel)
  - **Wishlist:** Liste de souhaits client
  - **Comparateur:** Comparaison produits
  - **Sécurité:** Rate limiting, validation input, CORS

- 🛡️ Sécurité
  - Rate limiting configurablepartenant endpoint
  - Validation input avec sanitization XSS
  - CORS configuré
  - Session sécurisée avec cookies httpOnly

- 🎨 Interface Backoffice
  - 8 vues complètes (kanban, list, form, search)
  - Dashboard analytics
  - Gestion coupons
  - Modération avis
  - Menus organisés

**Frontend Next.js 14:**
- ✨ Setup projet complet
  - Next.js 14 avec App Router
  - TypeScript strict
  - Tailwind CSS 4
  - Zustand pour state management
  - React Hook Form + Zod

- 📡 Client API Odoo
  - Client JSON-RPC complet (`lib/odoo/client.ts`)
  - Gestion session avec persistence localStorage
  - Méthodes pour tous les endpoints
  - Error handling

- 🗄️ State Management
  - `cartStore.ts`: Gestion panier avec persistence
  - `authStore.ts`: Authentification Portal Odoo
  - Actions: addToCart, updateQuantity, login, etc.

- 📱 Types TypeScript
  - Interfaces complètes pour API (`types/index.ts`)
  - Product, Cart, Order, User, etc.
  - Type-safe partout

**Documentation:**
- 📚 **README.md**: Documentation complète projet
- ⚡ **QUICKSTART.md**: Guide démarrage 5 minutes
- 🚀 **DEPLOYMENT.md**: Guide déploiement production
- 🧪 **TESTING.md**: Guide tests backend/frontend
- 📊 **PROJECT_SUMMARY.md**: Récapitulatif travaux
- 📝 **CHANGELOG.md**: Ce fichier

**Infrastructure:**
- 🐳 Docker Compose pour développement
- 🐳 Docker Compose production prêt
- 📦 Scripts backup automatiques
- 🔧 Configuration Nginx avec SSL
- 📊 Monitoring (Prometheus, Grafana ready)

#### Modifié

- 🔧 Odoo 19 compatibility fixes
  - `view_mode="tree"` → `"list"`
  - Suppression `<group expand="0">` dans search views
  - Templates kanban: `kanban-box` → `card`
  - Utilisation `name` au lieu de `string` dans xpath

#### Corrigé

- 🐛 JavaScript errors dans quelyos_branding
  - Correction sélecteur `.badge:contains()` (non valide en querySelectorAll)
  - Fix syntax jQuery → vanilla JS

- 🐛 XML validation errors
  - Fix search views avec attributs invalides
  - Fix view inheritance avec sélecteurs corrects
  - Fix kanban templates Odoo 19

- 🐛 Database consistency
  - Fix action `view_mode` via SQL directement
  - Assurer cohérence après migrations

#### Sécurité

- 🔒 Rate limiting sur tous endpoints sensibles
- 🔒 Validation input avec whitelist/blacklist
- 🔒 Protection CSRF avec tokens
- 🔒 Session sécurisée httpOnly cookies
- 🔒 CORS restrictif avec whitelist origins

#### Performance

- ⚡ Cache ORM Odoo avec `store=True`
- ⚡ Index PostgreSQL sur champs fréquents
- ⚡ Zustand avec persistence optimisée
- ⚡ Ready pour ISR Next.js

### 🚀 Migration depuis Version Précédente

N/A (première version)

### 💾 Base de Données

**Migrations incluses:**
- Création tables: `product.wishlist`, `product.comparison`, `ecommerce.coupon`, `product.review`, `ecommerce.analytics`
- Ajout champs sur `product.template`: `slug`, `meta_title`, `meta_description`, etc.
- Ajout champs sur `sale.order`: `coupon_id`, `coupon_discount`, `session_id`, etc.
- Droits d'accès (`ir.model.access.csv`) pour tous les modèles

### 📦 Dépendances

**Backend:**
- Odoo 19.0
- PostgreSQL 15
- Python 3.11+

**Frontend:**
- Node.js 20+
- Next.js 14.1.4
- React 19.2.3
- TypeScript 5+
- Zustand 5.0.10
- Axios 1.13.2

### 🔗 Liens Utiles

- [Documentation Odoo 19](https://www.odoo.com/documentation/19.0/)
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Zustand](https://github.com/pmndrs/zustand)

---

## [Format de Version]

- **MAJOR:** Changements incompatibles avec l'API
- **MINOR:** Nouvelles fonctionnalités rétrocompatibles
- **PATCH:** Corrections de bugs rétrocompatibles

**Exemple:** 1.2.3 = MAJOR.MINOR.PATCH

---

**Légende:**
- ✨ Nouveau
- 🔧 Modification
- 🐛 Correction
- 🔒 Sécurité
- ⚡ Performance
- 📚 Documentation
- 🚀 Déploiement
