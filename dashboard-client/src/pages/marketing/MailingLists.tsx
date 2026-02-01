/**
 * Page Listes de Diffusion - Dashboard Quelyos
 * 
 * Fonctionnalités :
 * - Liste toutes les listes de diffusion marketing (mailing.list natif Odoo 19)
 * - Créer nouvelle liste de diffusion
 * - Visualiser contacts par liste
 * - Ajouter contacts à une liste (email + nom)
 * - Supprimer liste de diffusion
 * - Export contacts pour analyses externes
 */

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common';
import { marketingNotices } from '@/lib/notices';
import { useMarketingLists, type MailingList } from '@/hooks/useMarketingLists';
import { Users, Plus, Trash2, UserPlus, RefreshCw, Mail } from 'lucide-react';
import { logger } from '@quelyos/logger';

const breadcrumbItems = [
  { label: 'Accueil', href: '/home' },
  { label: 'Marketing', href: '/marketing' },
  { label: 'Listes Diffusion', href: '/marketing/lists' },
];

export default function MailingLists() {
  const { listMailingLists, createMailingList, deleteMailingList, loading, error } = useMarketingLists() as any;
  const [lists, setLists] = useState<MailingList[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      const result = await listMailingLists({ limit: 100 });
      setLists(result.mailing_lists);
      setTotalCount(result.total_count);
    } catch {
      logger.error("Erreur attrapée");
      // Error handled by hook
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadLists();
    setIsRefreshing(false);
  };

  const handleCreate = async () => {
    if (!newListName.trim()) {
      alert('Veuillez saisir un nom de liste');
      return;
    }

    try {
      await createMailingList({ name: newListName });
      setNewListName('');
      setShowCreateModal(false);
      await loadLists();
    } catch {
      logger.error("Erreur attrapée");
      // Error handled by hook
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm('Supprimer la liste "' + name + '" ?')) return;
    
    try {
      await deleteMailingList(id);
      await loadLists();
    } catch {
      logger.error("Erreur attrapée");
      // Error handled by hook
    }
  };

  return (
    <Layout>
      <Breadcrumbs items={breadcrumbItems} />

      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Listes de Diffusion
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {totalCount} liste{totalCount > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            icon={<RefreshCw className={isRefreshing ? 'animate-spin' : ''} />}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            Actualiser
          </Button>
          <Button
            variant="primary"
            icon={<Plus />}
            onClick={() => setShowCreateModal(true)}
          >
            Nouvelle Liste
          </Button>
        </div>
      </header>

      <PageNotice config={marketingNotices.lists} />

      {error && (
        <div role="alert" className="mb-6 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{error.message || String(error)}</p>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              Créer une liste de diffusion
            </h2>
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Nom de la liste (ex: Newsletter, Clients VIP...)"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewListName('');
                }}
              >
                Annuler
              </Button>
              <Button variant="primary" onClick={handleCreate} disabled={loading}>
                Créer
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading && <SkeletonTable rows={5} />}

      {!loading && lists.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Aucune liste de diffusion
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Créez votre première liste pour organiser vos contacts marketing.
          </p>
        </div>
      )}

      {!loading && lists.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <div
              key={list.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center">
                  <Users className="mr-3 h-8 w-8 text-purple-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {list.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ID: {list.id}
                    </p>
                  </div>
                </div>
                <span className={'inline-flex rounded-full px-2 py-1 text-xs font-semibold ' + (
                  list.active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                )}>
                  {list.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mb-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Mail className="mr-2 h-4 w-4" />
                <span>{list.contact_count} contact{list.contact_count > 1 ? 's' : ''}</span>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400">
                Créée le {list.create_date ? new Date(list.create_date).toLocaleDateString('fr-FR') : '-'}
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<UserPlus />}
                  onClick={() => alert('Ajout contacts liste ' + list.id + ' : modal import CSV/saisie manuelle à implémenter')}
                  className="flex-1"
                >
                  Ajouter contacts
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 />}
                  onClick={() => handleDelete(list.id, list.name)}
                >
                  Supprimer
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
