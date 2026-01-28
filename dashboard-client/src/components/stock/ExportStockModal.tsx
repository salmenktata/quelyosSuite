/**
 * Modal d'export CSV du stock
 *
 * Permet d'exporter le stock avec filtres dates pour compliance audit
 */

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import { X, Download, CheckCircle } from 'lucide-react'
import { useExportStock } from '../../hooks/useStock'
import { useToast } from '../../hooks/useToast'
import { exportToCSV } from '../../lib/csv-utils'
import { logger } from '@quelyos/logger'

interface ExportStockModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ExportFilters {
  date_from?: string
  date_to?: string
}

export function ExportStockModal({ isOpen, onClose }: ExportStockModalProps) {
  const { success, error: showError } = useToast()
  const exportMutation = useExportStock()

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<ExportFilters>()

  const onSubmit = async (data: ExportFilters) => {
    try {
      const response = await exportMutation.mutateAsync(data)

      if (response.success && response.data) {
        // Générer et télécharger le CSV
        const filename = `stock_${new Date().toISOString().split('T')[0]}.csv`
        exportToCSV(
          response.data.data,
          filename,
          ['id', 'name', 'sku', 'qty_available', 'virtual_available', 'list_price', 'standard_price', 'valuation', 'category', 'create_date']
        )

        success(`Export réussi : ${response.data.total} produits exportés`)
        reset()
        onClose()
      } else {
        showError(response.error || 'Erreur lors de l\'export')
      }
    } catch (error) {
      logger.error('Export stock error:', error)
      showError(error instanceof Error ? error.message : 'Erreur lors de l\'export')
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 dark:bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                      Exporter le stock (CSV)
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label="Fermer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Export CSV du stock avec colonnes : ID, Nom, SKU, Stock disponible, Stock virtuel, Prix vente, Coût, Valorisation, Catégorie, Date création.
                  </p>

                  {/* Filtres dates */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Filtres (optionnels)
                    </h3>

                    <div>
                      <label
                        htmlFor="date_from"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Date création depuis
                      </label>
                      <input
                        {...register('date_from')}
                        type="date"
                        id="date_from"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Produits créés après cette date
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="date_to"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Date création jusqu'à
                      </label>
                      <input
                        {...register('date_to')}
                        type="date"
                        id="date_to"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Produits créés avant cette date
                      </p>
                    </div>
                  </div>

                  {/* Info compliance */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      <strong>Compliance :</strong> Export formaté UTF-8 BOM pour Excel français. Valorisation calculée automatiquement (stock × coût).
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          Export en cours...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          Exporter CSV
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
