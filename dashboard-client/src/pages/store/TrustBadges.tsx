/**
 * Page Badges de Confiance - Gestion des trust badges
 *
 * Fonctionnalités :
 * - Liste des badges de confiance (paiement sécurisé, livraison, garantie, etc.)
 * - Création/édition/suppression de badges
 * - Choix de l'icône (carte bancaire, livraison, bouclier, etc.)
 * - Activation/désactivation des badges
 */


import { useState } from 'react'
import { Layout } from '../../components/Layout'
import { useTrustBadges, useCreateTrustBadge, useUpdateTrustBadge, useDeleteTrustBadge, TrustBadge } from '../../hooks/useTrustBadges'
import { Button, SkeletonTable, PageNotice, Breadcrumbs } from '../../components/common'
import { useToast } from '../../hooks/useToast'
import { storeNotices } from '@/lib/notices'

const ICON_OPTIONS = [
  { value: 'creditcard', label: 'Carte bancaire (Paiement sécurisé)' },
  { value: 'delivery', label: 'Livraison' },
  { value: 'shield', label: 'Bouclier (Garantie)' },
  { value: 'support', label: 'Support client' },
  { value: 'return', label: 'Retour gratuit' },
  { value: 'quality', label: 'Qualité' },
]

export default function TrustBadges() {
  const [editingBadge, setEditingBadge] = useState<TrustBadge | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const { data: badges, isLoading } = useTrustBadges()
  const createMutation = useCreateTrustBadge()
  const updateMutation = useUpdateTrustBadge()
  const deleteMutation = useDeleteTrustBadge()
  const toast = useToast()
  const [formData, setFormData] = useState<{
    name: string
    title: string
    subtitle: string
    icon: TrustBadge['icon']
    active: boolean
  }>({
    name: '',
    title: '',
    subtitle: '',
    icon: 'creditcard',
    active: true
  })

  const handleNew = () => {
    setIsCreating(true)
    setEditingBadge(null)
    setFormData({ name: '', title: '', subtitle: '', icon: 'creditcard', active: true })
  }

  const handleEdit = (badge: TrustBadge) => {
    setEditingBadge(badge)
    setIsCreating(false)
    setFormData({
      name: badge.name || '',
      title: badge.title || '',
      subtitle: badge.subtitle || '',
      icon: badge.icon || 'creditcard',
      active: badge.active
    })
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingBadge(null)
  }

  const handleSave = async () => {
    try {
      if (isCreating) {
        await createMutation.mutateAsync(formData)
        toast.success('Badge créé')
      } else if (editingBadge) {
        await updateMutation.mutateAsync({ id: editingBadge.id, ...formData })
        toast.success('Badge mis à jour')
      }
      handleCancel()
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce badge ?')) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Badge supprimé')
      if (editingBadge?.id === id) handleCancel()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const showForm = isCreating || editingBadge

  return (
    <Layout>
      <Breadcrumbs
        items={[
          { label: 'Tableau de bord', href: '/dashboard' },
          { label: 'Badges Confiance' },
        ]}
      />
      <div className="p-6 bg-white dark:bg-gray-800 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trust Badges</h1>
          {!showForm && <Button onClick={handleNew}>Nouveau</Button>}
        </div>

        <PageNotice config={storeNotices.trustBadges} className="mb-6" />

        <div className={`grid gap-6 ${showForm ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Liste */}
          <div className="overflow-hidden">
            {isLoading ? <SkeletonTable rows={5} columns={4} /> : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Titre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actif</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {badges?.map(b => (
                    <tr
                      key={b.id}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${editingBadge?.id === b.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                      onClick={() => handleEdit(b)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{b.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{b.title}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${b.active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {b.active ? 'Oui' : 'Non'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button onClick={(e) => { e.stopPropagation(); handleDelete(b.id) }} size="sm" variant="secondary">Supprimer</Button>
                      </td>
                    </tr>
                  ))}
                  {(!badges || badges.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        Aucun badge. Cliquez sur "Nouveau" pour en créer un.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Formulaire inline */}
          {showForm && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {isCreating ? 'Nouveau Badge' : 'Modifier le Badge'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nom interne"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                    placeholder="Paiement sécurisé"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sous-titre</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                    placeholder="Par CB, PayPal, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icône</label>
                  <select
                    value={formData.icon}
                    onChange={e => setFormData({ ...formData, icon: e.target.value as TrustBadge['icon'] })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                  >
                    {ICON_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">Actif</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button onClick={handleCancel} variant="secondary">Annuler</Button>
                <Button onClick={handleSave} disabled={!formData.name || !formData.title}>Sauvegarder</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
