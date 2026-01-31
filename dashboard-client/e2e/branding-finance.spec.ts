import { test, expect } from '@playwright/test'

/**
 * Tests E2E : Vérification Branding Finance
 * - Couleur primaire #059669
 * - Titre "Quelyos Finance"
 * - Seul module Finance visible
 */

test.describe('Finance Edition - Branding', () => {
  test.beforeEach(async ({ page }) => {
    // Naviguer vers Finance (port 3010)
    await page.goto('http://localhost:3010')
    await page.waitForLoadState('networkidle')
  })

  test('devrait afficher le titre "Quelyos Finance"', async ({ page }) => {
    await expect(page).toHaveTitle(/Quelyos Finance/)
  })

  test('devrait appliquer la couleur primaire #059669 (vert émeraude)', async ({ page }) => {
    const primaryColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary')
        .trim()
    )
    expect(primaryColor).toBe('#059669')
  })

  test('devrait afficher uniquement le module Finance dans le menu', async ({ page }) => {
    // Attendre que le menu soit chargé
    await page.waitForSelector('[data-testid="sidebar-menu"], nav, aside', { 
      state: 'visible',
      timeout: 5000 
    })

    const pageContent = await page.content()

    // Module Finance doit être présent
    expect(pageContent).toContain('Finance')

    // Autres modules ne doivent PAS être présents
    const forbiddenModules = ['Store', 'Marketing', 'POS', 'CRM', 'Stock', 'RH']
    for (const module of forbiddenModules) {
      // Vérifier que le module n'est pas dans le menu (peut être dans d'autres textes)
      const menuText = await page.locator('nav, aside, [role="navigation"]').textContent()
      if (menuText?.includes(module)) {
        throw new Error(`Module interdit "${module}" trouvé dans le menu Finance`)
      }
    }
  })

  test('devrait bloquer navigation vers module non-autorisé (Store)', async ({ page }) => {
    // Tenter d'accéder directement à /store
    await page.goto('http://localhost:3010/store/products')
    await page.waitForLoadState('networkidle')

    // Devrait être redirigé (home, login, ou error)
    const url = page.url()
    expect(
      url.includes('/home') || 
      url.includes('/login') || 
      url.includes('/error') ||
      url.includes('localhost:3010') && !url.includes('/store')
    ).toBeTruthy()
  })

  test('devrait avoir le favicon correct', async ({ page }) => {
    const faviconHref = await page.locator('link[rel="icon"]').getAttribute('href')
    expect(faviconHref).toContain('favicon.svg')
  })
})
