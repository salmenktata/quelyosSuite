# Commande /security - Audit Sécurité Multi-Niveaux

## Description

Effectue un audit de sécurité complet du système tri-couche (Backend Odoo ↔ Backoffice React ↔ Frontend Next.js) en détectant les vulnérabilités OWASP Top 10, les secrets exposés, les logs non sécurisés, et les mauvaises pratiques de sécurité.

## Usage

```bash
/security logs             # Vérifie logs sécurisés (aucun console.log, secrets loggés)
/security frontend         # Audit frontend (XSS, CSRF, secrets exposés côté client)
/security backend          # Audit backend (SQL injection, sudo() abusif, validation)
/security deps             # Audit dépendances (npm audit + safety Python)
/security api              # Audit API (auth, rate limiting, CORS)
/security                  # Audit complet (tous les scopes)
```

## Workflow

### 1. Détection du Scope

Analyser le paramètre fourni pour déterminer quels audits effectuer :
- `logs` → Audit logs sécurisés (console.log, secrets, logger usage)
- `frontend` → Audit frontend (XSS, secrets, validation client)
- `backend` → Audit backend (injection, sudo(), validation serveur)
- `deps` → Audit dépendances (vulnérabilités CVE)
- `api` → Audit API (auth, CORS, rate limiting)
- Aucun paramètre → Tous les audits

### 2. Audit Logs Sécurisés

**Objectif :** Vérifier qu'aucun détail technique ou secret n'est exposé dans les logs navigateur.

#### 2.1. Détection `console.log/error/warn`

**Scanner :**
```bash
# Frontend
grep -r "console\\.log\\|console\\.error\\|console\\.warn" frontend/src/ \
  --include="*.ts" --include="*.tsx" -n

# Backoffice
grep -r "console\\.log\\|console\\.error\\|console\\.warn" backoffice/src/ \
  --include="*.ts" --include="*.tsx" -n
```

**Violations P0 (BLOQUANT) :**
- `console.error()` avec détails API Odoo (mention "Odoo", "xmlrpc", noms de tables)
- `console.log()` avec tokens, clés API, passwords
- `console.warn()` avec stack traces techniques

**Violations P1 (IMPORTANT) :**
- `console.log()` dans composants de production (hors debug temporaire)
- `console.error()` sans utilisation du logger custom `@/lib/logger`

**Exceptions autorisées :**
- `console.log()` dans fichiers `*.test.ts` ou `*.spec.ts` (tests uniquement)
- `console.log()` dans scripts build (`scripts/`, `*.config.js`)

#### 2.2. Vérification Usage Logger Custom

**Scanner :**
```bash
# Vérifier que logger est importé là où console.* était utilisé
grep -r "from '@/lib/logger'" frontend/src/ backoffice/src/ -c
```

**Vérifier patterns corrects :**
```typescript
// ✅ CORRECT
import { logger } from '@/lib/logger';
logger.error('Erreur produit:', error);

// ❌ INCORRECT
console.error('API Odoo Error:', error);
```

#### 2.3. Détection Secrets Loggés

**Scanner patterns dangereux :**
```bash
grep -rE "(password|token|secret|api_key|Bearer|Authorization).*log" \
  frontend/src/ backoffice/src/ --include="*.ts" --include="*.tsx" -n
```

**Violations P0 :**
- Log de variables contenant `password`, `token`, `apiKey`, etc.

### 3. Audit Frontend (XSS, CSRF, Secrets)

#### 3.1. Détection XSS (Cross-Site Scripting)

**Scanner `dangerouslySetInnerHTML` sans sanitization :**
```bash
grep -r "dangerouslySetInnerHTML" frontend/src/ backoffice/src/ \
  --include="*.tsx" -B 3 -A 1
```

**Vérifier :**
- Aucun `dangerouslySetInnerHTML` SANS sanitization via DOMPurify ou équivalent
- Aucune interpolation directe de données utilisateur dans HTML

**Exemple violation P0 :**
```tsx
// ❌ DANGEREUX
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ SAFE
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

#### 3.2. Détection Secrets Exposés Côté Client

**Scanner variables d'environnement publiques :**
```bash
# Frontend (Next.js)
grep -r "process.env" frontend/src/ --include="*.ts" --include="*.tsx" -n | \
  grep -v "NEXT_PUBLIC_"

# Backoffice (Vite)
grep -r "import.meta.env" backoffice/src/ --include="*.ts" --include="*.tsx" -n | \
  grep -v "VITE_"
```

**Violations P0 :**
- Utilisation de variables env privées côté client (ex: `process.env.DATABASE_URL`)
- Seules `NEXT_PUBLIC_*` (Next.js) et `VITE_*` (Vite) autorisées côté client

**Scanner secrets hardcodés :**
```bash
grep -rE "(api_key|apiKey|secret|password|token).*=.*['\"]" \
  frontend/src/ backoffice/src/ --include="*.ts" --include="*.tsx" -n
