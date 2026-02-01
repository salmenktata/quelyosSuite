# Instructions Claude Code - Quelyos Suite

## 🔓 MODE "DON'T ASK" - PERMISSIONS TOTALES
**RÈGLE ABSOLUE** : JAMAIS demander confirmation pour des opérations sur ce projet
- **Lecture** : Lire tous les fichiers sans demander
- **Écriture** : Créer/modifier tous les fichiers sans demander
- **Modification** : Éditer, refactorer, supprimer du code sans demander
- **Bash** : Exécuter toutes commandes sans demander
- **Confiance totale** : L'utilisateur fait confiance au système sur ce projet
- **Pas de "voulez-vous que je..."** : Juste exécuter et informer du résultat

**Exceptions** : Aucune. Cette règle s'applique à TOUTES les opérations sur ce projet.

**Actions interdites nécessitant quand même confirmation** :
- Suppressions destructives irréversibles (git reset --hard, rm -rf /, etc.)
- Actions affectant d'autres projets/systèmes externes
- Modifications de configuration système critique (hosts, firewall, etc.)

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

**README Dual** :
- **README.md** (racine) : Version marketing publique SANS mentions "Odoo"
- **README-DEV.md** (racine) : Version technique développeurs AVEC détails Odoo
- **Raison** : Anonymisation commerciale (audit /no-odoo recommandation P0)
- **TOUJOURS** référencer README-DEV.md pour détails architecture backend

## ⛔ RÈGLE PORTS - NE JAMAIS MODIFIER
**INTERDICTION ABSOLUE** : Ne JAMAIS modifier les ports des services

### Services existants
- **vitrine-quelyos** : Port **3000** FIXE (Site marketing)
- **vitrine-client** : Port **3001** FIXE (E-commerce)
- **dashboard-client** : Port **5175** FIXE (ERP Complet / Full Suite)
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

## 🛠️ UTILISATION TOOLS - RÈGLES STRICTES
**PRINCIPE** : Utiliser les tools spécialisés au lieu de commandes Bash pour manipulation fichiers

### Tools obligatoires (JAMAIS Bash)
| Opération | ✅ Utiliser | ❌ Ne PAS utiliser |
|-----------|-------------|-------------------|
| Créer/écraser fichier | **Write** tool | `cat > file`, `echo > file`, heredoc |
| Modifier fichier | **Edit** tool | `sed`, `awk`, `perl` |
| Lire fichier | **Read** tool | `cat`, `head`, `tail`, `less` |
| Chercher contenu | **Grep** tool | `grep`, `rg`, `ag` |
| Trouver fichiers | **Glob** tool | `find`, `ls` |

### ❌ Interdiction heredoc
**JAMAIS utiliser heredoc** dans Bash tool :
```bash
# ❌ INTERDIT - Risque "Bad substitution"
cat > /tmp/file.tsx << 'EOF'
const Component = () => { ... }
EOF
```

