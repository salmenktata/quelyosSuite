/**
 * Stepper pour le processus de checkout
 */

'use client';

import React from 'react';
import Link from 'next/link';

interface Step {
  number: number;
  title: string;
  path: string;
}

interface CheckoutStepperProps {
  currentStep: number;
}

const steps: Step[] = [
  { number: 1, title: 'Panier', path: '/cart' },
  { number: 2, title: 'Livraison', path: '/checkout/shipping' },
  { number: 3, title: 'Paiement', path: '/checkout/payment' },
];

export function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            {/* Step */}
            <div className="flex items-center">
              <div className="flex flex-col items-center">
                {/* Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep >= step.number
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {currentStep > step.number ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                {/* Label */}
                <span
                  className={`mt-2 text-sm font-medium ${
                    currentStep >= step.number ? 'text-primary' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </span>
              </div>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-4 rounded transition-all ${
                  currentStep > step.number ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
