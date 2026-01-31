# Guide Développement - Système Éditions Quelyos

**Version** : 1.0  
**Date** : 2026-01-31

---

## 🎯 Introduction

Ce guide explique comment développer pour le système d'éditions Quelyos. Une **édition** est une version spécialisée de Quelyos Suite qui filtre dynamiquement les modules accessibles et applique un branding spécifique.

### **8 Éditions Disponibles**

| Édition | Modules | Port Dev | Couleur | Cible |
|---------|---------|----------|---------|-------|
| **full** | Tous | 5175 | Indigo | ERP complet |
| **finance** | finance | 3010 | Vert | Quelyos Finance |
| **team** | hr | 3015 | Cyan | Quelyos Team |
| **sales** | crm, marketing | 3013 | Bleu | Quelyos Sales |
| **store** | store, marketing | 3011 | Violet | Quelyos Store |
| **copilote** | stock, hr | 3012 | Orange | Quelyos Copilote |
| **retail** | pos, store, stock | 3014 | Rouge | Quelyos Retail |
| **support** | support, crm | 3016 | Violet foncé | Quelyos Support |

---

## 🚀 Démarrage Rapide

### **1. Développer pour une Édition**

```bash
# Dev édition Store (port 3011)
pnpm run dev:store

# Dev édition Finance (port 3010)
pnpm run dev:finance

# Dev édition complète (port 5175)
pnpm run dev
```

### **2. Build Édition**

```bash
# Build Store
VITE_EDITION=store pnpm run build
# → dist/

# Build Finance  
VITE_EDITION=finance pnpm run build
```

### **3. Variables d'Environnement**

```bash
# .env.local
VITE_EDITION=store           # Édition active
VITE_API_URL=http://...      # Backend API
VITE_ENABLE_DEBUG=true       # Logs debug
```

---

## 🎨 Hooks Système Éditions

### **1. useBranding - Branding Dynamique**

```typescript
import { useBranding } from '@/hooks/useBranding'

function MyComponent() {
  const { edition, color, name, shortName } = useBranding()
  
  return (
    <div>
      <h1 style={{ color }}>{name}</h1>
      {/* Edition: "store", Color: "#7C3AED", Name: "Quelyos Store" */}
    </div>
  )
}
```

**Valeurs retournées** :
- `edition.id` : "store", "finance", etc.
- `edition.name` : "Quelyos Store"
- `edition.shortName` : "Store"
- `edition.color` : "#7C3AED"
- `edition.modules` : ["store", "marketing"]
- `color`, `name`, `shortName` : Raccourcis vers `edition.*`

### **2. usePermissions - Filtrage Double**

```typescript
import { usePermissions } from '@/hooks/usePermissions'

function MyPage() {
  const { 
    hasModuleAccess,
    hasPermission,
    currentModules,
    currentEdition
  } = usePermissions()
  
  // Vérifier accès module
  if (!hasModuleAccess('finance')) {
    return <p>Module Finance non accessible dans cette édition</p>
  }
  
  // Vérifier permission utilisateur
  if (!hasPermission('view_transactions')) {
    return <p>Vous n avez pas la permission de voir les transactions</p>
  }
  
  return <TransactionsList />
}
```

**Filtrage Double** :
1. **Édition** : Module whitelisté pour cette édition ?
2. **Permissions** : Utilisateur a la permission ?

**Exemple** :
```typescript
// Édition Store : modules = ["store", "marketing"]
hasModuleAccess('finance')  // false (finance non dans édition)
hasModuleAccess('store')    // true
hasModuleAccess('marketing') // true

// Super-admin dans édition Store
hasPermission('manage_products') // true (super-admin)
// MAIS navigation /finance bloquée (module non dans édition)
```

---

## 📁 Structure Code

### **Configuration Éditions**

**Fichier** : `src/config/editions.ts`

