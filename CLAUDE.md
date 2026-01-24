# Instructions Claude Code - Quelyos ERP

## Langue de communication

**IMPORTANT : Toutes les communications doivent être en français.**

- Réponses, explications et messages en français
- Messages de commit et documentation en français
- Code source (variables, fonctions, classes) en anglais selon les conventions

---

## Documentation

- **Ne jamais créer de fichiers `.md`** autres que `README.md` et `LOGME.md`
- Le `README.md` est le **seul document de référence** du projet
- Le `LOGME.md` est le **journal des grandes étapes** du projet
- Si une information importante doit être mémorisée, l'ajouter dans le `README.md`

### Journal de bord (LOGME.md)

**À chaque grande étape réalisée dans le projet, ajouter une ligne dans `LOGME.md`**

Format :
```
- YYYY-MM-DD : Description concise de l'étape réalisée
```

Exemples de grandes étapes :
- Ajout d'un nouveau module/fonctionnalité majeure
- Refactoring architectural important
- Migration de version
- Résolution d'un bug critique
- Déploiement en production

---

## Architecture

```
frontend/          → Next.js 16 (boutique e-commerce)
backoffice/        → React + Vite (administration)
backend/addons/quelyos_api/  → Module Odoo (API REST)
```

---

## Conventions TypeScript (Frontend & Backoffice)

### Structure des fichiers

- Composants : `PascalCase.tsx` (ex: `ProductCard.tsx`)
- Hooks : `useCamelCase.ts` (ex: `useCart.ts`)
- Stores Zustand : `camelCaseStore.ts` (ex: `cartStore.ts`)
- Types : `src/types/index.ts` (centralisés)
- Utilitaires : `src/lib/` organisés par domaine

### Règles strictes

- Toujours utiliser TypeScript strict (`strict: true`)
- Définir les types explicitement, éviter `any`
- Utiliser Zod pour la validation des données API
- Préférer `interface` pour les objets, `type` pour les unions

### Composants React

```tsx
// Structure type d'un composant
interface Props {
  // Props typées explicitement
}

export function ComponentName({ prop1, prop2 }: Props) {
  // Hooks en premier
  // Logique
  // Return JSX
}
```

- Privilégier les composants fonctionnels
- Pas de `default export` pour les composants (sauf pages Next.js)
- Utiliser les Server Components par défaut, `'use client'` uniquement si nécessaire

### State Management

- Zustand pour le state global (cart, auth, wishlist)
- React Hook Form + Zod pour les formulaires
- Pas de prop drilling > 2 niveaux → utiliser un store ou context

---

## Conventions Python (Backend Odoo)

### Structure module Odoo

```
quelyos_api/
├── __manifest__.py
├── __init__.py
├── controllers/      → Endpoints API REST
├── models/           → Modèles Odoo (si extension)
├── security/         → Droits d'accès
└── views/            → Vues XML (si backend Odoo)
```

### Règles API REST

- Préfixe : `/api/v1/`
- Réponses JSON standardisées : `{ data: ..., error: ..., message: ... }`
- Codes HTTP appropriés : 200, 201, 400, 401, 404, 500
- CORS activé pour le frontend
- Validation des entrées côté serveur

### Style Python

- PEP 8 strict
- Docstrings pour les méthodes publiques
- Type hints pour les fonctions
- Utiliser `sudo()` avec précaution, documenter pourquoi

### ⚠️ ALERTE : Modifications structurelles Odoo

**IMPORTANT : Avant toute modification du schéma de base de données ou de l'API Odoo, TOUJOURS alerter l'utilisateur et demander confirmation.**

Modifications nécessitant une alerte :
- Ajout/modification/suppression de champs dans les modèles Odoo (`models/`)
- Modification du schéma de base de données (ajout de tables, colonnes, relations)
- Changement des endpoints API REST existants (URL, paramètres, réponses)
- Modification des droits d'accès (`security/`)
- Ajout de nouveaux modèles Odoo
- Modifications du `__manifest__.py` (dépendances, version)

