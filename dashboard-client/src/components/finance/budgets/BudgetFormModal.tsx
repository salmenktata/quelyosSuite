

import { useState, useEffect, useRef, memo } from "react";
import { GlassPanel, GlassCard, GlassButton } from "@/components/ui/glass";
import { Plus, Sparkles } from "lucide-react";

type Category = {
  id: number;
  name: string;
  kind: "INCOME" | "EXPENSE";
};

type BudgetFormData = {
  name: string;
  amount: string;
  categoryId: number | null;
  period: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";
  startDate: string;
  endDate: string;
};

interface BudgetFormModalProps {
  mode: "create" | "edit";
  initialData?: BudgetFormData;
  categories: Category[];
  onSubmit: (data: BudgetFormData) => Promise<void>;
  onCancel: () => void;
  error?: string | null;
}

export const BudgetFormModal = memo(function BudgetFormModal({
  mode,
  initialData,
  categories,
  onSubmit,
  onCancel,
  error
}: BudgetFormModalProps) {
  const [formData, setFormData] = useState<BudgetFormData>(
    initialData || {
      name: "",
      amount: "",
      categoryId: null,
      period: "MONTHLY",
      startDate: new Date().toISOString().split("T")[0],
      endDate: ""
    }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus first input when form opens
  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      amount: "",
      categoryId: null,
      period: "MONTHLY",
      startDate: new Date().toISOString().split("T")[0],
      endDate: ""
    });
  };

  const isCreate = mode === "create";
  const gradient = isCreate ? "indigo" : "violet";
  const buttonGradient = isCreate
    ? "from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 shadow-indigo-500/25 hover:shadow-indigo-500/40"
    : "from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400 shadow-violet-500/25 hover:shadow-violet-500/40";
  const iconColor = isCreate ? "text-indigo-400" : "text-violet-400";
  const focusRing = isCreate
    ? "focus:border-indigo-400 focus:ring-indigo-400/40"
    : "focus:border-violet-400 focus:ring-violet-400/40";

  return (
    <div className="relative animate-in slide-in-from-top-4 fade-in duration-300">
      <GlassPanel gradient={gradient}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-5 h-5 ${iconColor}`} />
            <h3 className="text-lg font-semibold text-white">
              {isCreate ? "Nouveau budget" : "Modifier le budget"}
            </h3>
          </div>
          {!isCreate && (
            <button
              onClick={onCancel}
              className="text-sm text-indigo-100/60 hover:text-white transition-colors"
            >
              ✕ Fermer
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Nom du budget <span className="text-rose-600 dark:text-rose-400">*</span>
              </label>
              <input
                ref={firstInputRef}
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Marketing Q1, Dépenses fixes..."
                className={`w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/10 px-4 py-2.5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-indigo-100/60 focus:outline-none focus:ring-2 backdrop-blur-sm transition-all ${focusRing}`}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Montant <span className="text-rose-600 dark:text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="1000.00"
                  className={`w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/10 px-4 py-2.5 pr-12 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-indigo-100/60 focus:outline-none focus:ring-2 backdrop-blur-sm ${focusRing}`}
                  required
                  disabled={isSubmitting}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-indigo-100/60">€</span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Catégorie
              </label>
              <select
                name="categoryId"
                value={formData.categoryId || ""}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value ? Number(e.target.value) : null })}
                className={`w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/10 px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 backdrop-blur-sm ${focusRing}`}
                disabled={isSubmitting}
              >
                <option value="">Toutes catégories</option>
                {categories.filter(c => c.kind === "EXPENSE").map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Period */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Période <span className="text-rose-600 dark:text-rose-400">*</span>
              </label>
              <select
                name="period"
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value as typeof formData.period })}
                className={`w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/10 px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 backdrop-blur-sm ${focusRing}`}
                required
                disabled={isSubmitting}
              >
                <option value="WEEKLY">Hebdomadaire</option>
                <option value="MONTHLY">Mensuel</option>
                <option value="QUARTERLY">Trimestriel</option>
                <option value="YEARLY">Annuel</option>
                <option value="CUSTOM">Personnalisé</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Date de début <span className="text-rose-600 dark:text-rose-400">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={`w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/10 px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 backdrop-blur-sm ${focusRing}`}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* End Date (only if CUSTOM) */}
            {formData.period === "CUSTOM" && (
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Date de fin <span className="text-rose-600 dark:text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate}
                  className={`w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/10 px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 backdrop-blur-sm ${focusRing}`}
                  required={formData.period === "CUSTOM"}
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`group relative rounded-xl bg-gradient-to-r ${buttonGradient} px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isCreate && <Plus className="w-4 h-4 inline mr-2 transition-transform group-hover:rotate-90" />}
                {isSubmitting ? "Traitement..." : isCreate ? "Créer le budget" : "Enregistrer les modifications"}
              </button>

              {isCreate && (formData.name || formData.amount) && !isSubmitting && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-sm text-indigo-100/60 hover:text-white transition-colors hover:underline"
                >
                  Réinitialiser
                </button>
              )}

              {!isCreate && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="text-sm text-indigo-100/60 hover:text-white transition-colors hover:underline"
                >
                  Annuler
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-indigo-100/40 hover:text-indigo-100/80 transition-colors"
            >
              Échap pour annuler
            </button>
          </div>

          {error && (
            <div className="animate-in slide-in-from-top-2 fade-in duration-200">
              <GlassCard variant="subtle" className="border-rose-500/30 bg-rose-500/10 px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center mt-0.5">
                    <span className="text-rose-300 text-xs">!</span>
                  </div>
                  <p className="text-sm text-rose-200 flex-1">{error}</p>
                </div>
              </GlassCard>
            </div>
          )}
        </form>
      </GlassPanel>
    </div>
  );
});
