'use client';

import React from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/common';
import { SearchAutocomplete } from '@/components/common/SearchAutocomplete';
import { useSiteConfig } from '@/lib/config/SiteConfigProvider';
import { DynamicMenu } from '@/components/cms';
import { PromoBar } from './PromoBar';

const Header: React.FC = () => {
  const cart = useCartStore((state) => state.cart);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { config } = useSiteConfig();
  const { brand, shipping, currency } = config;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(query)}`;
    }
  };

  const itemCount = cart?.item_count || 0;

  // Promotional messages for the marquee
  const promoMessages = [
    { text: `Livraison GRATUITE des ${shipping?.freeThreshold || 150} ${currency?.symbol || 'TND'}`, icon: 'truck' as const },
    { text: 'Retours gratuits sous 30 jours', icon: 'gift' as const },
    { text: 'Paiement 100% securise', icon: 'star' as const },
    { text: 'Support client disponible 7j/7', icon: 'clock' as const },
  ];

  return (
    <header className="sticky top-0 z-50">
      {/* Promotional Banner with Marquee */}
      <PromoBar messages={promoMessages} backgroundColor="bg-gray-900" />

      {/* Top Bar - Contact Info */}
      <div className="bg-primary text-white text-sm">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <a
              href={`tel:${brand?.phone?.replace(/\s/g, '') || ''}`}
              className="flex items-center gap-2 hover:text-secondary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="hidden sm:inline">{brand?.phoneFormatted || brand?.phone || '+216 00 000 000'}</span>
            </a>
            <a
              href={`mailto:${brand?.email || 'contact@quelyos.com'}`}
              className="flex items-center gap-2 hover:text-secondary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">{brand?.email || 'contact@quelyos.com'}</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/faq" className="hover:text-secondary transition-colors hidden md:inline">
              Aide
            </Link>
            <Link href="/contact" className="hover:text-secondary transition-colors hidden md:inline">
              Contact
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 lg:gap-8">
            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0 group">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                  <span className="text-white font-bold text-xl">{(brand?.name || 'Quelyos').charAt(0).toUpperCase()}</span>
                </div>
                <div className="hidden sm:block">
                  <span className="text-2xl font-bold text-primary">{brand?.name || 'Quelyos'}</span>
                  <p className="text-xs text-gray-500 -mt-1">Votre boutique en ligne</p>
                </div>
              </div>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl hidden md:block">
              <SearchAutocomplete
                placeholder="Rechercher des produits..."
                onSearch={handleSearch}
                className="w-full"
              />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 lg:gap-4">
              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:flex"
                aria-label="Liste de souhaits"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>

              {/* Account */}
              {isAuthenticated && user ? (
                <Link
                  href="/account"
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium hidden lg:inline">{user.name}</span>
                </Link>
              ) : (
                <Link href="/login" className="hidden sm:block">
                  <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-white">
                    Connexion
                  </Button>
                </Link>
              )}

              {/* Cart */}
              <Link
                href="/cart"
                className="relative flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full transition-colors group"
              >
                <div className="relative">
                  <svg className="w-6 h-6 text-gray-700 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-sm">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium hidden lg:inline">Panier</span>
              </Link>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="mt-4 md:hidden">
            <SearchAutocomplete
              placeholder="Rechercher..."
              onSearch={handleSearch}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white border-t border-gray-100 hidden lg:block">
        <div className="container mx-auto px-4">
          <DynamicMenu
            code="header"
            orientation="horizontal"
            className="flex items-center gap-1 py-2"
            itemClassName="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-all"
            showIcons={false}
            maxDepth={2}
          />
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 lg:hidden shadow-xl animate-slide-in-right">
            <div className="p-4 border-b flex items-center justify-between">
              <span className="font-bold text-lg text-primary">{brand?.name || 'Quelyos'}</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
              {/* User Section */}
              {isAuthenticated && user ? (
                <Link
                  href="/account"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">Mon compte</p>
                  </div>
                </Link>
              ) : (
                <div className="flex gap-2 mb-4">
                  <Link href="/login" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="primary" fullWidth>Connexion</Button>
                  </Link>
                  <Link href="/register" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" fullWidth>Inscription</Button>
                  </Link>
                </div>
              )}

              {/* Navigation Menu */}
              <DynamicMenu
                code="header"
                orientation="vertical"
                className="space-y-1"
                itemClassName="block px-4 py-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-all"
                showIcons={true}
                maxDepth={3}
              />

              {/* Quick Links */}
              <div className="mt-6 pt-6 border-t space-y-1">
                <Link
                  href="/wishlist"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Ma liste de souhaits
                </Link>
                <Link
                  href="/faq"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Aide / FAQ
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Nous contacter
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
export { Header };
