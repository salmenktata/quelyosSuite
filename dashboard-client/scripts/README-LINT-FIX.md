# Scripts de Correction ESLint

## Vue d'ensemble

Scripts automatisés pour corriger les erreurs ESLint du dashboard-client.

**État actuel :** ~255 warnings
**Objectif :** < 50 warnings

## Scripts disponibles

### 1. `analyze-lint-errors.sh` 🔍

**Analyse détaillée des erreurs par catégorie**

```bash
./scripts/analyze-lint-errors.sh
```

**Affiche :**
- Nombre d'erreurs par type (any, hooks, unused vars)
- Top 10 fichiers avec le plus d'erreurs
- Recommandations priorisées

### 2. `fix-lint-errors.sh` 🔧

**Corrections automatiques batch**

```bash
./scripts/fix-lint-errors.sh
```

**Effectue :**
1. ✅ Supprime tous les `as any` casts
2. ✅ Auto-fix ESLint (imports, formatage)
3. ✅ Propose un commit des changements

**⚠️ Attention :** Certaines corrections nécessitent typage manuel

## Workflow recommandé

### Option A : Corrections rapides (30 min)

```bash
# 1. Analyser l'état actuel
./scripts/analyze-lint-errors.sh

# 2. Appliquer corrections auto
./scripts/fix-lint-errors.sh

# 3. Vérifier résultat
pnpm lint

# 4. Commit
git add .
git commit -m "fix(lint): corrections automatiques batch"
```

### Option B : Corrections progressives (2-3h)

**Jour 1 : Supprimer les `any`**
```bash
# Corriger top 10 fichiers avec le plus d'any
./scripts/analyze-lint-errors.sh | grep "Types 'any'" -A 15

# Corriger manuellement chaque fichier
# Commit après chaque fichier
```

**Jour 2 : Corriger les hooks**
```bash
# Corriger dépendances manquantes
# Wrapper fonctions dans useCallback

# Fichiers prioritaires (liste dans analyze output)
```

**Jour 3 : Cleanup final**
```bash
# Variables non utilisées
# React refresh warnings (optionnel)
```

## Corrections manuelles nécessaires

### 1. Types `any` → types stricts

**Avant :**
```typescript
const [data, setData] = useState<any>(null);
const items = data as any;
```

**Après :**
```typescript
interface DataType {
  id: number;
  name: string;
}
const [data, setData] = useState<DataType | null>(null);
const items = data as DataType;
```

### 2. Dépendances hooks manquantes

**Avant :**
```typescript
useEffect(() => {
  fetchData();
}, [filters]);

const fetchData = async () => { ... }
```

**Après :**
```typescript
import { useCallback } from 'react';

const fetchData = useCallback(async () => {
  ...
}, [filters]);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

### 3. Variables non utilisées

**Avant :**
```typescript
const { data, error } = useQuery();  // error non utilisé
```

**Après :**
```typescript
const { data, error: _error } = useQuery();
// ou
const { data } = useQuery();
```

## Problèmes connus

### Le linter réintroduit des erreurs

**Cause :** Prettier/ESLint auto-format en arrière-plan

**Solutions :**
1. Désactiver auto-format temporairement
2. Committer immédiatement après corrections
3. Configurer ESLint en mode "error" au lieu de "warning"

### Configuration recommandée

Ajouter à `.eslintrc.json` :
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "react-hooks/exhaustive-deps": "error"
  }
}
```

## Métriques de progression

```bash
# Avant chaque session
pnpm lint 2>&1 | grep "warnings" | tee lint-before.txt

# Après corrections
pnpm lint 2>&1 | grep "warnings" | tee lint-after.txt

# Comparer
diff lint-before.txt lint-after.txt
```

## Support

Si les scripts ne fonctionnent pas :

1. Vérifier permissions : `chmod +x scripts/*.sh`
2. Vérifier Node/pnpm : `pnpm --version`
3. Nettoyer : `pnpm install`
4. Relancer : `./scripts/analyze-lint-errors.sh`

## Objectifs par phase

**Phase 1 (Quick wins) :**
- [ ] Supprimer tous les `as any` → -60 warnings
- [ ] Auto-fix imports → -20 warnings

**Phase 2 (Hooks) :**
- [ ] Wrapper fonctions fetch → -30 warnings
- [ ] Corriger deps manquantes → -20 warnings

**Phase 3 (Cleanup) :**
- [ ] Variables non utilisées → -10 warnings
- [ ] Types stricts manuels → -20 warnings

**Total objectif :** ~115 warnings corrigées
**Résultat visé :** < 50 warnings restants
