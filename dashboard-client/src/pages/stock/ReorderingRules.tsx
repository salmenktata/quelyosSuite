/**
 * Page de gestion des règles de réapprovisionnement automatique
 *
 * Fonctionnalités :
 * - Liste des règles avec état actuel (triggered/ok)
 * - KPI summary (règles actives, déclenchées, qty à commander)
 * - CRUD complet (créer, modifier, activer/désactiver, supprimer)
 * - Filtres par entrepôt et statut
 * - Simulation quantité à commander
 */

import { useState } from 'react'
import { Layout } from '../components/Layout'
import { Breadcrumbs, Badge } from '../components/common'
import { useReorderingRules, useDeleteReorderingRule, useToggleReorderingRule } from '../hooks/finance/useReorderingRules'
import { useWarehouses } from '../hooks/useWarehouses'
import { ReorderingRuleFormModal } from '../components/stock/ReorderingRuleFormModal'
import { Plus, Filter, MoreVertical, Pencil, Power, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { ReorderingRule } from '@/types/stock'
import { logger } from '@quelyos/logger'

export default function ReorderingRules() {
  const [warehouseFilter, setWarehouseFilter] = useState<number | undefined>()
  const [statusFilter, setStatusFilter] = useState<'all' | 'triggered' | 'active'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<ReorderingRule | undefined>()

  const { data, isLoading, error, refetch } = useReorderingRules({
    warehouse_id: warehouseFilter,
    triggered: statusFilter === 'triggered' ? true : undefined,
    active: statusFilter === 'active' ? true : undefined
  })

  const { data: warehousesData } = useWarehouses({ active_only: true })
  const { mutate: deleteRule } = useDeleteReorderingRule()
  const { mutate: toggleRule } = useToggleReorderingRule()

  const warehouses = warehousesData || []
  const rules = data?.rules || []
  const triggeredCount = rules.filter(r => r.is_triggered).length
  const totalQtyToOrder = rules.reduce((sum, r) => sum + r.qty_to_order, 0)

  const handleEdit = (rule: ReorderingRule) => {
    setEditingRule(rule)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingRule(undefined)
    setIsModalOpen(true)
  }

  const handleToggleActive = (ruleId: number, newActiveState: boolean) => {
    toggleRule(
      { id: ruleId, active: newActiveState },
      {
        onSuccess: () => {
          refetch()
          logger.info('[ReorderingRules] Rule toggled')
        },
        onError: (error: any) => {
          alert(error.message || 'Erreur lors de la modification')
        }
      }
    )
  }

  const handleDelete = (ruleId: number, productName: string) => {
    if (!confirm(`Supprimer la règle pour "${productName}" ?`)) {
      return
    }

    deleteRule(ruleId, {
      onSuccess: () => {
        refetch()
        logger.info('[ReorderingRules] Rule deleted')
      },
      onError: (error: any) => {
        alert(error.message || 'Erreur lors de la suppression')
      }
    })
  }

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Stock', href: '/stock' },
            { label: 'Règles de réapprovisionnement' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Règles de Réapprovisionnement
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gestion automatique des commandes fournisseurs
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Créer Règle
          </button>
        </div>

        {/* KPI Summary */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Règles actives</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {rules.filter(r => r.active).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Règles déclenchées</p>
                <p className={`text-2xl font-bold ${triggeredCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-gray-100'}`}>
                  {triggeredCount}
                </p>
              </div>
              {triggeredCount > 0 && (
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Quantité à commander</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalQtyToOrder.toFixed(0)} unités
            </p>
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtre Entrepôt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Entrepôt
              </label>
              <select
                value={warehouseFilter || ''}
                onChange={(e) => setWarehouseFilter(e.target.value ? Number(e.target.value) : undefined)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Tous les entrepôts</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre Statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Filter className="inline mr-2 h-4 w-4" />
                Statut
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">Toutes les règles</option>
                <option value="triggered">Déclenchées uniquement</option>
                <option value="active">Actives uniquement</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <p className="text-red-800 dark:text-red-200">Erreur : {error.message}</p>
            <button
              onClick={() => refetch()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Réessayer
            </button>
          </div>
        ) : rules.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Aucune règle de réapprovisionnement configurée
            </p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Créer votre première règle
            </button>
          </div>
        ) : (
          /* Tableau */
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Entrepôt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Stock actuel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Seuils
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      À commander
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {rule.product_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {rule.product_sku}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {rule.warehouse_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {rule.current_stock}
                          </span>
                          {rule.is_triggered && (
                            <Badge variant="warning">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Bas
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        Min: <strong>{rule.min_qty}</strong> / Max: <strong>{rule.max_qty}</strong>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {rule.qty_to_order > 0 ? (
                          <Badge variant="warning">{rule.qty_to_order} unités</Badge>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {rule.active ? (
                          <Badge variant="success">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="neutral">Inactive</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const dropdown = e.currentTarget.nextElementSibling as HTMLElement
                              if (dropdown) {
                                dropdown.classList.toggle('hidden')
                              }
                            }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>

                          {/* Dropdown menu */}
                          <div className="hidden absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEdit(rule)
                                const dropdown = e.currentTarget.parentElement
                                if (dropdown) dropdown.classList.add('hidden')
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                            >
                              <Pencil className="h-4 w-4" />
                              Modifier
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleActive(rule.id, !rule.active)
                                const dropdown = e.currentTarget.parentElement
                                if (dropdown) dropdown.classList.add('hidden')
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Power className="h-4 w-4" />
                              {rule.active ? 'Désactiver' : 'Activer'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(rule.id, rule.product_name)
                                const dropdown = e.currentTarget.parentElement
                                if (dropdown) dropdown.classList.add('hidden')
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                            >
                              <Trash2 className="h-4 w-4" />
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal CRUD */}
        <ReorderingRuleFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingRule(undefined)
          }}
          rule={editingRule}
          onSuccess={() => {
            setIsModalOpen(false)
            setEditingRule(undefined)
            refetch()
          }}
        />
      </div>
    </Layout>
  )
}
