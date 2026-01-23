'use client';

import Link from 'next/link';

interface Banner {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  ctaText: string;
  link: string;
  image: string;
  gradient: string;
  tagColor: string;
  textColor: string;
  buttonBg: string;
  buttonHover: string;
}

const banners: Banner[] = [
  {
    id: 1,
    tag: 'NOUVEAUTÉS',
    title: 'Découvrez nos derniers produits',
    subtitle: 'Collection 2026',
    ctaText: 'Découvrir',
    link: '/products?is_new=true',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&h=400&fit=crop',
    gradient: 'from-blue-600/90 to-blue-800/90',
    tagColor: 'bg-blue-200 text-blue-800',
    textColor: 'text-blue-100',
    buttonBg: 'bg-white text-blue-700',
    buttonHover: 'hover:bg-blue-50',
  },
  {
    id: 2,
    tag: 'PROMOTIONS',
    title: "Jusqu'à -60% sur une sélection",
    subtitle: 'Offres limitées',
    ctaText: 'Profiter',
    link: '/products?is_featured=true',
    image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=400&fit=crop',
    gradient: 'from-red-600/90 to-red-800/90',
    tagColor: 'bg-red-200 text-red-800',
    textColor: 'text-red-100',
    buttonBg: 'bg-white text-red-700',
    buttonHover: 'hover:bg-red-50',
  },
];

export function PromoBanners() {
  return (
    <section className="container mx-auto px-4 max-w-7xl py-12">
      <div className="grid md:grid-cols-2 gap-6">
        {banners.map((banner) => (
          <Link key={banner.id} href={banner.link}>
            <div className="relative h-[300px] rounded-2xl overflow-hidden group cursor-pointer shadow-lg hover:shadow-xl transition-shadow">
              {/* Image de fond */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url(${banner.image})` }}
              />

              {/* Overlay gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${banner.gradient}`} />

              {/* Contenu */}
              <div className="relative h-full p-8 md:p-10 flex flex-col justify-center text-white">
                {/* Tag */}
                <div className={`inline-block w-fit px-4 py-1.5 rounded-full text-xs font-bold mb-3 ${banner.tagColor}`}>
                  {banner.tag}
                </div>

                {/* Title */}
                <h3 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">
                  {banner.title.split(' ').slice(0, 3).join(' ')}
                  <br />
                  {banner.title.split(' ').slice(3).join(' ')}
                </h3>

                {/* Subtitle */}
                <p className={`text-base mb-6 ${banner.textColor}`}>
                  {banner.subtitle}
                </p>

                {/* CTA */}
                <div>
                  <span className={`inline-flex items-center gap-2 ${banner.buttonBg} px-6 py-3 rounded-full font-semibold transition-all ${banner.buttonHover} group-hover:gap-4`}>
                    {banner.ctaText}
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
