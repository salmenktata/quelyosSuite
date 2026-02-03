/**
 * Page : Catégories de transactions Finance
 *
 * Fonctionnalités :
 * - Affichage des catégories de revenus et dépenses séparées
 * - Création de nouvelles catégories (nom + type + couleur)
 * - Suppression de catégories existantes
 * - Import automatique de catégories par défaut
 * - Distinction visuelle revenus (vert) vs dépenses (rouge)
 * - Compteur de catégories par type
 */

import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Breadcrumbs, PageNotice, Button } from "@/components/common";
import { api } from "@/lib/finance/api";
import { useRequireAuth } from "@/lib/finance/compat/auth";

import { Tag, Plus, Trash2, TrendingUp, TrendingDown, RefreshCw, Loader2 } from "lucide-react";
import { financeNotices } from "@/lib/notices/finance-notices";
import { logger } from '@quelyos/logger';

type CategoryKind = "INCOME" | "EXPENSE";

type Category = {
  id: string;
  name: string;
  kind: CategoryKind;
  color?: string;
  transactionCount?: number;
  createdAt?: string;
};

const DEFAULT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#0ea5e9", "#8b5cf6", "#ec4899",
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
  useRequireAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CategoryKind>("EXPENSE");
  const [color, setColor] = useState(DEFAULT_COLORS[0]!);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [seedingDefaults, setSeedingDefaults] = useState(false);

  async function fetchCategories() {
    try {
      setError(null);
      setLoading(true);
      const data = await api<Category[] | { data: Category[] }>("/finance/categories");
      const cats = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setCategories(cats);
    } catch (err) {
      logger.error("Erreur chargement catégories:", err);
      setError(err instanceof Error ? err.message : "Erreur de chargement des catégories.");
    } finally {
      setLoading(false);
    }
  }

  async function createCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const newCategory = await api<Category>("/finance/categories", {
        method: "POST",
        body: { name, kind, color },
      });

      setCategories([...categories, newCategory]);
      setName("");
      setColor(DEFAULT_COLORS[0]!);
      setKind("EXPENSE");
      setShowForm(false);
    } catch (err) {
      logger.error("Erreur création catégorie:", err);
      setError(err instanceof Error ? err.message : "Impossible de créer la catégorie.");
    } finally {
      setCreating(false);
    }
  }

  async function deleteCategory(id: string) {
    if (!confirm("Êtes-vous sûr de supprimer cette catégorie ?")) return;

    setDeleting(id);
    try {
      await api(`/finance/categories/${id}`, { method: "DELETE" });
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      logger.error("Erreur suppression catégorie:", err);
      setError(err instanceof Error ? err.message : "Impossible de supprimer la catégorie.");
    } finally {
      setDeleting(null);
    }
  }

  async function seedDefaultCategories() {
    setSeedingDefaults(true);
    setError(null);

    try {
      const existingNames = categories.map(c => c.name.toLowerCase());
      const toCreate = DEFAULT_CATEGORIES.filter(
        dc => !existingNames.includes(dc.name.toLowerCase())
      );

      const created: Category[] = [];
      for (const cat of toCreate) {
        try {
          const newCat = await api<Category>("/finance/categories", {
            method: "POST",
            body: cat,
          });
          created.push(newCat);
        } catch {
          // Ignorer erreurs individuelles
        }
      }

      if (created.length > 0) {
        setCategories(prev => [...prev, ...created]);
      }
    } catch (err) {
      logger.error("Erreur seed catégories:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la création des catégories.");
    } finally {
      setSeedingDefaults(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  const incomeCategories = categories.filter(c => c.kind === "INCOME");
  const expenseCategories = categories.filter(c => c.kind === "EXPENSE");

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: "Finance", href: "/finance" },
            { label: "Catégories" },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-3">
              <Tag className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Catégories
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Organisez vos transactions par catégories pour un suivi clair
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {categories.length === 0 && !loading && (
              <Button
                variant="secondary"
                icon={<RefreshCw className="h-4 w-4" />}
                onClick={seedDefaultCategories}
                loading={seedingDefaults}
              >
                Catégories par défaut
              </Button>
            )}
            <Button
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "Annuler" : "Nouvelle catégorie"}
            </Button>
          </div>
        </div>

        <PageNotice config={financeNotices["categories"]} />

        {/* Formulaire de création */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <form onSubmit={createCategory} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Créer une catégorie
              </h2>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white">
                    Nom <span className="text-rose-600 dark:text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Charges fixes"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-white/10 text-gray-900 dark:text-white border border-gray-300 dark:border-white/15 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white">
                    Type <span className="text-rose-600 dark:text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={kind === "EXPENSE" ? "danger" : "secondary"}
                      size="sm"
                      onClick={() => setKind("EXPENSE")}
                      icon={<TrendingDown className="h-4 w-4" />}
                    >
                      Dépense
                    </Button>
                    <Button
                      type="button"
                      variant={kind === "INCOME" ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => setKind("INCOME")}
                      icon={<TrendingUp className="h-4 w-4" />}
                      className={kind === "INCOME" ? "bg-emerald-600 hover:bg-emerald-500" : ""}
                    >
                      Revenu
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white">
                    Couleur
                  </label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {DEFAULT_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`h-8 rounded-md border-2 transition ${
                          color === c
                            ? "border-gray-900 dark:border-white scale-110"
                            : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={`Couleur ${c}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="submit" variant="primary" loading={creating}>
                  Créer la catégorie
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Messages d'erreur */}
        {error && (
          <div role="alert" className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={fetchCategories}>
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {/* Liste des catégories */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Tag className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">Aucune catégorie pour le moment</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
              Cliquez sur &quot;Catégories par défaut&quot; pour commencer rapidement
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Catégories de dépenses */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dépenses</h2>
                  <span className="ml-auto rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1 text-xs font-medium text-red-700 dark:text-red-300">
                    {expenseCategories.length}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {expenseCategories.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Aucune catégorie de dépenses
                  </div>
                ) : (
                  expenseCategories.map(cat => (
                    <div
                      key={cat.id}
                      className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-4 w-4 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color || "#ef4444" }}
                        />
                        <span className="font-medium text-gray-900 dark:text-white">{cat.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCategory(cat.id)}
                        loading={deleting === cat.id}
                        icon={deleting !== cat.id && <Trash2 className="h-3.5 w-3.5 text-red-500" />}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {''}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Catégories de revenus */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revenus</h2>
                  <span className="ml-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    {incomeCategories.length}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {incomeCategories.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Aucune catégorie de revenus
                  </div>
                ) : (
                  incomeCategories.map(cat => (
                    <div
                      key={cat.id}
                      className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-4 w-4 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color || "#22c55e" }}
                        />
                        <span className="font-medium text-gray-900 dark:text-white">{cat.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCategory(cat.id)}
                        loading={deleting === cat.id}
                        icon={deleting !== cat.id && <Trash2 className="h-3.5 w-3.5 text-red-500" />}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {''}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
