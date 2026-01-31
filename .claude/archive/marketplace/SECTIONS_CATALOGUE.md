# Catalogue des Sections Theme Engine

## 📦 Sections Disponibles

### Total : 16 sections | 30+ variantes

---

## 1. Hero Slider

**Emplacement** : `vitrine-client/src/theme-engine/components/sections/HeroSlider/`

**Variantes** :
- `fullscreen-autoplay` - Plein écran avec défilement automatique
- `split-screen` - Split écran avec texte + image
- `minimal` - Version minimaliste

**Config** :
```json
{
  "type": "hero-slider",
  "variant": "fullscreen-autoplay",
  "config": {
    "height": "90vh",
    "animation": "fade",
    "interval": 5000
  }
}
```

---

## 2. Featured Products

**Emplacement** : `vitrine-client/src/theme-engine/components/sections/FeaturedProducts/`

**Variantes** :
- `grid-4cols` - Grille 4 colonnes
- `carousel` - Carrousel défilant
- `masonry` - Disposition masonry

**Config** :
```json
{
  "type": "featured-products",
  "variant": "grid-4cols",
  "config": {
    "limit": 8,
    "sortBy": "bestsellers",
    "title": "Nos Produits Phares"
  }
}
```

**API** : Connecté à `backendClient.getProducts()`

---

## 3. Categories

**Emplacement** : `vitrine-client/src/theme-engine/components/sections/Categories/`

**Variantes** :
- `grid-4cols` - Grille 4 colonnes avec images
- `carousel` - Carrousel horizontal avec navigation
- `featured` - Mise en avant avec layout asymétrique

**Config** :
```json
{
  "type": "categories",
  "variant": "grid-4cols",
  "config": {
    "limit": 8,
    "title": "Nos Catégories"
  }
}
```

**API** : Connecté à `backendClient.getCategories()`

**Features** :
- Images de catégories
- Nombre de produits par catégorie
- Hover effects et transitions
- Dark mode support

---

## 4. Promo Banner

**Emplacement** : `vitrine-client/src/theme-engine/components/sections/PromoBanner/`

**Variantes** :
- `centered` - Centré avec fond coloré + CTA
- `split` - Split écran texte + image
- `minimal` - Barre horizontale minimale

**Config** :
```json
{
  "type": "promo-banner",
  "variant": "centered",
  "config": {
    "title": "Offre Spéciale",
    "subtitle": "Profitez de -30% sur tous les produits",
    "ctaText": "Découvrir",
    "ctaUrl": "/products",
    "bgColor": "#dc2626"
  }
}
```

---

## 5. Features

**Emplacement** : `vitrine-client/src/theme-engine/components/sections/Features/`

**Variantes** :
- `grid-3cols` - Grille 3 colonnes avec icônes et descriptions
- `icons-row` - Ligne horizontale d'icônes compacte

**Config** :
```json
{
  "type": "features",
  "variant": "grid-3cols",
  "config": {
    "features": [
      {
        "icon": "truck",
        "title": "Livraison Rapide",
        "description": "Livraison en 24-48h"
      }
    ]
  }
}
```

**Icônes disponibles** : `truck`, `shield`, `credit-card`, `headphones`

---

## 6. Newsletter

**Emplacement** : `vitrine-client/src/theme-engine/components/sections/Newsletter/`

**Variantes** :
- `centered` - Centré avec formulaire
- `minimal` - Version compacte

**Config** :
```json
{
  "type": "newsletter",
  "variant": "centered",
  "config": {
    "title": "Restez Informé",
    "subtitle": "Recevez nos offres exclusives"
  }
}
```

---

## 7. Testimonials

**Emplacement** : `vitrine-client/src/theme-engine/components/sections/Testimonials/`

**Variantes** :
- `carousel` - Carrousel de témoignages
- `grid` - Grille de témoignages

**Config** :
```json
{
  "type": "testimonials",
  "variant": "carousel",
  "config": {
    "limit": 6,
    "title": "Ce Que Disent Nos Clients"
  }
}
```

---

## 8. FAQ

**Emplacement** : `vitrine-client/src/theme-engine/components/sections/FAQ/`

**Variantes** :
- `accordion` - Accordion pliable
- `tabs` - Organisation par onglets

**Config** :
```json
{
  "type": "faq",
  "variant": "accordion",
  "config": {
    "title": "Questions Fréquentes"
  }
}
```

---

## 9. Trust Badges

