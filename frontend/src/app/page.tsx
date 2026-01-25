/**
 * Homepage - Style Le Sportif
 * Server-side rendered for optimal performance
 */

import Link from 'next/link';
import type { Product, Category } from '@quelyos/types';
import { HeroSlider } from '@/components/home/HeroSlider';
import { PromoBanners } from '@/components/home/PromoBanners';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductCardHome } from '@/components/home/ProductCardHome';
import { NewsletterForm } from '@/components/home/NewsletterForm';
import { logger } from '@/lib/logger';

// Server-side data fetching
async function getHomeData(): Promise<{ products: Product[]; categories: Category[] }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(`${baseUrl}/api/products?limit=8&is_featured=true`, {
        next: { revalidate: 60 } // ISR: revalidate every 60 seconds
      }),
      fetch(`${baseUrl}/api/categories`, {
        next: { revalidate: 300 } // ISR: revalidate every 5 minutes
      })
    ]);

    let products: Product[] = [];
    let categories: Category[] = [];

    if (productsRes.ok) {
      const data = await productsRes.json();
      products = data.products || [];

      // If no featured products, fetch regular products
      if (products.length === 0) {
        const allProductsRes = await fetch(`${baseUrl}/api/products?limit=8`, {
          next: { revalidate: 60 }
        });
        if (allProductsRes.ok) {
          const allData = await allProductsRes.json();
          products = allData.products || [];
        }
      }
    }

    if (categoriesRes.ok) {
      const data = await categoriesRes.json();
      categories = (data.categories || []).slice(0, 4);
    }

    return { products, categories };
  } catch (error) {
    logger.error('Error fetching home data:', error);
    return { products: [], categories: [] };
  }
}

export default async function Home() {
  const { products, categories } = await getHomeData();

  return (
    <div className="bg-gray-50">
      {/* HERO SLIDER */}
      <HeroSlider />

      {/* CATEGORIES */}
      <CategoriesSection categories={categories} isLoading={false} />

      {/* FEATURED PRODUCTS */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Produits phares</h2>
            <Link href="/products?is_featured=true">
              <button className="text-primary font-semibold hover:underline">
                Voir tout →
              </button>
            </Link>
          </div>

          {products.length > 0 ? (
            <ProductGrid viewMode="grid" className="grid-cols-2 md:grid-cols-4">
              {products.map((product) => (
                <ProductCardHome key={product.id} product={product} />
              ))}
            </ProductGrid>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Aucun produit phare pour le moment
            </div>
          )}
        </div>
      </section>

      {/* PROMO BANNERS */}
      <PromoBanners />

      {/* BENEFITS SECTION */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Livraison */}
            <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary/20 hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-14 h-14 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-primary transition-colors">Livraison rapide</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Gratuite des 200 TND<br/>Partout en Tunisie - 48-72h</p>
                </div>
              </div>
            </div>

            {/* Paiement */}
            <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary/20 hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-14 h-14 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-primary transition-colors">Paiement securise</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">100% securise en ligne<br/>A la livraison disponible</p>
                </div>
              </div>
            </div>

            {/* Service client */}
            <div className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary/20 hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-14 h-14 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-primary transition-colors">Service client</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Equipe a votre ecoute<br/>Satisfait ou rembourse</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="container mx-auto px-4 max-w-7xl py-12">
        <div className="relative bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-8 md:p-16 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>

          <div className="relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-4">Restez informe</h2>
            <p className="mb-8 text-white/90 max-w-2xl mx-auto text-lg">
              Inscrivez-vous a notre newsletter et recevez en exclusivite nos offres speciales, nouveautes et conseils
            </p>

            <NewsletterForm />
          </div>
        </div>
      </section>
    </div>
  );
}
