import { GlassCard, GlassPanel } from "@/components/ui/glass";

// ============================================================================
// Hero KPI Skeleton
// ============================================================================

export function HeroKPISkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Skeleton Card 1 */}
      <GlassPanel gradient="indigo" className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 h-4 w-40 animate-pulse rounded bg-white/10" />
            <div className="mb-3 h-10 w-48 animate-pulse rounded bg-white/20" />
            <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
          </div>
          <div className="h-14 w-14 animate-pulse rounded-xl bg-white/10" />
        </div>
      </GlassPanel>

      {/* Skeleton Card 2 */}
      <GlassPanel gradient="emerald" className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 h-4 w-40 animate-pulse rounded bg-white/10" />
            <div className="mb-3 h-10 w-32 animate-pulse rounded bg-white/20" />
            <div className="h-4 w-48 animate-pulse rounded bg-white/10" />
          </div>
          <div className="h-14 w-14 animate-pulse rounded-xl bg-white/10" />
        </div>
      </GlassPanel>
    </div>
  );
}

// ============================================================================
// Single KPI Card Skeleton
// ============================================================================

export function KPICardSkeleton() {
  return (
    <GlassCard className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-5 w-5 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
      </div>
      <div className="mb-2 h-8 w-32 animate-pulse rounded bg-white/20" />
      <div className="h-3 w-40 animate-pulse rounded bg-white/10" />
      <div className="mt-4 h-16 w-full animate-pulse rounded bg-white/5" />
    </GlassCard>
  );
}

// ============================================================================
// Critical KPIs Grid Skeleton
// ============================================================================

export function CriticalKPIsSkeleton() {
  return (
    <GlassPanel gradient="violet" className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="mb-2 h-6 w-64 animate-pulse rounded bg-white/20" />
          <div className="h-4 w-80 animate-pulse rounded bg-white/10" />
        </div>
        <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>
    </GlassPanel>
  );
}

// ============================================================================
// Timeline Chart Skeleton
// ============================================================================

export function TimelineChartSkeleton() {
  return (
    <GlassPanel gradient="indigo" className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="mb-2 h-6 w-40 animate-pulse rounded bg-white/20" />
          <div className="h-4 w-64 animate-pulse rounded bg-white/10" />
        </div>
        <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
        </div>

        {/* Chart bars skeleton */}
        <div className="flex h-48 items-end gap-1">
          {Array.from({ length: 90 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 animate-pulse rounded-t bg-white/10"
              style={{ height: `${40 + Math.random() * 40}%` }}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
        </div>

        <div className="mt-4 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-white/10" />
          <div className="h-4 w-full animate-pulse rounded bg-white/10" />
        </div>
      </div>
    </GlassPanel>
  );
}

// ============================================================================
// Transaction List Skeleton
// ============================================================================

export function TransactionListSkeleton() {
  return (
    <GlassCard className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-6 w-40 animate-pulse rounded bg-white/20" />
        <div className="h-4 w-20 animate-pulse rounded bg-white/10" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
          >
            <div className="h-9 w-9 animate-pulse rounded-lg bg-white/10" />
            <div className="flex-1">
              <div className="mb-2 h-4 w-40 animate-pulse rounded bg-white/20" />
              <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
            </div>
            <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ============================================================================
// Alerts Row Skeleton
// ============================================================================

export function AlertsRowSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <GlassCard key={i} className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded bg-white/10" />
            <div className="h-5 w-32 animate-pulse rounded bg-white/20" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                className="h-16 w-full animate-pulse rounded-lg bg-white/5"
              />
            ))}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

// ============================================================================
// Insights Section Skeleton
// ============================================================================

export function InsightsSectionSkeleton() {
  return (
    <GlassCard className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-5 w-5 animate-pulse rounded bg-white/10" />
        <div className="h-6 w-48 animate-pulse rounded bg-white/20" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-4"
          >
            <div className="h-9 w-9 animate-pulse rounded-lg bg-white/10" />
            <div className="flex-1">
              <div className="mb-2 h-4 w-48 animate-pulse rounded bg-white/20" />
              <div className="h-3 w-full animate-pulse rounded bg-white/10" />
            </div>
            <div className="h-5 w-5 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ============================================================================
// Quick Actions Skeleton
// ============================================================================

export function QuickActionsSkeleton() {
  return (
    <GlassCard className="p-6">
      <div className="mb-4 h-6 w-40 animate-pulse rounded bg-white/20" />

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div className="h-9 w-9 animate-pulse rounded-lg bg-white/10" />
            <div className="flex-1">
              <div className="mb-2 h-4 w-40 animate-pulse rounded bg-white/20" />
              <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
            </div>
            <div className="h-5 w-5 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
