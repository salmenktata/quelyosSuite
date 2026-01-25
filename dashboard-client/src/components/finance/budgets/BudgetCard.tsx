import { useNavigate } from "react-router-dom";
import { GlassCard, GlassBadge } from "@/components/ui/glass";
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
  ON_TRACK: "OK",
  WARNING: "Attention",
  EXCEEDED: "Dépassé"
};

const statusVariants: Record<BudgetStatus, "success" | "warning" | "error"> = {
  ON_TRACK: "success",
  WARNING: "warning",
  EXCEEDED: "error"
};

export function BudgetCard({ budget, formatCurrency, onEdit, onDuplicate, onDelete }: BudgetCardProps) {
  const navigate = useNavigate();

  return (
    <GlassCard
      data-testid="budget-card"
      data-status={budget.status ? budget.status.toLowerCase() : undefined}
      onClick={() => navigate(`/dashboard/budgets/${budget.id}`)}
      className={`p-4 cursor-pointer hover:bg-white/5 transition-all ${
        budget.status === "EXCEEDED"
          ? "budget-exceeded"
          : budget.status === "WARNING"
            ? "budget-warning"
            : ""
      }`}
    >
      <div className="space-y-3">
        {/* Header: Name + Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{budget.name}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {budget.status && (
              <GlassBadge variant={statusVariants[budget.status]} className="text-xs">
                {statusLabels[budget.status]}
              </GlassBadge>
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
            <GlassBadge variant="info" className="text-xs">
              {budget.category.name}
            </GlassBadge>
          ) : (
            <span className="text-xs text-indigo-100/60">Toutes catégories</span>
          )}
          {budget.period && (
            <span className="text-xs text-indigo-100/70">
              • {periodLabels[budget.period]}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {budget.percentageUsed !== undefined && budget.status && (
          <div className="space-y-1">
            <BudgetProgressBar percentage={budget.percentageUsed} status={budget.status} />
            <div className="flex items-center justify-between text-xs text-indigo-100/70">
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
            <div className="text-white font-medium">
              Budget: {formatCurrency(budget.amount)}
            </div>
            <div className="text-indigo-100/60">
              Dépensé: {formatCurrency(budget.currentSpending || 0)}
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
