/**
 * Homepage - Style Le Sportif
 * Server-side rendered for optimal performance
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
import { logger } from '@/lib/logger';

// Server-side data fetching
async function getHomeData(): Promise<{ products: Product[]; categories: Category[]; heroSlides: HeroSlide[]; promoBanners: PromoBanner[]; benefits: Benefit[] }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  try {
    const [productsRes, categoriesRes, heroSlidesRes, promoBannersRes, benefitsRes] = await Promise.all([
      fetch(`${baseUrl}/api/products?limit=8&is_featured=true`, {
        next: { revalidate: 60 } // ISR: revalidate every 60 seconds
      }),
      fetch(`${baseUrl}/api/categories`, {
        next: { revalidate: 300 } // ISR: revalidate every 5 minutes
      }),
      fetch(`${baseUrl}/api/hero-slides`, {
        next: { revalidate: 300 } // ISR: revalidate every 5 minutes
      }),
      fetch(`${baseUrl}/api/promo-banners`, {
        next: { revalidate: 300 } // ISR: revalidate every 5 minutes
      }),
      fetch(`${baseUrl}/api/trust-badges`, {
        next: { revalidate: 300 } // ISR: revalidate every 5 minutes
      })
    ]);

    let products: Product[] = [];
    let categories: Category[] = [];
    let heroSlides: HeroSlide[] = [];
    let promoBanners: PromoBanner[] = [];
    let benefits: Benefit[] = [];

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
  } catch (error) {
    logger.error('Error fetching home data:', error);
    return { products: [], categories: [], heroSlides: [], promoBanners: [], benefits: [] };
  }
}

export default async function Home() {
  const { products, categories, heroSlides, promoBanners, benefits } = await getHomeData();

  return (
    <div className="bg-gray-50">
      {/* HERO SLIDER */}
      <HeroSlider slides={heroSlides} />

      {/* FLASH SALES - Affiche uniquement si vente flash active */}
      <FlashSalesSection />

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

      {/* SOCIAL TRENDING - Produits tendance réseaux sociaux */}
      <SocialTrendingProducts />

      {/* PROMO BANNERS */}
      <PromoBanners banners={promoBanners} />

      {/* BENEFITS SECTION - Dynamic from API */}
      <BenefitsSection benefits={benefits} />

      {/* CONTINUE SHOPPING - Produits récemment consultés */}
      <ContinueShoppingSection />

      {/* TESTIMONIALS - Affiche uniquement si témoignages disponibles */}
      <TestimonialsSection />

      {/* LIVESTREAM SHOPPING - Événements live à venir */}
      <LivestreamShopping />

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
