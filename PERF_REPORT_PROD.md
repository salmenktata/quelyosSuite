# ⚡ Rapport de Performance PRODUCTION - 26 janvier 2026

## 📊 Résumé Exécutif

| Application | Performance | LCP | FCP | CLS | TTI | Status |
|-------------|-------------|-----|-----|-----|-----|--------|
| **Site Vitrine** | **96** ✅ | 2.72s 🟡 | 0.91s ✅ | 0.000 ✅ | 2.72s ✅ | ✅ **EXCELLENT** |
| **E-commerce** | **73** 🟡 | 4.19s 🔴 | 0.92s ✅ | 0.250 🔴 | 4.20s 🔴 | 🔴 **NEEDS IMPROVEMENT** |
| **Backoffice** | - | - | - | - | - | ⚠️ Non analysé |

**🎉 DÉCOUVERTE MAJEURE** : Les problèmes de performance (LCP 13.55s, bundle 5.9 MB) étaient causés par le **mode dev**. Le build production est excellent !

---

## 🌐 Site Vitrine (vitrine-quelyos:3000)

### DEV vs PRODUCTION

| Métrique | DEV | PRODUCTION | Amélioration |
|----------|-----|------------|--------------|
| **Performance** | 53 🔴 | **96** ✅ | **+43 points** (+81%) |
| **LCP** | 13.55s 🔴 | **2.72s** 🟡 | **-10.83s** (-80%) |
| **FCP** | 0.93s ✅ | **0.91s** ✅ | -0.02s |
| **CLS** | 0.000 ✅ | **0.000** ✅ | Parfait |
| **TTI** | 13.55s 🔴 | **2.72s** ✅ | **-10.83s** (-80%) |
| **Speed Index** | 1.31s ✅ | **0.91s** ✅ | -0.40s (-31%) |
| **TBT** | 967ms 🔴 | **0ms** ✅ | **-967ms** (-100%) |

### Lighthouse Scores Production

| Catégorie | Score | Status |
|-----------|-------|--------|
| Performance | **96/100** | ✅ **Excellent** (objectif 90+) |
| Accessibility | 98/100 | ✅ Excellent |
| Best Practices | 100/100 | ✅ Parfait |
| SEO | 100/100 | ✅ Parfait |

### Bundle Production

**Taille totale `.next/`** : ~40 MB (cache dev inclus)

**Chunks optimisés** :
- `3393-*.js` : 124 KB ✅
- `982f6bf2-*.js` : 172 KB ✅
- **First Load JS partagé** : 87.5 KB ✅

**Configuration optimale détectée** :
- ✅ Code splitting activé
- ✅ Tree-shaking fonctionnel
- ✅ Compression activée
- ✅ Images WebP/AVIF
- ✅ `optimizePackageImports: ['lucide-react']`

### Issues Mineures

#### 1. LCP légèrement au-dessus objectif (2.72s vs 2.5s)

**Écart** : 0.22s (9% au-dessus objectif)

**Status** : 🟡 Acceptable (dans la plage "Needs Improvement" : 2.5-4s)

**Recommandations P2** (optionnelles) :
```tsx
// Précharger fonts critiques
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true
});

// Précharger hero image
<link rel="preload" as="image" href="/hero.webp" />
```

**Gain potentiel** : 2.72s → ~2.3s (-0.42s)

---

## 🛒 E-commerce (vitrine-client:3001)

### DEV vs PRODUCTION

| Métrique | DEV | PRODUCTION | Amélioration | Objectif | Écart |
|----------|-----|------------|--------------|----------|-------|
| **Performance** | 62 🔴 | **73** 🟡 | +11 points | 90+ | 🔴 -17 |
| **LCP** | 9.02s 🔴 | **4.19s** 🔴 | -4.83s (-53%) | < 2.5s | 🔴 +67% |
| **FCP** | 4.83s 🔴 | **0.92s** ✅ | -3.91s (-81%) | < 1.8s | ✅ |
| **CLS** | 0.000 ✅ | **0.250** 🔴 | **Régression** | < 0.1 | 🔴 +150% |
| **TTI** | 9.02s 🔴 | **4.20s** 🔴 | -4.82s (-53%) | < 3.8s | 🔴 +10% |
| **Speed Index** | 5.29s 🔴 | **2.97s** ✅ | -2.32s (-44%) | < 3.4s | ✅ |
| **TBT** | 45ms ✅ | **0ms** ✅ | -45ms | < 300ms | ✅ |

