/**
 * Nouveau contrat - Création d'un contrat de travail
 *
 * Fonctionnalités :
 * - Sélection employé avec pré-remplissage
 * - Types de contrat (CDI, CDD, stage, etc.)
 * - Dates et période d'essai
 * - Rémunération et fréquence de paie
 */
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button } from '@/components/common'
import { useMyTenant } from '@/hooks/useMyTenant'
import { useCreateContract, useEmployees, useDepartments, useJobs } from '@/hooks/hr'
import { hrNotices } from '@/lib/notices'
import { Save } from 'lucide-react'

export default function NewContractPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { tenant } = useMyTenant()
  const { mutate: createContract, isPending } = useCreateContract()

  const preselectedEmployeeId = searchParams.get('employee_id')

  const { data: employeesData } = useEmployees({ tenant_id: tenant?.id || 0, limit: 500 })
  const { data: departmentsData } = useDepartments(tenant?.id || null)
  const { data: jobsData } = useJobs(tenant?.id || null)

  const employees = employeesData?.employees || []
  const departments = departmentsData?.departments || []
  const jobs = jobsData?.jobs || []

  const [formData, setFormData] = useState({
    employee_id: preselectedEmployeeId || '',
    contract_type: 'cdi',
    department_id: '',
    job_id: '',
    date_start: new Date().toISOString().split('T')[0],
    date_end: '',
    trial_date_end: '',
    wage: '',
    wage_type: 'monthly',
    schedule_pay: 'monthly',
    notes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant?.id || !formData.employee_id) return

    createContract({
      tenant_id: tenant.id,
      employee_id: Number(formData.employee_id),
      contract_type: formData.contract_type,
      department_id: formData.department_id ? Number(formData.department_id) : undefined,
      job_id: formData.job_id ? Number(formData.job_id) : undefined,
      date_start: formData.date_start,
      date_end: formData.date_end || undefined,
      trial_date_end: formData.trial_date_end || undefined,
      wage: Number(formData.wage) || 0,
      wage_type: formData.wage_type,
      schedule_pay: formData.schedule_pay,
      notes: formData.notes || undefined,
    }, {
      onSuccess: () => navigate('/hr/contracts')
    })
  }

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const employeeId = e.target.value
    setFormData(prev => ({ ...prev, employee_id: employeeId }))

    if (employeeId) {
      const employee = employees.find(emp => emp.id === Number(employeeId))
      if (employee) {
        setFormData(prev => ({
          ...prev,
          employee_id: employeeId,
          department_id: employee.department_id?.toString() || '',
          job_id: employee.job_id?.toString() || '',
        }))
      }
    }
  }

  const contractTypes = [
    { value: 'cdi', label: 'CDI - Contrat à durée indéterminée' },
    { value: 'cdd', label: 'CDD - Contrat à durée déterminée' },
    { value: 'stage', label: 'Stage' },
    { value: 'interim', label: 'Intérim' },
    { value: 'apprenticeship', label: 'Apprentissage' },
    { value: 'freelance', label: 'Freelance' },
  ]

  const needsEndDate = ['cdd', 'stage', 'interim', 'apprenticeship'].includes(formData.contract_type)

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'RH', href: '/hr' },
            { label: 'Contrats', href: '/hr/contracts' },
            { label: 'Nouveau' },
          ]}
        />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Nouveau contrat
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Créer un nouveau contrat de travail
          </p>
        </div>

        {/* PageNotice */}
        <PageNotice config={hrNotices.contractNew} className="mb-2" />

        <form onSubmit={handleSubmit} className="max-w-3xl">
          {/* Employé et Type */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informations générales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  Employé *
                </label>
                <select
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleEmployeeChange}
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Sélectionner un employé</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employee_number})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  Type de contrat *
                </label>
                <select
                  name="contract_type"
                  value={formData.contract_type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                >
                  {contractTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  Département
                </label>
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="">Sélectionner un département</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  Poste
                </label>
                <select
                  name="job_id"
                  value={formData.job_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="">Sélectionner un poste</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>{j.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Période
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  Date de début *
                </label>
                <input
                  type="date"
                  name="date_start"
                  value={formData.date_start}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
              {needsEndDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Date de fin *
                  </label>
                  <input
                    type="date"
                    name="date_end"
                    value={formData.date_end}
                    onChange={handleChange}
                    required={needsEndDate}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  Fin période d'essai
                </label>
                <input
                  type="date"
                  name="trial_date_end"
                  value={formData.trial_date_end}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Rémunération */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Rémunération
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  Salaire brut
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="wage"
                    value={formData.wage}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-3 py-2 pr-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">TND</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  Type de salaire
                </label>
                <select
                  name="wage_type"
                  value={formData.wage_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="monthly">Mensuel</option>
                  <option value="hourly">Horaire</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                  Fréquence de paie
                </label>
                <select
                  name="schedule_pay"
                  value={formData.schedule_pay}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="monthly">Mensuelle</option>
                  <option value="bi-monthly">Bimensuelle</option>
                  <option value="weekly">Hebdomadaire</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Notes
            </h3>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Notes additionnelles sur le contrat..."
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate('/hr/contracts')}>
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Save className="w-4 h-4" />}
              disabled={isPending || !formData.employee_id}
            >
              {isPending ? 'Création...' : 'Créer le contrat'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
