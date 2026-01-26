# Commande /docs - Synchronisation Documentation ↔ Versions Réelles

## Description
Analyse et synchronise automatiquement les versions mentionnées dans la documentation (README.md, CLAUDE.md, etc.) avec les versions réelles des dépendances dans package.json et __manifest__.py. Garantit que la documentation reste toujours à jour.

## Usage

```bash
/docs              # Synchronisation complète + mise à jour automatique
/docs --check      # Vérification uniquement (rapport sans modification)
/docs <fichier>    # Vérifier un fichier spécifique
```

**Exemples** :
- `/docs` - Analyser et mettre à jour toute la documentation
- `/docs --check` - Voir les incohérences sans rien modifier
- `/docs README.md` - Vérifier uniquement le README

---

## Workflow de la commande

### Étape 1 : Extraction des Versions Réelles

**1.1. Frontend (Next.js)**
```bash
# Lire frontend/package.json
- next (Next.js)
- react
- typescript
- tailwindcss
- @tanstack/react-query (React Query)
- zod
- @stripe/stripe-js (Stripe)
- framer-motion
```

**1.2. Backoffice (React + Vite)**
```bash
# Lire backoffice/package.json
- react
- vite
- typescript
- tailwindcss
- @tanstack/react-query
- react-router-dom
- recharts
- lucide-react
```

**1.3. Backend Odoo**
```bash
# Lire odoo-backend/addons/quelyos_api/__manifest__.py
- version (ex: 19.0.1.0.22)
- Extraire version Odoo (19.0)

# Lire odoo-backend/docker-compose.yml
- odoo:19
- postgres:15
- python (extraire depuis Dockerfile si disponible)
```

**1.4. Environnement**
```bash
# Lire .nvmrc ou package.json engines
- Node.js version minimale
- npm version recommandée
```

---

### Étape 2 : Extraction des Versions Documentées

**2.1. Fichiers à analyser**

```bash
# Documentation principale
README.md
CLAUDE.md
odoo-backend/DEVELOPMENT.md
frontend/README.md
backoffice/README.md

# Documentation technique
.claude/reference/*.md
docs/*.md (si dossier docs existe)
```

**2.2. Patterns de versions à détecter**

```regex
# Patterns typiques
Next.js 14          → Capturer "14"
Next.js 16.1.4      → Capturer "16.1.4"
React 18            → Capturer "18"
React 19.2.3        → Capturer "19.2.3"
Node.js 18+         → Capturer "18"
PostgreSQL 15       → Capturer "15"
Odoo 19 Community   → Capturer "19"
TypeScript 5        → Capturer "5"
Tailwind CSS 3      → Capturer "3"
Tailwind CSS 4      → Capturer "4"
Vite 6              → Capturer "6"
```

**2.3. Format de stockage**

```typescript
interface VersionInfo {
  technology: string      // "Next.js", "React", "Odoo"...
  realVersion: string     // Version dans package.json
  docVersions: Array<{    // Versions mentionnées dans docs
    file: string
    line: number
    currentVersion: string
    context: string       // Ligne complète pour contexte
  }>
}
```

---

### Étape 3 : Détection des Incohérences

**3.1. Règles de comparaison**

```typescript
// Version majeure uniquement (OK)
Real: "16.1.4" vs Doc: "16"     → ✅ OK (majeure cohérente)
Real: "16.1.4" vs Doc: "14"     → ❌ KO (majeure différente)

// Version majeure.mineure (OK si majeure identique)
Real: "19.2.3" vs Doc: "19.2"   → ✅ OK
Real: "19.2.3" vs Doc: "18.3"   → ❌ KO

// Version complète
Real: "16.1.4" vs Doc: "16.1.4" → ✅ OK (parfait)
Real: "16.1.4" vs Doc: "16.0.1" → ⚠️ WARNING (majeure OK mais mineure différente)
```

