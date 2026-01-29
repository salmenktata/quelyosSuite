'use client';

import { useState, useEffect } from 'react';
import { useSiteConfig } from '@/lib/config/SiteConfigProvider';
import { backendClient } from '@/lib/backend/client';
import Link from 'next/link';
import { logger } from '@/lib/logger';

interface FAQItem {
  id?: number;
  question: string;
  answer: string;
  categoryId?: number | null;
  categoryCode?: string | null;
  categoryName?: string | null;
  isFeatured?: boolean;
}

interface FAQCategory {
  id: number;
  name: string;
  code: string;
  icon?: string;
}

// FAQ par défaut (fallback)
const getDefaultFAQs = (config: any): FAQItem[] => {
  const { shipping, returns } = config;
  return [
    {
      categoryCode: 'commandes',
      categoryName: 'Commandes',
      question: 'Comment passer une commande?',
      answer: 'Parcourez notre catalogue, ajoutez les produits souhaites a votre panier, puis procedez au paiement. Vous recevrez une confirmation par email des que votre commande sera validee.',
    },
    {
      categoryCode: 'commandes',
      categoryName: 'Commandes',
      question: 'Comment suivre ma commande?',
      answer: 'Connectez-vous a votre compte et accedez a la section "Mes commandes". Vous y trouverez le statut de chaque commande ainsi que le numero de suivi le cas echeant.',
    },
    {
      categoryCode: 'livraison',
      categoryName: 'Livraison',
      question: 'Quels sont les delais de livraison?',
      answer: `La livraison standard prend entre ${shipping.standardDaysMin} et ${shipping.standardDaysMax} jours ouvrables. La livraison express est disponible en ${shipping.expressDaysMin}-${shipping.expressDaysMax} jours ouvrables.`,
    },
    {
      categoryCode: 'livraison',
      categoryName: 'Livraison',
      question: 'La livraison est-elle gratuite?',
      answer: `Oui, la livraison est gratuite pour toute commande superieure a ${shipping.freeThreshold} ${config.currency.symbol}. En dessous de ce montant, des frais de livraison s'appliquent.`,
    },
    {
      categoryCode: 'retours',
      categoryName: 'Retours',
      question: 'Quelle est votre politique de retour?',
      answer: `Vous disposez de ${returns.windowDays} jours apres reception pour retourner un article. Le produit doit etre dans son etat d'origine, non utilise et dans son emballage d'origine.`,
    },
    {
      categoryCode: 'retours',
      categoryName: 'Retours',
      question: 'Quand serai-je rembourse?',
      answer: `Le remboursement est effectue dans un delai de ${returns.refundDaysMin} a ${returns.refundDaysMax} jours ouvrables apres reception et verification du produit retourne.`,
    },
    {
      categoryCode: 'paiement',
      categoryName: 'Paiement',
      question: 'Quels modes de paiement acceptez-vous?',
      answer: 'Nous acceptons les cartes bancaires (Visa, Mastercard), PayPal, et le paiement a la livraison selon les regions.',
    },
    {
      categoryCode: 'paiement',
      categoryName: 'Paiement',
      question: 'Le paiement est-il securise?',
      answer: 'Oui, tous les paiements sont securises par cryptage SSL. Vos informations bancaires ne sont jamais stockees sur nos serveurs.',
    },
  ];
};

const defaultCategories: FAQCategory[] = [
  { id: 1, name: 'Commandes', code: 'commandes' },
  { id: 2, name: 'Livraison', code: 'livraison' },
  { id: 3, name: 'Retours', code: 'retours' },
  { id: 4, name: 'Paiement', code: 'paiement' },
];

export default function FAQPage() {
  const { config } = useSiteConfig();
  const { brand } = config;
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFAQs = async () => {
      try {
        const response = await backendClient.getPublicFAQs();
        if (response.success && response.data) {
          const { categories: apiCategories, faqs } = response.data;

          if (faqs && faqs.length > 0) {
            setFaqItems(faqs);
            setCategories(apiCategories || []);
          } else {
            // Fallback aux données par défaut
            setFaqItems(getDefaultFAQs(config));
            setCategories(defaultCategories);
          }
        } else {
          // Fallback aux données par défaut
          setFaqItems(getDefaultFAQs(config));
          setCategories(defaultCategories);
        }
      } catch (error) {
        logger.error('Erreur chargement FAQ:', error);
        // Fallback aux données par défaut
        setFaqItems(getDefaultFAQs(config));
        setCategories(defaultCategories);
      } finally {
        setIsLoading(false);
      }
    };

    loadFAQs();
  }, [config]);

  const filteredFAQ = activeCategory === 'all'
    ? faqItems
    : faqItems.filter(item => item.categoryCode === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Questions Frequentes</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Trouvez rapidement les reponses a vos questions
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Categories */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <button
            onClick={() => {
              setActiveCategory('all');
              setOpenIndex(null);
            }}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              activeCategory === 'all'
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-sm'
            }`}
          >
            Toutes
          </button>
          {categories.map((cat) => (
            <button
              key={cat.code}
              onClick={() => {
                setActiveCategory(cat.code);
                setOpenIndex(null);
              }}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                activeCategory === cat.code
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 shadow-sm'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        {isLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Chargement des FAQ...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            {filteredFAQ.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Aucune question dans cette categorie
              </div>
            ) : (
              filteredFAQ.map((item, index) => (
                <div key={item.id || index} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1 pr-4">
                      <span className="font-semibold text-gray-900 dark:text-white">{item.question}</span>
                      {item.isFeatured && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                          Populaire
                        </span>
                      )}
                    </div>
                    <svg
                      className={`w-5 h-5 text-primary flex-shrink-0 transition-transform ${
                        openIndex === index ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openIndex === index ? 'max-h-96' : 'max-h-0'
                    }`}
                  >
                    <div className="px-6 pb-5 text-gray-600 dark:text-gray-300">
                      {item.answer}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-12 bg-gray-100 dark:bg-gray-700 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Vous n&apos;avez pas trouve votre reponse?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Notre equipe est la pour vous aider
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
            >
              Nous contacter
            </Link>
            {brand.email && (
              <a
                href={`mailto:${brand.email}`}
                className="px-8 py-3 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary/5 transition-colors"
              >
                {brand.email}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