Procédure :
1. Identifier la modification nécessaire
2. **Alerter l'utilisateur avec AskUserQuestion** en expliquant :
   - Quelle modification est nécessaire
   - Pourquoi elle est nécessaire
   - Quel sera l'impact (migration de données, API breaking change, etc.)
3. Attendre la confirmation avant de procéder
4. Si approuvé, documenter la modification dans `LOGME.md`

---

## Conventions CSS / Tailwind

- Tailwind CSS uniquement, pas de CSS custom sauf cas exceptionnel
- Utiliser les classes utilitaires, éviter `@apply` excessif
- Responsive : mobile-first (`sm:`, `md:`, `lg:`)
- Dark mode via `dark:` si implémenté
- Composants UI réutilisables dans `src/components/common/`

---

## Conventions API

### Endpoints standard

```
GET    /api/v1/{resource}           → Liste paginée
GET    /api/v1/{resource}/{id}      → Détail
POST   /api/v1/{resource}           → Création
PUT    /api/v1/{resource}/{id}      → Modification
DELETE /api/v1/{resource}/{id}      → Suppression
```

### Pagination

```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0
  }
}
```

### Gestion d'erreurs

```json
{
  "error": "validation_error",
  "message": "Description lisible",
  "details": {}
}
```

---

## Tests

### Frontend (Jest + Playwright)

- Tests unitaires : `__tests__/` à côté des fichiers
- Tests E2E : `tests/` à la racine de frontend
- Nommer les tests : `*.test.ts` ou `*.spec.ts`
- Tester les comportements utilisateur, pas l'implémentation

### Commandes

```bash
npm run test          # Jest
npm run test:e2e      # Playwright
```

---

## Git

### Branches

- `main` : production
- `develop` : développement (si workflow Git Flow)
- `feature/xxx` : nouvelles fonctionnalités
- `fix/xxx` : corrections

### Commits

Format : `type: description courte`

Types : `feat`, `fix`, `refactor`, `style`, `test`, `docs`, `chore`

Exemples :
- `feat: add product filtering by category`
- `fix: cart total calculation with discounts`

---

## Sécurité

- Ne jamais committer de secrets (`.env`, clés API)
- Valider toutes les entrées utilisateur (Zod côté frontend, validation Odoo côté backend)
- Utiliser HTTPS en production
- CSRF protection sur les endpoints sensibles
- Sanitizer les données avant affichage (XSS)

---

## Performance

### Frontend

- Utiliser `next/image` pour les images (optimisation automatique)
- Lazy loading des composants lourds (`dynamic()`)
- Préférer Server Components pour le SEO et la performance
- Minimiser les re-renders (mémorisation si nécessaire)

### API

- Pagination obligatoire sur les listes
- Limiter les champs retournés (`fields` parameter si possible)
- Cache HTTP quand approprié

---

## Commandes de développement

```bash
# Backend Odoo
cd backend && docker-compose up -d
cd backend && ./reset.sh          # Reset complet

# Frontend
cd frontend && npm run dev

# Backoffice
cd backoffice && npm run dev

# Tests
cd frontend && npm run test
cd frontend && npm run test:e2e
```

---

## ❌ Anti-patterns et erreurs à éviter

### TypeScript / React

**Ne JAMAIS :**
- Utiliser `any` au lieu de typer correctement
- Utiliser `as any` pour contourner les erreurs TypeScript
- Créer des composants avec plus de 300 lignes (refactoriser en sous-composants)
- Faire du prop drilling sur plus de 2 niveaux (utiliser un store ou context)
- Utiliser `useEffect` sans tableau de dépendances ou avec un tableau vide sans raison
- Muter directement le state (`array.push()` → utiliser spread operator)
- Oublier les `key` props dans les listes
- Utiliser `index` comme `key` si l'ordre peut changer
- Importer tout lodash (`import _ from 'lodash'` → `import debounce from 'lodash/debounce'`)
- Créer des styles inline complexes (utiliser Tailwind)
- Utiliser `dangerouslySetInnerHTML` sans sanitization

