# Instructions Claude Code - Quelyos ERP

## ⚡ MODE ÉCONOMIE TOKENS ACTIVÉ
**PRIORITÉ ABSOLUE** : Optimiser consommation tokens
- **Lectures limitées** : Max 500 lignes/fichier (use `limit` param)
- **Pas d'agents Task/Explore** : Utiliser Glob + Grep direct
- **Ciblé uniquement** : Demander fichier précis si requête vague
- **Réponses courtes** : Pas de répétition code, pas verbosité
- **Ignorer** : node_modules/, dist/, .next/, types volumineux
- Voir `.claude/OPTIMIZATION_MODE.md` et `.claude/GUIDE_ECONOMIE_TOKENS.md`

## 📝 DOCUMENTATION - MINIMALISME STRICT
**NE JAMAIS générer de documentation automatique**
- **Fichiers MD** : Ne créer README/CHANGELOG/docs QUE si explicitement demandé
- **JSDoc/docstrings** : Uniquement pour logique complexe/non-évidente
- **Commentaires inline** : Seulement si le code n'est pas auto-explicatif
- **Types TypeScript** : Préférer typage fort aux commentaires explicatifs
- **Pas de duplication** : Documentation existante = source de vérité unique
- **Commit messages** : Concis (1-2 phrases max), focus sur le "pourquoi"

**Exceptions autorisées** :
- Demande explicite utilisateur
- Commande `/docs` pour sync documentation
- Endpoints API complexes (voir `.claude/API_CONVENTIONS.md`)

## ⛔ RÈGLE PORTS - NE JAMAIS MODIFIER
**INTERDICTION ABSOLUE** : Ne JAMAIS modifier les ports des services
- **vitrine-quelyos** : Port **3000** FIXE
- **vitrine-client** : Port **3001** FIXE
- **dashboard-client** : Port **5175** FIXE (Backoffice clients)
- **super-admin-client** : Port **9000** FIXE (Panel super admin SaaS)
- **odoo-backend** : Port **8069** FIXE
- **PostgreSQL** : Port **5432** FIXE
- **Redis** : Port **6379** FIXE

**En cas de conflit de port** :
1. ❌ NE PAS changer le port dans la config
2. ✅ Identifier et arrêter le processus qui occupe le port
3. ✅ Utiliser `lsof -ti:PORT | xargs kill -9`
4. ✅ Redémarrer le service sur son port ORIGINAL

**Cette règle s'applique à** :
- `vite.config.ts`
- `next.config.js`
- `docker-compose.yml`
- `package.json` (scripts dev)
- Toute autre configuration de port

## Langue
Français pour communications. Code en anglais.

## 🔧 ESLINT - GÉNÉRATION CODE CONFORME
**RÉFLEXE ABSOLU** : Toujours générer du code ESLint-compliant

### TypeScript Strict
```typescript
// ❌ INTERDIT - any
catch (error: any) { }
const data: any = response;

// ✅ OBLIGATOIRE - Types explicites
catch (error: unknown) { }
catch (_error) { }  // si non utilisé
const data: ApiResponse = response;
```

### Variables Non Utilisées
```typescript
// ❌ INTERDIT
const { data, error } = await fetch();  // error non utilisé

// ✅ OBLIGATOIRE - Préfixe underscore
const { data, _error } = await fetch();
// ou omettre si destructuring
const { data } = await fetch();
```

### Apostrophes JSX
```tsx
// ❌ INTERDIT - Apostrophes directes
<p>L'utilisateur n'a pas de compte</p>

// ✅ OBLIGATOIRE - Échapper ou template string
<p>L&apos;utilisateur n&apos;a pas de compte</p>
<p>{`L'utilisateur n'a pas de compte`}</p>
```

### useEffect Dependencies
```typescript
// ❌ INTERDIT - Deps manquantes
useEffect(() => {
  fetchData();
}, []);

// ✅ OBLIGATOIRE - Toutes les deps ou useCallback
const fetchData = useCallback(async () => { ... }, []);
useEffect(() => {
  fetchData();
}, [fetchData]);
```

### Imports ES6
```typescript
// ❌ INTERDIT
const fs = require('fs');

// ✅ OBLIGATOIRE
import fs from 'fs';
import { readFile } from 'fs';
```

### setState dans useEffect
```typescript
// ❌ INTERDIT - setState synchrone dans effect
useEffect(() => {
  const stored = localStorage.getItem('theme');
  if (stored) setTheme(stored);  // ❌
}, []);

// ✅ OBLIGATOIRE - Initialisation via useState ou lazy init
const [theme, setTheme] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('theme') || 'light';
  }
  return 'light';
});
```

