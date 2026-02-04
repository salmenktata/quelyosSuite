# Commande /fix-nav - Vérification et Correction Navigation Modulaire

## 🎯 Objectif
Vérifier et corriger la navigation d'un module spécifique du dashboard, de manière exhaustive et systématique. Traite un module à la fois pour garantir qualité et cohérence.

## 📋 Workflow Étape par Étape

### Phase 1 : Sélection et Analyse Module (OBLIGATOIRE)

**Demander à l'utilisateur** :
```
Quel module souhaitez-vous auditer ?
1. Home (Tableau de bord général)
2. Finance (Comptabilité, budgets, trésorerie)
3. Store (E-commerce, produits, marketing)
4. Stock (Inventaire, mouvements, entrepôts)
5. CRM (Clients, leads, pipeline)
6. Marketing (Campagnes, emails, SMS)
7. HR (Employés, congés, contrats)
8. Support (Tickets, FAQ, satisfaction)
9. POS (Point de vente, sessions, analytics)
10. Maintenance (GMAO, équipements, demandes)
11. Tous (audit complet - prend 30+ min)
```

**Attendre réponse utilisateur avant de continuer.**

---

### Phase 2 : Audit Exhaustif du Module Sélectionné

Une fois le module choisi, lancer l'audit en **8 étapes** :

#### 2.1 État des Lieux Menu
```bash
cd dashboard-client
# Extraire tous les paths du module depuis config/modules.ts
grep -A 200 "id: '$MODULE_ID'" src/config/modules.ts | grep "path:" | cut -d"'" -f2
```

**Documenter** :
- Nombre total d'items menu
- Sections définies (ex: "Tableau de bord", "Gestion", "Rapports", "Configuration")
- Hiérarchie (items simples vs sub-items)
- Icônes utilisées (vérifier cohérence lucide-react)

---

#### 2.2 Vérification Routes Déclarées
Pour **chaque path du menu** :

1. **Vérifier route existe** :
   ```bash
   grep "path=\"$PATH\"" src/routes.tsx
   ```

2. **Vérifier import lazy** :
   ```typescript
   // Rechercher : const ComponentName = lazy(() => import('...'))
   grep -B 5 "path=\"$PATH\"" src/routes.tsx
   ```

3. **Vérifier fichier existe** :
   ```bash
   # Extraire path du lazy import et vérifier fichier
   test -f "src/pages/$EXTRACTED_PATH.tsx" && echo "OK" || echo "MISSING"
   ```

**Résultat** : Table markdown avec colonnes :
| Path Menu | Route Existe | Composant | Fichier Existe | Statut |
|-----------|--------------|-----------|----------------|--------|
| /module/page | ✅ | PageComponent | ✅ | OK |
| /module/missing | ❌ | - | - | **ERREUR** |

---

#### 2.3 Analyse Pages Existantes du Module
Lister **toutes les pages développées** pour ce module :
```bash
find src/pages/$MODULE_DIR -name "*.tsx" -type f
```

Pour chaque page trouvée :

1. **Vérifier route déclarée** :
   - Si NON → **Page orpheline** (non accessible)
   - Si OUI → OK

2. **Vérifier item menu** :
   - Si NON → **Fonctionnalité cachée** (accessible via URL directe uniquement)
   - Si OUI → OK

**Résultat** : Identifier pages orphelines et fonctionnalités cachées

---

#### 2.4 Vérification Conformité UI/UX (CRITIQUE)
Pour chaque page du module, vérifier **checklist obligatoire** :

```typescript
// Template obligatoire (UI_PATTERNS.md)
export default function PageName() {
  return (
    <Layout>
      {/* 1. OBLIGATOIRE : Breadcrumbs en premier */}
      <Breadcrumbs items={[...]} />

      <div className="space-y-6">
        {/* 2. OBLIGATOIRE : Header avec icône + titre */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="h-8 w-8 text-[color]-600 dark:text-[color]-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Titre Page
            </h1>
          </div>
          {/* Actions (Button component) */}
        </div>

        {/* 3. OBLIGATOIRE : PageNotice */}
        <PageNotice notices={moduleNotices} currentPath="/path" />

        {/* 4. Contenu page */}
      </div>
    </Layout>
  )
}
```

