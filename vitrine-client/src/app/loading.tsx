/**
 * Loading skeleton for homepage
 * Displayed during SSR/ISR revalidation
 */

export default function Loading() {
  return (
    <div className="bg-gray-50">
      {/* HERO SKELETON */}
      <div className="h-[450px] sm:h-[500px] md:h-[550px] lg:h-[600px] bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse" />

      {/* CATEGORIES SKELETON */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="relative aspect-[4/3] bg-gray-200 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS SKELETON */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex justify-between items-center mb-8">
            <div className="h-8 w-64 bg-gray-200 animate-pulse rounded" />
            <div className="h-6 w-24 bg-gray-200 animate-pulse rounded" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                {/* Image */}
                <div className="relative aspect-square bg-gray-200 animate-pulse rounded-lg" />
                {/* Title */}
                <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
                {/* Price */}
                <div className="h-6 bg-gray-200 animate-pulse rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS SKELETON */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-14 h-14 bg-gray-200 animate-pulse rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-6 bg-gray-200 animate-pulse rounded w-3/4" />
                    <div className="h-4 bg-gray-200 animate-pulse rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER SKELETON */}
      <section className="container mx-auto px-4 max-w-7xl py-12">
        <div className="relative bg-gradient-to-br from-gray-300 to-gray-400 rounded-3xl p-8 md:p-16 animate-pulse">
          <div className="text-center space-y-4">
            <div className="h-12 w-64 bg-gray-200 animate-pulse rounded mx-auto" />
            <div className="h-6 w-96 bg-gray-200 animate-pulse rounded mx-auto" />
            <div className="h-12 w-80 bg-gray-200 animate-pulse rounded mx-auto" />
          </div>
        </div>
      </section>
    </div>
  );
}
