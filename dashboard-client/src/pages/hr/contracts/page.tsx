/**
 * Contrats - Gestion des contrats de travail
 *
 * Fonctionnalités :
 * - Liste des contrats avec recherche et filtres
 * - Alertes pour les contrats arrivant à échéance
 * - Filtrage par statut et type de contrat
 * - Création de nouveaux contrats
 * - Visualisation des détails de contrat
 */
import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common'
import { useMyTenant } from '@/hooks/useMyTenant'
import { useContracts, useExpiringContracts } from '@/hooks/hr'
import { hrNotices } from '@/lib/notices'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Plus,
  Search,
  AlertTriangle,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

export default function ContractsPage() {
  const navigate = useNavigate()
  const { tenant } = useMyTenant()
  const [now] = useState(() => Date.now())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [typeFilter, setTypeFilter] = useState<string | undefined>()

  const { data: contractsData, isLoading, isError } = useContracts({
    tenant_id: tenant?.id || 0,
    state: statusFilter,
    contract_type: typeFilter,
    search: search || undefined,
    limit: 100,
  })

  const { data: expiringData } = useExpiringContracts(tenant?.id || null, 30)

  const contracts = contractsData?.contracts || []
  const expiringContracts = expiringData?.contracts || []

  const getStateColor = (state: string) => {
    switch (state) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      case 'open':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'close':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'cancel':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      cdi: 'CDI',
      cdd: 'CDD',
      stage: 'Stage',
      interim: 'Intérim',
      apprenticeship: 'Apprentissage',
      freelance: 'Freelance',
    }
    return types[type] || type
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <SkeletonTable rows={10} columns={5} />
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
            { label: 'Contrats' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Contrats
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {contractsData?.total || 0} contrats au total
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/hr/contracts/new')}
          >
            Nouveau contrat
          </Button>
        </div>

        {/* PageNotice */}
        <PageNotice config={hrNotices.contracts} className="mb-2" />

        {/* Error State */}
        {isError && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement des contrats.
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

        {/* Alerte contrats expirants */}
        {expiringContracts.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800 dark:text-amber-300">
                  {expiringContracts.length} contrat{expiringContracts.length > 1 ? 's' : ''} arrive{expiringContracts.length > 1 ? 'nt' : ''} à échéance dans les 30 prochains jours
                </h3>
                <ul className="mt-2 space-y-1">
                  {expiringContracts.slice(0, 3).map(c => {
                    const daysLeft = c.date_end
                      ? Math.ceil((new Date(c.date_end).getTime() - now) / (1000 * 60 * 60 * 24))
                      : 0
                    return (
                      <li key={c.id} className="text-sm text-amber-700 dark:text-amber-400">
                        {c.employee_name} - {daysLeft} jours restants
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par employé, référence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500"
            />
          </div>

          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="open">En cours</option>
            <option value="close">Terminé</option>
            <option value="cancel">Annulé</option>
          </select>

          <select
            value={typeFilter || ''}
            onChange={(e) => setTypeFilter(e.target.value || undefined)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="">Tous les types</option>
            <option value="cdi">CDI</option>
            <option value="cdd">CDD</option>
            <option value="stage">Stage</option>
            <option value="interim">Intérim</option>
            <option value="apprenticeship">Apprentissage</option>
            <option value="freelance">Freelance</option>
          </select>
        </div>

        {/* Liste des contrats */}
        {contracts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 text-left text-sm text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 font-medium">Référence</th>
                  <th className="px-4 py-3 font-medium">Employé</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Poste</th>
                  <th className="px-4 py-3 font-medium">Période</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {contracts.map(contract => (
                  <tr
                    key={contract.id}
                    onClick={() => navigate(`/hr/contracts/${contract.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/30 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {contract.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 text-sm font-semibold">
                          {contract.employee_name?.charAt(0)}
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">
                          {contract.employee_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                        {getTypeLabel(contract.contract_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {contract.job_name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          {new Date(contract.date_start).toLocaleDateString('fr-FR')}
                          {contract.date_end && (
                            <> - {new Date(contract.date_end).toLocaleDateString('fr-FR')}</>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStateColor(contract.state)}`}>
                        {contract.state_label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty */}
        {contracts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun contrat trouvé
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {search || statusFilter || typeFilter
                ? 'Modifiez vos filtres pour voir plus de résultats'
                : 'Commencez par créer un contrat'}
            </p>
            {!search && !statusFilter && !typeFilter && (
              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => navigate('/hr/contracts/new')}
              >
                Créer un contrat
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