**Vérifier pour CHAQUE page** :
- [ ] JSDoc en-tête (5+ fonctionnalités listées)
- [ ] `<Layout>` wrapper présent
- [ ] `<Breadcrumbs>` en premier (fils direct de Layout)
- [ ] Header avec icône module (lucide-react)
- [ ] `<Button>` component (jamais `<button>` ou `<Link>` stylé)
- [ ] `<PageNotice>` après header
- [ ] Error state avec `role="alert"`
- [ ] Loading state (SkeletonTable ou Loader2)
- [ ] Dark mode complet : `bg-white dark:bg-gray-800`, `text-gray-900 dark:text-white`
- [ ] Border colors : `border-gray-200 dark:border-gray-700`
- [ ] Hover states : adaptés dark mode

**Générer rapport** : Liste pages non conformes avec détails manquants

---

#### 2.5 Vérification Breadcrumbs
Pour chaque page :

1. **Extraire breadcrumbs déclarés** :
   ```typescript
   <Breadcrumbs items={[...]} />
   ```

2. **Vérifier cohérence** :
   - Premier item = module (ex: `{ label: 'Finance', path: '/finance' }`)
   - Items intermédiaires = sections parentes
   - Dernier item = page courante

3. **Vérifier paths valides** :
   - Tous les paths dans breadcrumbs doivent avoir une route

**Problèmes courants** :
- ❌ Breadcrumbs vides
- ❌ Paths incorrects (ex: `/old-route` au lieu de `/new-route`)
- ❌ Mauvaise hiérarchie (ex: page détail sans page liste)

---

#### 2.6 Vérification PageNotice
Pour chaque page :

1. **Vérifier import** :
   ```typescript
   import { moduleNotices } from '@/lib/notices'
   ```

2. **Vérifier utilisation** :
   ```typescript
   <PageNotice notices={moduleNotices} currentPath="/exact/path" />
   ```

3. **Vérifier fichier notices existe** :
   ```bash
   test -f "src/lib/notices/${module}-notices.ts" && echo "OK" || echo "MISSING"
   ```

**Si notices manquantes** : Créer fichier avec structure :
```typescript
export const moduleNotices = [
  {
    type: 'info',
    message: 'Message informatif',
    pages: ['/module/page1', '/module/page2']
  }
]
```

---

#### 2.7 Vérification Dashboard Module (Si Applicable)
Si le module a un dashboard (`/module` sans suffixe) :

**Vérifier présence KPIs** :
- [ ] Minimum 3 KPIs affichés
- [ ] KPIs avec icônes (lucide-react)
- [ ] KPIs avec évolution (%, +/-, delta)
- [ ] KPIs adaptatifs dark mode

**Vérifier actions rapides** :
- [ ] Boutons principaux visibles (ex: "Nouveau", "Créer")
- [ ] Liens vers pages importantes

**Vérifier graphiques (si présents)** :
- [ ] Placeholder si données mockées
- [ ] Adaptatifs dark mode
- [ ] Légendes lisibles

---

#### 2.8 Test Navigation Manuelle (CRITIQUE)
**Simuler parcours utilisateur** :

1. **Depuis menu latéral** :
   - Cliquer sur chaque item → Page s'affiche ?
   - Sub-items se déploient correctement ?

2. **Depuis breadcrumbs** :
   - Cliquer sur chaque niveau → Navigation correcte ?

3. **Depuis actions** :
   - Boutons "Nouveau", "Créer" → Routent vers bonnes pages ?

4. **Routes dynamiques** :
   - `/module/items/:id` → Page détail charge ?
   - `/module/items/new` → Formulaire création charge ?

**Documenter erreurs** : Screenshots si possible

---

