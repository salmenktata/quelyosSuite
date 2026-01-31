# Guide Alignement SaaS ↔ ERP

## Vue d'Ensemble

Ce guide documente la stratégie d'alignement entre les **7 SaaS Quelyos** et le **ERP Complet (dashboard-client)**.

**Objectif** : Éliminer duplication code/types, garantir cohérence fonctionnelle, maximiser réutilisation.

---

## Principe Fondamental

**Dashboard-client (ERP Complet)** = SOURCE DE VÉRITÉ

```
dashboard-client (ERP Complet / Full Suite)
    ↓ Types centralisés (@quelyos/types)
    ↓ Fonctionnalités complètes
    ↓
7 SaaS (réutilisation ou adaptation)
```

**Flow** :
1. Développer feature dans **dashboard-client** (ERP)
2. Centraliser types dans **`packages/types/`**
3. SaaS **copie** ou **importe** selon besoin

---

## Architecture Types Centralisés

### Package `@quelyos/types`

```
packages/types/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts          # Exports centralisés
    ├── support.ts        # ✅ COMPLET (support-os + dashboard)
    ├── finance.ts        # ⏳ TODO
    ├── marketing.ts      # ⏳ TODO
    ├── crm.ts            # ⏳ TODO
    ├── stock.ts          # ⏳ TODO
    ├── hr.ts             # ⏳ TODO
    └── pos.ts            # ⏳ TODO
```

**Pourquoi ?**
- **0 divergence** : 1 définition unique par type
- **Garantie contrat API** : Tous utilisent mêmes interfaces
- **Maintenance centralisée** : Modification = propagation automatique

**Statut Migration** :
| Module | Statut | SaaS Concernés |
|--------|--------|----------------|
| support | ✅ Migré | support-os |
| finance | ⏳ TODO | finance-os |
| marketing | ⏳ TODO | store-os, sales-os |
| crm | ⏳ TODO | sales-os, support-os |
| stock | ⏳ TODO | copilote-ops, retail-os |
| hr | ⏳ TODO | copilote-ops, team-os |
| pos | ⏳ TODO | retail-os |

---

## Mapping SaaS ↔ Modules

| SaaS | Port | Modules Utilisés | Statut Alignement |
|------|------|------------------|-------------------|
| **finance-os** | 3010 | `finance` | ✅ 95% |
| **store-os** | 3011 | `store`, `marketing` | ✅ 90% |
| **copilote-ops** | 3012 | `stock`, `hr` (GMAO) | ⚠️ 70% |
| **sales-os** | 3013 | `crm`, `marketing` | ⚠️ 65% |
| **retail-os** | 3014 | `pos`, `store`, `stock` | ✅ 85% |
| **team-os** | 3015 | `hr` | ⚠️ 60% |
| **support-os** | 3016 | `support`, `crm` | ✅ **95%** ⬆️ (grâce migration types) |

**Score Alignement** = (types centralisés + hooks cohérents + pages synchronisées) / 100

---

## Cas d'Usage

### Cas 1 : Migration Types Existants

**Problème** : `TicketState` défini différemment dans dashboard-client (5 états) et support-os (6 états)

**Solution** :
1. Créer `packages/types/src/support.ts` avec version unifiée (6 états)
2. Remplacer imports locaux par `@quelyos/types`
3. Adapter code pour nouveaux états

**Avant** :
```typescript
// dashboard-client/src/types/support.ts
export type TicketState = 'new' | 'open' | 'pending' | 'resolved' | 'closed'

// apps/support-os/src/types/support.ts
export type TicketState = 'new' | 'in_progress' | 'waiting' | 'resolved' | 'closed' | 'cancelled'
```

**Après** :
```typescript
// packages/types/src/support.ts (SOURCE UNIQUE)
export type TicketState = 'new' | 'open' | 'pending' | 'resolved' | 'closed' | 'cancelled'

// dashboard-client/src/hooks/useTickets.ts
import type { TicketState } from '@quelyos/types'  // ✅

// apps/support-os/src/hooks/useTickets.ts
import type { TicketState } from '@quelyos/types'  // ✅ Même source
```

**Résultat** :
- ✅ 0 divergence
- ✅ 1 source de vérité
- ✅ Modification future = propagation automatique

---

### Cas 2 : Nouvelle Feature Support

**Objectif** : Ajouter "Tags" aux tickets

