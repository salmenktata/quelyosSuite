/**
 * Page Hero Slides - Gestion des diaporamas d'accueil
 *
 * Fonctionnalités :
 * - Liste des slides hero avec statut actif/inactif
 * - Création/édition/suppression de slides
 * - Configuration complète (titre, sous-titre, description, image, CTA)
 * - Double CTA (principal et secondaire)
 * - Formulaire inline d'édition avec prévisualisation
 */

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Layout } from '../../components/Layout'
import { useHeroSlides, useCreateHeroSlide, useUpdateHeroSlide, useDeleteHeroSlide, HeroSlide } from '../../hooks/useHeroSlides'
import { Button, PageNotice, Breadcrumbs } from '../../components/common'
import { useToast } from '../../hooks/useToast'
import { storeNotices } from '@/lib/notices'
import { HeroSlideTable } from '../../components/HeroSlideTable'
import { HeroSlideForm, HeroSlideFormData } from '../../components/HeroSlideForm'
import { logger } from '@quelyos/logger';

const DEFAULT_FORM_DATA: HeroSlideFormData = {
  name: '',
  title: '',
  subtitle: '',
  description: '',
  image_url: '',
  cta_text: '',
  cta_link: '',
  cta_secondary_text: '',
  cta_secondary_link: '',
  active: true
}

export default function HeroSlides() {
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<HeroSlideFormData>(DEFAULT_FORM_DATA)

  const { data: slides, isLoading } = useHeroSlides()
  const createMutation = useCreateHeroSlide()
  const updateMutation = useUpdateHeroSlide()
  const deleteMutation = useDeleteHeroSlide()
  const toast = useToast()

  const handleNew = () => {
    setIsCreating(true)
    setEditingSlide(null)
    setFormData(DEFAULT_FORM_DATA)
  }

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide)
    setIsCreating(false)
    setFormData({
      name: slide.name || '',
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      description: slide.description || '',
      image_url: slide.image_url || '',
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
    } catch (_error) {
      logger.error("Erreur:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la sauvegarde'
      toast.error(errorMessage)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce slide ?')) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Slide supprimé')
      if (editingSlide?.id === id) handleCancel()
    } catch {
      logger.error("Erreur attrapée");
      toast.error('Erreur lors de la suppression')
    }
  }

  const showForm = isCreating || editingSlide

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Store', href: '/store' },
            { label: 'Hero Slides' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hero Slides</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gérez les diaporamas d'accueil de votre site e-commerce
            </p>
          </div>
          {!showForm && (
            <Button onClick={handleNew} icon={<Plus className="h-4 w-4" />}>
              Nouveau
            </Button>
          )}
        </div>

        <PageNotice config={storeNotices.heroSlides} className="mb-6" />

        <div className={`grid gap-6 ${showForm ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          <HeroSlideTable
            slides={slides}
            isLoading={isLoading}
            editingSlideId={editingSlide?.id || null}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          {showForm && (
            <HeroSlideForm
              formData={formData}
              isCreating={isCreating}
              onFormDataChange={setFormData}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          )}
        </div>
      </div>
    </Layout>
  )
}
