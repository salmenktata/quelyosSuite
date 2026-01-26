# Commande /test - Suite de Tests Complète

## Description

Exécute une suite de tests complète pour valider le bon fonctionnement du système tri-couche (Backend Odoo ↔ Backoffice React ↔ Frontend Next.js) avec emphase sur la parité fonctionnelle Odoo.

## Usage

```bash
/test backend              # Tests Pytest API Odoo uniquement
/test frontend             # Tests Playwright E2E frontend uniquement
/test backoffice           # Tests Playwright E2E backoffice uniquement
/test parity               # Tests de parité Odoo ↔ Quelyos uniquement
/test [module]             # Tests d'un module spécifique (ex: products, orders)
/test                      # Suite complète (backend + frontend + backoffice + parity)
```

## Workflow

### 1. Détection du Scope

Analyser le paramètre fourni pour déterminer quels tests exécuter :
- `backend` → Tests Pytest dans `odoo-backend/tests/`
- `frontend` → Tests Playwright dans `frontend/e2e/`
- `backoffice` → Tests Playwright dans `backoffice/e2e/`
- `parity` → Tests de parité spécifiques (`odoo-backend/tests/test_api_parity.py` + `frontend/e2e/parity/`)
- `[module]` (ex: `products`) → Tests filtré par module
- Aucun paramètre → Tous les tests

### 2. Préparation Environnement

**AVANT de lancer les tests :**

#### Backend (Pytest)
- Vérifier que Odoo est démarré : `docker ps | grep odoo`
- Vérifier base de données de test disponible
- Installer dépendances si nécessaire : `cd odoo-backend && pip install -r requirements.txt`

#### Frontend/Backoffice (Playwright)
- Vérifier que serveurs dev tournent (frontend:3000, backoffice:5173)
- Installer dépendances si nécessaire : `npm install`
- Installer navigateurs Playwright si nécessaire : `npx playwright install`

### 3. Exécution Tests par Scope

#### Backend (Pytest)

```bash
cd odoo-backend
pytest tests/ -v --tb=short --maxfail=5
```

**Options importantes :**
- `-v` : Mode verbose (afficher tous les tests)
- `--tb=short` : Traceback court pour lisibilité
- `--maxfail=5` : Arrêter après 5 échecs (éviter flood)
- `--cov=addons/quelyos_api` : Coverage (optionnel)

**Tests attendus :**
- `test_api_products.py` : CRUD produits (≥ 15 tests)
- `test_api_orders.py` : Commandes et workflows (≥ 10 tests)
- `test_api_cart.py` : Panier et sessions (≥ 8 tests)
- `test_api_categories.py` : Catégories produits (≥ 5 tests)
- `test_api_parity.py` : Tests parité Odoo (≥ 20 tests)
- **Total attendu : ≥ 60 tests**

#### Frontend (Playwright E2E)

```bash
cd frontend
npx playwright test e2e/ --reporter=list
```

**Tests attendus :**
- `e2e/catalog.spec.ts` : Navigation catalogue, filtres
- `e2e/product-page.spec.ts` : Fiche produit, variants, add to cart
- `e2e/cart.spec.ts` : Panier, modification quantités, checkout
- `e2e/checkout.spec.ts` : Processus commande complet
- `e2e/parity/` : Tests parité frontend ↔ Odoo (≥ 10 tests)
- **Total attendu : ≥ 25 tests**

#### Backoffice (Playwright E2E)

```bash
cd backoffice
npx playwright test e2e/ --reporter=list
```

**Tests attendus :**
- `e2e/auth.spec.ts` : Connexion, déconnexion
- `e2e/products.spec.ts` : CRUD produits admin
- `e2e/orders.spec.ts` : Gestion commandes
- `e2e/dashboard.spec.ts` : Dashboard métriques
- **Total attendu : ≥ 25 tests**

#### Tests de Parité Uniquement

```bash
# Backend
cd odoo-backend && pytest tests/test_api_parity.py -v

# Frontend
cd frontend && npx playwright test e2e/parity/ --reporter=list
```

### 4. Collecte Résultats et Métriques

Pour chaque scope testé, collecter :

**Métriques globales :**
- ✅ Nombre de tests passés
- ❌ Nombre de tests échoués
- ⏭️ Nombre de tests skipped
- ⏱️ Durée totale exécution
- 📊 Coverage (si activé)

**Détails des échecs :**
- Nom du test échoué
- Fichier et ligne
- Message d'erreur
- Stack trace court

**Régressions détectées :**
- Comparer avec baseline précédente (si disponible)
- Identifier nouveaux échecs vs run précédent

### 5. Analyse des Échecs

**Pour chaque test échoué, classifier :**

**P0 - BLOQUANT (nécessite fix immédiat) :**
- Tests parité échoués (API !== Odoo DB)
- Tests CRUD de base échoués (create, read, update, delete)
- Tests sécurité échoués (auth, validation)
- Tests checkout échoués (processus commande cassé)

**P1 - IMPORTANT (fix avant release) :**
- Tests fonctionnalités avancées échoués (filtres, tri, search)
- Tests UX échoués (navigation, responsive)
- Tests performance échoués (timeouts)

**P2 - MINEUR (fix optionnel) :**
- Tests edge cases échoués
- Tests UI cosmétiques échoués

**Identifier patterns communs :**
- Plusieurs tests échouent pour même raison ? (ex: endpoint API down)
- Échecs liés à un changement récent ? (git diff)
- Échecs environnementaux ? (DB vide, serveur non démarré)

### 6. Génération Rapport Consolidé

**Format Markdown :**

