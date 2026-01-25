

import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/finance/compat/routes";
import { useEffect, useState, useMemo, useCallback } from "react";
import { api } from "@/lib/finance/api";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { GlassCard, GlassPanel, GlassButton, GlassBadge } from "@/components/ui/glass";
import {
  Search,
  X,
  Trash2,
  Pencil,
  TrendingUp,
  TrendingDown,
  Archive,
  DollarSign,
  CreditCard,
  Wallet,
  Filter,
  ChevronDown,
  Plus,
  Clock,
} from "lucide-react";

// Types
type PaymentFlow =
  | "virement"
  | "carte"
  | "especes"
  | "cheque"
  | "prelevement"
  | "virement_bancaire"
  | "wire_transfer";

type Transaction = {
  id: number;
  type: "credit" | "debit";
  description: string;
  tags?: string[];
  accountName?: string;
  categoryName?: string;
  paymentFlow?: PaymentFlow;
  amount: number;
  date: string;
  status?: "PENDING" | "CONFIRMED" | "CANCELLED";
};

type Category = {
  id: number;
  name: string;
};

const FLOW_ICONS: Record<PaymentFlow, any> = {
  virement: DollarSign,
  carte: CreditCard,
  especes: Wallet,
  cheque: DollarSign,
  prelevement: CreditCard,
  virement_bancaire: DollarSign,
  wire_transfer: DollarSign,
};

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "En attente",
    className: "bg-amber-500/20 text-amber-100 border-amber-400/30",
  },
  CANCELLED: {
    label: "Annulé",
    className: "bg-red-500/20 text-red-100 border-red-400/30",
  },
};

// Configuration interface
interface TransactionListConfig {
  type: "expense" | "income";
  transactionType: "debit" | "credit";
  categoryKind: "EXPENSE" | "INCOME";
  pageTitle: string;
  pageSubtitle: string;
  deletionConfirm: string;
  searchPlaceholder: string;
  statusConfirmedLabel: string;
  emptyMessage: string;
  addButtonLabel: string;
  color: "rose" | "emerald";
  icon: typeof TrendingDown | typeof TrendingUp;
  totalIcon: typeof Archive | typeof Wallet;
  amountPrefix: string;
  newRoute: string;
  dataGuide: string;
}

const CONFIGS: Record<"expense" | "income", TransactionListConfig> = {
  expense: {
    type: "expense",
    transactionType: "debit",
    categoryKind: "EXPENSE",
    pageTitle: "Dépenses",
    pageSubtitle: "Suivez et gérez toutes vos dépenses",
    deletionConfirm: "Supprimer cette dépense ?",
    searchPlaceholder: "Rechercher une dépense...",
    statusConfirmedLabel: "Effectué",
    emptyMessage: "Aucune dépense trouvée",
    addButtonLabel: "Nouvelle dépense",
    color: "rose",
    icon: TrendingDown,
    totalIcon: Archive,
    amountPrefix: "-",
    newRoute: ROUTES.FINANCE.DASHBOARD.EXPENSES.NEW,
    dataGuide: "expense",
  },
  income: {
    type: "income",
    transactionType: "credit",
    categoryKind: "INCOME",
    pageTitle: "Revenus",
    pageSubtitle: "Suivez et gérez tous vos revenus",
    deletionConfirm: "Supprimer ce revenu ?",
    searchPlaceholder: "Rechercher un revenu...",
    statusConfirmedLabel: "Reçu",
    emptyMessage: "Aucun revenu trouvé",
    addButtonLabel: "Nouveau revenu",
    color: "emerald",
    icon: TrendingUp,
    totalIcon: Wallet,
    amountPrefix: "+",
    newRoute: ROUTES.FINANCE.DASHBOARD.INCOMES.NEW,
    dataGuide: "income",
  },
};

interface TransactionListPageProps {
  type: "expense" | "income";
}

