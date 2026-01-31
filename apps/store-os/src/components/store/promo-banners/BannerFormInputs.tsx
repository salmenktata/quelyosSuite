/**
 * Composant BannerFormInputs - Formulaire de création/édition de bannière
 *
 * Permet de configurer tous les paramètres d'une bannière promotionnelle :
 * - Informations de base (nom, titre, description)
 * - Tag et couleur du tag
 * - Gradient de fond
 * - Bouton (texte, couleur, lien)
 * - Statut actif/inactif
 */

interface BannerFormData {
  name: string
  title: string
  description: string
  tag: string
  tag_color: string
  button_bg: string
  button_text: string
  button_link: string
  gradient: string
  active: boolean
}

interface BannerFormInputsProps {
  formData: BannerFormData
  onChange: (data: BannerFormData) => void
}

export function BannerFormInputs({ formData, onChange }: BannerFormInputsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
          Nom *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          placeholder="Nom interne"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
          Titre
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => onChange({ ...formData, title: e.target.value })}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          placeholder="Titre affiché"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => onChange({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          placeholder="Description de la bannière"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
            Tag
          </label>
          <input
            type="text"
            value={formData.tag}
            onChange={(e) => onChange({ ...formData, tag: e.target.value })}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            placeholder="PROMO"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
            Couleur tag
          </label>
          <input
            type="color"
            value={formData.tag_color}
            onChange={(e) => onChange({ ...formData, tag_color: e.target.value })}
            className="w-full h-[50px] rounded-xl border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
          Gradient CSS
        </label>
        <input
          type="text"
          value={formData.gradient}
          onChange={(e) => onChange({ ...formData, gradient: e.target.value })}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          placeholder="from-blue-500 to-purple-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
            Texte bouton
          </label>
          <input
            type="text"
            value={formData.button_text}
            onChange={(e) => onChange({ ...formData, button_text: e.target.value })}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            placeholder="Découvrir"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
            Couleur bouton
          </label>
          <input
            type="color"
            value={formData.button_bg}
            onChange={(e) => onChange({ ...formData, button_bg: e.target.value })}
            className="w-full h-[50px] rounded-xl border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
          Lien bouton
        </label>
        <input
          type="text"
          value={formData.button_link}
          onChange={(e) => onChange({ ...formData, button_link: e.target.value })}
          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          placeholder="/categories/promo"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="active"
          checked={formData.active}
          onChange={(e) => onChange({ ...formData, active: e.target.checked })}
          className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
        />
        <label htmlFor="active" className="text-sm font-medium text-gray-900 dark:text-white">
          Actif
        </label>
      </div>
    </div>
  )
}
