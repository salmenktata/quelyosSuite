import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AppLauncher } from './AppLauncher'
import type { Module } from '@/config/modules'

// Mock modules pour les tests
const createMockModule = (id: string, name: string, color: string): Module => ({
  id: id as any,
  name,
  shortName: name,
  icon: () => <div data-testid={`icon-${id}`}>Icon</div>,
  color,
  bgColor: `bg-${color}`,
  description: `Module ${name}`,
  basePath: `/${id}`,
  sections: []
})

const mockModules: Module[] = [
  createMockModule('home', 'Accueil', 'gray-600'),
  createMockModule('finance', 'Finance', 'emerald-600'),
  createMockModule('store', 'Boutique', 'indigo-600'),
  createMockModule('stock', 'Stock', 'orange-600'),
  createMockModule('crm', 'CRM', 'violet-600'),
  createMockModule('marketing', 'Marketing', 'pink-600'),
  createMockModule('hr', 'RH', 'cyan-600')
]

describe('AppLauncher', () => {
  describe('Visibility', () => {
    it('ne devrait rien afficher si isOpen=false', () => {
      const { container } = render(
        <AppLauncher
          currentModule={mockModules[0]}
          modules={mockModules}
          isOpen={false}
          onSelect={vi.fn()}
          onClose={vi.fn()}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('devrait afficher le modal si isOpen=true', () => {
      render(
        <AppLauncher
          currentModule={mockModules[0]}
          modules={mockModules}
          isOpen={true}
          onSelect={vi.fn()}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByPlaceholderText('Rechercher une application...')).toBeInTheDocument()
    })
  })

  describe('Affichage des modules', () => {
    it('devrait afficher tous les modules fournis', () => {
      render(
        <AppLauncher
          currentModule={mockModules[0]}
          modules={mockModules}
          isOpen={true}
          onSelect={vi.fn()}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByText('Accueil')).toBeInTheDocument()
      expect(screen.getByText('Finance')).toBeInTheDocument()
      expect(screen.getByText('Boutique')).toBeInTheDocument()
      expect(screen.getByText('Stock')).toBeInTheDocument()
      expect(screen.getByText('CRM')).toBeInTheDocument()
      expect(screen.getByText('Marketing')).toBeInTheDocument()
      expect(screen.getByText('RH')).toBeInTheDocument()
    })

    it('devrait afficher les icônes des modules', () => {
      render(
        <AppLauncher
          currentModule={mockModules[0]}
          modules={mockModules}
          isOpen={true}
          onSelect={vi.fn()}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByTestId('icon-home')).toBeInTheDocument()
      expect(screen.getByTestId('icon-finance')).toBeInTheDocument()
      expect(screen.getByTestId('icon-store')).toBeInTheDocument()
    })

    it('devrait n\'afficher que les modules accessibles', () => {
      const limitedModules = [mockModules[0], mockModules[1]] // Seulement home et finance

      render(
        <AppLauncher
          currentModule={mockModules[0]}
          modules={limitedModules}
          isOpen={true}
          onSelect={vi.fn()}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByText('Accueil')).toBeInTheDocument()
      expect(screen.getByText('Finance')).toBeInTheDocument()
      expect(screen.queryByText('Boutique')).not.toBeInTheDocument()
      expect(screen.queryByText('Stock')).not.toBeInTheDocument()
    })
  })

  describe('Module actif', () => {
    it('devrait appliquer un style spécial au module actif', () => {
      const { container } = render(
        <AppLauncher
          currentModule={mockModules[1]} // Finance actif
          modules={mockModules}
          isOpen={true}
          onSelect={vi.fn()}
          onClose={vi.fn()}
        />
      )

      const financeButton = screen.getByText('Finance').closest('button')
      expect(financeButton).toHaveClass('bg-emerald-600')
      expect(financeButton).toHaveClass('ring-2')
    })

    it('ne devrait pas appliquer le style actif aux autres modules', () => {
      render(
        <AppLauncher
          currentModule={mockModules[1]} // Finance actif
          modules={mockModules}
          isOpen={true}
          onSelect={vi.fn()}
          onClose={vi.fn()}
        />
      )

      const homeButton = screen.getByText('Accueil').closest('button')
      expect(homeButton).not.toHaveClass('ring-2')
      expect(homeButton).toHaveClass('hover:bg-gray-100')
    })
  })

  describe('Interactions', () => {
    it('devrait appeler onSelect avec le bon moduleId au clic', () => {
      const onSelect = vi.fn()

      render(
        <AppLauncher
          currentModule={mockModules[0]}
          modules={mockModules}
          isOpen={true}
          onSelect={onSelect}
          onClose={vi.fn()}
        />
      )

      fireEvent.click(screen.getByText('Finance'))

      expect(onSelect).toHaveBeenCalledWith('finance')
      expect(onSelect).toHaveBeenCalledTimes(1)
    })

    it('devrait appeler onClose après sélection d\'un module', () => {
      const onClose = vi.fn()

      render(
        <AppLauncher
          currentModule={mockModules[0]}
          modules={mockModules}
          isOpen={true}
          onSelect={vi.fn()}
          onClose={onClose}
        />
      )

      fireEvent.click(screen.getByText('Finance'))

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('devrait appeler onSelect et onClose en séquence', () => {
      const onSelect = vi.fn()
      const onClose = vi.fn()

      render(
        <AppLauncher
          currentModule={mockModules[0]}
          modules={mockModules}
          isOpen={true}
          onSelect={onSelect}
          onClose={onClose}
        />
      )

      fireEvent.click(screen.getByText('Boutique'))

      expect(onSelect).toHaveBeenCalledWith('store')
      expect(onClose).toHaveBeenCalled()
    })

    it('devrait fermer au clic sur l\'overlay', () => {
      const onClose = vi.fn()

      const { container } = render(
        <AppLauncher
          currentModule={mockModules[0]}
          modules={mockModules}
          isOpen={true}
          onSelect={vi.fn()}
          onClose={onClose}
        />
      )

      // L'overlay est le premier élément (fixed inset-0)
      const overlay = container.querySelector('.fixed.inset-0')
      expect(overlay).toBeInTheDocument()

      if (overlay) {
        fireEvent.click(overlay)
      }

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('ne devrait PAS fermer au clic sur le modal lui-même', () => {
      const onClose = vi.fn()

      const { container } = render(
        <AppLauncher
          currentModule={mockModules[0]}
          modules={mockModules}
          isOpen={true}
          onSelect={vi.fn()}
          onClose={onClose}
        />
      )

      // Le modal est le second élément avec z-[70]
      const modal = container.querySelector('.z-\\[70\\]')
      expect(modal).toBeInTheDocument()

      if (modal) {
        fireEvent.click(modal)
      }

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('Barre de recherche', () => {
    it('devrait afficher un input de recherche', () => {
      render(
        <AppLauncher
          currentModule={mockModules[0]}
          modules={mockModules}
          isOpen={true}
          onSelect={vi.fn()}
          onClose={vi.fn()}
        />
      )

      const searchInput = screen.getByPlaceholderText('Rechercher une application...')
      expect(searchInput).toBeInTheDocument()
      expect(searchInput).toHaveAttribute('type', 'text')
    })

    it('devrait permettre de taper dans la recherche', () => {
      render(
        <AppLauncher
          currentModule={mockModules[0]}
          modules={mockModules}
          isOpen={true}
          onSelect={vi.fn()}
          onClose={vi.fn()}
        />
      )

      const searchInput = screen.getByPlaceholderText('Rechercher une application...') as HTMLInputElement

      fireEvent.change(searchInput, { target: { value: 'Finance' } })

      expect(searchInput.value).toBe('Finance')
    })

    // Note: La fonctionnalité de recherche n'est pas encore implémentée (Phase 3)
    it('ne devrait pas filtrer les modules pour l\'instant (Phase 3)', () => {
      render(
        <AppLauncher
          currentModule={mockModules[0]}
          modules={mockModules}
          isOpen={true}
          onSelect={vi.fn()}
          onClose={vi.fn()}
        />
      )

      const searchInput = screen.getByPlaceholderText('Rechercher une application...')
      fireEvent.change(searchInput, { target: { value: 'Finance' } })

      // Tous les modules devraient toujours être visibles
      expect(screen.getByText('Accueil')).toBeInTheDocument()
      expect(screen.getByText('Finance')).toBeInTheDocument()
      expect(screen.getByText('Boutique')).toBeInTheDocument()
    })
  })

  describe('Grille et layout', () => {
    it('devrait utiliser une grille 3 colonnes', () => {
      const { container } = render(
        <AppLauncher
          currentModule={mockModules[0]}
          modules={mockModules}
          isOpen={true}
          onSelect={vi.fn()}
          onClose={vi.fn()}
        />
      )

      const grid = container.querySelector('.grid-cols-3')
      expect(grid).toBeInTheDocument()
    })

    it('devrait limiter la hauteur avec overflow', () => {
      const { container } = render(
        <AppLauncher
          currentModule={mockModules[0]}
          modules={mockModules}
          isOpen={true}
          onSelect={vi.fn()}
          onClose={vi.fn()}
        />
      )

      const grid = container.querySelector('.max-h-80')
      expect(grid).toBeInTheDocument()
      expect(grid).toHaveClass('overflow-y-auto')
    })
  })

  describe('Dark mode', () => {
    it('devrait avoir les classes dark mode sur les éléments principaux', () => {
      const { container } = render(
        <AppLauncher
          currentModule={mockModules[0]}
          modules={mockModules}
          isOpen={true}
          onSelect={vi.fn()}
          onClose={vi.fn()}
        />
      )

      const modal = container.querySelector('.dark\\:bg-gray-800')
      expect(modal).toBeInTheDocument()

      const searchInput = screen.getByPlaceholderText('Rechercher une application...')
      expect(searchInput).toHaveClass('dark:bg-gray-700')
      expect(searchInput).toHaveClass('dark:text-white')
    })
  })
})