### Phase 3 : Génération Rapport d'Audit

Créer rapport markdown exhaustif :

```markdown
# Audit Navigation - Module [NOM]
Date : [DATE]
Auditeur : Claude Code

## 📊 Résumé Exécutif
- Items menu : X total
- Routes déclarées : Y/X (Z% couverture)
- Pages développées : N
- Pages orphelines : M
- Erreurs critiques : P

## 🔴 Erreurs Critiques (P0)
1. [PATH] : Route manquante → Menu cliquable mais 404
2. [PATH] : Fichier manquant → Import lazy cassé
3. [PAGE] : Breadcrumbs manquants → Non conforme UI_PATTERNS

## 🟠 Warnings (P1)
1. [PAGE] : PageNotice manquant
2. [PAGE] : Dark mode incomplet (X éléments non adaptés)
3. [PAGE] : JSDoc incomplet (< 5 fonctionnalités)

## 🟢 Pages Orphelines (P2)
1. src/pages/module/HiddenFeature.tsx → Développé mais non exposé

## ✅ Pages Conformes
- /module/page1 : 100% conforme
- /module/page2 : 100% conforme

## 📋 Actions Recommandées
### Priorité 0 (Urgent)
1. Créer route pour [PATH]
2. Corriger import lazy [COMPONENT]
3. Ajouter Breadcrumbs à [PAGE]

### Priorité 1 (Important)
1. Compléter dark mode [PAGE]
2. Ajouter PageNotice [PAGE]
3. Compléter JSDoc [PAGE]

### Priorité 2 (Optionnel)
1. Exposer pages orphelines dans menu (si pertinent)
2. Optimiser structure breadcrumbs
3. Améliorer graphiques dashboard
```

---

### Phase 4 : Correction Interactive

**Demander à l'utilisateur** :
```
Souhaitez-vous corriger automatiquement les erreurs P0 ?
1. Oui, corriger tout automatiquement
2. Non, me montrer les corrections proposées d'abord
3. Corriger seulement certaines erreurs (choix interactif)
```

---

#### 4.1 Corrections Automatiques P0

Pour chaque erreur P0 détectée :

**Erreur : Route manquante**
```typescript
// Ajouter dans src/routes.tsx
const ComponentName = lazy(() => import('./pages/module/PageName'))

// Dans la section routes du module
<Route path="/module/page" element={<P><ComponentName /></P>} />
```

**Erreur : Fichier manquant**
```typescript
// Créer src/pages/module/PageName.tsx avec template
/**
 * [Nom Page] - Description
 *
 * Fonctionnalités :
 * - Fonctionnalité 1
 * - Fonctionnalité 2
 * - Fonctionnalité 3
 * - Fonctionnalité 4
 * - Fonctionnalité 5
 */

import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice } from '@/components/common'
import { moduleNotices } from '@/lib/notices'

export default function PageName() {
  return (
    <Layout>
      <Breadcrumbs
        items={[
          { label: 'Module', path: '/module' },
          { label: 'Page Name', path: '/module/page' },
        ]}
      />

      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Page Name
        </h1>

        <PageNotice notices={moduleNotices} currentPath="/module/page" />

        {/* TODO: Implémenter contenu */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            Page en cours de développement
          </p>
        </div>
      </div>
    </Layout>
  )
}
```

**Erreur : Breadcrumbs manquants**
```typescript
// Ajouter en haut de la page (après Layout)
<Breadcrumbs
  items={[
    { label: '[Module]', path: '/[module]' },
    // Ajouter sections intermédiaires si applicable
    { label: '[Page Name]', path: '/[module]/[page]' },
  ]}
/>
```

**Erreur : PageNotice manquant**
```typescript
// Import
import { moduleNotices } from '@/lib/notices'

// Utilisation (après header)
<PageNotice notices={moduleNotices} currentPath="/exact/path" />
```

