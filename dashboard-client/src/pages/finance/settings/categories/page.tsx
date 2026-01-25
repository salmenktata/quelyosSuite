

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { api } from "@/lib/api";
import { Loader2, Plus, Trash2, Edit2, Tag, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

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

// Catégories par défaut à proposer si aucune n'existe
const DEFAULT_CATEGORIES: Array<{ name: string; kind: CategoryKind; color: string }> = [
  // Dépenses
  { name: "Alimentation", kind: "EXPENSE", color: "#f97316" },
  { name: "Transport", kind: "EXPENSE", color: "#0ea5e9" },
  { name: "Logement", kind: "EXPENSE", color: "#8b5cf6" },
  { name: "Santé", kind: "EXPENSE", color: "#ef4444" },
  { name: "Loisirs", kind: "EXPENSE", color: "#ec4899" },
  { name: "Shopping", kind: "EXPENSE", color: "#eab308" },
  { name: "Factures", kind: "EXPENSE", color: "#64748b" },
  { name: "Autres dépenses", kind: "EXPENSE", color: "#6b7280" },
  // Revenus
  { name: "Salaire", kind: "INCOME", color: "#22c55e" },
  { name: "Freelance", kind: "INCOME", color: "#10b981" },
  { name: "Investissements", kind: "INCOME", color: "#14b8a6" },
  { name: "Remboursements", kind: "INCOME", color: "#06b6d4" },
  { name: "Autres revenus", kind: "INCOME", color: "#84cc16" },
];

export default function CategoriesPage() {
  useRequireAuth();

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
      const data = await api("/categories");
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
      const newCategory = await api("/categories", {
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
      await api(`/categories/${id}`, { method: "DELETE" });
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer la catégorie");
    } finally {
      setDeleting(null);
    }
  }

  // Créer les catégories par défaut
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
          const newCat = await api("/categories", {
            method: "POST",
            body: cat as any,
          }) as Category;
          created.push(newCat);
        } catch {
          // Ignorer les erreurs individuelles (doublon possible)
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

  // Séparer les catégories par type
  const expenseCategories = categories.filter((c) => c.kind === "EXPENSE");
  const incomeCategories = categories.filter((c) => c.kind === "INCOME");

  return (
    <div className="space-y-6 text-white">
      {/* Background blur orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[400px] w-[400px] rounded-full bg-purple-500/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-emerald-500/20 blur-[120px]" />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Organisation</p>
            <h1 className="bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-3xl font-semibold text-transparent">Catégories</h1>
            <p className="text-sm text-indigo-100/80">Créez et gérez les catégories de transactions.</p>
          </div>

          {/* Bouton pour créer les catégories par défaut */}
          {categories.length === 0 && !loading && (
            <button
              onClick={seedDefaultCategories}
              disabled={seedingDefaults}
              className="flex items-center gap-2 rounded-xl bg-emerald-600/80 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
            >
              {seedingDefaults ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Créer catégories par défaut
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Liste des catégories */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-300" />
              </div>
            ) : categories.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-xl">
                <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-12 text-center">
                  <Tag className="h-12 w-12 text-indigo-300/40 mx-auto mb-3" />
                  <p className="text-indigo-100/80 mb-2">Aucune catégorie pour le moment.</p>
                  <p className="text-xs text-indigo-100/60">Cliquez sur &quot;Créer catégories par défaut&quot; pour commencer rapidement.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Catégories de dépenses */}
                <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-400" />
                    <h2 className="text-lg font-semibold">Dépenses</h2>
                    <span className="ml-auto rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300">
                      {expenseCategories.length}
                    </span>
                  </div>
                  {expenseCategories.length === 0 ? (
                    <p className="text-sm text-indigo-100/60 py-4 text-center">Aucune catégorie de dépense</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {expenseCategories.map((category) => (
                        <div
                          key={category.id}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between hover:bg-white/10 transition"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className="h-4 w-4 rounded-full shrink-0"
                              style={{ backgroundColor: category.color || "#ef4444" }}
                            />
                            <span className="font-medium truncate">{category.name}</span>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button className="p-1.5 rounded-lg hover:bg-white/10 transition">
                              <Edit2 className="h-3.5 w-3.5 text-indigo-300" />
                            </button>
                            <button
                              onClick={() => deleteCategory(category.id)}
                              disabled={deleting === category.id}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 transition disabled:opacity-60"
                            >
                              {deleting === category.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-red-300" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5 text-red-300" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Catégories de revenus */}
                <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    <h2 className="text-lg font-semibold">Revenus</h2>
                    <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
                      {incomeCategories.length}
                    </span>
                  </div>
                  {incomeCategories.length === 0 ? (
                    <p className="text-sm text-indigo-100/60 py-4 text-center">Aucune catégorie de revenu</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {incomeCategories.map((category) => (
                        <div
                          key={category.id}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between hover:bg-white/10 transition"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className="h-4 w-4 rounded-full shrink-0"
                              style={{ backgroundColor: category.color || "#22c55e" }}
                            />
                            <span className="font-medium truncate">{category.name}</span>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button className="p-1.5 rounded-lg hover:bg-white/10 transition">
                              <Edit2 className="h-3.5 w-3.5 text-indigo-300" />
                            </button>
                            <button
                              onClick={() => deleteCategory(category.id)}
                              disabled={deleting === category.id}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 transition disabled:opacity-60"
                            >
                              {deleting === category.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-red-300" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5 text-red-300" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Formulaire d'ajout */}
          <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-xl space-y-4 h-fit">
            <h3 className="text-lg font-semibold">Ajouter une catégorie</h3>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nom de la catégorie"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder-indigo-100/40 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              />

              {/* Sélecteur de type */}
              <div className="space-y-2">
                <label className="block text-sm text-indigo-100">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCategoryKind("EXPENSE")}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition ${
                      newCategoryKind === "EXPENSE"
                        ? "border-red-400 bg-red-500/20 text-red-300"
                        : "border-white/20 text-slate-400 hover:border-white/40"
                    }`}
                  >
                    <TrendingDown className="h-4 w-4" />
                    Dépense
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCategoryKind("INCOME")}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition ${
                      newCategoryKind === "INCOME"
                        ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                        : "border-white/20 text-slate-400 hover:border-white/40"
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    Revenu
                  </button>
                </div>
              </div>

              {/* Sélecteur de couleur */}
              <div className="space-y-2">
                <label className="block text-sm text-indigo-100">Couleur</label>
                <div className="grid grid-cols-4 gap-2">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCategoryColor(color)}
                      className={`h-10 rounded-lg border-2 transition ${
                        newCategoryColor === color
                          ? "border-white scale-110"
                          : "border-white/30 hover:border-white/50"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={createCategory}
                disabled={!newCategoryName.trim() || creating}
                className="w-full flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold shadow-lg transition hover:from-indigo-400 hover:to-violet-400 disabled:opacity-60"
              >
                {creating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" /> Créer
                  </>
                )}
              </button>

              {/* Bouton pour ajouter les catégories par défaut */}
              {categories.length > 0 && (
                <button
                  onClick={seedDefaultCategories}
                  disabled={seedingDefaults}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-xs text-indigo-200 transition hover:bg-white/5 disabled:opacity-60"
                >
                  {seedingDefaults ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Ajouter catégories manquantes
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
