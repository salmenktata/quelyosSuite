/**
 * Hook pour les raccourcis clavier POS
 * Gestion centralisée de tous les raccourcis caisse
 */

import { useEffect, useCallback, useState } from 'react'

// Types de raccourcis
export interface POSKeyboardShortcut {
  key: string
  label: string
  description: string
  action: () => void
  enabled?: boolean
}

export interface POSKeyboardConfig {
  // Navigation
  onSearchProduct?: () => void       // F2
  onSearchCustomer?: () => void      // F3
  onToggleCustomer?: () => void      // F5

  // Panier
  onLineDiscount?: () => void        // F4
  onClearCart?: () => void           // F6
  onSuspendCart?: () => void         // F9
  onResumeCart?: () => void          // F10

  // Paiement
  onPayment?: () => void             // F8
  onQuickCash?: () => void           // F7

  // Quantité
  onQuantityIncrease?: () => void    // +
  onQuantityDecrease?: () => void    // -
  onDeleteLine?: () => void          // Delete

  // Session
  onCloseSession?: () => void        // F12
  onOpenDrawer?: () => void          // F11

  // Misc
  onHelp?: () => void                // F1 / ?
  onCancel?: () => void              // Escape

  // États
  isPaymentModalOpen?: boolean
  isSearchOpen?: boolean
}

export function usePOSKeyboard(config: POSKeyboardConfig) {
  const [showHelp, setShowHelp] = useState(false)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignorer si focus dans un input (sauf quelques exceptions)
    const target = event.target as HTMLElement
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

    // Permettre certains raccourcis même dans les inputs
    const allowInInput = ['Escape', 'F1', 'F8', 'F12']

    if (isInput && !allowInInput.includes(event.key)) {
      return
    }

    // Ignorer si modal de paiement ouvert (sauf Escape)
    if (config.isPaymentModalOpen && event.key !== 'Escape') {
      return
    }

    switch (event.key) {
      // F1 - Aide
      case 'F1':
        event.preventDefault()
        setShowHelp(prev => !prev)
        config.onHelp?.()
        break

      // F2 - Recherche produit
      case 'F2':
        event.preventDefault()
        config.onSearchProduct?.()
        break

      // F3 - Recherche client
      case 'F3':
        event.preventDefault()
        config.onSearchCustomer?.()
        break

      // F4 - Remise ligne
      case 'F4':
        event.preventDefault()
        config.onLineDiscount?.()
        break

      // F5 - Sélectionner/Désélectionner client
      case 'F5':
        event.preventDefault()
        config.onToggleCustomer?.()
        break

      // F6 - Vider panier
      case 'F6':
        event.preventDefault()
        config.onClearCart?.()
        break

      // F7 - Paiement rapide espèces
      case 'F7':
        event.preventDefault()
        config.onQuickCash?.()
        break

      // F8 - Ouvrir paiement
      case 'F8':
        event.preventDefault()
        config.onPayment?.()
        break

      // F9 - Suspendre panier
      case 'F9':
        event.preventDefault()
        config.onSuspendCart?.()
        break

      // F10 - Reprendre panier
      case 'F10':
        event.preventDefault()
        config.onResumeCart?.()
        break

      // F11 - Ouvrir tiroir
      case 'F11':
        event.preventDefault()
        config.onOpenDrawer?.()
        break

      // F12 - Fermer session
      case 'F12':
        event.preventDefault()
        config.onCloseSession?.()
        break

      // + - Augmenter quantité
      case '+':
      case '=': // Sur clavier sans pavé numérique
        if (!isInput) {
          event.preventDefault()
          config.onQuantityIncrease?.()
        }
        break

      // - - Diminuer quantité
      case '-':
        if (!isInput) {
          event.preventDefault()
          config.onQuantityDecrease?.()
        }
        break

      // Delete - Supprimer ligne
      case 'Delete':
      case 'Backspace':
        if (!isInput) {
          event.preventDefault()
          config.onDeleteLine?.()
        }
        break

      // Escape - Annuler / Fermer
      case 'Escape':
        event.preventDefault()
        setShowHelp(false)
        config.onCancel?.()
        break

      // ? - Aide
      case '?':
        if (!isInput) {
          event.preventDefault()
          setShowHelp(prev => !prev)
        }
        break
    }
  }, [config])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Liste des raccourcis pour affichage aide
  const shortcuts: POSKeyboardShortcut[] = [
    { key: 'F1', label: 'F1', description: 'Aide / Raccourcis', action: () => setShowHelp(true), enabled: true },
    { key: 'F2', label: 'F2', description: 'Rechercher un produit', action: () => config.onSearchProduct?.(), enabled: !!config.onSearchProduct },
    { key: 'F3', label: 'F3', description: 'Rechercher un client', action: () => config.onSearchCustomer?.(), enabled: !!config.onSearchCustomer },
    { key: 'F4', label: 'F4', description: 'Remise sur ligne', action: () => config.onLineDiscount?.(), enabled: !!config.onLineDiscount },
    { key: 'F5', label: 'F5', description: 'Sélectionner client', action: () => config.onToggleCustomer?.(), enabled: !!config.onToggleCustomer },
    { key: 'F6', label: 'F6', description: 'Vider le panier', action: () => config.onClearCart?.(), enabled: !!config.onClearCart },
    { key: 'F7', label: 'F7', description: 'Paiement rapide espèces', action: () => config.onQuickCash?.(), enabled: !!config.onQuickCash },
    { key: 'F8', label: 'F8', description: 'Payer', action: () => config.onPayment?.(), enabled: !!config.onPayment },
    { key: 'F9', label: 'F9', description: 'Suspendre panier', action: () => config.onSuspendCart?.(), enabled: !!config.onSuspendCart },
    { key: 'F10', label: 'F10', description: 'Reprendre panier', action: () => config.onResumeCart?.(), enabled: !!config.onResumeCart },
    { key: 'F11', label: 'F11', description: 'Ouvrir tiroir-caisse', action: () => config.onOpenDrawer?.(), enabled: !!config.onOpenDrawer },
    { key: 'F12', label: 'F12', description: 'Fermer session', action: () => config.onCloseSession?.(), enabled: !!config.onCloseSession },
    { key: '+', label: '+', description: 'Augmenter quantité', action: () => config.onQuantityIncrease?.(), enabled: !!config.onQuantityIncrease },
    { key: '-', label: '-', description: 'Diminuer quantité', action: () => config.onQuantityDecrease?.(), enabled: !!config.onQuantityDecrease },
    { key: 'Del', label: 'Suppr', description: 'Supprimer ligne', action: () => config.onDeleteLine?.(), enabled: !!config.onDeleteLine },
    { key: 'Escape', label: 'Échap', description: 'Annuler / Fermer', action: () => config.onCancel?.(), enabled: true },
  ]

  return {
    showHelp,
    setShowHelp,
    shortcuts,
  }
}

/**
 * Hook simplifié pour écouter une touche spécifique
 */
export function useKeyPress(targetKey: string, callback: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        event.preventDefault()
        callback()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [targetKey, callback, enabled])
}
