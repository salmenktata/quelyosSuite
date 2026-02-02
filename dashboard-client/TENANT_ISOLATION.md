# 🔐 Isolation Multi-Tenant - Documentation

## Vue d'ensemble

Le dashboard-client implémente une **isolation complète des données par tenant** pour garantir qu'aucun utilisateur ne puisse accéder aux données d'un autre tenant.

Cette isolation se fait à **trois niveaux** :

1. **Backend API** : Header `X-Tenant-Domain` obligatoire + RLS PostgreSQL
2. **Frontend Context** : `TenantContext` React global
3. **localStorage** : Préfixage automatique avec `tenant_<id>:`

---

## 📦 Composants d'Isolation

### 1. TenantContext (React Context)

**Fichier** : `src/contexts/TenantContext.tsx`

**Rôle** : Gère le tenant courant pour toute l'application React.

**API** :
```typescript
import { useTenantContext } from '@/contexts/TenantContext'

function MyComponent() {
  const {
    tenantId,        // ID du tenant courant
    tenantName,      // Nom du tenant
    tenantDomain,    // Domaine du tenant (ex: tenant1.quelyos.local)
    isLoading,       // Chargement en cours
    error,           // Erreur de chargement
    clearTenantData  // Nettoie les données du tenant (logout)
  } = useTenantContext()

  return <div>Tenant: {tenantName}</div>
}
```

**Hooks simplifiés** :
```typescript
import { useCurrentTenantId, useCurrentTenantDomain } from '@/contexts/TenantContext'

const tenantId = useCurrentTenantId()       // Retourne juste l'ID
const domain = useCurrentTenantDomain()      // Retourne juste le domain
```

---

### 2. TenantGuard (Protection Routes)

**Fichier** : `src/components/TenantGuard.tsx`

**Rôle** : Vérifie que le tenant est valide et redirige vers `/login` si :
- Tenant introuvable (404)
- Erreur API (5xx)
- Pas de `tenant_id` après chargement
- Session expirée (401)

**Intégration** :
```typescript
// main.tsx ou App.tsx
<TenantProvider>
  <TenantGuard>
    <App />
  </TenantGuard>
</TenantProvider>
```

**Routes publiques** (pas de vérification tenant) :
- `/login`
- `/forgot-password`
- `/register`
- `/auth-callback`
- `/satisfaction/:token`

---

### 3. tenantStorage (localStorage isolé)

**Fichier** : `src/lib/tenantStorage.ts`

**Rôle** : Wrapper `localStorage` qui préfixe automatiquement toutes les keys avec `tenant_<id>:` pour éviter les fuites cross-tenant.

**API** :
```typescript
import { tenantStorage } from '@/lib/tenantStorage'

// Stockage
tenantStorage.setItem('cart', JSON.stringify(cart))
// Stocké comme : "tenant_123:cart"

// Récupération
const cart = tenantStorage.getItem('cart')

// Suppression
tenantStorage.removeItem('cart')

// Nettoyage complet tenant (garde session_id, user, etc.)
tenantStorage.clear()

// Helpers JSON
tenantStorage.setObject('preferences', { theme: 'dark' })
const prefs = tenantStorage.getObject<Preferences>('preferences')
```

**Hook React** :
```typescript
import { useTenantStorage } from '@/lib/tenantStorage'

function MyComponent() {
  const [cart, setCart, removeCart] = useTenantStorage<Cart>('cart', null)

  return (
    <button onClick={() => setCart({ items: [] })}>
      Reset Cart
    </button>
  )
}
```

**Keys globales (non isolées)** :
- `session_id`
- `backend_session_token`
- `user`
- `tenant_id`
- `access_token`
- `refresh_token`
- `theme`
- `language`

---

## 🔒 Backend API - Headers Automatiques

### BaseApiClient

**Fichier** : `src/lib/api/BaseApiClient.ts`

Injecte **automatiquement** le header `X-Tenant-Domain` dans toutes les requêtes HTTP :

```typescript
headers['X-Tenant-Domain'] = window.location.hostname
```

**Exemple** :
- URL : `http://tenant1.quelyos.local:5175`
- Header : `X-Tenant-Domain: tenant1.quelyos.local`

### ApiClient

**Fichier** : `src/lib/api.ts`

Validation tenant obligatoire (sauf endpoints publics) :

```typescript
const publicEndpoints = ['/login', '/register', '/health']
const isPublicEndpoint = publicEndpoints.some(e => endpoint.includes(e))

if (!isPublicEndpoint && !this.tenantDomain && !this.tenantId) {
  throw new Error('Tenant context required. Please login to access this resource.')
}
```

---

## ✅ Checklist Sécurité Développeur

Lors du développement de nouvelles fonctionnalités :

### ✅ Utiliser tenantStorage au lieu de localStorage

```typescript
// ❌ MAUVAIS - Pas d'isolation tenant
localStorage.setItem('favorites', JSON.stringify(favorites))

// ✅ BON - Isolation tenant automatique
tenantStorage.setObject('favorites', favorites)
```

### ✅ Ne jamais bypasser TenantContext

```typescript
// ❌ MAUVAIS - Hardcoder le tenant_id
const products = await api.getProducts({ tenant_id: 123 })

// ✅ BON - Utiliser le tenant du contexte
const { tenantId } = useTenantContext()
const products = await api.getProducts()  // tenant_id ajouté auto
```

