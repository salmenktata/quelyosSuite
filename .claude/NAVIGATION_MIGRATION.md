# Migration Navigation Modulaire - Guide de Migration

## 📋 Objectif

Migrer un module existant (sans tabs) vers le nouveau système de navigation avec tabs horizontaux.

---

## 🎯 Vue d'ensemble de la migration

**Avant** : Navigation classique (sidebar uniquement)
```
Module CRM
├── Pipeline
│   ├── Pipeline
│   └── Opportunités
├── Clients
│   ├── Clients
│   └── Catégories
└── Configuration
    └── Paramètres
```

**Après** : Navigation par tabs + sidebar
```
Tabs : [ Dashboard | Clients | Configuration ]

Tab "Clients" actif → Sidebar :
├── Clients
│   ├── Tous les clients
│   └── Catégories
└── Facturation
    ├── Factures
    └── Paiements
```

---

## 📊 Étapes de migration

### Étape 1 : Analyser la structure actuelle

**Questions à se poser** :
1. Quelles sont les grandes catégories fonctionnelles ?
2. Combien de sections dans la sidebar ?
3. Y a-t-il des regroupements logiques ?

**Exemple CRM** :
- Pipeline → Tab "Dashboard"
- Clients + Facturation → Tab "Clients"
- Configuration → Tab "Configuration"

### Étape 2 : Définir les tabs

**Recommandations** :
- 3 à 6 tabs maximum
- Noms courts et explicites
- Regrouper les fonctionnalités liées

**Template de réflexion** :
```
Tab 1 : Dashboard/Vue d'ensemble (1-2 sections)
Tab 2-4 : Fonctionnalités métier (2-4 sections chacun)
Tab 5 : Configuration (1-2 sections)
```

### Étape 3 : Refactoriser `modules.ts`

**Avant** :
```typescript
sections: [
  {
    title: 'Pipeline',
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
]
```

**Après** :
```typescript
sections: [
  {
    title: 'Pipeline',
    tabGroup: 'Dashboard',  // ← AJOUTÉ
    items: [
      { name: 'Pipeline', path: '/crm/pipeline', icon: Kanban },
      { name: 'Opportunités', path: '/crm/leads', icon: Target },
    ],
  },
  {
    title: 'Clients',
    tabGroup: 'Clients',  // ← AJOUTÉ
    items: [
      { name: 'Clients', path: '/crm/customers', icon: UserCircle },
      { name: 'Catégories', path: '/crm/customer-categories', icon: Tag },
    ],
  },
]
```

### Étape 4 : Créer le hook de tabs

**Fichier** : `src/hooks/useCrmTabs.ts`