**Erreur : Dark mode incomplet**
```typescript
// Remplacements automatiques
bg-white → bg-white dark:bg-gray-800
text-gray-900 → text-gray-900 dark:text-white
border-gray-200 → border-gray-200 dark:border-gray-700
text-gray-600 → text-gray-600 dark:text-gray-400
```

---

#### 4.2 Application des Corrections

1. **Créer branche correction** :
   ```bash
   git checkout -b fix/nav-[module]-[date]
   ```

2. **Appliquer corrections** :
   - Créer fichiers manquants
   - Modifier routes.tsx
   - Corriger pages non conformes

3. **Vérifier build** :
   ```bash
   pnpm run type-check
   pnpm run build
   ```

4. **Lancer script cohérence** :
   ```bash
   pnpm run check:coherence
   ```

5. **Tests manuels** :
   - Démarrer dev : `pnpm dev`
   - Tester chaque correction
   - Vérifier dark/light mode

---

### Phase 5 : Validation Finale et Commit

**Checklist validation** :
- [ ] Script cohérence passe (0 erreur)
- [ ] Build production passe
- [ ] Navigation manuelle testée (tous liens fonctionnels)
- [ ] Dark mode vérifié sur toutes pages modifiées
- [ ] Breadcrumbs fonctionnels
- [ ] PageNotice affichés

