import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs } from '@/components/common'
import { apiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

export default function ProfitLossPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    apiClient.post('/finance/reports/profit-loss').then(res => {
      if (res.data.success) setData(res.data.data)
    })
  }, [])

  if (!data) return <Layout><div>Chargement...</div></Layout>

  return (
    <Layout>
      <Breadcrumbs items={[
        { label: 'Finance', path: '/finance' },
        { label: 'Compte de Résultat', path: '/finance/reports/profit-loss' }
      ]} />
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Compte de Résultat</h1>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
        <div className="space-y-4">
          <div className="flex justify-between text-lg text-gray-900 dark:text-white">
            <span>Revenus</span>
            <span className="text-green-600 dark:text-green-400">{formatCurrency(data.revenue, '€')}</span>
          </div>
          <div className="flex justify-between text-lg text-gray-900 dark:text-white">
            <span>Charges</span>
            <span className="text-red-600 dark:text-red-400">{formatCurrency(data.expenses, '€')}</span>
          </div>
          <div className="flex justify-between text-xl font-bold pt-4 border-t text-gray-900 dark:text-white">
            <span>Résultat Net</span>
            <span className={data.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {formatCurrency(data.netProfit, '€')}
            </span>
          </div>
        </div>
      </div>
    </Layout>
  )
}
