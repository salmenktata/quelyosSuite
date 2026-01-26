# ⚡ Rapport de Performance - 26 janvier 2026

## 📊 Résumé Exécutif

| Application | Performance | LCP | FCP | CLS | TTI | Bundle | Status |
|-------------|-------------|-----|-----|-----|-----|--------|--------|
| **Site Vitrine** | 53 🔴 | 13.55s 🔴 | 0.93s ✅ | 0.000 ✅ | 13.55s 🔴 | 5.9 MB 🔴 | 🔴 **CRITIQUE** |
| **E-commerce** | 62 🔴 | 9.02s 🔴 | 4.83s 🔴 | 0.000 ✅ | 9.02s 🔴 | 308 MB 🔴 | 🔴 **CRITIQUE** |
| **Backoffice** | - | - | - | - | - | - | ⚠️ Non démarré |

**🚨 STATUT GLOBAL : CRITIQUE**

**Issues détectées :**
- **P0 (CRITIQUE)** : 5 issues
- **P1 (IMPORTANT)** : 3 issues

---

## 🌐 Site Vitrine (vitrine-quelyos:3000)

### Lighthouse Scores

| Catégorie | Score | Status |
|-----------|-------|--------|
| Performance | 53/100 | 🔴 **POOR** |
| Accessibility | 98/100 | ✅ Good |
| Best Practices | 100/100 | ✅ Good |
| SEO | 100/100 | ✅ Good |

**Objectif Performance : ≥ 90/100** → **Écart : -37 points**

### Web Vitals

| Métrique | Valeur | Objectif | Status |
|----------|--------|----------|--------|
| **LCP** (Largest Contentful Paint) | **13.55s** | < 2.5s | 🔴 **CRITIQUE** |
| **FCP** (First Contentful Paint) | 0.93s | < 1.8s | ✅ Good |
| **CLS** (Cumulative Layout Shift) | 0.000 | < 0.1 | ✅ Good |
| **TTI** (Time to Interactive) | **13.55s** | < 3.8s | 🔴 **CRITIQUE** |
| **Speed Index** | 1.31s | < 3.4s | ✅ Good |
| **TBT** (Total Blocking Time) | **967ms** | < 300ms | 🔴 **POOR** |

### Bundle Analysis

**Taille totale `.next/`** : **40 MB**

**Chunks principaux** :
- `main-app.js` : **5.9 MB** 🔴 (objectif < 500 KB)
- `app-pages-internals.js` : 152 KB ✅
- `polyfills.js` : 112 KB ✅
- `webpack.js` : 56 KB ✅

**Dépendances principales** :
- `framer-motion` : 11.18.2
- `lucide-react` : 0.563.0
- `next` : 14.2.18
- `@quelyos/ui` : workspace

### Issues P0 - CRITIQUE

#### 1. LCP catastrophique (13.55s)

**Métrique** : LCP = 13.55s (objectif < 2.5s, **541% au-dessus**)

**Impact** :
- Utilisateur voit page vide pendant 13.55s
- **Taux de rebond estimé : > 80%** (abandon avant chargement)
- Expérience utilisateur désastreuse

**Causes probables** :
- Bundle JS gigantesque (5.9 MB) bloque affichage
- Pas de Server-Side Rendering effectif (SSR Next.js désactivé ?)
- Images lourdes non optimisées ou pas de lazy loading
- Fonts bloquantes non optimisées

**Solutions P0** :

1. **Réduire bundle main-app.js (5.9 MB → < 500 KB)** :
```typescript
// vite.config.ts ou next.config.js
// Activer code splitting
experimental: {
  optimizePackageImports: ['framer-motion', 'lucide-react']
}

// Lazy load framer-motion
const MotionDiv = dynamic(() =>
  import('framer-motion').then(mod => ({ default: mod.motion.div })),
  { ssr: false }
);
```

2. **Vérifier SSR Next.js activé** :
```typescript
// app/layout.tsx - vérifier pas de 'use client' au niveau root
// app/page.tsx - supprimer 'use client' si présent
```

3. **Optimiser images hero** :
```tsx
<Image
  src="/hero-banner.jpg"
  width={1920}
  height={800}
  priority  // Précharger
  quality={85}
  placeholder="blur"
/>
```

**Gain estimé** : 13.55s → **< 2.5s** ✅ (-11s)

---

#### 2. TTI catastrophique (13.55s)

