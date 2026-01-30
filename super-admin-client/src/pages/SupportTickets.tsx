/**
 * Gestion Tickets Support - Super Admin
 *
 * Fonctionnalités :
 * - Liste tous les tickets (tous tenants)
 * - Filtres : tenant, statut, priorité, catégorie, date, assigné à
 * - Recherche : sujet, référence, email client
 * - Vue détaillée avec conversation complète
 * - Actions : Répondre, Assigner, Changer statut, Notes internes
 * - Statistiques globales (nouveaux, temps réponse moyen, satisfaction)
 * - Export CSV
 * - Notifications temps réel (nouveaux tickets urgents)
 */

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Filter,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Send,
  UserPlus,
  Loader2,
  Eye,
  Save,
  Download,
  Paperclip,
} from 'lucide-react'
import { api } from '@/lib/api/gateway'
import { useToast } from '@/hooks/useToast'

interface AdminUser {
  id: number
  name: string
  login: string
  email: string
}

interface Ticket {
  id: number
  reference: string
  subject: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  state: 'new' | 'open' | 'pending' | 'resolved' | 'closed'
  assignedTo: string | null
  messageCount: number
  tenantId: number
  tenantName: string
  customerName: string
  customerEmail: string
  internalNotes: string | null
  createdAt: string
  updatedAt: string
}

interface TicketMessage {
  id: number
  authorName: string
  content: string
  isStaff: boolean
  createdAt: string
}

interface Attachment {
  id: number
  name: string
  mimetype: string
  file_size: number
  created_at: string
  url: string
}

