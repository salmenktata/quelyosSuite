/**
 * Tests E2E de parité : Gestion du stock
 *
 * Vérifier que les modifications de stock dans le backoffice
 * sont synchronisées avec la base de données Odoo.
 */

import { test, expect } from '@playwright/test';
import { API } from '@quelyos/config';

test.describe('Parité Stock Backoffice ↔ Odoo', () => {
  test.beforeEach(async ({ page }) => {
    // Login admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('La page stock affiche les mêmes quantités que Odoo DB', async ({ page, request }) => {
    // 1. Aller sur la page stock
    await page.goto('/stock');
    await expect(page.locator('h1')).toContainText('Gestion du Stock');

    // 2. Attendre le chargement des données
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // 3. Récupérer les quantités affichées dans le tableau
    const firstProductRow = page.locator('table tbody tr').first();
    const displayedQty = await firstProductRow.locator('td').nth(3).textContent();
    const qtyMatch = displayedQty?.match(/(\d+)\s*unités/);

    expect(qtyMatch).toBeTruthy();
    const uiQty = parseInt(qtyMatch![1]);

    // 4. Vérifier via API backend que la quantité correspond
    const productLink = await firstProductRow.locator('a').first();
    const productName = await productLink.textContent();

    const apiResponse = await request.post(`${API.backend.dev}/api/ecommerce/stock/products`, {
      data: {
        jsonrpc: '2.0',
        method: 'call',
        params: { limit: 20 },
        id: 1,
      },
    });

    const apiResult = await apiResponse.json();
    const apiProducts = apiResult.result?.data?.products || [];
    const matchingProduct = apiProducts.find((p: any) => p.name === productName?.trim());

    expect(matchingProduct).toBeTruthy();
    expect(matchingProduct.qty_available).toBe(uiQty);
  });

  test('Modifier le stock dans le backoffice met à jour Odoo DB', async ({ page, request }) => {
    await page.goto('/stock');
    await page.waitForSelector('table tbody tr');

    // 1. Cliquer sur le bouton éditer du premier produit
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.locator('button[title="Modifier le stock"]').click();

    // 2. Modifier la quantité
    const input = firstRow.locator('input[type="number"]');
    const newQty = Math.floor(Math.random() * 100) + 50; // 50-149
    await input.fill(newQty.toString());

    // 3. Sauvegarder
    await firstRow.locator('button[title="Sauvegarder"]').click();

    // 4. Attendre la confirmation (toast)
    await expect(page.locator('text=Stock mis à jour avec succès')).toBeVisible({ timeout: 5000 });

    // 5. Recharger la page et vérifier que la nouvelle quantité est affichée
    await page.reload();
    await page.waitForSelector('table tbody tr');

    const updatedRow = page.locator('table tbody tr').first();
    const updatedQtyText = await updatedRow.locator('td').nth(3).textContent();
    const updatedQtyMatch = updatedQtyText?.match(/(\d+)\s*unités/);

    expect(updatedQtyMatch).toBeTruthy();
    expect(parseInt(updatedQtyMatch![1])).toBe(newQty);
  });

  test('Les alertes stock bas correspondent aux seuils Odoo', async ({ page }) => {
    await page.goto('/stock');

    // Aller sur l'onglet Alertes
    await page.click('text=Alertes Stock Bas');
    await page.waitForSelector('table', { timeout: 5000 });

    // Vérifier que les produits affichés ont bien un stock < seuil
    const alertRows = await page.locator('table tbody tr').all();

    for (const row of alertRows.slice(0, 3)) {
      const stockBadge = await row.locator('td').nth(3).textContent();
      const thresholdText = await row.locator('td').nth(4).textContent();

      const stockMatch = stockBadge?.match(/(\d+)\s*unités/);
      const thresholdMatch = thresholdText?.match(/(\d+)\s*unités/);

      if (stockMatch && thresholdMatch) {
        const currentStock = parseInt(stockMatch[1]);
        const threshold = parseInt(thresholdMatch[1]);

        // Le stock actuel doit être inférieur au seuil
        expect(currentStock).toBeLessThan(threshold);
      }
    }
  });
});
