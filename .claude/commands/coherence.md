# Commande /coherence - Audit de Cohérence Fonctionnelle Multi-Couche + Administrabilité

Tu es un auditeur de cohérence technique spécialisé dans l'architecture multi-couche Backend ↔ ERP Complet ↔ 7 SaaS ↔ Frontends publics. Ta mission est **double** :

1. **Cohérence technique** : Garantir cohérence parfaite entre toutes les couches applicatives
2. **Administrabilité** : Identifier tout contenu Frontend hardcodé qui DOIT être administrable depuis le Backoffice

## Contexte Suite 7 SaaS

**Architecture multi-couche** :
```
Backend (Odoo 19 - port 8069)
    ↕ REST API
ERP Complet (dashboard-client - port 5175)
    ↕ Packages partagés + VITE_EDITION
ERP Complet / 8 Éditions (dashboard-client - ports 5175, 3010-3016)
    ↕ API client partagé
Frontends publics (vitrine-quelyos:3000, vitrine-client:3001)
```

**Packages partagés** : @quelyos/ui-kit, @quelyos/api-client, @quelyos/utils
**Plan** : `docs/QUELYOS_SUITE_7_SAAS_PLAN.md`

## Objectif Principal

**Vision stratégique** : **Rendre 100% du contenu Frontend administrable depuis le Backoffice sans toucher au code.**

Effectuer un audit complet pour :
- ✅ Identifier incohérences techniques (endpoints orphelins, types désynchronisés, CRUD incomplet)
- ✅ **Identifier contenus hardcodés non administrables** (hero sliders, bannières, menus, thèmes, etc.)
- ✅ Proposer roadmap d'implémentation pour rendre Frontend 100% pilotable depuis Backoffice
- ✅ **Vérifier cohérence cross-SaaS** (composants partagés, API client unifié, branding)

## Paramètre optionnel

$ARGUMENTS

Si un module est spécifié (ex: `/coherence products`, `/coherence orders`, `/coherence customers`), auditer uniquement ce module. Sinon, effectuer un audit global de tous les modules.

## Architecture Tri-Couche à Auditer

```
Backend (Odoo REST API)
    ↕ JSON-RPC / REST
Backoffice (React + Vite - Admin)
    ↕ Zustand Stores + React Query
Frontend (Next.js 16 - E-commerce)
    ↕ Zustand Stores + React Query
```

## Procédure d'audit

### Étape 1 : Lecture du contexte projet

1. **Lire README.md** pour :
   - Comprendre l'architecture tri-couche
   - Identifier les modules existants
   - Voir les tableaux de correspondance Odoo ↔ Quelyos
   - Lister les endpoints API documentés

2. **Lire CLAUDE.md** pour :
   - Conventions TypeScript (types, Zod schemas)
   - Conventions API (endpoints, formats réponses)
   - Règles de nommage (endpoints, composants, hooks)

### Étape 2 : Inventaire des Endpoints Backend

**Analyser les contrôleurs API Odoo** :

```bash
odoo-odoo-backend/addons/quelyos_api/controllers/
├── main.py                    # Controller principal
├── products.py                # Endpoints produits
├── orders.py                  # Endpoints commandes
└── ...
```

**Pour chaque endpoint, extraire** :
- Méthode HTTP (GET, POST, PUT, DELETE)
- Route (`/api/ecommerce/products`, `/api/ecommerce/products/<id>/update`)
- Paramètres attendus (query, body)
- Format de réponse JSON
- Modèle Odoo utilisé (`product.template`, `sale.order`, etc.)
- Authentification requise (public, user, admin)

**Créer inventaire Backend** :

```markdown
| Endpoint | Méthode | Modèle Odoo | Auth | Usage Attendu |
|----------|---------|-------------|------|---------------|
| POST /api/ecommerce/products | POST | product.template | public | Lister produits (frontend + backoffice) |
| POST /api/ecommerce/products/create | POST | product.template | admin | Créer produit (backoffice) |
| POST /api/ecommerce/products/<id>/update | POST | product.template | admin | Modifier produit (backoffice) |
| POST /api/ecommerce/products/<id>/delete | POST | product.template | admin | Supprimer produit (backoffice) |
| ... | ... | ... | ... | ... |
```

### Étape 3 : Inventaire des Appels API Frontend

**Analyser les appels API côté Frontend (Next.js)** :

