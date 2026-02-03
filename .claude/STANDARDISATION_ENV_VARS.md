# Standardisation Variables .env - Plan d'Action

**Date** : 3 février 2026
**Objectif** : Uniformiser les noms de variables environnement entre tous les frontends
**Statut** : 🟡 En cours

---

## 📊 État Actuel - Inconsistances Détectées

### Backend URL (Critique)

| App | Variables | Problème |
|-----|-----------|----------|
| dashboard-client | `VITE_API_URL` + `VITE_BACKEND_URL` | **Double définition!** |
| vitrine-client | `BACKEND_URL` + `NEXT_PUBLIC_BACKEND_URL` | OK (server + client) |
| super-admin-client | `VITE_BACKEND_URL` | OK |
| vitrine-quelyos | `BACKEND_URL` + `NEXT_PUBLIC_BACKEND_URL` | OK (server + client) |

**Problème** : dashboard-client définit 2 variables pour la même chose.

### Frontend URLs

| App | Variables | Problème |
|-----|-----------|----------|
| dashboard-client | `VITE_SHOP_URL`, `VITE_SITE_URL` | Noms non standards |
| vitrine-client | `NEXT_PUBLIC_SITE_URL` | OK |
| vitrine-quelyos | `NEXT_PUBLIC_WEBSITE_URL`, `NEXT_PUBLIC_FINANCE_APP_URL`, etc. | Noms incohérents |

### Database

| App | Variable | Problème |
|-----|----------|----------|
| vitrine-client | `BACKEND_DATABASE` | OK |
| vitrine-quelyos | `BACKEND_DB` | **Abréviation** (devrait être BACKEND_DATABASE) |

### Timeouts

| App | Variable | Problème |
|-----|----------|----------|
| super-admin-client | `VITE_API_TIMEOUT=30000` | **Devrait utiliser @quelyos/config** |

---

## 🎯 Schéma de Nommage Standard

### Convention Adoptée

```bash
# Format: [PREFIX_]CATEGORY_SUBCATEGORY[_QUALIFIER]

# Exemples:
BACKEND_URL                    # Server-side backend URL
PUBLIC_BACKEND_URL             # Client-side backend URL (Next.js: NEXT_PUBLIC_, Vite: VITE_)
PUBLIC_DASHBOARD_URL           # Client-side dashboard URL
PUBLIC_VITRINE_URL             # Client-side vitrine URL
BACKEND_DATABASE               # Database name
```

### Règles

1. **Préfixe obligatoire**:
   - Next.js client: `NEXT_PUBLIC_`
   - Vite client: `VITE_`
   - Server-side: Aucun préfixe

2. **Catégories**:
   - `BACKEND_*` : Backend/API
   - `PUBLIC_*` : URLs publiques (après préfixe)
   - `*_DATABASE` : Database (pas `*_DB`)
   - `*_TIMEOUT` : **À SUPPRIMER** (utiliser @quelyos/config)

3. **Ordre**:
   - Catégorie > Sous-catégorie > Qualificateur
   - Ex: `BACKEND_URL`, `BACKEND_DATABASE`, `BACKEND_WEBHOOK_SECRET`

---

## 📋 Plan de Migration

### Phase 1 : Dashboard-Client (Vite)

#### Problèmes à Corriger

1. **Double définition Backend URL**
   ```bash
   # ❌ Avant
   VITE_API_URL=http://localhost:8069
   VITE_BACKEND_URL=http://localhost:8069

   # ✅ Après
   VITE_BACKEND_URL=http://localhost:8069
   ```
   **Action** : Supprimer `VITE_API_URL`, garder `VITE_BACKEND_URL`

2. **URLs frontend non standards**
   ```bash
   # ❌ Avant
   VITE_SHOP_URL=http://localhost:3001
   VITE_SITE_URL=https://quelyos.com

   # ✅ Après
   VITE_ECOMMERCE_URL=http://localhost:3001
   VITE_VITRINE_URL=https://quelyos.com
   ```

3. **Timeout hardcodé**
   ```bash
   # ❌ Avant
   VITE_API_TIMEOUT=30000

   # ✅ Après
   # Supprimé - utiliser TIMEOUTS.API_REQUEST de @quelyos/config
   ```

#### Fichiers à Modifier

- `.env`
- `.env.example`
- `.env.development`
- `.env.production`
- `src/lib/config/index.ts` (mise à jour imports)

---

### Phase 2 : Vitrine-Client (Next.js)

#### Changements

