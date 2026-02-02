/**
 * Page Gestion des Comptes
 *
 * Fonctionnalités :
 * - Liste complète des comptes bancaires et caisses
 * - Filtrage par type, portefeuille, devise
 * - Tri interactif par nom, solde, type
 * - Sélection multiple et actions groupées
 * - Gestion conflits de suppression (archive ou réaffectation)
 * - Vue desktop (tableau) et mobile (cartes)
 * - Édition inline avec modals
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, SkeletonTable, PageNotice, Button } from '@/components/common'
import { financeNotices } from '@/lib/notices/finance-notices'
import { ROUTES } from '@/lib/finance/compat/routes'
import { api } from '@/lib/finance/api'
import { useRequireAuth } from '@/lib/finance/compat/auth'
import { currencies } from '@/lib/finance/currencies'
import { useCurrency } from '@/lib/finance/CurrencyContext'
import {
  Plus,
  Trash2,
  Pencil,
  Archive,
  ArrowUpDown,
  Wallet,
} from 'lucide-react'
import type { CreateAccountRequest, UpdateAccountRequest, ReassignAccountRequest } from '@/types/api'
import { AccountModal, type AccountFormData } from '@/components/finance/accounts/AccountModal'
import { DeleteConflictModal } from '@/components/finance/accounts/DeleteConflictModal'
import { useFilteredData } from '@/hooks/finance/useFilteredData'
import { useApiData } from '@/hooks/finance/useApiData'
import { logger } from '@quelyos/logger';

type AccountType =
  | 'banque'
  | 'cash'
  | 'cheques'
  | 'traites'
  | 'carte'
  | 'epargne'
  | 'investissement'
  | 'pret'

type Portfolio = {
  id: number
  name: string
}

type Account = {
  id: number
  name: string
  companyId: number
  type?: AccountType
  currency?: string
  balance?: number
  institution?: string
  notes?: string
  portfolios?: Array<{
    portfolio: Portfolio
  }>
  status?: 'ACTIVE' | 'INACTIVE'
}

const accountTypes: { value: AccountType; label: string }[] = [
  { value: 'banque', label: 'Banque' },
  { value: 'cash', label: 'Cash' },
  { value: 'cheques', label: 'Chèques' },
  { value: 'traites', label: 'Traites' },
  { value: 'carte', label: 'Carte (débit/crédit)' },
  { value: 'epargne', label: 'Épargne' },
  { value: 'investissement', label: 'Investissement' },
  { value: 'pret', label: 'Prêt / Crédit' },
]

export default function AccountsPage() {
  const { user } = useRequireAuth()
  const role = (user as { role?: string } | null)?.role ?? 'USER'
  const isSuperAdmin = role === 'SUPERADMIN'
  const { currency: globalCurrency } = useCurrency()

  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('banque')
  const [currency, setCurrency] = useState('EUR')
  const [balance, setBalance] = useState<number | ''>('')
  const [institution, setInstitution] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE')
  const [selectedPortfolios, setSelectedPortfolios] = useState<number[]>([])
  const [filterType, setFilterType] = useState<AccountType | 'all'>('all')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [targetCompanyId, setTargetCompanyId] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'type'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConflictId, setDeleteConflictId] = useState<number | null>(null)
  const [_deleteAction, setDeleteAction] = useState<'archive' | 'reassign'>('archive')
  const [_reassignTargetId, setReassignTargetId] = useState<number | ''>('')
  const [resolvingConflict, setResolvingConflict] = useState(false)
  const [conflictError, setConflictError] = useState<string | null>(null)
  const [_deleteError, setDeleteError] = useState<string | null>(null)

  const withCompanyParam = useCallback(
    (path: string) => {
      if (!isSuperAdmin) return path
      const cid = Number(targetCompanyId)
      if (!targetCompanyId.trim() || !Number.isFinite(cid)) return path
      return path.includes('?') ? `${path}&companyId=${cid}` : `${path}?companyId=${cid}`
    },
    [isSuperAdmin, targetCompanyId]
  )

  const {
    data: portfoliosData,
    refetch: _refetchPortfolios
  } = useApiData<Portfolio[]>({
    fetcher: async () => {
      const data = await api(withCompanyParam('/portfolios'))
      return Array.isArray(data) ? data : []
    },
    cacheKey: `portfolios-${isSuperAdmin ? targetCompanyId : 'default'}`,
    cacheTime: 5 * 60 * 1000,
    deps: [withCompanyParam],
  })

  const {
    data: accountsData,
    loading,
    error: accountsError,
    refetch: refetchAccounts
  } = useApiData<Account[]>({
    fetcher: async () => {
      const data = await api(withCompanyParam('/accounts'))
      const rawAccounts = (data as unknown) as Account[]
      return rawAccounts.map((acc) => ({
        ...acc,
        type: (acc.type as AccountType) ?? 'banque',
        currency: acc.currency ?? 'EUR',
        balance: acc.balance ?? 0,
      }))
    },
    cacheKey: `accounts-${isSuperAdmin ? targetCompanyId : 'default'}`,
    cacheTime: 2 * 60 * 1000,
    deps: [withCompanyParam],
  })

  const portfolios = portfoliosData || []
  const accounts = useMemo(() => accountsData || [], [accountsData])
  const error = accountsError?.message || null

  function resetAccountForm() {
    setName('')
    setInstitution('')
    setNotes('')
    setBalance('')
    setType('banque')
    setCurrency(globalCurrency)
    setStatus('ACTIVE')
    setSelectedPortfolios([])
    setEditingId(null)
  }

  async function submitAccountFromModal(data: AccountFormData) {
    const body = {
      name: data.name,
      type: data.type,
      currency: data.currency,
      balance: data.balance,
      institution: data.institution,
      notes: data.notes,
      status: data.status,
      portfolioIds: data.selectedPortfolios,
    }

    if (editingId) {
      await api(withCompanyParam(`/accounts/${editingId}`), {
        method: 'PUT',
        body: body as UpdateAccountRequest,
      })
    } else {
      await api(withCompanyParam('/accounts'), {
        method: 'POST',
        body: body as CreateAccountRequest,
      })
    }

    resetAccountForm()
    await refetchAccounts()
  }

  function startEdit(acc: Account) {
    setEditingId(acc.id)
    setName(acc.name)
    setType((acc.type as AccountType) ?? 'banque')
    setCurrency(acc.currency ?? 'EUR')
    setBalance(acc.balance ?? 0)
    setInstitution(acc.institution ?? '')
    setNotes(acc.notes ?? '')
    setStatus(acc.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE')
    setSelectedPortfolios(
      acc.portfolios?.map((p) => p.portfolio.id) ?? []
    )
  }

  async function deleteAccount(id: number) {
    if (!confirm('Supprimer ce compte ?')) return
    setDeletingId(id)
    setDeleteError(null)
    try {
      await api(withCompanyParam(`/accounts/${id}`), { method: 'DELETE' })
      if (editingId === id) {
        resetAccountForm()
      }
      await refetchAccounts()
    } catch (err) {
      logger.error("Erreur:", err);
      const message = err instanceof Error ? err.message : 'Impossible de supprimer le compte.'
      if (message.includes('ACCOUNT_HAS_TRANSACTIONS')) {
        setDeleteConflictId(id)
        setDeleteAction('archive')
        setReassignTargetId('')
        setConflictError(null)
      } else {
        setDeleteError(message)
      }
    } finally {
      setDeletingId(null)
    }
  }

  function closeDeleteConflict() {
    setDeleteConflictId(null)
    setDeleteAction('archive')
    setReassignTargetId('')
    setConflictError(null)
  }

  async function handleResolveConflict(action: 'archive' | 'reassign', targetAccountId?: number) {
    if (!deleteConflictId) return
    setResolvingConflict(true)
    setConflictError(null)

    if (action === 'reassign' && !targetAccountId) {
      setConflictError('Sélectionnez un compte de destination.')
      setResolvingConflict(false)
      return
    }

    try {
      if (action === 'archive') {
        await api(withCompanyParam(`/accounts/${deleteConflictId}/archive-transactions`), {
          method: 'POST',
        })
      } else {
        await api(withCompanyParam(`/accounts/${deleteConflictId}/reassign-transactions`), {
          method: 'POST',
          body: { targetAccountId: Number(targetAccountId) } as ReassignAccountRequest,
        })
      }

      if (editingId === deleteConflictId) {
        resetAccountForm()
      }

      closeDeleteConflict()
      await refetchAccounts()
    } catch (err) {
      logger.error("Erreur:", err);
      setConflictError(
        err instanceof Error
          ? err.message
          : 'Impossible de résoudre le conflit de suppression.'
      )
    } finally {
      setResolvingConflict(false)
    }
  }

  useEffect(() => {
    setCurrency(globalCurrency)
  }, [globalCurrency])

  const { sortedData: sortedAndFiltered } = useFilteredData({
    data: accounts,
    filterConfig: {
      searchQuery,
      searchFields: ['name', 'institution', 'notes'],
      filters: {
        ...(filterType !== 'all' && { type: filterType }),
      },
    },
    sortConfig: sortBy ? { key: sortBy, direction: sortDir } : null,
  })

  const conflictAccount = useMemo(
    () => accounts.find((a) => a.id === deleteConflictId) ?? null,
    [accounts, deleteConflictId]
  )

  const reassignableAccounts = useMemo(
    () =>
      accounts.filter(
        (a) => a.id !== deleteConflictId && a.status !== 'INACTIVE'
      ),
    [accounts, deleteConflictId]
  )

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedAndFiltered.length && sortedAndFiltered.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(sortedAndFiltered.map((a) => a.id))
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir('desc')
    }
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Finance', href: '/finance' },
            { label: 'Comptes' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Comptes
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gérez vos comptes bancaires, caisses et portefeuilles
            </p>
          </div>
          <Link to={ROUTES.FINANCE.DASHBOARD.ACCOUNTS.NEW}>
            <Button variant="primary" icon={<Plus className="h-5 w-5" />}>
              Nouveau Compte
            </Button>
          </Link>
        </div>

        <PageNotice config={financeNotices.accounts} className="mb-6" />

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6">
          <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1 space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Rechercher
              </label>
              <input
                type="text"
                placeholder="Nom, établissement"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as AccountType | 'all')}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">Tous</option>
                {accountTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Portefeuille
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">Tous</option>
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Devise
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">Toutes</option>
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <SkeletonTable rows={10} columns={9} />
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6" role="alert">
            <p className="text-red-800 dark:text-red-200 mb-4">
              {error}
            </p>
            <Button variant="secondary" onClick={refetchAccounts}>
              Réessayer
            </Button>
          </div>
        ) : (
          <>
            {/* Tableau des comptes - Desktop */}
            <div className="hidden md:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tableau des comptes</h2>
                  <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                    {sortedAndFiltered.length} lignes
                  </span>
                </div>
                <div className="flex gap-2">
                  {selectedIds.length > 0 && (
                    <>
                      <Button variant="secondary" icon={<Archive className="h-4 w-4" />}>
                        Archiver
                      </Button>
                      <Button variant="danger" icon={<Trash2 className="h-4 w-4" />}>
                        Supprimer
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      <th className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === sortedAndFiltered.length && sortedAndFiltered.length > 0}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-600"
                        />
                      </th>
                      <th className="cursor-pointer p-4 hover:text-gray-900 dark:hover:text-white" onClick={() => handleSort('name')}>
                        <div className="flex items-center gap-2">
                          Compte
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </div>
                      </th>
                      <th className="cursor-pointer p-4 hover:text-gray-900 dark:hover:text-white" onClick={() => handleSort('balance')}>
                        <div className="flex items-center gap-2">
                          Montant
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        </div>
                      </th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4">Portefeuilles</th>
                      <th className="p-4">Établissement</th>
                      <th className="p-4">Notes</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedAndFiltered.map((acc) => {
                      return (
                        <tr
                          key={acc.id}
                          className="group transition hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(acc.id)}
                              onChange={() => toggleSelect(acc.id)}
                              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-600"
                            />
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900 dark:text-white">{acc.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">ID {acc.id}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className={`font-semibold ${(acc.balance ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                              {(acc.balance ?? 0) >= 0 ? '+' : ''}
                              {(acc.balance ?? 0).toFixed(2)} {globalCurrency}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                              {accountTypes.find((t) => t.value === acc.type)?.label ?? 'Banque'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                acc.status === 'INACTIVE'
                                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                  : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                              }`}
                            >
                              {acc.status === 'INACTIVE' ? 'Inactif' : 'Actif'}
                            </span>
                          </td>
                          <td className="p-4">
                            {acc.portfolios && acc.portfolios.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {acc.portfolios.map((p) => (
                                  <span
                                    key={p.portfolio.id}
                                    className="text-xs rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-gray-600 dark:text-gray-300"
                                  >
                                    {p.portfolio.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">Tous les portefeuilles</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {acc.institution || '—'}
                            </span>
                          </td>
                          <td className="p-4 max-w-xs">
                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate block">
                              {acc.notes || '—'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(acc)}
                                icon={<Pencil className="h-4 w-4" />}
                              >
                                <span className="sr-only">Modifier</span>
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => deleteAccount(acc.id)}
                                disabled={deletingId === acc.id}
                                icon={<Trash2 className="h-4 w-4" />}
                              >
                                <span className="sr-only">Supprimer</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {sortedAndFiltered.length === 0 && (
                  <div className="p-12 text-center">
                    <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Aucun compte trouvé.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Liste mobile en cartes */}
            <div className="md:hidden space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{sortedAndFiltered.length} compte(s)</span>
                {selectedIds.length > 0 && (
                  <Button variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />}>
                    Suppr. ({selectedIds.length})
                  </Button>
                )}
              </div>

              {sortedAndFiltered.length === 0 && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
                  <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Aucun compte trouvé.</p>
                </div>
              )}

              {sortedAndFiltered.map((acc) => {
                return (
                  <div key={acc.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(acc.id)}
                            onChange={() => toggleSelect(acc.id)}
                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-indigo-600"
                          />
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{acc.name}</h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{acc.institution || 'Sans établissement'}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                        {accountTypes.find((t) => t.value === acc.type)?.label ?? 'Banque'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-bold ${(acc.balance ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {(acc.balance ?? 0) >= 0 ? '+' : ''}{(acc.balance ?? 0).toFixed(2)} {globalCurrency}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        acc.status === 'INACTIVE'
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                          : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        {acc.status === 'INACTIVE' ? 'Inactif' : 'Actif'}
                      </span>
                    </div>

                    {acc.portfolios && acc.portfolios.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {acc.portfolios.slice(0, 3).map((p) => (
                          <span
                            key={p.portfolio.id}
                            className="text-xs rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-gray-600 dark:text-gray-300"
                          >
                            {p.portfolio.name}
                          </span>
                        ))}
                        {acc.portfolios.length > 3 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">+{acc.portfolios.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => startEdit(acc)}
                        icon={<Pencil className="h-3.5 w-3.5" />}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="danger"
                        className="flex-1"
                        onClick={() => deleteAccount(acc.id)}
                        disabled={deletingId === acc.id}
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Delete Conflict Modal */}
        <DeleteConflictModal
          isOpen={!!deleteConflictId}
          account={conflictAccount}
          availableAccounts={reassignableAccounts}
          loading={resolvingConflict}
          error={conflictError}
          onCancel={closeDeleteConflict}
          onResolve={handleResolveConflict}
        />

        {/* Modal d'édition */}
        <AccountModal
          isOpen={!!editingId}
          mode="edit"
          initialData={{
            name,
            type,
            currency,
            balance,
            institution,
            notes,
            status,
            selectedPortfolios,
          }}
          portfolios={portfolios}
          loading={loading}
          error={error}
          onSubmit={submitAccountFromModal}
          onCancel={resetAccountForm}
          isSuperAdmin={isSuperAdmin}
          targetCompanyId={targetCompanyId}
          onTargetCompanyIdChange={setTargetCompanyId}
        />
      </div>
    </Layout>
  )
}
