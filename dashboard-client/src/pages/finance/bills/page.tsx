/**
 * Page Factures Fournisseurs
 */

import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button } from '@/components/common'
import { Plus } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Bill {
  id: number
  name: string
  vendor: { name: string }
  invoiceDate: string
  amountTotal: number
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    const response = await apiClient.post('/finance/bills')
    if (response.data.success) setBills(response.data.data.bills)
    setLoading(false)
  }

  return (
    <Layout>
      <Breadcrumbs
        items={[
          { label: 'Finance', path: '/finance' },
          { label: 'Factures Fournisseurs', path: '/finance/bills' },
        ]}
      />

      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Factures Fournisseurs
        </h1>
        <Button variant="primary" icon={<Plus />}>
          Nouvelle Facture
        </Button>
      </div>

      {loading ? (
        <div>Chargement...</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-gray-900 dark:text-white">Numéro</th>
                <th className="px-6 py-3 text-left text-gray-900 dark:text-white">Fournisseur</th>
                <th className="px-6 py-3 text-left text-gray-900 dark:text-white">Date</th>
                <th className="px-6 py-3 text-right text-gray-900 dark:text-white">Montant</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{bill.name}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{bill.vendor.name}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{formatDate(bill.invoiceDate)}</td>
                  <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
                    {formatCurrency(bill.amountTotal, '€')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
