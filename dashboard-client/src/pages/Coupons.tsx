import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useCoupons, useUpdateCoupon, useDeleteCoupon } from '../hooks/useCoupons'
import { Button, Badge, Breadcrumbs, SkeletonTable, Modal } from '../components/common'
import { useToast } from '../hooks/useToast'

interface EditFormData {
  name: string
  active: boolean
  date_from: string
  date_to: string
  discount_type: string
  discount_value: number
}

export default function Coupons() {
  const [page, setPage] = useState(0)
  const [activeOnly, setActiveOnly] = useState(false)
  const limit = 20

  const { data, isLoading, error } = useCoupons({
    limit,
    offset: page * limit,
    active_only: activeOnly,
  })

  const updateCoupon = useUpdateCoupon()
  const deleteCoupon = useDeleteCoupon()
  const { addToast } = useToast()

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null)
  const [editForm, setEditForm] = useState<EditFormData>({
    name: '',
    active: true,
    date_from: '',
    date_to: '',
    discount_type: 'percent',
    discount_value: 0,
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return ''
    return dateString.split('T')[0]
  }

  const getDiscountLabel = (coupon: any) => {
    if (!coupon.reward) return '-'
    const { discount, discount_mode, discount_fixed_amount } = coupon.reward
    if (discount_mode === 'percent') {
      return `${discount}%`
    }
    return `${discount_fixed_amount || discount}€`
  }

  const openEditModal = (coupon: any) => {
    setSelectedCoupon(coupon)
    setEditForm({
      name: coupon.name || '',
      active: coupon.active,
      date_from: formatDateForInput(coupon.date_from),
      date_to: formatDateForInput(coupon.date_to),
      discount_type: coupon.reward?.discount_mode || 'percent',
      discount_value:
        coupon.reward?.discount_mode === 'percent'
          ? coupon.reward?.discount || 0
          : coupon.reward?.discount_fixed_amount || 0,
    })
    setEditModalOpen(true)
  }

  const openDeleteModal = (coupon: any) => {
    setSelectedCoupon(coupon)
    setDeleteModalOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCoupon) return

    try {
      await updateCoupon.mutateAsync({
        id: selectedCoupon.id,
        data: {
          name: editForm.name,
          active: editForm.active,
          date_from: editForm.date_from || null,
          date_to: editForm.date_to || null,
          discount_type: editForm.discount_type,
          discount_value: editForm.discount_value,
        },
      })
      addToast('success', 'Coupon mis à jour avec succès')
      setEditModalOpen(false)
    } catch {
      addToast('error', 'Erreur lors de la mise à jour')
    }
  }

  const handleDelete = async () => {
    if (!selectedCoupon) return

    try {
      await deleteCoupon.mutateAsync(selectedCoupon.id)
      addToast('success', 'Coupon supprimé avec succès')
      setDeleteModalOpen(false)
    } catch {
      addToast('error', 'Erreur lors de la suppression')
    }
  }

  const handleToggleActive = async (coupon: any) => {
    try {
      await updateCoupon.mutateAsync({
        id: coupon.id,
        data: { active: !coupon.active },
      })
      addToast('success', coupon.active ? 'Coupon désactivé' : 'Coupon activé')
    } catch {
      addToast('error', 'Erreur lors de la mise à jour')
    }
  }

  return (
    <Layout>
      <div className="p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Codes Promo' },
          ]}
        />

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Codes Promo</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gerer les coupons et promotions
            </p>
          </div>
          <Link to="/coupons/create">
            <Button variant="primary">Creer un coupon</Button>
          </Link>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => {
                  setActiveOnly(e.target.checked)
                  setPage(0)
                }}
                className="w-4 h-4 text-indigo-600 dark:text-indigo-400 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Actifs uniquement
              </span>
            </label>

            {data?.data && (
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-auto">
                {data.data.total} coupon{data.data.total > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Liste des coupons */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <SkeletonTable rows={5} columns={6} />
          ) : error ? (
            <div className="p-8 text-center text-red-600 dark:text-red-400">
              Erreur lors du chargement des coupons
            </div>
          ) : data?.data.coupons && (data.data.coupons as import('../types').Coupon[]).length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Nom
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Reduction
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Periode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {(data.data.coupons as import('../types').Coupon[]).map((coupon) => (
                      <tr
                        key={coupon.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {coupon.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {coupon.program_type}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            {getDiscountLabel(coupon)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(coupon.date_from ?? null)} - {formatDate(coupon.date_to ?? null)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleActive(coupon)}
                            className="focus:outline-none"
                          >
                            <Badge variant={coupon.active ? 'success' : 'neutral'}>
                              {coupon.active ? 'Actif' : 'Inactif'}
                            </Badge>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {coupon.trigger === 'with_code' ? 'Code' : 'Auto'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(coupon)}
                            >
                              Modifier
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteModal(coupon)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400"
                            >
                              Supprimer
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data.data.total > limit && (
                <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Affichage {page * limit + 1} a{' '}
                    {Math.min((page + 1) * limit, data.data.total)} sur {data.data.total}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                    >
                      Precedent
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={(page + 1) * limit >= data.data.total}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-gray-600 dark:text-gray-400">
              <div className="max-w-md mx-auto">
                <svg
                  className="w-16 h-16 mx-auto text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Aucun coupon
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Creez votre premier code promo pour booster vos ventes
                </p>
                <Link to="/coupons/create">
                  <Button variant="primary">Creer un coupon</Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Modal Edition */}
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Modifier le coupon"
          hideDefaultActions={true}
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom *
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.active}
                  onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Actif</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date debut
                </label>
                <input
                  type="date"
                  value={editForm.date_from}
                  onChange={(e) => setEditForm({ ...editForm, date_from: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date fin
                </label>
                <input
                  type="date"
                  value={editForm.date_to}
                  onChange={(e) => setEditForm({ ...editForm, date_to: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type de reduction
                </label>
                <select
                  value={editForm.discount_type}
                  onChange={(e) =>
                    setEditForm({ ...editForm, discount_type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value="percent">Pourcentage (%)</option>
                  <option value="fixed_amount">Montant fixe (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valeur
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.discount_value}
                  onChange={(e) =>
                    setEditForm({ ...editForm, discount_value: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditModalOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" variant="primary" loading={updateCoupon.isPending}>
                Enregistrer
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal Suppression */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Supprimer le coupon"
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Etes-vous sur de vouloir supprimer le coupon{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {selectedCoupon?.name}
              </span>{' '}
              ?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">
              Cette action est irreversible.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeleteModalOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                loading={deleteCoupon.isPending}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  )
}
