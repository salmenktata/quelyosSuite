'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@quelyos/types';

interface CategoriesSectionProps {
  categories: Category[];
  isLoading: boolean;
}

// Image par défaut générique
const DEFAULT_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop';

function getCategoryImage(category: Category): string {
  // Utiliser image uploadée depuis backoffice ou fallback générique
  return category.image_url || DEFAULT_CATEGORY_IMAGE;
}

export function CategoriesSection({ categories, isLoading }: CategoriesSectionProps) {
  if (isLoading) {
    return (
      <section className="container mx-auto px-4 max-w-7xl py-12">
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">Explorez nos catégories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200" />
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 max-w-7xl py-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3 text-gray-900">Explorez nos catégories</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Trouvez l'équipement parfait pour votre activité sportive
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/products?category=${category.id}`}
            className="group"
          >
            <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <Image
                  src={getCategoryImage(category)}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                {/* Overlay au hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Nombre de produits badge */}
                {category.product_count !== undefined && (
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                    <span className="text-sm font-bold text-primary">
                      {category.product_count}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4 text-center">
                <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors mb-1">
                  {category.name}
                </h3>
                {category.product_count !== undefined && (
                  <p className="text-sm text-gray-500">
                    {category.product_count} produit{category.product_count > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Lien voir toutes les catégories */}
      <div className="text-center mt-10">
        <Link href="/categories">
          <button className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all">
            <span>Voir toutes les catégories</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </Link>
      </div>
    </section>
  );
}
