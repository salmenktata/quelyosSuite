/**
 * Newsletter Campaigns - Gestion des campagnes email marketing
 *
 * Fonctionnalités :
 * - Liste des campagnes avec statistiques temps réel
 * - Création et édition de campagnes email
 * - Segmentation des destinataires (VIP, Réguliers, etc.)
 * - Visualisation taux d'ouverture et clics
 * - États campagne (Brouillon, Programmé, Envoyé)
 * - Envoi immédiat ou programmé
 * - Preview HTML (à venir: éditeur TipTap)
 *
 * @module store/marketing/newsletter/campaigns
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button, SkeletonTable, Badge } from '@/components/common'
import { CampaignModal } from '@/components/newsletter'
import { storeNotices } from '@/lib/notices'
import { Mail, Send, TrendingUp, Eye, Plus, Clock } from 'lucide-react'
import { api } from '@/lib/api'

interface Campaign {
  id: number
  name: string
  subject: string
  state: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
  recipient_count: number
  stats_sent: number
  stats_opened: number
  stats_clicked: number
  open_rate: number
  click_rate: number
  scheduled_date: string | null
  sent_date: string | null
}

interface CampaignsResponse {
  success: boolean
  campaigns: Campaign[]
  error?: string
}

interface Segment {
  value: string
  label: string
}

interface SegmentsResponse {
  success: boolean
  segments: Segment[]
}

export default function NewsletterCampaigns() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const handleCampaignCreated = (campaignId: number) => {
    navigate(`/store/marketing/newsletter/compose?campaignId=${campaignId}`)
  }

  const { data, isLoading, error } = useQuery<CampaignsResponse>({
    queryKey: ['newsletter-campaigns'],
    queryFn: async () => {
      const response = await api.post('/api/admin/newsletter/campaigns', {})
      return response.data as CampaignsResponse
    }
  })

  const { data: segmentsData } = useQuery<SegmentsResponse>({
    queryKey: ['newsletter-segments'],
    queryFn: async () => {
      const response = await api.post('/api/admin/newsletter/segments', {})
      return response.data as SegmentsResponse
    }
  })

  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      const response = await api.post(`/api/admin/newsletter/campaigns/${campaignId}/send`, {})
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-campaigns'] })
    }
  })

  const getStateColor = (state: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200',
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
      sending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
      sent: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
    }
    return colors[state as keyof typeof colors] || 'bg-gray-100'
  }

  const getStateLabel = (state: string) => {
    const labels = {
      draft: 'Brouillon',
      scheduled: 'Programmé',
      sending: 'En envoi',
      sent: 'Envoyé',
      cancelled: 'Annulé'
    }
    return labels[state as keyof typeof labels] || state
  }

  const breadcrumbItems = [
    { label: 'Tableau de bord', path: '/store' },
    { label: 'Marketing', path: '/store/marketing/coupons' },
    { label: 'Newsletter', path: '/store/marketing/newsletter/campaigns' },
    { label: 'Campagnes' }
  ]

  if (error) {
    return (
      <Layout>
        <Breadcrumbs items={breadcrumbItems} />
        <div role="alert" className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 mt-4">
          <p className="text-sm text-red-800 dark:text-red-200">
            Erreur de chargement des campagnes newsletter
          </p>
        </div>
      </Layout>
    )
  }

  const totalSent = data?.campaigns.reduce((acc, c) => acc + c.stats_sent, 0) || 0
  const totalOpened = data?.campaigns.reduce((acc, c) => acc + c.stats_opened, 0) || 0
  const totalClicked = data?.campaigns.reduce((acc, c) => acc + c.stats_clicked, 0) || 0
  const avgOpenRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0.0'
  const avgClickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0.0'

  return (
    <Layout>
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Campagnes Newsletter
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {data?.campaigns.length || 0} campagnes • {totalSent.toLocaleString()} emails envoyés
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          Créer une campagne
        </Button>
      </div>

      <PageNotice config={storeNotices.marketing} />

      {/* Statistiques globales */}
      <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Emails envoyés</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {totalSent.toLocaleString()}
              </p>
            </div>
            <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 p-3">
              <Send className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Taux d&apos;ouverture</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {avgOpenRate}%
              </p>
            </div>
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
              <Eye className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Taux de clic</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {avgClickRate}%
              </p>
            </div>
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Campagnes</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {data?.campaigns.length || 0}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-3">
              <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Table des campagnes */}
      {isLoading ? (
        <SkeletonTable rows={5} columns={6} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Campagne
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  État
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Destinataires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data?.campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {campaign.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {campaign.subject}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStateColor(campaign.state)}>
                      {getStateLabel(campaign.state)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {campaign.recipient_count.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {campaign.stats_sent.toLocaleString()} envoyés
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Ouverture: </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {campaign.open_rate.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Clics: </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {campaign.click_rate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      {campaign.state === 'scheduled' && campaign.scheduled_date ? (
                        <>
                          <Clock className="h-4 w-4" />
                          {new Date(campaign.scheduled_date).toLocaleDateString('fr-FR')}
                        </>
                      ) : campaign.sent_date ? (
                        <>
                          <Send className="h-4 w-4" />
                          {new Date(campaign.sent_date).toLocaleDateString('fr-FR')}
                        </>
                      ) : (
                        '-'
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {campaign.state === 'draft' && (
                      <button
                        onClick={() => sendCampaignMutation.mutate(campaign.id)}
                        disabled={sendCampaignMutation.isPending}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50"
                      >
                        Envoyer
                      </button>
                    )}
                    {campaign.state === 'sent' && (
                      <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                        Voir détails
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.campaigns.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Mail className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Aucune campagne
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Commencez par créer votre première campagne newsletter.
          </p>
          <div className="mt-6">
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              Créer une campagne
            </Button>
          </div>
        </div>
      )}

      {/* Modal création campagne */}
      <CampaignModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCampaignCreated}
      />
    </Layout>
  )
}
