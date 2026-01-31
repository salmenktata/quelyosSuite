/**
 * Page Gestion des Revenus
 *
 * Fonctionnalités :
 * - Liste complète des revenus avec filtres
 * - Catégorisation par source (ventes, prestations, subventions)
 * - Suivi par compte et statut
 * - Statistiques revenus totaux
 * - Analyse saisonnalité
 */

import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, SkeletonTable, PageNotice, Button } from '@/components/common'
import { financeNotices } from '@/lib/notices'
import { ArrowUpCircle, Plus, Search, X } from 'lucide-react'
import { api } from '@/lib/finance/api'
import { useCurrency } from '@/lib/finance/CurrencyContext'
import { logger } from '@quelyos/logger';

type Transaction = {
  id: number
  type: 'credit'
  description: string
  amount: number
  date: string
  categoryName?: string
  accountName?: string
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
}

type Category = {
  id: number
  name: string
}

export default function IncomesPage() {
  const { formatAmount } = useCurrency()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [txData, catData] = await Promise.all([
        api<Transaction[]>('/finance/transactions?type=credit'),
        api<Category[]>('/finance/categories?kind=INCOME'),
      ])
      setTransactions(txData)
      setCategories(catData)
    } catch (err) {
      logger.error("Erreur:", err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch = searchQuery === '' || tx.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCategory = selectedCategory === 'all' || tx.categoryName === selectedCategory
      return matchSearch && matchCategory
    })
  }, [transactions, searchQuery, selectedCategory])

  const totalIncomes = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0)
  }, [filteredTransactions])

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Finance', href: '/finance' },
            { label: 'Revenus' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Revenus
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Suivez et gérez tous vos revenus d'entreprise
            </p>
          </div>
          <Link to="/finance/incomes/new">
            <Button variant="primary" icon={<Plus className="h-5 w-5" />}>
              Nouveau Revenu
            </Button>
          </Link>
        </div>

        <PageNotice config={financeNotices.incomes} className="mb-6" />

        {/* Stats */}
        {!isLoading && !error && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <ArrowUpCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenus</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatAmount(totalIncomes)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un revenu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <SkeletonTable rows={15} columns={5} />
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6" role="alert">
            <p className="text-red-800 dark:text-red-200 mb-4">
              {error}
            </p>
            <Button variant="secondary" onClick={fetchData}>
              Réessayer
            </Button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
            <ArrowUpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucun revenu trouvé
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Commencez par enregistrer votre premier revenu
            </p>
            <Link to="/finance/incomes/new">
              <Button variant="primary" icon={<Plus className="h-5 w-5" />}>
                Nouveau Revenu
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Compte
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Montant
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(tx.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {tx.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {tx.categoryName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {tx.accountName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      +{formatAmount(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
