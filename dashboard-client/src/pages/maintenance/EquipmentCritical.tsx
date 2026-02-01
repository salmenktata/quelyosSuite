/**
 * Équipements Critiques - Liste des équipements prioritaires
 *
 * Fonctionnalités :
 * - Liste des équipements critiques uniquement
 * - Indicateurs de criticité et état
 * - Filtres par catégorie et statut
 * - Actions rapides (maintenance, inspection)
 * - Alertes pour équipements en alerte
 */
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common'
import { maintenanceNotices } from '@/lib/notices/maintenance-notices'
import { AlertTriangle, Wrench, Plus, RefreshCw, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMaintenanceEquipment } from '@/hooks/useMaintenanceEquipment'

export default function EquipmentCritical() {
  const navigate = useNavigate()

  // Récupération des équipements critiques uniquement
  const { data, isLoading, isError } = useMaintenanceEquipment({ critical_only: true })
  const criticalEquipment = data?.data || []

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <SkeletonTable rows={8} columns={5} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'GMAO', href: '/maintenance' },
            { label: 'Équipements', href: '/maintenance/equipment' },
            { label: 'Critiques' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              Équipements Critiques
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Surveillance des équipements prioritaires et sensibles
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={<Wrench className="w-4 h-4" />}
              onClick={() => navigate('/maintenance/equipment')}
            >
              Tous les équipements
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/maintenance/equipment/new')}
            >
              Nouvel équipement
            </Button>
          </div>
        </div>

        <PageNotice config={maintenanceNotices.equipmentCritical} className="mb-2" />

        {isError && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Erreur lors du chargement des équipements critiques.
              </p>
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => window.location.reload()}
              >
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {/* Liste des équipements critiques */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            {criticalEquipment.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Aucun équipement critique pour le moment
                </p>
                <Button
                  variant="primary"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => navigate('/maintenance/equipment/new')}
                >
                  Ajouter un équipement
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Équipement
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Catégorie
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Statut
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Criticité
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {criticalEquipment.map((equipment) => (
                      <tr key={equipment.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {equipment.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                          {equipment.category_name}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            equipment.uptime_percentage >= 95
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : equipment.uptime_percentage >= 85
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                            {equipment.uptime_percentage.toFixed(1)}% uptime
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Critique
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/maintenance/equipment/${equipment.id}`)}
                            >
                              Détails
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // TODO: Ouvrir modal création demande pour cet équipement
                                alert(`Créer intervention pour ${equipment.name}`)
                              }}
                            >
                              Intervention
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
