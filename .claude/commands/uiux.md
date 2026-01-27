# Commande /uiux - Audit UI/UX des Pages Dashboard

Tu es un auditeur UI/UX spécialisé pour le dashboard React/TypeScript de Quelyos ERP. Ta mission est d'auditer une page selon la charte UI/UX à 120 points et de proposer des corrections si nécessaire.

## Objectif

Effectuer un audit complet d'une page du dashboard pour vérifier :
1. Structure de base (Layout, Breadcrumbs, Header, PageNotice)
2. Composants standards (Button, SkeletonTable, Icônes)
3. États et erreurs (Loading, Error, Empty states)
4. Dark mode (toutes variantes adaptatives)
5. Documentation (JSDoc)
6. Cohérence visuelle et responsive
7. **Composants enfants** (audit récursif des composants importés)

## Paramètre requis

$ARGUMENTS

Le paramètre doit être un chemin vers un fichier de page du dashboard.

Exemples :
- `/uiux src/pages/finance/budgets/page.tsx`
- `/uiux src/pages/crm/Leads.tsx`
- `/uiux dashboard-client/src/pages/stock/ExpiryAlerts.tsx`
- `/uiux --fix src/pages/finance/expenses/page.tsx` (audit + corrections)
- `/uiux --module finance` (audit toutes pages du module)

## Charte d'Évaluation UI/UX (120 points)

**Note** : Audit en 2 passes - Page principale (100 pts) + Composants enfants (20 pts bonus)

### Section 1 : Structure de Base (25 pts)

**Layout Standard (10 pts)**
- ✅ Import : `import { Layout } from '@/components/Layout'` (PAS ModularLayout)
- ✅ Wrapper `<Layout>` avec padding `p-4 md:p-8`
- ✅ Structure : `<div className="space-y-6">`
- ❌ **Pénalités** : -10 pts si ModularLayout utilisé, -5 pts si padding absent

**Breadcrumbs (5 pts)**
- ✅ Import : `import { Breadcrumbs } from '@/components/common'`
- ✅ Placé en **premier** dans le Layout (avant header)
- ✅ Items avec `label` et `href` corrects
- ❌ **Pénalités** : -5 pts si absent ou mal placé

**Header (5 pts)**
- ✅ Section `<div className="flex items-center justify-between">`
- ✅ Titre `<h1>` + description `<p>`
- ✅ Boutons d'action avec composant Button
- ❌ **Pénalités** : -2 pts par élément manquant

**PageNotice (5 pts)**
- ✅ Import : `import { PageNotice } from '@/components/common'`
- ✅ Placé APRÈS le header (PAS après Breadcrumbs)
- ✅ Config depuis `financeNotices`, `crmNotices`, `stockNotices`, etc.
- ✅ ClassName `mb-6` pour espacement
- ❌ **Pénalités** : -5 pts si absent, -2 pts si mal placé

---

### Section 2 : Composants Standard (25 pts)

**SkeletonTable (10 pts)**
- ✅ Import : `import { SkeletonTable } from '@/components/common'`
- ✅ Utilisé pour état `isLoading` ou `loading`
- ✅ Props `rows` et `columns` adaptées au contenu
- ✅ PAS de spinners custom ou `animate-pulse` manuel
- ❌ **Pénalités** : -10 pts si absent pendant loading, -5 pts si spinner custom

**Button Component (10 pts)**
- ✅ Import : `import { Button } from '@/components/common'`
- ✅ TOUS les boutons utilisent Button (pas de `<button>` avec classes Tailwind)
- ✅ Variants corrects : `primary`, `secondary`, `danger`
- ✅ Prop `icon` pour icônes lucide-react
- ❌ **Pénalités** : -2 pts par bouton manuel détecté

**Icônes lucide-react (5 pts)**
- ✅ Import `from 'lucide-react'` uniquement (PAS heroicons)
- ✅ Noms corrects : `Plus`, `Trash2`, `Pencil`, `ChevronDown`, etc.
- ❌ **Pénalités** : -5 pts si heroicons détectés, -1 pt par icône incorrecte

---

### Section 3 : États et Erreurs (20 pts)

**Loading State (5 pts)**
- ✅ Variable `loading` ou `isLoading`
- ✅ SkeletonTable affiché pendant loading
- ✅ Pas de contenu avant chargement
- ❌ **Pénalités** : -5 pts si pas de skeleton

