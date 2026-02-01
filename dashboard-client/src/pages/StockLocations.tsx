/**
 * Page de gestion des emplacements stock avec vue arbre hiérarchique
 *
 * Fonctionnalités :
 * - Vue arbre expand/collapse
 * - Drag & Drop pour réorganiser
 * - CRUD complet (créer, modifier, archiver)
 * - Filtres par entrepôt et type
 * - Recherche
 */

import { useState, useMemo } from 'react'
import { Layout } from '../components/Layout'
import { Breadcrumbs, Badge, PageNotice } from '../components/common'
import { stockNotices } from '@/lib/notices'
import { useLocationsTree, useMoveLocation, useArchiveLocation } from '../hooks/finance/useStockLocations'
import { useWarehouses } from '../hooks/useWarehouses'
import { LocationTreeView } from '../components/stock/LocationTreeView'
import { LocationFormModal } from '../components/stock/LocationFormModal'
import { filterTree, toggleExpanded, expandAll, collapseAll } from '../lib/stock/tree-utils'
import { Plus, Maximize2, Minimize2, Search, Filter } from 'lucide-react'
import type { StockLocation } from '@/types/stock'
import { logger } from '@quelyos/logger'

export default function StockLocations() {
  const [search, setSearch] = useState('')
  const [usageFilter, setUsageFilter] = useState<'all' | 'internal' | 'view'>('all')
  const [warehouseFilter, setWarehouseFilter] = useState<number | undefined>()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<StockLocation | undefined>()
  const [parentIdForNew, setParentIdForNew] = useState<number | undefined>()

  const { tree, locations, isLoading, error, refetch } = useLocationsTree({
    warehouse_id: warehouseFilter,
    usage: usageFilter !== 'all' ? usageFilter : undefined,
  })

  const { data: warehousesData } = useWarehouses({ active_only: true })
  const { mutate: moveLocation } = useMoveLocation()
  const { mutate: archiveLocation } = useArchiveLocation()

  const warehouses = warehousesData || []

  // Filtrer l'arbre par recherche
  const filteredTree = useMemo(() => {
    return filterTree(tree, search)
  }, [tree, search])

  const handleEdit = (location: StockLocation) => {
    setEditingLocation(location)
    setParentIdForNew(undefined)
    setIsModalOpen(true)
  }

  const handleAddChild = (parentId: number) => {
    setEditingLocation(undefined)
    setParentIdForNew(parentId)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setEditingLocation(undefined)
    setParentIdForNew(undefined)
    setIsModalOpen(true)
  }

  const handleArchive = (locationId: number) => {
    archiveLocation(locationId, {
      onSuccess: () => {
        refetch()
        logger.info('[StockLocations] Location archived')
      },
      onError: (error: Error) => {
        alert(error.message || 'Erreur lors de l\'archivage')
      }
    })
  }

  const handleMove = (draggedId: number, targetId: number) => {
    moveLocation(
      { id: draggedId, new_parent_id: targetId },
      {
        onSuccess: () => {
          refetch()
          logger.info('[StockLocations] Location moved')
        },
        onError: (error: Error) => {
          alert(error.message || 'Erreur lors du déplacement')
        }
      }
    )
  }

  const handleToggleExpand = (locationId: number) => {
    toggleExpanded(locationId)
    refetch() // Force refresh pour reconstruire l'arbre avec le nouvel état
  }

  const handleExpandAll = () => {
    expandAll(tree)
    refetch()
  }

  const handleCollapseAll = () => {
    collapseAll()
    refetch()
  }

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Stock', href: '/stock' },
            { label: 'Emplacements' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Emplacements Stock
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Vue hiérarchique des emplacements avec gestion complète
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Créer Emplacement
          </button>
        </div>

        <PageNotice config={stockNotices.locations} className="mb-6" />

        {/* Filtres et actions */}
        <div className="mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                <Search className="inline mr-2 h-4 w-4" />
                Recherche
              </label>
              <input
                type="text"
                placeholder="Nom, chemin complet, code-barres..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Filtre Type */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                <Filter className="inline mr-2 h-4 w-4" />
                Type
              </label>
              <select
                value={usageFilter}
                onChange={(e) => setUsageFilter(e.target.value as 'all' | 'view' | 'internal')}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">Tous les types</option>
                <option value="internal">Stock physique</option>
                <option value="view">Catégories</option>
              </select>
            </div>

            {/* Filtre Entrepôt */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                Entrepôt
              </label>
              <select
                value={warehouseFilter || ''}
                onChange={(e) => setWarehouseFilter(e.target.value ? Number(e.target.value) : undefined)}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Tous les entrepôts</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions expand/collapse */}
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={handleExpandAll}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-900 dark:text-white dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <Maximize2 className="h-3 w-3 mr-1" />
              Tout déplier
            </button>
            <button
              onClick={handleCollapseAll}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-900 dark:text-white dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <Minimize2 className="h-3 w-3 mr-1" />
              Tout replier
            </button>
            {search && (
              <Badge variant="info">
                Recherche active : "{search}"
              </Badge>
            )}
          </div>
        </div>

        {/* Stats */}
        {locations.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total emplacements</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white dark:text-gray-100">{locations.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Stock physique</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {locations.filter(l => l.usage === 'internal').length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Catégories</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {locations.filter(l => l.usage === 'view').length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Avec stock</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {locations.filter(l => l.stock_count > 0).length}
              </p>
            </div>
          </div>
        )}

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
        ) : (
          /* Vue arbre */
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <LocationTreeView
              locations={filteredTree}
              onEdit={handleEdit}
              onArchive={handleArchive}
              onAddChild={handleAddChild}
              onMove={handleMove}
              onToggleExpand={handleToggleExpand}
            />
          </div>
        )}

        {/* Modal CRUD */}
        <LocationFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingLocation(undefined)
            setParentIdForNew(undefined)
          }}
          location={editingLocation}
          parentId={parentIdForNew}
          warehouseId={warehouseFilter}
          onSuccess={() => {
            setIsModalOpen(false)
            setEditingLocation(undefined)
            setParentIdForNew(undefined)
            refetch()
          }}
        />
      </div>
    </Layout>
  )
}
