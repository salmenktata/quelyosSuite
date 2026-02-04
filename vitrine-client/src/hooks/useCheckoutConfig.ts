import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'

export interface CheckoutStep {
  number: number
  label: string
  message: string
  icon: string
}

export interface CheckoutConfig {
  steps: CheckoutStep[]
  show_progress_bar: boolean
  allow_guest_checkout: boolean
  require_phone: boolean
  require_company: boolean
}

export function useCheckoutConfig() {
  const [config, setConfig] = useState<CheckoutConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/checkout-config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setConfig(data.config)
        } else {
          // Fallback configuration par défaut
          setConfig({
            steps: [
              { number: 1, label: 'Panier', message: '', icon: '🛒' },
              { number: 2, label: 'Livraison', message: '', icon: '📦' },
              { number: 3, label: 'Paiement', message: '', icon: '💳' },
              { number: 4, label: 'Confirmation', message: '', icon: '✓' },
            ],
            show_progress_bar: true,
            allow_guest_checkout: false,
            require_phone: true,
            require_company: false,
          })
        }
      })
      .catch((err) => {
        logger.error('Failed to load checkout config:', err)
        // Fallback configuration par défaut
        setConfig({
          steps: [
            { number: 1, label: 'Panier', message: '', icon: '🛒' },
            { number: 2, label: 'Livraison', message: '', icon: '📦' },
            { number: 3, label: 'Paiement', message: '', icon: '💳' },
            { number: 4, label: 'Confirmation', message: '', icon: '✓' },
          ],
          show_progress_bar: true,
          allow_guest_checkout: false,
          require_phone: true,
          require_company: false,
        })
        setError('Erreur de chargement')
      })
      .finally(() => setLoading(false))
  }, [])

  return { config, loading, error }
}
