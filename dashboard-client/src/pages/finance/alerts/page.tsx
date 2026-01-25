

import React, { useState, useEffect } from "react";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { api } from "@/lib/api";
import { GlassCard, GlassButton, GlassBadge, GlassPanel } from "@/components/ui/glass";
import { Plus, Settings, Trash2, TestTube, ToggleLeft, ToggleRight, AlertTriangle, Clock, Mail, TrendingDown, Target } from "lucide-react";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import AlertConfigForm from "@/components/finance/alerts/AlertConfigForm";
import AlertHistoryTable from "@/components/finance/alerts/AlertHistoryTable";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type CashAlertType = "THRESHOLD" | "NEGATIVE_FORECAST" | "VARIANCE";

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
  type: CashAlertType;
  isActive: boolean;
  thresholdAmount?: number;
  horizonDays?: number;
  compareOperator?: string;
  cooldownHours: number;
  emailEnabled: boolean;
  emailRecipients: string[];
  createdAt: string;
  updatedAt: string;
  triggers: AlertTrigger[];
  _count: { triggers: number };
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function AlertsPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const { formatMoney } = useCurrency();

  const [alerts, setAlerts] = useState<CashAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<CashAlert | null>(null);
  const [testingAlert, setTestingAlert] = useState<number | null>(null);

  // Charger les alertes
  useEffect(() => {
    if (!authLoading && user) {
      loadAlerts();
    }
  }, [authLoading, user]);

  async function loadAlerts() {
    try {
      setLoading(true);
      const data = await api<{ alerts: CashAlert[] }>(
        "/api/v1/finance/alerts",
        { method: "GET" }
      );
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setLoading(false);
    }
  }

  // Activer/désactiver une alerte
  async function toggleAlert(id: number, isActive: boolean) {
    try {
      await api(`/api/v1/finance/alerts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !isActive }),
      });
      loadAlerts();
    } catch (err) {
      console.error("Failed to toggle alert:", err);
      alert("Erreur lors de la modification de l'alerte");
    }
  }

  // Supprimer une alerte
  async function deleteAlert(id: number) {
    if (!confirm("Supprimer cette alerte ? Cette action est irréversible.")) return;

    try {
      await api(`/api/v1/finance/alerts/${id}`, { method: "DELETE" });
      loadAlerts();
    } catch (err) {
      console.error("Failed to delete alert:", err);
      alert("Erreur lors de la suppression de l'alerte");
    }
  }

  // Tester une alerte
  async function testAlert(id: number) {
    try {
      setTestingAlert(id);
      const data = await api<{ shouldTrigger: boolean; message: string; context?: Record<string, unknown> }>(
        `/api/v1/finance/alerts/${id}/test`,
        { method: "POST" }
      );
      alert(data.message);
    } catch (err) {
      console.error("Failed to test alert:", err);
      alert("Erreur lors du test de l'alerte");
    } finally {
      setTestingAlert(null);
    }
  }

  // Formater le type d'alerte
  function getAlertTypeLabel(type: CashAlertType): string {
    switch (type) {
      case "THRESHOLD":
        return "Seuil de trésorerie";
      case "NEGATIVE_FORECAST":
        return "Prévision négative";
      case "VARIANCE":
        return "Écart vs prévision";
      default:
        return type;
    }
  }

  // Icône selon le type
  function getAlertIcon(type: CashAlertType) {
    switch (type) {
      case "THRESHOLD":
        return <Target className="w-4 h-4" />;
      case "NEGATIVE_FORECAST":
        return <TrendingDown className="w-4 h-4" />;
      case "VARIANCE":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  }

  if (authLoading || loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-white/60">Chargement des alertes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-amber-400" />
            Alertes Trésorerie
          </h1>
          <p className="text-slate-400 mt-2">
            Configurez des alertes proactives pour anticiper les risques et protéger votre trésorerie
          </p>
        </div>
        <GlassButton variant="primary" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle alerte
        </GlassButton>
      </div>

      {/* Stats rapides */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Alertes actives</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {alerts.filter((a) => a.isActive).length}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <ToggleRight className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Déclenchements (30j)</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {alerts.reduce((sum, a) => sum + a._count.triggers, 0)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Emails envoyés</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {alerts.reduce(
                    (sum, a) =>
                      sum + a.triggers.filter((t) => t.emailSent).length,
                    0
                  )}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Liste des alertes */}
      <GlassPanel
        title="Mes alertes"
        subtitle={`${alerts.length} alerte${alerts.length > 1 ? "s" : ""} configurée${alerts.length > 1 ? "s" : ""}`}
      >
        {alerts.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-6">
              Aucune alerte configurée. Créez votre première alerte pour être averti des risques.
            </p>
            <GlassButton variant="primary" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer ma première alerte
            </GlassButton>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-slate-600/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {getAlertIcon(alert.type)}
                      <h3 className="text-white font-semibold truncate">
                        {alert.name}
                      </h3>
                    </div>
                    <GlassBadge variant={alert.isActive ? "success" : "default"}>
                      {alert.isActive ? "Active" : "Désactivée"}
                    </GlassBadge>
                    <GlassBadge variant="info">
                      {getAlertTypeLabel(alert.type)}
                    </GlassBadge>
                    {alert._count.triggers > 0 && (
                      <GlassBadge variant="warning">
                        {alert._count.triggers} déclenchement
                        {alert._count.triggers > 1 ? "s" : ""}
                      </GlassBadge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap">
                    {alert.type === "THRESHOLD" && alert.thresholdAmount && (
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Seuil : {formatMoney(alert.thresholdAmount)}
                      </span>
                    )}
                    {alert.type === "NEGATIVE_FORECAST" && alert.horizonDays && (
                      <span className="flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        Horizon : {alert.horizonDays}j
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Cooldown : {alert.cooldownHours}h
                    </span>
                    {alert.emailEnabled && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Email activé
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:ml-4">
                  <button
                    onClick={() => testAlert(alert.id)}
                    disabled={testingAlert === alert.id}
                    className="p-2 hover:bg-slate-700/30 rounded-lg transition-colors disabled:opacity-50"
                    title="Tester cette alerte"
                  >
                    <TestTube className="w-4 h-4 text-slate-400" />
                  </button>
                  <button
                    onClick={() => toggleAlert(alert.id, alert.isActive)}
                    className="p-2 hover:bg-slate-700/30 rounded-lg transition-colors"
                    title={alert.isActive ? "Désactiver" : "Activer"}
                  >
                    {alert.isActive ? (
                      <ToggleRight className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditingAlert(alert);
                      setShowForm(true);
                    }}
                    className="p-2 hover:bg-slate-700/30 rounded-lg transition-colors"
                    title="Modifier"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                  </button>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      {/* Historique des déclenchements */}
      {alerts.length > 0 && <AlertHistoryTable alerts={alerts} />}

      {/* Formulaire de configuration (modal) */}
      {(showForm || editingAlert) && (
        <AlertConfigForm
          alert={editingAlert}
          onClose={() => {
            setShowForm(false);
            setEditingAlert(null);
          }}
          onSave={() => {
            loadAlerts();
            setShowForm(false);
            setEditingAlert(null);
          }}
        />
      )}
    </div>
  );
}
