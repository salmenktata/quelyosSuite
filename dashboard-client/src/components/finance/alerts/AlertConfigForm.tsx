

import React, { useState, useEffect } from "react";
import { api } from "@/lib/finance/api";
import { GlassCard, GlassButton } from "@/components/ui/glass";
import { X, AlertTriangle, Info } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type CashAlertType = "THRESHOLD" | "NEGATIVE_FORECAST" | "VARIANCE";

type AlertFormData = {
  name: string;
  type: CashAlertType;
  thresholdAmount: number;
  horizonDays: number;
  compareOperator: string;
  cooldownHours: number;
  emailEnabled: boolean;
  emailRecipients: string[];
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
};

type AlertConfigFormProps = {
  alert?: CashAlert | null;
  onClose: () => void;
  onSave: () => void;
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function AlertConfigForm({
  alert,
  onClose,
  onSave,
}: AlertConfigFormProps) {
  const [formData, setFormData] = useState<AlertFormData>({
    name: alert?.name || "",
    type: alert?.type || "THRESHOLD",
    thresholdAmount: alert?.thresholdAmount || 5000,
    horizonDays: alert?.horizonDays || 30,
    compareOperator: alert?.compareOperator || "lt",
    cooldownHours: alert?.cooldownHours || 24,
    emailEnabled: alert?.emailEnabled ?? true,
    emailRecipients: alert?.emailRecipients || [],
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mettre à jour le nom par défaut selon le type
  useEffect(() => {
    if (!alert && !formData.name) {
      generateDefaultName();
    }
  }, [formData.type, formData.thresholdAmount, formData.horizonDays]);

  function generateDefaultName() {
    let name = "";
    switch (formData.type) {
      case "THRESHOLD":
        name = `Seuil ${formData.thresholdAmount.toLocaleString("fr-FR")}€`;
        break;
      case "NEGATIVE_FORECAST":
        name = `Prévision négative ${formData.horizonDays}j`;
        break;
      case "VARIANCE":
        name = "Écart prévision/réalité";
        break;
    }
    setFormData((prev) => ({ ...prev, name }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError("Le nom de l'alerte est requis");
      return;
    }

    if (formData.type === "THRESHOLD" && formData.thresholdAmount <= 0) {
      setError("Le montant seuil doit être supérieur à 0");
      return;
    }

    if (formData.type === "NEGATIVE_FORECAST" && formData.horizonDays <= 0) {
      setError("L'horizon doit être supérieur à 0");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: formData.name,
        type: formData.type,
        thresholdAmount:
          formData.type === "THRESHOLD" ? formData.thresholdAmount : null,
        horizonDays:
          formData.type === "NEGATIVE_FORECAST" ? formData.horizonDays : null,
        compareOperator:
          formData.type === "THRESHOLD" ? formData.compareOperator : null,
        cooldownHours: formData.cooldownHours,
        emailEnabled: formData.emailEnabled,
        emailRecipients: formData.emailRecipients,
      };

      const url = alert
        ? `/api/v1/finance/alerts/${alert.id}`
        : "/api/v1/finance/alerts";

      await api(url, {
        method: alert ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });

      onSave();
    } catch (err) {
      console.error("Failed to save alert:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la sauvegarde de l'alerte"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <GlassCard className="max-w-2xl w-full my-8">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              {alert ? "Modifier l'alerte" : "Nouvelle alerte"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/30 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nom de l'alerte
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                placeholder="Ex: Seuil critique 5000€"
                required
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Type d'alerte
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as CashAlertType,
                  })
                }
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="THRESHOLD">Seuil de trésorerie</option>
                <option value="NEGATIVE_FORECAST">Prévision négative</option>
                <option value="VARIANCE" disabled>
                  Écart vs prévision (bientôt disponible)
                </option>
              </select>
              <p className="text-xs text-slate-400 mt-2 flex items-start gap-1">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                {formData.type === "THRESHOLD" &&
                  "Déclenche une alerte lorsque votre solde passe sous un seuil critique"}
                {formData.type === "NEGATIVE_FORECAST" &&
                  "Déclenche une alerte si une prévision négative est détectée dans l'horizon défini"}
              </p>
            </div>

            {/* Conditions selon le type */}
            {formData.type === "THRESHOLD" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Montant seuil (€)
                  </label>
                  <input
                    type="number"
                    value={formData.thresholdAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        thresholdAmount: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    min="0"
                    step="100"
                    required
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    L'alerte sera déclenchée si le solde passe{" "}
                    {formData.compareOperator === "lt" ? "sous" : "sous ou égal à"}{" "}
                    ce montant
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Condition de déclenchement
                  </label>
                  <select
                    value={formData.compareOperator}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        compareOperator: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="lt">Strictement inférieur à (&lt;)</option>
                    <option value="lte">Inférieur ou égal à (≤)</option>
                  </select>
                </div>
              </>
            )}

            {formData.type === "NEGATIVE_FORECAST" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Horizon de prévision
                </label>
                <select
                  value={formData.horizonDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      horizonDays: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value={7}>7 jours</option>
                  <option value={15}>15 jours</option>
                  <option value={30}>30 jours</option>
                  <option value={60}>60 jours</option>
                  <option value={90}>90 jours</option>
                </select>
                <p className="text-xs text-slate-400 mt-2">
                  L'alerte sera déclenchée si une prévision négative est détectée
                  dans les {formData.horizonDays} prochains jours
                </p>
              </div>
            )}

            {/* Cooldown */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Fréquence maximale (anti-spam)
              </label>
              <select
                value={formData.cooldownHours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cooldownHours: Number(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value={1}>Maximum 1 fois par heure</option>
                <option value={6}>Maximum 1 fois toutes les 6 heures</option>
                <option value={24}>Maximum 1 fois par jour</option>
                <option value={72}>Maximum 1 fois tous les 3 jours</option>
                <option value={168}>Maximum 1 fois par semaine</option>
              </select>
              <p className="text-xs text-slate-400 mt-2">
                Évite de recevoir trop d'alertes successives pour le même problème
              </p>
            </div>

            {/* Email */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">
                  Notifications par email
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      emailEnabled: !formData.emailEnabled,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.emailEnabled ? "bg-indigo-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.emailEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {formData.emailEnabled && (
                <p className="text-xs text-slate-400">
                  Vous recevrez un email à l'adresse configurée dans votre profil
                  lorsque cette alerte sera déclenchée
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <GlassButton
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={saving}
                className="flex-1"
              >
                Annuler
              </GlassButton>
              <GlassButton
                type="submit"
                variant="primary"
                disabled={saving}
                className="flex-1"
              >
                {saving
                  ? "Enregistrement..."
                  : alert
                  ? "Mettre à jour"
                  : "Créer l'alerte"}
              </GlassButton>
            </div>
          </form>
        </div>
      </GlassCard>
    </div>
  );
}
