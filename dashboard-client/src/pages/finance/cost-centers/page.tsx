import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button } from '@/components/common'
import { apiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Plus } from 'lucide-react'

interface CostCenter {
  id: number
  name: string
  budget: number
  actual: number
  variance: number
  variancePercent: number
}

export default function CostCentersPage() {
  const [centers, setCenters] = useState<CostCenter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.post<{
      success: boolean;
      data: {
        costCenters: CostCenter[];
      };
    }>('/finance/cost-centers').then(res => {
      if (res.data.success && res.data.data) setCenters(res.data.data.costCenters)
      setLoading(false)
    })
  }, [])

  if (loading) return <Layout><div>Chargement...</div></Layout>

  return (
    <Layout>
      <Breadcrumbs items={[
        { label: 'Finance', path: '/finance' },
        { label: 'Centres de Coûts', path: '/finance/cost-centers' },
      ]} />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Centres de Coûts</h1>
        <Button variant="primary"><Plus className="w-4 h-4 mr-2" />Nouveau Centre</Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Budget</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Réalisé</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Écart</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {centers.map((center) => (
              <tr key={center.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{center.name}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">{formatCurrency(center.budget, '€')}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">{formatCurrency(center.actual, '€')}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">{formatCurrency(center.variance, '€')}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-400">{center.variancePercent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
