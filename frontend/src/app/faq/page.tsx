'use client';

import { useState } from 'react';
import { useSiteConfig } from '@/lib/config/SiteConfigProvider';
import Link from 'next/link';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function FAQPage() {
  const { config } = useSiteConfig();
  const { brand, shipping, returns } = config;
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const faqItems: FAQItem[] = [
    // Commandes
    {
      category: 'commandes',
      question: 'Comment passer une commande?',
      answer: `Parcourez notre catalogue, ajoutez les produits souhaites a votre panier, puis procedez au paiement. Vous recevrez une confirmation par email des que votre commande sera validee.`,
    },
    {
      category: 'commandes',
      question: 'Comment suivre ma commande?',
      answer: `Connectez-vous a votre compte et accedez a la section "Mes commandes". Vous y trouverez le statut de chaque commande ainsi que le numero de suivi le cas echeant.`,
    },
    {
      category: 'commandes',
      question: 'Puis-je modifier ou annuler ma commande?',
      answer: `Vous pouvez modifier ou annuler votre commande tant qu'elle n'a pas ete expediee. Contactez notre service client le plus rapidement possible.`,
    },
    // Livraison
    {
      category: 'livraison',
      question: 'Quels sont les delais de livraison?',
      answer: `La livraison standard prend entre ${shipping.standardDaysMin} et ${shipping.standardDaysMax} jours ouvrables. La livraison express est disponible en ${shipping.expressDaysMin}-${shipping.expressDaysMax} jours ouvrables.`,
    },
    {
      category: 'livraison',
      question: 'La livraison est-elle gratuite?',
      answer: `Oui, la livraison est gratuite pour toute commande superieure a ${shipping.freeThreshold} ${config.currency.symbol}. En dessous de ce montant, des frais de livraison s'appliquent.`,
    },
    {
      category: 'livraison',
      question: 'Livrez-vous a l\'international?',
      answer: `Actuellement, nous livrons principalement en Tunisie. Pour les livraisons internationales, veuillez nous contacter pour obtenir un devis personnalise.`,
    },
    // Retours
    {
      category: 'retours',
      question: 'Quelle est votre politique de retour?',
      answer: `Vous disposez de ${returns.windowDays} jours apres reception pour retourner un article. Le produit doit etre dans son etat d'origine, non utilise et dans son emballage d'origine.`,
    },
    {
      category: 'retours',
      question: 'Comment effectuer un retour?',
      answer: `Connectez-vous a votre compte, selectionnez la commande concernee et cliquez sur "Demander un retour". Suivez les instructions et vous recevrez une etiquette de retour par email.`,
    },
    {
      category: 'retours',
      question: 'Quand serai-je rembourse?',
      answer: `Le remboursement est effectue dans un delai de ${returns.refundDaysMin} a ${returns.refundDaysMax} jours ouvrables apres reception et verification du produit retourne.`,
    },
    // Paiement
    {
      category: 'paiement',
      question: 'Quels modes de paiement acceptez-vous?',
      answer: `Nous acceptons les cartes bancaires (Visa, Mastercard), PayPal, et le paiement a la livraison selon les regions.`,
    },
    {
      category: 'paiement',
      question: 'Le paiement est-il securise?',
      answer: `Oui, tous les paiements sont securises par cryptage SSL. Vos informations bancaires ne sont jamais stockees sur nos serveurs.`,
    },
    // Compte
    {
      category: 'compte',
      question: 'Comment creer un compte?',
      answer: `Cliquez sur "Mon compte" en haut de page, puis sur "Creer un compte". Remplissez le formulaire avec vos informations et validez.`,
    },
    {
      category: 'compte',
      question: 'J\'ai oublie mon mot de passe, que faire?',
      answer: `Sur la page de connexion, cliquez sur "Mot de passe oublie". Entrez votre email et vous recevrez un lien pour reinitialiser votre mot de passe.`,
    },
  ];

  const categories = [
    { id: 'all', label: 'Toutes' },
    { id: 'commandes', label: 'Commandes' },
    { id: 'livraison', label: 'Livraison' },
    { id: 'retours', label: 'Retours' },
    { id: 'paiement', label: 'Paiement' },
    { id: 'compte', label: 'Compte' },
  ];

  const filteredFAQ = activeCategory === 'all'
    ? faqItems
    : faqItems.filter(item => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setOpenIndex(null);
              }}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {filteredFAQ.map((item, index) => (
            <div key={index} className="border-b border-gray-100 last:border-b-0">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 pr-4">{item.question}</span>
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
                <div className="px-6 pb-5 text-gray-600">
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 bg-gray-100 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Vous n&apos;avez pas trouve votre reponse?
          </h2>
          <p className="text-gray-600 mb-6">
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
