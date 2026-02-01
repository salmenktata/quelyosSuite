/**
 * Page de gestion des Groupes d'Inventaire OCA (stock_inventory module)
 *
 * Fonctionnalités :
 * - Liste des groupes d'inventaire avec workflow complet
 * - Création groupe avec sélection produits/emplacements
 * - Workflow 4 états : draft → in_progress → done (ou cancel)
 * - KPI summary (groupes totaux, en cours, validés)
 * - Filtres par état et emplacement
 * - Actions : Démarrer, Valider, Annuler, Supprimer
 * - Détail groupe avec ajustements et mouvements stock
 */

import { useState } from 'react'
import { Layout } from '../../components/Layout'
import { Breadcrumbs, Badge, PageNotice, SkeletonTable, Button } from '../../components/common'
import { stockNotices } from '@/lib/notices'
import {
  useInventoryGroups,
  useCreateInventoryGroup,
  useStartInventoryGroup,
  useValidateInventoryGroup,
  useCancelInventoryGroup,
  useDeleteInventoryGroup,
} from '../../hooks/useInventoryGroups'
import { Plus, Play, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import { logger } from '@quelyos/logger'

export default function InventoryGroups() {
  const [stateFilter, setStateFilter] = useState<'all' | 'draft' | 'in_progress' | 'done' | 'cancel'>('all')
  const [_isCreateModalOpen, _setIsCreateModalOpen] = useState(false)
  const [_selectedGroupId, _setSelectedGroupId] = useState<number | null>(null)

  const { inventoryGroups, totalCount, loading, error, refetch } = useInventoryGroups({
    state: stateFilter === 'all' ? undefined : stateFilter,
  })

  const { createGroup, creating } = useCreateInventoryGroup()
  const { startGroup, starting } = useStartInventoryGroup()
  const { validateGroup, validating } = useValidateInventoryGroup()
  const { cancelGroup, canceling } = useCancelInventoryGroup()
  const { deleteGroup, deleting } = useDeleteInventoryGroup()

  const draftCount = inventoryGroups.filter((g) => g.state === 'draft').length
  const inProgressCount = inventoryGroups.filter((g) => g.state === 'in_progress').length
  const doneCount = inventoryGroups.filter((g) => g.state === 'done').length

  const handleCreate = async () => {
    const name = prompt('Nom du groupe d\'inventaire :')
    if (!name) return

    const locationIdsStr = prompt('IDs emplacements (séparés par virgule, ex: 8,9) :')
    if (!locationIdsStr) return

    const locationIds = locationIdsStr.split(',').map((id) => parseInt(id.trim(), 10))

    const result = await createGroup({ name, location_ids: locationIds, product_selection: 'all' })
    if (result) {
      refetch()
      logger.info('[InventoryGroups] Group created', { groupId: result.id })
    }
  }

  const handleStart = async (groupId: number, groupName: string) => {
    if (!confirm(`Démarrer l'inventaire "${groupName}" ?`)) return

    const success = await startGroup(groupId)
    if (success) {
      refetch()
      logger.info('[InventoryGroups] Group started', { groupId })
    }
  }

  const handleValidate = async (groupId: number, groupName: string) => {
    if (!confirm(`Valider l'inventaire "${groupName}" ? Les ajustements seront appliqués au stock.`)) return

    const success = await validateGroup(groupId)
    if (success) {
      refetch()
      logger.info('[InventoryGroups] Group validated', { groupId })
    }
  }

  const handleCancel = async (groupId: number, groupName: string) => {
    if (!confirm(`Annuler l'inventaire "${groupName}" ?`)) return

    const success = await cancelGroup(groupId)
    if (success) {
      refetch()
      logger.info('[InventoryGroups] Group canceled', { groupId })
    }
  }

  const handleDelete = async (groupId: number, groupName: string) => {
    if (!confirm(`Supprimer l'inventaire "${groupName}" ? (uniquement si brouillon ou annulé)`)) return

    const success = await deleteGroup(groupId)
    if (success) {
      refetch()
      logger.info('[InventoryGroups] Group deleted', { groupId })
    }
  }

  const getStateBadgeVariant = (state: string) => {
    switch (state) {
      case 'draft':
        return 'neutral'
      case 'in_progress':
        return 'warning'
      case 'done':
        return 'success'
      case 'cancel':
        return 'error'
      default:
        return 'neutral'
    }
  }

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'draft':
        return 'Brouillon'
      case 'in_progress':
        return 'En cours'
      case 'done':
        return 'Validé'
      case 'cancel':
        return 'Annulé'
      default:
        return state
    }
  }

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Stock', href: '/stock' },
            { label: 'Groupes Inventaire OCA' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Groupes d&apos;Inventaire</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Groupement d&apos;ajustements inventaire (Module OCA)
            </p>
          </div>
          <Button variant="primary" icon={<Plus className="h-5 w-5" />} onClick={handleCreate} disabled={creating}>
            {creating ? 'Création...' : 'Créer Groupe'}
          </Button>
        </div>

        <PageNotice config={stockNotices.inventoryGroups} className="mb-6" />

        {/* KPI Summary */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total groupes</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Brouillons</p>
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{draftCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">En cours</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{inProgressCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Validés</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{doneCount}</p>
          </div>
        </div>

        {/* Filtre État */}
        <div className="mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">État</label>
          <select
            className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value as typeof stateFilter)}
          >
            <option value="all">Tous</option>
            <option value="draft">Brouillon</option>
            <option value="in_progress">En cours</option>
            <option value="done">Validé</option>
            <option value="cancel">Annulé</option>
          </select>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && <SkeletonTable rows={5} />}

        {/* Table */}
        {!loading && !error && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {inventoryGroups.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Aucun groupe d&apos;inventaire trouvé
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Nom
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        État
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Emplacements
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Produits
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Quants
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {inventoryGroups.map((group) => (
                      <tr key={group.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-gray-900 dark:text-white">{group.name}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {group.date ? new Date(group.date).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStateBadgeVariant(group.state)}>{getStateLabel(group.state)}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {group.location_names.join(', ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {group.product_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {group.quant_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex items-center justify-end gap-2">
                            {group.state === 'draft' && (
                              <button
                                onClick={() => handleStart(group.id, group.name)}
                                className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Démarrer"
                                disabled={starting}
                              >
                                <Play className="h-4 w-4" />
                              </button>
                            )}
                            {group.state === 'in_progress' && (
                              <button
                                onClick={() => handleValidate(group.id, group.name)}
                                className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                title="Valider"
                                disabled={validating}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            {group.state !== 'done' && (
                              <button
                                onClick={() => handleCancel(group.id, group.name)}
                                className="p-1 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                                title="Annuler"
                                disabled={canceling}
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                            {(group.state === 'draft' || group.state === 'cancel') && (
                              <button
                                onClick={() => handleDelete(group.id, group.name)}
                                className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                title="Supprimer"
                                disabled={deleting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
