/**
 * Page Payouts Designer - Historique des paiements Stripe Connect
 *
 * Fonctionnalités:
 * - Affichage pending_balance du designer
 * - Onboarding Stripe Connect (si non fait)
 * - Historique des revenus (pending/processing/paid/failed)
 * - Lien vers dashboard Stripe Express
 * - Demande de payout manuel (si admin)
 */

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common';
import { storeNotices } from '@/lib/notices';
import { DollarSign, ExternalLink, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { logger } from '@quelyos/logger';
import { tenantFetch } from '@/lib/tenantFetch';

interface StripeConnectStatus {
  onboarding_completed: boolean;
  payouts_enabled: boolean;
  charges_enabled: boolean;
}

interface Revenue {
  id: number;
  amount: number;
  currency_id: [number, string];
  payout_status: 'pending' | 'processing' | 'paid' | 'failed';
  payout_date: string | false;
  payout_reference: string | false;
  payout_error: string | false;
  stripe_transfer_id: string | false;
  create_date: string;
  submission_id: [number, string]; // [id, name]
}

interface Designer {
  id: number;
  display_name: string;
  pending_balance: number;
  stripe_connect_account_id: string | false;
  stripe_onboarding_completed: boolean;
  stripe_payouts_enabled: boolean;
  last_payout_date: string | false;
  currency_id: [number, string];
}

export default function PayoutsPage() {
  const [designer, setDesigner] = useState<Designer | null>(null);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [connectStatus, setConnectStatus] = useState<StripeConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_onboardingUrl, setOnboardingUrl] = useState<string | null>(null);

  const fetchDesignerData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer profil designer
      const designerRes = await tenantFetch(`/api/themes/designers/me`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {},
          id: 1,
        }),
      });

      const designerData = await designerRes.json();

      if (designerData.error || !designerData.result?.success) {
        throw new Error(designerData.error?.message || 'Failed to fetch designer profile');
      }

      setDesigner(designerData.result.designer);

      // Récupérer revenus
      const revenuesRes = await tenantFetch(`/api/themes/designers/revenues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {},
          id: 2,
        }),
      });

      const revenuesData = await revenuesRes.json();

      if (revenuesData.result?.success) {
        setRevenues(revenuesData.result.revenues);
      }

      // Si designer connecté à Stripe, récupérer statut
      if (designerData.result.designer.stripe_connect_account_id) {
        await fetchConnectStatus(designerData.result.designer.id);
      }
    } catch (err) {
      logger.error('[ThemePayouts] Error fetching designer data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDesignerData();
  }, [fetchDesignerData]);

  const fetchConnectStatus = async (designerId: number) => {
    try {
      const res = await tenantFetch(`/api/themes/designers/stripe-connect/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: { designer_id: designerId },
          id: 3,
        }),
      });

      const data = await res.json();

      if (data.result?.success) {
        setConnectStatus({
          onboarding_completed: data.result.onboarding_completed,
          payouts_enabled: data.result.payouts_enabled,
          charges_enabled: data.result.charges_enabled,
        });
      }
    } catch (err) {
      logger.error('[ThemePayouts] Error fetching Stripe Connect status:', err);
    }
  };

  const handleStartOnboarding = async () => {
    if (!designer) return;

    try {
      const res = await tenantFetch(`/api/themes/designers/stripe-connect/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: { designer_id: designer.id },
          id: 4,
        }),
      });

      const data = await res.json();

      if (data.error || !data.result?.success) {
        throw new Error(data.error?.message || data.result?.error || 'Onboarding failed');
      }

      setOnboardingUrl(data.result.account_link_url);

      // Rediriger vers Stripe
      window.location.href = data.result.account_link_url;
    } catch (err) {
      logger.error('[ThemePayouts] Error starting onboarding:', err);
      setError(err instanceof Error ? err.message : 'Onboarding failed');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <Clock className="h-3 w-3 mr-1" />
            En traitement
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            Payé
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="h-3 w-3 mr-1" />
            Échec
          </span>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number, currency: [number, string]) => {
    const currencyCode = currency[1];
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  const formatDate = (dateStr: string | false) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Layout>
        <Breadcrumbs
          items={[
            { label: 'Boutique', href: '/store' },
            { label: 'Thèmes', href: '/store/themes' },
            { label: 'Mes Soumissions', href: '/store/themes/my-submissions' },
            { label: 'Payouts', href: '/store/themes/payouts' },
          ]}
        />
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payouts Designer</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Gestion de vos paiements Stripe Connect
          </p>
        </div>
        <SkeletonTable rows={5} />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Breadcrumbs
          items={[
            { label: 'Boutique', href: '/store' },
            { label: 'Thèmes', href: '/store/themes' },
            { label: 'Mes Soumissions', href: '/store/themes/my-submissions' },
            { label: 'Payouts', href: '/store/themes/payouts' },
          ]}
        />
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payouts Designer</h1>
        </div>
        <div
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          role="alert"
        >
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">Erreur</h3>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!designer) {
    return (
      <Layout>
        <Breadcrumbs
          items={[
            { label: 'Boutique', href: '/store' },
            { label: 'Thèmes', href: '/store/themes' },
            { label: 'Payouts', href: '/store/themes/payouts' },
          ]}
        />
        <PageNotice config={storeNotices['themes.payouts']} />
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Vous devez avoir un profil designer pour accéder aux payouts.
          </p>
          <Link to="/store/themes/submit">
            <Button className="mt-4">
              Devenir Designer
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const needsOnboarding = !designer.stripe_connect_account_id || !connectStatus?.onboarding_completed;

  return (
    <Layout>
      <Breadcrumbs
        items={[
          { label: 'Boutique', href: '/store' },
          { label: 'Thèmes', href: '/store/themes' },
          { label: 'Mes Soumissions', href: '/store/themes/my-submissions' },
          { label: 'Payouts', href: '/store/themes/payouts' },
        ]}
      />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payouts Designer</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Gestion de vos paiements Stripe Connect
          </p>
        </div>
        {!needsOnboarding && (
          <Button
            variant="outline"
            onClick={() =>
              window.open(
                `https://dashboard.stripe.com/express/${designer.stripe_connect_account_id}`,
                '_blank'
              )
            }
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Dashboard Stripe
          </Button>
        )}
      </div>

      <PageNotice config={storeNotices['themes.payouts']} />

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-100 text-sm font-medium">Solde en attente</p>
            <p className="text-4xl font-bold mt-1">
              {formatCurrency(designer.pending_balance, designer.currency_id)}
            </p>
            {designer.last_payout_date && (
              <p className="text-indigo-100 text-sm mt-2">
                Dernier payout : {formatDate(designer.last_payout_date)}
              </p>
            )}
          </div>
          <DollarSign className="h-16 w-16 text-white/30" />
        </div>
      </div>

      {/* Onboarding Stripe Connect */}
      {needsOnboarding && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Stripe Connect requis
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                Pour recevoir vos paiements, vous devez compléter l&apos;onboarding Stripe Connect.
                Ce processus sécurisé vous permet de recevoir directement vos revenus sur votre compte
                bancaire.
              </p>
              <Button onClick={handleStartOnboarding}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Commencer l&apos;onboarding Stripe
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Historique Revenus */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Historique des revenus</h2>
        </div>

        {revenues.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Aucun revenu pour le moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Thème
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date paiement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Référence
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {revenues.map((revenue) => (
                  <tr key={revenue.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDate(revenue.create_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {revenue.submission_id[1]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(revenue.amount, revenue.currency_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(revenue.payout_status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(revenue.payout_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {revenue.payout_reference || '-'}
                      {revenue.payout_error && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{revenue.payout_error}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info payout */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">ℹ️ Informations payouts</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Payouts automatiques tous les 1er du mois (minimum 50 {designer.currency_id[1]})</li>
          <li>Délai de traitement : 2-5 jours ouvrés après déclenchement</li>
          <li>Vous recevez 70% des ventes, la plateforme conserve 30%</li>
          <li>Les frais Stripe sont déduits automatiquement</li>
        </ul>
      </div>
    </Layout>
  );
}
