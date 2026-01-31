import { useState } from "react";
import { Breadcrumbs } from "@/components/common";
import { Button } from "@/components/common/Button";
import { useToast } from "@/contexts/ToastContext";
import { Target, Save, Loader2, Plus, Trash2 , Info } from "lucide-react";
import { logger } from '@quelyos/logger';

interface ScoringRule {
  id: string;
  criterion: string;
  condition: string;
  points: number;
}

const defaultRules: ScoringRule[] = [
  { id: "1", criterion: "Taille entreprise", condition: "> 50 employés", points: 20 },
  { id: "2", criterion: "Budget annoncé", condition: "> 10 000 TND", points: 30 },
  { id: "3", criterion: "Secteur d'activité", condition: "Tech / IT", points: 15 },
  { id: "4", criterion: "Source", condition: "Recommandation", points: 25 },
  { id: "5", criterion: "Engagement", condition: "A ouvert 3+ emails", points: 10 },
];

export default function ScoringSettingsPage() {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [rules] = useState<ScoringRule[]>(defaultRules);

  const [config, setConfig] = useState({
    scoring_enabled: true,
    auto_qualify_threshold: 70,
    hot_lead_threshold: 50,
    cold_lead_threshold: 20,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Configuration du scoring mise à jour");
    } catch {
      logger.error("Erreur attrapée");
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "CRM", href: "/crm" },
          { label: "Paramètres", href: "/crm/settings" },
          { label: "Scoring leads", href: "/crm/settings/scoring" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-violet-100 dark:bg-violet-900/30 p-3">
            <Target className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Scoring leads
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Critères de notation et qualification automatique
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
            Attribuez des points aux leads selon leurs caractéristiques pour prioriser vos efforts commerciaux.
          </p>
        </div>
      </div>

      {/* Activation */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <label className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Scoring automatique
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Calculer automatiquement le score des leads selon les règles définies.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfig({ ...config, scoring_enabled: !config.scoring_enabled })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              config.scoring_enabled ? "bg-violet-600" : "bg-gray-200 dark:bg-gray-600"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                config.scoring_enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </label>
      </div>

      {/* Thresholds */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
          Seuils de qualification
        </h3>
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Lead chaud
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={config.hot_lead_threshold}
                onChange={(e) => setConfig({ ...config, hot_lead_threshold: Number(e.target.value) })}
                min={0}
                max={100}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 pr-12 text-gray-900 dark:text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">pts</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Lead tiède
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={config.cold_lead_threshold}
                onChange={(e) => setConfig({ ...config, cold_lead_threshold: Number(e.target.value) })}
                min={0}
                max={100}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 pr-12 text-gray-900 dark:text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">pts</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500" />
                Auto-qualification
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={config.auto_qualify_threshold}
                onChange={(e) => setConfig({ ...config, auto_qualify_threshold: Number(e.target.value) })}
                min={0}
                max={100}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 pr-12 text-gray-900 dark:text-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">pts</span>
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Les leads dépassant le seuil d'auto-qualification passent automatiquement à l'étape suivante.
        </p>
      </div>

      {/* Scoring rules */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Règles de scoring
          </h3>
          <Button variant="secondary" size="sm" icon={<Plus className="h-4 w-4" />}>
            Ajouter
          </Button>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {rule.criterion}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {rule.condition}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  rule.points >= 20
                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400"
                }`}>
                  +{rule.points} pts
                </span>
                <button className="p-1.5 text-gray-400 hover:text-red-500 transition" aria-label="Supprimer la règle">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-violet-800 dark:text-violet-200">
            Score maximum possible
          </p>
          <span className="text-lg font-bold text-violet-900 dark:text-violet-100">
            {rules.reduce((sum, r) => sum + r.points, 0)} pts
          </span>
        </div>
      </div>
    </div>
  );
}
