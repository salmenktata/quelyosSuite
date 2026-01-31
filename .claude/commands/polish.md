# Commande /polish - Refactoring & Amélioration Complète

## Description
Analyse et améliore une page/composant en appliquant les standards UX/UI modernes 2026 selon 6 dimensions : UX/UI, Performance, Code Quality, Accessibilité, Sécurité, Documentation.

## Usage

```bash
/polish <fichier>
/polish <composant>
```

**Exemples** :
- `/polish backoffice/src/pages/Categories.tsx`
- `/polish CategoryTree component`
- `/polish useProducts hook`
- `/polish dashboard-client/src/pages/finance/Dashboard.tsx` (édition Finance)
- `/polish packages/ui-kit/src/Button.tsx` (shared component)

## Workflow de la commande

### Étape 1 : Vérification de la parité fonctionnelle
1. Lire le tableau de correspondance Odoo ↔ Quelyos dans README.md pour la fonctionnalité
2. Vérifier qu'il n'y a aucun gap P0 ou P1 non documenté
3. Si des gaps existent, ALERTER l'utilisateur et ARRÊTER
4. Si parité OK, passer à l'étape 2

### Étape 2 : Audit UX/UI
Analyser la page/fonctionnalité selon les standards CLAUDE.md :

**Accessibilité (WCAG 2.1 AA)**
- Contraste texte minimum 4.5:1 (7:1 pour titres)
- Navigation clavier complète (Tab, Enter, Escape, raccourcis)
- ARIA labels sur tous les éléments interactifs
- Focus indicators visibles (ring-2)
- `scope="col"` sur headers de tableaux
- Headings hiérarchie correcte (h1 → h2 → h3)

**Responsive Design**
- Mobile-first (breakpoints sm/md/lg/xl/2xl)
- Touch targets ≥ 44px sur mobile
- Tableaux → Cards sur mobile si nécessaire
- Navigation adaptée (hamburger mobile, sidebar desktop)

**UX Patterns Modernes**
- Optimistic UI sur toutes les mutations
- Validation temps réel sur formulaires
- États de chargement (skeleton screens, pas juste spinners)
- Micro-animations (transitions 150-300ms)
- Bulk actions si liste de données
- Empty states avec illustrations + CTA
- Toasts avec auto-dismiss (3s success, 5s info, manuel erreur)

**Performance**
- Lazy loading images avec placeholder
- Virtual scrolling si > 50 éléments
- Query invalidation ciblée (pas invalidateAll)
- Memoization si re-renders inutiles

**Design System**
- Palette cohérente (indigo primaire, sémantique success/error/warning/info)
- Typographie standardisée (h1: 36px bold, h2: 30px semibold, h3: 24px semibold)
- Espacements multiples de 4px (8, 16, 24, 32, 48)
- Coins arrondis cohérents (lg: 8px, xl: 12px, 2xl: 16px)

### Étape 3 : Rapport d'Audit & Confirmation Utilisateur

**3.1. Générer un rapport** avec classification en 3 niveaux :

```markdown
## 🔍 Audit - [Nom Fichier]

### 🚨 CRITIQUE (P0) - À corriger immédiatement
1. **[Dimension]** - Description problème
   - Impact : ...
   - Solution : ...

### ⚠️ IMPORTANT (P1) - À corriger rapidement
1. **[Dimension]** - Description
   - Impact : ...
   - Solution : ...

### 💡 POLISH (P2) - Améliorations UX
1. **[Dimension]** - Description
   - Impact : ...
   - Solution : ...
```

**3.2. Demander confirmation** avec `AskUserQuestion` :

```typescript
AskUserQuestion({
  questions: [{
    question: "J'ai identifié X problèmes critiques (P0), Y importants (P1) et Z améliorations (P2). Que souhaitez-vous corriger ?",
    header: "Refactoring",
    multiSelect: false,
    options: [
      {
        label: "Tout corriger (P0 + P1 + P2)",
        description: "Refactoring complet - Recommandé"
      },
      {
        label: "Critique + Important (P0 + P1)",
        description: "Corrections essentielles seulement"
      },
      {
        label: "Critique uniquement (P0)",
        description: "Problèmes bloquants seulement"
      }
    ]
  }]
})
```

### Étape 4 : Implémentation
Pour chaque phase, dans l'ordre :

1. **Lire les fichiers concernés** (pages, composants, hooks)
2. **Appliquer les modifications** selon les standards CLAUDE.md
3. **Marquer le todo comme complété**
4. **Vérifier la compilation** (`npm run build`)
5. **Passer à la phase suivante**

### Étape 5 : Validation & Rapport Final

**5.1. Vérifier le build** : `npm run build` doit passer sans erreurs

**5.2. Générer rapport final** :

```markdown
## ✅ Refactoring Terminé - [Nom Fichier]

### 🎯 Modifications Appliquées

#### 🚨 Critique (P0)
- ✅ [correction 1]

#### ⚠️ Important (P1)
- ✅ [amélioration 1]

#### 💡 Polish (P2)
- ✅ [amélioration 1]

### 📊 Résumé
| Métrique | Avant | Après |
|----------|-------|-------|
| Lignes code | XXX | YYY |
| Problèmes P0 | X | 0 ✅ |
| Problèmes P1 | Y | 0 ✅ |

### 🧪 Tests Recommandés
- Tester mode clair/sombre
- Tester navigation clavier
- Tester responsive mobile/desktop

### 📝 Commit Suggéré
```bash
polish: amélioration [Nom]

