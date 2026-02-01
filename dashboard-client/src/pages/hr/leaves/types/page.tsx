/**
 * Types de congés - Configuration des types de congés
 *
 * Fonctionnalités :
 * - Liste des types avec couleur et paramètres
 * - Création et modification de types
 * - Règles de validation par type
 * - État actif/inactif
 */
import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button } from '@/components/common'
import { useMyTenant } from '@/hooks/useMyTenant'
import { useLeaveTypes, type LeaveType } from '@/hooks/hr'
import { hrNotices } from '@/lib/notices'
import { colorIndexToHex } from '@/lib/colorPalette'
import { Tag, Plus, Edit } from 'lucide-react'

export default function LeaveTypesPage() {
  const { tenant } = useMyTenant()
  const [_showModal, setShowModal] = useState(false)
  const [_editingType, setEditingType] = useState<LeaveType | null>(null)

  const { data: leaveTypes, isLoading } = useLeaveTypes(tenant?.id || null)

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'RH', href: '/hr' },
            { label: 'Congés', href: '/hr/leaves' },
            { label: 'Types' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Types de congés
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Configurez les différents types de congés disponibles
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingType(null)
              setShowModal(true)
            }}
          >
            Nouveau type
          </Button>
        </div>

        {/* PageNotice */}
        <PageNotice config={hrNotices.leavesTypes} className="mb-2" />

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-40" />
            ))}
          </div>
        )}

        {/* Liste des types */}
        {!isLoading && leaveTypes && leaveTypes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaveTypes.map(type => (
              <LeaveTypeCard
                key={type.id}
                leaveType={type}
                onEdit={() => {
                  setEditingType(type)
                  setShowModal(true)
                }}
              />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && (!leaveTypes || leaveTypes.length === 0) && (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun type de congé
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Créez vos premiers types de congés
            </p>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowModal(true)}
            >
              Créer un type
            </Button>
          </div>
        )}
      </div>
    </Layout>
  )
}

function LeaveTypeCard({ leaveType, onEdit }: { leaveType: LeaveType; onEdit: () => void }) {
  const getValidationLabel = (type: string) => {
    switch (type) {
      case 'no_validation': return 'Sans validation'
      case 'manager': return 'Manager'
      case 'hr': return 'RH'
      case 'both': return 'Manager + RH'
      default: return type
    }
  }

  const getRequestUnitLabel = (unit: string) => {
    switch (unit) {
      case 'day': return 'Jours'
      case 'half_day': return 'Demi-journées'
      case 'hour': return 'Heures'
      default: return unit
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: colorIndexToHex(leaveType.color) }}
          />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {leaveType.name}
            </h3>
            {leaveType.code && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {leaveType.code}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onEdit}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Validation</span>
          <span className="text-gray-900 dark:text-white">
            {getValidationLabel(leaveType.validation_type)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Unité</span>
          <span className="text-gray-900 dark:text-white">
            {getRequestUnitLabel(leaveType.request_unit)}
          </span>
        </div>
        {leaveType.max_days > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Max/an</span>
            <span className="text-gray-900 dark:text-white">
              {leaveType.max_days} jours
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-2">
        {leaveType.requires_allocation && (
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
            Allocation requise
          </span>
        )}
        {leaveType.unpaid && (
          <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
            Non rémunéré
          </span>
        )}
        {!leaveType.active && (
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full">
            Inactif
          </span>
        )}
      </div>
    </div>
  )
}