**Workflow** :

#### 1. Définir Types (`packages/types/src/support.ts`)
```typescript
export interface TicketTag {
  id: number
  name: string
  color: string
}

export interface Ticket {
  id: number
  subject: string
  tags?: TicketTag[]  // ← NOUVEAU
  // ...
}
```

#### 2. Développer Hook (`dashboard-client/src/hooks/useTickets.ts`)
```typescript
import type { TicketTag } from '@quelyos/types'

export function useTicketTags() {
  return useQuery({
    queryKey: ['ticket-tags'],
    queryFn: () => api.getTicketTags()
  })
}
```

#### 3. Développer Page (`dashboard-client/src/pages/support/TicketTags.tsx`)
```tsx
import { useTicketTags } from '@/hooks/useTickets'
import type { TicketTag } from '@quelyos/types'

export default function TicketTags() {
  const { data } = useTicketTags()
  // ... UI gestion tags
}
```

#### 4. Copier dans SaaS (si besoin)
```bash
# Hook
cp dashboard-client/src/hooks/useTickets.ts apps/support-os/src/hooks/

# Page
cp dashboard-client/src/pages/support/TicketTags.tsx apps/support-os/src/pages/support/
```

#### 5. Vérifier Alignement
```bash
/align-saas support-os
```

**Résultat** :
- ✅ Types garantis identiques (`@quelyos/types`)
- ✅ Feature développée 1 fois (dashboard)
- ✅ SaaS réutilise sans divergence

---

### Cas 3 : Feature Spécifique SaaS

**Objectif** : Dashboard stats temps-réel (uniquement support-os)

**Approche** :

#### 1. Types dans `packages/types/` (même si SaaS-only)
```typescript
// packages/types/src/support.ts
/**
 * Dashboard support stats (SaaS support-os specific)
 * @saas-specific support-os
 */
export interface SupportDashboardStats {
  totalTickets: number
  openTickets: number
  avgResponseTime: number
}
```

**Pourquoi ?** Futur réutilisation possible dans dashboard-client

#### 2. Hook/Page uniquement dans SaaS
```tsx
// apps/support-os/src/pages/support/Dashboard.tsx
import type { SupportDashboardStats } from '@quelyos/types'

export default function Dashboard() {
  const { data } = useSupportDashboardStats()
  // ... UI spécifique SaaS
}
```

#### 3. Documenter avec `/align-saas`
```
ℹ️  INFO: Page SaaS-specific
   → apps/support-os/src/pages/support/Dashboard.tsx
   → Non présente dans dashboard-client
   → Justifié: Feature temps-réel spécifique SaaS
```

**Résultat** :
- ✅ Types centralisés (réutilisables)
- ✅ Feature documentée (SaaS-specific)
- ✅ Futur migration ERP simplifiée

---

## Commande `/align-saas`

### Usage

```bash
# Vérifier tous les SaaS
/align-saas

# Vérifier un SaaS spécifique
/align-saas support-os
/align-saas finance-os

# Appliquer corrections automatiques
/align-saas --fix
```

### Output Exemple

```
🔍 Vérification Alignement SaaS ↔ ERP...

📦 Support-OS vs Module Support (dashboard-client)
  ✅ Types centralisés (@quelyos/types)
  ✅ Hooks cohérents (imports @quelyos/types)
  ✅ Pages synchronisées (3/3)

  Résumé:
    - 0 erreur critique
    - 0 avertissement
    - 1 info (page SaaS-specific OK)

  ✅ Alignement: 95%

📦 Finance-OS vs Module Finance
  ❌ ERREUR: Types locaux trouvés
     → apps/finance-os/src/types/invoice.ts
     → Suggestion: Migrer vers packages/types/src/finance.ts

  ⚠️  ATTENTION: Page manquante
     → dashboard-client/src/pages/finance/Forecasts.tsx
     → Non présente dans finance-os

  Résumé:
    - 1 erreur critique
    - 1 avertissement

  ❌ Alignement: 65%

---
Résumé Global (7 SaaS):
  - 1 erreur critique (finance-os)
  - 1 avertissement

  📊 Score Alignement Moyen: 88%

Recommandations:
  1. Migrer types finance → packages/types/
  2. Copier page Forecasts vers finance-os (si pertinent)
  3. Relancer /align-saas après corrections
```

### Interprétation Résultats