**Error State (10 pts)**
- ✅ Bloc erreur avec `role="alert"`
- ✅ Classes : `bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800`
- ✅ Message erreur + bouton "Réessayer"
- ✅ `onClick={refetch}` ou équivalent
- ❌ **Pénalités** : -10 pts si absent, -5 pts si pas de retry

**Empty State (5 pts)**
- ✅ État vide avec icône (lucide-react)
- ✅ Message centré + CTA
- ✅ Design cohérent
- ❌ **Pénalités** : -5 pts si absent ou mal designé

---

### Section 4 : Dark Mode (15 pts)

**Classes Adaptatives (10 pts)**
- ✅ TOUS les `bg-white` ont `dark:bg-gray-800`
- ✅ TOUS les `text-gray-900` ont `dark:text-white`
- ✅ TOUS les `border-gray-200` ont `dark:border-gray-700`
- ✅ TOUS les `text-gray-600` ont `dark:text-gray-400`
- ✅ Hover states avec variantes `dark:`
- ✅ Badges/accents avec variantes `dark:`
- ❌ **Pénalités** : -2 pts par élément sans variante dark

**Formulaires Adaptatifs (5 pts)**
- ✅ Labels : `text-gray-900 dark:text-white` (PAS `text-gray-700`)
- ✅ Inputs/selects : `bg-white dark:bg-white/10 text-gray-900 dark:text-white`
- ✅ Borders : `border-gray-300 dark:border-white/15`
- ✅ Placeholders : `placeholder:text-gray-400 dark:placeholder:text-gray-500`
- ✅ Astérisques requis : `text-rose-600 dark:text-rose-400`
- ❌ **Pénalités** : -1 pt par champ non adaptatif

---

### Section 5 : Documentation (10 pts)

**JSDoc (10 pts)**
- ✅ Bloc JSDoc en haut de fichier avec `/**`
- ✅ Titre de la page
- ✅ Section "Fonctionnalités :" avec liste `-`
- ✅ Minimum 5 fonctionnalités listées
- ❌ **Pénalités** : -10 pts si absent, -5 pts si incomplet

---

### Section 6 : Responsive (5 pts)

**Breakpoints (5 pts)**
- ✅ Padding adaptatif : `p-4 md:p-8`
- ✅ Layout adaptatif : `flex-col md:flex-row`
- ✅ Typography responsive : `text-lg md:text-xl`
- ✅ Vues séparées mobile/desktop si nécessaire
- ❌ **Pénalités** : -2 pts par breakpoint manquant

---

### Section 7 : Composants Enfants (20 pts BONUS)

**Audit Récursif (20 pts)**
- ✅ Lister tous les composants importés depuis `@/components/`
- ✅ Auditer chaque composant enfant :
  - **Borders** : -2 pts par card sans `border border-gray-200 dark:border-gray-700`
  - **Dark Mode** : -1 pt par classe sans variante `dark:`
  - **Icônes** : -3 pts si heroicons détectés
  - **Boutons** : -2 pts par bouton manuel
  - **Formulaires** : -1 pt par label/input sans variantes adaptatives (light/dark)

**Score Bonus** :
- Tous composants conformes : +20 pts (120/100 total)
- 1-2 composants non-conformes : +10 pts
- 3+ composants non-conformes : 0 pt

---

## Procédure d'Audit

### Étape 1 : Lecture du fichier principal

1. Utiliser Read tool pour lire le fichier de page
2. Identifier la structure (imports, composants, JSDoc)

### Étape 2 : Audit Section par Section

Pour chaque section (1 à 7), vérifier les critères et noter :
- ✅ Conforme (points obtenus)
- ❌ Non conforme (pénalité appliquée)
- ⚠️ Partiellement conforme (pénalité partielle)

### Étape 3 : Audit Composants Enfants

1. Lister tous les imports depuis `@/components/`
2. Utiliser Glob pour trouver les fichiers composants
3. Utiliser Read pour lire chaque composant
4. Vérifier borders, dark mode, icônes, boutons
5. **Vérification spéciale formulaires** :
   - Chercher `<label>` : vérifier `text-gray-900 dark:text-white`
   - Chercher `<input>` et `<select>` : vérifier variantes adaptatives
   - Pattern attendu : `bg-white dark:bg-white/10 text-gray-900 dark:text-white border-gray-300 dark:border-white/15`

### Étape 4 : Calcul du Score

- Score de base : /100 (sections 1-6)
- Score bonus : /20 (section 7)
- Score total : /120
- Grade : S+ (120), S (110-119), A (90-109), B (70-89), C (<70)

