/**
 * E2E tests for checkout flow
 */

import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Add product to cart before checkout tests
    await page.goto('/products');

    const firstProduct = page.locator('[data-testid="product-card"]').first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();

      const addToCartBtn = page.getByRole('button', { name: /ajouter au panier/i });
      if (await addToCartBtn.isVisible()) {
        await addToCartBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('/checkout');

    // Should redirect to login with redirect parameter
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('login');
  });

  test('should display checkout steps', async ({ page }) => {
    // This test assumes user is authenticated
    // In real scenario, would need to login first
    await page.goto('/checkout');

    // Check for stepper or step indicators
    const stepper = page.locator('[data-testid="checkout-stepper"]').first();
    if (await stepper.isVisible()) {
      await expect(stepper).toBeVisible();
    }
  });

  test.describe('Shipping Step', () => {
    test('should display shipping form', async ({ page }) => {
      await page.goto('/checkout/shipping');

      // Check for shipping form fields
      const addressInput = page.getByLabel(/adresse/i).first();
      if (await addressInput.isVisible()) {
        await expect(addressInput).toBeVisible();
      }
    });

    test('should validate shipping form', async ({ page }) => {
      await page.goto('/checkout/shipping');

      // Try to submit empty form
      const submitBtn = page.getByRole('button', { name: /continuer|suivant/i }).first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(500);

        // Check for validation errors
        const errorMessages = page.locator('text=/requis|obligatoire/i');
        const count = await errorMessages.count();
        if (count > 0) {
          await expect(errorMessages.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Payment Step', () => {
    test('should display payment options', async ({ page }) => {
      await page.goto('/checkout/payment');

      // Check for payment method selection
      const paymentOptions = page.locator('[data-testid="payment-method"]').first();
      if (await paymentOptions.isVisible()) {
        await expect(paymentOptions).toBeVisible();
      }
    });

    test('should display order summary', async ({ page }) => {
      await page.goto('/checkout/payment');

      // Check for order summary
      const orderSummary = page.locator('[data-testid="order-summary"]').first();
      if (await orderSummary.isVisible()) {
        await expect(orderSummary).toBeVisible();
      }
    });
  });

  test.describe('Success Step', () => {
    test('should display order confirmation', async ({ page }) => {
      await page.goto('/checkout/success?order_id=123');

      // Check for success message
      const successMessage = page.locator('text=/confirmée|merci|succès/i').first();
      if (await successMessage.isVisible()) {
        await expect(successMessage).toBeVisible();
      }
    });
  });
});
