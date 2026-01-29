# Protection des données de développement

## Problème identifié

Les tests Jest dans `apps/api/__tests__/*.test.js` utilisent `deleteMany()` dans leurs hooks `afterAll()` pour nettoyer la base de données après chaque suite de tests. 

**DANGER** : Si les tests sont lancés sans `NODE_ENV=test`, ils vident la base de données de développement, supprimant ainsi l'utilisateur demo et toutes les données.

## Solution mise en place

### 1. Script de seed permanent (`apps/api/prisma/seed.js`)

Un script de seed complet existe déjà et crée :
- Company "Quelyos Demo"
- Utilisateur `demo@quelyos.test` / `changeme` (ADMIN)
- CompanySettings avec devise TND
- 2 catégories (Marketing EXPENSE, Ventes INCOME)
- 1 compte bancaire (50 000 TND)
- 1 budget Marketing
- 3 transactions de démonstration

### 2. Protection des tests (`apps/api/__tests__/setup.js`)

Un fichier de setup global a été créé qui :
- **Bloque** l'exécution des tests si `NODE_ENV !== 'test'`
- **Vérifie** que `TEST_DATABASE_URL` est défini
- **Configure** automatiquement les variables d'environnement de test

Ce fichier est chargé automatiquement par Jest via `setupFilesAfterEnv` dans `jest.config.js`.

### 3. Configuration Jest mise à jour

```javascript
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  verbose: true,
  setupFilesAfterEnv: ["./__tests__/setup.js"], // ← Nouveau
};
```

## Usage

### Restaurer les données demo

Si les données demo ont été supprimées, exécutez :

```bash
cd api
pnpm seed
```

Ou via Prisma directement :

```bash
cd api
pnpm exec prisma db seed
```

### Lancer les tests en toute sécurité

Les tests vérifient maintenant automatiquement l'environnement :

```bash
cd api
pnpm test  # ✅ Utilise NODE_ENV=test automatiquement via package.json
```

Si vous lancez Jest manuellement :

```bash
cd api
NODE_ENV=test jest  # ✅ OK, base de test
jest                # ❌ ERREUR, bloqué par setup.js
```

### Variables d'environnement requises

Dans `apps/api/.env` (développement) :
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/quelyos_dev"
JWT_SECRET="your-dev-secret"
```

Dans `apps/api/.env.test` (tests) :
```env
TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/quelyos_test"
JWT_SECRET_TEST="test-secret-key"
NODE_ENV=test
```

## Credentials demo

- **Email** : `demo@quelyos.test`
- **Mot de passe** : `changeme`
- **Rôle** : ADMIN
- **Company** : Quelyos Demo

## Vérification rapide

Pour vérifier que l'utilisateur demo existe :

```bash
cd apps/api
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findUnique({ where: { email: 'demo@quelyos.test' } })
  .then(u => console.log(u ? '✅ Demo user existe' : '❌ Demo user manquant'))
  .finally(() => prisma.\$disconnect());
"
```

## Bonnes pratiques

1. **Toujours** lancer les tests via `pnpm test` (qui définit `NODE_ENV=test`)
2. **Ne jamais** lancer `jest` directement sans `NODE_ENV=test`
3. **Toujours** utiliser une base de données séparée pour les tests (`quelyos_test`)
4. **Re-seeder** après avoir lancé les tests si nécessaire

## Prochaines améliorations possibles

- [ ] Ajouter un script `pnpm db:reset` qui drop + migrate + seed
- [ ] Créer des fixtures de test pour éviter de toucher à la base dev
- [ ] Utiliser des transactions Prisma dans les tests (rollback automatique)
- [ ] Ajouter un hook Git pre-push qui vérifie NODE_ENV avant les tests
