# Commande /align - Vérification et Correction Alignement SaaS ↔ ERP

## Objectif
Détecter et corriger les problèmes d'alignement entre :
- Les 7 SaaS (apps/finance-os, store-os, copilote-ops, sales-os, retail-os, team-os, support-os)
- Les modules correspondants dans dashboard-client (ERP Complet / Full Suite)

## Vérifications

### 1. Divergences Types
Comparer les définitions de types entre :
- `apps/[saas]/src/types/*.ts` (anciens fichiers locaux)
- `dashboard-client/src/types/*.ts` (anciens fichiers locaux)
- `packages/types/src/*.ts` (SOURCE DE VÉRITÉ unique)

**Erreurs détectées** :
- Types identiques mais divergents (ex: `TicketState` 5 vs 6 états)
- Fichiers types locaux non migrés vers `@quelyos/types`

### 2. Duplication Hooks
Comparer les hooks :
- `apps/[saas]/src/hooks/*.ts`
- `dashboard-client/src/hooks/*.ts`

**Avertissements** :
- Code identique entre SaaS et ERP (duplication à éviter)
- Recommandation : Conserver dans dashboard-client, SaaS importe types de `@quelyos/types`

### 3. Pages Manquantes
Vérifier que pages SaaS existent dans dashboard-client :
- `apps/[saas]/src/pages/[module]/*.tsx`
- `dashboard-client/src/pages/[module]/*.tsx`

**Info** :
- Page existe dans SaaS mais pas dashboard → peut être légitime si spécifique SaaS
- Page existe dans dashboard mais pas SaaS → SaaS doit copier ou adapter

### 4. Configuration Modules
Comparer :
- `apps/[saas]/src/config/modules.ts`
- `dashboard-client/src/config/modules.ts`

**Vérifier cohérence** :
- Menu/routes SaaS ⊆ menu/routes dashboard
- Noms de routes identiques
- Structure navigation cohérente

### 5. Imports Types
Vérifier que TOUS les SaaS et dashboard utilisent `@quelyos/types` :
```bash
# Rechercher imports locaux obsolètes
grep -r "from '@/types/" apps/*/src/
grep -r "from '@/types/" dashboard-client/src/
```

**Erreur critique** si imports locaux trouvés → migration obligatoire vers `@quelyos/types`

## Corrections Automatiques

### 1. Migrer Types vers `packages/types/`
```bash
# Créer fichier module dans packages/types/src/
cp dashboard-client/src/types/[module].ts packages/types/src/[module].ts

# Remplacer imports dans tous les fichiers
find apps/*/src/ dashboard-client/src/ -name "*.ts" -o -name "*.tsx" \
  | xargs sed -i '' "s|from '@/types/[module]'|from '@quelyos/types'|g"

# Supprimer anciens fichiers
rm apps/*/src/types/[module].ts dashboard-client/src/types/[module].ts
```

### 2. Copier Pages Manquantes
```bash
# Si page existe dans dashboard mais pas SaaS
cp dashboard-client/src/pages/[module]/[Page].tsx apps/[saas]/src/pages/[module]/

# Adapter imports et branding si nécessaire
```

### 3. Harmoniser Configuration Modules
```bash
# Synchroniser routes depuis dashboard vers SaaS
# (manuel car nécessite compréhension métier)
```

## Usage

### Vérifier tous les SaaS
```bash
/align
```

### Vérifier un SaaS spécifique
```bash
/align support-os
/align finance-os
```

### Appliquer corrections automatiques
```bash
/align --fix
/align support-os --fix
```

## Output Attendu

```
🔍 Vérification Alignement SaaS ↔ ERP...

📦 Support-OS vs Module Support (dashboard-client)
  ❌ ERREUR: Divergence types
     → TicketState: 5 états (dashboard) vs 6 états (support-os)
     → Suggestion: Migrer vers packages/types/src/support.ts
     → RÉSOLU: Types migrés vers @quelyos/types

  ⚠️  ATTENTION: Duplication code
     → useTickets.ts: 208 lignes identiques
     → Suggestion: Conserver dans dashboard, SaaS importe types
     → STATUS: OK (types centralisés, hooks locaux acceptés)

  ℹ️  INFO: Page manquante dans dashboard
     → apps/support-os/src/pages/support/Dashboard.tsx
     → Non présente dans dashboard-client
     → Suggestion: Copier si pertinent pour ERP complet

📦 Finance-OS vs Module Finance
  ✅ Alignement: 95%
  ✅ Types identiques
  ✅ Hooks cohérents

📦 Store-OS vs Module Store
  ✅ Alignement: 90%
  ⚠️  ATTENTION: Hook useMarketingCampaigns divergent
     → Implémentation différente (useState vs react-query)
     → Justifié: État management spécifique SaaS

---
Résumé:
  - 0 erreurs critiques
  - 1 avertissement à vérifier
  - 1 info pour information

✅ Alignement global: 88% (7 SaaS)
```

## Implémentation

### Script Node.js
Créer `scripts/verify-saas-alignment.ts` :
```typescript
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

const SAAS_APPS = [
  { name: 'finance-os', modules: ['finance'] },
  { name: 'store-os', modules: ['store', 'marketing'] },
  { name: 'copilote-ops', modules: ['stock', 'hr'] },
  { name: 'sales-os', modules: ['crm', 'marketing'] },
  { name: 'retail-os', modules: ['pos', 'store', 'stock'] },
  { name: 'team-os', modules: ['hr'] },
  { name: 'support-os', modules: ['support'] },
]

interface AlignmentIssue {
  type: 'duplication' | 'divergence' | 'missing-page' | 'missing-route' | 'local-types'
  severity: 'error' | 'warning' | 'info'
  file: string
  suggestion: string
  autofix?: () => void
}

function verifyTypesImports(saasName: string): AlignmentIssue[] {
  // Vérifier imports types locaux
}

function comparePages(saasName: string, modules: string[]): AlignmentIssue[] {
  // Comparer pages SaaS vs dashboard
}

function detectDuplication(saasName: string): AlignmentIssue[] {
  // Détecter duplication hooks
}

// ... implémentation complète dans script dédié
```

### Intégration Skill Claude
Le skill `/align` appelle le script TypeScript et analyse les résultats.

## Bénéfices

### Court Terme
- Détection automatique divergences types
- 0 duplication types après migration `@quelyos/types`
- Workflow clair pour développeurs

### Long Terme
- Scalabilité : Nouveau SaaS = importer types centralisés
- Cohérence : Contrats API garantis identiques
- Productivité : Développer feature une fois (dashboard) → SaaS réutilise

## Prochaines Extensions

1. Migrer autres modules vers `packages/types/` (marketing, crm, stock, hr, pos, finance)
2. Créer `packages/business-hooks/` si duplication hooks devient problématique
3. Intégrer `/align` dans CI/CD (vérification pre-commit)
4. Étendre skill pour corrections auto-push