**3.2. Classification des incohérences**

```typescript
enum InconsistencyLevel {
  CRITICAL,    // Version majeure différente (ex: Next 14 vs 16)
  WARNING,     // Version mineure différente (ex: React 19.2 vs 19.1)
  INFO,        // Documentation trop générique (ex: "Node.js 18+" vs "Node.js 20")
  PERFECT      // Versions exactement identiques
}
```

---

### Étape 4 : Génération du Rapport

**4.1. Format du rapport d'analyse**

```markdown
## 📚 Rapport de Synchronisation Documentation - [Date]

### 📊 Résumé

| Statut | Technologie | Version Réelle | Version Doc | Fichiers affectés |
|--------|-------------|----------------|-------------|-------------------|
| 🔴 CRITICAL | Next.js | **16.1.4** | 14 | README.md:44 |
| ⚠️ WARNING | React | **19.2.3** | 18.3 | README.md:44, CLAUDE.md:12 |
| ℹ️ INFO | Node.js | **20.x** | 18+ | README.md:54 |
| ✅ PERFECT | Odoo | **19** | 19 | README.md:46, CLAUDE.md:8 |

**Statistiques** :
- ✅ Versions cohérentes : 12/18 (67%)
- 🔴 Critiques : 2
- ⚠️ Warnings : 3
- ℹ️ Info : 1

### 🔴 CRITIQUE - Versions Majeures Différentes

#### Next.js : 16.1.4 → Doc dit "14"
**Impact** : Documentation obsolète, induit les nouveaux développeurs en erreur

**Fichiers concernés** :
- `README.md:44` - "Next.js 14, Tailwind CSS, TypeScript"
- `frontend/README.md:8` - "Ce projet utilise Next.js 14"

**Action recommandée** : Mettre à jour "14" → "16.1" partout

---

#### React : 19.2.3 → Doc dit "18" ou "18.3"
**Impact** : Mismatch majeure, Breaking changes possibles

**Fichiers concernés** :
- `README.md:44` - "React 18, Vite, Tailwind CSS"
- `CLAUDE.md:12` - "Frontend : React 18.3"
- `backoffice/README.md:5` - "React 18"

**Action recommandée** : Mettre à jour "18" → "19.2" partout

---

### ⚠️ WARNING - Versions Mineures Différentes

#### Tailwind CSS : 4.x → Doc dit "3.4"
**Impact** : Migration majeure v3 → v4 non documentée

**Fichiers concernés** :
- `README.md:44` - Pas de version spécifiée
- `frontend/package.json` - Utilise v4
- `backoffice/package.json` - Utilise v3.4.17 (incohérence frontend/backoffice!)

**Action recommandée** :
- Clarifier quelle version est la cible (v3 ou v4)
- Aligner frontend et backoffice
- Documenter dans README.md

---

### ℹ️ INFO - Documentation Générique

#### Node.js : Version réelle détectée 20.x → Doc dit "18+"
**Impact** : Faible, mais peut être plus précis

**Action recommandée** : Mettre à jour "18+" → "20+" ou "18-22"

---

### ✅ COHÉRENT - Versions Alignées

- ✅ **Odoo** : 19 Community (odoo-backend/__manifest__.py ↔ README.md)
- ✅ **PostgreSQL** : 15 (docker-compose.yml ↔ README.md)
- ✅ **TypeScript** : 5 (frontend + backoffice ↔ docs)
- ✅ **Zod** : 4.3.6 (frontend + backoffice ↔ cohérent)
- ✅ **React Query** : 5.x (frontend + backoffice ↔ cohérent)

---

### 📦 Versions Détectées (Référence Complète)

#### Frontend (frontend/package.json)
```json
{
  "next": "16.1.4",           // ❌ Doc dit "14"
  "react": "19.2.3",          // ❌ Doc dit "18"
  "react-dom": "19.2.3",      // ❌ Doc dit "18"
  "typescript": "^5",         // ✅ OK
  "tailwindcss": "^4",        // ⚠️ Doc pas clair
  "@tanstack/react-query": "^5.90.20",  // ✅ OK
  "zod": "^4.3.6",           // ✅ OK
  "framer-motion": "^12.29.0",
  "@stripe/stripe-js": "^8.6.4"
}
```

#### Backoffice (backoffice/package.json)
```json
{
  "react": "^18.3.1",         // ⚠️ Incohérence avec frontend (19.2.3)
  "react-dom": "^18.3.1",     // ⚠️ Incohérence avec frontend
  "vite": "^6.0.7",           // ✅ OK
  "typescript": "~5.6.2",     // ✅ OK
  "tailwindcss": "^3.4.17",   // ⚠️ Incohérence avec frontend (v4)
  "@tanstack/react-query": "^5.64.1",   // ✅ OK
  "react-router-dom": "^7.1.1",
  "recharts": "^3.7.0",
  "lucide-react": "^0.563.0"
}
```

#### Backend (odoo-backend/addons/quelyos_api/__manifest__.py)
```python
{
  "version": "19.0.1.0.22",   // Odoo 19 ✅ OK
}
```

#### Backend (odoo-backend/docker-compose.yml)
```yaml
odoo:19                       // ✅ OK
postgres:15                   // ✅ OK
```

---

### 🚨 ALERTE : Incohérences entre Frontend et Backoffice

**CRITIQUE** : Le frontend et le backoffice utilisent des versions différentes de dépendances communes !

| Dépendance | Frontend | Backoffice | Impact |
|------------|----------|------------|--------|
| React | **19.2.3** | **18.3.1** | 🔴 CRITIQUE - Incompatibilité potentielle |
| Tailwind CSS | **4.x** | **3.4.17** | 🔴 CRITIQUE - Syntaxe différente |
| React Query | 5.90.20 | 5.64.1 | ⚠️ WARNING - Versions mineures différentes |

**Recommandation** : Aligner toutes les dépendances communes sur les mêmes versions majeures/mineures.
```

