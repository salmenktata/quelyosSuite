# Architecture Quelyos Suite

## Vision

Quelyos Suite = ERP modulaire partageant un **backend unique Odoo 19** avec frontends spécialisés pour chaque usage.

## Vue d'ensemble

```
┌──────────────────────────────────────────────────────────────┐
│       SITE VITRINE (vitrine-quelyos) - Next.js 14 - :3000   │
│       Marketing, Landing Pages, Login                        │
├──────────────────────────────────────────────────────────────┤
│       BOUTIQUE E-COMMERCE (vitrine-client) - Next.js 16 - :3001
│       Catalogue, Panier, Commandes client final              │
└──────────────────────────┬───────────────────────────────────┘
                           │
    ┌──────────────────────┴──────────────────────────┐
    │                                                 │
┌───┴──────────────────┐   ┌──────────────────────────┴──────┐
│ ERP COMPLET          │   │  SUPER ADMIN GLOBAL              │
│ (dashboard-client)   │   │  (super-admin-client)            │
│ Port 5175            │   │  Port 9000                       │
│ Full Suite (9 modules│   │  Admin SaaS, Tenants, Billing    │
└───┬──────────────────┘   └──────────────────────────┬──────┘
    │                        API REST                  │
┌───┴──────────────────────────────────────────────────┴──────┐
│         BACKEND UNIQUE (odoo-backend)                        │
│         Odoo 19 Community - Port 8069                        │
│         101 modèles · 764 endpoints · Multi-tenant           │
│         PostgreSQL (5432) + Redis (6379)                     │
└──────────────────────────────────────────────────────────────┘
```

## Services et Ports

### Services existants (production)

| Service | Répertoire | Port | URL | Description |
|---------|-----------|------|-----|-------------|
| **Site Vitrine** | `vitrine-quelyos/` | 3000 | http://localhost:3000 | Site marketing principal (Next.js 14) |
| **E-commerce** | `vitrine-client/` | 3001 | http://localhost:3001 | Boutique en ligne (Next.js 16) |
| **ERP Complet** | `dashboard-client/` | 5175 | http://localhost:5175 | Backoffice Full Suite (React + Vite) |
| **Super Admin** | `super-admin-client/` | 9000 | http://localhost:9000 | Admin SaaS (React + Vite) |
| **Backend API** | `odoo-backend/` | 8069 | http://localhost:8069/api/* | API REST Odoo |
| **Interface Odoo** | `odoo-backend/` | 8069 | http://localhost:8069 | Interface native Odoo (admin/admin) |
| **PostgreSQL** | Docker | 5432 | localhost:5432 | Base de données principale |
| **Redis** | Docker | 6379 | localhost:6379 | Cache et sessions |

### Modules ERP

**dashboard-client (port 5175)** = ERP complet = **Full Suite** avec 9 modules intégrés :
- home (Accueil)
- finance (Finance)
- store (Boutique)
- stock (Stock/Inventaire)
- crm (CRM)
- marketing (Marketing)
- hr (Ressources Humaines)
- support (Support/Helpdesk)
- pos (Point de Vente)

## Démarrage des Services

### Méthode 1 : Script global (recommandé)

```bash
# Démarrer tous les services
./scripts/dev-start.sh all

# Démarrer individuellement
./scripts/dev-start.sh backend      # Odoo (8069)
./scripts/dev-start.sh backoffice   # ERP complet (5175)
./scripts/dev-start.sh vitrine      # Site marketing (3000)
./scripts/dev-start.sh ecommerce    # Boutique (3001)
./scripts/dev-start.sh superadmin   # Super Admin (9000)

# Arrêter tous les services
./scripts/dev-stop.sh all
```

### Méthode 2 : Commande Claude Code

```bash
/restart-all          # Relancer tous les services
/restart-odoo         # Backend Odoo
/restart-backoffice   # ERP complet (dashboard-client)
/restart-vitrine      # Site marketing
/restart-ecommerce    # Boutique e-commerce
```

### Méthode 3 : Manuel

```bash
# Backend
cd odoo-backend && docker-compose up -d

# ERP complet (Full Suite)
cd dashboard-client && pnpm dev

# Site Vitrine
cd vitrine-quelyos && pnpm dev

# E-commerce
cd vitrine-client && pnpm dev

# Super Admin
cd super-admin-client && pnpm dev
```

