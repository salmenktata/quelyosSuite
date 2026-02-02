/**
 * Détail Compte Bancaire - Vue complète d'un compte
 *
 * Fonctionnalités :
 * - Affichage informations compte (nom, type, devise, solde, institution)
 * - Visualisation solde actuel avec indicateur positif/négatif
 * - Gestion des flux de paiement (CB, chèques, virements, traites)
 * - Navigation rapide vers transactions du compte
 * - Modification du compte (nom, type, institution)
 * - Association portefeuilles et liens directs
 * - Tabs pour organiser vue d'ensemble et flux de paiement
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/finance/api";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { logger } from '@quelyos/logger';
import { Layout } from '@/components/Layout'
import { Breadcrumbs, SkeletonTable } from '@/components/common'
import { PaymentFlowManager } from '@/components/PaymentFlowManager'
import {
  Building2,
  Wallet,
  Edit2,
  ArrowLeftRight,
  PieChart,
  AlertCircle,
  RefreshCw,
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

  const { user, isLoading: authLoading } = useRequireAuth();
  const { currency: globalCurrency } = useCurrency();

  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "flows">("overview");

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
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
          <SkeletonTable rows={5} columns={2} />
        </div>
      </Layout>
    );
  }

  if (error || !account) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <Breadcrumbs
            items={[
              { label: 'Finance', href: '/finance' },
              { label: 'Comptes', href: '/finance/accounts' },
              { label: 'Détail' },
            ]}
          />

          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                {error || "Compte non trouvé"}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Finance', href: '/finance' },
            { label: 'Comptes', href: '/finance/accounts' },
            { label: account.name },
          ]}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30 dark:shadow-emerald-500/20">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{account.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-block rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                  {getTypeLabel(account.type)}
                </span>
                {account.institution && (
                  <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Building2 className="h-3 w-3" />
                    {account.institution}
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    account.status === "ACTIVE"
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {account.status === "ACTIVE" ? "Actif" : "Inactif"}
                </span>
              </div>
            </div>
          </div>

          {/* Solde */}
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Solde</p>
            <p
              className={`text-3xl font-bold ${
                account.balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatCurrency(account.balance, account.currency)}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1">
          {[
            { key: "overview", label: "Vue d'ensemble", icon: PieChart },
            { key: "flows", label: "Flux de paiement", icon: ArrowLeftRight },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                activeTab === key
                  ? "bg-emerald-500 text-white shadow"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
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
            <div className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Informations</h2>

              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span className="text-gray-500 dark:text-gray-400">Type</span>
                  <span className="text-gray-900 dark:text-white">{getTypeLabel(account.type)}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span className="text-gray-500 dark:text-gray-400">Devise</span>
                  <span className="text-gray-900 dark:text-white">{account.currency}</span>
                </div>
                {account.institution && (
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                    <span className="text-gray-500 dark:text-gray-400">Institution</span>
                    <span className="text-gray-900 dark:text-white">{account.institution}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                  <span className="text-gray-500 dark:text-gray-400">Statut</span>
                  <span className="text-gray-900 dark:text-white">
                    {account.status === "ACTIVE" ? "Actif" : "Inactif"}
                  </span>
                </div>
              </div>

              {account.notes && (
                <div className="pt-2">
                  <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">Notes</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{account.notes}</p>
                </div>
              )}

              {/* Portefeuilles liés */}
              {account.portfolios && account.portfolios.length > 0 && (
                <div className="pt-2">
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">Portefeuilles</p>
                  <div className="flex flex-wrap gap-2">
                    {account.portfolios.map(({ portfolio }) => (
                      <Link
                        key={portfolio.id}
                        to={`/finance/portfolios/${portfolio.id}`}
                        className="rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/30 px-3 py-1 text-xs text-violet-700 dark:text-violet-300 transition hover:bg-violet-100 dark:hover:bg-violet-900/50"
                      >
                        {portfolio.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Actions rapides</h2>

              <div className="grid gap-3">
                <Link
                  to={`/finance/expenses?accountId=${account.id}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 transition hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ArrowLeftRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Voir les transactions</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Toutes les opérations de ce compte
                    </p>
                  </div>
                </Link>

                <button
                  onClick={() => setActiveTab("flows")}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 text-left transition hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <PieChart className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Gérer les flux</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      CB, chèques, virements, traites...
                    </p>
                  </div>
                </button>

                <Link
                  to={`/finance/accounts?edit=${account.id}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 transition hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Edit2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Modifier le compte</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Nom, type, institution...
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === "flows" && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <PaymentFlowManager accountId={account.id} accountName={account.name} />
          </div>
        )}
      </div>
    </Layout>
  );
}
