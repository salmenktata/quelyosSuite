import { useState, useCallback } from 'react'
import { Layout } from '../components/Layout'
import {
  useTrustBadges,
  useCreateTrustBadge,
  useUpdateTrustBadge,
  useDeleteTrustBadge,
  useReorderTrustBadges,
  type TrustBadge,
} from '../hooks/useTrustBadges'
import { Badge, Button, Breadcrumbs, SkeletonTable, Modal } from '../components/common'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/common/Toast'

export default function TrustBadges() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBadge, setEditingBadge] = useState<TrustBadge | null>(null)
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    subtitle: '',
    icon: 'creditcard' as const,
    active: true,
  })

  const { data, isLoading, error } = useTrustBadges()
  const createMutation = useCreateTrustBadge()
  const updateMutation = useUpdateTrustBadge()
  const deleteMutation = useDeleteTrustBadge()
  const reorderMutation = useReorderTrustBadges()
  const toast = useToast()

  const badges = (data?.data?.badges || []) as TrustBadge[]

  const handleOpenModal = (badge?: TrustBadge) => {
    if (badge) {
      setEditingBadge(badge)
      setFormData({
        name: badge.name,
        title: badge.title,
        subtitle: badge.subtitle || '',
        icon: badge.icon,
        active: badge.active,
      })
    } else {
      setEditingBadge(null)
      setFormData({
        name: '',
        title: '',
        subtitle: '',
        icon: 'creditcard',
        active: true,
      })
    }
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingBadge(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingBadge) {
        await updateMutation.mutateAsync({ id: editingBadge.id, ...formData })
        toast.success('Badge mis à jour avec succès')
      } else {
        await createMutation.mutateAsync(formData)
        toast.success('Badge créé avec succès')
      }
      handleCloseModal()
    } catch {
      toast.error('Erreur lors de la sauvegarde du badge')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce badge ?')) return

    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Badge supprimé avec succès')
    } catch {
      toast.error('Erreur lors de la suppression du badge')
    }
  }

  const handleToggleActive = async (badge: TrustBadge) => {
    try {
      await updateMutation.mutateAsync({ id: badge.id, active: !badge.active })
      toast.success(badge.active ? 'Badge désactivé' : 'Badge activé')
    } catch {
      toast.error('Erreur lors de la modification du badge')
    }
  }

  const handleDragStart = useCallback((e: React.DragEvent, badgeId: number) => {
    setDraggedId(badgeId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', badgeId.toString())
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

      const currentOrder = badges.map((b) => b.id)
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
    [draggedId, badges, reorderMutation, toast]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
  }, [])

  const getIconLabel = (icon: string) => {
    const icons = {
      creditcard: '💳 Carte de crédit',
      delivery: '📦 Livraison',
      shield: '🛡️ Bouclier (sécurité)',
      support: '🎧 Support',
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
              { label: 'Trust Badges', href: '/trust-badges' },
            ]}
          />
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Trust Badges Footer</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gérez les 4 badges de confiance affichés avant le footer
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>Créer un Badge</Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
            Une erreur est survenue lors du chargement des badges
          </div>
        )}

        {isLoading ? (
          <SkeletonTable rows={5} columns={5} />
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-16 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Ordre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Titre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Icône
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {badges.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                      Aucun badge trouvé. Créez-en un pour commencer.
                    </td>
                  </tr>
                ) : (
                  badges.map((badge) => (
                    <tr
                      key={badge.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, badge.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, badge.id)}
                      onDragEnd={handleDragEnd}
                      className={`cursor-move hover:bg-gray-50 ${
                        draggedId === badge.id ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
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
                          {badge.sequence}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {badge.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{badge.title}</div>
                        {badge.subtitle && (
                          <div className="text-xs text-gray-500">{badge.subtitle}</div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {getIconLabel(badge.icon)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <Badge variant={badge.active ? 'success' : 'neutral'}>
                          {badge.active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => handleToggleActive(badge)}
                          className="mr-4 text-blue-600 hover:text-blue-900"
                        >
                          {badge.active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          onClick={() => handleOpenModal(badge)}
                          className="mr-4 text-blue-600 hover:text-blue-900"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(badge.id)}
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

        <Modal isOpen={modalOpen} onClose={handleCloseModal} title={editingBadge ? 'Modifier le Badge' : 'Créer un Badge'}>
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
              <label className="block text-sm font-medium text-gray-700">Titre *</label>
              <input
                type="text"
                required
                maxLength={50}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Ex: Paiement sécurisé"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Sous-titre</label>
              <input
                type="text"
                maxLength={100}
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Ex: Vos données sont protégées et cryptées"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Icône</label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value as any })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="creditcard">💳 Carte de crédit</option>
                <option value="delivery">📦 Livraison</option>
                <option value="shield">🛡️ Bouclier (sécurité)</option>
                <option value="support">🎧 Support</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label className="ml-2 block text-sm text-gray-900">Actif</label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={handleCloseModal}>
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending
                  ? 'Enregistrement...'
                  : editingBadge
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
