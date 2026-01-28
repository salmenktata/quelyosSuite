/**
 * Fiche employé - Détail et modification d'un employé
 *
 * Fonctionnalités :
 * - Informations complètes (professionnel, contact, personnel)
 * - Onglets : Informations, Contrats, Présences, Congés
 * - Mode édition inline
 * - Solde congés et contact d'urgence
 */
import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button } from '@/components/common'
import { useMyTenant } from '@/hooks/useMyTenant'
import {
  useEmployee,
  useUpdateEmployee,
  useEmployeeLeaves,
  useEmployeeAttendance,
  useContracts,
  useDepartments,
  useJobs,
} from '@/hooks/hr'
import { hrNotices } from '@/lib/notices'
import { colorIndexToHex } from '@/lib/colorPalette'
import {
  Edit,
  Save,
  X,
  User,
  Briefcase,
  FileText,
  Clock,
  Calendar,
  Mail,
  Phone,
  Building2,
  UserCheck,
  UserX,
  AlertTriangle,
} from 'lucide-react'

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { tenant } = useMyTenant()
  const employeeId = Number(id)

  const [activeTab, setActiveTab] = useState('info')
  const [isEditing, setIsEditing] = useState(false)

  const { data: employee, isLoading } = useEmployee(employeeId)
  const { data: leavesData } = useEmployeeLeaves(employeeId)
  const { data: attendanceData } = useEmployeeAttendance(employeeId)
  const { data: contractsData } = useContracts({
    tenant_id: tenant?.id || 0,
    employee_id: employeeId,
  })
  const { data: departmentsData } = useDepartments(tenant?.id || null)
  const { data: jobsData } = useJobs(tenant?.id || null)
  const { mutate: updateEmployee, isPending: isUpdating } = useUpdateEmployee()

  const leaves = leavesData?.leaves || []
  const attendances = attendanceData?.attendances || []
  const contracts = contractsData?.contracts || []
  const departments = departmentsData?.departments || []
  const jobs = jobsData?.jobs || []

  const [editForm, setEditForm] = useState<Record<string, string | number> | null>(null)

  const startEditing = () => {
    setEditForm({
      first_name: employee?.first_name || '',
      last_name: employee?.last_name || '',
      work_email: employee?.work_email || '',
      work_phone: employee?.work_phone || '',
      mobile_phone: employee?.mobile_phone || '',
      department_id: employee?.department_id || '',
      job_id: employee?.job_id || '',
      gender: employee?.gender || '',
      birthday: employee?.birthday || '',
      marital: employee?.marital || '',
      children: employee?.children || 0,
      emergency_contact: employee?.emergency_contact || '',
      emergency_phone: employee?.emergency_phone || '',
    })
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setEditForm(null)
    setIsEditing(false)
  }

  const saveChanges = () => {
    if (!employee?.id || !editForm) return
    updateEmployee({
      id: employee.id,
      data: {
        ...editForm,
        department_id: editForm.department_id ? Number(editForm.department_id) : undefined,
        job_id: editForm.job_id ? Number(editForm.job_id) : undefined,
      }
    }, {
      onSuccess: () => {
        setIsEditing(false)
        setEditForm(null)
      }
    })
  }

  const tabs = [
    { id: 'info', label: 'Informations', icon: User },
    { id: 'contracts', label: 'Contrats', icon: FileText, count: contracts.length },
    { id: 'attendance', label: 'Présences', icon: Clock, count: attendances.length },
    { id: 'leaves', label: 'Congés', icon: Calendar, count: leaves.length },
  ]

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
        </div>
      </Layout>
    )
  }

  if (!employee) {
    return (
      <Layout>
        <div className="p-4 md:p-8 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Employé non trouvé
          </h2>
          <Link to="/hr/employees" className="text-cyan-600 hover:underline">
            Retour à la liste
          </Link>
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
            { label: 'Employés', href: '/hr/employees' },
            { label: employee.name || 'Détail' },
          ]}
        />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 text-2xl font-semibold">
              {employee.first_name?.[0]}{employee.last_name?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {employee.name}
              </h1>
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                <span>{employee.employee_number}</span>
                {employee.job_title && (
                  <>
                    <span>•</span>
                    <span>{employee.job_title}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AttendanceStatus state={employee.attendance_state} />
            <EmployeeStatus status={employee.state} />
            {!isEditing && (
              <Button
                variant="primary"
                icon={<Edit className="w-4 h-4" />}
                onClick={startEditing}
              >
                Modifier
              </Button>
            )}
          </div>
        </div>

        {/* PageNotice */}
        <PageNotice config={hrNotices.employeeDetail} className="mb-2" />

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <InfoCard title="Informations professionnelles">
                {isEditing && editForm ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Département</label>
                      <select
                        value={editForm.department_id}
                        onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                      >
                        <option value="">Aucun</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Poste</label>
                      <select
                        value={editForm.job_id}
                        onChange={(e) => setEditForm({ ...editForm, job_id: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                      >
                        <option value="">Aucun</option>
                        {jobs.map(j => (
                          <option key={j.id} value={j.id}>{j.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow icon={Building2} label="Département" value={employee.department_name} />
                    <InfoRow icon={Briefcase} label="Poste" value={employee.job_title} />
                    <InfoRow icon={User} label="Manager" value={employee.parent_name} />
                    <InfoRow icon={Calendar} label="Ancienneté" value={employee.seniority ? `${employee.seniority} ans` : '-'} />
                  </div>
                )}
              </InfoCard>

              <InfoCard title="Contact">
                {isEditing && editForm ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Email pro</label>
                      <input
                        type="email"
                        value={editForm.work_email}
                        onChange={(e) => setEditForm({ ...editForm, work_email: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Tél pro</label>
                      <input
                        type="tel"
                        value={editForm.work_phone}
                        onChange={(e) => setEditForm({ ...editForm, work_phone: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Mobile</label>
                      <input
                        type="tel"
                        value={editForm.mobile_phone}
                        onChange={(e) => setEditForm({ ...editForm, mobile_phone: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow icon={Mail} label="Email pro" value={employee.work_email} link={`mailto:${employee.work_email}`} />
                    <InfoRow icon={Phone} label="Tél pro" value={employee.work_phone} link={`tel:${employee.work_phone}`} />
                    <InfoRow icon={Phone} label="Mobile" value={employee.mobile_phone} link={`tel:${employee.mobile_phone}`} />
                  </div>
                )}
              </InfoCard>

              <InfoCard title="Informations personnelles">
                {isEditing && editForm ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Prénom</label>
                      <input
                        type="text"
                        value={editForm.first_name}
                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Nom</label>
                      <input
                        type="text"
                        value={editForm.last_name}
                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Genre</label>
                      <select
                        value={editForm.gender}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                      >
                        <option value="">Non spécifié</option>
                        <option value="male">Homme</option>
                        <option value="female">Femme</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Date de naissance</label>
                      <input
                        type="date"
                        value={editForm.birthday as string}
                        onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow label="Genre" value={getGenderLabel(employee.gender)} />
                    <InfoRow label="Date de naissance" value={employee.birthday ? new Date(employee.birthday).toLocaleDateString('fr-FR') : '-'} />
                    <InfoRow label="Situation" value={getMaritalLabel(employee.marital)} />
                    <InfoRow label="Enfants" value={employee.children?.toString() || '0'} />
                  </div>
                )}
              </InfoCard>

              {isEditing && (
                <div className="flex justify-end gap-3">
                  <Button variant="secondary" icon={<X className="w-4 h-4" />} onClick={cancelEditing}>
                    Annuler
                  </Button>
                  <Button variant="primary" icon={<Save className="w-4 h-4" />} onClick={saveChanges} disabled={isUpdating}>
                    {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <InfoCard title="Solde congés">
                <div className="text-center">
                  <p className="text-4xl font-bold text-cyan-600 dark:text-cyan-400">
                    {employee.remaining_leaves?.toFixed(1) || '0'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">jours restants</p>
                </div>
              </InfoCard>

              <InfoCard title="Contact d'urgence">
                {isEditing && editForm ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Nom</label>
                      <input
                        type="text"
                        value={editForm.emergency_contact}
                        onChange={(e) => setEditForm({ ...editForm, emergency_contact: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Téléphone</label>
                      <input
                        type="tel"
                        value={editForm.emergency_phone}
                        onChange={(e) => setEditForm({ ...editForm, emergency_phone: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {employee.emergency_contact || '-'}
                    </p>
                    {employee.emergency_phone && (
                      <a href={`tel:${employee.emergency_phone}`} className="text-cyan-600 hover:underline">
                        {employee.emergency_phone}
                      </a>
                    )}
                  </div>
                )}
              </InfoCard>
            </div>
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            {contracts.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 text-left text-sm text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-3 font-medium">Référence</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Début</th>
                    <th className="px-4 py-3 font-medium">Fin</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {contracts.map(contract => (
                    <tr key={contract.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{contract.name}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{contract.contract_type_label}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{new Date(contract.date_start).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{contract.date_end ? new Date(contract.date_end).toLocaleDateString('fr-FR') : '-'}</td>
                      <td className="px-4 py-3"><ContractStatus state={contract.state} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Aucun contrat</p>
                <Link to="/hr/contracts/new" className="inline-block mt-4 text-cyan-600 hover:underline">
                  Créer un contrat
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            {attendances.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 text-left text-sm text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Entrée</th>
                    <th className="px-4 py-3 font-medium">Sortie</th>
                    <th className="px-4 py-3 font-medium">Durée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {attendances.map(att => (
                    <tr key={att.id}>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{new Date(att.check_in).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{new Date(att.check_in).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{att.check_out ? new Date(att.check_out).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{att.worked_hours ? `${att.worked_hours.toFixed(1)}h` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center">
                <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Aucun pointage enregistré</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'leaves' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            {leaves.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 text-left text-sm text-gray-500 dark:text-gray-400">
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Période</th>
                    <th className="px-4 py-3 font-medium">Durée</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {leaves.map(leave => {
                    const colorHex = colorIndexToHex((leave as { leave_type_color?: number | string }).leave_type_color)
                    return (
                      <tr key={leave.id}>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs rounded-full" style={{ backgroundColor: `${colorHex}20`, color: colorHex }}>
                            {leave.leave_type_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{new Date(leave.date_from).toLocaleDateString('fr-FR')} - {new Date(leave.date_to).toLocaleDateString('fr-FR')}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{leave.number_of_days} jour{leave.number_of_days > 1 ? 's' : ''}</td>
                        <td className="px-4 py-3"><LeaveStatus state={leave.state} label={(leave as { state_label?: string }).state_label || leave.state} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center">
                <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Aucune demande de congé</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, link }: { icon?: React.ComponentType<{ className?: string }>; label: string; value?: string | null; link?: string }) {
  const content = (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="w-4 h-4 text-gray-400 mt-0.5" />}
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-medium text-gray-900 dark:text-white">{value || '-'}</p>
      </div>
    </div>
  )
  if (link && value) return <a href={link} className="hover:text-cyan-600">{content}</a>
  return content
}

function AttendanceStatus({ state }: { state: string }) {
  if (state === 'checked_in') {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
        <UserCheck className="w-4 h-4" />Présent
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full">
      <UserX className="w-4 h-4" />Absent
    </span>
  )
}

function EmployeeStatus({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    suspended: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    departed: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  }
  const labels: Record<string, string> = { active: 'Actif', suspended: 'Suspendu', departed: 'Parti' }
  return <span className={`px-3 py-1 text-sm rounded-full ${styles[status] || styles.active}`}>{labels[status] || status}</span>
}

function ContractStatus({ state }: { state: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    open: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    close: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    cancel: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  }
  const labels: Record<string, string> = { draft: 'Brouillon', open: 'En cours', close: 'Terminé', cancel: 'Annulé' }
  return <span className={`px-2 py-1 text-xs rounded-full ${styles[state] || styles.draft}`}>{labels[state] || state}</span>
}

function LeaveStatus({ state, label }: { state: string; label: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    confirm: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    validate1: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    validate: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    refuse: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    cancel: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  }
  return <span className={`px-2 py-1 text-xs rounded-full ${styles[state] || styles.draft}`}>{label}</span>
}

function getGenderLabel(gender?: string): string {
  const labels: Record<string, string> = { male: 'Homme', female: 'Femme', other: 'Autre' }
  return gender ? labels[gender] || gender : '-'
}

function getMaritalLabel(marital?: string): string {
  const labels: Record<string, string> = { single: 'Célibataire', married: 'Marié(e)', cohabitant: 'Concubin(e)', widower: 'Veuf/Veuve', divorced: 'Divorcé(e)' }
  return marital ? labels[marital] || marital : '-'
}
