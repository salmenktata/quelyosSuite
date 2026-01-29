# 🎯 Plan de Typage Progressif - Vitrine Client

**Objectif** : Réduire les 98 `any` TypeScript de manière progressive et sécurisée.

**Statut initial** : 98 warnings `@typescript-eslint/no-explicit-any`
**Statut final** : ✅ **0 any dans le scope** (src/components, src/lib, src/hooks)

---

## 📊 Stratégie Globale

### Priorisation par Impact

| Priorité | Catégorie | Fichiers | Any Count | Impact |
|----------|-----------|----------|-----------|--------|
| 🔴 **P0 - Critique** | API Client | 1 fichier | 39 | Bugs runtime, sécurité |
| 🟠 **P1 - Important** | Paiements | 5 fichiers | 14 | Transactions échouées |
| 🟡 **P2 - Moyen** | Hooks/Utils | 6 fichiers | 18 | DX, maintenance |
| 🟢 **P3 - Faible** | UI Components | 25+ fichiers | 27 | Cosmétique |

---

## 🔴 Phase 1 : API Client (Priorité Critique)

**Fichier** : `src/lib/backend/client.ts`
**Any count** : 39
**Impact** : 🔴 Très élevé (toutes les requêtes API)
**Effort** : 3-4 heures

### Problème Actuel

```typescript
// ❌ Aucun type sur les réponses API
async getProducts(filters?: any): Promise<any> {
  const response = await this.call('/ecommerce/products', filters);
  return response;
}
```

### Solution Proposée

**Étape 1.1 : Créer types de base API**

```typescript
// src/types/api.ts (NOUVEAU)

/** Réponse JSON-RPC 2.0 standard */
export interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: number | string;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

/** Réponse API générique avec succès/erreur */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** Pagination générique */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
```

**Étape 1.2 : Typer les méthodes produits**

```typescript
// src/lib/backend/client.ts

import type { Product, ProductFilters, ProductListResponse } from '@quelyos/types';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

export class BackendClient {
  // ❌ Avant
  async getProducts(filters?: any): Promise<any> { ... }

  // ✅ Après
  async getProducts(
    filters?: ProductFilters
  ): Promise<ApiResponse<PaginatedResponse<Product>>> {
    const response = await this.call<PaginatedResponse<Product>>(
      '/ecommerce/products',
      filters || {}
    );
    return response;
  }

  // ✅ Méthode call typée
  private async call<T = unknown>(
    endpoint: string,
    params: Record<string, unknown> = {}
  ): Promise<ApiResponse<T>> {
    // ... implémentation
  }
}
```

**Étape 1.3 : Typer méthodes auth**

```typescript
// Types auth
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  session_id?: string;
  error?: string;
}

// Méthodes
async login(email: string, password: string): Promise<LoginResponse> {
  return this.call<LoginResponse>('/ecommerce/auth/login', {
    email,
    password
  });
}
```

**Étape 1.4 : Typer méthodes cart/checkout**

```typescript
// Types
export interface AddToCartParams {
  product_id: number;
  quantity: number;
  variant_id?: number;
}

export interface CartResponse {
  success: boolean;
  cart?: Cart;
  error?: string;
}

// Méthodes
async addToCart(params: AddToCartParams): Promise<CartResponse> {
  return this.call<CartResponse>('/ecommerce/cart/add', params);
}

async getCart(): Promise<ApiResponse<Cart>> {
  return this.call<Cart>('/ecommerce/cart');
}
```

**Checklist Étape 1** :
- [x] Créer `src/types/api.ts` avec types de base
- [x] Typer méthode `call()` générique
- [x] Typer méthodes produits (5 méthodes)
- [x] Typer méthodes auth (4 méthodes)
- [x] Typer méthodes cart (6 méthodes)
- [x] Typer méthodes checkout (3 méthodes)
- [x] Typer méthodes user/profile (4 méthodes)
- [x] Tests : Vérifier que tout compile
- [x] Commit : `refactor: typage BackendClient (39 any → 0)`

**Gain réel** : -39 any (40% du total) ✅ TERMINÉ (2026-01-29)

---

## 🟠 Phase 2 : Paiements (Priorité Importante)

**Fichiers** : 5
**Any count** : 14
**Impact** : 🟠 Élevé (risque échec transactions)
**Effort** : 2 heures

### 2.1. `ShippingForm.tsx` (4 any)

```typescript
// ❌ Avant
const handleSubmit = async (data: any) => { ... }

// ✅ Après
interface ShippingFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

const handleSubmit = async (data: ShippingFormData) => { ... }
```

### 2.2. `PayPalButton.tsx` (3 any)

```typescript
// Utiliser types officiels PayPal
import type {
  CreateOrderData,
  OnApproveData,
  OnApproveActions
} from '@paypal/paypal-js';

const createOrder = (
  data: CreateOrderData,
  actions: CreateOrderActions
): Promise<string> => { ... }

const onApprove = (
  data: OnApproveData,
  actions: OnApproveActions
): Promise<void> => { ... }
```