export function SupportTickets() {
  const queryClient = useQueryClient()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const [tenantFilter, setTenantFilter] = useState<string>('all')
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignedFilter, setAssignedFilter] = useState<string>('all')

  // Requête liste tickets
  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-tickets', search, tenantFilter, stateFilter, priorityFilter, categoryFilter, assignedFilter, page],
    queryFn: async () => {
      const response = await api.request<{ success: boolean; tickets: Ticket[]; total: number }>({
        method: 'GET',
        path: '/api/super-admin/tickets',
        params: {
          search,
          tenant_id: tenantFilter !== 'all' ? tenantFilter : undefined,
          state: stateFilter !== 'all' ? stateFilter : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          assigned_to: assignedFilter !== 'all' ? assignedFilter : undefined,
          page,
          limit: 50,
        },
      })
      return response.data
    },
  })

  // Requête détail ticket
  const { data: ticketDetail } = useQuery({
    queryKey: ['super-admin-ticket', selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket) return null
      const response = await api.request<{ success: boolean; ticket: Ticket; messages: TicketMessage[] }>({
        method: 'GET',
        path: `/api/super-admin/tickets/${selectedTicket.id}`,
      })
      return response.data
    },
    enabled: !!selectedTicket,
  })

  // Requête pièces jointes
  const { data: attachmentsData } = useQuery({
    queryKey: ['super-admin-ticket-attachments', selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket) return null
      const response = await api.request<{ success: boolean; attachments: Attachment[] }>({
        method: 'GET',
        path: `/api/super-admin/tickets/${selectedTicket.id}/attachments`,
      })
      return response.data
    },
    enabled: !!selectedTicket,
  })

  // Mutation répondre
  const replyMutation = useMutation({
    mutationFn: async ({ ticketId, content }: { ticketId: number; content: string }) => {
      return api.request({
        method: 'POST',
        path: `/api/super-admin/tickets/${ticketId}/reply`,
        body: { content },
      })
    },
    onSuccess: () => {
      toast.success('Réponse envoyée avec succès')
      setReplyContent('')
      queryClient.invalidateQueries({ queryKey: ['super-admin-ticket', selectedTicket?.id] })
      queryClient.invalidateQueries({ queryKey: ['super-admin-tickets'] })
    },
    onError: () => {
      toast.error('Erreur lors de l\'envoi de la réponse')
    },
  })

  // Mutation changer statut
  const changeStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: number; status: string }) => {
      return api.request({
        method: 'PUT',
        path: `/api/super-admin/tickets/${ticketId}/status`,
        body: { status },
      })
    },
    onSuccess: () => {
      toast.success('Statut modifié avec succès')
      setSelectedTicket(null)
      queryClient.invalidateQueries({ queryKey: ['super-admin-tickets'] })
    },
    onError: () => {
      toast.error('Erreur lors du changement de statut')
    },
  })

  // Query liste admins
  const { data: adminsData } = useQuery({
    queryKey: ['super-admin-users'],
    queryFn: async () => {
      const response = await api.request<{ success: boolean; users: AdminUser[] }>({
        method: 'GET',
        path: '/api/super-admin/users',
      })
      return response.data
    },
  })

  // Mutation assigner
  const assignMutation = useMutation({
    mutationFn: async ({ ticketId, userId }: { ticketId: number; userId: number | null }) => {
      return api.request({
        method: 'POST',
        path: `/api/super-admin/tickets/${ticketId}/assign`,
        body: { userId },
      })
    },
    onSuccess: () => {
      toast.success('Ticket assigné avec succès')
      setShowAssignModal(false)
      queryClient.invalidateQueries({ queryKey: ['super-admin-ticket', selectedTicket?.id] })
      queryClient.invalidateQueries({ queryKey: ['super-admin-tickets'] })
    },
    onError: () => {
      toast.error('Erreur lors de l\'assignation')
    },
  })

  // Mutation sauvegarder notes internes
  const saveNotesMutation = useMutation({
    mutationFn: async ({ ticketId, notes }: { ticketId: number; notes: string }) => {
      return api.request({
        method: 'PUT',
        path: `/api/super-admin/tickets/${ticketId}/notes`,
        body: { notes },
      })
    },
    onSuccess: () => {
      toast.success('Notes sauvegardées')
      queryClient.invalidateQueries({ queryKey: ['super-admin-ticket', selectedTicket?.id] })
    },
    onError: () => {
      toast.error('Erreur lors de la sauvegarde des notes')
    },
  })

  // Statistiques calculées
  // Query stats avancées
  const { data: statsData } = useQuery({
    queryKey: ['super-admin-tickets-stats'],
    queryFn: async () => {
      const response = await api.request<{
        success: boolean
        total: number
        byState: Record<string, number>
        byPriority: Record<string, number>
        avgResponseTime: number
        avgResolutionTime: number
        avgSatisfaction: number
      }>({
        method: 'GET',
        path: '/api/super-admin/tickets/stats',
      })
      return response.data
    },
  })

  const stats = useMemo(() => {
    if (!data?.tickets) return { new: 0, open: 0, pending: 0, urgent: 0 }
    return data.tickets.reduce(
      (acc, ticket) => {
        if (ticket.state === 'new') acc.new++
        if (ticket.state === 'open') acc.open++
        if (ticket.state === 'pending') acc.pending++
        if (ticket.priority === 'urgent') acc.urgent++
        return acc
      },
      { new: 0, open: 0, pending: 0, urgent: 0 }
    )
  }, [data])

  const tickets = data?.tickets || []
  const total = data?.total || 0

  const handleReply = async () => {
    if (!selectedTicket || !replyContent.trim()) return
    await replyMutation.mutateAsync({ ticketId: selectedTicket.id, content: replyContent })
  }

  const handleChangeStatus = async (status: string) => {
    if (!selectedTicket) return
    await changeStatusMutation.mutateAsync({ ticketId: selectedTicket.id, status })
  }

  const handleAssign = async (userId: number | null) => {
    if (!selectedTicket) return
    await assignMutation.mutateAsync({ ticketId: selectedTicket.id, userId })
  }

  const handleSaveNotes = async () => {
    if (!selectedTicket) return
    await saveNotesMutation.mutateAsync({ ticketId: selectedTicket.id, notes: internalNotes })
  }

  // Initialiser notes quand on ouvre un ticket
  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setInternalNotes(ticket.internalNotes || '')
  }

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams()
      if (tenantFilter !== 'all') params.append('tenant_id', tenantFilter)
      if (stateFilter !== 'all') params.append('state', stateFilter)
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (assignedFilter !== 'all') params.append('assigned_to', assignedFilter)

      const queryString = params.toString()
      const url = `/api/super-admin/tickets/export${queryString ? `?${queryString}` : ''}`

      // Ouvrir dans nouvelle fenêtre pour télécharger
      window.open(`${import.meta.env.VITE_API_URL || ''}${url}`, '_blank')
      toast.success('Export CSV lancé')
    } catch {
      toast.error('Erreur lors de l\'export CSV')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gestion globale des tickets de tous les tenants</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Nouveaux" value={stats.new} color="blue" icon={MessageSquare} />
        <StatCard label="En cours" value={stats.open} color="yellow" icon={Clock} />
        <StatCard label="En attente" value={stats.pending} color="purple" icon={AlertCircle} />
        <StatCard label="Urgents" value={stats.urgent} color="red" icon={AlertCircle} />
      </div>

      {/* Stats avancées */}
      {statsData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Statistiques globales</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total tickets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{statsData.total}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Temps réponse moyen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {statsData.avgResponseTime.toFixed(1)}h
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Temps résolution moyen</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {statsData.avgResolutionTime.toFixed(1)}h
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Satisfaction moyenne</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {statsData.avgSatisfaction.toFixed(1)}/5
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Recherche */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par sujet, référence, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Filtre Statut */}
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="new">Nouveau</option>
            <option value="open">Ouvert</option>
            <option value="pending">En attente</option>
            <option value="resolved">Résolu</option>
            <option value="closed">Fermé</option>
          </select>

          {/* Filtre Priorité */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Toutes priorités</option>
            <option value="low">Basse</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
            <option value="urgent">Urgente</option>
          </select>

          {/* Filtre Catégorie */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Toutes catégories</option>
            <option value="technical">Support technique</option>
            <option value="billing">Facturation</option>
            <option value="bug">Bug</option>
            <option value="feature_request">Fonctionnalité</option>
            <option value="question">Question</option>
            <option value="other">Autre</option>
          </select>

          {/* Filtre Assigné à */}
          <select
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Tous</option>
            <option value="unassigned">Non assignés</option>
            {adminsData?.users.map((admin) => (
              <option key={admin.id} value={admin.id.toString()}>
                {admin.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau tickets */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">Aucun ticket trouvé</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Référence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Sujet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Priorité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Créé le
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{ticket.reference}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{ticket.tenantName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">{ticket.subject}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{ticket.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge state={ticket.state} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleSelectTicket(ticket)}
                        className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {tickets.length} tickets sur {total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={tickets.length < 50}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail ticket */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header modal */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedTicket.reference}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedTicket.tenantName} - {selectedTicket.customerEmail}
                </p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenu modal */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Infos ticket */}
              <div className="flex items-center gap-3">
                <StatusBadge state={selectedTicket.state} />
                <PriorityBadge priority={selectedTicket.priority} />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Créé le {new Date(selectedTicket.createdAt).toLocaleString('fr-FR')}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{selectedTicket.subject}</h3>
                <div
                  className="text-sm text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedTicket.description }}
                />
              </div>

              {/* Messages */}
              {ticketDetail?.messages && ticketDetail.messages.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Conversation</h4>
                  {ticketDetail.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg ${
                        message.isStaff
                          ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
                          : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{message.authorName}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(message.createdAt).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <div
                        className="text-sm text-gray-700 dark:text-gray-300"
                        dangerouslySetInnerHTML={{ __html: message.content }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Pièces jointes */}
              {attachmentsData?.attachments && attachmentsData.attachments.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Pièces jointes ({attachmentsData.attachments.length})
                  </h4>
                  <div className="space-y-2">
                    {attachmentsData.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {att.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(att.file_size / 1024).toFixed(1)} KB • {new Date(att.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <a
                          href={`${import.meta.env.VITE_API_URL || ''}${att.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes internes (Super Admin uniquement) */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label htmlFor="internal-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes internes (visibles uniquement par les admins)
                </label>
                <textarea
                  id="internal-notes"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Notes privées, contexte, actions à mener..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={saveNotesMutation.isPending}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saveNotesMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder notes'}
                  </button>
                </div>
              </div>

              {/* Formulaire réponse */}
              {selectedTicket.state !== 'closed' && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <label htmlFor="reply" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Votre réponse
                  </label>
                  <textarea
                    id="reply"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Écrivez votre réponse au client..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                </div>
              )}
            </div>

            {/* Actions modal */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Assigner
                </button>
                {selectedTicket.state !== 'closed' && (
                  <button
                    onClick={() => handleChangeStatus('resolved')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Résolu
                  </button>
                )}
                {selectedTicket.state === 'closed' && (
                  <button
                    onClick={() => handleChangeStatus('open')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Rouvrir
                  </button>
                )}
              </div>
              {selectedTicket.state !== 'closed' && (
                <button
                  onClick={handleReply}
                  disabled={!replyContent.trim() || replyMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {replyMutation.isPending ? 'Envoi...' : 'Envoyer'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal assignation */}
      {showAssignModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assigner le ticket</h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ticket : <span className="font-medium">{selectedTicket.reference}</span>
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assigner à
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  onChange={(e) => {
                    const userId = e.target.value ? parseInt(e.target.value) : null
                    handleAssign(userId)
                  }}
                  defaultValue={selectedTicket.assignedTo || ''}
                >
                  <option value="">Non assigné</option>
                  {adminsData?.users.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.name} ({admin.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Composants auxiliaires
function StatCard({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: any }) {
  const colors = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color as keyof typeof colors]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors = {
    low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  const labels = {
    low: 'Basse',
    medium: 'Moyenne',
    high: 'Haute',
    urgent: 'Urgente',
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority as keyof typeof colors]}`}>
      {labels[priority as keyof typeof labels]}
    </span>
  )
}

function StatusBadge({ state }: { state: string }) {
  const colors = {
    new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    open: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    pending: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    closed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  }

  const labels = {
    new: 'Nouveau',
    open: 'Ouvert',
    pending: 'En attente',
    resolved: 'Résolu',
    closed: 'Fermé',
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[state as keyof typeof colors]}`}>
      {labels[state as keyof typeof labels]}
    </span>
  )
}