**Emplacement** : `vitrine-client/src/theme-engine/components/sections/TrustBadges/`

**Variantes** :
- `icons` - Icônes de confiance
- `logos` - Logos partenaires

**Config** :
```json
{
  "type": "trust-badges",
  "variant": "icons",
  "config": {}
}
```

---

## 10. Brand Logos

**Emplacement** : `vitrine-client/src/theme-engine/components/sections/BrandLogos/`

**Variantes** :
- `grid` - Grille de logos (grayscale hover effect)
- `marquee` - Défilement horizontal animé

**Config** :
```json
{
  "type": "brand-logos",
  "variant": "grid",
  "config": {
    "title": "Nos Partenaires",
    "brands": [
      { "name": "Brand 1", "logo": "url" }
    ]
  }
}
```

---

## 11. Video Hero

**Emplacement** : `vitrine-client/src/theme-engine/components/sections/VideoHero/`

**Variantes** :
- `fullscreen` - Plein écran avec vidéo background

**Config** :
```json
{
  "type": "video-hero",
  "variant": "fullscreen",
  "config": {
    "title": "Découvrez Notre Collection",
    "subtitle": "La mode qui vous ressemble",
    "videoUrl": "/videos/hero.mp4",
    "posterUrl": "/images/poster.jpg",
    "ctaText": "Explorer",
    "ctaUrl": "/products"
  }
}
```

**Features** :
- Video autoplay, muted, loop
- Fallback sur posterUrl
- Overlay sombre pour lisibilité
- CTA stylisé

---

## 12. Blog Posts

**Emplacement** : `vitrine-client/src/theme-engine/components/sections/BlogPosts/`

**Variantes** :
- `grid-3cols` - Grille 3 colonnes avec preview

**Config** :
```json
{
  "type": "blog-posts",
  "variant": "grid-3cols",
  "config": {
    "title": "Nos Derniers Articles",
    "posts": [
      {
        "id": 1,
        "title": "Article Title",
        "excerpt": "Preview text",
        "date": "15 Jan 2026",
        "image": "url",
        "slug": "article-slug"
      }
    ]
  }
}
```

---

## 13. Countdown Timer

**Emplacement** : `vitrine-client/src/theme-engine/components/sections/CountdownTimer/`

**Variantes** :
- `centered` - Compte à rebours centré avec CTA

**Config** :
```json
{
  "type": "countdown-timer",
  "variant": "centered",
  "config": {
    "title": "Offre à Durée Limitée",
    "endDate": "2026-02-15T23:59:59",
    "ctaText": "Profiter de l'offre",
    "ctaUrl": "/products"
  }
}
```

**Features** :
- Timer en temps réel (jours, heures, minutes, secondes)
- Auto-update chaque seconde
- Format 2 digits avec padding
- CTA stylisé

---

## 14. Contact Form

**Emplacement** : `vitrine-client/src/theme-engine/components/sections/ContactForm/`

**Variantes** :
- `centered` - Formulaire centré avec validation

**Config** :
```json
{
  "type": "contact-form",
  "variant": "centered",
  "config": {
    "title": "Contactez-Nous",
    "subtitle": "Une question ? Notre équipe vous répond sous 24h"
  }
}
```

**Champs** :
- Nom (text, required)
- Email (email, required)
- Message (textarea, required)

**Features** :
- Validation HTML5
- Loading state
- Focus ring styled
- Dark mode support

---

## 15. Social Proof

**Emplacement** : `vitrine-client/src/theme-engine/components/sections/SocialProof/`

**Variantes** :
- `stats` - Statistiques avec icônes

**Config** :
```json
{
  "type": "social-proof",
  "variant": "stats",
  "config": {
    "stats": [
      {
        "icon": "users",
        "value": "10,000+",
        "label": "Clients Satisfaits"
      }
    ]
  }
}
```

**Icônes disponibles** : `users`, `shopping-bag`, `star`, `award`

---

## 16. Product Tabs

**Emplacement** : `vitrine-client/src/theme-engine/components/sections/ProductTabs/`

**Variantes** :
- `tabbed` - Tabs avec grille produits

**Config** :
```json
{
  "type": "product-tabs",
  "variant": "tabbed",
  "config": {
    "title": "Nos Produits",
    "tabs": [
      { "id": "nouveautes", "label": "Nouveautés" },
      { "id": "bestsellers", "label": "Meilleures Ventes" }
    ]
  }
}
```

**Features** :
- Switch tabs sans reload
- Grille responsive 4 colonnes
- Mock products (TODO: connecter API)

