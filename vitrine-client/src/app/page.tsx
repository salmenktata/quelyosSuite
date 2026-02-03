/**
 * Homepage Premium - Quelyos Shop
 * Design moderne, ergonomique et dynamique
 */

import Link from 'next/link';
import type { Product, Category } from '@quelyos/types';
import type { HeroSlide } from '@/hooks/useHeroSlides';
import type { PromoBanner } from '@/hooks/usePromoBanners';
import { HeroSlider } from '@/components/home/HeroSlider';
import { PromoBanners } from '@/components/home/PromoBanners';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { BenefitsSection, type Benefit } from '@/components/home/BenefitsSection';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductCardHome } from '@/components/home/ProductCardHome';
import { NewsletterForm } from '@/components/home/NewsletterForm';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { FlashSalesSection } from '@/components/home/FlashSalesSection';
import { ContinueShoppingSection } from '@/components/home/ContinueShoppingSection';
import { SocialTrendingProducts } from '@/components/home/SocialTrendingProducts';
import { LivestreamShopping } from '@/components/live/LivestreamShopping';
import { getAppUrl } from '@quelyos/config';

// Server-side data fetching
async function getHomeData(): Promise<{ products: Product[]; categories: Category[]; heroSlides: HeroSlide[]; promoBanners: PromoBanner[]; benefits: Benefit[] }> {
  const env = (process.env.NODE_ENV === 'production' ? 'production' : 'development') as 'development' | 'production';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || getAppUrl('ecommerce', env);

  try {
    const [productsRes, categoriesRes, heroSlidesRes, promoBannersRes, benefitsRes] = await Promise.all([
      fetch(`${baseUrl}/api/products?limit=8&is_featured=true`, { next: { revalidate: 60 } }),
      fetch(`${baseUrl}/api/categories`, { next: { revalidate: 300 } }),
      fetch(`${baseUrl}/api/hero-slides`, { next: { revalidate: 300 } }),
      fetch(`${baseUrl}/api/promo-banners`, { next: { revalidate: 300 } }),
      fetch(`${baseUrl}/api/trust-badges`, { next: { revalidate: 300 } })
    ]);

    let products: Product[] = [];
    let categories: Category[] = [];
    let heroSlides: HeroSlide[] = [];
    let promoBanners: PromoBanner[] = [];
    let benefits: Benefit[] = [];

    if (productsRes.ok) {
      const data = await productsRes.json();
      products = data.products || [];
      if (products.length === 0) {
        const allProductsRes = await fetch(`${baseUrl}/api/products?limit=8`, { next: { revalidate: 60 } });
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

    if (heroSlidesRes.ok) {
      const data = await heroSlidesRes.json();
      heroSlides = data.success ? data.slides || [] : [];
    }

    if (promoBannersRes.ok) {
      const data = await promoBannersRes.json();
      promoBanners = data.success ? data.banners || [] : [];
    }

    if (benefitsRes.ok) {
      const data = await benefitsRes.json();
      benefits = data.success ? data.badges || [] : [];
    }

    return { products, categories, heroSlides, promoBanners, benefits };
  } catch (_error) {
    return { products: [], categories: [], heroSlides: [], promoBanners: [], benefits: [] };
  }
}

export default async function Home() {
  const { products, categories, heroSlides, promoBanners, benefits } = await getHomeData();

  return (
    <div className="bg-white">
      {/* ========== HERO SLIDER - Design Premium ========== */}
      {heroSlides.length > 0 && <HeroSlider slides={heroSlides} />}

      {/* ========== TRUST BADGES - Confiance immédiate ========== */}
      {benefits.length > 0 && (
        <section className="bg-gradient-to-b from-white to-gray-50 py-8 border-b border-gray-100">
          <BenefitsSection benefits={benefits} />
        </section>
      )}

      {/* ========== FLASH SALES - Urgence visuelle ========== */}
      <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-16">
        <FlashSalesSection />
      </div>

      {/* ========== CATÉGORIES - Cards Premium ========== */}
      {categories.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-2 bg-primary/10 text-primary text-sm font-bold rounded-full mb-4 tracking-wide">
                🏷️ CATÉGORIES
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                Explorez nos univers
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
                Une sélection soigneusement organisée pour faciliter votre shopping
              </p>
            </div>
            <CategoriesSection categories={categories} isLoading={false} />
          </div>
        </section>
      )}

      {/* ========== PRODUITS PHARES - Mise en avant Premium ========== */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-8 mb-14">
            <div className="max-w-2xl">
              <span className="inline-block px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-bold rounded-full mb-5 shadow-lg">
                ⭐ SÉLECTION PREMIUM
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                Nos produits phares
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Les coups de cœur de nos clients, choisis avec passion et rigueur pour leur qualité exceptionnelle
              </p>
            </div>
            <Link
              href="/products?is_featured=true"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white border-2 border-primary text-primary font-bold rounded-2xl hover:bg-primary hover:text-white hover:border-primary-dark transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group"
            >
              Voir toute la collection
              <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {products.length > 0 ? (
            <ProductGrid viewMode="grid" className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product) => (
                <ProductCardHome key={product.id} product={product} />
              ))}
            </ProductGrid>
          ) : (
            <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-white rounded-3xl border-2 border-dashed border-gray-200">
              <div className="text-7xl mb-6">🛍️</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Collection en préparation</h3>
              <p className="text-gray-500 text-lg">Nos produits phares arrivent très bientôt...</p>
            </div>
          )}
        </div>
      </section>

      {/* ========== SOCIAL TRENDING - Produits viraux ========== */}
      <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 py-24">
        <SocialTrendingProducts />
      </div>

      {/* ========== PROMO BANNERS - Offres spéciales ========== */}
      {promoBanners.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-7xl mb-12 text-center">
            <span className="inline-block px-4 py-2 bg-red-100 text-red-800 text-sm font-bold rounded-full mb-4">
              🔥 OFFRES LIMITÉES
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3">
              Ne manquez pas ces promos
            </h2>
          </div>
          <PromoBanners banners={promoBanners} />
        </section>
      )}

      {/* ========== CONTINUE SHOPPING - Personnalisation ========== */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <ContinueShoppingSection />
      </section>

      {/* ========== SOCIAL PROOF - Témoignages ========== */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-7xl mb-14 text-center">
          <span className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 text-sm font-bold rounded-full mb-5">
            💬 AVIS CLIENTS
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Ils nous font confiance
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Découvrez les retours authentiques de nos clients satisfaits
          </p>
        </div>
        <TestimonialsSection />
      </section>

      {/* ========== LIVESTREAM SHOPPING - Innovation ========== */}
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 py-24">
        <LivestreamShopping />
      </div>

      {/* ========== NEWSLETTER - Design Premium ========== */}
      <section className="container mx-auto px-4 max-w-7xl py-20">
        <div className="relative bg-gradient-to-br from-primary via-primary-dark to-secondary rounded-[2.5rem] p-12 md:p-20 text-white overflow-hidden shadow-2xl">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse delay-75"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl mb-8 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-5 tracking-tight">
              Restez dans la boucle
            </h2>
            <p className="mb-10 text-white/95 text-xl leading-relaxed max-w-2xl mx-auto">
              Inscrivez-vous à notre newsletter et recevez en exclusivité nos offres spéciales, nouveautés et conseils personnalisés
            </p>

            <NewsletterForm />

            <p className="mt-6 text-white/75 text-sm">
              ✨ Offre de bienvenue : <span className="font-semibold">-10% sur votre première commande</span>
            </p>
          </div>
        </div>
      </section>

      {/* Espacement final */}
      <div className="h-12"></div>
    </div>
  );
}
