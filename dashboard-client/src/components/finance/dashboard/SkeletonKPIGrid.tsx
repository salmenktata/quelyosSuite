/**
 * SkeletonKPIGrid - Skeleton loader pour grille de 4 KPIs
 *
 * Affiche un état de chargement pendant la récupération des données dashboard.
 * Structure identique à la grille KPICard pour éviter le layout shift.
 *
 * Conforme aux standards UI_PATTERNS.md :
 * - Dark mode complet
 * - Responsive (1/2/4 colonnes)
 */

import { Skeleton } from '@/components/common';

export function SkeletonKPIGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center gap-3 mb-3">
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton variant="text" width={120} />
          </div>
          <Skeleton variant="text" width={150} height={32} className="mb-2" />
          <Skeleton variant="text" width={80} />
        </div>
      ))}
    </div>
  );
}
