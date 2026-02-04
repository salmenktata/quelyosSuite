/**
 * CheckoutPreviewEnhanced - Preview amélioré du processus checkout
 *
 * Affiche une simulation complète du checkout avec :
 * - Device toggle (mobile/tablet/desktop)
 * - Stepper avec progression
 * - Formulaires simulés pour chaque étape
 * - Preview temps réel des changements de config
 *
 * @module components/store
 */

import { PreviewPanel, DeviceToggle, LiveIndicator } from '@quelyos/preview-components'
import { useState } from 'react'
import clsx from 'clsx'
import { ShoppingCart, Package, CreditCard, CheckCircle } from 'lucide-react'

interface CheckoutStep {
  number: number
  label: string
  icon: string
  message?: string
}

interface CheckoutPreviewEnhancedProps {
  steps: CheckoutStep[]
  currentStep: number
  showProgressBar: boolean
  onStepChange: (step: number) => void
}

export function CheckoutPreviewEnhanced({
  steps,
  currentStep,
  showProgressBar,
  onStepChange,
}: CheckoutPreviewEnhancedProps) {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  const getStepClass = (stepNum: number) => {
    if (stepNum < currentStep) return 'bg-green-500 text-white'
    if (stepNum === currentStep) return 'bg-indigo-600 text-white ring-4 ring-indigo-600/20'
    return 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
  }

  const getLineWidth = (stepNum: number) => {
    return stepNum < currentStep ? 'w-full' : 'w-0'
  }

  // Formulaires simulés pour chaque étape
  const renderStepContent = () => {
    const currentStepData = steps.find((s) => s.number === currentStep)

    switch (currentStep) {
      case 1: // Panier
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Votre panier
            </h2>
            {currentStepData?.message && (
              <p className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                {currentStepData.message}
              </p>
            )}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Produit exemple x2</span>
                <span className="font-medium text-gray-900 dark:text-white">49,90 €</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-semibold">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-gray-900 dark:text-white">49,90 €</span>
              </div>
            </div>
          </div>
        )

      case 2: // Livraison
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5" />
              Livraison
            </h2>
            {currentStepData?.message && (
              <p className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                {currentStepData.message}
              </p>
            )}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nom complet"
                disabled
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Adresse"
                disabled
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Code postal"
                  disabled
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Ville"
                  disabled
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )

      case 3: // Paiement (si livraison active) ou étape 2 (si pas de livraison)
      case 4: // Paiement (si livraison inactive)
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Paiement
            </h2>
            {currentStepData?.message && (
              <p className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                {currentStepData.message}
              </p>
            )}
            <div className="space-y-3">
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <input type="radio" disabled className="w-4 h-4" checked />
                  <span className="text-gray-900 dark:text-white">Carte bancaire</span>
                </div>
                <input
                  type="text"
                  placeholder="Numéro de carte"
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )

      default: // Confirmation
        return (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Commande confirmée !
            </h2>
            {currentStepData?.message && (
              <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded">
                {currentStepData.message}
              </p>
            )}
            <p className="text-gray-600 dark:text-gray-300">
              Merci pour votre commande. Vous recevrez un email de confirmation sous peu.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Header avec device toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Preview Checkout
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Simulation du processus de commande
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LiveIndicator />
          <DeviceToggle device={device} onDeviceChange={setDevice} />
        </div>
      </div>

      {/* Boutons de navigation étapes */}
      <div className="flex gap-2">
        {steps.map((step) => (
          <button
            key={step.number}
            onClick={() => onStepChange(step.number)}
            className={clsx(
              'px-3 py-1 rounded text-sm font-medium transition-colors',
              currentStep === step.number
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
          >
            Étape {step.number}
          </button>
        ))}
      </div>

      {/* Preview Panel */}
      <PreviewPanel device={device}>
        <div className="bg-white dark:bg-gray-900 min-h-screen p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            {/* Stepper */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={clsx(
                          'w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all',
                          getStepClass(step.number)
                        )}
                      >
                        {step.number < currentStep ? '✓' : step.icon}
                      </div>
                      <span
                        className={clsx(
                          'mt-2 text-xs md:text-sm font-medium transition-colors',
                          step.number <= currentStep
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="flex-1 h-1 mx-4 -mt-8">
                        <div className="h-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={clsx(
                              'h-full bg-green-500 transition-all duration-500',
                              getLineWidth(step.number)
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              {showProgressBar && (
                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>
                      Étape {currentStep} sur {steps.length}
                    </span>
                    <span>{Math.round((currentStep / steps.length) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-500"
                      style={{ width: `${(currentStep / steps.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Contenu de l'étape */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              {renderStepContent()}

              {/* Boutons navigation */}
              <div className="mt-6 flex justify-between">
                <button
                  disabled={currentStep === 1}
                  onClick={() => onStepChange(Math.max(1, currentStep - 1))}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Retour
                </button>
                <button
                  disabled={currentStep === steps.length}
                  onClick={() => onStepChange(Math.min(steps.length, currentStep + 1))}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {currentStep === steps.length - 1 ? 'Confirmer' : 'Continuer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </PreviewPanel>

      {/* Notice */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Preview interactif</strong> : Naviguez entre les étapes pour voir le
          processus complet de checkout tel que vos clients le verront.
        </p>
      </div>
    </div>
  )
}
