'use client';

import React from 'react';

interface CheckoutStepperProps {
  currentStep: number;
}

const steps = [
  { number: 1, label: 'Panier', icon: '🛒' },
  { number: 2, label: 'Livraison', icon: '📦' },
  { number: 3, label: 'Paiement', icon: '💳' },
  { number: 4, label: 'Confirmation', icon: '✓' },
];

const CheckoutStepper: React.FC<CheckoutStepperProps> = ({ currentStep }) => {
  const getStepClass = (stepNum: number) => {
    if (stepNum < currentStep) return 'bg-green-500 text-white';
    if (stepNum === currentStep) return 'bg-[#01613a] text-white ring-4 ring-[#01613a]/20';
    return 'bg-gray-200 text-gray-500';
  };

  const getLineWidth = (stepNum: number) => {
    return stepNum < currentStep ? 'w-full' : 'w-0';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex flex-col items-center flex-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all ${getStepClass(step.number)}`}>
                {step.number < currentStep ? '✓' : step.icon}
              </div>
              <span className={`mt-2 text-sm font-medium transition-colors ${step.number <= currentStep ? 'text-gray-900' : 'text-gray-500'}`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 mx-4 -mt-8">
                <div className="h-full bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full bg-green-500 transition-all duration-500 ${getLineWidth(step.number)}`} />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="mt-6 md:hidden">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Étape {currentStep} sur {steps.length}</span>
          <span>{Math.round((currentStep / steps.length) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full bg-[#01613a] transition-all duration-500`} style={{ width: `${(currentStep / steps.length) * 100}%` }} />
        </div>
      </div>
    </div>
  );
};

export default CheckoutStepper;
