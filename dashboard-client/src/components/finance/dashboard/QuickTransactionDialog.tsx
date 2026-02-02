

import { memo, useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, CheckCircle2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { api } from "@/lib/finance/api";
import { showToast } from "@/lib/notifications";

interface QuickTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TransactionFormData {
  amount: string;
  type: "credit" | "debit";
  categoryId: string;
  description: string;
  accountId: string;
}

/**
 * Quick Transaction Dialog
 * Features:
 * - Auto-focused amount input
 * - Type selector (income/expense)
 * - Category selection
 * - Description field
 * - Save & Add Another option
 * - Optimistic UI updates
 */
export const QuickTransactionDialog = memo(function QuickTransactionDialog({
  open,
  onOpenChange,
}: QuickTransactionDialogProps) {
  const queryClient = useQueryClient();
  const amountInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<TransactionFormData>({
    amount: "",
    type: "debit",
    categoryId: "",
    description: "",
    accountId: "",
  });

  const [saveAndAddAnother, setSaveAndAddAnother] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        amount: "",
        type: "debit",
        categoryId: "",
        description: "",
        accountId: "",
      });
      setShowSuccess(false);
      // Auto-focus amount input
      setTimeout(() => amountInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      // Format data for API
      const payload = {
        amount: parseFloat(data.amount),
        type: data.type,
        categoryId: data.categoryId ? parseInt(data.categoryId) : undefined,
        description: data.description,
        accountId: data.accountId ? parseInt(data.accountId) : undefined,
        occurredAt: new Date().toISOString(),
        status: "CONFIRMED",
      };

      return api("/transactions", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      // Invalidate dashboard query to refetch with new transaction
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] });

      // Show success state
      setShowSuccess(true);
      showToast("Transaction ajoutée avec succès", "success");

      // If "Save & Add Another", reset form after brief delay
      if (saveAndAddAnother) {
        setTimeout(() => {
          setFormData({
            ...formData,
            amount: "",
            description: "",
          });
          setShowSuccess(false);
          amountInputRef.current?.focus();
        }, 1000);
      } else {
        // Close dialog after brief success display
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      }
    },
    onError: (error: Error) => {
      showToast(
        error.message || "Erreur lors de l'ajout de la transaction",
        "error"
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showToast("Veuillez entrer un montant valide", "error");
      return;
    }

    createTransactionMutation.mutate(formData);
  };

  const isSubmitting = createTransactionMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-slate-900/95 backdrop-blur-xl sm:max-w-md">
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4 text-slate-400" />
          <span className="sr-only">Fermer</span>
        </button>

        <DialogHeader>
          <DialogTitle className="text-white">
            {showSuccess ? "Transaction ajoutée !" : "Ajouter une transaction"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {showSuccess
              ? "La transaction a été ajoutée avec succès"
              : "Ajoutez rapidement une transaction à votre compte"}
          </DialogDescription>
        </DialogHeader>

        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 rounded-full bg-emerald-500/20 p-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            </div>
            <p className="text-lg font-semibold text-white">
              {formData.type === "credit" ? "+" : "-"}
              {parseFloat(formData.amount).toFixed(2)} €
            </p>
            <p className="text-sm text-slate-400">
              {formData.description || "Transaction enregistrée"}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type selector - Touch-optimized */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "debit" })}
                className={`flex items-center justify-center gap-2 rounded-lg border py-3 px-4 min-h-[44px] transition-all ${
                  formData.type === "debit"
                    ? "border-rose-500/50 bg-rose-500/10 text-rose-400"
                    : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 active:scale-95"
                }`}
              >
                <ArrowUpRight className="h-4 w-4" />
                <span className="font-medium text-sm sm:text-base">Dépense</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "credit" })}
                className={`flex items-center justify-center gap-2 rounded-lg border py-3 px-4 min-h-[44px] transition-all ${
                  formData.type === "credit"
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                    : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 active:scale-95"
                }`}
              >
                <ArrowDownLeft className="h-4 w-4" />
                <span className="font-medium">Revenu</span>
              </button>
            </div>

            {/* Amount input */}
            <div>
              <label htmlFor="amount" className="mb-2 block text-sm font-medium text-slate-300">
                Montant *
              </label>
              <div className="relative">
                <input
                  ref={amountInputRef}
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 pr-8 text-lg font-semibold text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-400">
                  €
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-300">
                Description
              </label>
              <input
                id="description"
                type="text"
                placeholder="Ex: Paiement fournisseur, Vente produit..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            {/* Save & Add Another checkbox */}
            <div className="flex items-center gap-2">
              <input
                id="saveAndAddAnother"
                type="checkbox"
                checked={saveAndAddAnother}
                onChange={(e) => setSaveAndAddAnother(e.target.checked)}
                className="h-4 w-4 rounded border-white/10 bg-white/5 text-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:ring-offset-0"
              />
              <label htmlFor="saveAndAddAnother" className="text-sm text-slate-300">
                Enregistrer et ajouter une autre
              </label>
            </div>

            {/* Submit buttons - Touch-optimized */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 min-h-[44px] font-medium text-white transition-colors hover:bg-white/10 active:scale-95"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-violet-500/50 bg-gradient-to-br from-violet-500 to-indigo-600 px-4 py-3 min-h-[44px] font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-violet-500/50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer"
                )}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
});