**Créer commit** :
```bash
git add .
git commit -m "fix(nav): correction navigation module [MODULE]

Corrections P0 :
- [X] routes manquantes corrigées
- [Y] fichiers créés
- [Z] pages rendues conformes UI_PATTERNS

Corrections P1 :
- Dark mode complété sur [N] pages
- PageNotice ajoutés sur [M] pages

Résultat :
✅ [X]% conformité menu → routes
✅ [Y]% conformité UI/UX
✅ 0 erreur critique

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Push** :
```bash
git push origin fix/nav-[module]-[date]
```

---

## 🎯 Modules Disponibles et Spécificités

### 1. Home (Tableau de bord)
- **Path racine** : `/dashboard`
- **Spécificités** :
  - Dashboard général multi-modules
  - KPIs agrégés (tous modules)
  - Notifications globales
  - Accès rapides personnalisables
- **Fichiers clés** :
  - `src/pages/Dashboard.tsx` (si existe)
  - `src/hooks/useHomeTabs.ts`

---

### 2. Finance
- **Path racine** : `/finance`
- **Sections** : Comptes, Flux, Budgets, Reporting, Factures, Paramètres
- **Spécificités** :
  - **CurrencyProvider** obligatoire pour pages avec montants
  - **FinanceErrorBoundary** sur toutes routes
  - Routes imbriquées dans `SettingsLayoutWrapper`
  - Module multi-éditions (Finance Suite vs Finance Seul)
- **Fichiers clés** :
  - `src/pages/finance/FinanceDashboard.tsx`
  - `src/hooks/useFinanceTabs.ts`
  - `src/lib/notices/finance-notices.ts`
- **Vérifications spéciales** :
  - [ ] CurrencyProvider sur pages avec €
  - [ ] FinanceErrorBoundary sur toutes routes
  - [ ] Routes settings imbriquées correctes

---

### 3. Store (E-commerce)
- **Path racine** : `/store`
- **Sections** : Commandes, Catalogue, Marketing, Contenu, Rapports, Thèmes, Paramètres
- **Spécificités** :
  - Module le plus volumineux (~50 pages)
  - Routes imbriquées multiples (settings, themes, newsletter)
  - Intégration vitrine-client
  - Système thèmes marketplace
- **Fichiers clés** :
  - `src/pages/store/StoreDashboard.tsx`
  - `src/hooks/useStoreTabs.ts`
  - `src/lib/notices/store-notices.ts`
- **Vérifications spéciales** :
  - [ ] Routes thèmes (marketplace, submit, builder)
  - [ ] Routes newsletter (campaigns, subscribers, compose)
  - [ ] Routes settings (10+ pages imbriquées)
  - [ ] Intégration preview vitrine

---

### 4. Stock (Inventaire)
- **Path racine** : `/stock` (mais aussi `/inventory`)
- **Sections** : Inventaire, Mouvements, Entrepôts, Règles réapprovisionnement, Rapports, Paramètres
- **Spécificités** :
  - **Alias routes** : `/stock/inventory` → `/inventory`
  - CurrencyProvider sur valorisation/turnover
  - Routes settings imbriquées
- **Fichiers clés** :
  - `src/pages/Stock.tsx` (ancien, vérifier si utilisé)
  - `src/pages/Inventory.tsx`
  - `src/hooks/useStockTabs.ts`
- **Vérifications spéciales** :
  - [ ] Alias `/stock/inventory` fonctionne
  - [ ] Routes valorisation/turnover avec CurrencyProvider
  - [ ] Routes settings imbriquées

---

### 5. CRM
- **Path racine** : `/crm`
- **Sections** : Dashboard, Clients, Pipeline, Leads, Segmentation, Paramètres
- **Spécificités** :
  - Dashboard créé récemment (Phase 2.1)
  - Routes settings imbriquées
  - Module pipeline avec Kanban
- **Fichiers clés** :
  - `src/pages/crm/CRMDashboard.tsx` (nouveau)
  - `src/pages/crm/Pipeline.tsx`
  - `src/hooks/useCrmTabs.ts`
  - `src/lib/notices/crm-notices.ts`
- **Vérifications spéciales** :
  - [ ] Dashboard CRM accessible via `/crm`
  - [ ] Pipeline Kanban fonctionnel
  - [ ] Routes settings (stages, pricelists, scoring)

---

### 6. Marketing
- **Path racine** : `/marketing`
- **Sections** : Dashboard, Campagnes, Emails, SMS, Audiences, Paramètres
- **Spécificités** :
  - Routes cachées : campaigns, automation (développées mais non exposées)
  - Alias : `/marketing/lists` → `/marketing/contacts`
  - Routes settings imbriquées
  - SMS templates créés récemment (Phase 2.3)
- **Fichiers clés** :
  - `src/pages/marketing/MarketingDashboard.tsx`
  - `src/pages/marketing/campaigns/` (pages cachées)
  - `src/pages/marketing/sms/templates/page.tsx` (nouveau)
  - `src/hooks/useMarketingTabs.ts`
- **Vérifications spéciales** :
  - [ ] SMS Templates accessible via `/marketing/sms/templates`
  - [ ] Routes campagnes cachées (décider si exposer)
  - [ ] Alias `/marketing/lists` fonctionne
  - [ ] Routes settings (email, sms)

---

### 7. HR (Ressources Humaines)
- **Path racine** : `/hr`
- **Sections** : Dashboard, Employés, Départements, Contrats, Congés, Appraisals, Skills, Paramètres
- **Spécificités** :
  - Dashboard existant
  - Routes congés multiples (calendar, allocations, types)
  - Routes settings simples
- **Fichiers clés** :
  - `src/pages/hr/page.tsx` (dashboard)
  - `src/pages/hr/employees/`
  - `src/hooks/useHrTabs.ts`
  - `src/lib/notices/hr-notices.ts`
- **Vérifications spéciales** :
  - [ ] Routes congés (leaves, leaves/calendar, leaves/allocations)
  - [ ] Routes contrats
  - [ ] Routes appraisals (liste + détail)

---

### 8. Support
- **Path racine** : `/support`
- **Sections** : Dashboard, Tickets, FAQ, Base connaissance
- **Spécificités** :
  - Dashboard créé récemment (Phase 2.2)
  - FAQ créée récemment (Phase 2.2)
  - Routes satisfaction publiques
- **Fichiers clés** :
  - `src/pages/support/SupportDashboard.tsx` (nouveau)
  - `src/pages/support/FAQ.tsx` (nouveau)
  - `src/pages/support/Tickets.tsx`
  - `src/hooks/useSupportTabs.ts`
  - `src/lib/notices/support-notices.ts`
- **Vérifications spéciales** :
  - [ ] Dashboard Support accessible via `/support`
  - [ ] FAQ accessible via `/support/faq`
  - [ ] Routes tickets (liste, new, :id)
  - [ ] Route satisfaction publique

---

### 9. POS (Point de Vente)
- **Path racine** : `/pos`
- **Sections** : Dashboard, Terminal, Sessions, Commandes, Rapports, Paramètres
- **Spécificités** :
  - Module UX spéciale (terminal full-screen)
  - Routes multiples terminaux (kiosk, KDS, rush, mobile)
  - Routes rapports imbriquées
  - Routes settings (terminals, payments, receipts)
- **Fichiers clés** :
  - `src/pages/pos/POSDashboard.tsx`
  - `src/pages/pos/POSTerminal.tsx`
  - `src/hooks/usePosTabs.ts`
- **Vérifications spéciales** :
  - [ ] Tous terminaux accessibles (terminal, kiosk, KDS, rush, mobile)
  - [ ] Routes sessions (open, list)
  - [ ] Routes rapports (sales, payments)
  - [ ] Routes settings imbriquées

---

### 10. Maintenance (GMAO)
- **Path racine** : `/maintenance`
- **Sections** : Dashboard, Équipements, Demandes, Calendrier, Rapports, Paramètres
- **Spécificités** :
  - Dashboard existant
  - Routes équipements (liste, new, :id, critical)
  - Routes demandes (liste, new, emergency)
  - Routes rapports et coûts
- **Fichiers clés** :
  - `src/pages/maintenance/Dashboard.tsx`
  - `src/pages/maintenance/EquipmentList.tsx`
  - `src/hooks/useMaintenanceTabs.ts`
- **Vérifications spéciales** :
  - [ ] Routes équipements (all, new, :id, critical)
  - [ ] Routes demandes (all, new, emergency)
  - [ ] Route calendrier
  - [ ] Routes rapports et coûts

---

## 🔧 Outils et Scripts Disponibles

### Scripts d'Audit
```bash
# Vérification cohérence globale
pnpm run check:coherence

