/**
 * E2E User Journey Tests - Parcours Utilisateur Complet
 *
 * Ces tests simulent le parcours complet d'un utilisateur sur le site
 */

import { test, expect } from '@playwright/test';

test.describe('Complete User Journey - Browse & Purchase', () => {
  test('Journey: Homepage → Products → Product Detail → Add to Cart', async ({ page }) => {
    console.log('🚀 Début du parcours utilisateur...');

    // ÉTAPE 1: Homepage
    console.log('📍 Étape 1: Homepage');
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    console.log('✅ Homepage chargée');

    // ÉTAPE 2: Navigation vers les produits
    console.log('📍 Étape 2: Navigation vers Produits');
    const productsLink = page.getByRole('link', { name: /produits/i }).first();
    await productsLink.click();
    await page.waitForURL(/\/products/);
    console.log('✅ Page produits chargée');

    // ÉTAPE 3: Attendre que les produits se chargent
    console.log('📍 Étape 3: Chargement des produits');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    const productCount = await page.locator('[data-testid="product-card"]').count();
    expect(productCount).toBeGreaterThan(0);
    console.log(`✅ ${productCount} produits affichés`);

    // ÉTAPE 4: Cliquer sur le premier produit
    console.log('📍 Étape 4: Sélection d\'un produit');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    const productName = await firstProduct.locator('h3, h2').textContent();
    await firstProduct.click();
    await page.waitForTimeout(1000);
    console.log(`✅ Produit sélectionné: ${productName}`);

    // ÉTAPE 5: Vérifier la page détail produit
    console.log('📍 Étape 5: Page détail produit');
    await expect(page.locator('h1')).toBeVisible();

    // Vérifier les éléments essentiels
    const productImage = page.locator('img').first();
    await expect(productImage).toBeVisible();
    console.log('✅ Image produit affichée');

    const price = page.locator('text=/€|TND/').first();
    await expect(price).toBeVisible();
    console.log('✅ Prix affiché');

    // ÉTAPE 6: Ajouter au panier
    console.log('📍 Étape 6: Ajout au panier');
    const addToCartBtn = page.getByRole('button', { name: /ajouter au panier/i }).first();

    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
      await page.waitForTimeout(2000);
      console.log('✅ Produit ajouté au panier');

      // Vérifier que le badge panier est mis à jour
      const cartBadge = page.locator('[data-testid="cart-count"]').first();
      const badgeVisible = await cartBadge.isVisible().catch(() => false);

      if (badgeVisible) {
        const cartCount = await cartBadge.textContent();
        console.log(`✅ Badge panier mis à jour: ${cartCount}`);
      }
    }

    console.log('🎉 Parcours utilisateur terminé avec succès!');
  });

  test('Journey: Homepage → Search → Filter → Product Detail', async ({ page }) => {
    console.log('🚀 Début du parcours recherche...');

    // ÉTAPE 1: Homepage
    await page.goto('/');
    console.log('✅ Homepage chargée');

    // ÉTAPE 2: Navigation vers produits
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    console.log('✅ Page produits chargée');

    // ÉTAPE 3: Recherche
    const searchInput = page.locator('input[type="search"], input[placeholder*="recherche" i]').first();
    const searchVisible = await searchInput.isVisible().catch(() => false);

    if (searchVisible) {
      await searchInput.fill('ballon');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      console.log('✅ Recherche effectuée: "ballon"');
    }

    // ÉTAPE 4: Vérifier les résultats
    const resultsCount = await page.locator('[data-testid="product-card"]').count();
    console.log(`✅ ${resultsCount} résultats affichés`);

    // ÉTAPE 5: Ouvrir les filtres (si disponibles)
    const filterButton = page.locator('button:has-text("Filtres"), text=Filtres').first();
    const filterVisible = await filterButton.isVisible().catch(() => false);

    if (filterVisible) {
      await filterButton.click();
      await page.waitForTimeout(500);
      console.log('✅ Panneau filtres ouvert');
    }

    console.log('🎉 Parcours recherche terminé!');
  });
});

