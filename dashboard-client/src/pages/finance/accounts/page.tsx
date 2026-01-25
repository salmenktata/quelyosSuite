

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/finance/compat/routes";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { currencies } from "@/lib/finance/currencies";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { GlassCard, GlassPanel, GlassBadge, GlassListItem } from "@/components/ui/glass";
import { Plus, Trash2, Pencil, Archive, ArrowUpDown, Check } from "lucide-react";
import type { CreateAccountRequest, UpdateAccountRequest, ReassignAccountRequest } from "@/types/api";
import { AccountModal, type AccountFormData } from "@/components/finance/accounts/AccountModal";
import { DeleteConflictModal } from "@/components/finance/accounts/DeleteConflictModal";
import { useFilteredData } from "@/hooks/finance/useFilteredData";
import { useApiData } from "@/hooks/finance/useApiData";

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

type Account = {
  id: number;
  name: string;
  companyId: number;
  type?: AccountType;
  currency?: string;
  balance?: number;
  institution?: string;
  notes?: string;
  portfolios?: Array<{
    portfolio: Portfolio;
  }>;
  status?: "ACTIVE" | "INACTIVE";
};

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

const typeBadge: Record<AccountType, string> = {
  banque: "bg-indigo-500/20 text-indigo-100 border-indigo-400/30",
  cash: "bg-emerald-500/20 text-emerald-100 border-emerald-400/30",
  cheques: "bg-cyan-500/20 text-cyan-100 border-cyan-400/30",
  traites: "bg-amber-500/20 text-amber-100 border-amber-400/30",
  carte: "bg-violet-500/20 text-violet-100 border-violet-400/30",
  epargne: "bg-sky-500/20 text-sky-100 border-sky-400/30",
  investissement: "bg-rose-500/20 text-rose-100 border-rose-400/30",
  pret: "bg-slate-500/20 text-slate-100 border-slate-400/30",
};

