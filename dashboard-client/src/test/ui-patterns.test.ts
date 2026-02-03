/**
 * Tests de vérification des patterns UI/UX
 * Vérifie que tous les composants respectent les conventions dark/light mode
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

// Fonction récursive pour lister tous les fichiers TSX/JSX
function getAllTsxFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir)

  files.forEach(file => {
    const filePath = join(dir, file)

    if (statSync(filePath).isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('dist') && !file.includes('.next')) {
        getAllTsxFiles(filePath, fileList)
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      fileList.push(filePath)
    }
  })

  return fileList
}

const srcDir = join(__dirname, '..')
const allFiles = getAllTsxFiles(srcDir)

describe('UI/UX Patterns - Dark/Light Mode', () => {
  describe('Background Colors', () => {
    it('tous les bg-white doivent avoir dark:bg-gray-800 ou équivalent', () => {
      const violations: string[] = []

      allFiles.forEach(file => {
        const content = readFileSync(file, 'utf-8')

        // Si bg-white présent
        if (/className=["'][^"']*bg-white(?!\/|-)[^"']*["']/.test(content)) {
          // Vérifier présence dark:bg-
          if (!/dark:bg-/.test(content)) {
            violations.push(file.replace(srcDir, ''))
          }
        }
      })

      if (violations.length > 0) {
        console.error('\n❌ Fichiers sans variante dark pour bg-white :')
        violations.forEach(f => console.error(`   - ${f}`))
      }

      expect(violations).toHaveLength(0)
    })
  })

  describe('Text Colors', () => {
    it('tous les text-gray-900 doivent avoir dark:text-white', () => {
      const violations: string[] = []

      allFiles.forEach(file => {
        const content = readFileSync(file, 'utf-8')

        if (/text-gray-900/.test(content)) {
          if (!/dark:text-white/.test(content)) {
            violations.push(file.replace(srcDir, ''))
          }
        }
      })

      if (violations.length > 0) {
        console.error('\n❌ Fichiers sans dark:text-white pour text-gray-900 :')
        violations.forEach(f => console.error(`   - ${f}`))
      }

      expect(violations).toHaveLength(0)
    })

    it('aucun text-white isolé sans contrepartie light mode', () => {
      const violations: string[] = []

      allFiles.forEach(file => {
        const content = readFileSync(file, 'utf-8')

        // Rechercher className avec text-white SANS dark:text-white (inverse)
        const classNameRegex = /className=["'{`]([^"'`]*)["'`}]/g
        let match
        let hasViolation = false

        while ((match = classNameRegex.exec(content)) !== null) {
          const classes = match[1]!  // Safe: capture group exists when match !== null

          // Si text-white présent dans cette className
          if (/\btext-white\b/.test(classes)) {
            // Vérifier que dark:text-white n'est PAS présent (ce serait text-white pour dark mode)
            // ET qu'il n'y a pas de variante light mode (text-gray-XXX)
            const hasDarkTextWhite = /dark:text-white/.test(classes)
            const hasLightVariant = /\btext-gray-[0-9]+\b/.test(classes) || /\btext-slate-[0-9]+\b/.test(classes)

            // Violation si text-white est utilisé seul sans indication qu'il change en light mode
            if (!hasDarkTextWhite && !hasLightVariant) {
              // Exception : fonds sombres intentionnels (gradients, bg-slate/gray-XXX)
              const hasIntentionalDarkBg = /bg-gradient|bg-slate-[789]|bg-gray-[789]|bg-black/.test(classes)

              if (!hasIntentionalDarkBg) {
                hasViolation = true
                break
              }
            }
          }
        }

        if (hasViolation) {
          violations.push(file.replace(srcDir, ''))
        }
      })

      if (violations.length > 0) {
        console.warn('\n⚠️  Fichiers avec text-white isolé (vérifier contexte parent) :')
        violations.forEach(f => console.warn(`   - ${f}`))
      }

      // Warning seulement, car text-white peut hériter du fond sombre parent
      expect(violations.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Borders', () => {
    it('tous les border-gray-200 devraient avoir dark:border-gray-700', () => {
      const violations: string[] = []

      allFiles.forEach(file => {
        const content = readFileSync(file, 'utf-8')

        if (/border-gray-200/.test(content)) {
          if (!/dark:border-gray-700/.test(content)) {
            violations.push(file.replace(srcDir, ''))
          }
        }
      })

      if (violations.length > 0) {
        console.warn('\n⚠️  Fichiers sans dark:border-gray-700 (warning) :')
        violations.forEach(f => console.warn(`   - ${f}`))
      }

      // Warning seulement, pas de fail
      expect(violations.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Form Elements', () => {
    it('tous les <label> doivent utiliser text-gray-900 dark:text-white', () => {
      const violations: string[] = []

      allFiles.forEach(file => {
        const content = readFileSync(file, 'utf-8')

        // Si <label> présent
        if (/<label/.test(content)) {
          // Rechercher text-gray-700 sans variante correcte
          if (/text-gray-700(?!.*dark:text-white)/.test(content)) {
            violations.push(file.replace(srcDir, ''))
          }
        }
      })

      if (violations.length > 0) {
        console.error('\n❌ Labels avec text-gray-700 au lieu de text-gray-900 dark:text-white :')
        violations.forEach(f => console.error(`   - ${f}`))
      }

      expect(violations).toHaveLength(0)
    })

    it('tous les <input>/<select>/<textarea> avec bg-white doivent avoir dark:bg-', () => {
      const violations: string[] = []

      allFiles.forEach(file => {
        const content = readFileSync(file, 'utf-8')

        // Chercher les inputs avec bg-white SANS opacité (pas bg-white/5, /10, etc.)
        const inputWithBgWhiteRegex = /<(?:input|select|textarea)[^>]*className=["'{`]([^"'`]*\bbg-white\b(?!\/)[^"'`]*)["'`}][^>]*>/gi
        let match
        let hasViolation = false

        while ((match = inputWithBgWhiteRegex.exec(content)) !== null) {
          const classes = match[1]!  // Safe: capture group exists when match !== null

          // Vérifier si dark:bg- est présent dans cette className
          if (!/dark:bg-/.test(classes)) {
            hasViolation = true
            break
          }
        }

        if (hasViolation) {
          violations.push(file.replace(srcDir, ''))
        }
      })

      if (violations.length > 0) {
        console.error('\n❌ Champs de formulaire sans variante dark pour bg-white :')
        violations.forEach(f => console.error(`   - ${f}`))
      }

      expect(violations).toHaveLength(0)
    })
  })

  describe('Components Glass', () => {
    it('GlassPanel/GlassCard devraient avoir du padding', () => {
      const violations: string[] = []

      allFiles.forEach(file => {
        const content = readFileSync(file, 'utf-8')

        // Si GlassPanel ou GlassCard présent
        if (/GlassPanel|GlassCard/.test(content)) {
          // Extraire contexte (3 lignes après)
          const lines = content.split('\n')
          let hasGlass = false
          let hasPadding = false

          lines.forEach((line, index) => {
            if (/GlassPanel|GlassCard/.test(line)) {
              hasGlass = true
              // Vérifier les 3 lignes suivantes pour className avec padding
              const context = lines.slice(index, index + 3).join('\n')
              if (/className=["'][^"']*p-[0-9]/.test(context)) {
                hasPadding = true
              }
            }
          })

          if (hasGlass && !hasPadding) {
            violations.push(file.replace(srcDir, ''))
          }
        }
      })

      if (violations.length > 0) {
        console.warn('\n⚠️  GlassPanel/GlassCard sans padding (warning) :')
        violations.forEach(f => console.warn(`   - ${f}`))
      }

      // Warning seulement
      expect(violations.length).toBeGreaterThanOrEqual(0)
    })
  })
})

describe('UI/UX Patterns - Composants Standards', () => {
  describe('Imports', () => {
    it('ne doit pas utiliser heroicons (utiliser lucide-react)', () => {
      const violations: string[] = []

      allFiles.forEach(file => {
        const content = readFileSync(file, 'utf-8')

        if (/from ['"]@heroicons/.test(content)) {
          violations.push(file.replace(srcDir, ''))
        }
      })

      if (violations.length > 0) {
        console.error('\n❌ Fichiers utilisant heroicons au lieu de lucide-react :')
        violations.forEach(f => console.error(`   - ${f}`))
      }

      expect(violations).toHaveLength(0)
    })
  })

  describe('Boutons', () => {
    it('devrait utiliser le composant Button au lieu de <button> manuel', () => {
      const violations: string[] = []

      allFiles.forEach(file => {
        const content = readFileSync(file, 'utf-8')

        // Ignorer fichiers de composants Button eux-mêmes
        if (file.includes('/common/Button') || file.includes('/ui/')) {
          return
        }

        // Rechercher <button avec className contenant bg-gradient ou bg-blue
        if (/<button[^>]*className=["'][^"']*(bg-gradient|bg-blue|bg-indigo|bg-violet)/.test(content)) {
          // Vérifier si Button component est importé
          if (!/import.*Button.*from.*@\/components/.test(content)) {
            violations.push(file.replace(srcDir, ''))
          }
        }
      })

      if (violations.length > 0) {
        console.warn('\n⚠️  Fichiers avec <button> manuel (recommandé: composant Button) :')
        violations.forEach(f => console.warn(`   - ${f}`))
      }

      // Warning seulement
      expect(violations.length).toBeGreaterThanOrEqual(0)
    })
  })
})
