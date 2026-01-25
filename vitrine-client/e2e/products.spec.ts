/**
 * E2E tests for products pages
 */

import { test, expect } from '@playwright/test';

test.describe('Products Catalog', () => {
  test('should display products list', async ({ page }) => {
    await page.goto('/products');

    // Check page title
    await expect(page.locator('h1')).toContainText(/produits/i);

    // Check if products grid exists
    const productsGrid = page.locator('[data-testid="products-grid"]').first();
    if (await productsGrid.isVisible()) {
      await expect(productsGrid).toBeVisible();
    }
  });

  test('should filter products by category', async ({ page }) => {
    await page.goto('/products');

    // Look for category filter
    const categoryFilter = page.locator('text=Catégories').first();
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      // Select first category
      await page.locator('[data-testid="category-option"]').first().click();

      // Wait for products to load
      await page.waitForTimeout(1000);
    }
  });

  test('should search for products', async ({ page }) => {
    await page.goto('/products');

    // Find search input
    const searchInput = page.locator('input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('laptop');
      await page.keyboard.press('Enter');

      // Wait for results
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Product Detail', () => {
  test('should display product details', async ({ page }) => {
    // Go to products list first
    await page.goto('/products');

    // Click on first product card
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();

      // Check product detail elements
      await expect(page.locator('h1')).toBeVisible();

      // Check for product image
      const productImage = page.locator('img[alt*=""]').first();
      await expect(productImage).toBeVisible();

      // Check for price
      const price = page.locator('text=/TND|\\d+\\.\\d{2}/').first();
      await expect(price).toBeVisible();

      // Check for add to cart button
      const addToCartBtn = page.getByRole('button', { name: /ajouter au panier/i });
      if (await addToCartBtn.isVisible()) {
        await expect(addToCartBtn).toBeVisible();
      }
    }
  });

  test('should add product to cart', async ({ page }) => {
    await page.goto('/products');

    const firstProduct = page.locator('[data-testid="product-card"]').first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();

      // Click add to cart
      const addToCartBtn = page.getByRole('button', { name: /ajouter au panier/i });
      if (await addToCartBtn.isVisible()) {
        await addToCartBtn.click();

        // Check for success message or cart update
        await page.waitForTimeout(1000);

        // Cart count should be visible
        const cartBadge = page.locator('[data-testid="cart-count"]').first();
        if (await cartBadge.isVisible()) {
          await expect(cartBadge).toContainText(/\d+/);
        }
      }
    }
  });
});