**Métrique** : TTI = 13.55s (objectif < 3.8s, **356% au-dessus**)

**Impact** :
- Page interactive après 13.55s (délai inacceptable)
- Clics utilisateur ignorés pendant 13s
- Boutons, liens, formulaires non fonctionnels

**Causes** :
- Bundle JS 5.9 MB prend 10+ secondes à parser/exécuter
- TBT = 967ms (thread principal bloqué)

**Solution** : Même fix que P0-1 (réduire bundle)

**Gain estimé** : 13.55s → **< 3.5s** ✅

---

#### 3. Bundle main-app.js gigantesque (5.9 MB)

**Métrique** : 5.9 MB (objectif < 500 KB, **1180% au-dessus**)

**Impact** :
- Téléchargement 5.9 MB sur 3G : ~45 secondes
- Parsing JS : ~3 secondes
- Total : **~50s avant interactivité** sur mobile 3G

**Cause racine** : Nécessite analyse détaillée avec bundle analyzer

**Action immédiate** :
```bash
cd vitrine-quelyos
ANALYZE=true npm run build
# Ouvrir rapport HTML généré
```

**Culprits probables** :
- Tout `@quelyos/ui` importé au lieu de composants sélectifs
- `framer-motion` complet chargé immédiatement
- `lucide-react` sans tree-shaking
- Code mort (unused exports)

**Solution** :
```typescript
// ❌ Import complet
import * as UI from '@quelyos/ui';

// ✅ Import sélectif
import { Button, Card } from '@quelyos/ui';

// ❌ Framer Motion partout
import { motion } from 'framer-motion';

// ✅ Lazy load animations
const MotionComponents = dynamic(() => import('@/components/Animated'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});
```

**Gain estimé** : 5.9 MB → **< 500 KB** ✅ (-5.4 MB = -91%)

---

### Issues P1 - IMPORTANT

#### 4. TBT élevé (967ms)

**Métrique** : TBT = 967ms (objectif < 300ms)

**Impact** : Thread principal bloqué ~1s (page non responsive)

**Solution** : Réduire bundle + code splitting résoudra automatiquement

---

### Opportunités Lighthouse

**Détectées automatiquement** :
- Reduce unused JavaScript : **-0.90s**

---

## 🛒 E-commerce (vitrine-client:3001)

### Lighthouse Scores

| Catégorie | Score | Status |
|-----------|-------|--------|
| Performance | 62/100 | 🔴 **POOR** |
| Accessibility | 92/100 | ✅ Good |
| Best Practices | 100/100 | ✅ Good |
| SEO | 100/100 | ✅ Good |

**Objectif Performance : ≥ 90/100** → **Écart : -28 points**

### Web Vitals

| Métrique | Valeur | Objectif | Status |
|----------|--------|----------|--------|
| **LCP** (Largest Contentful Paint) | **9.02s** | < 2.5s | 🔴 **CRITIQUE** |
| **FCP** (First Contentful Paint) | **4.83s** | < 1.8s | 🔴 **POOR** |
| **CLS** (Cumulative Layout Shift) | 0.000 | < 0.1 | ✅ Good |
| **TTI** (Time to Interactive) | **9.02s** | < 3.8s | 🔴 **CRITIQUE** |
| **Speed Index** | 5.29s | < 3.4s | 🔴 **POOR** |
| **TBT** (Total Blocking Time) | 45ms | < 300ms | ✅ Good |

### Bundle Analysis

**Taille totale `.next/`** : **308 MB** 🔴 (anormal pour Next.js)

**Note** : Taille anormale suggère mode dev actif ou cache volumineux

**Chunks lourds identifiés** (mode dev) :
- `vitrine-client_src_debc0347._.js` : 1.0 MB
- `react-dom` compiled : 1.0 MB
- `framer-motion` : 820 KB
- `motion-dom` : 948 KB

**Dépendances** :
- `next` : 16.1.4
- `react` : 19.2.3 (dernière version)
- `framer-motion` : 12.29.0
- `@tanstack/react-query` : 5.90.20
- `zustand` : 5.0.10

### Issues P0 - CRITIQUE

#### 5. LCP très lent (9.02s)

**Métrique** : LCP = 9.02s (objectif < 2.5s, **361% au-dessus**)

**Impact** :
- Catalogue produits prend 9s à s'afficher
- **Perte estimée clients : 60-70%** (abandon)

