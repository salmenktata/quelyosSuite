/**
 * Page détail collection - SSR avec produits
 */

import { notFound } from 'next/navigation';
import { backendClient } from '@/lib/backend/client';
import Link from 'next/link';
import Image from 'next/image';
import { getProxiedImageUrl } from '@/lib/image-proxy';
import type { Metadata } from 'next';
import ProductCard from '@/components/product/ProductCard';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const response = await backendClient.getCollection(slug);

  if (!response.success || !response.collection) {
    return { title: 'Collection non trouvée' };
  }

  return {
    title: `${response.collection.name} | Collections`,
    description: response.collection.description || `Découvrez notre collection ${response.collection.name}`,
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const response = await backendClient.getCollection(slug);

  if (!response.success || !response.collection) {
    notFound();
  }

  const collection = response.collection;
  const products = response.products || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header avec image */}
      {collection.imageUrl ? (
        <div className="relative h-[35vh] min-h-[280px] bg-gray-900">
          <Image
            src={getProxiedImageUrl(collection.imageUrl)}
            alt={collection.name}
            fill
            sizes="100vw"
            className="object-cover opacity-50"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-8">
            <nav className="mb-4">
              <Link href="/collections" className="text-white/70 hover:text-white text-sm">
                Collections
              </Link>
              <span className="text-white/50 mx-2">/</span>
              <span className="text-white">{collection.name}</span>
            </nav>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{collection.name}</h1>
            {collection.description && (
              <p className="text-xl text-white/80 max-w-2xl">{collection.description}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white py-16">
          <div className="container mx-auto px-4">
            <nav className="mb-4">
              <Link href="/collections" className="text-white/70 hover:text-white text-sm">
                Collections
              </Link>
              <span className="text-white/50 mx-2">/</span>
              <span className="text-white">{collection.name}</span>
            </nav>
            <h1 className="text-4xl font-bold mb-2">{collection.name}</h1>
            {collection.description && (
              <p className="text-xl text-white/80">{collection.description}</p>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        {products.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">Aucun produit dans cette collection</p>
            <Link
              href="/collections"
              className="inline-block mt-4 text-primary hover:underline"
            >
              Voir toutes les collections
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {products.length} produit{products.length > 1 ? 's' : ''} dans cette collection
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voir toutes les collections
          </Link>
        </div>
      </div>
    </div>
  );
}