## 🌓 DARK/LIGHT MODE - VÉRIFICATION AUTOMATIQUE OBLIGATOIRE
**RÉFLEXE ABSOLU** : TOUJOURS vérifier les deux modes sans rappel
- **Chaque modification UI** : Tester light ET dark automatiquement
- **Chaque nouveau composant** : Variantes `dark:` sur TOUS les éléments
- **Chaque correction** : Vérifier que le fix fonctionne dans les 2 modes
- **Ne JAMAIS attendre** : "vérifie en mode clair" ou "vérifie en mode dark"

**Pattern obligatoire pour tous les éléments visuels** :
```tsx
// ✅ BON - Adaptatif automatique
bg-white dark:bg-gray-800
text-gray-900 dark:text-white
border-gray-200 dark:border-gray-700

// ❌ MAUVAIS - Mode unique
bg-white
text-gray-900
text-indigo-100  // invisible en light mode !
```

**Checklist systématique** :
1. ✅ Backgrounds : light opaque + dark transparent/gradient
2. ✅ Textes : dark text en light, light text en dark
3. ✅ Borders : visible dans les deux modes
4. ✅ Inputs/Forms : lisibles dans les deux modes
5. ✅ Hovers/Focus : états visibles partout
6. ✅ Icônes : contraste suffisant
7. ✅ Erreurs/Success : messages lisibles

**Si oublié** : L'utilisateur ne devrait JAMAIS avoir à rappeler cette règle.

## 🎨 CRÉATION PAGES DASHBOARD - LIRE AVANT DE CODER
**OBLIGATOIRE** : Avant de créer/modifier une page dashboard, **LIRE** `dashboard-client/.claude/UI_PATTERNS.md`

**Structure obligatoire (toute page)** :
1. JSDoc en en-tête (5+ fonctionnalités)
2. `<Layout>` wrapper
3. `<Breadcrumbs>` en premier
4. Header avec `<Button>` (jamais `<button>` ou `<Link>` stylé)
5. `<PageNotice>` après header
6. Error state avec `role="alert"`
7. Loading state avec `SkeletonTable`

**Imports obligatoires** :
```tsx
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common'
import { [module]Notices } from '@/lib/notices'
import { ... } from 'lucide-react'  // JAMAIS heroicons
```

**Menu obligatoire** : Ajouter la page dans `src/config/modules.ts` (section du module)

**Voir** : `dashboard-client/.claude/UI_PATTERNS.md` pour templates complets et checklist.

## 🛣️ CONVENTIONS ROUTING - RÈGLE ABSOLUE
**TOUJOURS utiliser l'anglais pour les routes et identifiants techniques**
- **Routes/URLs** : `/store/products`, `/crm/customers`, `/hr/employees` (anglais)
- **Module IDs** : `'store'`, `'crm'`, `'hr'` (anglais)
- **Dossiers/fichiers** : `pages/store/`, `crm/` (anglais)
- **UI/Labels** : `name: 'Boutique'`, `'Clients'`, `'Employés'` (français)

**Voir** : `.claude/ROUTING_CONVENTIONS.md` pour détails complets

**7 modules** : `home`, `finance`, `store`, `stock`, `crm`, `marketing`, `hr`

## Architecture
- `vitrine-quelyos/` : Next.js 14 (site vitrine : 3000)
- `vitrine-client/` : Next.js 16 (e-commerce : 3001)
- `dashboard-client/` : React + Vite (backoffice : 5175)
- `odoo-backend/addons/quelyos_api/` : Odoo 19 (API : 8069)

Voir [ARCHITECTURE.md](ARCHITECTURE.md) pour détails services et ports.

## Guides détaillés
Voir `.claude/reference/` pour conventions TS/Python, anti-patterns, UX/UI, parité Odoo.
**Conventions API** : `.claude/API_CONVENTIONS.md` (format données, endpoints, authentification)

## Workflow Odoo CRITIQUE
**Consultation doc Odoo 19 Community obligatoire**
- WebSearch pour vérifier modules/champs existants AVANT implémentation
- Doc officielle : https://www.odoo.com/documentation/19.0/

**Modification modèle = upgrade obligatoire**
1. Modifier code `models/`
2. Incrémenter version `__manifest__.py`
3. Alerter avec AskUserQuestion
4. Après commit : `/upgrade-odoo`

Alerter AVANT : schéma DB, modèles Odoo, endpoints API

## 🔒 ANONYMISATION ODOO - RÈGLES STRICTES
**Objectif** : Masquer toute trace d'Odoo dans TOUS les frontends (vitrine-client, dashboard-client ET vitrine-quelyos)

