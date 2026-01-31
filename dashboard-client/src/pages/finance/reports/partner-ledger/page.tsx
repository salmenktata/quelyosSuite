/**
 * Page Grand Livre Auxiliaire par Partenaire
 */

import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs } from '@/components/common'
import { apiClient } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function PartnerLedgerPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.post('/finance/reports/partner-ledger').then(res => {
      if (res.data.success) setData(res.data.data)
      setLoading(false)
    })
  }, [])

  if (loading) return <Layout><div>Chargement...</div></Layout>
  if (!data) return <Layout><div>Erreur chargement</div></Layout>

  return (
    <Layout>
      <Breadcrumbs items={[
        { label: 'Finance', path: '/finance' },
        { label: 'Rapports', path: '/finance/reports' },
        { label: 'Grand Livre Auxiliaire', path: '/finance/reports/partner-ledger' }
      ]} />

      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Grand Livre Auxiliaire - {data.partner.name}
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pièce</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Débit</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Crédit</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Solde</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.lines.map((line: any, index: number) => (
              <tr key={index}>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{formatDate(line.date)}</td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{line.move}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                  {line.debit > 0 ? formatCurrency(line.debit, '€') : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                  {line.credit > 0 ? formatCurrency(line.credit, '€') : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                  {formatCurrency(line.balance, '€')}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <td colSpan={2} className="px-6 py-3 text-right font-bold text-gray-900 dark:text-white">Total</td>
              <td className="px-6 py-3 text-right font-bold text-gray-900 dark:text-white">
                {formatCurrency(data.totalDebit, '€')}
              </td>
              <td className="px-6 py-3 text-right font-bold text-gray-900 dark:text-white">
                {formatCurrency(data.totalCredit, '€')}
              </td>
              <td className="px-6 py-3 text-right font-bold text-gray-900 dark:text-white">
                {formatCurrency(data.balance, '€')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Layout>
  )
}
