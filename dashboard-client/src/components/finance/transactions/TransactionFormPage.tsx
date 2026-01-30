

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/finance/api";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { PaymentFlowSelector } from "@/components/PaymentFlowSelector";
import { CategorySuggestionCard } from "./CategorySuggestionCard";
import { DuplicateConfirmModal } from "./DuplicateConfirmModal";
import type { CreateTransactionRequest } from "@/types/api";
import { logger } from '@quelyos/logger';

type Transaction = {
  id: number;
  amount: number;
  type: "credit" | "debit";
  accountId: number;
  occurredAt: string;
  scheduledFor?: string | null;
  status?: "PLANNED" | "CONFIRMED" | "SCHEDULED" | "CANCELED";
  tags?: string[];
  description?: string | null;
  account?: { id: number; name?: string };
  category?: { id: number; name: string; kind: "INCOME" | "EXPENSE" } | null;
};

type Account = { id: number; name: string };

type Category = { id: number; name: string; kind: "INCOME" | "EXPENSE" };

const statusOptions = [
  { value: "PLANNED", label: "Prévu" },
  { value: "SCHEDULED", label: "Programmé" },
  { value: "CONFIRMED", label: "Fait" },
  { value: "CANCELED", label: "Annulé" },
];

type TransactionFormPageProps = {
  transactionType: "income" | "expense";
};

const CONFIGS = {
  income: {
    type: "credit" as const,
    categoryKind: "INCOME" as const,
    title: "Revenus",
    subtitle: "Nouveau revenu",
    description: "Créez ou éditez un revenu et créditez le bon compte.",
    themeColor: "emerald",
    bgGradient: "bg-emerald-500/20",
    amountPlaceholder: "ex: 2500",
    tagsPlaceholder: "ex: salaire, freelance",
    tagsHint: "Saisir plusieurs tags : client, projet, récurrent.",
    descriptionPlaceholder: "Détails ou contexte du revenu",
    paymentFlowHint: "Mode d'encaissement : virement, CB, chèque...",
    buttonGradient: "from-emerald-500 to-teal-400",
    buttonGradientHover: "from-emerald-400 to-teal-300",
    addButtonText: "Ajouter le revenu",
    historyTitle: "Historique",
    historySubtitle: "Derniers revenus enregistrés.",
    loadingText: "Chargement des revenus...",
    emptyText: "Aucun revenu pour le moment.",
    amountColor: "text-emerald-200",
    amountPrefix: "+",
  },
  expense: {
    type: "debit" as const,
    categoryKind: "EXPENSE" as const,
    title: "Dépenses",
    subtitle: "Nouvelle dépense",
    description: "Créez ou éditez une dépense et débitez le bon compte.",
    themeColor: "rose",
    bgGradient: "bg-rose-500/20",
    amountPlaceholder: "ex: 1200",
    tagsPlaceholder: "ex: facture, abonnement",
    tagsHint: "Saisir plusieurs tags : loyer, SaaS, récurrent.",
    descriptionPlaceholder: "Détails ou contexte de la dépense",
    paymentFlowHint: "Mode de paiement : CB, chèque, virement, espèces...",
    buttonGradient: "from-rose-500 to-orange-400",
    buttonGradientHover: "from-rose-400 to-orange-300",
    addButtonText: "Ajouter la dépense",
    historyTitle: "Historique",
    historySubtitle: "Dernières dépenses enregistrées.",
    loadingText: "Chargement des dépenses...",
    emptyText: "Aucune dépense pour le moment.",
    amountColor: "text-rose-200",
    amountPrefix: "-",
  },
};

