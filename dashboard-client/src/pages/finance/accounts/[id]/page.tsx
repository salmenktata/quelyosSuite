

import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ROUTES } from "@/lib/finance/compat/routes";
import { api } from "@/lib/finance/api";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { GlassCard, GlassPanel } from "@/components/ui/glass";
import { logger } from '@quelyos/logger';
import {
  ArrowLeft,
  Building2,
  Wallet,
  Edit2,
  ArrowLeftRight,
  PieChart,
  Loader2,
  AlertCircle,
} from "lucide-react";
type Account = {
  id: number;
  name: string;
  type: string;
  currency: string;
  balance: number;
  institution?: string;
  notes?: string;
  status: "ACTIVE" | "INACTIVE";
  portfolios?: Array<{ portfolio: { id: number; name: string } }>;
};

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const accountId = parseInt(id || '0', 10);
  
  const _navigate = useNavigate();
  const { user, isLoading: authLoading } = useRequireAuth();
  const { currency: globalCurrency } = useCurrency();

  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "flows" | "transactions">("overview");

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const fetchAccount = async () => {
      try {
        setLoading(true);
        const data = await api<Account>(`/accounts/${accountId}`);
        setAccount(data);
      } catch (err) {
      logger.error("Erreur:", err);
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [accountId, user, authLoading]);

  const formatCurrency = (amount: number, curr?: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: curr || globalCurrency || "EUR",
    }).format(amount);
  };

  const getTypeBadgeClass = (type: string) => {
    const badges: Record<string, string> = {
      banque: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      cash: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      cheques: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      traites: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      carte: "bg-violet-500/20 text-violet-300 border-violet-500/30",
      epargne: "bg-sky-500/20 text-sky-300 border-sky-500/30",
      investissement: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      pret: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    };
    return badges[type] || badges.banque;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      banque: "Banque",
      cash: "Espèces",
      cheques: "Chèques",
      traites: "Traites",
      carte: "Carte",
      epargne: "Épargne",
      investissement: "Investissement",
      pret: "Prêt",
    };
    return labels[type] || type;
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="h-6 w-6" />
            <p>{error || "Compte non trouvé"}</p>
          </div>
          <Link
            to={ROUTES.FINANCE.DASHBOARD.ACCOUNTS.HOME}
            className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-400 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux comptes
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            to={ROUTES.FINANCE.DASHBOARD.ACCOUNTS.HOME}
            className="mb-2 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux comptes
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{account.name}</h1>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block rounded-full border px-2 py-0.5 text-xs ${getTypeBadgeClass(
                    account.type
                  )}`}
                >
                  {getTypeLabel(account.type)}
                </span>
                {account.institution && (
                  <span className="flex items-center gap-1 text-sm text-slate-400">
                    <Building2 className="h-3 w-3" />
                    {account.institution}
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    account.status === "ACTIVE"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-slate-500/20 text-slate-400"
                  }`}
                >
                  {account.status === "ACTIVE" ? "Actif" : "Inactif"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Solde */}
        <div className="text-right">
          <p className="text-sm text-slate-400">Solde</p>
          <p
            className={`text-3xl font-bold ${
              account.balance >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {formatCurrency(account.balance, account.currency)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
        {[
          { key: "overview", label: "Vue d'ensemble", icon: PieChart },
          { key: "flows", label: "Flux de paiement", icon: ArrowLeftRight },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === key
                ? "bg-indigo-500 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Infos */}
          <GlassPanel className="space-y-4 p-6">
            <h2 className="text-lg font-semibold text-white">Informations</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Type</span>
                <span className="text-white">{getTypeLabel(account.type)}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Devise</span>
                <span className="text-white">{account.currency}</span>
              </div>
              {account.institution && (
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">Institution</span>
                  <span className="text-white">{account.institution}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Statut</span>
                <span className="text-white">
                  {account.status === "ACTIVE" ? "Actif" : "Inactif"}
                </span>
              </div>
            </div>

            {account.notes && (
              <div className="pt-2">
                <p className="mb-1 text-sm text-slate-400">Notes</p>
                <p className="text-sm text-slate-300">{account.notes}</p>
              </div>
            )}

            {/* Portefeuilles liés */}
            {account.portfolios && account.portfolios.length > 0 && (
              <div className="pt-2">
                <p className="mb-2 text-sm text-slate-400">Portefeuilles</p>
                <div className="flex flex-wrap gap-2">
                  {account.portfolios.map(({ portfolio }) => (
                    <Link
                      key={portfolio.id}
                      to={`/finance/portfolios/${portfolio.id}`}
                      className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300 transition hover:bg-violet-500/20"
                    >
                      {portfolio.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </GlassPanel>

          {/* Quick Actions */}
          <GlassPanel className="space-y-4 p-6">
            <h2 className="text-lg font-semibold text-white">Actions rapides</h2>
            
            <div className="grid gap-3">
              <Link
                to={`/finance/expenses?accountId=${account.id}`}
                className="flex items-center gap-3 rounded-lg border border-white/10 p-4 transition hover:bg-white/5"
              >
                <ArrowLeftRight className="h-5 w-5 text-indigo-400" />
                <div>
                  <p className="font-medium text-white">Voir les transactions</p>
                  <p className="text-sm text-slate-400">
                    Toutes les opérations de ce compte
                  </p>
                </div>
              </Link>

              <button
                onClick={() => setActiveTab("flows")}
                className="flex items-center gap-3 rounded-lg border border-white/10 p-4 text-left transition hover:bg-white/5"
              >
                <PieChart className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="font-medium text-white">Gérer les flux</p>
                  <p className="text-sm text-slate-400">
                    CB, chèques, virements, traites...
                  </p>
                </div>
              </button>

              <Link
                to={`/finance/accounts?edit=${account.id}`}
                className="flex items-center gap-3 rounded-lg border border-white/10 p-4 transition hover:bg-white/5"
              >
                <Edit2 className="h-5 w-5 text-amber-400" />
                <div>
                  <p className="font-medium text-white">Modifier le compte</p>
                  <p className="text-sm text-slate-400">
                    Nom, type, institution...
                  </p>
                </div>
              </Link>
            </div>
          </GlassPanel>
        </div>
      )}

      {activeTab === "flows" && (
        <GlassPanel className="p-6">
          <PaymentFlowManager accountId={account.id} accountName={account.name} />
        </GlassPanel>
      )}
    </div>
  );
}
