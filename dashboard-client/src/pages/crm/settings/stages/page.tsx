import { useState } from "react";
import { Breadcrumbs } from "@/components/common";
import { Button } from "@/components/common/Button";
import { useToast } from "@/contexts/ToastContext";
import { Kanban, Save, Loader2, Plus, GripVertical, Trash2, Edit2 , Info } from "lucide-react";
import { logger } from '@quelyos/logger';

interface Stage {
  id: string;
  name: string;
  probability: number;
  color: string;
  isWon: boolean;
  isLost: boolean;
}

const defaultStages: Stage[] = [
  { id: "1", name: "Nouveau", probability: 10, color: "#6366f1", isWon: false, isLost: false },
  { id: "2", name: "Qualification", probability: 25, color: "#8b5cf6", isWon: false, isLost: false },
  { id: "3", name: "Proposition", probability: 50, color: "#a855f7", isWon: false, isLost: false },
  { id: "4", name: "Négociation", probability: 75, color: "#d946ef", isWon: false, isLost: false },
  { id: "5", name: "Gagné", probability: 100, color: "#22c55e", isWon: true, isLost: false },
  { id: "6", name: "Perdu", probability: 0, color: "#ef4444", isWon: false, isLost: true },
];

export default function StagesSettingsPage() {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [stages, setStages] = useState<Stage[]>(defaultStages);

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Étapes du pipeline mises à jour");
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
          { label: "Étapes pipeline", href: "/crm/settings/stages" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-violet-100 dark:bg-violet-900/30 p-3">
            <Kanban className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Étapes du pipeline
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Définissez les étapes de votre funnel de vente
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Plus className="h-4 w-4" />}>
            Ajouter
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          >
            Enregistrer
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Organisez vos étapes de vente et définissez les probabilités de conversion pour chaque phase.
          </p>
        </div>
      </div>

      {/* Stages list */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_100px_80px_80px] gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm font-medium text-gray-500 dark:text-gray-400">
          <div></div>
          <div>Étape</div>
          <div className="text-center">Probabilité</div>
          <div className="text-center">Type</div>
          <div></div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className="grid grid-cols-[auto_1fr_100px_80px_80px] gap-4 p-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <button className="cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Réordonner">
                <GripVertical className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {stage.name}
                </span>
              </div>
              <div className="text-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {stage.probability}%
                </span>
              </div>
              <div className="text-center">
                {stage.isWon && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                    Gagné
                  </span>
                )}
                {stage.isLost && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                    Perdu
                  </span>
                )}
              </div>
              <div className="flex justify-end gap-1">
                <button className="p-1.5 text-gray-400 hover:text-violet-600 transition" aria-label={`Modifier ${stage.name}`}>
                  <Edit2 className="h-4 w-4" aria-hidden="true" />
                </button>
                {!stage.isWon && !stage.isLost && (
                  <button className="p-1.5 text-gray-400 hover:text-red-500 transition" aria-label={`Supprimer ${stage.name}`}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 p-4">
        <p className="text-sm text-violet-800 dark:text-violet-200">
          <strong>Astuce :</strong> Glissez-déposez les étapes pour les réorganiser.
          Les probabilités influencent les prévisions de chiffre d'affaires.
        </p>
      </div>
    </div>
  );
}
