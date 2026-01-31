# Commande /no-odoo - Détection Références Odoo UI

## Description
**PRIORITÉ MAXIMALE** : Audit et correction de TOUTE mention "Odoo" visible dans les interfaces utilisateur. Aucun utilisateur final des 7 SaaS Quelyos ou du ERP Complet ne doit savoir que le backend est Odoo.

**Périmètre complet** : vitrine-client, dashboard-client, vitrine-quelyos, super-admin-client, **packages partagés**, **packages partagés** (packages/*)

**Exception unique** : `vitrine-client/src/app/legal/page.tsx` préservée pour conformité licence LGPL-3.0.

**Raison** : Les éditions Quelyos (système éditions unifié) sont vendues comme solutions propriétaires. Toute fuite "Odoo" compromet le positionnement commercial.

## Usage
```bash
/no-odoo              # Audit complet (détection uniquement)
/no-odoo --fix        # Corrections automatiques des violations P0
```

## Workflow

### Étape 1 : Détection Code Source
**Cibles** : `vitrine-client/src/`, `dashboard-client/src/`, `vitrine-quelyos/`, `super-admin-client/src/`, `packages/*/src/`

**Exclusions** :
- `lib/odoo/`, `lib/backend/` - Code API interne
- `api-anonymizer.ts` - Middleware transformation
- `**/legal/` - Conformité LGPL
- `*.test.ts`, `*.test.tsx` - Tests unitaires

**Commande Grep** :
```bash
grep -rE "Odoo|odoo" vitrine-client/src dashboard-client/src vitrine-quelyos super-admin-client/src packages/*/src 2>/dev/null \
  --include="*.tsx" --include="*.ts" \
  | grep -vE "legal/|api-anonymizer|\.test\.|lib/backend/"
```

### Étape 1b : Détection Fichiers .env
**P1-ENV - Variables d'environnement exposant l'infrastructure**

**Commande Grep** :
```bash
grep -rE "ODOO_|odoo|Odoo" vitrine-client/.env* dashboard-client/.env* vitrine-quelyos/.env* 2>/dev/null
```

**Mapping obligatoire** :
| Variable Interdite | → Utiliser |
|-------------------|------------|
| `ODOO_URL` | `BACKEND_URL` |
| `NEXT_PUBLIC_ODOO_URL` | `NEXT_PUBLIC_BACKEND_URL` |
| `ODOO_DATABASE` | `BACKEND_DATABASE` |
| `ODOO_WEBHOOK_SECRET` | `BACKEND_WEBHOOK_SECRET` |
| `VITE_ODOO_URL` | `VITE_BACKEND_URL` |
| `# Odoo Backend` (commentaire) | `# Backend API` |

### Étape 1c : Détection Noms de Fichiers/Dossiers
**P1-FILES - Structure révélant l'infrastructure**

**Commande** :
```bash
find vitrine-client/src dashboard-client/src vitrine-quelyos -name "*odoo*" -o -name "*Odoo*" 2>/dev/null
```

**Exemples de violations** :
- `src/lib/odoo/` → `src/lib/backend/`
- `OdooClient.ts` → `BackendClient.ts`
- `useOdooAuth.ts` → `useBackendAuth.ts`

### Étape 1d : Détection URLs/Ports Hardcodés
**P2-URL - Fingerprints techniques**

**Commande** :
```bash
grep -rn ":8069\|odoo\.com\|odoo\.sh" vitrine-client/src dashboard-client/src \
  --include="*.tsx" --include="*.ts" \
  | grep -v "fallback\|default\|localhost"
```

**Toléré** : `localhost:8069` comme fallback dev uniquement
**Interdit** : URLs production contenant `:8069` ou `odoo.com`

### Étape 1e : Détection Jargon Odoo
**Termes spécifiques révélant l'infrastructure backend** :

| Terme | Signification | Risque |
|-------|---------------|--------|
| `OCA` | Odoo Community Association | Identification écosystème |
| `OpenERP` | Ancien nom d'Odoo | Identification historique |
| `OERP` | Diminutif OpenERP | Identification historique |
| `ir.model` | Modèle Odoo introspection | Pattern technique Odoo |
| `res.partner` | Modèle Odoo contacts | Pattern technique Odoo |
| `res.users` | Modèle Odoo utilisateurs | Pattern technique Odoo |
| `product.template` | Modèle Odoo produits | Pattern technique Odoo |
| `sale.order` | Modèle Odoo ventes | Pattern technique Odoo |
| `Werkzeug` | Framework Python Odoo | Fingerprint serveur |

**Commande Grep (jargon)** :
```bash
grep -rE "\bOCA\b|OpenERP|OERP|\bir\.model\b|\bres\.partner\b|\bres\.users\b|\bproduct\.template\b|\bsale\.order\b|Werkzeug" \
  vitrine-client/src dashboard-client/src \
  --include="*.tsx" --include="*.ts" \
  | grep -vE "legal/|api-anonymizer|node_modules|\.test\."
```

### Étape 1f : Détection Imports/Exports
**P1-IMPORT - Noms de modules exposés**

**Commande** :
```bash
grep -rE "from ['\"].*odoo|import.*[Oo]doo|export.*[Oo]doo" \
  vitrine-client/src dashboard-client/src \
  --include="*.tsx" --include="*.ts"
```

**Exemples de violations** :
- `import { OdooClient } from './lib/odoo'` → `import { BackendClient } from './lib/backend'`
- `export class OdooService` → `export class BackendService`

### Étape 1g : Détection Console/Logs
**P2-LOG - Messages debug exposés**

**Commande** :
```bash
grep -rE "console\.(log|warn|error|info).*[Oo]doo" \
  vitrine-client/src dashboard-client/src \
  --include="*.tsx" --include="*.ts"
```

**Risque** : Messages visibles dans DevTools du navigateur

### Étape 1h : Détection Patterns API Odoo
**P2-API - Endpoints/structures révélateurs**

**Commande** :
```bash
grep -rE "/web/image|/web/content|/jsonrpc|X-Openerp|session_id" \
  vitrine-client/src dashboard-client/src \
  --include="*.tsx" --include="*.ts" \
  | grep -vE "api-anonymizer|image-proxy|\.test\."
```

**Toléré** :
- `session_id` si renommé côté cookie (`_auth_token`)
- `/web/image` si proxifié via `/api/image`

**Interdit** : Exposition directe dans URLs client

### Étape 1i : Détection package.json
**P1-PKG - Métadonnées npm exposées**

**Commande** :
```bash
grep -E "odoo|Odoo" vitrine-client/package.json dashboard-client/package.json 2>/dev/null
```

**Exemples de violations** :
- `"name": "odoo-frontend"` → `"name": "vitrine-client"`
- `"odoo-xmlrpc": "^1.0.0"` → supprimer ou alias

### Étape 2 : Classification des Violations

**P0 - Critique** (UI visible utilisateur final) :
- Strings affichés : tooltips, messages, labels
- Empty states, error messages
- Exemples : `"dans Odoo"`, `"via Odoo natif"`

**P1 - Important** (métadonnées exposées) :
- Labels de champs : `"ID Odoo"` → `"ID Système"`
- Headers de colonnes
- Variables `.env` : `ODOO_*` → `BACKEND_*`
- Imports/exports de classes : `OdooClient` → `BackendClient`
- Noms de fichiers/dossiers

**P1b - Jargon Odoo** (termes techniques) :
- Références OCA, OpenERP, OERP
- Patterns modèles Odoo (ir.*, res.*, product.*, sale.*)
- Références framework Werkzeug

**P2 - Mineur** (optionnel) :
- Commentaires code internes
- Console.log (si non visible en prod)
- Port 8069 comme fallback dev
- Pattern jsonrpc (utilisé par d'autres systèmes)

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

**Mapping jargon** :
| Pattern Original | Remplacement |
|-----------------|--------------|
| `OCA` | `communauté open-source` |
| `OpenERP` | `ERP système` |
| `OERP` | `ERP` |
| `ir.model` | `system.model` |
| `res.partner` | `contacts` |
| `res.users` | `users` |
| `product.template` | `products` |
| `sale.order` | `orders` |
| `Werkzeug` | (supprimer) |

**Application** :
- Mode `--fix` : Edit automatique des fichiers P0
- Sans `--fix` : Rapport uniquement

### Étape 4 : Rapport de Sortie

**Format** :
```
🔍 Audit /no-odoo - Anonymisation Infrastructure

═══════════════════════════════════════════════════
📁 CODE SOURCE (.ts/.tsx)
═══════════════════════════════════════════════════
[P0] CRITIQUE - UI Visible (0)
  ✅ Aucune violation

[P1] IMPORTANT - Métadonnées (0)
  ✅ Aucune violation

[P1b] JARGON - Termes techniques (1)
  ⚪ vitrine-client/src/lib/api-anonymizer.ts:37
     'res.partner' (interne - toléré)

═══════════════════════════════════════════════════
📄 FICHIERS .ENV
═══════════════════════════════════════════════════
[P1-ENV] Variables d'environnement (0)
  ✅ BACKEND_URL utilisé
  ✅ BACKEND_DATABASE utilisé

═══════════════════════════════════════════════════
📂 STRUCTURE FICHIERS
═══════════════════════════════════════════════════
[P1-FILES] Noms fichiers/dossiers (0)
  ✅ Aucun fichier *odoo*

═══════════════════════════════════════════════════
🔗 URLS/PORTS
═══════════════════════════════════════════════════
[P2-URL] Fingerprints (0)
  ⚪ localhost:8069 (fallback dev - toléré)

═══════════════════════════════════════════════════
📦 PACKAGE.JSON
═══════════════════════════════════════════════════
[P1-PKG] Métadonnées npm (0)
  ✅ Aucune référence

═══════════════════════════════════════════════════
⚖️ EXCEPTION LGPL
═══════════════════════════════════════════════════
✅ vitrine-client/src/app/legal/page.tsx préservée

═══════════════════════════════════════════════════
📊 RÉSUMÉ
═══════════════════════════════════════════════════
P0 Critique    : 0 ✅
P1 Important   : 0 ✅
P1b Jargon     : 1 ⚪ (toléré)
P2 Mineur      : 0 ⚪

RÉSULTAT : ✅ CONFORME
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

### Étape 5 : Vérifications Sécurité Avancées (--security)

**Mode** : `/no-odoo --security` ou automatique avec `--fix`

**Objectif** : Anonymiser l'infrastructure backend contre reconnaissance automatisée (Wappalyzer, Shodan, BuiltWith)

#### **P0-SEC - Vecteurs Critiques**

**1. Route API publique `/api/odoo/`**
- ❌ Risque : Indicateur évident pour scanners
- ✅ Solution : Renommer → `/api/backend/`
- Fichiers : `vitrine-client/src/app/api/odoo/` + références

**2. Messages d'erreur exposant "Odoo"**
- ❌ `{ error: 'Odoo returned 500' }`
- ✅ `{ error: 'Backend error 500' }`
- Grep : `grep -r "Odoo returned\|Odoo API error" vitrine-client/src/app/api`

**3. Cookie `session_id` typique Odoo**
- ❌ `cookies.set('session_id', ...)`
- ✅ `cookies.set('_auth_token', ...)`
- Fichier : `vitrine-client/src/app/api/auth/[...path]/route.ts:53`

#### **P1-SEC - Métadonnées Exposées**

**4. Hostname `*.odoo.com` dans next.config.ts**
- Supprimer de `remotePatterns` (ligne 16)

**5. Header HTTP `Server: Werkzeug/3.0.1 Python/3.12.3`**
- Masquer via nginx : `proxy_hide_header Server;` + `add_header Server "nginx";`
- Fichier : `nginx/nginx.conf` blocs `/api/` et `/web/`

**6. Commentaires "Odoo" dans config**
- `// Configuration images Odoo` → `// Image proxy configuration`

#### **Vérifications Automatiques**

```bash
# Test header Server masqué
curl -I http://localhost:8069 | grep Server
# Attendu : "Server: nginx"

# Test route /api/backend/ accessible
curl http://localhost:3001/api/backend/ecommerce/site-config
# Attendu : JSON valide (pas 404)

# Test cookie _auth_token créé
# Vérifier DevTools → Application → Cookies après login
```

## Violations Connues Résolues

### UI (Dashboard + Vitrine) - 27 fichiers
1. `ApiGuide.tsx` - P0 : `dans Odoo` → `dans la base de données système` ✅
2. `Tenants.tsx` - P0 : `gérées dans Odoo` → `via l'interface d'administration système` ✅
3. `Warehouses.tsx` - P0 : `via Odoo natif` → `via l'interface d'administration intégrée` ✅
4. `SiteConfig.tsx` - P0 : `dans Odoo` → `dans la base de données système` ✅
5. `stock-notices.ts` - P0 : `dans Odoo` → `dans l'interface d'administration` ✅
6. `ModularLayout.tsx` - P0 : Suppression 4 commentaires "Odoo-style" ✅
7. `finance-notices.ts` - P2 : Fix apostrophes échappées ✅

### Sécurité (Vitrine) - 18 fichiers
8. Route `/api/odoo/` → `/api/backend/` ✅
9. Messages erreur : 14 occurrences "Odoo returned" → "Backend error" ✅
10. Cookie `session_id` → `_auth_token` ✅
11. `next.config.ts` : Commentaire + hostname `*.odoo.com` supprimés ✅
12. `nginx.conf` : Headers `Server` masqués dans `/api/` et `/web/` ✅

### Phase 1 - Infrastructure Hardening ✅ (2026-01-26)

**45 fichiers modifiés** - Infrastructure 100% anonymisée

#### **1. Page test-api supprimée**
```bash
rm -rf vitrine-client/src/app/test-api
```
✅ Aucune URL backend hardcodée exposée publiquement

#### **2. Builds nettoyés**
```bash
rm -rf vitrine-client/.next vitrine-client/out
npm run build  # Rebuild propre
```
✅ Ancien dossier `/api/odoo/` supprimé des artifacts

#### **3. Classe BackendClient**
```ts
// AVANT: export class OdooClient
// APRÈS: export class BackendClient
```
✅ Nom classe anonymisé dans bundles

#### **4. Fonction getBackendImageUrl**
```ts
// AVANT: export function getOdooImageUrl(path)
// APRÈS: export function getBackendImageUrl(path)
```
✅ Nom fonction masqué dans autocomplete DevTools

#### **5. Variables env renommées**
```bash
# 22 fichiers corrigés
ODOO_URL → BACKEND_URL
NEXT_PUBLIC_ODOO_URL → NEXT_PUBLIC_BACKEND_URL
ODOO_DATABASE → BACKEND_DATABASE
```
✅ Aucune variable "ODOO" dans code source

#### **6. Commentaires nettoyés**
- `// Proxies images from Odoo` → `// Proxies images from backend`
- `// Odoo expects JSON-RPC POST` → `// backend expects JSON-RPC POST`
- `// Some Odoo endpoints` → `// Some endpoints`
✅ 15+ commentaires anonymisés

#### **7. Pattern odoo:8069 supprimé**
```ts
// AVANT: url.includes('odoo:8069')
// APRÈS: (supprimé)
```
✅ Pattern Docker hostname éliminé

#### **8. Validation build production**
```bash
Build Output:
  ├ ƒ /api/backend/[...path]  ✅
  ├ ✗ /api/odoo/              (absent) ✅
  ├ ✗ /test-api               (absent) ✅

Bundles statiques:
  - "odoo" occurrences: 15 (legal/node_modules uniquement)
  - "OdooClient": 0 ✅
  - "getOdooImageUrl": 0 ✅
```

### Phase 2 - Anonymisation Réponses API ✅ (2026-01-27)

**Objectif** : Masquer les noms de champs Odoo dans les réponses JSON publiques

#### **P0-API - Champs Backend Exposés**

**Détection** :
```bash
# Vérifier que le frontend n'utilise PAS les noms Odoo
grep -rn "list_price\|default_code\|qty_available\|attribute_lines\|create_date\|write_date" \
  vitrine-client/src \
  --include="*.tsx" --include="*.ts" \
  | grep -v "api-anonymizer.ts" \
  | grep -v "test.ts" \
  | grep -v "lib/odoo/"
# Attendu : Aucun résultat (0 occurrences)
```

**Mapping des champs** (défini dans `vitrine-client/src/lib/api-anonymizer.ts`) :

| Champ Backend (Odoo) | → Champ Standard |
|---------------------|------------------|
| `list_price` | `price` |
| `standard_price` | `cost_price` |
| `default_code` | `sku` |
| `qty_available` | `stock_quantity` |
| `virtual_available` | `available_quantity` |
| `create_date` | `created_at` |
| `write_date` | `updated_at` |
| `attribute_lines` | `attributes` |
| `categ_id` | `category_id` |
| `pricelist_id` | `price_list_id` |

#### **Architecture de transformation**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Odoo/Backend  │ -> │  API Anonymizer  │ -> │  Frontend       │
│   (inchangé)    │    │  (middleware)    │    │  (noms standards)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

- **Fichier clé** : `vitrine-client/src/lib/api-anonymizer.ts`
- **Intégration** : `vitrine-client/src/app/api/backend/[...path]/route.ts`
- **Mode** : `DUAL_NAMING_MODE = false` (transformation complète)

#### **Vérifications automatiques**

```bash
# 1. Test réponse API (champs standards uniquement)
curl -s http://localhost:3001/api/backend/products | jq '.products[0] | keys' | grep -E "list_price|default_code|qty_available"
# Attendu : Aucun résultat

# 2. Vérifier présence nouveaux noms
curl -s http://localhost:3001/api/backend/products | jq '.products[0] | {price, sku, stock_quantity}'
# Attendu : Valeurs présentes (pas null)

# 3. Vérifier types TypeScript
grep -rn "sku\|stock_quantity\|created_at" vitrine-client/src/components --include="*.tsx" | head -5
# Attendu : Utilisation des nouveaux noms
```

#### **Fichiers migrés (Phase 2)**

**Types partagés** :
- `shared/types/src/index.ts` - Ajout alias standards (price, sku, stock_quantity, etc.)

**Composants vitrine-client** (21 fichiers) :
- `hooks/useProductVariants.ts`
- `hooks/useRecentlyViewed.ts`
- `store/comparisonStore.ts`
- `components/product/VariantSelector.tsx`
- `components/product/VariantSwatches.tsx`
- `components/product/ProductCard.tsx`
- `components/product/CompareDrawer.tsx`
- `components/product/CompareButton.tsx`
- `components/product/QuickViewModal.tsx`
- `components/product/RecommendationsCarousel.tsx`
- `components/product/BundleSuggestions.tsx`
- `components/home/ProductCardHome.tsx`
- `components/cart/UpsellModal.tsx`
- `components/common/SearchAutocomplete.tsx`
- `app/products/page.tsx`
- `app/products/[slug]/page.tsx`
- `app/products/[slug]/layout.tsx`
- `app/compare/page.tsx`
- `app/account/wishlist/page.tsx`

#### **Impact dashboard-client**

⚠️ **Note** : Le dashboard-client (backoffice) n'est PAS migré car :
1. Interface interne (admin uniquement)
2. Pas d'exposition publique des réponses API
3. Utilise toujours les noms Odoo originaux

Les types `@quelyos/types` supportent les deux conventions (alias).

### Phase 3 - Anonymisation Site Vitrine (vitrine-quelyos) ✅ (2026-01-28)

**Objectif** : Masquer toute référence Odoo dans le site vitrine (port 3000)

#### **P0-VITRINE - Exposition URL Backend**

**1. Variables d'environnement**
```bash
# Vérifier qu'aucune variable ODOO_* n'est utilisée
grep -rn "ODOO_URL\|ODOO_DB\|NEXT_PUBLIC_ODOO" vitrine-quelyos/app \
  --include="*.ts" --include="*.tsx"
# Attendu : Aucun résultat
```

**Mapping obligatoire** :
| Interdit | → Utiliser |
|----------|-----------|
| `ODOO_URL` | `BACKEND_URL` |
| `ODOO_DB` | `BACKEND_DB` |
| `NEXT_PUBLIC_ODOO_URL` | (supprimer - jamais côté client) |

**2. Réponses API - Ne jamais exposer l'URL backend**
```bash
# Vérifier qu'aucune API ne renvoie odooUrl
grep -rn "odooUrl" vitrine-quelyos/app/api \
  --include="*.ts"
# Attendu : Aucun résultat
```

**Fichier critique** : `app/api/backend-auth/route.ts`
```typescript
// ❌ INTERDIT
return NextResponse.json({
  success: true,
  odooUrl: BACKEND_URL,  // JAMAIS exposer
});

// ✅ CORRECT
return NextResponse.json({
  success: true,
  // URL backend uniquement côté serveur
});
```

**3. Routes Proxy Authentification**
```bash
# Vérifier existence des routes proxy
ls vitrine-quelyos/app/api/backend-sso-redirect/route.ts
ls vitrine-quelyos/app/api/backend-passkey-redirect/route.ts
# Les deux doivent exister
```

**Routes obligatoires** :
| Route | Fonction |
|-------|----------|
| `/api/backend-sso-redirect` | Proxy POST vers `${BACKEND_URL}/api/auth/sso-redirect` |
| `/api/backend-passkey-redirect` | Redirect GET vers `${BACKEND_URL}/auth/passkey-page` |

**4. Page SuperAdmin Login**
```bash
# Vérifier qu'aucune URL backend n'est construite côté client
grep -n "odooUrl\|NEXT_PUBLIC_ODOO\|:8069" vitrine-quelyos/app/superadmin/login/page.tsx
# Attendu : Aucun résultat
```

**Pattern correct** :
```typescript
// ❌ INTERDIT
const odooUrl = process.env.NEXT_PUBLIC_ODOO_URL;
form.action = `${odooUrl}/api/auth/sso-redirect`;

// ✅ CORRECT
form.action = '/api/backend-sso-redirect';
window.location.href = '/api/backend-passkey-redirect';
```

#### **P1-VITRINE - Pages d'erreur**

**5. Pages d'erreur anonymisées avec dark/light mode**
```bash
# Vérifier support dark mode
grep -n "dark:" vitrine-quelyos/app/error.tsx vitrine-quelyos/app/global-error.tsx
# Attendu : Classes dark: présentes
```

**Pattern obligatoire** :
```tsx
// error.tsx
<div className="bg-slate-50 dark:bg-slate-950">
  <h1 className="text-slate-900 dark:text-white">Erreur</h1>
</div>

// global-error.tsx (CSS inline pour fallback)
@media (prefers-color-scheme: dark) {
  :root { --bg: #020617; --text: #f8fafc; }
}
```

#### **Vérifications Automatiques Phase 3**

```bash
# Test 1 : Aucune variable ODOO dans app/
grep -rn "ODOO" vitrine-quelyos/app --include="*.ts" --include="*.tsx" | grep -v node_modules
# Attendu : 0 résultats

# Test 2 : Routes proxy existent
test -f vitrine-quelyos/app/api/backend-sso-redirect/route.ts && echo "✅ SSO proxy OK"
test -f vitrine-quelyos/app/api/backend-passkey-redirect/route.ts && echo "✅ Passkey proxy OK"

# Test 3 : Pas d'URL backend exposée dans login
grep -c "localhost:8069\|:8069\|odooUrl" vitrine-quelyos/app/superadmin/login/page.tsx
# Attendu : 0

# Test 4 : Dark mode présent sur pages erreur
grep -c "dark:" vitrine-quelyos/app/error.tsx
# Attendu : > 0
```

#### **Fichiers modifiés (Phase 3)**

| Fichier | Action |
|---------|--------|
| `app/api/backend-auth/route.ts` | `ODOO_*` → `BACKEND_*`, supprimé `odooUrl` réponse |
| `app/api/backend-passkey/route.ts` | `ODOO_URL` → `BACKEND_URL`, redirect anonymisé |
| `app/api/backend-sso-redirect/route.ts` | **NOUVEAU** - Proxy SSO |
| `app/api/backend-passkey-redirect/route.ts` | **NOUVEAU** - Proxy Passkey |
| `app/superadmin/login/page.tsx` | Utilise routes proxy, supprimé var `odooUrl` |
| `app/error.tsx` | Support dark/light mode |
| `app/global-error.tsx` | CSS inline dark mode |

### Phase 4 - Renforcement Contrôles + Fichiers .env ✅ (2026-01-28)

**Objectif** : Étendre les contrôles et corriger les variables d'environnement

#### **P1-ENV - Variables .env corrigées**

| Fichier | Avant | Après |
|---------|-------|-------|
| `vitrine-client/.env.production` | `NEXT_PUBLIC_ODOO_URL` | `NEXT_PUBLIC_BACKEND_URL` |
| `vitrine-client/.env.production` | `ODOO_DATABASE` | `BACKEND_DATABASE` |
| `vitrine-client/.env.production` | `ODOO_WEBHOOK_SECRET` | `BACKEND_WEBHOOK_SECRET` |
| `vitrine-client/.env.production` | `# Odoo Backend API` | `# Backend API` |
| `vitrine-client/.env.local` | `NEXT_PUBLIC_ODOO_URL` | `NEXT_PUBLIC_BACKEND_URL` |
| `vitrine-client/.env.local` | `ODOO_DATABASE` | `BACKEND_DATABASE` |
| `vitrine-client/.env.local` | `ODOO_WEBHOOK_SECRET` | `BACKEND_WEBHOOK_SECRET` |
| `vitrine-client/.env.local` | `# Odoo Backend` | `# Backend API` |
| `vitrine-client/.env.example` | `# ODOO BACKEND` | `# BACKEND API` |
| `dashboard-client/.env` | `# URL de l'API Odoo` | `# URL de l'API Backend` |

#### **Nouveaux contrôles ajoutés**

| Étape | Description | Niveau |
|-------|-------------|--------|
| 1b | Variables `.env*` | P1-ENV |
| 1c | Noms fichiers/dossiers | P1-FILES |
| 1d | URLs/ports hardcodés | P2-URL |
| 1f | Imports/exports classes | P1-IMPORT |
| 1g | Console.log avec "Odoo" | P2-LOG |
| 1h | Patterns API Odoo | P2-API |
| 1i | Métadonnées package.json | P1-PKG |

#### **Vérification automatique Phase 4**

```bash
# Test 1 : Variables .env anonymisées
grep -rE "ODOO_|NEXT_PUBLIC_ODOO" vitrine-client/.env* dashboard-client/.env* 2>/dev/null
# Attendu : 0 résultats

# Test 2 : Commentaires .env anonymisés
grep -i "odoo" vitrine-client/.env* dashboard-client/.env* 2>/dev/null
# Attendu : 0 résultats

# Test 3 : Aucun fichier nommé *odoo*
find vitrine-client/src dashboard-client/src -name "*odoo*" 2>/dev/null
# Attendu : 0 résultats

# Test 4 : Aucun import/export OdooClient
grep -rE "OdooClient|getOdooImageUrl" vitrine-client/src dashboard-client/src --include="*.ts" --include="*.tsx"
# Attendu : 0 résultats
```
