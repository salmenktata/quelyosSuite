import { useNavigate } from "react-router-dom";
import { BudgetProgressBar } from "./BudgetProgressBar";
import { BudgetActionMenu } from "./BudgetActionMenu";
import { ChevronUp, ChevronDown } from "lucide-react";

type BudgetStatus = "ON_TRACK" | "WARNING" | "EXCEEDED";
type BudgetPeriod = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";
type SortDirection = "asc" | "desc";
type SortColumn = "name" | "category" | "period" | "amount" | "percentageUsed" | "status";

interface Budget {
  id: number;
  name: string;
  amount: number;
  currentSpending?: number;
  percentageUsed?: number;
  status?: BudgetStatus;
  category?: { id: number; name: string } | null;
  period?: BudgetPeriod;
  startDate?: string;
  endDate?: string | null;
}

interface BudgetTableProps {
  budgets: Budget[];
  formatCurrency: (amount: number) => string;
  sortBy: SortColumn;
  sortDir: SortDirection;
  onSort: (column: SortColumn) => void;
  onEdit?: (budget: Budget) => void | Promise<void>;
  onDuplicate?: (budget: Budget) => void | Promise<void>;
  onDelete?: (budget: Budget) => void | Promise<void>;
}

const periodLabels: Record<BudgetPeriod, string> = {
  WEEKLY: "Hebdo",
  MONTHLY: "Mensuel",
  QUARTERLY: "Trimestriel",
  YEARLY: "Annuel",
  CUSTOM: "Personnalisé"
};

const statusLabels: Record<BudgetStatus, string> = {
  ON_TRACK: "Sur la bonne voie",
  WARNING: "Attention",
  EXCEEDED: "Dépassé"
};

const statusStyles: Record<BudgetStatus, string> = {
  ON_TRACK: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  WARNING: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  EXCEEDED: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300"
};

interface SortIconProps {
  column: SortColumn;
  sortBy: SortColumn;
  sortDir: SortDirection;
}

function SortIcon({ column, sortBy, sortDir }: SortIconProps) {
  if (sortBy !== column) {
    return <div className="w-4 h-4" />;
  }
  return sortDir === "asc" ? (
    <ChevronUp className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
  ) : (
    <ChevronDown className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
  );
}

export function BudgetTable({ budgets, formatCurrency, sortBy, sortDir, onSort, onEdit, onDuplicate, onDelete }: BudgetTableProps) {
  const navigate = useNavigate();

  const totalAmount = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.currentSpending || 0), 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th
              onClick={() => onSort("name")}
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                Nom
                <SortIcon column="name" sortBy={sortBy} sortDir={sortDir} />
              </div>
            </th>
            <th
              onClick={() => onSort("category")}
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                Catégorie
                <SortIcon column="category" sortBy={sortBy} sortDir={sortDir} />
              </div>
            </th>
            <th
              onClick={() => onSort("period")}
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                Période
                <SortIcon column="period" sortBy={sortBy} sortDir={sortDir} />
              </div>
            </th>
            <th
              onClick={() => onSort("amount")}
              className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <div className="flex items-center justify-end gap-2">
                Montant
                <SortIcon column="amount" sortBy={sortBy} sortDir={sortDir} />
              </div>
            </th>
            <th
              onClick={() => onSort("percentageUsed")}
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                Progression
                <SortIcon column="percentageUsed" sortBy={sortBy} sortDir={sortDir} />
              </div>
            </th>
            <th
              onClick={() => onSort("status")}
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                Statut
                <SortIcon column="status" sortBy={sortBy} sortDir={sortDir} />
              </div>
            </th>
            <th className="px-4 py-3 w-12"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {budgets.map((budget) => (
            <tr
              key={budget.id}
              className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                budget.status === "EXCEEDED"
                  ? "bg-rose-50/50 dark:bg-rose-900/10"
                  : budget.status === "WARNING"
                    ? "bg-amber-50/50 dark:bg-amber-900/10"
                    : ""
              }`}
              data-status={budget.status ? budget.status.toLowerCase() : undefined}
            >
              <td
                onClick={() => navigate(`/finance/budgets/${budget.id}`)}
                className="px-4 py-4 cursor-pointer"
                data-testid="budget-card"
                data-status={budget.status ? budget.status.toLowerCase() : undefined}
              >
                <div className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  {budget.name}
                </div>
              </td>
              <td className="px-4 py-4">
                {budget.category ? (
                  <span className="inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                    {budget.category.name}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400">Toutes catégories</span>
                )}
              </td>
              <td className="px-4 py-4">
                {budget.period ? (
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {periodLabels[budget.period]}
                  </span>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-4 text-right">
                <div className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(budget.amount)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCurrency(budget.currentSpending || 0)} dépensé
                </div>
              </td>
              <td className="px-4 py-4">
                {budget.percentageUsed !== undefined && budget.status ? (
                  <div className="space-y-1">
                    <BudgetProgressBar
                      percentage={budget.percentageUsed}
                      status={budget.status}
                      className="w-32"
                    />
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {budget.percentageUsed.toFixed(1)}%
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-4">
                {budget.status ? (
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[budget.status]}`}>
                    {statusLabels[budget.status]}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400">-</span>
                )}
              </td>
              <td className="px-4 py-4">
                <BudgetActionMenu
                  budget={budget}
                  onEdit={onEdit}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-gray-200 dark:border-gray-700">
            <td colSpan={7} className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
              {budgets.length} budget{budgets.length > 1 ? "s" : ""} • Total budgété: {formatCurrency(totalAmount)} • Total dépensé: {formatCurrency(totalSpent)}
            </td>
          </tr>
        </tfoot>
      </table>

      {budgets.length === 0 && (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          Aucun budget à afficher
        </div>
      )}
    </div>
  );
}
