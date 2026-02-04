/**
 * ScheduleModal - Modal programmation envoi campagne
 *
 * Fonctionnalités :
 * - Sélection date et heure d'envoi
 * - Validation date future uniquement
 * - Récapitulatif destinataires
 * - Intégration API schedule
 *
 * @component
 */

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Clock, Calendar as CalendarIcon, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/common'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  campaignId?: number
  campaignName: string
  recipientCount: number
}

export function ScheduleModal({
  isOpen,
  onClose,
  campaignId,
  campaignName,
  recipientCount
}: ScheduleModalProps) {
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('09:00')
  const [dateError, setDateError] = useState('')
  const queryClient = useQueryClient()

  const scheduleMutation = useMutation({
    mutationFn: async (datetime: string) => {
      if (!campaignId) {
        throw new Error('Campaign ID required')
      }

      const response = await api.post(`/api/admin/newsletter/campaigns/${campaignId}/schedule`, {
        scheduled_date: datetime
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-campaigns'] })
      handleClose()
    }
  })

  const validateDateTime = (date: string, time: string) => {
    if (!date) {
      setDateError('Date requise')
      return false
    }

    const scheduledDateTime = new Date(`${date}T${time}`)
    const now = new Date()

    if (scheduledDateTime <= now) {
      setDateError('La date doit être dans le futur')
      return false
    }

    // Vérifier pas trop loin (ex: max 1 an)
    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

    if (scheduledDateTime > oneYearFromNow) {
      setDateError('La date ne peut pas dépasser 1 an')
      return false
    }

    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateDateTime(scheduledDate, scheduledTime)) {
      return
    }

    const datetime = `${scheduledDate}T${scheduledTime}:00`
    scheduleMutation.mutate(datetime)
  }

  const handleDateChange = (value: string) => {
    setScheduledDate(value)
    if (dateError) {
      setDateError('')
    }
  }

  const handleClose = () => {
    setScheduledDate('')
    setScheduledTime('09:00')
    setDateError('')
    onClose()
  }

  // Date minimale (aujourd'hui)
  const today = new Date().toISOString().split('T')[0]

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
        <div className="relative w-full max-w-lg rounded-lg bg-white dark:bg-gray-800 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Programmer l&apos;envoi
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
            {/* Info campagne */}
            <div className="mb-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 p-4">
              <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200 mb-2">
                {campaignName}
              </p>
              <div className="flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-300">
                <Users className="h-4 w-4" />
                <span>{recipientCount.toLocaleString()} destinataires</span>
              </div>
            </div>

            {/* Date */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <CalendarIcon className="inline h-4 w-4 mr-1" />
                Date d&apos;envoi *
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={today}
                required
                className={`w-full rounded-lg border ${
                  dateError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'
                } bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:ring-1 dark:text-white`}
              />
            </div>

            {/* Heure */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Heure d&apos;envoi *
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Fuseau horaire : Europe/Paris (UTC+1)
              </p>
            </div>

            {/* Date error */}
            {dateError && (
              <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
                <p className="text-sm text-red-800 dark:text-red-200">{dateError}</p>
              </div>
            )}

            {/* Récapitulatif */}
            {scheduledDate && (
              <div className="mb-4 rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Envoi programmé le :
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}

            {/* Error message */}
            {scheduleMutation.isError && (
              <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  Erreur lors de la programmation
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={scheduleMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={scheduleMutation.isPending || !scheduledDate || !!dateError}
              >
                {scheduleMutation.isPending ? 'Programmation...' : 'Programmer l\'envoi'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
