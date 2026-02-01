# Système de Navigation Modulaire - Dashboard Client

## 📋 Vue d'ensemble

Ce document décrit le système de navigation avancé développé pour le module Finance et généralisable à tous les modules du Dashboard et du Backoffice.

**Caractéristiques principales** :
- Navigation par **tabs horizontaux** (sections principales)
- Sidebar **toujours dépliée** avec menus et sous-menus
- **Quick Access** (favoris et pages récentes)
- **Modes d'affichage** : normal, compact, collapsed
- **Routing automatique** selon l'URL active
- **Animations fluides** et transitions

---

## 🏗️ Architecture

### 1. Structure des fichiers

```
dashboard-client/src/
├── components/
│   ├── ModularLayout.tsx          # Layout principal avec sidebar
│   └── navigation/
│       ├── SectionTabs.tsx        # Tabs horizontaux en haut
│       ├── SidebarMenuItem.tsx    # Item de menu avec sous-items
│       ├── QuickAccess.tsx        # Favoris et pages récentes
│       ├── TopNavbar.tsx          # Barre supérieure
│       └── AppLauncher.tsx        # Lanceur d'applications
├── config/
│   └── modules.ts                 # Configuration des modules
└── hooks/
    ├── useFinanceTabs.ts          # Hook spécifique Finance
    ├── useDetectModule.ts         # Détection module actif
    ├── useActiveRoute.ts          # Détection route active
    ├── useMenuState.ts            # État des menus
    └── useNavigationHistory.tsx   # Favoris et historique
```

---

## 🎯 Configuration d'un Module

### 1. Structure de base (`modules.ts`)

```typescript
export interface Module {
  id: ModuleId
  name: string              // Nom complet
  shortName: string         // Nom court
  icon: ComponentType       // Icône Lucide
  color: string            // Couleur texte (ex: 'text-emerald-600')
  bgColor: string          // Couleur fond (ex: 'bg-emerald-100 dark:bg-emerald-900/30')
  description: string      // Description courte
  basePath: string        // Route de base (ex: '/finance')
  sections: MenuSection[] // Sections du menu
}

export interface MenuSection {
  title: string           // Titre de la section (ex: 'Configuration')
  tabGroup?: string       // Nom du tab (OPTIONNEL, pour navigation par tabs)
  items: MenuItem[]       // Items du menu
}

export interface MenuItem {
  name: string                    // Nom affiché
  path?: string                   // Route (optionnel si subItems)
  icon: ComponentType             // Icône Lucide
  subItems?: SubMenuItem[]        // Sous-items (menu déroulant)
}

export interface SubMenuItem {
  name: string            // Nom affiché
  path?: string          // Route
  icon?: ComponentType   // Icône (optionnel)
  badge?: string        // Badge (ex: 'NEW', '3')
  separator?: boolean   // Si true, affiche un séparateur avec titre
}
```

### 2. Exemple : Module Finance avec Tabs

```typescript
{
  id: 'finance',
  name: 'Finance',
  shortName: 'Finance',
  icon: Wallet,
  color: 'text-emerald-600',
  bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  description: 'Trésorerie & Budgets',
  basePath: '/finance',
  sections: [
    // Section 1 : Tableau de bord
    {
      title: 'Tableau de bord',
      tabGroup: 'Tableau de bord',  // ← Lié au tab "Tableau de bord"
      items: [
        { name: 'Vue d\'ensemble', path: '/finance', icon: LayoutDashboard },
      ],
    },
    // Section 2 : Comptes
    {
      title: 'Comptes',
      tabGroup: 'Comptes',  // ← Lié au tab "Comptes"
      items: [
        { name: 'Tous les comptes', path: '/finance/accounts', icon: Wallet },
        { name: 'Portefeuilles', path: '/finance/portfolios', icon: Briefcase },
      ],
    },
    // Section 3 : Configuration avec sous-menu
    {
      title: 'Configuration',
      tabGroup: 'Configuration',
      items: [
        { name: 'Catégories', path: '/finance/categories', icon: Tag },
        { name: 'Fournisseurs', path: '/finance/suppliers', icon: Users },
        {
          name: 'Paramètres',        // ← Item avec sous-menu
          path: '/finance/settings',
          icon: Settings,
          subItems: [
            { name: 'Vue d\'ensemble', path: '/finance/settings' },
            { name: 'TVA & fiscalité', path: '/finance/settings/tva', icon: Receipt },
            { name: 'Flux de paiement', path: '/finance/settings/flux', icon: CreditCard },
          ],
        },
      ],
    },
  ],
}
```

