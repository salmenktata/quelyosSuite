# Quelyos Suite

Suite ERP modulaire avec backend unique et puissant.

## Vision

ERP modulaire et moderne avec backend puissant (101 modèles, 764 endpoints API) et frontends spécialisés pour chaque usage.

```
┌──────────────────────────────────────────────────────────────┐
│   BACKEND UNIQUE (ERP + PostgreSQL + Redis)                  │
│   101 modèles · 764 endpoints API · Multi-tenant             │
└──────────────────────────┬───────────────────────────────────┘
                           │ REST API
    ┌──────────────┬───────┴────────┬──────────────┐
    │              │                │              │
  Vitrine      E-commerce      ERP Complet    Super Admin
  :3000          :3001            :5175          :9000
```

## Produits

### 🎯 ERP Complet

**Dashboard ERP** (port 5175) : Interface complète d'administration avec 9 modules intégrés (Finance, Store, Stock, CRM, Marketing, RH, Support, POS, Accueil).

### 🌐 Sites Publics

- **Site Vitrine** (port 3000) : Site marketing Quelyos
- **E-commerce** (port 3001) : Boutique en ligne client

### 🔧 Administration SaaS

**Super Admin** (port 9000) : Console d'administration multi-tenant complète pour gérer la plateforme SaaS.

**Fonctionnalités** :
- Gestion tenants (création wizard, suspension, changement plan)
- Plans tarifaires avec quotas configurables
- Abonnements & facturation (MRR, ARR, churn analysis)
- Relances automatiques impayés (dunning workflow)
- Analytics avancés (health score, prédiction churn)
- Support multi-tenant (tickets, templates)
- Backups automatisés (S3/local)
- Audit logs & sécurité (2FA, rate limiting)

**Parité fonctionnelle** : 62% (29/47 fonctionnalités Odoo SaaS Kit + Enterprise)

## Structure Technique

```
vitrine-quelyos/       → Next.js 14 (site marketing : 3000)
vitrine-client/        → Next.js 16 (boutique e-commerce : 3001)
dashboard-client/      → React 19 + Vite (ERP Complet : 5175)
super-admin-client/    → React + Vite (Admin SaaS : 9000)

packages/              → Packages partagés (monorepo Turborepo)
  ├── ui-kit/          → Composants React partagés
  ├── api-client/      → Client API partagé
  ├── utils/           → Utilitaires communs
  └── logger/          → Système de logs

odoo-backend/          → Backend ERP (API REST : 8069)
scripts/               → Scripts de gestion (dev-start.sh, dev-stop.sh)
```

## Stack Technologique

| Composant | Technologies |
|-----------|-------------|
| Frontend | Next.js 16.1, React 19.2, Tailwind CSS, TypeScript |
| Backend | Infrastructure ERP open-source, Python 3.12, PostgreSQL 15 |
| Cache | Redis 7.2 |
| Monorepo | Turborepo, pnpm workspaces |

## 🚀 Démarrage Rapide

### Prérequis
- Docker & Docker Compose
- Node.js 20+
- pnpm
- Git

### Installation

```bash
# Cloner le projet
git clone https://github.com/salmenktata/quelyosSuite.git
cd quelyosSuite

# Installation des dépendances
pnpm install

# Démarrage automatique
./scripts/dev-start.sh all
```

### Accès aux Services

| Service | URL | Identifiants |
|---------|-----|--------------|
| **Site Vitrine** | http://localhost:3000 | - |
| **E-commerce** | http://localhost:3001 | - |
| **ERP Complet** | http://localhost:5175 | admin / admin |
| **Super Admin** | http://localhost:9000 | admin / admin |
| **Backend API** | http://localhost:8069 | admin / admin |

### Gestion des Services

```bash
./scripts/dev-start.sh all     # Démarrer tous les services
./scripts/dev-stop.sh all      # Arrêter tous les services
```

## 📚 Documentation

- **[README-DEV.md](README-DEV.md)** - Documentation technique détaillée (développeurs)
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Architecture système complète
- **[.claude/](/.claude/)** - Guides développeur et conventions

## Fonctionnalités Clés

### ✨ Multi-Tenant
- Isolation complète des données par client
- Branding personnalisable par SaaS
- Gestion centralisée via super-admin

### 🎨 UI/UX Moderne
- Interface React moderne avec Tailwind CSS
- Mode sombre / clair
- Composants accessibles (WCAG 2.1 AA)
- 17 composants UI réutilisables

### 🔒 Sécurité
- Authentification JWT + SSO
- Passkeys (WebAuthn)
- RBAC (Role-Based Access Control)
- API sécurisée (Score A : 90/100)

