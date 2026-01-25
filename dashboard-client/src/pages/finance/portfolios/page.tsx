

import React, { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { useApiData } from "@/hooks/finance/useApiData";
import { GlassCard, GlassPanel, GlassBadge, GlassListItem, GlassStatCard } from "@/components/ui/glass";
import { Briefcase, Plus, Trash2, Edit } from "lucide-react";
import type { CreatePortfolioRequest, UpdatePortfolioRequest } from "@/types/api";

type Account = {
  id: number;
  name: string;
  type: string;
  currency: string;
  balance: number;
  institution?: string;
  notes?: string;
  status?: "ACTIVE" | "INACTIVE";
};

type Portfolio = {
  id: number;
  name: string;
  description?: string | null;
  status?: "ACTIVE" | "INACTIVE";
  accounts: Account[];
  createdAt: string;
};

export default function PortfoliosPage() {
  useRequireAuth();
  const { currency: globalCurrency } = useCurrency();

  // Fetch portfolios with automatic caching
  const {
    data: portfoliosData,
    loading,
    error: portfoliosError,
    refetch: refetchPortfolios
  } = useApiData<Portfolio[]>({
    fetcher: async () => {
      const data = await api("/portfolios");
      return Array.isArray(data) ? data : [];
    },
    cacheKey: "portfolios",
    cacheTime: 3 * 60 * 1000, // 3 minutes
  });

  // Fetch accounts with automatic caching
  const {
    data: accountsData
  } = useApiData<Account[]>({
    fetcher: async () => {
      const data = await api("/accounts");
      return Array.isArray(data) ? data : [];
    },
    cacheKey: "accounts",
    cacheTime: 3 * 60 * 1000, // 3 minutes
  });

  const portfolios = portfoliosData || [];
  const allAccounts = accountsData || [];
  const error = portfoliosError?.message || null;

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  // Account management states
  const [selectedPortfolio, setSelectedPortfolio] = useState<number | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await api(`/portfolios/${editingId}`, {
          method: "PATCH",
          body: formData as UpdatePortfolioRequest,
        });
      } else {
        await api("/portfolios", {
          method: "POST",
          body: formData as CreatePortfolioRequest,
        });
      }

      setFormData({ name: "", description: "", status: "ACTIVE" });
      setShowForm(false);
      setEditingId(null);
      await refetchPortfolios();
    } catch (err) {
      throw err; // Error will be handled by useApiData
    }
  };

  const handleEdit = (portfolio: Portfolio) => {
    setEditingId(portfolio.id);
    setFormData({
      name: portfolio.name,
      description: portfolio.description || "",
      status: portfolio.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce portefeuille ? Les comptes associés ne seront pas supprimés.")) return;

    try {
      await api(`/portfolios/${id}`, { method: "DELETE" });
      await refetchPortfolios();
    } catch (err) {
      // Error will be handled by useApiData
    }
  };

  const handleManageAccounts = (portfolioId: number) => {
    const portfolio = portfolios.find((p) => p.id === portfolioId);
    if (portfolio) {
      setSelectedPortfolio(portfolioId);
      setSelectedAccounts(portfolio.accounts.map((a) => a.id));
      setShowAccountModal(true);
    }
  };

  const handleToggleAccount = (accountId: number) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleSaveAccounts = async () => {
    if (!selectedPortfolio) return;

    try {
      const portfolio = portfolios.find((p) => p.id === selectedPortfolio);
      if (!portfolio) return;

      // Accounts to add
      const toAdd = selectedAccounts.filter(
        (id) => !portfolio.accounts.some((a) => a.id === id)
      );

      // Accounts to remove
      const toRemove = portfolio.accounts
        .filter((a) => !selectedAccounts.includes(a.id))
        .map((a) => a.id);

      // Execute additions
      for (const accountId of toAdd) {
        await api(`/portfolios/${selectedPortfolio}/accounts/${accountId}`, {
          method: "POST",
        });
      }

      // Execute removals
      for (const accountId of toRemove) {
        await api(`/portfolios/${selectedPortfolio}/accounts/${accountId}`, {
          method: "DELETE",
        });
      }

      setShowAccountModal(false);
      setSelectedPortfolio(null);
      await refetchPortfolios();
    } catch (err) {
      // Error will be handled by useApiData
    }
  };

  const calculateTotalBalance = (portfolio: Portfolio) => {
    if (portfolio.status === "INACTIVE") return 0;
    return portfolio.accounts
      .filter((acc) => acc.status !== "INACTIVE")
      .reduce((sum, acc) => sum + acc.balance, 0);
  };

  const getAvailableAccounts = () => {
    return allAccounts.filter(
      (acc) =>
        acc.status !== "INACTIVE" &&
        (!portfolios.some((p) =>
          p.accounts.some((pa) => pa.id === acc.id)
        ) || selectedAccounts.includes(acc.id))
    );
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
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">
              Gestion
            </p>
            <h1 className="bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-3xl font-semibold text-transparent">
              Portefeuilles
            </h1>
            <p className="text-sm text-indigo-100/80">
              Organisez vos comptes en portefeuilles thématiques.
            </p>
          </div>

          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({ name: "", description: "", status: "ACTIVE" });
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold shadow-lg transition hover:from-indigo-400 hover:to-violet-400"
          >
            <Plus className="h-5 w-5" />
            Nouveau portefeuille
          </button>
        </div>

        {error && (
          <GlassCard className="border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </GlassCard>
        )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <GlassCard variant="elevated" className="w-full max-w-lg p-6">
            <h2 className="mb-4 text-xl font-semibold">
              {editingId ? "Modifier le portefeuille" : "Nouveau portefeuille"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white" htmlFor="name">
                  Nom du portefeuille
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="ex: Investissements, Épargne familiale"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-indigo-100/60 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white" htmlFor="description">
                  Description (facultatif)
                </label>
                <textarea
                  id="description"
                  rows={3}
                  placeholder="Description du portefeuille..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white placeholder:text-indigo-100/60 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                />
              </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white" htmlFor="status">
                    Statut
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "ACTIVE" | "INACTIVE" })}
                    className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  >
                    <option value="ACTIVE">Actif</option>
                    <option value="INACTIVE">Inactif</option>
                  </select>
                </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-indigo-400 hover:to-violet-400 disabled:opacity-60"
                  disabled={loading}
                >
                  {loading
                    ? "Sauvegarde..."
                    : editingId
                      ? "Mettre à jour"
                      : "Créer"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ name: "", description: "", status: "ACTIVE" });
                  }}
                  className="flex-1 rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-indigo-50 transition hover:border-white/40"
                  disabled={loading}
                >
                  Annuler
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Account Management Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <GlassCard variant="elevated" className="w-full max-w-2xl p-6">
            <h2 className="mb-4 text-xl font-semibold">Gérer les comptes</h2>

            <div className="mb-4 max-h-96 space-y-2 overflow-y-auto">
              {getAvailableAccounts().map((account) => (
                <label
                  key={account.id}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedAccounts.includes(account.id)}
                      onChange={() => handleToggleAccount(account.id)}
                      className="h-4 w-4 rounded border-white/20 bg-white/10 text-indigo-500 focus:ring-2 focus:ring-indigo-400"
                    />
                    <div>
                      <p className="font-medium text-white">{account.name}</p>
                      <p className="text-xs text-white/60">
                        {account.type} · {globalCurrency}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-200">
                      {account.balance.toFixed(2)} {globalCurrency}
                    </p>
                  </div>
                </label>
              ))}

              {getAvailableAccounts().length === 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/70">
                  Aucun compte disponible
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveAccounts}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-indigo-400 hover:to-violet-400 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Sauvegarde..." : "Sauvegarder"}
              </button>
              <button
                onClick={() => {
                  setShowAccountModal(false);
                  setSelectedPortfolio(null);
                }}
                className="flex-1 rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-indigo-50 transition hover:border-white/40"
                disabled={loading}
              >
                Annuler
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Portfolios Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {portfolios.map((portfolio) => {
          const totalBalance = calculateTotalBalance(portfolio);
          return (
            <GlassCard
              key={portfolio.id}
              hover
              gradient="indigo"
              className="p-6"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-indigo-500/20 p-3">
                    <Briefcase className="h-6 w-6 text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {portfolio.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <GlassBadge
                        variant={portfolio.status === "INACTIVE" ? "warning" : "success"}
                      >
                        {portfolio.status === "INACTIVE" ? "Inactif" : "Actif"}
                      </GlassBadge>
                    </div>
                    {portfolio.description && (
                      <p className="text-xs text-white/60">
                        {portfolio.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <GlassListItem className="mb-4 flex items-center justify-between">
                <span className="text-sm text-white/70">Solde total</span>
                <span className="text-lg font-semibold text-emerald-200">
                  {totalBalance.toFixed(2)} {globalCurrency}
                </span>
              </GlassListItem>

              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span>Comptes associés</span>
                  <span>{portfolio.accounts.length}</span>
                </div>

                {portfolio.accounts.length > 0 && (
                  <div className="space-y-1">
                    {portfolio.accounts.slice(0, 3).map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs"
                      >
                        <span className="text-white/80">{account.name}</span>
                        <span className="font-medium text-emerald-200">
                          {account.balance.toFixed(2)} {globalCurrency}
                        </span>
                      </div>
                    ))}
                    {portfolio.accounts.length > 3 && (
                      <p className="text-center text-xs text-white/60">
                        +{portfolio.accounts.length - 3} autre(s)
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleManageAccounts(portfolio.id)}
                  className="flex-1 rounded-lg border border-indigo-400/40 px-3 py-2 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/10 hover:border-indigo-400/60"
                >
                  Gérer comptes
                </button>
                <button
                  onClick={() => handleEdit(portfolio)}
                  className="rounded-lg border border-white/20 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(portfolio.id)}
                  className="rounded-lg border border-red-400/40 p-2 text-red-300 transition hover:bg-red-500/10 hover:border-red-400/60"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </GlassCard>
          );
        })}

        {portfolios.length === 0 && (
          <GlassCard variant="subtle" className="col-span-full p-12 text-center">
            <Briefcase className="mx-auto mb-4 h-12 w-12 text-white/40" />
            <h3 className="mb-2 text-lg font-semibold text-white">
              Aucun portefeuille
            </h3>
            <p className="mb-4 text-sm text-white/70">
              Créez votre premier portefeuille pour organiser vos comptes.
            </p>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({ name: "", description: "", status: "ACTIVE" });
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-indigo-400 hover:to-violet-400"
            >
              <Plus className="h-5 w-5" />
              Créer un portefeuille
            </button>
          </GlassCard>
        )}
      </div>
      </div>
    </div>
  );
}
