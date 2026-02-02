/**
 * Page liste produits - SSR avec données initiales
 * Affichage immédiat des produits (pas de loading client-side)
 */

import { Suspense } from 'react';
import { backendClient } from '@/lib/backend/client';
import type { ProductFilters } from '@quelyos/types';
import ProductsClientView from './ProductsClientView';
import { ProductGridSkeleton } from '@/components/common/Skeleton';

// ISR avec revalidation 60 secondes
export const revalidate = 60;

interface SearchParams {
  category?: string;
  sort?: string;
  min_price?: string;
  max_price?: string;
  is_new?: string;
  is_featured?: string;
  is_bestseller?: string;
  page?: string;
  limit?: string;
}

// Server Component avec fetch SSR
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Await searchParams (Next.js 16+)
  const params = await searchParams;

  // Parser les filtres depuis URL
  const limit = parseInt(params.limit || '12', 10);
  const page = parseInt(params.page || '1', 10);
  const offset = (page - 1) * limit;

  // Valider le type de sort
  const validSorts = ['name', 'price_asc', 'price_desc', 'newest', 'popularity'] as const;
  type ValidSort = typeof validSorts[number];
  const sort = validSorts.includes(params.sort as ValidSort)
    ? (params.sort as ValidSort)
    : 'name';

  const filters: ProductFilters = {
    limit,
    offset,
    sort,
    category_id: params.category ? parseInt(params.category, 10) : undefined,
    min_price: params.min_price ? parseFloat(params.min_price) : undefined,
    max_price: params.max_price ? parseFloat(params.max_price) : undefined,
    is_new: params.is_new === 'true',
    is_featured: params.is_featured === 'true',
    is_bestseller: params.is_bestseller === 'true',
  };

  // Fetch SSR des produits et catégories en parallèle
  const [productsResponse, categoriesResponse] = await Promise.all([
    backendClient.getProducts(filters),
    backendClient.getCategories(),
  ]);

  const initialProducts = productsResponse.success ? productsResponse.products : [];
  const initialTotal = productsResponse.total || 0;
  const initialCategories = categoriesResponse.success && categoriesResponse.categories
    ? categoriesResponse.categories
    : [];

  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsClientView
        initialProducts={initialProducts}
        initialCategories={initialCategories}
        initialTotal={initialTotal}
        initialFilters={filters}
      />
    </Suspense>
  );
}

function ProductsLoading() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-7xl py-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-6"></div>
          <div className="flex gap-6">
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-4">
                <div className="h-6 bg-gray-200 rounded w-24"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </aside>
            <div className="flex-1">
              <ProductGridSkeleton count={12} viewMode="grid" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
