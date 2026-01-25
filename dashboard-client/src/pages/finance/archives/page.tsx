

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/finance/compat/routes";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { GlassCard, GlassPanel, GlassBadge, GlassListItem } from "@/components/ui/glass";
import { ArrowUpRight, Loader2, Trash2, Undo2 } from "lucide-react";
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
    <div className="relative min-h-screen text-white">
      {/* Background blur orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[400px] w-[400px] rounded-full bg-purple-500/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-amber-500/20 blur-[120px]" />
      </div>

      <div className="relative space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Archives</p>
            <h1 className="bg-gradient-to-r from-white via-indigo-100 to-amber-200 bg-clip-text text-3xl font-semibold text-transparent">
              Transactions archivées
            </h1>
            <p className="text-sm text-indigo-100/80">Consultation des lignes masquées (hors calculs).</p>
          </div>
          <Link
            href={ROUTES.FINANCE.DASHBOARD.HOME}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-indigo-50 backdrop-blur-sm transition hover:border-white/30 hover:bg-white/10"
          >
            <ArrowUpRight size={16} /> Retour dashboard
          </Link>
        </div>

        {error && (
          <GlassCard className="border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </GlassCard>
        )}

        <GlassPanel gradient="indigo" className="grid gap-3 p-4 text-sm text-indigo-50 md:grid-cols-4">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-200">Type</p>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            >
              <option className="text-slate-900" value="ALL">Tous</option>
              <option className="text-slate-900" value="debit">Dépenses</option>
              <option className="text-slate-900" value="credit">Revenus</option>
            </select>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-200">Statut</p>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            >
              <option className="text-slate-900" value="ALL">Tous</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-200">Recherche</p>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Description, tag, compte"
              className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white placeholder:text-indigo-100/60 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            />
          </div>
        </GlassPanel>

        <GlassPanel gradient="purple" className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-sm text-indigo-100/80">
            <div className="flex items-center gap-3">
              <span>Archives</span>
              <GlassBadge variant="default">{filtered.length} lignes</GlassBadge>
              {selectedIds.length > 0 && (
                <GlassBadge variant="warning">
                  {selectedIds.length} sélectionnées
                </GlassBadge>
              )}
            </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={unarchiveSelected}
              disabled={selectedIds.length === 0}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-300/60 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:border-emerald-200/80 disabled:opacity-50"
            >
              <Undo2 size={14} /> Restaurer
            </button>
            <button
              onClick={deleteSelected}
              disabled={selectedIds.length === 0}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-300/60 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 transition hover:border-red-200/80 disabled:opacity-50"
            >
              <Trash2 size={14} /> Supprimer
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/5 text-indigo-100">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    aria-label="Tout sélectionner"
                    checked={filtered.length > 0 && filtered.every((tx) => selectedIds.includes(tx.id))}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-white/30 bg-transparent text-indigo-400 focus:ring-indigo-400"
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
            <tbody className="divide-y divide-white/5">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-indigo-100/80">
                    <Loader2 size={16} className="mx-auto animate-spin" />
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-indigo-100/80">
                    Aucune transaction archivée.
                  </td>
                </tr>
              )}

              {!loading && filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 align-top">
                    <input
                      type="checkbox"
                      aria-label="Sélectionner la transaction"
                      checked={selectedIds.includes(tx.id)}
                      onChange={() => toggleSelect(tx.id)}
                      className="h-4 w-4 rounded border-white/30 bg-transparent text-indigo-400 focus:ring-indigo-400"
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                      tx.type === "debit" ? "bg-rose-500/15 text-rose-100 border border-rose-200/40" : "bg-emerald-500/15 text-emerald-100 border border-emerald-200/40"
                    }`}>
                      {tx.type === "debit" ? "Dépense" : "Revenu"}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium text-white">{tx.account?.name || `Compte #${tx.accountId}`}</div>
                    <div className="text-xs text-indigo-100/70">ID {tx.accountId}</div>
                  </td>
                  <td className={`px-4 py-3 align-top font-semibold ${tx.type === "debit" ? "text-rose-200" : "text-emerald-200"}`}>
                    {tx.type === "debit" ? "-" : "+"}{tx.amount} {currency}
                  </td>
                  <td className="px-4 py-3 align-top text-indigo-100/80">
                    {new Date(tx.occurredAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {tx.status ? (
                      <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-50">
                        {statusLabels[tx.status] || tx.status}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-indigo-50/90 whitespace-pre-wrap max-w-xs">
                    {tx.description || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassPanel>
      </div>
    </div>
  );
}
