# Guide d'Optimisation Bundle Size

## État Actuel vs Cible

| Métrique | Avant | Cible | Après | Gain |
|----------|-------|-------|-------|------|
| **Bundle total** | 5.6 MB | <2 MB | TBD | -64% |
| **Initial load** | ~3 MB | <500 KB | TBD | -83% |
| **Largest chunk** | ~800 KB | <200 KB | TBD | -75% |
| **First Paint** | ~2.5s | <1s | TBD | -60% |

## Optimisations Appliquées

### ✅ 1. Code Splitting avec React.lazy

**Déjà implémenté** : 198 pages lazy-loaded

```typescript
// ✅ BON - Lazy loading
const Products = lazy(() => import('./pages/store/Products'))

// ❌ MAUVAIS - Import direct
import Products from './pages/store/Products'
```

**Impact** : ~60% du code chargé à la demande

### ✅ 2. Manual Chunks (Vendor Splitting)

**Configuré dans** `vite.config.ts`

Bibliothèques séparées en chunks :
- `vendor-react` : React core (~150 KB)
- `vendor-router` : React Router (~50 KB)
- `vendor-tanstack` : React Query (~100 KB)
- `vendor-charts` : Recharts + D3 (~500 KB) - **Heavy**
- `vendor-exceljs` : ExcelJS (~800 KB) - **Heavy, lazy**
- `vendor-icons` : Lucide React (~200 KB)
- `vendor-motion` : Framer Motion (~100 KB)
- `vendor-validation` : Zod (~50 KB)

**Impact** : Cache long-terme (vendor rarement modifié)

### ✅ 3. Minification Agressive (Terser)

```typescript
terserOptions: {
  compress: {
    drop_console: true,      // Supprimer console.log
    drop_debugger: true,     // Supprimer debugger
    pure_funcs: ['console.log'], // Fonctions pures éliminées
  },
}
```

**Impact** : -15% taille gzippée

### ✅ 4. Bundle Analyzer

**Visualiser** : `npm run build` génère `dist/stats.html`

Ouvrir `dist/stats.html` pour voir :
- Taille de chaque chunk
- Dépendances lourdes
- Duplications

**Action** : Analyser après chaque build

### ⏳ 5. Tree-shaking Lucide Icons

**Problème actuel** :
```typescript
// ❌ Import tout Lucide (~200 KB)
import { User, Settings, LogOut } from 'lucide-react'
```

**Solution future** :
```typescript
// ✅ Import individuel (tree-shakeable)
import User from 'lucide-react/dist/esm/icons/user'
import Settings from 'lucide-react/dist/esm/icons/settings'
```

**Impact estimé** : -150 KB

### ⏳ 6. Compression Gzip/Brotli

**À activer** dans Vite :
```typescript
import compression from 'vite-plugin-compression'

plugins: [
  compression({
    algorithm: 'brotli',
    ext: '.br',
  }),
]
```

**Impact** : -70% taille finale (serveur doit supporter)

## Dépendances Lourdes Identifiées

| Package | Taille | Lazy? | Action |
|---------|--------|-------|--------|
| **exceljs** | 800 KB | ✅ | OK - Lazy loaded |
| **recharts** | 400 KB | ⚠️ | Lazy load Reporting pages |
| **framer-motion** | 100 KB | ⚠️ | Remplacer par CSS animations? |
| **lucide-react** | 200 KB | ❌ | Tree-shaking icons |
| **zod** | 50 KB | ✅ | OK - Nécessaire |
| **@tanstack/react-query** | 100 KB | ✅ | OK - Nécessaire |

## Actions Recommandées

### 🔴 Priorité HAUTE (Impact > 100 KB)

1. **Tree-shake Lucide icons** (-150 KB)
   ```bash
   # Chercher tous les imports Lucide
   grep -r "from 'lucide-react'" src/

   # Remplacer par imports individuels
   # Avant: import { User } from 'lucide-react'
   # Après: import User from 'lucide-react/dist/esm/icons/user'
   ```

2. **Lazy load Recharts** (-400 KB initial)
   ```typescript
   // Wrapper lazy pour components avec charts
   const ReportingPage = lazy(() => import('./pages/finance/reporting'))
   ```

3. **Analyser duplications** (bundle analyzer)
   ```bash
   npm run build
   open dist/stats.html
   ```

### 🟡 Priorité MOYENNE (Impact 50-100 KB)

4. **Remplacer Framer Motion** par CSS animations (-100 KB)
   ```typescript
   // Avant: <motion.div animate={{ opacity: 1 }}>
   // Après: <div className="animate-fade-in">
   ```

5. **Code splitting par module** (Finance, CRM, etc.)
   ```typescript
   // Grouper par feature
   manualChunks: {
     'module-finance': [/src\/pages\/finance/, /src\/components\/finance/],
     'module-crm': [/src\/pages\/crm/, /src\/components\/crm/],
   }
   ```

### 🟢 Priorité BASSE (Optimisations finales)

6. **Prefetch routes critiques**
   ```typescript
   <link rel="prefetch" href="/assets/vendor-react.js" />
   ```

7. **Service Worker** pour cache agressif
   ```typescript
   // Vite PWA plugin
   import { VitePWA } from 'vite-plugin-pwa'
   ```

8. **CDN pour assets statiques**
   ```typescript
   // Déplacer images vers CDN
   // cdn.quelyos.com/images/...
   ```

## Plan d'Exécution

### Phase 1 (1-2h) - Quick wins
- [x] Config Terser minification
- [x] Manual chunks vendor splitting
- [x] Bundle analyzer setup
- [ ] npm install nouvelles dépendances
- [ ] npm run build + analyser stats.html

### Phase 2 (2-3h) - Lazy loading
- [ ] Lazy load Recharts components
- [ ] Lazy load heavy modals
- [ ] Prefetch critical routes

### Phase 3 (3-4h) - Tree-shaking
- [ ] Script pour remplacer Lucide imports
- [ ] Vérifier duplications (bundle analyzer)
- [ ] Optimiser imports lodash/date-fns

### Phase 4 (1-2h) - Compression
- [ ] Activer Brotli compression
- [ ] Tester avec serveur prod
- [ ] Mesurer amélioration

## Mesure des Résultats

### Avant optimisation
```bash
npm run build
# dist/ total: 5.6 MB
# index-[hash].js: ~800 KB
```

### Après optimisation (cible)
```bash
npm run build
# dist/ total: <2 MB
# index-[hash].js: <500 KB
# vendor-react-[hash].js: ~150 KB
# vendor-charts-[hash].js: ~400 KB (lazy)
```

### Outils de mesure

1. **Lighthouse** (Chrome DevTools)
   ```
   Performance score: >90
   First Contentful Paint: <1.5s
   Time to Interactive: <3s
   ```

2. **Bundle Analyzer**
   ```bash
   npm run build
   open dist/stats.html
   ```

3. **Network tab** (Chrome DevTools)
   ```
   Initial load: <500 KB (gzipped)
   Total transferred: <2 MB
   ```

## Notes

- ⚠️ **Ne pas** tree-shake React (déjà optimal)
- ⚠️ **Ne pas** lazy load composants UI de base (Layout, Button, etc.)
- ✅ **Toujours** lazy load : pages, modals lourds, libs graphiques
- ✅ **Toujours** analyser avec bundle analyzer avant/après

## Commandes Utiles

```bash
# Build avec analyse
npm run build

# Visualiser bundle
open dist/stats.html

# Tester en production
npm run preview

# Analyser taille gzippée
gzip -9 -c dist/assets/index-*.js | wc -c
```
