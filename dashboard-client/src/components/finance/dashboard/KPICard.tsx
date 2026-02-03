/**
 * KPICard - Carte KPI minimaliste pour dashboard simplifié
 *
 * Composant simple pour afficher un indicateur clé (KPI) avec :
 * - Icône colorée
 * - Titre descriptif
 * - Valeur principale
 * - Badge optionnel (success/warning/danger)
 * - Tendance optionnelle (↑↓ + pourcentage)
 * - Sparkline optionnel (graphique mini)
 *
 * Conforme aux standards UI_PATTERNS.md :
 * - Dark mode complet
 * - Responsive
 * - Accessibilité
 */

import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  badge?: {
    label: string;
    variant: 'success' | 'warning' | 'danger';
  };
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string; // e.g., "+12.5%"
  };
  sparklineData?: number[]; // Array de valeurs pour mini graphique
}

export function KPICard({
  title,
  value,
  icon: Icon,
  badge,
  trend,
  sparklineData,
}: KPICardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </h3>
        </div>

        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              trend.direction === 'up'
                ? 'text-green-600 dark:text-green-400'
                : trend.direction === 'down'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {trend.direction === 'up' ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : trend.direction === 'down' ? (
              <TrendingDown className="w-3.5 h-3.5" />
            ) : null}
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {value}
      </p>

      <div className="flex items-center gap-2">
        {badge && (
          <span
            className={`inline-flex px-2 py-1 text-xs rounded-full ${
              badge.variant === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : badge.variant === 'warning'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            }`}
          >
            {badge.label}
          </span>
        )}

        {sparklineData && sparklineData.length > 0 && (
          <div className="flex-1">
            <Sparkline data={sparklineData} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Sparkline - Mini graphique SVG pour tendances
 */
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
}

function Sparkline({ data, width = 80, height = 24 }: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  // Déterminer la couleur basée sur tendance globale
  const trend = (data[data.length - 1] ?? 0) >= (data[0] ?? 0) ? 'up' : 'down';
  const strokeColor =
    trend === 'up'
      ? 'rgb(34, 197, 94)' // green-500
      : 'rgb(239, 68, 68)'; // red-500

  return (
    <svg
      width={width}
      height={height}
      className="inline-block"
      viewBox={`0 0 ${width} ${height}`}
    >
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
