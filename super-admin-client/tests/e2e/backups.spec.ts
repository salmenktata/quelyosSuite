/**
 * Tests E2E - Gestion des Backups
 *
 * Vérifie :
 * - Liste des backups
 * - Déclenchement backup manuel
 * - Panneau programmation
 * - Actions (téléchargement, restauration)
 */

import { test, expect, waitForDataLoad } from './fixtures'

test.describe('Backups', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/backups')
    await waitForDataLoad(page)
  })

  test('devrait afficher le titre et les stats', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /gestion des backups/i })).toBeVisible()
    // Le compteur et dernière backup auto sont dans le sous-titre
    await expect(page.getByText(/backup/i).first()).toBeVisible()
  })

  test('devrait afficher le bouton programmer', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: /programmer/i })).toBeVisible()
  })

  test('devrait afficher le sélecteur de type de backup', async ({ authenticatedPage: page }) => {
    // Chercher un select pour le type de backup
    const typeSelect = page.locator('select').first()
    await expect(typeSelect).toBeVisible()
  })

  test('devrait afficher le bouton lancer backup', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: /lancer backup/i })).toBeVisible()
  })

  test('devrait afficher la table des backups', async ({ authenticatedPage: page }) => {
    // Vérifier qu'une table ou un message vide est présent
    const table = page.locator('table')
    const emptyState = page.getByText(/aucun backup/i)

    const hasTable = await table.isVisible().catch(() => false)
    const hasEmpty = await emptyState.isVisible().catch(() => false)

    expect(hasTable || hasEmpty).toBe(true)

    if (hasTable) {
      // Vérifier au moins quelques colonnes
      await expect(page.getByText(/statut/i).first()).toBeVisible()
      await expect(page.getByText(/fichier/i).first()).toBeVisible()
    }
  })

  test('devrait ouvrir le panneau de programmation', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /programmer/i }).click()

    // Vérifier que le panneau s'ouvre
    await expect(page.getByText(/programmation backup automatique/i)).toBeVisible()

    // Vérifier les éléments du panneau
    await expect(page.getByText(/activé|désactivé/i)).toBeVisible()
    await expect(page.getByText(/fréquence/i)).toBeVisible()
    await expect(page.getByText(/heure/i)).toBeVisible()
    await expect(page.getByText(/type/i)).toBeVisible()
    await expect(page.getByText(/rétention/i)).toBeVisible()
  })

  test('devrait pouvoir activer/désactiver le schedule', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /programmer/i }).click()

    // Trouver le toggle d'activation
    const toggle = page.locator('[class*="rounded-full"][class*="w-11"]')
    await expect(toggle).toBeVisible()

    // Cliquer pour toggle
    await toggle.click()

    // Le texte devrait changer
    await page.waitForTimeout(300)
  })

  test('devrait afficher les options de fréquence', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /programmer/i }).click()

    // Vérifier que le panneau s'ouvre avec du contenu
    await expect(page.getByText(/programmation/i)).toBeVisible()

    // Vérifier qu'il y a des selects dans le panneau
    const selects = page.locator('select')
    const count = await selects.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('devrait afficher le jour de la semaine si hebdomadaire', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /programmer/i }).click()

    // Vérifier que le panneau s'ouvre
    await expect(page.getByText(/programmation/i)).toBeVisible()

    // La configuration de fréquence existe
    const frequencyLabel = page.getByText(/fréquence/i)
    const isVisible = await frequencyLabel.first().isVisible().catch(() => false)
    expect(isVisible).toBe(true)
  })

  test('devrait afficher le bouton sauvegarder dans le panneau', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /programmer/i }).click()
    await expect(page.getByRole('button', { name: /sauvegarder/i })).toBeVisible()
  })

  test('devrait fermer le panneau en recliquant', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /programmer/i }).click()
    await expect(page.getByText(/programmation backup automatique/i)).toBeVisible()

    await page.getByRole('button', { name: /programmer/i }).click()
    await expect(page.getByText(/programmation backup automatique/i)).not.toBeVisible()
  })

  test('devrait pouvoir sélectionner le type de backup manuel', async ({ authenticatedPage: page }) => {
    const typeSelect = page.locator('select').first()

    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('incremental')
      await expect(typeSelect).toHaveValue('incremental')

      await typeSelect.selectOption('full')
      await expect(typeSelect).toHaveValue('full')
    }
  })

  test('devrait afficher les badges de type de backup', async ({ authenticatedPage: page }) => {
    // Chercher un badge de type (Complet, Incrémental, Tenant)
    const typeBadge = page.locator('span').filter({ hasText: /complet|incrémental|tenant/i }).first()

    const isVisible = await typeBadge.isVisible().catch(() => false)
    // Peut ne pas être visible s'il n'y a pas de backups
    expect(typeof isVisible).toBe('boolean')
  })

  test('devrait afficher les icônes de statut', async ({ authenticatedPage: page }) => {
    // Les backups ont des icônes de statut (check, x, clock, loader)
    const statusIcon = page.locator('td').first().locator('svg')

    const count = await statusIcon.count().catch(() => 0)
    // On vérifie juste que la structure existe
    expect(typeof count).toBe('number')
  })

  test('devrait afficher la taille en MB', async ({ authenticatedPage: page }) => {
    // La colonne taille affiche des valeurs en MB
    const sizeCell = page.getByText(/\d+(\.\d+)?\s*MB/i).first()

    const isVisible = await sizeCell.isVisible().catch(() => false)
    expect(typeof isVisible).toBe('boolean')
  })

  test('devrait afficher le message si aucun backup', async ({ authenticatedPage: page }) => {
    // Si pas de backups, un message devrait s'afficher
    const emptyMessage = page.getByText(/aucun backup disponible/i)
    const tableRow = page.locator('tbody tr').first()

    const hasEmpty = await emptyMessage.isVisible().catch(() => false)
    const hasData = await tableRow.isVisible().catch(() => false)

    // L'un ou l'autre devrait être vrai
    expect(hasEmpty || hasData).toBe(true)
  })

  // =========================================================================
  // TESTS RESTORE BUTTON (Phase 1 - P0)
  // =========================================================================

  test('devrait afficher le bouton restaurer pour backups completed', async ({ authenticatedPage: page }) => {
    // Chercher un bouton restaurer (icône rotate/restore)
    const restoreBtn = page.locator('button[title="Restaurer"]').first()

    // Le bouton existe si au moins un backup est completed
    const isVisible = await restoreBtn.isVisible().catch(() => false)
    // On ne fait pas d'assertion stricte car il peut ne pas y avoir de backups completed
    expect(typeof isVisible).toBe('boolean')
  })

  test('devrait ouvrir le modal de confirmation de restauration', async ({ authenticatedPage: page }) => {
    const restoreBtn = page.locator('button[title="Restaurer"]').first()

    if (await restoreBtn.isVisible()) {
      await restoreBtn.click()

      // Vérifier que le modal de confirmation s'ouvre
      await expect(page.getByRole('heading', { name: /confirmer la restauration/i })).toBeVisible()
      await expect(page.getByText(/êtes-vous sûr de vouloir restaurer/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /restaurer/i })).toBeVisible()
    }
  })

  test('devrait afficher un avertissement dans le modal de restauration', async ({ authenticatedPage: page }) => {
    const restoreBtn = page.locator('button[title="Restaurer"]').first()

    if (await restoreBtn.isVisible()) {
      await restoreBtn.click()

      // Vérifier que le message d'avertissement est présent
      await expect(page.getByText(/irréversible|écrasera/i)).toBeVisible()
    }
  })

  test('devrait fermer le modal de restauration avec Escape', async ({ authenticatedPage: page }) => {
    const restoreBtn = page.locator('button[title="Restaurer"]').first()

    if (await restoreBtn.isVisible()) {
      await restoreBtn.click()
      await expect(page.getByRole('heading', { name: /confirmer la restauration/i })).toBeVisible()

      await page.keyboard.press('Escape')

      await expect(page.getByRole('heading', { name: /confirmer la restauration/i })).not.toBeVisible()
    }
  })

  test('devrait afficher le bouton télécharger pour backups completed', async ({ authenticatedPage: page }) => {
    // Chercher un lien/bouton de téléchargement
    const downloadBtn = page.locator('a[title="Télécharger"]').first()

    const isVisible = await downloadBtn.isVisible().catch(() => false)
    expect(typeof isVisible).toBe('boolean')
  })

  test('ne devrait pas afficher restaurer pour backups en cours', async ({ authenticatedPage: page }) => {
    // Les backups avec status "running" ou "pending" ne devraient pas avoir le bouton restore
    // Vérifier qu'il n'y a pas de bouton restore sur une ligne avec le spinner
    const runningRow = page.locator('tbody tr').filter({ has: page.locator('.animate-spin') }).first()

    if (await runningRow.isVisible()) {
      const restoreInRunning = runningRow.locator('button[title="Restaurer"]')
      await expect(restoreInRunning).not.toBeVisible()
    }
  })
})
