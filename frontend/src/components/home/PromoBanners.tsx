'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePromoBanners } from '@/hooks/usePromoBanners';

// Mapping gradients backend → Tailwind
const gradientMap: Record<string, string> = {
  blue: 'from-blue-600/90 to-blue-800/90',
  purple: 'from-purple-600/90 to-purple-800/90',
  orange: 'from-orange-600/90 to-orange-800/90',
  green: 'from-green-600/90 to-green-800/90',
  red: 'from-red-600/90 to-red-800/90',
};

const tagColorMap: Record<string, string> = {
  blue: 'bg-blue-200 text-blue-800',
  secondary: 'bg-gray-200 text-gray-800',
  orange: 'bg-orange-200 text-orange-800',
  red: 'bg-red-200 text-red-800',
};

const buttonBgMap: Record<string, string> = {
  white: 'bg-white text-gray-700 hover:bg-gray-50',
  black: 'bg-black text-white hover:bg-gray-900',
  primary: 'bg-primary text-white hover:bg-primary-dark',
};

// Fallback banners si backend vide
const fallbackBanners = [
  {
    id: 1,
    title: 'Découvrez nos derniers produits',
    description: 'Collection 2026',
    tag: 'NOUVEAUTÉS',
    cta_text: 'Découvrir',
    cta_link: '/products?is_new=true',
    image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&h=400&fit=crop',
    gradient: 'blue',
    tag_color: 'blue',
    button_bg: 'white',
  },
  {
    id: 2,
    title: "Jusqu'à -60% sur une sélection",
    description: 'Offres limitées',
    tag: 'PROMOTIONS',
    cta_text: 'Profiter',
    cta_link: '/products?is_featured=true',
    image_url: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=400&fit=crop',
    gradient: 'red',
    tag_color: 'red',
    button_bg: 'white',
  },
];

export function PromoBanners() {
  const { banners: apiBanners, loading } = usePromoBanners();

  // Utiliser bannières API ou fallback
  const banners = apiBanners.length > 0 ? apiBanners : fallbackBanners;

  // Masquer section si aucune bannière
  if (!loading && apiBanners.length === 0 && fallbackBanners.length === 0) {
    return null;
  }

  // Skeleton pendant chargement
  if (loading) {
    return (
      <section className="container mx-auto px-4 max-w-7xl py-12">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-[300px] rounded-2xl bg-gray-200 animate-pulse" />
          <div className="h-[300px] rounded-2xl bg-gray-200 animate-pulse" />
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 max-w-7xl py-12">
      <div className="grid md:grid-cols-2 gap-6">
        {banners.slice(0, 2).map((banner) => (
          <Link key={banner.id} href={banner.cta_link}>
            <div className="relative h-[300px] rounded-2xl overflow-hidden group cursor-pointer shadow-lg hover:shadow-xl transition-shadow">
              {/* Image de fond */}
              {banner.image_url && (
                <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-110">
                  <Image
                    src={banner.image_url}
                    alt={banner.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Overlay gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${gradientMap[banner.gradient] || gradientMap.blue}`} />

              {/* Contenu */}
              <div className="relative h-full p-8 md:p-10 flex flex-col justify-center text-white">
                {/* Tag */}
                {banner.tag && (
                  <div className={`inline-block w-fit px-4 py-1.5 rounded-full text-xs font-bold mb-3 ${tagColorMap[banner.tag_color] || tagColorMap.blue}`}>
                    {banner.tag}
                  </div>
                )}

                {/* Title */}
                <h3 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">
                  {banner.title}
                </h3>

                {/* Description */}
                {banner.description && (
                  <p className="text-base mb-6 text-white/90">
                    {banner.description}
                  </p>
                )}

                {/* CTA */}
                <div>
                  <span className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all group-hover:gap-4 ${buttonBgMap[banner.button_bg] || buttonBgMap.white}`}>
                    {banner.cta_text}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </div>

              {/* Decorative circles */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