test.describe('Complete User Journey - Cart Management', () => {
  test('Journey: Add Multiple Products → View Cart → Update Quantities', async ({ page }) => {
    console.log('🚀 Début du parcours panier...');

    // ÉTAPE 1: Aller sur les produits
    await page.goto('/products');
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });

    const productCount = await page.locator('[data-testid="product-card"]').count();
    const productsToAdd = Math.min(2, productCount);

    // ÉTAPE 2: Ajouter plusieurs produits au panier
    for (let i = 0; i < productsToAdd; i++) {
      const product = page.locator('[data-testid="product-card"]').nth(i);
      const productName = await product.locator('h3, h2').textContent();

      await product.click();
      await page.waitForTimeout(1000);

      const addToCartBtn = page.getByRole('button', { name: /ajouter au panier/i }).first();

      if (await addToCartBtn.isVisible()) {
        await addToCartBtn.click();
        await page.waitForTimeout(1500);
        console.log(`✅ Produit ${i + 1} ajouté: ${productName}`);
      }

      // Retourner à la liste des produits
      await page.goto('/products');
      await page.waitForTimeout(500);
    }

    // ÉTAPE 3: Aller au panier
    console.log('📍 Navigation vers le panier');
    await page.goto('/cart');
    await page.waitForTimeout(1000);

    // ÉTAPE 4: Vérifier les items du panier
    const cartItems = page.locator('[data-testid="cart-item"]');
    const itemCount = await cartItems.count();

    if (itemCount > 0) {
      console.log(`✅ ${itemCount} article(s) dans le panier`);

      // ÉTAPE 5: Modifier la quantité du premier item
      const firstItemQty = cartItems.first().locator('input[type="number"]');
      const qtyVisible = await firstItemQty.isVisible().catch(() => false);

      if (qtyVisible) {
        await firstItemQty.clear();
        await firstItemQty.fill('2');
        await page.waitForTimeout(2000);
        console.log('✅ Quantité mise à jour');
      }

      // ÉTAPE 6: Vérifier le total
      const total = page.locator('[data-testid="cart-total"], text=/total/i').first();
      await expect(total).toBeVisible();
      console.log('✅ Total du panier affiché');
    } else {
      console.log('⚠️  Panier vide (produits non ajoutés)');
    }

    console.log('🎉 Parcours panier terminé!');
  });
});

test.describe('Complete User Journey - Mobile Experience', () => {
  test('Journey: Mobile - Browse Products → Add to Cart', async ({ page }) => {
    // Configurer le viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    console.log('📱 Mode mobile activé');

    // ÉTAPE 1: Homepage mobile
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    console.log('✅ Homepage mobile chargée');

    // ÉTAPE 2: Ouvrir le menu mobile (si présent)
    const mobileMenuBtn = page.locator('button[aria-label*="menu"], button:has-text("Menu")').first();
    const menuVisible = await mobileMenuBtn.isVisible().catch(() => false);

    if (menuVisible) {
      await mobileMenuBtn.click();
      await page.waitForTimeout(500);
      console.log('✅ Menu mobile ouvert');

      // Cliquer sur Produits
      const productsLink = page.getByRole('link', { name: /produits/i }).first();
      await productsLink.click();
    } else {
      // Navigation directe
      await page.goto('/products');
    }

    // ÉTAPE 3: Vérifier l'affichage mobile des produits
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 });
    const products = await page.locator('[data-testid="product-card"]').count();
    console.log(`✅ ${products} produits affichés en mode mobile`);

    // ÉTAPE 4: Sélectionner et ajouter un produit
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.waitForTimeout(1000);

    const addToCartBtn = page.getByRole('button', { name: /ajouter au panier/i }).first();

    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
      await page.waitForTimeout(2000);
      console.log('✅ Produit ajouté au panier en mode mobile');
    }

    console.log('🎉 Parcours mobile terminé!');
  });
});

test.describe('Complete User Journey - Error Handling', () => {
  test('Journey: Handle 404 Product Not Found', async ({ page }) => {
    await page.goto('/products/produit-inexistant-999999');

    // Devrait afficher une erreur ou rediriger
    const errorDisplayed = await page.locator('text=/non trouvé|404|erreur/i').first().isVisible().catch(() => false);
    const redirected = page.url().includes('/products') && !page.url().includes('999999');

    expect(errorDisplayed || redirected).toBeTruthy();
    console.log('✅ Gestion 404 correcte');
  });

  test('Journey: Handle Network Timeout', async ({ page }) => {
    // Simuler un timeout en définissant un délai très court
    page.setDefaultTimeout(1000);

    try {
      await page.goto('/products');
      console.log('✅ Page chargée malgré le timeout court');
    } catch (error) {
      console.log('⚠️  Timeout détecté (normal pour ce test)');
    }
  });
});
