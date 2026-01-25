

import { memo, useState } from "react";
import { GlassCard, GlassBadge, GlassListItem } from "@/components/ui/glass";
import { Archive, Check } from "lucide-react";

type Account = {
  id: number;
  name: string;
  status?: "ACTIVE" | "INACTIVE";
};

interface DeleteConflictModalProps {
  isOpen: boolean;
  account: Account | null;
  availableAccounts: Account[];
  loading: boolean;
  error?: string | null;
  onCancel: () => void;
  onResolve: (action: "archive" | "reassign", targetAccountId?: number) => Promise<void>;
}

export const DeleteConflictModal = memo(function DeleteConflictModal({
  isOpen,
  account,
  availableAccounts,
  loading,
  error,
  onCancel,
  onResolve,
}: DeleteConflictModalProps) {
  const [deleteAction, setDeleteAction] = useState<"archive" | "reassign">("archive");
  const [reassignTargetId, setReassignTargetId] = useState<number | "">("");

  const handleResolve = async () => {
    if (deleteAction === "reassign" && !reassignTargetId) {
      return;
    }

    await onResolve(
      deleteAction,
      deleteAction === "reassign" && reassignTargetId ? Number(reassignTargetId) : undefined
    );
  };

  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <GlassCard variant="elevated" className="w-full max-w-2xl space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-orange-200">
              Suppression bloquée
            </p>
            <h3 className="text-xl font-semibold text-white">
              Transactions associées détectées
            </h3>
            <p className="text-sm text-indigo-100/80">
              Ce compte possède des transactions et ne peut pas être supprimé.
              Choisissez comment les traiter pour désactiver le compte.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg border border-white/20 px-3 py-2 text-sm text-indigo-50 transition hover:border-white/40"
          >
            ✕
          </button>
        </div>

        <GlassListItem className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wider text-indigo-100/70">
              Compte #{account.id}
            </div>
            <div className="text-lg font-semibold text-white">{account.name}</div>
          </div>
          <GlassBadge
            variant={account.status === "INACTIVE" ? "warning" : "success"}
          >
            {account.status === "INACTIVE" ? "Inactif" : "Actif"}
          </GlassBadge>
        </GlassListItem>

        <div className="grid gap-3 md:grid-cols-2">
          <label
            className={`flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition hover:border-indigo-400/60 hover:bg-indigo-500/5 ${
              deleteAction === "archive"
                ? "border-indigo-400/60 bg-indigo-500/5"
                : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="delete-action"
                checked={deleteAction === "archive"}
                onChange={() => setDeleteAction("archive")}
                className="mt-1 h-4 w-4 border-white/20 bg-white/10 text-indigo-500"
                disabled={loading}
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Archive size={16} />
                  <span className="font-semibold text-white">
                    Archiver les transactions
                  </span>
                </div>
                <p className="text-sm text-indigo-100/70">
                  Toutes les transactions liées seront archivées et le compte sera
                  marqué comme inactif.
                </p>
              </div>
            </div>
          </label>

          <label
            className={`flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition hover:border-indigo-400/60 hover:bg-indigo-500/5 ${
              deleteAction === "reassign"
                ? "border-indigo-400/60 bg-indigo-500/5"
                : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="delete-action"
                checked={deleteAction === "reassign"}
                onChange={() => setDeleteAction("reassign")}
                className="mt-1 h-4 w-4 border-white/20 bg-white/10 text-indigo-500"
                disabled={loading}
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Check size={16} />
                  <span className="font-semibold text-white">
                    Réassigner vers un autre compte
                  </span>
                </div>
                <p className="text-sm text-indigo-100/70">
                  Les transactions seront déplacées vers un autre compte actif,
                  puis ce compte sera désactivé.
                </p>
              </div>
            </div>

            {deleteAction === "reassign" && (
              <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3">
                <label className="text-xs uppercase tracking-wider text-indigo-200">
                  Compte de destination
                </label>
                <select
                  value={reassignTargetId}
                  onChange={(e) => {
                    const value = e.target.value;
                    setReassignTargetId(value ? Number(value) : "");
                  }}
                  className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  disabled={loading}
                >
                  <option value="">Choisir un compte</option>
                  {availableAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id} className="text-slate-900">
                      {acc.name}
                    </option>
                  ))}
                </select>
                {availableAccounts.length === 0 && (
                  <p className="text-xs text-orange-200/80">
                    Aucun autre compte actif disponible pour la réassignation.
                  </p>
                )}
              </div>
            )}
          </label>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-indigo-50 transition hover:border-white/40"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            onClick={handleResolve}
            disabled={
              loading ||
              (deleteAction === "reassign" &&
                (!reassignTargetId || availableAccounts.length === 0))
            }
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-indigo-400 hover:to-violet-400 disabled:opacity-60"
          >
            {loading ? "Traitement..." : "Valider et désactiver"}
          </button>
        </div>
      </GlassCard>
    </div>
  );
});
