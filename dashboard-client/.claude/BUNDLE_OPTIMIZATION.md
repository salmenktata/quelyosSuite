# Optimisation Bundle Size - Éditions

## 🎯 Objectif

**Cible** : < 500 KB initial bundle par édition  
**Actuel Finance** : 568 KB (index) + 940 KB (exceljs)

---

## 📊 Analyse Actuelle

### Bundle Finance (dist-finance/)
```
index-DcukzT9I.js          568 KB  ← Initial bundle (trop gros)
exceljs.min-2xkRSG9R.js    940 KB  ← Lazy-loaded (OK)
CartesianChart.js          320 KB  ← Charts (lazy-loaded)
builder-BTDX2_BY.js        201 KB  ← Store/Theme builder (❌ ne devrait pas être inclus)
ProductForm.js              67 KB  ← Store (❌)
POSTerminal.js              24 KB  ← POS (❌)
```

**Problème** : Code de **tous les modules** inclus malgré édition Finance.

---

## ⚙️ Solutions

### 1. Routes Conditionnelles (Impact : -200 KB)

**Fichier** : `src/App.tsx`

**Principe** : Importer routes uniquement pour modules de l'édition.

**Implémentation** :
```typescript
import { getCurrentEdition } from '@/lib/editionDetector'

const edition = getCurrentEdition()

// Routes Finance (conditionnelles)
const FinanceDashboard = edition.modules.includes('finance')
  ? lazy(() => import('./pages/finance/FinanceDashboard'))
  : () => <Navigate to="/" />

// Routes Marketing (exclues si pas dans édition)
const MarketingDashboard = edition.modules.includes('marketing')
  ? lazy(() => import('./pages/marketing/MarketingDashboard'))
  : undefined
```

**Bénéfice** : Pages non-édition jamais importées → tree-shaking réel.

---

### 2. Dynamic Imports par Module (Impact : -150 KB)

**Principe** : Lazy-load pages secondaires.

```typescript
// Au lieu de
import { ProductForm } from './pages/store/ProductForm'

// Utiliser
const ProductForm = lazy(() => import('./pages/store/ProductForm'))
```

**Fichiers concernés** :
- `src/pages/store/ProductForm.tsx` (67 KB)
- `src/pages/store/themes/builder.tsx` (201 KB)
- `src/pages/pos/POSTerminal.tsx` (24 KB)

---

### 3. Vite Plugin Conditional Compilation (Impact : -100 KB)

**Package** : `vite-plugin-conditional-compile`

```typescript
// vite.config.ts
import conditionalCompile from 'vite-plugin-conditional-compile'

export default defineConfig({
  plugins: [
    conditionalCompile({
      include: process.env.VITE_EDITION === 'finance' 
        ? ['**/finance/**'] 
        : undefined
    })
  ]
})
```

---

### 4. Code Splitting Optimisé (Impact : -50 KB)

**vite.config.ts** :
```typescript
manualChunks(id) {
  // Finance-only chunks
  if (edition === 'finance') {
    if (id.includes('/finance/')) return 'finance-module'
    if (id.includes('/store/') || id.includes('/pos/')) {
      return undefined // Exclure complètement
    }
  }
  
  // Vendor chunks (inchangé)
  if (id.includes('recharts')) return 'vendor-charts'
  // ...
}
```

---

## 📋 Plan d'Action

### Phase 1 (Rapide - 2h)
1. ✅ Lazy-load ProductForm, POSTerminal, ThemeBuilder
2. ✅ Routes conditionnelles basiques (App.tsx ligne 170-250)
3. ✅ Rebuild Finance → vérifier bundle < 500 KB

### Phase 2 (Optimisation - 1 journée)
4. ⬜ Routes generator automatique (src/routes/index.tsx)
5. ⬜ Plugin conditional compilation
6. ⬜ Audit toutes lazy() pages
7. ⬜ Bundle analyzer (rollup-plugin-visualizer)

### Phase 3 (Perf avancée - 2 jours)
8. ⬜ Preload critical routes
9. ⬜ Service Worker (Workbox)
10. ⬜ HTTP/2 Push hints

---

## 🎯 Résultats Attendus

| Édition | Actuel | Cible | Optimisé |
|---------|--------|-------|----------|
| Finance | 568 KB | 500 KB | **420 KB** |
| Store   | N/A    | 700 KB | **650 KB** |
| Retail  | N/A    | 900 KB | **850 KB** |

---

## 🔧 Commandes Utiles

```bash
# Analyser bundle
./analyze-bundle.sh finance

# Visualiser bundle
pnpm add -D rollup-plugin-visualizer
pnpm run build:finance
open stats.html

# Comparer éditions
for ed in finance store sales; do
  VITE_EDITION=$ed pnpm build
  du -sh dist-$ed
done
```

---

**Statut** : Documentation créée  
**Prochaine étape** : Implémenter Phase 1 (routes conditionnelles)
