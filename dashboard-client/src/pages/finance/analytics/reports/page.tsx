import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs } from '@/components/common'
import { apiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

interface AnalyticDistribution {
  accountId: number
  accountName: string
  debit: number
  credit: number
  balance: number
  percentage: number
}

export default function AnalyticsReportsPage() {
  const [distribution, setDistribution] = useState<AnalyticDistribution[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.post('/finance/analytics/distribution', { axis_id: 1 }).then(res => {
      if (res.data.success) setDistribution(res.data.data.distribution)
      setLoading(false)
    })
  }, [])

  if (loading) return <Layout><div>Chargement...</div></Layout>

  return (
    <Layout>
      <Breadcrumbs items={[
        { label: 'Finance', path: '/finance' },
        { label: 'Analytique', path: '/finance/analytics' },
        { label: 'Rapports', path: '/finance/analytics/reports' },
      ]} />

      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Rapports Analytiques</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Compte</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Débit</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Crédit</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Solde</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {distribution.map((item) => (
              <tr key={item.accountId}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.accountName}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">{formatCurrency(item.debit, '€')}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">{formatCurrency(item.credit, '€')}</td>
                <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">{formatCurrency(item.balance, '€')}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-400">{item.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
