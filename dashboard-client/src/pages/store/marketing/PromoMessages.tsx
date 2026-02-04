/**
 * Page Messages Promotionnels - Gestion de la barre de messages
 *
 * Fonctionnalités :
 * - Liste des messages promo affichés en barre supérieure
 * - Création/édition/suppression de messages
 * - Choix de l'icône (camion, cadeau, étoile, etc.)
 * - Activation/désactivation des messages
 */

import { useState } from 'react'
import { Plus, Trash2, X, Save } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { usePromoMessages, useCreatePromoMessage, useUpdatePromoMessage, useDeletePromoMessage, PromoMessage } from '@/hooks/usePromoMessages'
import { Button, SkeletonTable, PageNotice, Breadcrumbs } from '@/components/common'
import { useToast } from '@/hooks/useToast'
import { storeNotices } from '@/lib/notices'
import { logger } from '@quelyos/logger';

const ICON_OPTIONS = [
  { value: 'truck', label: 'Camion (Livraison)' },
  { value: 'gift', label: 'Cadeau' },
  { value: 'star', label: 'Étoile' },
  { value: 'clock', label: 'Horloge' },
  { value: 'shield', label: 'Bouclier' },
  { value: 'percent', label: 'Pourcentage' },
]

export default function PromoMessages() {
  const [editingMessage, setEditingMessage] = useState<PromoMessage | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const { data: messages, isLoading } = usePromoMessages()
  const createMutation = useCreatePromoMessage()
  const updateMutation = useUpdatePromoMessage()
  const deleteMutation = useDeletePromoMessage()
  const toast = useToast()
  const [formData, setFormData] = useState<{
    name: string
    text: string
    icon: PromoMessage['icon']
    active: boolean
  }>({
    name: '',
    text: '',
    icon: 'truck',
    active: true
  })

  const handleNew = () => {
    setIsCreating(true)
    setEditingMessage(null)
    setFormData({ name: '', text: '', icon: 'truck', active: true })
  }

  const handleEdit = (message: PromoMessage) => {
    setEditingMessage(message)
    setIsCreating(false)
    setFormData({
      name: message.name || '',
      text: message.text || '',
      icon: message.icon || 'truck',
      active: message.active
    })
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingMessage(null)
  }

  const handleSave = async () => {
    try {
      if (isCreating) {
        await createMutation.mutateAsync(formData)
        toast.success('Message créé')
      } else if (editingMessage) {
        await updateMutation.mutateAsync({ id: editingMessage.id, ...formData })
        toast.success('Message mis à jour')
      }
      handleCancel()
    } catch {
      logger.error("Erreur attrapée");
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce message ?')) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Message supprimé')
      if (editingMessage?.id === id) handleCancel()
    } catch {
      logger.error("Erreur attrapée");
      toast.error('Erreur lors de la suppression')
    }
  }

  const showForm = isCreating || editingMessage

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Store', href: '/store' },
            { label: 'Messages Promo' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages PromoBar</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Messages affichés en barre supérieure du site
            </p>
          </div>
          {!showForm && (
            <Button onClick={handleNew} icon={<Plus className="h-4 w-4" />}>
              Nouveau
            </Button>
          )}
        </div>

        <PageNotice config={storeNotices.promoMessages} className="mb-6" />

        <div className={`grid gap-6 ${showForm ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Liste */}
          <div className="overflow-hidden">
            {isLoading ? <SkeletonTable rows={5} columns={4} /> : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Texte</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actif</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {messages?.map(m => (
                    <tr
                      key={m.id}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${editingMessage?.id === m.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                      onClick={() => handleEdit(m)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white dark:text-gray-100">{m.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{m.text}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${m.active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {m.active ? 'Oui' : 'Non'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          onClick={(e) => { e.stopPropagation(); handleDelete(m.id) }}
                          size="sm"
                          variant="danger"
                          icon={<Trash2 className="h-3.5 w-3.5" />}
                        >
                          Supprimer
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(!messages || messages.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        Aucun message. Cliquez sur "Nouveau" pour en créer un.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Formulaire inline */}
          {showForm && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-gray-100 mb-4">
                {isCreating ? 'Nouveau Message' : 'Modifier le Message'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Nom *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nom interne"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Texte affiché *</label>
                  <input
                    type="text"
                    value={formData.text}
                    onChange={e => setFormData({ ...formData, text: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                    placeholder="Livraison gratuite dès 50€"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Icône</label>
                  <select
                    value={formData.icon}
                    onChange={e => setFormData({ ...formData, icon: e.target.value as PromoMessage['icon'] })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                  >
                    {ICON_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="active" className="text-sm text-gray-900 dark:text-white dark:text-gray-300">Actif</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button onClick={handleCancel} variant="secondary" icon={<X className="h-4 w-4" />}>
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={!formData.name || !formData.text} icon={<Save className="h-4 w-4" />}>
                  Sauvegarder
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
