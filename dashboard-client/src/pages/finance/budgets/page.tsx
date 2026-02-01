/**
 * Gestion des Budgets - Suivi budgétaire prévisionnels vs réalisés
 *
 * Fonctionnalités :
 * - Création budgets par période et catégorie avec montants prévisionnels
 * - Suivi réalisé vs prévu en temps réel avec calcul automatique des écarts
 * - Alertes dépassement automatiques configurables par seuil (80%, 100%)
 * - Répartition graphique des enveloppes budgétaires par catégorie
 * - Analyse écarts significatifs pour identifier dérives ou opportunités
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, PageNotice, SkeletonTable } from '@/components/common'
import { apiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { financeNotices } from '@/lib/notices/finance-notices'
import { Plus, AlertCircle, RefreshCw, Target } from 'lucide-react'

interface Budget {
  id: number
  name: string
  period: string
  totalBudget: number
  totalActual: number
}

export default function BudgetsPage() {
  const navigate = useNavigate()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchBudgets = () => {
    setLoading(true)
    setError(false)
    apiClient
      .post('/finance/budgets')
      .then(res => {
        if (res.data.success) setBudgets(res.data.data.budgets)
        setLoading(false)
      })
      .catch(_err => {
        setError(true)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchBudgets()
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <SkeletonTable rows={5} columns={6} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Finance', href: '/finance' },
            { label: 'Budgets' },
          ]}
        />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budgets</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Définissez et suivez vos budgets prévisionnels par catégorie
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/finance/budgets/new')}
          >
            Nouveau Budget
          </Button>
        </div>

        <PageNotice config={financeNotices.budgets} />

        {error && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement des budgets.
              </p>
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={fetchBudgets}
              >
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {!error && budgets.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Target className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Aucun budget trouvé
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Commencez par créer votre premier budget prévisionnel.
            </p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => navigate('/finance/budgets/new')}
            >
              Créer un budget
            </Button>
          </div>
        )}

        {!error && budgets.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Période
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Réalisé
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Taux
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {budgets.map((budget) => (
                  <tr
                    key={budget.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => navigate(`/finance/budgets/${budget.id}`)}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {budget.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {budget.period}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                      {formatCurrency(budget.totalBudget, '€')}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                      {formatCurrency(budget.totalActual, '€')}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-400">
                      {budget.completionRate}%
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                        {budget.status}
                      </span>
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
