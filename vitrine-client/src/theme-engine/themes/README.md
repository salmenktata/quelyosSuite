# Thèmes JSON - Quelyos Theme Engine

Ce dossier contient les configurations JSON des thèmes disponibles pour le moteur de thèmes Quelyos.

## 📁 Thèmes Disponibles

### 1. **fashion-luxury** (Mode Haut de Gamme)
- **Catégorie** : Fashion
- **Style** : Élégant, raffiné, typographie serif
- **Couleurs** : Noir (#2c2c2c) + Or (#d4af37)
- **Sections** : Hero slider, Featured products, Newsletter, Testimonials
- **Usage** : Boutiques de mode luxe, prêt-à-porter premium

### 2. **tech-minimal** (High-Tech Minimaliste)
- **Catégorie** : Tech
- **Style** : Épuré, moderne, sans serif
- **Couleurs** : Bleu vif (#0066ff) + Gris clair (#f0f0f0)
- **Sections** : Video hero, Features icons, Product tabs, Categories grid, Social proof stats, Brand logos
- **Usage** : Électronique, informatique, gadgets tech

### 3. **food-organic** (Alimentaire Bio)
- **Catégorie** : Food
- **Style** : Chaleureux, naturel, typographie serif body
- **Couleurs** : Vert forêt (#4a7c59) + Beige (#f4e4c1)
- **Sections** : Promo banner split, Countdown timer, Categories featured, Blog posts, Contact form
- **Usage** : Épiceries bio, produits du terroir, alimentation saine

## 📋 Structure d'un Thème JSON

```json
{
  "id": "theme-id",
  "name": "Nom Affiché",
  "category": "fashion|tech|food|beauty|sports|home|general",
  "description": "Description courte",
  "version": "1.0.0",
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "text": "#hex",
    "muted": "#hex"
  },
  "typography": {
    "headings": "Police Titres",
    "body": "Police Corps",
    "mono": "Police Monospace"
  },
  "layouts": {
    "homepage": { "sections": [...] },
    "productPage": { ... },
    "categoryPage": { ... }
  },
  "components": {
    "productCard": "style-minimal|style-detailed|style-overlay|style-compact",
    "header": "transparent-sticky|solid-sticky|classic",
    "footer": "columns-3|columns-4|minimal",
    "buttons": "rounded-shadow|squared|minimal|outline"
  },
  "spacing": {
    "sectionPadding": "small|medium|large|xlarge",
    "containerWidth": "1280px",
    "gutter": "1rem"
  },
  "customCSS": "/* CSS personnalisé optionnel */"
}
```

## 🎨 Sections Disponibles

### Sections Hero
- **hero-slider** : Carrousel plein écran avec slides multiples
- **hero** : Hero simple avec image de fond
- **video-hero** : Hero avec vidéo en fond (variant: `fullscreen`)

### Sections Produits
- **featured-products** : Produits mis en avant
  - Variants: `grid-4cols`, `carousel`, `masonry`
- **product-tabs** : Onglets produits dynamiques (nouveautés/bestsellers/promos)
  - Variant: `tabbed`

### Sections Catégories
- **categories** : Liste des catégories
  - Variants: `grid-4cols`, `carousel`, `featured`

### Sections Marketing
- **promo-banner** : Bannières promotionnelles
  - Variants: `centered`, `minimal`, `split`
- **countdown-timer** : Compte à rebours ventes flash
  - Variant: `centered`

### Sections Confiance
- **social-proof** : Preuve sociale avec statistiques
  - Variant: `stats` (4 métriques avec icônes)
- **features** : Caractéristiques/avantages boutique
  - Variants: `grid-3cols`, `icons-row`
- **trust-badges** : Badges de réassurance
- **testimonials** : Témoignages clients
  - Variants: `carousel`, `grid`, `masonry`

### Sections Marques & Partenaires
- **brand-logos** : Logos marques partenaires
  - Variants: `grid`, `marquee` (défilement automatique)

### Sections Contenu
- **blog-posts** : Articles de blog récents
  - Variant: `grid-3cols`
- **faq** : Questions fréquentes
  - Variants: `accordion`, `tabs`, `simple-list`
- **contact-form** : Formulaire de contact
  - Variant: `centered`

### Sections Engagement
- **newsletter** : Inscription newsletter
  - Variants: `with-background`, `minimal`, `centered`
- **call-to-action** : Appel à l'action
  - Variants: `banner`, `modal`, `inline`

## 🔧 Configuration des Sections

### Exemple : Video Hero
```json
{
  "type": "video-hero",
  "variant": "fullscreen",
  "config": {
    "title": "Titre principal",
    "subtitle": "Sous-titre",
    "videoUrl": "/videos/hero.mp4",
    "posterUrl": "/images/hero-poster.jpg",
    "ctaText": "Bouton",
    "ctaUrl": "/link"
  }
}
```

### Exemple : Social Proof Stats
```json
{
  "type": "social-proof",
  "variant": "stats",
  "config": {
    "stats": [
      { "icon": "users", "value": "10,000+", "label": "Clients" },
      { "icon": "shopping-bag", "value": "50,000+", "label": "Commandes" },
      { "icon": "star", "value": "4.9/5", "label": "Note" },
      { "icon": "award", "value": "98%", "label": "Satisfaction" }
    ]
  }
}
```

### Exemple : Product Tabs
```json
{
  "type": "product-tabs",
  "variant": "tabbed",
  "config": {
    "title": "Nos Produits",
    "tabs": [
      { "id": "new", "label": "Nouveautés", "filter": "newest" },
      { "id": "best", "label": "Bestsellers", "filter": "bestsellers" },
      { "id": "promo", "label": "Promos", "filter": "on_sale" }
    ],
    "limit": 8
  }
}
```

### Exemple : Countdown Timer
```json
{
  "type": "countdown-timer",
  "variant": "centered",
  "config": {
    "title": "Vente Flash",
    "subtitle": "Réduction de 25% jusqu'à minuit !",
    "endDate": "2026-02-15T23:59:59Z",
    "ctaText": "Profiter",
    "ctaUrl": "/promo"
  }
}
```

## 📦 Utilisation

### 1. Créer un Nouveau Thème

1. Créer un fichier JSON dans ce dossier : `mon-theme.json`
2. Respecter la structure ci-dessus
3. Uploader via le backoffice `/store/themes/submit`

### 2. Appliquer un Thème

**Depuis le Backoffice :**
```
/store/themes/marketplace → Choisir un thème → Installer
```

**Programmatiquement :**
```typescript
import themeConfig from '@/theme-engine/themes/tech-minimal.json';
import { ThemeProvider } from '@/theme-engine/ThemeProvider';

<ThemeProvider config={themeConfig}>
  <YourApp />
</ThemeProvider>
```

### 3. Tester un Thème

Utiliser la page de preview :
```
/theme-preview?theme=tech-minimal
```

## 🎯 Best Practices

### Couleurs
- **Primary** : Couleur principale (CTA, liens, éléments interactifs)
- **Secondary** : Couleur secondaire (accents, backgrounds)
- **Accent** : Couleur d'accentuation (badges, alertes)
- Toujours vérifier le contraste WCAG 2.1 AA (4.5:1 minimum)

### Typographie
- **Headings** : Police pour les titres (impact visuel)
- **Body** : Police pour le corps de texte (lisibilité)
- Utiliser Google Fonts ou polices système
- Éviter > 2-3 polices différentes

### Sections Homepage
- **Recommandé** : 5-8 sections maximum
- **Ordre optimal** :
  1. Hero (slider ou video)
  2. Featured products ou Categories
  3. Promo banner ou Countdown
  4. Social proof ou Features
  5. Newsletter ou Contact

### Performance
- Utiliser lazy loading automatique (déjà implémenté)
- Limiter les images lourdes (< 500 KB)
- Préférer formats modernes (WebP, AVIF)

## 🚀 Marketplace

Les thèmes peuvent être :
- **Gratuits** : Téléchargement libre
- **Premium** : Achat via Stripe (prix défini par le designer)

### Revenue Split
- **70%** pour le designer créateur
- **30%** pour la plateforme Quelyos

### Validation
Tous les thèmes soumis passent par une validation manuelle avant publication :
- Conformité JSON Schema
- Qualité design (screenshots)
- Fonctionnement sections
- Accessibilité WCAG 2.1 AA

## 📚 Documentation Complète

- **Catalogue sections** : `.claude/SECTIONS_CATALOGUE.md`
- **Marketplace setup** : `.claude/MARKETPLACE_SETUP.md`
- **AI Generator** : `.claude/AI_THEME_GENERATOR_SETUP.md`

## 🆘 Support

Questions ou bugs ? Ouvrir une issue sur GitHub :
```
https://github.com/salmenktata/quelyosSuite/issues
```
