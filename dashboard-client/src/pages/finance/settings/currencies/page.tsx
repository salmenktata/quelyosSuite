/**
 * Gestion Multi-Devises - Configuration et conversion
 *
 * Fonctionnalités:
 * - Liste devises actives avec taux change actuels
 * - Convertisseur temps réel entre devises
 * - Historique taux de change
 * - Mise à jour automatique taux (ECB, Yahoo, etc.)
 * - Support facturation multi-devises
 * - Devise base configurable par tenant
 */
import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, SkeletonTable } from '@/components/common'
import { RefreshCw, TrendingUp, DollarSign, AlertCircle } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { logger } from '@quelyos/logger'

type Currency = {
  id: number
  name: string
  symbol: string
  rate: number
  position: string
  decimalPlaces: number
  isBase: boolean
}

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [baseCurrency, setBaseCurrency] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Convertisseur
  const [fromCurrency, setFromCurrency] = useState<number | null>(null)
  const [toCurrency, setToCurrency] = useState<number | null>(null)
  const [amount, setAmount] = useState<string>('100')
  const [convertedAmount, setConvertedAmount] = useState<string>('')
  const [converting, setConverting] = useState(false)

  useEffect(() => {
    fetchCurrencies()
  }, [])

  const fetchCurrencies = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.get<{
        success: boolean
        data: { currencies: Currency[]; baseCurrency: any }
        error?: string
      }>('/finance/currencies')

      if (response.data.success && response.data.data) {
        setCurrencies(response.data.data.currencies)
        setBaseCurrency(response.data.data.baseCurrency)

        // Init convertisseur avec devise base et EUR
        const base = response.data.data.currencies.find(c => c.isBase)
        const eur = response.data.data.currencies.find(c => c.name === 'EUR')
        if (base) setFromCurrency(base.id)
        if (eur && !base?.isBase) setToCurrency(eur.id)
      } else {
        setError(response.data.error || 'Erreur lors du chargement')
      }
    } catch (err) {
      logger.error('Erreur fetch currencies:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleConvert = async () => {
    if (!fromCurrency || !toCurrency || !amount) return

    try {
      setConverting(true)

      const response = await apiClient.post<{
        success: boolean
        data: { convertedAmount: number; rate: number }
        error?: string
      }>('/finance/currencies/convert', {
        amount: parseFloat(amount),
        fromCurrencyId: fromCurrency,
        toCurrencyId: toCurrency,
      })

      if (response.data.success && response.data.data) {
        setConvertedAmount(response.data.data.convertedAmount.toFixed(2))
      }
    } catch (err) {
      logger.error('Erreur conversion:', err)
      alert('Erreur lors de la conversion')
    } finally {
      setConverting(false)
    }
  }

  useEffect(() => {
    if (fromCurrency && toCurrency && amount) {
      handleConvert()
    }
  }, [fromCurrency, toCurrency, amount])

  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
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
            { label: 'Facturation', href: '/invoicing' },
            { label: 'Paramètres', href: '/finance/settings' },
            { label: 'Devises' },
          ]}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestion Multi-Devises
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Configuration devises et taux de change pour facturation internationale
            </p>
          </div>
          <Button
            variant="secondary"
            icon={<RefreshCw />}
            onClick={fetchCurrencies}
          >
            Actualiser
          </Button>
        </div>

        {/* Devise Base */}
        {baseCurrency && (
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <div>
                <p className="text-sm text-indigo-900 dark:text-indigo-300 font-medium">
                  Devise de Base
                </p>
                <p className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
                  {baseCurrency.name} ({baseCurrency.symbol})
                </p>
                <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">
                  Tous les taux sont calculés par rapport à cette devise
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Convertisseur */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Convertisseur Temps Réel
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                Montant
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="100"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                De
              </label>
              <select
                value={fromCurrency || ''}
                onChange={(e) => setFromCurrency(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Sélectionner...</option>
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                Vers
              </label>
              <select
                value={toCurrency || ''}
                onChange={(e) => setToCurrency(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Sélectionner...</option>
                {currencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {convertedAmount && !converting && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                {convertedAmount}{' '}
                {currencies.find(c => c.id === toCurrency)?.symbol}
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                Conversion au taux du jour
              </p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Table Devises */}
        {!error && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Devise
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Symbole
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Taux vs {baseCurrency?.name}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Position
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {currencies.map((currency) => (
                    <tr
                      key={currency.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                        currency.isBase ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {currency.name}
                          </p>
                          {currency.isBase && (
                            <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded">
                              Base
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {currency.name}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {currency.symbol}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white font-mono">
                        {currency.rate.toFixed(6)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-700 dark:text-gray-300">
                        {currency.position === 'before' ? 'Avant' : 'Après'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
            Facturation Multi-Devises
          </h3>
          <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
            <li>• <strong>Factures</strong> : Créer factures dans n&apos;importe quelle devise active</li>
            <li>• <strong>Conversion auto</strong> : Taux jour appliqués automatiquement lors de la validation</li>
            <li>• <strong>Mise à jour</strong> : Taux synchronisés quotidiennement depuis BCE ou autre fournisseur</li>
            <li>• <strong>Rapports</strong> : Consolidation automatique dans devise base pour analytics</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
}