```typescript
import { useState, useEffect, useMemo } from 'react'
import type { MenuSection } from '@/config/modules'

export function useCrmTabs(
  sections: MenuSection[],
  currentPath: string
) {
  const detectActiveTab = (): string => {
    // Mapper les routes existantes → tabs
    if (currentPath === '/crm' || currentPath.startsWith('/crm/pipeline') || currentPath.startsWith('/crm/leads')) {
      return 'Dashboard'
    }
    if (currentPath.startsWith('/crm/customers') || currentPath.startsWith('/crm/invoices') || currentPath.startsWith('/crm/payments')) {
      return 'Clients'
    }
    if (currentPath.startsWith('/crm/settings')) {
      return 'Configuration'
    }
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

### Étape 5 : Intégrer dans `ModularLayout.tsx`

**1. Import du hook**
```tsx
import { useCrmTabs } from '../hooks/useCrmTabs'
```

**2. Utiliser le hook**
```tsx
const {
  activeTab: crmActiveTab,
  setActiveTab: setCrmActiveTab,
  visibleSections: crmVisibleSections
} = useCrmTabs(currentModule.sections, location.pathname)
```

**3. Ajouter les tabs**
```tsx
{currentModule.id === 'crm' && (
  <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
    <div className="px-4 sm:px-6 lg:px-8">
      <SectionTabs
        moduleId="crm"
        tabs={[
          { id: 'Dashboard', label: 'Dashboard', count: 2 },
          { id: 'Clients', label: 'Clients', count: 4 },
          { id: 'Configuration', label: 'Configuration', count: 1 }
        ]}
        activeTab={crmActiveTab}
        onTabChange={setCrmActiveTab}
      />
    </div>
  </div>
)}
```

**4. Utiliser visibleSections**
```tsx
{(currentModule.id === 'crm' ? crmVisibleSections : currentModule.sections).map((section, index) => (
  // ...
))}
```

---

## 🔄 Exemple Complet : Migration CRM

### Avant (navigation classique)

```typescript
{
  id: 'crm',
  name: 'CRM',
  sections: [
    { title: 'Pipeline', items: [/* ... */] },
    { title: 'Clients', items: [/* ... */] },
    { title: 'Facturation', items: [/* ... */] },
    { title: 'Configuration', items: [/* ... */] },
  ],
}
```

### Après (navigation par tabs)

**Config** :
```typescript
{
  id: 'crm',
  name: 'CRM',
  sections: [
    { title: 'Pipeline', tabGroup: 'Dashboard', items: [/* ... */] },
    { title: 'Clients', tabGroup: 'Clients', items: [/* ... */] },
    { title: 'Facturation', tabGroup: 'Clients', items: [/* ... */] },
    { title: 'Configuration', tabGroup: 'Configuration', items: [/* ... */] },
  ],
}
```

**Hook (`useCrmTabs.ts`)** :
```typescript
const detectActiveTab = (): string => {
  if (currentPath === '/crm' || currentPath.startsWith('/crm/pipeline')) {
    return 'Dashboard'
  }
  if (currentPath.startsWith('/crm/customers') || currentPath.startsWith('/crm/invoices')) {
    return 'Clients'
  }
  if (currentPath.startsWith('/crm/settings')) {
    return 'Configuration'
  }
  return 'Dashboard'
}
```

**Tabs** :
```tsx
tabs={[
  { id: 'Dashboard', label: 'Dashboard', count: 2 },
  { id: 'Clients', label: 'Clients', count: 4 },
  { id: 'Configuration', label: 'Configuration', count: 1 }
]}
```

---

## 📐 Décisions de Design

### Combien de tabs ?

**Recommandations** :
- **3-4 tabs** : Idéal (navigation claire)
- **5-6 tabs** : Maximum acceptable
- **7+ tabs** : Trop, repenser la structure

**Exemple** :
- **Finance** : 6 tabs (Dashboard, Comptes, Transactions, Planification, Rapports, Configuration)
- **CRM** : 3 tabs (Dashboard, Clients, Configuration)
- **Store** : 4 tabs (Dashboard, Catalogue, Promotions, Configuration)

### Comment nommer les tabs ?

**Bonnes pratiques** :
- Noms courts (1-2 mots)
- Explicites (pas d'abréviations)
- En français (cohérence UI)
- Ordre logique (Dashboard → Métier → Config)

**Exemples** :
```
✅ BON                      ❌ MAUVAIS
- Dashboard                - DB
- Clients                  - Gestion Clients
- Configuration            - Config
- Rapports                 - Reports (anglais)
```

### Regrouper ou séparer ?

**Règle** : Regrouper les sections liées fonctionnellement

**Exemple** :
```
✅ BON                              ❌ MAUVAIS
Tab "Ventes" :                      Tab "Commandes" :
├── Commandes                       ├── Commandes
├── Factures
├── Paiements                       Tab "Factures" :
                                    ├── Factures

                                    Tab "Paiements" :
                                    ├── Paiements
