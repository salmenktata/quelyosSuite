# Système de Navigation Modulaire - Dashboard Backoffice

**Version** : 2.0
**Dernière mise à jour** : 2026-02-01
**Statut** : ✅ Production

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Modules avec Tabs](#modules-avec-tabs)
4. [Ajouter un Nouveau Module](#ajouter-un-nouveau-module)
5. [Troubleshooting](#troubleshooting)
6. [Cas Pratique : Module Maintenance](#cas-pratique-module-maintenance)

---

## Vue d'ensemble

Le système de navigation du Dashboard utilise une **architecture modulaire avec tabs** pour organiser les fonctionnalités en sections logiques.

### Concepts Clés

- **Module** : Domaine fonctionnel (Finance, Stock, CRM, Maintenance, etc.)
- **Section** : Groupe de pages dans un module (ex: "Équipements", "Interventions")
- **Tab** : Onglet cliquable représentant une section
- **Sidebar** : Menu latéral filtré selon le tab actif

### Modules Disponibles (10)

| ID | Nom | Tabs | Description |
|----|-----|------|-------------|
| `home` | Accueil | 2 | Tableau de bord général |
| `finance` | Finance | 5 | Trésorerie & Budgets |
| `store` | Boutique | 5 | E-commerce |
| `stock` | Stock | 5 | Gestion des stocks |
| `crm` | CRM | 4 | Relation client |
| `marketing` | Marketing | 4 | Campagnes marketing |
| `hr` | RH | 3 | Ressources humaines |
| `pos` | POS | 3 | Point de vente |
| `support` | Support | 2 | Helpdesk |
| `maintenance` | GMAO | 5 | Maintenance & équipements |

---

## Architecture

### Fichiers Clés

```
dashboard-client/src/
├── config/
│   ├── modules.ts              # ⭐ Configuration des modules
│   └── layout.ts               # Classes CSS layout
├── components/
│   ├── ModularLayout.tsx       # ⭐ Layout principal avec tabs
│   └── navigation/
│       ├── SectionTabs.tsx     # Barre d'onglets
│       ├── SidebarMenuItem.tsx # Items du menu latéral
│       └── TopNavbar.tsx       # Barre supérieure
└── hooks/
    ├── useMaintenanceTabs.ts   # ⭐ Hook tabs Maintenance
    ├── useFinanceTabs.ts       # Hook tabs Finance
    └── ...                     # Un hook par module avec tabs
```

### Flux de Navigation

```
┌─────────────────────────────────────────────────────────┐
│ 1. URL : /maintenance/categories                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 2. useDetectModule() détecte module = 'maintenance'     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 3. detectMaintenanceTab() détecte tab = 'Configuration' │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 4. useMaintenanceTabs() filtre sections visibles        │
│    → visibleSections = sections avec tabGroup =         │
│      'Configuration'                                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Affichage :                                          │
│    - SectionTabs : 5 tabs (Configuration actif)         │
│    - Sidebar : 2 items (Catégories, Paramètres)         │
└─────────────────────────────────────────────────────────┘
```

---

## Modules avec Tabs

### Principe

Un module avec tabs utilise le **système de filtrage par `tabGroup`** :

1. Chaque section a un `tabGroup`
2. Le hook détecte le tab actif selon l'URL
3. La sidebar affiche **seulement** les sections du tab actif
4. L'utilisateur peut changer de tab via la barre d'onglets

### Exemple : Module Maintenance

**Configuration** (`modules.ts`) :

```typescript
{
  id: 'maintenance',
  name: 'GMAO',
  sections: [
    {
      title: 'Tableau de bord',
      tabGroup: 'Tableau de bord',  // ← Tab 1
      items: [
        { name: 'Vue d\'ensemble', path: '/maintenance' }
      ]
    },
    {
      title: 'Équipements',
      tabGroup: 'Équipements',      // ← Tab 2
      items: [
        { name: 'Liste Équipements', path: '/maintenance/equipment' },
        { name: 'Équipements Critiques', path: '/maintenance/equipment/critical' }
      ]
    },
    {
      title: 'Configuration',
      tabGroup: 'Configuration',    // ← Tab 5
      items: [
        { name: 'Catégories', path: '/maintenance/categories' },
        { name: 'Paramètres', path: '/maintenance/settings' }
      ]
    }
    // ... autres sections
  ]
}
```

**Hook de détection** (`useMaintenanceTabs.ts`) :

```typescript
export function detectMaintenanceTab(path: string): string {
  if (path === '/maintenance') return 'Tableau de bord'
  if (path.startsWith('/maintenance/equipment')) return 'Équipements'
  if (path.startsWith('/maintenance/requests') || path.startsWith('/maintenance/calendar'))
    return 'Interventions'
  if (path.startsWith('/maintenance/reports') || path.startsWith('/maintenance/costs'))
    return 'Analyse'
  if (path.startsWith('/maintenance/categories') || path.startsWith('/maintenance/settings'))
    return 'Configuration'
  return 'Tableau de bord'
}

export function useMaintenanceTabs(sections: MenuSection[], currentPath: string) {
  const [activeTab, setActiveTab] = useState(() => detectMaintenanceTab(currentPath))

  // Filtrer sections selon tab actif
  const visibleSections = useMemo(() => {
    return sections.filter(section => {
      if (!section.tabGroup) return true
      return section.tabGroup === activeTab
    })
  }, [sections, activeTab])

  return { activeTab, setActiveTab, visibleSections }
}
```

**Intégration** (`ModularLayout.tsx`) :

```typescript
// 1. Déclarer le hook
const {
  activeTab: maintenanceActiveTab,
  setActiveTab: setMaintenanceActiveTab,
  visibleSections: maintenanceVisibleSections
} = useMaintenanceTabs(currentModule.sections, location.pathname)

// 2. Handlers
const handleMaintenanceTabChange = useCallback((tabId: string) => {
  setMaintenanceActiveTab(tabId)
}, [setMaintenanceActiveTab])

const handleMaintenanceSidebarNavigate = useCallback((path: string) => {
  if (currentModule.id === 'maintenance') {
    const targetTab = detectMaintenanceTab(path)
    setMaintenanceActiveTab(targetTab)
  }
}, [currentModule.id, setMaintenanceActiveTab])

// 3. Filtrer sidebar
const sectionsToDisplay = currentModule.id === 'maintenance'
  ? maintenanceVisibleSections
  : currentModule.sections

// 4. Passer au SectionTabs
<SectionTabs
  moduleId="maintenance"
  tabs={generateTabsFromSections(currentModule.sections)}
  activeTab={maintenanceActiveTab}
  onTabChange={handleMaintenanceTabChange}
/>
```

---

## Ajouter un Nouveau Module

### Checklist Complète

- [ ] **1. Configuration** (`config/modules.ts`)
- [ ] **2. Hook Tabs** (`hooks/useModuleTabs.ts`)
- [ ] **3. Intégration Layout** (`ModularLayout.tsx`)
- [ ] **4. Routes** (`App.tsx`)
- [ ] **5. Permissions** (`hooks/usePermissions.ts`)
- [ ] **6. Éditions** (`config/editions.ts`)

### Exemple : Ajouter Module "Projects"

#### 1. Configuration (`modules.ts`)

```typescript
export type ModuleId = 'home' | 'finance' | /* ... */ | 'projects'

export const MODULES: Module[] = [
  // ... autres modules
  {
    id: 'projects',
    name: 'Projets',
    shortName: 'Projets',
    icon: FolderKanban,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    description: 'Gestion de projets',
    basePath: '/projects',
    sections: [
      {
        title: 'Tableau de bord',
        tabGroup: 'Tableau de bord',
        items: [
          { name: 'Vue d\'ensemble', path: '/projects', icon: LayoutDashboard }
        ]
      },
      {
        title: 'Projets',
        tabGroup: 'Projets',
        items: [
          { name: 'Tous les Projets', path: '/projects/all', icon: FolderKanban },
          { name: 'Archivés', path: '/projects/archived', icon: Archive }
        ]
      },
      {
        title: 'Configuration',
        tabGroup: 'Configuration',
        items: [
          { name: 'Paramètres', path: '/projects/settings', icon: Settings }
        ]
      }
    ]
  }
]
```

#### 2. Hook Tabs (`hooks/useProjectsTabs.ts`)

```typescript
import { useMemo, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import type { MenuSection } from '@/config/modules'

export function detectProjectsTab(path: string): string {
  if (path === '/projects') return 'Tableau de bord'
  if (path.startsWith('/projects/all') || path.startsWith('/projects/archived'))
    return 'Projets'
  if (path.startsWith('/projects/settings')) return 'Configuration'
  return 'Tableau de bord'
}

export function useProjectsTabs(sections: MenuSection[], currentPath: string) {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState(() => detectProjectsTab(currentPath))

  useEffect(() => {
    const newTab = detectProjectsTab(location.pathname)
    setActiveTab(newTab)
  }, [location.pathname])

  const visibleSections = useMemo(() => {
    return sections.filter(section => {
      if (!section.tabGroup) return true
      return section.tabGroup === activeTab
    })
  }, [sections, activeTab])

  return { activeTab, setActiveTab, visibleSections }
}
```

#### 3. Intégration Layout (`ModularLayout.tsx`)

**3a. Import du hook**

```typescript
import { useProjectsTabs, detectProjectsTab } from '../hooks/useProjectsTabs'
```

**3b. Déclarer le hook** (après les autres hooks)

```typescript
// Projects tabs logic
const {
  activeTab: projectsActiveTab,
  setActiveTab: setProjectsActiveTab,
  visibleSections: projectsVisibleSections
} = useProjectsTabs(currentModule.sections, location.pathname)

const handleProjectsTabChange = useCallback((tabId: string) => {
  setProjectsActiveTab(tabId)
}, [setProjectsActiveTab])

const handleProjectsSidebarNavigate = useCallback((path: string) => {
  if (currentModule.id === 'projects') {
    const targetTab = detectProjectsTab(path)
    setProjectsActiveTab(targetTab)
  }
}, [currentModule.id, setProjectsActiveTab])
```

**3c. Ajouter au filtrage sidebar** (ligne ~460)

```typescript
const sectionsToDisplay = (
  currentModule.id === 'finance' ? visibleSections
  : currentModule.id === 'home' ? homeVisibleSections
  // ... autres modules
  : currentModule.id === 'projects' ? projectsVisibleSections
  : currentModule.sections
).map((section, index) => (
  // ...
))
```

**3d. Ajouter handler navigation** (ligne ~500)

```typescript
onNavigate={
  currentModule.id === 'finance' ? handleFinanceSidebarNavigate
  : currentModule.id === 'home' ? handleHomeSidebarNavigate
  // ... autres modules
  : currentModule.id === 'projects' ? handleProjectsSidebarNavigate
  : undefined
}
```

**3e. Ajouter bloc SectionTabs** (après les autres modules)

```typescript
{/* Projects Tabs - Navigation par sections */}
{currentModule.id === 'projects' && (
  <div className={`${MODULE_HEADER_CLASSES} fixed ${isNavbarVisible ? 'top-14' : 'top-0'} left-0 right-0 z-40 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-[transform,opacity] duration-200 ease-out flex items-center shadow-sm`}>
    <div className="flex-1">
      <SectionTabs
        moduleId="projects"
        moduleName={currentModule.name}
        moduleDescription={currentModule.description}
        moduleColor={currentModule.color}
        moduleBgColor={currentModule.bgColor}
        moduleIcon={currentModule.icon}
        isSidebarCollapsed={isSidebarCollapsed}
        onModuleClick={() => setIsAppLauncherOpen(!isAppLauncherOpen)}
        tabs={generateTabsFromSections(currentModule.sections)}
        activeTab={projectsActiveTab}
        onTabChange={handleProjectsTabChange}
      />
    </div>
  </div>
)}
```

#### 4. Routes (`App.tsx`)

**4a. Lazy imports**

```typescript
// Lazy loaded pages - Projects
const ProjectsDashboard = lazy(() => import('./pages/projects/Dashboard'))
const ProjectsList = lazy(() => import('./pages/projects/ProjectsList'))
const ProjectsArchived = lazy(() => import('./pages/projects/Archived'))
const ProjectsSettings = lazy(() => import('./pages/projects/Settings'))
```

**4b. Routes**

```typescript
{/* Projects */}
<Route
  path="/projects"
  element={
    <ProtectedRoute>
      <Suspense fallback={<LoadingFallback />}>
        <ModuleErrorBoundary module="projects">
          <ProjectsDashboard />
        </ModuleErrorBoundary>
      </Suspense>
    </ProtectedRoute>
  }
/>
<Route
  path="/projects/all"
  element={
    <ProtectedRoute>
      <Suspense fallback={<LoadingFallback />}>
        <ModuleErrorBoundary module="projects">
          <ProjectsList />
        </ModuleErrorBoundary>
      </Suspense>
    </ProtectedRoute>
  }
/>
{/* ... autres routes */}
```

#### 5. Permissions (`hooks/usePermissions.ts`)

```typescript
type ModuleId = 'home' | 'finance' | /* ... */ | 'projects'

const MODULE_GROUP_MAP: Record<ModuleId, string[]> = {
  // ... autres modules
  'projects': ['Quelyos Projects User', 'Quelyos Projects Manager'],
}
```

#### 6. Éditions (`config/editions.ts`)

```typescript
full: {
  // ...
  modules: ['home', 'finance', /* ... */, 'projects'],
}
```

---

## Troubleshooting

### Problème : Je ne vois que 2 tabs au lieu de 5

**Symptômes** :
- Sur `/maintenance/categories`, seulement "Tableau de bord" et "Configuration" visibles
- Tabs "Équipements", "Interventions", "Analyse" manquants

**Cause** : Cache navigateur ou serveur Vite pas à jour

**Solutions** :

```bash
# 1. Hard Refresh navigateur
Cmd+Shift+R (Mac) ou Ctrl+Shift+F5 (Windows)

# 2. Vérifier console navigateur (F12)
# Chercher des erreurs en rouge

# 3. Redémarrer Vite
cd dashboard-client
pnpm dev

# 4. Vider cache complètement
# Chrome DevTools > Application > Clear storage > Clear site data
```

### Problème : Menu latéral vide sur une page

**Symptômes** :
- Sur `/maintenance/equipment`, aucun item dans le sidebar

**Causes possibles** :

1. **tabGroup manquant dans modules.ts**
   ```typescript
   // ❌ MAUVAIS
   {
     title: 'Équipements',
     // tabGroup manquant !
     items: [...]
   }

   // ✅ BON
   {
     title: 'Équipements',
     tabGroup: 'Équipements',
     items: [...]
   }
   ```

2. **Détection tab incorrecte**
   ```typescript
   // ❌ MAUVAIS
   if (path.startsWith('/maintenance/equipement'))  // typo !

   // ✅ BON
   if (path.startsWith('/maintenance/equipment'))
   ```

3. **Hook pas intégré dans ModularLayout**
   - Vérifier que `maintenanceVisibleSections` est utilisé dans le filtrage

### Problème : Tabs ne changent pas au clic

**Cause** : Handler `handleMaintenanceTabChange` pas passé à `SectionTabs`

**Solution** :

```typescript
<SectionTabs
  // ...
  activeTab={maintenanceActiveTab}
  onTabChange={handleMaintenanceTabChange}  // ← OBLIGATOIRE
/>
```

### Problème : Tab actif incorrect après navigation

**Cause** : `detectMaintenanceTab()` ne couvre pas tous les paths

**Solution** : Vérifier la fonction de détection

```typescript
// ❌ MAUVAIS - path oublié
if (path.startsWith('/maintenance/equipment')) return 'Équipements'
// /maintenance/equipment/critical pas couvert !

// ✅ BON - tous les paths couverts
if (path.startsWith('/maintenance/equipment')) return 'Équipements'
// Couvre aussi /maintenance/equipment/critical, /maintenance/equipment/123, etc.
```

### Problème : Incohérence tabs ↔ sections

**Symptômes** :
- Tab "Analyse" actif mais sidebar affiche "Équipements"

**Cause** : Incohérence entre `detectMaintenanceTab()` et `tabGroup` dans `modules.ts`

**Test de cohérence** :

```bash
# Vérifier que tous les paths retournent le bon tabGroup
node <<'EOF'
const sections = [
  { title: 'Analyse', tabGroup: 'Analyse', items: [
    { path: '/maintenance/reports' },
    { path: '/maintenance/costs' }
  ]}
]

function detectMaintenanceTab(path) {
  if (path.startsWith('/maintenance/reports') || path.startsWith('/maintenance/costs'))
    return 'Analyse'
  return 'Tableau de bord'
}

sections.forEach(section => {
  section.items.forEach(item => {
    const detected = detectMaintenanceTab(item.path)
    const expected = section.tabGroup
    console.log(
      detected === expected ? '✅' : '❌',
      item.path, '→', detected,
      detected === expected ? '' : `(attendu: ${expected})`
    )
  })
})
EOF
```

---

## Cas Pratique : Module Maintenance

### Contexte

Module GMAO (Gestion de Maintenance Assistée par Ordinateur) avec 5 tabs :
1. Tableau de bord
2. Équipements
3. Interventions
4. Analyse
5. Configuration

### Implémentation Complète

**1. Configuration** (`modules.ts` lignes 576-628)

```typescript
{
  id: 'maintenance',
  name: 'GMAO',
  sections: [
    {
      title: 'Tableau de bord',
      tabGroup: 'Tableau de bord',
      items: [
        { name: 'Vue d\'ensemble', path: '/maintenance', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Équipements',
      tabGroup: 'Équipements',
      items: [
        { name: 'Liste Équipements', path: '/maintenance/equipment', icon: Wrench },
        { name: 'Équipements Critiques', path: '/maintenance/equipment/critical', icon: AlertTriangle }
      ]
    },
    {
      title: 'Interventions',
      tabGroup: 'Interventions',
      items: [
        { name: 'Demandes', path: '/maintenance/requests', icon: ClipboardList },
        { name: 'Urgences', path: '/maintenance/requests/emergency', icon: Bell },
        { name: 'Planning', path: '/maintenance/calendar', icon: Calendar }
      ]
    },
    {
      title: 'Analyse',
      tabGroup: 'Analyse',
      items: [
        { name: 'KPI & Rapports', path: '/maintenance/reports', icon: BarChart2 },
        { name: 'Coûts Maintenance', path: '/maintenance/costs', icon: Coins }
      ]
    },
    {
      title: 'Configuration',
      tabGroup: 'Configuration',
      items: [
        { name: 'Catégories', path: '/maintenance/categories', icon: Tag },
        { name: 'Paramètres', path: '/maintenance/settings', icon: Settings }
      ]
    }
  ]
}
```

**2. Hook** (`hooks/useMaintenanceTabs.ts`)

✅ Implémenté avec détection automatique

**3. Intégration** (`ModularLayout.tsx`)

✅ Hook déclaré lignes 320-336
✅ Handlers lignes 327-336
✅ Filtrage sidebar ligne 460
✅ Navigation handler ligne 500
✅ SectionTabs lignes 789-817

**4. Routes** (`App.tsx` lignes 64-76, 752-848)

✅ 13 routes déclarées
✅ 13 lazy imports

**5. Permissions** (`hooks/usePermissions.ts` ligne 31)

```typescript
'maintenance': ['Quelyos Maintenance User', 'Quelyos Maintenance Manager', 'Quelyos Maintenance Technician']
```

**6. Éditions** (`config/editions.ts` ligne 54)

```typescript
modules: ['home', 'finance', 'store', 'stock', 'crm', 'marketing', 'hr', 'pos', 'support', 'maintenance']
```

### Tests de Vérification

```bash
# 1. Vérifier détection tabs
node <<'EOF'
function detectMaintenanceTab(path) {
  if (path === '/maintenance') return 'Tableau de bord'
  if (path.startsWith('/maintenance/equipment')) return 'Équipements'
  if (path.startsWith('/maintenance/requests') || path.startsWith('/maintenance/calendar')) return 'Interventions'
  if (path.startsWith('/maintenance/reports') || path.startsWith('/maintenance/costs')) return 'Analyse'
  if (path.startsWith('/maintenance/categories') || path.startsWith('/maintenance/settings')) return 'Configuration'
  return 'Tableau de bord'
}

const paths = [
  '/maintenance',
  '/maintenance/equipment',
  '/maintenance/equipment/critical',
  '/maintenance/requests',
  '/maintenance/requests/emergency',
  '/maintenance/calendar',
  '/maintenance/reports',
  '/maintenance/costs',
  '/maintenance/categories',
  '/maintenance/settings'
]

console.log('Tab détecté pour chaque path:')
paths.forEach(p => console.log(`  ${p} → ${detectMaintenanceTab(p)}`))
EOF

# 2. Vérifier nombre de tabs
# Devrait afficher 5 tabs
```

### Comportement Attendu

| URL | Tab Actif | Sidebar Visible |
|-----|-----------|-----------------|
| `/maintenance` | Tableau de bord | Vue d'ensemble |
| `/maintenance/equipment` | Équipements | Liste Équipements, Équipements Critiques |
| `/maintenance/equipment/critical` | Équipements | Liste Équipements, Équipements Critiques |
| `/maintenance/requests` | Interventions | Demandes, Urgences, Planning |
| `/maintenance/calendar` | Interventions | Demandes, Urgences, Planning |
| `/maintenance/reports` | Analyse | KPI & Rapports, Coûts Maintenance |
| `/maintenance/costs` | Analyse | KPI & Rapports, Coûts Maintenance |
| `/maintenance/categories` | Configuration | Catégories, Paramètres |
| `/maintenance/settings` | Configuration | Catégories, Paramètres |

---

## Référence Rapide

### Commandes Utiles

```bash
# Redémarrer serveur dev
cd dashboard-client && pnpm dev

# Vérifier erreurs TypeScript
cd dashboard-client && pnpm type-check

# Vérifier erreurs ESLint
cd dashboard-client && pnpm lint

# Build production
cd dashboard-client && pnpm build
```

### Fichiers à Modifier

Quand tu ajoutes un nouveau module avec tabs :

```
✏️  config/modules.ts                (config module + sections)
✏️  hooks/useModuleTabs.ts            (hook tabs)
✏️  components/ModularLayout.tsx      (intégration hook + SectionTabs)
✏️  App.tsx                           (lazy imports + routes)
✏️  hooks/usePermissions.ts           (groupes de sécurité)
✏️  config/editions.ts                (éditions SaaS)
```

### Validation Checklist

- [ ] `generateTabsFromSections()` génère tous les tabs (tester dans console)
- [ ] `detectModuleTab()` couvre tous les paths
- [ ] Hook déclaré dans `ModularLayout.tsx`
- [ ] `visibleSections` utilisé dans filtrage sidebar
- [ ] Handler navigation passé à `SidebarMenuItem`
- [ ] `SectionTabs` a `activeTab` et `onTabChange`
- [ ] Routes déclarées dans `App.tsx`
- [ ] Permissions configurées
- [ ] Hard refresh navigateur après modifications

---

**Dernière révision** : 2026-02-01 (ajout module Maintenance)
**Contributeurs** : Claude Sonnet 4.5
**Contact** : Voir README.md
