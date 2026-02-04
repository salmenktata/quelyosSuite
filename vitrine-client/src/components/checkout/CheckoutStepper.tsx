'use client'

import React from 'react'
import { useCheckoutConfig } from '@/hooks/useCheckoutConfig'

interface CheckoutStepperProps {
  currentStep: number
}

export const CheckoutStepper: React.FC<CheckoutStepperProps> = ({ currentStep }) => {
  const { config, loading } = useCheckoutConfig()

  if (loading || !config) {
    // Skeleton loader pendant le chargement
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8 animate-pulse">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center flex-1">
              <div className="w-12 h-12 rounded-full bg-gray-200" />
              <div className="mt-2 h-4 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const steps = config.steps

  const getStepClass = (stepNum: number) => {
    if (stepNum < currentStep) return 'bg-green-500 text-white'
    if (stepNum === currentStep) return 'bg-primary text-white ring-4 ring-primary/20'
    return 'bg-gray-200 text-gray-500'
  }

  const getLineWidth = (stepNum: number) => {
    return stepNum < currentStep ? 'w-full' : 'w-0'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all ${getStepClass(step.number)}`}
              >
                {step.number < currentStep ? '✓' : step.icon}
              </div>
              <span
                className={`mt-2 text-sm font-medium transition-colors ${step.number <= currentStep ? 'text-gray-900' : 'text-gray-500'}`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 mx-4 -mt-8">
                <div className="h-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-green-500 transition-all duration-500 ${getLineWidth(step.number)}`}
                  />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {config.show_progress_bar && (
        <div className="mt-6 md:hidden">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>
              Étape {currentStep} sur {steps.length}
            </span>
            <span>{Math.round((currentStep / steps.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default CheckoutStepper