**Causes probables** :
- Fetch API produits bloquant (appel synchrone depuis Odoo backend)
- Images produits lourdes non optimisées
- Pas de cache API côté client

**Solutions P0** :

1. **Server-Side Rendering catalogue** :
```typescript
// app/products/page.tsx
export default async function ProductsPage() {
  // Fetch côté serveur (SSR)
  const products = await fetch('http://localhost:8069/api/products', {
    cache: 'no-store' // ou 'force-cache' avec revalidate
  }).then(r => r.json());

  return <ProductGrid products={products} />;
}
```

2. **Optimiser images produits** :
```tsx
<Image
  src={product.image_url}
  width={300}
  height={300}
  loading="lazy"
  quality={85}
  placeholder="blur"
/>
```

3. **Cache API avec React Query** :
```typescript
const { data } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
  staleTime: 5 * 60 * 1000, // Cache 5min
  cacheTime: 10 * 60 * 1000
});
```

**Gain estimé** : 9.02s → **< 2.5s** ✅ (-6.5s)

---

#### 6. FCP lent (4.83s)

**Métrique** : FCP = 4.83s (objectif < 1.8s, **268% au-dessus**)

**Impact** : Utilisateur voit page blanche pendant 4.83s

**Cause** : Bundle lourd + pas de skeleton/loading

**Solution** :
```typescript
// app/products/loading.tsx
export default function Loading() {
  return <SkeletonGrid />;
}
```

**Gain estimé** : Perception immédiate de chargement

---

### Issues P1 - IMPORTANT

#### 7. Speed Index élevé (5.29s)

**Métrique** : Speed Index = 5.29s (objectif < 3.4s)

**Impact** : Contenu s'affiche progressivement sur 5s (lent)

**Solution** : SSR + optimisation images → résout automatiquement

---

#### 8. Build size anormal (308 MB)

**Taille** : 308 MB pour `.next/` (devrait être 20-50 MB en prod)

**Diagnostic** :
- Vérifier si c'est un build dev (oui, chunks `dev/` visibles)
- Build prod devrait être lancé avant analyse

**Action** :
```bash
cd vitrine-client
rm -rf .next
NODE_ENV=production npm run build
du -sh .next/  # Devrait être < 50 MB
```

---

### Opportunités Lighthouse

**Détectées automatiquement** :
- Reduce unused JavaScript : **-1.70s**
- Minify JavaScript : **-0.91s**

**Total gain potentiel** : **-2.61s**

---

## 💼 Backoffice (dashboard-client:5175)

**Status** : ⚠️ Service non démarré (port 5175)

**Action** : Démarrer backoffice pour analyse complète
```bash
cd dashboard-client
npm run dev
```

**Analyse reportée.**

---

## 🔌 API Backend (Odoo:8069)

### Analyse Code

**Search queries analysées** : 20 endpoints

**Bonne pratique détectée** : Toutes les recherches utilisent `limit=` ✅

**Exemples** :
```python
# ✅ Limitée
products = Product.search([('name', 'ilike', query)], limit=3)

# ✅ Limitée avec fallback
categories = Category.search([('name', 'ilike', query)], limit=2)
```

**Aucune violation P0 (N+1 queries) détectée** dans controllers/search.py ✅

### Profiling nécessaire

**Action recommandée** : Activer logging temps réponse

```python
# odoo-backend/addons/quelyos_api/controllers/main.py
import time
import logging

_logger = logging.getLogger(__name__)

def log_performance(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        duration = time.time() - start
        if duration > 0.5:
            _logger.warning(f"Slow endpoint: {func.__name__} took {duration:.2f}s")
        return result
    return wrapper
```

**Sans profiling actif, impossible de déterminer endpoints lents.**

---

## 📸 Optimisation Images

### Site Vitrine

**Statistiques** :
- Images JPEG/PNG : 0
- Images WebP : 0
- Total images : 0

**Conclusion** : Aucune image statique dans `public/` (images dynamiques via Odoo ou externes)

### E-commerce

**Statistiques** :
- Images JPEG/PNG : 0
- Images SVG : 11 (icônes paiement, placeholders)
- Total images : 11

**Bonne pratique** : Utilisation SVG pour icônes (vectoriel, optimal) ✅

**Images produits** : Servies par Odoo backend (`/web/image/product.template/{id}/image_1920`)