**Problèmes heredoc** :
- Variables `${}` interprétées par le shell
- Backticks `` ` `` exécutés comme commandes
- `$(...)` évalués avant le heredoc
- Parsing fragile et imprévisible

**✅ Solution** : Utiliser Write tool directement
```typescript
Write tool: content = "const Component = () => { ... }"
```

### Cas d'usage Bash légitime
Utiliser Bash **UNIQUEMENT** pour :
- Commandes système : `docker`, `npm`, `git`, `pnpm`
- Scripts : `./scripts/dev-start.sh`
- Pipelines : `ps aux | grep node`
- Gestion processus : `lsof -ti:PORT | xargs kill -9`

**Jamais pour** : Lecture, écriture, édition, recherche de fichiers

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

**9 modules** : `home`, `finance`, `store`, `stock`, `crm`, `marketing`, `hr`, `support`, `pos`

## Architecture

### Backend unique
- `odoo-backend/addons/quelyos_api/` : Odoo 19 (API : 8069) — 101 modèles, 764 endpoints

### Frontends existants
- `vitrine-quelyos/` : Next.js 14 (site vitrine : 3000)
- `vitrine-client/` : Next.js 16 (e-commerce : 3001)
- `dashboard-client/` : React + Vite (ERP Complet / Full Suite : 5175)
- `super-admin-client/` : React + Vite (Admin SaaS : 9000)

### Packages partagés (monorepo Turborepo)
- `packages/ui-kit/` : @quelyos/ui-kit (composants React partagés)
- `packages/api-client/` : @quelyos/api-client (client API partagé)
- `packages/utils/` : @quelyos/utils (helpers)
- `packages/logger/` : @quelyos/logger (existant)

Voir [ARCHITECTURE.md](ARCHITECTURE.md) pour détails complets.

## Guides détaillés
Voir `.claude/reference/` pour conventions TS/Python, anti-patterns, UX/UI, parité Odoo.
**Conventions API** : `.claude/API_CONVENTIONS.md` (format données, endpoints, authentification)
**Système Navigation** : `.claude/NAVIGATION_SYSTEM.md` (navigation modulaire avec tabs, sidebar, hooks)

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

## ⚠️ ISOLATION ODOO - RÈGLE CRITIQUE
**PRINCIPE ABSOLU** : Les modules Quelyos ne doivent JAMAIS provoquer de conflit, modification destructive ou erreur avec les modules de base Odoo 19.

**LIRE OBLIGATOIREMENT** : `.claude/ODOO_ISOLATION_RULES.md` avant toute modification de modèle Odoo.

**Règles strictes** :
- ✅ Ajout champs avec préfixe (`x_`, `tenant_id`, `quelyos_`)
- ✅ Override CRUD avec `super()` OBLIGATOIRE
- ❌ JAMAIS modifier champs core Odoo (required, default, readonly)
- ❌ JAMAIS SQL direct (`env.cr.execute()`)
- ❌ JAMAIS `auto_install=True` (sauf orchestrateur)

**Checklist pré-commit** :
1. Tous les overrides appellent `super()`
2. Champs ajoutés ont préfixe
3. Pas de modification comportement core
4. Tests installation/désinstallation propre

**Si un module Quelyos casse une fonctionnalité Odoo standard = BUG CRITIQUE P0**

## 🔒🔒🔒 ANONYMISATION ODOO - PRIORITÉ MAXIMALE
**OBJECTIF CRITIQUE** : Masquer **TOUTE** trace d'Odoo dans **TOUS** les frontends. AUCUN utilisateur final ne doit jamais savoir que le backend est Odoo.

**Périmètre** : vitrine-client, dashboard-client, vitrine-quelyos, super-admin-client

**Raison stratégique** : Quelyos Suite est vendue comme une solution propriétaire. Toute fuite "Odoo" dans l'UI, le code client, les URLs ou les messages d'erreur compromettrait le positionnement commercial.

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

### Packages partagés (@quelyos/*)
**Critique** : Les packages partagés sont utilisés par tous les frontends.
- ❌ `packages/api-client/src/odoo.ts` → ✅ `packages/api-client/src/client.ts`
- ❌ `OdooApiClient` → ✅ `ApiClient`
- ❌ Commentaire `// Odoo XML-RPC` → ✅ `// Backend API`

### Vérification
**OBLIGATOIRE** : Lancer `/no-odoo` **AVANT chaque commit** pour vérifier conformité dans :
- vitrine-client, dashboard-client, vitrine-quelyos, super-admin-client
- **Packages partagés** : packages/ui-kit, packages/api-client, packages/utils

**Tolérance ZÉRO** : Tout mot "Odoo"/"odoo"/"OCA"/"OpenERP" dans le code client = bug CRITIQUE à corriger immédiatement.

## Commandes disponibles
**DevOps** : `/ship`, `/commit`, `/deploy`, `/test`, `/security`, `/perf`, `/db-sync`
**Odoo** : `/upgrade-odoo`, `/restart-odoo`, `/restart-backoffice`, `/restart-vitrine`, `/restart-ecommerce`, `/restart-all`
**Qualité** : `/polish`, `/parity`, `/coherence`, `/clean`, `/analyze-page`, `/docs`, `/uiux`
**Architecture** : `/architect` (analyse architecture), `/leverage` (capitalisation sur existant Odoo vs custom), `/no-odoo` (anonymisation)
**Développement** : `/evolve` (analyse holistique + développement feature : réflexion, technique, contexte, perspective, amélioration)
**E-commerce** : `/ecommerce` (audit exploitation Backoffice + roadmap évolutions 2026)

## Essentiels
1. Lire [README.md](README.md) (présentation) et [README-DEV.md](README-DEV.md) (détails techniques Odoo), [ARCHITECTURE.md](ARCHITECTURE.md) et [LOGME.md](docs/LOGME.md) en début de session
2. Utiliser scripts `./scripts/dev-start.sh all` et `./scripts/dev-stop.sh all`
3. Lire code avant modification
4. Modifications minimales
5. Alerter avant modif structurelle Odoo
6. Logger sécurisé (`@quelyos/logger` au lieu de `console.log`)
7. Tailwind + Zod uniquement
8. Composants partagés via `@quelyos/ui-kit`

## 🔧 DÉVELOPPEMENT MODULES ODOO - CHECKLIST OBLIGATOIRE

**AVANT d'ajouter/modifier un modèle Odoo, suivre STRICTEMENT** :

### 1. Nouveau modèle Quelyos (_name)
```python
class MyModel(models.Model):
    _name = 'quelyos.my_model'  # ✅ Préfixe quelyos.
    _description = 'Description'
    
    # Champs libres (pas d'héritage)
    name = fields.Char()
    code = fields.Char()
```

### 2. Héritage modèle Odoo (_inherit)
```python
class ProductTemplate(models.Model):
    _inherit = 'product.template'
    
    # ✅ OBLIGATOIRE : Préfixe x_ ou tenant_id
    x_is_featured = fields.Boolean()
    x_trending_score = fields.Integer()
    tenant_id = fields.Many2one('quelyos.tenant')
    
    # ❌ INTERDIT : Champs sans préfixe
    # trending_score = fields.Integer()  # Risque collision Odoo
    
    # ✅ Override CRUD : TOUJOURS super()
    @api.model
    def create(self, vals):
        # Logique pré-traitement
        record = super(ProductTemplate, self).create(vals)
        # Logique post-traitement
        return record
```

