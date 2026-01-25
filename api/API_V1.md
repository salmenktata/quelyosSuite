# API Unifiée Quelyos v1

## Architecture

```
/api/v1/
├── finance/          # Module Finance
│   ├── accounts
│   ├── transactions
│   ├── budgets
│   ├── categories
│   ├── portfolios
│   ├── dashboard
│   ├── reporting
│   ├── import
│   ├── export
│   └── payment-flows
├── marketing/        # Module Marketing
│   ├── posts
│   ├── social
│   ├── content
│   ├── analytics
│   └── inbox
└── [shared]/        # Routes partagées
    ├── auth
    ├── company
    ├── settings
    ├── user
    └── users
```

## Routes disponibles

### Finance Module
- `GET /api/v1/finance/accounts` - Liste des comptes
- `GET /api/v1/finance/transactions` - Liste des transactions
- `GET /api/v1/finance/budgets` - Liste des budgets
- `GET /api/v1/finance/dashboard` - Dashboard financier
- `GET /api/v1/finance/reporting` - Rapports financiers

### Marketing Module (nouveaux)
- `GET /api/v1/marketing/posts` - Liste des posts
- `POST /api/v1/marketing/posts` - Créer un post
- `GET /api/v1/marketing/social` - Comptes sociaux
- `GET /api/v1/marketing/analytics` - Analytics marketing
- `GET /api/v1/marketing/inbox` - Messages inbox

### Routes partagées
- `POST /api/v1/auth/login` - Connexion
- `POST /api/v1/auth/register` - Inscription
- `GET /api/v1/company` - Infos company
- `GET /api/v1/settings` - Paramètres

## Authentification

Toutes les routes protégées utilisent désormais des cookies httpOnly (access/refresh) émis par `/api/v1/auth/login`. Côté client :
- envoyer les requêtes avec `credentials: 'include'` (Next/Fetch) pour inclure les cookies,
- le header `Authorization: Bearer <token>` reste supporté **uniquement pour compat/test** et ne doit plus être utilisé par les apps front.

Exemple fetch côté front :
```ts
await fetch('/api/v1/finance/accounts', { credentials: 'include' });
```

Exemple curl avec cookies (après login) :
```bash
curl -c cookies.txt -X POST http://localhost:3004/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

curl -b cookies.txt http://localhost:3004/api/v1/finance/accounts
```

## Rétrocompatibilité

Les anciennes routes (sans `/api/v1`) restent actives pour la rétrocompatibilité :
- `/accounts` → redirige vers `/api/v1/finance/accounts`
- `/transactions` → redirige vers `/api/v1/finance/transactions`
- etc.

## Base de données

- **DB unifiée** : `quelyos_db`
- **Tables Finance** : Account, Transaction, Budget, Portfolio, Category...
- **Tables Marketing** : Post, SocialAccount, PostAnalytics, InboxMessage...
- **Tables partagées** : User, Company, CompanySettings...

## Status

- ✅ P1 - Fondations (100%)
- ✅ P2 - Database unifiée (100%)
- ✅ P3 - API unifiée (80% - routes marketing en placeholder)
- 🔴 P4 - Docker (0%)
- 🔴 P5 - Packages partagés (0%)
