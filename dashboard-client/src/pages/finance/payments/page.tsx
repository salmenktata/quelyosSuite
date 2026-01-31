import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs } from '@/components/common'
import { apiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])

  useEffect(() => {
    apiClient.post('/finance/payments').then(res => {
      if (res.data.success) setPayments(res.data.data.payments)
    })
  }, [])

  return (
    <Layout>
      <Breadcrumbs items={[{ label: 'Finance', path: '/finance' }, { label: 'Paiements', path: '/finance/payments' }]} />
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Paiements</h1>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
        {payments.map((p: any) => (
          <div key={p.id} className="border-b border-gray-200 dark:border-gray-700 py-2">
            <span className="text-gray-900 dark:text-white">{p.name}</span> - {formatCurrency(p.amount, '€')}
          </div>
        ))}
      </div>
    </Layout>
  )
}
