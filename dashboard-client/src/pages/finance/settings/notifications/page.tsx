

import { useEffect, useState, useCallback } from "react";
import { Loader2, Bell, FileJson, Download, AlertCircle, CheckCircle2, Gauge } from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import { API_BASE_URL } from "@/lib/api-base";
import { logger } from '@quelyos/logger';

type NotificationSettings = {
  emailOnTransaction: boolean;
  emailOnBudgetAlert: boolean;
  emailOnExpenseWarning: boolean;
  weeklyDigest: boolean;
  monthlyReport: boolean;
  budgetAlertThreshold: number;
};

const STORAGE_KEY = "qyl_notifications";

export default function NotificationsPage() {

  const [settings, setSettings] = useState<NotificationSettings>({
    emailOnTransaction: false,
    emailOnBudgetAlert: true,
    emailOnExpenseWarning: true,
    weeklyDigest: true,
    monthlyReport: true,
    budgetAlertThreshold: 80,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch preferences from API
  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/user/notifications/preferences`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setSettings({
          emailOnTransaction: data.emailOnTransaction ?? false,
          emailOnBudgetAlert: data.emailOnBudgetAlert ?? true,
          emailOnExpenseWarning: data.emailOnExpenseWarning ?? true,
          weeklyDigest: data.weeklyDigest ?? true,
          monthlyReport: data.monthlyReport ?? true,
          budgetAlertThreshold: data.budgetAlertThreshold ?? 80,
        });
      } else {
        // Fallback to localStorage
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch (err) {
      logger.error("Failed to fetch preferences:", err);
      // Fallback to localStorage
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setSettings((prev) => ({ ...prev, ...parsed }));
        } catch {
          // ignore
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const toggle = (key: keyof Omit<NotificationSettings, "budgetAlertThreshold">) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const setThreshold = (value: number) => {
    setSettings((prev) => ({ ...prev, budgetAlertThreshold: value }));
    setSaved(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch(`${API_BASE_URL}/user/notifications/preferences`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error("Failed to save preferences");
      }

      // Also save to localStorage as fallback
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSaved(true);

      // Auto-hide success after 3s
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      // Fallback: save locally only
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setError("Sauvegardé localement (API indisponible)");
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3 mt-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Email notifications */}
          <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-xl space-y-6">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications par email
              </h2>
              <p className="text-sm text-indigo-100/80 mt-1">Choisissez ce que vous souhaitez recevoir.</p>
            </div>

            <div className="space-y-3">
              {[
                {
                  key: "emailOnTransaction" as const,
                  label: "Chaque transaction",
                  description: "Recevez une notification immédiate",
                },
                {
                  key: "emailOnBudgetAlert" as const,
                  label: "Alerte budget",
                  description: "Quand vous approchez de votre limite",
                },
                {
                  key: "emailOnExpenseWarning" as const,
                  label: "Alerte dépenses",
                  description: "Quand les dépenses montent anormalement",
                },
                {
                  key: "weeklyDigest" as const,
                  label: "Digest hebdomadaire",
                  description: "Résumé de vos finances chaque lundi",
                },
                {
                  key: "monthlyReport" as const,
                  label: "Rapport mensuel",
                  description: "Analyse complète le 1er de chaque mois",
                },
              ].map(({ key, label, description }) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition"
                >
                  <div>
                    <div className="font-medium">{label}</div>
                    <div className="text-xs text-indigo-100/60">{description}</div>
                  </div>
                  <Switch checked={settings[key]} onCheckedChange={() => toggle(key)} />
                </div>
              ))}
            </div>
          </div>

          {/* Budget alert threshold */}
          <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Seuil d&apos;alerte budget
              </h2>
              <p className="text-sm text-indigo-100/80 mt-1">
                Recevoir une alerte quand le budget atteint ce pourcentage.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={settings.budgetAlertThreshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="flex-1 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-2xl font-bold text-indigo-300 w-16 text-right">
                  {settings.budgetAlertThreshold}%
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>50%</span>
                <span>75%</span>
                <span>95%</span>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center gap-4">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold shadow-lg transition hover:from-indigo-400 hover:to-violet-400 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Sauvegardé
                </>
              ) : (
                "Sauvegarder les préférences"
              )}
            </button>

            {error && (
              <div className="flex items-center gap-2 text-sm text-amber-300">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Exports sidebar */}
        <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-xl space-y-4 h-fit">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exports
          </h3>

          <div className="space-y-3">
            <button className="w-full flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 hover:bg-white/10 transition text-left">
              <div>
                <div className="text-sm font-medium">Historique JSON</div>
                <div className="text-xs text-indigo-100/60">Toutes vos transactions</div>
              </div>
              <FileJson className="h-5 w-5 text-indigo-300" />
            </button>

            <button className="w-full flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 hover:bg-white/10 transition text-left">
              <div>
                <div className="text-sm font-medium">Historique CSV</div>
                <div className="text-xs text-indigo-100/60">Format Excel/Sheets</div>
              </div>
              <FileJson className="h-5 w-5 text-indigo-300" />
            </button>

            <button className="w-full flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 hover:bg-white/10 transition text-left">
              <div>
                <div className="text-sm font-medium">Rapport PDF</div>
                <div className="text-xs text-indigo-100/60">Vue d&apos;ensemble imprimable</div>
              </div>
              <Download className="h-5 w-5 text-indigo-300" />
            </button>
          </div>

          <div className="text-xs text-indigo-100/60 border-t border-white/10 pt-3">
            Les exports sont générés instantanément et sécurisés.
          </div>
        </div>
      </div>
    </div>
  );
}