```

**Violations P0 :**
- Secrets hardcodés dans le code (ex: `const apiKey = 'sk_live_123456'`)

#### 3.3. Validation Côté Client (Insuffisante)

**Vérifier que validation existe aussi côté serveur :**
- Lister tous les formulaires avec Zod validation
- Pour chaque formulaire, vérifier qu'endpoint backend valide aussi les données

**Violations P1 :**
- Formulaire avec validation Zod frontend UNIQUEMENT (sans validation backend)

### 4. Audit Backend (Injection, sudo(), Validation)

#### 4.1. Détection SQL Injection

**Scanner requêtes SQL directes :**
```bash
grep -r "cr\\.execute\\|self\\._cr\\.execute" odoo-backend/addons/quelyos_api/ \
  --include="*.py" -B 2 -A 2
```

**Vérifier :**
- Aucune requête SQL avec interpolation directe (`f"SELECT * FROM {table}"`)
- Utiliser paramètres (`cr.execute("SELECT * FROM table WHERE id = %s", (id,))`)

**Violations P0 :**
```python
# ❌ DANGEREUX (SQL injection)
query = f"SELECT * FROM product_template WHERE name = '{user_input}'"
cr.execute(query)

# ✅ SAFE (paramètres)
cr.execute("SELECT * FROM product_template WHERE name = %s", (user_input,))
```

#### 4.2. Détection Abus `sudo()`

**Scanner usage `sudo()` :**
```bash
grep -r "\\.sudo()" odoo-backend/addons/quelyos_api/ --include="*.py" -n -B 2 -A 5
```

**Vérifier :**
- Chaque `sudo()` est documenté avec commentaire expliquant POURQUOI
- Aucun `sudo()` sur données utilisateur non vérifiées

**Violations P0 :**
```python
# ❌ DANGEREUX (sudo sans vérification)
product = request.env['product.template'].sudo().browse(product_id)
product.write({'name': user_input})  # Permet modification sans droits !

# ✅ SAFE (vérifier droits avant sudo)
product = request.env['product.template'].browse(product_id)
if not product.check_access_rights('write', raise_exception=False):
    raise AccessError("Insufficient permissions")
product.sudo().write({'name': validated_input})  # OK si raison documentée
```

#### 4.3. Validation Inputs Backend

**Scanner endpoints API sans validation :**
```bash
grep -r "@http\\.route" odoo-backend/addons/quelyos_api/controllers/ \
  --include="*.py" -A 20 | grep -v "if not\\|raise.*Error\\|validate"
```

**Vérifier pour chaque endpoint :**
- [ ] Paramètres requis vérifiés (`if not param: raise BadRequest()`)
- [ ] Types validés (int, float, list, etc.)
- [ ] Valeurs validées (longueur, format, range)
- [ ] Données sanitisées avant usage

**Violations P0 :**
- Endpoint qui écrit en DB sans valider les inputs utilisateur

#### 4.4. Détection Erreurs Techniques Exposées

**Scanner retours d'erreur bruts :**
```bash
grep -r "except.*:" odoo-backend/addons/quelyos_api/ --include="*.py" -A 5 | \
  grep "str(e)\\|repr(e)\\|traceback"
```

**Violations P0 :**
```python
# ❌ DANGEREUX (expose stack trace)
try:
    product = Product.browse(id)
except Exception as e:
    return {'error': str(e)}  # Peut exposer détails DB, chemins fichiers !

# ✅ SAFE (message générique)
try:
    product = Product.browse(id)
except Exception as e:
    _logger.error('Error fetching product: %s', e)
    return {'error': 'Product not found', 'message': 'Invalid product ID'}
```

### 5. Audit Dépendances (CVE)

#### 5.1. Audit NPM (Frontend + Backoffice)

```bash
# Frontend
cd frontend && npm audit --audit-level=moderate

# Backoffice
cd backoffice && npm audit --audit-level=moderate
```

**Classifier vulnérabilités :**
- **CRITICAL** → P0 (fix immédiat requis)
- **HIGH** → P1 (fix avant release)
- **MODERATE** → P2 (fix optionnel)
- **LOW** → Ignorer (sauf si trivial à fixer)

**Proposer fixes :**
```bash
npm audit fix          # Auto-fix si possible
npm audit fix --force  # Force upgrade (risque breaking changes)
```

#### 5.2. Audit Python (Backend)

```bash
cd odoo-backend
pip install safety
safety check --json
```

**Classifier comme NPM (CRITICAL/HIGH/MODERATE/LOW)**

### 6. Audit API (Auth, CORS, Rate Limiting)

#### 6.1. Vérification Auth Endpoints

**Lister tous les endpoints publics :**
```bash
grep -r "@http\\.route.*auth='public'" odoo-backend/addons/quelyos_api/ \
  --include="*.py" -B 2 -A 1
