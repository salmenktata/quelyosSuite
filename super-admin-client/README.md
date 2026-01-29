# Super Admin Client - Quelyos Suite

Interface d'administration SaaS pour gérer les tenants, abonnements, facturation et monitoring de la plateforme Quelyos.

## Stack Technique

- **Framework** : React 19.2.3 + TypeScript 5.7
- **Build** : Vite 6.0.7 + Code-splitting optimisé
- **Routing** : React Router 7.1.1
- **Data Fetching** : TanStack React Query 5.90.20
- **Styling** : Tailwind CSS 3.4.17 (dark mode inclus)
- **State** : Zustand 5.0.10
- **Forms** : React Hook Form 7.71.1 + Zod 4.3.6
- **Icons** : Lucide-react 0.563.0
- **Charts** : Recharts 2.15.0
- **Port** : 5176

## Installation

```bash
cd super-admin-client
npm install
```

## Démarrage

```bash
# Développement (http://localhost:5176)
npm run dev

# Build production
npm run build

# Preview build
npm run preview
```

## Authentification

- Login avec compte Odoo super admin (groupe `base.group_system` requis)
- Session stockée dans `localStorage.session_id`
- Header Authorization: `Bearer ${sessionId}`

## Pages Principales

### 1. Dashboard (`/dashboard`)
- **KPIs globaux** : MRR, ARR, Active Subscriptions, Churn Rate
- **Charts** : MRR History (12 mois), Revenue by Plan (pie chart)
- **Tables** : Top 10 Customers par MRR, At-Risk Customers, Recent Subscriptions

### 2. Tenants (`/tenants`)
- **Liste paginée** : Tous les tenants avec filtres (plan, état, recherche)
- **Détails tenant** : Subscription active, usage quotas, features activées
- **Actions** : Suspendre/Réactiver, Upgrade/Downgrade (à venir)

### 3. Abonnements (`/subscriptions`)
- **Liste globale** : Toutes subscriptions avec badges colorés par état
- **Filtres** : Par état (trial/active/past_due), par plan
- **Métriques** : MRR breakdown par plan, Churn analysis (12 mois)

### 4. Facturation (`/billing`)
- **Factures** : Liste globale avec état paiement
- **Transactions** : Historique paiements (Stripe/Flouci/Konnect)
- **Summary** : Revenue total, factures impayées, taux succès, paiements échoués

### 5. Monitoring (`/monitoring`)
- **Provisioning Jobs** : État jobs tenant avec auto-refresh (5s)
- **System Health** : Status Backend, PostgreSQL, Redis, Stripe
- **Error Logs** : Logs système avec filtres (à venir)

## Backend API

Tous les endpoints sont dans `odoo-backend/addons/quelyos_api/controllers/super_admin.py` :

- `GET /api/super-admin/dashboard/metrics`
- `GET /api/super-admin/tenants`
- `GET /api/super-admin/subscriptions`
- `GET /api/super-admin/subscriptions/mrr-breakdown`
- `GET /api/super-admin/subscriptions/churn-analysis`
- `GET /api/super-admin/invoices`
- `GET /api/super-admin/invoices/summary`
- `GET /api/super-admin/transactions`
- `GET /api/super-admin/provisioning-jobs`
- `GET /api/super-admin/system/health`

## Architecture

```
super-admin-client/
├── src/
│   ├── components/
│   │   ├── Layout.tsx           # Layout principal avec sidebar
│   │   └── common/              # Composants réutilisables (Button, Table, Modal, etc.)
│   ├── pages/
│   │   ├── Login.tsx            # Page de connexion
│   │   ├── Dashboard.tsx        # KPIs + Charts
│   │   ├── Tenants.tsx          # Gestion tenants
│   │   ├── Subscriptions.tsx   # Gestion abonnements
│   │   ├── Billing.tsx          # Facturation & Transactions
│   │   └── Monitoring.tsx       # Provisioning + System Health
│   ├── hooks/                   # React Query hooks
│   ├── lib/
│   │   ├── api/                 # API Client (gateway, retry, circuit breaker)
│   │   └── config.ts            # Configuration centralisée
│   ├── contexts/
│   │   ├── ThemeContext.tsx    # Dark/Light mode
│   │   └── ToastContext.tsx    # Notifications
│   └── types/
│       └── index.ts             # Types TypeScript
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

## Scripts Dev

```bash
# Démarrer super-admin-client uniquement
./scripts/dev-start.sh superadmin

# Démarrer tous les services (incluant super-admin)
./scripts/dev-start.sh all

# Arrêter super-admin-client
./scripts/dev-stop.sh superadmin
```

## Email Templates & Crons

### Email Templates
- **Trial Ending Soon** : Envoyé 7 jours avant fin trial
- **Payment Failed** : Envoyé quand paiement échoue
- **Quota Warning** : Envoyé à 80% usage quota
- **Renewal Success** : Envoyé après renouvellement réussi

### Crons (quotidiens à 9h)
- **Check Trial Expiry** : Expire les trials terminés
- **Send Trial Ending Reminders** : Email 7 jours avant expiration
- **Check Quota Warnings** : Email à 80% quota

## Sécurité

- Tous les endpoints super admin vérifient `base.group_system`
- Protection CSRF désactivée (auth='user')
- Headers sécurisés (X-Frame-Options, CSP, etc.)
- Session timeout : 30 minutes

## Performance

- **Code-splitting** : Pages et librairies (Recharts, TanStack) chargées en lazy
- **Cache React Query** : 5 minutes staleTime pour métriques
- **Auto-refresh conditionnel** : Provisioning jobs uniquement si jobs running
- **Pagination** : 50 items par page (tenants), 200 max (factures/transactions)

## TODO

- [ ] Actions admin : Suspendre tenant, Upgrade/Downgrade
- [ ] Billing history détaillée par subscription
- [ ] Error logs avec full-text search
- [ ] Advanced metrics : Cohort analysis, LTV, CAC
- [ ] Export Excel des factures
- [ ] Retry provisioning job échoué
- [ ] Tenant impersonate (login as tenant admin)
