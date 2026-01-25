import { useState } from 'react'
import { Layout } from '../components/Layout'
import { useHeroSlides, useCreateHeroSlide, useUpdateHeroSlide, useDeleteHeroSlide, HeroSlide } from '../hooks/useHeroSlides'
import { Button, Modal, ImageUpload, SkeletonTable } from '../components/common'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/common/Toast'
import { useImageUpload } from '../hooks/useImageUpload'

export default function HeroSlides() {
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteModal, setDeleteModal] = useState<number | null>(null)
  const { data: slides, isLoading } = useHeroSlides()
  const createMutation = useCreateHeroSlide()
  const updateMutation = useUpdateHeroSlide()
  const deleteMutation = useDeleteHeroSlide()
  const toast = useToast()
  const [formData, setFormData] = useState({ name: '', title: '', cta_text: '', cta_link: '', active: true })

  const handleSave = async () => {
    try {
      if (isCreating) {
        await createMutation.mutateAsync(formData)
        toast.success('Slide créé')
      } else if (editingSlide) {
        await updateMutation.mutateAsync({ id: editingSlide.id, ...formData })
        toast.success('Slide mis à jour')
      }
      setIsCreating(false)
      setEditingSlide(null)
    } catch (error) {
      toast.error('Erreur')
    }
  }

  return (
    <Layout>
      <div className="p-6 bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Hero Slides</h1>
          <Button onClick={() => { setIsCreating(true); setFormData({ name: '', title: '', cta_text: '', cta_link: '', active: true }) }}>Nouveau</Button>
        </div>
        {isLoading ? <SkeletonTable rows={5} columns={5} /> : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Titre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {slides?.map(s => (
                <tr key={s.id}>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{s.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{s.title}</td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <Button onClick={() => { setEditingSlide(s); setFormData({ name: s.name, title: s.title, cta_text: s.cta_text, cta_link: s.cta_link, active: s.active }) }} size="sm">Éditer</Button>
                    <Button onClick={() => setDeleteModal(s.id)} size="sm" variant="secondary">Supprimer</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {(isCreating || editingSlide) && (
        <Modal isOpen={true} onClose={() => { setIsCreating(false); setEditingSlide(null) }} title={isCreating ? 'Nouveau' : 'Éditer'}>
          <div className="space-y-4">
            <input type="text" placeholder="Nom" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
            <input type="text" placeholder="Titre" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
            <input type="text" placeholder="CTA texte" value={formData.cta_text} onChange={e => setFormData({ ...formData, cta_text: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
            <input type="text" placeholder="CTA lien" value={formData.cta_link} onChange={e => setFormData({ ...formData, cta_link: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button onClick={() => { setIsCreating(false); setEditingSlide(null) }} variant="secondary">Annuler</Button>
            <Button onClick={handleSave}>Sauvegarder</Button>
          </div>
        </Modal>
      )}
      <ToastContainer />
    </Layout>
  )
}
