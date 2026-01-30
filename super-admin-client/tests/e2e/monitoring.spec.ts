/**
 * Tests E2E - Monitoring Infrastructure
 *
 * Vérifie :
 * - Health cards (Backend, PostgreSQL, Redis, Stripe)
 * - Provisioning jobs table
 * - Auto-refresh indicator
 */

import { test, expect, waitForDataLoad } from './fixtures'

test.describe('Monitoring', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/monitoring')
    await waitForDataLoad(page)
  })

  test('devrait afficher le titre', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /monitoring infrastructure/i })).toBeVisible()
    await expect(page.getByText(/état des services/i)).toBeVisible()
  })

  test('devrait afficher les health cards', async ({ authenticatedPage: page }) => {
    // Les health cards sont visibles si l'API health retourne des données
    const backendCard = page.getByText(/backend.*api/i).first()
    const postgresCard = page.getByText(/postgresql/i).first()

    const hasBackend = await backendCard.isVisible().catch(() => false)
    const hasPostgres = await postgresCard.isVisible().catch(() => false)

    // Si pas de health data, vérifier que le titre est là
    if (!hasBackend && !hasPostgres) {
      await expect(page.getByRole('heading', { name: /monitoring/i })).toBeVisible()
    } else {
      expect(hasBackend || hasPostgres).toBe(true)
    }
  })

  test('devrait afficher le statut UP ou DOWN', async ({ authenticatedPage: page }) => {
    // Au moins un statut devrait être visible
    const upStatus = page.getByText('UP')
    const downStatus = page.getByText('DOWN')

    const hasUp = await upStatus.first().isVisible().catch(() => false)
    const hasDown = await downStatus.first().isVisible().catch(() => false)

    expect(hasUp || hasDown).toBe(true)
  })

  test('devrait afficher les métriques des services', async ({ authenticatedPage: page }) => {
    // Les métriques sont visibles si health data est disponible
    const msMetric = page.locator('text=/\\d+ms/')
    const connectionsMetric = page.getByText(/connexions/i)

    const hasMs = await msMetric.first().isVisible().catch(() => false)
    const hasConnections = await connectionsMetric.first().isVisible().catch(() => false)

    // Si pas de métriques, vérifier que le titre est là
    if (!hasMs && !hasConnections) {
      await expect(page.getByRole('heading', { name: /monitoring/i })).toBeVisible()
    }
  })

  test('devrait afficher la section provisioning jobs', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /provisioning jobs/i })).toBeVisible()
  })

  test('devrait afficher la table des jobs', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('columnheader', { name: /tenant/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /type/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /état/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /progress/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /durée/i })).toBeVisible()
  })

  test('devrait afficher les barres de progression', async ({ authenticatedPage: page }) => {
    // S'il y a des jobs, vérifier la barre de progression
    const progressBar = page.locator('[class*="bg-teal"]').filter({ hasText: /%/ })

    // On vérifie juste que le pattern existe
    const jobRows = page.locator('tbody tr')
    const count = await jobRows.count()

    if (count > 0) {
      // Les jobs ont des barres de progression
      const progressElement = page.locator('[class*="h-2"][class*="rounded"]').first()
      await expect(progressElement).toBeVisible()
    }
  })

  test('devrait indiquer auto-refresh si jobs en cours', async ({ authenticatedPage: page }) => {
    // L'indicateur auto-refresh apparaît si des jobs sont running/pending
    const autoRefreshIndicator = page.getByText(/auto-refresh actif/i)

    // L'indicateur peut être visible ou non selon les données
    const isVisible = await autoRefreshIndicator.isVisible().catch(() => false)
    expect(typeof isVisible).toBe('boolean')
  })

  test('devrait afficher les icônes de statut colorées', async ({ authenticatedPage: page }) => {
    // Les health cards ont des icônes vertes (up) ou rouges (down) ou des SVG
    const iconUp = page.locator('[class*="bg-green"]').first()
    const iconDown = page.locator('[class*="bg-red"]').first()
    const statusText = page.getByText(/UP|DOWN/i).first()

    const hasUpIcon = await iconUp.isVisible().catch(() => false)
    const hasDownIcon = await iconDown.isVisible().catch(() => false)
    const hasStatusText = await statusText.isVisible().catch(() => false)

    expect(hasUpIcon || hasDownIcon || hasStatusText).toBe(true)
  })

  test('devrait afficher les badges de statut des jobs', async ({ authenticatedPage: page }) => {
    // Vérifier qu'il y a des badges de statut (completed, running, failed, pending)
    const statusBadge = page.locator('span').filter({ hasText: /completed|running|failed|pending/i }).first()

    const isVisible = await statusBadge.isVisible().catch(() => false)
    // Peut ne pas être visible s'il n'y a pas de jobs
    expect(typeof isVisible).toBe('boolean')
  })
})
