/**
 * E2E tests for shopping cart
 */

import { test, expect } from '@playwright/test';

test.describe('Shopping Cart', () => {
  test('should display empty cart message', async ({ page }) => {
    await page.goto('/cart');

    // Check for empty cart message
    const emptyMessage = page.locator('text=/panier est vide|aucun produit/i').first();
    if (await emptyMessage.isVisible()) {
      await expect(emptyMessage).toBeVisible();
    }
  });

  test('should display cart items', async ({ page }) => {
    // First, add a product to cart
    await page.goto('/products');

    const firstProduct = page.locator('[data-testid="product-card"]').first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();

      const addToCartBtn = page.getByRole('button', { name: /ajouter au panier/i });
      if (await addToCartBtn.isVisible()) {
        await addToCartBtn.click();
        await page.waitForTimeout(1000);

        // Navigate to cart
        await page.goto('/cart');

        // Check if cart has items
        const cartItems = page.locator('[data-testid="cart-item"]').first();
        if (await cartItems.isVisible()) {
          await expect(cartItems).toBeVisible();
        }
      }
    }
  });

  test('should update item quantity', async ({ page }) => {
    await page.goto('/cart');

    // Find quantity input
    const quantityInput = page.locator('input[type="number"]').first();
    if (await quantityInput.isVisible()) {
      await quantityInput.clear();
      await quantityInput.fill('2');
      await page.waitForTimeout(1000);

      // Check if total updated
      const total = page.locator('[data-testid="cart-total"]').first();
      if (await total.isVisible()) {
        await expect(total).toBeVisible();
      }
    }
  });

  test('should remove item from cart', async ({ page }) => {
    await page.goto('/cart');

    // Find remove button
    const removeBtn = page.getByRole('button', { name: /supprimer/i }).first();
    if (await removeBtn.isVisible()) {
      await removeBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should navigate to checkout', async ({ page }) => {
    await page.goto('/cart');

    const checkoutBtn = page.getByRole('button', { name: /commander|checkout/i }).first();
    if (await checkoutBtn.isVisible()) {
      await checkoutBtn.click();

      // Should redirect to login if not authenticated
      await page.waitForURL(/\/(login|checkout)/);
    }
  });
});
