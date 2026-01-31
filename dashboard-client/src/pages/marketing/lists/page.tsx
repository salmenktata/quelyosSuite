import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, Button, Modal, Input } from '@/components/common';
import { useMarketingLists, useCreateMailingList, useDeleteMailingList } from '@/hooks/useMarketingLists';
import { useToast } from '@/contexts/ToastContext';
import { Plus, Users, Trash2, Mail } from 'lucide-react';

export default function MarketingListsPage() {
  const { data, isLoading } = useMarketingLists();
  const { mutate: createList, isPending: isCreating } = useCreateMailingList();
  const { mutate: deleteList } = useDeleteMailingList();
  const { showToast } = useToast();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');

  const handleCreate = () => {
    if (!newListName.trim()) {
      showToast('Le nom est obligatoire', 'error');
      return;
    }

    createList({ name: newListName }, {
      onSuccess: () => {
        showToast('Liste créée', 'success');
        setShowCreateModal(false);
        setNewListName('');
      },
      onError: (err) => showToast(err.message, 'error'),
    });
  };

  const handleDelete = (listId: number) => {
    if (!confirm('Supprimer cette liste ?')) return;
    deleteList(listId, {
      onSuccess: () => showToast('Liste supprimée', 'success'),
      onError: (err) => showToast(err.message, 'error'),
    });
  };

  const lists = data?.mailing_lists || [];

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/dashboard' },
            { label: 'Marketing', href: '/marketing' },
            { label: 'Listes de Diffusion' },
          ]}
        />

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Users className="w-7 h-7" />
              Listes de Diffusion
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gérez vos segments d&apos;audience
            </p>
          </div>
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
            Nouvelle liste
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoading ? (
            <p>Chargement...</p>
          ) : lists.length === 0 ? (
            <div className="col-span-3 p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Aucune liste</p>
            </div>
          ) : (
            lists.map((list) => (
              <div key={list.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-500" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{list.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {list.contact_count} contacts
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(list.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <Link
                  to={`/marketing/lists/${list.id}`}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Gérer les contacts →
                </Link>
              </div>
            ))
          )}
        </div>

        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nouvelle Liste">
          <div className="space-y-4">
            <Input
              label="Nom de la liste"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Ex: Clients VIP"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Annuler</Button>
              <Button onClick={handleCreate} isLoading={isCreating}>Créer</Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
