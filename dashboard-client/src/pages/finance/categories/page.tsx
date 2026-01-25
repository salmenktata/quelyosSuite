

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { CreateCategoryRequest } from "@/types/api";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { GlassCard, GlassPanel, GlassBadge, GlassListItem } from "@/components/ui/glass";

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

  async function fetchCategories() {
    try {
      setError(null);
      const data = await api<Category[]>("/categories");
      setCategories(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur de chargement des catégories."
      );
    }
  }

  async function createCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api("/categories", {
        method: "POST",
        body: { name, kind } as CreateCategoryRequest,
      });

      setName("");
      setKind("EXPENSE");
      await fetchCategories();
    } catch (err) {
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

  return (
    <div className="relative space-y-6 text-white">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute -right-40 top-40 h-[400px] w-[400px] rounded-full bg-purple-500/20 blur-[120px]" />
      </div>

      <div className="relative space-y-1">
        <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Catégories</p>
        <h1 className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-3xl font-semibold text-transparent">
          Organisez vos catégories
        </h1>
        <p className="text-sm text-indigo-100/80">Classez vos transactions pour un suivi clair.</p>
      </div>

      <div className="relative grid gap-6 lg:grid-cols-2">
        <GlassPanel gradient="indigo">
          <form onSubmit={createCategory} className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Créer une catégorie</h2>
              <p className="text-sm text-indigo-100/80">Ajoutez des catégories adaptées à votre activité.</p>
            </div>

            <label className="text-sm text-indigo-100" htmlFor="category-name">Nom de la catégorie</label>
            <input
              id="category-name"
              type="text"
              placeholder="Ex: Charges fixes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-indigo-100/60 backdrop-blur-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              required
            />

            <label className="text-sm text-indigo-100" htmlFor="category-kind">Type</label>
            <select
              id="category-kind"
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white backdrop-blur-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              value={kind}
              onChange={(e) => setKind(e.target.value as "INCOME" | "EXPENSE")}
            >
              <option value="EXPENSE">Dépense</option>
              <option value="INCOME">Revenu</option>
            </select>

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-400 hover:to-violet-400 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Création..." : "Créer la catégorie"}
            </button>

            {error && (
              <GlassCard variant="subtle" className="border-rose-500/30 bg-rose-500/10 px-4 py-3">
                <p className="text-sm text-rose-200">{error}</p>
              </GlassCard>
            )}
          </form>
        </GlassPanel>

        <GlassPanel gradient="purple">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Liste des catégories</h2>
              <p className="text-sm text-indigo-100/80">Retrouvez toutes vos catégories existantes.</p>
            </div>
          </div>

          <div className="space-y-3">
            {categories.map((cat) => (
              <GlassListItem key={cat.id} className="px-4 py-3">
                <div className="space-y-1">
                  <span className="font-medium">{cat.name}</span>
                  <div className="text-xs text-indigo-100/70 flex items-center gap-2">
                    <GlassBadge variant={cat.kind === "INCOME" ? "success" : "default"}>
                      {cat.kind === "INCOME" ? "Revenu" : "Dépense"}
                    </GlassBadge>
                    <span>ID: {cat.id}</span>
                  </div>
                </div>
              </GlassListItem>
            ))}

            {categories.length === 0 && (
              <GlassCard variant="subtle" className="px-4 py-3 text-sm text-indigo-100/80">
                Aucune catégorie pour le moment.
              </GlassCard>
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