P0: [corrections critiques]
P1: [améliorations importantes]
P2: [polish UX]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```
```

**5.3. Documenter** dans LOGME.md si changement significatif

---

## Checklist Points Clés (Référence Rapide)

### 🎨 UX/UI Top 5
- [ ] Skeleton loading (pas spinner seul)
- [ ] Toasts auto-dismiss (3-5s)
- [ ] Empty states avec illustration + CTA
- [ ] Formulaires : validation inline + erreurs claires
- [ ] Animations 150-300ms avec prefers-reduced-motion

### ⚡ Performance Top 5
- [ ] Debounce recherche (300ms)
- [ ] Pagination listes > 20 items
- [ ] React Query staleTime approprié
- [ ] Images lazy loaded
- [ ] useMemo/useCallback si re-renders

### 🧹 Code Quality Top 5
- [ ] Pas de `any`
- [ ] Composants < 300 lignes
- [ ] Nommage explicite (handleX, isX)
- [ ] Keys uniques dans listes
- [ ] useEffect dépendances correctes

### ♿ Accessibilité Top 5
- [ ] Navigation Tab complète
- [ ] Focus visible (ring-2)
- [ ] ARIA labels boutons icônes
- [ ] Contraste ≥ 4.5:1
- [ ] Labels associés inputs

### 🔒 Sécurité Top 3
- [ ] Validation client + serveur
- [ ] Pas de dangerouslySetInnerHTML
- [ ] Pas de secrets côté client

### 📝 Documentation Top 3
- [ ] Commentaires seulement si logique non évidente
- [ ] JSDoc sur fonctions publiques
- [ ] TODOs explicites avec contexte

---

## Classification des Problèmes

### 🚨 CRITIQUE (P0) - Bloquant
- **Accessibilité** : Contraste < 4.5:1, navigation clavier cassée
- **Sécurité** : XSS, secrets exposés, validation manquante
- **Code** : TypeScript errors, composant > 500 lignes
- **Performance** : Chargement > 5s, freeze UI

### ⚠️ IMPORTANT (P1) - Doit être corrigé
- **UX** : Pas de loading states, validation confuse, erreurs non claires
- **Performance** : Chargement 3-5s, re-renders inutiles
- **Code** : `any` utilisé, prop drilling > 2 niveaux
- **Accessibilité** : ARIA manquant, focus non visible

### 💡 POLISH (P2) - Nice-to-have
- **UX** : Micro-animations, raccourcis clavier, optimistic UI
- **Performance** : Virtual scrolling, code splitting
- **Code** : Commentaires, JSDoc
- **Accessibilité** : Skip links, landmarks sémantiques

---

## Règles Importantes

### ✅ À FAIRE
1. **Toujours lire CLAUDE.md** avant de commencer (principes UX/UI 2026)
2. **Analyser avant de modifier** - comprendre le code existant
3. **Demander confirmation** - utiliser AskUserQuestion
4. **Respecter les conventions** du projet
5. **Tester le build** après modifications
6. **Documenter les changements**

### ❌ À ÉVITER
1. ❌ Ne jamais modifier sans audit préalable
2. ❌ Ne jamais tout réécrire sans justification (préférer Edit ciblés)
3. ❌ Ne jamais ajouter de dépendances sans validation
4. ❌ Ne jamais casser les fonctionnalités existantes
5. ❌ Ne jamais ignorer les erreurs TypeScript
6. ❌ Ne jamais sur-optimiser sans mesurer

---

## Format de sortie attendu

À la fin, fournir un rapport markdown :

```markdown
## ✅ Améliorations appliquées sur [Nom Page/Fonctionnalité]

### Phase 1 - Critique (Accessibilité & Mobile)
1. ✅ Fix contraste WCAG - text-gray-600 → text-gray-700
2. ✅ Vue Cards Mobile - Responsive < 1024px
3. ✅ [Autre amélioration critique]

### Phase 2 - Important (UX)
4. ✅ Bulk Actions - Sélection multiple avec barre actions
5. ✅ Optimistic UI - Rollback sur erreurs
6. ✅ Validation temps réel - Indicateurs success/error

### Phase 3 - Polish (UX avancée)
7. ✅ Animations micro-interactions - Transitions 200-300ms
8. ✅ Raccourcis clavier - Cmd+N, Cmd+Shift+R, Escape, Cmd+A
9. ✅ [Autre amélioration polish]

### Fichiers modifiés
- [Page.tsx](chemin/vers/Page.tsx) - Vue + bulk actions + raccourcis
- [useHook.ts](chemin/vers/useHook.ts) - Optimistic UI
- [Component.tsx](chemin/vers/Component.tsx) - Responsive + animations

### Prochaines étapes recommandées (optionnel)
- Ajouter tests E2E Playwright pour nouveaux patterns
- Vérifier performance avec Lighthouse (> 90 score)
- Documenter composants réutilisables dans Storybook
```

---

## Objectif Final

Transformer chaque page/composant en **référence de qualité** :
- 🎯 Zéro problème P0 et P1
- 🚀 UX moderne et fluide (2026)
- ♿ Accessibilité WCAG 2.1 AA
- 🧹 Code maintenable et lisible
- 🔒 Sécurité garantie

**Chaque composant poli doit être une vitrine de l'excellence technique de Quelyos ERP.**
