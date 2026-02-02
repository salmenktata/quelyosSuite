/**
 * Formulaire Équipement GMAO - Création équipement
 *
 * Fonctionnalités :
 * - Création nouvel équipement
 * - Champs : nom, catégorie, série, critique, dates
 * - Validation formulaire
 * - Redirection après création
 */
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button } from '@/components/common'
import { Wrench, Save, X, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCreateMaintenanceEquipment } from '@/hooks/useMaintenanceEquipment'
import { useState } from 'react'
import { useToast } from '@/hooks/useToast'

export default function EquipmentForm() {
  const navigate = useNavigate()
  const { success: showSuccess, error: showError } = useToast()
  const createEquipment = useCreateMaintenanceEquipment()

  const [formData, setFormData] = useState({
    name: '',
    category_id: undefined as number | undefined,
    serial_number: '',
    is_critical: false,
    purchase_date: '',
    warranty_end_date: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      const result = await createEquipment.mutateAsync(formData)

      if (result.success) {
        showSuccess(`Équipement "${formData.name}" créé avec succès`)
        navigate('/maintenance/equipment')
      } else {
        showError(result.error || 'Erreur lors de la création')
      }
    } catch (error) {
      showError('Erreur lors de la création de l\'équipement')
    }
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'GMAO', href: '/maintenance' },
            { label: 'Équipements', href: '/maintenance/equipment' },
            { label: 'Nouveau' },
          ]}
        />

        <div className="flex items-center gap-3">
          <Wrench className="w-8 h-8 text-amber-600 dark:text-amber-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Nouvel Équipement
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Ajouter un nouvel équipement à la GMAO
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom de l'équipement *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent ${
                  errors.name
                    ? 'border-red-500 dark:border-red-600'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Ex: Compresseur A1"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* N° Série */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                N° de série
              </label>
              <input
                type="text"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent"
                placeholder="Ex: SN123456"
              />
            </div>

            {/* Critique */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_critical"
                checked={formData.is_critical}
                onChange={(e) => setFormData({ ...formData, is_critical: e.target.checked })}
                className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="is_critical"
                className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
              >
                Équipement critique (nécessite une attention prioritaire)
              </label>
            </div>

            {/* Date d'achat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date d'achat
              </label>
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent"
              />
            </div>

            {/* Fin de garantie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fin de garantie
              </label>
              <input
                type="date"
                value={formData.warranty_end_date}
                onChange={(e) => setFormData({ ...formData, warranty_end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="submit"
                variant="primary"
                icon={<Save className="w-4 h-4" />}
                disabled={createEquipment.isPending}
              >
                {createEquipment.isPending ? 'Création...' : 'Créer l\'équipement'}
              </Button>
              <Button
                type="button"
                variant="outline"
                icon={<X className="w-4 h-4" />}
                onClick={() => navigate('/maintenance/equipment')}
              >
                Annuler
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  )
}
