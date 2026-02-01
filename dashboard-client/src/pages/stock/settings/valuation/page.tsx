import { useState } from "react";
import { Layout } from '@/components/Layout'
import { Breadcrumbs } from "@/components/common";
import { Button } from "@/components/common/Button";
import { useToast } from "@/contexts/ToastContext";
import { Layers, Save, Loader2, Info } from "lucide-react";
import { logger } from '@quelyos/logger';

const valuationMethods = [
  { value: "fifo", label: "FIFO (Premier entré, premier sorti)", description: "Les articles les plus anciens sont vendus en premier." },
  { value: "lifo", label: "LIFO (Dernier entré, premier sorti)", description: "Les articles les plus récents sont vendus en premier." },
  { value: "average", label: "Coût moyen pondéré", description: "Le coût est recalculé à chaque entrée de stock." },
  { value: "standard", label: "Coût standard", description: "Coût fixe défini manuellement par produit." },
];

export default function ValuationSettingsPage() {
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const [config, setConfig] = useState({
    valuation_method: "average",
    auto_valuation: true,
    include_landed_costs: false,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Appel API backend pour sauvegarder
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Configuration de valorisation mise à jour");
    } catch {
      logger.error("Erreur attrapée");
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <Breadcrumbs
        items={[
          { label: "Stock", href: "/stock" },
          { label: "Paramètres", href: "/stock/settings" },
          { label: "Valorisation", href: "/stock/settings/valuation" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-orange-100 dark:bg-orange-900/30 p-3">
            <Layers className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Valorisation du stock
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Méthode de calcul de la valeur de votre inventaire
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

      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            La méthode choisie impacte directement la valeur comptable de votre stock et vos marges.
          </p>
        </div>
      </div>

      {/* Méthode de valorisation */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
          Méthode de valorisation
        </h3>
        <div className="space-y-3">
          {valuationMethods.map((method) => (
            <label
              key={method.value}
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition ${
                config.valuation_method === method.value
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700"
              }`}
            >
              <input
                type="radio"
                name="valuation_method"
                value={method.value}
                checked={config.valuation_method === method.value}
                onChange={(e) => setConfig({ ...config, valuation_method: e.target.value })}
                className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {method.label}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {method.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
          Options de valorisation
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Valorisation automatique
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Recalculer automatiquement la valeur du stock à chaque mouvement.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfig({ ...config, auto_valuation: !config.auto_valuation })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                config.auto_valuation ? "bg-orange-600" : "bg-gray-200 dark:bg-gray-600"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  config.auto_valuation ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Inclure les coûts annexes
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ajouter les frais de transport et douane au coût du stock.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfig({ ...config, include_landed_costs: !config.include_landed_costs })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                config.include_landed_costs ? "bg-orange-600" : "bg-gray-200 dark:bg-gray-600"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  config.include_landed_costs ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Impact comptable</p>
            <p>
              Changer la méthode de valorisation peut avoir un impact significatif sur vos états financiers.
              Consultez votre comptable avant toute modification.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
