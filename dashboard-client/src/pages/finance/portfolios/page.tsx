/**
 * Portefeuilles Finance - Gestion portefeuilles de comptes
 *
 * Fonctionnalités :
 * - Création et édition de portefeuilles thématiques
 * - Association de comptes multiples par portefeuille
 * - Calcul automatique du solde total par portefeuille
 * - Gestion statuts actif/inactif
 * - Suppression sécurisée avec confirmation
 * - Filtrage comptes disponibles (non assignés)
 * - Interface glassmorphism adaptative light/dark
 */

import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from "@/components/common";
import { financeNotices } from "@/lib/notices";
import { api } from "@/lib/finance/api";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { useApiData } from "@/hooks/finance/useApiData";
import { GlassCard, GlassBadge, GlassListItem } from "@/components/ui/glass";
import { Briefcase, Plus, Trash2, Edit, AlertCircle, RefreshCw } from "lucide-react";
import type { CreatePortfolioRequest, UpdatePortfolioRequest } from "@/types/api";
import { logger } from '@quelyos/logger';

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
    cacheTime: 3 * 60 * 1000,
  });

  const {
    data: accountsData
  } = useApiData<Account[]>({
    fetcher: async () => {
      const data = await api("/accounts");
      return Array.isArray(data) ? data : [];
    },
    cacheKey: "accounts",
    cacheTime: 3 * 60 * 1000,
  });

  const portfolios = portfoliosData || [];
  const allAccounts = accountsData || [];
  const error = portfoliosError?.message || null;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  const [selectedPortfolio, setSelectedPortfolio] = useState<number | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await api(`/portfolios/${editingId}`, { method: "PATCH", body: formData as UpdatePortfolioRequest });
    } else {
      await api("/portfolios", { method: "POST", body: formData as CreatePortfolioRequest });
    }
    setFormData({ name: "", description: "", status: "ACTIVE" });
    setShowForm(false);
    setEditingId(null);
    await refetchPortfolios();
  };

  const handleEdit = (portfolio: Portfolio) => {
    setEditingId(portfolio.id);
    setFormData({ name: portfolio.name, description: portfolio.description || "", status: portfolio.status === "INACTIVE" ? "INACTIVE" : "ACTIVE" });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce portefeuille ? Les comptes associés ne seront pas supprimés.")) return;
    try {
      await api(`/portfolios/${id}`, { method: "DELETE" });
      await refetchPortfolios();
    } catch (err) {
      logger.error("Erreur:", err);
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
    setSelectedAccounts((prev) => prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]);
  };

  const handleSaveAccounts = async () => {
    if (!selectedPortfolio) return;
    try {
      const portfolio = portfolios.find((p) => p.id === selectedPortfolio);
      if (!portfolio) return;
      const toAdd = selectedAccounts.filter((id) => !portfolio.accounts.some((a) => a.id === id));
      const toRemove = portfolio.accounts.filter((a) => !selectedAccounts.includes(a.id)).map((a) => a.id);
      for (const accountId of toAdd) await api(`/portfolios/${selectedPortfolio}/accounts/${accountId}`, { method: "POST" });
      for (const accountId of toRemove) await api(`/portfolios/${selectedPortfolio}/accounts/${accountId}`, { method: "DELETE" });
      setShowAccountModal(false);
      setSelectedPortfolio(null);
      await refetchPortfolios();
    } catch (err) {
      logger.error("Erreur:", err);
    }
  };

  const calculateTotalBalance = (portfolio: Portfolio) => {
    if (portfolio.status === "INACTIVE") return 0;
    return portfolio.accounts.filter((acc) => acc.status !== "INACTIVE").reduce((sum, acc) => sum + acc.balance, 0);
  };

  const getAvailableAccounts = () => {
    return allAccounts.filter((acc) => acc.status !== "INACTIVE" && (!portfolios.some((p) => p.accounts.some((pa) => pa.id === acc.id)) || selectedAccounts.includes(acc.id)));
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs items={[{ label: 'Accueil', href: '/' }, { label: 'Finance', href: '/finance' }, { label: 'Portefeuilles' }]} />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-200">Gestion</p>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Portefeuilles</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Organisez vos comptes en portefeuilles thématiques.</p>
          </div>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: "", description: "", status: "ACTIVE" }); }}>Nouveau portefeuille</Button>
        </div>
        <PageNotice config={financeNotices.portfolios} className="mb-6" />
        {error && (
          <div role="alert" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="flex-1 text-red-800 dark:text-red-200">{error}</p>
              <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => refetchPortfolios()}>Réessayer</Button>
            </div>
          </div>
        )}
        {loading && <SkeletonTable rows={3} columns={1} />}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <GlassCard variant="elevated" className="w-full max-w-lg p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">{editingId ? "Modifier le portefeuille" : "Nouveau portefeuille"}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white" htmlFor="name">Nom du portefeuille</label>
                  <input id="name" type="text" placeholder="ex: Investissements, Épargne familiale" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white" htmlFor="description">Description (facultatif)</label>
                  <textarea id="description" rows={3} placeholder="Description du portefeuille..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white" htmlFor="status">Statut</label>
                  <select id="status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as "ACTIVE" | "INACTIVE" })} className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"><option value="ACTIVE">Actif</option><option value="INACTIVE">Inactif</option></select>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" variant="primary" className="flex-1" disabled={loading}>{loading ? "Sauvegarde..." : editingId ? "Mettre à jour" : "Créer"}</Button>
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowForm(false); setEditingId(null); setFormData({ name: "", description: "", status: "ACTIVE" }); }} disabled={loading}>Annuler</Button>
                </div>
              </form>
            </GlassCard>
          </div>
        )}
        {showAccountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <GlassCard variant="elevated" className="w-full max-w-2xl p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Gérer les comptes</h2>
              <div className="mb-4 max-h-96 space-y-2 overflow-y-auto">
                {getAvailableAccounts().map((account) => (
                  <label key={account.id} className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 transition hover:bg-gray-100 dark:hover:bg-gray-700">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selectedAccounts.includes(account.id)} onChange={() => handleToggleAccount(account.id)} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-500 focus:ring-2 focus:ring-indigo-400" />
                      <div><p className="font-medium text-gray-900 dark:text-white">{account.name}</p><p className="text-xs text-gray-600 dark:text-gray-400">{account.type} · {globalCurrency}</p></div>
                    </div>
                    <div className="text-right"><p className="font-semibold text-emerald-600 dark:text-emerald-400">{account.balance.toFixed(2)} {globalCurrency}</p></div>
                  </label>
                ))}
                {getAvailableAccounts().length === 0 && <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-8 text-center text-sm text-gray-600 dark:text-gray-400">Aucun compte disponible</div>}
              </div>
              <div className="flex gap-3">
                <Button variant="primary" className="flex-1" onClick={handleSaveAccounts} disabled={loading}>{loading ? "Sauvegarde..." : "Sauvegarder"}</Button>
                <Button variant="secondary" className="flex-1" onClick={() => { setShowAccountModal(false); setSelectedPortfolio(null); }} disabled={loading}>Annuler</Button>
              </div>
            </GlassCard>
          </div>
        )}
        {!loading && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {portfolios.map((portfolio) => {
              const totalBalance = calculateTotalBalance(portfolio);
              return (
                <GlassCard key={portfolio.id} className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-indigo-500/20 p-3"><Briefcase className="h-6 w-6 text-indigo-600 dark:text-indigo-300" /></div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{portfolio.name}</h3>
                        <div className="mt-1 flex items-center gap-2"><GlassBadge variant={portfolio.status === "INACTIVE" ? "warning" : "success"}>{portfolio.status === "INACTIVE" ? "Inactif" : "Actif"}</GlassBadge></div>
                        {portfolio.description && <p className="text-xs text-gray-600 dark:text-gray-400">{portfolio.description}</p>}
                      </div>
                    </div>
                  </div>
                  <GlassListItem className="mb-4 flex items-center justify-between"><span className="text-sm text-gray-600 dark:text-gray-400">Solde total</span><span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{totalBalance.toFixed(2)} {globalCurrency}</span></GlassListItem>
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400"><span>Comptes associés</span><span>{portfolio.accounts.length}</span></div>
                    {portfolio.accounts.length > 0 && (
                      <div className="space-y-1">
                        {portfolio.accounts.slice(0, 3).map((account) => (
                          <div key={account.id} className="flex items-center justify-between rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2 text-xs"><span className="text-gray-900 dark:text-gray-300">{account.name}</span><span className="font-medium text-emerald-600 dark:text-emerald-400">{account.balance.toFixed(2)} {globalCurrency}</span></div>
                        ))}
                        {portfolio.accounts.length > 3 && <p className="text-center text-xs text-gray-600 dark:text-gray-400">+{portfolio.accounts.length - 3} autre(s)</p>}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="subtle" className="flex-1 text-xs" onClick={() => handleManageAccounts(portfolio.id)}>Gérer comptes</Button>
                    <Button variant="ghost" size="sm" icon={<Edit className="h-4 w-4" />} onClick={() => handleEdit(portfolio)} />
                    <Button variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => handleDelete(portfolio.id)} />
                  </div>
                </GlassCard>
              );
            })}
            {portfolios.length === 0 && (
              <GlassCard variant="subtle" className="col-span-full p-12 text-center">
                <Briefcase className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Aucun portefeuille</h3>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">Créez votre premier portefeuille pour organiser vos comptes.</p>
                <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: "", description: "", status: "ACTIVE" }); }}>Créer un portefeuille</Button>
              </GlassCard>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
