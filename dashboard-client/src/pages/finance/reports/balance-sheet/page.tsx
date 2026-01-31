import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs } from '@/components/common'
import { apiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

export default function BalanceSheetPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    apiClient.post('/finance/reports/balance-sheet').then(res => {
      if (res.data.success) setData(res.data.data)
    })
  }, [])

  if (!data) return <Layout><div>Chargement...</div></Layout>

  return (
    <Layout>
      <Breadcrumbs items={[
        { label: 'Finance', path: '/finance' },
        { label: 'Bilan', path: '/finance/reports/balance-sheet' }
      ]} />
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Bilan Comptable</h1>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Actif</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-900 dark:text-white">
              <span>Actif Courant</span>
              <span>{formatCurrency(data.assets.current, '€')}</span>
            </div>
            <div className="flex justify-between text-gray-900 dark:text-white">
              <span>Actif Immobilisé</span>
              <span>{formatCurrency(data.assets.fixed, '€')}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t text-gray-900 dark:text-white">
              <span>Total Actif</span>
              <span>{formatCurrency(data.assets.total, '€')}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Passif</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-900 dark:text-white">
              <span>Passif Courant</span>
              <span>{formatCurrency(data.liabilities.current, '€')}</span>
            </div>
            <div className="flex justify-between text-gray-900 dark:text-white">
              <span>Dette Long Terme</span>
              <span>{formatCurrency(data.liabilities.longTerm, '€')}</span>
            </div>
            <div className="flex justify-between text-gray-900 dark:text-white">
              <span>Capitaux Propres</span>
              <span>{formatCurrency(data.liabilities.equity, '€')}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t text-gray-900 dark:text-white">
              <span>Total Passif</span>
              <span>{formatCurrency(data.liabilities.total, '€')}</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
