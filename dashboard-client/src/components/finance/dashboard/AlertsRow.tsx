import { memo, useState } from "react";
import { Target, CheckCircle2, Zap, Clock, MoreHorizontal } from "lucide-react";
import { GlassCard } from "@/components/ui/glass";
import AlertWidget from "@/components/finance/alerts/AlertWidget";
import { StaggerContainer, StaggerItem } from "@/lib/finance/compat/animated";
import { ActionDialog } from "./ActionDialog";
import type { DashboardAction } from "@/lib/finance/reporting";

interface AlertsRowProps {
  actions: DashboardAction[];
}

// Format due date for display
function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Demain";
  if (diffDays === -1) return "Hier";
  if (diffDays < 0) return `Il y a ${Math.abs(diffDays)} jours`;
  if (diffDays <= 7) return `Dans ${diffDays} jours`;

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export const AlertsRow = memo(function AlertsRow({ actions }: AlertsRowProps) {
  const [selectedAction, setSelectedAction] = useState<DashboardAction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleActionClick = (action: DashboardAction) => {
    setSelectedAction(action);
    setIsDialogOpen(true);
  };

  return (
    <>
      <StaggerContainer
        speed="fast"
        delay={0.1}
        className="grid gap-4 md:grid-cols-3"
      >
        {/* Alertes Trésorerie F93 */}
        <StaggerItem>
          <AlertWidget />
        </StaggerItem>

      {/* Actions Prioritaires */}
      <StaggerItem>
        <GlassCard className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-violet-400" />
            <h3 className="font-semibold text-white">
              Actions ({actions.length})
            </h3>
          </div>
          {actions.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-sm text-slate-400">Aucune action prioritaire</p>
            </div>
          ) : (
            <StaggerContainer speed="fast" className="space-y-2">
              {actions.slice(0, 3).map((action) => (
                <StaggerItem key={action.id}>
                  <div
                    className={`group relative flex items-start gap-3 rounded-lg border p-3 transition-all duration-150 ${
                      action.priority === "high"
                        ? "border-rose-500/30 bg-rose-950/10 hover:bg-rose-950/20"
                        : action.priority === "medium"
                          ? "border-amber-500/30 bg-amber-950/10 hover:bg-amber-950/20"
                          : "border-blue-500/30 bg-blue-950/10 hover:bg-blue-950/20"
                    }`}
                  >
                    <div
                      className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${
                        action.priority === "high"
                          ? "bg-rose-400"
                          : action.priority === "medium"
                            ? "bg-amber-400"
                            : "bg-blue-400"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {action.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {action.description}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>{formatDueDate(action.dueDate)}</span>
                        </div>
                        <button
                          onClick={() => handleActionClick(action)}
                          className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-violet-400 opacity-0 transition-all hover:bg-white/10 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                          Détails
                        </button>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </GlassCard>
      </StaggerItem>

      {/* Statut Général */}
      <StaggerItem>
        <GlassCard className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <h3 className="font-semibold text-white">Statut</h3>
          </div>
          <StaggerContainer speed="fast" className="space-y-3">
            <StaggerItem>
              <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 transition-colors duration-150 hover:bg-emerald-950/30">
                <span className="text-sm text-white">Budgets sains</span>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 transition-colors duration-150 hover:bg-emerald-950/30">
                <span className="text-sm text-white">Prévisions OK</span>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="flex items-center justify-between rounded-lg border border-indigo-500/30 bg-indigo-950/20 p-3 transition-colors duration-150 hover:bg-indigo-950/30">
                <span className="text-sm text-white">Runway: 4.2 mois</span>
                <Zap className="h-5 w-5 text-indigo-400" />
              </div>
            </StaggerItem>
          </StaggerContainer>
        </GlassCard>
      </StaggerItem>
    </StaggerContainer>

    {/* Action Dialog */}
    <ActionDialog
      open={isDialogOpen}
      onOpenChange={setIsDialogOpen}
      action={selectedAction}
    />
  </>
  );
});
