import { useState } from "react";
import { Layout } from '@/components/Layout';
import { Breadcrumbs } from "@/components/common";
import { Button } from "@/components/common/Button";
import { useToast } from "@/contexts/ToastContext";
import { Tag, Save, Loader2, Plus, Edit2, Trash2 , Info } from "lucide-react";
import { logger } from '@quelyos/logger';

interface CustomerCategory {
  id: number;
  name: string;
  color: string;
  customerCount: number;
  description: string;
}

const defaultCategories: CustomerCategory[] = [
  { id: 1, name: "Particulier", color: "#6366f1", customerCount: 180, description: "Clients individuels" },
  { id: 2, name: "Entreprise", color: "#8b5cf6", customerCount: 45, description: "Sociétés et PME" },
  { id: 3, name: "Revendeur", color: "#a855f7", customerCount: 32, description: "Partenaires de distribution" },
  { id: 4, name: "VIP", color: "#d946ef", customerCount: 18, description: "Clients privilégiés" },
  { id: 5, name: "Prospect", color: "#94a3b8", customerCount: 67, description: "Clients potentiels" },
];

export default function CategoriesSettingsPage() {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [categories] = useState<CustomerCategory[]>(defaultCategories);

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Catégories clients mises à jour");
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
          { label: "CRM", href: "/crm" },
          { label: "Paramètres", href: "/crm/settings" },
          { label: "Catégories clients", href: "/crm/settings/categories" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-violet-100 dark:bg-violet-900/30 p-3">
            <Tag className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Catégories clients
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Segmentez vos clients par type ou comportement
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Plus className="h-4 w-4" />}>
            Nouvelle catégorie
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
            Les catégories permettent de personnaliser les actions commerciales et d'appliquer des conditions spécifiques.
          </p>
        </div>
      </div>

      {/* Categories grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <div
            key={category.id}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {category.name}
                </h3>
              </div>
              <div className="flex gap-1">
                <button className="p-1 text-gray-400 hover:text-violet-600 transition" aria-label={`Modifier ${category.name}`}>
                  <Edit2 className="h-4 w-4" aria-hidden="true" />
                </button>
                {category.customerCount === 0 && (
                  <button className="p-1 text-gray-400 hover:text-red-500 transition" aria-label={`Supprimer ${category.name}`}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {category.description}
            </p>
            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Clients
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {category.customerCount}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add button */}
      <button className="w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 text-center hover:border-violet-500 dark:hover:border-violet-400 transition group">
        <Plus className="h-6 w-6 mx-auto mb-2 text-gray-400 group-hover:text-violet-500" />
        <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-violet-500">
          Ajouter une catégorie
        </span>
      </button>
      </div>
    </Layout>
  );
}