### Lighthouse Scores Production

| Catégorie | Score | Status |
|-----------|-------|--------|
| Performance | **73/100** | 🟡 Needs Improvement |
| Accessibility | 96/100 | ✅ Excellent |
| Best Practices | 96/100 | ✅ Excellent |
| SEO | 100/100 | ✅ Parfait |

### Diagnostics Lighthouse

**Server Response Time** : 10ms ✅ (excellent)

**Main Thread Work** : 1.9s ✅ (raisonnable)

**JS Execution** : 0.8s ✅
- Chunk `3738-*.js` : 589ms (lourd mais acceptable)
- Page principale : 544ms
- Chunk `app/page-*.js` : 452ms

### Issues P0 - CRITIQUE

#### 1. LCP trop lent (4.19s)

**Métrique** : LCP = 4.19s (objectif < 2.5s, **+67% au-dessus**)

**Impact** :
- Catalogue produits prend 4.19s à s'afficher
- Expérience utilisateur médiocre
- Taux de rebond estimé : 40-50%

**Causes probables** :
1. **Fetch API produits côté client** (pas de SSR)
2. Images produits non optimisées ou lazy-loaded
3. Pas de cache API côté client

**Solutions P0** :

**A. Server-Side Rendering catalogue produits**

```typescript
// app/page.tsx (ou app/products/page.tsx)
// ❌ AVANT : Fetch côté client
'use client';
export default function HomePage() {
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then(r => r.json())
  });

  return <ProductGrid products={products} />;
}

// ✅ APRÈS : SSR avec cache
export default async function HomePage() {
  // Fetch côté serveur (SSR)
  const products = await fetch('http://localhost:8069/api/ecommerce/products', {
    next: { revalidate: 300 } // Cache 5min
  }).then(r => r.json());

  return <ProductGrid products={products} />;
}

// Composant client pour interactions
'use client';
function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

**Gain estimé** : 4.19s → **< 2s** (-2.2s = -52%)

---

**B. Optimiser images produits**

```tsx
// components/ProductCard.tsx
import Image from 'next/image';

// ❌ AVANT : Image non optimisée
<img src={product.image_url} alt={product.name} />

// ✅ APRÈS : Image optimisée avec next/image
<div className="relative aspect-square">
  <Image
    src={product.image_url}
    alt={product.name}
    fill
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    className="object-cover"
    loading="lazy"
    quality={85}
  />
</div>
```

**Gain estimé** : -0.5s LCP

---

**C. Skeleton loading avec loading.tsx**

```tsx
// app/loading.tsx
export default function Loading() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="aspect-square bg-gray-200 animate-pulse" />
      ))}
    </div>
  );
}
```

**Gain** : Perception immédiate de chargement (FCP reste bas)

---

#### 2. CLS élevé (0.250)

**Métrique** : CLS = 0.250 (objectif < 0.1, **+150% au-dessus**)

**Impact** :
- Éléments bougent pendant chargement (mauvaise UX)
- Utilisateur peut cliquer sur mauvais produit
- Score Lighthouse pénalisé

**Causes probables** :
1. Images produits sans `width`/`height` définis
2. Skeleton loading avec dimensions différentes du contenu final
3. Fonts FOUT (Flash of Unstyled Text)

**Solutions P0** :

**A. Dimensions fixes pour images**

```tsx
// ❌ AVANT : Pas de dimensions
<div>
  <Image src={product.image} alt={product.name} width={300} height={300} />
</div>

// ✅ APRÈS : Aspect ratio fixe
<div className="relative aspect-square">
  <Image
    src={product.image}
    alt={product.name}
    fill
    className="object-cover"
  />
</div>
```

**Gain estimé** : 0.250 → **< 0.08** (-70%)

---

**B. Skeleton avec même dimensions que contenu**

```tsx
// app/loading.tsx
// ✅ Skeleton avec aspect-square identique au ProductCard
export default function Loading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="space-y-2">
          {/* Même aspect ratio que l'image finale */}
          <div className="relative aspect-square bg-gray-200 animate-pulse rounded-lg" />
          {/* Placeholder pour titre (même hauteur) */}
          <div className="h-6 bg-gray-200 animate-pulse rounded" />
          {/* Placeholder pour prix */}
          <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}
