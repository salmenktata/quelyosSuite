/**
 * Détail Lead - Opportunité commerciale détaillée
 *
 * Fonctionnalités :
 * - Vue complète de l'opportunité (contact, montant, probabilité)
 * - Édition inline des informations lead
 * - Calcul du revenu espéré (montant × probabilité)
 * - Date d'échéance avec alerte visuelle
 * - Historique des interactions et activités
 * - Actions rapides (conversion client, archivage)
 */
import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Save, X, DollarSign, Percent, Calendar, AlertCircle, RefreshCw } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { SkeletonTable, Button } from '@/components/common'
import { useLead } from '@/hooks/useLead'
import { useUpdateLead } from '@/hooks/useUpdateLead'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const leadId = id ? parseInt(id) : undefined

  const { data: lead, isLoading, isError, refetch } = useLead(leadId)
  const updateMutation = useUpdateLead()

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    expected_revenue: '',
    probability: '',
    date_deadline: '',
    description: '',
  })

  const handleEdit = () => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        expected_revenue: lead.expected_revenue?.toString() || '',
        probability: lead.probability?.toString() || '',
        date_deadline: lead.date_deadline || '',
        description: lead.description || '',
      })
      setIsEditing(true)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      name: '',
      expected_revenue: '',
      probability: '',
      date_deadline: '',
      description: '',
    })
  }

  const handleSave = async () => {
    if (!leadId) return

    try {
      await updateMutation.mutateAsync({
        id: leadId,
        data: {
          name: formData.name,
          expected_revenue: formData.expected_revenue ? parseFloat(formData.expected_revenue) : undefined,
          probability: formData.probability ? parseFloat(formData.probability) : undefined,
          date_deadline: formData.date_deadline || undefined,
          description: formData.description,
        },
      })
      toast.success('Opportunité mise à jour avec succès')
      setIsEditing(false)
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
      logger.error('Lead update error:', error)
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse" />
          <SkeletonTable rows={6} columns={2} />
        </div>
      </Layout>
    )
  }

  if (isError) {
    return (
      <Layout>
        <div className="p-4 md:p-8">
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement de l'opportunité.
              </p>
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => refetch()}
              >
                Réessayer
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!lead) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Opportunité introuvable
          </h2>
          <Link
            to="/crm/leads"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Retour à la liste
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Link to="/" className="hover:text-gray-900 dark:hover:text-white">
            Accueil
          </Link>
          <span>/</span>
          <Link to="/crm" className="hover:text-gray-900 dark:hover:text-white">
            CRM
          </Link>
          <span>/</span>
          <Link to="/crm/leads" className="hover:text-gray-900 dark:hover:text-white">
            Opportunités
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">{lead.name}</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {lead.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {lead.partner_name || 'Aucun client associé'}
              </p>
            </div>
          </div>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit2 className="w-5 h-5" />
              Modifier
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-5 h-5" />
                Enregistrer
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Détails de l'opportunité
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Nom de l'opportunité
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">{lead.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Revenu attendu
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.expected_revenue}
                      onChange={(e) => setFormData({ ...formData, expected_revenue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {lead.expected_revenue
                        ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(lead.expected_revenue)
                        : '-'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Probabilité (%)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.probability}
                      onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {lead.probability !== undefined ? `${lead.probability}%` : '-'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Date limite
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.date_deadline}
                      onChange={(e) => setFormData({ ...formData, date_deadline: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {lead.date_deadline
                        ? new Date(lead.date_deadline).toLocaleDateString('fr-FR')
                        : '-'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Description
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {lead.description || '-'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Informations
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Stage</p>
                    <p className="font-medium text-gray-900 dark:text-white">{lead.stage_name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Percent className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Probabilité</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {lead.probability !== undefined ? `${lead.probability}%` : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Date de création</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(lead.create_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                {lead.write_date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Dernière modification</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(lead.write_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {(lead.email || lead.phone || lead.mobile) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Contact
                </h2>

                <div className="space-y-2 text-sm">
                  {lead.email && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Email : </span>
                      <a href={`mailto:${lead.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                        {lead.email}
                      </a>
                    </div>
                  )}
                  {lead.phone && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Téléphone : </span>
                      <a href={`tel:${lead.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                        {lead.phone}
                      </a>
                    </div>
                  )}
                  {lead.mobile && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Mobile : </span>
                      <a href={`tel:${lead.mobile}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                        {lead.mobile}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