## Dépendances entre Services

```
Backend Odoo (8069) ─┐
                     ├─→ ERP Complet / Full Suite (5175)
                     ├─→ Site Vitrine (3000)
                     ├─→ E-commerce (3001)
                     └─→ Super Admin (9000)
```

- **Le backend doit démarrer en premier** (tous les frontends en dépendent)
- Les frontends peuvent démarrer en parallèle une fois le backend prêt
- Tous les frontends utilisent les **mêmes endpoints API** du backend
- Temps de démarrage : Backend (~30s), Frontends (~5-10s chacun)

## IMPORTANT : Dashboard-Client vs Super-Admin

**Il existe DEUX niveaux d'applications frontend** :

### 1. **Dashboard-Client / ERP Complet** (Port 5175)
- **Rôle** : Backoffice multi-tenant = **Full Suite** (tous les modules)
- **Utilisateurs** : Clients finaux
- **Modules** : 9 modules intégrés (Finance + Store + Stock + CRM + Marketing + HR + POS + Support + Home)

### 2. **Super-Admin-Client** (Port 9000)
- **Rôle** : Panel d'administration SaaS global
- **Utilisateurs** : Equipe Quelyos uniquement (administrateurs)
- **Scope** : Vue transversale sur TOUS les tenants + gestion abonnements/SaaS

### Règle de Développement

**Quand ajouter une page** :
- **dashboard-client** : Fonctionnalité métier pour l'ERP complet (9 modules)
- **super-admin-client** : Admin système Quelyos (monitoring, tenants, billing)

**Partage de code** :
- Composants UI communs : `packages/ui-kit/` (@quelyos/ui-kit)
- Client API partagé : `packages/api-client/` (@quelyos/api-client)
- Helpers partagés : `packages/utils/` (@quelyos/utils)

## Architecture Backend Odoo

### 🔒 Isolation Complète (v3.0.0)

**Quelyos Suite = Core Odoo 19 Community UNIQUEMENT + Modules Quelyos Natifs**

```
┌─────────────────────────────────────────────────────────┐
│                  Quelyos Suite v3.0.0                    │
│                  (100% Autonome)                         │
├─────────────────────────────────────────────────────────┤
│  Modules Quelyos (6 modules natifs)                     │
│  ├── quelyos_core          (orchestrateur)              │
│  ├── quelyos_api           (API REST + multi-tenant)    │
│  ├── quelyos_stock_advanced (remplace 3 modules OCA)    │
│  ├── quelyos_finance       (trésorerie, budgets)        │
│  ├── quelyos_sms_tn        (SMS Tunisie)                │
│  └── quelyos_debrand       (suppression marque Odoo)    │
├─────────────────────────────────────────────────────────┤
│  Core Odoo 19 Community (14 modules standard)          │
│  ├── Infrastructure : base, web, mail                   │
│  ├── Site web : website, website_sale                   │
│  ├── Commerce : sale_management, crm, delivery,         │
│  │               payment, loyalty                        │
│  ├── Catalogue : product, stock                         │
│  ├── Finance : account                                   │
│  ├── Marketing : mass_mailing                           │
│  └── Contacts : contacts                                │
└─────────────────────────────────────────────────────────┘
         ⚠️ AUCUNE dépendance OCA/tierce
```

### Modules Supprimés (v3.0.0)

**4 modules OCA Stock historiquement utilisés (désormais remplacés)** :
- ❌ `stock_change_qty_reason` → ✅ `quelyos_stock_advanced`
- ❌ `stock_demand_estimate` → ✅ Non utilisé
- ❌ `stock_inventory` → ✅ `quelyos_stock_advanced`
- ❌ `stock_location_lockdown` → ✅ `quelyos_stock_advanced`

**3 modules OCA Marketing (jamais utilisés)** :
- ❌ `mass_mailing_partner` (désactivé dès le début)
- ❌ `mass_mailing_list_dynamic` (désactivé dès le début)
- ❌ `mass_mailing_resend` (désactivé dès le début)

### Garanties d'Isolation

✅ **Whitelisting automatique** (`quelyos_core/__init__.py`)
- Vérification post-installation : aucun module non-core installé
- Logs d'avertissement si modules OCA/tiers détectés

