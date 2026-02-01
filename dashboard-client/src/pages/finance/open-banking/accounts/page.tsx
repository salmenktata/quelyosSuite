import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs } from '@/components/common'
import { apiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

interface BankAccount {
  id: number
  bankName: string
  iban: string
  balance: number
}

export default function OpenBankingAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.post('/finance/open-banking/accounts').then(res => {
      if (res.data.success) setAccounts(res.data.data.accounts)
      setLoading(false)
    })
  }, [])

  if (loading) return <Layout><div>Chargement...</div></Layout>

  return (
    <Layout>
      <Breadcrumbs items={[
        { label: 'Finance', path: '/finance' },
        { label: 'Comptes Bancaires', path: '/finance/open-banking/accounts' },
      ]} />
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Comptes Bancaires PSD2</h1>
      <div className="grid gap-6">
        {accounts.map((acc) => (
          <div key={acc.id} className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <div className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{acc.bankName}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{acc.iban}</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(acc.balance, '€')}</p>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