```markdown
# 🧪 Rapport de Tests - [Date]

## 📊 Résultats Globaux

| Scope | Tests | ✅ Passés | ❌ Échoués | ⏭️ Skipped | ⏱️ Durée | 📊 Coverage |
|-------|-------|----------|-----------|-----------|---------|------------|
| Backend | 62 | 60 | 2 | 0 | 45s | 78% |
| Frontend | 28 | 25 | 3 | 0 | 2m 15s | - |
| Backoffice | 27 | 27 | 0 | 0 | 1m 50s | - |
| **TOTAL** | **117** | **112** | **5** | **0** | **4m 50s** | **78%** |

## ❌ Tests Échoués (5)

### P0 - BLOQUANT (2)

#### 1. `test_create_product_creates_in_odoo_db` (backend)
- **Fichier** : `odoo-backend/tests/test_api_parity.py:45`
- **Erreur** : `AssertionError: Product not found in Odoo DB after API creation`
- **Cause probable** : API create ne commit pas en DB ou transaction rollback
- **Action** : Vérifier méthode `create()` dans `controllers/main.py`

#### 2. `test_checkout_completes_order` (frontend)
- **Fichier** : `frontend/e2e/checkout.spec.ts:78`
- **Erreur** : `Timeout waiting for confirmation page`
- **Cause probable** : API order confirm timeout ou erreur réseau
- **Action** : Vérifier endpoint `/api/ecommerce/orders/confirm`

### P1 - IMPORTANT (3)

[...]

## 🔍 Recommandations

### Actions Immédiates (P0)
1. ✅ Fixer `test_create_product_creates_in_odoo_db` (parité API ↔ DB)
2. ✅ Fixer `test_checkout_completes_order` (processus commande)

### Actions Avant Release (P1)
[...]

### Régressions Détectées
- **2 nouveaux échecs** vs run précédent (2026-01-20)
  - `test_filter_by_category` (frontend) - OK avant, échoue maintenant
  - Cause : Changement API `/api/ecommerce/categories` ?

## 📈 Évolution Métriques

- Tests totaux : 117 (+5 vs semaine dernière)
- Taux de succès : 95.7% (-2.3% vs semaine dernière) ⚠️
- Coverage backend : 78% (+3% vs semaine dernière) ✅

## ✅ Validation Release

- [ ] Tous tests P0 passent (2/2 échouent actuellement) ❌
- [ ] Tous tests P1 passent (3/3 échouent actuellement) ❌
- [ ] Coverage backend ≥ 75% (78% ✅)
- [ ] Aucune régression vs baseline (2 régressions détectées ❌)

**🚨 STATUT : NON VALIDÉ POUR RELEASE**
```

### 7. Propositions de Fixes (Optionnel)

**Si patterns communs détectés, proposer fixes automatiques :**

**Exemple : Tous tests échouent avec "Connection refused"**
→ Proposer : `cd odoo-backend && docker-compose up -d`

**Exemple : Tests timeout sur API**
→ Proposer : Augmenter timeout Playwright (`test.setTimeout(60000)`)

**Exemple : Tests parité échouent sur champ manquant**
→ Proposer : `cd odoo-backend && ./upgrade.sh quelyos_api`

### 8. Intégration CI/CD (Bonus)

**Si fichier `.github/workflows/tests.yml` existe, vérifier cohérence avec commande locale.**

**Sinon, proposer création workflow GitHub Actions :**

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run backend tests
        run: cd odoo-backend && pytest tests/ -v

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run frontend tests
        run: cd frontend && npx playwright test
```

## Métriques de Succès

**Cette commande est un succès si :**

1. ✅ Tous les tests du scope demandé sont exécutés
2. ✅ Rapport consolidé généré avec métriques claires
3. ✅ Échecs classifiés par priorité (P0/P1/P2)
4. ✅ Régressions identifiées vs baseline
5. ✅ Recommandations actionnables fournies
6. ✅ Validation release (GO/NO-GO) claire

## Priorités des Tests

**Tests à TOUJOURS exécuter (même si scope partiel) :**

1. **Tests parité** : Garantir API === Odoo DB (criticité absolue)
2. **Tests CRUD** : Create, Read, Update, Delete de base
3. **Tests sécurité** : Auth, validation, permissions

**Tests optionnels (si temps suffisant) :**
- Tests performance (benchmarks)
- Tests UI cosmétiques
- Tests edge cases avancés

## Notes Importantes

- **Ne JAMAIS** committer sur main si tests P0 échouent
- **Toujours** fixer tests P0 avant de continuer développement
- **Documenter** les skips de tests (ajouter commentaire `@pytest.mark.skip(reason="...")`)
- **Mettre à jour** baseline après chaque release (nouveau référentiel)
- **Monitorer** évolution métriques (coverage, taux succès) dans le temps

## Exemples d'Utilisation

```bash
# Avant un commit
/test parity               # Vérifier aucune régression parité

# Avant une PR
/test                      # Suite complète (backend + E2E + parité)

# Debug un module spécifique
/test products             # Tests produits uniquement (backend + E2E)

# CI/CD local
/test backend              # Tests rapides backend (< 1min)
```

## Outputs Attendus

**Afficher à l'utilisateur :**

1. Résumé exécution (tests passés/échoués/skipped)
2. Temps d'exécution total
3. Liste des échecs avec priorités (P0 en premier)
4. Recommandations actions immédiates
5. Statut validation release (GO/NO-GO)
6. Lien vers rapport complet (fichier markdown généré)

**Ne PAS afficher :**
- Stack traces complètes (trop verbeux)
- Logs de tous les tests passés (bruit)
- Détails techniques non actionnables