```bash
# ✅ Déjà conforme
BACKEND_URL=http://localhost:8069
NEXT_PUBLIC_BACKEND_URL=http://localhost:8069
BACKEND_DATABASE=quelyos
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

**Action** : Aucune modification nécessaire ✅

---

### Phase 3 : Super-Admin-Client (Vite)

#### Changements

```bash
# ✅ Déjà conforme
VITE_BACKEND_URL=http://localhost:8069

# ❌ À supprimer
# VITE_API_TIMEOUT=30000
```

**Action** : Supprimer `VITE_API_TIMEOUT`

---

### Phase 4 : Vitrine-Quelyos (Next.js)

#### Changements

1. **Database**
   ```bash
   # ❌ Avant
   BACKEND_DB=quelyos

   # ✅ Après
   BACKEND_DATABASE=quelyos
   ```

2. **URLs Apps** (OK, mais pourrait être harmonisé)
   ```bash
   # Actuellement OK:
   NEXT_PUBLIC_FINANCE_APP_URL=http://localhost:5175
   NEXT_PUBLIC_MARKETING_APP_URL=http://localhost:3002
   NEXT_PUBLIC_SUPER_ADMIN_URL=http://localhost:3000

   # Alternative harmonisée (optionnel):
   NEXT_PUBLIC_DASHBOARD_URL=http://localhost:5175
   NEXT_PUBLIC_MARKETING_URL=http://localhost:3002
   NEXT_PUBLIC_SUPERADMIN_URL=http://localhost:9000
   ```

3. **Website URL**
   ```bash
   # ❌ Avant
   NEXT_PUBLIC_WEBSITE_URL=http://localhost:3000

   # ✅ Après
   NEXT_PUBLIC_VITRINE_URL=http://localhost:3000
   ```

---

## 🔧 Scripts de Migration

### Script 1 : Migration Dashboard-Client

```bash
#!/bin/bash
# scripts/migrate-env-dashboard.sh

for file in dashboard-client/.env*; do
  if [ -f "$file" ]; then
    echo "Migrating $file..."

    # Supprimer VITE_API_URL (garder VITE_BACKEND_URL)
    sed -i.bak '/^VITE_API_URL=/d' "$file"

    # Renommer VITE_SHOP_URL -> VITE_ECOMMERCE_URL
    sed -i '' 's/VITE_SHOP_URL=/VITE_ECOMMERCE_URL=/' "$file"

    # Renommer VITE_SITE_URL -> VITE_VITRINE_URL
    sed -i '' 's/VITE_SITE_URL=/VITE_VITRINE_URL=/' "$file"

    # Supprimer VITE_API_TIMEOUT
    sed -i '' '/^VITE_API_TIMEOUT=/d' "$file"

    echo "✅ Migrated $file"
  fi
done
```

### Script 2 : Migration Super-Admin-Client

```bash
#!/bin/bash
# scripts/migrate-env-superadmin.sh

for file in super-admin-client/.env*; do
  if [ -f "$file" ]; then
    echo "Migrating $file..."

    # Supprimer VITE_API_TIMEOUT
    sed -i.bak '/^VITE_API_TIMEOUT=/d' "$file"

    echo "✅ Migrated $file"
  fi
done
```

### Script 3 : Migration Vitrine-Quelyos

```bash
#!/bin/bash
# scripts/migrate-env-vitrine-quelyos.sh

for file in vitrine-quelyos/.env*; do
  if [ -f "$file" ]; then
    echo "Migrating $file..."

    # Renommer BACKEND_DB -> BACKEND_DATABASE
    sed -i.bak 's/^BACKEND_DB=/BACKEND_DATABASE=/' "$file"

    # Renommer NEXT_PUBLIC_WEBSITE_URL -> NEXT_PUBLIC_VITRINE_URL
    sed -i '' 's/NEXT_PUBLIC_WEBSITE_URL=/NEXT_PUBLIC_VITRINE_URL=/' "$file"

    echo "✅ Migrated $file"
  fi
done
```

### Script Complet

```bash
#!/bin/bash
# scripts/standardize-env-vars.sh

echo "🔄 STANDARDISATION VARIABLES .ENV"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

./scripts/migrate-env-dashboard.sh
./scripts/migrate-env-superadmin.sh
./scripts/migrate-env-vitrine-quelyos.sh

echo ""
echo "✅ Migration complète!"
echo ""
echo "⚠️  Actions manuelles requises:"
echo "   1. Mettre à jour code utilisant anciennes variables"
echo "   2. Tester tous les frontends"
echo "   3. Supprimer fichiers .bak"
```

---

## 📝 Mises à Jour Code Nécessaires

### Dashboard-Client

```typescript
// src/lib/config/index.ts