export function TransactionListPage({ type }: TransactionListPageProps) {
  useRequireAuth();
  const { currency, formatAmount } = useCurrency();
  const config = CONFIGS[type];

  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [txData, catData] = await Promise.all([
        api("/transactions") as Promise<Transaction[]>,
        api(`/categories?kind=${config.categoryKind}`) as Promise<Category[]>,
      ]);
      setTransactions(txData);
      setCategories(catData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [config.categoryKind]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const stats = useMemo(() => {
    const filtered = transactions.filter((tx) => tx.type === config.transactionType);
    const pending = filtered.filter((tx) => tx.status === "PENDING");
    const confirmed = filtered.filter((tx) => tx.status === "CONFIRMED");
    const total = filtered.reduce((sum, tx) => sum + tx.amount, 0);
    return { total: filtered.length, pending: pending.length, confirmed: confirmed.length, amount: total };
  }, [transactions, config.transactionType]);

  // Filtered transactions
  const filtered = useMemo(() => {
    let result = transactions.filter((tx) => tx.type === config.transactionType);

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.description.toLowerCase().includes(q) ||
          tx.accountName?.toLowerCase().includes(q) ||
          tx.categoryName?.toLowerCase().includes(q) ||
          tx.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((tx) => tx.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      result = result.filter((tx) => tx.categoryName === categoryFilter);
    }

    if (dateFrom) {
      result = result.filter((tx) => new Date(tx.date) >= new Date(dateFrom));
    }

    if (dateTo) {
      result = result.filter((tx) => new Date(tx.date) <= new Date(dateTo));
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, config.transactionType, search, statusFilter, categoryFilter, dateFrom, dateTo]);

  // Actions
  async function deleteTx(id: number) {
    if (!confirm(config.deletionConfirm)) return;
    setDeletingId(id);
    try {
      await api(`/transactions/${id}`, { method: "DELETE" });
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setDeletingId(null);
    }
  }

  async function archiveSelected() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Archiver ${selectedIds.length} ${type === "expense" ? "dépense(s)" : "revenu(s)"} ?`)) return;
    try {
      await Promise.all(selectedIds.map((id) => api(`/transactions/${id}`, { method: "DELETE" })));
      setSelectedIds([]);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleSelectAll() {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((tx) => tx.id));
    }
  }

  const Icon = config.icon;
  const TotalIcon = config.totalIcon;
  const colorClass = config.color === "rose" ? "rose" : "emerald";
  const gradientClass = config.color === "rose" ? "to-rose-200" : "to-emerald-200";
  const bgGradient = config.color === "rose" ? "bg-rose-500/20" : "bg-emerald-500/20";
  const textColor = config.color === "rose" ? "text-rose-400" : "text-emerald-400";
  const borderColor = config.color === "rose" ? "border-rose-400/30" : "border-emerald-400/30";
  const focusColor = config.color === "rose" ? "rose-400" : "emerald-400";

  return (
    <div className="relative min-h-screen text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className={`absolute -left-40 top-0 h-[500px] w-[500px] rounded-full ${bgGradient} blur-[120px]`} />
        <div className="absolute -right-40 top-1/3 h-[400px] w-[400px] rounded-full bg-indigo-500/20 blur-[120px]" />
      </div>

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className={`text-xs uppercase tracking-[0.25em] ${gradientClass} bg-gradient-to-r from-white bg-clip-text text-transparent`}>
              Gestion
            </p>
            <h1 className={`bg-gradient-to-r from-white via-indigo-100 ${gradientClass} bg-clip-text text-2xl md:text-3xl font-semibold text-transparent`}>
              {config.pageTitle}
            </h1>
            <p className="text-sm text-indigo-100/80">{config.pageSubtitle}</p>
          </div>

          <Link to={config.newRoute} data-guide={`add-${config.dataGuide}`}>
            <GlassButton variant="primary" accentColor={colorClass} className="w-full md:w-auto">
              <Plus size={18} />
              <span className="hidden md:inline">{config.addButtonLabel}</span>
              <span className="md:hidden">Ajouter</span>
            </GlassButton>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3" data-guide={`${config.dataGuide}-stats`}>
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-100/80">Total</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
              <Icon size={24} className={textColor} />
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-100/80">En attente</p>
                <p className="text-2xl font-semibold">{stats.pending}</p>
              </div>
              <Clock size={24} className="text-amber-400" />
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-100/80">Montant total</p>
                <p className={`text-2xl font-semibold ${textColor}`}>{formatAmount(stats.amount)}</p>
              </div>
              <TotalIcon size={24} className={textColor} />
            </div>
          </GlassCard>
        </div>

        {/* Filters */}
        <GlassPanel gradient="indigo" className="p-4" data-guide={`${config.dataGuide}-filters`}>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-indigo-100/60" />
              <input
                type="text"
                placeholder={config.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full rounded-xl border border-white/15 bg-white/10 py-3 pl-11 pr-4 text-white placeholder:text-indigo-100/60 focus:border-${focusColor} focus:outline-none focus:ring-2 focus:ring-${focusColor}/40`}
              />
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-indigo-200 hover:text-white transition"
            >
              <Filter size={16} />
              {showFilters ? "Masquer" : "Afficher"} les filtres
              <ChevronDown size={16} className={`transition ${showFilters ? "rotate-180" : ""}`} />
            </button>

            {showFilters && (
              <div className="grid gap-4 md:grid-cols-3">
                {/* Status */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-${focusColor} focus:outline-none focus:ring-2 focus:ring-${focusColor}/40`}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="PENDING">En attente</option>
                  <option value="CONFIRMED">{config.statusConfirmedLabel}</option>
                  <option value="CANCELLED">Annulés</option>
                </select>

                {/* Category */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={`rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-${focusColor} focus:outline-none focus:ring-2 focus:ring-${focusColor}/40`}
                >
                  <option value="all">Toutes les catégories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                {/* Dates */}
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className={`flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-${focusColor} focus:outline-none focus:ring-2 focus:ring-${focusColor}/40`}
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className={`flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-${focusColor} focus:outline-none focus:ring-2 focus:ring-${focusColor}/40`}
                  />
                </div>
              </div>
            )}
          </div>
        </GlassPanel>

        {/* Table */}
        <GlassPanel gradient="indigo" className="p-6" data-guide={`${config.dataGuide}s-list`}>
          {loading && <p className="text-center text-indigo-100/80">Chargement...</p>}
          {error && <p className="text-center text-red-400">{error}</p>}

          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <Icon size={48} className="text-indigo-100/40" />
              <p className="text-indigo-100/60">{config.emptyMessage}</p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="pb-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === filtered.length}
                          onChange={toggleSelectAll}
                          className={`h-4 w-4 rounded border-white/20 bg-white/10 text-${colorClass}-500 focus:ring-2 focus:ring-${focusColor}/40`}
                        />
                      </th>
                      <th className="pb-3 text-left text-sm font-medium text-indigo-100">Date</th>
                      <th className="pb-3 text-left text-sm font-medium text-indigo-100">Description</th>
                      <th className="pb-3 text-left text-sm font-medium text-indigo-100">Compte</th>
                      <th className="pb-3 text-left text-sm font-medium text-indigo-100">Catégorie</th>
                      <th className="pb-3 text-left text-sm font-medium text-indigo-100">Statut</th>
                      <th className="pb-3 text-right text-sm font-medium text-indigo-100">Montant</th>
                      <th className="pb-3 text-right text-sm font-medium text-indigo-100">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((tx) => {
                      const FlowIcon = tx.paymentFlow ? FLOW_ICONS[tx.paymentFlow] : null;
                      const statusCfg = tx.status === "CONFIRMED"
                        ? { label: config.statusConfirmedLabel, className: `bg-${colorClass}-500/20 text-${colorClass}-100 border-${colorClass}-400/30` }
                        : (statusConfig[tx.status || ""] || {});

                      return (
                        <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="py-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(tx.id)}
                              onChange={() => toggleSelect(tx.id)}
                              className={`h-4 w-4 rounded border-white/20 bg-white/10 text-${colorClass}-500 focus:ring-2 focus:ring-${focusColor}/40`}
                            />
                          </td>
                          <td className="py-3 text-sm text-indigo-100">
                            {new Date(tx.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                          <td className="py-3">
                            <div>
                              <p className="text-sm font-medium text-white">{tx.description}</p>
                              {tx.tags && tx.tags.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {tx.tags.map((tag, i) => (
                                    <span key={i} className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-indigo-100/80">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              {FlowIcon && <FlowIcon size={14} className="text-indigo-100/60" />}
                              <span className="text-sm text-indigo-100">{tx.accountName || "—"}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            {tx.categoryName && (
                              <GlassBadge variant="subtle" className="text-xs">
                                {tx.categoryName}
                              </GlassBadge>
                            )}
                          </td>
                          <td className="py-3">
                            {statusCfg.label && (
                              <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${statusCfg.className}`}>
                                {statusCfg.label}
                              </span>
                            )}
                          </td>
                          <td className={`py-3 text-right text-sm font-semibold ${textColor}`}>
                            {config.amountPrefix}{formatAmount(tx.amount)}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`${config.newRoute}?id=${tx.id}`}
                                className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition"
                              >
                                <Pencil size={14} />
                              </Link>
                              <button
                                onClick={() => deleteTx(tx.id)}
                                disabled={deletingId === tx.id}
                                className="rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-red-500/20 hover:border-red-400/30 transition disabled:opacity-50"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className="md:hidden space-y-3">
                {filtered.map((tx) => {
                  const statusCfg = tx.status === "CONFIRMED"
                    ? { label: config.statusConfirmedLabel, className: `bg-${colorClass}-500/20 text-${colorClass}-100 border-${colorClass}-400/30` }
                    : (statusConfig[tx.status || ""] || {});

                  return (
                    <GlassCard key={tx.id} variant="subtle" className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(tx.id)}
                          onChange={() => toggleSelect(tx.id)}
                          className={`mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-${colorClass}-500 focus:ring-2 focus:ring-${focusColor}/40`}
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-white">{tx.description}</p>
                              <p className="text-xs text-indigo-100/60">
                                {new Date(tx.date).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                            <p className={`text-lg font-semibold ${textColor}`}>
                              {config.amountPrefix}{formatAmount(tx.amount)}
                            </p>
                          </div>

                          {tx.categoryName && (
                            <div className="mt-2">
                              <GlassBadge variant="subtle" className="text-xs">
                                {tx.categoryName}
                              </GlassBadge>
                            </div>
                          )}

                          {statusCfg.label && (
                            <div className="mt-2">
                              <span className={`inline-flex rounded-full border px-3 py-1 text-xs ${statusCfg.className}`}>
                                {statusCfg.label}
                              </span>
                            </div>
                          )}

                          <div className="mt-3 flex gap-2">
                            <Link
                              href={`${config.newRoute}?id=${tx.id}`}
                              className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-center text-sm hover:bg-white/10 transition"
                            >
                              Modifier
                            </Link>
                            <button
                              onClick={() => deleteTx(tx.id)}
                              disabled={deletingId === tx.id}
                              className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-sm hover:bg-red-500/20 hover:border-red-400/30 transition disabled:opacity-50"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                <p className="text-sm text-indigo-100/80">
                  {filtered.length} {type === "expense" ? "dépense(s)" : "revenu(s)"} affichée(s)
                </p>
                {selectedIds.length > 0 && (
                  <GlassButton onClick={archiveSelected} variant="secondary" size="sm">
                    <Archive size={16} />
                    Archiver ({selectedIds.length})
                  </GlassButton>
                )}
              </div>
            </>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}
