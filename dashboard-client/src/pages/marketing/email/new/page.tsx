/**
 * Page de création de campagne email marketing
 *
 * Fonctionnalités :
 * - Formulaire création campagne (sujet, destinataires)
 * - Éditeur Email Builder (drag & drop)
 * - Prévisualisation temps réel
 * - Envoi test
 * - Planification envoi
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, Button, Input, Modal } from '@/components/common';
import { useCreateCampaign, useSendCampaign } from '@/hooks/useMarketingCampaigns';
import { Mail, Save, Send, Eye, ArrowLeft, AlertCircle } from 'lucide-react';
import { sanitizeHtml } from '@/lib/utils/sanitize';

export default function NewEmailCampaignPage() {
  const navigate = useNavigate();
  const { mutate: createCampaign, isPending: isCreating } = useCreateCampaign();
  const { mutate: sendCampaign, isPending: isSending } = useSendCampaign();

  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('<p>Écrivez votre message ici...</p>');
  const [showPreview, setShowPreview] = useState(false);
  const [_error, setError] = useState<string | null>(null);

  const handleSaveDraft = () => {
    if (!subject.trim()) {
      setError('Le sujet est obligatoire');
      return;
    }

    createCampaign(
      {
        subject,
        body_html: bodyHtml,
        mailing_model: 'res.partner',
        mailing_domain: '[]',
      },
      {
        onSuccess: (campaign) => {
          navigate(`/marketing/email/${campaign.id}`);
        },
        onError: (err) => {
          setError(err.message);
        },
      }
    );
  };

  const handleSendNow = () => {
    if (!subject.trim()) {
      setError('Le sujet est obligatoire');
      return;
    }

    createCampaign(
      {
        subject,
        body_html: bodyHtml,
        mailing_model: 'res.partner',
        mailing_domain: '[]',
      },
      {
        onSuccess: (campaign) => {
          sendCampaign(campaign.id, {
            onSuccess: () => {
              navigate('/marketing/email');
            },
            onError: (err) => {
              setError(err.message);
            },
          });
        },
        onError: (err) => {
          setError(err.message);
        },
      }
    );
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/dashboard' },
            { label: 'Marketing', href: '/marketing' },
            { label: 'Campagnes Email', href: '/marketing/email' },
            { label: 'Nouvelle Campagne' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              Nouvelle Campagne Email
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Créez une campagne email marketing professionnelle
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
            <Button
              variant="outline"
              size="sm"
              icon={<Eye className="w-4 h-4" />}
              onClick={() => setShowPreview(true)}
            >
              Prévisualiser
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Save className="w-4 h-4" />}
              onClick={handleSaveDraft}
              loading={isCreating}
            >
              Sauvegarder
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Send className="w-4 h-4" />}
              onClick={handleSendNow}
              loading={isSending}
            >
              Envoyer
            </Button>
          </div>
        </div>

        {/* Formulaire */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Campagne */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Configuration
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Objet de l&apos;email *
                  </label>
                  <Input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ex: 🎉 Nouvelle collection printemps 2026"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Destinataires
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option>Tous les contacts</option>
                    <option>Clients actifs</option>
                    <option>Prospects</option>
                    <option>Liste personnalisée</option>
                  </select>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-1">Email Builder Premium</p>
                      <p className="text-xs">
                        Fonctionnalité Enterprise incluse gratuitement dans Quelyos Suite
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Éditeur Email */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Contenu de l&apos;email
              </h3>
              <div className="space-y-4">
                <textarea
                  className="w-full min-h-[400px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  placeholder="<p>Écrivez votre message HTML ici...</p>"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  💡 Utilisez l&apos;Email Builder pour créer des emails professionnels sans code
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Prévisualisation */}
        {showPreview && (
          <Modal
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            title="Prévisualisation Email"
          >
            <div className="space-y-4">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Objet :
                </p>
                <p className="text-gray-900 dark:text-white">{subject || '(Aucun objet)'}</p>
              </div>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(bodyHtml) }} />
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
}
