/**
 * Évaluations - Gestion des entretiens annuels
 *
 * Fonctionnalités :
 * - Liste des évaluations avec filtres
 * - Statistiques par statut
 * - Création d'évaluations
 * - Actions rapides (démarrer, voir)
 */
import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common'
import { useMyTenant } from '@/hooks/useMyTenant'
import { useAppraisals, useCreateAppraisal, useAppraisalAction, useEmployees } from '@/hooks/hr'
import { hrNotices } from '@/lib/notices'
import { Link } from 'react-router-dom'
import { ClipboardCheck, Plus, Star, Eye, Play, X, AlertCircle, RefreshCw } from 'lucide-react'

export default function AppraisalsPage() {
  const { tenant } = useMyTenant()
  const [showModal, setShowModal] = useState(false)
  const [stateFilter, setStateFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear())

  const { data, isLoading, isError, refetch } = useAppraisals({
    tenant_id: tenant?.id || 0,
    state: stateFilter || undefined,
    appraisal_type: typeFilter || undefined,
    year: yearFilter,
  })

  const { mutate: createAppraisal, isPending: isCreating } = useCreateAppraisal()
  const { mutate: doAction } = useAppraisalAction()

  const appraisals = data?.appraisals || []

  const getStateColor = (state: string) => {
    switch (state) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'in_progress': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      case 'employee_done':
      case 'manager_done': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'done': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getScoreStars = (score: string | null) => {
    if (!score) return null
    const num = parseInt(score)
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={`w-3 h-3 ${i <= num ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
          />
        ))}
      </div>
    )
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'RH', href: '/hr' },
            { label: 'Évaluations' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Évaluations
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Entretiens annuels et bilans de performance
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowModal(true)}
          >
            Nouvelle évaluation
          </Button>
        </div>

        {/* PageNotice */}
        <PageNotice config={hrNotices.appraisals} className="mb-2" />

        {/* Error State */}
        {isError && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement des évaluations.
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
        )}

        {/* Stats rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Planifiées" count={appraisals.filter(a => a.state === 'scheduled').length} color="blue" />
          <StatCard label="En cours" count={appraisals.filter(a => ['in_progress', 'employee_done', 'manager_done'].includes(a.state)).length} color="amber" />
          <StatCard label="Terminées" count={appraisals.filter(a => a.state === 'done').length} color="emerald" />
          <StatCard label="Total" count={data?.total || 0} color="gray" />
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-4">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(Number(e.target.value))}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          >
            {[yearFilter - 1, yearFilter, yearFilter + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="scheduled">Planifié</option>
            <option value="in_progress">En cours</option>
            <option value="done">Terminé</option>
            <option value="cancelled">Annulé</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="">Tous les types</option>
            <option value="annual">Entretien annuel</option>
            <option value="probation">Fin période d'essai</option>
            <option value="mid_year">Bilan semestriel</option>
            <option value="project">Fin de projet</option>
          </select>
        </div>

        {/* Loading */}
        {isLoading && <SkeletonTable rows={10} columns={5} />}

        {/* Liste */}
        {!isLoading && appraisals.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 text-left text-sm text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 font-medium">Référence</th>
                  <th className="px-4 py-3 font-medium">Employé</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Date prévue</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Note</th>
                  <th className="px-4 py-3 font-medium">Objectifs</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {appraisals.map(appraisal => (
                  <tr key={appraisal.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="px-4 py-3">
                      <Link
                        to={`/hr/appraisals/${appraisal.id}`}
                        className="font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
                      >
                        {appraisal.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 text-sm font-semibold">
                          {appraisal.employee_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{appraisal.employee_name}</p>
                          {appraisal.department_name && (
                            <p className="text-xs text-gray-500">{appraisal.department_name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{appraisal.appraisal_type_label}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {appraisal.date_scheduled ? new Date(appraisal.date_scheduled).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStateColor(appraisal.state)}`}>
                        {appraisal.state_label}
                      </span>
                    </td>
                    <td className="px-4 py-3">{getScoreStars(appraisal.final_score)}</td>
                    <td className="px-4 py-3 text-sm">
                      {appraisal.goals_total > 0 ? (
                        <span className="text-gray-600 dark:text-gray-300">{appraisal.goals_achieved}/{appraisal.goals_total}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/hr/appraisals/${appraisal.id}`}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Voir"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {appraisal.state === 'scheduled' && (
                          <button
                            onClick={() => doAction({ id: appraisal.id, action: 'start' })}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded"
                            title="Démarrer"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty */}
        {!isLoading && appraisals.length === 0 && (
          <div className="text-center py-12">
            <ClipboardCheck className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucune évaluation
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Planifiez les entretiens annuels de vos employés
            </p>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowModal(true)}
            >
              Nouvelle évaluation
            </Button>
          </div>
        )}

        {/* Modal création */}
        {showModal && (
          <CreateAppraisalModal
            tenantId={tenant?.id || 0}
            onClose={() => setShowModal(false)}
            onCreate={(modalData) => {
              createAppraisal(modalData)
              setShowModal(false)
            }}
            isLoading={isCreating}
          />
        )}
      </div>
    </Layout>
  )
}

function StatCard({ label, count, color }: { label: string; count: number; color: 'blue' | 'amber' | 'emerald' | 'gray' }) {
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    amber: 'text-amber-600 dark:text-amber-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    gray: 'text-gray-600 dark:text-gray-400',
  }
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>{count}</p>
    </div>
  )
}

function CreateAppraisalModal({
  tenantId,
  onClose,
  onCreate,
  isLoading,
}: {
  tenantId: number
  onClose: () => void
  onCreate: (data: { tenant_id: number; employee_id: number; appraisal_type: string; date_scheduled?: string; period_start?: string; period_end?: string; duration?: number; location?: string }) => void
  isLoading: boolean
}) {
  const { data: employeesData } = useEmployees({ tenant_id: tenantId, limit: 200 })
  const employees = employeesData?.employees || []

  const [formData, setFormData] = useState({
    employee_id: '',
    appraisal_type: 'annual',
    date_scheduled: '',
    period_start: '',
    period_end: '',
    duration: '1',
    location: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.employee_id) return

    onCreate({
      tenant_id: tenantId,
      employee_id: parseInt(formData.employee_id),
      appraisal_type: formData.appraisal_type,
      date_scheduled: formData.date_scheduled || undefined,
      period_start: formData.period_start || undefined,
      period_end: formData.period_end || undefined,
      duration: parseFloat(formData.duration),
      location: formData.location || undefined,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Nouvelle évaluation
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fermer">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
              Employé *
            </label>
            <select
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              required
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            >
              <option value="">Sélectionner...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
              Type d'évaluation *
            </label>
            <select
              value={formData.appraisal_type}
              onChange={(e) => setFormData({ ...formData, appraisal_type: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            >
              <option value="annual">Entretien annuel</option>
              <option value="probation">Fin période d'essai</option>
              <option value="mid_year">Bilan semestriel</option>
              <option value="project">Fin de projet</option>
              <option value="other">Autre</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Début période</label>
              <input
                type="date"
                value={formData.period_start}
                onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Fin période</label>
              <input
                type="date"
                value={formData.period_end}
                onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Date entretien</label>
              <input
                type="datetime-local"
                value={formData.date_scheduled}
                onChange={(e) => setFormData({ ...formData, date_scheduled: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Durée (heures)</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">Lieu</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Salle de réunion, bureau..."
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={isLoading || !formData.employee_id}>
              {isLoading ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
