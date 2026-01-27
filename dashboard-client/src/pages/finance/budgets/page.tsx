/**
 * Page Gestion des Budgets
 *
 * Fonctionnalités :
 * - Création et suivi de budgets par période
 * - Filtrage multi-critères (statut, période, catégorie, plage de dates)
 * - Tri interactif par nom, catégorie, montant, utilisation
 * - Statistiques globales (budgets actifs, taux d'utilisation, alertes)
 * - Duplication et édition de budgets
 * - Export Excel/CSV des données
 * - Analytics et rapports visuels
 * - Vue desktop (tableau) et mobile (cartes)
 * - Raccourcis clavier (Escape pour fermer)
 */

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, SkeletonTable, PageNotice, Button } from '@/components/common'
import { financeNotices } from '@/lib/notices'
import { api } from '@/lib/finance/api'
import { useRequireAuth } from '@/lib/finance/compat/auth'
import { useCurrency } from '@/lib/finance/CurrencyContext'
import { useApiData } from '@/hooks/finance/useApiData'
import { BudgetStatsCards } from '@/components/finance/budgets/BudgetStatsCards'
import { BudgetFilters, type BudgetFilterState } from '@/components/finance/budgets/BudgetFilters'
import { BudgetTable } from '@/components/finance/budgets/BudgetTable'
import { BudgetCard } from '@/components/finance/budgets/BudgetCard'
import { BudgetAnalytics } from '@/components/finance/budgets/BudgetAnalytics'
import { BudgetExport } from '@/components/finance/budgets/BudgetExport'
import { BudgetFormModal } from '@/components/finance/budgets/BudgetFormModal'
import {
  Plus,
  Sparkles,
  DollarSign,
} from 'lucide-react'
import type { CreateBudgetRequest, UpdateBudgetRequest } from '@/types/api'

type Budget = {
  id: number
  name: string
  amount: number
  createdAt: string
  currentSpending?: number
  percentageUsed?: number
  status?: 'ON_TRACK' | 'WARNING' | 'EXCEEDED'
  category?: { id: number; name: string } | null
  period?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM'
  startDate?: string
  endDate?: string | null
}

type Category = {
  id: number
  name: string
  kind: 'INCOME' | 'EXPENSE'
}

type SortColumn = 'name' | 'category' | 'period' | 'amount' | 'percentageUsed' | 'status'
type SortDirection = 'asc' | 'desc'