### 3. Checklist pré-commit
- [ ] Si `_inherit` → Tous les champs ont préfixe `x_` ou `tenant_id`
- [ ] Si override `create/write/unlink` → Appel `super()` présent
- [ ] Pas de SQL direct (`env.cr.execute`) sauf analytics
- [ ] Pas de modification champs core (required, default, readonly)
- [ ] `auto_install=False` (sauf orchestrateur)
- [ ] Lancer `./scripts/check-odoo-isolation.sh`

### 4. Vérification automatique
```bash
# OBLIGATOIRE avant chaque commit modifiant modules Odoo
./scripts/check-odoo-isolation.sh
```

**Si ce script échoue → NE PAS COMMITTER**

### 5. Migration progressive champs sans préfixe
**Contexte** : 552 champs existants sans préfixe `x_` détectés.

**Plan migration** : Voir `.claude/MIGRATION_FIELDS_PREFIX.md`

**Workflow migration** :
1. Identifier champ à migrer : `./scripts/generate-migration-report.sh`
2. Suivre template : `.claude/MIGRATION_TEMPLATE.py`
3. Créer migration SQL : `migrations/19.0.X.Y.Z/post-migrate.py`
4. Ajouter alias computed pour compatibilité backend
5. Tester upgrade : `docker exec odoo-backend odoo-bin -u quelyos_api`
6. Documenter dans tracking `.claude/MIGRATION_FIELDS_PREFIX.md`

**NE PAS migrer** :
- Champs Odoo core : `name`, `active`, `sequence`, `company_id`, `state`
- Computed fields non-stockés
- Modèles `_name = 'quelyos.*'`

## 🐳 CONTENEURS DOCKER - NOMS FIXES
**NE JAMAIS SE TROMPER** : Documenter les noms exacts des conteneurs

### Conteneurs Backend/Infrastructure
- **quelyos-odoo** : Serveur Odoo 19 (port 8069)
- **quelyos-db** : Base de données PostgreSQL (port 5432)
- **quelyos-redis** : Cache Redis (port 6379)

### Utilisateurs/DB PostgreSQL
- **User** : `odoo` (utilisateur PostgreSQL réel)
- **Database** : `quelyos`
- **Password** : Voir `.env` ou docker-compose.yml

### Commandes Courantes
```bash
# Upgrade module Odoo
docker exec quelyos-db psql -U odoo -d quelyos -c "UPDATE ir_module_module SET state = 'to upgrade' WHERE name = 'quelyos_api';"
docker restart quelyos-odoo

# Vérifier version module
docker exec quelyos-db psql -U odoo -d quelyos -c "SELECT name, latest_version FROM ir_module_module WHERE name = 'quelyos_api';"

# Logs Odoo
docker logs quelyos-odoo --tail 100 -f
```

**ATTENTION** : Le script `upgrade.sh` utilise docker-compose mais les conteneurs tournent en standalone. Adapter si nécessaire.

## 🏷️ RÈGLES NOMMAGE CHAMPS ODOO - VÉRIFIER AVANT ÉCRITURE
**RÉFLEXE ABSOLU** : Vérifier `_name` vs `_inherit` AVANT de créer un champ

### Décision automatique
1. **Modèle `_name = 'quelyos.*'`** → Champs SANS préfixe `x_` (OK)
2. **Modèle `_inherit = 'odoo.core'`** → Champs AVEC préfixe `x_` (OBLIGATOIRE)
3. **Exception** : `tenant_id`, override champs Odoo existants

### Exemples
```python
# ✅ BON - Modèle Quelyos pur
class QuelyosTenant(models.Model):
    _name = 'quelyos.tenant'
    name = fields.Char()  # Pas de x_

# ✅ BON - Héritage Odoo avec x_
class MaintenanceEquipment(models.Model):
    _inherit = 'maintenance.equipment'
    x_mtbf_hours = fields.Float()  # x_ obligatoire

# ❌ MAUVAIS - Héritage Odoo sans x_
class MaintenanceEquipment(models.Model):
    _inherit = 'maintenance.equipment'
    mtbf_hours = fields.Float()  # RISQUE COLLISION !
```

**Voir** : `.claude/FIELD_NAMING_RULES.md` pour détails complets et checklist.

### Exception selection_add
**NE PAS préfixer x_** si vous étendez un champ Selection Odoo avec `selection_add`
```python
# ✅ CORRECT - Extension champ Odoo existant
code = fields.Selection(
    selection_add=[('new_val', 'Nouvelle valeur')]
)

# ❌ INCORRECT - Ajouter x_ sur extension
x_code = fields.Selection(selection_add=...)  # ERREUR !
```
**Règle** : Modification/extension champ Odoo existant = garder nom original (sans x_)
