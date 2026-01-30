/**
 * Détail Ticket - Conversation et détails d'un ticket
 *
 * Fonctionnalités :
 * - Header avec informations ticket (référence, statut, priorité)
 * - Timeline des messages (bulles alternées client/staff)
 * - Formulaire de réponse
 * - Actions (fermer, rouvrir, noter satisfaction)
 * - Auto-scroll vers dernier message
 */
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button, SkeletonTable } from '@/components/common'
import { TicketStatusBadge, TicketPriorityBadge } from '@/components/support/TicketBadges'
import { useTicketDetail, useReplyTicket, useCloseTicket } from '@/hooks/useTickets'
import { useChannel } from '@/lib/websocket/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { Send, CheckCircle, MessageSquare, Clock, User } from 'lucide-react'
import type { TicketMessage } from '@/types/support'

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const ticketId = id ? parseInt(id, 10) : null
  const { data, isLoading, error } = useTicketDetail(ticketId)
  const replyMutation = useReplyTicket(ticketId || 0)
  const closeMutation = useCloseTicket(ticketId || 0)

  const [replyContent, setReplyContent] = useState('')

  // WebSocket : écouter les réponses du staff
  useChannel('tickets', (message) => {
    const data = message.data as { ticketId?: number; isStaff?: boolean }
    if (message.event === 'ticket.replied' && data.ticketId === ticketId && data.isStaff) {
      // Un staff a répondu à ce ticket
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
    }
    if (message.event === 'ticket.updated' && data.ticketId === ticketId) {
      // Le ticket a été mis à jour (statut, priorité)
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
    }
  })

  // Auto-scroll vers dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [data?.messages])

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!replyContent.trim() || !ticketId) return

    try {
      await replyMutation.mutateAsync(replyContent)
      setReplyContent('')
    } catch (_error) {
      // Erreur gérée par le hook
    }
  }

  const handleClose = async () => {
    if (!ticketId) return

    try {
      await closeMutation.mutateAsync()
    } catch (_error) {
      // Erreur gérée par le hook
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8">
          <SkeletonTable rows={5} columns={1} />
        </div>
      </Layout>
    )
  }

  if (error || !data?.ticket) {
    return (
      <Layout>
        <div className="p-4 md:p-8">
          <div role="alert" className="text-red-600 dark:text-red-400">
            Ticket non trouvé
          </div>
          <Button variant="secondary" onClick={() => navigate('/support/tickets')} className="mt-4">
            Retour aux tickets
          </Button>
        </div>
      </Layout>
    )
  }

  const { ticket, messages } = data

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Support' },
            { label: 'Mes Tickets', href: '/support/tickets' },
            { label: ticket.reference },
          ]}
        />

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {ticket.reference}
                </h1>
                <TicketStatusBadge state={ticket.state} />
                <TicketPriorityBadge priority={ticket.priority} />
              </div>
              <h2 className="text-lg text-gray-700 dark:text-gray-300">{ticket.subject}</h2>
            </div>

            {ticket.state !== 'closed' && (
              <Button
                variant="secondary"
                icon={<CheckCircle className="w-4 h-4" />}
                onClick={handleClose}
                disabled={closeMutation.isPending}
              >
                {closeMutation.isPending ? 'Fermeture...' : 'Fermer'}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Créé le {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              {ticket.messageCount} message{ticket.messageCount > 1 ? 's' : ''}
            </div>
          </div>

          {/* Description initiale */}
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div
              className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: ticket.description }}
            />
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Conversation
          </h3>

          <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
            {messages && messages.length > 0 ? (
              messages.map((message: TicketMessage) => (
                <MessageBubble key={message.id} message={message} />
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Aucun message pour le moment
              </p>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulaire de réponse */}
          {ticket.state !== 'closed' && (
            <form onSubmit={handleReply} className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <label htmlFor="reply" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Votre réponse
              </label>
              <textarea
                id="reply"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Écrivez votre message..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                disabled={replyMutation.isPending}
              />
              <div className="flex justify-end mt-3">
                <Button
                  type="submit"
                  variant="primary"
                  icon={<Send className="w-4 h-4" />}
                  disabled={!replyContent.trim() || replyMutation.isPending}
                >
                  {replyMutation.isPending ? 'Envoi...' : 'Envoyer'}
                </Button>
              </div>
            </form>
          )}

          {ticket.state === 'closed' && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center text-gray-600 dark:text-gray-400">
              Ce ticket est fermé. Créez un nouveau ticket si vous avez besoin d&apos;aide.
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

interface MessageBubbleProps {
  message: TicketMessage
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isStaff = message.isStaff

  return (
    <div className={`flex ${isStaff ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-2xl ${isStaff ? 'mr-auto' : 'ml-auto'}`}>
        <div className="flex items-center gap-2 mb-1">
          {isStaff && <User className="w-4 h-4 text-purple-600" />}
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {message.authorName}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(message.createdAt).toLocaleString('fr-FR')}
          </span>
        </div>
        <div
          className={`p-4 rounded-lg ${
            isStaff
              ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
              : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
          }`}
        >
          <div
            className="prose dark:prose-invert max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: message.content }}
          />
        </div>
      </div>
    </div>
  )
}
