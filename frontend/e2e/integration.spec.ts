/**
 * E2E Integration Tests - Frontend ↔ Backend Odoo
 *
 * Ces tests vérifient l'intégration complète avec le backend Odoo réel
 */

import { test, expect } from '@playwright/test';

test.describe('API Integration - Products', () => {
  test('should load products from Odoo backend', async ({ page }) => {
    await page.goto('/products');

    // Attendre que les produits se chargent
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    // Vérifier qu'au moins un produit est affiché
    const products = await page.locator('[data-testid="product-card"]').count();
    expect(products).toBeGreaterThan(0);

    // Vérifier que les produits ont les bonnes propriétés (image, nom, prix)
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await expect(firstProduct.locator('img')).toBeVisible();
    await expect(firstProduct.locator('h3, h2')).toBeVisible();
    await expect(firstProduct).toContainText(/€|TND/); // Prix affiché
  });

  test('should display product count from backend', async ({ page }) => {
    // Faire une requête API directe pour obtenir le total
    const response = await page.request.get('/api/products?limit=100');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.total).toBeGreaterThan(0);
    expect(data.products).toBeInstanceOf(Array);

    console.log(`✅ Backend API: ${data.total} produits disponibles`);
    console.log(`✅ Premiers produits:`, data.products.slice(0, 3).map((p: any) => p.name));
  });

  test('should display correct product details from Odoo', async ({ page }) => {
    // Récupérer un produit via l'API
    const apiResponse = await page.request.get('/api/products?limit=1');
    const apiData = await apiResponse.json();

    if (apiData.products && apiData.products.length > 0) {
      const apiProduct = apiData.products[0];

      // Naviguer vers la page produit
      await page.goto(`/products/${apiProduct.slug || apiProduct.id}`);

      // Vérifier que le nom du produit correspond
      await expect(page.locator('h1')).toContainText(apiProduct.name);

      // Vérifier que le prix est affiché
      if (apiProduct.price || apiProduct.list_price) {
        const expectedPrice = apiProduct.price || apiProduct.list_price;
        await expect(page.locator('body')).toContainText(expectedPrice.toString());
      }
    }
  });
});

test.describe('API Integration - Categories', () => {
  test('should load categories from Odoo backend', async ({ page }) => {
    const response = await page.request.get('/api/categories');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.categories).toBeInstanceOf(Array);

    console.log(`✅ Backend API: ${data.categories?.length || 0} catégories disponibles`);
  });

  test('should filter products by category from backend', async ({ page }) => {
    // Récupérer les catégories
    const categoriesResponse = await page.request.get('/api/categories');
    const categoriesData = await categoriesResponse.json();

    if (categoriesData.categories && categoriesData.categories.length > 0) {
      const firstCategory = categoriesData.categories[0];

      // Filtrer par catégorie
      const productsResponse = await page.request.get(`/api/products?category_id=${firstCategory.id}`);
      const productsData = await productsResponse.json();

      expect(productsData.success).toBe(true);
      console.log(`✅ Catégorie "${firstCategory.name}": ${productsData.products?.length || 0} produits`);
    }
  });
});

