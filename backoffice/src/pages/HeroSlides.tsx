import { useState, useCallback } from 'react'
import { Layout } from '../components/Layout'
import {
  useHeroSlides,
  useCreateHeroSlide,
  useUpdateHeroSlide,
  useDeleteHeroSlide,
  useReorderHeroSlides,
  type HeroSlide,
} from '../hooks/useHeroSlides'
import { Badge, Button, Breadcrumbs, SkeletonTable, Modal } from '../components/common'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/common/Toast'

export default function HeroSlides() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    subtitle: '',
    description: '',
    cta_text: '',
    cta_link: '',
    cta_secondary_text: '',
    cta_secondary_link: '',
    active: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })

  const { data, isLoading, error } = useHeroSlides()
  const createMutation = useCreateHeroSlide()
  const updateMutation = useUpdateHeroSlide()
  const deleteMutation = useDeleteHeroSlide()
  const reorderMutation = useReorderHeroSlides()
  const toast = useToast()

  const slides = (data?.data?.slides || []) as HeroSlide[]

  const handleOpenModal = (slide?: HeroSlide) => {
    if (slide) {
      setEditingSlide(slide)
      setFormData({
        name: slide.name,
        title: slide.title,
        subtitle: slide.subtitle || '',
        description: slide.description || '',
        cta_text: slide.cta_text,
        cta_link: slide.cta_link,
        cta_secondary_text: slide.cta_secondary_text || '',
        cta_secondary_link: slide.cta_secondary_link || '',
        active: slide.active,
        start_date: slide.start_date || '',
        end_date: slide.end_date || '',
      })
    } else {
      setEditingSlide(null)
      setFormData({
        name: '',
        title: '',
        subtitle: '',
        description: '',
        cta_text: '',
        cta_link: '',
        cta_secondary_text: '',
        cta_secondary_link: '',
        active: true,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
    }
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingSlide(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingSlide) {
        await updateMutation.mutateAsync({ id: editingSlide.id, ...formData })
        toast.success('Slide mis à jour avec succès')
      } else {
        await createMutation.mutateAsync(formData)
        toast.success('Slide créé avec succès')
      }
      handleCloseModal()
    } catch {
      toast.error('Erreur lors de la sauvegarde du slide')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce slide ?')) return

    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Slide supprimé avec succès')
    } catch {
      toast.error('Erreur lors de la suppression du slide')
    }
  }

  const handleToggleActive = async (slide: HeroSlide) => {
    try {
      await updateMutation.mutateAsync({ id: slide.id, active: !slide.active })
      toast.success(slide.active ? 'Slide désactivé' : 'Slide activé')
    } catch {
      toast.error('Erreur lors de la modification du slide')
    }
  }

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, slideId: number) => {
    setDraggedId(slideId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', slideId.toString())
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

      const currentOrder = slides.map((s) => s.id)
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
    [draggedId, slides, reorderMutation, toast]
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
              { label: 'Hero Slides', href: '/hero-slides' },
            ]}
          />
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Hero Slides Homepage</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gérez les slides du carrousel principal de la homepage
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>Créer un Slide</Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
            Une erreur est survenue lors du chargement des slides
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
                    CTA Principal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Dates
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
                {slides.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                      Aucun slide trouvé. Créez-en un pour commencer.
                    </td>
                  </tr>
                ) : (
                  slides.map((slide) => (
                    <tr
                      key={slide.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, slide.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, slide.id)}
                      onDragEnd={handleDragEnd}
                      className={`cursor-move hover:bg-gray-50 ${
                        draggedId === slide.id ? 'opacity-50' : ''
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
                          {slide.sequence}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {slide.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">{slide.title}</div>
                        {slide.subtitle && (
                          <div className="max-w-xs truncate text-xs text-gray-500">
                            {slide.subtitle}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">{slide.cta_text}</div>
                        <div className="max-w-xs truncate text-xs text-gray-500">
                          {slide.cta_link}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs text-gray-500">
                        <div>{slide.start_date}</div>
                        <div>{slide.end_date}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <Badge variant={slide.active ? 'success' : 'neutral'}>
                          {slide.active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={() => handleToggleActive(slide)}
                          className="mr-4 text-blue-600 hover:text-blue-900"
                        >
                          {slide.active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          onClick={() => handleOpenModal(slide)}
                          className="mr-4 text-blue-600 hover:text-blue-900"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(slide.id)}
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

        {/* Modal Formulaire */}
        <Modal isOpen={modalOpen} onClose={handleCloseModal} title={editingSlide ? 'Modifier le Slide' : 'Créer un Slide'}>
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
              <label className="block text-sm font-medium text-gray-700">Titre principal *</label>
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
              <label className="block text-sm font-medium text-gray-700">Sous-titre</label>
              <input
                type="text"
                maxLength={100}
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                maxLength={250}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Texte CTA Principal *</label>
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
                <label className="block text-sm font-medium text-gray-700">Lien CTA Principal *</label>
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
                <label className="block text-sm font-medium text-gray-700">Texte CTA Secondaire</label>
                <input
                  type="text"
                  maxLength={50}
                  value={formData.cta_secondary_text}
                  onChange={(e) => setFormData({ ...formData, cta_secondary_text: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Lien CTA Secondaire</label>
                <input
                  type="text"
                  value={formData.cta_secondary_link}
                  onChange={(e) => setFormData({ ...formData, cta_secondary_link: e.target.value })}
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
                  : editingSlide
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
