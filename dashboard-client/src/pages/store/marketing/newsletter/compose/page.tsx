/**
 * Newsletter Compose - Composer un email newsletter
 *
 * Fonctionnalités :
 * - Éditeur WYSIWYG TipTap (formatage, liens, images, variables)
 * - Preview temps réel (Mobile/Tablet/Desktop)
 * - Formulaire métadonnées (sujet, expediteur, preview text)
 * - Sauvegarde brouillon
 * - Envoi test email
 * - Planification envoi
 *
 * @module store/marketing/newsletter/compose
 */

import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button } from '@/components/common'
import { EmailEditor, EmailPreview, SendTestModal, ScheduleModal } from '@/components/newsletter'
import { Save, Send, Clock, Eye } from 'lucide-react'

export default function NewsletterCompose() {
  const [subject, setSubject] = useState('Bienvenue chez Quelyos !')
  const [fromName, setFromName] = useState('Équipe Quelyos')
  const [fromEmail, setFromEmail] = useState('noreply@quelyos.com')
  const [previewText, setPreviewText] = useState('Découvrez nos nouveautés du mois')
  const [htmlBody, setHtmlBody] = useState(`
    <h1>Bienvenue chez Quelyos !</h1>
    <p>Bonjour <strong>{{prenom}}</strong>,</p>
    <p>Nous sommes ravis de vous compter parmi nos abonnés. Vous recevrez désormais nos meilleures offres et nouveautés en exclusivité.</p>
    <h2>Ce qui vous attend :</h2>
    <ul>
      <li>Offres exclusives réservées aux abonnés</li>
      <li>Nouveaux produits en avant-première</li>
      <li>Conseils et astuces de nos experts</li>
    </ul>
    <p>À très bientôt,<br/>L'équipe {{entreprise}}</p>
  `)
  const [showPreview, setShowPreview] = useState(true)
  const [showSendTestModal, setShowSendTestModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)

  const breadcrumbItems = [
    { label: 'Tableau de bord', path: '/store' },
    { label: 'Marketing', path: '/store/marketing/coupons' },
    { label: 'Newsletter', path: '/store/marketing/newsletter/campaigns' },
    { label: 'Composer' }
  ]

  const handleSaveDraft = () => {
    // TODO: API call to save draft
    // logger.info('Sauvegarde brouillon', { subject, fromName, fromEmail, previewText })
  }

  const handleSendTest = () => {
    setShowSendTestModal(true)
  }

  const handleSchedule = () => {
    setShowScheduleModal(true)
  }

  return (
    <Layout>
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Composer un email
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Créez et prévisualisez votre campagne newsletter
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4" />
            {showPreview ? 'Masquer' : 'Afficher'} Preview
          </Button>
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="h-4 w-4" />
            Brouillon
          </Button>
          <Button variant="outline" onClick={handleSendTest}>
            <Send className="h-4 w-4" />
            Envoyer un test
          </Button>
          <Button onClick={handleSchedule}>
            <Clock className="h-4 w-4" />
            Programmer
          </Button>
        </div>
      </div>

      {/* Layout Éditeur + Preview */}
      <div className={`grid gap-6 ${showPreview ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {/* Colonne Éditeur */}
        <div className="space-y-6">
          {/* Métadonnées Email */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informations de l&apos;email
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sujet de l&apos;email *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                  placeholder="Ex: Bienvenue chez Quelyos !"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom expéditeur
                  </label>
                  <input
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email expéditeur
                  </label>
                  <input
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Texte d&apos;aperçu (optionnel)
                </label>
                <input
                  type="text"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                  placeholder="Ex: Découvrez nos nouveautés du mois"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Affiché après le sujet dans la boîte de réception
                </p>
              </div>
            </div>
          </div>

          {/* Éditeur WYSIWYG */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Contenu de l&apos;email
            </h2>
            <EmailEditor
              content={htmlBody}
              onChange={setHtmlBody}
              placeholder="Composez le contenu de votre email..."
              minHeight="500px"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              💡 Utilisez les variables {'{{'} prenom {'}}'}, {'{{'} nom {'}}'},{' '}
              {'{{'} email {'}}'}, {'{{'} entreprise {'}}'} pour personnaliser
            </p>
          </div>
        </div>

        {/* Colonne Preview */}
        {showPreview && (
          <div className="sticky top-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
              <EmailPreview
                subject={subject}
                fromName={fromName}
                fromEmail={fromEmail}
                previewText={previewText}
                htmlBody={htmlBody}
                testData={{
                  prenom: 'Jean',
                  nom: 'Dupont',
                  email: 'jean.dupont@example.com',
                  entreprise: 'Quelyos'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modaux */}
      <SendTestModal
        isOpen={showSendTestModal}
        onClose={() => setShowSendTestModal(false)}
        subject={subject}
        fromName={fromName}
        fromEmail={fromEmail}
        previewHtml={htmlBody}
      />

      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        campaignName={subject}
        recipientCount={0}
      />
    </Layout>
  )
}