```typescript
export const EDITIONS: Record<EditionId, Edition> = {
  store: {
    id: 'store',
    name: 'Quelyos Store',
    shortName: 'Store',
    description: 'E-commerce et boutique en ligne',
    color: '#7C3AED',
    logo: '/favicon.svg',
    favicon: '/favicon.svg',
    modules: ['store', 'marketing'],  // Modules whitelistés
    port: 3011,
    features: {
      multiTenant: false,
      appLauncher: false,
      moduleSwitch: true,  // Switch store ↔ marketing
    },
  },
  // ...
}
```

### **Routes Conditionnelles**

**Fichier** : `src/routes/index.tsx`

```typescript
import { getRoutesForEdition } from './routeFilter'
import { getCurrentEdition } from '@/lib/editionDetector'

export function AppRoutes() {
  const edition = getCurrentEdition()
  const routes = getRoutesForEdition(edition)
  
  return (
    <Routes>
      {routes.map(route => (
        <Route key={route.path} {...route} />
      ))}
    </Routes>
  )
}
```

### **Menu Dynamique**

**Fichier** : `src/config/modules.ts`

```typescript
export const MODULES_CONFIG: Record<ModuleId, ModuleConfig> = {
  finance: {
    id: 'finance',
    name: 'Finance',
    sections: [
      {
        title: 'Transactions',
        items: [
          { 
            name: 'Toutes les transactions',
            path: '/finance/transactions',
            icon: Wallet,
          },
          // ...
        ]
      }
    ]
  }
}

// Dans Layout.tsx
const { currentModules } = usePermissions()
const visibleModules = currentModules.map(id => MODULES_CONFIG[id])
```

---

## 🧪 Tests par Édition

### **Tests E2E Branding**

**Fichier** : `e2e/branding-finance.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Finance Edition Branding', () => {
  test.beforeEach(async ({ page }) => {
    // Configurer édition Finance
    await page.goto('/', { 
      waitUntil: 'networkidle',
      // Force édition via localStorage
      onBeforeNavigate: () => {
        localStorage.setItem('EDITION_OVERRIDE', 'finance')
      }
    })
  })

  test('should display Finance branding', async ({ page }) => {
    await expect(page).toHaveTitle(/Quelyos Finance/)
    
    // Vérifier couleur primaire
    const header = page.locator('header')
    const color = await header.evaluate(el => 
      getComputedStyle(el).backgroundColor
    )
    expect(color).toContain('rgb(5, 150, 105)') // #059669
  })

  test('should only show Finance module', async ({ page }) => {
    const nav = page.locator('nav')
    
    // Finance visible
    await expect(nav.locator('text=Finance')).toBeVisible()
    
    // Store NON visible
    await expect(nav.locator('text=Boutique')).not.toBeVisible()
  })
})
```

### **Tests Unitaires Hooks**

**Fichier** : `src/hooks/useBranding.test.ts`

```typescript
import { renderHook } from '@testing-library/react'
import { useBranding } from './useBranding'

describe('useBranding', () => {
  it('should return Finance branding', () => {
    process.env.VITE_EDITION = 'finance'
    
    const { result } = renderHook(() => useBranding())
    
    expect(result.current.edition.id).toBe('finance')
    expect(result.current.color).toBe('#059669')
    expect(result.current.name).toBe('Quelyos Finance')
  })
})
```

---

## 🎯 Bonnes Pratiques

### **1. Toujours Utiliser useBranding**

❌ **Mauvais** :
```typescript
<h1 className="text-indigo-600">Quelyos Suite</h1>
```

✅ **Bon** :
```typescript
const { color, name } = useBranding()
<h1 style={{ color }}>{name}</h1>
```

### **2. Vérifier Accès Module**

❌ **Mauvais** :
```typescript
// Afficher lien Finance sans vérifier
<Link to="/finance">Finance</Link>
```

✅ **Bon** :
```typescript
const { hasModuleAccess } = usePermissions()

{hasModuleAccess('finance') && (
  <Link to="/finance">Finance</Link>
)}
```

