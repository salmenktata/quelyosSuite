# Navigation Modulaire - Guide de Démarrage Rapide

## 🚀 Ajouter un module avec navigation par tabs (5 étapes)

### Étape 1 : Configuration du module (`modules.ts`)

```typescript
// src/config/modules.ts
{
  id: 'mon-module',
  name: 'Mon Module',
  shortName: 'Module',
  icon: MyIcon,
  color: 'text-blue-600',
  bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  description: 'Description',
  basePath: '/mon-module',
  sections: [
    {
      title: 'Dashboard',
      tabGroup: 'Dashboard',  // ← IMPORTANT : nom du tab
      items: [
        { name: 'Vue d\'ensemble', path: '/mon-module', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Configuration',
      tabGroup: 'Configuration',  // ← IMPORTANT : nom du tab
      items: [
        { name: 'Paramètres', path: '/mon-module/settings', icon: Settings },
      ],
    },
  ],
}
```

### Étape 2 : Hook de tabs (`useMonModuleTabs.ts`)

```typescript
// src/hooks/useMonModuleTabs.ts
import { useState, useEffect, useMemo } from 'react'
import type { MenuSection } from '@/config/modules'

export function useMonModuleTabs(
  sections: MenuSection[],
  currentPath: string
) {
  const detectActiveTab = (): string => {
    // Mapper URL → Tab
    if (currentPath === '/mon-module') return 'Dashboard'
    if (currentPath.startsWith('/mon-module/settings')) return 'Configuration'
    return 'Dashboard'
  }

  const [activeTab, setActiveTab] = useState(detectActiveTab())

  useEffect(() => {
    setActiveTab(detectActiveTab())
  }, [currentPath])

  const visibleSections = useMemo(() => {
    return sections.filter(section => section.tabGroup === activeTab)
  }, [sections, activeTab])

  return { activeTab, setActiveTab, visibleSections }
}
```

### Étape 3 : Import du hook dans `ModularLayout.tsx`

```typescript
// src/components/ModularLayout.tsx
import { useMonModuleTabs } from '../hooks/useMonModuleTabs'

// Dans le composant
const {
  activeTab: monModuleActiveTab,
  setActiveTab: setMonModuleActiveTab,
  visibleSections: monModuleVisibleSections
} = useMonModuleTabs(
  currentModule.sections,
  location.pathname
)
```

### Étape 4 : Ajouter les tabs dans `ModularLayout.tsx`

```tsx
// src/components/ModularLayout.tsx

// AVANT le {children} dans <main>
{currentModule.id === 'mon-module' && (
  <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
    <div className="px-4 sm:px-6 lg:px-8">
      <SectionTabs
        moduleId="mon-module"
        tabs={[
          { id: 'Dashboard', label: 'Dashboard', count: 1 },
          { id: 'Configuration', label: 'Configuration', count: 3 }
        ]}
        activeTab={monModuleActiveTab}
        onTabChange={setMonModuleActiveTab}
      />
    </div>
  </div>
)}
```

### Étape 5 : Utiliser `visibleSections` dans la sidebar

```tsx
// src/components/ModularLayout.tsx

// Dans le .map de la sidebar
{(
  currentModule.id === 'mon-module'
    ? monModuleVisibleSections
    : currentModule.sections
).map((section, index) => (
  // ...
))}
```

---

## 🎯 Ajouter un sous-menu déroulant

```typescript
// src/config/modules.ts
{
  name: 'Paramètres',
  path: '/mon-module/settings',
  icon: Settings,
  subItems: [
    { name: 'Général', path: '/mon-module/settings' },
    { name: 'Sécurité', path: '/mon-module/settings/security' },
    { separator: true, name: 'AVANCÉ' },  // Séparateur
    { name: 'API', path: '/mon-module/settings/api' },
  ],
}
```

---

## 📝 Template Complet Copier/Coller

### Hook (`useMonModuleTabs.ts`)

```typescript
import { useState, useEffect, useMemo } from 'react'
import type { MenuSection } from '@/config/modules'

export function useMonModuleTabs(
  sections: MenuSection[],
  currentPath: string
) {
  const detectActiveTab = (): string => {
    // TODO: Adapter selon vos routes
    if (currentPath === '/mon-module') return 'Tab1'
    if (currentPath.startsWith('/mon-module/section2')) return 'Tab2'
    if (currentPath.startsWith('/mon-module/section3')) return 'Tab3'
    return 'Tab1'
  }

  const [activeTab, setActiveTab] = useState(detectActiveTab())

  useEffect(() => {
    setActiveTab(detectActiveTab())
  }, [currentPath])

  const visibleSections = useMemo(() => {
    return sections.filter(section => section.tabGroup === activeTab)
  }, [sections, activeTab])

  return { activeTab, setActiveTab, visibleSections }
}
```