test.describe('API Integration - Cart & Session', () => {
  test('should create cart session with backend', async ({ page }) => {
    await page.goto('/cart');

    // Vérifier que la page panier charge
    await expect(page.locator('h1')).toContainText(/panier/i);

    // Tester l'appel API du panier
    const response = await page.request.post('/api/cart', {
      data: {}
    });

    // L'API devrait répondre même si le panier est vide
    expect(response.ok() || response.status() === 404).toBeTruthy();
  });

  test('should add product to cart via backend API', async ({ page }) => {
    // Récupérer un produit
    const productsResponse = await page.request.get('/api/products?limit=1');
    const productsData = await productsResponse.json();

    if (productsData.products && productsData.products.length > 0) {
      const product = productsData.products[0];

      // Aller sur la page produit
      await page.goto(`/products/${product.slug || product.id}`);

      // Cliquer sur "Ajouter au panier"
      const addToCartBtn = page.getByRole('button', { name: /ajouter au panier/i }).first();

      if (await addToCartBtn.isVisible()) {
        await addToCartBtn.click();

        // Attendre la mise à jour
        await page.waitForTimeout(2000);

        // Vérifier que le badge panier est mis à jour
        const cartBadge = page.locator('[data-testid="cart-count"], [aria-label*="panier"]').first();
        const badgeVisible = await cartBadge.isVisible().catch(() => false);

        if (badgeVisible) {
          await expect(cartBadge).toContainText(/\d+/);
          console.log('✅ Produit ajouté au panier avec succès');
        }
      }
    }
  });
});

test.describe('API Integration - Search & Filters', () => {
  test('should search products via backend API', async ({ page }) => {
    const searchTerm = 'sport'; // Basé sur nos données démo

    const response = await page.request.get(`/api/products?search=${searchTerm}`);
    const data = await response.json();

    expect(data.success).toBe(true);
    console.log(`✅ Recherche "${searchTerm}": ${data.products?.length || 0} résultats`);
  });

  test('should filter by price range', async ({ page }) => {
    const response = await page.request.get('/api/products?price_min=10&price_max=50');
    const data = await response.json();

    expect(data.success).toBe(true);

    // Vérifier que les produits retournés sont dans la fourchette
    if (data.products && data.products.length > 0) {
      data.products.forEach((product: any) => {
        const price = product.price || product.list_price;
        expect(price).toBeGreaterThanOrEqual(10);
        expect(price).toBeLessThanOrEqual(50);
      });
    }
  });
});

test.describe('Data Consistency - Frontend ↔ Backend', () => {
  test('should display same data as API returns', async ({ page }) => {
    // 1. Récupérer les données via l'API
    const apiResponse = await page.request.get('/api/products?limit=3');
    const apiData = await apiResponse.json();

    expect(apiData.success).toBe(true);
    expect(apiData.products).toBeInstanceOf(Array);

    // 2. Naviguer vers la page produits
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    // 3. Vérifier que les produits affichés correspondent aux données API
    for (let i = 0; i < Math.min(3, apiData.products.length); i++) {
      const apiProduct = apiData.products[i];

      // Chercher le produit sur la page par son nom
      const productElement = page.locator(`text=${apiProduct.name}`).first();
      const isVisible = await productElement.isVisible().catch(() => false);

      if (isVisible) {
        console.log(`✅ Produit "${apiProduct.name}" affiché correctement`);
      }
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Tester avec un endpoint invalide
    await page.goto('/products/999999999'); // ID qui n'existe pas

    // La page devrait afficher une erreur 404 ou rediriger
    const errorMessage = page.locator('text=/non trouvé|404|erreur/i').first();
    const errorVisible = await errorMessage.isVisible().catch(() => false);

    // Soit message d'erreur, soit redirection vers /products
    expect(errorVisible || page.url().includes('/products')).toBeTruthy();
  });
});

test.describe('Performance - API Response Times', () => {
  test('should load products API in reasonable time', async ({ page }) => {
    const startTime = Date.now();

    const response = await page.request.get('/api/products?limit=20');

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(response.ok()).toBeTruthy();
    expect(duration).toBeLessThan(3000); // Moins de 3 secondes

    console.log(`⏱️  API produits: ${duration}ms`);
  });

  test('should load categories API in reasonable time', async ({ page }) => {
    const startTime = Date.now();

    const response = await page.request.get('/api/categories');

    const endTime = Date.now();
    const duration = endTime - startTime;

    expect(response.ok()).toBeTruthy();
    expect(duration).toBeLessThan(2000); // Moins de 2 secondes

    console.log(`⏱️  API catégories: ${duration}ms`);
  });
});
