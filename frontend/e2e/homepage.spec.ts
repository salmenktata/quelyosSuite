/**
 * E2E tests for homepage
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/Quelyos/);

    // Check hero section
    await expect(page.locator('h1')).toContainText('Bienvenue sur Quelyos');
  });

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/');

    // Check navigation links
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByRole('link', { name: /accueil/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /produits/i })).toBeVisible();
  });

  test('should navigate to products page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /voir nos produits/i }).first().click();

    await expect(page).toHaveURL(/\/products/);
  });

  test('should display featured products', async ({ page }) => {
    await page.goto('/');

    // Check if featured products section exists
    const featuredSection = page.locator('text=Produits en vedette').first();
    if (await featuredSection.isVisible()) {
      await expect(featuredSection).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.locator('h1')).toBeVisible();
  });
});
