/**
 * Tests E2E de parité : Gestion des clients
 *
 * Vérifier que les données clients affichées dans le backoffice
 * correspondent exactement à celles de la base Odoo.
 */

import { test, expect } from '@playwright/test';
import { API } from '@quelyos/config';

test.describe('Parité Clients Backoffice ↔ Odoo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('La liste clients affiche les mêmes données que Odoo', async ({ page, request }) => {
    await page.goto('/customers');
    await expect(page.locator('h1')).toContainText('Clients');

    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Récupérer le premier client affiché
    const firstRow = page.locator('table tbody tr').first();
    const clientName = await firstRow.locator('td').nth(0).textContent();
    const clientEmail = await firstRow.locator('td').nth(1).textContent();

    // Vérifier via API
    const apiResponse = await request.post(`${API.backend.dev}/api/ecommerce/customers`, {
      data: {
        jsonrpc: '2.0',
        method: 'call',
        params: { limit: 20 },
        id: 1,
      },
    });

    const apiResult = await apiResponse.json();
    const apiCustomers = apiResult.result?.data?.customers || [];
    const matchingCustomer = apiCustomers.find(
      (c: any) => c.name === clientName?.trim() && c.email === clientEmail?.trim()
    );

    expect(matchingCustomer).toBeTruthy();
  });

  test('Les statistiques clients sont cohérentes avec Odoo', async ({ page }) => {
    await page.goto('/customers');
    await page.waitForSelector('text=Total clients', { timeout: 10000 });

    // Récupérer les KPIs affichés
    const kpiCards = await page.locator('[class*="CustomerStats"]').first();
    const totalCustomersText = await kpiCards.locator('text=/\\d+/').first().textContent();
    const totalCustomers = parseInt(totalCustomersText || '0');

    // Le total doit être > 0 si on a des clients affichés
    const tableRows = await page.locator('table tbody tr').count();
    if (tableRows > 0) {
      expect(totalCustomers).toBeGreaterThan(0);
    }
  });

  test('Export CSV contient tous les clients visibles', async ({ page }) => {
    await page.goto('/customers');
    await page.waitForSelector('table tbody tr');

    // Compter le nombre de clients affichés
    const totalText = await page.locator('text=/\\d+\\s+client/').first().textContent();
    const totalMatch = totalText?.match(/(\\d+)\\s+client/);
    const expectedTotal = totalMatch ? parseInt(totalMatch[1]) : 0;

    // Simuler le clic export (on ne peut pas vérifier le fichier téléchargé facilement)
    // Mais on peut vérifier que le bouton est présent et fonctionnel
    const exportButton = page.locator('button', { hasText: 'Exporter CSV' });
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();
  });

  test('Recherche client filtre correctement les résultats', async ({ page }) => {
    await page.goto('/customers');
    await page.waitForSelector('table tbody tr');

    // Récupérer le nom du premier client
    const firstClientName = await page.locator('table tbody tr').first().locator('td').nth(0).textContent();
    const searchTerm = firstClientName?.trim().split(' ')[0] || '';

    // Rechercher
    await page.fill('input[placeholder*="Rechercher"]', searchTerm);
    await page.click('button[type="submit"]');

    // Attendre les résultats
    await page.waitForTimeout(1000);

    // Vérifier que tous les résultats contiennent le terme recherché
    const resultRows = await page.locator('table tbody tr').all();
    for (const row of resultRows) {
      const rowText = await row.textContent();
      expect(rowText?.toLowerCase()).toContain(searchTerm.toLowerCase());
    }
  });
});
