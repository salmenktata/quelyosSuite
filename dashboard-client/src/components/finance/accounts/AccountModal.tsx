

import { memo, useEffect, useRef, useState } from "react";
import { currencies } from "@/lib/finance/currencies";
import { AnimatePresence, ScaleInBounce, Hoverable } from "@/lib/finance/compat/animated";
import { LazyMotion, domAnimation, m } from "framer-motion";

type AccountType =
  | "banque"
  | "cash"
  | "cheques"
  | "traites"
  | "carte"
  | "epargne"
  | "investissement"
  | "pret";

type Portfolio = {
  id: number;
  name: string;
};

export type AccountFormData = {
  name: string;
  type: AccountType;
  currency: string;
  balance: number | "";
  institution: string;
  notes: string;
  status: "ACTIVE" | "INACTIVE";
  selectedPortfolios: number[];
};

interface AccountModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialData?: AccountFormData;
  portfolios: Portfolio[];
  loading: boolean;
  error?: string | null;
  onSubmit: (data: AccountFormData) => Promise<void>;
  onCancel: () => void;
  isSuperAdmin?: boolean;
  targetCompanyId?: string;
  onTargetCompanyIdChange?: (value: string) => void;
}

const accountTypes: { value: AccountType; label: string }[] = [
  { value: "banque", label: "Banque" },
  { value: "cash", label: "Cash" },
  { value: "cheques", label: "Chèques" },
  { value: "traites", label: "Traites" },
  { value: "carte", label: "Carte (débit/crédit)" },
  { value: "epargne", label: "Épargne" },
  { value: "investissement", label: "Investissement" },
  { value: "pret", label: "Prêt / Crédit" },
];

export const AccountModal = memo(function AccountModal({
  isOpen,
  mode,
  initialData,
  portfolios,
  loading,
  error,
  onSubmit,
  onCancel,
  isSuperAdmin = false,
  targetCompanyId = "",
  onTargetCompanyIdChange,
}: AccountModalProps) {
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<AccountFormData>(
    initialData || {
      name: "",
      type: "banque",
      currency: "EUR",
      balance: "",
      institution: "",
      notes: "",
      status: "ACTIVE",
      selectedPortfolios: [],
    }
  );

  // Sync form data with initialData when it changes
  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(initialData);
    }
  }, [initialData]);

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const isCreate = mode === "create";
  const title = isCreate ? "Nouveau compte" : "Modifier le compte";

  return (
    <LazyMotion features={domAnimation}>
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <ScaleInBounce className="relative w-full max-w-2xl">
            <form
              onSubmit={handleSubmit}
              onClick={(e) => e.stopPropagation()}
              className="space-y-4 rounded-2xl border border-white/15 bg-gradient-to-br from-slate-900/95 via-indigo-950/95 to-slate-900/95 p-6 shadow-2xl backdrop-blur-xl max-h-[90vh] overflow-y-auto"
            >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/20 p-2 text-indigo-50 transition hover:border-white/40"
          >
            ✕
          </button>
        </div>

        {isSuperAdmin && onTargetCompanyIdChange && (
          <div className="flex flex-col gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-indigo-50">
            <span className="font-semibold">Super admin</span>
            <input
              type="number"
              value={targetCompanyId}
              onChange={(e) => onTargetCompanyIdChange(e.target.value)}
              placeholder="ID société"
              className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white placeholder:text-indigo-100/60"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm text-indigo-100">Nom du compte</label>
          <input
            ref={firstInputRef}
            type="text"
            placeholder="Compte courant"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            required
            disabled={loading}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-indigo-100">Type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as AccountType })
              }
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              disabled={loading}
            >
              {accountTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-indigo-100">Devise</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              disabled={loading}
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-indigo-100">Solde</label>
            <input
              type="number"
              step="0.01"
              value={formData.balance}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  balance: e.target.value === "" ? "" : Number(e.target.value),
                })
              }
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-indigo-100">Établissement</label>
            <input
              type="text"
              placeholder="BNP, Société Générale..."
              value={formData.institution}
              onChange={(e) =>
                setFormData({ ...formData, institution: e.target.value })
              }
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-indigo-100">Notes</label>
          <textarea
            rows={3}
            placeholder="Conditions, plafond, remarques…"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-indigo-100">Statut</label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as "ACTIVE" | "INACTIVE",
              })
            }
            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            disabled={loading}
          >
            <option value="ACTIVE">Actif</option>
            <option value="INACTIVE">Inactif</option>
          </select>
        </div>

        <div className="space-y-3 rounded-xl border border-white/15 bg-white/5 p-4">
          <div className="space-y-1">
            <label className="text-sm text-indigo-100">Portefeuilles</label>
            <p className="text-xs text-indigo-100/70">
              Si aucun portefeuille n&apos;est sélectionné, le compte sera
              disponible dans tous les portefeuilles.
            </p>
          </div>

          <div className="space-y-2">
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-3">
              {portfolios.length === 0 ? (
                <p className="text-xs text-indigo-100/60">Aucun portefeuille</p>
              ) : (
                portfolios.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`modal-portfolio-${p.id}`}
                      checked={formData.selectedPortfolios.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            selectedPortfolios: [
                              ...formData.selectedPortfolios,
                              p.id,
                            ],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            selectedPortfolios:
                              formData.selectedPortfolios.filter(
                                (id) => id !== p.id
                              ),
                          });
                        }
                      }}
                      className="h-4 w-4 rounded border-white/20 bg-white/10 text-indigo-500"
                      disabled={loading}
                    />
                    <label
                      htmlFor={`modal-portfolio-${p.id}`}
                      className="text-sm text-indigo-100"
                    >
                      {p.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

              <div className="flex gap-3">
                <Hoverable enableScale>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:from-indigo-400 hover:to-violet-400 disabled:opacity-60"
                  >
                    {loading
                      ? "Traitement..."
                      : isCreate
                        ? "Créer le compte"
                        : "Mettre à jour"}
                  </button>
                </Hoverable>
                <Hoverable enableScale>
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-indigo-50 transition hover:border-white/40 disabled:opacity-60"
                  >
                    Annuler
                  </button>
                </Hoverable>
              </div>
            </form>
          </ScaleInBounce>
        </div>
      )}
    </AnimatePresence>
    </LazyMotion>
  );
});
