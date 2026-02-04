/**
 * SendTestModal - Modal envoi test email
 *
 * Fonctionnalités :
 * - Saisie email destinataire test
 * - Validation format email
 * - Aperçu données qui seront envoyées
 * - Intégration API send test
 *
 * @component
 */

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X, Mail, Send } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/common'

interface SendTestModalProps {
  isOpen: boolean
  onClose: () => void
  campaignId?: number
  subject: string
  fromName: string
  fromEmail: string
  previewHtml?: string
}

export function SendTestModal({
  isOpen,
  onClose,
  campaignId,
  subject,
  fromName,
  fromEmail,
  previewHtml
}: SendTestModalProps) {
  const [testEmail, setTestEmail] = useState('')
  const [emailError, setEmailError] = useState('')

  const sendTestMutation = useMutation({
    mutationFn: async (email: string) => {
      if (campaignId) {
        // Si campagne existante, utiliser endpoint send-test
        const response = await api.post(
          `/api/admin/newsletter/campaigns/${campaignId}/send-test`,
          { test_email: email }
        )
        return response.data
      } else {
        // Sinon, envoyer test avec données temporaires
        const response = await api.post('/api/admin/newsletter/campaigns/send-test-preview', {
          test_email: email,
          subject,
          from_name: fromName,
          from_email: fromEmail,
          html_body: previewHtml || ''
        })
        return response.data
      }
    },
    onSuccess: () => {
      setTestEmail('')
      onClose()
    }
  })

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  const handleEmailChange = (value: string) => {
    setTestEmail(value)
    if (emailError) {
      setEmailError('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!testEmail.trim()) {
      setEmailError('Email requis')
      return
    }

    if (!validateEmail(testEmail)) {
      setEmailError('Format email invalide')
      return
    }

    sendTestMutation.mutate(testEmail)
  }

  const handleClose = () => {
    setTestEmail('')
    setEmailError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg rounded-lg bg-white dark:bg-gray-800 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Envoyer un email de test
            </h2>
            <button
              onClick={handleClose}
              className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Info */}
            <div className="mb-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
              <div className="flex gap-3">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Aperçu de l&apos;email de test</p>
                  <p className="text-xs">
                    <strong>De :</strong> {fromName} &lt;{fromEmail}&gt;
                  </p>
                  <p className="text-xs">
                    <strong>Sujet :</strong> {subject}
                  </p>
                </div>
              </div>
            </div>

            {/* Email input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Adresse email de test *
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="votre.email@example.com"
                className={`w-full rounded-lg border ${
                  emailError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'
                } bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:ring-1 dark:text-white`}
              />
              {emailError && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{emailError}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                L&apos;email sera envoyé uniquement à cette adresse
              </p>
            </div>

            {/* Success message */}
            {sendTestMutation.isSuccess && (
              <div className="mt-4 rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ Email de test envoyé avec succès !
                </p>
              </div>
            )}

            {/* Error message */}
            {sendTestMutation.isError && (
              <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  Erreur lors de l&apos;envoi de l&apos;email de test
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={sendTestMutation.isPending}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={sendTestMutation.isPending || !testEmail.trim()}>
                {sendTestMutation.isPending ? (
                  'Envoi en cours...'
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Envoyer le test
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
