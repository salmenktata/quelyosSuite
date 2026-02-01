/**
 * Détail Équipement GMAO - Fiche équipement complète
 *
 * Fonctionnalités :
 * - Informations équipement (nom, catégorie, série, garantie)
 * - KPI équipement : MTBF, MTTR, uptime, pannes
 * - Historique des 10 dernières interventions
 * - Création rapide nouvelle demande d'intervention
 * - Modification équipement
 */
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common'
import { maintenanceNotices } from '@/lib/notices'
import { Wrench, AlertCircle, RefreshCw, Plus, Pencil, Clock, TrendingUp, AlertTriangle, Calendar } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMaintenanceEquipmentDetail } from '@/hooks/useMaintenanceEquipment'

export default function EquipmentDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const equipmentId = id ? parseInt(id, 10) : 0

  const { data, isLoading, isError, refetch } = useMaintenanceEquipmentDetail(equipmentId)

  const equipment = data?.data

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <SkeletonTable rows={5} columns={2} />
        </div>
      </Layout>
    )
  }

  if (!equipment) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <Breadcrumbs
            items={[
              { label: 'Accueil', href: '/' },
              { label: 'GMAO', href: '/maintenance' },
              { label: 'Équipements', href: '/maintenance/equipment' },
              { label: 'Non trouvé' },
            ]}
          />
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Équipement non trouvé
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Cet équipement n'existe pas ou a été supprimé.
            </p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => navigate('/maintenance/equipment')}
            >
              Retour à la liste
            </Button>
          </div>
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
            { label: equipment.name },
          ]}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench className="w-8 h-8 text-amber-600 dark:text-amber-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {equipment.name}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {equipment.category_name || 'Aucune catégorie'}
              </p>
            </div>
            {equipment.is_critical && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                <AlertTriangle className="w-4 h-4" />
                Critique
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Pencil className="w-4 h-4" />}
              onClick={() => navigate(`/maintenance/equipment/${equipment.id}/edit`)}
            >
              Modifier
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => navigate(`/maintenance/requests/new?equipment=${equipment.id}`)}
            >
              Créer Intervention
            </Button>
          </div>
        </div>

        <PageNotice config={maintenanceNotices.equipmentDetail} className="mb-2" />

        {isError && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement des données.
              </p>
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => refetch()}
              >
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {/* Informations Générales */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Informations Générales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">N° Série</p>
              <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                {equipment.serial_number || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Emplacement</p>
              <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                {equipment.location || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Date d'achat</p>
              <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                {equipment.purchase_date ? new Date(equipment.purchase_date).toLocaleDateString('fr-FR') : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fin de garantie</p>
              <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                {equipment.warranty_end_date ? new Date(equipment.warranty_end_date).toLocaleDateString('fr-FR') : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* KPI Équipement */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Indicateurs de Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">MTBF</p>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {equipment.mtbf_hours.toFixed(1)}
                </p>
                <span className="text-sm text-gray-500 dark:text-gray-400">h</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Temps moyen entre pannes
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">MTTR</p>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {equipment.mttr_hours.toFixed(1)}
                </p>
                <span className="text-sm text-gray-500 dark:text-gray-400">h</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Temps moyen de réparation
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Taux Uptime</p>
              <div className="flex items-center gap-2">
                <TrendingUp
                  className={`w-5 h-5 ${
                    equipment.uptime_percentage >= 95
                      ? 'text-green-600 dark:text-green-500'
                      : 'text-orange-600 dark:text-orange-500'
                  }`}
                />
                <p
                  className={`text-2xl font-bold ${
                    equipment.uptime_percentage >= 95
                      ? 'text-green-600 dark:text-green-500'
                      : 'text-orange-600 dark:text-orange-500'
                  }`}
                >
                  {equipment.uptime_percentage.toFixed(1)}%
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Disponibilité
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pannes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {equipment.failure_count}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {equipment.last_failure_date
                  ? `Dernière : ${new Date(equipment.last_failure_date).toLocaleDateString('fr-FR')}`
                  : 'Aucune panne enregistrée'}
              </p>
            </div>
          </div>
        </div>

        {/* Prochaine Maintenance Préventive */}
        {equipment.next_preventive_date && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-200">
                  Prochaine maintenance préventive
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Prévue le {new Date(equipment.next_preventive_date).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Historique Interventions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Dernières Interventions ({equipment.recent_requests.length})
          </h2>
          {equipment.recent_requests.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Aucune intervention enregistrée pour cet équipement.
            </p>
          ) : (
            <div className="space-y-3">
              {equipment.recent_requests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-amber-500 dark:hover:border-amber-600 transition-colors cursor-pointer"
                  onClick={() => navigate(`/maintenance/requests/${request.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {request.name}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            request.maintenance_type === 'preventive'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                          }`}
                        >
                          {request.maintenance_type === 'preventive' ? 'Préventive' : 'Corrective'}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {request.stage_name}
                        </span>
                        {request.create_date && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(request.create_date).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
