import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import {
  useAbandonedCarts,
  useSendCartReminder,
  useCartRecoveryStats,
} from '../../hooks/useAbandonedCarts'
import { Button, Breadcrumbs, SkeletonTable, PageNotice } from '../../components/common'
import { ecommerceNotices } from '@/lib/notices'
import { Mail as EnvelopeIcon, ShoppingCart as ShoppingCartIcon } from 'lucide-react'
import type { AbandonedCart } from '@/types'
import { logger } from '@quelyos/logger';

export default function AbandonedCarts() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [hoursThreshold, setHoursThreshold] = useState(24)
  const [statsPeriod, setStatsPeriod] = useState('30d')
  const limit = 20

  const { data, isLoading, error } = useAbandonedCarts({
    limit,
    offset: page * limit,
    search: search || undefined,
    hours_threshold: hoursThreshold,
  })

  const { data: statsData, isLoading: statsLoading } = useCartRecoveryStats({
    period: statsPeriod,
  })

  const sendReminderMutation = useSendCartReminder()

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  const handleResetFilters = () => {
    setSearch('')
    setSearchInput('')
    setHoursThreshold(24)
    setPage(0)
  }

  const handleSendReminder = async (cartId: number, partnerName: string) => {
    if (
      window.confirm(
        `Envoyer un email de relance à ${partnerName} pour récupérer ce panier ?`
      )
    ) {
      try {
        await sendReminderMutation.mutateAsync(cartId)
        alert('Email de relance envoyé avec succès !')
      } catch (_error) {
      logger.error("Erreur:", error);
        alert("Erreur lors de l'envoi de l'email : " + (error as Error).message)
      }
    }
  }

  const hasActiveFilters = search || hoursThreshold !== 24

  const carts = (data?.data?.abandoned_carts || []) as AbandonedCart[]
  const total = (data?.data?.total || 0) as number

  const stats = statsData?.data

  return (
    <Layout>
      <div className="p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Paniers abandonnés' },
          ]}
        />

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Paniers abandonnés
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gérer et relancer les paniers abandonnés pour récupérer des ventes
          </p>
        </div>

        <PageNotice config={ecommerceNotices.abandonedCarts} className="mb-6" />

        {/* Statistiques de récupération */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Abandonnés</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.abandoned_count}
                  </p>
                </div>
                <ShoppingCartIcon className="h-10 w-10 text-orange-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Valeur abandonnée</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {formatPrice(stats.abandonedvalue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Récupérés</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {stats.recovered_count}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Valeur récupérée</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {formatPrice(stats.recoveredvalue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Taux récupération</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {stats.recovery_rate}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="space-y-4">
            {/* Ligne 1 : Recherche */}
            <form onSubmit={handleSearch} className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Rechercher par numéro de panier ou nom client..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
              <Button type="submit" variant="primary">
                Rechercher
              </Button>
            </form>

            {/* Ligne 2 : Filtres */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Filtre seuil d'heures */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300">
                  Inactif depuis :
                </label>
                <select
                  value={hoursThreshold}
                  onChange={(e) => {
                    setHoursThreshold(Number(e.target.value))
                    setPage(0)
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value={1}>1 heure</option>
                  <option value={6}>6 heures</option>
                  <option value={24}>24 heures</option>
                  <option value={48}>48 heures</option>
                  <option value={72}>72 heures</option>
                  <option value={168}>1 semaine</option>
                </select>
              </div>

              {/* Période stats */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300">
                  Statistiques :
                </label>
                <select
                  value={statsPeriod}
                  onChange={(e) => setStatsPeriod(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value="7d">7 jours</option>
                  <option value="30d">30 jours</option>
                  <option value="12m">12 mois</option>
                </select>
              </div>

              {hasActiveFilters && (
                <Button onClick={handleResetFilters} variant="ghost">
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Résultats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Affichage {page * limit + 1}-{Math.min((page + 1) * limit, total)} sur {total}{' '}
              paniers abandonnés
            </p>
          </div>

          {error ? (
            <div className="p-6 text-center text-red-600 dark:text-red-400">
              Erreur lors du chargement des paniers abandonnés
            </div>
          ) : isLoading ? (
            <SkeletonTable rows={10} columns={7} />
          ) : carts.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Aucun panier abandonné
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {hasActiveFilters
                  ? 'Aucun panier abandonné ne correspond aux critères de recherche'
                  : 'Il n\'y a aucun panier abandonné pour le moment'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Panier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Articles
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Inactif depuis
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {carts.map((cart) => (
                      <tr
                        key={cart.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Link
                              to={`/orders/${cart.id}`}
                              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                            >
                              {cart.name}
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {cart.partner_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {cart.partner_email || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {cart.lines_count} article{cart.lines_count > 1 ? 's' : ''}
                          </div>
                          {cart.items.length > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {cart.items.map((item, idx) => (
                                <div key={idx}>
                                  {item.quantity}x {item.product_name}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatPrice(cart.amount_total)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {cart.hours_ago < 24
                              ? `${Math.round(cart.hours_ago)}h`
                              : `${Math.round(cart.hours_ago / 24)}j`}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(cart.write_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleSendReminder(cart.id, cart.partner_name)}
                              disabled={
                                !cart.partner_email || sendReminderMutation.isPending
                              }
                              icon={<EnvelopeIcon className="h-4 w-4" />}
                            >
                              Relancer
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {total > limit && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <Button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 0}
                    variant="secondary"
                  >
                    Précédent
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {page + 1} sur {Math.ceil(total / limit)}
                  </span>
                  <Button
                    onClick={() => setPage(page + 1)}
                    disabled={(page + 1) * limit >= total}
                    variant="secondary"
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
