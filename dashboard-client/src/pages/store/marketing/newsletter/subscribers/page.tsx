/**
 * Newsletter Subscribers - Gestion des abonnés newsletter
 *
 * Fonctionnalités :
 * - Liste des abonnés avec filtres (segment, statut, recherche)
 * - Pagination et statistiques d'engagement
 * - Création/modification d'abonnés
 * - Segmentation automatique (VIP, Régulier, Occasionnel, Nouveau)
 * - Export CSV des abonnés actifs
 * - Statistiques globales (taux d'ouverture, clics)
 *
 * @module store/marketing/newsletter/subscribers
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button, SkeletonTable, Badge } from '@/components/common'
import { storeNotices } from '@/lib/notices'
import { Mail, UserPlus, Download, Search, TrendingUp, TrendingDown } from 'lucide-react'
import { api } from '@/lib/api'

interface Subscriber {
  id: number
  name: string
  email: string
  status: 'subscribed' | 'unsubscribed' | 'bounced' | 'spam'
  segment: 'vip' | 'regular' | 'occasional' | 'new'
  stats_open_rate: number
  stats_click_rate: number
  subscribed_date: string | null
  last_activity_date: string | null
}

interface SubscribersResponse {
  success: boolean
  subscribers: Subscriber[]
  total: number
  limit: number
  offset: number
  error?: string
}

export default function NewsletterSubscribers() {
  const [search, setSearch] = useState('')
  const [segment, setSegment] = useState<string>('')
  const [status, setStatus] = useState('subscribed')
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const queryClient = useQueryClient()

  const limit = 50

  const { data, isLoading, error } = useQuery<SubscribersResponse>({
    queryKey: ['newsletter-subscribers', page, search, segment, status],
    queryFn: async () => {
      const response = await api.post('/api/admin/newsletter/subscribers', {
        limit,
        offset: (page - 1) * limit,
        search,
        segment: segment || undefined,
        status
      })
      return response.data as SubscribersResponse
    }
  })

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/admin/newsletter/subscribers/export', {})
      // Response.data contient le CSV dans la propriété data
      const csvData = (response.data as { data?: string }).data || ''
      const blob = new Blob([csvData], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      window.URL.revokeObjectURL(url)
    }
  })

  const getSegmentColor = (seg: string) => {
    const colors = {
      vip: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
      regular: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
      occasional: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
      new: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
    }
    return colors[seg as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (st: string) => {
    const colors = {
      subscribed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      unsubscribed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200',
      bounced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
      spam: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
    }
    return colors[st as keyof typeof colors] || 'bg-gray-100'
  }

  const breadcrumbItems = [
    { label: 'Tableau de bord', path: '/store' },
    { label: 'Marketing', path: '/store/marketing/coupons' },
    { label: 'Newsletter', path: '/store/marketing/newsletter/subscribers' },
    { label: 'Abonnés' }
  ]

  if (error) {
    return (
      <Layout>
        <Breadcrumbs items={breadcrumbItems} />
        <div role="alert" className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 mt-4">
          <p className="text-sm text-red-800 dark:text-red-200">
            Erreur de chargement des abonnés newsletter
          </p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Abonnés Newsletter
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {data?.total || 0} abonnés • {data?.subscribers.filter((s: Subscriber) => s.status === 'subscribed').length || 0} actifs
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
          >
            <Download className="h-4 w-4" />
            Exporter CSV
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <UserPlus className="h-4 w-4" />
            Ajouter un abonné
          </Button>
        </div>
      </div>

      <PageNotice config={storeNotices.marketing} />

      {/* Filtres */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
          />
        </div>

        <select
          value={segment}
          onChange={(e) => {
            setSegment(e.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-4 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
        >
          <option value="">Tous les segments</option>
          <option value="vip">VIP</option>
          <option value="regular">Réguliers</option>
          <option value="occasional">Occasionnels</option>
          <option value="new">Nouveaux</option>
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 px-4 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
        >
          <option value="subscribed">Abonnés</option>
          <option value="unsubscribed">Désabonnés</option>
          <option value="bounced">Rebonds</option>
          <option value="spam">Spam</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={10} columns={6} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Abonné
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Segment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Engagement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date d&apos;abonnement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data?.subscribers.map((subscriber: Subscriber) => (
                <tr key={subscriber.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {subscriber.name || 'Sans nom'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {subscriber.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getSegmentColor(subscriber.segment)}>
                      {subscriber.segment === 'vip' && 'VIP'}
                      {subscriber.segment === 'regular' && 'Régulier'}
                      {subscriber.segment === 'occasional' && 'Occasionnel'}
                      {subscriber.segment === 'new' && 'Nouveau'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStatusColor(subscriber.status)}>
                      {subscriber.status === 'subscribed' && 'Abonné'}
                      {subscriber.status === 'unsubscribed' && 'Désabonné'}
                      {subscriber.status === 'bounced' && 'Rebond'}
                      {subscriber.status === 'spam' && 'Spam'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-gray-900 dark:text-white">
                          {subscriber.stats_open_rate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingDown className="h-4 w-4 text-blue-500" />
                        <span className="text-gray-900 dark:text-white">
                          {subscriber.stats_click_rate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {subscriber.subscribed_date
                      ? new Date(subscriber.subscribed_date).toLocaleDateString('fr-FR')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data && data.total > limit && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Page {page} sur {Math.ceil(data.total / limit)}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(data.total / limit)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </Layout>
  )
}
