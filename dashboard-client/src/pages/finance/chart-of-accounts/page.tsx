/**
 * Page Plan Comptable
 */

import { useState, useEffect, useCallback } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, PageNotice } from '@/components/common'
import { Plus } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { financeNotices } from '@/lib/notices/finance-notices'

interface Account {
  id: number
  code: string
  name: string
  accountType: string
  balance: number
}

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAccounts = useCallback(async () => {
    const response = await apiClient.post<{
      success: boolean;
      data: {
        accounts: Account[];
      };
    }>('/finance/accounts')
    if (response.data.success && response.data.data) setAccounts(response.data.data.accounts)
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAccounts()
  }, [fetchAccounts])

  return (
    <Layout>
      <Breadcrumbs
        items={[
          { label: 'Finance', path: '/finance' },
          { label: 'Plan Comptable', path: '/finance/chart-of-accounts' },
        ]}
      />

      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Plan Comptable
        </h1>
        <Button variant="primary" icon={<Plus />}>
          Nouveau Compte
        </Button>
      </div>

      <PageNotice config={financeNotices.charts} className="![animation:none] mb-6" />

      {loading ? (
        <div>Chargement...</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-3 text-left text-gray-900 dark:text-white">Code</th>
                <th className="px-6 py-3 text-left text-gray-900 dark:text-white">Libellé</th>
                <th className="px-6 py-3 text-left text-gray-900 dark:text-white">Type</th>
                <th className="px-6 py-3 text-right text-gray-900 dark:text-white">Solde</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-6 py-4 font-mono text-gray-900 dark:text-white">{account.code}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{account.name}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{account.accountType}</td>
                  <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
                    {formatCurrency(account.balance, '€')}
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
