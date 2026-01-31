import { test, expect } from '@playwright/test'

/**
 * Tests E2E : Vérification système éditions
 * - Filtrage modules par édition
 * - Branding dynamique (couleur, titre, favicon)
 * - Navigation limitée aux modules autorisés
 */

test.describe('Éditions Quelyos - Filtrage Modules', () => {
  test.describe('Finance Edition', () => {
    test.beforeEach(async ({ page }) => {
      // Démarrer app avec édition Finance
      await page.goto('http://localhost:3010')
      // Attendre chargement
      await page.waitForLoadState('networkidle')
    })

    test('devrait afficher uniquement le module Finance dans le menu', async ({ page }) => {
      // TODO: Adapter sélecteurs selon structure réelle du menu
      const menu = page.locator('[data-testid="sidebar-menu"]')

      // Vérifier module Finance présent
      await expect(menu.locator('text=Finance')).toBeVisible()

      // Vérifier autres modules absents
      await expect(menu.locator('text=Store')).not.toBeVisible()
      await expect(menu.locator('text=POS')).not.toBeVisible()
      await expect(menu.locator('text=CRM')).not.toBeVisible()
    })

    test('devrait appliquer branding Finance (vert émeraude)', async ({ page }) => {
      // Vérifier titre
      await expect(page).toHaveTitle(/Quelyos Finance/)

      // Vérifier CSS variable couleur primaire
      const primaryColor = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
      )
      expect(primaryColor).toBe('#059669')
    })

    test('devrait bloquer navigation vers module non-autorisé', async ({ page }) => {
      // Tenter d'accéder à /store (non autorisé)
      await page.goto('http://localhost:3010/store/products')

      // Devrait rediriger vers home ou afficher erreur
      await expect(page).toHaveURL(/\/(home|login|error)/)
    })
  })

  test.describe('Store Edition', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3011')
      await page.waitForLoadState('networkidle')
    })

    test('devrait afficher modules Store + Marketing uniquement', async ({ page }) => {
      const menu = page.locator('[data-testid="sidebar-menu"]')

      // Modules autorisés
      await expect(menu.locator('text=Store')).toBeVisible()
      await expect(menu.locator('text=Marketing')).toBeVisible()

      // Modules interdits
      await expect(menu.locator('text=Finance')).not.toBeVisible()
      await expect(menu.locator('text=POS')).not.toBeVisible()
    })

    test('devrait appliquer branding Store (violet)', async ({ page }) => {
      await expect(page).toHaveTitle(/Quelyos Store/)

      const primaryColor = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
      )
      expect(primaryColor).toBe('#7C3AED')
    })

    test('devrait permettre navigation Store → Marketing', async ({ page }) => {
      // Cliquer sur menu Marketing
      await page.click('text=Marketing')
      await page.waitForLoadState('networkidle')

      // Vérifier navigation réussie
      await expect(page).toHaveURL(/\/marketing/)
    })

    test('devrait bloquer navigation vers Finance', async ({ page }) => {
      await page.goto('http://localhost:3011/finance/dashboard')
      await expect(page).toHaveURL(/\/(home|login|error)/)
    })
  })

  test.describe('Retail Edition', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3014')
      await page.waitForLoadState('networkidle')
    })

    test('devrait afficher modules POS + Store + Stock', async ({ page }) => {
      const menu = page.locator('[data-testid="sidebar-menu"]')

      await expect(menu.locator('text=POS')).toBeVisible()
      await expect(menu.locator('text=Store')).toBeVisible()
      await expect(menu.locator('text=Stock')).toBeVisible()

      await expect(menu.locator('text=Finance')).not.toBeVisible()
      await expect(menu.locator('text=CRM')).not.toBeVisible()
    })

    test('devrait appliquer branding Retail (rouge)', async ({ page }) => {
      await expect(page).toHaveTitle(/Quelyos Retail/)

      const primaryColor = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
      )
      expect(primaryColor).toBe('#DC2626')
    })
  })

  test.describe('Sales Edition', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3013')
      await page.waitForLoadState('networkidle')
    })

    test('devrait afficher modules CRM + Marketing', async ({ page }) => {
      const menu = page.locator('[data-testid="sidebar-menu"]')

      await expect(menu.locator('text=CRM')).toBeVisible()
      await expect(menu.locator('text=Marketing')).toBeVisible()

      await expect(menu.locator('text=Finance')).not.toBeVisible()
    })

    test('devrait appliquer branding Sales (bleu)', async ({ page }) => {
      await expect(page).toHaveTitle(/Quelyos Sales/)

      const primaryColor = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
      )
      expect(primaryColor).toBe('#2563EB')
    })
  })

  test.describe('Team Edition', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3015')
      await page.waitForLoadState('networkidle')
    })

    test('devrait afficher uniquement module HR', async ({ page }) => {
      const menu = page.locator('[data-testid="sidebar-menu"]')

      await expect(menu.locator('text=HR')).toBeVisible()

      await expect(menu.locator('text=Finance')).not.toBeVisible()
      await expect(menu.locator('text=Store')).not.toBeVisible()
    })

    test('devrait appliquer branding Team (cyan)', async ({ page }) => {
      await expect(page).toHaveTitle(/Quelyos Team/)

      const primaryColor = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
      )
      expect(primaryColor).toBe('#0891B2')
    })
  })

  test.describe('Support Edition', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:3016')
      await page.waitForLoadState('networkidle')
    })

    test('devrait afficher modules Support + CRM', async ({ page }) => {
      const menu = page.locator('[data-testid="sidebar-menu"]')

      await expect(menu.locator('text=Support')).toBeVisible()
      await expect(menu.locator('text=CRM')).toBeVisible()

      await expect(menu.locator('text=Finance')).not.toBeVisible()
    })

    test('devrait appliquer branding Support (violet foncé)', async ({ page }) => {
      await expect(page).toHaveTitle(/Quelyos Support/)

      const primaryColor = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
      )
      expect(primaryColor).toBe('#9333EA')
    })
  })
})

test.describe('Permissions - Filtrage Édition + Groupes', () => {
  test('Finance User dans édition Finance : accès finance uniquement', async ({ page }) => {
    // Mock login Finance User
    await page.goto('http://localhost:3010/login')
    await page.fill('input[name="username"]', 'finance.user@quelyos.com')
    await page.fill('input[name="password"]', 'test')
    await page.click('button[type="submit"]')

    await page.waitForLoadState('networkidle')

    const menu = page.locator('[data-testid="sidebar-menu"]')
    await expect(menu.locator('text=Finance')).toBeVisible()
    await expect(menu.locator('text=Store')).not.toBeVisible()
  })

  test('Super-admin dans édition Finance : limité à Finance malgré super-admin', async ({ page }) => {
    // Mock login Super Admin
    await page.goto('http://localhost:3010/login')
    await page.fill('input[name="username"]', 'admin@quelyos.com')
    await page.fill('input[name="password"]', 'admin')
    await page.click('button[type="submit"]')

    await page.waitForLoadState('networkidle')

    const menu = page.locator('[data-testid="sidebar-menu"]')

    // Super-admin voit finance (whitelisté)
    await expect(menu.locator('text=Finance')).toBeVisible()

    // Mais pas store (non whitelisté dans édition finance)
    await expect(menu.locator('text=Store')).not.toBeVisible()
  })
})