export default function BudgetsPage() {
  useRequireAuth()
  const { formatAmount } = useCurrency()

  const {
    data: budgets,
    loading: budgetsLoading,
    error: budgetsError,
    refetch: refetchBudgets
  } = useApiData<Budget[]>({
    fetcher: () => api<Budget[]>('/budgets?includeSpending=true'),
    cacheKey: 'budgets',
    cacheTime: 2 * 60 * 1000,
  })

  const {
    data: categories,
    loading: categoriesLoading
  } = useApiData<Category[]>({
    fetcher: () => api<Category[]>('/finance/categories'),
    cacheKey: 'categories',
    cacheTime: 10 * 60 * 1000,
  })

  const loading = budgetsLoading || categoriesLoading
  const error = budgetsError?.message || null

  const [filters, setFilters] = useState<BudgetFilterState>({
    search: '',
    status: 'ALL',
    period: 'ALL',
    categoryIds: [],
    dateFrom: '',
    dateTo: ''
  })

  const [sortBy, setSortBy] = useState<SortColumn>('name')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCreateForm) {
          setShowCreateForm(false)
        } else if (editingBudget) {
          setEditingBudget(null)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCreateForm, editingBudget])

  const handleCreateBudget = useCallback(async (formData: {
    name: string
    amount: string
    categoryId: number | null
    period: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM'
    startDate: string
    endDate: string
  }) => {
    try {
      const payload = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        categoryId: formData.categoryId || null,
        period: formData.period,
        startDate: formData.startDate,
        endDate: formData.period === 'CUSTOM' && formData.endDate ? formData.endDate : null
      }

      await api('/budgets', {
        method: 'POST',
        body: payload as CreateBudgetRequest
      })

      await refetchBudgets()
      setShowCreateForm(false)
    } catch (err) {
      throw err
    }
  }, [refetchBudgets])

  const filteredBudgets = useMemo(() => {
    if (!budgets) return []
    let result = [...budgets]

    if (filters.search) {
      const query = filters.search.toLowerCase()
      result = result.filter(b =>
        b.name.toLowerCase().includes(query) ||
        b.category?.name?.toLowerCase().includes(query)
      )
    }

    if (filters.status !== 'ALL') {
      result = result.filter(b => b.status === filters.status)
    }

    if (filters.period !== 'ALL') {
      result = result.filter(b => b.period === filters.period)
    }

    if (filters.categoryIds.length > 0) {
      result = result.filter(b =>
        b.category && filters.categoryIds.includes(b.category.id)
      )
    }

    if (filters.dateFrom || filters.dateTo) {
      result = result.filter(b => {
        if (!b.startDate) return true

        const budgetStart = new Date(b.startDate)
        const budgetEnd = b.endDate ? new Date(b.endDate) : new Date('2100-01-01')
        const rangeStart = filters.dateFrom ? new Date(filters.dateFrom) : new Date(0)
        const rangeEnd = filters.dateTo ? new Date(filters.dateTo) : new Date('2100-01-01')

        return budgetStart <= rangeEnd && budgetEnd >= rangeStart
      })
    }

    return result
  }, [budgets, filters])

  const sortedBudgets = useMemo(() => {
    const result = [...filteredBudgets]

    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'category':
        result.sort((a, b) => {
          const catA = a.category?.name || ''
          const catB = b.category?.name || ''
          return catA.localeCompare(catB)
        })
        break
      case 'period':
        result.sort((a, b) => {
          const periodA = a.period || ''
          const periodB = b.period || ''
          return periodA.localeCompare(periodB)
        })
        break
      case 'amount':
        result.sort((a, b) => a.amount - b.amount)
        break
      case 'percentageUsed':
        result.sort((a, b) => (a.percentageUsed || 0) - (b.percentageUsed || 0))
        break
      case 'status':
        const statusOrder = { ON_TRACK: 1, WARNING: 2, EXCEEDED: 3 }
        result.sort((a, b) => {
          const orderA = a.status ? statusOrder[a.status] : 999
          const orderB = b.status ? statusOrder[b.status] : 999
          return orderA - orderB
        })
        break
    }

    return sortDir === 'desc' ? result.reverse() : result
  }, [filteredBudgets, sortBy, sortDir])

  const handleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDir('asc')
    }
  }

  const handleEdit = useCallback((budget: Budget) => {
    setShowCreateForm(false)
    setEditingBudget(budget)
  }, [])

  const handleDuplicate = useCallback(async (budget: Budget) => {
    try {
      await api('/budgets', {
        method: 'POST',
        body: {
          name: `${budget.name} (copie)`,
          amount: budget.amount,
          categoryId: budget.category?.id || null,
          period: budget.period || 'MONTHLY',
          startDate: budget.startDate || new Date().toISOString(),
          endDate: budget.endDate || null
        } as CreateBudgetRequest
      })
      await refetchBudgets()
    } catch (err) {
      // Error handled by useApiData
    }
  }, [refetchBudgets])

  const handleDelete = useCallback(async (budget: Budget) => {
    if (!confirm(`Supprimer le budget "${budget.name}" ?`)) return

    try {
      await api(`/budgets/${budget.id}`, { method: 'DELETE' })
      await refetchBudgets()
    } catch (err) {
      // Error handled by useApiData
    }
  }, [refetchBudgets])

  const handleUpdateBudget = useCallback(async (formData: {
    name: string
    amount: string
    categoryId: number | null
    period: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM'
    startDate: string
    endDate: string
  }) => {
    if (!editingBudget) return

    try {
      const payload = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        categoryId: formData.categoryId || null,
        period: formData.period,
        startDate: formData.startDate,
        endDate: formData.period === 'CUSTOM' && formData.endDate ? formData.endDate : null
      }

      await api(`/budgets/${editingBudget.id}`, {
        method: 'PUT',
        body: payload as UpdateBudgetRequest
      })

      await refetchBudgets()
      setEditingBudget(null)
    } catch (err) {
      throw err
    }
  }, [editingBudget, refetchBudgets])

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Finance', href: '/finance' },
            { label: 'Budgets' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Budgets
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Créez, ajustez et suivez vos budgets par période
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="h-5 w-5" />}
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Annuler' : 'Créer un Budget'}
          </Button>
        </div>

        <PageNotice config={financeNotices.budgets} className="mb-6" />

        {/* Stats KPIs */}
        {budgets && budgets.length > 0 && (
          <BudgetStatsCards budgets={budgets} formatCurrency={formatAmount} />
        )}

        {/* Filters */}
        {budgets && budgets.length > 0 && (
          <BudgetFilters
            filters={filters}
            onFilterChange={setFilters}
            categories={categories || []}
          />
        )}

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Mes budgets</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {budgets?.length || 0} budget{(budgets?.length || 0) > 1 ? 's' : ''} créé{(budgets?.length || 0) > 1 ? 's' : ''} • {sortedBudgets.length} affiché{sortedBudgets.length > 1 ? 's' : ''}
            </p>
          </div>
          {budgets && budgets.length > 0 && (
            <BudgetExport
              allBudgets={budgets}
              filteredBudgets={sortedBudgets}
              formatCurrency={formatAmount}
            />
          )}
        </div>

        {/* Inline Creation Form */}
        {showCreateForm && (
          <BudgetFormModal
            mode="create"
            categories={categories || []}
            onSubmit={handleCreateBudget}
            onCancel={() => setShowCreateForm(false)}
            error={error}
          />
        )}

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonTable rows={5} columns={6} />
            </div>
          ) : !budgets || budgets.length === 0 ? (
            <div className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
                <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Aucun budget pour le moment</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Créez votre premier budget pour commencer à piloter vos dépenses</p>
              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowCreateForm(true)}
              >
                Créer mon premier budget
              </Button>
            </div>
          ) : (
            <BudgetTable
              budgets={sortedBudgets as any}
              formatCurrency={formatAmount}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={handleSort}
              onEdit={handleEdit as any}
              onDuplicate={handleDuplicate as any}
              onDelete={handleDelete as any}
            />
          )}

          {!loading && budgets && budgets.length > 0 && sortedBudgets.length === 0 && (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              Aucun budget ne correspond aux filtres sélectionnés.
            </div>
          )}
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && (!budgets || budgets.length === 0) && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
                <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Aucun budget</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 px-4">Créez votre premier budget pour commencer</p>
              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowCreateForm(true)}
              >
                Créer un budget
              </Button>
            </div>
          )}

          {!loading && budgets && budgets.length > 0 && sortedBudgets.length === 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
              Aucun budget ne correspond aux filtres sélectionnés.
            </div>
          )}

          {!loading &&
            sortedBudgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget as any}
                formatCurrency={formatAmount}
                onEdit={handleEdit as any}
                onDuplicate={handleDuplicate as any}
                onDelete={handleDelete as any}
              />
            ))}
        </div>

        {/* Inline Edit Form */}
        {editingBudget && (
          <BudgetFormModal
            mode="edit"
            initialData={{
              name: editingBudget.name || '',
              amount: editingBudget.amount ? editingBudget.amount.toString() : '0',
              categoryId: editingBudget.category?.id || null,
              period: editingBudget.period || 'MONTHLY',
              startDate: editingBudget.startDate ? editingBudget.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
              endDate: editingBudget.endDate ? editingBudget.endDate.split('T')[0] : ''
            }}
            categories={categories || []}
            onSubmit={handleUpdateBudget}
            onCancel={() => setEditingBudget(null)}
            error={error}
          />
        )}

        {/* Analytics */}
        {budgets && budgets.length > 0 && (
          <BudgetAnalytics
            budgets={budgets}
            isExpanded={showAnalytics}
            onToggle={() => setShowAnalytics(!showAnalytics)}
            formatCurrency={formatAmount}
          />
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6" role="alert">
            <p className="text-red-800 dark:text-red-200 mb-4">
              {error}
            </p>
            <Button variant="secondary" onClick={refetchBudgets}>
              Réessayer
            </Button>
          </div>
        )}
      </div>
    </Layout>
  )
}