---

### Étape 5 : Confirmation Utilisateur

**5.1. Si mode `--check`** : Afficher uniquement le rapport, STOP.

**5.2. Si mode normal** : Demander confirmation avec `AskUserQuestion`

```typescript
AskUserQuestion({
  questions: [{
    question: "J'ai détecté 6 incohérences de versions (2 critiques, 3 warnings). Que souhaitez-vous faire ?",
    header: "Sync Docs",
    multiSelect: false,
    options: [
      {
        label: "Mettre à jour automatiquement (Recommandé)",
        description: "Corriger toutes les versions dans la documentation"
      },
      {
        label: "Corriger uniquement les critiques",
        description: "Mettre à jour seulement les versions majeures différentes"
      },
      {
        label: "Rapport uniquement",
        description: "Ne rien modifier, juste afficher le rapport"
      },
      {
        label: "Sélection manuelle",
        description: "Choisir fichier par fichier"
      }
    ]
  }]
})
```

---

### Étape 6 : Mise à Jour Automatique

**6.1. Stratégie de remplacement intelligent**

```typescript
// Exemple : Next.js 14 → 16.1.4

// CAS 1 : Version seule
"Next.js 14" → "Next.js 16.1"

// CAS 2 : Dans une liste
"Next.js 14, Tailwind CSS" → "Next.js 16.1, Tailwind CSS"

// CAS 3 : Dans un tableau Markdown
"| Frontend | Next.js 14, Tailwind |"
→ "| Frontend | Next.js 16.1, Tailwind |"

// CAS 4 : Avec lien
"[Next.js 14](https://nextjs.org)"
→ "[Next.js 16.1](https://nextjs.org)"

// CAS 5 : Dans code block
`npm install next@14` → `npm install next@16`
```

**6.2. Ordre de mise à jour**

