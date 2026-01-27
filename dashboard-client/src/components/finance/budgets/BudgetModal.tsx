

import { useState, useEffect } from "react";
import { GlassCard, GlassButton } from "@/components/ui/glass";
import { X } from "lucide-react";
import { api } from "@/lib/finance/api";
import type { CreateBudgetRequest, UpdateBudgetRequest } from "@/types/api";
import { AnimatePresence, ScaleInBounce, Hoverable } from "@/lib/finance/compat/animated";
import { motion } from "framer-motion";

type BudgetPeriod = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";

interface Category {
  id: number;
  name: string;
  kind: "INCOME" | "EXPENSE";
}

interface BudgetFormData {
  name: string;
  amount: string;
  categoryId: number | null;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
}

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingId?: number;
  categories: Category[];
}

export function BudgetModal({ isOpen, onClose, onSuccess, editingId, categories }: BudgetModalProps) {
  const [formData, setFormData] = useState<BudgetFormData>({
    name: "",
    amount: "",
    categoryId: null,
    period: "MONTHLY",
    startDate: new Date().toISOString().split("T")[0],
    endDate: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load budget data if editing
  useEffect(() => {
    if (isOpen && editingId) {
      loadBudget();
    } else if (isOpen) {
      // Reset form for new budget
      setFormData({
        name: "",
        amount: "",
        categoryId: null,
        period: "MONTHLY",
        startDate: new Date().toISOString().split("T")[0],
        endDate: ""
      });
      setError(null);
    }
  }, [isOpen, editingId]);

  const loadBudget = async () => {
    try {
      setLoading(true);
      const budget = await api<{
        name?: string;
        amount?: number;
        categoryId?: number;
        period?: BudgetPeriod;
        startDate?: string;
        endDate?: string;
      }>(`/budgets/${editingId}`);
      setFormData({
        name: budget.name || "",
        amount: budget.amount?.toString() || "",
        categoryId: budget.categoryId || null,
        period: budget.period || "MONTHLY",
        startDate: budget.startDate ? budget.startDate.split("T")[0] : new Date().toISOString().split("T")[0],
        endDate: budget.endDate ? budget.endDate.split("T")[0] : ""
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      const payload = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        categoryId: formData.categoryId || null,
        period: formData.period,
        startDate: formData.startDate,
        endDate: formData.period === "CUSTOM" && formData.endDate ? formData.endDate : null
      };

      if (editingId) {
        await api(`/budgets/${editingId}`, {
          method: "PUT",
          body: payload as UpdateBudgetRequest
        });
      } else {
        await api("/budgets", {
          method: "POST",
          body: payload as CreateBudgetRequest
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <ScaleInBounce className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <GlassCard className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editingId ? "Modifier le budget" : "Créer un budget"}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-indigo-300" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Nom du budget <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: Marketing Q1, Dépenses fixes..."
                className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/10 px-4 py-2.5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-indigo-100/60 focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-400/40 backdrop-blur-sm"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Montant <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="1000.00"
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 pr-12 text-white placeholder:text-indigo-100/60 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 backdrop-blur-sm"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-indigo-100/60">
                  €
                </span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Catégorie (optionnel)
              </label>
              <select
                value={formData.categoryId || ""}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value ? Number(e.target.value) : null })}
                className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/10 px-4 py-2.5 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-400/40 backdrop-blur-sm"
              >
                <option value="">Toutes catégories</option>
                {categories
                  .filter(c => c.kind === "EXPENSE")
                  .map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
              <p className="mt-1 text-xs text-gray-600 dark:text-indigo-100/60">
                Suivre uniquement les dépenses de cette catégorie
              </p>
            </div>

            {/* Period */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Période <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value as BudgetPeriod })}
                className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/10 px-4 py-2.5 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-400/40 backdrop-blur-sm"
                required
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
                Date de début <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/10 px-4 py-2.5 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-400/40 backdrop-blur-sm"
                required
              />
            </div>

            {/* End Date (only for CUSTOM period) */}
            {formData.period === "CUSTOM" && (
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Date de fin <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate}
                  className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/10 px-4 py-2.5 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-400/40 backdrop-blur-sm"
                  required={formData.period === "CUSTOM"}
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <GlassCard variant="subtle" className="border-rose-300 dark:border-rose-500/30 bg-rose-100 dark:bg-rose-500/10 px-4 py-3">
                <p className="text-sm text-rose-800 dark:text-rose-200">{error}</p>
              </GlassCard>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Hoverable enableScale>
                <GlassButton
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400"
                >
                  {loading ? "Enregistrement..." : editingId ? "Mettre à jour" : "Créer"}
                </GlassButton>
              </Hoverable>
              <Hoverable enableScale>
                <GlassButton
                  type="button"
                  onClick={onClose}
                  variant="ghost"
                  disabled={loading}
                >
                  Annuler
                </GlassButton>
              </Hoverable>
            </div>
          </form>
        </GlassCard>
          </ScaleInBounce>
        </div>
      )}
    </AnimatePresence>
  );
}
