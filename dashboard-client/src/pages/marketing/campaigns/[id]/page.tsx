import { useParams, useNavigate, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, Badge, Skeleton, ConfirmModal } from '@/components/common';
import { useCampaign, useSendCampaign, useDeleteCampaign } from '@/hooks/useMarketingCampaigns';
import { useToast } from '@/contexts/ToastContext';
import { useState } from 'react';
import {
import { logger } from '@quelyos/logger';
  Mail,
  MessageSquare,
  Send,
  Clock,
  Users,
  Eye,
  ArrowLeft,
  Trash2,
  BarChart3,
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
  return <Badge variant={c.variant}>{c.label}</Badge>;
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  const { data: campaign, isLoading } = useCampaign(id ? parseInt(id) : null);
  const sendMutation = useSendCampaign();
  const deleteMutation = useDeleteCampaign();

  const handleSend = async () => {
    if (!campaign) return;
    try {
      await sendMutation.mutateAsync(campaign.id);
      toast.success('Campagne envoyée avec succès');
      setShowSendModal(false);
    } catch {
      logger.error("Erreur attrapée");
      toast.error('Erreur lors de l\'envoi');
    }
  };

  const handleDelete = async () => {
    if (!campaign) return;
    try {
      await deleteMutation.mutateAsync(campaign.id);
      toast.success('Campagne supprimée');
      navigate('/marketing/campaigns');
    } catch {
      logger.error("Erreur attrapée");
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  if (!campaign) {
    return (
      <Layout>
        <div className="p-4 md:p-8">
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Campagne introuvable</p>
            <Link to="/marketing/campaigns" className="text-pink-600 hover:text-pink-700 mt-4 inline-block">
              Retour aux campagnes
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const canSend = campaign.status === 'draft' || campaign.status === 'scheduled';

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/dashboard' },
            { label: 'Marketing', href: '/marketing' },
            { label: 'Campagnes', href: '/marketing/campaigns' },
            { label: campaign.name },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <Link
              to="/marketing/campaigns"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {campaign.name}
                </h1>
                {getStatusBadge(campaign.status)}
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
                {campaign.channel === 'email' ? (
                  <Mail className="w-4 h-4" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
                <span className="capitalize">{campaign.channel}</span>
                <span>·</span>
                <span>Créée le {formatDate(campaign.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {canSend && (
              <button
                onClick={() => setShowSendModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
              >
                <Send className="w-4 h-4" />
                Envoyer
              </button>
            )}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 transition"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats (si envoyée) */}
            {campaign.status === 'sent' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-pink-500" />
                  Statistiques
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {campaign.stats.sent.toLocaleString('fr-FR')}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Envoyés</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {campaign.stats.delivered.toLocaleString('fr-FR')}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Délivrés</div>
                  </div>
                  {campaign.channel === 'email' && (
                    <>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {campaign.rates.open}%
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Taux d'ouverture</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {campaign.rates.click}%
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Taux de clic</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Contenu */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Contenu
              </h3>
              {campaign.channel === 'email' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Objet</label>
                    <p className="text-gray-900 dark:text-white mt-1">{campaign.subject || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Contenu</label>
                    <div
                      className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(campaign.content || '<p>Aucun contenu</p>') }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Message SMS</label>
                  <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {campaign.sms_message || 'Aucun message'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Infos */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Informations
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Destinataires</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {campaign.contact_list_name || 'Aucune liste'}
                      {campaign.recipient_count > 0 && (
                        <span className="text-gray-500 dark:text-gray-400 font-normal">
                          {' '}({campaign.recipient_count})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {campaign.scheduled_date && campaign.status === 'scheduled' && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Planifiée pour</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatDate(campaign.scheduled_date)}
                      </div>
                    </div>
                  </div>
                )}

                {campaign.sent_date && (
                  <div className="flex items-center gap-3">
                    <Send className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Envoyée le</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatDate(campaign.sent_date)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions rapides */}
            {canSend && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowSendModal(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"
                  >
                    <Send className="w-5 h-5 text-pink-500" />
                    <span className="text-gray-900 dark:text-white">Envoyer maintenant</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left">
                    <Eye className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-900 dark:text-white">Aperçu</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <ConfirmModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          onConfirm={handleSend}
          title="Envoyer la campagne"
          message={`Êtes-vous sûr de vouloir envoyer cette campagne à ${campaign.recipient_count} destinataires ?`}
          confirmText="Envoyer"
          isLoading={sendMutation.isPending}
        />

        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
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