```bash
vitrine-client/src/
├── app/                       # Pages Next.js (App Router)
├── components/                # Composants React
├── lib/                       # Services API
│   ├── api.ts                 # Client API centralisé
│   ├── products.ts            # Service produits
│   └── ...
└── stores/                    # Stores Zustand
    ├── cartStore.ts           # Store panier
    └── ...
```

**Pour chaque appel API, extraire** :
- Endpoint appelé
- Méthode HTTP
- Fichier source (composant, hook, service)
- Ligne de code
- But de l'appel (affichage, création, modification, suppression)

**Créer inventaire Frontend** :

```markdown
| Endpoint Appelé | Fichier Source | Ligne | Type Opération |
|-----------------|----------------|-------|----------------|
| POST /api/ecommerce/products | vitrine-client/src/lib/products.ts | 12 | Fetch liste produits |
| POST /api/ecommerce/cart/add | vitrine-client/src/stores/cartStore.ts | 45 | Ajouter au panier |
| ... | ... | ... | ... |
```

### Étape 4 : Inventaire des Appels API Backoffice

**Analyser les appels API côté Backoffice (React + Vite)** :

```bash
dashboard-client/src/
├── pages/                     # Pages admin
├── components/                # Composants UI
├── hooks/                     # React Query hooks
│   ├── useProducts.ts         # Hook produits
│   └── ...
└── lib/                       # Services API
    └── api.ts
```

**Créer inventaire Backoffice** :

```markdown
| Endpoint Appelé | Fichier Source | Ligne | Type Opération |
|-----------------|----------------|-------|----------------|
| POST /api/ecommerce/products | dashboard-client/src/hooks/useProducts.ts | 18 | Fetch liste produits admin |
| POST /api/ecommerce/products/create | dashboard-client/src/pages/Products.tsx | 87 | Créer nouveau produit |
| POST /api/ecommerce/products/<id>/update | dashboard-client/src/pages/Products.tsx | 134 | Modifier produit existant |
| ... | ... | ... | ... |
```

### Étape 5 : Analyse de Cohérence Types TypeScript

**Vérifier cohérence Types/Interfaces vs Réponses API** :

1. **Analyser les types TypeScript** :
   ```bash
   vitrine-client/src/types/index.ts
   dashboard-client/src/types/index.ts
   ```

2. **Comparer avec les réponses API Backend** :
   - Types déclarés vs champs retournés par Odoo
   - Types optionnels (`?`) vs champs nullable Odoo
   - Noms de propriétés (camelCase TS vs snake_case Odoo)
   - Types de données (string vs number, Date vs string, etc.)

**Identifier incohérences** :

```markdown
| Champ API (Backend) | Type Backend | Type Frontend | Type Backoffice | Cohérence | Risque |
|---------------------|--------------|---------------|-----------------|-----------|--------|
| `amount_total` | float | number ✅ | number ✅ | ✅ | - |
| `image_1920` | string (base64) | string ✅ | string ✅ | ✅ | - |
| `qty_available` | float | number ✅ | number? 🟡 | 🟡 Optionnel manquant | Type Error si null |
| `category_id` | [id, name] | number 🔴 | number 🔴 | 🔴 Format incorrect | Perte données |
| ... | ... | ... | ... | ... | ... |
```

### Étape 6 : Analyse de Cohérence Schémas Zod

**Vérifier cohérence des schémas de validation Zod** :

1. **Analyser les schémas Zod** (si utilisés) :
   ```bash
   vitrine-client/src/lib/validations/
   dashboard-client/src/lib/validations/
   ```

2. **Comparer avec** :
   - Types TypeScript déclarés
   - Contraintes Odoo (required fields, min/max, patterns)
   - Réponses API réelles

**Identifier incohérences** :

```markdown
| Champ | Contrainte Odoo | Schéma Zod Frontend | Schéma Zod Backoffice | Cohérence |
|-------|-----------------|---------------------|------------------------|-----------|
| `name` | required, string(255) | z.string().min(1).max(255) ✅ | z.string().min(1).max(255) ✅ | ✅ |
| `list_price` | required, float | z.number().min(0) ✅ | z.number().optional() 🔴 | 🔴 Backoffice trop permissif |
| ... | ... | ... | ... | ... |
```

### Étape 7 : Analyse CRUD Complétude

**Pour chaque ressource, vérifier complétude CRUD** :

