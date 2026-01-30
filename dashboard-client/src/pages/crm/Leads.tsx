/**
 * Page Liste des Opportunités CRM
 *
 * Fonctionnalités :
 * - Liste paginée de toutes les opportunités commerciales
 * - Statistiques agrégées (total, revenu attendu, probabilité moyenne)
 * - Recherche et filtres
 * - Tri interactif par colonne
 * - Pagination offset-based (20 items/page)
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Kanban, Plus } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, SkeletonTable, PageNotice, Button } from '@/components/common'
import { crmNotices } from '@/lib/notices'
import { LeadStats } from '@/components/leads/LeadStats'
import { LeadFilters } from '@/components/leads/LeadFilters'
import { LeadTable } from '@/components/leads/LeadTable'
import { LeadEmpty } from '@/components/leads/LeadEmpty'
import { useLeads } from '@/hooks/useLeads'

export default function Leads() {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = 20

  const { data, isLoading, error, refetch } = useLeads({
    limit,
    offset,
    search: debouncedSearch,
  })

  const handleSearch = () => {
    setDebouncedSearch(searchTerm)
    setOffset(0)
  }

  const handleReset = () => {
    setSearchTerm('')
    setDebouncedSearch('')
    setOffset(0)
  }

  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalPages = data?.pagination ? Math.ceil(data.pagination.total / limit) : 0
  const currentPage = Math.floor(offset / limit) + 1

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'CRM', href: '/crm' },
            { label: 'Opportunités' },
          ]}
        />

        <PageNotice config={crmNotices.leads} className="mb-6" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Opportunités
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Liste de toutes les opportunités commerciales
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/crm/pipeline">
              <Button variant="secondary" icon={<Kanban className="w-5 h-5" />}>
                Vue Pipeline
              </Button>
            </Link>
            <Link to="/crm/leads/new">
              <Button variant="primary" icon={<Plus className="w-5 h-5" />}>
                Nouvelle Opportunité
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        {!isLoading && data?.leads && data.leads.length > 0 && (
          <LeadStats leads={data.leads} />
        )}

        {/* Filters */}
        <LeadFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          onReset={handleReset}
        />

        {/* Content */}
        {isLoading ? (
          <SkeletonTable rows={20} columns={6} />
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6" role="alert">
            <p className="text-red-800 dark:text-red-200 mb-4">
              Erreur lors du chargement des opportunités
            </p>
            <Button variant="secondary" onClick={() => refetch && refetch()}>
              Réessayer
            </Button>
          </div>
        ) : data?.leads && data.leads.length > 0 ? (
          <>
            <LeadTable leads={data.leads} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} sur {totalPages} ({data.pagination.total} opportunités)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(offset - limit)}
                    disabled={offset === 0}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => handlePageChange(offset + limit)}
                    disabled={offset + limit >= data.pagination.total}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <LeadEmpty />
        )}
      </div>
    </Layout>
  )
}
