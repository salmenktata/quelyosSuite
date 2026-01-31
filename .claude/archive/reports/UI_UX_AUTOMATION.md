# Automatisation Vérifications UI/UX

## Vue d'ensemble

Système automatisé pour vérifier la conformité des patterns UI/UX, avec focus sur le dark/light mode adaptatif.

## 🎯 Objectifs

1. **Prévention** : Bloquer les commits avec erreurs critiques
2. **Détection** : Identifier problèmes dans codebase existant
3. **Documentation** : Audit détaillé des pages
4. **CI/CD** : Tests automatiques sur chaque push

---

## 🔧 Outils Disponibles

### 1. Pre-commit Hook (Automatique)

**Fichier** : `.husky/pre-commit`
**Déclencheur** : `git commit`
**Portée** : Fichiers modifiés uniquement
**Action** : Bloque commit si erreurs critiques

**Vérifications** :
- ✅ `bg-white` sans `dark:bg-gray-800`
- ✅ `text-gray-900` sans `dark:text-white`
- ⚠️  `border-gray-200` sans `dark:border-gray-700`
- ✅ Labels avec `text-gray-700` (au lieu de `text-gray-900`)
- ⚠️  Inputs/selects sans variantes `dark:`
- ⚠️  `GlassPanel`/`GlassCard` sans padding
- ⚠️  `text-white` isolé sans contrepartie light

**Codes de sortie** :
- `0` : Aucun problème ou warnings seulement
- `1` : Erreurs critiques, commit bloqué

**Activer** :
```bash
chmod +x dashboard-client/.husky/pre-commit
```

**Désactiver temporairement** :
```bash
git commit --no-verify -m "message"
```

---

### 2. Script Shell Complet (Manuel)

**Fichier** : `scripts/check-ui-ux.sh`
**Usage** :
```bash
# Analyser tout le projet
./scripts/check-ui-ux.sh

# Analyser un dossier spécifique
./scripts/check-ui-ux.sh dashboard-client/src/pages/finance
```

**Portée** : Tous les fichiers `.tsx`/`.jsx` du dossier cible

**Sortie** :
```
🔍 Analyse UI/UX complète du projet
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ src/pages/finance/budgets/page.tsx
   bg-white sans variante dark:bg-gray-800

⚠️  src/components/finance/BudgetCard.tsx
   border-gray-200 sans dark:border-gray-700

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Résumé

Fichiers analysés : 47
Erreurs critiques : 1
Warnings : 3
```

---

### 3. Tests Vitest (CI/CD)

**Fichier** : `dashboard-client/src/test/ui-patterns.test.ts`
**Usage** :
```bash
cd dashboard-client
npm run test ui-patterns
```

**Suites de tests** :
1. **Background Colors** : Vérification `bg-white` + `dark:bg-`
2. **Text Colors** : Vérification `text-gray-900` + `dark:text-white`
3. **Borders** : Warning pour borders sans variante dark
4. **Form Elements** : Labels et inputs adaptatifs
5. **Components Glass** : Padding sur GlassPanel/GlassCard
6. **Composants Standards** : Pas de heroicons, utiliser Button

**Intégration CI** :
```yaml
# .github/workflows/ui-checks.yml
name: UI/UX Checks
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm run test ui-patterns
```

---

### 4. Commande `/uiux` (Audit détaillé)

**Usage** :
```bash
/uiux src/pages/finance/budgets/page.tsx
/uiux --fix src/pages/finance/budgets/page.tsx
/uiux --module finance
```

**Fonctionnalités** :
- Score /120 avec 7 sections
- Audit récursif composants enfants
- Corrections automatiques avec `--fix`
- Rapport consolidé avec `--module`

**Voir** : `.claude/commands/uiux.md`

---

## 📋 Patterns Obligatoires

### Backgrounds
```tsx
// ✅ BON
bg-white dark:bg-gray-800
bg-gray-50 dark:bg-gray-900

// ❌ MAUVAIS
bg-white  // invisible en dark mode
dark:bg-gray-800  // invisible en light mode
```

### Textes
```tsx
// ✅ BON
text-gray-900 dark:text-white
text-gray-600 dark:text-gray-400

// ❌ MAUVAIS
text-gray-900  // trop sombre en dark mode
text-white  // invisible en light mode
text-indigo-100  // invisible en light mode
```

### Borders
```tsx
// ✅ BON
border-gray-200 dark:border-gray-700
border-gray-300 dark:border-white/15

// ⚠️  ACCEPTABLE (warning)
border-gray-200  // visible mais peut manquer contraste
```

### Formulaires - Labels
```tsx
// ✅ BON
<label className="text-gray-900 dark:text-white">
  Nom <span className="text-rose-600 dark:text-rose-400">*</span>
</label>

// ❌ MAUVAIS
<label className="text-gray-700">  // trop clair en light mode
```

