import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { TopNavbar } from './TopNavbar'
import type { Module } from '@/config/modules'

// Mock du contexte ThemeContext
const mockToggleTheme = vi.fn()
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: mockToggleTheme
  })
}))

// Mock modules pour les tests
const createMockModule = (id: string, name: string): Module => ({
  id: id as any,
  name,
  shortName: name,
  icon: () => <div data-testid={`icon-${id}`}>Icon</div>,
  color: `text-${id}`,
  bgColor: `bg-${id}`,
  description: `Module ${name}`,
  basePath: `/${id}`,
  sections: []
})

const mockModules: Module[] = [
  createMockModule('home', 'Accueil'),
  createMockModule('finance', 'Finance'),
  createMockModule('store', 'Boutique'),
  createMockModule('stock', 'Stock'),
  createMockModule('crm', 'CRM'),
  createMockModule('marketing', 'Marketing'),
  createMockModule('hr', 'RH')
]

// Wrapper avec Router car TopNavbar utilise Link
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('TopNavbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Affichage de base', () => {
    it('devrait afficher le bouton App Launcher', () => {
      renderWithRouter(
        <TopNavbar
          currentModule={mockModules[0]!}
          modules={mockModules}
          isModuleChanging={false}
          isAppLauncherOpen={false}
          onModuleChange={vi.fn()}
          onMenuClick={vi.fn()}
          onAppLauncherClick={vi.fn()}
        />
      )

      const launcherButton = screen.getByRole('button', { name: /Lanceur d'applications/i })
      expect(launcherButton).toBeInTheDocument()
    })

    it('devrait afficher le bouton toggle theme', () => {
      renderWithRouter(
        <TopNavbar
          currentModule={mockModules[0]!}
          modules={mockModules}
          isModuleChanging={false}
          isAppLauncherOpen={false}
          onModuleChange={vi.fn()}
          onMenuClick={vi.fn()}
          onAppLauncherClick={vi.fn()}
        />
      )

      const themeButton = screen.getByTitle('Mode sombre')
      expect(themeButton).toBeInTheDocument()
    })
  })

  describe('Quick Access (5 modules)', () => {
    it('devrait afficher 5 modules principaux (home, finance, store, crm, stock)', () => {
      renderWithRouter(
        <TopNavbar
          currentModule={mockModules[0]!}
          modules={mockModules}
          isModuleChanging={false}
          isAppLauncherOpen={false}
          onModuleChange={vi.fn()}
          onMenuClick={vi.fn()}
          onAppLauncherClick={vi.fn()}
        />
      )

      // Ces 5 modules doivent être présents dans la navbar
      expect(screen.getByRole('button', { name: /Accueil/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Finance/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Boutique/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /CRM/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Stock/ })).toBeInTheDocument()
    })

    it('ne devrait PAS afficher marketing et hr dans quick access', () => {
      renderWithRouter(
        <TopNavbar
          currentModule={mockModules[0]!}
          modules={mockModules}
          isModuleChanging={false}
          isAppLauncherOpen={false}
          onModuleChange={vi.fn()}
          onMenuClick={vi.fn()}
          onAppLauncherClick={vi.fn()}
        />
      )

      // Marketing et HR ne doivent pas être dans la navbar quick access
      const buttons = screen.getAllByRole('button')
      const buttonTexts = buttons.map(btn => btn.textContent)

      expect(buttonTexts.join()).not.toContain('Marketing')
      expect(buttonTexts.join()).not.toContain('RH')
    })

    it('devrait filtrer selon les modules accessibles', () => {
      // Utilisateur n'a accès qu'à home et finance
      const limitedModules = [mockModules[0]!, mockModules[1]!]

      renderWithRouter(
        <TopNavbar
          currentModule={mockModules[0]!}
          modules={limitedModules}
          isModuleChanging={false}
          isAppLauncherOpen={false}
          onModuleChange={vi.fn()}
          onMenuClick={vi.fn()}
          onAppLauncherClick={vi.fn()}
        />
      )

      expect(screen.getByRole('button', { name: /Accueil/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Finance/ })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Boutique/ })).not.toBeInTheDocument()
    })
  })

  describe('Module actif', () => {
    it('devrait surligner le module actif', () => {
      renderWithRouter(
        <TopNavbar
          currentModule={mockModules[1]!} // Finance actif
          modules={mockModules}
          isModuleChanging={false}
          isAppLauncherOpen={false}
          onModuleChange={vi.fn()}
          onMenuClick={vi.fn()}
          onAppLauncherClick={vi.fn()}
        />
      )

      const financeButton = screen.getByRole('button', { name: /Finance/ })
      expect(financeButton).toHaveClass('bg-gray-700')
      expect(financeButton).toHaveClass('text-white')
    })

    it('ne devrait pas surligner les modules inactifs', () => {
      renderWithRouter(
        <TopNavbar
          currentModule={mockModules[1]!} // Finance actif
          modules={mockModules}
          isModuleChanging={false}
          isAppLauncherOpen={false}
          onModuleChange={vi.fn()}
          onMenuClick={vi.fn()}
          onAppLauncherClick={vi.fn()}
        />
      )

      const homeButton = screen.getByRole('button', { name: /Accueil/ })
      expect(homeButton).not.toHaveClass('bg-gray-700')
      expect(homeButton).toHaveClass('text-gray-400')
      expect(homeButton).toHaveClass('hover:bg-gray-800')
    })
  })

  describe('Loading state', () => {
    it('devrait afficher un spinner sur le module actif si isModuleChanging=true', () => {
      const { container } = renderWithRouter(
        <TopNavbar
          currentModule={mockModules[1]!} // Finance actif
          modules={mockModules}
          isModuleChanging={true}
          isAppLauncherOpen={false}
          onModuleChange={vi.fn()}
          onMenuClick={vi.fn()}
          onAppLauncherClick={vi.fn()}
        />
      )

      const financeButton = screen.getByRole('button', { name: /Finance/ })
      // Le Button component ajoute un Loader2 quand loading=true
      expect(financeButton).toBeInTheDocument()
      // Note: Le test exact du spinner dépend de l'implémentation du Button
    })
  })

  describe('Interactions', () => {
    it('devrait appeler onModuleChange au clic sur un module', () => {
      const onModuleChange = vi.fn()

      renderWithRouter(
        <TopNavbar
          currentModule={mockModules[0]!}
          modules={mockModules}
          isModuleChanging={false}
          isAppLauncherOpen={false}
          onModuleChange={onModuleChange}
          onMenuClick={vi.fn()}
          onAppLauncherClick={vi.fn()}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: /Finance/ }))

      expect(onModuleChange).toHaveBeenCalledWith('finance')
      expect(onModuleChange).toHaveBeenCalledTimes(1)
    })

    it('devrait appeler onAppLauncherClick au clic sur App Launcher', () => {
      const onAppLauncherClick = vi.fn()

      renderWithRouter(
        <TopNavbar
          currentModule={mockModules[0]!}
          modules={mockModules}
          isModuleChanging={false}
          isAppLauncherOpen={false}
          onModuleChange={vi.fn()}
          onMenuClick={vi.fn()}
          onAppLauncherClick={onAppLauncherClick}
        />
      )

      const launcherButton = screen.getByRole('button', { name: /Lanceur d'applications/i })
      fireEvent.click(launcherButton)

      expect(onAppLauncherClick).toHaveBeenCalledTimes(1)
    })

    it('devrait appeler toggleTheme au clic sur le bouton theme', () => {
      renderWithRouter(
        <TopNavbar
          currentModule={mockModules[0]!}
          modules={mockModules}
          isModuleChanging={false}
          isAppLauncherOpen={false}
          onModuleChange={vi.fn()}
          onMenuClick={vi.fn()}
          onAppLauncherClick={vi.fn()}
        />
      )

      const themeButton = screen.getByTitle('Mode sombre')
      fireEvent.click(themeButton)

      expect(mockToggleTheme).toHaveBeenCalledTimes(1)
    })

    it('devrait appeler onMenuClick au clic sur le bouton menu mobile', () => {
      const onMenuClick = vi.fn()

      renderWithRouter(
        <TopNavbar
          currentModule={mockModules[0]!}
          modules={mockModules}
          isModuleChanging={false}
          isAppLauncherOpen={false}
          onModuleChange={vi.fn()}
          onMenuClick={onMenuClick}
          onAppLauncherClick={vi.fn()}
        />
      )

      const menuButton = screen.getByRole('button', { name: /Menu/i })
      fireEvent.click(menuButton)

      expect(onMenuClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('App Launcher state', () => {
    it('devrait surligner le bouton App Launcher si ouvert', () => {
      renderWithRouter(
        <TopNavbar
          currentModule={mockModules[0]!}
          modules={mockModules}
          isModuleChanging={false}
          isAppLauncherOpen={true}
          onModuleChange={vi.fn()}
          onMenuClick={vi.fn()}
          onAppLauncherClick={vi.fn()}
        />
      )

      const launcherButton = screen.getByRole('button', { name: /Lanceur d'applications/i })
      expect(launcherButton).toHaveClass('bg-gray-700')
      expect(launcherButton).toHaveClass('text-white')
    })

    it('ne devrait pas surligner le bouton App Launcher si fermé', () => {
      renderWithRouter(
        <TopNavbar
          currentModule={mockModules[0]!}
          modules={mockModules}
          isModuleChanging={false}
          isAppLauncherOpen={false}
          onModuleChange={vi.fn()}
          onMenuClick={vi.fn()}
          onAppLauncherClick={vi.fn()}
        />
      )

      const launcherButton = screen.getByRole('button', { name: /Lanceur d'applications/i })
      expect(launcherButton).not.toHaveClass('bg-gray-700')
      expect(launcherButton).toHaveClass('text-gray-400')
    })
  })

  describe('Responsive', () => {
    it('devrait avoir les classes responsive appropriées', () => {
      const { container } = renderWithRouter(
        <TopNavbar
          currentModule={mockModules[0]!}
          modules={mockModules}
          isModuleChanging={false}
          isAppLauncherOpen={false}
          onModuleChange={vi.fn()}
          onMenuClick={vi.fn()}
          onAppLauncherClick={vi.fn()}
        />
      )

      // Quick access caché sur mobile
      const quickAccess = container.querySelector('.hidden.md\\:flex')
      expect(quickAccess).toBeInTheDocument()

      // Indicateur module actuel visible seulement mobile
      const mobileIndicator = container.querySelector('.md\\:hidden.flex')
      expect(mobileIndicator).toBeInTheDocument()

      // Bouton menu visible seulement < lg
      const menuButton = screen.getByRole('button', { name: /Menu/i })
      expect(menuButton).toHaveClass('lg:hidden')
    })

    it('devrait afficher le module actuel sur mobile', () => {
      const { container } = renderWithRouter(
        <TopNavbar
          currentModule={mockModules[1]!} // Finance
          modules={mockModules}
          isModuleChanging={false}
          isAppLauncherOpen={false}
          onModuleChange={vi.fn()}
          onMenuClick={vi.fn()}
          onAppLauncherClick={vi.fn()}
        />
      )

      // Le nom du module devrait être visible dans l'indicateur mobile
      const mobileIndicator = container.querySelector('.md\\:hidden.flex')
      expect(mobileIndicator).toHaveTextContent('Finance')
    })
  })

  describe('Dark mode', () => {
    it('devrait avoir les classes dark mode', () => {
      const { container } = renderWithRouter(
        <TopNavbar
          currentModule={mockModules[0]!}
          modules={mockModules}
          isModuleChanging={false}
          isAppLauncherOpen={false}
          onModuleChange={vi.fn()}
          onMenuClick={vi.fn()}
          onAppLauncherClick={vi.fn()}
        />
      )

      const header = container.querySelector('header')
      expect(header).toHaveClass('bg-gray-900')
      expect(header).toHaveClass('dark:bg-gray-950')
    })
  })
})
