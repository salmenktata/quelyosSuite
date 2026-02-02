/**
 * Création/Édition Budget - Formulaire de gestion budgétaire
 *
 * Fonctionnalités :
 * - Création nouveau budget avec nom, montant et période
 * - Édition budget existant (mode query param ?id=X)
 * - Association optionnelle à une catégorie de dépense
 * - Choix période : hebdo, mensuel, trimestriel, annuel, personnalisé
 * - Validation formulaire et gestion erreurs
 */
import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs } from '@/components/common'
import { ROUTES } from '@/lib/finance/compat/routes'
import { api } from '@/lib/finance/api'
import { useRequireAuth } from '@/lib/finance/compat/auth'
import { useCurrency } from '@/lib/finance/CurrencyContext'
import { GlassCard, GlassPanel } from '@/components/ui/glass'
import { Save, Loader2, AlertCircle } from 'lucide-react'
import type { CreateBudgetRequest, UpdateBudgetRequest } from '@/types/api'
import { logger } from '@quelyos/logger'

type Category = {
  id: number;
  name: string;
  kind: "INCOME" | "EXPENSE";
};

export default function NewBudgetPage() {
  useRequireAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const { currency } = useCurrency();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [period, setPeriod] = useState<"WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM">("MONTHLY");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await api<Category[]>("/finance/categories");
      setCategories(data.filter(c => c.kind === "EXPENSE"));
    } catch {
      // Ignorer l'erreur, les catégories sont optionnelles
    }
  }, []);

  const fetchBudget = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const data = await api<{ id: number; name: string; amount: number; categoryId?: number; period?: string; startDate?: string }>(`/budgets/${id}`);
      setName(data.name);
      setAmount(data.amount?.toString() || "");
      if (data.categoryId) setCategoryId(data.categoryId.toString());
      if (data.period) setPeriod(data.period as "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM");
      if (data.startDate) setStartDate(data.startDate.split("T")[0]);
    } catch (err) {
      logger.error("Erreur:", err);
      setError(err instanceof Error ? err.message : "Erreur de chargement du budget");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    if (editId) {
      fetchBudget(editId);
    }
  }, [editId, fetchCategories, fetchBudget]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload = {
        name,
        amount: parseFloat(amount),
        categoryId: categoryId ? parseInt(categoryId) : null,
        period,
        startDate,
        endDate: period === "CUSTOM" ? endDate : null,
      };

      if (editId) {
        await api(`/budgets/${editId}`, {
          method: "PUT",
          body: payload as UpdateBudgetRequest,
        });
      } else {
        await api("/budgets", {
          method: "POST",
          body: payload as CreateBudgetRequest,
        });
      }

      navigate(ROUTES.FINANCE.DASHBOARD.BUDGETS.HOME);
    } catch (err) {
      logger.error("Erreur:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  const _money = new Intl.NumberFormat("fr-FR", { style: "currency", currency });

  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Finance', href: '/finance' },
            { label: 'Budgets', href: '/finance/budgets' },
            { label: editId ? 'Modifier' : 'Nouveau' },
          ]}
        />

        {/* Header */}
        <div>
          <p className="text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
            Budgets
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {editId ? 'Modifier le budget' : 'Nouveau budget'}
          </h1>
        </div>

        {/* Formulaire */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <GlassPanel gradient="indigo">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <GlassCard variant="subtle" className="border-rose-500/30 bg-rose-500/10 px-4 py-3">
                    <div className="flex items-center gap-2 text-rose-200">
                      <AlertCircle size={16} />
                      <span className="text-sm">{error}</span>
                    </div>
                  </GlassCard>
                )}

                {/* Nom du budget */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-amber-100">
                    Nom du budget *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Marketing Q1, Frais fixes..."
                    required
                    className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  />
                </div>

                {/* Montant */}
                <div className="space-y-2">
                  <label htmlFor="amount" className="text-sm font-medium text-amber-100">
                    Montant alloué ({currency}) *
                  </label>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1000.00"
                    required
                    className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  />
                </div>

                {/* Catégorie */}
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium text-amber-100">
                    Catégorie (optionnel)
                  </label>
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  >
                    <option value="" className="bg-slate-900">Toutes catégories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-slate-900">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Période */}
                <div className="space-y-2">
                  <label htmlFor="period" className="text-sm font-medium text-amber-100">
                    Période
                  </label>
                  <select
                    id="period"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM")}
                    className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  >
                    <option value="WEEKLY" className="bg-slate-900">Hebdomadaire</option>
                    <option value="MONTHLY" className="bg-slate-900">Mensuel</option>
                    <option value="QUARTERLY" className="bg-slate-900">Trimestriel</option>
                    <option value="YEARLY" className="bg-slate-900">Annuel</option>
                    <option value="CUSTOM" className="bg-slate-900">Personnalisé</option>
                  </select>
                  <p className="text-xs text-white/50">
                    {period === "WEEKLY" && "Budget remis à zéro chaque semaine"}
                    {period === "MONTHLY" && "Budget remis à zéro le 1er de chaque mois"}
                    {period === "QUARTERLY" && "Budget remis à zéro tous les 3 mois"}
                    {period === "YEARLY" && "Budget remis à zéro chaque année"}
                    {period === "CUSTOM" && "Définissez une période personnalisée avec date de fin"}
                  </p>
                </div>

                {/* Date de début */}
                <div className="space-y-2">
                  <label htmlFor="startDate" className="text-sm font-medium text-amber-100">
                    Date de début
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                  />
                </div>

                {/* Date de fin (si période personnalisée) */}
                {period === "CUSTOM" && (
                  <div className="space-y-2">
                    <label htmlFor="endDate" className="text-sm font-medium text-amber-100">
                      Date de fin *
                    </label>
                    <input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      required
                      className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                    />
                  </div>
                )}

                {/* Boutons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    {editId ? "Mettre à jour" : "Créer le budget"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.FINANCE.DASHBOARD.BUDGETS.HOME)}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </GlassPanel>
          </div>

          {/* Info panel */}
          <div>
            <GlassPanel gradient="purple">
              <h3 className="text-lg font-semibold mb-4">💡 Conseils</h3>
              <ul className="space-y-3 text-sm text-white/80">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  Définissez un budget réaliste basé sur vos dépenses passées.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  Les budgets mensuels sont plus faciles à suivre.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  Associez une catégorie pour un suivi plus précis.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  Vous recevrez des alertes à 80% et 100% du budget.
                </li>
              </ul>
            </GlassPanel>
          </div>
        </div>
      </div>
    </Layout>
  )
}