### Formulaires - Inputs
```tsx
// ✅ BON
<input className="
  bg-white dark:bg-white/10
  text-gray-900 dark:text-white
  border-gray-300 dark:border-white/15
  placeholder:text-gray-400 dark:placeholder:text-gray-500
" />

// ❌ MAUVAIS
<input className="bg-white/10 text-white border-white/15" />
// ^ Fonctionne seulement en dark mode
```

### Gradients (GlassPanel)
```tsx
// ✅ BON - Couleurs opaques en light, transparents en dark
const adaptiveGradients = {
  indigo: 'bg-gradient-to-br from-indigo-50/95 to-indigo-100/95 dark:from-indigo-500/20 dark:to-purple-500/20',
  violet: 'bg-gradient-to-br from-violet-50/95 to-violet-100/95 dark:from-violet-500/20 dark:to-purple-500/20',
}

// ❌ MAUVAIS
bg-gradient-to-br from-indigo-500/20 to-purple-500/20
// ^ Transparent, ne fonctionne qu'en dark mode
```

---

## 🚦 Workflow Développement

### Lors d'une modification UI

1. **Modifier le composant** avec patterns adaptatifs
2. **Vérifier visuellement** en light ET dark mode (http://localhost:5175)
3. **Commit** → Pre-commit hook valide automatiquement
4. **Si bloqué** : Corriger erreurs listées et recommiter

### Lors d'un audit

```bash
# Audit simple
/uiux src/pages/finance/budgets/page.tsx

# Audit + corrections automatiques
/uiux --fix src/pages/finance/budgets/page.tsx

# Audit module complet
/uiux --module finance
```

### Avant un déploiement

```bash
# Vérification complète du projet
./scripts/check-ui-ux.sh dashboard-client/src

# Tests automatisés
cd dashboard-client && npm run test ui-patterns
```

---

## 🔍 Debugging

### Pre-commit hook ne se déclenche pas

**Vérifier exécutable** :
```bash
ls -la dashboard-client/.husky/pre-commit
# Devrait afficher : -rwxr-xr-x (x = exécutable)
```

**Rendre exécutable** :
```bash
chmod +x dashboard-client/.husky/pre-commit
```

### Faux positifs

**Exemple** : Composant utilise contexte spécial
```tsx
// Ajouter commentaire pour expliquer
/* eslint-disable ui-patterns/dark-mode */
<div className="bg-white"> {/* Mode clair uniquement */}
```

### Ignorer fichier spécifique

**Dans pre-commit hook**, ajouter :
```bash
# Ignorer fichiers legacy
if [[ "$file" == *"legacy"* ]]; then
  continue
fi
```

---

## 📊 Métriques

### Niveaux de sévérité

| Type | Symbole | Description | Action |
|------|---------|-------------|--------|
| **Erreur** | ❌ | Bloque commit | Correction obligatoire |
| **Warning** | ⚠️  | N'affecte pas commit | Correction recommandée |
| **Info** | ℹ️  | Suggestion | Optionnel |

### Couverture actuelle

**Vérifications actives** :
- 7 checks pre-commit
- 7 checks script shell
- 6 suites tests Vitest

**Fichiers concernés** :
- `dashboard-client/src/**/*.{tsx,jsx}`
- Exclut : `node_modules/`, `dist/`, `.next/`, `test/`

---

## 🎓 Formation Équipe

### Règle #1 : Dark/Light Réflexe
**TOUJOURS** vérifier les deux modes sans rappel.

### Règle #2 : Patterns Mémorisés
Utiliser les patterns documentés (voir section ci-dessus).

### Règle #3 : Outils Automatiques
Laisser les hooks détecter les erreurs, ne pas commit `--no-verify`.

---

## 📝 Maintenance

### Ajouter nouvelle vérification

**1. Pre-commit hook** : Éditer `.husky/pre-commit`
```bash
# Vérification 8 : Exemple
if grep -q "pattern" "$file"; then
  echo "  ❌ ERREUR: Description"
  ERRORS=$((ERRORS + 1))
fi
```

**2. Script shell** : Éditer `scripts/check-ui-ux.sh`

**3. Tests Vitest** : Éditer `src/test/ui-patterns.test.ts`
```typescript
it('nouvelle vérification', () => {
  const violations: string[] = []
  // ... logique test
  expect(violations).toHaveLength(0)
})
```

### Mettre à jour patterns

**Fichier central** : Ce document (`UI_UX_AUTOMATION.md`)
**Synchroniser avec** :
- `CLAUDE.md` (section Dark/Light Mode)
- `.claude/commands/uiux.md` (grille audit)
- Pre-commit hook (commentaires)

---

## 🎯 Objectifs Atteints

✅ **Automatisation complète** : Pre-commit + script + tests
✅ **Documentation** : Patterns clairs et exemples
✅ **Prévention** : Blocage commits avec erreurs critiques
✅ **Formation** : Règles mémorisables pour l'équipe
✅ **CI/CD** : Tests intégrables workflows GitHub Actions

**Résultat** : Fini les rappels "vérifie en mode dark" ou "vérifie en mode clair" !
