# Guide de Migration vers BaseApiClient

Ce guide explique comment migrer progressivement les fichiers `api.ts`, `api-base.ts` et `backend-rpc.ts` vers la nouvelle classe `BaseApiClient`.

## Avantages de BaseApiClient

- ✅ **-600 lignes de code dupliqué**
- ✅ **Gestion unifiée** de l'authentification
- ✅ **Retry + Circuit Breaker** intégrés
- ✅ **Error handling** standardisé
- ✅ **Request ID** automatique (traçabilité)
- ✅ **Logging** cohérent
- ✅ **TypeScript** strict (pas de `any`)

## Avant/Après

### ❌ AVANT (api-base.ts - 130 lignes)

```typescript
export async function fetchApi<T>(endpoint: string, options: FetchApiOptions = {}): Promise<T> {
  const token = localStorage.getItem('session_id') || localStorage.getItem('backend_session_token')

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...fetchOptions.headers,
  }

  const doFetch = async (): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    })

    if (!response.ok) {
      // ... error handling
    }

    return response.json()
  }

  // ... retry logic + circuit breaker
}
```

### ✅ APRÈS (api-base.ts - 20 lignes)

```typescript
import { BaseApiClient } from './api/BaseApiClient'

const apiClient = new BaseApiClient({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8069',
  useCircuitBreaker: true,
})

export const fetchApi = <T>(endpoint: string, options?: RequestOptions) =>
  apiClient.get<T>(endpoint, options)

export const isBackendAvailable = () =>
  backendCircuitBreaker.getState() !== 'OPEN'

export const getBackendHealth = () =>
  backendCircuitBreaker.getStats()
```

## Migration backend-rpc.ts

### ❌ AVANT (92 lignes)

```typescript
export async function backendRpc<T>(endpoint: string, params?: Record<string, any>): Promise<BackendRpcResponse<T>> {
  const sessionId = localStorage.getItem('session_id')
  // ... headers setup

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: params || {},
      id: Math.random(),
    }),
  })

  // ... error handling
}
```

### ✅ APRÈS (10 lignes)

```typescript
import { BaseApiClient } from './api/BaseApiClient'

const rpcClient = new BaseApiClient({
  baseUrl: import.meta.env.VITE_API_URL || '',
  credentials: 'omit',
})

export const backendRpc = <T>(endpoint: string, params?: Record<string, unknown>) =>
  rpcClient.rpc<T>(endpoint, params)
```

## Migration api.ts (1832 lignes)

Le fichier `api.ts` est plus complexe car il contient la classe `ApiClient` avec toutes les méthodes métier.

### Stratégie de migration

1. **Faire hériter ApiClient de BaseApiClient**
2. **Supprimer les méthodes dupliquées** (fetch, headers, auth)
3. **Utiliser les méthodes héritées** (get, post, put, delete)

### Exemple

```typescript
import { BaseApiClient } from './api/BaseApiClient'

class ApiClient extends BaseApiClient {
  constructor(baseUrl: string) {
    super({
      baseUrl,
      useCircuitBreaker: true,
      credentials: 'omit',
    })
  }

  // Supprimer ces méthodes (déjà dans BaseApiClient) :
  // ❌ setSessionId()
  // ❌ getSessionId()
  // ❌ fetch()
  // ❌ buildHeaders()

  // Utiliser les méthodes héritées :
  async getProducts(params: ProductsQueryParams) {
    return this.get<APIResponse<{ products: Product[]; total: number }>>(
      '/api/ecommerce/products',
      { params }
    )
  }

  async createProduct(data: ProductCreateData) {
    return this.post<APIResponse<Product>>(
      '/api/ecommerce/products',
      data
    )
  }

  async updateProduct(id: number, data: ProductUpdateData) {
    return this.put<APIResponse<Product>>(
      `/api/ecommerce/products/${id}`,
      data
    )
  }

  async deleteProduct(id: number) {
    return this.delete<APIResponse<void>>(
      `/api/ecommerce/products/${id}`
    )
  }
}
```

## Utilisation dans les hooks

### Avec useApiRequest

```typescript
import { useApiRequest } from '@/hooks/useApiRequest'

// Remplace les fetch directs
const { data, loading, error } = useApiRequest<Product[]>({
  url: '/api/ecommerce/products',
  immediate: true,
  cache: 60000,
})
```

### Avec BaseApiClient directement

```typescript
import { apiClient } from '@/lib/api'

const products = await apiClient.get<Product[]>('/api/ecommerce/products', {
  params: { limit: 20, offset: 0 }
})
```

## Plan de migration progressif

### Phase 1 (Immédiat - 30 min)
- [x] Créer BaseApiClient
- [ ] Migrer api-base.ts (simple, 20 lignes)
- [ ] Migrer backend-rpc.ts (simple, 10 lignes)
- [ ] Tests de non-régression

### Phase 2 (1 jour)
- [ ] Faire hériter ApiClient de BaseApiClient
- [ ] Supprimer méthodes dupliquées dans ApiClient
- [ ] Migrer fetch() vers get/post/put/delete
- [ ] Tests

### Phase 3 (1 jour)
- [ ] Remplacer fetch directs par useApiRequest
- [ ] Migrer 139 occurrences de fetch
- [ ] Tests

## Gains estimés

- **Code** : -600 lignes (-30%)
- **Maintenance** : +70% (logique centralisée)
- **Tests** : +50% (moins de code à tester)
- **Type safety** : 100% (pas de `any`)
- **Bugs** : -50% (error handling unifié)
