import { useNavigate } from "react-router-dom";
import { BudgetProgressBar } from "./BudgetProgressBar";
import { BudgetActionMenu } from "./BudgetActionMenu";

type BudgetStatus = "ON_TRACK" | "WARNING" | "EXCEEDED";
type BudgetPeriod = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";

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

interface BudgetCardProps {
  budget: Budget;
  formatCurrency: (amount: number) => string;
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
  ON_TRACK: "OK",
  WARNING: "Attention",
  EXCEEDED: "Dépassé"
};

const statusStyles: Record<BudgetStatus, string> = {
  ON_TRACK: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  WARNING: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  EXCEEDED: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300"
};

export function BudgetCard({ budget, formatCurrency, onEdit, onDuplicate, onDelete }: BudgetCardProps) {
  const navigate = useNavigate();

  return (
    <div
      data-testid="budget-card"
      data-status={budget.status ? budget.status.toLowerCase() : undefined}
      onClick={() => navigate(`/finance/budgets/${budget.id}`)}
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-all ${
        budget.status === "EXCEEDED"
          ? "ring-1 ring-rose-200 dark:ring-rose-800"
          : budget.status === "WARNING"
            ? "ring-1 ring-amber-200 dark:ring-amber-800"
            : ""
      }`}
    >
      <div className="space-y-3">
        {/* Header: Name + Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{budget.name}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {budget.status && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[budget.status]}`}>
                {statusLabels[budget.status]}
              </span>
            )}
            <BudgetActionMenu
              budget={budget}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          </div>
        </div>

        {/* Category + Period */}
        <div className="flex items-center gap-2 flex-wrap">
          {budget.category ? (
            <span className="inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
              {budget.category.name}
            </span>
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-400">Toutes catégories</span>
          )}
          {budget.period && (
            <span className="text-xs text-gray-600 dark:text-gray-400">
              • {periodLabels[budget.period]}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {budget.percentageUsed !== undefined && budget.status && (
          <div className="space-y-1">
            <BudgetProgressBar percentage={budget.percentageUsed} status={budget.status} />
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>
                {formatCurrency(budget.currentSpending || 0)} / {formatCurrency(budget.amount)}
              </span>
              <span className="font-medium">
                {budget.percentageUsed.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Amounts (if no progress data) */}
        {budget.percentageUsed === undefined && (
          <div className="text-sm">
            <div className="text-gray-900 dark:text-white font-medium">
              Budget: {formatCurrency(budget.amount)}
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              Dépensé: {formatCurrency(budget.currentSpending || 0)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
