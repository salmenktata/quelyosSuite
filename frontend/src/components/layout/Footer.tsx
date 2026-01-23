/**
 * Footer - Style Le Sportif Amélioré
 * Menu sophistiqué avec sections étendues
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Intégrer avec l'API newsletter
    console.log('Newsletter:', email);
    setEmail('');
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Newsletter Section */}
      <div className="bg-gray-800 border-t border-gray-700">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-white font-bold text-xl mb-2">📬 Rejoignez notre newsletter</h3>
              <p className="text-sm text-gray-400">Recevez nos offres exclusives et nos nouveautés</p>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre adresse email"
                required
                className="px-4 py-2.5 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-[#01613a] w-full md:w-80"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#01613a] text-white rounded-lg font-semibold hover:bg-[#024d2e] transition-colors whitespace-nowrap"
              >
                S'inscrire
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Section principale */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Colonne 1: À propos */}
          <div className="lg:col-span-1">
            <h3 className="text-white font-bold text-xl mb-4">Le Sportif</h3>
            <p className="text-sm mb-4 leading-relaxed">
              Votre boutique en ligne de confiance pour des produits de sport et de qualité en Tunisie depuis 2020.
            </p>

            {/* Contact Info */}
            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-[#01613a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-400">Tunis, Tunisie</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-[#01613a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:contact@lesportif.tn" className="text-gray-400 hover:text-white">
                  contact@lesportif.tn
                </a>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-[#01613a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:+21612345678" className="text-gray-400 hover:text-white">
                  +216 12 345 678
                </a>
              </div>
            </div>

            {/* Réseaux sociaux */}
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#01613a] transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#01613a] transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
                  <path d="M12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#01613a] transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Colonne 2: Boutique */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Boutique</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/products" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  → Tous les produits
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  → Catégories
                </Link>
              </li>
              <li>
                <Link href="/products?is_new=true" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  → Nouveautés 2026
                </Link>
              </li>
              <li>
                <Link href="/products?is_featured=true" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  → Promotions
                </Link>
              </li>
              <li>
                <Link href="/products?is_bestseller=true" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  → Meilleures ventes
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3: Mon Compte */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Mon Compte</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/login" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  → Connexion
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  → Créer un compte
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  → Mes commandes
                </Link>
              </li>
              <li>
                <Link href="/account/wishlist" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  → Ma liste d'envies
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  → Mon panier
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 4: Service Client */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Service Client</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/contact" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  → Nous contacter
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  → FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  → Livraison
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  → Retours & Échanges
                </Link>
              </li>
              <li>
                <Link href="/size-guide" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  → Guide des tailles
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 5: Informations légales */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Informations</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  → À propos de nous
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  → CGV
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  → Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  → Cookies
                </Link>
              </li>
              <li>
                <Link href="/legal/mentions" className="hover:text-white hover:translate-x-1 inline-block transition-all">
                  → Mentions légales
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Paiement & Livraison */}
        <div className="border-t border-gray-800 mt-10 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Moyens de paiement */}
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                <svg className="w-4 h-4 text-[#01613a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Paiement sécurisé
              </h4>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="bg-white rounded px-2 py-1 text-xs font-bold text-gray-900">VISA</div>
                <div className="bg-white rounded px-2 py-1 text-xs font-bold text-gray-900">Mastercard</div>
                <div className="bg-white rounded px-2 py-1 text-xs font-bold text-gray-900">D17</div>
                <div className="bg-white rounded px-2 py-1 text-xs font-bold text-gray-900">Cash</div>
              </div>
            </div>

            {/* Livraison */}
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                <svg className="w-4 h-4 text-[#01613a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Livraison rapide
              </h4>
              <p className="text-sm text-gray-400">
                Gratuite dès 200 TND<br />
                Livraison sous 48-72h partout en Tunisie
              </p>
            </div>

            {/* Satisfaction */}
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                <svg className="w-4 h-4 text-[#01613a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Garantie satisfaction
              </h4>
              <p className="text-sm text-gray-400">
                Retour gratuit sous 30 jours<br />
                Satisfait ou remboursé
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800 bg-gray-950">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p className="text-gray-500">
              © {currentYear} <span className="text-white font-semibold">Le Sportif</span>. Tous droits réservés.
              <span className="hidden md:inline"> | Propulsé par <span className="text-[#01613a]">Quelyos ERP</span></span>
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-gray-500">
              <Link href="/legal/terms" className="hover:text-white transition-colors">CGV</Link>
              <span>•</span>
              <Link href="/legal/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
              <span>•</span>
              <Link href="/legal/cookies" className="hover:text-white transition-colors">Cookies</Link>
              <span>•</span>
              <Link href="/sitemap.xml" className="hover:text-white transition-colors">Plan du site</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
