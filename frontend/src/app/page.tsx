/**
 * Homepage - Style Le Sportif
 * Design sophistiqué en colonnes
 */

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { odooClient } from '@/lib/odoo/client';
import type { Product, Category } from '@/types';
import { HeroSlider } from '@/components/home/HeroSlider';
import { PromoBanners } from '@/components/home/PromoBanners';
import { CategoriesSection } from '@/components/home/CategoriesSection';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        odooClient.getProducts({ limit: 8, is_featured: true }),
        odooClient.getCategories()
      ]);

      if (productsRes.success) {
        // Si aucun produit featured, afficher les 8 premiers produits
        if (productsRes.products.length === 0) {
          const allProductsRes = await odooClient.getProducts({ limit: 8 });
          if (allProductsRes.success) {
            setFeaturedProducts(allProductsRes.products);
          }
        } else {
          setFeaturedProducts(productsRes.products);
        }
      }
      if (categoriesRes.success) {
        setCategories(categoriesRes.categories.slice(0, 4));
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50">
      {/* HERO SLIDER */}
      <HeroSlider />

      {/* CATÉGORIES EN COLONNES */}
      <CategoriesSection categories={categories} isLoading={isLoading} />

      {/* PRODUITS PHARES */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Produits phares</h2>
            <Link href="/products?is_featured=true">
              <button className="text-[#01613a] font-semibold hover:underline">
                Voir tout →
              </button>
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#01613a]"></div>
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredProducts.map((product) => (
                <ProductCardHome key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Aucun produit phare pour le moment
            </div>
          )}
        </div>
      </section>

      {/* BANNIÈRES PROMO 2 COLONNES */}
      <PromoBanners />

      {/* AVANTAGES 3 COLONNES */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Livraison */}
            <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#01613a]/20 hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-14 h-14 bg-gradient-to-br from-[#01613a] to-[#028a52] rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-[#01613a] transition-colors">Livraison rapide</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Gratuite dès 200 TND<br/>Partout en Tunisie • 48-72h</p>
                </div>
              </div>
            </div>

            {/* Paiement */}
            <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#01613a]/20 hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-14 h-14 bg-gradient-to-br from-[#01613a] to-[#028a52] rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-[#01613a] transition-colors">Paiement sécurisé</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">100% sécurisé en ligne<br/>À la livraison disponible</p>
                </div>
              </div>
            </div>

            {/* Service client */}
            <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#01613a]/20 hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-14 h-14 bg-gradient-to-br from-[#01613a] to-[#028a52] rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-[#01613a] transition-colors">Service client</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Équipe à votre écoute<br/>Satisfait ou remboursé</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="container mx-auto px-4 max-w-7xl py-12">
        <div className="relative bg-gradient-to-br from-[#01613a] to-[#024d2e] rounded-3xl p-8 md:p-16 text-white overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>

          <div className="relative z-10 text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-4">Restez informé</h2>
            <p className="mb-8 text-white/90 max-w-2xl mx-auto text-lg">
              Inscrivez-vous à notre newsletter et recevez en exclusivité nos offres spéciales, nouveautés et conseils
            </p>

            <form className="max-w-lg mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <input
                    type="email"
                    placeholder="Votre adresse email"
                    className="w-full px-6 py-4 rounded-full text-gray-900 focus:outline-none focus:ring-4 focus:ring-white/30 transition-shadow"
                    required
                  />
                  <svg className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <button
                  type="submit"
                  className="bg-white text-[#01613a] px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition-all hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
                >
                  S'inscrire
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>

              <p className="mt-4 text-sm text-white/70">
                🔒 Vos données sont protégées. Désabonnement en un clic.
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

// Composant carte produit pour la homepage
function ProductCardHome({ product }: { product: Product }) {
  const discountPercent = product.compare_at_price
    ? Math.round((1 - product.list_price / product.compare_at_price) * 100)
    : 0;

  return (
    <div className="group">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-[#01613a]/20 transition-all duration-300 transform hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <Link href={`/products/${product.slug || product.id}`}>
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                </svg>
              </div>
            )}
          </Link>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {discountPercent > 0 && (
              <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-lg backdrop-blur-sm">
                -{discountPercent}%
              </span>
            )}
            {product.is_new && (
              <span className="bg-[#01613a] text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-lg backdrop-blur-sm">
                NOUVEAU
              </span>
            )}
          </div>

          {/* Bouton Ajout Panier (apparaît au hover) */}
          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button className="w-full bg-[#01613a] text-white py-2.5 rounded-lg font-semibold hover:bg-[#024d2e] transition-colors shadow-lg flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Ajouter au panier
            </button>
          </div>
        </div>

        {/* Infos */}
        <Link href={`/products/${product.slug || product.id}`} className="block p-4">
          {/* SKU */}
          {product.default_code && (
            <div className="text-xs text-[#c9c18f] font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
              </svg>
              {product.default_code}
            </div>
          )}

          <h3 className="font-semibold text-sm text-gray-900 mb-3 line-clamp-2 group-hover:text-[#01613a] transition-colors min-h-10 leading-tight">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">
              {product.list_price.toFixed(2)} <span className="text-sm font-normal text-gray-600">TND</span>
            </span>
            {product.compare_at_price && (
              <span className="text-sm text-gray-400 line-through">
                {product.compare_at_price.toFixed(2)} TND
              </span>
            )}
          </div>

          {/* Stock indicator */}
          {product.qty_available !== undefined && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {product.qty_available > 0 ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 font-medium">En stock</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-700 font-medium">Rupture</span>
                </>
              )}
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}