```

**Gain estimé** : -0.1 CLS

---

**C. Optimiser fonts avec next/font**

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Évite FOUT
  preload: true
});

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

**Gain estimé** : -0.02 CLS

---

#### 3. TTI légèrement au-dessus objectif (4.20s vs 3.8s)

**Métrique** : TTI = 4.20s (objectif < 3.8s, **+10% au-dessus**)

**Impact** : Page interactive après 4.20s (délai perceptible)

**Cause** : Fetch API produits retarde hydratation React

**Solution** : SSR résout automatiquement (produits disponibles immédiatement)

**Gain estimé** : 4.20s → **< 3.5s** (-0.7s)

---

### Issues P1 - IMPORTANT

#### 4. Performance score 73 (objectif 90+)

**Écart** : -17 points

**Causes** :
- LCP 4.19s (pénalité lourde)
- CLS 0.250 (pénalité moyenne)
- TTI 4.20s (pénalité légère)

**Solution** : Résoudre P0-1, P0-2, P0-3 → Score attendu **88-92** ✅

---

### Plan d'Action E-commerce (Priorisé)

#### IMMÉDIAT (Aujourd'hui)

1. ✅ **P0-1A : SSR catalogue produits** (3h)
   - Gain : -2.2s LCP, -0.7s TTI
   - Fichier : `app/page.tsx`

2. ✅ **P0-2A : Images avec aspect-square** (1h)
   - Gain : -0.17 CLS
   - Fichiers : `components/ProductCard.tsx`, `components/ProductGrid.tsx`

3. ✅ **P0-2B : Skeleton avec dimensions fixes** (30min)
   - Gain : -0.05 CLS
   - Fichier : `app/loading.tsx`

**Total gain attendu** : Performance 73 → **88+**, LCP 4.19s → **1.9s**, CLS 0.250 → **0.03**

---

#### Court Terme (Cette Semaine)

4. **P0-1B : Optimiser images produits** (2h)
   - Utiliser `next/image` partout
   - Vérifier compression Odoo backend

5. **P0-2C : Fonts optimisées** (30min)
   - `next/font` avec display: swap

6. **P1-5 : Cache API React Query** (1h)
   - Réduire appels API répétés

---

## 📊 Comparaison Globale

### DEV vs PRODUCTION

| Application | Métrique | DEV | PRODUCTION | Amélioration |
|-------------|----------|-----|------------|--------------|
| **Vitrine** | Performance | 53 | **96** | **+81%** |
| **Vitrine** | LCP | 13.55s | **2.72s** | **-80%** |
| **Vitrine** | TTI | 13.55s | **2.72s** | **-80%** |
| **E-commerce** | Performance | 62 | **73** | +18% |
| **E-commerce** | LCP | 9.02s | **4.19s** | -53% |
| **E-commerce** | TTI | 9.02s | **4.20s** | -53% |

### Validation Standards UX 2026

| Standard | Vitrine | E-commerce | Status Global |
|----------|---------|------------|---------------|
| **LCP < 2.5s** | 🟡 2.72s | 🔴 4.19s | 🔴 **1/2 KO** |
| **FCP < 1.8s** | ✅ 0.91s | ✅ 0.92s | ✅ **2/2 OK** |
| **CLS < 0.1** | ✅ 0.000 | 🔴 0.250 | 🔴 **1/2 KO** |
| **TTI < 3.8s** | ✅ 2.72s | 🔴 4.20s | 🔴 **1/2 KO** |
| **TBT < 300ms** | ✅ 0ms | ✅ 0ms | ✅ **2/2 OK** |
| **Performance ≥ 90** | ✅ 96 | 🔴 73 | 🔴 **1/2 KO** |

**STATUT GLOBAL : 50% conforme UX 2026**

**Après fixes P0 e-commerce** : **83% conforme** (5/6 standards OK)

---

## 🎯 Gains Attendus Après Fixes

### E-commerce (Après P0-1, P0-2, P0-3)

| Métrique | Actuel | Après Fixes | Gain | Status |
|----------|--------|-------------|------|--------|
| Performance | 73 | **88-92** | **+15-19** | ✅ Objectif atteint |
| LCP | 4.19s | **1.9s** | **-2.3s (-55%)** | ✅ < 2.5s |
| FCP | 0.92s | **0.85s** | -0.07s | ✅ Déjà bon |
| CLS | 0.250 | **0.03** | **-0.22 (-88%)** | ✅ < 0.1 |
| TTI | 4.20s | **3.5s** | **-0.7s (-17%)** | ✅ < 3.8s |

**Conformité UX 2026 après fixes** : 83% (5/6 standards) ✅

**Seul écart restant** : Vitrine LCP 2.72s vs 2.5s (+0.22s = +9%, acceptable)

---

## ✅ Conclusions

### Points Positifs

1. ✅ **Mode production excellent** : Build Next.js parfaitement optimisé
2. ✅ **Site vitrine 96/100** : Performance exceptionnelle
3. ✅ **Bundles optimisés** : Code splitting, tree-shaking fonctionnels
4. ✅ **TBT = 0ms** : Thread principal non bloqué
5. ✅ **FCP < 1s** : Affichage initial rapide (vitrine + e-commerce)

### Points d'Amélioration

1. 🔴 **E-commerce LCP 4.19s** : Nécessite SSR produits
2. 🔴 **E-commerce CLS 0.250** : Images sans dimensions fixes
3. 🟡 **Vitrine LCP 2.72s** : Légèrement au-dessus objectif (acceptable)

### Effort Requis

**E-commerce P0** : 4.5h développement
- SSR produits : 3h
- Images aspect-square : 1h
- Skeleton loading : 30min

**Gain attendu** : Performance 73 → **88+**, conformité UX 2026 : 50% → **83%**

---

## 🔧 Commandes Utiles

### Re-scanner après fixes

```bash
# E-commerce
cd vitrine-client
npm run build
npm run start
npx lighthouse http://localhost:3001 --output=json --output-path=./after-fixes.json

