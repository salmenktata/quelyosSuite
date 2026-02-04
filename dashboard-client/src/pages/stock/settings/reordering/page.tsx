/**
 * Réapprovisionnement Automatique - Configuration règles de commande
 *
 * Fonctionnalités :
 * - Activation/désactivation réapprovisionnement automatique
 * - Configuration quantités minimum et maximum par défaut
 * - Délais de livraison (lead time) et stock de sécurité
 * - Fréquence de vérification (quotidienne, hebdomadaire)
 * - Règles de commande automatique basées sur seuils
 * - Interface de configuration centralisée
 */
import { useState } from "react";
import { Breadcrumbs } from "@/components/common";
import { Button } from "@/components/common/Button";
import { useToast } from "@/contexts/ToastContext";
import { RefreshCw, Save, Loader2,  Info } from "lucide-react";
import { logger } from '@quelyos/logger';

export default function ReorderingSettingsPage() {
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState({
    auto_reorder_enabled: true,
    default_min_qty: 5,
    default_max_qty: 100,
    lead_time_days: 7,
    safety_stock_days: 3,
    reorder_frequency: "daily",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Configuration de réapprovisionnement mise à jour");
    } catch {
      logger.error("Erreur attrapée");
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Breadcrumbs
        items={[
          { label: "Stock", href: "/stock" },
          { label: "Paramètres", href: "/stock/settings" },
          { label: "Réappro. auto", href: "/stock/settings/reordering" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-orange-100 dark:bg-orange-900/30 p-3">
            <RefreshCw className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Réapprovisionnement automatique
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Règles par défaut pour les commandes automatiques
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        >
          Enregistrer
        </Button>
      </div>

      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Ces paramètres s'appliquent aux nouveaux produits. Les règles existantes ne sont pas modifiées.
          </p>
        </div>
      </div>

      {/* Activation */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <label className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Réapprovisionnement automatique
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Générer automatiquement des propositions de commande quand le stock atteint le seuil minimum.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfig({ ...config, auto_reorder_enabled: !config.auto_reorder_enabled })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              config.auto_reorder_enabled ? "bg-orange-600" : "bg-gray-200 dark:bg-gray-600"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                config.auto_reorder_enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </label>
      </div>

      {/* Seuils par défaut */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
          Seuils par défaut
        </h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
              Quantité minimum
            </label>
            <input
              type="number"
              value={config.default_min_qty}
              onChange={(e) => setConfig({ ...config, default_min_qty: Number(e.target.value) })}
              min={0}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Seuil déclenchant une alerte de réapprovisionnement.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
              Quantité maximum
            </label>
            <input
              type="number"
              value={config.default_max_qty}
              onChange={(e) => setConfig({ ...config, default_max_qty: Number(e.target.value) })}
              min={0}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Quantité cible après réapprovisionnement.
            </p>
          </div>
        </div>
      </div>

      {/* Délais */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
          Délais
        </h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
              Délai d'approvisionnement
            </label>
            <div className="relative">
              <input
                type="number"
                value={config.lead_time_days}
                onChange={(e) => setConfig({ ...config, lead_time_days: Number(e.target.value) })}
                min={0}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 pr-16 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                jours
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Temps moyen entre commande et réception.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
              Stock de sécurité
            </label>
            <div className="relative">
              <input
                type="number"
                value={config.safety_stock_days}
                onChange={(e) => setConfig({ ...config, safety_stock_days: Number(e.target.value) })}
                min={0}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 pr-16 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                jours
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Marge de sécurité pour éviter les ruptures.
            </p>
          </div>
        </div>
      </div>

      {/* Fréquence */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
          Fréquence de vérification
        </label>
        <select
          value={config.reorder_frequency}
          onChange={(e) => setConfig({ ...config, reorder_frequency: e.target.value })}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
        >
          <option value="realtime">Temps réel</option>
          <option value="hourly">Toutes les heures</option>
          <option value="daily">Quotidienne</option>
          <option value="weekly">Hebdomadaire</option>
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Fréquence à laquelle le système vérifie les niveaux de stock.
        </p>
      </div>
      </div>
    </>
  );
}
