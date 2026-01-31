

import { useState } from "react";
import { GlassPanel, GlassBadge } from '@quelyos/ui/glass';
import { Clock, Mail, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useCurrency } from "@/lib/finance/CurrencyContext";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type AlertTrigger = {
  id: number;
  triggeredAt: string;
  value: number;
  emailSent: boolean;
  emailSentAt?: string;
  context?: Record<string, unknown>;
};

type CashAlert = {
  id: number;
  name: string;
  type: string;
  triggers: AlertTrigger[];
};

type AlertHistoryTableProps = {
  alerts: CashAlert[];
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function AlertHistoryTable({ alerts }: AlertHistoryTableProps) {
  const { formatMoney } = useCurrency();
  const [isExpanded, setIsExpanded] = useState(false);

  // Extraire tous les triggers et les trier par date décroissante
  const allTriggers = alerts
    .flatMap((alert) =>
      alert.triggers.map((trigger) => ({
        ...trigger,
        alertId: alert.id,
        alertName: alert.name,
        alertType: alert.type,
      }))
    )
    .sort(
      (a, b) =>
        new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
    );

  // Limiter l'affichage si non étendu
  const displayedTriggers = isExpanded ? allTriggers : allTriggers.slice(0, 5);

  if (allTriggers.length === 0) {
    return null;
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <GlassPanel
      title="Historique des déclenchements"
      subtitle={`${allTriggers.length} déclenchement${
        allTriggers.length > 1 ? "s" : ""
      } au total`}
    >
      <div className="space-y-3">
        {displayedTriggers.map((trigger) => (
          <div
            key={trigger.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h4 className="text-white font-medium truncate">
                  {trigger.alertName}
                </h4>
                <GlassBadge variant="warning" className="shrink-0">
                  {trigger.alertType === "THRESHOLD" && "Seuil"}
                  {trigger.alertType === "NEGATIVE_FORECAST" && "Prévision"}
                  {trigger.alertType === "VARIANCE" && "Variance"}
                </GlassBadge>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(trigger.triggeredAt)}
                </span>

                {trigger.value !== undefined && (
                  <span className="flex items-center gap-1 font-medium text-amber-400">
                    Valeur: {formatMoney(trigger.value)}
                  </span>
                )}

                {trigger.context &&
                  typeof trigger.context === "object" &&
                  "currentBalance" in trigger.context && (
                    <span className="flex items-center gap-1">
                      Solde:{" "}
                      {formatMoney(
                        trigger.context.currentBalance as number
                      )}
                    </span>
                  )}
              </div>
            </div>

            <div className="flex items-center gap-3 sm:ml-4">
              {trigger.emailSent ? (
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Email envoyé</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <XCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Pas d'email</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bouton Voir plus/moins */}
      {allTriggers.length > 5 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Voir moins
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Voir tous les {allTriggers.length} déclenchements
              </>
            )}
          </button>
        </div>
      )}

      {/* Message si aucun déclenchement récent */}
      {displayedTriggers.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucun déclenchement récent</p>
          <p className="text-sm mt-1">
            Vos alertes vous préviendront dès qu'un seuil sera franchi
          </p>
        </div>
      )}
    </GlassPanel>
  );
}