### 📊 Modules Disponibles

**Finance** : Comptabilité, Facturation, Paiements, Rapports financiers

**E-commerce** : Catalogue produits, Panier, Paiement Stripe, Gestion commandes

**Stock** : Inventaire, Transferts, Emplacements, Codes-barres

**CRM** : Contacts, Opportunités, Pipeline, Devis

**Marketing** : Email Marketing, SMS, Popups, Automation, Programme fidélité

**RH** : Employés, Contrats, Congés, Recrutement

**Support** : Tickets, Base de connaissances, Chat

**Point de Vente** : Caisse, Inventaire temps réel, Multi-paiements

## 🏆 Roadmap 2026

```
Jan-Fév     Mar-Avr      Mai         Jun-Juil     Sep
   │           │          │              │          │
   ▼           ▼          ▼              ▼          ▼
PHASE 1    PHASE 2    PHASE 3        PHASE 4    PHASE 5
Parité     Packaging  Légal          Commercial  Lancement
100%       Produit    Licences       SaaS        Officiel

                        🚀 BETA
```

### Phase Actuelle : Finalisation Produit

**Objectif** : Atteindre 95%+ de parité fonctionnelle

**État** : ~72% de parité fonctionnelle (en progression)

**Modules Complétés (95-100%)** :
- ✅ Produits (100%)
- ✅ Catégories (95%)
- ✅ Analytics (95%)
- ✅ Coupons (95%)
- ✅ Livraison (90%)

**En Développement** :
- 🟡 Stock (31% → 65% ciblé)
- 🟡 Marketing (18% → 60% ciblé)
- 🟡 Pricelists (21% → 80% ciblé)

## 💼 Avantage Concurrentiel

### Fonctionnalités Premium Incluses

Quelyos Suite inclut **gratuitement** des fonctionnalités typiquement facturées $30-50/user/mois :

**ERP Modules** :
- ✅ Email Builder Drag-and-Drop
- ✅ SMS Marketing Intégré
- 🎯 Marketing Automation (en cours)
- 🎯 Barcode Mobile App (en cours)

**SaaS Management** :
- ✅ Billing Dunning Automation (Stripe Billing : $100/mois)
- ✅ Multi-Tenant Management (Odoo SaaS Kit : $299-999)
- ✅ Health Score Prédictif (custom innovation)
- 🎯 Usage Analytics (Enterprise feature)
- 🎯 Trial Periods (en cours)
- 🎯 Marketing Automation - Onboarding Emails (Enterprise : $200/user/an)

**Économie estimée** : ~$2000-3300/user/an vs solutions ERP/SaaS Enterprise

## 🔧 Développement

### Architecture Monorepo

Le projet utilise **Turborepo** pour gérer efficacement le monorepo :

- **Packages partagés** : `@quelyos/ui-kit`, `@quelyos/api-client`, `@quelyos/utils`
- **Build optimisé** : Cache intelligent Turborepo
- **Type-safety** : TypeScript strict sur tous les packages

### Scripts Disponibles

```bash
# Développement
pnpm dev                    # Démarrer mode développement
pnpm build                  # Build de production
pnpm test                   # Suite de tests

# Gestion services
./scripts/dev-start.sh all        # Tous les services
./scripts/dev-start.sh backend    # Backend uniquement
./scripts/dev-start.sh backoffice # ERP complet
./scripts/dev-stop.sh all         # Arrêter tous

# Backend
cd odoo-backend && docker-compose up -d
```

### Conventions de Code

- **TypeScript** strict mode
- **ESLint** + **Prettier** (pre-commit hooks)
- **Tailwind CSS** pour le styling
- **React Query** pour la gestion d'état
- **Zod** pour la validation

## 🤝 Contribution

Voir **[CONTRIBUTING.md](CONTRIBUTING.md)** pour les guidelines de contribution.

## 📄 Licence

Ce projet utilise plusieurs licences selon les composants :

- **Frontend** (vitrine, dashboard, apps) : Propriétaire
- **Packages** (@quelyos/*) : MIT
- **Backend** : LGPL-3.0 (infrastructure ERP open-source)

Voir **[LICENSE](LICENSE)** pour plus de détails.

## 📞 Support

- **Documentation** : [README-DEV.md](README-DEV.md)
- **Issues** : [GitHub Issues](https://github.com/salmenktata/quelyosSuite/issues)
- **Email** : support@quelyos.com

---

**Quelyos Suite** - Suite ERP SaaS moderne et accessible
