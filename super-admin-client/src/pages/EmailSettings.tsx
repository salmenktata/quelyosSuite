/**
 * Configuration Email SMTP/Brevo
 *
 * Fonctionnalités :
 * - Afficher serveurs SMTP configurés
 * - Créer/Éditer serveur SMTP (générique ou Brevo)
 * - Activer/Désactiver serveur SMTP rapidement
 * - Tester envoi email
 * - Presets pour Gmail, Outlook, Brevo, SendGrid
 * - Supprimer serveur SMTP
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Mail,
  Plus,
  Trash2,
  Send,
  Server,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Check,
  X,
  Power,
} from 'lucide-react'
import { api } from '@/lib/api/gateway'
import { EmailServerListSchema, EmailTestSchema, validateApiResponse } from '@/lib/validators'
import type { EmailServer } from '@/lib/validators'
import { ConfirmModal } from '@/components/common/ConfirmModal'
import { useToast } from '@/hooks/useToast'

type EmailPreset = {
  name: string
  smtp_host: string
  smtp_port: number
  smtp_encryption: 'starttls' | 'ssl' | 'none'
  smtp_authentication: 'login' | 'plain' | 'cram-md5'
  description: string
}

const EMAIL_PRESETS: Record<string, EmailPreset> = {
  brevo: {
    name: 'Brevo (Sendinblue)',
    smtp_host: 'smtp-relay.brevo.com',
    smtp_port: 587,
    smtp_encryption: 'starttls',
    smtp_authentication: 'login',
    description: 'Service professionnel d\'emailing transactionnel',
  },
  gmail: {
    name: 'Gmail',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_encryption: 'starttls',
    smtp_authentication: 'login',
    description: 'Utiliser un App Password (pas le mot de passe Gmail)',
  },
  outlook: {
    name: 'Outlook/Office 365',
    smtp_host: 'smtp.office365.com',
    smtp_port: 587,
    smtp_encryption: 'starttls',
    smtp_authentication: 'login',
    description: 'Compatible Office 365 Business et Personnel',
  },
  sendgrid: {
    name: 'SendGrid',
    smtp_host: 'smtp.sendgrid.net',
    smtp_port: 587,
    smtp_encryption: 'starttls',
    smtp_authentication: 'login',
    description: 'Service cloud de Twilio (utiliser API Key comme password)',
  },
}

export function EmailSettings() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editingServer, setEditingServer] = useState<EmailServer | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EmailServer | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [showTestModal, setShowTestModal] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string>('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: '',
    smtp_encryption: 'starttls' as 'starttls' | 'ssl' | 'none',
    smtp_authentication: 'login' as 'login' | 'plain' | 'cram-md5',
    from_filter: '',
    active: true,
    sequence: 10,
  })

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ['email-servers'],
    queryFn: async () => {
      const response = await api.request<{ success: boolean; data: EmailServer[] }>({
        method: 'GET',
        path: '/api/super-admin/settings/email',
      })
      // L'API retourne { success: true, data: [...] }, on extrait data
      const apiData = response.data as { success: boolean; data: EmailServer[] }
      return validateApiResponse(EmailServerListSchema, apiData.data)
    },
  })

  const saveServer = useMutation({
    mutationFn: async (payload: typeof formData & { id?: number }) => {
      return api.request({
        method: 'POST',
        path: '/api/super-admin/settings/email',
        body: payload,
      })
    },
    onSuccess: () => {
      toast.success(editingServer ? 'Serveur mis à jour' : 'Serveur créé')
      setShowForm(false)
      setEditingServer(null)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['email-servers'] })
    },
    onError: () => {
      toast.error('Erreur lors de la sauvegarde')
    },
  })

  const deleteServer = useMutation({
    mutationFn: async (id: number) => {
      return api.request({
        method: 'DELETE',
        path: `/api/super-admin/settings/email/${id}`,
      })
    },
    onSuccess: () => {
      toast.success('Serveur supprimé')
      setDeleteTarget(null)
      queryClient.invalidateQueries({ queryKey: ['email-servers'] })
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    },
  })

  const toggleServerActive = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const server = servers.find((s) => s.id === id)
      if (!server) throw new Error('Serveur introuvable')

      return api.request({
        method: 'POST',
        path: '/api/super-admin/settings/email',
        body: {
          ...server,
          active,
        },
      })
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.active ? 'Serveur activé' : 'Serveur désactivé')
      queryClient.invalidateQueries({ queryKey: ['email-servers'] })
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })

  const testEmailServer = useMutation({
    mutationFn: async ({ email_to, server_id }: { email_to: string; server_id?: number }) => {
      const response = await api.request<{ success: boolean; message?: string; error?: string }>({
        method: 'POST',
        path: '/api/super-admin/settings/email/test',
        body: { email_to, server_id },
      })
      return validateApiResponse(EmailTestSchema, response)
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message || 'Email de test envoyé')
        setShowTestModal(false)
        setTestEmail('')
      } else {
        toast.error(result.error || 'Échec envoi email')
      }
    },
    onError: () => {
      toast.error('Erreur lors du test')
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      smtp_host: '',
      smtp_port: 587,
      smtp_user: '',
      smtp_pass: '',
      smtp_encryption: 'starttls',
      smtp_authentication: 'login',
      from_filter: '',
      active: true,
      sequence: 10,
    })
    setShowPassword(false)
    setSelectedPreset('')
  }

  const handleEdit = (server: EmailServer) => {
    setEditingServer(server)
    setFormData({
      name: server.name,
      smtp_host: server.smtp_host,
      smtp_port: server.smtp_port,
      smtp_user: server.smtp_user || '',
      smtp_pass: '', // Ne jamais pré-remplir le password
      smtp_encryption: server.smtp_encryption,
      smtp_authentication: server.smtp_authentication || 'login',
      from_filter: server.from_filter || '',
      active: server.active ?? true,
      sequence: server.sequence || 10,
    })
    setShowForm(true)
  }

  const handlePresetChange = (presetKey: string) => {
    if (!presetKey) {
      setSelectedPreset('')
      return
    }

    setSelectedPreset(presetKey)
    const preset = EMAIL_PRESETS[presetKey]
    if (preset) {
      setFormData({
        ...formData,
        name: preset.name,
        smtp_host: preset.smtp_host,
        smtp_port: preset.smtp_port,
        smtp_encryption: preset.smtp_encryption,
        smtp_authentication: preset.smtp_authentication,
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name || !formData.smtp_host || !formData.smtp_port) {
      toast.error('Remplir les champs obligatoires')
      return
    }

    const payload = {
      ...formData,
      ...(editingServer ? { id: editingServer.id } : {}),
    }

    saveServer.mutate(payload)
  }

  const servers = data || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configuration Email</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gérer les serveurs SMTP pour les notifications système
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTestModal(true)}
            disabled={servers.length === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Tester Email
          </button>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau Serveur
          </button>
        </div>
      </div>

      {/* Liste des serveurs */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">
                Erreur de chargement
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                {error instanceof Error ? error.message : 'Impossible de charger les serveurs SMTP'}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                Vérifiez que vous êtes bien connecté en tant que super admin.
              </p>
            </div>
          </div>
        </div>
      ) : servers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Server className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun serveur SMTP configuré
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Ajoutez un serveur SMTP pour activer les notifications email
          </p>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
          >
            Configurer maintenant
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {servers.map((server) => (
            <div
              key={server.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-lg ${server.active ? 'bg-teal-50 dark:bg-teal-900/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <Mail className={`w-6 h-6 ${server.active ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {server.name}
                      </h3>
                      {server.active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 rounded-full">
                          <Check className="w-3 h-3" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full">
                          <X className="w-3 h-3" />
                          Inactif
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p><strong>Host:</strong> {server.smtp_host}:{server.smtp_port}</p>
                      <p><strong>User:</strong> {server.smtp_user || 'Non défini'}</p>
                      <p><strong>Encryption:</strong> {server.smtp_encryption.toUpperCase()}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (server.id) {
                        toggleServerActive.mutate({ id: server.id, active: !server.active })
                      }
                    }}
                    disabled={toggleServerActive.isPending}
                    className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                      server.active
                        ? 'text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20'
                        : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={server.active ? 'Désactiver' : 'Activer'}
                  >
                    <Power className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(server)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Éditer"
                  >
                    <Server className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(server)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire Create/Edit */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingServer ? 'Éditer Serveur SMTP' : 'Nouveau Serveur SMTP'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Presets */}
              {!editingServer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Utiliser un preset
                  </label>
                  <select
                    value={selectedPreset}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="">Configuration personnalisée</option>
                    {Object.entries(EMAIL_PRESETS).map(([key, preset]) => (
                      <option key={key} value={key}>
                        {preset.name} - {preset.description}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Mon Serveur SMTP"
                  required
                />
              </div>

              {/* Host */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SMTP Host <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.smtp_host}
                    onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    placeholder="smtp.example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Port <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.smtp_port}
                    onChange={(e) => setFormData({ ...formData, smtp_port: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Encryption */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Encryption <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.smtp_encryption}
                  onChange={(e) => setFormData({ ...formData, smtp_encryption: e.target.value as 'starttls' | 'ssl' | 'none' })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  required
                >
                  <option value="starttls">STARTTLS (port 587)</option>
                  <option value="ssl">SSL/TLS (port 465)</option>
                  <option value="none">Aucune (port 25)</option>
                </select>
              </div>

              {/* User */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.smtp_user}
                  onChange={(e) => setFormData({ ...formData, smtp_user: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="user@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password {editingServer && '(laisser vide pour conserver)'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.smtp_pass}
                    onChange={(e) => setFormData({ ...formData, smtp_pass: e.target.value })}
                    className="w-full px-3 py-2 pr-10 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    placeholder={editingServer ? '' : 'Votre mot de passe SMTP'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingServer(null)
                    resetForm()
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saveServer.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saveServer.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>Sauvegarder</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Test Email */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Tester l&apos;envoi d&apos;email
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email destinataire
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="admin@example.com"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowTestModal(false)
                  setTestEmail('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (!testEmail) {
                    toast.error('Email requis')
                    return
                  }
                  testEmailServer.mutate({ email_to: testEmail })
                }}
                disabled={testEmailServer.isPending || !testEmail}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {testEmailServer.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          title="Supprimer le serveur SMTP ?"
          message={`Êtes-vous sûr de vouloir supprimer "${deleteTarget.name}" ? Les emails ne pourront plus être envoyés jusqu'à ce qu'un autre serveur soit configuré.`}
          confirmText="Supprimer"
          onConfirm={() => {
            if (deleteTarget.id) {
              deleteServer.mutate(deleteTarget.id)
            }
          }}
          variant="danger"
        />
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Configuration SMTP</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
              <li>Utilisez <strong>Brevo</strong> pour un service professionnel (100 emails/jour gratuit)</li>
              <li>Gmail nécessite un <strong>App Password</strong> (pas le mot de passe principal)</li>
              <li>Le serveur avec la <strong>plus petite séquence</strong> est utilisé en premier</li>
              <li>Les backups automatiques utilisent ce serveur pour les notifications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
