# Tests E2E Backoffice - Parité Frontend ↔ Backend ↔ Odoo

## 🎯 Objectif

Ces tests E2E vérifient que le backoffice React affiche **exactement** les mêmes données que celles retournées par l'API backend, qui elle-même reflète la base Odoo.

## 📋 Prérequis

1. **Stack complète en cours d'exécution** :
   ```bash
   # Terminal 1 : Odoo
   cd backend && docker-compose up

   # Terminal 2 : Backoffice
   cd backoffice && npm run dev
   ```

2. **Playwright installé** :
   ```bash
   cd backoffice
   npm install
   npx playwright install
   ```

## 🚀 Lancer les tests

### Tous les tests E2E
```bash
cd backoffice
npx playwright test
```

### Tests de parité uniquement
```bash
npx playwright test parity
```

### Tests spécifiques
```bash
# Stock uniquement
npx playwright test parity-stock

# Clients uniquement
npx playwright test parity-customers
```

### Mode interactif (debug)
```bash
npx playwright test --ui
```

### Voir le rapport
```bash
npx playwright show-report
```

## 📊 Tests implémentés

### `parity-stock.spec.ts`
- ✅ Page stock affiche mêmes quantités que Odoo DB
- ✅ Modification stock dans UI met à jour Odoo DB
- ✅ Alertes stock bas correspondent aux seuils Odoo
- ✅ Cohérence stock disponible / virtuel / entrant / sortant

### `parity-customers.spec.ts`
- ✅ Liste clients UI === API === Odoo
- ✅ Statistiques clients (KPIs) cohérentes
- ✅ Export CSV contient tous les clients
- ✅ Recherche filtre correctement

## 🔧 Configuration

`playwright.config.ts` :
- Base URL : `http://localhost:5173` (Vite backoffice)
- Workers : 1 (séquentiel pour éviter conflits DB)
- Timeout : 30s par test
- Retry : 2 en CI, 0 en local

## 📝 Ajouter de nouveaux tests

1. Créer `e2e/parity-<module>.spec.ts`
2. Structure type :

```typescript
import { test, expect } from '@playwright/test';

test.describe('Parité <Module> Backoffice ↔ Odoo', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
  });

  test('La page affiche les données Odoo', async ({ page, request }) => {
    // 1. Naviguer vers page
    await page.goto('/your-page');

    // 2. Récupérer données affichées UI
    const uiData = await page.locator('...').textContent();

    // 3. Vérifier via API backend
    const apiResponse = await request.post('http://localhost:8069/api/...');
    const apiData = await apiResponse.json();

    // 4. Comparer
    expect(uiData).toBe(apiData);
  });
});
```

## ⚠️ Important

- **Ne pas** exécuter en parallèle (workers: 1)
- Les tests modifient la DB Odoo (avec cleanup)
- Utiliser données de test, pas production
- Timeout adapté pour appels API lents

## 📈 Résultats attendus

```
Running 6 tests using 1 worker

  parity-stock.spec.ts:10:3 › La page stock affiche les mêmes quantités que Odoo DB
    ✓ [chromium] › parity-stock.spec.ts:10:3 (5s)

  parity-stock.spec.ts:35:3 › Modifier le stock dans le backoffice met à jour Odoo DB
    ✓ [chromium] › parity-stock.spec.ts:35:3 (8s)

  parity-stock.spec.ts:60:3 › Les alertes stock bas correspondent aux seuils Odoo
    ✓ [chromium] › parity-stock.spec.ts:60:3 (4s)

  parity-customers.spec.ts:10:3 › La liste clients affiche les mêmes données que Odoo
    ✓ [chromium] › parity-customers.spec.ts:10:3 (6s)

  parity-customers.spec.ts:40:3 › Les statistiques clients sont cohérentes avec Odoo
    ✓ [chromium] › parity-customers.spec.ts:40:3 (3s)

  parity-customers.spec.ts:55:3 › Recherche client filtre correctement les résultats
    ✓ [chromium] › parity-customers.spec.ts:55:3 (7s)

  6 passed (33s)
```

## 🐛 Debugging

Si un test échoue :
1. Screenshots dans `playwright-report/`
2. Vidéos dans `test-results/`
3. Mode debug : `npx playwright test --debug parity-stock`
4. Inspecter avec : `npx playwright codegen http://localhost:5173`
