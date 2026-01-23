# Guide Performance & SEO - Quelyos E-commerce

## 🚀 Optimisations Performance

### 1. Incremental Static Regeneration (ISR)

Les pages sont configurées avec ISR pour un équilibre parfait entre performance et fraîcheur des données:

- **Pages dynamiques**: Revalidation toutes les 60 secondes
- **Pages statiques**: Revalidation toutes les 3600 secondes (1h)

#### Configuration par page

```typescript
// Page produit
export const revalidate = 60; // 60 secondes

// Page d'accueil
export const revalidate = 300; // 5 minutes
```

### 2. Optimisation Images

**Formats supportés**: AVIF, WebP (fallback automatique)

**Tailles responsive**:
- Device sizes: 640, 750, 828, 1080, 1200, 1920, 2048, 3840
- Image sizes: 16, 32, 48, 64, 96, 128, 256, 384

**Lazy loading**: Automatique sur toutes les images

**Exemple d'utilisation**:

```tsx
<Image
  src={imageUrl}
  alt={altText}
  width={600}
  height={600}
  quality={85}
  loading="lazy"
  placeholder="blur"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### 3. Code Splitting

- Chargement différé des composants lourds
- Bundling automatique par route
- Tree shaking en production

```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // Optionnel: désactiver SSR pour ce composant
});
```

### 4. Compression

- **Gzip**: Activé par défaut
- **Brotli**: Supporté (nécessite configuration serveur)

### 5. Cache HTTP

**Headers configurés**:
- `Cache-Control` sur sitemap.xml: 1h
- `Cache-Control` sur robots.txt: 24h
- ETags générés automatiquement

### 6. Optimisation Production

- Console logs retirés (sauf error/warn)
- Minification avec SWC
- React Strict Mode activé
- Source maps désactivés en production

## 🔍 SEO

### 1. Metadata Dynamique

Toutes les pages incluent des metadata optimisées:

```typescript
import { generateMetadata } from '@/lib/utils/seo';

export const metadata = generateMetadata({
  title: 'Titre de la page',
  description: 'Description SEO optimisée (150-160 caractères)',
  keywords: 'mot-clé1, mot-clé2',
  url: '/chemin-page',
  type: 'website',
});
```

### 2. Open Graph & Twitter Cards

Générées automatiquement pour chaque page:
- Image OG: 1200x630px
- Twitter card: summary_large_image
- Locale: fr_FR

### 3. Structured Data (JSON-LD)

#### Organisation

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Quelyos",
  "url": "https://quelyos.com",
  "logo": "https://quelyos.com/logo.png"
}
```

#### Produit

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Nom du produit",
  "offers": {
    "@type": "Offer",
    "price": "99.99",
    "priceCurrency": "TND",
    "availability": "https://schema.org/InStock"
  }
}
```

#### Breadcrumb

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [...]
}
```

### 4. Sitemap XML

**URL**: `/sitemap.xml`

Généré dynamiquement avec:
- Pages statiques (priorité 0.5-1.0)
- Produits (priorité 0.8)
- Catégories (priorité 0.7)

**Fréquence de mise à jour**:
- Homepage: daily
- Produits: weekly
- Catégories: weekly

### 5. Robots.txt

**URL**: `/robots.txt`

**Directives**:
- Allow: `/` (toutes pages publiques)
- Disallow: `/api/`, `/account/`, `/checkout/`, `/cart`, `/login`, `/register`
- Crawl-delay: 1

### 6. Canonical URLs

Générées automatiquement pour éviter le duplicate content.

## 📊 Audit Performance

### Lighthouse Targets

- **Performance**: ≥90
- **Accessibility**: ≥90
- **Best Practices**: ≥90
- **SEO**: ≥95

### Core Web Vitals

- **LCP** (Largest Contentful Paint): <2.5s
- **FID** (First Input Delay): <100ms
- **CLS** (Cumulative Layout Shift): <0.1

### Outils recommandés

1. **Chrome DevTools Lighthouse**
2. **PageSpeed Insights**: https://pagespeed.web.dev/
3. **GTmetrix**: https://gtmetrix.com/
4. **WebPageTest**: https://www.webpagetest.org/

## 🔧 Commandes Utiles

```bash
# Build production
npm run build

# Analyser le bundle
npm run build && npx @next/bundle-analyzer

# Tester en production localement
npm run build && npm run start

# Linter & formatter
npm run lint
npm run format
```

## 📈 Monitoring Production

### Métriques à surveiller

1. **Core Web Vitals**
   - Utiliser Google Search Console
   - Activer Real User Monitoring (RUM)

2. **Taux de conversion**
   - Pages produits → Panier
   - Panier → Checkout
   - Checkout → Confirmation

3. **Taux de rebond**
   - Homepage: <50%
   - Pages produits: <60%
   - Pages checkout: <30%

4. **Temps de chargement**
   - TTFB (Time To First Byte): <600ms
   - FCP (First Contentful Paint): <1.8s
   - TTI (Time To Interactive): <3.8s

### Analytics recommandés

- Google Analytics 4
- Google Tag Manager
- Hotjar (heatmaps)
- Sentry (error tracking)

## 🎯 Checklist Production

Avant le déploiement:

- [ ] Build production sans erreurs
- [ ] Lighthouse score >90 sur toutes les pages clés
- [ ] Sitemap.xml accessible et valide
- [ ] Robots.txt configuré correctement
- [ ] Open Graph images présentes (1200x630)
- [ ] Favicon configuré (multiple tailles)
- [ ] HTTPS activé (Let's Encrypt)
- [ ] Compression gzip/brotli activée
- [ ] CDN configuré pour assets statiques
- [ ] Variables environnement production configurées
- [ ] Error tracking configuré (Sentry)
- [ ] Analytics configuré (GA4)
- [ ] Search Console vérifié
- [ ] Schema.org validé: https://validator.schema.org/

## 🚨 Troubleshooting

### Images ne se chargent pas

```typescript
// Vérifier next.config.ts
images: {
  remotePatterns: [
    {
      protocol: 'https', // http en dev, https en prod
      hostname: 'votre-domaine.com',
      pathname: '/web/image/**',
    },
  ],
}
```

### ISR ne fonctionne pas

```typescript
// Vérifier la configuration de la page
export const revalidate = 60; // En secondes

// Ou utiliser revalidatePath dans une action
import { revalidatePath } from 'next/cache';
revalidatePath('/products/[slug]');
```

### Cache trop agressif

```bash
# Forcer rebuild complet
rm -rf .next
npm run build
```

### Performance dégradée

1. Vérifier la taille du bundle: `npx @next/bundle-analyzer`
2. Profiler avec React DevTools Profiler
3. Activer le mode strict pour identifier re-renders
4. Vérifier les requêtes API (Network tab)
5. Optimiser les images (format, taille, lazy loading)
