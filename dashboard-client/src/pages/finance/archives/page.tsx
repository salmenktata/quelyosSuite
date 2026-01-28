/**
 * Page Archives Finance
 *
 * Fonctionnalités :
 * - Liste des transactions archivées (exclues des calculs actifs)
 * - Filtres par type (dépense/revenu) et statut (Prévu, Programmé, Fait, Annulé)
 * - Recherche en texte libre (description, tag, nom de compte)
 * - Sélection multiple avec restauration groupée
 * - Suppression définitive groupée (irréversible)
 * - Affichage complet : compte, montant, date, statut, description
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Breadcrumbs, PageNotice, SkeletonTable, Button } from "@/components/common";
import { financeNotices } from "@/lib/notices/finance-notices";
import { ROUTES } from "@/lib/finance/compat/routes";
import { api } from "@/lib/finance/api";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { ArrowUpRight, Trash2, Undo2, Archive as ArchiveIcon } from "lucide-react";
import type { BulkDeleteRequest } from "@/types/api";

const statusLabels: Record<string, string> = {
  PLANNED: "Prévu",
  SCHEDULED: "Programmé",
  CONFIRMED: "Fait",
  CANCELED: "Annulé",
};

const statusOptions = [
  { value: "PLANNED", label: "Prévu" },
  { value: "SCHEDULED", label: "Programmé" },
  { value: "CONFIRMED", label: "Fait" },
  { value: "CANCELED", label: "Annulé" },
];

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
};

export default function ArchivesPage() {
  useRequireAuth();
  const { currency } = useCurrency();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [typeFilter, setTypeFilter] = useState<"ALL" | "credit" | "debit">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Transaction["status"]>("ALL");
  const [search, setSearch] = useState("");

  async function fetchArchives() {
    try {
      setError(null);
      setLoading(true);
      const data = await api("/transactions?archived=true");
      setTransactions(Array.isArray(data) ? data : []);
      setSelectedIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement des archives.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchArchives();
  }, []);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== "ALL" && tx.type !== typeFilter) return false;
      if (statusFilter !== "ALL" && tx.status !== statusFilter) return false;
      if (search.trim()) {
        const haystack = `${tx.description || ""} ${tx.tags?.join(" ") || ""} ${tx.account?.name || ""}`.toLowerCase();
        if (!haystack.includes(search.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, statusFilter, search]);

  function toggleSelect(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleSelectAll() {
    const ids = filtered.map((tx) => tx.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : ids);
  }

  async function unarchiveSelected() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Restaurer ${selectedIds.length} ligne(s) ?`)) return;
    try {
      await api("/transactions/unarchive", {
        method: "POST",
        body: { ids: selectedIds } as BulkDeleteRequest,
      });
      setSelectedIds([]);
      fetchArchives();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de désarchiver");
    }
  }

  async function deleteSelected() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Supprimer définitivement ${selectedIds.length} ligne(s) ?`)) return;
    try {
      await api("/transactions/bulk-delete", {
        method: "POST",
        body: { ids: selectedIds } as BulkDeleteRequest,
      });
      setSelectedIds([]);
      fetchArchives();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de supprimer");
    }
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs items={[
          { label: "Finance", href: "/finance" },
          { label: "Archives" }
        ]} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-gray-100 dark:bg-gray-700 p-3">
              <ArchiveIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Transactions archivées
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Consultation des lignes masquées (hors calculs)
              </p>
            </div>
          </div>
          <Link to={ROUTES.FINANCE.DASHBOARD.HOME}>
            <Button
              variant="secondary"
              icon={<ArrowUpRight size={16} />}
            >
              Retour dashboard
            </Button>
          </Link>
        </div>

        <PageNotice config={financeNotices.archives} className="mb-6" />

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4" role="alert">
            <p className="text-red-900 dark:text-red-100 mb-2">{error}</p>
            <Button onClick={fetchArchives} variant="secondary" size="sm">
              Réessayer
            </Button>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 grid gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Type</p>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">Tous</option>
              <option value="debit">Dépenses</option>
              <option value="credit">Revenus</option>
            </select>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Statut</p>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">Tous</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Recherche</p>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Description, tag, compte"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-900 dark:text-white">Archives</span>
              <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">{filtered.length} lignes</span>
              {selectedIds.length > 0 && (
                <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                  {selectedIds.length} sélectionnées
                </span>
              )}
            </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={unarchiveSelected}
              disabled={selectedIds.length === 0}
              variant="secondary"
              size="sm"
              icon={<Undo2 size={14} />}
              className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
            >
              Restaurer
            </Button>
            <Button
              onClick={deleteSelected}
              disabled={selectedIds.length === 0}
              variant="danger"
              size="sm"
              icon={<Trash2 size={14} />}
            >
              Supprimer
            </Button>
          </div>
        </div>

        {loading ? (
          <SkeletonTable rows={5} columns={7} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      aria-label="Tout sélectionner"
                      checked={filtered.length > 0 && filtered.every((tx) => selectedIds.includes(tx.id))}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Compte</th>
                  <th className="px-4 py-3 text-left">Montant</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                      Aucune transaction archivée.
                    </td>
                  </tr>
                )}

                {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 align-top">
                    <input
                      type="checkbox"
                      aria-label="Sélectionner la transaction"
                      checked={selectedIds.includes(tx.id)}
                      onChange={() => toggleSelect(tx.id)}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-600"
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      tx.type === "debit" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                    }`}>
                      {tx.type === "debit" ? "Dépense" : "Revenu"}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-gray-900 dark:text-white">{tx.account?.name || `Compte #${tx.accountId}`}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">ID {tx.accountId}</div>
                  </td>
                  <td className={`px-4 py-3 align-top font-semibold ${tx.type === "debit" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {tx.type === "debit" ? "-" : "+"}{tx.amount} {currency}
                  </td>
                  <td className="px-4 py-3 align-top text-gray-600 dark:text-gray-400">
                    {new Date(tx.occurredAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {tx.status ? (
                      <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                        {statusLabels[tx.status] || tx.status}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-w-xs">
                    {tx.description || ""}
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </Layout>
  );
}
