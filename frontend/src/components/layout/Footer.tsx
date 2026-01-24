'use client';

import React from 'react';
import Link from 'next/link';
import { useSiteConfig } from '@/lib/config/SiteConfigProvider';
import { DynamicMenu } from '@/components/cms';

// Trust badge icons
const TruckIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const HeadphonesIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const Footer: React.FC = () => {
  const { config } = useSiteConfig();
  const { brand, social, shipping, currency } = config;
  const [email, setEmail] = React.useState('');
  const [isSubscribing, setIsSubscribing] = React.useState(false);
  const [subscribeMessage, setSubscribeMessage] = React.useState('');

  const year = new Date().getFullYear();

  const trustBadges = [
    { icon: TruckIcon, title: 'Livraison gratuite', subtitle: `Des ${shipping.freeThreshold} ${currency.symbol}` },
    { icon: ShieldIcon, title: 'Paiement securise', subtitle: '100% protege' },
    { icon: RefreshIcon, title: 'Retour facile', subtitle: '30 jours' },
    { icon: HeadphonesIcon, title: 'Support 7j/7', subtitle: 'A votre service' },
  ];

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubscribing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSubscribeMessage('Merci pour votre inscription !');
    setEmail('');
    setIsSubscribing(false);
    setTimeout(() => setSubscribeMessage(''), 3000);
  };

  return (
    <>
      {/* Trust Badges Section - BEFORE Footer with light background */}
      <section className="bg-gradient-to-b from-white to-gray-50 border-t border-gray-200 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {trustBadges.map((badge, index) => (
              <div key={index} className="flex items-center gap-4 group p-4 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                  <div className="text-white">
                    <badge.icon />
                  </div>
                </div>
                <div>
                  <p className="text-gray-900 font-bold text-sm">{badge.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{badge.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Footer - Dark background */}
      <footer className="bg-gray-900 text-gray-300">
        {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand & Social */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 mb-4 group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-primary/30 transition-shadow">
                <span className="text-white font-bold text-xl">{brand.name.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-2xl font-bold text-white">{brand.name}</span>
            </Link>
            <p className="text-sm mb-6 text-gray-400 max-w-sm leading-relaxed">
              {brand.description}
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {social.facebook && (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary hover:scale-110 transition-all"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              {social.instagram && (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-600 hover:scale-110 transition-all"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                  </svg>
                </a>
              )}
              {social.twitter && (
                <a
                  href={social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-black hover:scale-110 transition-all"
                  aria-label="X (Twitter)"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {social.youtube && (
                <a
                  href={social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-all"
                  aria-label="YouTube"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              )}
              {brand.whatsapp && (
                <a
                  href={`https://wa.me/${brand.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-500 hover:scale-110 transition-all"
                  aria-label="WhatsApp"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Liens Rapides</h3>
            <DynamicMenu
              code="footer_quick"
              orientation="vertical"
              className="space-y-2 text-sm"
              itemClassName="text-gray-400 hover:text-primary transition-colors block py-1"
              showIcons={false}
              maxDepth={1}
            />
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Service Client</h3>
            <DynamicMenu
              code="footer_service"
              orientation="vertical"
              className="space-y-2 text-sm"
              itemClassName="text-gray-400 hover:text-primary transition-colors block py-1"
              showIcons={false}
              maxDepth={1}
            />
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Newsletter</h3>
            <p className="text-sm mb-4 text-gray-400">
              Inscrivez-vous pour recevoir nos offres exclusives et nouveautes
            </p>
            <form onSubmit={handleNewsletterSubmit} className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre email"
                className="w-full px-4 py-3 pr-24 rounded-full bg-gray-800 border border-gray-700 focus:outline-none focus:border-primary text-sm text-white placeholder-gray-500 transition-colors"
                required
              />
              <button
                type="submit"
                disabled={isSubscribing}
                className="absolute right-1 top-1 bottom-1 px-5 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isSubscribing ? '...' : 'OK'}
              </button>
            </form>
            {subscribeMessage && (
              <p className="text-green-400 text-sm mt-2">{subscribeMessage}</p>
            )}

            {/* Contact Info */}
            <div className="mt-6 space-y-2 text-sm">
              <a
                href={`tel:${brand.phone.replace(/\s/g, '')}`}
                className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {brand.phoneFormatted || brand.phone}
              </a>
              <a
                href={`mailto:${brand.email}`}
                className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {brand.email}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <p className="text-sm text-gray-500">
              &copy; {year} {brand.name}. Tous droits reserves.
            </p>

            {/* Payment Methods */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 mr-2">Paiement securise:</span>
              <div className="flex gap-2">
                <div className="bg-white/10 px-3 py-1.5 rounded-lg">
                  <img src="/visa.svg" alt="Visa" className="h-5" />
                </div>
                <div className="bg-white/10 px-3 py-1.5 rounded-lg">
                  <img src="/mastercard.svg" alt="Mastercard" className="h-5" />
                </div>
                <div className="bg-white/10 px-3 py-1.5 rounded-lg">
                  <img src="/paypal.svg" alt="PayPal" className="h-5" />
                </div>
              </div>
            </div>

            {/* Legal Links */}
            <div className="flex gap-4 text-xs text-gray-500">
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Politique de confidentialite
              </Link>
              <Link href="/terms" className="hover:text-primary transition-colors">
                Conditions d&apos;utilisation
              </Link>
            </div>
          </div>
        </div>
      </div>
      </footer>
    </>
  );
};

export default Footer;
export { Footer };
