import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, Badge, Skeleton, ConfirmModal, Button } from '@/components/common';
import { useMarketingCampaigns, useDeleteCampaign, useDuplicateCampaign } from '@/hooks/useMarketingCampaigns';
import { useToast } from '@/contexts/ToastContext';
import { logger } from '@quelyos/logger';
import {
  Plus,
  Mail,
  MessageSquare,
  MoreVertical,
  Copy,
  Trash2,
  Eye,
  Search,
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

const getChannelIcon = (channel: string) => {
  if (channel === 'email') {
    return <Mail className="w-4 h-4 text-blue-500" />;
  }
  return <MessageSquare className="w-4 h-4 text-green-500" />;
};

export default function CampaignsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'sms'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const { data, isLoading, error, refetch } = useMarketingCampaigns({
    channel: channelFilter === 'all' ? undefined : channelFilter,
    state: statusFilter || undefined,
  });
  const deleteMutation = useDeleteCampaign();
  const duplicateMutation = useDuplicateCampaign();

  const campaigns = data?.campaigns || [];
  const filteredCampaigns = campaigns.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <Breadcrumbs
            items={[
              { label: 'Accueil', href: '/dashboard' },
              { label: 'Marketing', href: '/marketing' },
              { label: 'Campagnes' },
            ]}
          />
          <div role="alert" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement des campagnes marketing.
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

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success('Campagne supprimée');
      setDeleteId(null);
    } catch {
      logger.error("Erreur attrapée");
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      const newCampaign = await duplicateMutation.mutateAsync(id);
      toast.success('Campagne dupliquée');
      navigate(`/marketing/campaigns/${newCampaign.id}`);
    } catch {
      logger.error("Erreur attrapée");
      toast.error('Erreur lors de la duplication');
    }
    setMenuOpen(null);
  };

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
            { label: 'Campagnes' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Campagnes
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gérez vos campagnes email et SMS
            </p>
          </div>
          <Link
            to="/marketing/campaigns/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nouvelle campagne
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une campagne..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value as 'all' | 'email' | 'sms')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
            >
              <option value="all">Tous les canaux</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="scheduled">Planifiée</option>
              <option value="sent">Envoyée</option>
              <option value="cancelled">Annulée</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Campagne
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Canal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Envoyés
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8">
                      <Skeleton height={200} />
                    </td>
                  </tr>
                ) : filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <p className="text-gray-500 dark:text-gray-400">Aucune campagne trouvée</p>
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <Link
                          to={`/marketing/campaigns/${campaign.id}`}
                          className="font-medium text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400"
                        >
                          {campaign.name}
                        </Link>
                        {campaign.subject && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {campaign.subject}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getChannelIcon(campaign.channel)}
                          <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                            {campaign.channel}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(campaign.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {(campaign.stats?.sent ?? 0) > 0 ? (campaign.stats?.sent ?? 0).toLocaleString('fr-FR') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {campaign.status === 'done' && campaign.channel === 'email' ? (
                          <div className="text-sm">
                            <span className="text-emerald-600 dark:text-emerald-400">{campaign.rates?.open_rate ?? 0}% ouvert</span>
                            <span className="text-gray-400 mx-1">·</span>
                            <span className="text-blue-600 dark:text-blue-400">{campaign.rates?.click_rate ?? 0}% clics</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {campaign.sent_date ? formatDate(campaign.sent_date) : formatDate(campaign.create_date || campaign.create_date || null)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpen(menuOpen === campaign.id ? null : campaign.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {menuOpen === campaign.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                              <Link
                                to={`/marketing/campaigns/${campaign.id}`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => setMenuOpen(null)}
                              >
                                <Eye className="w-4 h-4" />
                                Voir détails
                              </Link>
                              <button
                                onClick={() => handleDuplicate(campaign.id)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
                              >
                                <Copy className="w-4 h-4" />
                                Dupliquer
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteId(campaign.id);
                                  setMenuOpen(null);
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                              >
                                <Trash2 className="w-4 h-4" />
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <ConfirmModal
          isOpen={deleteId !== null}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title="Supprimer la campagne"
          message="Êtes-vous sûr de vouloir supprimer cette campagne ? Cette action est irréversible."
          confirmText="Supprimer"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </Layout>
  );
}
