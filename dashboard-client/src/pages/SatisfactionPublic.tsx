/**
 * Page Publique : Formulaire de Satisfaction
 *
 * Page accessible sans authentification via lien email.
 * Permet au client de noter sa satisfaction après résolution du ticket.
 *
 * Route : /satisfaction/:token
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Star, CheckCircle, AlertCircle, Loader2, MessageSquare } from 'lucide-react'
import { config } from '@/lib/config'
import { logger } from '@quelyos/logger'

interface TicketInfo {
  reference: string
  subject: string
  category: string
  resolvedAt: string | null
  satisfactionRating: string | null
  satisfactionComment: string | null
  alreadyRated: boolean
}

type ViewState = 'loading' | 'form' | 'success' | 'error'

export default function SatisfactionPublic() {
  const { token } = useParams<{ token: string }>()
  const [viewState, setViewState] = useState<ViewState>('loading')
  const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null)
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadTicketInfo = useCallback(async () => {
    if (!token) {
      setError('Lien invalide')
      setViewState('error')
      return
    }

    try {
      const response = await fetch(`${config.apiUrl}/api/tickets/satisfaction/${token}/info`)
      const data: { success: boolean; ticket?: TicketInfo; error?: string } = await response.json()

      if (!data.success || !data.ticket) {
        setError(data.error || 'Erreur lors du chargement')
        setViewState('error')
        return
      }

      const ticket = data.ticket

      if (ticket.alreadyRated) {
        setTicketInfo(ticket)
        setRating(parseInt(ticket.satisfactionRating || '0'))
        setComment(ticket.satisfactionComment || '')
        setViewState('success')
        return
      }

      setTicketInfo(ticket)
      setViewState('form')
    } catch (err: unknown) {
      logger.error('Error loading ticket info:', err)
      setError('Impossible de charger les informations du ticket')
      setViewState('error')
    }
  }, [token])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTicketInfo()
  }, [loadTicketInfo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      setError('Veuillez sélectionner une note')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`${config.apiUrl}/api/tickets/satisfaction/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: rating.toString(),
          comment: comment.trim(),
        }),
      })
      const data: { success: boolean; message?: string; error?: string } = await response.json()

      if (!data.success) {
        setError(data.error || "Erreur lors de l'envoi")
        setIsSubmitting(false)
        return
      }

      setViewState('success')
    } catch (err: unknown) {
      logger.error('Error submitting satisfaction:', err)
      setError('Erreur lors de l\'envoi de votre avis')
      setIsSubmitting(false)
    }
  }

  const getRatingLabel = (rating: number): string => {
    const labels: Record<number, string> = {
      1: 'Très insatisfait',
      2: 'Insatisfait',
      3: 'Neutre',
      4: 'Satisfait',
      5: 'Très satisfait',
    }
    return labels[rating] || ''
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Récemment'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (viewState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 dark:text-teal-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (viewState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Erreur</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Si le problème persiste, veuillez contacter notre support.
          </p>
        </div>
      </div>
    )
  }

  if (viewState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {ticketInfo?.alreadyRated ? 'Merci pour votre avis !' : 'Avis enregistré !'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {ticketInfo?.alreadyRated
                ? 'Vous avez déjà donné votre avis sur ce ticket.'
                : 'Votre avis nous aide à améliorer la qualité de notre support.'}
            </p>
          </div>

          {ticketInfo && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ticket</p>
                <p className="font-semibold text-gray-900 dark:text-white">{ticketInfo.reference}</p>
                <p className="text-gray-900 dark:text-white dark:text-gray-300 mt-1">{ticketInfo.subject}</p>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Votre note</p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-8 h-8 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-200 dark:fill-gray-600 text-gray-200 dark:text-gray-600'
                      }`}
                    />
                  ))}
                  <span className="ml-3 text-lg font-medium text-gray-900 dark:text-white">
                    {getRatingLabel(rating)}
                  </span>
                </div>
              </div>

              {comment && (
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Votre commentaire</p>
                  <p className="text-gray-900 dark:text-white dark:text-gray-300 italic">"{comment}"</p>
                </div>
              )}
            </div>
          )}

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            Vous pouvez fermer cette page en toute sécurité.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Votre avis compte</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comment évaluez-vous la résolution de votre demande ?
          </p>
        </div>

        {ticketInfo && (
          <div className="bg-teal-50 dark:bg-teal-900/20 border-l-4 border-teal-500 dark:border-teal-400 rounded-lg p-4 mb-8">
            <p className="text-sm font-medium text-teal-800 dark:text-teal-300 mb-2">Récapitulatif</p>
            <p className="text-sm text-gray-900 dark:text-white dark:text-gray-300">
              <span className="font-semibold">Ticket :</span> {ticketInfo.reference}
            </p>
            <p className="text-sm text-gray-900 dark:text-white dark:text-gray-300 mt-1">
              <span className="font-semibold">Sujet :</span> {ticketInfo.subject}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Résolu le {formatDate(ticketInfo.resolvedAt)}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-3">
              Note de satisfaction *
            </label>
            <div className="flex items-center gap-3 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-full p-1"
                >
                  <Star
                    className={`w-12 h-12 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 dark:fill-gray-600 text-gray-200 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-lg font-medium text-gray-900 dark:text-white mt-3">
                {getRatingLabel(rating)}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
              Commentaire (optionnel)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Partagez-nous votre expérience..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
              {comment.length} / 500 caractères
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2" role="alert">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-teal-600 disabled:hover:to-teal-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Envoyer mon avis
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          Vos données sont traitées de manière confidentielle.
        </p>
      </div>
    </div>
  )
}
