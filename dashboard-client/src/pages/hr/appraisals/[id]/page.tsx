/**
 * Détail évaluation - Consultation et modification d'une évaluation
 *
 * Fonctionnalités :
 * - Vue d'ensemble avec période et scores
 * - Onglets : Vue d'ensemble, Commentaires, Objectifs, Développement
 * - Actions selon le statut (démarrer, finaliser)
 * - Gestion des objectifs
 */
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button } from '@/components/common'
import { useAppraisal, useUpdateAppraisal, useAppraisalAction, useCreateGoal, useGoalAction, type Goal, type Appraisal } from '@/hooks/hr'
import { hrNotices } from '@/lib/notices'
import {
  ClipboardCheck,
  Calendar,
  MapPin,
  Star,
  Target,
  Plus,
  CheckCircle2,
  XCircle,
  Play,
  Edit,
  Save,
  TrendingUp,
  Award,
  X,
} from 'lucide-react'

export default function AppraisalDetailPage() {
  const { id } = useParams()
  const appraisalId = id ? parseInt(id) : null

  const { data, isLoading } = useAppraisal(appraisalId)
  const { mutate: updateAppraisal, isPending: isUpdating } = useUpdateAppraisal()
  const { mutate: doAction } = useAppraisalAction()
  const { mutate: doGoalAction } = useGoalAction()

  const [activeTab, setActiveTab] = useState('overview')
  const [showGoalModal, setShowGoalModal] = useState(false)

  const _appraisal = data?.appraisal
  const goals = data?.goals || []

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </Layout>
    )
  }

  if (!appraisal) {
    return (
      <Layout>
        <div className="p-4 md:p-8 text-center">
          <ClipboardCheck className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Évaluation introuvable</p>
          <Link to="/hr/appraisals" className="text-cyan-600 hover:underline mt-2 inline-block">
            Retour aux évaluations
          </Link>
        </div>
      </Layout>
    )
  }

  const tabs = [
    { id: 'overview', label: "Vue d'ensemble", icon: ClipboardCheck },
    { id: 'feedback', label: 'Commentaires', icon: Edit },
    { id: 'goals', label: 'Objectifs', icon: Target },
    { id: 'development', label: 'Développement', icon: TrendingUp },
  ]

  const getStateColor = (state: string) => {
    switch (state) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'in_progress': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      case 'employee_done':
      case 'manager_done': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'done': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getNextAction = () => {
    switch (appraisal.state) {
      case 'draft': return { action: 'schedule', label: 'Planifier', icon: Calendar }
      case 'scheduled': return { action: 'start', label: 'Démarrer', icon: Play }
      case 'in_progress': return { action: 'employee_done', label: 'Auto-évaluation terminée', icon: CheckCircle2 }
      case 'employee_done': return { action: 'manager_done', label: 'Évaluation terminée', icon: CheckCircle2 }
      case 'manager_done': return { action: 'complete', label: 'Finaliser', icon: Award }
      default: return null
    }
  }

  const nextAction = getNextAction()

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'RH', href: '/hr' },
            { label: 'Évaluations', href: '/hr/appraisals' },
            { label: appraisal.name || 'Détail' },
          ]}
        />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {appraisal.name}
              </h1>
              <span className={`px-3 py-1 text-sm rounded-full ${getStateColor(appraisal.state)}`}>
                {appraisal.state_label}
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400">{appraisal.appraisal_type_label}</p>
          </div>
          <div className="flex gap-2">
            {nextAction && appraisal.state !== 'done' && appraisal.state !== 'cancelled' && (
              <Button
                variant="primary"
                icon={<nextAction.icon className="w-4 h-4" />}
                onClick={() => doAction({ id: appraisal.id, action: nextAction.action })}
              >
                {nextAction.label}
              </Button>
            )}
            {appraisal.state !== 'done' && appraisal.state !== 'cancelled' && (
              <button
                onClick={() => doAction({ id: appraisal.id, action: 'cancel' })}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                title="Annuler"
              >
                <XCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* PageNotice */}
        <PageNotice config={hrNotices.appraisalDetail} className="mb-2" />

        {/* Employee info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 text-xl font-bold">
              {appraisal.employee_name?.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{appraisal.employee_name}</h2>
              <p className="text-gray-500 dark:text-gray-400">{appraisal.job_name} • {appraisal.department_name}</p>
              {appraisal.manager_name && <p className="text-sm text-gray-500">Évaluateur : {appraisal.manager_name}</p>}
            </div>
            <div className="text-right">
              {appraisal.date_scheduled && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Calendar className="w-4 h-4" />
                  {new Date(appraisal.date_scheduled).toLocaleDateString('fr-FR', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              )}
              {appraisal.location && (
                <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                  <MapPin className="w-4 h-4" />{appraisal.location}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
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
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && <OverviewTab appraisal={appraisal} goals={goals} />}
        {activeTab === 'feedback' && <FeedbackTab appraisal={appraisal} onUpdate={(tabData) => updateAppraisal({ id: appraisal.id, data: tabData })} isUpdating={isUpdating} />}
        {activeTab === 'goals' && <GoalsTab appraisal={appraisal} goals={goals} onAction={doGoalAction} onAddGoal={() => setShowGoalModal(true)} />}
        {activeTab === 'development' && <DevelopmentTab appraisal={appraisal} onUpdate={(tabData) => updateAppraisal({ id: appraisal.id, data: tabData })} isUpdating={isUpdating} />}

        {/* Modal ajout objectif */}
        {showGoalModal && <AddGoalModal employeeId={appraisal.employee_id} appraisalId={appraisal.id} onClose={() => setShowGoalModal(false)} />}
      </div>
    </Layout>
  )
}

