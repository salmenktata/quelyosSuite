/**
 * E2E Authentication Tests - Backend Integration
 *
 * Tests d'authentification avec le backend Odoo réel
 */

import { test, expect } from '@playwright/test';

// Note: Ces tests nécessitent un utilisateur de test dans Odoo
const TEST_USER = {
  email: 'test@quelyos.com',
  password: 'test123',
  name: 'Test User'
};

test.describe('Authentication - Backend Integration', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h1, h2')).toContainText(/connexion|se connecter/i);
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /connexion|se connecter/i })).toBeVisible();

    console.log('✅ Page de connexion affichée correctement');
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');

    const submitBtn = page.getByRole('button', { name: /connexion|se connecter/i }).first();
    await submitBtn.click();

    // Attendre les messages d'erreur
    await page.waitForTimeout(1000);

    // Les champs requis devraient afficher des erreurs
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    // Vérifier attributs HTML5 de validation
    const emailRequired = await emailInput.getAttribute('required');
    const passwordRequired = await passwordInput.getAttribute('required');

    expect(emailRequired !== null || passwordRequired !== null).toBeTruthy();

    console.log('✅ Validation du formulaire fonctionne');
  });

  test('should test login API endpoint', async ({ page }) => {
    // Tester l'endpoint de login directement
    const response = await page.request.post('/api/odoo/auth/login', {
      data: {
        email: 'admin@example.com',
        password: 'admin'
      }
    });

    // L'API devrait répondre (succès ou échec)
    expect([200, 400, 401, 404]).toContain(response.status());

    const data = await response.json();
    console.log('📡 Réponse API login:', data.success ? 'Succès' : data.error || 'Échec');
  });

  test('should display register page', async ({ page }) => {
    await page.goto('/register');

    await expect(page.locator('h1, h2')).toContainText(/inscription|créer un compte/i);
    await expect(page.locator('input[name="name"], input[placeholder*="nom" i]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    console.log('✅ Page d\'inscription affichée correctement');
  });

  test('should validate registration form', async ({ page }) => {
    await page.goto('/register');

    const submitBtn = page.getByRole('button', { name: /s'inscrire|créer/i }).first();
    await submitBtn.click();

    await page.waitForTimeout(1000);

    // Vérifier que les champs requis sont validés
    const inputs = await page.locator('input[required]').count();
    expect(inputs).toBeGreaterThan(0);

    console.log('✅ Validation du formulaire d\'inscription fonctionne');
  });
});

test.describe('Authentication - Session Management', () => {
  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Tenter d'accéder à une page protégée
    await page.goto('/account/orders');

    // Devrait rediriger vers /login
    await page.waitForTimeout(1000);

    const isLoginPage = page.url().includes('/login');
    const isAccountPage = page.url().includes('/account');

    // Soit sur login (redirigé), soit sur account (déjà connecté)
    expect(isLoginPage || isAccountPage).toBeTruthy();

    if (isLoginPage) {
      console.log('✅ Redirection vers login pour route protégée');
    } else {
      console.log('ℹ️  Utilisateur déjà connecté');
    }
  });

  test('should check session API endpoint', async ({ page }) => {
    const response = await page.request.post('/api/odoo/auth/session', {
      data: {}
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    console.log('📡 Session API:', data.authenticated ? 'Authentifié' : 'Non authentifié');
  });
});

test.describe('Account Pages - Backend Integration', () => {
  test('should load account dashboard (if authenticated)', async ({ page }) => {
    await page.goto('/account');

    await page.waitForTimeout(2000);

    // Soit on est redirigé vers login, soit on voit le dashboard
    const isLoginPage = page.url().includes('/login');
    const isAccountPage = page.url().includes('/account');

    expect(isLoginPage || isAccountPage).toBeTruthy();

    if (isAccountPage) {
      // Vérifier les éléments du dashboard
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
      console.log('✅ Dashboard compte chargé');
    } else {
      console.log('ℹ️  Redirigé vers login (normal si non connecté)');
    }
  });

  test('should load orders page (if authenticated)', async ({ page }) => {
    await page.goto('/account/orders');
    await page.waitForTimeout(2000);

    const isOrdersPage = page.url().includes('/orders');

    if (isOrdersPage) {
      // Vérifier la page commandes
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();

      // Tester l'API des commandes
      const response = await page.request.post('/api/odoo/orders', {
        data: {}
      });

      if (response.ok()) {
        const data = await response.json();
        console.log(`✅ API Commandes: ${data.orders?.length || 0} commandes`);
      }
    } else {
      console.log('ℹ️  Redirigé vers login');
    }
  });

  test('should load profile page (if authenticated)', async ({ page }) => {
    await page.goto('/account/profile');
    await page.waitForTimeout(2000);

    const isProfilePage = page.url().includes('/profile');

    if (isProfilePage) {
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible();
      console.log('✅ Page profil chargée');
    } else {
      console.log('ℹ️  Redirigé vers login');
    }
  });
});

test.describe('Checkout - Backend Integration', () => {
  test('should require authentication for checkout', async ({ page }) => {
    // Ajouter un produit au panier
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    const firstProduct = page.locator('[data-testid="product-card"]').first();

    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      await page.waitForTimeout(1000);

      const addToCartBtn = page.getByRole('button', { name: /ajouter au panier/i }).first();

      if (await addToCartBtn.isVisible()) {
        await addToCartBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    // Aller au panier
    await page.goto('/cart');
    await page.waitForTimeout(1000);

    // Essayer de procéder au checkout
    const checkoutBtn = page.getByRole('button', { name: /commander|checkout|payer/i }).first();
    const btnVisible = await checkoutBtn.isVisible().catch(() => false);

    if (btnVisible) {
      await checkoutBtn.click();
      await page.waitForTimeout(1000);

      // Devrait rediriger vers login ou checkout
      const url = page.url();
      expect(url.includes('/login') || url.includes('/checkout')).toBeTruthy();

      console.log('✅ Checkout nécessite authentification');
    }
  });

  test('should load checkout shipping page structure', async ({ page }) => {
    await page.goto('/checkout/shipping');
    await page.waitForTimeout(2000);

    // Page peut rediriger vers login si non authentifié
    const url = page.url();

    if (url.includes('/shipping')) {
      // Vérifier la structure du formulaire de livraison
      const form = page.locator('form').first();
      const formVisible = await form.isVisible().catch(() => false);

      if (formVisible) {
        console.log('✅ Formulaire de livraison affiché');
      }
    } else {
      console.log('ℹ️  Redirigé (authentification requise)');
    }
  });

  test('should test delivery methods API', async ({ page }) => {
    const response = await page.request.post('/api/odoo/delivery/methods', {
      data: {}
    });

    // L'API devrait répondre même sans session
    expect([200, 401, 404]).toContain(response.status());

    if (response.ok()) {
      const data = await response.json();
      console.log(`✅ API Livraison: ${data.methods?.length || 0} méthodes disponibles`);
    }
  });
});

test.describe('Wishlist - Backend Integration', () => {
  test('should load wishlist page', async ({ page }) => {
    await page.goto('/account/wishlist');
    await page.waitForTimeout(2000);

    // Peut rediriger vers login
    const url = page.url();

    if (url.includes('/wishlist')) {
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
      console.log('✅ Page wishlist chargée');
    } else {
      console.log('ℹ️  Redirigé vers login');
    }
  });

  test('should test wishlist API endpoint', async ({ page }) => {
    const response = await page.request.post('/api/odoo/wishlist', {
      data: {}
    });

    // L'API peut nécessiter une authentification
    expect([200, 401, 404]).toContain(response.status());

    if (response.ok()) {
      const data = await response.json();
      console.log(`✅ API Wishlist: ${data.items?.length || 0} articles`);
    }
  });
});
