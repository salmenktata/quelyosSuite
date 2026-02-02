import { useEffect, useState } from "react";
import { api } from "@/lib/finance/api";
import { AlertTriangle, ChevronRight, TrendingDown, Target, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { logger } from '@quelyos/logger';

type AlertTrigger = {
  id: number;
  triggeredAt: string;
  value: number;
  emailSent: boolean;
  context?: Record<string, unknown>;
};

type CashAlert = {
  id: number;
  name: string;
  type: string;
  triggers: AlertTrigger[];
};

type EnrichedTrigger = AlertTrigger & {
  alertName: string;
  alertType: string;
};

export default function AlertWidget() {
  const { formatMoney } = useCurrency();
  const [recentTriggers, setRecentTriggers] = useState<EnrichedTrigger[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentTriggers();
  }, []);

  async function loadRecentTriggers() {
    try {
      const data = await api<{ alerts: CashAlert[] }>(
        "/alerts",
        { method: "GET" }
      );

      const allTriggers: EnrichedTrigger[] = data.alerts.flatMap((alert) =>
        alert.triggers.map((t) => ({
          ...t,
          alertName: alert.name,
          alertType: alert.type,
        }))
      );

      const last48h = allTriggers.filter((t) => {
        const diff = Date.now() - new Date(t.triggeredAt).getTime();
        return diff < 48 * 60 * 60 * 1000;
      });

      const sorted = last48h.sort(
        (a, b) =>
          new Date(b.triggeredAt).getTime() -
          new Date(a.triggeredAt).getTime()
      );

      setRecentTriggers(sorted.slice(0, 3));
    } catch (_err) {
      logger.error("Failed to load alert triggers:", err);
    } finally {
      setLoading(false);
    }
  }

  function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;

    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getAlertIcon(type: string) {
    switch (type) {
      case "THRESHOLD":
        return <Target className="w-4 h-4" />;
      case "NEGATIVE_FORECAST":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  }

  if (loading || recentTriggers.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Alertes récentes</h3>
        </div>
        <Link
          to="/finance/alerts"
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
        >
          Voir tout
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {recentTriggers.map((trigger) => (
          <div
            key={trigger.id}
            className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-amber-600 dark:text-amber-400">
                    {getAlertIcon(trigger.alertType)}
                  </span>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {trigger.alertName}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(trigger.triggeredAt)}
                  </span>
                  {trigger.value !== undefined && (
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      {formatMoney(trigger.value)}
                    </span>
                  )}
                </div>
              </div>
              {trigger.emailSent && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                  ✓ Email
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Link
          to="/finance/alerts"
          className="block text-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
        >
          Configurer mes alertes →
        </Link>
      </div>
    </div>
  );
}
