

import React, { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/finance/api";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { DuplicateConfirmModal } from "./DuplicateConfirmModal";
import { TransactionFormFields, TransactionListItem } from './TransactionFormPage/index'
import type { CreateTransactionRequest } from "@/types/api";
import { logger } from '@quelyos/logger';
import {
  transactionFormReducer,
  initialTransactionFormState,
  type TransactionFormData,
  type DuplicateMatch,
} from './transactionFormReducer'
import { validateTransactionForm, prepareTransactionPayload } from './transactionFormValidation'

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
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Consolidation des états du formulaire via useReducer
  const [state, dispatch] = useReducer(transactionFormReducer, initialTransactionFormState);

  const fetchTransactions = useCallback(async () => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_LOADING', payload: true });
      const data = await api("/transactions?archived=false");
      setTransactions(
        Array.isArray(data)
          ? data.filter((tx: Transaction) => tx.type === config.type)
          : []
      );
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : "Erreur de chargement des transactions.",
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [config.type]);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await api("/accounts");
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : "Erreur de chargement des comptes.",
      });
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await api(`/categories?kind=${config.categoryKind}`);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : "Erreur de chargement des catégories.",
      });
    }
  }, [config.categoryKind]);

  async function addTransaction(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Validation
      const validation = validateTransactionForm(state.formData);
      if (!validation.isValid) {
        dispatch({ type: 'SET_ERROR', payload: validation.error || 'Validation error' });
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      const description = state.formData.description.trim();
      const basePayload = prepareTransactionPayload(state.formData);
      const payload = {
        ...basePayload,
        type: config.type,
      };

      if (state.editingId) {
        await api(`/transactions/${state.editingId}`, {
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
            }) as { is_likely_duplicate: boolean; matches: DuplicateMatch[] };

            // Si doublon détecté (similarité >= 75%), afficher modal
            if (duplicateCheck.is_likely_duplicate && duplicateCheck.matches.length > 0) {
              dispatch({
                type: 'SHOW_DUPLICATE_MODAL',
                payload: {
                  matches: duplicateCheck.matches,
                  pendingTransaction: payload,
                },
              });
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

      dispatch({ type: 'RESET_FORM_DATA' });
      fetchTransactions();
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : "Impossible d'ajouter la transaction.",
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  function startEdit(tx: Transaction) {
    dispatch({
      type: 'SET_FORM_FOR_EDIT',
      payload: {
        amount: String(tx.amount),
        accountId: String(tx.accountId),
        paymentFlowId: (tx as Transaction & { paymentFlowId?: number }).paymentFlowId || null,
        status: (tx.status as TransactionFormData['status']) ?? "CONFIRMED",
        occurredAt: tx.occurredAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        scheduledFor: tx.scheduledFor ? tx.scheduledFor.slice(0, 10) : "",
        tags: tx.tags?.join(", ") ?? "",
        description: tx.description ?? "",
        categoryId: tx.category?.id ? String(tx.category.id) : "",
        editingId: tx.id,
      },
    });
  }

  function cancelEdit() {
    dispatch({ type: 'RESET_FORM_DATA' });
  }

  // Duplicate detection handlers
  async function handleConfirmDuplicate(matchId: number) {
    if (!state.pendingTransaction) return;

    try {
      const pending = state.pendingTransaction as {
        description?: string
        amount: number
        occurredAt: string
        accountId: number
      };
      const matches: DuplicateMatch[] = state.duplicateMatches;

      // Enregistrer que c'est un doublon confirmé
      await api(`/finance/duplicates/${matchId}/confirm`, {
        method: "POST",
        body: {
          description: pending.description,
          amount: pending.amount,
          occurredAt: pending.occurredAt,
          accountId: pending.accountId,
          similarityScore: matches[0]?.similarity_score || 1.0,
        },
      });

      dispatch({ type: 'CONFIRM_DUPLICATE' });
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : "Erreur lors de la confirmation du doublon.",
      });
    }
  }

  async function handleIgnoreDuplicate() {
    if (!state.pendingTransaction) return;

    try {
      const pending = state.pendingTransaction as {
        description?: string
        amount: number
        occurredAt: string
        accountId: number
      };
      const matches: DuplicateMatch[] = state.duplicateMatches;

      // Enregistrer que l'alerte est ignorée
      if (matches.length > 0) {
        await api(`/finance/duplicates/${matches[0].transactionId}/ignore`, {
          method: "POST",
          body: {
            description: pending.description,
            amount: pending.amount,
            occurredAt: pending.occurredAt,
            accountId: pending.accountId,
            similarityScore: matches[0]?.similarity_score || 0.75,
          },
        });
      }

      // Créer la transaction quand même
      await api("/transactions", {
        method: "POST",
        body: state.pendingTransaction as CreateTransactionRequest,
      });

      dispatch({ type: 'IGNORE_DUPLICATE' });
      fetchTransactions();
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : "Impossible de créer la transaction.",
      });
    }
  }

  function handleCancelDuplicate() {
    dispatch({ type: 'HIDE_DUPLICATE_MODAL' });
  }

  async function deleteTx(id: number) {
    if (!confirm("Supprimer cette transaction ?")) return;
    setDeletingId(id);
    try {
      await api(`/transactions/${id}`, { method: "DELETE" });
      if (state.editingId === id) cancelEdit();
      fetchTransactions();
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : "Impossible de supprimer la transaction.",
      });
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
    if (targetId && !state.editingId && transactions.length > 0) {
      const tx = transactions.find((t) => t.id === targetId);
      if (tx) {
        startEdit(tx);
      }
    }
  }, [targetId, state.editingId, transactions]);

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
        <TransactionFormFields
          formData={state.formData}
          accounts={accounts}
          categories={categories}
          config={config}
          statusOptions={statusOptions}
          editingId={state.editingId}
          loading={state.loading}
          onFormChange={(data) => dispatch({ type: 'SET_FORM_DATA', payload: data })}
          onSubmit={addTransaction}
          onCancelEdit={cancelEdit}
          error={state.error}
        />

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{config.historyTitle}</h2>
              <p className="text-sm text-indigo-100/80">{config.historySubtitle}</p>
            </div>
          </div>

          <div className="space-y-3">
            {state.loading && (
              <div className="rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-indigo-100/80">
                {config.loadingText}
              </div>
            )}

            {!state.loading &&
              transactions.map((tx) => (
                <TransactionListItem
                  key={tx.id}
                  transaction={tx}
                  config={config}
                  currency={currency}
                  statusOptions={statusOptions}
                  deletingId={deletingId}
                  onEdit={startEdit}
                  onDelete={deleteTx}
                />
              ))}

            {!state.loading && transactions.length === 0 && (
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
        isOpen={state.showDuplicateModal}
        matches={state.duplicateMatches}
        newTransaction={{
          description: (state.pendingTransaction as { description?: string })?.description || "",
          amount: (state.pendingTransaction as { amount?: number })?.amount || 0,
          date: (state.pendingTransaction as { occurredAt?: string })?.occurredAt || "",
        }}
        onConfirmDuplicate={handleConfirmDuplicate}
        onIgnore={handleIgnoreDuplicate}
        onCancel={handleCancelDuplicate}
      />
    </div>
  );
}