1. **README.md** - Documentation principale (la plus visible)
2. **CLAUDE.md** - Instructions Claude
3. **odoo-backend/DEVELOPMENT.md** - Documentation technique
4. **Autres fichiers .md** - Docs secondaires

**6.3. Utilisation de l'outil Edit**

```typescript
// Pour chaque fichier à modifier
Edit({
  file_path: "README.md",
  old_string: "Next.js 14, Tailwind CSS, TypeScript",
  new_string: "Next.js 16.1, Tailwind CSS, TypeScript"
})

Edit({
  file_path: "README.md",
  old_string: "React 18, Vite, Tailwind CSS",
  new_string: "React 19.2, Vite, Tailwind CSS"
})
```

**6.4. Validation post-modification**

```bash
# Relire les fichiers modifiés pour vérifier
Read("README.md")

# Vérifier git diff
git diff README.md CLAUDE.md
```

---

### Étape 7 : Détection des Incohérences Inter-Projets

**7.1. Comparer Frontend ↔ Backoffice**

```typescript
// Dépendances communes à vérifier
const sharedDeps = [
  'react',
  'react-dom',
  'typescript',
  'tailwindcss',
  '@tanstack/react-query',
  'zod',
  '@heroicons/react'
]

// Pour chaque dépendance commune
for (const dep of sharedDeps) {
  const frontendVersion = frontendPackage.dependencies[dep]
  const backofficeVersion = backofficePackage.dependencies[dep]

  if (getMajorVersion(frontendVersion) !== getMajorVersion(backofficeVersion)) {
    // 🔴 ALERTE CRITIQUE
  }
}
```

**7.2. Alertes spécifiques**

Si incohérence React détectée entre frontend et backoffice :
```
🚨 ALERTE CRITIQUE : React Version Mismatch

Frontend utilise React 19.2.3 mais Backoffice utilise React 18.3.1 !

⚠️ Risques :
- Incompatibilités potentielles lors du partage de composants
- Comportements différents entre projets
- Bugs subtils difficiles à déboguer

✅ Action recommandée :
Aligner sur React 19.2.3 partout :

cd backoffice
npm install react@19.2.3 react-dom@19.2.3

⚠️ NOTE : React 19 introduit des breaking changes. Vérifier :
- API de hooks
- Server Components
- Concurrent Features
```

---

### Étape 8 : Rapport Final

**8.1. Générer le rapport final**

```markdown
## ✅ Synchronisation Terminée - [Date]

### 📊 Résumé des Modifications

| Fichier | Modifications | Versions corrigées |
|---------|---------------|-------------------|
| README.md | 3 remplacements | Next.js, React, Tailwind |
| CLAUDE.md | 2 remplacements | React, Node.js |
| odoo-backend/DEVELOPMENT.md | 1 remplacement | PostgreSQL |

**Total** : 6 versions mises à jour dans 3 fichiers

---

### 📝 Détail des Modifications

#### README.md
```diff
- | Frontend | Next.js 14, Tailwind CSS, TypeScript |
+ | Frontend | Next.js 16.1, Tailwind CSS, TypeScript |

- | Backoffice | React 18, Vite, Tailwind CSS, React Query |
+ | Backoffice | React 19.2, Vite, Tailwind CSS, React Query |

- - Node.js 18+ (frontend/backoffice)
+ - Node.js 20+ (frontend/backoffice)
```

#### CLAUDE.md
```diff
- Frontend : Next.js 14 (e-commerce)
+ Frontend : Next.js 16.1 (e-commerce)

