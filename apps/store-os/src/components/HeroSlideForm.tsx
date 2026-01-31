import { Button } from './common'
import { ImageSearcher } from './ImageSearcher'

export interface HeroSlideFormData {
  name: string
  title: string
  subtitle: string
  description: string
  image_url: string
  cta_text: string
  cta_link: string
  cta_secondary_text: string
  cta_secondary_link: string
  active: boolean
}

interface HeroSlideFormProps {
  formData: HeroSlideFormData
  isCreating: boolean
  onFormDataChange: (data: HeroSlideFormData) => void
  onSave: () => void
  onCancel: () => void
}

export function HeroSlideForm({ formData, isCreating, onFormDataChange, onSave, onCancel }: HeroSlideFormProps) {
  const updateField = (field: keyof HeroSlideFormData, value: string | boolean) => {
    onFormDataChange({ ...formData, [field]: value })
  }

  const handleSelectImage = (imageUrl: string) => {
    updateField('image_url', imageUrl)
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white dark:text-gray-100 mb-4">
        {isCreating ? 'Nouveau Slide' : 'Modifier le Slide'}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Nom *</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => updateField('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Nom interne du slide"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Titre *</label>
          <input
            type="text"
            value={formData.title}
            onChange={e => updateField('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Titre principal affiché"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Sous-titre</label>
          <input
            type="text"
            value={formData.subtitle}
            onChange={e => updateField('subtitle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Sous-titre"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={e => updateField('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Description du slide"
          />
        </div>

        {/* Image Searcher */}
        <ImageSearcher
          currentImageUrl={formData.image_url}
          onSelectImage={handleSelectImage}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Bouton principal *</label>
            <input
              type="text"
              value={formData.cta_text}
              onChange={e => updateField('cta_text', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Texte du bouton"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Lien principal *</label>
            <input
              type="text"
              value={formData.cta_link}
              onChange={e => updateField('cta_link', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="/categories/promo"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Bouton secondaire</label>
            <input
              type="text"
              value={formData.cta_secondary_text}
              onChange={e => updateField('cta_secondary_text', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Texte secondaire"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Lien secondaire</label>
            <input
              type="text"
              value={formData.cta_secondary_link}
              onChange={e => updateField('cta_secondary_link', e.target.value)}
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
            onChange={e => updateField('active', e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="active" className="text-sm text-gray-900 dark:text-white dark:text-gray-300">Actif</label>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button onClick={onCancel} variant="secondary">Annuler</Button>
        <Button
          onClick={onSave}
          disabled={
            !formData.name.trim() ||
            !formData.title.trim() ||
            !formData.cta_text.trim() ||
            !formData.cta_link.trim()
          }
        >
          Sauvegarder
        </Button>
      </div>
      {(!formData.name.trim() || !formData.title.trim() || !formData.cta_text.trim() || !formData.cta_link.trim()) && (
        <p className="text-xs text-red-600 dark:text-red-400 text-right mt-2">
          * Champs obligatoires : Nom, Titre, Bouton principal (texte + lien)
        </p>
      )}
    </div>
  )
}
