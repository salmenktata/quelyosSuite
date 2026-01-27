import { ProductGridSkeleton } from '@/components/common/Skeleton';

export default function Loading() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-7xl py-6">
        <div className="animate-pulse">
          {/* Breadcrumb skeleton */}
          <div className="h-4 bg-gray-200 rounded w-32 mb-6"></div>

          <div className="flex gap-6">
            {/* Sidebar skeleton */}
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

            {/* Product grid skeleton */}
            <div className="flex-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
              <ProductGridSkeleton count={12} viewMode="grid" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
