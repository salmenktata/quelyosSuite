import { useState } from 'react'
import { Layout } from '../../components/Layout'
import {
  useDeliveryMethods,
  useCreateDeliveryMethod,
  useUpdateDeliveryMethod,
  useDeleteDeliveryMethod,
} from '../../hooks/useDelivery'
import { Badge, Breadcrumbs, Skeleton, Button, Modal, PageNotice } from '../../components/common'
import { ecommerceNotices } from '@/lib/notices'
import { useToast } from '../../hooks/useToast'

interface FormData {
  name: string
  fixed_price: number
  free_over: string
  active: boolean
}

export default function DeliveryMethods() {
  const { data, isLoading, error } = useDeliveryMethods()
  const createMethod = useCreateDeliveryMethod()
  const updateMethod = useUpdateDeliveryMethod()
  const deleteMethod = useDeleteDeliveryMethod()
  const { addToast } = useToast()

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<any>(null)
  const [form, setForm] = useState<FormData>({
    name: '',
    fixed_price: 0,
    free_over: '',
    active: true,
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  const resetForm = () => {
    setForm({
      name: '',
      fixed_price: 0,
      free_over: '',
      active: true,
    })
  }

  const openCreateModal = () => {
    resetForm()
    setCreateModalOpen(true)
  }

  const openEditModal = (method: any) => {
    setSelectedMethod(method)
    setForm({
      name: method.name || '',
      fixed_price: method.fixed_price || 0,
      free_over: method.free_over ? String(method.free_over) : '',
      active: method.active !== undefined ? method.active : true,
    })
    setEditModalOpen(true)
  }

  const openDeleteModal = (method: any) => {
    setSelectedMethod(method)
    setDeleteModalOpen(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createMethod.mutateAsync({
        name: form.name,
        fixed_price: form.fixed_price,
        free_over: form.free_over ? parseFloat(form.free_over) : undefined,
      })
      addToast('success', 'Méthode de livraison créée')
      setCreateModalOpen(false)
      resetForm()
    } catch {
      addToast('error', 'Erreur lors de la création')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMethod) return

    try {
      await updateMethod.mutateAsync({
        id: selectedMethod.id,
        data: {
          name: form.name,
          fixed_price: form.fixed_price,
          free_over: form.free_over ? parseFloat(form.free_over) : null,
          active: form.active,
        },
      })
      addToast('success', 'Méthode de livraison mise à jour')
      setEditModalOpen(false)
    } catch {
      addToast('error', 'Erreur lors de la mise à jour')
    }
  }

  const handleDelete = async () => {
    if (!selectedMethod) return

    try {
      await deleteMethod.mutateAsync(selectedMethod.id)
      addToast('success', 'Méthode de livraison supprimée')
      setDeleteModalOpen(false)
    } catch {
      addToast('error', 'Erreur lors de la suppression')
    }
  }

  const handleToggleActive = async (method: any) => {
    try {
      await updateMethod.mutateAsync({
        id: method.id,
        data: { active: !method.active },
      })
      addToast('success', method.active ? 'Méthode désactivée' : 'Méthode activée')
    } catch {
      addToast('error', 'Erreur lors de la mise à jour')
    }
  }

  const methods = data?.data?.delivery_methods || []

  return (
    <Layout>
      <div className="p-8">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Methodes de livraison' },
          ]}
        />

        <PageNotice config={ecommerceNotices.delivery} className="mb-6" />

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Methodes de livraison
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gerer les options de livraison disponibles
            </p>
          </div>
          <Button variant="primary" onClick={openCreateModal}>
            Ajouter une methode
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton count={3} height={100} />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600 dark:text-red-400">
              Erreur lors du chargement des methodes de livraison
            </div>
          ) : methods.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {methods.map((method) => (
                <div
                  key={method.id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {method.name}
                      </h3>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Type :</span>{' '}
                          {method.delivery_type === 'fixed'
                            ? 'Prix fixe'
                            : method.delivery_type === 'base_on_rule'
                            ? 'Base sur des regles'
                            : method.delivery_type}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Prix :</span>{' '}
                          {formatPrice(method.fixed_price)}
                        </p>
                        {method.free_over && typeof method.free_over === 'number' && (
                          <p className="text-sm text-green-600 dark:text-green-400">
                            Gratuit au-dessus de {formatPrice(method.free_over)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(method)}
                        className="!p-0"
                      >
                        <Badge variant={method.active !== false ? 'success' : 'neutral'}>
                          {method.active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(method)}>
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteModal(method)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
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
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Aucune methode de livraison
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Ajoutez votre premiere methode de livraison
              </p>
              <Button variant="primary" onClick={openCreateModal}>
                Ajouter une methode
              </Button>
            </div>
          )}
        </div>

        {/* Modal Creation */}
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Nouvelle methode de livraison"
          hideDefaultActions={true}
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Livraison standard"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix fixe (EUR) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.fixed_price}
                onChange={(e) =>
                  setForm({ ...form, fixed_price: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gratuit a partir de (EUR)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.free_over}
                onChange={(e) => setForm({ ...form, free_over: e.target.value })}
                placeholder="Laisser vide si non applicable"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCreateModalOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" variant="primary" loading={createMethod.isPending}>
                Creer
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal Edition */}
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Modifier la methode de livraison"
          hideDefaultActions={true}
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix fixe (EUR) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.fixed_price}
                onChange={(e) =>
                  setForm({ ...form, fixed_price: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gratuit a partir de (EUR)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.free_over}
                onChange={(e) => setForm({ ...form, free_over: e.target.value })}
                placeholder="Laisser vide si non applicable"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Active</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditModalOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" variant="primary" loading={updateMethod.isPending}>
                Enregistrer
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal Suppression */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Supprimer la methode de livraison"
          hideDefaultActions={true}
        >
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Etes-vous sur de vouloir supprimer la methode{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {selectedMethod?.name}
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
                loading={deleteMethod.isPending}
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
