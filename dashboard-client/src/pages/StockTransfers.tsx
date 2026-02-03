/**
 * Page Transferts Stock - Gestion des mouvements inter-entrepôts
 *
 * Fonctionnalités :
 * - Liste des transferts avec filtres par état
 * - Création de nouveaux transferts
 * - Validation et annulation des transferts
 * - Recherche par référence
 * - Pagination des résultats
 */

import { useState } from 'react'
import { Layout } from '../components/Layout'
import {
  useStockTransfers,
  useValidateTransfer,
  useCancelTransfer,
} from '../hooks/useStockTransfers'
import { Badge, Button, Breadcrumbs, SkeletonTable, Modal, PageNotice } from '../components/common'
import { stockNotices } from '@/lib/notices'
import { useToast } from '../contexts/ToastContext'
import { TransferModal } from '../components/stock/TransferModal'
import type { StockTransfer, TransferState } from '@/types'
import { logger } from '@quelyos/logger';
import {
  ArrowLeftRight,
  Plus,
  Check,
  X,
  Search,
  Filter,
} from 'lucide-react'

const STATE_FILTERS: { value: TransferState | ''; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'waiting', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmé' },
  { value: 'assigned', label: 'Prêt' },
  { value: 'done', label: 'Fait' },
  { value: 'cancel', label: 'Annulé' },
]

export default function StockTransfers() {
  const [page, setPage] = useState(0)
  const [stateFilter, setStateFilter] = useState<TransferState | ''>('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{
    type: 'validate' | 'cancel'
    transfer: StockTransfer
  } | null>(null)

  const limit = 20
  const toast = useToast()

  const { data, isLoading, error } = useStockTransfers({
    limit,
    offset: page * limit,
    state: stateFilter || undefined,
    search: search || undefined,
  })

  const validateMutation = useValidateTransfer()
  const cancelMutation = useCancelTransfer()

  const transfers = data?.data?.transfers || []
  const total = data?.data?.total || 0

  const getStateBadgeVariant = (
    state: TransferState
  ): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
    switch (state) {
      case 'done':
        return 'success'
      case 'assigned':
        return 'info'
      case 'confirmed':
      case 'waiting':
        return 'warning'
      case 'cancel':
        return 'error'
      default:
        return 'neutral'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  const handleValidate = async () => {
    if (!confirmModal || confirmModal.type !== 'validate') return

    try {
      await validateMutation.mutateAsync(confirmModal.transfer.id)
      toast.success(`Transfert ${confirmModal.transfer.name} validé`)
      setConfirmModal(null)
    } catch {
      logger.error("Erreur attrapée");
      toast.error('Erreur lors de la validation')
    }
  }

  const handleCancel = async () => {
    if (!confirmModal || confirmModal.type !== 'cancel') return

    try {
      await cancelMutation.mutateAsync(confirmModal.transfer.id)
      toast.success(`Transfert ${confirmModal.transfer.name} annulé`)
      setConfirmModal(null)
    } catch {
      logger.error("Erreur attrapée");
      toast.error("Erreur lors de l'annulation")
    }
  }

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    toast.success('Transfert créé avec succès')
  }

  const canValidate = (state: TransferState) =>
    ['draft', 'waiting', 'confirmed', 'assigned'].includes(state)

  const canCancel = (state: TransferState) =>
    ['draft', 'waiting', 'confirmed', 'assigned'].includes(state)

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Stock', href: '/stock' },
            { label: 'Transferts' },
          ]}
        />

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <ArrowLeftRight className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              Transferts Inter-entrepôts
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gérer les mouvements de stock entre sites
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Nouveau transfert
          </Button>
        </div>

        <PageNotice config={stockNotices.transfers} className="mb-6" />

        {/* Filtres */}
        <div className="mb-6 space-y-4">
          {/* Pills états */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            {STATE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  setStateFilter(filter.value)
                  setPage(0)
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  stateFilter === filter.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Recherche */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Rechercher par référence..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <Button type="submit" variant="secondary">
              Rechercher
            </Button>
          </form>
        </div>

        {/* Table */}
        {isLoading ? (
          <SkeletonTable rows={5} columns={6} />
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            Erreur lors du chargement des transferts
          </div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <ArrowLeftRight className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              Aucun transfert
            </h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              {stateFilter || search
                ? 'Aucun transfert ne correspond à vos critères'
                : 'Créez votre premier transfert inter-entrepôts'}
            </p>
            {!stateFilter && !search && (
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="h-5 w-5 mr-2" />
                Nouveau transfert
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      De → Vers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Produits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      État
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {transfers.map((transfer) => (
                    <tr
                      key={transfer.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {transfer.name}
                        </span>
                        {transfer.user_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            par {transfer.user_name}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900 dark:text-white">
                            {transfer.from_warehouse || transfer.from_location}
                          </p>
                          <p className="text-gray-400">↓</p>
                          <p className="text-gray-900 dark:text-white">
                            {transfer.to_warehouse || transfer.to_location}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {transfer.products_count} produit(s)
                          {transfer.products.slice(0, 2).map((p, i) => (
                            <p key={i} className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                              {p.quantity}x {p.name}
                            </p>
                          ))}
                          {transfer.products.length > 2 && (
                            <p className="text-xs text-gray-400">
                              +{transfer.products.length - 2} autres
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(transfer.create_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStateBadgeVariant(transfer.state)}>
                          {transfer.state_label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canValidate(transfer.state) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setConfirmModal({ type: 'validate', transfer })
                              }
                              title="Valider le transfert"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {canCancel(transfer.state) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setConfirmModal({ type: 'cancel', transfer })
                              }
                              title="Annuler le transfert"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > limit && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {page * limit + 1} - {Math.min((page + 1) * limit, total)} sur {total}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Précédent
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={(page + 1) * limit >= total}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal création */}
        {showCreateModal && (
          <TransferModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleCreateSuccess}
          />
        )}

        {/* Modal confirmation */}
        {confirmModal && (
          <Modal
            isOpen={true}
            onClose={() => setConfirmModal(null)}
            title={
              confirmModal.type === 'validate'
                ? 'Valider le transfert'
                : 'Annuler le transfert'
            }
          >
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {confirmModal.type === 'validate'
                ? `Voulez-vous valider le transfert ${confirmModal.transfer.name} ? Le stock sera mis à jour.`
                : `Voulez-vous annuler le transfert ${confirmModal.transfer.name} ?`}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirmModal(null)}>
                Annuler
              </Button>
              <Button
                variant={confirmModal.type === 'validate' ? 'primary' : 'danger'}
                onClick={confirmModal.type === 'validate' ? handleValidate : handleCancel}
                disabled={validateMutation.isPending || cancelMutation.isPending}
              >
                {confirmModal.type === 'validate' ? 'Valider' : 'Confirmer annulation'}
              </Button>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  )
}
