'use client';

import React from 'react';

export interface Benefit {
  id: number;
  title: string;
  subtitle?: string;
  icon: 'creditcard' | 'delivery' | 'shield' | 'support';
}

const iconMap: Record<string, React.ReactNode> = {
  delivery: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  shield: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  support: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  creditcard: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
};

const defaultBenefits: Benefit[] = [
  { id: 1, title: 'Livraison rapide', subtitle: 'Gratuite des 200 TND - Partout en Tunisie', icon: 'delivery' },
  { id: 2, title: 'Paiement securise', subtitle: '100% securise en ligne - A la livraison', icon: 'shield' },
  { id: 3, title: 'Service client', subtitle: 'Equipe a votre ecoute - Satisfait ou rembourse', icon: 'support' },
];

interface BenefitsSectionProps {
  benefits?: Benefit[];
}

export function BenefitsSection({ benefits }: BenefitsSectionProps) {
  const items = benefits && benefits.length > 0 ? benefits : defaultBenefits;

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-16">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid md:grid-cols-3 gap-6">
          {items.map((benefit) => (
            <div
              key={benefit.id}
              className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-primary/20 dark:hover:border-primary/40 hover:-translate-y-1"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-14 h-14 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  {iconMap[benefit.icon] || iconMap.delivery}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                    {benefit.title}
                  </h3>
                  {benefit.subtitle && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {benefit.subtitle.replace(' - ', '\n')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
