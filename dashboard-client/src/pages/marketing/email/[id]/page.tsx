/**
 * Page de détail d'une campagne email marketing
 *
 * Fonctionnalités :
 * - Affichage détail campagne (sujet, état, stats)
 * - Envoi campagne (si draft)
 * - Envoi test
 * - Duplication campagne
 * - Suppression campagne
 * - Statistiques détaillées (ouvertures, clics, rebonds)
 */

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, Badge, Skeleton, ConfirmModal, Button } from '@/components/common';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import {
  useMarketingCampaign,
  useSendCampaign,
  useDeleteCampaign,
  useDuplicateCampaign,
  useCampaignStats,
} from '@/hooks/useMarketingCampaigns';
import { useToast } from '@/contexts/ToastContext';
import {
  Mail,
  Send,
  Trash2,
  Copy,
  Eye,
  MousePointer,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
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

export default function EmailCampaignDetailPage() {
  const fallbackDate = useMemo(() => new Date().toISOString(), []);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const campaignId = parseInt(id || '0', 10);

  const { data: campaign, isLoading, error, refetch } = useMarketingCampaign(campaignId);
  const { data: stats } = useCampaignStats(campaignId);
  const { mutate: sendCampaign, isPending: isSending } = useSendCampaign();
  const { mutate: deleteCampaign, isPending: isDeleting } = useDeleteCampaign();
  const { mutate: duplicateCampaign, isPending: isDuplicating } = useDuplicateCampaign();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);

  if (error) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <Breadcrumbs
            items={[
              { label: 'Accueil', href: '/dashboard' },
              { label: 'Marketing', href: '/marketing' },
              { label: 'Campagnes Email', href: '/marketing/email' },
              { label: 'Détail' },
            ]}
          />
          <div role="alert" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement de la campagne email.
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

  const handleSend = () => {
    sendCampaign(campaignId, {
      onSuccess: () => {
        toast.success('Campagne envoyée avec succès');
        setShowSendConfirm(false);
      },
      onError: (err) => {
        toast.error(err.message);
      },
    });
  };

  const handleDelete = () => {
    deleteCampaign(campaignId, {
      onSuccess: () => {
        toast.success('Campagne supprimée');
        navigate('/marketing/email');
      },
      onError: (err) => {
        toast.error(err.message);
      },
    });
  };

  const handleDuplicate = () => {
    duplicateCampaign(campaignId, {
      onSuccess: (newCampaign) => {
        toast.success('Campagne dupliquée');
        navigate(`/marketing/email/${newCampaign.id}`);
      },
      onError: (err) => {
        toast.error(err.message);
      },
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8">
          <Skeleton height={300} />
        </div>
      </Layout>
    );
  }

  if (!campaign) {
    return (
      <Layout>
        <div className="p-12 text-center">
          <Mail className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Campagne non trouvée</p>
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
            { label: 'Campagnes Email', href: '/marketing/email' },
            { label: campaign.subject || 'Campagne' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {campaign.subject || 'Sans objet'}
              </h1>
              {getStatusBadge(campaign.state || 'draft')}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Campagne créée le {new Date(campaign.create_date || fallbackDate).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate('/marketing/email')}
            >
              Retour
            </Button>
            {campaign.state === 'draft' && (
              <Button
                variant="primary"
                size="sm"
                icon={<Send className="w-4 h-4" />}
                onClick={() => setShowSendConfirm(true)}
                loading={isSending}
              >
                Envoyer
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              icon={<Copy className="w-4 h-4" />}
              onClick={handleDuplicate}
              loading={isDuplicating}
            >
              Dupliquer
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
              onClick={() => setShowDeleteModal(true)}
              loading={isDeleting}
            >
              Supprimer
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        {campaign.state === 'done' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Send className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Envoyés</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(stats?.sent ?? 0).toLocaleString('fr-FR')}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Délivrés</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(stats?.delivered ?? 0).toLocaleString('fr-FR')}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Eye className="w-5 h-5 text-violet-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Ouverts</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(stats?.opened ?? 0).toLocaleString('fr-FR')}
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  ({stats?.sent ? ((stats.opened || 0) / stats.sent * 100).toFixed(1) : 0}%)
                </span>
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-2">
                <MousePointer className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Cliqués</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(stats?.clicked ?? 0).toLocaleString('fr-FR')}
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  ({stats?.sent ? ((stats.clicked || 0) / stats.sent * 100).toFixed(1) : 0}%)
                </span>
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Rebonds</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(stats?.bounced ?? 0).toLocaleString('fr-FR')}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Échecs</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(stats?.bounced ?? 0).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        )}

        {/* Contenu Email */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Contenu de l&apos;email
          </h3>
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(campaign.content || '') }} />
          </div>
        </div>

        {/* Modal Confirmation Envoi */}
        <ConfirmModal
          isOpen={showSendConfirm}
          onClose={() => setShowSendConfirm(false)}
          onConfirm={handleSend}
          title="Envoyer la campagne ?"
          message={`Vous êtes sur le point d'envoyer cette campagne email. Cette action est irréversible.`}
          confirmText="Envoyer maintenant"
          isLoading={isSending}
        />

        {/* Modal Confirmation Suppression */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Supprimer la campagne ?"
          message="Cette action est irréversible. Toutes les statistiques seront perdues."
          confirmText="Supprimer"
          isLoading={isDeleting}
          variant="danger"
        />
      </div>
    </Layout>
  );
}
