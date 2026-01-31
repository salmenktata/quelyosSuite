import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs } from '@/components/common'
import { apiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

export default function ConsolidationPage() {
  const [entities, setEntities] = useState([])
  const [balanceSheet, setBalanceSheet] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiClient.post('/finance/consolidation/entities'),
      apiClient.post('/finance/consolidation/balance-sheet')
    ]).then(([entitiesRes, balanceRes]) => {
      if (entitiesRes.data.success) setEntities(entitiesRes.data.data.entities)
      if (balanceRes.data.success) setBalanceSheet(balanceRes.data.data)
      setLoading(false)
    })
  }, [])

  if (loading) return <Layout><div>Chargement...</div></Layout>

  return (
    <Layout>
      <Breadcrumbs items={[
        { label: 'Finance', path: '/finance' },
        { label: 'Consolidation', path: '/finance/consolidation' },
      ]} />

      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Consolidation Groupe</h1>

      <div className="grid gap-6 mb-6">
        {entities.map((entity: any) => (
          <div key={entity.id} className="bg-white dark:bg-gray-800 rounded-lg border p-4">
            <div className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{entity.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{entity.code}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-900 dark:text-white">{entity.consolidationPercent}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">{entity.currency}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {balanceSheet && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Bilan Consolidé</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Actif</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(balanceSheet.assets.total.consolidated, '€')}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Passif</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(balanceSheet.liabilities.total.consolidated, '€')}
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
