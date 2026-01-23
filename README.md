# Quelyos ERP - Module E-commerce

![Status](https://img.shields.io/badge/status-production--ready-green)
![Odoo](https://img.shields.io/badge/Odoo-19.0-purple)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

Plateforme e-commerce headless complète avec Odoo 19 et Next.js 14, inspirée du design de lesportif.com.tn.

## 🚀 Caractéristiques

### Backend (Odoo 19)
- ✅ **40+ Endpoints API REST** complets
- ✅ **Authentification Portal** native Odoo
- ✅ **Gestion catalogue** produits avec variants
- ✅ **Panier intelligent** (invité + authentifié)
- ✅ **Checkout 3 étapes** optimisé
- ✅ **Wishlist & Comparateur**
- ✅ **SEO** automatique (slug, meta tags)
- ✅ **Webhooks** temps réel

### Frontend (Next.js 14)
- ✅ **16 pages** fonctionnelles
- ✅ **App Router** avec TypeScript
- ✅ **Design responsive** (mobile-first)
- ✅ **SEO optimisé** (metadata, JSON-LD, sitemap)
- ✅ **Performance** (ISR, lazy loading, AVIF/WebP)
- ✅ **State Management** Zustand
- ✅ **Thème vert** inspiré lesportif.com.tn

## 📁 Structure

```
QuelyosERP/
├── backend/addons/
│   ├── quelyos_branding/         # Branding
│   └── quelyos_ecommerce/        # E-commerce ⭐
│       ├── controllers/          # API (7 controllers)
│       ├── models/               # ORM (6 models)
│       └── services/             # Business logic
├── frontend/
│   ├── src/app/                  # Pages (16)
│   ├── components/               # Composants (15+)
│   └── store/                    # Zustand stores
├── nginx/                        # Reverse proxy
├── INTEGRATION_API.md            # Guide API
├── DEPLOYMENT.md                 # Guide déploiement
└── PERFORMANCE.md                # Guide perf & SEO
```

## 🎯 URLs

**Public**: `/`, `/products`, `/products/[slug]`, `/cart`, `/login`, `/register`

**Checkout**: `/checkout/shipping`, `/checkout/payment`, `/checkout/success`

**Compte**: `/account`, `/account/orders`, `/account/profile`, `/account/addresses`, `/account/wishlist`

**SEO**: `/sitemap.xml`, `/robots.txt`

## 🛠️ Installation Développement

### 1. Backend (Odoo)

```bash
cd backend
docker-compose up -d

# Accéder à http://localhost:8069
# Database: quelyos | Email: admin@example.com | Pass: admin

# Apps → Update Apps List → "Quelyos E-commerce" → Install
```

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev

# Accéder à http://localhost:3000
```

## 🚀 Déploiement Production

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour le guide complet.

```bash
# 1. Configuration
cp .env.production.example .env.production
nano .env.production

# 2. SSL
sudo certbot certonly --standalone -d votre-domaine.com

# 3. Démarrage
docker-compose -f docker-compose.prod.yml up -d
```

## 📡 API

Voir [INTEGRATION_API.md](./INTEGRATION_API.md).

```bash
# Produits
GET /api/ecommerce/products
GET /api/ecommerce/products/slug/:slug

# Panier
GET /api/ecommerce/cart
POST /api/ecommerce/cart/add

# Auth
POST /api/ecommerce/auth/login
POST /api/ecommerce/auth/register
```

## 📊 Performance

Voir [PERFORMANCE.md](./PERFORMANCE.md).

**Targets**: Lighthouse ≥90 | LCP <2.5s | FID <100ms | CLS <0.1

**Optimisations**: ISR, AVIF/WebP, Lazy loading, Gzip, Code splitting

## 📚 Documentation

- [INTEGRATION_API.md](./INTEGRATION_API.md) - Guide API
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Déploiement
- [PERFORMANCE.md](./PERFORMANCE.md) - Performance & SEO
- [TESTING.md](./TESTING.md) - Tests automatisés
- [CICD.md](./CICD.md) - CI/CD avec GitHub Actions

## ✅ État du Projet

- [x] **Phase 1** - Backend Odoo (40+ endpoints)
- [x] **Phase 2** - Frontend Setup (Next.js 14)
- [x] **Phase 3** - Features Core (16 pages, 15+ composants)
- [x] **Phase 4** - SEO & Performance (Metadata, Sitemap, ISR)
- [x] **Phase 5** - Tests, CI/CD & Déploiement
  - [x] Tests automatisés (Jest, Playwright, Odoo)
  - [x] GitHub Actions CI/CD
  - [x] Docker production
  - [x] Documentation complète

## 📝 License

MIT License - Voir [LICENSE](./LICENSE)

## 👥 Équipe

**Quelyos Team** - Propulsé par Odoo 19 + Next.js 14

---

Made with ❤️ by Quelyos Team