---

## 🎨 Patterns Communs

### Dark Mode

Toutes les sections supportent le dark mode via classes Tailwind :
```tsx
bg-white dark:bg-gray-900
text-gray-900 dark:text-white
border-gray-200 dark:border-gray-700
```

### Theme Context

Toutes les sections utilisent le ThemeContext :
```tsx
theme.colors.primary
theme.colors.secondary
theme.spacing.containerWidth
theme.typography.headings
```

### Lazy Loading

Toutes les sections utilisent React.lazy + Suspense :
```tsx
const Grid4Cols = lazy(() => import('./variants/Grid4Cols'));

<Suspense fallback={<SkeletonLoader />}>
  {renderVariant()}
</Suspense>
```

### Loading States

Skeleton UI pendant le chargement :
```tsx
if (loading) {
  return <div className="animate-pulse bg-gray-200 dark:bg-gray-700" />;
}
```

---

## 📝 Ajout Nouvelle Section

### 1. Créer la structure

```bash
mkdir vitrine-client/src/theme-engine/components/sections/MaSection
mkdir vitrine-client/src/theme-engine/components/sections/MaSection/variants
```

### 2. Créer index.tsx

```tsx
'use client';

import { lazy, Suspense } from 'react';
import type { SectionProps } from '../../../engine/types';

const Variant1 = lazy(() => import('./variants/Variant1'));

export default function MaSection({ variant = 'variant1', config, className, theme }: SectionProps) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100 dark:bg-gray-800" />}>
      <Variant1 config={config} className={className} theme={theme} />
    </Suspense>
  );
}
```

### 3. Créer variante

```tsx
'use client';

import type { ThemeContextValue } from '../../../../engine/types';

interface Variant1Props {
  config?: Record<string, unknown>;
  className?: string;
  theme: ThemeContextValue;
}

export default function Variant1({ config, className = '', theme }: Variant1Props) {
  const title = (config?.title as string) || 'Default Title';

  return (
    <section className={`py-16 md:py-24 ${className}`}>
      <div className="container mx-auto px-4" style={{ maxWidth: theme.spacing.containerWidth }}>
        <h2 className="text-3xl font-bold" style={{ color: theme.colors.primary }}>
          {title}
        </h2>
      </div>
    </section>
  );
}
```

### 4. Enregistrer dans SectionRenderer

Ajouter dans `vitrine-client/src/theme-engine/engine/SectionRenderer.tsx` :
```tsx
import MaSection from '../components/sections/MaSection';

const SECTION_COMPONENTS = {
  // ...
  'ma-section': MaSection,
};
```

### 5. Ajouter au system prompt AI

Mettre à jour `odoo-backend/addons/quelyos_api/controllers/theme.py` :
```python
# Sections disponibles et leurs variantes :
# - ma-section : variant1, variant2
```

---

## 🚀 Prochaines Sections à Créer

### Priorité Haute
- [ ] **Instagram Feed** - Flux Instagram (via API)
- [ ] **Store Locator** - Carte magasins
- [ ] **Product Comparison** - Comparateur produits
- [ ] **Size Guide** - Guide des tailles
- [ ] **Live Chat** - Widget chat en direct

### Priorité Moyenne
- [ ] **Reviews Grid** - Grille avis clients
- [ ] **Shipping Tracker** - Suivi commandes
- [ ] **Wishlist Showcase** - Produits favoris
- [ ] **Recently Viewed** - Produits vus récemment
- [ ] **Related Products** - Produits similaires

### Priorité Basse
- [ ] **Mega Menu** - Menu multi-niveaux
- [ ] **Search Bar** - Barre recherche avancée
- [ ] **Language Selector** - Sélecteur langues
- [ ] **Currency Selector** - Sélecteur devises
- [ ] **Cookie Banner** - Bannière cookies

---

## 📊 Statistiques

**Sections créées** : 16
**Variantes totales** : 30+
**Lignes de code** : ~4000
**Temps développement** : 2-3 heures

**Couverture fonctionnelle** :
- ✅ Hero sections (2 types)
- ✅ Product displays (3 types)
- ✅ Trust building (4 types)
- ✅ Content sections (3 types)
- ✅ Forms (2 types)
- ✅ Social proof (2 types)

**Prochaines étapes** :
1. Connecter ProductTabs à l'API backend
2. Implémenter soumission ContactForm
3. Ajouter Instagram Feed avec API
4. Créer Store Locator avec Google Maps
