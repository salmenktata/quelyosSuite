# Commande /coherence-ui - Audit et Correction Cohérence UI/UX

Analyse et corrige automatiquement les problèmes de cohérence ergonomique UI/UX entre pages d'un module. Compare avec une charte graphique et applique corrections standardisées.

## Usage

```bash
/coherence-ui crm              # Audit module CRM
/coherence-ui crm --fix        # Audit + correction auto
/coherence-ui --all            # Audit complet application
```

## Quand utiliser ?

- **Après création nouvelle page** : Vérifier cohérence avec module
- **Avant PR** : S'assurer du respect de la charte UI/UX  
- **Refactoring UI** : Harmoniser toutes les pages
- **Onboarding dev** : Comprendre les standards UI

## Instructions pour Claude

Quand l'utilisateur exécute `/coherence-ui [module]`, effectue :

### 1. Analyse du Module

1. **Lister les pages** : `find dashboard-client/src/pages/{module}/ -name "*.tsx"`
2. **Identifier page de référence** : Page liste principale (ex: Customers.tsx)
3. **Catégoriser** : Liste / Détail / Formulaire / Vue custom

### 2. Vérifier Charte UI/UX

Pour chaque page, vérifie :

#### Structure (25 pts)
- [ ] `<Layout>` wrapper (3 pts)
- [ ] `<Breadcrumbs>` composant, pas HTML (5 pts)
- [ ] Header avec title + description (5 pts)
- [ ] Actions (boutons) organisées (5 pts)
- [ ] Sections `space-y-6` (4 pts)
- [ ] JSDoc présent (3 pts)

#### Composants (30 pts)
- [ ] `Button` au lieu de `<button>` ou Link stylé (5 pts)
- [ ] `Breadcrumbs` au lieu de `<nav>` (5 pts)
- [ ] `SkeletonTable/Card` pour loading (5 pts)
- [ ] Composants module (Stats, Filters, Table) (10 pts)
- [ ] Empty state component (5 pts)

#### Gestion d'État (25 pts)
- [ ] Loading state avec skeleton (8 pts)
- [ ] Error handling avec PageNotice (10 pts)
- [ ] Empty state géré (7 pts)

#### Styling (20 pts)
- [ ] Spacing standard (space-y-6, gap-3) (5 pts)
- [ ] Dark mode partout (8 pts)
- [ ] Typography standard (text-3xl, etc.) (4 pts)
- [ ] Accessibilité ARIA (3 pts)

### 3. Générer Rapport

Format Markdown avec :
- **Score global** /100
- **Tableau comparatif** pages
- **Problèmes critiques** avec exemples code
- **Plan de correction** (auto + manuel)
- **Commandes** pour fix

### 4. Correction Automatique (--fix)

Si `--fix` flag :

1. **Remplacer breadcrumbs HTML** par `<Breadcrumbs>`
2. **Remplacer loaders custom** par `<SkeletonTable/Card>`
3. **Remplacer Links stylés** par `<Button as={Link}>`
4. **Ajouter error handling** avec `PageNotice`
5. **Ajouter JSDoc** si manquant
6. **Vérifier types** : `pnpm type-check`
7. **Créer commit** : `refactor({module}): harmonisation UI/UX`

### 5. Patterns à Détecter

#### ❌ Anti-patterns

```tsx
// Breadcrumbs HTML
<nav className="flex items-center">
  <Link to="/">Accueil</Link>
  <span>/</span>
  ...
</nav>

// Loader custom
<div className="animate-spin rounded-full h-12 w-12 border-b-2"></div>

// Button stylé
<Link to="/path" className="px-4 py-2 bg-blue-600...">

// Pas de gestion erreur
const { data, isLoading } = useQuery()
return isLoading ? <Loader /> : <Content />
```

#### ✅ Patterns corrects

```tsx
// Breadcrumbs component
<Breadcrumbs items={breadcrumbItems} />

// Skeleton loader
<SkeletonTable rows={10} />

// Button component
<Button as={Link} to="/path" variant="primary">

// Gestion erreur
const { data, isLoading, error } = useQuery()
if (error) return <PageNotice notices={errors} />
return isLoading ? <SkeletonTable /> : <Content />
```

## Exemples Output

```
🎨 Audit UI/UX - Module CRM

Pages analysées :
  ✅ Customers.tsx (95/100)
  ❌ Pipeline.tsx (45/100) 
  ⚠️ CustomerDetail.tsx (75/100)

Score global : 72/100

Problèmes détectés :
  ❌ Pipeline.tsx : 8 problèmes critiques
     - Breadcrumbs HTML au lieu de composant
     - Loader custom au lieu de Skeleton
     - Pas de gestion d'erreur
     - Pas de stats affichées

Exécutez : /coherence-ui crm --fix
```

## Notes Importantes

- **Ne pas casser le code** : Toujours vérifier type-check après correction
- **Respecter l'existant** : Ne corriger que les écarts UI/UX, pas la logique
- **Documenter** : Expliquer chaque correction dans le commit
- **Prioriser** : Critiques d'abord, puis mineurs
