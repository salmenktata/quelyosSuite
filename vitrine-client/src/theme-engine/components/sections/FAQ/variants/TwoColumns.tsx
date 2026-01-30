'use client';

import type { ThemeContextValue } from '../../../../engine/types';
import { HelpCircle } from 'lucide-react';

interface TwoColumnsProps {
  config?: Record<string, unknown>;
  className?: string;
  theme: ThemeContextValue;
}

interface FAQItem {
  question: string;
  answer: string;
}

export default function TwoColumns({ config, className = '', theme }: TwoColumnsProps) {
  const title = (config?.title as string) || 'Aide & Support';
  const subtitle = (config?.subtitle as string) || 'Nous sommes là pour vous aider';

  // Mock data
  const faqs: FAQItem[] = (config?.faqs as FAQItem[]) || [
    {
      question: 'Livraison gratuite ?',
      answer: 'Oui, à partir de 100 TND d\'achat en Tunisie.',
    },
    {
      question: 'Retours acceptés ?',
      answer: 'Sous 14 jours, produits non utilisés.',
    },
    {
      question: 'Paiement sécurisé ?',
      answer: 'Cryptage SSL, données bancaires protégées.',
    },
    {
      question: 'Garantie produits ?',
      answer: '2 ans sur tous nos produits.',
    },
    {
      question: 'Support client ?',
      answer: 'Disponible 7j/7 par chat, email, téléphone.',
    },
    {
      question: 'Programme fidélité ?',
      answer: 'Points cumulables sur chaque achat.',
    },
  ];

  return (
    <section className={`py-16 md:py-24 bg-gray-50 dark:bg-gray-800 ${className}`}>
      <div
        className="container mx-auto px-4"
        style={{ maxWidth: theme.spacing.containerWidth }}
      >
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white"
            style={{ fontFamily: `var(--theme-font-headings)` }}
          >
            {title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${theme.colors.primary}20` }}
                >
                  <HelpCircle size={20} style={{ color: theme.colors.primary }} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Banner */}
        <div
          className="mt-12 p-8 rounded-lg text-center"
          style={{ backgroundColor: `${theme.colors.primary}10` }}
        >
          <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Besoin d&apos;aide supplémentaire ?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Notre équipe est disponible pour répondre à toutes vos questions
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-3 rounded-lg font-semibold transition-all hover:scale-105"
            style={{
              backgroundColor: theme.colors.primary,
              color: '#ffffff',
            }}
          >
            Nous contacter
          </a>
        </div>
      </div>
    </section>
  );
}
