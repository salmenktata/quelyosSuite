/**
 * EmailPreview - Preview d'email newsletter
 *
 * Affiche le rendu de l'email avec :
 * - Toggle Mobile / Desktop
 * - Remplacement variables avec données test
 * - Header email (De, Sujet, Preview text)
 * - Responsive et dark mode
 *
 * @component
 */

import { useState } from 'react'
import { Monitor, Smartphone, Tablet } from 'lucide-react'
import { PreviewPanel, DeviceToggle, LiveIndicator } from '@quelyos/preview-components'

interface EmailPreviewProps {
  subject: string
  fromName: string
  fromEmail: string
  previewText?: string
  htmlBody: string
  testData?: {
    prenom?: string
    nom?: string
    email?: string
    entreprise?: string
  }
}

export function EmailPreview({
  subject,
  fromName,
  fromEmail,
  previewText = '',
  htmlBody,
  testData = {
    prenom: 'Jean',
    nom: 'Dupont',
    email: 'jean.dupont@example.com',
    entreprise: 'Quelyos'
  }
}: EmailPreviewProps) {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  // Remplacer les variables par les données de test
  const processedHtml = htmlBody
    .replace(/\{\{prenom\}\}/g, testData.prenom || 'Prénom')
    .replace(/\{\{nom\}\}/g, testData.nom || 'Nom')
    .replace(/\{\{email\}\}/g, testData.email || 'email@example.com')
    .replace(/\{\{entreprise\}\}/g, testData.entreprise || 'Entreprise')

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <LiveIndicator />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Preview Email
          </span>
        </div>
        <DeviceToggle device={device} onChange={setDevice} />
      </div>

      {/* Preview Container */}
      <div className="flex-1 overflow-auto p-6">
        <PreviewPanel device={device}>
          <div className="bg-white dark:bg-gray-800 h-full overflow-auto">
            {/* Email Header (simulé client email) */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
              <div className="mb-2">
                <div className="text-xs text-gray-500 dark:text-gray-400">De:</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {fromName} &lt;{fromEmail}&gt;
                </div>
              </div>
              <div className="mb-2">
                <div className="text-xs text-gray-500 dark:text-gray-400">Sujet:</div>
                <div className="text-base font-bold text-gray-900 dark:text-white">
                  {subject}
                </div>
              </div>
              {previewText && (
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Texte d&apos;aperçu:
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 italic">
                    {previewText}
                  </div>
                </div>
              )}
            </div>

            {/* Email Body */}
            <div className="p-6">
              {htmlBody ? (
                <div
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: processedHtml }}
                />
              ) : (
                <div className="text-center py-12 text-gray-400 dark:text-gray-600">
                  <p>Aucun contenu à prévisualiser</p>
                  <p className="text-sm mt-2">Composez votre email dans l&apos;éditeur</p>
                </div>
              )}
            </div>

            {/* Email Footer (simulé) */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Vous recevez cet email car vous êtes abonné à notre newsletter.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <a href="#" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                  Se désabonner
                </a>
                {' · '}
                <a href="#" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                  Mettre à jour mes préférences
                </a>
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-4">
                © 2026 {testData.entreprise || 'Quelyos'}. Tous droits réservés.
              </p>
            </div>
          </div>
        </PreviewPanel>
      </div>

      {/* Device Info */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            {device === 'mobile' && <Smartphone className="h-3 w-3" />}
            {device === 'tablet' && <Tablet className="h-3 w-3" />}
            {device === 'desktop' && <Monitor className="h-3 w-3" />}
            <span>
              {device === 'mobile' && '375px (iPhone)'}
              {device === 'tablet' && '768px (iPad)'}
              {device === 'desktop' && '100% (Desktop)'}
            </span>
          </div>
          <div>
            Variables remplacées :{' '}
            <span className="font-mono text-indigo-600 dark:text-indigo-400">
              {testData.prenom}
            </span>
            ,{' '}
            <span className="font-mono text-indigo-600 dark:text-indigo-400">
              {testData.email}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