**Recommandation P1** : Vérifier compression images Odoo
```bash
# Dans Odoo, vérifier paramètres images :
# Settings > Technical > Parameters > System Parameters
# image.quality = 85 (recommandé)
# image.format = webp (recommandé)
```

---

## 📊 Métriques Globales

### Performance par Application

| Application | Score | LCP | TTI | Bundle | Grade | Priorité |
|-------------|-------|-----|-----|--------|-------|----------|
| **Site Vitrine** | 53 | 13.55s | 13.55s | 5.9 MB | 🔴 **F** | **P0 URGENT** |
| **E-commerce** | 62 | 9.02s | 9.02s | 308 MB* | 🔴 **D** | **P0 URGENT** |
| **Backoffice** | - | - | - | - | - | Non analysé |
| **API Backend** | - | - | - | - | ✅ **B** | Monitoring requis |

*Build dev, attendre build prod

### Issues par Priorité

| Priorité | Count | Applications | Gain Potentiel |
|----------|-------|--------------|----------------|
| **P0 (CRITIQUE)** | 5 | Vitrine (3), E-commerce (2) | **-17s LCP, -5.4 MB bundle** |
| **P1 (IMPORTANT)** | 3 | Vitrine (1), E-commerce (2) | **-2.6s, optimisation images** |

---

## 🎯 Plan d'Action Priorisé

### 🚨 IMMÉDIAT (Aujourd'hui - URGENT)

#### 1. P0-3 : Analyser bundle vitrine (5.9 MB)

**Impact** : Débloque résolution LCP/TTI

**Action** :
```bash
cd vitrine-quelyos
ANALYZE=true npm run build
# Ouvrir rapport, identifier packages > 500 KB
```

**Effort** : 30 min (analyse)

---

#### 2. P0-1 : Réduire bundle vitrine (5.9 MB → < 500 KB)

**Impact** : **-11s LCP, -10s TTI**

**Actions** :
- Lazy load `framer-motion`
- Import sélectif `@quelyos/ui`, `lucide-react`
- Activer code splitting Next.js
- Vérifier SSR activé

**Effort** : 3-4h

---

#### 3. P0-5 : Optimiser LCP e-commerce (9.02s → < 2.5s)

**Impact** : **-6.5s LCP**

**Actions** :
- SSR catalogue produits
- Cache React Query (5min)
- Optimiser images produits (compression)
- Skeleton loading

**Effort** : 3-4h

---

### 📅 Court Terme (Cette Semaine)

#### 4. P0-6 : Fix FCP e-commerce (4.83s → < 1.8s)

**Impact** : **-3s FCP**

**Actions** :
- Ajouter `loading.tsx` avec skeleton
- Précharger fonts avec `next/font`

**Effort** : 1-2h

---

#### 5. P1-8 : Build production e-commerce

**Impact** : Mesures réelles (308 MB → ~30 MB attendu)

**Action** :
```bash
cd vitrine-client
rm -rf .next
NODE_ENV=production npm run build
du -sh .next/
npx lighthouse http://localhost:3001 --output=json
```

**Effort** : 30 min

---

#### 6. Profiling API Backend

**Impact** : Identifier endpoints > 1s

**Actions** :
- Ajouter decorator `@log_performance`
- Analyser logs sur 24h
- Profiler top 3 endpoints lents

**Effort** : 2h

---

### 📦 Backlog (2 Semaines)

7. Analyser backoffice (dashboard-client:5175)
8. Optimiser images Odoo (format WebP, compression)
9. Ajouter monitoring performance (Sentry, Lighthouse CI)
10. Optimiser TBT vitrine (967ms → < 300ms)

---

## 📈 Objectifs à Atteindre

### Vitrine (vitrine-quelyos:3000)

| Métrique | Actuel | Objectif | Écart | Plan |
|----------|--------|----------|-------|------|
| Performance | 53 | 90+ | **-37** | P0-1, P0-2 |
| LCP | 13.55s | < 2.5s | **-11.05s** | P0-1 |
| TTI | 13.55s | < 3.8s | **-9.75s** | P0-1 |
| Bundle | 5.9 MB | < 500 KB | **-5.4 MB** | P0-3 |

**Délai estimé : 2-3 jours (effort 6-8h)**

### E-commerce (vitrine-client:3001)

