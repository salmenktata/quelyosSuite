/**
 * Nouvel employé - Création d'une fiche employé
 *
 * Fonctionnalités :
 * - Formulaire multi-onglets (Identité, Professionnel, Contact, Adresse)
 * - Validation des champs obligatoires
 * - Liaison département et poste
 * - Contact d'urgence
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button } from '@/components/common'
import { useMyTenant } from '@/hooks/useMyTenant'
import { useCreateEmployee, useDepartments, useJobs } from '@/hooks/hr'
import { hrNotices } from '@/lib/notices'
import { Save, User, Briefcase, Phone, MapPin, AlertCircle } from 'lucide-react'

export default function NewEmployeePage() {
  const navigate = useNavigate()
  const { tenant } = useMyTenant()
  const { mutate: createEmployee, isPending } = useCreateEmployee()
  const { data: departmentsData, isError: isDepartmentsError } = useDepartments(tenant?.id || null)
  const { data: jobsData, isError: isJobsError } = useJobs(tenant?.id || null)

  const departments = departmentsData?.departments || []
  const jobs = jobsData?.jobs || []

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: '',
    birthday: '',
    identification_id: '',
    marital: '',
    children: 0,
    country_id: '',
    department_id: '',
    job_id: '',
    work_email: '',
    work_phone: '',
    mobile_phone: '',
    address_street: '',
    address_city: '',
    address_zip: '',
    emergency_contact: '',
    emergency_phone: '',
  })

  const [activeTab, setActiveTab] = useState('identity')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant?.id) return

    createEmployee({
      tenant_id: tenant.id,
      first_name: formData.first_name,
      last_name: formData.last_name,
      gender: formData.gender || undefined,
      birthday: formData.birthday || undefined,
      identification_id: formData.identification_id || undefined,
      marital: formData.marital || undefined,
      children: formData.children || 0,
      department_id: formData.department_id ? Number(formData.department_id) : undefined,
      job_id: formData.job_id ? Number(formData.job_id) : undefined,
      work_email: formData.work_email || undefined,
      work_phone: formData.work_phone || undefined,
      mobile_phone: formData.mobile_phone || undefined,
      emergency_contact: formData.emergency_contact || undefined,
      emergency_phone: formData.emergency_phone || undefined,
    }, {
      onSuccess: (data) => {
        navigate(`/hr/employees/${data.id}`)
      }
    })
  }

  const tabs = [
    { id: 'identity', label: 'Identité', icon: User },
    { id: 'professional', label: 'Professionnel', icon: Briefcase },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'address', label: 'Adresse', icon: MapPin },
  ]

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'RH', href: '/hr' },
            { label: 'Employés', href: '/hr/employees' },
            { label: 'Nouveau' },
          ]}
        />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Nouvel employé
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Créer une nouvelle fiche employé
          </p>
        </div>

        {/* PageNotice */}
        <PageNotice config={hrNotices.employeeNew} className="mb-2" />

        {/* Error State */}
        {(isDepartmentsError || isJobsError) && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Erreur lors du chargement des données auxiliaires (départements, postes). Le formulaire reste accessible.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form Content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Identité */}
            {activeTab === 'identity' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Genre
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="">Non spécifié</option>
                    <option value="male">Homme</option>
                    <option value="female">Femme</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    name="birthday"
                    value={formData.birthday}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    N° CIN / Passeport
                  </label>
                  <input
                    type="text"
                    name="identification_id"
                    value={formData.identification_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Situation familiale
                  </label>
                  <select
                    name="marital"
                    value={formData.marital}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="">Non spécifié</option>
                    <option value="single">Célibataire</option>
                    <option value="married">Marié(e)</option>
                    <option value="cohabitant">Concubin(e)</option>
                    <option value="widower">Veuf/Veuve</option>
                    <option value="divorced">Divorcé(e)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Nombre d'enfants
                  </label>
                  <input
                    type="number"
                    name="children"
                    min="0"
                    value={formData.children}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Professionnel */}
            {activeTab === 'professional' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Email professionnel
                  </label>
                  <input
                    type="email"
                    name="work_email"
                    value={formData.work_email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Contact */}
            {activeTab === 'contact' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Téléphone professionnel
                  </label>
                  <input
                    type="tel"
                    name="work_phone"
                    value={formData.work_phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Mobile
                  </label>
                  <input
                    type="tel"
                    name="mobile_phone"
                    value={formData.mobile_phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4 mt-4">
                    Contact d'urgence
                  </h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Nom du contact
                  </label>
                  <input
                    type="text"
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Téléphone d'urgence
                  </label>
                  <input
                    type="tel"
                    name="emergency_phone"
                    value={formData.emergency_phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Adresse */}
            {activeTab === 'address' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    name="address_street"
                    value={formData.address_street}
                    onChange={handleChange}
                    placeholder="Rue, numéro, complément"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    name="address_city"
                    value={formData.address_city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Code postal
                  </label>
                  <input
                    type="text"
                    name="address_zip"
                    value={formData.address_zip}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/hr/employees')}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Save className="w-4 h-4" />}
              disabled={isPending || !formData.first_name || !formData.last_name}
            >
              {isPending ? 'Création...' : 'Créer l\'employé'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
