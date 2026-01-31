import { useState } from "react";
import { Breadcrumbs } from "@/components/common";
import { Button } from "@/components/common/Button";
import { useToast } from "@/contexts/ToastContext";
import { Ruler, Save, Loader2, Plus, Trash2 , Info } from "lucide-react";
import { logger } from '@quelyos/logger';

interface UnitCategory {
  id: string;
  name: string;
  units: { id: string; name: string; ratio: number; isBase: boolean }[];
}

const defaultCategories: UnitCategory[] = [
  {
    id: "weight",
    name: "Poids",
    units: [
      { id: "kg", name: "Kilogramme (kg)", ratio: 1, isBase: true },
      { id: "g", name: "Gramme (g)", ratio: 0.001, isBase: false },
      { id: "t", name: "Tonne (t)", ratio: 1000, isBase: false },
    ],
  },
  {
    id: "length",
    name: "Longueur",
    units: [
      { id: "m", name: "Mètre (m)", ratio: 1, isBase: true },
      { id: "cm", name: "Centimètre (cm)", ratio: 0.01, isBase: false },
      { id: "mm", name: "Millimètre (mm)", ratio: 0.001, isBase: false },
    ],
  },
  {
    id: "volume",
    name: "Volume",
    units: [
      { id: "l", name: "Litre (L)", ratio: 1, isBase: true },
      { id: "ml", name: "Millilitre (mL)", ratio: 0.001, isBase: false },
      { id: "m3", name: "Mètre cube (m³)", ratio: 1000, isBase: false },
    ],
  },
  {
    id: "unit",
    name: "Unité",
    units: [
      { id: "unit", name: "Unité", ratio: 1, isBase: true },
      { id: "dozen", name: "Douzaine", ratio: 12, isBase: false },
      { id: "pack", name: "Pack", ratio: 6, isBase: false },
    ],
  },
];

export default function UnitsSettingsPage() {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [categories] = useState<UnitCategory[]>(defaultCategories);

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Unités de mesure mises à jour");
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
          { label: "Stock", href: "/stock" },
          { label: "Paramètres", href: "/stock/settings" },
          { label: "Unités de mesure", href: "/stock/settings/units" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-orange-100 dark:bg-orange-900/30 p-3">
            <Ruler className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Unités de mesure
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Catégories et conversions d'unités
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
            Définissez les unités de mesure et leurs conversions pour la gestion des stocks et des achats.
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {category.name}
              </h3>
              <Button variant="secondary" size="sm" icon={<Plus className="h-4 w-4" />}>
                Ajouter
              </Button>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {category.units.map((unit) => (
                <div
                  key={unit.id}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {unit.name}
                      </p>
                      {unit.isBase ? (
                        <span className="text-xs text-orange-600 dark:text-orange-400">
                          Unité de base
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Ratio : {unit.ratio}
                        </span>
                      )}
                    </div>
                  </div>
                  {!unit.isBase && (
                    <button
                      className="p-2 text-gray-400 hover:text-red-500 transition"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add category */}
      <Button variant="secondary" icon={<Plus className="h-4 w-4" />} className="w-full">
        Ajouter une catégorie d'unités
      </Button>
    </div>
  );
}
