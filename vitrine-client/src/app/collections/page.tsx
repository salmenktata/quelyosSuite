/**
 * Page liste des collections - SSR
 */

import { backendClient, Collection } from '@/lib/backend/client';
import Link from 'next/link';
import Image from 'next/image';
import { getProxiedImageUrl } from '@/lib/image-proxy';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata = {
  title: 'Collections | Nos sélections',
  description: 'Découvrez nos collections de produits soigneusement sélectionnés',
};

export default async function CollectionsPage() {
  const response = await backendClient.getCollections();
  const collections = response.success ? response.collections : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Collections</h1>
          <p className="text-xl text-white/80">Nos sélections de produits triés sur le volet</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {collections.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">Aucune collection pour le moment</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="group block bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="aspect-[4/3] relative bg-gray-100 dark:bg-gray-700">
        {collection.imageUrl ? (
          <Image
            src={getProxiedImageUrl(collection.imageUrl)}
            alt={collection.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <svg className="w-20 h-20 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h2 className="text-2xl font-bold text-white mb-1">{collection.name}</h2>
          <p className="text-white/80 text-sm">{collection.productCount} produits</p>
        </div>
      </div>
      {collection.description && (
        <div className="p-5">
          <p className="text-gray-600 dark:text-gray-300 line-clamp-2">{collection.description}</p>
        </div>
      )}
    </Link>
  );
}