```

**Vérifier :**
- Chaque endpoint `auth='public'` est intentionnel (catalogue, produits publics)
- Endpoints sensibles (admin, write, delete) sont `auth='user'` ou `auth='api_key'`

**Violations P0 :**
- Endpoint CRUD admin accessible sans auth (`auth='public'`)
- Endpoint modification données accessible sans vérification droits

#### 6.2. Vérification CORS

**Vérifier configuration CORS :**
```bash
grep -r "Access-Control-Allow-Origin" odoo-backend/addons/quelyos_api/ \
  --include="*.py" -n
```

**Violations P0 :**
```python
# ❌ DANGEREUX (CORS trop permissif)
headers['Access-Control-Allow-Origin'] = '*'  # Accepte toutes origines !

# ✅ SAFE (CORS restrictif)
allowed_origins = ['https://quelyos.com', 'https://admin.quelyos.com']
origin = request.httprequest.headers.get('Origin')
if origin in allowed_origins:
    headers['Access-Control-Allow-Origin'] = origin
```

#### 6.3. Rate Limiting

**Vérifier protection rate limiting :**
```bash
grep -r "rate.*limit\\|throttle" odoo-backend/addons/quelyos_api/ --include="*.py" -n
```

**Violations P1 :**
- Aucun rate limiting sur endpoints publics (risque DoS)
- Recommandation : Ajouter rate limiting via nginx ou module Odoo

### 7. Génération Rapport Sécurité

**Format Markdown :**

```markdown
# 🔒 Rapport d'Audit Sécurité - [Date]

## 📊 Résumé Exécutif

| Catégorie | P0 (Critique) | P1 (Important) | P2 (Mineur) | Total |
|-----------|---------------|----------------|-------------|-------|
| Logs | 2 | 5 | 3 | 10 |
| Frontend | 0 | 2 | 1 | 3 |
| Backend | 1 | 3 | 0 | 4 |
| Dépendances | 0 | 1 | 4 | 5 |
| API | 1 | 2 | 0 | 3 |
| **TOTAL** | **4** | **13** | **8** | **25** |

**🚨 STATUT : BLOQUANT (4 P0 à corriger immédiatement)**

---

## 🚨 P0 - Vulnérabilités CRITIQUES (4)

### 1. Secrets loggés dans console navigateur

**Fichier** : `frontend/src/lib/odoo/client.ts:45`

**Code problématique** :
```typescript
console.error('Odoo API Error:', error, 'Token:', apiToken);
```

**Risque** :
- Expose token API dans console navigateur (visible par utilisateur/attaquant)
- Détails techniques "Odoo API" révèlent implémentation backend

**Solution** :
```typescript
import { logger } from '@/lib/logger';
logger.error('Erreur chargement données:', error); // Masqué en production
```

**Impact** : CRITIQUE - Exposition secrets + détails implémentation

---

### 2. SQL Injection possible dans recherche produits

**Fichier** : `odoo-backend/addons/quelyos_api/controllers/main.py:234`

**Code problématique** :
```python
query = f"SELECT id FROM product_template WHERE name ILIKE '%{search_term}%'"
request.env.cr.execute(query)
```

**Risque** :
- Injection SQL via `search_term` (ex: `'; DROP TABLE product_template; --`)
- Accès/modification données non autorisées

**Solution** :
```python
request.env.cr.execute(
    "SELECT id FROM product_template WHERE name ILIKE %s",
    (f'%{search_term}%',)
)
```

**Impact** : CRITIQUE - Compromission totale base de données

---

### 3. Endpoint admin accessible sans authentification

**Fichier** : `odoo-backend/addons/quelyos_api/controllers/main.py:456`

**Code problématique** :
```python
@http.route('/api/ecommerce/products/delete', auth='public', methods=['POST'])
def delete_product(self, product_id):
    Product = request.env['product.template'].sudo()
    Product.browse(product_id).unlink()
```

**Risque** :
- N'importe qui peut supprimer des produits (aucune auth requise)
- `sudo()` contourne les droits Odoo

**Solution** :
```python
@http.route('/api/ecommerce/products/delete', auth='user', methods=['POST'])
def delete_product(self, product_id):
    # Vérifier droits utilisateur
    Product = request.env['product.template']
    product = Product.browse(product_id)
    if not product.check_access_rights('unlink', raise_exception=False):
        raise AccessError("Insufficient permissions")
    product.unlink()
```