### Config (`modules.ts`)

```typescript
{
  id: 'mon-module',
  name: 'Mon Module',
  shortName: 'Module',
  icon: Package,  // TODO: Choisir icône
  color: 'text-blue-600',  // TODO: Choisir couleur
  bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  description: 'Description courte',
  basePath: '/mon-module',
  sections: [
    {
      title: 'Section 1',
      tabGroup: 'Tab1',
      items: [
        { name: 'Item 1', path: '/mon-module', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Section 2',
      tabGroup: 'Tab2',
      items: [
        { name: 'Item 2', path: '/mon-module/item2', icon: FileText },
      ],
    },
    {
      title: 'Section 3',
      tabGroup: 'Tab3',
      items: [
        { name: 'Item 3', path: '/mon-module/item3', icon: Settings },
      ],
    },
  ],
}
```

### Integration ModularLayout (`ModularLayout.tsx`)

```tsx
// 1. Import
import { useMonModuleTabs } from '../hooks/useMonModuleTabs'

// 2. Utiliser le hook
const {
  activeTab: monModuleActiveTab,
  setActiveTab: setMonModuleActiveTab,
  visibleSections: monModuleVisibleSections
} = useMonModuleTabs(currentModule.sections, location.pathname)

// 3. Ajouter les tabs (avant {children})
{currentModule.id === 'mon-module' && (
  <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
    <div className="px-4 sm:px-6 lg:px-8">
      <SectionTabs
        moduleId="mon-module"
        tabs={[
          { id: 'Tab1', label: 'Label Tab 1', count: 1 },
          { id: 'Tab2', label: 'Label Tab 2', count: 1 },
          { id: 'Tab3', label: 'Label Tab 3', count: 1 }
        ]}
        activeTab={monModuleActiveTab}
        onTabChange={setMonModuleActiveTab}
      />
    </div>
  </div>
)}

// 4. Utiliser visibleSections dans la sidebar
{(currentModule.id === 'mon-module' ? monModuleVisibleSections : currentModule.sections).map((section, index) => (
  <div
    key={section.title}
    className="animate-fade-in"
    style={{ animationDelay: `${index * 30}ms` }}
  >
    {/* ... */}
  </div>
))}
```

---

## 🔍 Checklist de validation

Après implémentation :

- [ ] Les tabs s'affichent correctement
- [ ] Cliquer sur un tab filtre la sidebar
- [ ] L'URL change quand on clique sur un item
- [ ] L'URL direct `/mon-module/item2` active le bon tab
- [ ] Le menu actif est highlighted
- [ ] Mode collapsed fonctionne (tooltip)
- [ ] Mode compact fonctionne
- [ ] Favoris fonctionnels (étoile)
- [ ] Mode dark/light OK
- [ ] Responsive mobile OK

---

## ⚠️ Erreurs courantes

### Tabs ne changent pas la sidebar

**Problème** : Les tabs s'affichent mais la sidebar ne change pas

**Solution** : Vérifier que vous utilisez `visibleSections` au lieu de `currentModule.sections`

```tsx
// ❌ MAUVAIS
{currentModule.sections.map((section) => (...))}

// ✅ BON
{(currentModule.id === 'mon-module' ? monModuleVisibleSections : currentModule.sections).map((section) => (...))}
```

### Tab actif incorrect

**Problème** : Le mauvais tab est actif

**Solution** : Vérifier la logique `detectActiveTab()` dans le hook

```typescript
// Vérifier que les routes matchent
if (currentPath.startsWith('/mon-module/settings')) return 'Configuration'
```

### Sections vides

**Problème** : Aucun item dans la sidebar

**Solution** : Vérifier que `tabGroup` correspond aux IDs des tabs

```typescript
// Config
tabGroup: 'Configuration'

// Tabs
{ id: 'Configuration', label: 'Config', count: 3 }
//     ↑ Doit matcher exactement
```

---

## 📚 Ressources

- Documentation complète : `.claude/NAVIGATION_SYSTEM.md`
- Exemple de référence : Module Finance (`useFinanceTabs.ts`)
- Config modules : `src/config/modules.ts`
- Layout principal : `src/components/ModularLayout.tsx`

---

**Temps estimé d'implémentation** : 15-20 minutes par module
