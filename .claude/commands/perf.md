# Commande /perf - Analyse Performance

## Description

Analyse les performances du système tri-couche (Backend Odoo ↔ Backoffice React ↔ Frontends Next.js) avec métriques Web Vitals, profiling API, et recommandations d'optimisation alignées sur les standards UX 2026.

**Services analysés** :
- Site Vitrine (vitrine-quelyos : 3000)
- E-commerce (vitrine-client : 3001)
- Backoffice (dashboard-client : 5175)

## Usage

```bash
/perf vitrine              # Analyse Lighthouse + bundle site vitrine (3000)
/perf ecommerce            # Analyse Lighthouse + bundle e-commerce (3001)
/perf backoffice           # Analyse Lighthouse + bundle backoffice React
/perf api                  # Profiling endpoints API Odoo (> 1s)
/perf images               # Analyse optimisation images (WebP, lazy loading)
/perf                      # Analyse complète (tous services + API + images)
```

## Standards de Performance (UX 2026)

**Web Vitals (Frontend/Backoffice) :**
- **LCP (Largest Contentful Paint)** : < 2.5s (Good) | 2.5-4s (Needs Improvement) | > 4s (Poor)
- **FID (First Input Delay)** : < 100ms (Good) | 100-300ms (NI) | > 300ms (Poor)
- **CLS (Cumulative Layout Shift)** : < 0.1 (Good) | 0.1-0.25 (NI) | > 0.25 (Poor)
- **FCP (First Contentful Paint)** : < 1.8s (Good)
- **TTI (Time to Interactive)** : < 3.8s (Good)

**API Backend :**
- **Endpoints standard** : < 500ms (Good) | 500ms-1s (NI) | > 1s (Poor)
- **Endpoints lourds** (listes, analytics) : < 1s (Good) | 1-3s (NI) | > 3s (Poor)

**Lighthouse Scores :**
- **Performance** : ≥ 90 (Good) | 50-89 (NI) | < 50 (Poor)
- **Accessibility** : ≥ 90 (Required)
- **Best Practices** : ≥ 90 (Required)
- **SEO** : ≥ 90 (Required pour frontend public)

## Workflow

### 1. Détection du Scope

Analyser le paramètre fourni pour déterminer quelles analyses effectuer :
- `vitrine` → Lighthouse + bundle site vitrine (vitrine-quelyos)
- `ecommerce` → Lighthouse + bundle e-commerce (vitrine-client)
- `backoffice` → Lighthouse + bundle backoffice (dashboard-client)
- `api` → Profiling endpoints API lents
- `images` → Analyse optimisation images
- Aucun paramètre → Toutes les analyses

### 2. Analyse Frontend (Next.js)

#### 2.1. Lighthouse Audit

**Lancer Lighthouse sur pages clés :**

```bash
# Site Vitrine (3000)
cd vitrine-quelyos
npx lighthouse http://localhost:3000 \
  --output=json --output-path=./perf-reports/homepage.json \
  --chrome-flags="--headless"

# E-commerce (3001)
cd vitrine-client

# Page catalogue
npx lighthouse http://localhost:3001/products \
  --output=json --output-path=./perf-reports/catalog.json

# Fiche produit
npx lighthouse http://localhost:3001/products/test-product \
  --output=json --output-path=./perf-reports/product-page.json

# Panier
npx lighthouse http://localhost:3001/cart \
  --output=json --output-path=./perf-reports/cart.json
```

**Parser résultats JSON et extraire métriques :**

```javascript
const report = JSON.parse(fs.readFileSync('./perf-reports/homepage.json'));

const metrics = {
  performance: report.categories.performance.score * 100,
  accessibility: report.categories.accessibility.score * 100,
  bestPractices: report.categories['best-practices'].score * 100,
  seo: report.categories.seo.score * 100,
  lcp: report.audits['largest-contentful-paint'].numericValue,
  fid: report.audits['max-potential-fid'].numericValue,
  cls: report.audits['cumulative-layout-shift'].numericValue,
  fcp: report.audits['first-contentful-paint'].numericValue,
  tti: report.audits['interactive'].numericValue,
};
```

