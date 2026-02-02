/**
 * Page Campagnes Marketing - Dashboard Quelyos
 * 
 * Fonctionnalités :
 * - Liste toutes les campagnes marketing (mass_mailing natif Odoo 19)
 * - Créer nouvelle campagne (sujet, contenu HTML, modèle cible, domaine)
 * - Envoyer campagne ou tester sur email
 * - Visualiser statistiques (envoyés, livrés, ouverts, clics, bounces)
 * - Filtrer par état (brouillon, en file, envoi, terminé)
 * - Supprimer campagnes brouillon
 */

import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common';
import { marketingNotices } from '@/lib/notices';
import { useMarketingCampaigns, useSendCampaign, useDeleteCampaign } from '@/hooks/useMarketingCampaigns';
import { Mail, Plus, Send, Trash2, BarChart3, RefreshCw } from 'lucide-react';
import { logger } from '@quelyos/logger';

const breadcrumbItems = [
  { label: 'Accueil', href: '/home' },
  { label: 'Marketing', href: '/marketing' },
  { label: 'Campagnes', href: '/marketing/campaigns' },
];

const stateLabels: Record<string, string> = {
  draft: 'Brouillon',
  in_queue: 'En file',
  sending: 'Envoi en cours',
  done: 'Terminé',
};

const stateColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  in_queue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  sending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  done: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export default function MarketingCampaigns() {
  const [stateFilter, setStateFilter] = useState<string>('');

  const { data, isLoading, error, refetch } = useMarketingCampaigns({
    state: stateFilter || undefined,
    limit: 100
  });
  const sendCampaignMutation = useSendCampaign();
  const deleteCampaignMutation = useDeleteCampaign();

  const campaigns = data?.campaigns || [];
  const totalCount = data?.total_count || 0;

  const handleRefresh = async () => {
    await refetch();
  };

  const handleSend = async (id: number) => {
    if (!confirm('Confirmer envoi de la campagne ?')) return;

    try {
      await sendCampaignMutation.mutateAsync(id);
    } catch (_err) {
      logger.error("Erreur lors de l'envoi de la campagne:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette campagne ?')) return;

    try {
      await deleteCampaignMutation.mutateAsync(id);
    } catch (_err) {
      logger.error("Erreur lors de la suppression de la campagne:", err);
    }
  };

  return (
    <Layout>
      <Breadcrumbs items={breadcrumbItems} />

      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Campagnes Marketing
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {totalCount} campagne{totalCount > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            icon={<RefreshCw className={isLoading ? 'animate-spin' : ''} />}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            Actualiser
          </Button>
          <Button
            variant="primary"
            icon={<Plus />}
            onClick={() => alert('Création campagne : modal éditeur HTML à implémenter')}
          >
            Nouvelle Campagne
          </Button>
        </div>
      </header>

      <PageNotice config={marketingNotices.campaigns} />

      {error && (
        <div role="alert" className="mb-6 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{error.message || String(error)}</p>
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {['', 'draft', 'in_queue', 'sending', 'done'].map((state) => (
          <button
            key={state}
            onClick={() => setStateFilter(state)}
            className={'rounded-lg px-4 py-2 text-sm font-medium transition ' + (
              stateFilter === state
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            )}
          >
            {state === '' ? 'Tout' : stateLabels[state]}
          </button>
        ))}
      </div>

      {isLoading && <SkeletonTable rows={5} />}

      {!isLoading && campaigns.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <Mail className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Aucune campagne
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Créez votre première campagne marketing pour commencer.
          </p>
        </div>
      )}

      {!isLoading && campaigns.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Sujet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  État
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Statistiques
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Date création
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <Mail className="mr-3 h-5 w-5 text-purple-600" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {campaign.subject}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {campaign.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={'inline-flex rounded-full px-2 py-1 text-xs font-semibold ' + (campaign.state ? stateColors[campaign.state] : '')}>
                      {campaign.state ? stateLabels[campaign.state] : 'Inconnu'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div>Envoyés: {campaign.stats?.sent ?? 0}</div>
                      <div>Ouverts: {campaign.stats?.opened ?? 0} ({(campaign.stats?.sent ?? 0) > 0 ? Math.round(((campaign.stats?.opened ?? 0) / (campaign.stats?.sent ?? 1)) * 100) : 0}%)</div>
                      <div>Clics: {campaign.stats?.clicked ?? 0} ({(campaign.stats?.sent ?? 0) > 0 ? Math.round(((campaign.stats?.clicked ?? 0) / (campaign.stats?.sent ?? 1)) * 100) : 0}%)</div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {campaign.create_date ? new Date(campaign.create_date).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {campaign.state === 'draft' && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Send />}
                          onClick={() => handleSend(campaign.id)}
                        >
                          Envoyer
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<BarChart3 />}
                        onClick={() => alert('Stats campagne ' + campaign.id + ' : à implémenter')}
                      >
                        Stats
                      </Button>
                      {campaign.state === 'draft' && (
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<Trash2 />}
                          onClick={() => handleDelete(campaign.id)}
                        >
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