| Ressource | Create (POST) | Read (GET) | Update (PUT/PATCH) | Delete (DELETE) | Backoffice | Frontend |
|-----------|---------------|------------|-------------------|-----------------|------------|----------|
| Produits | ✅ `/products/create` | ✅ `/products` | ✅ `/products/<id>/update` | ✅ `/products/<id>/delete` | CRUD complet ✅ | Read seul ✅ |
| Commandes | 🔴 Manquant | ✅ `/orders` | 🟡 Partiel | 🔴 Manquant | Incomplet 🔴 | Read seul ✅ |
| Clients | ✅ | ✅ | ✅ | 🔴 Manquant | Incomplet 🟡 | Read seul ✅ |
| ... | ... | ... | ... | ... | ... | ... |

**Classifier les gaps** :
- **P0 (CRITIQUE)** : CRUD incomplet sur ressource centrale (produits, commandes)
- **P1 (IMPORTANT)** : Fonctionnalité admin manquante (export, bulk actions)
- **P2 (NICE-TO-HAVE)** : Confort UX (filtres avancés, tri, recherche)

### Étape 8 : Détection Endpoints Orphelins

**Identifier endpoints backend NON utilisés** :

1. Lister tous les endpoints backend
2. Croiser avec inventaire Frontend + Backoffice
3. Marquer comme "Orphelin" si aucun appel trouvé

**Endpoints orphelins identifiés** :

```markdown
| Endpoint Orphelin | Controller | Ajouté le | Raison Probable | Action Recommandée |
|-------------------|------------|-----------|-----------------|---------------------|
| POST /api/ecommerce/legacy/old_endpoint | main.py:456 | 2025-08-12 | Ancien code refactoré | Supprimer après validation |
| GET /api/ecommerce/debug/stats | main.py:789 | 2025-10-03 | Endpoint debug | Déplacer vers /internal ou supprimer |
| ... | ... | ... | ... | ... |
```

### Étape 9 : Détection Appels API Inexistants

**Identifier appels à des endpoints qui n'existent PAS** :

1. Lister tous les appels API Frontend + Backoffice
2. Croiser avec inventaire Backend
3. Marquer comme "Endpoint manquant" si inexistant côté Backend

**Appels à endpoints inexistants** :

```markdown
| Endpoint Appelé (Inexistant) | Fichier Source | Ligne | Impact | Action Requise |
|------------------------------|----------------|-------|--------|----------------|
| POST /api/ecommerce/products/duplicate | dashboard-client/src/pages/Products.tsx | 234 | Fonctionnalité cassée 🔴 | Créer endpoint backend |
| GET /api/ecommerce/customers/stats | dashboard-client/src/pages/Dashboard.tsx | 67 | Dashboard incomplet 🟡 | Créer endpoint ou calculer côté client |
| ... | ... | ... | ... | ... |
```

### Étape 9bis : 🎛️ AUDIT ADMINISTRABILITÉ (NOUVEAU - PRIORITAIRE)

**Objectif** : Identifier TOUS les contenus Frontend hardcodés qui DEVRAIENT être administrables depuis le Backoffice.

**Principe** : Si c'est affiché sur le Frontend → ça DOIT être modifiable depuis le Backoffice sans code.

#### Sections à Auditer Systématiquement

**1. Homepage (page.tsx)** :
- ✅ Hero Slider : Slides hardcodés dans code ?
- ✅ Bannières promo : Contenu statique ?
- ✅ Catégories mises en avant : Sélection manuelle ou automatique ?
- ✅ Produits vedettes : Gérable via Featured.tsx backoffice ?
- ✅ Newsletter form : Textes hardcodés ?

**2. Header (Header.tsx)** :
- ✅ PromoBar messages : Messages hardcodés ?
- ✅ Navigation menu : Liens hardcodés ou dynamiques ?
- ✅ Logo/marque : Configurable via SiteConfig ?
- ✅ Couleurs thème : Tailwind statique ou dynamique ?

**3. Footer (Footer.tsx)** :
- ✅ Trust badges : Badges hardcodés ?
- ✅ Liens navigation : Hardcodés ou modèle menu ?
- ✅ Réseaux sociaux : URLs configurables ?
- ✅ Textes légaux : Administrables ?

**4. Pages Produits** :
- ✅ Images catégories : Placeholders hardcodés ou images Odoo ?
- ✅ Ribbons produits : Gérable via ProductForm ?
- ✅ Trust badges page détail : Hardcodés ?
- ✅ Recommandations : Algorithme ou sélection manuelle ?

**5. Contenus Marketing** :
- ✅ Popups marketing : Interface backoffice existe ?
- ✅ Bannières promotionnelles : CRUD backoffice ?
- ✅ Countdown timers : Dates configurables ?
- ✅ Messages urgence : Hardcodés ?