| Symbole | Signification | Action |
|---------|---------------|--------|
| ❌ ERREUR | Divergence critique (types différents) | **Corriger immédiatement** |
| ⚠️ ATTENTION | Duplication ou incohérence | Vérifier justification |
| ℹ️ INFO | Information (page SaaS-only OK) | Documenter si besoin |
| ✅ OK | Alignement correct | RAS |

**Score Alignement** :
- **95-100%** : Excellent (support-os actuel)
- **85-94%** : Bon (retail-os, store-os)
- **70-84%** : Acceptable (copilote-ops)
- **<70%** : Problématique (sales-os, team-os, finance-os) → migration urgente

---

## Règles Développement

### ✅ Règles d'Or

1. **TOUJOURS** commencer par définir types dans `packages/types/`
2. **TOUJOURS** développer feature dans dashboard-client (ERP) en premier
3. **TOUJOURS** importer types depuis `@quelyos/types` (jamais locaux)
4. **TOUJOURS** lancer `/align-saas` avant commit

### ❌ Anti-Patterns

1. ❌ Définir types locaux (`apps/*/src/types/`) si partagés entre ERP + SaaS
2. ❌ Développer feature dans SaaS sans version ERP
3. ❌ Copier-coller types entre apps
4. ❌ Commit sans vérifier `/align-saas`

### ⚠️ Cas Exceptionnels Acceptés

1. ⚠️ Hooks locaux divergents (si logique métier spécifique)
   - **MAIS** types importés de `@quelyos/types`
2. ⚠️ Pages SaaS-only (si feature vraiment spécifique)
   - **MAIS** types dans `@quelyos/types` (futur réutilisation)
3. ⚠️ UI différente (présentation SaaS vs ERP)
   - **MAIS** données identiques (types `@quelyos/types`)

---

## Roadmap Migration

### Phase 1 : Support (✅ Terminée)
- [x] Migrer types support → `packages/types/src/support.ts`
- [x] Remplacer imports dashboard-client
- [x] Remplacer imports support-os
- [x] Build tests OK
- [x] Alignement: 95%

### Phase 2 : Finance (⏳ En Cours)
- [ ] Analyser types finance dashboard-client
- [ ] Créer `packages/types/src/finance.ts`
- [ ] Migrer imports dashboard-client
- [ ] Migrer imports finance-os
- [ ] Vérifier `/align-saas finance-os`
- [ ] Objectif: 95%

### Phase 3 : Marketing (⏳ TODO)
- [ ] SaaS concernés: store-os, sales-os
- [ ] Migrer types marketing
- [ ] Objectif: 90%

### Phase 4 : CRM (⏳ TODO)
- [ ] SaaS concernés: sales-os, support-os
- [ ] Migrer types CRM
- [ ] Objectif: 90%

### Phase 5 : Stock (⏳ TODO)
- [ ] SaaS concernés: copilote-ops, retail-os
- [ ] Migrer types stock
- [ ] Objectif: 85%

### Phase 6 : HR (⏳ TODO)
- [ ] SaaS concernés: copilote-ops, team-os
- [ ] Migrer types HR
- [ ] Objectif: 85%

### Phase 7 : POS (⏳ TODO)
- [ ] SaaS concerné: retail-os
- [ ] Migrer types POS
- [ ] Objectif: 90%

**Objectif Final** : Alignement global > 90% (7 SaaS)

---

## Métriques Succès

### KPIs

| Métrique | Cible | Actuel | Progression |
|----------|-------|--------|-------------|
| Types centralisés | 100% | 14% (1/7 modules) | 🟡 |
| Score alignement moyen | >90% | 88% | 🟢 |
| SaaS score >85% | 7/7 | 4/7 | 🟡 |
| Erreurs critiques | 0 | 3 | 🔴 |

### Objectifs Q1 2026

- [x] Setup `packages/types/` ✅
- [x] Migration support (POC) ✅
- [ ] Migration finance, marketing, crm (3 modules) ⏳
- [ ] Score alignement global > 92%
- [ ] 0 erreur critique

---

## Références

- [DEVELOPMENT_WORKFLOW.md](./.claude/DEVELOPMENT_WORKFLOW.md) — Workflow développement détaillé
- [Skill /align-saas](./.claude/skills/align-saas.md) — Documentation commande
- [CLAUDE.md](./CLAUDE.md) — Instructions principales
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Architecture globale
