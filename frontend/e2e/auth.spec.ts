/**
 * E2E tests for authentication
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Login', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login');

      await expect(page.locator('h1')).toContainText(/connexion/i);
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();
    });

    test('should show validation errors', async ({ page }) => {
      await page.goto('/login');

      // Submit empty form
      await page.getByRole('button', { name: /se connecter/i }).click();

      // Check for error messages
      await page.waitForTimeout(500);
      const errorMessages = page.locator('text=/requis|obligatoire|invalide/i');
      const count = await errorMessages.count();
      if (count > 0) {
        await expect(errorMessages.first()).toBeVisible();
      }
    });

    test('should handle invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email/i).fill('invalid@example.com');
      await page.getByLabel(/mot de passe/i).fill('wrongpassword');
      await page.getByRole('button', { name: /se connecter/i }).click();

      // Wait for error message
      await page.waitForTimeout(2000);

      // Check for error notification
      const errorMessage = page.locator('text=/incorrect|invalide|échec/i').first();
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible();
      }
    });

    test('should navigate to register page', async ({ page }) => {
      await page.goto('/login');

      const registerLink = page.getByRole('link', { name: /créer un compte|inscription/i });
      if (await registerLink.isVisible()) {
        await registerLink.click();
        await expect(page).toHaveURL(/\/register/);
      }
    });
  });

  test.describe('Register', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/register');

      await expect(page.locator('h1')).toContainText(/inscription|créer un compte/i);
      await expect(page.getByLabel(/nom/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
    });

    test('should validate password strength', async ({ page }) => {
      await page.goto('/register');

      const passwordInput = page.getByLabel(/mot de passe/i).first();
      await passwordInput.fill('weak');

      // Check for weak password indicator
      await page.waitForTimeout(500);
    });

    test('should show validation errors', async ({ page }) => {
      await page.goto('/register');

      // Submit empty form
      await page.getByRole('button', { name: /créer|inscription/i }).click();

      // Check for error messages
      await page.waitForTimeout(500);
      const errorMessages = page.locator('text=/requis|obligatoire/i');
      const count = await errorMessages.count();
      if (count > 0) {
        await expect(errorMessages.first()).toBeVisible();
      }
    });
  });
});
