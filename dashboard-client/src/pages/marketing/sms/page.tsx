import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, Badge, Skeleton, Button } from '@/components/common';
import { useMarketingCampaigns } from '@/hooks/useMarketingCampaigns';
import { useSMSQuota } from '@/hooks/useSMSConfig';
import {
  Plus,
  MessageSquare,
  Send,
  ArrowRight,
  Settings,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const getStatusBadge = (status: string) => {
  const config: Record<string, { label: string; variant: 'neutral' | 'warning' | 'success' | 'error' | 'info' }> = {
    draft: { label: 'Brouillon', variant: 'neutral' },
    scheduled: { label: 'Planifiée', variant: 'info' },
    sending: { label: 'En cours', variant: 'warning' },
    sent: { label: 'Envoyée', variant: 'success' },
    cancelled: { label: 'Annulée', variant: 'error' },
  };
  const c = config[status] || { label: status, variant: 'neutral' };
  return <Badge variant={c.variant} size="sm">{c.label}</Badge>;
};

export default function SMSCampaignsPage() {
  const { data, isLoading, error, refetch } = useMarketingCampaigns({ channel: 'sms' });
  const { data: smsQuota } = useSMSQuota();

  const campaigns = data?.campaigns || [];
  const sentCampaigns = campaigns.filter((c) => c.status === 'done');
  const totalSMS = sentCampaigns.reduce((sum, c) => sum + (c.stats?.sent ?? 0), 0);
  const totalDelivered = sentCampaigns.reduce((sum, c) => sum + (c.stats?.delivered ?? 0), 0);
  const deliveryRate = totalSMS > 0 ? (totalDelivered / totalSMS) * 100 : 0;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  if (error) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <Breadcrumbs
            items={[
              { label: 'Accueil', href: '/dashboard' },
              { label: 'Marketing', href: '/marketing' },
              { label: 'Campagnes SMS' },
            ]}
          />
          <div role="alert" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement des campagnes SMS.
              </p>
              <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => refetch()}>
                Réessayer
              </Button>
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
            { label: 'Accueil', href: '/dashboard' },
            { label: 'Marketing', href: '/marketing' },
            { label: 'Campagnes SMS' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              Campagnes SMS
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Messages directs à vos contacts
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/settings/sms"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
            >
              <Settings className="w-4 h-4" />
              Configuration SMS
            </Link>
            <Link
              to="/marketing/campaigns/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Nouvelle campagne SMS
            </Link>
          </div>
        </div>

        {/* Quota SMS */}
        {smsQuota && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Quota SMS mensuel</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {smsQuota.used} / {smsQuota.total} utilisés
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  smsQuota.used / smsQuota.total > 0.9
                    ? 'bg-red-500'
                    : smsQuota.used / smsQuota.total > 0.7
                    ? 'bg-orange-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min((smsQuota.used / smsQuota.total) * 100, 100)}%` }}
              />
            </div>
            {smsQuota.used / smsQuota.total > 0.9 && (
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                Attention : quota presque atteint
              </p>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Campagnes SMS</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{campaigns.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Send className="w-5 h-5 text-emerald-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">SMS envoyés</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSMS.toLocaleString('fr-FR')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Taux de délivrabilité</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{deliveryRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* Liste des campagnes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Toutes les campagnes SMS
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <div className="p-6">
                <Skeleton height={200} />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">Aucune campagne SMS</p>
                <Link
                  to="/marketing/campaigns/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Créer une campagne
                </Link>
              </div>
            ) : (
              campaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  to={`/marketing/campaigns/${campaign.id}`}
                  className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {campaign.name}
                        </span>
                        {getStatusBadge(campaign.status)}
                      </div>
                      {campaign.sms_message && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate max-w-md">
                          {campaign.sms_message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-6 ml-4">
                      {campaign.status === 'done' && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {(campaign.stats?.sent ?? 0).toLocaleString('fr-FR')} envoyés
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {campaign.stats?.delivered ?? 0} délivrés
                          </div>
                        </div>
                      )}
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(campaign.sent_date || campaign.create_date || null)}
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
