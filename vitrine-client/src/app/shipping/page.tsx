'use client';

import { useSiteConfig } from '@/lib/config/SiteConfigProvider';
import Link from 'next/link';
import { StaticPageContent } from '@/components/static/StaticPageContent';

function ShippingFallback() {
  const { config } = useSiteConfig();
  const { brand: _brand, shipping, currency } = config;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="bg-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Livraison</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Tout ce que vous devez savoir sur nos options de livraison
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Options de livraison */}
        <section className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Options de livraison</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Livraison Standard */}
            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-primary transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Livraison Standard</h3>
                  <p className="text-sm text-gray-500">{shipping.standardDaysMin}-{shipping.standardDaysMax} jours ouvrables</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Notre option de livraison economique, ideale pour les commandes non urgentes.
              </p>
            </div>

            {/* Livraison Express */}
            <div className="border-2 border-primary rounded-xl p-6 relative">
              <div className="absolute -top-3 right-4 bg-primary text-white text-xs px-3 py-1 rounded-full font-semibold">
                Rapide
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Livraison Express</h3>
                  <p className="text-sm text-gray-500">{shipping.expressDaysMin}-{shipping.expressDaysMax} jours ouvrables</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Pour recevoir votre commande au plus vite. Parfait pour les cadeaux de derniere minute!
              </p>
            </div>
          </div>
        </section>

        {/* Livraison gratuite */}
        <section className="bg-gradient-to-r from-primary to-primary-light rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Livraison Gratuite</h2>
              <p className="opacity-90">
                Profitez de la livraison gratuite pour toute commande superieure a{' '}
                <span className="font-bold text-xl">{shipping.freeThreshold} {currency.symbol}</span>
              </p>
            </div>
          </div>
        </section>

        {/* Zones de livraison */}
        <section className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Zones de livraison</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-semibold text-gray-900">Tunisie</h3>
                <p className="text-sm text-gray-600">Livraison disponible dans toutes les regions</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-xl">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-gray-900">International</h3>
                <p className="text-sm text-gray-600">Contactez-nous pour un devis personnalise</p>
              </div>
            </div>
          </div>
        </section>

        {/* Suivi de commande */}
        <section className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Suivi de commande</h2>

          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1">
              <p className="text-gray-600 mb-4">
                Une fois votre commande expediee, vous recevrez un email avec un numero de suivi.
                Vous pourrez suivre votre colis en temps reel depuis votre espace client.
              </p>
              <Link
                href="/account/orders"
                className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
              >
                Acceder a mes commandes
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center">
              <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-gray-100 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Des questions sur la livraison?</h2>
          <p className="text-gray-600 mb-6">Notre equipe est disponible pour vous aider</p>
          <Link
            href="/contact"
            className="inline-block px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
          >
            Nous contacter
          </Link>
        </section>
      </div>
    </div>
  );
}


export default function ShippingPage() {
  return <StaticPageContent slug="shipping" fallback={<ShippingFallback />} />;
}
