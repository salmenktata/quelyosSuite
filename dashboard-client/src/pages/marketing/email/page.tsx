import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, Badge, Skeleton } from '@/components/common';
import { useMarketingCampaigns } from '@/hooks/useMarketingCampaigns';
import {
  Plus,
  Mail,
  Eye,
  MousePointer,
  Send,
  ArrowRight,
} from 'lucide-react';

const getStatusBadge = (status: string) => {
  const config: Record<string, { label: string; variant: 'neutral' | 'warning' | 'success' | 'error' | 'info' }> = {
    draft: { label: 'Brouillon', variant: 'neutral' },
    in_queue: { label: 'En file', variant: 'info' },
    sending: { label: 'En cours', variant: 'warning' },
    done: { label: 'Envoyée', variant: 'success' },
  };
  const c = config[status] || { label: status, variant: 'neutral' };
  return <Badge variant={c.variant} size="sm">{c.label}</Badge>;
};

export default function EmailCampaignsPage() {
  const { data, isLoading } = useMarketingCampaigns();

  const campaigns = data?.campaigns || [];
  const sentCampaigns = campaigns.filter((c) => c.state === 'done');
  const totalEmails = sentCampaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0);
  const totalOpened = sentCampaigns.reduce((sum, c) => sum + (c.stats?.opened || 0), 0);
  const totalClicked = sentCampaigns.reduce((sum, c) => sum + (c.stats?.clicked || 0), 0);
  const avgOpenRate = totalEmails > 0 ? (totalOpened / totalEmails * 100) : 0;
  const avgClickRate = totalEmails > 0 ? (totalClicked / totalEmails * 100) : 0;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/dashboard' },
            { label: 'Marketing', href: '/marketing' },
            { label: 'Campagnes Email' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              Campagnes Email
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Newsletters, promotions et emails marketing
            </p>
          </div>
          <Link
            to="/marketing/email/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nouvelle campagne email
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Campagnes email</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{campaigns.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Send className="w-5 h-5 text-emerald-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Emails envoyés</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalEmails.toLocaleString('fr-FR')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="w-5 h-5 text-violet-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Taux d&apos;ouverture moyen</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgOpenRate.toFixed(1)}%</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <MousePointer className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Taux de clic moyen</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgClickRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* Liste des campagnes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Toutes les campagnes email
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <div className="p-6">
                <Skeleton height={200} />
              </div>
            ) : campaigns.length === 0 ? (
              <div className="p-12 text-center">
                <Mail className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">Aucune campagne email</p>
                <Link
                  to="/marketing/email/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Créer une campagne
                </Link>
              </div>
            ) : (
              campaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  to={`/marketing/email/${campaign.id}`}
                  className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900 dark:text-white truncate">
                          {campaign.subject}
                        </span>
                        {getStatusBadge(campaign.state || 'draft')}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 ml-4">
                      {campaign.state === 'done' && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {(campaign.stats?.sent || 0).toLocaleString('fr-FR')} envoyés
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {campaign.stats?.sent ? (((campaign.stats.opened || 0) / campaign.stats.sent) * 100).toFixed(1) : 0}% ouvert · {campaign.stats?.sent ? (((campaign.stats.clicked || 0) / campaign.stats.sent) * 100).toFixed(1) : 0}% clics
                          </div>
                        </div>
                      )}
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(campaign.create_date || null)}
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
