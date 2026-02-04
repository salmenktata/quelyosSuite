/**
 * CampaignModal - Modal création/édition campagne newsletter
 *
 * Fonctionnalités :
 * - Formulaire création campagne (nom, sujet, segment)
 * - Validation champs requis
 * - Intégration API create campaign
 * - Redirect vers page compose après création
 *
 * @component
 */

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/common'

interface CampaignModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (campaignId: number) => void
}

interface Segment {
  value: string
  label: string
}

interface SegmentsResponse {
  success: boolean
  segments: Segment[]
}

interface CreateCampaignResponse {
  success: boolean
  campaign?: {
    id: number
  }
}

export function CampaignModal({ isOpen, onClose, onSuccess }: CampaignModalProps) {
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [segment, setSegment] = useState('all')
  const [fromName, setFromName] = useState('Équipe Quelyos')
  const [fromEmail, setFromEmail] = useState('noreply@quelyos.com')
  const queryClient = useQueryClient()

  const { data: segmentsData } = useQuery<SegmentsResponse>({
    queryKey: ['newsletter-segments'],
    queryFn: async () => {
      const response = await api.post('/api/admin/newsletter/segments', {})
      return response.data as SegmentsResponse
    }
  })

  const createMutation = useMutation<CreateCampaignResponse, Error, {
    name: string
    subject: string
    segment?: string
    from_name: string
    from_email: string
  }>({
    mutationFn: async (data) => {
      const response = await api.post('/api/admin/newsletter/campaigns/create', data)
      return response.data as CreateCampaignResponse
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-campaigns'] })
      if (onSuccess && data.campaign) {
        onSuccess(data.campaign.id)
      }
      handleClose()
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !subject.trim()) {
      return
    }

    createMutation.mutate({
      name,
      subject,
      segment: segment !== 'all' ? segment : undefined,
      from_name: fromName,
      from_email: fromEmail
    })
  }

  const handleClose = () => {
    setName('')
    setSubject('')
    setSegment('all')
    setFromName('Équipe Quelyos')
    setFromEmail('noreply@quelyos.com')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Créer une campagne newsletter
            </h2>
            <button
              onClick={handleClose}
              className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {/* Nom campagne */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom de la campagne *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Newsletter Janvier 2026"
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Nom interne (non visible par les abonnés)
                </p>
              </div>

              {/* Sujet email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sujet de l&apos;email *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Découvrez nos nouveautés du mois"
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Ligne de sujet visible dans la boîte mail
                </p>
              </div>

              {/* Segment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Segment cible
                </label>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                >
                  {segmentsData?.segments.map((seg: Segment) => (
                    <option key={seg.value} value={seg.value}>
                      {seg.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Choisir le segment d&apos;abonnés à cibler
                </p>
              </div>

              {/* Expéditeur */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom expéditeur
                  </label>
                  <input
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email expéditeur
                  </label>
                  <input
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Error */}
            {createMutation.isError && (
              <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  Erreur lors de la création de la campagne
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || !name.trim() || !subject.trim()}
              >
                {createMutation.isPending ? 'Création...' : 'Créer et composer'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