# Comparer
node -e "
const before = require('./perf-report-prod-ecommerce.json');
const after = require('./after-fixes.json');
console.log('LCP:', (before.audits['largest-contentful-paint'].numericValue/1000).toFixed(2), '→', (after.audits['largest-contentful-paint'].numericValue/1000).toFixed(2));
console.log('CLS:', before.audits['cumulative-layout-shift'].numericValue.toFixed(3), '→', after.audits['cumulative-layout-shift'].numericValue.toFixed(3));
console.log('Performance:', (before.categories.performance.score*100).toFixed(0), '→', (after.categories.performance.score*100).toFixed(0));
"
```

### Bundle analysis

```bash
# E-commerce
cd vitrine-client
npm install --save-dev @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
});

module.exports = withBundleAnalyzer({
  // ... config
});

ANALYZE=true npm run build
```

### Lighthouse CI

```bash
# Ajouter dans package.json (e-commerce)
{
  "scripts": {
    "lighthouse:ci": "npm run build && lhci autorun"
  }
}

# lighthouserc.json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run start",
      "url": ["http://localhost:3001"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}]
      }
    }
  }
}
```

---

## 📌 Recommandations Architecture

### Next.js Best Practices

1. **SSR par défaut** pour pages publiques
   - Catalogue produits, pages catégories
   - Pages statiques (CGU, FAQ, etc.)

2. **ISR (Incremental Static Regeneration)** pour contenu semi-statique
   - Fiches produits : `revalidate: 3600` (1h)
   - Pages catégories : `revalidate: 1800` (30min)

3. **Client-side fetch** uniquement pour données utilisateur
   - Panier, wishlist
   - Compte utilisateur

### Images

1. **Toujours utiliser `next/image`**
   - Optimisation auto WebP/AVIF
   - Lazy loading natif
   - Responsive images

2. **Définir dimensions explicites**
   - Utiliser `aspect-ratio` CSS ou `aspect-[ratio]` Tailwind
   - Prop `fill` avec conteneur `relative aspect-*`

3. **Précharger images critiques**
   - Hero banner : `priority`
   - Logo : `priority`

### API Calls

1. **Server Components pour fetch initial**
   ```tsx
   // ✅ Server Component (SSR)
   export default async function Page() {
     const data = await fetch('...', { next: { revalidate: 300 } });
     return <ClientComponent data={data} />;
   }
   ```

2. **React Query pour mutations et revalidation**
   ```tsx
   // ✅ Client Component pour interactions
   'use client';
   const { mutate } = useMutation({
     mutationFn: addToCart,
     onSuccess: () => queryClient.invalidateQueries(['cart'])
   });
   ```

---

**Rapport généré le** : 26 janvier 2026, 16:10
**Par** : `/perf` - Claude Code
**Lighthouse version** : 13.0.1
**Standards** : UX 2026

**Prochaine étape** : Implémenter fixes P0 e-commerce (SSR + images aspect-square + skeleton)
