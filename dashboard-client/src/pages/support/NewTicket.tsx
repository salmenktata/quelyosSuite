/**
 * Nouveau Ticket - Création d'une demande de support
 *
 * Fonctionnalités :
 * - Formulaire de création avec validation
 * - Sélection catégorie (cartes avec icônes)
 * - Sélection priorité (radio buttons)
 * - Champs sujet et description
 * - Soumission avec feedback
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button } from '@/components/common'
import { supportNotices } from '@/lib/notices'
import { useCreateTicket } from '@/hooks/useTickets'
import {
  AlertCircle,
  Zap,
  MessageSquare,
  CreditCard,
  Bug,
  Lightbulb,
  HelpCircle,
  Package,
  Truck,
  RotateCcw,
  DollarSign,
  User,
  MoreHorizontal,
} from 'lucide-react'
import type { TicketCategory, TicketPriority } from '@quelyos/types'

const CATEGORIES = [
  { id: 'technical' as TicketCategory, label: 'Support technique', icon: Zap, color: 'blue' },
  { id: 'billing' as TicketCategory, label: 'Facturation', icon: CreditCard, color: 'green' },
  { id: 'bug' as TicketCategory, label: 'Signaler un bug', icon: Bug, color: 'red' },
  { id: 'feature_request' as TicketCategory, label: 'Demande fonctionnalité', icon: Lightbulb, color: 'yellow' },
  { id: 'question' as TicketCategory, label: 'Question générale', icon: HelpCircle, color: 'purple' },
  { id: 'order' as TicketCategory, label: 'Problème commande', icon: Package, color: 'orange' },
  { id: 'delivery' as TicketCategory, label: 'Problème livraison', icon: Truck, color: 'indigo' },
  { id: 'return' as TicketCategory, label: 'Demande retour', icon: RotateCcw, color: 'pink' },
  { id: 'refund' as TicketCategory, label: 'Demande remboursement', icon: DollarSign, color: 'emerald' },
  { id: 'payment' as TicketCategory, label: 'Problème paiement', icon: CreditCard, color: 'cyan' },
  { id: 'account' as TicketCategory, label: 'Problème compte', icon: User, color: 'violet' },
  { id: 'other' as TicketCategory, label: 'Autre', icon: MoreHorizontal, color: 'gray' },
]

const PRIORITIES = [
  { id: 'low' as TicketPriority, label: 'Basse', description: 'Pas urgent, peut attendre' },
  { id: 'medium' as TicketPriority, label: 'Moyenne', description: 'Problème gênant mais non bloquant' },
  { id: 'high' as TicketPriority, label: 'Haute', description: 'Problème important à traiter rapidement' },
  { id: 'urgent' as TicketPriority, label: 'Urgente', description: 'Problème bloquant, nécessite intervention immédiate' },
]

export default function NewTicket() {
  const navigate = useNavigate()
  const createTicket = useCreateTicket()

  const [formData, setFormData] = useState({
    category: '' as TicketCategory | '',
    priority: 'medium' as TicketPriority,
    subject: '',
    description: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.category) {
      newErrors.category = 'Veuillez sélectionner une catégorie'
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Le sujet est requis'
    } else if (formData.subject.length < 5) {
      newErrors.subject = 'Le sujet doit contenir au moins 5 caractères'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise'
    } else if (formData.description.length < 20) {
      newErrors.description = 'La description doit contenir au moins 20 caractères'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      const result = await createTicket.mutateAsync({
        category: formData.category as TicketCategory,
        priority: formData.priority,
        subject: formData.subject,
        description: formData.description,
      })

      if (result.success) {
        navigate(`/support/tickets/${result.ticket.id}`)
      }
    } catch (_error) {
      setErrors({ submit: 'Erreur lors de la création du ticket. Veuillez réessayer.' })
    }
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Support' },
            { label: 'Mes Tickets', href: '/support/tickets' },
            { label: 'Nouveau Ticket' },
          ]}
        />

        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Créer un Ticket de Support
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Décrivez votre problème ou question
          </p>
        </div>

        <PageNotice config={supportNotices.newTicket} />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-3">
              Catégorie <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: category.id })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.category === category.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <category.icon className={`w-6 h-6 mx-auto mb-2 text-${category.color}-600`} />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {category.label}
                  </div>
                </button>
              ))}
            </div>
            {errors.category && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.category}
              </p>
            )}
          </div>

          {/* Priorité */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-3">
              Priorité <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {PRIORITIES.map((priority) => (
                <label
                  key={priority.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <input
                    type="radio"
                    name="priority"
                    value={priority.id}
                    checked={formData.priority === priority.id}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as TicketPriority })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {priority.label}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {priority.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Sujet */}
          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2"
            >
              Sujet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Ex: Impossible de me connecter à mon compte"
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                errors.subject
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.subject && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.subject}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2"
            >
              Description détaillée <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez votre problème en détail..."
              rows={6}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none ${
                errors.description
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.description && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Erreur soumission */}
          {errors.submit && (
            <div
              role="alert"
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-2 text-red-800 dark:text-red-200"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              type="submit"
              variant="primary"
              icon={<MessageSquare className="w-4 h-4" />}
              disabled={createTicket.isPending}
            >
              {createTicket.isPending ? 'Création...' : 'Créer le ticket'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/support/tickets')}
              disabled={createTicket.isPending}
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
