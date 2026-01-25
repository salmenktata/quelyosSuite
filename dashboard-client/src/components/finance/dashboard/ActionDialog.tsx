

import { memo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Clock,
  CheckCircle2,
  Calendar,
  Mail,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DashboardAction } from "@/lib/finance/reporting";
import { showToast } from "@/lib/notifications";
import { api } from "@/lib/finance/api";

interface ActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: DashboardAction | null;
}

/**
 * Action Details Dialog
 * Features:
 * - Action details and description
 * - Related customers (for invoice reminders)
 * - Quick action buttons (Complete, Snooze, Email)
 * - Action history
 */
export const ActionDialog = memo(function ActionDialog({
  open,
  onOpenChange,
  action,
}: ActionDialogProps) {
  const queryClient = useQueryClient();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [snoozeDate, setSnoozeDate] = useState("");

  // Mark action as complete mutation
  const markCompleteMutation = useMutation({
    mutationFn: async (actionId: string) => {
      return api(`/actions/${actionId}/complete`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
      showToast("Action marquée comme complétée", "success");
      onOpenChange(false);
    },
    onError: () => {
      showToast("Erreur lors de la mise à jour", "error");
    },
  });

  // Snooze action mutation
  const snoozeMutation = useMutation({
    mutationFn: async ({ actionId, date }: { actionId: string; date: string }) => {
      return api(`/actions/${actionId}/snooze`, {
        method: "POST",
        body: JSON.stringify({ dueDate: date }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });
      showToast("Action reportée", "success");
      setShowDatePicker(false);
      onOpenChange(false);
    },
    onError: () => {
      showToast("Erreur lors du report", "error");
    },
  });

  const handleComplete = () => {
    if (!action) return;
    markCompleteMutation.mutate(action.id);
  };

  const handleSnooze = () => {
    if (!action || !snoozeDate) return;
    snoozeMutation.mutate({ actionId: action.id, date: snoozeDate });
  };

  const handleSendEmail = () => {
    if (!action?.customers || action.customers.length === 0) return;

    // Create mailto link with all customer emails
    const emails = action.customers
      .map((c) => c.email)
      .filter(Boolean)
      .join(",");

    if (emails) {
      window.location.href = `mailto:${emails}?subject=Rappel de paiement&body=Bonjour,%0D%0A%0D%0ANous vous contactons concernant le solde impayé de votre compte...`;
    }
  };

  if (!action) return null;

  const priorityColors = {
    high: "border-rose-500/50 bg-rose-500/10",
    medium: "border-amber-500/50 bg-amber-500/10",
    low: "border-blue-500/50 bg-blue-500/10",
  };

  const priorityIcons = {
    high: <AlertCircle className="h-5 w-5 text-rose-400" />,
    medium: <Clock className="h-5 w-5 text-amber-400" />,
    low: <Clock className="h-5 w-5 text-blue-400" />,
  };

  const isLoading = markCompleteMutation.isPending || snoozeMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-slate-900/95 backdrop-blur-xl sm:max-w-lg">
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4 text-slate-400" />
          <span className="sr-only">Fermer</span>
        </button>

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            {priorityIcons[action.priority]}
            <span>{action.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Priority badge */}
          <div
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 ${priorityColors[action.priority]}`}
          >
            <span className="text-xs font-semibold uppercase">
              {action.priority === "high"
                ? "Priorité Haute"
                : action.priority === "medium"
                  ? "Priorité Moyenne"
                  : "Priorité Basse"}
            </span>
          </div>

          {/* Description */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-slate-300">{action.description}</p>
          </div>

          {/* Due date */}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Calendar className="h-4 w-4" />
            <span>
              Échéance :{" "}
              {new Date(action.dueDate).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Related customers (for invoice reminders) */}
          {action.customers && action.customers.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h4 className="mb-2 text-sm font-semibold text-white">
                Clients concernés
              </h4>
              <div className="space-y-2">
                {action.customers.map((customer, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-300">{customer.name}</span>
                    <span className="font-semibold text-rose-400">
                      {customer.outstandingBalance.toFixed(2)} €
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">Actions rapides</h4>

            <div className="grid gap-2">
              {/* Mark Complete */}
              <button
                onClick={handleComplete}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 min-h-[44px] text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 active:scale-95 disabled:opacity-50"
              >
                {markCompleteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    En cours...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Marquer comme complétée
                  </>
                )}
              </button>

              {/* Snooze */}
              {!showDatePicker ? (
                <button
                  onClick={() => setShowDatePicker(true)}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 min-h-[44px] text-sm font-medium text-amber-400 transition-all hover:bg-amber-500/20 active:scale-95 disabled:opacity-50"
                >
                  <Clock className="h-4 w-4" />
                  Reporter
                </button>
              ) : (
                <div className="space-y-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
                  <label className="text-xs font-medium text-amber-300">
                    Nouvelle échéance
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={snoozeDate}
                      onChange={(e) => setSnoozeDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="flex-1 rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                    <button
                      onClick={handleSnooze}
                      disabled={!snoozeDate || isLoading}
                      className="rounded bg-amber-500 px-4 py-2.5 min-h-[44px] text-sm font-medium text-white transition-colors hover:bg-amber-600 active:scale-95 disabled:opacity-50"
                    >
                      {snoozeMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "OK"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Send Email (for invoice reminders) */}
              {action.type === "invoice-reminder" &&
                action.customers &&
                action.customers.some((c) => c.email) && (
                  <button
                    onClick={handleSendEmail}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 rounded-lg border border-blue-500/50 bg-blue-500/10 px-4 py-3 min-h-[44px] text-sm font-medium text-blue-400 transition-all hover:bg-blue-500/20 active:scale-95 disabled:opacity-50"
                  >
                    <Mail className="h-4 w-4" />
                    Envoyer un rappel par email
                  </button>
                )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