# Audit menu → routes (CSV)
./scripts/audit-menu-routes.sh

# Audit imports lazy (CSV)
./scripts/audit-lazy-imports.sh

# Audit pages orphelines (CSV)
./scripts/audit-orphan-pages.sh
```

### Commandes Utiles
```bash
# Compter items menu d'un module
grep -A 200 "id: 'finance'" src/config/modules.ts | grep "path:" | wc -l

# Lister toutes pages d'un module
find src/pages/finance -name "*.tsx" -type f

# Vérifier route existe
grep "path=\"/finance/page\"" src/routes.tsx

# Rechercher composant dans routes
grep -C 3 "FinanceComponent" src/routes.tsx

# Vérifier imports notices
grep -r "financeNotices" src/pages/finance/

# Vérifier dark mode dans une page
grep -E "dark:" src/pages/finance/SomePage.tsx
```

---

## ⚠️ Pièges Courants et Solutions

### 1. Routes Imbriquées Non Détectées
**Problème** : Routes settings comme `/finance/settings/flux` non détectées par script cohérence.

**Solution** : Chercher manuellement dans `SettingsLayoutWrapper` :
```bash
grep -A 30 "path=\"/finance/settings\"" src/routes.tsx | grep "path=\"flux\""
```

### 2. Alias Routes
**Problème** : `/marketing/lists` → `/marketing/contacts` alias non évident.

**Solution** : Chercher redirects/Navigate :
```bash
grep "Navigate to=\"/marketing/contacts\"" src/routes.tsx
```

### 3. Composants Réutilisés
**Problème** : Même composant utilisé pour plusieurs routes (ex: ProductForm pour new et edit).

**Solution** : Vérifier si params dynamiques (`:id`, `:slug`) suffisent, sinon dupliquer composant.

### 4. Module Non Chargé
**Problème** : Module wrapper `<Module name="Finance">` manquant → sidebar ne s'affiche pas.

**Solution** : Vérifier pattern :
```typescript
<Route path="/finance" element={<P><Module name="Finance"><Component /></Module></P>} />
```

### 5. Dark Mode Partiel
**Problème** : Certains éléments invisibles en dark mode.

**Solution** : Checklist systématique :
- Background : `bg-white dark:bg-gray-800`
- Text : `text-gray-900 dark:text-white`
- Borders : `border-gray-200 dark:border-gray-700`
- Secondary text : `text-gray-600 dark:text-gray-400`
- Hover : `hover:bg-gray-100 dark:hover:bg-gray-700`

---

## 📊 Rapport Final Attendu

À la fin de l'audit, générer :

1. **Rapport Markdown** : `dashboard-client/audit-reports/nav-[module]-[date].md`
2. **Fichier CSV** : `dashboard-client/audit-reports/nav-[module]-[date].csv`
3. **Checklist** : Liste actions à faire (P0, P1, P2)
4. **Commit** : Si corrections appliquées

**Métriques finales** :
- Taux conformité menu → routes : X%
- Taux conformité UI/UX : Y%
- Nombre erreurs corrigées : Z
- Pages créées : N
- Pages modifiées : M

---

## 🎯 Commande Utilisation

```bash
# Depuis n'importe où dans le projet
/fix-nav