export function TransactionFormPage({ transactionType }: TransactionFormPageProps) {
  const config = CONFIGS[transactionType];

  useRequireAuth();
  const { currency } = useCurrency();
  const [searchParams] = useSearchParams();
  const _navigate = useNavigate();
  const targetId = useMemo(() => {
    const raw = searchParams?.get("id");
    return raw ? Number(raw) : null;
  }, [searchParams]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newTx, setNewTx] = useState({
    amount: "",
    accountId: "",
    paymentFlowId: null as number | null,
    status: "CONFIRMED" as Transaction["status"],
    occurredAt: new Date().toISOString().slice(0, 10),
    scheduledFor: "",
    tags: "",
    description: "",
    categoryId: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Duplicate detection states
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<any | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await api("/transactions?archived=false");
      setTransactions(
        Array.isArray(data)
          ? data.filter((tx: Transaction) => tx.type === config.type)
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur de chargement des transactions."
      );
    } finally {
      setLoading(false);
    }
  }, [config.type]);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await api("/accounts");
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur de chargement des comptes."
      );
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await api(`/categories?kind=${config.categoryKind}`);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur de chargement des catégories."
      );
    }
  }, [config.categoryKind]);

  async function addTransaction(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const requiresSchedule = newTx.status === "PLANNED" || newTx.status === "SCHEDULED";
      if (requiresSchedule && !newTx.scheduledFor) {
        setError("La date planifiée est obligatoire pour un statut Prévu ou Programmé.");
        setLoading(false);
        return;
      }

      const description = newTx.description.trim();
      const payload = {
        amount: Number(newTx.amount),
        type: config.type,
        accountId: Number(newTx.accountId),
        paymentFlowId: newTx.paymentFlowId || undefined,
        status: newTx.status,
        occurredAt: newTx.occurredAt,
        scheduledFor: newTx.scheduledFor || undefined,
        tags: newTx.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        description: description === "" ? null : description,
        categoryId: newTx.categoryId ? Number(newTx.categoryId) : null,
      };

      if (editingId) {
        await api(`/transactions/${editingId}`, {
          method: "PATCH",
          body: payload as unknown as Partial<CreateTransactionRequest>,
        });
      } else {
        // Vérifier les doublons avant de créer une nouvelle transaction
        if (description && payload.accountId) {
          try {
            const duplicateCheck = await api("/finance/duplicates/check", {
              method: "POST",
              body: {
                description,
                amount: payload.amount,
                date: payload.occurredAt,
                accountId: payload.accountId,
              },
            }) as any;

            // Si doublon détecté (similarité >= 75%), afficher modal
            if (duplicateCheck.is_likely_duplicate && duplicateCheck.matches.length > 0) {
              setPendingTransaction(payload);
              setDuplicateMatches(duplicateCheck.matches);
              setShowDuplicateModal(true);
              setLoading(false);
              return; // Stopper ici, attendre user action
            }
          } catch (err) {
            // Silently fail - duplicate check is optional
            logger.warn("Duplicate check failed:", err);
          }
        }

        // Pas de doublon détecté, créer la transaction
        await api("/transactions", {
          method: "POST",
          body: payload as unknown as CreateTransactionRequest,
        });
      }

      setNewTx({
        amount: "",
        accountId: "",
        paymentFlowId: null,
        status: "CONFIRMED",
        occurredAt: new Date().toISOString().slice(0, 10),
        scheduledFor: "",
        tags: "",
        description: "",
        categoryId: "",
      });
      setEditingId(null);
      fetchTransactions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'ajouter la transaction."
      );
    } finally {
      setLoading(false);
    }
  }

  function startEdit(tx: Transaction) {
    setEditingId(tx.id);
    setNewTx({
      amount: String(tx.amount),
      accountId: String(tx.accountId),
      paymentFlowId: (tx as Transaction & { paymentFlowId?: number }).paymentFlowId || null,
      status: (tx.status as Transaction["status"]) ?? "CONFIRMED",
      occurredAt: tx.occurredAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      scheduledFor: tx.scheduledFor ? tx.scheduledFor.slice(0, 10) : "",
      tags: tx.tags?.join(", ") ?? "",
      description: tx.description ?? "",
      categoryId: tx.category?.id ? String(tx.category.id) : "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setNewTx({
      amount: "",
      accountId: "",
      paymentFlowId: null,
      status: "CONFIRMED",
      occurredAt: new Date().toISOString().slice(0, 10),
      scheduledFor: "",
      tags: "",
      description: "",
      categoryId: "",
    });
  }

  // Duplicate detection handlers
  async function handleConfirmDuplicate(matchId: number) {
    if (!pendingTransaction) return;

    try {
      // Enregistrer que c'est un doublon confirmé
      await api(`/finance/duplicates/${matchId}/confirm`, {
        method: "POST",
        body: {
          description: pendingTransaction.description,
          amount: pendingTransaction.amount,
          occurredAt: pendingTransaction.occurredAt,
          accountId: pendingTransaction.accountId,
          similarityScore: duplicateMatches[0]?.similarity_score || 1.0,
        },
      });

      // Fermer modal et réinitialiser formulaire
      setShowDuplicateModal(false);
      setPendingTransaction(null);
      setDuplicateMatches([]);
      setNewTx({
        amount: "",
        accountId: "",
        paymentFlowId: null,
        status: "CONFIRMED",
        occurredAt: new Date().toISOString().slice(0, 10),
        scheduledFor: "",
        tags: "",
        description: "",
        categoryId: "",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la confirmation du doublon."
      );
    }
  }

  async function handleIgnoreDuplicate() {
    if (!pendingTransaction) return;

    try {
      // Enregistrer que l'alerte est ignorée
      if (duplicateMatches.length > 0) {
        await api(`/finance/duplicates/${duplicateMatches[0].transactionId}/ignore`, {
          method: "POST",
          body: {
            description: pendingTransaction.description,
            amount: pendingTransaction.amount,
            occurredAt: pendingTransaction.occurredAt,
            accountId: pendingTransaction.accountId,
            similarityScore: duplicateMatches[0]?.similarity_score || 0.75,
          },
        });
      }

      // Créer la transaction quand même
      await api("/transactions", {
        method: "POST",
        body: pendingTransaction as CreateTransactionRequest,
      });

      // Fermer modal et réinitialiser
      setShowDuplicateModal(false);
      setPendingTransaction(null);
      setDuplicateMatches([]);
      setNewTx({
        amount: "",
        accountId: "",
        paymentFlowId: null,
        status: "CONFIRMED",
        occurredAt: new Date().toISOString().slice(0, 10),
        scheduledFor: "",
        tags: "",
        description: "",
        categoryId: "",
      });

      fetchTransactions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de créer la transaction."
      );
    }
  }

  function handleCancelDuplicate() {
    setShowDuplicateModal(false);
    setPendingTransaction(null);
    setDuplicateMatches([]);
  }

  async function deleteTx(id: number) {
    if (!confirm("Supprimer cette transaction ?")) return;
    setDeletingId(id);
    try {
      await api(`/transactions/${id}`, { method: "DELETE" });
      if (editingId === id) cancelEdit();
      fetchTransactions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de supprimer la transaction."
      );
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
    fetchCategories();
  }, [fetchTransactions, fetchAccounts, fetchCategories]);

  useEffect(() => {
    if (targetId && !editingId && transactions.length > 0) {
      const tx = transactions.find((t) => t.id === targetId);
      if (tx) {
        setEditingId(tx.id);
        setNewTx({
          amount: String(tx.amount),
          accountId: String(tx.accountId),
          paymentFlowId: (tx as Transaction & { paymentFlowId?: number }).paymentFlowId || null,
          status: (tx.status as Transaction["status"]) ?? "CONFIRMED",
          occurredAt: tx.occurredAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
          scheduledFor: tx.scheduledFor ? tx.scheduledFor.slice(0, 10) : "",
          tags: tx.tags?.join(", ") ?? "",
          description: tx.description ?? "",
          categoryId: tx.category?.id ? String(tx.category.id) : "",
        });
      }
    }
  }, [targetId, editingId, transactions]);

  return (
    <div className="space-y-6 text-white">
      {/* Background blur orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[400px] w-[400px] rounded-full bg-purple-500/20 blur-[120px]" />
        <div className={`absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full ${config.bgGradient} blur-[120px]`} />
      </div>

      <div className="relative">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">{config.title}</p>
          <h1 className="bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-3xl font-semibold text-transparent">{config.subtitle}</h1>
          <p className="text-sm text-indigo-100/80">{config.description}</p>
        </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <form
          onSubmit={addTransaction}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-xl"
        >
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Détail</h2>
            <p className="text-sm text-indigo-100/80">Montant, compte et statut opérationnel.</p>
          </div>

          {/* Ligne 1 : Montant / Compte */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-indigo-100" htmlFor="amount">Montant</label>
              <input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                name="amount"
                placeholder={config.amountPlaceholder}
                value={newTx.amount}
                onChange={(e) =>
                  setNewTx({
                    ...newTx,
                    amount: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-indigo-100/60 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-indigo-100" htmlFor="account">Compte</label>
              <select
                id="account"
                name="accountId"
                value={newTx.accountId}
                onChange={(e) =>
                  setNewTx({
                    ...newTx,
                    accountId: e.target.value,
                    paymentFlowId: null, // Reset flux when account changes
                  })
                }
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                required
              >
                <option value="">Sélectionner un compte</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Flux de paiement */}
          <div className="space-y-2">
            <label className="text-sm text-indigo-100">Flux de paiement</label>
            {newTx.accountId ? (
              <PaymentFlowSelector
                accountId={Number(newTx.accountId)}
                value={newTx.paymentFlowId}
                onChange={(flowId) => setNewTx({ ...newTx, paymentFlowId: flowId })}
              />
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-indigo-100/60">
                Sélectionnez un compte pour choisir le flux
              </div>
            )}
            <p className="text-xs text-indigo-100/70">{config.paymentFlowHint}</p>
          </div>

          {/* Ligne 2 : Catégorie / Statut */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-indigo-100" htmlFor="category">Catégorie</label>
              <select
                id="category"
                name="categoryId"
                value={newTx.categoryId}
                onChange={(e) => setNewTx({ ...newTx, categoryId: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              >
                <option value="">Aucune</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-indigo-100" htmlFor="status">Statut</label>
              <select
                id="status"
                name="status"
                value={newTx.status}
                onChange={(e) =>
                  setNewTx({
                    ...newTx,
                    status: e.target.value as typeof newTx.status,
                  })
                }
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value} className="text-slate-900">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ML Category Suggestion */}
          {!editingId && newTx.description && newTx.amount && (
            <CategorySuggestionCard
              description={newTx.description}
              amount={Number(newTx.amount)}
              type={config.type}
              currentCategoryId={newTx.categoryId}
              onAccept={(categoryId, _categoryName) => {
                setNewTx({ ...newTx, categoryId: String(categoryId) });
              }}
              onReject={() => {
                // Just dismissed, no action needed
              }}
            />
          )}

          {/* Ligne 3 : Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-indigo-100" htmlFor="occurredAt">Date effective</label>
              <input
                id="occurredAt"
                type="date"
                name="occurredAt"
                value={newTx.occurredAt}
                onChange={(e) => setNewTx({ ...newTx, occurredAt: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-indigo-100" htmlFor="scheduledFor">Date planifiée</label>
              <input
                id="scheduledFor"
                type="date"
                name="scheduledFor"
                value={newTx.scheduledFor}
                onChange={(e) => setNewTx({ ...newTx, scheduledFor: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                required={newTx.status === "PLANNED" || newTx.status === "SCHEDULED"}
              />
            </div>
          </div>

          {/* Ligne 4 : Tags */}
          <div className="space-y-2">
            <label className="text-sm text-indigo-100" htmlFor="tags">Tags (séparés par des virgules)</label>
            <input
              id="tags"
              type="text"
              name="tags"
              placeholder={config.tagsPlaceholder}
              value={newTx.tags}
              onChange={(e) => setNewTx({ ...newTx, tags: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-indigo-100/60 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            />
            <p className="text-xs text-indigo-100/70">{config.tagsHint}</p>
          </div>

          {/* Ligne 5 : Description */}
          <div className="space-y-2">
            <label className="text-sm text-indigo-100" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder={config.descriptionPlaceholder}
              value={newTx.description}
              onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-indigo-100/60 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            />
            <p className="text-xs text-indigo-100/70">Facultatif : note de contexte affichée dans la liste.</p>
          </div>

          <button
            type="submit"
            className={`w-full rounded-xl bg-gradient-to-r ${config.buttonGradient} px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:${config.buttonGradientHover} disabled:opacity-60`}
            disabled={loading}
          >
            {editingId ? (loading ? "Mise à jour..." : "Mettre à jour") : loading ? "Création..." : config.addButtonText}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="w-full rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-indigo-50 transition hover:border-white/40"
              disabled={loading}
            >
              Annuler l'édition
            </button>
          )}

          {error && (
            <div className="rounded-lg border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}
        </form>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{config.historyTitle}</h2>
              <p className="text-sm text-indigo-100/80">{config.historySubtitle}</p>
            </div>
          </div>

          <div className="space-y-3">
            {loading && (
              <div className="rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-indigo-100/80">
                {config.loadingText}
              </div>
            )}

            {!loading &&
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-start justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3"
                >
                  <div className="space-y-1">
                    <div className="font-medium">
                      {tx.account?.name || `Compte #${tx.accountId}`}
                    </div>
                    <div className="text-xs text-indigo-100/70">
                      {new Date(tx.occurredAt).toLocaleDateString("fr-FR")}
                    </div>
                    {tx.scheduledFor && (
                      <div className="text-xs text-indigo-100/70">Prévu le {new Date(tx.scheduledFor).toLocaleDateString("fr-FR")}</div>
                    )}
                    {tx.category && (
                      <div className="text-[11px] inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-indigo-50">
                        {tx.category.name}
                      </div>
                    )}
                    {tx.status && (
                      <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                        {statusOptions.find((s) => s.value === tx.status)?.label || tx.status}
                      </span>
                    )}
                    {tx.tags && tx.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {tx.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-indigo-100"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {tx.description && (
                      <p className="text-sm text-indigo-50/80 whitespace-pre-wrap">
                        {tx.description}
                      </p>
                    )}
                  </div>
                  <div className={`${config.amountColor} font-semibold text-right`}>
                    {config.amountPrefix}{tx.amount} {currency}
                    <div className="mt-2 flex flex-wrap justify-end gap-2 text-xs">
                      <button
                        onClick={() => startEdit(tx)}
                        className="rounded-lg border border-white/20 px-3 py-1 text-indigo-50 hover:border-white/40"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => deleteTx(tx.id)}
                        className="rounded-lg border border-red-300/40 px-3 py-1 text-red-100 hover:border-red-300/70 disabled:opacity-60"
                        disabled={deletingId === tx.id}
                      >
                        {deletingId === tx.id ? "Suppression..." : "Supprimer"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {!loading && transactions.length === 0 && (
              <div className="rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-indigo-100/80">
                {config.emptyText}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Duplicate Confirmation Modal */}
      <DuplicateConfirmModal
        isOpen={showDuplicateModal}
        matches={duplicateMatches}
        newTransaction={{
          description: pendingTransaction?.description || "",
          amount: pendingTransaction?.amount || 0,
          date: pendingTransaction?.occurredAt || "",
        }}
        onConfirmDuplicate={handleConfirmDuplicate}
        onIgnore={handleIgnoreDuplicate}
        onCancel={handleCancelDuplicate}
      />
    </div>
  );
}
