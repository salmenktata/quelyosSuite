/**
 * Page Bannières Promotionnelles - Gestion des bannières publicitaires
 *
 * Fonctionnalités :
 * - Liste des bannières avec statut actif/inactif
 * - Création/édition/suppression de bannières
 * - Configuration complète (titre, description, tag, gradient, bouton)
 * - Formulaire inline d'édition avec prévisualisation en temps réel
 * - Activation/désactivation rapide des bannières
 */

import { useState } from 'react'
import { Plus, X, Save } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { usePromoBanners, useCreatePromoBanner, useUpdatePromoBanner, useDeletePromoBanner, PromoBanner } from '@/hooks/usePromoBanners'
import { Button, SkeletonTable, PageNotice, Breadcrumbs } from '@/components/common'
import { storeNotices } from '@/lib/notices'
import { useToast } from '@/hooks/useToast'
import { BannerFormInputs } from '@/components/store/promo-banners/BannerFormInputs'
import { BannerTableRow } from '@/components/store/promo-banners/BannerTableRow'
import { BannerPreview } from '@/components/store/promo-banners/BannerPreview'
import { logger } from '@quelyos/logger';

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
      logger.error("Erreur attrapée");
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
      logger.error("Erreur attrapée");
      toast.error('Erreur lors de la suppression')
    }
  }

  const showForm = isCreating || editingBanner

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Store', href: '/store' },
            { label: 'Bannières Promo' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bannières Promo</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gérez vos bannières promotionnelles affichées sur le site
            </p>
          </div>
          {!showForm && (
            <Button onClick={handleNew} icon={<Plus className="h-4 w-4" />}>
              Nouveau
            </Button>
          )}
        </div>

        <PageNotice config={storeNotices.promoBanners} className="mb-6" />

        <div className={`grid gap-6 ${showForm ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Liste */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
            {isLoading ? (
              <div className="p-6">
                <SkeletonTable rows={5} columns={4} />
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Titre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actif</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {banners?.map(b => (
                    <BannerTableRow
                      key={b.id}
                      banner={b}
                      isEditing={editingBanner?.id === b.id}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                  {(!banners || banners.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        Aucune bannière. Cliquez sur "Nouveau" pour en créer une.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Formulaire et prévisualisation */}
          {showForm && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {isCreating ? 'Nouvelle Bannière' : 'Modifier la Bannière'}
                </h2>

                <BannerFormInputs
                  formData={formData}
                  onChange={setFormData}
                />

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button onClick={handleCancel} variant="secondary" icon={<X className="h-4 w-4" />}>
                    Annuler
                  </Button>
                  <Button onClick={handleSave} disabled={!formData.name} icon={<Save className="h-4 w-4" />}>
                    Sauvegarder
                  </Button>
                </div>
              </div>

              {/* Prévisualisation */}
              <BannerPreview formData={formData} />
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
