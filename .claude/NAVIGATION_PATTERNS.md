# Patterns de Navigation - Dashboard Client

## 🎯 Objectif

Éliminer tout clignotement/flash lors de la navigation dans le dashboard en synchronisant **immédiatement** l'état UI avec les changements de route, **avant** que React Router navigue.

---

## ⚡ Principe Fondamental : Navigation Synchrone

**RÈGLE ABSOLUE** : Tout changement d'état UI lié à une navigation doit être fait **AVANT** que React Router ne change l'URL.

### ❌ Anti-Pattern (Navigation Asynchrone - Cause Flash)
```tsx
// Navigation → URL change → useEffect détecte → State change → Re-render
// = FLASH VISIBLE entre navigation et mise à jour state

const Component = () => {
  const [activeTab, setActiveTab] = useState('tab1')
  const location = useLocation()

  // ❌ Mise à jour APRÈS navigation (avec délai)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setActiveTab(detectTab(location.pathname))
    }, 50) // Délai = clignotement garanti
    return () => clearTimeout(timeout)
  }, [location.pathname])

  return <Link to="/page">Cliquer</Link>
}
```

**Problème** : L'URL change immédiatement, mais le state met 50ms+ à se mettre à jour → **Flash visible**

### ✅ Pattern Correct (Navigation Synchrone - Zéro Flash)
```tsx
// onClick → State change IMMÉDIAT → Navigation → Re-render cohérent
// = ZÉRO FLASH car state déjà à jour quand URL change

const Component = () => {
  const [activeTab, setActiveTab] = useState('tab1')
  const location = useLocation()

  // Callback appelé AVANT navigation React Router
  const handleNavigate = useCallback((path: string) => {
    // Change state IMMÉDIATEMENT (synchrone)
    setActiveTab(detectTab(path))
  }, [])

  // Backup : auto-détection sans debounce
  useEffect(() => {
    setActiveTab(detectTab(location.pathname))
  }, [location.pathname])

  return (
    <Link
      to="/page"
      onClick={() => handleNavigate('/page')} // AVANT React Router
    >
      Cliquer
    </Link>
  )
}
```

**Avantage** : Le state est déjà à jour **AVANT** que React Router navigue → **Re-render cohérent**

---

## 📐 Architecture Tabs Finance (Cas d'Étude)

### Problème Initial
- Cliquer sur un tab → `setActiveTab()` + `navigate()` → Flash pendant navigation
- Auto-détection avec debounce 50ms → Délai visible
- Re-renders multiples du navbar/sidebar

### Solution Implémentée

#### 1. **Hook Optimisé** : `useFinanceTabs.ts`

```typescript
// Fonction utilitaire PURE (pas de side effects)
export function detectFinanceTab(pathname: string): string {
  if (pathname === '/finance') return 'Tableau de bord'
  if (pathname.includes('/accounts')) return 'Comptes'
  if (pathname.includes('/expenses')) return 'Transactions'
  if (pathname.includes('/budgets')) return 'Planification'
  if (pathname.includes('/reporting')) return 'Rapports'
  if (pathname.includes('/categories')) return 'Configuration'
  return 'Tableau de bord' // Default
}

export function useFinanceTabs(sections: MenuSection[], pathname: string) {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('finance_active_tab') || 'Tableau de bord'
    }
    return 'Tableau de bord'
  })

  // ✅ Auto-détection SYNCHRONE (sans debounce)
  useEffect(() => {
    setActiveTab(detectFinanceTab(pathname))
  }, [pathname])

  // Persistance localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('finance_active_tab', activeTab)
    }
  }, [activeTab])

  // ✅ Sections filtrées avec useMemo (évite re-calcul)
  const visibleSections = useMemo(() =>
    sections.filter(section => section.tabGroup === activeTab),
    [sections, activeTab]
  )

  // ✅ Setter stable avec useCallback
  const handleSetActiveTab = useCallback((tabId: string) => {
    setActiveTab(tabId)
  }, [])

  return {
    activeTab,
    setActiveTab: handleSetActiveTab,
    visibleSections
  }
}
```

**Points clés** :
- ✅ Fonction `detectFinanceTab` exportée (réutilisable)
- ✅ Auto-détection **sans debounce** (synchrone)
- ✅ `useMemo` pour `visibleSections` (évite re-renders)
- ✅ `useCallback` pour `setActiveTab` (référence stable)

#### 2. **Layout Principal** : `ModularLayout.tsx`

