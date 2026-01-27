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

        // Rechercher text-white dans className
        const textWhiteMatch = /className=["'][^"']*text-white[^"']*["']/.test(content)

        if (textWhiteMatch) {
          // Vérifier qu'il y a aussi une variante text-gray-XXX
          if (!/text-gray-[0-9]+.*dark:text-white|dark:text-white.*text-gray-[0-9]+/.test(content)) {
            violations.push(file.replace(srcDir, ''))
          }
        }
      })

      if (violations.length > 0) {
        console.error('\n⚠️  Fichiers avec text-white isolé :')
        violations.forEach(f => console.error(`   - ${f}`))
      }

      expect(violations).toHaveLength(0)
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

        // Si input/select/textarea présent ET bg-white utilisé
        if (/<input|<select|<textarea/.test(content) && /bg-white/.test(content)) {
          // Vérifier présence dark:bg-gray ou dark:bg-white/10
          if (!/dark:bg-gray|dark:bg-white\/10/.test(content)) {
            violations.push(file.replace(srcDir, ''))
          }
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
