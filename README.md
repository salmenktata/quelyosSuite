# 🛒 Quelyos ERP - Module E-commerce Headless

Plateforme e-commerce headless complète basée sur Odoo 19 (backend) et Next.js 14 (frontend).

![Status](https://img.shields.io/badge/status-production--ready-success)
![Odoo](https://img.shields.io/badge/Odoo-19.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## 🌟 Caractéristiques

### Backend (Odoo 19)
- ✅ **API REST complète** - 40+ endpoints JSON-RPC
- ✅ **Authentification Portal** - Session sécurisée avec cookies httpOnly
- ✅ **Gestion Produits** - Catalogue avec variants, images, SEO
- ✅ **Panier & Checkout** - Gestion panier invité + authentifié
- ✅ **Coupons de réduction** - Système complet avec validations
- ✅ **Avis Produits** - Modération, réponses vendeur
- ✅ **Analytics E-commerce** - Dashboard temps réel
- ✅ **Wishlist & Comparateur** - Features avancées
- ✅ **Sécurité** - Rate limiting, validation input, CORS
- ✅ **Branding Quelyos** - Personnalisation complète interface

### Frontend (Next.js 14)
- ✅ **App Router** - Architecture moderne Next.js 14
- ✅ **TypeScript strict** - Types complets API/UI
- ✅ **Zustand** - State management performant
- ✅ **Tailwind CSS 4** - Design system responsive
- ✅ **React Hook Form + Zod** - Validation formulaires
- ✅ **SEO Optimisé** - Metadata dynamique, sitemap, ISR
- ✅ **Tests** - Jest (unit) + Playwright (E2E)

## 📋 Prérequis

- Docker & Docker Compose
- Node.js 20+ (pour développement frontend)
- Git

## 🚀 Installation Rapide

### 1. Cloner le projet

```bash
git clone https://github.com/votre-org/QuelyosERP.git
cd QuelyosERP
```

### 2. Démarrer le Backend Odoo

```bash
cd backend
docker-compose up -d
```

Odoo sera accessible sur http://localhost:8069

**Première connexion:**
- Email: `admin`
- Mot de passe: `admin`

### 3. Installer les modules Odoo

1. Aller sur http://localhost:8069
2. Se connecter avec admin/admin
3. Aller dans **Apps**
4. Cliquer sur **Update Apps List**
5. Rechercher "Quelyos"
6. Installer:
   - **Quelyos Branding**
   - **Quelyos E-commerce API**

### 4. Démarrer le Frontend Next.js

```bash
cd ../frontend
npm install
npm run dev
```

Frontend accessible sur http://localhost:3000

## 📖 Documentation Complète

### Structure du Projet

```
QuelyosERP/
├── backend/
│   ├── addons/
│   │   ├── quelyos_branding/        # Module branding Quelyos
│   │   └── quelyos_ecommerce/       # Module e-commerce
│   │       ├── controllers/         # API REST endpoints
│   │       ├── models/              # Modèles ORM Odoo
│   │       ├── views/               # Interfaces backoffice
│   │       ├── data/                # Données initiales
│   │       ├── security/            # Droits d'accès
│   │       └── tests/               # Tests Python
│   └── docker-compose.yml
│
├── frontend/
│   ├── src/
│   │   ├── app/                     # Pages Next.js (App Router)
│   │   ├── components/              # Composants React
│   │   ├── lib/                     # Utilitaires (client Odoo, etc.)
│   │   ├── store/                   # State Zustand (cart, auth)
│   │   └── types/                   # Types TypeScript
│   ├── public/                      # Assets statiques
│   └── package.json
│
└── README.md
```

### Architecture

```
┌─────────────┐         HTTP/JSON-RPC          ┌──────────────┐
│             │  ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← │              │
│  Next.js 14 │                                 │   Odoo 19    │
│  (Frontend) │  → → → → → → → → → → → → → → → │  (Backend)   │
│             │    Session Cookies              │              │
└─────────────┘                                 └──────────────┘
      ↓                                                 ↓
  Zustand State                                 PostgreSQL 15
   (cart, auth)                                  (Persistence)
```

## 🎯 Utilisation

### Créer un Produit E-commerce

1. **Backend Odoo:**
   - Aller dans **E-commerce → Catalogue → Produits**
   - Cliquer **Créer**
   - Remplir les champs de base (nom, prix, image)
   - Onglet **E-commerce**: cocher "Produit mis en avant"
   - Remplir SEO (meta title, description)
   - Enregistrer

2. **Le produit sera automatiquement disponible sur le frontend** avec:
   - URL SEO-friendly (slug généré automatiquement)
   - Metadata pour référencement
   - Images optimisées

### Créer un Coupon de Réduction

1. **Backend Odoo:**
   - Aller dans **E-commerce → Marketing → Coupons**
   - Créer un coupon:
     - Code: `SUMMER2024`
     - Type: Pourcentage
     - Valeur: 10%
     - Validité: définir dates

2. **Frontend:**
   - Le coupon est appliqué via l'API `/api/ecommerce/coupon/validate`
   - Validation automatique des conditions (montant min, usage, dates)

### Gérer les Avis Produits

1. **Backend Odoo:**
   - **E-commerce → Marketing → Avis Produits**
   - Approuver/Rejeter les avis clients
   - Répondre aux avis (réponse vendeur)

## 🔐 API E-commerce

### Endpoints Principaux

#### Authentification
```bash
# Login
POST /api/ecommerce/auth/login
{
  "email": "client@example.com",
  "password": "password123"
}

# Logout
POST /api/ecommerce/auth/logout

# Inscription
POST /api/ecommerce/auth/register
{
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "password": "secure123",
  "phone": "+33612345678"
}
```

#### Produits
```bash
# Liste produits
POST /api/ecommerce/products
{
  "limit": 20,
  "offset": 0,
  "category_id": 1,
  "price_min": 10,
  "price_max": 100
}

# Détail produit
POST /api/ecommerce/products/<id>

# Produit par slug (SEO)
POST /api/ecommerce/products/slug/<slug>
```

#### Panier
```bash
# Ajouter au panier
POST /api/ecommerce/cart/add
{
  "product_id": 1,
  "quantity": 2
}

# Modifier quantité
POST /api/ecommerce/cart/update/<line_id>
{
  "quantity": 3
}

# Supprimer ligne
POST /api/ecommerce/cart/remove/<line_id>

# Vider panier
POST /api/ecommerce/cart/clear
```

#### Checkout
```bash
# Valider panier (stock disponible)
POST /api/ecommerce/checkout/validate

# Calculer frais livraison
POST /api/ecommerce/checkout/shipping
{
  "delivery_method_id": 1
}

# Confirmer commande
POST /api/ecommerce/checkout/confirm
{
  "shipping_address_id": 1,
  "billing_address_id": 1,
  "delivery_method_id": 1,
  "payment_method_id": 1
}
```

#### Coupons
```bash
# Appliquer coupon
POST /api/ecommerce/coupon/validate
{
  "code": "SUMMER2024"
}

# Retirer coupon
POST /api/ecommerce/coupon/remove
```

## 🧪 Tests

### Backend (Python)

```bash
cd backend
docker-compose run --rm odoo odoo -d quelyos --test-enable --stop-after-init
```

### Frontend (Jest + Playwright)

```bash
cd frontend

# Tests unitaires
npm run test

# Tests E2E
npm run test:e2e

# Tous les tests
npm run test:all
```

## 📊 Dashboard Analytics

Le module e-commerce inclut un dashboard analytics temps réel accessible via **E-commerce → Analytics → Dashboard**.

**Métriques disponibles:**
- Revenus (jour/semaine/mois)
- Nombre de commandes
- Valeur moyenne panier
- Taux de conversion
- Top produits vendus
- Paniers abandonnés

## 🔒 Sécurité

### Rate Limiting

Tous les endpoints critiques sont protégés:
- Login: 5 tentatives / 5 minutes
- Coupons: 10 tentatives / 5 minutes
- API générale: Configurable par endpoint

### Validation Input

- Sanitization XSS automatique
- Validation types (Zod côté frontend, Odoo validators côté backend)
- Protection SQL injection (ORM Odoo)

### CORS

- Configuration CORS stricte
- Whitelist des origines autorisées
- Headers sécurisés

## 🚢 Déploiement Production

### Option 1: Docker Compose (VPS)

```bash
# 1. Cloner sur le serveur
git clone https://github.com/votre-org/QuelyosERP.git
cd QuelyosERP

# 2. Créer .env.production
cp .env.production.example .env.production
# Éditer avec vos valeurs (DB passwords, secrets, etc.)

# 3. Démarrer avec docker-compose
docker-compose -f docker-compose.prod.yml up -d

# 4. Installer modules Odoo
docker-compose exec odoo odoo -d quelyos -i quelyos_branding,quelyos_ecommerce --stop-after-init

# 5. Redémarrer
docker-compose restart
```

### Option 2: Kubernetes (Scalable)

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour configuration Kubernetes complète.

### SSL/TLS

Utiliser **Let's Encrypt** avec Nginx reverse proxy:

```bash
# Installer certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir certificat
sudo certbot --nginx -d votredomaine.com -d www.votredomaine.com
```

## 🎨 Branding Quelyos

Le module `quelyos_branding` personnalise l'interface Odoo:
- Logo Quelyos
- Couleurs purple → blue
- Masquage éléments Enterprise
- Templates email personnalisés
- Favicon custom

**Configuration:**
- **Paramètres → Branding Quelyos**
- Modifier couleurs, logo, slogan, etc.

## 📈 Performance

### Backend
- ✅ Cache ORM Odoo
- ✅ Index PostgreSQL optimisés
- ✅ Computed fields avec store=True

### Frontend
- ✅ ISR (Incremental Static Regeneration)
- ✅ Image optimization (next/image)
- ✅ Code splitting automatique
- ✅ Font optimization

**Benchmarks:**
- Temps de réponse API: < 200ms (p95)
- Time to First Byte: < 500ms
- Lighthouse Score: > 90

## 🐛 Dépannage

### Problème: Module non visible dans Apps

**Solution:**
```bash
docker-compose exec odoo odoo -d quelyos --update=quelyos_ecommerce --stop-after-init
docker-compose restart odoo
```

### Problème: Erreur 415 sur API

**Cause:** Content-Type incorrect

**Solution:** S'assurer d'envoyer `Content-Type: application/json` avec body JSON-RPC valide.

### Problème: Frontend ne se connecte pas à Odoo

**Vérifier:**
1. Odoo est accessible sur localhost:8069
2. `.env.local` a la bonne URL: `NEXT_PUBLIC_ODOO_URL=http://localhost:8069`
3. CORS configuré côté Odoo

## 🤝 Contribution

Les contributions sont bienvenues!

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence LGPL-3 (comme Odoo Community).

## 📞 Support

- 📧 Email: support@quelyos.com
- 🐛 Issues: https://github.com/votre-org/QuelyosERP/issues
- 📖 Documentation: https://docs.quelyos.com

## 🎉 Crédits

Développé avec ❤️ par l'équipe Quelyos.

Technologies utilisées:
- [Odoo](https://www.odoo.com/) - Framework ERP
- [Next.js](https://nextjs.org/) - Framework React
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [PostgreSQL](https://www.postgresql.org/) - Database

---

**Version:** 1.0.0 | **Date:** Janvier 2026