function OverviewTab({ _appraisal, goals }: { appraisal: Appraisal; goals: Goal[] }) {
  const goalsInProgress = goals.filter(g => g.state === 'in_progress').length
  const goalsDone = goals.filter(g => g.state === 'done').length

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Période évaluée</h3>
        <div className="space-y-3">
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Début</span><span className="text-gray-900 dark:text-white">{appraisal.period_start ? new Date(appraisal.period_start).toLocaleDateString('fr-FR') : 'Non défini'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Fin</span><span className="text-gray-900 dark:text-white">{appraisal.period_end ? new Date(appraisal.period_end).toLocaleDateString('fr-FR') : 'Non défini'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Durée entretien</span><span className="text-gray-900 dark:text-white">{appraisal.duration}h</span></div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Évaluations</h3>
        <div className="space-y-4">
          <ScoreRow label="Auto-évaluation" score={appraisal.employee_score} />
          <ScoreRow label="Évaluation manager" score={appraisal.manager_score} />
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <ScoreRow label="Note finale" score={appraisal.final_score} large />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Objectifs</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center"><span className="text-gray-500 dark:text-gray-400">Total</span><span className="text-xl font-bold text-gray-900 dark:text-white">{goals.length}</span></div>
          <div className="flex justify-between items-center"><span className="text-gray-500 dark:text-gray-400">En cours</span><span className="text-amber-600 dark:text-amber-400 font-medium">{goalsInProgress}</span></div>
          <div className="flex justify-between items-center"><span className="text-gray-500 dark:text-gray-400">Atteints</span><span className="text-emerald-600 dark:text-emerald-400 font-medium">{goalsDone}</span></div>
          {goals.length > 0 && (
            <div className="pt-2">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(goalsDone / goals.length) * 100}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">{Math.round((goalsDone / goals.length) * 100)}% atteints</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recommandations</h3>
        <div className="space-y-3">
          <RecommendationItem icon={TrendingUp} label="Promotion" recommended={appraisal.promotion_recommended as boolean} />
          <RecommendationItem icon={Award} label="Augmentation" recommended={appraisal.salary_increase_recommended as boolean} />
        </div>
      </div>
    </div>
  )
}

function ScoreRow({ label, score, large }: { label: string; score: string | null; large?: boolean }) {
  const value = score ? parseInt(score) : 0
  return (
    <div className="flex items-center justify-between">
      <span className={large ? 'font-medium text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}>{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} className={`${large ? 'w-5 h-5' : 'w-4 h-4'} ${i <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
        ))}
      </div>
    </div>
  )
}

