/**
 * Départements - Gestion de la structure organisationnelle
 *
 * Fonctionnalités :
 * - Liste des départements en vue liste ou organigramme
 * - Création et modification de départements
 * - Affectation des responsables
 * - Visualisation hiérarchique
 * - Comptage des employés par département
 */
import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button } from '@/components/common'
import { useMyTenant } from '@/hooks/useMyTenant'
import { useDepartments, useDepartmentsTree, type Department } from '@/hooks/hr'
import { hrNotices } from '@/lib/notices'
import { Plus, Building2, Users, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react'

export default function DepartmentsPage() {
  const { tenant } = useMyTenant()
  const [_showModal, setShowModal] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list')

  const { data: departmentsData, isLoading, isError } = useDepartments(tenant?.id || null)
  const { data: treeData } = useDepartmentsTree(tenant?.id || null)

  const departments = departmentsData?.departments || []

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-32" />
            ))}
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
            { label: 'Départements' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Départements
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {departmentsData?.total || 0} départements
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowModal(true)}
          >
            Nouveau département
          </Button>
        </div>

        {/* PageNotice */}
        <PageNotice config={hrNotices.departments} className="mb-2" />

        {/* Error State */}
        {isError && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement des départements.
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

        {/* View toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'list' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
          >
            Liste
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'tree' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
          >
            Organigramme
          </button>
        </div>

        {/* List View */}
        {viewMode === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map(dept => (
              <DepartmentCard key={dept.id} department={dept} />
            ))}
          </div>
        )}

        {/* Tree View */}
        {viewMode === 'tree' && treeData && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            {treeData.map(dept => (
              <DepartmentTreeNode key={dept.id} node={dept} level={0} />
            ))}
          </div>
        )}

        {/* Empty */}
        {departments.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun département
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Créez votre premier département</p>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowModal(true)}
            >
              Créer un département
            </Button>
          </div>
        )}
      </div>
    </Layout>
  )
}

function DepartmentCard({ department }: { department: Department }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {department.name}
          </h3>
          {department.code && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{department.code}</p>
          )}
        </div>
        <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
          <Building2 className="w-5 h-5 text-cyan-600" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Users className="w-4 h-4" />
          <span>{department.total_employee} employés</span>
        </div>
        {department.manager_name && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {department.manager_name}
          </span>
        )}
      </div>
    </div>
  )
}

interface DepartmentNode {
  id: number
  name: string
  total_employee: number
  manager?: { id: number; name: string; job: string | null; image: string | null } | null
  children?: DepartmentNode[]
}

function DepartmentTreeNode({ node, level }: { node: DepartmentNode; level: number }) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div style={{ marginLeft: level * 24 }}>
      <div
        className="flex items-center gap-2 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2"
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren && (
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        )}
        {!hasChildren && <span className="w-4" />}
        <Building2 className="w-4 h-4 text-cyan-500" />
        <span className="font-medium text-gray-900 dark:text-white">{node.name}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({node.total_employee})</span>
        {node.manager && (
          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
            {node.manager.name}
          </span>
        )}
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children?.map((child: DepartmentNode) => (
            <DepartmentTreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
