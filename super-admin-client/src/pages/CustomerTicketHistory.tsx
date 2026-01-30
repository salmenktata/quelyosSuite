/**
 * Historique Tickets Client - Super Admin
 *
 * Fonctionnalités :
 * - Affichage infos client (nom, email, téléphone)
 * - Stats agrégées : total tickets, ouverts/résolus, temps moyen résolution, satisfaction moyenne
 * - Liste complète des tickets du client avec filtres
 * - Recherche par sujet/référence
 * - Filtres : statut, priorité, catégorie, date
 * - Vue détaillée ticket avec conversation
 * - Export CSV historique client
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  Star,
  TrendingUp,
  Search,
  Filter,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import { api } from '@/lib/api/gateway'
import { useToast } from '@/hooks/useToast'

interface Customer {
  id: number
  name: string
  email: string
  phone: string | null
}

interface TicketStats {
  total_tickets: number
  open_tickets: number
  resolved_tickets: number
  avg_resolution_time: number | null
  avg_satisfaction: number | null
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
  createdAt: string
  updatedAt: string
  resolutionTime: number | null
  satisfactionRating: string | null
}

export function CustomerTicketHistory() {
  const { customerId } = useParams<{ customerId: string }>()
  const navigate = useNavigate()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Requête historique client
  const { data, isLoading, error } = useQuery({
    queryKey: ['customer-ticket-history', customerId],
    queryFn: async () => {
      const response = await api.request<{
        success: boolean
        customer: Customer
        stats: TicketStats
        tickets: Ticket[]
      }>({
        method: 'GET',
        path: `/api/super-admin/customers/${customerId}/tickets`,
      })
      return response.data
    },
    enabled: !!customerId,
  })

  // Filtrage tickets côté client
  const filteredTickets = data?.tickets.filter((ticket) => {
    const matchSearch =
      search === '' ||
      ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
      ticket.reference.toLowerCase().includes(search.toLowerCase())
    const matchState = stateFilter === 'all' || ticket.state === stateFilter
    const matchPriority = priorityFilter === 'all' || ticket.priority === priorityFilter
    const matchCategory = categoryFilter === 'all' || ticket.category === categoryFilter
    return matchSearch && matchState && matchPriority && matchCategory
  })

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredTickets || filteredTickets.length === 0) {
      toast.error('Aucun ticket à exporter')
      return
    }

    const headers = ['Référence', 'Sujet', 'Catégorie', 'Priorité', 'Statut', 'Messages', 'Créé le', 'Mis à jour', 'Temps résolution (h)', 'Satisfaction']
    const rows = filteredTickets.map((t) => [
      t.reference,
      t.subject,
      t.category,
      t.priority,
      t.state,
      t.messageCount,
      new Date(t.createdAt).toLocaleString('fr-FR'),
      new Date(t.updatedAt).toLocaleString('fr-FR'),
      t.resolutionTime ? (t.resolutionTime / 3600).toFixed(1) : 'N/A',
      t.satisfactionRating || 'N/A',
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `historique_client_${data?.customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)

    toast.success('Export CSV téléchargé')
  }

  // Formatage temps résolution
  const formatResolutionTime = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const hours = seconds / 3600
    if (hours < 1) return `${Math.round(hours * 60)}min`
    if (hours < 24) return `${hours.toFixed(1)}h`
    return `${(hours / 24).toFixed(1)}j`
  }

  // Badges statut/priorité
  const getStateBadge = (state: Ticket['state']) => {
    const config = {
      new: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Nouveau' },
      open: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', label: 'Ouvert' },
      pending: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', label: 'En attente' },
      resolved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Résolu' },
      closed: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', label: 'Fermé' },
    }
    const { bg, text, label } = config[state]
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${bg} ${text}`}>{label}</span>
  }

  const getPriorityBadge = (priority: Ticket['priority']) => {
    const config = {
      low: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', label: 'Basse' },
      medium: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Moyenne' },
      high: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', label: 'Haute' },
      urgent: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Urgente' },
    }
    const { bg, text, label } = config[priority]
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${bg} ${text}`}>{label}</span>
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">Chargement de l'historique...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-gray-900 dark:text-white font-medium mb-2">Erreur de chargement</p>
            <p className="text-gray-600 dark:text-gray-400">Impossible de charger l'historique du client</p>
            <button
              onClick={() => navigate('/tenants')}
              className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
            >
              Retour aux Tenants
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { customer, stats } = data

  return (
    <div className="p-6 space-y-6">
      {/* Header avec retour */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/tenants')}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Historique Client</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Tous les tickets de support pour ce client
            </p>
          </div>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Infos Client */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations Client</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <User className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Nom</p>
              <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
              <p className="font-medium text-gray-900 dark:text-white">{customer.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Phone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Téléphone</p>
              <p className="font-medium text-gray-900 dark:text-white">{customer.phone || 'Non renseigné'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Agrégées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Tickets</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total_tickets}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Ouverts</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.open_tickets}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Résolus</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.resolved_tickets}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Temps Moyen Résolution</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatResolutionTime(stats.avg_resolution_time)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Satisfaction Moyenne</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.avg_satisfaction ? `${stats.avg_satisfaction.toFixed(1)}/5` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Filtres et Recherche */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="new">Nouveau</option>
            <option value="open">Ouvert</option>
            <option value="pending">En attente</option>
            <option value="resolved">Résolu</option>
            <option value="closed">Fermé</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Toutes les priorités</option>
            <option value="low">Basse</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
            <option value="urgent">Urgente</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Toutes les catégories</option>
            <option value="order">Commande</option>
            <option value="product">Produit</option>
            <option value="delivery">Livraison</option>
            <option value="return">Retour</option>
            <option value="refund">Remboursement</option>
            <option value="payment">Paiement</option>
            <option value="account">Compte</option>
            <option value="technical">Technique</option>
            <option value="billing">Facturation</option>
            <option value="other">Autre</option>
          </select>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Filter className="w-4 h-4" />
            <span>{filteredTickets?.length || 0} résultat(s)</span>
          </div>
        </div>
      </div>

      {/* Liste Tickets */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Référence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Sujet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Priorité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Messages
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Créé le
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTickets && filteredTickets.length > 0 ? (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900 dark:text-white">{ticket.reference}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{ticket.subject}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{ticket.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getPriorityBadge(ticket.priority)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStateBadge(ticket.state)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MessageSquare className="w-4 h-4" />
                        <span>{ticket.messageCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/support-tickets?ticket=${ticket.id}`)}
                        className="p-2 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <MessageSquare className="w-12 h-12 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400">Aucun ticket trouvé</p>
                      {(search || stateFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setSearch('')
                            setStateFilter('all')
                            setPriorityFilter('all')
                            setCategoryFilter('all')
                          }}
                          className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                        >
                          Réinitialiser les filtres
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
