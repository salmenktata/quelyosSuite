

import { useEffect, useState } from "react";
import { api } from "@/lib/finance/api";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { GlassCard, GlassPanel, GlassBadge, GlassListItem } from "@/components/ui/glass";
import type { CreateBudgetRequest } from "@/types/api";
import { logger } from '@quelyos/logger';

type Budget = {
  id: number;
  name: string;
  createdAt: string;
};

export default function BudgetsPage() {
  useRequireAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [newBudgetName, setNewBudgetName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchBudgets() {
    try {
      setError(null);
      setLoading(true);
      const data = await api<Budget[]>("/budgets");
      setBudgets(data);
    } catch (err) {
      logger.error("Erreur:", err);
      setError(err instanceof Error ? err.message : "Erreur de chargement des budgets.");
    } finally {
      setLoading(false);
    }
  }

  async function createBudget(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError(null);

    try {
      const payload: CreateBudgetRequest = {
        name: newBudgetName,
        amount: 0,
        period: "MONTHLY",
      };

      await api("/budgets", {
        method: "POST",
        body: payload,
      });

      setNewBudgetName("");
      fetchBudgets();
    } catch (err) {
      logger.error("Erreur:", err);
      setError(
        err instanceof Error ? err.message : "Impossible de créer le budget."
      );
    }
  }

  useEffect(() => {
    fetchBudgets();
  }, []);

  return (
    <div className="relative space-y-6 text-white">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute -right-40 top-40 h-[400px] w-[400px] rounded-full bg-purple-500/20 blur-[120px]" />
      </div>

      <div className="relative space-y-1">
        <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Budgets</p>
        <h1 className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-2xl md:text-3xl font-semibold text-transparent">
          Pilotez vos enveloppes
        </h1>
        <p className="text-sm text-indigo-100/80 hidden md:block">Créez, ajustez et suivez vos budgets par période.</p>
      </div>

      <div className="relative grid gap-4 md:gap-6 lg:grid-cols-2" data-guide="budget-overview">
        <GlassPanel gradient="indigo">
          <form onSubmit={createBudget} className="space-y-4" data-guide="add-budget">
            <div className="space-y-2">
              <h2 className="text-lg md:text-xl font-semibold">Créer un budget</h2>
              <p className="text-sm text-indigo-100/80 hidden md:block">Définissez un montant pour garder le cap.</p>
            </div>

            <label className="text-sm text-indigo-100" htmlFor="budget">Nom du budget</label>
            <input
              id="budget"
              type="text"
              placeholder="Marketing T1, Dépenses fixes..."
              value={newBudgetName}
              onChange={(e) => setNewBudgetName(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 md:px-4 md:py-3 text-white placeholder:text-indigo-100/60 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 backdrop-blur-sm"
              required
            />

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 md:py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-400 hover:to-violet-400"
            >
              Créer le budget
            </button>

            {error && (
              <GlassCard variant="subtle" className="border-rose-500/30 bg-rose-500/10 px-4 py-3">
                <p className="text-sm text-rose-200">{error}</p>
              </GlassCard>
            )}
          </form>
        </GlassPanel>

        <GlassPanel gradient="purple">
          <div className="mb-4 flex items-center justify-between" data-guide="budget-progress">
            <div>
              <h2 className="text-lg md:text-xl font-semibold">Budgets récents</h2>
              <p className="text-sm text-indigo-100/80 hidden md:block">Historique des enveloppes créées.</p>
            </div>
            {budgets.length > 0 && (
              <span className="md:hidden text-xs text-indigo-200 bg-white/10 px-2 py-1 rounded-full">
                {budgets.length}
              </span>
            )}
          </div>

          <div className="space-y-2 md:space-y-3">
            {loading && (
              <GlassCard variant="subtle" className="px-4 py-3 text-sm text-indigo-100/80">
                Chargement des budgets...
              </GlassCard>
            )}

            {!loading &&
              budgets.map((b) => (
                <GlassListItem key={b.id} className="px-3 py-2.5 md:px-4 md:py-3 flex-col sm:flex-row gap-2 sm:gap-0">
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{b.name}</div>
                    <div className="text-xs text-indigo-100/70">
                      Créé le {new Date(b.createdAt).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <GlassBadge variant="default" className="self-start sm:self-center">Budget</GlassBadge>
                </GlassListItem>
              ))}

            {!loading && budgets.length === 0 && (
              <GlassCard variant="subtle" className="px-4 py-3 text-sm text-indigo-100/80">
                Aucun budget pour le moment.
              </GlassCard>
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
