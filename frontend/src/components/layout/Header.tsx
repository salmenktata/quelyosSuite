/**
 * Header - Style Le Sportif
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

export function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { cart, fetchCart, getCartCount } = useCartStore();
  const cartCount = getCartCount();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Bandeau promotionnel */}
      <div className="bg-gradient-to-r from-[#01613a] to-[#024d2e] text-white text-center py-2.5 text-sm overflow-hidden">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-center gap-6 font-medium">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"/>
              </svg>
              Livraison gratuite dès 200 TND
            </span>
            <span className="hidden md:inline text-white/60">•</span>
            <span className="hidden md:flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd"/>
              </svg>
              -10% sur votre première commande
            </span>
            <span className="hidden lg:inline text-white/60">•</span>
            <span className="hidden lg:flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              Paiement 100% sécurisé
            </span>
          </div>
        </div>
      </div>

      {/* Header principal */}
      <div className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4 gap-4">
            {/* Logo */}
            <Link href="/" className="shrink-0">
              <div className="text-2xl md:text-3xl font-bold text-[#01613a]">
                Le Sportif
              </div>
            </Link>

            {/* Barre de recherche (desktop) */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher des produits..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:border-[#01613a] focus:ring-1 focus:ring-[#01613a]"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#01613a] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Actions (compte, panier) */}
            <div className="flex items-center gap-4">
              {/* Compte */}
              <div className="relative group">
                <button className="flex items-center gap-2 text-gray-700 hover:text-[#01613a] transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="hidden lg:inline text-sm">
                    {isAuthenticated ? user?.name : 'Compte'}
                  </span>
                </button>

                {/* Dropdown compte */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  {isAuthenticated ? (
                    <>
                      <Link href="/account" className="block px-4 py-3 hover:bg-gray-50 border-b">
                        Mon compte
                      </Link>
                      <Link href="/account/orders" className="block px-4 py-3 hover:bg-gray-50 border-b">
                        Mes commandes
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 text-red-600"
                      >
                        Déconnexion
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="block px-4 py-3 hover:bg-gray-50 border-b">
                        Se connecter
                      </Link>
                      <Link href="/register" className="block px-4 py-3 hover:bg-gray-50">
                        S'inscrire
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Panier */}
              <Link href="/cart" className="relative group">
                <div className="flex items-center gap-2 text-gray-700 hover:text-[#01613a] transition-colors">
                  <div className="relative">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-xs text-gray-500">Panier</span>
                    <span className="text-sm font-semibold">
                      {cart?.total_amount ? `${cart.total_amount.toFixed(2)} TND` : '0,00 TND'}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Menu mobile toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-gray-700 hover:text-[#01613a]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Barre de recherche mobile */}
          <form onSubmit={handleSearch} className="md:hidden pb-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-[#01613a]"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Navigation principale */}
      <nav className="hidden md:block bg-gray-50 border-b">
        <div className="container mx-auto px-4">
          <ul className="flex items-center gap-8 py-3">
            <li>
              <Link href="/" className="text-gray-700 hover:text-[#01613a] font-medium transition-colors">
                Accueil
              </Link>
            </li>
            <li>
              <Link href="/products" className="text-gray-700 hover:text-[#01613a] font-medium transition-colors">
                Tous les produits
              </Link>
            </li>
            <li>
              <Link href="/categories" className="text-gray-700 hover:text-[#01613a] font-medium transition-colors">
                Catégories
              </Link>
            </li>
            <li>
              <Link href="/products?is_new=true" className="text-gray-700 hover:text-[#01613a] font-medium transition-colors">
                Nouveautés
              </Link>
            </li>
            <li>
              <Link href="/products?is_featured=true" className="text-gray-700 hover:text-[#01613a] font-medium transition-colors flex items-center gap-1">
                <span className="text-red-600">🔥</span>
                Promotions
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      {/* Menu mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="container mx-auto px-4 py-4">
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-gray-700 hover:text-[#01613a] font-medium"
                >
                  Accueil
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-gray-700 hover:text-[#01613a] font-medium"
                >
                  Tous les produits
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-gray-700 hover:text-[#01613a] font-medium"
                >
                  Catégories
                </Link>
              </li>
              <li>
                <Link
                  href="/products?is_new=true"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-gray-700 hover:text-[#01613a] font-medium"
                >
                  Nouveautés
                </Link>
              </li>
              <li>
                <Link
                  href="/products?is_featured=true"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-2 text-gray-700 hover:text-[#01613a] font-medium"
                >
                  🔥 Promotions
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
