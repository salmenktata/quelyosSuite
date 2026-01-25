import { useState } from 'react'
import { Layout } from '../components/Layout'
import { useHeroSlides, useCreateHeroSlide, useUpdateHeroSlide, useDeleteHeroSlide, HeroSlide } from '../hooks/useHeroSlides'
import { Button, SkeletonTable } from '../components/common'
import { useToast } from '../hooks/useToast'

export default function HeroSlides() {
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const { data: slides, isLoading } = useHeroSlides()
  const createMutation = useCreateHeroSlide()
  const updateMutation = useUpdateHeroSlide()
  const deleteMutation = useDeleteHeroSlide()
  const toast = useToast()
  const [formData, setFormData] = useState({ name: '', title: '', subtitle: '', description: '', cta_text: '', cta_link: '', cta_secondary_text: '', cta_secondary_link: '', active: true })

  const handleNew = () => {
    setIsCreating(true)
    setEditingSlide(null)
    setFormData({ name: '', title: '', subtitle: '', description: '', cta_text: '', cta_link: '', cta_secondary_text: '', cta_secondary_link: '', active: true })
  }

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide)
    setIsCreating(false)
    setFormData({
      name: slide.name || '',
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      description: slide.description || '',
      cta_text: slide.cta_text || '',
      cta_link: slide.cta_link || '',
      cta_secondary_text: slide.cta_secondary_text || '',
      cta_secondary_link: slide.cta_secondary_link || '',
      active: slide.active
    })
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingSlide(null)
  }

  const handleSave = async () => {
    try {
      if (isCreating) {
        await createMutation.mutateAsync(formData)
        toast.success('Slide créé')
      } else if (editingSlide) {
        await updateMutation.mutateAsync({ id: editingSlide.id, ...formData })
        toast.success('Slide mis à jour')
      }
      handleCancel()
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce slide ?')) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Slide supprimé')
      if (editingSlide?.id === id) handleCancel()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const showForm = isCreating || editingSlide

  return (
    <Layout>
      <div className="p-6 bg-white dark:bg-gray-800 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Hero Slides</h1>
          {!showForm && <Button onClick={handleNew}>Nouveau</Button>}
        </div>

        <div className={`grid gap-6 ${showForm ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Liste */}
          <div className="overflow-hidden">
            {isLoading ? <SkeletonTable rows={5} columns={3} /> : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Titre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actif</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {slides?.map(s => (
                    <tr
                      key={s.id}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${editingSlide?.id === s.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                      onClick={() => handleEdit(s)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{s.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{s.title}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${s.active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {s.active ? 'Oui' : 'Non'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button onClick={(e) => { e.stopPropagation(); handleDelete(s.id) }} size="sm" variant="secondary">Supprimer</Button>
                      </td>
                    </tr>
                  ))}
                  {(!slides || slides.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        Aucun slide. Cliquez sur "Nouveau" pour en créer un.
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {isCreating ? 'Nouveau Slide' : 'Modifier le Slide'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Nom interne du slide"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Titre principal affiché"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sous-titre</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Sous-titre"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Description du slide"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bouton principal</label>
                    <input
                      type="text"
                      value={formData.cta_text}
                      onChange={e => setFormData({ ...formData, cta_text: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Texte du bouton"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lien principal</label>
                    <input
                      type="text"
                      value={formData.cta_link}
                      onChange={e => setFormData({ ...formData, cta_link: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="/categories/promo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bouton secondaire</label>
                    <input
                      type="text"
                      value={formData.cta_secondary_text}
                      onChange={e => setFormData({ ...formData, cta_secondary_text: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Texte secondaire"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lien secondaire</label>
                    <input
                      type="text"
                      value={formData.cta_secondary_link}
                      onChange={e => setFormData({ ...formData, cta_secondary_link: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="/about"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">Actif</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button onClick={handleCancel} variant="secondary">Annuler</Button>
                <Button onClick={handleSave} disabled={!formData.name}>Sauvegarder</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
