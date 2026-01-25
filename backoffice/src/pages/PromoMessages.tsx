import { useState, useCallback } from 'react'
import { Layout } from '../components/Layout'
import {
  usePromoMessages,
  useCreatePromoMessage,
  useUpdatePromoMessage,
  useDeletePromoMessage,
  useReorderPromoMessages,
  type PromoMessage,
} from '../hooks/usePromoMessages'
import { Badge, Button, Breadcrumbs, SkeletonTable, Modal } from '../components/common'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/common/Toast'

export default function PromoMessages() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMessage, setEditingMessage] = useState<PromoMessage | null>(null)
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    text: '',
    icon: 'truck' as const,
    active: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })

  const { data, isLoading, error } = usePromoMessages()
  const createMutation = useCreatePromoMessage()
  const updateMutation = useUpdatePromoMessage()
  const deleteMutation = useDeletePromoMessage()
  const reorderMutation = useReorderPromoMessages()
  const toast = useToast()

  const messages = (data?.data?.messages || []) as PromoMessage[]

  const handleOpenModal = (message?: PromoMessage) => {
    if (message) {
      setEditingMessage(message)
      setFormData({
        name: message.name,
        text: message.text,
        icon: message.icon,
        active: message.active,
        start_date: message.start_date || '',
        end_date: message.end_date || '',
      })
    } else {
      setEditingMessage(null)
      setFormData({
        name: '',
        text: '',
        icon: 'truck',
        active: true,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
    }
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingMessage) {
        await updateMutation.mutateAsync({ id: editingMessage.id, ...formData })
        toast.success('Message mis à jour avec succès')
      } else {
        await createMutation.mutateAsync(formData)
        toast.success('Message créé avec succès')
      }
      handleCloseModal()
    } catch {
      toast.error('Erreur lors de la sauvegarde du message')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return

    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Message supprimé avec succès')
    } catch {
      toast.error('Erreur lors de la suppression du message')
    }
  }

  const handleToggleActive = async (message: PromoMessage) => {
    try {
      await updateMutation.mutateAsync({ id: message.id, active: !message.active })
      toast.success(message.active ? 'Message désactivé' : 'Message activé')
    } catch {
      toast.error('Erreur lors de la modification du message')
    }
  }

  const handleDragStart = useCallback((e: React.DragEvent, messageId: number) => {
    setDraggedId(messageId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', messageId.toString())
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetId: number) => {
      e.preventDefault()

      if (draggedId === null || draggedId === targetId) {
        setDraggedId(null)
        return
      }

      const currentOrder = messages.map((m) => m.id)
      const draggedIndex = currentOrder.indexOf(draggedId)
      const targetIndex = currentOrder.indexOf(targetId)

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedId(null)
        return
      }

      const newOrder = [...currentOrder]
      newOrder.splice(draggedIndex, 1)
      newOrder.splice(targetIndex, 0, draggedId)

      setDraggedId(null)

      try {
        await reorderMutation.mutateAsync(newOrder)
        toast.success('Ordre mis à jour')
      } catch {
        toast.error("Erreur lors de la mise à jour de l'ordre")
      }
    },
    [draggedId, messages, reorderMutation, toast]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
  }, [])

  const getIconLabel = (icon: string) => {
    const icons = {
      truck: '🚚 Camion (livraison)',
      gift: '🎁 Cadeau',
      star: '⭐ Étoile',
      clock: '⏰ Horloge',
    }
    return icons[icon as keyof typeof icons] || icon
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: 'Accueil', href: '/' },
              { label: 'CMS', href: '#' },
              { label: 'Messages PromoBar', href: '/promo-messages' },
            ]}
          />
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Messages PromoBar</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gérez les messages en rotation dans la barre supérieure
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>Créer un Message</Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-800 dark:text-red-300">
            Une erreur est survenue lors du chargement des messages
          </div>
        )}

        {isLoading ? (
          <SkeletonTable rows={5} columns={5} />
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:bg-gray-800 shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="w-16 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Ordre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Texte
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Icône
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {messages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                      Aucun message trouvé. Créez-en un pour commencer.
                    </td>
                  </tr>
                ) : (
                  messages.map((message) => (
                    <tr
                      key={message.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, message.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, message.id)}
                      onDragEnd={handleDragEnd}
                      className={`cursor-move hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        draggedId === message.id ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center">
                          <svg
                            className="mr-2 h-5 w-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 8h16M4 16h16"
                            />
                          </svg>
                          {message.sequence}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {message.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        <div className="max-w-md truncate">{message.text}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {getIconLabel(message.icon)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <Badge variant={message.active ? 'success' : 'neutral'}>
                          {message.active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => handleToggleActive(message)}
                          className="mr-4 text-blue-600 hover:text-blue-900"
                        >
                          {message.active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          onClick={() => handleOpenModal(message)}
                          className="mr-4 text-blue-600 hover:text-blue-900"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(message.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={modalOpen} onClose={handleCloseModal} title={editingMessage ? 'Modifier le Message' : 'Créer un Message'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom interne *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Texte du message *</label>
              <input
                type="text"
                required
                maxLength={150}
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Ex: Livraison gratuite dès 100 DT"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Icône</label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value as any })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="truck">🚚 Camion (livraison)</option>
                <option value="gift">🎁 Cadeau</option>
                <option value="star">⭐ Étoile</option>
                <option value="clock">⏰ Horloge</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date début</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date fin</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="ml-2 block text-sm text-gray-900 dark:text-gray-100">Actif</label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={handleCloseModal}>
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending
                  ? 'Enregistrement...'
                  : editingMessage
                  ? 'Mettre à jour'
                  : 'Créer'}
              </Button>
            </div>
          </form>
        </Modal>

        <ToastContainer />
      </div>
    </Layout>
  )
}