**Impact** : CRITIQUE - Suppression données sans autorisation

---

### 4. CORS trop permissif

**Fichier** : `odoo-backend/addons/quelyos_api/controllers/main.py:12`

**Code problématique** :
```python
response.headers['Access-Control-Allow-Origin'] = '*'
```

**Risque** :
- N'importe quel site peut appeler votre API
- Risque CSRF (Cross-Site Request Forgery)

**Solution** :
```python
ALLOWED_ORIGINS = ['https://quelyos.com', 'https://admin.quelyos.com']
origin = request.httprequest.headers.get('Origin')
if origin in ALLOWED_ORIGINS:
    response.headers['Access-Control-Allow-Origin'] = origin
```

**Impact** : CRITIQUE - Exploitation CSRF possible

---

## ⚠️ P1 - Vulnérabilités IMPORTANTES (13)

[...]

## 🔍 P2 - Améliorations Mineures (8)

[...]

---

## 📊 Audit Dépendances

### Frontend (npm audit)

- **CRITICAL** : 0
- **HIGH** : 1
  - `lodash` 4.17.19 → Prototype Pollution (CVE-2020-8203)
  - Fix : `npm update lodash@4.17.21`
- **MODERATE** : 4
- **LOW** : 12

### Backend (safety check)

- **CRITICAL** : 0
- **HIGH** : 0
- **MODERATE** : 1
  - `urllib3` 1.26.5 → HTTPS validation (CVE-2021-33503)
  - Fix : `pip install urllib3>=1.26.9`
- **LOW** : 3

---

## ✅ Bonnes Pratiques Détectées

- ✅ Logger custom `@/lib/logger` implémenté (frontend + backoffice)
- ✅ Validation Zod côté frontend sur formulaires
- ✅ Messages d'erreur user-friendly (pas de stack traces exposées)
- ✅ Aucun secret hardcodé dans code (utilisation .env)
- ✅ HTTPS activé en production

---

## 📋 Plan d'Action Priorisé

### Immédiat (avant tout commit)

1. ✅ Fixer P0-1 : Retirer `console.error()` avec token API
2. ✅ Fixer P0-2 : Corriger injection SQL dans recherche
3. ✅ Fixer P0-3 : Ajouter auth sur endpoint delete
4. ✅ Fixer P0-4 : Restreindre CORS aux domaines autorisés

### Avant Release (cette semaine)

5. ✅ Fixer P1-1 à P1-5 : Validation backend manquante
6. ✅ Upgrade dépendances vulnérables (lodash, urllib3)
7. ✅ Ajouter rate limiting sur endpoints publics

### Améliorations Continues (backlog)

8. Implémenter CSP (Content Security Policy) headers
9. Ajouter monitoring sécurité (Sentry)
10. Audit logs régulier (automatiser /security logs)

---

## 🎯 Score Sécurité

**Global : D (68/100)**

- Logs sécurisés : C (72/100) - 2 P0
- Frontend : B (85/100) - 0 P0
- Backend : D (60/100) - 2 P0
- Dépendances : A (95/100) - 0 P0
- API : D (65/100) - 2 P0

**Objectif Next Audit : B (85/100)** - 0 P0, < 5 P1
```

### 8. Validation et Suivi

**Après corrections, re-lancer audit :**
```bash
/security
```

**Comparer scores :**
- Score actuel vs précédent
- Nombre P0/P1/P2 réduits
- Nouvelles vulnérabilités introduites ?

**Documenter dans LOGME.md :**
```
- 2026-01-25 : Audit sécurité - 4 P0 corrigées (SQL injection, auth, CORS, logs)
```

## Métriques de Succès

**Cette commande est un succès si :**

1. ✅ Toutes vulnérabilités P0 identifiées et documentées
2. ✅ Rapport généré avec score sécurité (A-F)
3. ✅ Plan d'action priorisé fourni (Immédiat / Avant Release / Backlog)
4. ✅ Code snippets de correction fournis pour chaque P0
5. ✅ Aucun faux positif P0 (validation manuelle si nécessaire)

## Notes Importantes

- **Ne JAMAIS** committer du code avec vulnérabilités P0 non corrigées
- **Automatiser** cet audit en CI/CD (GitHub Actions)
- **Re-scanner** après chaque correction pour éviter régressions
- **Former** l'équipe aux bonnes pratiques détectées

## Exemples d'Utilisation

```bash
# Avant chaque commit
/security logs             # Vérifier aucun console.log ajouté

# Avant chaque PR
/security                  # Audit complet (backend + frontend + deps)

# Après upgrade dépendances
/security deps             # Vérifier aucune CVE introduite

# Audit API uniquement
/security api              # Vérifier auth, CORS, rate limiting
```
