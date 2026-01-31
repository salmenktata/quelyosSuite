import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button } from '@/components/common'
import { apiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Plus } from 'lucide-react'

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.post('/finance/budgets').then(res => {
      if (res.data.success) setBudgets(res.data.data.budgets)
      setLoading(false)
    })
  }, [])

  if (loading) return <Layout><div>Chargement...</div></Layout>

  return (
    <Layout>
      <Breadcrumbs items={[
        { label: 'Finance', path: '/finance' },
        { label: 'Budgets', path: '/finance/budgets' },
      ]} />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budgets</h1>
        <Button variant="primary"><Plus className="w-4 h-4 mr-2" />Nouveau Budget</Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Période</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Budget</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Réalisé</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Taux</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {budgets.map((budget: any) => (
              <tr key={budget.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{budget.name}</td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{budget.period}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">{formatCurrency(budget.totalBudget, '€')}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">{formatCurrency(budget.totalActual, '€')}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-400">{budget.completionRate}%</td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {budget.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