| Métrique | Actuel | Objectif | Écart | Plan |
|----------|--------|----------|-------|------|
| Performance | 62 | 90+ | **-28** | P0-5, P0-6 |
| LCP | 9.02s | < 2.5s | **-6.52s** | P0-5 |
| FCP | 4.83s | < 1.8s | **-3.03s** | P0-6 |
| TTI | 9.02s | < 3.8s | **-5.22s** | P0-5 |

**Délai estimé : 2-3 jours (effort 5-7h)**

---

## ✅ Validation Standards UX 2026

| Standard | Vitrine | E-commerce | Backoffice | Backend | Status Global |
|----------|---------|------------|------------|---------|---------------|
| **LCP < 2.5s** | 🔴 13.55s | 🔴 9.02s | - | - | 🔴 **ÉCHEC** |
| **FCP < 1.8s** | ✅ 0.93s | 🔴 4.83s | - | - | 🟡 Partiel |
| **CLS < 0.1** | ✅ 0.000 | ✅ 0.000 | - | - | ✅ **OK** |
| **TTI < 3.8s** | 🔴 13.55s | 🔴 9.02s | - | - | 🔴 **ÉCHEC** |
| **TBT < 300ms** | 🔴 967ms | ✅ 45ms | - | - | 🟡 Partiel |
| **Performance ≥ 90** | 🔴 53 | 🔴 62 | - | - | 🔴 **ÉCHEC** |
| **Bundle < 500 KB** | 🔴 5.9 MB | 🔴 308 MB* | - | - | 🔴 **ÉCHEC** |

**🚨 STATUT GLOBAL : CRITIQUE - 1/7 standards validés**

**Conformité UX 2026 : 14%** (seulement CLS conforme)

---

## 🔧 Commandes Utiles

### Re-scanner après fixes

```bash
# Vitrine
cd vitrine-quelyos
npx lighthouse http://localhost:3000 --output=json --output-path=./after-fix.json
node compare-reports.js  # Comparer avant/après

# E-commerce
cd vitrine-client
npx lighthouse http://localhost:3001 --output=json --output-path=./after-fix.json
```

### Bundle analysis

```bash
# Vitrine
cd vitrine-quelyos
ANALYZE=true npm run build

# E-commerce (ajouter script analyze)
cd vitrine-client
npm install --save-dev @next/bundle-analyzer
# Ajouter dans next.config.js :
# const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: process.env.ANALYZE === 'true' })
ANALYZE=true npm run build
```

### Monitoring continu

```bash
# Lighthouse CI (déjà configuré vitrine)
cd vitrine-quelyos
npm run lighthouse:ci

# À configurer pour e-commerce
cd vitrine-client
npm install --save-dev @lhci/cli
npm run lighthouse:ci
```

---

## 📌 Recommandations Générales

### Architecture

1. **SSR systématique** pour pages publiques (vitrine, catalogue)
2. **Code splitting** agressif (lazy load animations, modals, etc.)
3. **Cache API** avec React Query (staleTime: 5min)
4. **CDN** pour assets statiques (images, fonts, CSS)

### Dépendances

1. Éviter imports complets :
   - `import * as X from 'lib'` → `import { Y } from 'lib'`
2. Lazy load librairies lourdes :
   - Animations (`framer-motion`)
   - Charts/graphiques
   - Éditeurs riches
3. Préférer alternatives légères :
   - `framer-motion` (58 KB) → `react-spring` (28 KB) ou CSS animations
   - `lucide-react` complet → imports sélectifs

### Images

1. **Format WebP** par défaut (gain 30-50%)
2. **Lazy loading** pour images below-the-fold
3. **Responsive images** avec `sizes` prop
4. **CDN images** avec Cloudinary/Imgix (compression auto)

### Monitoring

1. **Lighthouse CI** en pre-push (bloquer si score < 80)
2. **Sentry Performance** en production (mesures réelles)
3. **Google Analytics** Web Vitals (dashboard utilisateurs réels)

---

## 📝 Notes Finales

- **Backoffice non analysé** (service arrêté) - relancer pour audit complet
- **API Backend** : Code propre détecté, profiling requis pour métriques temps réponse
- **Images** : Majoritairement servies par Odoo (vérifier compression backend)
- **Priorité absolue** : Site vitrine (LCP 13.55s inacceptable pour site public)

---

**Rapport généré le** : 26 janvier 2026, 15:45
**Par** : `/perf` - Claude Code
**Lighthouse version** : 13.0.1
**Standards** : UX 2026
