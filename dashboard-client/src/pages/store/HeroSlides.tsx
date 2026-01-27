import { useState } from 'react'
import { Layout } from '../../components/Layout'
import { useHeroSlides, useCreateHeroSlide, useUpdateHeroSlide, useDeleteHeroSlide, HeroSlide } from '../../hooks/useHeroSlides'
import { Button, ToastContainer, PageNotice, Breadcrumbs } from '../../components/common'
import { useToast } from '../../hooks/useToast'
import { marketingNotices } from '@/lib/notices'
import { HeroSlideTable } from '../../components/HeroSlideTable'
import { HeroSlideForm, HeroSlideFormData } from '../../components/HeroSlideForm'

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
    } catch (error) {
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
      toast.error('Erreur lors de la suppression')
    }
  }

  const showForm = isCreating || editingSlide

  return (
    <Layout>
      <Breadcrumbs
        items={[
          { label: 'Accueil', href: '/dashboard' },
          { label: 'Boutique', href: '/store/my-shop' },
          { label: 'Hero Slides' },
        ]}
      />
      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />

      <div className="p-6 bg-white dark:bg-gray-800 min-h-screen">
        <PageNotice config={marketingNotices.heroSlides} className="mb-6" />

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Hero Slides</h1>
          {!showForm && <Button onClick={handleNew}>Nouveau</Button>}
        </div>

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