```

---

## 🧪 Tests de Migration

### Checklist de validation

- [ ] **Routes directes** : `/crm/customers` active le bon tab
- [ ] **Navigation sidebar** : Cliquer sur un item fonctionne
- [ ] **Navigation tabs** : Cliquer sur un tab filtre la sidebar
- [ ] **Highlight actif** : Le menu actif est surligné
- [ ] **Mode collapsed** : Tooltip au hover
- [ ] **Mode compact** : Spacing réduit
- [ ] **Favoris** : Étoile visible et fonctionnelle
- [ ] **Dark/Light** : Contraste OK dans les 2 modes
- [ ] **Mobile** : Sidebar escamotable
- [ ] **Performance** : Pas de lag au changement de tab

### Tests de régression

**Avant la migration, vérifier** :
1. Toutes les routes existantes fonctionnent toujours
2. Les liens internes vers le module fonctionnent
3. Les liens externes (autre module → CRM) fonctionnent
4. Le breadcrumb est correct
5. Le titre de page est correct

---

## 🚧 Pièges à éviter

### 1. Oublier `tabGroup`

**Symptôme** : Sidebar vide, aucun item visible

**Solution** : Ajouter `tabGroup` sur TOUTES les sections
```typescript
sections: [
  { title: 'Section 1', tabGroup: 'Tab1', items: [...] },  // ✅
  { title: 'Section 2', items: [...] },                    // ❌ Manque tabGroup
]
```

### 2. IDs tabs incohérents

**Symptôme** : Tab ne filtre pas la sidebar

**Solution** : Vérifier que `tabGroup === tab.id`
```typescript
// Config
tabGroup: 'Configuration'

// Tabs
{ id: 'Configuration', label: 'Config', count: 1 }
//     ↑ Doit matcher exactement
```

### 3. Oublier `visibleSections`

**Symptôme** : Sidebar ne change pas quand on clique sur un tab

**Solution** : Utiliser `visibleSections` dans le `.map()`
```tsx
{(currentModule.id === 'crm' ? crmVisibleSections : currentModule.sections).map(...)}
```

### 4. Logique `detectActiveTab()` incorrecte

**Symptôme** : Mauvais tab actif après navigation

**Solution** : Tester tous les chemins possibles
```typescript
// ❌ MAUVAIS - trop générique
if (currentPath.startsWith('/crm')) return 'Dashboard'

// ✅ BON - spécifique
if (currentPath === '/crm' || currentPath.startsWith('/crm/pipeline')) {
  return 'Dashboard'
}
```

---

## 📊 Plan de Migration par Module

### Priorité 1 : Modules complexes
- **Finance** : ✅ Migré (référence)
- **Store** : À migrer (7 sections → 4 tabs)
- **Stock** : À migrer (3 sections → 2-3 tabs)
- **HR** : À migrer (5 sections → 3-4 tabs)

### Priorité 2 : Modules moyens
- **CRM** : À migrer (4 sections → 3 tabs)
- **Marketing** : À migrer (3 sections → 2 tabs)

### Priorité 3 : Modules simples
- **POS** : À migrer (3 sections → 2-3 tabs)
- **Support** : Garder navigation classique (1 section)

---

## 🔧 Template de Migration

### 1. Créer le hook

**Fichier** : `src/hooks/use[Module]Tabs.ts`

```typescript
import { useState, useEffect, useMemo } from 'react'
import type { MenuSection } from '@/config/modules'

export function use[Module]Tabs(
  sections: MenuSection[],
  currentPath: string
) {
  const detectActiveTab = (): string => {
    // TODO: Mapper routes → tabs
    if (currentPath === '/[module]') return 'Tab1'
    if (currentPath.startsWith('/[module]/section2')) return 'Tab2'
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

### 2. Modifier `ModularLayout.tsx`

```tsx
// 1. Import
import { use[Module]Tabs } from '../hooks/use[Module]Tabs'

// 2. Hook
const {
  activeTab: [module]ActiveTab,
  setActiveTab: set[Module]ActiveTab,
  visibleSections: [module]VisibleSections
} = use[Module]Tabs(currentModule.sections, location.pathname)

// 3. Tabs
{currentModule.id === '[module]' && (
  <SectionTabs
    moduleId="[module]"
    tabs={[/* TODO */]}
    activeTab={[module]ActiveTab}
    onTabChange={set[Module]ActiveTab}
  />
)}

// 4. Sidebar
{(currentModule.id === '[module]' ? [module]VisibleSections : currentModule.sections).map(...)}
```

---

## 📚 Ressources

- **Documentation complète** : `.claude/NAVIGATION_SYSTEM.md`
- **Guide de démarrage** : `.claude/NAVIGATION_QUICKSTART.md`
- **Référence Finance** : `src/hooks/useFinanceTabs.ts`
- **Config modules** : `src/config/modules.ts`

---

**Temps estimé de migration** : 30-45 minutes par module
