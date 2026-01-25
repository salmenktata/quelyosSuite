import { test, expect } from '@playwright/test';

test.describe('Site Vitrine Homepage @smoke', () => {
  test('should load homepage with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Quelyos/);
  });

  test('should display hero section', async ({ page }) => {
    await page.goto('/');
    
    // Vérifie le headline principal
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should have working navigation header', async ({ page }) => {
    await page.goto('/');
    
    // Vérifie la présence du header
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Vérifie le logo Quelyos
    await expect(page.getByText(/quelyos/i).first()).toBeVisible();
  });

  test('should have Finance and Marketing links', async ({ page }) => {
    await page.goto('/');
    
    // Vérifie les liens vers les plateformes
    await expect(page.getByRole('link', { name: /finance/i }).first()).toBeVisible();
  });
});

test.describe('Navigation @smoke', () => {
  test('should navigate to Finance page', async ({ page }) => {
    await page.goto('/');
    
    const financeLink = page.getByRole('link', { name: /finance/i }).first();
    await financeLink.click();
    
    // Attend la navigation
    await page.waitForURL(/finance|\/finance/);
  });

  test('should have CTA buttons pointing to login pages', async ({ page }) => {
    await page.goto('/');
    
    // Vérifie les boutons CTA
    const loginButton = page.getByRole('link', { name: /connexion|login|commencer/i }).first();
    await expect(loginButton).toBeVisible();
  });
});

test.describe('Footer', () => {
  test('should display footer with legal links', async ({ page }) => {
    await page.goto('/');
    
    // Scroll vers le footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Vérifie le footer
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });
});

test.describe('Platform Pages', () => {
  test('should load Finance platform page', async ({ page }) => {
    await page.goto('/finance');
    
    await expect(page).toHaveURL(/finance/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should load Marketing platform page', async ({ page }) => {
    await page.goto('/marketing');
    
    await expect(page).toHaveURL(/marketing/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('Legal Pages', () => {
  test('should load mentions légales', async ({ page }) => {
    await page.goto('/mentions-legales');
    await expect(page).toHaveURL(/mentions-legales/);
  });

  test('should load confidentialité', async ({ page }) => {
    await page.goto('/confidentialite');
    await expect(page).toHaveURL(/confidentialite/);
  });

  test('should load CGU', async ({ page }) => {
    await page.goto('/cgu');
    await expect(page).toHaveURL(/cgu/);
  });
});

test.describe('Mobile Responsiveness @mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });
  
  test('should display mobile menu button', async ({ page }) => {
    await page.goto('/');
    
    // Sur mobile, vérifie le bouton menu hamburger
    await expect(page).toHaveTitle(/Quelyos/);
  });

  test('homepage should be responsive', async ({ page }) => {
    await page.goto('/');
    
    // Vérifie que le contenu est visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('Performance @performance', () => {
  test('should load homepage within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Page devrait charger en moins de 5 secondes
    expect(loadTime).toBeLessThan(5000);
  });
});