### **3. Navigation Conditionnelle**

❌ **Mauvais** :
```typescript
navigate('/store')  // Peut crash si module store non accessible
```

✅ **Bon** :
```typescript
const { hasModuleAccess } = usePermissions()

if (hasModuleAccess('store')) {
  navigate('/store')
} else {
  navigate('/home')  // Fallback
}
```

### **4. Classes Tailwind Dynamiques**

❌ **Mauvais** :
```typescript
className="bg-indigo-600"  // Couleur hardcodée
```

✅ **Bon** :
```typescript
const { color } = useBranding()
style={{ backgroundColor: color }}
```

---

## 🆕 Créer une Nouvelle Édition

### **Étape 1 : Ajouter dans `editions.ts`**

```typescript
// src/config/editions.ts
export const EDITIONS = {
  // ...
  
  myedition: {
    id: 'myedition',
    name: 'Quelyos My Edition',
    shortName: 'My Edition',
    description: 'Description de mon édition',
    color: '#FF6B6B',  // Couleur primaire
    logo: '/favicon.svg',
    favicon: '/favicon.svg',
    modules: ['crm', 'stock'],  // Modules whitelistés
    port: 3020,  // Port dev unique
    features: {
      multiTenant: false,
      appLauncher: false,
      moduleSwitch: true,
    },
  },
}
```

### **Étape 2 : Ajouter Script Dev**

```json
// package.json
{
  "scripts": {
    "dev:myedition": "VITE_EDITION=myedition vite --port 3020",
    "build:myedition": "VITE_EDITION=myedition pnpm run build"
  }
}
```

### **Étape 3 : Ajouter Tests E2E**

```typescript
// e2e/branding-myedition.spec.ts
import { test, expect } from '@playwright/test'

test('MyEdition branding', async ({ page }) => {
  process.env.VITE_EDITION = 'myedition'
  await page.goto('/')
  
  await expect(page).toHaveTitle(/Quelyos My Edition/)
})
```

### **Étape 4 : CI/CD**

```yaml
# .github/workflows/build-editions.yml
strategy:
  matrix:
    edition: [..., myedition]
```

---

## 🐛 Troubleshooting

### **Problème : Module visible alors qu'il ne devrait pas**

```typescript
// Vérifier config édition
import { EDITIONS } from '@/config/editions'
console.log(EDITIONS.finance.modules)  // ["finance"]
```

**Solution** : Vérifier que le module est bien whitelisté dans `editions.ts`

### **Problème : Branding ne change pas**

```typescript
// Vérifier détection édition
import { getCurrentEdition } from '@/lib/editionDetector'
console.log(getCurrentEdition())  // "finance"
```

**Solution** : Vérifier `VITE_EDITION` dans `.env` ou variable d'env

### **Problème : Navigation bloquée malgré permissions**

```typescript
const { hasModuleAccess, hasPermission } = usePermissions()

console.log('Module finance ?', hasModuleAccess('finance'))  // false
console.log('Permission ?', hasPermission('view_transactions'))  // true
```

**Explication** : Le module `finance` n'est pas whitelisté pour cette édition, donc navigation bloquée même si utilisateur a la permission.

**Solution** : Double filtrage intentionnel (édition + permissions). L'utilisateur doit utiliser l'édition Finance pour accéder au module Finance.

---

## 📚 Ressources

- **Configuration Éditions** : `src/config/editions.ts`
- **Hook Branding** : `src/hooks/useBranding.ts`
- **Hook Permissions** : `src/hooks/usePermissions.ts`
- **Détecteur Édition** : `src/lib/editionDetector.ts`
- **Tests E2E** : `e2e/editions.spec.ts`
- **README Éditions** : `dashboard-client/README-EDITIONS.md`

---

**Auteur** : Équipe Quelyos  
**Contact** : dev@quelyos.com