- Backoffice : React 18 + Vite (admin)
+ Backoffice : React 19.2 + Vite (admin)
```

---

### ✅ Validations

- [x] Toutes les versions critiques alignées
- [x] Documentation principale (README.md) à jour
- [x] Documentation technique (CLAUDE.md) à jour
- [x] Git diff vérifié
- [x] Aucune régression détectée

---

### 🚨 Actions Manuelles Recommandées

#### 1. Aligner React entre Frontend et Backoffice
```bash
# Backoffice utilise encore React 18.3.1, frontend utilise 19.2.3
cd backoffice
npm install react@19.2.3 react-dom@19.2.3
npm run build  # Vérifier que ça compile
```

#### 2. Décider stratégie Tailwind CSS
```bash
# Frontend utilise v4, Backoffice utilise v3.4.17
# Soit :
# A) Garder v3 partout (plus stable)
cd frontend && npm install tailwindcss@3.4.17

# B) Migrer backoffice vers v4 (plus moderne)
cd backoffice && npm install tailwindcss@4
# ⚠️ Vérifier la migration : https://tailwindcss.com/docs/upgrade-guide
```

#### 3. Vérifier compatibilité React Query
```bash
# Versions mineures différentes : 5.90 vs 5.64
# Généralement OK, mais tester les nouvelles fonctionnalités si utilisées
npm run test
```

---

### 💡 Recommandations pour l'Avenir

1. **Automatiser** : Exécuter `/docs --check` avant chaque release
2. **CI/CD** : Ajouter un script de vérification dans `.github/workflows`
3. **Pre-commit hook** : Bloquer si versions incohérentes détectées
4. **Dependabot** : Activer pour mises à jour automatiques
5. **Changelog** : Documenter les upgrades majeures dans CHANGELOG.md

---

### 📅 Prochaine Vérification

Recommandée dans **30 jours** ou après :
- Upgrade majeure de dépendances
- Ajout de nouvelles technologies
- Avant chaque release production
```

---

## Règles Importantes

### ✅ À FAIRE

1. **Toujours lire avant de modifier** - Vérifier le contexte exact
2. **Préserver le formatage Markdown** - Tables, listes, code blocks
3. **Utiliser versions majeures.mineures** - "16.1" plutôt que "16.1.4" dans docs
4. **Alerter sur incohérences critiques** - React version mismatch entre projets
5. **Demander confirmation** avant modifications massives
6. **Valider avec git diff** après modifications

### ❌ À ÉVITER

1. ❌ Ne jamais modifier les fichiers package.json (source de vérité)
2. ❌ Ne jamais modifier les fichiers __manifest__.py
3. ❌ Ne jamais casser le formatage Markdown des tableaux
4. ❌ Ne jamais mettre à jour sans lire le fichier d'abord
5. ❌ Ne jamais ignorer les incohérences entre frontend/backoffice

---

## Scripts Utiles

### Vérification rapide versions
```bash
# Frontend
jq '.dependencies.next' frontend/package.json

# Backoffice
jq '.dependencies.react' backoffice/package.json

# Odoo
grep "version" odoo-backend/addons/quelyos_api/__manifest__.py
```

### Comparaison inter-projets
```bash
# Comparer React versions
echo "Frontend:" && jq '.dependencies.react' frontend/package.json
echo "Backoffice:" && jq '.dependencies.react' backoffice/package.json
```

### Git diff après modification
```bash
git diff README.md CLAUDE.md
git diff --stat
```

---

## Cas d'usage typiques

1. **Après upgrade de dépendances** : Synchroniser la documentation
2. **Avant un commit important** : Vérifier cohérence
3. **Avant une release** : Garantir docs à jour
4. **Onboarding nouveau dev** : S'assurer que README est exact
5. **Audit mensuel** : Détecter dérive documentation/réalité

---

## Objectif Final

Garantir que **la documentation reflète toujours la réalité** :
- 📚 Zéro incohérence entre docs et code
- 🔄 Process automatisé et rapide (< 2 min)
- 🎯 Documentation fiable pour nouveaux développeurs
- 🚀 Réduction erreurs d'installation/setup
- ✅ Professionnalisme et crédibilité du projet

**Une doc à jour = Un projet professionnel.**
