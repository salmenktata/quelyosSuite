/**
 * SimpleTransactionList - Liste épurée des transactions récentes
 *
 * Affiche les 15 dernières transactions avec :
 * - Icône colorée crédit/débit
 * - Description + catégorie + date
 * - Montant avec signe
 *
 * Conforme aux standards UI_PATTERNS.md :
 * - Dark mode complet
 * - Responsive
 * - Empty state
 */

import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import type { DashboardTransaction } from '@/lib/finance/reporting';

interface SimpleTransactionListProps {
  transactions: DashboardTransaction[];
  formatAmount: (amount: number) => string;
}

export function SimpleTransactionList({
  transactions,
  formatAmount,
}: SimpleTransactionListProps) {
  if (transactions.length === 0) {
    return (
      <p className="text-center py-8 text-gray-500 dark:text-gray-400">
        Aucune transaction récente
      </p>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {transactions.slice(0, 15).map((tx) => (
        <div key={tx.id} className="py-3 flex items-center gap-4">
          <div
            className={`p-2 rounded-lg ${
              tx.type === 'credit'
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-red-50 dark:bg-red-900/20'
            }`}
          >
            {tx.type === 'credit' ? (
              <ArrowUpCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <ArrowDownCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {tx.description}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {tx.category?.name || 'Sans catégorie'} •{' '}
              {new Date(tx.date).toLocaleDateString('fr-FR')}
            </p>
          </div>

          <p
            className={`text-sm font-semibold ${
              tx.type === 'credit'
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {tx.type === 'credit' ? '+' : '-'}
            {formatAmount(Math.abs(tx.amount))}
          </p>
        </div>
      ))}
    </div>
  );
}
