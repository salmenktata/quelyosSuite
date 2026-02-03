/**
 * Mes Tickets - Gestion des demandes de support
 *
 * Fonctionnalités :
 * - Liste des tickets avec filtres (statut, priorité, catégorie)
 * - Recherche par sujet/référence
 * - Création rapide de ticket
 * - Vue détaillée avec conversation
 * - Stats rapides (nouveaux, en cours, résolus)
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common'
import { TicketStatusBadge, TicketPriorityBadge } from '@/components/support/TicketBadges'
import { supportNotices } from '@/lib/notices'
import { useTickets } from '@/hooks/useTickets'
import {
  Plus,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  Search,
} from 'lucide-react'
import type { Ticket } from '@/types'

export default function Tickets() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    state: '',
    priority: '',
    category: '',
    search: '',
  })

  const { data, isLoading, error } = useTickets(filters)

  // Stats calculées
  const stats = useMemo(() => {
    if (!data?.tickets) return { new: 0, open: 0, pending: 0, resolved: 0 }
    return data.tickets.reduce<Record<string, number>>(
      (acc, ticket) => {
        acc[ticket.state] = (acc[ticket.state] || 0) + 1
        return acc
      },
      {}
    )
  }, [data])

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Support' },
            { label: 'Mes Tickets' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Mes Tickets de Support
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Suivez vos demandes d&apos;assistance
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/support/tickets/new')}
          >
            Nouveau Ticket
          </Button>
        </div>

        <PageNotice config={supportNotices.tickets} />

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Nouveaux"
            value={stats.new || 0}
            color="blue"
            icon={MessageSquare}
          />
          <StatCard
            label="En cours"
            value={stats.open || 0}
            color="yellow"
            icon={Clock}
          />
          <StatCard
            label="En attente"
            value={stats.pending || 0}
            color="purple"
            icon={AlertCircle}
          />
          <StatCard
            label="Résolus"
            value={stats.resolved || 0}
            color="green"
            icon={CheckCircle}
          />
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                Recherche
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Rechercher..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                Statut
              </label>
              <select
                value={filters.state}
                onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Tous</option>
                <option value="new">Nouveau</option>
                <option value="open">En cours</option>
                <option value="pending">En attente</option>
                <option value="resolved">Résolu</option>
                <option value="closed">Fermé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                Priorité
              </label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Toutes</option>
                <option value="urgent">Urgente</option>
                <option value="high">Haute</option>
                <option value="medium">Moyenne</option>
                <option value="low">Basse</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
                Catégorie
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Toutes</option>
                <option value="technical">Support technique</option>
                <option value="billing">Facturation</option>
                <option value="bug">Bug</option>
                <option value="feature_request">Fonctionnalité</option>
                <option value="question">Question</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste */}
        {isLoading ? (
          <SkeletonTable rows={5} columns={5} />
        ) : error ? (
          <div role="alert" className="text-red-600 dark:text-red-400">
            Erreur lors du chargement des tickets
          </div>
        ) : !data?.tickets || data.tickets.length === 0 ? (
          <EmptyState onCreateTicket={() => navigate('/support/tickets/new')} />
        ) : (
          <TicketsTable
            tickets={data.tickets}
            onSelectTicket={(ticket) => navigate(`/support/tickets/${ticket.id}`)}
          />
        )}
      </div>
    </Layout>
  )
}

// Composants auxiliaires
interface StatCardProps {
  label: string
  value: number
  color: 'blue' | 'yellow' | 'purple' | 'green'
  icon: React.ComponentType<{ className?: string }>
}

function StatCard({ label, value, color, icon: Icon }: StatCardProps) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

interface TicketsTableProps {
  tickets: Ticket[]
  onSelectTicket: (ticket: Ticket) => void
}

function TicketsTable({ tickets, onSelectTicket }: TicketsTableProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Référence
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Sujet
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Statut
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Priorité
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Messages
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Date
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              onClick={() => onSelectTicket(ticket)}
              className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {ticket.reference}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                {ticket.subject}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <TicketStatusBadge state={ticket.state} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <TicketPriorityBadge priority={ticket.priority} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {ticket.messageCount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('fr-FR') : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface EmptyStateProps {
  onCreateTicket: () => void
}

function EmptyState({ onCreateTicket }: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
      <MessageSquare className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Aucun ticket
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Vous n&apos;avez pas encore créé de ticket de support.
      </p>
      <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={onCreateTicket}>
        Créer mon premier ticket
      </Button>
    </div>
  )
}