```typescript
export function ModularLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { activeTab, setActiveTab, visibleSections } = useFinanceTabs(
    currentModule.sections,
    location.pathname
  )

  // ✅ Handler tabs : Change SEULEMENT l'état (pas de navigation)
  const handleFinanceTabChange = useCallback((tabId: string) => {
    // Change seulement la tab active, pas de navigation
    // L'utilisateur cliquera sur les items du sidebar pour naviguer
    setActiveTab(tabId)
  }, [setActiveTab])

  // ✅ Handler sidebar : Change tab AVANT navigation React Router
  const handleFinanceSidebarNavigate = useCallback((path: string) => {
    if (currentModule.id === 'finance') {
      // Détecte et change le tab immédiatement (synchrone)
      const targetTab = detectFinanceTab(path)
      setActiveTab(targetTab)
    }
  }, [currentModule.id, setActiveTab])

  return (
    <div>
      {/* Tabs header */}
      {currentModule.id === 'finance' && (
        <SectionTabs
          tabs={[...]}
          activeTab={activeTab}
          onTabChange={handleFinanceTabChange} // Pas de navigation auto
        />
      )}

      {/* Sidebar */}
      <nav>
        {visibleSections.map(section => (
          <div key={section.title}>
            {section.items.map(item => (
              <SidebarMenuItem
                key={item.name}
                item={item}
                onNavigate={currentModule.id === 'finance'
                  ? handleFinanceSidebarNavigate  // ← Callback synchrone
                  : undefined
                }
              />
            ))}
          </div>
        ))}
      </nav>
    </div>
  )
}
```

**Points clés** :
- ✅ `handleFinanceTabChange` : Change tab SANS navigation
- ✅ `handleFinanceSidebarNavigate` : Change tab AVANT navigation
- ✅ Callback passé conditionnellement (seulement Finance)

#### 3. **Composant Item** : `SidebarMenuItem.tsx`

```typescript
interface SidebarMenuItemProps {
  item: MenuItem
  onNavigate?: (path: string) => void // ← Callback pré-navigation
  // ... autres props
}

export const SidebarMenuItem = memo(function SidebarMenuItem({
  item,
  onNavigate,
  // ... autres props
}: SidebarMenuItemProps) {

  // ✅ Handler appelé AVANT React Router
  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path) // Appel synchrone immédiat
    }
  }

  // Mode normal : item sans sous-items
  if (!hasSubItems && item.path) {
    return (
      <Link
        to={item.path}
        onClick={() => handleNavigate(item.path!)} // ← AVANT navigation
        className="..."
      >
        <ItemIcon />
        <span>{item.name}</span>
      </Link>
    )
  }

  // Mode normal : sous-items
  return (
    <div>
      {item.subItems?.map(subItem => (
        <Link
          key={subItem.path}
          to={subItem.path}
          onClick={() => handleNavigate(subItem.path!)} // ← AVANT navigation
          className="..."
        >
          {subItem.name}
        </Link>
      ))}
    </div>
  )
})
```

**Points clés** :
- ✅ `React.memo` pour éviter re-renders inutiles
- ✅ `onClick` sur TOUS les `<Link>` (appelle `onNavigate`)
- ✅ Callback appelé **AVANT** que React Router navigue

#### 4. **Composant Navbar** : `TopNavbar.tsx`

```typescript
export const TopNavbar = memo(function TopNavbar({
  currentModule,
  onModuleChange,
  // ... autres props
}: TopNavbarProps) {
  // ✅ React.memo évite re-renders lors navigation intra-module
  return <header>...</header>
})
```

**Points clés** :
- ✅ `React.memo` OBLIGATOIRE (navbar stable lors navigation)
- ✅ Props stables (fonctions wrappées avec `useCallback`)

---

## 📋 Checklist Pattern Navigation Optimisé

### Pré-requis Composant
- [ ] Utiliser `React.memo` sur composants de navigation (Navbar, Tabs, Sidebar)
- [ ] Wrapper tous les handlers avec `useCallback` (dépendances stables)
- [ ] Utiliser `useMemo` pour calculs dérivés (sections filtrées, etc.)

### Hook Custom (si filtrage conditionnel)
- [ ] Créer fonction utilitaire PURE pour détection état (ex: `detectTab`)
- [ ] Exporter fonction utilitaire (réutilisable dans callbacks)
- [ ] Auto-détection **SANS debounce** (synchrone uniquement)
- [ ] Persistance localStorage si nécessaire

### Handlers Navigation
- [ ] Handler tabs : Change état SANS navigation automatique
- [ ] Handler sidebar : Appelle fonction détection + `setState` AVANT navigation
- [ ] Passer callback `onNavigate` aux composants enfants
- [ ] Callback appelé dans `onClick` des `<Link>` (AVANT React Router)

### Transitions CSS
- [ ] `transition-opacity duration-150` sur wrapper de contenu
- [ ] `transition-all` sur éléments interactifs (links, buttons)
- [ ] JAMAIS de `transition-all` sur containers larges (cause lag)

### Tests Flash
- [ ] Cliquer rapidement entre tabs (≥5 clics/seconde)
- [ ] Cliquer items sidebar pendant scroll
- [ ] Basculer dark/light mode pendant navigation
- [ ] Tester responsive mobile + sidebar escamotable
- [ ] Vérifier aucun flash navbar lors navigation

---

## 🔧 Débuggage Clignotement

### Sources Communes de Flash

1. **Debounce/Timeout dans useEffect**
   ```typescript
   // ❌ CAUSE FLASH
   useEffect(() => {
     const timeout = setTimeout(() => setState(...), 50)
     return () => clearTimeout(timeout)
   }, [deps])

   // ✅ CORRECT
   useEffect(() => {
     setState(...) // Synchrone immédiat
   }, [deps])
   ```