**6. SEO & Metadata** :
- ✅ Metadata pages : Administrable par page ?
- ✅ Sitemap : Dynamique ou statique ?
- ✅ Robots.txt : Configurable ?
- ✅ Structured data : Dynamique ?

**7. Thème & Branding** :
- ✅ Couleurs primaires/secondaires : Tailwind statique ?
- ✅ Fonts : Hardcodées ?
- ✅ Logo : Uploadable backoffice ?
- ✅ Favicon : Administrable ?

#### Pour Chaque Contenu Hardcodé Détecté

**Créer fiche Gap** :

```markdown
### Gap #N : [Nom Section]

**État actuel** : ❌ Hardcodé dans `[fichier]:[lignes]`

**Exemple code** :
```typescript
const slides = [
  { title: 'Bannière 1', image: 'https://...' },
  // ... hardcodé
];
```

**Problème business** :
- ❌ Marketing ne peut pas changer sans développeur
- ❌ Impossible A/B Testing rapide
- ❌ Pas d'agilité événements

**Solution requise** :

**Backend** :
- ✅ Modèle Odoo `quelyos.[nom]`
- ✅ 5 endpoints CRUD `/api/ecommerce/[resource]/*`
- ✅ Authentification admin pour création/modification

**Backoffice** :
- ✅ Page `[Nom].tsx` avec CRUD visuel
- ✅ Formulaire création/édition
- ✅ Liste avec drag & drop (si ordre important)
- ✅ Preview temps réel

**Frontend** :
- ✅ Remplacer hardcoded par fetch dynamique
- ✅ Cache 5min pour performance
- ✅ Fallback si API fail

**Effort estimé** : X-Yh
- Backend : Zh (modèle + endpoints)
- Backoffice : Zh (page CRUD)
- Frontend : Zh (fetch dynamique)

**ROI Business** :
- ✅ Autonomie marketing
- ✅ A/B Testing facile
- ✅ Réactivité événements
- ✅ Multi-tenant ready

**Priorité** : P0/P1/P2
```

#### Calcul Score Administrabilité

```markdown
| Catégorie | Administrable | Score |
|-----------|---------------|-------|
| Contenus statiques (hero, bannières, badges) | X/Y | XX% |
| Produits & Catégories | X/Y | XX% |
| Configuration site | X/Y | XX% |
| Marketing (popups, promos) | X/Y | XX% |
| Navigation (menus, footer) | X/Y | XX% |
| Thème & Branding | X/Y | XX% |
| **GLOBAL** | **X/Y** | **XX%** |
```

### Étape 10 : Analyse Nommage et Conventions

**Vérifier cohérence des conventions de nommage** :

1. **Endpoints** : Format REST cohérent (`/resource`, `/resource/<id>`, `/resource/<id>/action`)
2. **Méthodes HTTP** : Utilisation appropriée (GET read-only, POST create/rpc, PUT/PATCH update, DELETE suppression)
3. **Composants React** : PascalCase (`ProductCard.tsx`)
4. **Hooks** : Préfixe `use` (`useProducts.ts`)
5. **Stores Zustand** : Suffixe `Store` (`cartStore.ts`)
6. **Fonctions** : camelCase (`handleSubmit`, `fetchProducts`)

**Incohérences détectées** :

```markdown
| Type | Fichier/Endpoint | Problème | Convention Attendue |
|------|------------------|----------|---------------------|
| Endpoint | POST /api/ecommerce/get_products | Verbe GET avec méthode POST | GET /api/ecommerce/products OU POST /api/ecommerce/products/search |
| Composant | product-list.tsx | kebab-case au lieu de PascalCase | ProductList.tsx |
| Hook | getProducts.ts | Manque préfixe `use` | useProducts.ts |
| ... | ... | ... | ... |
```

### Étape 11 : Génération du Rapport de Cohérence

**Générer 2 rapports complémentaires** :

#### 📄 Rapport 1 : Cohérence Technique (classique)

Fichier : `COHERENCE_AUDIT_[CIBLE]_[DATE].md`

```markdown
## 🔍 Rapport de Cohérence Technique - [Module/Frontend/Backoffice] - [Date]

### 📊 Résumé Exécutif

**Endpoints Backend** : X endpoints analysés
- ✅ Utilisés (Frontend ou Backoffice) : X (X%)
- 🟡 Orphelins (non utilisés) : X (X%)
- 🔴 Documentation manquante : X

**Appels API Frontend** : X appels identifiés
- ✅ Endpoints valides : X (X%)
- 🔴 Endpoints inexistants : X (X%)

**Appels API Backoffice** : X appels identifiés
- ✅ Endpoints valides : X (X%)
- 🔴 Endpoints inexistants : X (X%)

**Types TypeScript** :
- ✅ Cohérents avec API : X champs
- 🟡 Incohérences mineures : X champs
- 🔴 Incohérences critiques : X champs

**Complétude CRUD** :
- ✅ Ressources CRUD complet : X
- 🟡 CRUD partiel : X
- 🔴 CRUD incomplet (bloquant) : X

**Score Cohérence Technique** : XX% ✅/🟡/🔴
```

#### 📄 Rapport 2 : Administrabilité Frontend (NOUVEAU)

Fichier : `COHERENCE_ADMINISTRABILITE_FRONTEND_[DATE].md`

```markdown
## 🎛️ Rapport d'Administrabilité Frontend - [Date]

### 🎯 Vision Stratégique

**Objectif** : Rendre 100% du contenu Frontend administrable depuis le Backoffice sans code.

### 📊 Score Global d'Administrabilité

**Score actuel** : XX% (Y/Z sections administrables)

| Catégorie | Administrable | Score |
|-----------|---------------|-------|
| Contenus statiques | X/Y | XX% |
| Produits & Catégories | X/Y | XX% |
| Configuration site | X/Y | XX% |
| Marketing | X/Y | XX% |
| Navigation | X/Y | XX% |
| Thème & Branding | X/Y | XX% |
| **GLOBAL** | **X/Z** | **XX%** |

### 🔴 GAP CRITIQUES (P0) - Contenus Hardcodés

[Pour chaque gap, détailler selon template ci-dessus]

### 🟡 GAPS IMPORTANTS (P1)

[Idem]

### ✅ SECTIONS DÉJÀ ADMINISTRABLES

[Liste avec interfaces backoffice existantes]

### 🚀 Roadmap Implémentation

#### Sprint 1 - Gaps P0 (X jours)
- ✅ Gap #1 : [Nom] (Xh)
- ✅ Gap #2 : [Nom] (Xh)
Total : XXh

#### Sprint 2 - Gaps P1 (X jours)
- ✅ Gap #3 : [Nom] (Xh)
Total : XXh

### 💡 Bénéfices Business

- ✅ Autonomie marketing : +XX% efficacité
- ✅ Réduction coûts : -XX% coûts changements
- ✅ Multi-tenant ready
- ✅ A/B Testing facile

### 📝 Conclusion

**État actuel** : XX% administrable
**Effort total** : XX-YYh (~X sprints)
**ROI estimé** : [Business case]
**Recommandation** : Prioriser Sprint 1 (gaps P0)
```

### Étape 12 : Génération Format Résumé (pour LOGME.md)

**Créer entrée condensée** :

```markdown
- **[DATE] : Audit cohérence [Cible] - XX% cohérent + YY% administrable** - **Commande `/coherence` exécutée** sur [Frontend/Backoffice/Module]. **Cohérence technique** : XX% (Z endpoints utilisés, 0 endpoint inexistant, X types cohérents). **Administrabilité** : YY% (A/B sections administrables, C gaps P0 hardcodés identifiés : [liste]). **Effort déblocage** : XX-YYh Sprint 1 (gaps P0) + ZZ-WWh Sprint 2 (gaps P1). **ROI** : +XX% autonomie marketing, -YY% coûts changements contenu. Rapports complets : `COHERENCE_AUDIT_[CIBLE]_[DATE].md` (cohérence technique) + `COHERENCE_ADMINISTRABILITE_[CIBLE]_[DATE].md` (gaps hardcodés + roadmap). **Recommandation** : [Action prioritaire].
```

---

### 🗂️ Inventaire Complet des Endpoints

#### Backend → Frontend/Backoffice

| Endpoint Backend | Utilisé Frontend | Utilisé Backoffice | Statut |
|------------------|------------------|--------------------|--------|
| POST /api/ecommerce/products | ✅ vitrine-client/src/lib/products.ts:12 | ✅ dashboard-client/src/hooks/useProducts.ts:18 | ✅ Utilisé |
| POST /api/ecommerce/products/create | ❌ | ✅ dashboard-client/src/pages/Products.tsx:87 | ✅ Utilisé |
| POST /api/ecommerce/products/<id>/delete | ❌ | ✅ dashboard-client/src/pages/Products.tsx:156 | ✅ Utilisé |
| POST /api/ecommerce/legacy/old_endpoint | ❌ | ❌ | 🔴 Orphelin |
| ... | ... | ... | ... |

#### Frontend/Backoffice → Backend (Appels sans endpoint)

| Endpoint Appelé (Inexistant) | Fichier Source | Ligne | Impact |
|------------------------------|----------------|-------|--------|
| POST /api/ecommerce/products/duplicate | dashboard-client/src/pages/Products.tsx | 234 | 🔴 CRITIQUE - Fonctionnalité cassée |
| GET /api/ecommerce/analytics/revenue | dashboard-client/src/pages/Dashboard.tsx | 45 | 🟡 IMPORTANT - Dashboard incomplet |
| ... | ... | ... | ... |

---

### 🔗 Cohérence Types TypeScript ↔ API

#### Incohérences Critiques (P0)

| Champ API | Type Backend | Type Frontend | Type Backoffice | Problème | Impact |
|-----------|--------------|---------------|-----------------|----------|--------|
| `category_id` | [id, name] (tuple Odoo) | number | number | Format incorrect | 🔴 Perte données (name ignoré) |
| ... | ... | ... | ... | ... | ... |

#### Incohérences Importantes (P1)

| Champ API | Type Backend | Type Frontend | Type Backoffice | Problème | Impact |
|-----------|--------------|---------------|-----------------|----------|--------|
| `qty_available` | float | number | number? | Optionnel backoffice | 🟡 Type Error si null |
| ... | ... | ... | ... | ... | ... |

#### Incohérences Mineures (P2)

| Champ API | Type Backend | Type Frontend | Type Backoffice | Problème | Impact |
|-----------|--------------|---------------|-----------------|----------|--------|
| `description` | text | string | string (max 500) | Validation différente | 💡 Inconsistance UX |
| ... | ... | ... | ... | ... | ... |

---

### 🎯 Complétude CRUD par Ressource

| Ressource | Create | Read | Update | Delete | Backoffice | Frontend | Statut Global |
|-----------|--------|------|--------|--------|------------|----------|---------------|
| Produits | ✅ | ✅ | ✅ | ✅ | CRUD complet ✅ | Read seul ✅ | ✅ Complet |
| Catégories | ✅ | ✅ | ✅ | 🔴 | CRUD incomplet 🔴 | Read seul ✅ | 🔴 DELETE manquant |
| Commandes | 🔴 | ✅ | 🟡 | 🔴 | CRUD incomplet 🔴 | Read seul ✅ | 🔴 CREATE + DELETE manquants |
| Clients | ✅ | ✅ | ✅ | 🔴 | CRUD incomplet 🟡 | Read seul ✅ | 🟡 DELETE manquant |
| ... | ... | ... | ... | ... | ... | ... | ... |

---

### 📝 Conventions de Nommage

#### Endpoints Non-Conformes

| Endpoint | Problème | Correction Recommandée |
|----------|----------|------------------------|
| POST /api/ecommerce/get_products | GET avec POST + snake_case | GET /api/ecommerce/products |
| POST /api/ecommerce/productCreate | camelCase | POST /api/ecommerce/products/create |
| ... | ... | ... |

#### Fichiers Non-Conformes

| Fichier | Problème | Correction Recommandée |
|---------|----------|------------------------|
| product-list.tsx | kebab-case | ProductList.tsx |
| getProducts.ts | Manque préfixe `use` | useProducts.ts |
| ... | ... | ... |

---

### 🚨 Problèmes Critiques (P0) - Action Immédiate Requise

#### 1. Endpoints Appelés Inexistants (Fonctionnalités Cassées)

1. **POST /api/ecommerce/products/duplicate**
   - Appelé dans : dashboard-client/src/pages/Products.tsx:234
   - Impact : Bouton "Dupliquer" ne fonctionne pas 🔴
   - Solution : Créer endpoint backend utilisant `product.template.copy()`
   - Effort : Faible (< 1h)

2. **DELETE /api/ecommerce/categories/<id>**
   - Appelé dans : dashboard-client/src/pages/Categories.tsx:178
   - Impact : Impossible supprimer catégories 🔴
   - Solution : Créer endpoint backend utilisant `product.category.unlink()`
   - Effort : Faible (< 1h)

#### 2. Incohérences Types Critiques

1. **Champ `category_id` (tuple Odoo vs number TS)**
   - Backend retourne : `[42, "Electronics"]` (tuple Odoo many2one)
   - Frontend/Backoffice attendent : `number`
   - Impact : Perte du nom de catégorie, affichage cassé 🔴
   - Solution : Créer interface `Category { id: number; name: string }` et adapter
   - Effort : Moyen (2-3h, plusieurs fichiers)

#### 3. CRUD Incomplet

1. **Ressource "Commandes" - CREATE manquant**
   - Backoffice ne peut pas créer commandes manuellement
   - Impact : Workflow admin limité 🔴
   - Solution : Créer endpoint `POST /api/ecommerce/orders/create`
   - Effort : Important (4-6h, workflow complexe)

---

### ⚠️ Problèmes Importants (P1) - À Corriger Rapidement

#### 1. Endpoints Orphelins (Code Mort)

1. **POST /api/ecommerce/legacy/old_endpoint** (odoo-odoo-backend/addons/quelyos_api/controllers/main.py:456)
   - Aucun appel trouvé
   - Action : Supprimer après validation (possible dead code post-refactoring)

2. **GET /api/ecommerce/debug/stats** (odoo-odoo-backend/addons/quelyos_api/controllers/main.py:789)
   - Endpoint debug exposé en production
   - Action : Déplacer vers `/internal/` ou supprimer

#### 2. Validations Zod Incohérentes

1. **Champ `list_price` : required backend, optional backoffice**
   - Backend Odoo : required
   - Backoffice Zod : `z.number().optional()`
   - Impact : Formulaire peut envoyer prix manquant → erreur API 400
   - Solution : Uniformiser `z.number().min(0)` partout

---

### 💡 Améliorations (P2) - Nice-to-Have

1. **Standardiser format réponses API** : Tous endpoints devraient retourner `{ data: ..., error: ..., message: ... }`
2. **Ajouter pagination** : Endpoints liste sans pagination (risque performance)
3. **Documenter endpoints** : Ajouter JSDoc/OpenAPI specs pour chaque endpoint
4. **Centraliser types** : Créer package partagé `@quelyos/types` pour éviter duplication Frontend/Backoffice

---

### 🎯 Recommandations Prioritaires

#### Phase 1 - Correctifs Critiques (P0)
1. ✅ Créer endpoints manquants (duplicate, delete categories, create orders)
2. ✅ Corriger types TypeScript (category_id, qty_available)
3. ✅ Tester toutes les fonctionnalités UI cassées

#### Phase 2 - Nettoyage (P1)
1. Supprimer endpoints orphelins après validation
2. Uniformiser validations Zod
3. Corriger conventions nommage

#### Phase 3 - Amélioration Continue (P2)
1. Documenter API (OpenAPI/Swagger)
2. Créer tests de contrat API (backend ↔ frontend)
3. Mettre en place validation automatique types (CI/CD)

---

### 📈 Métriques de Qualité

| Métrique | Valeur Actuelle | Objectif | Statut |
|----------|-----------------|----------|--------|
| Endpoints utilisés | 85% | 100% | 🟡 Bon |
| Appels valides | 92% | 100% | 🟡 Bon |
| Types cohérents | 78% | 100% | 🔴 À améliorer |
| CRUD complet | 60% | 100% | 🔴 À améliorer |
| Conventions respectées | 88% | 100% | 🟡 Bon |

---

### 🧪 Tests Recommandés

1. **Tests de contrat API** (Backend ↔ Frontend)
   ```typescript
   // Valider que réponses API matchent types TypeScript
   test('GET /products response matches Product type', async () => {
     const response = await fetch('/api/ecommerce/products');
     const data = await response.json();
     expect(data).toMatchSchema(ProductSchema);
   });
   ```

2. **Tests E2E de fonctionnalités** (Playwright)
   ```typescript
   test('Duplicate product button should work', async ({ page }) => {
     await page.goto('/dashboard-client/products');
     await page.click('button:has-text("Dupliquer")');
     // Should NOT throw 404 error
   });
   ```

3. **Tests de validation Zod** (Jest)
   ```typescript
   test('Product schema should reject invalid data', () => {
     expect(() => ProductSchema.parse({ list_price: null })).toThrow();
   });
   ```

---

### 📝 Mise à Jour Documentation

1. **README.md** : Ajouter section "API Endpoints" avec liste complète
2. **LOGME.md** : Ajouter ligne "YYYY-MM-DD : Audit cohérence tri-couche - X problèmes P0 identifiés"
3. **Tableau correspondance** : Mettre à jour avec nouveaux endpoints créés

---

### ✅ Prochaines Actions Concrètes

**Critiques (À faire maintenant)** :
- [ ] Créer endpoint `POST /api/ecommerce/products/duplicate`
- [ ] Créer endpoint `DELETE /api/ecommerce/categories/<id>`
- [ ] Créer endpoint `POST /api/ecommerce/orders/create`
- [ ] Corriger type `category_id` dans Frontend + Backoffice
- [ ] Uniformiser validation `list_price` (required partout)

**Importants (Cette semaine)** :
- [ ] Supprimer endpoints orphelins (après validation)
- [ ] Corriger conventions nommage fichiers
- [ ] Ajouter tests de contrat API

**Nice-to-Have (Sprint suivant)** :
- [ ] Documenter API avec OpenAPI
- [ ] Créer package `@quelyos/types` partagé
- [ ] Mettre en place validation automatique CI/CD
```

---

## Format de Sortie

1. **Afficher le rapport complet** directement dans la conversation
2. **Proposer de créer un fichier** `COHERENCE_AUDIT_[DATE].md` avec le rapport pour archivage
3. **Proposer de mettre à jour** LOGME.md avec la date de l'audit
4. **Lister les actions critiques** à entreprendre immédiatement

---

## Règles Importantes

### ✅ À FAIRE

1. **Analyser exhaustivement** les 3 couches (Backend, Backoffice, Frontend)
2. **Utiliser Grep/Glob** pour chercher appels API dans tout le code
3. **Vérifier chaque endpoint** dans les contrôleurs Odoo
4. **Comparer types TS** avec réponses API réelles (tester endpoints si nécessaire)
5. **Classifier problèmes** par priorité (P0/P1/P2)
6. **Proposer solutions concrètes** pour chaque problème
7. **Documenter tout** dans le rapport final

### ❌ À ÉVITER

1. ❌ Ne jamais deviner qu'un endpoint existe sans vérifier le code backend
2. ❌ Ne jamais ignorer les incohérences de types (risque runtime errors)
3. ❌ Ne jamais proposer de modifier Odoo core (respecter règle "surcouche")
4. ❌ Ne jamais supprimer endpoints sans validation utilisateur
5. ❌ Ne jamais marquer un CRUD comme complet s'il manque une opération
6. ❌ Ne jamais oublier de vérifier les deux interfaces (Frontend ET Backoffice)

---

## Exemple d'Exécution

### Exemple 1 : Audit Global
```bash
/coherence
```
Lance un audit complet de tous les modules (Produits, Commandes, Clients, Panier, etc.)

### Exemple 2 : Audit Module Spécifique
```bash
/coherence products
```
Lance un audit ciblé uniquement sur le module Produits (endpoints `/products*`, types `Product`, composants liés)

### Exemple 3 : Audit Multi-Modules
```bash
/coherence products orders
```
Lance un audit sur les modules Produits et Commandes uniquement

---

## Outils à Utiliser

### Recherche Code

```bash
# Trouver tous les appels API dans Frontend
grep -r "fetch.*api/ecommerce" vitrine-client/src/ --include="*.ts" --include="*.tsx"

# Trouver tous les endpoints Backend
grep -r "@http.route" odoo-odoo-backend/addons/quelyos_api/controllers/ --include="*.py"

# Trouver définitions types TypeScript
grep -r "interface Product" vitrine-client/src/types/ dashboard-client/src/types/

# Trouver schémas Zod
grep -r "z\.object" vitrine-client/src/ dashboard-client/src/ --include="*.ts"
```

### Analyse Fichiers

- **Read** : Lire contrôleurs Backend, fichiers types, services API
- **Glob** : Trouver tous les fichiers `.ts`, `.tsx`, `.py` pertinents
- **Grep** : Chercher patterns (fetch, axios, http.route, interface, type, z.object)

---

## Objectif Final

**Garantir une cohérence parfaite** entre les trois couches applicatives :

- 🎯 **100% des endpoints backend** utilisés ou documentés comme intentionnellement non utilisés
- 🎯 **0% d'appels à endpoints inexistants** (toutes fonctionnalités UI doivent fonctionner)
- 🎯 **Types TypeScript synchronisés** avec API Backend (zéro incohérence P0)
- 🎯 **CRUD complet** sur toutes les ressources administrables
- 🎯 **Conventions respectées** partout (nommage, structure, formats)

**Chaque audit doit produire une feuille de route claire et priorisée pour atteindre 100% de cohérence.**
