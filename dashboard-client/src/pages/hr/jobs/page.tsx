/**
 * Postes - Gestion des postes de l'entreprise
 *
 * Fonctionnalités :
 * - Liste des postes avec nombre d'employés
 * - Création et modification de postes
 * - Rattachement aux départements
 * - Description et exigences par poste
 */
import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common'
import { useMyTenant } from '@/hooks/useMyTenant'
import { useJobs, useCreateJob, useDepartments, type Job } from '@/hooks/hr'
import { hrNotices } from '@/lib/notices'
import {
  Plus,
  Briefcase,
  Users,
  Building2,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

export default function JobsPage() {
  const { tenant } = useMyTenant()
  const [showModal, setShowModal] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)

  const { data: jobsData, isLoading, isError } = useJobs(tenant?.id || null)
  const { data: departmentsData } = useDepartments(tenant?.id || null)
  const { mutate: createJob, isPending } = useCreateJob()

  const jobs = jobsData?.jobs || []
  const departments = departmentsData?.departments || []

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <SkeletonTable rows={10} columns={4} />
        </div>
      </Layout>
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
            { label: 'Postes' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Postes
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {jobsData?.total || 0} postes définis
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingJob(null)
              setShowModal(true)
            }}
          >
            Nouveau poste
          </Button>
        </div>

        {/* PageNotice */}
        <PageNotice config={hrNotices.jobs} className="mb-2" />

        {/* Error State */}
        {isError && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement des postes.
              </p>
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => window.location.reload()}
              >
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {/* Jobs Grid */}
        {jobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

        {/* Empty */}
        {jobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun poste
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Créez votre premier poste
            </p>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowModal(true)}
            >
              Créer un poste
            </Button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <JobModal
            job={editingJob}
            departments={departments}
            onClose={() => setShowModal(false)}
            onSave={(data) => {
              createJob({ tenant_id: tenant?.id || 0, ...data })
              setShowModal(false)
            }}
            isPending={isPending}
          />
        )}
      </div>
    </Layout>
  )
}

function JobCard({ job }: { job: Job }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
            <Briefcase className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{job.name}</h3>
            {job.department_name && (
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {job.department_name}
              </p>
            )}
          </div>
        </div>
      </div>

      {job.description && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {job.description}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2 text-gray-600 dark:text-gray-400">
        <Users className="w-4 h-4" />
        <span className="text-sm">{job.no_of_employee || 0} employés</span>
      </div>
    </div>
  )
}

function JobModal({
  job,
  departments,
  onClose,
  onSave,
  isPending,
}: {
  job: Job | null
  departments: { id: number; name: string }[]
  onClose: () => void
  onSave: (data: { name: string; department_id?: number; description?: string }) => void
  isPending: boolean
}) {
  const [formData, setFormData] = useState({
    name: job?.name || '',
    department_id: job?.department_id || '',
    description: job?.description || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name.trim()) {
      onSave({
        name: formData.name.trim(),
        department_id: formData.department_id ? Number(formData.department_id) : undefined,
        description: formData.description.trim() || undefined,
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {job ? 'Modifier le poste' : 'Nouveau poste'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fermer">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
              Nom du poste *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
              Département
            </label>
            <select
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            >
              <option value="">Aucun département</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isPending || !formData.name.trim()}
            >
              {isPending ? 'Enregistrement...' : job ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
