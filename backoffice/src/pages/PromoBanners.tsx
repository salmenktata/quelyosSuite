import { useState, useCallback } from 'react'
import { Layout } from '../components/Layout'
import {
  usePromoBanners,
  useCreatePromoBanner,
  useUpdatePromoBanner,
  useDeletePromoBanner,
  useReorderPromoBanners,
  type PromoBanner,
} from '../hooks/usePromoBanners'
import { Badge, Button, Breadcrumbs, SkeletonTable, Modal } from '../components/common'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/common/Toast'

export default function PromoBanners() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null)
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    tag: '',
    gradient: 'blue' as const,
    tag_color: 'blue' as const,
    button_bg: 'white' as const,
    cta_text: '',
    cta_link: '',
    active: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })

  const { data, isLoading, error } = usePromoBanners()
  const createMutation = useCreatePromoBanner()
  const updateMutation = useUpdatePromoBanner()
  const deleteMutation = useDeletePromoBanner()
  const reorderMutation = useReorderPromoBanners()
  const toast = useToast()

  const banners = (data?.data?.banners || []) as PromoBanner[]

  const handleOpenModal = (banner?: PromoBanner) => {
    if (banner) {
      setEditingBanner(banner)
      setFormData({
        name: banner.name,
        title: banner.title,
        description: banner.description || '',
        tag: banner.tag || '',
        gradient: banner.gradient,
        tag_color: banner.tag_color,
        button_bg: banner.button_bg,
        cta_text: banner.cta_text,
        cta_link: banner.cta_link,
        active: banner.active,
        start_date: banner.start_date || '',
        end_date: banner.end_date || '',
      })
    } else {
      setEditingBanner(null)
      setFormData({
        name: '',
        title: '',
        description: '',
        tag: '',
        gradient: 'blue',
        tag_color: 'blue',
        button_bg: 'white',
        cta_text: '',
        cta_link: '',
        active: true,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
    }
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingBanner(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingBanner) {
        await updateMutation.mutateAsync({ id: editingBanner.id, ...formData })
        toast.success('Bannière mise à jour avec succès')
      } else {
        await createMutation.mutateAsync(formData)
        toast.success('Bannière créée avec succès')
      }
      handleCloseModal()
    } catch {
      toast.error('Erreur lors de la sauvegarde de la bannière')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette bannière ?')) return

    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Bannière supprimée avec succès')
    } catch {
      toast.error('Erreur lors de la suppression de la bannière')
    }
  }

  const handleToggleActive = async (banner: PromoBanner) => {
    try {
      await updateMutation.mutateAsync({ id: banner.id, active: !banner.active })
      toast.success(banner.active ? 'Bannière désactivée' : 'Bannière activée')
    } catch {
      toast.error('Erreur lors de la modification de la bannière')
    }
  }

  const handleDragStart = useCallback((e: React.DragEvent, bannerId: number) => {
    setDraggedId(bannerId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', bannerId.toString())
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

      const currentOrder = banners.map((b) => b.id)
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
    [draggedId, banners, reorderMutation, toast]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
  }, [])

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: 'Accueil', href: '/' },
              { label: 'CMS', href: '#' },
              { label: 'Bannières Promo', href: '/promo-banners' },
            ]}
          />
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Bannières Promotionnelles</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gérez les 2 bannières affichées sous le slider
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>Créer une Bannière</Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
            Une erreur est survenue lors du chargement des bannières
          </div>
        )}

        {isLoading ? (
          <SkeletonTable rows={5} columns={6} />
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
                    Style
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
                {banners.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                      Aucune bannière trouvée. Créez-en une pour commencer.
                    </td>
                  </tr>
                ) : (
                  banners.map((banner) => (
                    <tr
                      key={banner.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, banner.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, banner.id)}
                      onDragEnd={handleDragEnd}
                      className={`cursor-move hover:bg-gray-50 ${
                        draggedId === banner.id ? 'opacity-50' : ''
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
                          {banner.sequence}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {banner.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">{banner.title}</div>
                        {banner.tag && (
                          <div className="mt-1">
                            <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                              {banner.tag}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <div>Gradient: {banner.gradient}</div>
                        <div className="text-xs text-gray-400">Bouton: {banner.button_bg}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <Badge variant={banner.active ? 'success' : 'neutral'}>
                          {banner.active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => handleToggleActive(banner)}
                          className="mr-4 text-blue-600 hover:text-blue-900"
                        >
                          {banner.active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          onClick={() => handleOpenModal(banner)}
                          className="mr-4 text-blue-600 hover:text-blue-900"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
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

        <Modal isOpen={modalOpen} onClose={handleCloseModal} title={editingBanner ? 'Modifier la Bannière' : 'Créer une Bannière'}>
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
                maxLength={100}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <input
                type="text"
                maxLength={150}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tag (badge)</label>
              <input
                type="text"
                maxLength={30}
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Ex: NOUVEAUTÉS"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Gradient</label>
                <select
                  value={formData.gradient}
                  onChange={(e) => setFormData({ ...formData, gradient: e.target.value as any })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="blue">Bleu</option>
                  <option value="purple">Violet</option>
                  <option value="orange">Orange</option>
                  <option value="green">Vert</option>
                  <option value="red">Rouge</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Couleur Tag</label>
                <select
                  value={formData.tag_color}
                  onChange={(e) => setFormData({ ...formData, tag_color: e.target.value as any })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="blue">Bleu</option>
                  <option value="secondary">Secondaire</option>
                  <option value="orange">Orange</option>
                  <option value="red">Rouge</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fond Bouton</label>
                <select
                  value={formData.button_bg}
                  onChange={(e) => setFormData({ ...formData, button_bg: e.target.value as any })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="white">Blanc</option>
                  <option value="black">Noir</option>
                  <option value="primary">Primaire</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Texte Bouton *</label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={formData.cta_text}
                  onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Lien Bouton *</label>
                <input
                  type="text"
                  required
                  value={formData.cta_link}
                  onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
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
              <label className="ml-2 block text-sm text-gray-900">Actif</label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={handleCloseModal}>
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending
                  ? 'Enregistrement...'
                  : editingBanner
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
