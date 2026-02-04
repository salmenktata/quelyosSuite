/**
 * Formulaire Demande d'Intervention - GMAO
 *
 * Fonctionnalités :
 * - Création nouvelle demande d'intervention
 * - Champs : titre, équipement, type, priorité, description
 * - Urgence et impact temps d'arrêt
 * - Validation formulaire
 * - Redirection après création
 */
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button } from '@/components/common'
import { ClipboardList, Save, X, AlertCircle } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateMaintenanceRequest } from '@/hooks/useMaintenanceRequests'
import { useMaintenanceEquipment } from '@/hooks/useMaintenanceEquipment'
import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/useToast'

export default function RequestForm() {
  const navigate = useNavigate()
  const { success: showSuccess, error,refetch: showError } = useToast()
  const [searchParams] = useSearchParams()
  const equipmentIdParam = searchParams.get('equipment')

  const createRequest = useCreateMaintenanceRequest()
  const { data: equipmentData } = useMaintenanceEquipment()

  const [formData, setFormData] = useState({
    name: '',
    equipment_id: 0,
    maintenance_type: 'corrective' as 'corrective' | 'preventive',
    priority: '1' as '0' | '1' | '2' | '3',
    description: '',
    schedule_date: '',
    is_emergency: false,
    downtime_impact: 'none' as 'none' | 'low' | 'medium' | 'high' | 'critical',
    planned_duration_hours: undefined as number | undefined,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Pré-sélectionner équipement si passé en paramètre
  useEffect(() => {
    if (equipmentIdParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData((prev) => ({ ...prev, equipment_id: parseInt(equipmentIdParam, 10) }))
    }
  }, [equipmentIdParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Le titre est requis'
    }
    if (!formData.equipment_id) {
      newErrors.equipment_id = 'L\'équipement est requis'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      const result = await createRequest.mutateAsync(formData)

      if (result.success) {
        showSuccess(`Demande "${formData.name}" créée avec succès`)
        navigate('/maintenance/requests')
      } else {
        showError(result.error || 'Erreur lors de la création')
      }
    } catch (_error) {
      showError('Erreur lors de la création de la demande')
    }
  }

  const equipment = equipmentData?.data || []

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'GMAO', href: '/maintenance' },
            { label: 'Demandes', href: '/maintenance/requests' },
            { label: 'Nouvelle' },
          ]}
        />

        <div className="flex items-center gap-3">
          <ClipboardList className="w-8 h-8 text-amber-600 dark:text-amber-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Nouvelle Demande d'Intervention
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Créer une demande de maintenance
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Titre de la demande *
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
                placeholder="Ex: Réparation fuite hydraulique"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Équipement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Équipement *
              </label>
              <select
                value={formData.equipment_id}
                onChange={(e) => setFormData({ ...formData, equipment_id: parseInt(e.target.value, 10) })}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent ${
                  errors.equipment_id
                    ? 'border-red-500 dark:border-red-600'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value={0}>-- Sélectionner un équipement --</option>
                {equipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name} {eq.is_critical ? '(Critique)' : ''}
                  </option>
                ))}
              </select>
              {errors.equipment_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.equipment_id}
                </p>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type de maintenance
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="maintenance_type"
                    value="corrective"
                    checked={formData.maintenance_type === 'corrective'}
                    onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value as 'corrective' })}
                    className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">Corrective (panne)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="maintenance_type"
                    value="preventive"
                    checked={formData.maintenance_type === 'preventive'}
                    onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value as 'preventive' })}
                    className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">Préventive (planifiée)</span>
                </label>
              </div>
            </div>

            {/* Priorité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priorité
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as '0' | '1' | '2' | '3' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent"
              >
                <option value="0">Très faible</option>
                <option value="1">Faible</option>
                <option value="2">Normale</option>
                <option value="3">Haute</option>
              </select>
            </div>

            {/* Urgence */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_emergency"
                checked={formData.is_emergency}
                onChange={(e) => setFormData({ ...formData, is_emergency: e.target.checked })}
                className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="is_emergency"
                className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
              >
                Urgence (intervention immédiate requise)
              </label>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent"
                placeholder="Décrivez le problème ou les travaux à effectuer..."
              />
            </div>

            {/* Date planifiée */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date planifiée (optionnel)
              </label>
              <input
                type="date"
                value={formData.schedule_date}
                onChange={(e) => setFormData({ ...formData, schedule_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600 focus:border-transparent"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="submit"
                variant="primary"
                icon={<Save className="w-4 h-4" />}
                disabled={createRequest.isPending}
              >
                {createRequest.isPending ? 'Création...' : 'Créer la demande'}
              </Button>
              <Button
                type="button"
                variant="outline"
                icon={<X className="w-4 h-4" />}
                onClick={() => navigate('/maintenance/requests')}
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
