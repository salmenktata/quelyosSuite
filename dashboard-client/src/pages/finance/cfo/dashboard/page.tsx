import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs } from '@/components/common'
import { apiClient } from '@/lib/api'

export default function CFODashboardPage() {
  const [kpis, setKpis] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.post<{
      success: boolean;
      data: {
        kpis: Record<string, unknown>;
      };
    }>('/finance/cfo/kpis').then(res => {
      if (res.data.success && res.data.data) setKpis(res.data.data.kpis)
      setLoading(false)
    })
  }, [])

  if (loading) return <Layout><div>Chargement...</div></Layout>

  return (
    <Layout>
      <Breadcrumbs items={[
        { label: 'Finance', path: '/finance' },
        { label: 'Dashboard CFO', path: '/finance/cfo/dashboard' },
      ]} />

      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Dashboard CFO Executive</h1>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">DSO</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpis?.dso?.value} j</p>
          <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            {kpis?.dso?.status}
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">DPO</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpis?.dpo?.value} j</p>
          <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            {kpis?.dpo?.status}
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Cash Cycle</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpis?.cashConversionCycle?.value} j</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Working Capital</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpis?.workingCapitalRatio?.value}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Current Ratio</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpis?.currentRatio?.value}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Quick Ratio</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpis?.quickRatio?.value}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">EBITDA Margin</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpis?.ebitdaMargin?.value}%</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Net Profit Margin</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpis?.netProfitMargin?.value}%</p>
        </div>
      </div>
    </Layout>
  )
}