export default function AccountsPage() {
  const { user } = useRequireAuth();
  const role = (user as { role?: string } | null)?.role ?? "USER";
  const isSuperAdmin = role === "SUPERADMIN";
  const { currency: globalCurrency } = useCurrency();

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("banque");
  const [currency, setCurrency] = useState("EUR");
  const [balance, setBalance] = useState<number | "">("");
  const [institution, setInstitution] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [selectedPortfolios, setSelectedPortfolios] = useState<number[]>([]);
  const [filterType, setFilterType] = useState<AccountType | "all">("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [targetCompanyId, setTargetCompanyId] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "balance" | "type">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConflictId, setDeleteConflictId] = useState<number | null>(null);
  const [deleteAction, setDeleteAction] = useState<"archive" | "reassign">("archive");
  const [reassignTargetId, setReassignTargetId] = useState<number | "">("");
  const [resolvingConflict, setResolvingConflict] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const withCompanyParam = useCallback(
    (path: string) => {
      if (!isSuperAdmin) return path;
      const cid = Number(targetCompanyId);
      if (!targetCompanyId.trim() || !Number.isFinite(cid)) return path;
      return path.includes("?") ? `${path}&companyId=${cid}` : `${path}?companyId=${cid}`;
    },
    [isSuperAdmin, targetCompanyId]
  );

  // Fetch portfolios with automatic caching
  const {
    data: portfoliosData,
    refetch: refetchPortfolios
  } = useApiData<Portfolio[]>({
    fetcher: async () => {
      const data = await api(withCompanyParam("/portfolios"));
      return Array.isArray(data) ? data : [];
    },
    cacheKey: `portfolios-${isSuperAdmin ? targetCompanyId : 'default'}`,
    cacheTime: 5 * 60 * 1000, // 5 minutes
    deps: [withCompanyParam],
  });

  // Fetch accounts with automatic caching
  const {
    data: accountsData,
    loading,
    error: accountsError,
    refetch: refetchAccounts
  } = useApiData<Account[]>({
    fetcher: async () => {
      const data = await api(withCompanyParam("/accounts"));
      const rawAccounts = (data as unknown) as Account[];
      return rawAccounts.map((acc) => ({
        ...acc,
        type: (acc.type as AccountType) ?? "banque",
        currency: acc.currency ?? "EUR",
        balance: acc.balance ?? 0,
      }));
    },
    cacheKey: `accounts-${isSuperAdmin ? targetCompanyId : 'default'}`,
    cacheTime: 2 * 60 * 1000, // 2 minutes
    deps: [withCompanyParam],
  });

  const portfolios = portfoliosData || [];
  const accounts = accountsData || [];
  const error = accountsError?.message || null;

  function resetAccountForm() {
    setName("");
    setInstitution("");
    setNotes("");
    setBalance("");
    setType("banque");
    setCurrency(globalCurrency);
    setStatus("ACTIVE");
    setSelectedPortfolios([]);
    setEditingId(null);
  }

  async function submitAccountFromModal(data: AccountFormData) {
    try {
      const body = {
        name: data.name,
        type: data.type,
        currency: data.currency,
        balance: data.balance,
        institution: data.institution,
        notes: data.notes,
        status: data.status,
        portfolioIds: data.selectedPortfolios,
      };

      if (editingId) {
        await api(withCompanyParam(`/accounts/${editingId}`), {
          method: "PUT",
          body: body as UpdateAccountRequest,
        });
      } else {
        await api(withCompanyParam("/accounts"), {
          method: "POST",
          body: body as CreateAccountRequest,
        });
      }

      resetAccountForm();
      await refetchAccounts();
    } catch (err) {
      throw err; // Let modal handle the error
    }
  }

  function startEdit(acc: Account) {
    setEditingId(acc.id);
    setName(acc.name);
    setType((acc.type as AccountType) ?? "banque");
    setCurrency(acc.currency ?? "EUR");
    setBalance(acc.balance ?? 0);
    setInstitution(acc.institution ?? "");
    setNotes(acc.notes ?? "");
    setStatus(acc.status === "INACTIVE" ? "INACTIVE" : "ACTIVE");
    setSelectedPortfolios(
      acc.portfolios?.map((p) => p.portfolio.id) ?? []
    );
  }

  async function deleteAccount(id: number) {
    if (!confirm("Supprimer ce compte ?")) return;
    setDeletingId(id);
    setError(null);
    try {
      await api(withCompanyParam(`/accounts/${id}`), { method: "DELETE" });
      if (editingId === id) {
        resetAccountForm();
      }
      await refetchAccounts();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible de supprimer le compte.";
      if (message.includes("ACCOUNT_HAS_TRANSACTIONS")) {
        setDeleteConflictId(id);
        setDeleteAction("archive");
        setReassignTargetId("");
        setConflictError(null);
      } else {
        setError(message);
      }
    } finally {
      setDeletingId(null);
    }
  }

  function closeDeleteConflict() {
    setDeleteConflictId(null);
    setDeleteAction("archive");
    setReassignTargetId("");
    setConflictError(null);
  }

  async function handleResolveConflict(action: "archive" | "reassign", targetAccountId?: number) {
    if (!deleteConflictId) return;
    setResolvingConflict(true);
    setConflictError(null);

    if (action === "reassign" && !targetAccountId) {
      setConflictError("Sélectionnez un compte de destination.");
      setResolvingConflict(false);
      return;
    }

    try {
      if (action === "archive") {
        await api(withCompanyParam(`/accounts/${deleteConflictId}/archive-transactions`), {
          method: "POST",
        });
      } else {
        await api(withCompanyParam(`/accounts/${deleteConflictId}/reassign-transactions`), {
          method: "POST",
          body: { targetAccountId: Number(targetAccountId) } as ReassignAccountRequest,
        });
      }

      if (editingId === deleteConflictId) {
        resetAccountForm();
      }

      closeDeleteConflict();
      await refetchAccounts();
    } catch (err) {
      setConflictError(
        err instanceof Error
          ? err.message
          : "Impossible de résoudre le conflit de suppression."
      );
    } finally {
      setResolvingConflict(false);
    }
  }

  useEffect(() => {
    setCurrency(globalCurrency);
  }, [globalCurrency]);

  const { sortedData: sortedAndFiltered } = useFilteredData({
    data: accounts,
    filterConfig: {
      searchQuery,
      searchFields: ['name', 'institution', 'notes'],
      filters: {
        ...(filterType !== "all" && { type: filterType }),
      },
    },
    sortConfig: sortBy ? { key: sortBy, direction: sortDir } : null,
  });

  const conflictAccount = useMemo(
    () => accounts.find((a) => a.id === deleteConflictId) ?? null,
    [accounts, deleteConflictId]
  );

  const reassignableAccounts = useMemo(
    () =>
      accounts.filter(
        (a) => a.id !== deleteConflictId && a.status !== "INACTIVE"
      ),
    [accounts, deleteConflictId]
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedAndFiltered.length && sortedAndFiltered.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedAndFiltered.map((a) => a.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  return (
    <div className="relative min-h-screen text-white">
      {/* Background blur orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[400px] w-[400px] rounded-full bg-purple-500/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-emerald-500/20 blur-[120px]" />
      </div>

      <div className="relative space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Comptes</p>
            <h1 className="bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-2xl md:text-3xl font-semibold text-transparent">
              Vue liste
            </h1>
            <p className="text-sm text-indigo-100/80 hidden md:block">
              Consultez vos comptes sous forme de tableau.
            </p>
          </div>
          <div className="flex gap-2 md:gap-3">
            <Link
              href={ROUTES.FINANCE.DASHBOARD.ACCOUNTS.NEW}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2.5 md:px-4 md:py-3 text-sm font-semibold shadow-lg transition hover:from-emerald-400 hover:to-teal-400"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Nouveau compte</span>
              <span className="sm:hidden">Ajouter</span>
            </Link>
            <Link
              href="/dashboard"
              className="hidden md:flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/10"
            >
              Retour dashboard
            </Link>
          </div>
        </div>

        {/* Filtres */}
        <GlassPanel gradient="indigo" className="p-4 md:p-6">
          <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1 space-y-2">
              <label className="text-xs uppercase tracking-wider text-indigo-200">
                Rechercher
              </label>
              <input
                type="text"
                placeholder="Nom, établissement"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 md:px-4 md:py-3 text-sm text-white placeholder:text-indigo-100/60 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              />
            </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-indigo-200">
              Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as AccountType | "all")}
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            >
              <option value="all">Tous</option>
              {accountTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-indigo-200">
              Portefeuille
            </label>
            <select
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            >
              <option value="all">Tous</option>
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-indigo-200">
              Devise
            </label>
            <select
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            >
              <option value="all">Toutes</option>
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>
        </div>
      </GlassPanel>

      {/* Tableau des comptes - Desktop */}
      <GlassPanel gradient="purple" className="hidden md:block overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-white/10 p-4 md:p-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Tableau des comptes</h2>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              {sortedAndFiltered.length} lignes
            </span>
          </div>
          <div className="flex gap-2">
            {selectedIds.length > 0 && (
              <>
                <button className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10">
                  <Archive size={16} />
                  Archiver
                </button>
                <button className="flex items-center gap-2 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-500/20">
                  <Trash2 size={16} />
                  Supprimer
                </button>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-indigo-200">
                <th className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === sortedAndFiltered.length && sortedAndFiltered.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-white/20 bg-white/10 text-indigo-500"
                  />
                </th>
                <th className="cursor-pointer p-4 hover:text-white" onClick={() => handleSort("name")}>
                  <div className="flex items-center gap-2">
                    Compte
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="cursor-pointer p-4 hover:text-white" onClick={() => handleSort("balance")}>
                  <div className="flex items-center gap-2">
                    Montant
                    <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="p-4">Type</th>
                <th className="p-4">Statut</th>
                <th className="p-4">Portefeuilles</th>
                <th className="p-4">Établissement</th>
                <th className="p-4">Notes</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedAndFiltered.map((acc) => {
                const badgeClass = typeBadge[(acc.type as AccountType) ?? "banque"];
                const isShared = (acc.portfolios?.length ?? 0) === 0;
                return (
                  <tr
                    key={acc.id}
                    className="group transition hover:bg-white/5"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(acc.id)}
                        onChange={() => toggleSelect(acc.id)}
                        className="h-4 w-4 rounded border-white/20 bg-white/10 text-indigo-500"
                      />
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-white">{acc.name}</div>
                        <div className="text-xs text-indigo-100/60">ID {acc.id}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-emerald-200">
                        {(acc.balance ?? 0) >= 0 ? "+" : ""}
                        {(acc.balance ?? 0).toFixed(2)} {globalCurrency}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                        {accountTypes.find((t) => t.value === acc.type)?.label ?? "Banque"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          acc.status === "INACTIVE"
                            ? "border-orange-300/50 bg-orange-500/15 text-orange-100"
                            : "border-emerald-300/50 bg-emerald-500/15 text-emerald-100"
                        }`}
                      >
                        {acc.status === "INACTIVE" ? "Inactif" : "Actif"}
                      </span>
                    </td>
                    <td className="p-4">
                      {acc.portfolios && acc.portfolios.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {acc.portfolios.map((p) => (
                            <span
                              key={p.portfolio.id}
                              className="text-xs rounded-full border border-indigo-400/40 bg-indigo-500/10 px-2 py-0.5 text-indigo-200"
                            >
                              {p.portfolio.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-indigo-100/80">Tous les portefeuilles</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-indigo-100/70">
                        {acc.institution || "—"}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs">
                      <span className="text-sm text-indigo-100/70 truncate block">
                        {acc.notes || "—"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            // Navigation vers page d'édition ou modal
                            startEdit(acc);
                          }}
                          className="rounded-lg border border-white/20 p-2 text-indigo-50 transition hover:border-white/40 hover:bg-white/10"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => deleteAccount(acc.id)}
                          disabled={deletingId === acc.id}
                          className="rounded-lg border border-rose-400/40 p-2 text-rose-100 transition hover:bg-rose-500/10 disabled:opacity-60"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {sortedAndFiltered.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-indigo-100/60">Aucun compte trouvé.</p>
            </div>
          )}
        </div>
      </GlassPanel>

      {/* Liste mobile en cartes */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-medium text-indigo-200">{sortedAndFiltered.length} compte(s)</span>
          {selectedIds.length > 0 && (
            <button className="flex items-center gap-1.5 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100">
              <Trash2 size={14} />
              Suppr. ({selectedIds.length})
            </button>
          )}
        </div>
        
        {sortedAndFiltered.length === 0 && (
          <GlassCard variant="subtle" className="p-8 text-center">
            <p className="text-indigo-100/60">Aucun compte trouvé.</p>
          </GlassCard>
        )}

        {sortedAndFiltered.map((acc) => {
          const badgeClass = typeBadge[(acc.type as AccountType) ?? "banque"];
          return (
            <GlassCard key={acc.id} variant="subtle" className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(acc.id)}
                      onChange={() => toggleSelect(acc.id)}
                      className="h-4 w-4 rounded border-white/20 bg-white/10 text-indigo-500"
                    />
                    <h3 className="font-semibold text-white truncate">{acc.name}</h3>
                  </div>
                  <p className="text-xs text-indigo-100/60">{acc.institution || "Sans établissement"}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
                  {accountTypes.find((t) => t.value === acc.type)?.label ?? "Banque"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-emerald-300">
                  {(acc.balance ?? 0) >= 0 ? "+" : ""}{(acc.balance ?? 0).toFixed(2)} {globalCurrency}
                </span>
                <span className={`rounded-full border px-2 py-0.5 text-xs ${
                  acc.status === "INACTIVE"
                    ? "border-orange-300/50 bg-orange-500/15 text-orange-100"
                    : "border-emerald-300/50 bg-emerald-500/15 text-emerald-100"
                }`}>
                  {acc.status === "INACTIVE" ? "Inactif" : "Actif"}
                </span>
              </div>

              {acc.portfolios && acc.portfolios.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {acc.portfolios.slice(0, 3).map((p) => (
                    <span
                      key={p.portfolio.id}
                      className="text-xs rounded-full border border-indigo-400/40 bg-indigo-500/10 px-2 py-0.5 text-indigo-200"
                    >
                      {p.portfolio.name}
                    </span>
                  ))}
                  {acc.portfolios.length > 3 && (
                    <span className="text-xs text-indigo-100/60">+{acc.portfolios.length - 3}</span>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => startEdit(acc)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-white/20 py-2 text-sm text-indigo-50 transition hover:bg-white/10"
                >
                  <Pencil size={14} />
                  Modifier
                </button>
                <button
                  onClick={() => deleteAccount(acc.id)}
                  disabled={deletingId === acc.id}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-rose-400/40 py-2 text-sm text-rose-100 transition hover:bg-rose-500/10 disabled:opacity-60"
                >
                  <Trash2 size={14} />
                  Supprimer
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Delete Conflict Modal */}
      <DeleteConflictModal
        isOpen={!!deleteConflictId}
        account={conflictAccount}
        availableAccounts={reassignableAccounts}
        loading={resolvingConflict}
        error={conflictError}
        onCancel={closeDeleteConflict}
        onResolve={handleResolveConflict}
      />

      {/* Modal d'édition */}
      <AccountModal
        isOpen={!!editingId}
        mode="edit"
        initialData={{
          name,
          type,
          currency,
          balance,
          institution,
          notes,
          status,
          selectedPortfolios,
        }}
        portfolios={portfolios}
        loading={loading}
        error={error}
        onSubmit={submitAccountFromModal}
        onCancel={resetAccountForm}
        isSuperAdmin={isSuperAdmin}
        targetCompanyId={targetCompanyId}
        onTargetCompanyIdChange={setTargetCompanyId}
      />
      </div>
    </div>
  );
}