### 3. Exemple : Module sans Tabs (navigation classique)

```typescript
{
  id: 'crm',
  name: 'CRM',
  shortName: 'CRM',
  icon: UserCircle,
  color: 'text-violet-600',
  bgColor: 'bg-violet-100 dark:bg-violet-900/30',
  description: 'Clients & Ventes',
  basePath: '/crm',
  sections: [
    {
      title: 'Pipeline',
      // Pas de tabGroup → navigation classique
      items: [
        { name: 'Pipeline', path: '/crm/pipeline', icon: Kanban },
        { name: 'Opportunités', path: '/crm/leads', icon: Target },
      ],
    },
    {
      title: 'Clients',
      items: [
        { name: 'Clients', path: '/crm/customers', icon: UserCircle },
        { name: 'Catégories', path: '/crm/customer-categories', icon: Tag },
      ],
    },
  ],
}
```

---

## 🔧 Composants Clés

### 1. ModularLayout (Layout principal)

**Fichier** : `src/components/ModularLayout.tsx`

**Responsabilités** :
- Afficher la sidebar avec navigation
- Gérer le module actif
- Gérer les modes collapsed/compact
- Afficher le contenu principal (`children`)

**Props** :
```typescript
interface ModularLayoutProps {
  children: React.ReactNode  // Contenu de la page
}
```

**Utilisation dans une page** :
```tsx
// Pas besoin d'importer ModularLayout dans les pages
// Il est automatiquement appliqué via le routing

export default function MyPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <h1>Ma Page</h1>
      {/* ... */}
    </div>
  )
}
```

### 2. SectionTabs (Tabs horizontaux)

**Fichier** : `src/components/navigation/SectionTabs.tsx`

**Utilisation** : Navigation par sections (uniquement si `tabGroup` défini)

**Props** :
```typescript
interface SectionTabsProps {
  moduleId: string          // ID du module (ex: 'finance')
  tabs: Tab[]              // Liste des tabs
  activeTab: string        // Tab actif
  onTabChange: (id: string) => void
}

interface Tab {
  id: string      // ID du tab (correspond au tabGroup)
  label: string   // Label affiché
  count: number   // Nombre d'items dans ce tab
}
```

**Exemple d'intégration dans ModularLayout** :
```tsx
{currentModule.id === 'finance' && (
  <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
    <div className="px-4 sm:px-6 lg:px-8">
      <SectionTabs
        moduleId="finance"
        tabs={[
          { id: 'Tableau de bord', label: 'Tableau de bord', count: 1 },
          { id: 'Comptes', label: 'Comptes', count: 2 },
          { id: 'Transactions', label: 'Transactions', count: 2 },
          { id: 'Configuration', label: 'Configuration', count: 7 }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  </div>
)}
```

### 3. SidebarMenuItem (Item de menu)

**Fichier** : `src/components/navigation/SidebarMenuItem.tsx`

**Responsabilités** :
- Afficher un item simple (avec icône + label)
- Afficher un item avec sous-menu déroulant (toujours déplié)
- Gérer l'état actif (highlight route active)
- Mode collapsed : tooltip au hover
- Bouton favoris (étoile)

