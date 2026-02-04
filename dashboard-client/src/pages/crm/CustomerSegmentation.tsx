/**
 * Customer Segmentation RFM - Analyse comportementale clients
 *
 * Fonctionnalités :
 * - Segmentation automatique RFM (Récence, Fréquence, Montant)
 * - 5 segments : VIP, Régulier, Occasionnel, À risque, Inactif
 * - Filtres segment, montant dépensé, nombre commandes
 * - Export CSV avec données RFM complètes
 * - Visualisation statistiques par segment
 * - Recalcul scores en temps réel
 *
 * @module crm/CustomerSegmentation
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button, SkeletonTable, Badge } from '@/components/common'
import { crmNotices } from '@/lib/notices'
import {
  Users,
  Crown,
  TrendingUp,
  AlertTriangle,
  Moon,
  Download,
  RefreshCw,
  DollarSign,
  ShoppingCart,
  Calendar
} from 'lucide-react'
import { api } from '@/lib/api'

interface Customer {
  id: number
  name: string
  email: string
  phone: string
  rfm_segment: 'vip' | 'regular' | 'occasional' | 'at_risk' | 'inactive'
  rfm_recency_score: number
  rfm_frequency_score: number
  rfm_monetary_score: number
  total_orders: number
  total_spent: number
  average_order_value: number
  days_since_last_order: number
  last_order_date: string | null
}

interface RFMStats {
  vip: number
  regular: number
  occasional: number
  at_risk: number
  inactive: number
}

interface RFMResponse {
  success: boolean
  customers: Customer[]
  total: number
  stats: RFMStats
  error?: string
}

export default function CustomerSegmentation() {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<RFMResponse>({
    queryKey: ['customers-rfm', selectedSegment],
    queryFn: async () => {
      const payload: Record<string, unknown> = {}
      if (selectedSegment) {
        payload.segment = selectedSegment
      }
      const response = await api.post('/api/admin/customers/rfm', payload)
      return response.data as RFMResponse
    }
  })

  const recomputeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/admin/customers/rfm/recompute', {})
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-rfm'] })
    }
  })

  const exportMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {}
      if (selectedSegment) {
        payload.segment = selectedSegment
      }
      const response = await api.post('/api/admin/customers/rfm/export', payload)
      return response.data
    },
    onSuccess: (data) => {
      if (data.success && data.csv_data) {
        // Télécharger CSV
        const blob = new Blob([atob(data.csv_data)], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = data.filename
        a.click()
        window.URL.revokeObjectURL(url)
      }
    }
  })

  const getSegmentColor = (segment: string) => {
    const colors = {
      vip: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
      regular: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      occasional: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
      at_risk: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
    }
    return colors[segment as keyof typeof colors] || colors.inactive
  }

  const getSegmentLabel = (segment: string) => {
    const labels = {
      vip: 'VIP',
      regular: 'Régulier',
      occasional: 'Occasionnel',
      at_risk: 'À risque',
      inactive: 'Inactif'
    }
    return labels[segment as keyof typeof labels] || segment
  }

  const getSegmentIcon = (segment: string) => {
    const icons = {
      vip: <Crown className="h-5 w-5" />,
      regular: <TrendingUp className="h-5 w-5" />,
      occasional: <Users className="h-5 w-5" />,
      at_risk: <AlertTriangle className="h-5 w-5" />,
      inactive: <Moon className="h-5 w-5" />
    }
    return icons[segment as keyof typeof icons] || icons.inactive
  }

  const breadcrumbItems = [
    { label: 'Tableau de bord', path: '/dashboard' },
    { label: 'CRM', path: '/crm/customers' },
    { label: 'Segmentation RFM' }
  ]

  if (error) {
    return (
      <Layout>
        <Breadcrumbs items={breadcrumbItems} />
        <div role="alert" className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 mt-4">
          <p className="text-sm text-red-800 dark:text-red-200">
            Erreur de chargement de la segmentation RFM
          </p>
        </div>
      </Layout>
    )
  }

  const stats = data?.stats || { vip: 0, regular: 0, occasional: 0, at_risk: 0, inactive: 0 }
  const totalCustomers = Object.values(stats).reduce((sum, count) => sum + count, 0)

  return (
    <Layout>
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Segmentation RFM
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {totalCustomers} clients • Récence, Fréquence, Montant
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => recomputeMutation.mutate()}
            disabled={recomputeMutation.isPending}
            variant="secondary"
          >
            <RefreshCw className={`h-4 w-4 ${recomputeMutation.isPending ? 'animate-spin' : ''}`} />
            Recalculer
          </Button>
          <Button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
          >
            <Download className="h-4 w-4" />
            Exporter CSV
          </Button>
        </div>
      </div>

      <PageNotice config={crmNotices.customers} />

      {/* Statistiques par segment */}
      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-5">
        {[
          { key: 'vip', label: 'VIP', icon: Crown, color: 'purple' },
          { key: 'regular', label: 'Réguliers', icon: TrendingUp, color: 'green' },
          { key: 'occasional', label: 'Occasionnels', icon: Users, color: 'blue' },
          { key: 'at_risk', label: 'À risque', icon: AlertTriangle, color: 'orange' },
          { key: 'inactive', label: 'Inactifs', icon: Moon, color: 'gray' }
        ].map((segment) => {
          const Icon = segment.icon
          const count = stats[segment.key as keyof RFMStats] || 0
          const percentage = totalCustomers > 0 ? ((count / totalCustomers) * 100).toFixed(1) : '0'
          const isSelected = selectedSegment === segment.key

          return (
            <button
              key={segment.key}
              onClick={() => setSelectedSegment(isSelected ? null : segment.key)}
              className={`rounded-lg border-2 p-6 text-left transition-all ${
                isSelected
                  ? `border-${segment.color}-500 bg-${segment.color}-50 dark:bg-${segment.color}-900/20`
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {segment.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {count}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {percentage}% du total
                  </p>
                </div>
                <div className={`rounded-full bg-${segment.color}-100 dark:bg-${segment.color}-900/30 p-3`}>
                  <Icon className={`h-6 w-6 text-${segment.color}-600 dark:text-${segment.color}-400`} />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Table clients */}
      {isLoading ? (
        <SkeletonTable rows={10} columns={8} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Segment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Scores RFM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Commandes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Dépensé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Panier Moyen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Dernière Commande
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data?.customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {customer.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {customer.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getSegmentIcon(customer.rfm_segment)}
                      <Badge className={getSegmentColor(customer.rfm_segment)}>
                        {getSegmentLabel(customer.rfm_segment)}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2 text-sm">
                      <span className="font-medium text-gray-900 dark:text-white">
                        R:{customer.rfm_recency_score}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        F:{customer.rfm_frequency_score}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        M:{customer.rfm_monetary_score}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm">
                      <ShoppingCart className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {customer.total_orders}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {customer.total_spent.toFixed(2)}€
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {customer.average_order_value.toFixed(2)}€
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">
                        Il y a {customer.days_since_last_order}j
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.customers.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Aucun client
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {selectedSegment
              ? `Aucun client dans le segment "${getSegmentLabel(selectedSegment)}"`
              : 'Aucune donnée de segmentation disponible'}
          </p>
        </div>
      )}
    </Layout>
  )
}
