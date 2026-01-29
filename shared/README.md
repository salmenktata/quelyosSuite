# Shared Packages - Quelyos ERP

Ce dossier contient les packages partagés entre les **frontends** (vitrine-quelyos, vitrine-client) et les **backoffices** (dashboard-client, super-admin-client), implémentant l'**Option 4 : Mutualisation pragmatique sans monorepo**.

## 🎯 Objectif

Réduire la duplication de code et aligner les versions des dépendances entre les deux applications, **sans** introduire la complexité d'un monorepo complet (workspaces npm/pnpm).

## 📦 Structure

```
shared/
├── logger/          # Logger sécurisé (masquage logs production)
├── types/           # Types TypeScript partagés
└── api-client/      # Client API Odoo unifié (Next.js + Vite)
```

## 📚 Packages disponibles

### `@quelyos/logger`

Logger sécurisé qui masque automatiquement les détails techniques en production.

**Utilisation** :
```typescript
import { logger, getUserFriendlyErrorMessage } from '@quelyos/logger';

logger.error('Erreur interne:', error); // Visible dev only
logger.warn('Attention:', warning);      // Visible dev only
logger.info('Information utilisateur');  // Toujours visible
logger.debug('Debug:', data);            // Visible dev only

const message = getUserFriendlyErrorMessage(error); // Message générique en prod
```

**Compatible** : Next.js (SSR + Client) et Vite

---

### `@quelyos/types`

Types TypeScript unifiés pour garantir la cohérence tri-couche (Frontend ↔ Backoffice ↔ Backend).

**Utilisation** :
```typescript
import type {
  Product,
  Order,
  Cart,
  User,
  Category,
  APIResponse,
  // ... 30+ types disponibles
} from '@quelyos/types';
```

**Types principaux** :
- `Product`, `ProductVariant`, `ProductImage`
- `Order`, `OrderLine`, `Cart`, `CartLine`
- `User`, `Address`, `WishlistItem`
- `Category`, `Currency`, `Coupon`
- `Pricelist`, `Warehouse`, `CustomerCategory`
- `APIResponse<T>`, `ProductFilters`, `ProductListResponse`

---

### `@quelyos/api-client`

Client API Odoo unifié compatible Next.js (SSR + Client) et Vite (Client-only).

**Utilisation** :
```typescript
import { odooClient } from '@quelyos/api-client';

// Auth
await odooClient.login(email, password);
await odooClient.logout();

// Produits
const { products } = await odooClient.getProducts({ category_id: 5, limit: 20 });
const { product } = await odooClient.getProduct(123);

// Panier
await odooClient.addToCart(productId, quantity);
const { cart } = await odooClient.getCart();

// Commandes
await odooClient.confirmOrder({ delivery_method_id: 1, payment_method_id: 2 });

// ... 40+ méthodes disponibles
```

**Fonctionnalités** :
- Détection automatique environnement (Next.js SSR/Client, Vite)
- Gestion session Odoo (localStorage)
- Wrapper JSON-RPC transparent
- Gestion erreurs 404/401 gracieuse
- Logging sécurisé intégré

---

## ⚙️ Configuration

### TypeScript

Les chemins `@quelyos/*` sont déjà configurés dans `tsconfig.json` :

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@quelyos/logger": ["../shared/logger/src"],
      "@quelyos/types": ["../shared/types/src"],
      "@quelyos/api-client": ["../shared/api-client/src"]
    }
  }
}
```

### Versions alignées

Les applications utilisent maintenant les mêmes versions :

| Dépendance | Version |
|------------|---------|
| React | 19.2.3 |
| React DOM | 19.2.3 |
| React Query | 5.90.20 |
| Tailwind CSS | 4 |
| TypeScript | 5 |
| Zod | 4.3.6 |

## 🔄 Migration des imports

### Avant (code dupliqué)

```typescript
// vitrine-client/src/lib/logger.ts
import { logger } from '@/lib/logger';

// dashboard-client/src/lib/logger.ts
import { logger } from '@/lib/logger';

// vitrine-client/src/types/api.ts
import type { Product } from '@/types/api';

// dashboard-client/src/types/index.ts
import type { Product } from '@/types';
```

### Après (code partagé)

```typescript
// Les deux apps utilisent le même import
import { logger } from '@quelyos/logger';
import type { Product } from '@quelyos/types';
import { odooClient } from '@quelyos/api-client';
```

## 🎯 Gains obtenus

- ✅ **-50% duplication code métier** (logger, types, API client)
- ✅ **Versions alignées** (React 19, Tailwind 4, React Query 5.90)
- ✅ **0 refonte** des applications existantes
- ✅ **0 complexité monorepo** (pas de workspaces, hoisting, ou outils additionnels)
- ✅ **Cohérence garantie** : types communs = 0 incohérence frontends ↔ backoffices

## 📝 Maintenance

### Ajouter un nouveau type

Éditer `shared/types/src/index.ts` et ajouter l'interface.

### Ajouter une méthode API

Éditer `shared/api-client/src/index.ts` et ajouter la méthode dans la classe `OdooClient`.

### Mettre à jour une dépendance

Mettre à jour **dans les deux** `package.json` (frontend + backoffice) pour garantir l'alignement.

## ⚠️ Limitations connues

- **Pas de build séparé** : shared/* est importé directement en TypeScript (pas de dist/ compilé)
- **Duplication node_modules** : Chaque app a toujours ses propres `node_modules` (722 MB total)
- **Mise à jour manuelle** : Les versions doivent être alignées manuellement dans les deux `package.json`

Ces limitations sont acceptables car elles évitent la complexité d'un monorepo pour un gain marginal.

## 🚀 Prochaines étapes (optionnelles)

Si le projet grandit et que la duplication devient problématique :

1. **Workspaces pnpm** : Convertir vers un vrai monorepo avec dépendances hoistées (-50% node_modules)
2. **Turborepo** : Ajouter cache build partagé pour CI/CD plus rapide
3. **Changesets** : Automatiser versioning des packages shared

Pour l'instant, cette approche pragmatique est **largement suffisante** pour un projet de cette taille.