# Répondre au prompt :
# "Quel module ? 1-11"
# → Saisir numéro

# Attendre audit complet (2-5 min selon module)
# → Rapport généré automatiquement

# Choisir corrections :
# "Corriger automatiquement ? 1-3"
# → Saisir choix

# Valider corrections
# → Commit créé automatiquement si validé
```

---

## ✅ Critères de Succès

Un module est **100% conforme** si :
- ✅ Tous les paths menu ont une route déclarée
- ✅ Toutes les routes pointent vers des fichiers existants
- ✅ Toutes les pages respectent UI_PATTERNS.md
- ✅ Toutes les pages ont Breadcrumbs fonctionnels
- ✅ Toutes les pages ont PageNotice
- ✅ Toutes les pages sont adaptées dark mode
- ✅ 0 page orpheline (ou justifiée)
- ✅ Navigation manuelle testée et fonctionnelle

**Si 100% conforme** : Module validé ✅ → Passer au suivant
**Si < 100%** : Appliquer corrections → Re-auditer

---

## 📝 Notes Importantes

- **Un module à la fois** : Ne jamais auditer plusieurs modules simultanément
- **Toujours tester manuellement** : Scripts détectent 80%, test manuel 20% restant
- **Dark mode CRITIQUE** : Toujours vérifier, erreurs fréquentes
- **Breadcrumbs oubliés** : Erreur #1 sur nouvelles pages
- **PageNotice facultatif** : Warning seulement, pas bloquant
- **Pages orphelines OK** : Si justifiées (WIP, deprecated, tests)

---

## 🔄 Workflow Itératif

Pour audit complet suite (11 modules) :

1. `/fix-nav` → Sélectionner "1. Home"
2. Attendre rapport + corriger
3. Valider + commit
4. `/fix-nav` → Sélectionner "2. Finance"
5. Répéter jusqu'à module 10
6. Générer rapport global consolidé

**Estimation temps** :
- Module simple (HR, Support) : 15-20 min
- Module moyen (Finance, CRM) : 30-40 min
- Module complexe (Store) : 60+ min
- **Total 11 modules** : 4-6 heures

---

## 🚀 Prochaines Étapes

Après audit/correction d'un module :

1. **Lancer tests** : `pnpm run type-check && pnpm run build`
2. **Vérifier cohérence globale** : `pnpm run check:coherence`
3. **Tester en dev** : `pnpm dev` → Navigation manuelle
4. **Commit** : Si tout OK
5. **Passer au module suivant** : `/fix-nav` → Prochain numéro

**Ne PAS passer au suivant tant que le module courant n'est pas 100% conforme.**
