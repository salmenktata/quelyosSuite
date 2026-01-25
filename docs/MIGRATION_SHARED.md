# Guide de migration vers shared/

Ce guide explique comment migrer progressivement les imports existants vers les packages partagés `@quelyos/*`.

## ✅ Phase 1 : Installation des dépendances alignées (FAIT)

Les versions ont été alignées dans les deux `package.json` :

```bash
cd backoffice
npm install  # Installe React 19.2.3, React Query 5.90.20, Tailwind 4

cd ../frontend
npm install  # Déjà à jour
```

## 🔄 Phase 2 : Migration progressive des imports

### 2.1 Migrer le logger

**Fichiers à modifier dans `frontend/src/` :**
- Remplacer `import { logger } from '@/lib/logger'` par `import { logger } from '@quelyos/logger'`
- Supprimer `frontend/src/lib/logger.ts` une fois tous les imports migrés

**Fichiers à modifier dans `backoffice/src/` :**
- Remplacer `import { logger } from '@/lib/logger'` par `import { logger } from '@quelyos/logger'`
- Supprimer `backoffice/src/lib/logger.ts` une fois tous les imports migrés

**Commande de recherche :**
```bash
# Frontend
grep -r "from '@/lib/logger'" frontend/src/

# Backoffice
grep -r "from './logger'" backoffice/src/
grep -r "from '@/lib/logger'" backoffice/src/
```

---

### 2.2 Migrer les types

**Fichiers à modifier dans `frontend/src/` :**
- Remplacer `import type { Product, Order, ... } from '@/types'`
- Par `import type { Product, Order, ... } from '@quelyos/types'`
- Supprimer `frontend/src/types/index.ts` une fois tous les imports migrés

**Fichiers à modifier dans `backoffice/src/` :**
- Remplacer `import type { Product, Order, ... } from '@/types'`
- Par `import type { Product, Order, ... } from '@quelyos/types'`
- Supprimer `backoffice/src/types/index.ts` une fois tous les imports migrés

**Commande de recherche :**
```bash
# Frontend
grep -r "from '@/types'" frontend/src/

# Backoffice
grep -r "from '@/types'" backoffice/src/
grep -r "from './types'" backoffice/src/
```

**⚠️ Attention** : Vérifier les types custom qui n'existent que dans un seul projet (à garder localement).

---

### 2.3 Migrer l'API client

#### Frontend

**Fichiers à modifier :**
- Remplacer `import { odooClient } from '@/lib/odoo/client'`
- Par `import { odooClient } from '@quelyos/api-client'`
- Supprimer `frontend/src/lib/odoo/client.ts` une fois terminé

**Commande de recherche :**
```bash
grep -r "from '@/lib/odoo/client'" frontend/src/
```

#### Backoffice

**Fichiers à modifier :**
- Remplacer les appels directs à `odooRpc()` par des méthodes `odooClient.*`
- Exemple : `odooRpc('/api/ecommerce/pricelists')` → `odooClient.getPricelists()`

**Avant :**
```typescript
import { odooRpc } from '@/lib/odoo-rpc';

const response = await odooRpc<{ pricelists: Pricelist[] }>(
  '/api/ecommerce/pricelists'
);
```

**Après :**
```typescript
import { odooClient } from '@quelyos/api-client';

const response = await odooClient.getPricelists();
```

**Commande de recherche :**
```bash
grep -r "from '@/lib/odoo-rpc'" backoffice/src/
```

---

## 📋 Checklist de migration

### Logger
- [ ] Frontend : Migrer tous les imports `@/lib/logger` → `@quelyos/logger`
- [ ] Backoffice : Migrer tous les imports vers `@quelyos/logger`
- [ ] Frontend : Supprimer `src/lib/logger.ts`
- [ ] Backoffice : Supprimer `src/lib/logger.ts`
- [ ] Tester : `npm run build` dans les deux apps

### Types
- [ ] Frontend : Migrer tous les imports `@/types` → `@quelyos/types`
- [ ] Backoffice : Migrer tous les imports vers `@quelyos/types`
- [ ] Identifier types custom locaux (garder dans apps)
- [ ] Frontend : Supprimer `src/types/index.ts`
- [ ] Backoffice : Supprimer `src/types/index.ts`
- [ ] Tester : `npm run build` dans les deux apps

### API Client
- [ ] Frontend : Migrer imports `@/lib/odoo/client` → `@quelyos/api-client`
- [ ] Backoffice : Remplacer `odooRpc()` par méthodes `odooClient.*`
- [ ] Ajouter méthodes manquantes dans `shared/api-client/src/index.ts` si besoin
- [ ] Frontend : Supprimer `src/lib/odoo/client.ts`
- [ ] Backoffice : Supprimer `src/lib/odoo-rpc.ts`
- [ ] Tester : Vérifier auth, produits, panier dans les deux apps

---

## 🧪 Tests de validation

Après chaque phase de migration, tester :

```bash
# Frontend
cd frontend
npm run build      # Doit compiler sans erreur
npm run lint       # Doit passer sans erreur
npm run dev        # Tester manuellement pages principales

# Backoffice
cd backoffice
npm run build      # Doit compiler sans erreur
npm run dev        # Tester login + pages principales
```

---

## ❓ FAQ

**Q: Dois-je tout migrer en une fois ?**
R: Non, la migration peut être progressive. Les imports `@/lib/*` et `@quelyos/*` peuvent coexister temporairement.

**Q: Que faire si un type n'existe que dans un seul projet ?**
R: Le garder dans `src/types/` local (par ex. types UI spécifiques à l'app).

**Q: Comment ajouter une méthode API manquante ?**
R: Éditer `shared/api-client/src/index.ts` et ajouter la méthode dans `OdooClient`.

**Q: Les builds sont-ils plus lents ?**
R: Non, TypeScript compile les fichiers `.ts` de shared/ de la même façon que s'ils étaient dans `src/`.

**Q: Peut-on utiliser hot reload avec shared/ ?**
R: Oui, les changements dans `shared/*` déclenchent un hot reload automatique (Next.js + Vite).

---

## 🎯 Résultat attendu

Après migration complète :

```
frontend/src/
├── app/          # Pages Next.js
├── components/   # Composants UI
├── hooks/        # Hooks React custom
├── store/        # Zustand stores
└── [PLUS de lib/logger.ts, lib/odoo/client.ts, types/index.ts]

backoffice/src/
├── pages/        # Pages React
├── components/   # Composants UI
├── hooks/        # React Query hooks
└── [PLUS de lib/logger.ts, lib/odoo-rpc.ts, types/index.ts]

shared/
├── logger/       # Logger partagé ✓
├── types/        # Types partagés ✓
└── api-client/   # API client partagé ✓
```

**Gain** : -50% duplication code métier, versions alignées, 0 régression.