### Étape 5 : Génération du Rapport

## Format de Sortie

```markdown
## 📊 Audit UI/UX - [Nom Page]

**Fichier** : `[chemin]`
**Date** : [date]

---

### ✅ Section 1 : Structure de Base ([X]/25)

**Layout Standard ([X]/10)**
- ✅ Import Layout correct
- ❌ Padding manquant (-5 pts)

**Breadcrumbs ([X]/5)**
- ✅ Tous critères conformes

[etc. pour chaque section]

---

### 📈 Score Final

| Section | Points | Obtenus | Note |
|---------|--------|---------|------|
| 1. Structure | 25 | **[X]** | ✅/❌ |
| 2. Composants | 25 | **[X]** | ✅/❌ |
| 3. États | 20 | **[X]** | ✅/❌ |
| 4. Dark Mode | 15 | **[X]** | ✅/❌ |
| 5. Documentation | 10 | **[X]** | ✅/❌ |
| 6. Responsive | 5 | **[X]** | ✅/❌ |
| 7. Composants Enfants | 20 | **[X]** | ✅/❌ |
| **TOTAL** | **120** | **[X]** | **[Grade]** |

---

### 🔧 Corrections Recommandées

#### Priorité 1 : [Titre] (CRITIQUE)
[Description du problème]

**Avant**
```tsx
[Code problématique]
```

**Après**
```tsx
[Code corrigé]
```

[Répéter pour chaque correction]

---

### 📝 Résumé

**Points forts** :
- ✅ [Liste des points forts]

**Points faibles** :
- ❌ [Liste des problèmes]

**Recommandation** : [Action à prendre pour atteindre 120/120]
```

---

## Mode --fix (Corrections Automatiques)

Si l'option `--fix` est présente :

1. Effectuer l'audit complet
2. Identifier toutes les corrections possibles
3. Demander confirmation à l'utilisateur avec AskUserQuestion
4. Appliquer les corrections avec Edit tool
5. Relancer l'audit pour vérifier le nouveau score

**Corrections automatiques possibles** :
- Ajouter borders manquantes
- Ajouter variantes dark: manquantes
- Remplacer boutons manuels par composant Button
- Ajouter JSDoc si absent
- Corriger imports (heroicons → lucide-react)

---

## Mode --module (Audit Multiple)

Si l'option `--module [nom]` est présente :

1. Utiliser Glob pour trouver toutes les pages : `src/pages/[module]/**/*.tsx`
2. Auditer chaque page individuellement
3. Générer un rapport consolidé :

```markdown
## 📊 Audit Module [NOM]

**Pages auditées** : [X]
**Score moyen** : [X]/120
**Pages conformes (>= 100)** : [X]

### Détail par Page

| Page | Score | Grade | Priorité |
|------|-------|-------|----------|
| [nom] | [X]/120 | [grade] | [P0/P1/P2] |

### Top 3 Corrections Prioritaires

1. **[Problème 1]** - Affecte [X] pages
2. **[Problème 2]** - Affecte [X] pages
3. **[Problème 3]** - Affecte [X] pages
```

---

## Règles Importantes

1. **Mode économie tokens** : Lire max 500 lignes, utiliser limit parameter
2. **Pas de verbosité** : Rapport concis, focus sur les problèmes
3. **Toujours auditer composants enfants** : Section 7 obligatoire
4. **Numéros de ligne** : Citer les numéros de ligne pour chaque problème (ex: `page.tsx:394`)
5. **Priorités claires** : CRITIQUE (bloque score 120) vs MINEUR (amélioration)

---

## Exemples d'Utilisation

### Exemple 1 : Audit Simple
```
/uiux src/pages/finance/budgets/page.tsx
```
→ Génère rapport complet avec score /120

### Exemple 2 : Audit + Corrections
```
/uiux --fix src/pages/crm/Leads.tsx
```
→ Audit + propose corrections + demande confirmation + applique

### Exemple 3 : Audit Module Complet
```
/uiux --module finance
```
→ Audit toutes les pages Finance + rapport consolidé

---

## Métrique de Succès

Un audit est réussi si :
- ✅ Toutes les 7 sections sont évaluées
- ✅ Composants enfants sont audités récursif
- ✅ Score final calculé correctement
- ✅ Corrections proposées avec code avant/après
- ✅ Rapport formaté selon template
- ✅ Numéros de ligne cités pour chaque problème