**Classifier résultats :**

| Métrique | Good | Needs Improvement | Poor |
|----------|------|-------------------|------|
| Performance Score | ≥ 90 | 50-89 | < 50 |
| LCP | < 2.5s | 2.5-4s | > 4s |
| FID | < 100ms | 100-300ms | > 300ms |
| CLS | < 0.1 | 0.1-0.25 | > 0.25 |

#### 2.2. Bundle Analysis

**Analyser taille bundle Next.js :**

```bash
cd frontend
ANALYZE=true npm run build
```

**Extraire métriques bundle :**

```bash
# Taille bundle JS initial (First Load JS)
du -sh .next/static/chunks/*.js | sort -h

# Taille totale .next/
du -sh .next/
```

**Violations P0 (Performance CRITIQUE) :**
- Bundle initial (First Load JS) > 1 MB
- Page individuelle > 500 KB
- Librairie lourde non lazy-loaded (ex: Chart.js, Lodash complet)

**Violations P1 (Performance IMPORTANTE) :**
- Bundle initial > 500 KB
- Images non optimisées (JPEG au lieu de WebP)
- Fonts non optimisées (pas de `next/font`)

**Identifier culprits (packages lourds) :**

Via @next/bundle-analyzer :
- Lister packages > 100 KB
- Identifier duplications (même package plusieurs versions)
- Identifier imports complets au lieu de tree-shaking (ex: `import _ from 'lodash'`)

#### 2.3. Analyse Images

**Scanner images dans frontend :**

```bash
find vitrine-client/public -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) -exec ls -lh {} \;
```

**Vérifier :**
- [ ] Toutes images > 100 KB sont optimisées (WebP ou AVIF)
- [ ] Aucune image > 1 MB (compression nécessaire)
- [ ] Images utilisent `next/image` (pas `<img>`)
- [ ] Lazy loading activé sur images below-the-fold

