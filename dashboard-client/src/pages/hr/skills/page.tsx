/**
 * Compétences - Référentiel de compétences de l'entreprise
 *
 * Fonctionnalités :
 * - Liste des compétences par type
 * - Création de types de compétences avec couleurs
 * - Création de compétences avec descriptions
 * - Filtrage par type de compétence
 * - Association aux postes et employés
 */
import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button } from '@/components/common'
import { useMyTenant } from '@/hooks/useMyTenant'
import { useSkillTypes, useSkills, useCreateSkillType, useCreateSkill, type SkillType, type Skill } from '@/hooks/hr'
import { hrNotices } from '@/lib/notices'
import {
  Layers,
  Plus,
  Palette,
  Tag,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

export default function SkillsPage() {
  const { tenant } = useMyTenant()
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [showSkillModal, setShowSkillModal] = useState(false)
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null)

  const { data: skillTypes, isLoading: isLoadingTypes, isError: isErrorTypes } = useSkillTypes(tenant?.id || null)
  const { data: skills, isLoading: isLoadingSkills, isError: isErrorSkills } = useSkills(tenant?.id || null, selectedTypeId || undefined)

  const { mutate: createType, isPending: isCreatingType } = useCreateSkillType()
  const { mutate: createSkill, isPending: isCreatingSkill } = useCreateSkill()

  const handleCreateType = (data: { name: string; color: string }) => {
    if (tenant?.id) {
      createType({ tenant_id: tenant.id, ...data })
      setShowTypeModal(false)
    }
  }

  const handleCreateSkill = (data: { name: string; skill_type_id: number; description?: string }) => {
    if (tenant?.id) {
      createSkill({ tenant_id: tenant.id, ...data })
      setShowSkillModal(false)
    }
  }

  const filteredSkills = selectedTypeId
    ? skills?.filter(s => s.skill_type_id === selectedTypeId)
    : skills

  const isLoading = isLoadingTypes || isLoadingSkills
  const isError = isErrorTypes || isErrorSkills

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-48" />
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-24" />
              ))}
            </div>
          </div>
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
            { label: 'Compétences' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Compétences
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Gérez le référentiel de compétences de l'entreprise
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={<Palette className="w-4 h-4" />}
              onClick={() => setShowTypeModal(true)}
            >
              Nouveau type
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowSkillModal(true)}
            >
              Nouvelle compétence
            </Button>
          </div>
        </div>

        {/* PageNotice */}
        <PageNotice config={hrNotices.skills} className="mb-2" />

        {/* Error State */}
        {isError && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement des compétences.
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Types de compétences (sidebar) */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Types de compétences
              </h3>

              <div className="space-y-1">
                <button
                  onClick={() => setSelectedTypeId(null)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedTypeId === null
                      ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>Toutes</span>
                  <span className="text-sm">{skills?.length || 0}</span>
                </button>

                {skillTypes?.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedTypeId(type.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedTypeId === type.id
                        ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                      <span>{type.name}</span>
                    </div>
                    <span className="text-sm">{type.skill_count}</span>
                  </button>
                ))}
              </div>

              {(!skillTypes || skillTypes.length === 0) && (
                <div className="text-center py-4">
                  <Layers className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Aucun type</p>
                  <button
                    onClick={() => setShowTypeModal(true)}
                    className="text-cyan-600 text-sm hover:underline mt-1"
                  >
                    Créer un type
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Liste des compétences */}
          <div className="lg:col-span-3">
            {filteredSkills && filteredSkills.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSkills.map(skill => (
                  <SkillCard key={skill.id} skill={skill} />
                ))}
              </div>
            )}

            {(!filteredSkills || filteredSkills.length === 0) && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
                <Tag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Aucune compétence
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {selectedTypeId
                    ? 'Aucune compétence dans cette catégorie'
                    : 'Créez vos premières compétences'}
                </p>
                <Button
                  variant="primary"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => setShowSkillModal(true)}
                >
                  Ajouter une compétence
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Modal type */}
        {showTypeModal && (
          <CreateTypeModal
            onClose={() => setShowTypeModal(false)}
            onCreate={handleCreateType}
            isLoading={isCreatingType}
          />
        )}

        {/* Modal compétence */}
        {showSkillModal && skillTypes && (
          <CreateSkillModal
            skillTypes={skillTypes}
            selectedTypeId={selectedTypeId}
            onClose={() => setShowSkillModal(false)}
            onCreate={handleCreateSkill}
            isLoading={isCreatingSkill}
          />
        )}
      </div>
    </Layout>
  )
}

function SkillCard({ skill }: { skill: Skill }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${skill.skill_type_color}20` }}
          >
            <Tag className="w-5 h-5" style={{ color: skill.skill_type_color }} />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">{skill.name}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">{skill.skill_type_name}</p>
          </div>
        </div>
      </div>
      {skill.description && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {skill.description}
        </p>
      )}
    </div>
  )
}

function CreateTypeModal({
  onClose,
  onCreate,
  isLoading,
}: {
  onClose: () => void
  onCreate: (data: { name: string; color: string }) => void
  isLoading: boolean
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')

  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#06b6d4',
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onCreate({ name: name.trim(), color })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Nouveau type de compétence
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
              Nom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Langues, Soft skills..."
              required
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-2">
              Couleur
            </label>
            <div className="flex gap-2 flex-wrap">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    color === c ? 'border-gray-900 dark:border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CreateSkillModal({
  skillTypes,
  selectedTypeId,
  onClose,
  onCreate,
  isLoading,
}: {
  skillTypes: SkillType[]
  selectedTypeId: number | null
  onClose: () => void
  onCreate: (data: { name: string; skill_type_id: number; description?: string }) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: '',
    skill_type_id: selectedTypeId || (skillTypes[0]?.id || 0),
    description: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name.trim() && formData.skill_type_id) {
      onCreate({
        name: formData.name.trim(),
        skill_type_id: formData.skill_type_id,
        description: formData.description.trim() || undefined,
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Nouvelle compétence
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
              Nom
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Python, Communication..."
              required
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={formData.skill_type_id}
              onChange={(e) => setFormData({ ...formData, skill_type_id: Number(e.target.value) })}
              required
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            >
              {skillTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
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
              rows={2}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
              placeholder="Description optionnelle..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isLoading || !formData.name.trim() || !formData.skill_type_id}
            >
              {isLoading ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
