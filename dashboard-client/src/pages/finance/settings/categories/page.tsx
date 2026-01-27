/**
 * Page Paramètres Catégories - Gestion des catégories de transactions
 *
 * Fonctionnalités :
 * - Gestion des catégories de revenus et dépenses
 * - Création de catégories personnalisées (nom, type, couleur)
 * - Suppression de catégories existantes
 * - Import automatique de catégories par défaut
 * - Visualisation séparée : dépenses vs revenus
 */

import { useEffect, useState } from "react";
import { api } from "@/lib/finance/api";
import { Loader2, Plus, Trash2, Edit2, Tag, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Layout } from '@/components/Layout';
import { Breadcrumbs, PageNotice, Button } from '@/components/common';
import { financeNotices } from '@/lib/notices/finance-notices';

type CategoryKind = "INCOME" | "EXPENSE";

type Category = {
  id: string;
  name: string;
  kind: CategoryKind;
  color?: string;
  icon?: string;
  transactionCount?: number;
  createdAt: string;
};

const DEFAULT_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#0ea5e9",
  "#8b5cf6",
  "#ec4899",
];

const DEFAULT_CATEGORIES: Array<{ name: string; kind: CategoryKind; color: string }> = [
  { name: "Alimentation", kind: "EXPENSE", color: "#f97316" },
  { name: "Transport", kind: "EXPENSE", color: "#0ea5e9" },
  { name: "Logement", kind: "EXPENSE", color: "#8b5cf6" },
  { name: "Santé", kind: "EXPENSE", color: "#ef4444" },
  { name: "Loisirs", kind: "EXPENSE", color: "#ec4899" },
  { name: "Shopping", kind: "EXPENSE", color: "#eab308" },
  { name: "Factures", kind: "EXPENSE", color: "#64748b" },
  { name: "Autres dépenses", kind: "EXPENSE", color: "#6b7280" },
  { name: "Salaire", kind: "INCOME", color: "#22c55e" },
  { name: "Freelance", kind: "INCOME", color: "#10b981" },
  { name: "Investissements", kind: "INCOME", color: "#14b8a6" },
  { name: "Remboursements", kind: "INCOME", color: "#06b6d4" },
  { name: "Autres revenus", kind: "INCOME", color: "#84cc16" },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryKind, setNewCategoryKind] = useState<CategoryKind>("EXPENSE");
  const [newCategoryColor, setNewCategoryColor] = useState(DEFAULT_COLORS[0]);
  const [creating, setCreating] = useState(false);
  const [seedingDefaults, setSeedingDefaults] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<any>("/finance/categories");
      const cats = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setCategories(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les catégories");
    } finally {
      setLoading(false);
    }
  }

  async function createCategory() {
    if (!newCategoryName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const newCategory = await api("/finance/categories", {
        method: "POST",
        body: {
          name: newCategoryName,
          kind: newCategoryKind,
          color: newCategoryColor
        } as any,
      }) as Category;
      setCategories([...categories, newCategory]);
      setNewCategoryName("");
      setNewCategoryColor(DEFAULT_COLORS[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer la catégorie");
    } finally {
      setCreating(false);
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("Êtes-vous sûr de supprimer cette catégorie ?")) return;
    setDeleting(id);
    try {
      await api(`/finance/categories/${id}`, { method: "DELETE" });
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer la catégorie");
    } finally {
      setDeleting(null);
    }
  }

  async function seedDefaultCategories() {
    setSeedingDefaults(true);
    setError(null);
    try {
      const existingNames = categories.map((c) => c.name.toLowerCase());
      const toCreate = DEFAULT_CATEGORIES.filter(
        (dc) => !existingNames.includes(dc.name.toLowerCase())
      );

      const created: Category[] = [];
      for (const cat of toCreate) {
        try {
          const newCat = await api("/finance/categories", {
            method: "POST",
            body: cat as any,
          }) as Category;
          created.push(newCat);
        } catch {
          // Ignorer les erreurs individuelles
        }
      }

      if (created.length > 0) {
        setCategories((prev) => [...prev, ...created]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création des catégories");
    } finally {
      setSeedingDefaults(false);
    }
  }

  const expenseCategories = categories.filter((c) => c.kind === "EXPENSE");
  const incomeCategories = categories.filter((c) => c.kind === "INCOME");

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Finance', href: '/finance' },
            { label: 'Paramètres', href: '/finance/settings' },
            { label: 'Catégories' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Catégories</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gérez vos catégories de revenus et dépenses
            </p>
          </div>
        </div>

        <PageNotice config={financeNotices.settingsCategories} className="mb-6" />

        {categories.length === 0 && !loading && (
          <Button
            variant="primary"
            onClick={seedDefaultCategories}
            disabled={seedingDefaults}
            loading={seedingDefaults}
            icon={!seedingDefaults && <RefreshCw className="h-4 w-4" />}
          >
            Créer catégories par défaut
          </Button>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : categories.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-xl">
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-6 py-12 text-center">
                  <Tag className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">Aucune catégorie pour le moment.</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Cliquez sur &quot;Créer catégories par défaut&quot; pour commencer rapidement.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dépenses</h2>
                    <span className="ml-auto rounded-full bg-red-50 dark:bg-red-900/20 px-2 py-0.5 text-xs text-red-600 dark:text-red-400">
                      {expenseCategories.length}
                    </span>
                  </div>
                  {expenseCategories.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">Aucune catégorie de dépense</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {expenseCategories.map((category) => (
                        <div
                          key={category.id}
                          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className="h-4 w-4 rounded-full shrink-0"
                              style={{ backgroundColor: category.color || "#ef4444" }}
                            />
                            <span className="font-medium text-gray-900 dark:text-white truncate">{category.name}</span>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Edit2 className="h-3.5 w-3.5" />}
                              aria-label="Modifier"
                            >
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCategory(category.id)}
                              disabled={deleting === category.id}
                              loading={deleting === category.id}
                              icon={deleting !== category.id && <Trash2 className="h-3.5 w-3.5 text-red-500" />}
                              aria-label="Supprimer"
                            >
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revenus</h2>
                    <span className="ml-auto rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                      {incomeCategories.length}
                    </span>
                  </div>
                  {incomeCategories.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">Aucune catégorie de revenu</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {incomeCategories.map((category) => (
                        <div
                          key={category.id}
                          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className="h-4 w-4 rounded-full shrink-0"
                              style={{ backgroundColor: category.color || "#22c55e" }}
                            />
                            <span className="font-medium text-gray-900 dark:text-white truncate">{category.name}</span>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Edit2 className="h-3.5 w-3.5" />}
                              aria-label="Modifier"
                            >
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCategory(category.id)}
                              disabled={deleting === category.id}
                              loading={deleting === category.id}
                              icon={deleting !== category.id && <Trash2 className="h-3.5 w-3.5 text-red-500" />}
                              aria-label="Supprimer"
                            >
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-xl space-y-4 h-fit">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ajouter une catégorie</h3>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nom de la catégorie"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={newCategoryKind === "EXPENSE" ? "danger" : "secondary"}
                    size="sm"
                    onClick={() => setNewCategoryKind("EXPENSE")}
                    icon={<TrendingDown className="h-4 w-4" />}
                  >
                    Dépense
                  </Button>
                  <Button
                    variant={newCategoryKind === "INCOME" ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setNewCategoryKind("INCOME")}
                    icon={<TrendingUp className="h-4 w-4" />}
                    className={newCategoryKind === "INCOME" ? "bg-emerald-600 hover:bg-emerald-500" : ""}
                  >
                    Revenu
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">Couleur</label>
                <div className="grid grid-cols-4 gap-2">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCategoryColor(color)}
                      className={`h-10 rounded-lg border-2 transition ${
                        newCategoryColor === color
                          ? "border-gray-900 dark:border-white scale-110"
                          : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Couleur ${color}`}
                    />
                  ))}
                </div>
              </div>

              <Button
                variant="primary"
                onClick={createCategory}
                disabled={!newCategoryName.trim() || creating}
                loading={creating}
                icon={!creating && <Plus className="h-4 w-4" />}
                className="w-full"
              >
                Créer
              </Button>

              {categories.length > 0 && (
                <Button
                  variant="secondary"
                  onClick={seedDefaultCategories}
                  disabled={seedingDefaults}
                  loading={seedingDefaults}
                  icon={!seedingDefaults && <RefreshCw className="h-3.5 w-3.5" />}
                  className="w-full"
                  size="sm"
                >
                  Ajouter catégories manquantes
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