✅ **Validation version Odoo** (`quelyos_api/__init__.py`)
- Blocage installation si Odoo != 19.x
- Garantit compatibilité stricte

✅ **Gouvernance stricte**
- Documentation : `.claude/DEPENDENCIES_POLICY.md`
- Processus ajout dépendance : 4 étapes validation
- Stratégie : internalisation (fork dans `quelyos_*`) si nécessaire

### Avantages

🎯 **Pérennité**
- Aucune régression lors de mises à jour OCA
- Contrôle total sur le code
- Debug et hotfix facilités

🎯 **Maintenance Simplifiée**
- Devs Odoo vanilla suffisent (pas d'expertise OCA requise)
- Documentation centralisée (pas de docs OCA externes)
- Onboarding développeurs accéléré

🎯 **Upgrade Path Clair**
- Migration Odoo 19→20→21 sans blocage externe
- Pas de dépendances à gérer lors de migrations majeures
- Fork Odoo possible si nécessaire (pas de lock-in)

## Structure des Répertoires

```
quelyosSuite/
├── odoo-backend/              # Backend Odoo 19 (backend unique)
│   ├── addons/
│   │   ├── quelyos_api/       # API REST + multi-tenant (101 modèles)
│   │   ├── quelyos_core/      # Orchestrateur modules
│   │   ├── quelyos_finance/   # Module trésorerie/budgets
│   │   ├── quelyos_stock_advanced/  # Stock avancé
│   │   ├── quelyos_sms_tn/    # SMS Tunisie
│   │   └── quelyos_debrand/   # Anonymisation Odoo
│   └── docker-compose.yml
│
├── dashboard-client/          # ERP Complet / Full Suite (React + Vite, :5175)
│   └── src/
│       ├── pages/             # 209 pages (8 modules)
│       ├── components/common/ # 30+ composants (source @quelyos/ui-kit)
│       └── config/modules.ts  # Configuration modules
│
├── vitrine-quelyos/           # Site marketing (Next.js 14, :3000)
├── vitrine-client/            # E-commerce client (Next.js 16, :3001)
├── super-admin-client/        # Admin SaaS (React + Vite, :9000)
│
├── packages/                  # Packages partagés (monorepo)
│   ├── ui-kit/                # @quelyos/ui-kit (composants React)
│   ├── api-client/            # @quelyos/api-client (client API)
│   ├── utils/                 # @quelyos/utils (helpers)
│   └── logger/                # @quelyos/logger (existant)
│
├── scripts/                   # Scripts de gestion
│   ├── dev-start.sh
│   └── dev-stop.sh
├── turbo.json                 # Turborepo config (à créer)
├── pnpm-workspace.yaml        # Workspace config
└── .env.ports                 # Configuration des ports
```

## Logs et Debugging

### Vérifier les services actifs

```bash
# Vérifier ports existants
lsof -i:3000,3001,5175,8069,9000

# Vérifier les conteneurs Docker
docker ps --filter "name=quelyos"

# Vérifier les processus Node.js
ps aux | grep -E "next|vite" | grep -v grep
```

### Consulter les logs

```bash
# Logs Backend
docker-compose logs -f

# Logs Backoffice
tail -f /tmp/quelyos-backoffice.log

# Logs Site Vitrine
tail -f /tmp/quelyos-vitrine.log

# Logs E-commerce
tail -f /tmp/quelyos-ecommerce.log
```

## Résolution de Problèmes

### Port déjà utilisé

```bash
# Trouver le processus utilisant le port
lsof -ti:3000

# Arrêter le processus
lsof -ti:3000 | xargs kill -9

# Ou utiliser le script
./scripts/dev-stop.sh all
```

### Service ne démarre pas

1. Vérifier que les dépendances sont installées : `pnpm install`
2. Vérifier que Docker est démarré (pour le backend)
3. Consulter les logs d'erreur
4. Vérifier la configuration des ports dans `.env.ports`

### Conflit de ports après git pull

```bash
# Arrêter tous les services
./scripts/dev-stop.sh all

# Vérifier les changements dans package.json
git diff HEAD~1 */package.json

# Redémarrer
./scripts/dev-start.sh all
```

## Configuration Production

Voir `nginx/` et `docs/deployment/` pour la configuration de production avec reverse proxy.

---

**Dernière mise à jour** : 2026-01-31