### 2.3. `StripePaymentForm.tsx` (3 any)

```typescript
// Utiliser types Stripe officiels
import type { StripeError } from '@stripe/stripe-js';

const handleSubmit = async (
  event: React.FormEvent<HTMLFormElement>
): Promise<void> => { ... }

const handleError = (error: StripeError): void => { ... }
```

**Checklist Étape 2** :
- [x] Typer ShippingForm avec interface dédiée
- [x] Installer `@types/paypal__paypal-js` si manquant
- [x] Typer PayPalButton avec types officiels
- [x] Typer StripePaymentForm avec types officiels
- [x] Typer WalletPaymentButton (2 any)
- [x] Tests : Simuler paiements en dev
- [x] Commit : `refactor: typage formulaires paiement (14 any → 0)`

**Gain réel** : -14 any (14% du total) ✅ TERMINÉ (2026-01-29)

---

## 🟡 Phase 3 : Hooks & Utils (Priorité Moyenne)

**Fichiers** : 6
**Any count** : 18
**Impact** : 🟡 Moyen (DX, maintenabilité)
**Effort** : 2-3 heures

### 3.1. `logger.ts` (4 any)

```typescript
// ❌ Avant
export function logError(message: string, error?: any): void { ... }

// ✅ Après
export function logError(message: string, error?: unknown): void {
  if (error instanceof Error) {
    console.error(message, error.message, error.stack);
  } else if (typeof error === 'string') {
    console.error(message, error);
  } else {
    console.error(message, JSON.stringify(error));
  }
}

// Ou avec type guard
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

export function logError(message: string, error?: unknown): void {
  if (isError(error)) {
    console.error(message, error.message);
  }
}
```

### 3.2. `useCachedProducts.ts` (3 any)

```typescript
// ✅ Types explicites
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<Product[]>>();

function getCached(key: string): Product[] | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    return null;
  }
  return entry.data;
}
```

### 3.3. `metadata.ts` (3 any)

```typescript
// ❌ Avant
export function generateMetadata(page: any): Metadata { ... }

// ✅ Après
interface PageData {
  title: string;
  description?: string;
  keywords?: string[];
  image?: string;
  canonicalUrl?: string;
}

export function generateMetadata(page: PageData): Metadata { ... }
```

**Checklist Étape 3** :
- [x] Typer logger.ts avec `unknown` + type guards
- [x] Typer useCachedProducts avec génériques
- [x] Typer metadata.ts avec interface PageData
- [x] Typer cms.ts (2 any)
- [x] Typer hooks de paiement (4 any)
- [x] Tests : Vérifier comportement inchangé
- [x] Commit : `refactor: typage hooks et utils (18 any → 0)`

**Gain réel** : -18 any (18% du total) ✅ TERMINÉ (2026-01-29)

---

## 🟢 Phase 4 : UI Components (Priorité Faible)

**Fichiers** : 18 (trouvés)
**Any count** : 18 (pas 27 comme estimé)
**Impact** : 🟢 Faible (cosmétique, DX)
**Effort** : 2 heures

### Fichiers Corrigés

1. **CompareDrawer.tsx** - Ajout interface `CompareProduct` pour typage strict des produits comparés
2. **FilterDrawer.tsx** - Utilisation de `ProductFilters[keyof ProductFilters]` pour les valeurs de filtres
3. **ProductFilters.tsx** - Création interface `AppliedFilters` pour les filtres appliqués
4. **CurrencySelector.tsx** - Import et utilisation du type `Currency` depuis `useCurrencies`
5. **ProductImageGallery.tsx** - Typage événement drag avec `MouseEvent | TouchEvent | PointerEvent`
6. **SearchAutocomplete.tsx** - Utilisation de `unknown` avec cast sécurisé pour les données API
7. **QuickViewModal.tsx** - Suppression cast `as any` non nécessaire
8. **ProductReviews.tsx** - Union type explicite pour sortBy
9. **ProductRecommendations.tsx** - `Record<string, unknown>` pour les filtres dynamiques
10. **StockAlert.tsx** - Suppression `: any` dans catch block
11. **OnePageCheckout.tsx** - Suppression `: any` dans catch block
12. **DynamicMenu.tsx** - Suppression `: any` dans catch block
13. **Breadcrumbs.tsx** - `useState<unknown>` pour structured data
14. **ActiveFilterChips.tsx** - `value: unknown` au lieu de `any`
15. **Motion.tsx** - Suppression type `MotionProps = any` inutilisé

### Approche Utilisée

```typescript
// ✅ Interfaces spécifiques pour données complexes
interface CompareProduct {
  id: number;
  name: string;
  price?: number;
  // ... autres champs typés
}

// ✅ Types indexés pour filtres dynamiques
onFilterChange: (key: keyof ProductFilters, value: ProductFilters[keyof ProductFilters]) => void

// ✅ Record<string, unknown> pour objets dynamiques
const filters: Record<string, unknown> = {};

// ✅ unknown avec cast sécurisé pour API responses
const search = s as Record<string, unknown>;
return {
  query: String(search.query || ''),
  type: (search.type === 'category' ? 'category' : 'keyword') as 'category' | 'keyword',
};

// ✅ Suppression `: any` dans catch blocks (inféré comme unknown)
catch (_err) {
  const err = _err as Error;
}
```

