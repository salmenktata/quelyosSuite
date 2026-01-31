import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button } from '@/components/common'
import { apiClient } from '@/lib/api'
import { Plus } from 'lucide-react'

export default function AnalyticsAxesPage() {
  const [axes, setAxes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.post('/finance/analytics/axes').then(res => {
      if (res.data.success) setAxes(res.data.data.axes)
      setLoading(false)
    })
  }, [])

  if (loading) return <Layout><div>Chargement...</div></Layout>

  return (
    <Layout>
      <Breadcrumbs items={[
        { label: 'Finance', path: '/finance' },
        { label: 'Analytique', path: '/finance/analytics' },
        { label: 'Axes', path: '/finance/analytics/axes' },
      ]} />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Axes Analytiques</h1>
        <Button variant="primary"><Plus className="w-4 h-4 mr-2" />Nouvel Axe</Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {axes.map((axis: any) => (
              <tr key={axis.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{axis.name}</td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{axis.code}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Actif
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
