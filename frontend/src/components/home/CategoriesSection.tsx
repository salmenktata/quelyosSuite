'use client';

import Link from 'next/link';
import { Category } from '@/types';

interface CategoriesSectionProps {
  categories: Category[];
  isLoading: boolean;
}

// Images par défaut pour les catégories (placeholder professionnel)
const categoryImages: Record<string, string> = {
  default: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=400&fit=crop',
  sport: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=400&fit=crop',
  fitness: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&h=400&fit=crop',
  running: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=400&fit=crop',
  gym: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop',
  yoga: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop',
  outdoor: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
  training: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
  equipment: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop',
};

function getCategoryImage(category: Category): string {
  // Si la catégorie a une image, l'utiliser
  if (category.image_url) {
    return category.image_url;
  }

  // Sinon, essayer de trouver une image correspondant au nom
  const categoryName = category.name.toLowerCase();

  if (categoryName.includes('sport') || categoryName.includes('all')) {
    return categoryImages.sport;
  }
  if (categoryName.includes('fitness') || categoryName.includes('cardio')) {
    return categoryImages.fitness;
  }
  if (categoryName.includes('run') || categoryName.includes('course')) {
    return categoryImages.running;
  }
  if (categoryName.includes('gym') || categoryName.includes('musculation')) {
    return categoryImages.gym;
  }
  if (categoryName.includes('yoga') || categoryName.includes('pilates')) {
    return categoryImages.yoga;
  }
  if (categoryName.includes('outdoor') || categoryName.includes('extérieur')) {
    return categoryImages.outdoor;
  }
  if (categoryName.includes('training') || categoryName.includes('entraînement')) {
    return categoryImages.training;
  }
  if (categoryName.includes('equipment') || categoryName.includes('équipement')) {
    return categoryImages.equipment;
  }

  // Image par défaut
  return categoryImages.default;
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
                <img
                  src={getCategoryImage(category)}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
