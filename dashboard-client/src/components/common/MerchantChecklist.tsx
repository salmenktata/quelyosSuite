/**
 * MerchantChecklist - Checklist Onboarding Commerçant
 *
 * Composant guidant les nouveaux commerçants dans la configuration
 * initiale de leur boutique en ligne (5 étapes ~30min).
 *
 * Features :
 * - Tracking progression localStorage
 * - Progress bar visuelle
 * - Links directs vers pages configuration
 * - Celebration confetti à la fin
 * - Bouton "Voir ma boutique" après complétion
 *
 * @module components/common
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, Rocket, Store, Package, Truck, CreditCard, Eye } from 'lucide-react'
import { STORAGE_KEYS, getAppUrl } from '@quelyos/config'
import confetti from 'canvas-confetti'
import { Button } from './Button'

interface ChecklistStep {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  link: string
  checkFunction?: () => boolean
}

const CHECKLIST_STEPS: ChecklistStep[] = [
  {
    id: 'brand',
    label: 'Configurer l\'identité de la boutique',
    description: 'Nom, logo, couleurs et informations de contact',
    icon: Store,
    link: '/store/settings/brand',
  },
  {
    id: 'product',
    label: 'Ajouter le premier produit',
    description: 'Créer ou importer votre premier produit',
    icon: Package,
    link: '/store/catalog/products',
  },
  {
    id: 'shipping',
    label: 'Configurer les méthodes de livraison',
    description: 'Zones de livraison, tarifs et délais',
    icon: Truck,
    link: '/store/settings/shipping',
  },
  {
    id: 'payment',
    label: 'Configurer les méthodes de paiement',
    description: 'Activer les moyens de paiement pour vos clients',
    icon: CreditCard,
    link: '/store/settings/payment-methods',
  },
  {
    id: 'publish',
    label: 'Publier la boutique',
    description: 'Rendre votre boutique accessible au public',
    icon: Rocket,
    link: '/store/settings',
  },
]

export interface MerchantChecklistProps {
  /** Callback appelé quand checklist complétée */
  onComplete?: () => void
  /** Forcer l'affichage même si déjà complété */
  forceShow?: boolean
  /** Classe CSS additionnelle */
  className?: string
}

export function MerchantChecklist({
  onComplete,
  forceShow = false,
  className = '',
}: MerchantChecklistProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [isCompleted, setIsCompleted] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  // Charger état depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED)
    if (stored) {
      try {
        const data = JSON.parse(stored)
        if (data.completed) {
          setIsCompleted(true)
          if (!forceShow) {
            setIsVisible(false)
          }
        }
        if (data.steps && Array.isArray(data.steps)) {
          setCompletedSteps(new Set(data.steps))
        }
      } catch (_error) {
        // Ignorer erreur parsing
      }
    }
  }, [forceShow])

  // Sauvegarder état dans localStorage
  useEffect(() => {
    const data = {
      completed: isCompleted,
      steps: Array.from(completedSteps),
      lastUpdated: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, JSON.stringify(data))
  }, [completedSteps, isCompleted])

  // Vérifier complétion
  useEffect(() => {
    if (completedSteps.size === CHECKLIST_STEPS.length && !isCompleted) {
      setIsCompleted(true)
      triggerConfetti()
      onComplete?.()
    }
  }, [completedSteps, isCompleted, onComplete])

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(stepId)) {
        next.delete(stepId)
      } else {
        next.add(stepId)
      }
      return next
    })
  }

  const progress = Math.round((completedSteps.size / CHECKLIST_STEPS.length) * 100)

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  const handleViewStore = () => {
    const ecommerceUrl = getAppUrl('ecommerce', import.meta.env.MODE as 'development' | 'production')
    window.open(ecommerceUrl, '_blank')
  }

  if (!isVisible) {
    return null
  }

  return (
    <div
      className={`rounded-lg border border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Configuration de votre boutique
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isCompleted
                ? '🎉 Félicitations ! Votre boutique est prête'
                : `${completedSteps.size}/${CHECKLIST_STEPS.length} étapes complétées`}
            </p>
          </div>
        </div>
        {!isCompleted && (
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progression
          </span>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
            {progress}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-3 mb-6">
        {CHECKLIST_STEPS.map((step, index) => {
          const Icon = step.icon
          const isStepCompleted = completedSteps.has(step.id)

          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                isStepCompleted
                  ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleStep(step.id)}
                className="mt-0.5 flex-shrink-0 focus:outline-none"
              >
                {isStepCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400 dark:text-gray-600" />
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Étape {index + 1}
                  </span>
                </div>
                <Link
                  to={step.link}
                  className={`font-medium hover:underline ${
                    isStepCompleted
                      ? 'text-gray-700 dark:text-gray-300 line-through'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {step.label}
                </Link>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {step.description}
                </p>
              </div>

              {/* Action Link */}
              {!isStepCompleted && (
                <Link to={step.link}>
                  <Button variant="ghost" size="sm">
                    Configurer
                  </Button>
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {/* Success Message + Action Button */}
      {isCompleted && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Configuration terminée !
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Votre boutique est prête à recevoir vos premiers clients
              </p>
            </div>
          </div>
          <Button
            onClick={handleViewStore}
            variant="primary"
            size="md"
            className="w-full"
          >
            <Eye className="w-4 h-4 mr-2" />
            🎉 Voir ma boutique en ligne
          </Button>
        </div>
      )}

      {/* Info Notice */}
      {!isCompleted && (
        <div className="mt-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>Temps estimé</strong> : Environ 30 minutes pour configurer votre boutique
            et commencer à vendre en ligne.
          </p>
        </div>
      )}
    </div>
  )
}