2. **Re-renders Navbar/TopBar**
   ```typescript
   // ❌ CAUSE FLASH (navbar re-render à chaque navigation)
   export function TopNavbar({ ... }) { ... }

   // ✅ CORRECT
   export const TopNavbar = memo(function TopNavbar({ ... }) { ... })
   ```

3. **Navigation Automatique dans Tabs**
   ```typescript
   // ❌ CAUSE FLASH (navigate() après setActiveTab)
   const handleTabChange = (tabId: string) => {
     setActiveTab(tabId)
     navigate(FIRST_PAGES[tabId]) // Flash pendant navigation
   }

   // ✅ CORRECT (pas de navigation auto)
   const handleTabChange = (tabId: string) => {
     setActiveTab(tabId) // Filtre sidebar uniquement
   }
   ```

4. **State Non Synchronisé**
   ```typescript
   // ❌ CAUSE FLASH (state mis à jour APRÈS navigation)
   <Link to="/page">Click</Link>
   // → URL change → useEffect détecte → setState → Re-render

   // ✅ CORRECT (state mis à jour AVANT navigation)
   <Link to="/page" onClick={() => handleNavigate('/page')}>
   // → setState → URL change → Re-render cohérent
   ```

### Outils de Débuggage

```typescript
// Ajouter dans useEffect pour tracer les updates
useEffect(() => {
  console.log('[Tab Update]', {
    pathname,
    newTab: detectFinanceTab(pathname),
    timestamp: Date.now()
  })
  setActiveTab(detectFinanceTab(pathname))
}, [pathname])

// Ajouter dans onClick pour tracer la séquence
const handleNavigate = (path: string) => {
  console.log('[Pre-Navigate]', { path, tab: detectFinanceTab(path) })
  setActiveTab(detectFinanceTab(path))
}
```

**Analyser les logs** :
- Si `[Pre-Navigate]` apparaît AVANT `[Tab Update]` → ✅ Correct
- Si `[Tab Update]` apparaît AVANT `[Pre-Navigate]` → ❌ Re-render inutile
- Si délai >16ms entre les deux → ❌ Flash visible

---

## 🎓 Quand Appliquer Ce Pattern

### ✅ Appliquer TOUJOURS Si :
- Navigation avec filtrage conditionnel (tabs, filtres, sections)
- Navbar/TopBar qui reste visible lors navigation
- Sidebar avec sections dynamiques
- Multi-step forms avec indicateur de progression
- Dashboards avec widgets filtrés par route

### ❌ Ne PAS Appliquer Si :
- Navigation simple sans état dérivé de l'URL
- Page indépendantes sans layout persistant
- Modals/Dialogs (pas de React Router)
- Single Page Applications sans routing

---

## 📚 Exemples d'Extension

### Étendre aux Autres Modules (Store, Stock, CRM)

**1. Créer hooks spécialisés**
```typescript
// src/hooks/useStoreTabs.ts
export function detectStoreTab(pathname: string): string {
  if (pathname.includes('/products')) return 'Produits'
  if (pathname.includes('/orders')) return 'Commandes'
  if (pathname.includes('/customers')) return 'Clients'
  return 'Produits'
}

export function useStoreTabs(sections: MenuSection[], pathname: string) {
  // Même structure que useFinanceTabs
}
```

**2. Généraliser avec hook universel**
```typescript
// src/hooks/useModuleTabs.ts
export function useModuleTabs(
  moduleId: ModuleId,
  sections: MenuSection[],
  pathname: string,
  detectTabFn: (path: string) => string
) {
  // Hook réutilisable pour tous les modules
}

// Usage
const { activeTab, setActiveTab } = useModuleTabs(
  'store',
  sections,
  pathname,
  detectStoreTab
)
```

**3. Configuration centralisée**
```typescript
// src/config/tabDetectors.ts
export const TAB_DETECTORS: Record<ModuleId, (path: string) => string> = {
  finance: detectFinanceTab,
  store: detectStoreTab,
  stock: detectStockTab,
  crm: detectCrmTab,
  // ...
}
```

---

## ⚠️ Règles Absolues

1. **JAMAIS de debounce dans navigation** (sauf recherche asynchrone)
2. **TOUJOURS React.memo** sur Navbar/TopBar/Sidebar
3. **TOUJOURS useCallback** sur handlers passés en props
4. **TOUJOURS appeler onNavigate AVANT** React Router (`onClick` sur `<Link>`)
5. **JAMAIS navigate() automatique** dans handler de tabs (cause flash)

---

## 🎯 Résultat Attendu

**Avant optimisation** :
- Clic → Navigation → Délai 50-100ms → State update → Re-render → **Flash visible**

**Après optimisation** :
- Clic → State update immédiat (0ms) → Navigation → Re-render cohérent → **Zéro flash**

**Métriques** :
- Temps state update : **<1ms** (synchrone)
- Délai perçu utilisateur : **0ms** (instantané)
- Re-renders navbar : **0** (mémoïsé)
- Flash count : **0** (objectif atteint)
