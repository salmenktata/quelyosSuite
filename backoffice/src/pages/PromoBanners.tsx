import { useState } from 'react'
import { Layout } from '../components/Layout'
import { usePromoBanners, useCreatePromoBanner, useUpdatePromoBanner, useDeletePromoBanner, PromoBanner } from '../hooks/usePromoBanners'
import { Button, Modal, ImageUpload, SkeletonTable } from '../components/common'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/common/Toast'
import { useImageUpload } from '../hooks/useImageUpload'

export default function PromoBanners() {
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteModal, setDeleteModal] = useState<number | null>(null)
  const { data: banners, isLoading } = usePromoBanners()
  const createMutation = useCreatePromoBanner()
  const updateMutation = useUpdatePromoBanner()
  const deleteMutation = useDeletePromoBanner()
  const toast = useToast()
  const [formData, setFormData] = useState({ 
    name: '', 
    title: '', 
    description: '', 
    tag: '', 
    tag_color: '#ffffff', 
    button_bg: '#000000', 
    button_text: '', 
    button_link: '', 
    gradient: 'bg-gradient-to-r from-blue-500 to-purple-500',
    active: true 
  })

  const handleSave = async () => {
    try {
      if (isCreating) {
        await createMutation.mutateAsync(formData)
        toast.success('Bannière créée')
      } else if (editingBanner) {
        await updateMutation.mutateAsync({ id: editingBanner.id, ...formData })
        toast.success('Bannière mise à jour')
      }
      setIsCreating(false)
      setEditingBanner(null)
    } catch (error) {
      toast.error('Erreur')
    }
  }

  return (
    <Layout>
      <div className="p-6 bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bannières Promo</h1>
          <Button onClick={() => { setIsCreating(true); setFormData({ name: '', title: '', description: '', tag: '', tag_color: '#ffffff', button_bg: '#000000', button_text: '', button_link: '', gradient: 'bg-gradient-to-r from-blue-500 to-purple-500', active: true }) }}>Nouveau</Button>
        </div>
        {isLoading ? <SkeletonTable rows={5} columns={4} /> : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Titre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tag</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {banners?.map(b => (
                <tr key={b.id}>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{b.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{b.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{b.tag}</td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <Button onClick={() => { setEditingBanner(b); setFormData({ name: b.name, title: b.title, description: b.description, tag: b.tag, tag_color: b.tag_color, button_bg: b.button_bg, button_text: b.button_text, button_link: b.button_link, gradient: b.gradient, active: b.active }) }} size="sm">Éditer</Button>
                    <Button onClick={() => setDeleteModal(b.id)} size="sm" variant="secondary">Supprimer</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {(isCreating || editingBanner) && (
        <Modal isOpen={true} onClose={() => { setIsCreating(false); setEditingBanner(null) }} title={isCreating ? 'Nouvelle bannière' : 'Éditer bannière'}>
          <div className="space-y-4">
            <input type="text" placeholder="Nom" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
            <input type="text" placeholder="Titre" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
            <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" rows={3} />
            <input type="text" placeholder="Tag" value={formData.tag} onChange={e => setFormData({ ...formData, tag: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Couleur tag</label>
                <input type="color" value={formData.tag_color} onChange={e => setFormData({ ...formData, tag_color: e.target.value })} className="w-full h-10 border dark:border-gray-600 rounded cursor-pointer" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Couleur bouton</label>
                <input type="color" value={formData.button_bg} onChange={e => setFormData({ ...formData, button_bg: e.target.value })} className="w-full h-10 border dark:border-gray-600 rounded cursor-pointer" />
              </div>
            </div>
            <input type="text" placeholder="Texte bouton" value={formData.button_text} onChange={e => setFormData({ ...formData, button_text: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
            <input type="text" placeholder="Lien bouton" value={formData.button_link} onChange={e => setFormData({ ...formData, button_link: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
            <input type="text" placeholder="Gradient CSS" value={formData.gradient} onChange={e => setFormData({ ...formData, gradient: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button onClick={() => { setIsCreating(false); setEditingBanner(null) }} variant="secondary">Annuler</Button>
            <Button onClick={handleSave}>Sauvegarder</Button>
          </div>
        </Modal>
      )}
      <ToastContainer />
    </Layout>
  )
}
