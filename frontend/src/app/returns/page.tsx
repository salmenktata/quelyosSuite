'use client';

import { useSiteConfig } from '@/lib/config/SiteConfigProvider';
import Link from 'next/link';

export default function ReturnsPage() {
  const { config } = useSiteConfig();
  const { brand, returns } = config;

  const steps = [
    {
      number: 1,
      title: 'Demande de retour',
      description: 'Connectez-vous a votre compte et selectionnez la commande concernee. Cliquez sur "Demander un retour" et indiquez le motif.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      number: 2,
      title: 'Preparation du colis',
      description: 'Emballez soigneusement l\'article dans son emballage d\'origine si possible. Joignez le bon de retour recu par email.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      number: 3,
      title: 'Expedition',
      description: 'Deposez votre colis au point de collecte indique ou attendez le passage du transporteur selon l\'option choisie.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
        </svg>
      ),
    },
    {
      number: 4,
      title: 'Remboursement',
      description: `Une fois le retour recu et verifie, votre remboursement sera effectue sous ${returns.refundDaysMin}-${returns.refundDaysMax} jours ouvrables.`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Retours et Remboursements</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Une politique de retour simple et transparente
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Delai de retour */}
        <section className="bg-gradient-to-r from-primary to-primary-light rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-4xl font-bold">{returns.windowDays}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Jours pour retourner</h2>
              <p className="opacity-90">
                Vous disposez de {returns.windowDays} jours apres reception de votre commande
                pour effectuer un retour. Aucune question posee!
              </p>
            </div>
          </div>
        </section>

        {/* Conditions de retour */}
        <section className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Conditions de retour</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Article dans son etat d&apos;origine</h3>
                <p className="text-gray-600 text-sm">Le produit ne doit pas avoir ete utilise, lave ou endommage</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Emballage d&apos;origine</h3>
                <p className="text-gray-600 text-sm">Conservez l&apos;emballage et les etiquettes d&apos;origine si possible</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Accessoires inclus</h3>
                <p className="text-gray-600 text-sm">Tous les accessoires et documents fournis doivent etre retournes</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Articles non retournables</h3>
                <p className="text-gray-600 text-sm">Produits personnalises, articles d&apos;hygiene, sous-vetements</p>
              </div>
            </div>
          </div>
        </section>

        {/* Etapes du retour */}
        <section className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Comment effectuer un retour?</h2>

          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={step.number} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-0.5 h-full bg-primary/20 my-2" />
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-primary">{step.icon}</span>
                    <h3 className="font-bold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Garantie */}
        <section className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Garantie {returns.warrantyYears} ans
          </h2>
          <p className="text-gray-600">
            Tous nos produits beneficient d&apos;une garantie de {returns.warrantyYears} an(s) contre les defauts
            de fabrication. En cas de probleme, contactez notre service client avec votre preuve d&apos;achat.
          </p>
        </section>

        {/* Contact */}
        <section className="bg-gray-100 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Besoin d&apos;aide?</h2>
          <p className="text-gray-600 mb-6">Notre equipe est la pour vous accompagner</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
            >
              Nous contacter
            </Link>
            <Link
              href="/account/orders"
              className="px-8 py-3 border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary/5 transition-colors"
            >
              Mes commandes
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
