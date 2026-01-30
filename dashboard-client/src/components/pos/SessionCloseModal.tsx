/**
 * Modal de fermeture de session POS avec rapport Z
 */

import { useState } from 'react'
import { X, Banknote, Loader2, AlertTriangle, CheckCircle, Printer } from 'lucide-react'
import { useCloseSession } from '../../hooks/pos/usePOSSession'
import type { POSSession, POSZReport } from '../../types/pos'

interface SessionCloseModalProps {
  isOpen: boolean
  session: POSSession
  onClose: () => void
  onSuccess: () => void
}

export function SessionCloseModal({
  isOpen,
  session,
  onClose,
  onSuccess,
}: SessionCloseModalProps) {
  const [closingCash, setClosingCash] = useState('')
  const [note, setNote] = useState('')
  const [zReport, setZReport] = useState<POSZReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  const closeSession = useCloseSession()

  const theoreticalCash = session.theoreticalClosingCash || (session.openingCash + session.totalCash)
  const enteredCash = parseFloat(closingCash) || 0
  const difference = enteredCash - theoreticalCash

  const handleSubmit = async () => {
    setError(null)

    try {
      const report = await closeSession.mutateAsync({
        sessionId: session.id,
        closingCash: enteredCash,
        note: note || undefined,
      })
      setZReport(report)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la fermeture')
    }
  }

  const handlePrintReport = () => {
    // TODO: Implement actual printing
    window.print()
  }

  const handleFinish = () => {
    setZReport(null)
    onSuccess()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {zReport ? 'Rapport Z' : 'Fermer la Session'}
          </h2>
          <button
            onClick={zReport ? handleFinish : onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {zReport ? (
          // Z Report View
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Session fermée avec succès
              </h3>
            </div>

            {/* Report summary */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3 mb-6">
              <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-3 mb-3">
                <p className="font-bold text-gray-900 dark:text-white">{zReport.session.configName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Session #{zReport.session.id}</p>
                <p className="text-xs text-gray-400">{new Date(zReport.generatedAt).toLocaleString('fr-FR')}</p>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Commandes</span>
                <span className="font-medium text-gray-900 dark:text-white">{zReport.session.orderCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Total ventes</span>
                <span className="font-bold text-gray-900 dark:text-white">{zReport.session.totalAmount.toFixed(2)} TND</span>
              </div>

              {/* Payments breakdown */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">Par mode de paiement</p>
                {zReport.paymentsByMethod.map((pm) => (
                  <div key={pm.method} className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{pm.method} ({pm.count})</span>
                    <span className="text-gray-900 dark:text-white">{pm.amount.toFixed(2)} TND</span>
                  </div>
                ))}
              </div>

              {/* Cash reconciliation */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">Réconciliation caisse</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Fond de caisse</span>
                  <span className="text-gray-900 dark:text-white">{zReport.session.openingCash.toFixed(2)} TND</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Espèces encaissées</span>
                  <span className="text-gray-900 dark:text-white">{zReport.session.totalCash.toFixed(2)} TND</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Théorique</span>
                  <span className="text-gray-900 dark:text-white">{zReport.session.theoreticalClosingCash.toFixed(2)} TND</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Compté</span>
                  <span className="text-gray-900 dark:text-white">{zReport.session.closingCash?.toFixed(2)} TND</span>
                </div>
                <div className={`flex justify-between text-sm font-medium ${
                  zReport.session.cashDifference === 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  <span>Écart</span>
                  <span>{zReport.session.cashDifference >= 0 ? '+' : ''}{zReport.session.cashDifference.toFixed(2)} TND</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handlePrintReport}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white dark:text-gray-300 rounded-lg transition-colors"
              >
                <Printer className="h-4 w-4" />
                Imprimer
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
              >
                Terminer
              </button>
            </div>
          </div>
        ) : (
          // Close session form
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Session summary */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Commandes</span>
                <span className="font-medium text-gray-900 dark:text-white">{session.orderCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Total ventes</span>
                <span className="font-bold text-gray-900 dark:text-white">{session.totalAmount.toFixed(2)} TND</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Espèces théorique</span>
                <span className="text-gray-900 dark:text-white">{theoreticalCash.toFixed(2)} TND</span>
              </div>
            </div>

            {/* Cash count */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                Espèces comptées (TND)
              </label>
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  placeholder={theoreticalCash.toFixed(2)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg"
                />
              </div>

              {/* Difference indicator */}
              {closingCash && (
                <div className={`mt-2 flex items-center gap-2 text-sm ${
                  Math.abs(difference) < 0.01
                    ? 'text-green-600 dark:text-green-400'
                    : Math.abs(difference) <= 5
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {Math.abs(difference) < 0.01 ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <span>
                    {Math.abs(difference) < 0.01
                      ? 'Caisse équilibrée'
                      : `Écart: ${difference >= 0 ? '+' : ''}${difference.toFixed(2)} TND`}
                  </span>
                </div>
              )}
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                Note (optionnel)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Observations sur la session..."
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={closeSession.isPending}
              className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-semibold rounded-lg text-lg transition-colors flex items-center justify-center gap-2"
            >
              {closeSession.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Fermeture en cours...
                </>
              ) : (
                'Fermer la Session'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
