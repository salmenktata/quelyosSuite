/**
 * Ouverture de session POS
 *
 * Fonctionnalités :
 * - Sélection du terminal de caisse disponible
 * - Saisie du fond de caisse d'ouverture
 * - Montants rapides prédéfinis (0, 100, 200, 500 TND)
 * - Validation et redirection vers le terminal
 * - Gestion des erreurs et états de chargement
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlayCircle, Monitor, Banknote, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { Layout } from '../../components/Layout'
import { Breadcrumbs, Button, PageNotice } from '../../components/common'
import { posNotices } from '../../lib/notices/pos-notices'
import { usePOSConfigs } from '../../hooks/pos/usePOSConfigs'
import { useOpenSession } from '../../hooks/pos/usePOSSession'
import { logger } from '@quelyos/logger';

export default function POSSessionOpen() {
  const navigate = useNavigate()
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null)
  const [openingCash, setOpeningCash] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: configs = [], isLoading: configsLoading } = usePOSConfigs()
  const openSession = useOpenSession()

  // Filter available configs (not already with open session)
  const availableConfigs = configs.filter(c => !c.hasOpenSession)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedConfigId) {
      setError('Veuillez sélectionner un terminal')
      return
    }

    const cashAmount = parseFloat(openingCash) || 0

    try {
      await openSession.mutateAsync({
        configId: selectedConfigId,
        openingCash: cashAmount,
      })
      // Redirect to terminal
      navigate('/pos/terminal')
    } catch (err) {
      logger.error("Erreur:", err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ouverture de la session')
    }
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'POS', href: '/pos' },
            { label: 'Ouvrir une session' },
          ]}
        />

        <div className="max-w-lg mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
            {/* Back button */}
            <Button
              variant="secondary"
              size="sm"
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate('/pos')}
              className="mb-6"
            >
              Retour au dashboard
            </Button>

            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mb-4">
                <PlayCircle className="h-8 w-8 text-teal-600 dark:text-teal-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Ouvrir une Session
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Démarrez votre journée de caisse
              </p>
            </div>

            {/* PageNotice */}
            <PageNotice config={posNotices.sessionOpen} className="mb-6" />

        {error && (
          <div role="alert" className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Terminal selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Terminal
            </label>
            {configsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
              </div>
            ) : availableConfigs.length === 0 ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-amber-700 dark:text-amber-300 text-sm">
                  {configs.length === 0
                    ? 'Aucun terminal configuré. Créez-en un dans les paramètres.'
                    : 'Tous les terminaux ont déjà une session ouverte.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableConfigs.map((config) => (
                  <button
                    key={config.id}
                    type="button"
                    onClick={() => setSelectedConfigId(config.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                      selectedConfigId === config.id
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className={`p-3 rounded-lg ${
                      selectedConfigId === config.id
                        ? 'bg-teal-100 dark:bg-teal-900/30'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <Monitor className={`h-5 w-5 ${
                        selectedConfigId === config.id
                          ? 'text-teal-600 dark:text-teal-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`} />
                    </div>
                    <div className="text-left flex-1">
                      <p className={`font-medium ${
                        selectedConfigId === config.id
                          ? 'text-teal-700 dark:text-teal-300'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {config.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {config.warehouse?.name || 'Aucun entrepôt'} • {config.paymentMethods.length} paiements
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Opening cash */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Fond de caisse (TND)
            </label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Montant en espèces dans le tiroir-caisse
            </p>
          </div>

          {/* Quick amounts */}
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Montants rapides</p>
            <div className="flex gap-2">
              {[0, 100, 200, 500].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setOpeningCash(amount.toString())}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    parseFloat(openingCash) === amount
                      ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {amount === 0 ? 'Vide' : `${amount}`}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={!selectedConfigId || openSession.isPending}
            icon={openSession.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlayCircle className="h-5 w-5" />}
            className="w-full py-4 text-lg"
          >
            {openSession.isPending ? 'Ouverture en cours...' : 'Ouvrir la Session'}
          </Button>
        </form>
          </div>
        </div>
      </div>
    </Layout>
  )
}