### ✅ Toujours vérifier le tenant dans les composants critiques

```typescript
// ❌ MAUVAIS - Pas de vérification
function AdminPanel() {
  return <div>Admin Tools</div>
}

// ✅ BON - Vérifier le tenant
function AdminPanel() {
  const { tenantId, isLoading } = useTenantContext()

  if (isLoading) return <Loader />
  if (!tenantId) return <Redirect to="/login" />

  return <div>Admin Tools</div>
}
```

### ✅ Nettoyer les données lors du logout

```typescript
// ❌ MAUVAIS - Laisser les données en mémoire
function logout() {
  localStorage.removeItem('session_id')
  navigate('/login')
}

// ✅ BON - Nettoyer les données tenant
function logout() {
  const { clearTenantData } = useTenantContext()
  clearTenantData()  // Nettoie tenantStorage
  localStorage.removeItem('session_id')
  navigate('/login')
}
```

---

## 🧪 Tests d'Isolation

### Tests unitaires recommandés

```typescript
describe('Tenant Isolation', () => {
  it('ne peut pas accéder aux données d\\'un autre tenant', () => {
    // Tenant 1
    localStorage.setItem('tenant_id', '1')
    tenantStorage.setItem('cart', 'tenant1_cart')

    // Tenant 2
    localStorage.setItem('tenant_id', '2')
    const cart = tenantStorage.getItem('cart')

    expect(cart).toBeNull()  // Pas d'accès cross-tenant
  })

  it('préfixe automatiquement les keys', () => {
    localStorage.setItem('tenant_id', '123')
    tenantStorage.setItem('favorites', 'data')

    const raw = localStorage.getItem('tenant_123:favorites')
    expect(raw).toBe('data')
  })

  it('ne préfixe pas les keys globales', () => {
    tenantStorage.setItem('session_id', 'abc')

    const raw = localStorage.getItem('session_id')
    expect(raw).toBe('abc')  // Pas de préfixe
  })
})
```

### Tests E2E recommandés

```typescript
test('isolation multi-tenant end-to-end', async ({ page, context }) => {
  // Ouvrir tenant 1
  const page1 = await context.newPage()
  await page1.goto('http://tenant1.quelyos.local:5175')
  await page1.fill('[name=email]', 'user@tenant1.com')
  await page1.click('button[type=submit]')

  // Ajouter un produit au panier
  await page1.click('text=Ajouter au panier')
  await expect(page1.locator('.cart-count')).toHaveText('1')

  // Ouvrir tenant 2 dans un nouvel onglet
  const page2 = await context.newPage()
  await page2.goto('http://tenant2.quelyos.local:5175')
  await page2.fill('[name=email]', 'user@tenant2.com')
  await page2.click('button[type=submit]')

  // Vérifier que le panier du tenant 2 est vide
  await expect(page2.locator('.cart-count')).toHaveText('0')
})
```

---

## 🚨 Erreurs Courantes

### ❌ Erreur : "Tenant context required"

**Cause** : Appel API protégé sans tenant valide.

**Solution** :
```typescript
// Vérifier que TenantProvider entoure l'app
<TenantProvider>
  <App />
</TenantProvider>

// Ou attendre le chargement du tenant
const { tenantId, isLoading } = useTenantContext()
if (isLoading) return <Loader />
```

### ❌ Erreur : "useTenantContext must be used within a TenantProvider"

**Cause** : Composant hors du `<TenantProvider>`.

**Solution** : Déplacer le composant à l'intérieur du provider.

### ❌ Warning : "No tenant_id found, using unprefixed key (unsafe)"

**Cause** : Appel `tenantStorage` avant que `tenant_id` soit défini dans localStorage.

**Solution** : Attendre le chargement du tenant ou utiliser `localStorage` direct pour les keys globales.

---

## 📊 Monitoring

### Logs de debug

Activer les logs de debug pour voir l'isolation en action :

```typescript
// Dans la console DevTools
localStorage.setItem('debug', 'tenantStorage,TenantContext,TenantGuard')
```

Logs affichés :
```
[tenantStorage] setItem: cart → tenant_123:cart
[TenantContext] Changement de tenant détecté, nettoyage localStorage
[TenantGuard] Tenant valide: { tenantId: 123, tenantDomain: 'tenant1.quelyos.local' }
```

### Métriques à surveiller

- Nombre de tentatives d'accès cross-tenant (doit être 0)
- Nombre de redirections `/login` par TenantGuard (indicateur de problèmes)
- Taille du localStorage par tenant (éviter la saturation 10 MB)

---

## 🔗 Références

- **Backend RLS PostgreSQL** : `odoo-backend/addons/quelyos_api/migrations/enable_rls_tenant_isolation.sql`
- **Backend multitenancy** : `odoo-backend/addons/quelyos_api/lib/multitenancy.py`
- **Backend tenant security** : `odoo-backend/addons/quelyos_api/lib/tenant_security.py`
- **Audit architecture** : Rapport `/architect audit` section "Tenant Isolation"

---

**Dernière mise à jour** : 2026-02-02
**Version** : 1.0.0
**Auteur** : Équipe Quelyos Suite
