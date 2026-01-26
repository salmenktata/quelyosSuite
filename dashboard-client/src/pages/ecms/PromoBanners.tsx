import { useState } from 'react'
import { Layout } from '../../components/Layout'
import { usePromoBanners, useCreatePromoBanner, useUpdatePromoBanner, useDeletePromoBanner, PromoBanner } from '../../hooks/usePromoBanners'
import { Button, SkeletonTable, PageNotice } from '../../components/common'
import { ecommerceNotices } from '@/lib/notices'
import { useToast } from '../../hooks/useToast'

export default function PromoBanners() {
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null)
  const [isCreating, setIsCreating] = useState(false)
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
    gradient: 'from-blue-500 to-purple-500',
    active: true
  })

  const handleNew = () => {
    setIsCreating(true)
    setEditingBanner(null)
    setFormData({ name: '', title: '', description: '', tag: '', tag_color: '#ffffff', button_bg: '#000000', button_text: '', button_link: '', gradient: 'from-blue-500 to-purple-500', active: true })
  }

  const handleEdit = (banner: PromoBanner) => {
    setEditingBanner(banner)
    setIsCreating(false)
    setFormData({
      name: banner.name || '',
      title: banner.title || '',
      description: banner.description || '',
      tag: banner.tag || '',
      tag_color: banner.tag_color || '#ffffff',
      button_bg: banner.button_bg || '#000000',
      button_text: banner.button_text || '',
      button_link: banner.button_link || '',
      gradient: banner.gradient || 'from-blue-500 to-purple-500',
      active: banner.active
    })
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingBanner(null)
  }

  const handleSave = async () => {
    try {
      if (isCreating) {
        await createMutation.mutateAsync(formData)
        toast.success('Bannière créée')
      } else if (editingBanner) {
        await updateMutation.mutateAsync({ id: editingBanner.id, ...formData })
        toast.success('Bannière mise à jour')
      }
      handleCancel()
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette bannière ?')) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Bannière supprimée')
      if (editingBanner?.id === id) handleCancel()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const showForm = isCreating || editingBanner

  return (
    <Layout>
      <div className="p-6 bg-white dark:bg-gray-800 min-h-screen">
        <PageNotice config={ecommerceNotices.promoBanners} className="mb-6" />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bannières Promo</h1>
          {!showForm && <Button onClick={handleNew}>Nouveau</Button>}
        </div>

        <div className={`grid gap-6 ${showForm ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Liste */}
          <div className="overflow-hidden">
            {isLoading ? <SkeletonTable rows={5} columns={4} /> : (
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
                  {banners?.map(b => (
                    <tr
                      key={b.id}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${editingBanner?.id === b.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                      onClick={() => handleEdit(b)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{b.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{b.title}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${b.active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {b.active ? 'Oui' : 'Non'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button onClick={(e) => { e.stopPropagation(); handleDelete(b.id) }} size="sm" variant="secondary">Supprimer</Button>
                      </td>
                    </tr>
                  ))}
                  {(!banners || banners.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        Aucune bannière. Cliquez sur "Nouveau" pour en créer une.
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
                {isCreating ? 'Nouvelle Bannière' : 'Modifier la Bannière'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nom interne"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                    placeholder="Titre affiché"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                    placeholder="Description de la bannière"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tag</label>
                    <input
                      type="text"
                      value={formData.tag}
                      onChange={e => setFormData({ ...formData, tag: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                      placeholder="PROMO"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Couleur tag</label>
                    <input
                      type="color"
                      value={formData.tag_color}
                      onChange={e => setFormData({ ...formData, tag_color: e.target.value })}
                      className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gradient CSS</label>
                  <input
                    type="text"
                    value={formData.gradient}
                    onChange={e => setFormData({ ...formData, gradient: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                    placeholder="from-blue-500 to-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Texte bouton</label>
                    <input
                      type="text"
                      value={formData.button_text}
                      onChange={e => setFormData({ ...formData, button_text: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                      placeholder="Découvrir"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Couleur bouton</label>
                    <input
                      type="color"
                      value={formData.button_bg}
                      onChange={e => setFormData({ ...formData, button_bg: e.target.value })}
                      className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lien bouton</label>
                  <input
                    type="text"
                    value={formData.button_link}
                    onChange={e => setFormData({ ...formData, button_link: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                    placeholder="/categories/promo"
                  />
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