**Props** :
```typescript
interface SidebarMenuItemProps {
  item: MenuItem
  isActive: (path: string) => boolean
  moduleColor: string
  openMenus: Set<string>
  onToggleMenu: (name: string) => void
  isCollapsed?: boolean
  isCompact?: boolean
  isFavorite?: boolean
  onToggleFavorite?: () => void
}
```

**Structure d'affichage** :
```
Item sans sous-menu :
  [Icône] Nom du menu

Item avec sous-menu (toujours déplié) :
  [Icône] Nom du menu
    ├─ Sous-item 1
    ├─ Sous-item 2
    └─ Sous-item 3
```

**Séparateurs dans sous-menu** :
```typescript
{
  name: 'Paramètres',
  icon: Settings,
  subItems: [
    { name: 'Général', path: '/settings/general' },
    { separator: true, name: 'AVANCÉ' },  // ← Séparateur
    { name: 'Sécurité', path: '/settings/security' },
  ],
}
```

### 4. QuickAccess (Favoris)

**Fichier** : `src/components/navigation/QuickAccess.tsx`

**Responsabilités** :
- Afficher les favoris (étoile)
- Section sticky en haut de la sidebar
- Max 3 favoris affichés

**Props** :
```typescript
interface QuickAccessProps {
  favorites: string[]       // Paths des favoris
  recentPages: string[]     // Paths pages récentes (non utilisé)
  moduleColor: string       // Couleur du module
  isActive: (path: string) => boolean
}
```

---

## 🎨 Hooks Personnalisés

### 1. useFinanceTabs

**Fichier** : `src/hooks/useFinanceTabs.ts`

**Rôle** : Gérer les tabs Finance et filtrer les sections visibles selon le tab actif.

**Signature** :
```typescript
function useFinanceTabs(
  sections: MenuSection[],
  currentPath: string
): {
  activeTab: string
  setActiveTab: (tab: string) => void
  visibleSections: MenuSection[]
}
```

**Utilisation** :
```tsx
const { activeTab, setActiveTab, visibleSections } = useFinanceTabs(
  currentModule.sections,
  location.pathname
)

// visibleSections contient uniquement les sections du tab actif
```

**Logique** :
1. Détecte le tab actif selon l'URL
2. Filtre les sections pour ne garder que celles avec `tabGroup === activeTab`
3. Permet de changer de tab manuellement

### 2. useDetectModule

**Fichier** : `src/hooks/useDetectModule.ts`

**Rôle** : Détecter le module actif selon l'URL.

**Signature** :
```typescript
function useDetectModule(
  modules: Module[],
  pathname: string
): Module
```

**Exemple** :
```typescript
const detectedModule = useDetectModule(MODULES, location.pathname)
// Si pathname = '/finance/accounts' → retourne le module 'finance'
```

### 3. useActiveRoute

**Fichier** : `src/hooks/useActiveRoute.ts`

**Rôle** : Déterminer si une route est active (pour highlight menu).

**Signature** :
```typescript
function useActiveRoute(): {
  isActive: (path: string) => boolean
}
```

**Logique** :
- Route exacte : `pathname === path`
- Sous-route : `pathname.startsWith(path + '/')`

### 4. useNavigationHistory

**Fichier** : `src/hooks/useNavigationHistory.tsx`

**Rôle** : Gérer les favoris et l'historique de navigation.

**Signature** :
```typescript
function useNavigationHistory(): {
  favorites: string[]
  recentPages: string[]
  toggleFavorite: (path: string) => void
  isFavorite: (path: string) => boolean
}
```

**Stockage** : `localStorage` (clé : `navigation_favorites`, `navigation_recent`)

---

## 📐 Patterns et Conventions

### 1. Noms de Tabs

**Convention** : Utiliser des noms explicites et cohérents

```typescript
// ✅ BON
tabGroup: 'Tableau de bord'
tabGroup: 'Configuration'
tabGroup: 'Rapports'

// ❌ MAUVAIS
tabGroup: 'dashboard'  // Anglais mélangé au français
tabGroup: 'Config'     // Abréviation
```

