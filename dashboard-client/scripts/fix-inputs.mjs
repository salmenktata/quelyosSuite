#!/usr/bin/env node

/**
 * Script de correction des inputs bg-white → bg-white dark:bg-gray-800
 */

import { readFileSync, writeFileSync } from 'fs'

const files = [
  'src/components/finance/ExportButton.tsx',
  'src/components/finance/accounts/AccountModal.tsx',
  'src/components/finance/accounts/DeleteConflictModal.tsx',
  'src/components/finance/alerts/AlertConfigForm.tsx',
  'src/components/finance/dashboard/ActionDialog.tsx',
  'src/components/finance/dashboard/QuickTransactionDialog.tsx',
  'src/components/finance/transactions/TransactionFormPage/TransactionFormFields.tsx',
  'src/pages/ForgotPassword.tsx',
  'src/pages/finance/accounts/new/page.tsx',
  'src/pages/finance/budgets/new/page.tsx',
  'src/pages/finance/budgets/page 2.tsx',
  'src/pages/finance/settings/flux/page.tsx',
  'src/pages/finance/settings/notifications/page.tsx',
  'src/pages/finance/settings/security/page.tsx',
]

let fixed = 0

files.forEach(file => {
  try {
    let content = readFileSync(file, 'utf-8')
    let modified = false

    // Pattern pour inputs/select/textarea avec bg-white
    // Chercher les éléments avec bg-white dans leur className
    const inputRegex = /(<(?:input|select|textarea)[^>]*className=["'{`])([^"'`]*\bbg-white\b[^"'`]*)(["`'}][^>]*>)/gi

    content = content.replace(inputRegex, (match, before, classes, after) => {
      // Vérifier si dark:bg- n'est pas déjà présent
      if (!classes.includes('dark:bg-')) {
        modified = true
        // Ajouter dark:bg-gray-800 après bg-white
        const newClasses = classes.replace(/\bbg-white\b/, 'bg-white dark:bg-gray-800')
        return `${before}${newClasses}${after}`
      }
      return match
    })

    if (modified) {
      writeFileSync(file, content, 'utf-8')
      console.log(`✓ ${file}`)
      fixed++
    }
  } catch (_err) {
    console.error(`✗ ${file} (not found)`)
  }
})

console.log(`\n✨ ${fixed} fichiers corrigés`)
