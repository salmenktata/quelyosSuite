/**
 * EmailTemplatePreview - Preview des emails transactionnels
 *
 * Composant réutilisable pour prévisualiser les emails
 * envoyés aux clients (confirmation, expédition, newsletter, etc.)
 *
 * Features :
 * - Device toggle (mobile/desktop)
 * - Preview HTML avec variables remplacées
 * - Mode clair/sombre
 * - Métadonnées email (subject, from, to)
 *
 * @module components/common
 */

import { PreviewPanel, DeviceToggle } from '@quelyos/preview-components'
import { useState } from 'react'
import { Mail } from 'lucide-react'

interface EmailTemplatePreviewProps {
  /** Sujet de l'email */
  subject: string
  /** Expéditeur (nom ou email) */
  from?: string
  /** Destinataire (nom ou email) */
  to?: string
  /** Contenu HTML de l'email */
  htmlContent: string
  /** Variables à remplacer dans le template */
  variables?: Record<string, string>
  /** Titre de la section preview */
  title?: string
  /** Description additionnelle */
  description?: string
}

export function EmailTemplatePreview({
  subject,
  from = 'noreply@votreboutique.com',
  to = 'client@exemple.com',
  htmlContent,
  variables = {},
  title = 'Preview Email',
  description,
}: EmailTemplatePreviewProps) {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  // Remplacer les variables dans le contenu HTML
  const processedContent = Object.entries(variables).reduce(
    (content, [key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}|\\$\\{${key}\\}`, 'g')
      return content.replace(regex, value)
    },
    htmlContent
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="w-5 h-5" />
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
          )}
        </div>
        <DeviceToggle device={device} onDeviceChange={setDevice} />
      </div>

      {/* Preview Panel */}
      <PreviewPanel device={device}>
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-4">
          <div className="max-w-2xl mx-auto">
            {/* Email Container */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              {/* Email Header */}
              <div className="bg-gray-100 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="space-y-2 text-sm">
                  <div className="flex">
                    <span className="font-medium text-gray-700 dark:text-gray-300 w-16">De :</span>
                    <span className="text-gray-900 dark:text-white">{from}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-700 dark:text-gray-300 w-16">À :</span>
                    <span className="text-gray-900 dark:text-white">{to}</span>
                  </div>
                  <div className="flex">
                    <span className="font-medium text-gray-700 dark:text-gray-300 w-16">Sujet :</span>
                    <span className="text-gray-900 dark:text-white font-medium">{subject}</span>
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div
                className="px-6 py-8 prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: processedContent }}
              />

              {/* Email Footer */}
              <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Cet email a été envoyé automatiquement par votre boutique en ligne.
                  <br />
                  Pour toute question, contactez le support client.
                </p>
              </div>
            </div>
          </div>
        </div>
      </PreviewPanel>

      {/* Variables utilisées */}
      {Object.keys(variables).length > 0 && (
        <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Variables remplacées
          </h4>
          <div className="space-y-1">
            {Object.entries(variables).map(([key, value]) => (
              <div key={key} className="flex text-xs">
                <code className="text-gray-600 dark:text-gray-400 font-mono">
                  {`{{${key}}}`}
                </code>
                <span className="mx-2 text-gray-400 dark:text-gray-600">→</span>
                <span className="text-gray-900 dark:text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notice informative */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Preview temps réel</strong> : Cette prévisualisation montre comment l&apos;email
          apparaîtra dans la boîte de réception de vos clients. Les variables sont remplacées
          automatiquement avec les données réelles.
        </p>
      </div>
    </div>
  )
}