**Violations P0 :**
- Image > 2 MB non compressée
- Utilisation `<img>` au lieu de `next/image` (pas d'optimisation auto)

**Violations P1 :**
- Images PNG au lieu de WebP (gain 30-50% taille)
- Images non lazy-loaded

#### 2.4. Détection Layout Shifts (CLS)

**Identifier éléments causant CLS :**

Via Lighthouse audit `cumulative-layout-shift` :
- Lister éléments contribuant le plus au CLS
- Causes communes :
  - Images sans `width` et `height` définis
  - Fonts non optimisées (FOUT/FOIT)
  - Contenus dynamiques insérés sans espace réservé
  - Publicités/embeds sans dimensions

**Solutions recommandées :**
```tsx
// ❌ CLS causé
<img src="/product.jpg" alt="Product" />

// ✅ CLS prévenu
<Image
  src="/product.jpg"
  alt="Product"
  width={400}
  height={300}
  placeholder="blur"
/>
```

### 3. Analyse Backoffice (React + Vite)

#### 3.1. Lighthouse Audit

**Lancer Lighthouse sur pages admin clés :**

```bash
cd backoffice

# Dashboard
npx lighthouse http://localhost:5173 \
  --output=json --output-path=./perf-reports/dashboard.json

# Liste produits
npx lighthouse http://localhost:5173/products \
  --output=json --output-path=./perf-reports/products-list.json

# Formulaire produit
npx lighthouse http://localhost:5173/products/new \
  --output=json --output-path=./perf-reports/product-form.json
```

**Métriques identiques à Frontend (Performance, LCP, FID, CLS, etc.)**

#### 3.2. Bundle Analysis

**Analyser taille bundle Vite :**

```bash
cd backoffice
npm run build -- --mode=analyze
```

**OU via rollup-plugin-visualizer :**

```bash
# Dans vite.config.ts, ajouter :
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true, filename: 'bundle-report.html' })
  ]
});

npm run build
# Ouvre bundle-report.html automatiquement
```

**Violations similaires à Frontend (bundle > 1 MB, packages lourds, etc.)**

### 4. Analyse API Backend (Profiling Odoo)

#### 4.1. Détection Endpoints Lents

**Activer logging temps réponse Odoo :**

Ajouter dans `odoo-backend/addons/quelyos_api/controllers/main.py` :

```python
import time
import logging

_logger = logging.getLogger(__name__)

def log_performance(func):
    """Decorator pour logger temps d'exécution endpoint"""
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        duration = time.time() - start
        if duration > 0.5:  # Log si > 500ms
            _logger.warning(f"Slow endpoint: {func.__name__} took {duration:.2f}s")
        return result
    return wrapper

# Appliquer sur chaque endpoint
@http.route('/api/ecommerce/products', ...)
@log_performance
def get_products(self, ...):
    ...
```

**OU : Analyser logs Odoo existants**

```bash
cd odoo-backend
docker-compose logs odoo | grep -E "HTTP.*GET|HTTP.*POST" | \
  awk '{print $NF}' | # Extraire temps réponse
  sort -n | tail -20   # Top 20 endpoints lents
```

**Classifier endpoints :**

| Endpoint | Temps | Classification |
|----------|-------|----------------|
| GET /api/products | 450ms | Good (< 500ms) |
| POST /api/cart/add | 850ms | NI (500ms-1s) |
| GET /api/orders/analytics | 3.2s | Poor (> 3s) |

#### 4.2. Profiling Endpoint Spécifique

**Pour endpoint identifié comme lent (> 1s), profiler :**

**Méthode 1 : Logs détaillés**

```python
@http.route('/api/ecommerce/orders/analytics', ...)
def get_analytics(self):
    import time

    t0 = time.time()
    orders = request.env['sale.order'].search([...])
    _logger.info(f"Search orders: {time.time() - t0:.2f}s")

    t1 = time.time()
    products = orders.mapped('order_line.product_id')
    _logger.info(f"Map products: {time.time() - t1:.2f}s")

    t2 = time.time()
    total = sum(orders.mapped('amount_total'))
    _logger.info(f"Sum total: {time.time() - t2:.2f}s")

    return {'total': total}
```

**Méthode 2 : Profiler Python (cProfile)**

```python
import cProfile
import pstats

profiler = cProfile.Profile()
profiler.enable()

# Code à profiler
result = compute_analytics()

profiler.disable()
stats = pstats.Stats(profiler)
stats.sort_stats('cumulative')
stats.print_stats(10)  # Top 10 fonctions les plus lentes
```

#### 4.3. Détection Problèmes Communs API

**N+1 Queries (CRITIQUE) :**

Détecter boucles avec `search()` ou `browse()` :

```bash
grep -r "for.*in.*search\\|for.*in.*browse" \
  odoo-backend/addons/quelyos_api/controllers/ --include="*.py" -B 2 -A 5
```

**Exemple violation P0 :**

```python
# ❌ N+1 queries (1 requête par produit)
products = Product.search([...])
for product in products:
    stock = product.qty_available  # 1 requête SQL par itération !

# ✅ Optimisé (1 seule requête)
products = Product.search([...])
products.mapped('qty_available')  # Batch fetch
```

**Champs calculés non optimisés :**

Vérifier champs `compute` sans cache :

```bash
grep -r "@api\\.depends" odoo-backend/addons/quelyos_api/ --include="*.py" -A 10 | \
  grep -v "store=True"
```

**Si champ calculé utilisé fréquemment SANS `store=True` → P1 (lenteur)**

**Recherches sans limite :**

```bash
grep -r "\\.search\\(\\[" odoo-backend/addons/quelyos_api/ --include="*.py" | \
  grep -v "limit="
```

**Violations P0 :**
- `search([])` sans `limit` sur tables > 10k lignes (produits, commandes)

### 5. Analyse Images (Optimisation)

#### 5.1. Scanner Images Non Optimisées

**Frontend :**
```bash
# Lister images > 500 KB
find vitrine-client/public -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) -size +500k -exec ls -lh {} \;

# Compter images par format
find vitrine-client/public -type f -name "*.jpg" | wc -l   # JPEG
find vitrine-client/public -type f -name "*.webp" | wc -l  # WebP
find vitrine-client/public -type f -name "*.avif" | wc -l  # AVIF
```

**Vérifier :**
- [ ] Ratio WebP/JPEG > 80% (majorité images WebP)
- [ ] Aucune image > 2 MB
- [ ] Images produits : versions multiples (thumbnail, medium, large)

#### 5.2. Vérifier Lazy Loading

**Scanner composants Image :**

```bash
grep -r "<Image" vitrine-client/src/ --include="*.tsx" -A 2 | \
  grep -v "loading=" | \
  head -20  # Afficher premiers 20 sans prop loading
```

**Vérifier :**
- Images below-the-fold ont `loading="lazy"`
- Images above-the-fold (hero) ont `priority` ou pas de lazy loading

**Violations P1 :**
```tsx
// ❌ Image lourde below-the-fold sans lazy loading
<Image src="/large-banner.jpg" width={1920} height={1080} />

// ✅ Lazy loading activé
<Image src="/large-banner.jpg" width={1920} height={1080} loading="lazy" />
```

#### 5.3. Vérifier Responsive Images

**Vérifier utilisation `sizes` :**

```bash
grep -r "<Image" vitrine-client/src/ --include="*.tsx" -A 3 | grep "sizes="
```

**Si aucune image avec `sizes` → P1 (pas de responsive images)**

**Exemple correct :**
```tsx
<Image
  src="/product.jpg"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### 6. Génération Rapport Performance

**Format Markdown :**

```markdown
# ⚡ Rapport de Performance - [Date]

## 📊 Résumé Exécutif

| Application | Performance | LCP | FID | CLS | Bundle | Status |
|-------------|-------------|-----|-----|-----|--------|--------|
| **Frontend** | 82 | 2.8s | 85ms | 0.12 | 650 KB | 🟡 NI |
| **Backoffice** | 91 | 2.1s | 60ms | 0.08 | 450 KB | ✅ Good |
| **API Backend** | - | - | - | - | - | 🔴 Poor |

**🚨 STATUT GLOBAL : NEEDS IMPROVEMENT (3 P0, 7 P1)**

---

## 🌐 Frontend (Next.js)

### Lighthouse Scores

| Page | Performance | Accessibility | Best Practices | SEO |
|------|-------------|---------------|----------------|-----|
| Homepage | 82 🟡 | 95 ✅ | 92 ✅ | 100 ✅ |
| Catalogue | 78 🟡 | 93 ✅ | 90 ✅ | 95 ✅ |
| Fiche Produit | 85 🟡 | 96 ✅ | 91 ✅ | 98 ✅ |
| Panier | 88 🟡 | 94 ✅ | 93 ✅ | N/A |

**Moyenne Performance : 82/100** (Objectif : ≥ 90)

### Web Vitals

| Page | LCP | FID | CLS | FCP | TTI |
|------|-----|-----|-----|-----|-----|
| Homepage | 2.8s 🟡 | 85ms ✅ | 0.12 🟡 | 1.6s ✅ | 3.5s ✅ |
| Catalogue | 3.1s 🟡 | 90ms ✅ | 0.15 🟡 | 1.8s ✅ | 4.2s 🔴 |
| Fiche Produit | 2.4s ✅ | 70ms ✅ | 0.08 ✅ | 1.5s ✅ | 3.2s ✅ |

**P0 - CRITIQUE (1) :**

#### 1. TTI trop élevé sur page Catalogue (4.2s)

**Métrique** : Time to Interactive = 4.2s (objectif < 3.8s)

**Impact** : Utilisateur attend 4.2s avant pouvoir interagir (filtres, tri)

**Cause racine** :
- Bundle JS trop lourd (850 KB) sur page catalogue
- Chart.js chargé immédiatement (pas de lazy loading)

**Solution** :
```tsx
// Lazy load Chart.js (utilisé uniquement dans analytics)
const Chart = dynamic(() => import('react-chartjs-2'), { ssr: false });
```

**Gain estimé** : -200 KB bundle, TTI < 3.5s ✅

---

**P1 - IMPORTANT (3) :**

#### 2. LCP lent sur Homepage et Catalogue (2.8s, 3.1s)

**Métrique** : LCP > 2.5s (objectif < 2.5s)

**Impact** : Perception de lenteur au chargement

**Cause racine** :
- Image hero non optimisée (2.5 MB JPEG)
- Pas de `priority` sur image hero

**Solution** :
```tsx
<Image
  src="/hero-banner.jpg"
  width={1920}
  height={800}
  priority  // Précharger
  quality={85}  // Réduire qualité (imperceptible)
/>
```

**Gain estimé** : LCP < 2.3s ✅

---

#### 3. CLS moyen sur Homepage et Catalogue (0.12, 0.15)

**Métrique** : CLS > 0.1 (objectif < 0.1)

**Impact** : Éléments bougent pendant chargement (mauvaise UX)

**Cause racine** :
- Cards produits sans `aspect-ratio` défini
- Skeleton loading avec dimensions différentes du contenu final

**Solution** :
```tsx
// Définir ratio d'aspect sur conteneur
<div className="aspect-[4/3]">
  <Image src={product.image} fill className="object-cover" />
</div>
```

**Gain estimé** : CLS < 0.08 ✅

---

#### 4. Bundle size élevé (650 KB)

**Métrique** : First Load JS = 650 KB (objectif < 500 KB)

**Impact** : Téléchargement lent sur connexions 3G/4G

**Culprits** :
- `lodash` complet importé (500 KB) au lieu de functions individuelles
- `react-icons` complet (300 KB) au lieu d'icônes spécifiques
- Duplication `@heroicons/react` (2 versions : v1 et v2)

**Solution** :
```typescript
// ❌ Import complet
import _ from 'lodash';
import * as Icons from 'react-icons';

// ✅ Import sélectif
import debounce from 'lodash/debounce';
import { FaHeart, FaShoppingCart } from 'react-icons/fa';
```

**Gain estimé** : -200 KB bundle → 450 KB ✅

---

### Images

**Statistiques** :
- Total images : 145
- Format JPEG : 89 (61%)
- Format WebP : 45 (31%)
- Format PNG : 11 (8%)
- Taille moyenne : 420 KB
- Images > 1 MB : 12

**P1 - IMPORTANT (2) :**

#### 5. Majorité images encore en JPEG (61%)

**Recommandation** : Convertir en WebP (gain 30-50% taille)

**Solution** :
```bash
# Conversion batch avec sharp
npm install sharp-cli -g
sharp -i vitrine-client/public/products/*.jpg -o vitrine-client/public/products/ -f webp -q 85
```

#### 6. 12 images > 1 MB non compressées

**Liste** :
- `/public/hero-banner.jpg` (2.5 MB)
- `/public/products/product-123.jpg` (1.8 MB)
- [...]

**Solution** : Compresser avec sharp ou TinyPNG (objectif < 500 KB)

---

## 💼 Backoffice (React + Vite)

### Lighthouse Scores

| Page | Performance | Accessibility | Best Practices |
|------|-------------|---------------|----------------|
| Dashboard | 91 ✅ | 94 ✅ | 93 ✅ |
| Produits | 89 🟡 | 95 ✅ | 91 ✅ |
| Formulaire | 93 ✅ | 96 ✅ | 94 ✅ |

**Moyenne Performance : 91/100** ✅ (Objectif : ≥ 90)

### Web Vitals

| Page | LCP | FID | CLS | TTI |
|------|-----|-----|-----|-----|
| Dashboard | 2.1s ✅ | 60ms ✅ | 0.08 ✅ | 3.1s ✅ |
| Produits | 2.3s ✅ | 75ms ✅ | 0.09 ✅ | 3.4s ✅ |

**✅ Aucune violation P0/P1 détectée**

### Bundle Size

- **Total** : 450 KB ✅ (objectif < 500 KB)
- **Vendor** : 320 KB (React, React Router, Zustand)
- **App** : 130 KB

**P2 - MINEUR (1) :**

#### 7. React Router v6 importé mais v5 utilisé (duplication)

**Gain potentiel** : -50 KB en supprimant react-router v5

---

## 🔌 API Backend (Odoo)

### Endpoints Performance

| Endpoint | Moyenne | P50 | P95 | P99 | Status |
|----------|---------|-----|-----|-----|--------|
| GET /api/products | 450ms | 350ms | 800ms | 1.2s | 🟡 NI |
| POST /api/cart/add | 850ms | 600ms | 1.5s | 2.1s | 🟡 NI |
| GET /api/orders | 680ms | 500ms | 1.1s | 1.8s | 🟡 NI |
| GET /api/analytics | 3.2s | 2.8s | 5.1s | 7.3s | 🔴 Poor |
| POST /api/checkout | 1.8s | 1.4s | 2.5s | 3.2s | 🔴 Poor |

**P0 - CRITIQUE (2) :**

#### 8. Endpoint /api/analytics très lent (3.2s moyenne)

**Impact** : Dashboard admin prend 3.2s à charger (objectif < 1s)

**Cause racine** :
- N+1 queries détectées (1 requête par commande pour calculer totaux)
- Aucun cache sur données analytics

**Code problématique** :
```python
orders = Order.search([...], limit=1000)
for order in orders:
    total += order.amount_total  # N+1 query !
```

**Solution** :
```python
# Batch fetch avec mapped()
orders = Order.search([...], limit=1000)
total = sum(orders.mapped('amount_total'))  # 1 seule requête
```

**+ Ajouter cache (Redis ou memoization) :**
```python
@functools.lru_cache(maxsize=100, ttl=300)  # Cache 5 min
def get_analytics_cached():
    ...
```

**Gain estimé** : 3.2s → 0.8s ✅

---

#### 9. Endpoint /api/checkout lent (1.8s)

**Impact** : Utilisateur attend 1.8s après clic "Valider commande"

**Cause racine** :
- Validation stock produit par produit (N+1)
- Envoi email synchrone (bloque réponse)

**Solution** :
```python
# 1. Batch validation stock
products = cart.mapped('product_id')
products.mapped('qty_available')  # Prefetch

# 2. Email asynchrone (Celery ou queue)
send_order_confirmation.delay(order_id)  # Non-bloquant
```

**Gain estimé** : 1.8s → 0.6s ✅

---

**P1 - IMPORTANT (2) :**

#### 10. Endpoint /api/products sans cache (450ms répétitif)

**Recommandation** : Ajouter cache HTTP (ETag, Last-Modified)

**Solution** :
```python
response.headers['Cache-Control'] = 'public, max-age=300'  # Cache 5min
```

#### 11. Recherche /api/products sans limite

**Code** :
```python
products = Product.search([('name', 'ilike', search)])  # Aucune limite !
```

**Risque** : Si 10k produits matchent, charge tout en mémoire

**Solution** :
```python
products = Product.search([('name', 'ilike', search)], limit=50)
```

---

## 📊 Métriques Globales

### Performance par Application

| Application | Score | LCP | TTI | Bundle | API (P95) | Grade |
|-------------|-------|-----|-----|--------|-----------|-------|
| Frontend | 82 | 2.8s | 3.9s | 650 KB | 1.2s | 🟡 B |
| Backoffice | 91 | 2.1s | 3.1s | 450 KB | - | ✅ A |
| Backend API | - | - | - | - | 5.1s | 🔴 D |

### Issues par Priorité

| Priorité | Count | Gain Potentiel |
|----------|-------|----------------|
| P0 (Critique) | 3 | -2.5s TTI, -1.5s API |
| P1 (Important) | 7 | -0.5s LCP, -200 KB bundle |
| P2 (Mineur) | 2 | -50 KB bundle |

---

## 🎯 Plan d'Action Priorisé

### Immédiat (cette semaine)

1. ✅ **P0-8** : Optimiser endpoint /api/analytics (N+1 queries + cache)
   - Impact : -2.4s (3.2s → 0.8s)
   - Effort : 2h

2. ✅ **P0-9** : Optimiser endpoint /api/checkout (batch + async email)
   - Impact : -1.2s (1.8s → 0.6s)
   - Effort : 3h

3. ✅ **P0-1** : Lazy load Chart.js sur frontend
   - Impact : -0.7s TTI (4.2s → 3.5s)
   - Effort : 30min

### Court terme (2 semaines)

4. ✅ **P1-2** : Optimiser image hero + priority
   - Impact : -0.5s LCP
   - Effort : 1h

5. ✅ **P1-4** : Tree-shaking lodash + react-icons
   - Impact : -200 KB bundle
   - Effort : 2h

6. ✅ **P1-5** : Convertir images JPEG → WebP
   - Impact : -30% taille images
   - Effort : 1h (script automatisé)

### Backlog

7. P1-3 : Fix CLS avec aspect-ratio
8. P1-10 : Ajouter cache HTTP sur /api/products
9. P2-7 : Supprimer react-router v5 (duplication)

---

## 📈 Évolution vs Baseline

**Baseline** : 2026-01-15 (10 jours ago)

| Métrique | Avant | Après | Évolution |
|----------|-------|-------|-----------|
| Frontend Performance | 78 | 82 | +4 ✅ |
| Frontend LCP | 3.2s | 2.8s | -0.4s ✅ |
| Frontend Bundle | 850 KB | 650 KB | -200 KB ✅ |
| API /analytics | 4.1s | 3.2s | -0.9s ✅ |

**Tendance : Amélioration continue** (+5% performance en 10 jours)

---

## ✅ Validation Objectifs UX 2026

| Objectif | Frontend | Backoffice | Backend | Status |
|----------|----------|------------|---------|--------|
| LCP < 2.5s | 🟡 2.8s | ✅ 2.1s | - | 🟡 Partiel |
| FID < 100ms | ✅ 85ms | ✅ 60ms | - | ✅ OK |
| CLS < 0.1 | 🟡 0.12 | ✅ 0.08 | - | 🟡 Partiel |
| Performance ≥ 90 | 🔴 82 | ✅ 91 | - | 🟡 Partiel |
| API < 1s (P95) | - | - | 🔴 5.1s | 🔴 KO |

**🚨 STATUT : PARTIELLEMENT VALIDÉ (3/5 objectifs OK)**
```

### 7. Recommandations Automatisées

**Après analyse, proposer fixes automatiques si patterns détectés :**

**Exemple : Bundle trop lourd avec lodash complet**

```typescript
// Détecté dans vitrine-client/src/lib/utils.ts
import _ from 'lodash';  // ❌ 500 KB

// Proposition de fix
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
// Gain : -480 KB
```

**Exemple : N+1 queries Odoo**

```python
# Détecté dans odoo-backend/addons/quelyos_api/controllers/main.py:234
for order in orders:
    total += order.amount_total  # ❌ N+1

# Proposition de fix
total = sum(orders.mapped('amount_total'))  # ✅ Batch
# Gain : -2.5s (3.2s → 0.7s)
```

## Métriques de Succès

**Cette commande est un succès si :**

1. ✅ Scores Lighthouse collectés pour toutes pages clés
2. ✅ Web Vitals (LCP, FID, CLS) mesurés et classifiés (Good/NI/Poor)
3. ✅ Bundle size analysé avec culprits identifiés (packages > 100 KB)
4. ✅ Endpoints API lents (> 1s) identifiés et profilés
5. ✅ Issues classifiées par priorité (P0/P1/P2) avec gain estimé
6. ✅ Plan d'action priorisé généré (Immédiat/Court terme/Backlog)

## Notes Importantes

- **Automatiser** cette analyse en CI/CD (Lighthouse CI)
- **Monitorer** métriques en production (Google Analytics, Sentry)
- **Re-scanner** après chaque optimisation (valider gains réels)
- **Comparer** avec baseline précédente (détecter régressions)

## Exemples d'Utilisation

```bash
# Avant release
/perf                      # Analyse complète (valider perf OK)

# Focus frontend
/perf frontend             # Optimiser LCP, bundle size

# Debug API lente
/perf api                  # Identifier endpoints > 1s

# Optimiser images
/perf images               # Vérifier WebP, lazy loading
```
