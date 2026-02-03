import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, Badge, Skeleton } from '@/components/common';
import { useMarketingDashboard } from '@/hooks/useMarketingDashboard';
import { useSMSQuota } from '@/hooks/useSMSConfig';
import {
  TrendingUp,
  TrendingDown,
  Mail,
  MessageSquare,
  Users,
  Send,
  Eye,
  MousePointer,
  Plus,
  ArrowRight,
  Megaphone,
} from 'lucide-react';

function KPICard({
  title,
  value,
  variation,
  icon: Icon,
  iconBg,
  loading,
}: {
  title: string;
  value: string | number;
  variation?: number;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <Skeleton height={80} />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {variation !== undefined && variation !== 0 && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${variation > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {variation > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{variation > 0 ? '+' : ''}{variation}%</span>
              <span className="text-gray-400 dark:text-gray-500">vs mois dernier</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${iconBg}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

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

const getChannelBadge = (channel: string) => {
  if (channel === 'email') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
        <Mail className="w-3 h-3" />
        Email
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
      <MessageSquare className="w-3 h-3" />
      SMS
    </span>
  );
};

export default function MarketingDashboard() {
  const { data, isLoading } = useMarketingDashboard();
  const { data: smsQuota } = useSMSQuota();

  const stats = data?.stats;
  const recentCampaigns = data?.recent_campaigns || [];

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/dashboard' },
            { label: 'Marketing' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Quelyos Marketing
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Vue d'ensemble de vos campagnes email et SMS
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/marketing/campaigns/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Nouvelle campagne
            </Link>
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Campagnes actives"
            value={stats?.active_campaigns || 0}
            icon={Megaphone}
            iconBg="bg-pink-500"
            loading={isLoading}
          />
          <KPICard
            title="Emails envoyés ce mois"
            value={stats?.emails_sent?.toLocaleString('fr-FR') || 0}
            variation={stats?.email_variation}
            icon={Mail}
            iconBg="bg-blue-500"
            loading={isLoading}
          />
          <KPICard
            title="SMS envoyés ce mois"
            value={stats?.sms_sent?.toLocaleString('fr-FR') || 0}
            variation={stats?.sms_variation}
            icon={MessageSquare}
            iconBg="bg-green-500"
            loading={isLoading}
          />
          <KPICard
            title="Contacts totaux"
            value={stats?.total_contacts?.toLocaleString('fr-FR') || 0}
            icon={Users}
            iconBg="bg-violet-500"
            loading={isLoading}
          />
        </div>

        {/* Taux moyens */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Emails envoyés</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats?.emails_sent?.toLocaleString('fr-FR') || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Taux d'ouverture moyen</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats?.avg_open_rate || 0}%
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <MousePointer className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Taux de clic moyen</span>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats?.avg_click_rate || 0}%
            </p>
          </div>
        </div>

        {/* Quota SMS */}
        {smsQuota && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quota SMS</h3>
              <Link
                to="/settings/sms"
                className="text-sm text-pink-600 hover:text-pink-700 dark:text-pink-400"
              >
                Configurer
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${Math.min((smsQuota.used / smsQuota.total) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {smsQuota.used} / {smsQuota.total}
              </span>
            </div>
          </div>
        )}

        {/* Campagnes récentes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Campagnes récentes
            </h3>
            <Link
              to="/marketing/campaigns"
              className="text-sm text-pink-600 hover:text-pink-700 dark:text-pink-400 flex items-center gap-1"
            >
              Voir tout
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <div className="p-6">
                <Skeleton height={100} />
              </div>
            ) : recentCampaigns.length === 0 ? (
              <div className="p-12 text-center">
                <Megaphone className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">Aucune campagne</p>
                <Link
                  to="/marketing/campaigns/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Créer votre première campagne
                </Link>
              </div>
            ) : (
              recentCampaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  to={`/marketing/campaigns/${campaign.id}`}
                  className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {campaign.name}
                        </span>
                        <div className="flex items-center gap-2">
                          {getChannelBadge(campaign.channel)}
                          {getStatusBadge(campaign.status)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {(campaign.stats?.sent ?? 0) > 0 ? (
                          <span>{campaign.stats?.sent} envoyés</span>
                        ) : (
                          <span>{campaign.recipient_count ?? 0} destinataires</span>
                        )}
                      </div>
                      {campaign.status === 'done' && campaign.channel === 'email' && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {campaign.rates?.open_rate ?? 0}% ouvert · {campaign.rates?.click_rate ?? 0}% clics
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/marketing/email"
            className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition group"
          >
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition">
              <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Campagnes Email</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Newsletters et promotions</p>
            </div>
          </Link>
          <Link
            to="/marketing/sms"
            className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 transition group"
          >
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition">
              <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Campagnes SMS</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Messages directs</p>
            </div>
          </Link>
          <Link
            to="/marketing/contacts"
            className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 transition group"
          >
            <div className="p-3 rounded-lg bg-violet-100 dark:bg-violet-900/30 group-hover:bg-violet-200 dark:group-hover:bg-violet-900/50 transition">
              <Users className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Listes de contacts</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">Segments et audiences</p>
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
