import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, Badge, Skeleton, ConfirmModal } from '@/components/common';
import { useContactList, useDeleteContactList } from '@/hooks/useContactLists';
import { useToast } from '@/contexts/ToastContext';
import { useState } from 'react';
import {
import { logger } from '@quelyos/logger';
  Users,
  Mail,
  Phone,
  ArrowLeft,
  Trash2,
  Send,
  Calendar,
  Filter,
} from 'lucide-react';

export default function ContactListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const listId = id ? parseInt(id, 10) : null;
  const { data: list, isLoading } = useContactList(listId);
  const deleteMutation = useDeleteContactList();

  const handleDelete = async () => {
    if (!listId) return;
    try {
      await deleteMutation.mutateAsync(listId);
      toast.success('Liste supprimée');
      navigate('/marketing/contacts');
    } catch {
      logger.error("Erreur attrapée");
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8">
          <Skeleton height={400} />
        </div>
      </Layout>
    );
  }

  if (!list) {
    return (
      <Layout>
        <div className="p-4 md:p-8">
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Liste introuvable</p>
            <Link
              to="/marketing/contacts"
              className="text-pink-600 hover:text-pink-700 text-sm mt-2 inline-block"
            >
              Retour aux listes
            </Link>
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
            { label: 'Contacts', href: '/marketing/contacts' },
            { label: list.name },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/marketing/contacts')}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {list.name}
                </h1>
                <Badge variant={list.list_type === 'dynamic' ? 'info' : 'neutral'} size="sm">
                  {list.list_type === 'dynamic' ? 'Dynamique' : 'Statique'}
                </Badge>
              </div>
              {list.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {list.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              to={`/marketing/campaigns/new?list=${list.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition text-sm font-medium"
            >
              <Send className="w-4 h-4" />
              Créer campagne
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {list.contact_count}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Contacts</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(list.created_at)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Date création</p>
              </div>
            </div>
          </div>

          {list.list_type === 'dynamic' && list.filter_domain && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Filter className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                    {list.filter_domain}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Filtre dynamique</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contacts list */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Contacts ({list.contact_count})
            </h2>
          </div>

          {list.contacts && list.contacts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Téléphone
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {list.contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {contact.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {contact.email || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {contact.mobile || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {list.list_type === 'dynamic'
                  ? 'La liste sera mise à jour automatiquement selon les filtres'
                  : 'Aucun contact dans cette liste'}
              </p>
            </div>
          )}
        </div>

        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Supprimer la liste"
          message={`Êtes-vous sûr de vouloir supprimer la liste "${list.name}" ? Les contacts ne seront pas supprimés.`}
          confirmText="Supprimer"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </Layout>
  );
}
