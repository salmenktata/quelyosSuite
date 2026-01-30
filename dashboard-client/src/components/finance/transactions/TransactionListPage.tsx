import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/finance/compat/routes";
import { useEffect, useState, useMemo, useCallback } from "react";
import { ModularLayout } from "@/components/ModularLayout";
import { api } from "@/lib/finance/api";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { PageHeader } from "@/components/finance/PageHeader";
import { Button } from "@/components/ui/button";
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
  const { _currency, formatAmount } = useCurrency();
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
        api(`/finance/categories?kind=${config.categoryKind}`) as Promise<Category[]>,
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
  const _colorClass = config.color === "rose" ? "rose" : "emerald";
  const _gradientClass = config.color === "rose" ? "to-rose-200" : "to-emerald-200";
  const _bgGradient = config.color === "rose" ? "bg-rose-500/20" : "bg-emerald-500/20";
  const _textColor = config.color === "rose" ? "text-rose-400" : "text-emerald-400";
  const _borderColor = config.color === "rose" ? "border-rose-400/30" : "border-emerald-400/30";
  const _focusColor = config.color === "rose" ? "rose-400" : "emerald-400";

  return (
    <ModularLayout>
      <div className="p-8 space-y-6">
        <PageHeader
          icon={Icon}
          title={config.pageTitle}
          description={config.pageSubtitle}
          breadcrumbs={[
            { label: "Finance", href: "/finance" },
            { label: config.pageTitle },
          ]}
          actions={
            <Link to={config.newRoute} data-guide={`add-${config.dataGuide}`}>
              <Button
                variant="primary"
                className={`gap-2 ${type === "expense" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                <Plus className="h-5 w-5" />
                {config.addButtonLabel}
              </Button>
            </Link>
          }
        />

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3" data-guide={`${config.dataGuide}-stats`}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <Icon className={`h-6 w-6 ${type === "expense" ? "text-rose-500" : "text-emerald-500"}`} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">En attente</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.pending}</p>
              </div>
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Montant total</p>
                <p className={`text-2xl font-semibold ${type === "expense" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>{formatAmount(stats.amount)}</p>
              </div>
              <TotalIcon className={`h-6 w-6 ${type === "expense" ? "text-rose-500" : "text-emerald-500"}`} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4" data-guide={`${config.dataGuide}-filters`}>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={config.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 pl-11 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? "Masquer" : "Afficher"} les filtres
              <ChevronDown className={`h-4 w-4 transition ${showFilters ? "rotate-180" : ""}`} />
            </button>

            {showFilters && (
              <div className="grid gap-4 md:grid-cols-3">
                {/* Status */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden" data-guide={`${config.dataGuide}s-list`}>
          {loading && <p className="text-center text-gray-500 dark:text-gray-400 py-8">Chargement...</p>}
          {error && <p className="text-center text-red-600 dark:text-red-400 py-8">{error}</p>}

          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <Icon className="h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">{config.emptyMessage}</p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === filtered.length}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-600"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Compte</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Catégorie</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Statut</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Montant</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filtered.map((tx) => {
                      const FlowIcon = tx.paymentFlow ? FLOW_ICONS[tx.paymentFlow] : null;
                      const statusCfg = tx.status === "CONFIRMED"
                        ? { label: config.statusConfirmedLabel, className: type === "expense" ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" }
                        : tx.status === "PENDING"
                        ? { label: "En attente", className: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" }
                        : tx.status === "CANCELLED"
                        ? { label: "Annulé", className: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400" }
                        : {};

                      return (
                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(tx.id)}
                              onChange={() => toggleSelect(tx.id)}
                              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-600"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {new Date(tx.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{tx.description}</p>
                              {tx.tags && tx.tags.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {tx.tags.map((tag, i) => (
                                    <span key={i} className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {FlowIcon && <FlowIcon className="h-3.5 w-3.5 text-gray-400" />}
                              <span className="text-sm text-gray-600 dark:text-gray-400">{tx.accountName || "—"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {tx.categoryName && (
                              <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                                {tx.categoryName}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {statusCfg.label && (
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.className}`}>
                                {statusCfg.label}
                              </span>
                            )}
                          </td>
                          <td className={`px-4 py-3 text-right text-sm font-semibold ${type === "expense" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                            {config.amountPrefix}{formatAmount(tx.amount)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`${config.newRoute}?id=${tx.id}`}
                                className="rounded-lg border border-gray-300 dark:border-gray-600 p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Link>
                              <button
                                onClick={() => deleteTx(tx.id)}
                                disabled={deletingId === tx.id}
                                className="rounded-lg border border-red-300 dark:border-red-700 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition disabled:opacity-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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
              <div className="md:hidden space-y-3 p-4">
                {filtered.map((tx) => {
                  const statusCfg = tx.status === "CONFIRMED"
                    ? { label: config.statusConfirmedLabel, className: type === "expense" ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" }
                    : tx.status === "PENDING"
                    ? { label: "En attente", className: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" }
                    : tx.status === "CANCELLED"
                    ? { label: "Annulé", className: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400" }
                    : {};

                  return (
                    <div key={tx.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(tx.id)}
                          onChange={() => toggleSelect(tx.id)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{tx.description}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(tx.date).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                            <p className={`text-lg font-semibold ${type === "expense" ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                              {config.amountPrefix}{formatAmount(tx.amount)}
                            </p>
                          </div>

                          {tx.categoryName && (
                            <div className="mt-2">
                              <span className="rounded-full bg-gray-200 dark:bg-gray-600 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                                {tx.categoryName}
                              </span>
                            </div>
                          )}

                          {statusCfg.label && (
                            <div className="mt-2">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.className}`}>
                                {statusCfg.label}
                              </span>
                            </div>
                          )}

                          <div className="mt-3 flex gap-2">
                            <Link
                              to={`${config.newRoute}?id=${tx.id}`}
                              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 text-center text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                            >
                              Modifier
                            </Link>
                            <button
                              onClick={() => deleteTx(tx.id)}
                              disabled={deletingId === tx.id}
                              className="flex-1 rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-gray-800 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition disabled:opacity-50"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-4 pb-4 md:px-6 md:pb-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filtered.length} {type === "expense" ? "dépense(s)" : "revenu(s)"} affichée(s)
                </p>
                {selectedIds.length > 0 && (
                  <button onClick={archiveSelected} className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Archive className="h-4 w-4" />
                    Archiver ({selectedIds.length})
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </ModularLayout>
  );
}
