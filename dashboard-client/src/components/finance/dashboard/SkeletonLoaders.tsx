// Pre-computed bar heights for skeleton chart (avoids Math.random during render)
const SKELETON_BAR_HEIGHTS = Array.from({ length: 90 }, (_, i) => 40 + ((i * 37 + 13) % 40));

// ============================================================================
// Hero KPI Skeleton
// ============================================================================

export function HeroKPISkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Skeleton Card 1 */}
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-xl shadow-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 h-4 w-40 animate-pulse rounded bg-white/20" />
            <div className="mb-3 h-10 w-48 animate-pulse rounded bg-white/30" />
            <div className="h-4 w-32 animate-pulse rounded bg-white/20" />
          </div>
          <div className="h-14 w-14 animate-pulse rounded-xl bg-white/20" />
        </div>
      </div>

      {/* Skeleton Card 2 */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 rounded-xl shadow-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 h-4 w-40 animate-pulse rounded bg-white/20" />
            <div className="mb-3 h-10 w-32 animate-pulse rounded bg-white/30" />
            <div className="h-4 w-48 animate-pulse rounded bg-white/20" />
          </div>
          <div className="h-14 w-14 animate-pulse rounded-xl bg-white/20" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Single KPI Card Skeleton
// ============================================================================

export function KPICardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-5 w-5 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="mb-2 h-8 w-32 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
      <div className="h-3 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mt-4 h-16 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-700/50" />
    </div>
  );
}

// ============================================================================
// Critical KPIs Grid Skeleton
// ============================================================================

export function CriticalKPIsSkeleton() {
  return (
    <div className="bg-gradient-to-br from-violet-500 to-violet-600 dark:from-violet-600 dark:to-violet-700 rounded-xl shadow-lg p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="mb-2 h-6 w-64 animate-pulse rounded bg-white/30" />
          <div className="h-4 w-80 animate-pulse rounded bg-white/20" />
        </div>
        <div className="h-4 w-32 animate-pulse rounded bg-white/20" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>
    </div>
  );
}

// ============================================================================
// Timeline Chart Skeleton
// ============================================================================

export function TimelineChartSkeleton() {
  return (
    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-xl shadow-lg p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="mb-2 h-6 w-40 animate-pulse rounded bg-white/30" />
          <div className="h-4 w-64 animate-pulse rounded bg-white/20" />
        </div>
        <div className="h-4 w-32 animate-pulse rounded bg-white/20" />
      </div>

      <div className="rounded-xl border border-white/20 bg-white/10 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-3 w-20 animate-pulse rounded bg-white/20" />
          <div className="h-3 w-16 animate-pulse rounded bg-white/20" />
          <div className="h-3 w-16 animate-pulse rounded bg-white/20" />
          <div className="h-3 w-16 animate-pulse rounded bg-white/20" />
        </div>

        {/* Chart bars skeleton */}
        <div className="flex h-48 items-end gap-1">
          {SKELETON_BAR_HEIGHTS.map((height, i) => (
            <div
              key={i}
              className="flex-1 animate-pulse rounded-t bg-white/20"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="h-3 w-24 animate-pulse rounded bg-white/20" />
          <div className="h-3 w-24 animate-pulse rounded bg-white/20" />
        </div>

        <div className="mt-4 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-white/20" />
          <div className="h-4 w-full animate-pulse rounded bg-white/20" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Transaction List Skeleton
// ============================================================================

export function TransactionListSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-6 w-40 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
        <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-3"
          >
            <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-600" />
            <div className="flex-1">
              <div className="mb-2 h-4 w-40 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Alerts Row Skeleton
// ============================================================================

export function AlertsRowSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-5 w-32 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                className="h-16 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700/50"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Insights Section Skeleton
// ============================================================================

export function InsightsSectionSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-5 w-5 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-6 w-48 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-4"
          >
            <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-600" />
            <div className="flex-1">
              <div className="mb-2 h-4 w-48 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
              <div className="h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="h-5 w-5 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Quick Actions Skeleton
// ============================================================================

export function QuickActionsSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <div className="mb-4 h-6 w-40 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-4"
          >
            <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-600" />
            <div className="flex-1">
              <div className="mb-2 h-4 w-40 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
              <div className="h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="h-5 w-5 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    </div>
  );
}