// ❌ Avant
const API_URL = import.meta.env.VITE_API_URL;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const SHOP_URL = import.meta.env.VITE_SHOP_URL;
const SITE_URL = import.meta.env.VITE_SITE_URL;
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 30000;

// ✅ Après
import { TIMEOUTS } from '@quelyos/config';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const ECOMMERCE_URL = import.meta.env.VITE_ECOMMERCE_URL;
const VITRINE_URL = import.meta.env.VITE_VITRINE_URL;
const API_TIMEOUT = TIMEOUTS.API_REQUEST;
```

### Vitrine-Quelyos

```typescript
// app/lib/config.ts

// ❌ Avant
const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL;
const DB_NAME = process.env.BACKEND_DB;

// ✅ Après
const VITRINE_URL = process.env.NEXT_PUBLIC_VITRINE_URL;
const DB_NAME = process.env.BACKEND_DATABASE;
```

---

## ✅ Checklist de Validation

### Phase 1 : Dashboard-Client
- [ ] Exécuter script migration .env
- [ ] Mettre à jour `src/lib/config/index.ts`
- [ ] Rechercher usages `VITE_API_URL` (doit être 0)
- [ ] Rechercher usages `VITE_SHOP_URL` (doit être 0)
- [ ] Rechercher usages `VITE_SITE_URL` (doit être 0)
- [ ] Rechercher usages `VITE_API_TIMEOUT` (doit être 0)
- [ ] Build réussi : `pnpm build`
- [ ] Tests manuels : Connexion API, navigation

### Phase 2 : Vitrine-Client
- [ ] ✅ Aucune modification (déjà conforme)

### Phase 3 : Super-Admin-Client
- [ ] Exécuter script migration .env
- [ ] Rechercher usages `VITE_API_TIMEOUT` (doit être 0)
- [ ] Build réussi : `pnpm build`
- [ ] Tests manuels : Connexion API

### Phase 4 : Vitrine-Quelyos
- [ ] Exécuter script migration .env
- [ ] Mettre à jour `app/lib/config.ts`
- [ ] Rechercher usages `BACKEND_DB` (doit être 0)
- [ ] Rechercher usages `NEXT_PUBLIC_WEBSITE_URL` (doit être 0)
- [ ] Build réussi : `pnpm build`
- [ ] Tests manuels : Navigation cross-app

### Validation Globale
- [ ] Tous les builds réussis
- [ ] Aucune référence aux anciennes variables
- [ ] Documentation mise à jour
- [ ] Fichiers .bak supprimés
- [ ] Commit créé

---

## 📊 Résumé Changements

| Variable | Dashboard | Vitrine-Client | Super-Admin | Vitrine-Quelyos |
|----------|-----------|----------------|-------------|-----------------|
| `*_API_URL` | ❌ Supprimer | N/A | N/A | N/A |
| `*_SHOP_URL` | → `*_ECOMMERCE_URL` | N/A | N/A | N/A |
| `*_SITE_URL` | → `*_VITRINE_URL` | N/A | N/A | N/A |
| `*_API_TIMEOUT` | ❌ Supprimer | N/A | ❌ Supprimer | N/A |
| `BACKEND_DB` | N/A | N/A | N/A | → `BACKEND_DATABASE` |
| `*_WEBSITE_URL` | N/A | N/A | N/A | → `*_VITRINE_URL` |

**Total** : 8 changements sur 4 applications

---

## 📖 Documentation à Mettre à Jour

1. **`.env.example`** de chaque app : Commenter les nouvelles variables
2. **README-DEV.md** : Section "Variables environnement"
3. **CLAUDE.md** : Référencer ce document
4. **`.claude/PROCHAINES_ETAPES_CONFIG.md`** : Marquer P1 comme complété

---

## 🚀 Commandes d'Exécution

```bash
# 1. Créer les scripts
chmod +x scripts/migrate-env-*.sh scripts/standardize-env-vars.sh

# 2. Exécuter la migration
./scripts/standardize-env-vars.sh

# 3. Mettre à jour le code manuellement (voir section ci-dessus)

# 4. Valider les builds
pnpm build --filter "./dashboard-client"
pnpm build --filter "./super-admin-client"
pnpm build --filter "./vitrine-quelyos"

# 5. Supprimer backups
find . -name ".env*.bak" -delete

# 6. Commit
git add .
git commit -m "refactor(env): standardisation variables environnement"
```

---

**Prêt à exécuter?** Dites "oui" pour lancer la standardisation automatique.
