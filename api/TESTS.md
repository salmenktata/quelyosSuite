# Tests automatisés (API)

Ce dossier contient des tests e2e rapides (auth, catégories, comptes, transactions, budgets).

## Pré-requis
- Base PostgreSQL dédiée aux tests (ne jamais cibler la prod).
- Variable `TEST_DATABASE_URL` (prioritaire) ou `DATABASE_URL` pointant sur cette base.
- `JWT_SECRET` optionnelle pour les tests (fallback en valeur de test).

### Provisionner rapidement la base de test (Docker)
```bash
cd api
# Démarre un Postgres dédié sur le port 5442 et applique les migrations Prisma
./scripts/setup-test-db.sh
```

## Lancer les tests
```bash
cd api
pnpm install
TEST_DATABASE_URL="postgresql://user:pass@host:5432/db_test" pnpm test
```

Remarques importantes :
- Les tests tronquent les tables `Transaction`, `Account`, `Category`, `Budget`, `Budgets`, `User`, `Company` avant/après pour rester déterministes.
- Un garde-fou empêche l’exécution si l’URL semble pointer vers une base de prod.
- Le serveur n’ouvre pas de port quand `NODE_ENV=test` (Supertest utilise l’app Express exportée).