### ⚠️ RÈGLE ABSOLUE - À RESPECTER LORS DE L'ÉCRITURE DU CODE
**JAMAIS écrire "Odoo" ou "odoo" dans** :
1. **Strings UI** : `"Instance Odoo"` → `"Instance dédiée"` (visible utilisateur)
2. **Noms de fichiers** : `odooColors.ts` → `colorPalette.ts`
3. **Noms de fonctions** : `odooColorToHex()` → `colorIndexToHex()`
4. **Imports/Exports** : `import { ... } from '@/lib/odoo'` → `'@/lib/backend'`
5. **Commentaires .env** : `# Backend API (Odoo)` → `# Backend API`
6. **Variables** : `ODOO_URL` → `BACKEND_URL`

**Exception unique** : `vitrine-client/src/app/legal/page.tsx` (conformité LGPL)

### Champs API
**TOUJOURS utiliser les noms standards** :
| Interdit (Odoo) | → Utiliser (Standard) |
|-----------------|----------------------|
| `list_price` | `price` |
| `default_code` | `sku` |
| `qty_available` | `stock_quantity` |
| `virtual_available` | `available_quantity` |
| `attribute_lines` | `attributes` |
| `create_date` | `created_at` |
| `write_date` | `updated_at` |
| `categ_id` | `category_id` |

### Images backend
**TOUJOURS utiliser** : `import { getProxiedImageUrl } from '@/lib/image-proxy'`
- ❌ Ne PAS créer de fonction locale `getProxiedImageUrl`
- ❌ Ne PAS exposer `/web/image` dans les URLs client
- ✅ Utiliser `getProxiedImageUrl(url)` pour toutes images backend

### Variables/Classes
**Dans tous les clients** :
- ❌ `OdooClient` → ✅ `BackendClient`
- ❌ `ODOO_URL` → ✅ `BACKEND_URL`
- ❌ `getOdooImageUrl` → ✅ `getBackendImageUrl`

### Messages d'erreur
- ❌ `"Odoo returned error"` → ✅ `"Backend error"`

### Jargon Odoo (termes révélateurs)
**Termes interdits dans TOUS les clients** :
| Interdit | → Utiliser |
|----------|-----------|
| `OCA` | `communauté open-source` |
| `OpenERP` / `OERP` | `ERP système` |
| `ir.model` | `system.model` |
| `res.partner` | `contacts` |
| `res.users` | `users` |
| `product.template` | `products` |
| `sale.order` | `orders` |
| `Werkzeug` | (supprimer) |

### Routes Proxy Authentification (vitrine-quelyos)
**TOUJOURS utiliser des routes proxy** pour masquer l'URL backend :
- ❌ `form.action = \`${odooUrl}/api/auth/sso-redirect\``
- ✅ `form.action = '/api/backend-sso-redirect'`

**Routes obligatoires** :
| Route | Fonction |
|-------|----------|
| `/api/backend-sso-redirect` | Proxy SSO vers backend |
| `/api/backend-passkey-redirect` | Proxy Passkey vers backend |
| `/api/backend-auth` | Auth (NE JAMAIS exposer `odooUrl` dans la réponse) |

### Contenu Marketing/Pricing
**Dans les pages commerciales (pricing, features, FAQ)** :
- ❌ `"Instance Odoo dédiée"` → ✅ `"Instance dédiée isolée"`
- ❌ `"basé sur Odoo"` → ✅ `"infrastructure ERP"`
- ❌ `"technologie Odoo"` → ✅ `"technologie open-source"`

### Vérification
Lancer `/no-odoo` avant chaque commit pour vérifier conformité dans vitrine-client, dashboard-client ET vitrine-quelyos.

## Commandes disponibles
**DevOps** : `/ship`, `/commit`, `/deploy`, `/test`, `/security`, `/perf`, `/db-sync`
**Odoo** : `/upgrade-odoo`, `/restart-odoo`, `/restart-backoffice`, `/restart-vitrine`, `/restart-ecommerce`, `/restart-all`
**Qualité** : `/polish`, `/parity`, `/coherence`, `/clean`, `/analyze-page`, `/docs`, `/uiux`
**Architecture** : `/architect` (analyse architecture), `/leverage` (capitalisation sur existant Odoo vs custom), `/no-odoo` (anonymisation)
**Développement** : `/evolve` (analyse holistique + développement feature : réflexion, technique, contexte, perspective, amélioration)
**E-commerce** : `/ecommerce` (audit exploitation Backoffice + roadmap évolutions 2026)

## Essentiels
1. Lire [README.md](README.md), [ARCHITECTURE.md](ARCHITECTURE.md) et [LOGME.md](docs/LOGME.md) en début de session
2. Utiliser scripts `./scripts/dev-start.sh all` et `./scripts/dev-stop.sh all`
3. Lire code avant modification
4. Modifications minimales
5. Alerter avant modif structurelle Odoo
6. Logger sécurisé (`@quelyos/logger` au lieu de `console.log`)
7. Tailwind + Zod uniquement