### 2. Organisation des Sections

**Ordre recommandé** :
1. **Tableau de bord** (vue d'ensemble)
2. **Sections métier** (comptes, transactions, etc.)
3. **Rapports** (analytics, statistiques)
4. **Configuration** (paramètres, settings)

### 3. Sous-menus vs Items directs

**Quand utiliser un sous-menu** :
- Plus de 3 items liés à une même fonctionnalité
- Regroupement logique (ex: Paramètres → TVA, Devise, Flux)
- Éviter la surcharge de la sidebar

**Exemple** :
```typescript
// ✅ Avec sous-menu (regroupement logique)
{
  name: 'Paramètres',
  path: '/finance/settings',
  icon: Settings,
  subItems: [
    { name: 'Vue d\'ensemble', path: '/finance/settings' },
    { name: 'TVA & fiscalité', path: '/finance/settings/tva' },
    { name: 'Flux de paiement', path: '/finance/settings/flux' },
  ],
}

// ❌ Sans sous-menu (surcharge)
{ name: 'Vue d\'ensemble', path: '/finance/settings', icon: Settings },
{ name: 'TVA & fiscalité', path: '/finance/settings/tva', icon: Receipt },
{ name: 'Flux de paiement', path: '/finance/settings/flux', icon: CreditCard },
```

### 4. Badges et Séparateurs

**Badges** : Indicateurs visuels (nouveau, count, etc.)
```typescript
{ name: 'Notifications', path: '/notifications', badge: '3' }
{ name: 'API v2', path: '/api-v2', badge: 'NEW' }
```

**Séparateurs** : Groupes dans un sous-menu
```typescript
subItems: [
  { name: 'Général', path: '/settings/general' },
  { name: 'Apparence', path: '/settings/appearance' },
  { separator: true, name: 'AVANCÉ' },  // ← Séparateur
  { name: 'Sécurité', path: '/settings/security' },
  { name: 'Intégrations', path: '/settings/integrations' },
]
```

---

## 🚀 Guide d'implémentation

### Étape 1 : Ajouter la config du module

**Fichier** : `src/config/modules.ts`

```typescript
{
  id: 'mon-module',
  name: 'Mon Module',
  shortName: 'Module',
  icon: MyIcon,
  color: 'text-blue-600',
  bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  description: 'Description courte',
  basePath: '/mon-module',
  sections: [
    {
      title: 'Dashboard',
      tabGroup: 'Vue d\'ensemble',  // Si tabs activés
      items: [
        { name: 'Accueil', path: '/mon-module', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Configuration',
      tabGroup: 'Configuration',
      items: [
        { name: 'Paramètres', path: '/mon-module/settings', icon: Settings },
      ],
    },
  ],
}
```

### Étape 2 : Créer un hook de tabs (si nécessaire)

**Fichier** : `src/hooks/useMonModuleTabs.ts`

```typescript
import { useState, useEffect, useMemo } from 'react'
import type { MenuSection } from '@/config/modules'

export function useMonModuleTabs(
  sections: MenuSection[],
  currentPath: string
) {
  // Détecter le tab actif selon l'URL
  const detectActiveTab = (): string => {
    if (currentPath === '/mon-module') return 'Vue d\'ensemble'
    if (currentPath.startsWith('/mon-module/config')) return 'Configuration'
    return 'Vue d\'ensemble'
  }

  const [activeTab, setActiveTab] = useState(detectActiveTab())

  useEffect(() => {
    setActiveTab(detectActiveTab())
  }, [currentPath])

  // Filtrer les sections visibles selon le tab actif
  const visibleSections = useMemo(() => {
    return sections.filter(section => section.tabGroup === activeTab)
  }, [sections, activeTab])

  return { activeTab, setActiveTab, visibleSections }
}
```

### Étape 3 : Intégrer les tabs dans ModularLayout

**Fichier** : `src/components/ModularLayout.tsx`

```tsx
// Import du hook
import { useMonModuleTabs } from '../hooks/useMonModuleTabs'

// Dans le composant
const { activeTab: monModuleActiveTab, setActiveTab: setMonModuleActiveTab, visibleSections: monModuleVisibleSections } = useMonModuleTabs(
  currentModule.sections,
  location.pathname
)

// Affichage des tabs
{currentModule.id === 'mon-module' && (
  <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
    <div className="px-4 sm:px-6 lg:px-8">
      <SectionTabs
        moduleId="mon-module"
        tabs={[
          { id: 'Vue d\'ensemble', label: 'Vue d\'ensemble', count: 1 },
          { id: 'Configuration', label: 'Configuration', count: 3 }
        ]}
        activeTab={monModuleActiveTab}
        onTabChange={setMonModuleActiveTab}
      />
    </div>
  </div>
)}

// Sidebar : utiliser visibleSections au lieu de currentModule.sections
{(currentModule.id === 'mon-module' ? monModuleVisibleSections : currentModule.sections).map((section) => (
  // ...
))}
```

### Étape 4 : Créer les pages

**Structure de routing** :
```
src/pages/mon-module/
├── page.tsx                    # /mon-module
├── config/
│   ├── page.tsx               # /mon-module/config
│   ├── settings/
│   │   └── page.tsx           # /mon-module/config/settings
│   └── advanced/
│       └── page.tsx           # /mon-module/config/advanced
```

---

## 🎯 Checklist Implémentation

### Pour un nouveau module AVEC tabs :

- [ ] Ajouter la config dans `modules.ts` avec `tabGroup` sur chaque section
- [ ] Créer le hook `useMonModuleTabs.ts`
- [ ] Intégrer le hook dans `ModularLayout.tsx`
- [ ] Ajouter le bloc `SectionTabs` dans `ModularLayout.tsx`
- [ ] Utiliser `visibleSections` au lieu de `currentModule.sections`
- [ ] Créer les pages correspondantes
- [ ] Tester la navigation entre tabs
- [ ] Tester le routing direct (URL)

### Pour un nouveau module SANS tabs :

- [ ] Ajouter la config dans `modules.ts` (sans `tabGroup`)
- [ ] Créer les pages correspondantes
- [ ] Tester la navigation sidebar
- [ ] Tester le routing direct (URL)

---

## 🌟 Bonnes Pratiques

### 1. Cohérence visuelle
- Toujours utiliser les icônes **Lucide React**
- Respecter la palette de couleurs par module
- Utiliser les classes Tailwind existantes

### 2. Performance
- Les hooks utilisent `useMemo` pour éviter re-renders inutiles
- La sidebar est sticky (pas de re-mount)
- Animations CSS optimisées

### 3. Accessibilité
- Tous les boutons ont des `aria-label`
- Navigation au clavier supportée
- Contraste WCAG AA respecté (light/dark)

### 4. Responsive
- Sidebar escamotable sur mobile
- Tabs scrollables horizontalement
- Breakpoints cohérents

### 5. État persistant
- Favoris : `localStorage`
- Mode collapsed : `localStorage`
- Mode compact : `localStorage`

---

## 📊 Exemple Complet : Module E-commerce

```typescript
{
  id: 'ecommerce',
  name: 'E-commerce',
  shortName: 'Shop',
  icon: ShoppingCart,
  color: 'text-purple-600',
  bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  description: 'Boutique en ligne',
  basePath: '/ecommerce',
  sections: [
    {
      title: 'Vue d\'ensemble',
      tabGroup: 'Dashboard',
      items: [
        { name: 'Tableau de bord', path: '/ecommerce', icon: LayoutDashboard },
        { name: 'Analytics', path: '/ecommerce/analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'Ventes',
      tabGroup: 'Ventes',
      items: [
        { name: 'Commandes', path: '/ecommerce/orders', icon: ShoppingCart },
        { name: 'Clients', path: '/ecommerce/customers', icon: Users },
      ],
    },
    {
      title: 'Catalogue',
      tabGroup: 'Catalogue',
      items: [
        { name: 'Produits', path: '/ecommerce/products', icon: Package },
        { name: 'Catégories', path: '/ecommerce/categories', icon: Tag },
        {
          name: 'Collections',
          icon: FolderOpen,
          subItems: [
            { name: 'Toutes', path: '/ecommerce/collections' },
            { name: 'Nouveautés', path: '/ecommerce/collections/new', badge: 'NEW' },
            { name: 'Promotions', path: '/ecommerce/collections/promo' },
          ],
        },
      ],
    },
    {
      title: 'Configuration',
      tabGroup: 'Configuration',
      items: [
        {
          name: 'Paramètres',
          path: '/ecommerce/settings',
          icon: Settings,
          subItems: [
            { name: 'Général', path: '/ecommerce/settings' },
            { separator: true, name: 'PAIEMENT' },
            { name: 'Modes de paiement', path: '/ecommerce/settings/payments' },
            { name: 'Livraison', path: '/ecommerce/settings/shipping' },
            { separator: true, name: 'AVANCÉ' },
            { name: 'Taxes', path: '/ecommerce/settings/taxes' },
            { name: 'Intégrations', path: '/ecommerce/settings/integrations' },
          ],
        },
      ],
    },
  ],
}
```

---

## 🔄 Migration d'un Module Existant

### Étape 1 : Analyser la structure actuelle

Identifier :
- Les sections principales → deviendront des **tabs**
- Les items de menu → resteront dans la **sidebar**
- Les regroupements logiques → utiliser **subItems**

### Étape 2 : Planifier les tabs

Déterminer les grandes catégories :
- Dashboard, Ventes, Catalogue, Configuration, etc.

### Étape 3 : Refactoriser la config

1. Ajouter `tabGroup` sur chaque section
2. Regrouper les items liés en `subItems`
3. Ajouter badges si nécessaire

### Étape 4 : Créer le hook de tabs

Copier `useFinanceTabs.ts` et adapter la logique de détection.

### Étape 5 : Tester

- Navigation entre tabs
- Routing direct (URL → tab correct)
- Highlight du menu actif
- Mode collapsed/compact

---

## 🛠️ Debugging

### Problème : Tab actif incorrect

**Vérifier** :
1. La logique `detectActiveTab()` dans le hook
2. Les `tabGroup` dans `modules.ts`
3. Les paths exacts des routes

### Problème : Sections vides

**Vérifier** :
1. Le filtre `visibleSections` retourne bien des items
2. Les `tabGroup` correspondent aux IDs des tabs

### Problème : Menu ne s'ouvre pas

**Vérifier** :
1. `subItems` est bien défini
2. Au moins 1 `subItem` a un `path`

---

## 📚 Références

### Fichiers clés
- `src/config/modules.ts` - Configuration modules
- `src/components/ModularLayout.tsx` - Layout principal
- `src/components/navigation/SectionTabs.tsx` - Tabs horizontaux
- `src/components/navigation/SidebarMenuItem.tsx` - Items menu
- `src/hooks/useFinanceTabs.ts` - Hook tabs Finance

### Design System
- Icônes : Lucide React
- Styles : Tailwind CSS
- Animations : `animate-fade-in` (custom)

---

## ✅ Validation

Avant de merger une implémentation de navigation :

- [ ] Config `modules.ts` complète et cohérente
- [ ] Hook de tabs créé (si navigation par tabs)
- [ ] Integration dans `ModularLayout.tsx`
- [ ] Toutes les routes fonctionnent
- [ ] Navigation au clavier OK
- [ ] Mode dark/light OK
- [ ] Responsive mobile OK
- [ ] Favoris fonctionnels
- [ ] Transitions fluides
- [ ] Aucune erreur console

---

**Date de création** : 2026-02-01
**Version** : 1.0
**Module de référence** : Finance