function RecommendationItem({ icon: Icon, label, recommended }: { icon: React.ComponentType<{ className?: string }>; label: string; recommended: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${recommended ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
        <Icon className={`w-4 h-4 ${recommended ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
      </div>
      <span className="text-gray-700 dark:text-gray-300">{label} {recommended ? 'recommandée' : 'non recommandée'}</span>
    </div>
  )
}

function FeedbackTab({ _appraisal, onUpdate, isUpdating }: { appraisal: Appraisal; onUpdate: (data: Partial<Appraisal>) => void; isUpdating: boolean }) {
  const [formData, setFormData] = useState({
    employee_score: (appraisal.employee_score as string) || '',
    manager_score: (appraisal.manager_score as string) || '',
    final_score: (appraisal.final_score as string) || '',
    employee_feedback: (appraisal.employee_feedback as string) || '',
    manager_feedback: (appraisal.manager_feedback as string) || '',
    strengths: (appraisal.strengths as string) || '',
    improvements: (appraisal.improvements as string) || '',
  })

  const handleSave = () => onUpdate(formData)

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Notes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScoreSelect label="Auto-évaluation" value={formData.employee_score} onChange={(v) => setFormData({ ...formData, employee_score: v })} />
          <ScoreSelect label="Évaluation manager" value={formData.manager_score} onChange={(v) => setFormData({ ...formData, manager_score: v })} />
          <ScoreSelect label="Note finale" value={formData.final_score} onChange={(v) => setFormData({ ...formData, final_score: v })} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextareaCard label="Commentaires employé" value={formData.employee_feedback} onChange={(v) => setFormData({ ...formData, employee_feedback: v })} placeholder="Auto-évaluation de l'employé..." />
        <TextareaCard label="Commentaires manager" value={formData.manager_feedback} onChange={(v) => setFormData({ ...formData, manager_feedback: v })} placeholder="Évaluation du manager..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextareaCard label="Points forts" value={formData.strengths} onChange={(v) => setFormData({ ...formData, strengths: v })} placeholder="Points forts identifiés..." rows={4} />
        <TextareaCard label="Axes d'amélioration" value={formData.improvements} onChange={(v) => setFormData({ ...formData, improvements: v })} placeholder="Points à améliorer..." rows={4} />
      </div>

      <div className="flex justify-end">
        <Button variant="primary" icon={<Save className="w-4 h-4" />} onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  )
}

function ScoreSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white">
        <option value="">-</option>
        <option value="1">1 - Insuffisant</option>
        <option value="2">2 - À améliorer</option>
        <option value="3">3 - Conforme</option>
        <option value="4">4 - Bon</option>
        <option value="5">5 - Excellent</option>
      </select>
    </div>
  )
}

function TextareaCard({ label, value, onChange, placeholder, rows = 5 }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; rows?: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white" placeholder={placeholder} />
    </div>
  )
}

function GoalsTab({ _appraisal, goals, onAction, onAddGoal }: { appraisal: Appraisal; goals: Goal[]; onAction: (params: { id: number; action: string }) => void; onAddGoal: () => void }) {
  const getStateColor = (state: string) => {
    switch (state) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      case 'in_progress': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      case 'done': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 dark:text-white">Objectifs ({goals.length})</h3>
        <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={onAddGoal}>Ajouter</Button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Target className="w-10 h-10 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500 dark:text-gray-400">Aucun objectif défini</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map(goal => (
            <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{goal.name}</h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStateColor(goal.state)}`}>{goal.state_label}</span>
                    {goal.is_overdue && <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">En retard</span>}
                  </div>
                  {goal.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{goal.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>Échéance : {goal.deadline ? new Date(goal.deadline).toLocaleDateString('fr-FR') : '-'}</span>
                    <span>Type : {goal.goal_type_label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {goal.state === 'draft' && (
                    <button onClick={() => onAction({ id: goal.id, action: 'start' })} className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded" title="Démarrer"><Play className="w-4 h-4" /></button>
                  )}
                  {goal.state === 'in_progress' && (
                    <button onClick={() => onAction({ id: goal.id, action: 'complete' })} className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded" title="Marquer atteint"><CheckCircle2 className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Progression</span><span>{goal.progress}%</span></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${goal.state === 'done' ? 'bg-emerald-500' : 'bg-cyan-500'}`} style={{ width: `${goal.progress}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DevelopmentTab({ _appraisal, onUpdate, isUpdating }: { appraisal: Appraisal; onUpdate: (data: Partial<Appraisal>) => void; isUpdating: boolean }) {
  const [formData, setFormData] = useState({
    training_needs: (appraisal.training_needs as string) || '',
    training_plan: (appraisal.training_plan as string) || '',
    career_goals: (appraisal.career_goals as string) || '',
    promotion_recommended: (appraisal.promotion_recommended as boolean) || false,
    salary_increase_recommended: (appraisal.salary_increase_recommended as boolean) || false,
  })

  const handleSave = () => onUpdate(formData)

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recommandations</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={formData.promotion_recommended} onChange={(e) => setFormData({ ...formData, promotion_recommended: e.target.checked })} className="w-5 h-5 rounded text-cyan-600" />
            <span className="text-gray-700 dark:text-gray-300">Promotion recommandée</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={formData.salary_increase_recommended} onChange={(e) => setFormData({ ...formData, salary_increase_recommended: e.target.checked })} className="w-5 h-5 rounded text-cyan-600" />
            <span className="text-gray-700 dark:text-gray-300">Augmentation salariale recommandée</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TextareaCard label="Besoins en formation" value={formData.training_needs} onChange={(v) => setFormData({ ...formData, training_needs: v })} placeholder="Compétences à développer, formations souhaitées..." rows={4} />
        <TextareaCard label="Plan de formation proposé" value={formData.training_plan} onChange={(v) => setFormData({ ...formData, training_plan: v })} placeholder="Formations planifiées, certifications..." rows={4} />
      </div>

      <TextareaCard label="Objectifs de carrière" value={formData.career_goals} onChange={(v) => setFormData({ ...formData, career_goals: v })} placeholder="Évolution souhaitée, postes visés, ambitions..." rows={4} />

      <div className="flex justify-end">
        <Button variant="primary" icon={<Save className="w-4 h-4" />} onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  )
}

function AddGoalModal({ employeeId, appraisalId, onClose }: { employeeId: number; appraisalId: number; onClose: () => void }) {
  const { mutate: createGoal, isPending } = useCreateGoal()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    deadline: '',
    goal_type: 'performance',
    priority: '0',
    target_value: '',
    unit: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createGoal({
      employee_id: employeeId,
      name: formData.name,
      deadline: formData.deadline,
      description: formData.description || undefined,
      goal_type: formData.goal_type,
      priority: formData.priority,
      target_value: formData.target_value ? parseFloat(formData.target_value) : undefined,
      unit: formData.unit || undefined,
      appraisal_id: appraisalId,
    }, { onSuccess: () => onClose() })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nouvel objectif</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Échéance *</label>
              <input type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} required className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select value={formData.goal_type} onChange={(e) => setFormData({ ...formData, goal_type: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white">
                <option value="performance">Performance</option>
                <option value="development">Développement</option>
                <option value="project">Projet</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={isPending}>{isPending ? 'Création...' : 'Créer'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