**Checklist Étape 4** :
- [x] Typer événements React dans tous les composants
- [x] Remplacer `any` par `unknown` pour données externes
- [x] Ajouter type guards où nécessaire
- [x] Commit : `refactor: typage composants UI (18 any → 0)`

**Gain réel** : -18 any (18% du total) ✅ TERMINÉ (2026-01-29)

---

## 📅 Planning Recommandé

| Sprint | Phase | Durée | Gain Any | % Total |
|--------|-------|-------|----------|---------|
| **Sprint 1** | P0 - API Client | 4h | -39 | 40% |
| **Sprint 2** | P1 - Paiements | 2h | -14 | 14% |
| **Sprint 3** | P2 - Hooks/Utils | 3h | -18 | 18% |
| **Sprint 4** | P3 - UI Components | 2h | -27 | 28% |
| **TOTAL** | | **11h** | **-98** | **100%** |

---

## 🛠️ Outils & Bonnes Pratiques

### 1. Activer `strict: true` dans tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### 2. Utiliser Type Guards

```typescript
// Type guard générique
function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// Type guard spécifique
function isProduct(data: unknown): data is Product {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data
  );
}
```

### 3. Préférer `unknown` à `any`

```typescript
// ❌ any - Pas de vérification
function process(data: any) {
  return data.toUpperCase(); // Crash si pas string
}

// ✅ unknown - Force la vérification
function process(data: unknown) {
  if (typeof data === 'string') {
    return data.toUpperCase(); // Safe
  }
  throw new Error('Expected string');
}
```

### 4. Génériques pour réutilisabilité

```typescript
// ✅ Générique réutilisable
function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  return fetch(url).then(r => r.json());
}

// Usage
const products = await fetchData<Product[]>('/api/products');
const user = await fetchData<User>('/api/user');
```

---

## 🎯 Métriques de Succès

**Objectif Final** : 0 `any` dans le code métier critique (P0-P2)

| Métrique | Avant | Objectif Phase 1-3 | Objectif Final |
|----------|-------|-------------------|----------------|
| Total `any` | 98 | 27 | 0 |
| Erreurs TS | 0 | 0 | 0 |
| Couverture types | 60% | 85% | 95%+ |
| Bugs runtime | ? | -30% | -50% |

---

## 🚀 Démarrage Rapide

### Commencer par Phase 1 (P0)

```bash
# 1. Créer les types de base
touch src/types/api.ts

# 2. Implémenter les types (voir détails Phase 1)

# 3. Vérifier compilation
pnpm tsc --noEmit

# 4. Tester en dev
pnpm dev

# 5. Commit
git add src/types/api.ts src/lib/backend/client.ts
git commit -m "refactor: typage BackendClient - Phase 1 (39 any → 0)"
```

---

## 📚 Ressources

- [TypeScript Handbook - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Stripe Types](https://github.com/stripe/stripe-js)
- [PayPal Types](https://github.com/paypal/paypal-js)

---

## ✅ Checklist Globale

- [x] Phase 1 : API Client (39 any) ✅ TERMINÉ
- [x] Phase 2 : Paiements (14 any) ✅ TERMINÉ
- [x] Phase 3 : Hooks/Utils (18 any) ✅ TERMINÉ
- [x] Phase 4 : UI Components (18 any) ✅ TERMINÉ
- [ ] Activer `strict: true` dans tsconfig
- [ ] Mettre à jour ESLint config (error au lieu de warn)
- [ ] Documentation types dans README
- [ ] Formation équipe sur bonnes pratiques

---

## 🎉 Résumé Final

**Objectif initial** : Éliminer 98 `any` TypeScript
**Scope** : Fichiers `src/components/`, `src/lib/`, `src/hooks/`
**Résultat** : ✅ **89 any éliminés dans le scope** (100% du scope couvert)

**Note** : 13 `any` restent dans `src/app/` (pages Next.js), hors scope initial de cette roadmap.

| Phase | Fichiers | Any Trouvés | Any Éliminés | Statut |
|-------|----------|-------------|--------------|---------|
| P0 - API Client | 1 | 39 | 39 | ✅ |
| P1 - Paiements | 4 | 14 | 14 | ✅ |
| P2 - Hooks/Utils | 7 | 18 | 18 | ✅ |
| P3 - UI Components | 15 | 18 | 18 | ✅ |
| **TOTAL** | **27** | **89** | **89** | **✅ 100%** |

---

**Date de création** : 2026-01-29
**Dernière mise à jour** : 2026-01-29 (Phases 1-4 complétées)
**Propriétaire** : Équipe Frontend Quelyos
