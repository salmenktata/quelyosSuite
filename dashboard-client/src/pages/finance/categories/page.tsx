/**
 * Page : Catégories de transactions Finance
 *
 * Fonctionnalités :
 * - Affichage des catégories de revenus et dépenses séparées
 * - Création de nouvelles catégories (nom + type)
 * - Distinction visuelle revenus (vert) vs dépenses (rouge)
 * - Compteur de catégories par type
 * - Formulaire inline de création avec validation
 * - États empty adaptés pour chaque section
 */

import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Breadcrumbs, PageNotice, SkeletonTable } from "@/components/common";
import { api } from "@/lib/finance/api";
import type { CreateCategoryRequest } from "@/types/api";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { Button } from "@/components/ui/button";
import { Tag, Plus } from "lucide-react";
import { financeNotices } from "@/lib/notices/finance-notices";
import { logger } from '@quelyos/logger';

type Category = {
  id: number;
  name: string;
  companyId: number;
  kind: "INCOME" | "EXPENSE";
};

export default function CategoriesPage() {
  useRequireAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function fetchCategories() {
    try {
      setError(null);
      setLoading(true);
      const data = await api<Category[]>("/finance/categories");
      setCategories(data);
    } catch (err) {
      logger.error("Erreur:", err);
      setError(
        err instanceof Error ? err.message : "Erreur de chargement des catégories."
      );
    } finally {
      setLoading(false);
    }
  }

  async function createCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api("/finance/categories", {
        method: "POST",
        body: { name, kind } as CreateCategoryRequest,
      });

      setName("");
      setKind("EXPENSE");
      setShowForm(false);
      await fetchCategories();
    } catch (err) {
      logger.error("Erreur:", err);
      setError(
        err instanceof Error ? err.message : "Impossible de créer la catégorie."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  const incomeCategories = categories.filter((c) => c.kind === "INCOME");
  const expenseCategories = categories.filter((c) => c.kind === "EXPENSE");

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: "Finance", href: "/finance" },
            { label: "Catégories", href: "/finance/categories" },
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
            <Button
              variant="primary"
              className="gap-2"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus className="h-4 w-4" />
              {showForm ? "Annuler" : "Nouvelle catégorie"}
            </Button>
          </div>
        </div>

        <PageNotice
          config={financeNotices['categories']}
          className="mb-6"
        />

        {/* Formulaire de création */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <form onSubmit={createCategory} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Créer une catégorie
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-gray-900 dark:text-white"
                    htmlFor="category-name"
                  >
                    Nom de la catégorie <span className="text-rose-600 dark:text-rose-400">*</span>
                  </label>
                  <input
                    id="category-name"
                    type="text"
                    placeholder="Ex: Charges fixes"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-gray-900 dark:text-white"
                    htmlFor="category-kind"
                  >
                    Type <span className="text-rose-600 dark:text-rose-400">*</span>
                  </label>
                  <select
                    id="category-kind"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={kind}
                    onChange={(e) => setKind(e.target.value as "INCOME" | "EXPENSE")}
                  >
                    <option value="EXPENSE">Dépense</option>
                    <option value="INCOME">Revenu</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? "Création..." : "Créer la catégorie"}
                </Button>
              </div>

              {error && (
                <div role="alert" className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    <Button variant="outline" size="sm" onClick={fetchCategories}>
                      Réessayer
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Liste des catégories */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            <SkeletonTable rows={5} columns={2} />
            <SkeletonTable rows={5} columns={2} />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
          {/* Catégories de revenus */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Revenus
                </h2>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {incomeCategories.length} catégorie{incomeCategories.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {incomeCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    {cat.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ID: {cat.id}
                  </span>
                </div>
              ))}
              {incomeCategories.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  Aucune catégorie de revenus
                </div>
              )}
            </div>
          </div>

          {/* Catégories de dépenses */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Dépenses
                </h2>
                <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1 text-xs font-medium text-red-700 dark:text-red-300">
                  {expenseCategories.length} catégorie{expenseCategories.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {expenseCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    {cat.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ID: {cat.id}
                  </span>
                </div>
              ))}
              {expenseCategories.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  Aucune catégorie de dépenses
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </Layout>
  );
}
