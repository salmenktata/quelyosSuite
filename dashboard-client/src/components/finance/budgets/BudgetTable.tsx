import { useNavigate } from "react-router-dom";
import { GlassBadge } from "@/components/ui/glass";
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
  onEdit?: (budget: Budget) => void;
  onDuplicate?: (budget: Budget) => void;
  onDelete?: (budget: Budget) => void;
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

const statusVariants: Record<BudgetStatus, "success" | "warning" | "error"> = {
  ON_TRACK: "success",
  WARNING: "warning",
  EXCEEDED: "error"
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
    <ChevronUp className="w-4 h-4 text-indigo-300" />
  ) : (
    <ChevronDown className="w-4 h-4 text-indigo-300" />
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
          <tr className="border-b border-white/10">
            <th
              onClick={() => onSort("name")}
              className="px-4 py-3 text-left text-sm font-medium text-indigo-200 cursor-pointer hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                Nom
                <SortIcon column="name" sortBy={sortBy} sortDir={sortDir} />
              </div>
            </th>
            <th
              onClick={() => onSort("category")}
              className="px-4 py-3 text-left text-sm font-medium text-indigo-200 cursor-pointer hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                Catégorie
                <SortIcon column="category" sortBy={sortBy} sortDir={sortDir} />
              </div>
            </th>
            <th
              onClick={() => onSort("period")}
              className="px-4 py-3 text-left text-sm font-medium text-indigo-200 cursor-pointer hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                Période
                <SortIcon column="period" sortBy={sortBy} sortDir={sortDir} />
              </div>
            </th>
            <th
              onClick={() => onSort("amount")}
              className="px-4 py-3 text-right text-sm font-medium text-indigo-200 cursor-pointer hover:text-white transition-colors"
            >
              <div className="flex items-center justify-end gap-2">
                Montant
                <SortIcon column="amount" sortBy={sortBy} sortDir={sortDir} />
              </div>
            </th>
            <th
              onClick={() => onSort("percentageUsed")}
              className="px-4 py-3 text-left text-sm font-medium text-indigo-200 cursor-pointer hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                Progression
                <SortIcon column="percentageUsed" sortBy={sortBy} sortDir={sortDir} />
              </div>
            </th>
            <th
              onClick={() => onSort("status")}
              className="px-4 py-3 text-left text-sm font-medium text-indigo-200 cursor-pointer hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                Statut
                <SortIcon column="status" sortBy={sortBy} sortDir={sortDir} />
              </div>
            </th>
            <th className="px-4 py-3 w-12"></th>
          </tr>
        </thead>
        <tbody>
          {budgets.map((budget) => (
            <tr
              key={budget.id}
              className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                budget.status === "EXCEEDED"
                  ? "budget-exceeded"
                  : budget.status === "WARNING"
                    ? "budget-warning"
                    : ""
              }`}
              data-status={budget.status ? budget.status.toLowerCase() : undefined}
            >
              <td
                onClick={() => navigate(`/dashboard/budgets/${budget.id}`)}
                className="px-4 py-4 cursor-pointer"
                data-testid="budget-card"
                data-status={budget.status ? budget.status.toLowerCase() : undefined}
              >
                <div className="font-medium text-white hover:text-indigo-300 transition-colors">
                  {budget.name}
                </div>
              </td>
              <td className="px-4 py-4">
                {budget.category ? (
                  <GlassBadge variant="info" className="text-xs">
                    {budget.category.name}
                  </GlassBadge>
                ) : (
                  <span className="text-xs text-indigo-100/60">Toutes catégories</span>
                )}
              </td>
              <td className="px-4 py-4">
                {budget.period ? (
                  <span className="text-sm text-indigo-100">
                    {periodLabels[budget.period]}
                  </span>
                ) : (
                  <span className="text-sm text-indigo-100/60">-</span>
                )}
              </td>
              <td className="px-4 py-4 text-right">
                <div className="font-medium text-white">
                  {formatCurrency(budget.amount)}
                </div>
                <div className="text-xs text-indigo-100/60">
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
                    <div className="text-xs text-indigo-100/70">
                      {budget.percentageUsed.toFixed(1)}%
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-indigo-100/60">-</span>
                )}
              </td>
              <td className="px-4 py-4">
                {budget.status ? (
                  <GlassBadge variant={statusVariants[budget.status]} className="text-xs">
                    {statusLabels[budget.status]}
                  </GlassBadge>
                ) : (
                  <span className="text-xs text-indigo-100/60">-</span>
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
          <tr className="border-t border-white/10">
            <td colSpan={7} className="px-4 py-3 text-sm text-indigo-100/70">
              {budgets.length} budget{budgets.length > 1 ? "s" : ""} • Total budgété: {formatCurrency(totalAmount)} • Total dépensé: {formatCurrency(totalSpent)}
            </td>
          </tr>
        </tfoot>
      </table>

      {budgets.length === 0 && (
        <div className="py-12 text-center text-indigo-100/60">
          Aucun budget à afficher
        </div>
      )}
    </div>
  );
}
