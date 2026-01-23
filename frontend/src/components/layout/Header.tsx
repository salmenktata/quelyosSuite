'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/common';
import { SearchAutocomplete } from '@/components/common/SearchAutocomplete';
import { branding } from '@/lib/config/branding';

const Header: React.FC = () => {
  const cart = useCartStore((state) => state.cart);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(query)}`;
    }
  };

  const itemCount = cart?.item_count || 0;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      {/* Top bar */}
      <div className="bg-[#01613a] text-white text-sm">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <a href={`tel:${branding.phone.replace(/\s/g, '')}`} className="hover:text-[#c9c18f]">
              📞 {branding.phone}
            </a>
            <a href={`mailto:${branding.email}`} className="hover:text-[#c9c18f]">
              ✉️ {branding.email}
            </a>
          </div>
          <div className="flex items-center gap-4">
            <span>Livraison gratuite dès 100€</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#01613a] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">{branding.initial}</span>
              </div>
              <span className="text-2xl font-bold text-[#01613a]">{branding.name}</span>
            </div>
          </Link>

          {/* Search Bar with Autocomplete */}
          <div className="flex-1 max-w-2xl">
            <SearchAutocomplete
              placeholder="Rechercher des produits..."
              onSearch={handleSearch}
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            {/* Account */}
            {isAuthenticated && user ? (
              <Link href="/account" className="flex items-center gap-2 hover:text-[#01613a]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm hidden lg:inline">{user.name}</span>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Connexion
                </Button>
              </Link>
            )}

            {/* Cart */}
            <Link href="/cart" className="relative flex items-center gap-2 hover:text-[#01613a]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#01613a] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-t">
        <div className="container mx-auto px-4">
          <ul className="flex items-center gap-8 py-3">
            <li>
              <Link href="/products" className="text-gray-700 hover:text-[#01613a] font-medium">
                Tous les Produits
              </Link>
            </li>
            <li>
              <Link href="/products?featured=true" className="text-gray-700 hover:text-[#01613a] font-medium">
                Nouveautés
              </Link>
            </li>
            <li>
              <Link href="/products?bestseller=true" className="text-gray-700 hover:text-[#01613a] font-medium">
                Meilleures Ventes
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-gray-700 hover:text-[#01613a] font-medium">
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Header;
export { Header };
