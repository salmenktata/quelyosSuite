/**
 * TreasuryForecast - Prévision trésorerie simplifiée
 *
 * Projette le solde bancaire dans 30 jours basé sur :
 * - Solde actuel
 * - Moyenne revenus/dépenses sur 90 derniers jours
 *
 * Fonctionnalités :
 * - Projection 30 jours
 * - Alerte si risque trésorerie négative
 * - Indicateur visuel couleur (vert/orange/rouge)
 * - Conforme dark mode
 */

import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface TreasuryForecastProps {
  currentBalance: number;
  averageDailyIncome: number;
  averageDailyExpenses: number;
  formatAmount: (amount: number) => string;
}

export function TreasuryForecast({
  currentBalance,
  averageDailyIncome,
  averageDailyExpenses,
  formatAmount,
}: TreasuryForecastProps) {
  // Calculate projection 30 days ahead
  const daysAhead = 30;
  const projectedChange =
    (averageDailyIncome - averageDailyExpenses) * daysAhead;
  const projectedBalance = currentBalance + projectedChange;

  // Determine status
  const isNegative = projectedBalance < 0;
  const isWarning = projectedBalance > 0 && projectedBalance < currentBalance * 0.3;
  const isPositive = !isNegative && !isWarning;

  // Color variants
  const bgColor = isNegative
    ? 'bg-red-50 dark:bg-red-900/20'
    : isWarning
      ? 'bg-amber-50 dark:bg-amber-900/20'
      : 'bg-emerald-50 dark:bg-emerald-900/20';

  const borderColor = isNegative
    ? 'border-red-200 dark:border-red-800'
    : isWarning
      ? 'border-amber-200 dark:border-amber-800'
      : 'border-emerald-200 dark:border-emerald-800';

  const textColor = isNegative
    ? 'text-red-800 dark:text-red-200'
    : isWarning
      ? 'text-amber-800 dark:text-amber-200'
      : 'text-emerald-800 dark:text-emerald-200';

  const iconColor = isNegative
    ? 'text-red-600 dark:text-red-400'
    : isWarning
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-emerald-600 dark:text-emerald-400';

  return (
    <div
      className={`${bgColor} ${borderColor} border rounded-xl p-6`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Prévision dans {daysAhead} jours
          </h3>
          <p className={`text-2xl font-bold ${textColor}`}>
            {formatAmount(projectedBalance)}
          </p>
        </div>

        <div className={iconColor}>
          {isNegative ? (
            <TrendingDown className="w-6 h-6" />
          ) : (
            <TrendingUp className="w-6 h-6" />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Solde actuel
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatAmount(currentBalance)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Variation prévue
          </span>
          <span
            className={`font-medium ${
              projectedChange >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {projectedChange >= 0 ? '+' : ''}
            {formatAmount(projectedChange)}
          </span>
        </div>

        <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Basé sur moyenne quotidienne {formatAmount(averageDailyIncome)}{' '}
            revenus / {formatAmount(averageDailyExpenses)} dépenses
          </p>
        </div>

        {isNegative && (
          <div className="flex items-start gap-2 mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-800 dark:text-red-200">
              <strong>Alerte :</strong> Risque de trésorerie négative. Ajustez
              vos dépenses ou anticipez des revenus supplémentaires.
            </p>
          </div>
        )}

        {isWarning && (
          <div className="flex items-start gap-2 mt-3 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>Attention :</strong> Trésorerie en baisse significative.
              Surveillez vos flux de trésorerie.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
