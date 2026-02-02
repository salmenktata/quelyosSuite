/**
 * Page Balance Âgée des Créances
 */

import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs } from '@/components/common'
import { apiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

export default function AgedReceivablesPage() {
  interface AgedPartner {
    id: number
    name: string
    current: number
    period1: number
    period2: number
    period3: number
    total: number
  }

  interface AgedReceivablesData {
    partners: AgedPartner[]
    totals: {
      current: number
      period1: number
      period2: number
      period3: number
      total: number
    }
  }

  const [data, setData] = useState<AgedReceivablesData | null>(null)

  useEffect(() => {
    apiClient.post<{ success: boolean; data: AgedReceivablesData }>('/finance/reports/aged-receivables').then(res => {
      if (res.data.success) setData(res.data.data)
    })
  }, [])

  if (!data) return <Layout><div>Chargement...</div></Layout>

  return (
    <Layout>
      <Breadcrumbs items={[
        { label: 'Finance', path: '/finance' },
        { label: 'Balance Âgée Créances', path: '/finance/reports/aged-receivables' }
      ]} />

      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Balance Âgée des Créances
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Partenaire</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">0-30j</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">30-60j</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">60-90j</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">&gt;90j</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.partners.map((partner) => (
              <tr key={partner.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{partner.name}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">{formatCurrency(partner.current, '€')}</td>
                <td className="px-6 py-4 text-sm text-right text-yellow-600 dark:text-yellow-400">
                  {formatCurrency(partner.period1, '€')}
                </td>
                <td className="px-6 py-4 text-sm text-right text-orange-600 dark:text-orange-400">
                  {formatCurrency(partner.period2, '€')}
                </td>
                <td className="px-6 py-4 text-sm text-right text-red-600 dark:text-red-400">
                  {formatCurrency(partner.period3, '€')}
                </td>
                <td className="px-6 py-4 text-sm text-right font-bold text-gray-900 dark:text-white">
                  {formatCurrency(partner.total, '€')}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <td className="px-6 py-3 text-left font-bold text-gray-900 dark:text-white">Total</td>
              <td className="px-6 py-3 text-right font-bold text-gray-900 dark:text-white">
                {formatCurrency(data.totals.current, '€')}
              </td>
              <td className="px-6 py-3 text-right font-bold text-yellow-600 dark:text-yellow-400">
                {formatCurrency(data.totals.period1, '€')}
              </td>
              <td className="px-6 py-3 text-right font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(data.totals.period2, '€')}
              </td>
              <td className="px-6 py-3 text-right font-bold text-red-600 dark:text-red-400">
                {formatCurrency(data.totals.period3, '€')}
              </td>
              <td className="px-6 py-3 text-right font-bold text-gray-900 dark:text-white">
                {formatCurrency(data.totals.total, '€')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Layout>
  )
}
