# Commande /no-odoo - Détection Références Odoo UI

## Description
Audit et correction des mentions "Odoo" visibles par utilisateurs finaux dans les interfaces frontend et backoffice.

**Exception** : `frontend/src/app/legal/page.tsx` préservée pour conformité licence LGPL-3.0.

## Usage
```bash
/no-odoo              # Audit complet (détection uniquement)
/no-odoo --fix        # Corrections automatiques des violations P0
```

## Workflow

### Étape 1 : Détection
**Cibles** : `frontend/src/` et `backoffice/src/`

**Exclusions** :
- `lib/odoo/` - Code API interne
- `api/` - Endpoints backend
- `frontend/src/app/legal/` - Conformité LGPL
- `*.test.ts`, `*.test.tsx` - Tests unitaires

**Commande Grep** :
```bash
grep -r "Odoo" frontend/src backoffice/src \
  --include="*.tsx" --include="*.ts" \
  --exclude-dir=lib/odoo \
  --exclude=*test.ts* \
  | grep -v "frontend/src/app/legal"
```

### Étape 2 : Classification des Violations

**P0 - Critique** (UI visible utilisateur final) :
- Strings affichés : tooltips, messages, labels
- Empty states, error messages
- Exemples : `"dans Odoo"`, `"via Odoo natif"`

**P1 - Important** (métadonnées exposées) :
- Labels de champs : `"ID Odoo"` → `"ID Système"`
- Headers de colonnes

**P2 - Mineur** (optionnel) :
- Commentaires code
- Console.log internes

### Étape 3 : Corrections Automatiques (--fix)

**Mapping de remplacement** :
| Pattern Original | Remplacement |
|-----------------|--------------|
| `dans Odoo` | `dans la configuration système` |
| `via Odoo natif` | `via l'interface d'administration` |
| `l'interface Odoo` | `l'interface d'administration` |
| `gérées dans Odoo` | `gérées dans l'interface d'administration` |
| `configurées dans Odoo` | `configurées dans l'interface d'administration` |
| `ID Odoo` | `ID Système` |

**Application** :
- Mode `--fix` : Edit automatique des fichiers P0
- Sans `--fix` : Rapport uniquement

### Étape 4 : Rapport de Sortie

**Format** :
```
🔍 Violations Odoo UI détectées : 7

[P0] CRITIQUE (6)
  ❌ backoffice/src/components/common/VariantManager.tsx:304
     "dans Odoo" → "dans la configuration système"

  ❌ backoffice/src/components/common/VariantManager.tsx:328
     "modifiez cet attribut dans Odoo" → "...dans la configuration système"

  [...]

[P1] IMPORTANT (1)
  ⚠️  backoffice/src/pages/ProductDetail.tsx:478
     "ID Odoo" → "ID Système"

✅ Exception préservée : frontend/src/app/legal/page.tsx
```

## Tests Post-Correction

### Vérifications Build
```bash
cd backoffice && npm run build  # TypeScript OK
cd frontend && npm run build    # Next.js OK
```

### Vérifications Manuelles UI
1. **VariantManager** : Tooltip attribut sans variantes
2. **Pricelists** : Empty state
3. **PricelistDetail** : Messages règles de prix
4. **Warehouses** : Note configuration
5. **ProductDetail** : Label métadonnée
6. **Legal** : Mentions Odoo présentes ✅

## Intégration CI/CD (Optionnel)

### Hook Pre-Commit
Fichier : `.githooks/pre-commit-no-odoo`
- Bloque commits avec violations P0
- Ignore legal/

### GitHub Actions
Fichier : `.github/workflows/no-odoo-check.yml`
- Check PR automatique
- Bloque merge si violations

## Métriques de Succès

- ✅ 100% violations P0 détectées
- ✅ Corrections ciblées (pas de sur-engineering)
- ✅ Page legal/ préservée (conformité LGPL)
- ✅ Builds frontend/backoffice OK
- ✅ Aucun "Odoo" visible dans UI (hors legal/)

## Violations Connues Résolues

### Backoffice (7 corrections)
1. `VariantManager.tsx:304` - Tooltip attribut P0 ✅
2. `VariantManager.tsx:328` - Message aide P0 ✅
3. `Pricelists.tsx:364` - Empty state P0 ✅
4. `PricelistDetail.tsx:368` - Message règles P0 ✅
5. `PricelistDetail.tsx:383` - Instruction P0 ✅
6. `Warehouses.tsx:421` - Note configuration P0 ✅
7. `ProductDetail.tsx:478` - Label métadonnée P1 ✅

### Frontend
Aucune violation détectée (hors legal/ préservée)
