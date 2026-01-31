import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button } from '@/components/common'
import { apiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Download } from 'lucide-react'

export default function SEPADirectDebitsPage() {
  const [debits, setDebits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.post('/finance/sepa/direct-debits').then(res => {
      if (res.data.success) setDebits(res.data.data.directDebits)
      setLoading(false)
    })
  }, [])

  const exportPain008 = () => {
    window.open(`${import.meta.env.VITE_API_URL}/finance/sepa/direct-debits/export`, '_blank')
  }

  if (loading) return <Layout><div>Chargement...</div></Layout>

  return (
    <Layout>
      <Breadcrumbs items={[
        { label: 'Finance', path: '/finance' },
        { label: 'SEPA', path: '/finance/sepa' },
        { label: 'Prélèvements', path: '/finance/sepa/direct-debits' },
      ]} />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prélèvements SEPA</h1>
        <Button onClick={exportPain008} variant="primary">
          <Download className="w-4 h-4 mr-2" />
          Export pain.008
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Référence</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Client</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Montant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {debits.map((debit) => (
              <tr key={debit.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{debit.reference}</td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{debit.customerName}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                  {formatCurrency(debit.amount, '€')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{debit.requestedDate}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    {debit.status}
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