### Next.js spécifique

**Ne JAMAIS :**
- Utiliser `'use client'` par défaut (Server Components d'abord)
- Faire des appels API dans les Server Components sans gestion d'erreur
- Oublier le cache revalidation (`revalidate`, `cache: 'no-store'`)
- Utiliser `<img>` au lieu de `<Image>` de next/image
- Exposer des secrets dans les composants client (utiliser env variables côté serveur)
- Créer des routes API pour des données qui peuvent être fetched en SSR

### Backend Odoo

**Ne JAMAIS :**
- Modifier directement la base de données sans passer par l'ORM Odoo
- Utiliser `sudo()` sans documenter pourquoi et vérifier les droits
- Créer des endpoints sans validation des paramètres
- Retourner des erreurs Python brutes (toujours formater en JSON)
- Faire des requêtes SQL directes (`cr.execute`) sauf cas exceptionnels documentés
- Modifier les modèles standard Odoo sans héritage
- Oublier les règles de sécurité (`security/ir.model.access.csv`)
- Créer des boucles de recherche dans des boucles (N+1 queries)
- Utiliser `search()` sans limite sur de grandes tables

### API / Intégration

**Ne JAMAIS :**
- Oublier la pagination sur les listes (limite obligatoire)
- Retourner des mots de passe ou tokens dans les réponses API
- Utiliser des IDs séquentiels prévisibles pour les ressources sensibles
- Accepter des données non validées (Zod frontend + validation Odoo backend)
- Créer des endpoints qui peuvent être appelés sans authentification (sauf public)
- Modifier une API existante sans versioning (`/api/v1/` → `/api/v2/`)
- Oublier les codes HTTP appropriés (pas tout en 200)

### Git / Workflow

**Ne JAMAIS :**
- Committer directement sur `main` (passer par des branches)
- Committer des fichiers `.env`, secrets, ou clés API
- Committer `node_modules/`, `.next/`, ou dossiers build
- Faire des commits avec message vague ("fix", "update", "WIP")
- Mélanger plusieurs fonctionnalités dans un même commit
- Push `--force` sur main/master
- Ignorer les hooks de pre-commit (linter, formatter)

### Performance

**Ne JAMAIS :**
- Charger toutes les données d'une table sans pagination
- Faire des appels API dans des boucles (batching)
- Oublier la compression des images (utiliser next/image)
- Charger des librairies lourdes sans lazy loading
- Créer des re-renders inutiles (mémorisation avec `useMemo`, `useCallback` si nécessaire)
- Utiliser `console.log` en production (utiliser un logger)

### Sécurité

**Ne JAMAIS :**
- Stocker des mots de passe en clair (hashage obligatoire)
- Faire confiance aux données côté client (toujours valider côté serveur)
- Oublier CORS sur les endpoints API
- Exposer des stack traces en production
- Utiliser `eval()` ou `Function()` avec des données utilisateur
- Désactiver CSP (Content Security Policy) sans raison

---

## Règles pour Claude

1. **Au début de chaque nouvelle session, lire obligatoirement les fichiers `README.md` et `LOGME.md`** pour comprendre le contexte du projet, son architecture et l'historique récent des étapes réalisées
2. Toujours lire le code existant avant de modifier
3. Respecter les patterns déjà en place dans le projet
4. Préférer les modifications minimales et ciblées
5. Ne pas sur-ingénier : simple > complexe
6. Valider avec les tests existants après modification
7. Si une dépendance est nécessaire, vérifier qu'elle n'existe pas déjà
8. **⚠️ CRITIQUE : TOUJOURS alerter l'utilisateur avec AskUserQuestion avant toute modification du schéma de base de données Odoo, des modèles, ou des endpoints API** (voir section "ALERTE : Modifications structurelles Odoo")
