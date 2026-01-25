import { useState } from 'react'
import { Layout } from '../components/Layout'
import { useTrustBadges, useCreateTrustBadge, useUpdateTrustBadge, useDeleteTrustBadge, TrustBadge } from '../hooks/useTrustBadges'
import { Button, Modal, SkeletonTable } from '../components/common'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/common/Toast'

export default function TrustBadges() {
  const [editingBadge, setEditingBadge] = useState<TrustBadge | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteModal, setDeleteModal] = useState<number | null>(null)
  const { data: badges, isLoading } = useTrustBadges()
  const createMutation = useCreateTrustBadge()
  const updateMutation = useUpdateTrustBadge()
  const deleteMutation = useDeleteTrustBadge()
  const toast = useToast()
  const [formData, setFormData] = useState({ 
    name: '', 
    title: '', 
    subtitle: '', 
    icon: 'creditcard' as const,
    active: true 
  })

  const handleSave = async () => {
    try {
      if (isCreating) {
        await createMutation.mutateAsync(formData)
        toast.success('Badge créé')
      } else if (editingBadge) {
        await updateMutation.mutateAsync({ id: editingBadge.id, ...formData })
        toast.success('Badge mis à jour')
      }
      setIsCreating(false)
      setEditingBadge(null)
    } catch (error) {
      toast.error('Erreur')
    }
  }

  return (
    <Layout>
      <div className="p-6 bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Trust Badges Footer</h1>
          <Button onClick={() => { setIsCreating(true); setFormData({ name: '', title: '', subtitle: '', icon: 'creditcard', active: true }) }}>Nouveau</Button>
        </div>
        {isLoading ? <SkeletonTable rows={5} columns={4} /> : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Titre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Icône</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {badges?.map(b => (
                <tr key={b.id}>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{b.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{b.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{b.icon}</td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <Button onClick={() => { setEditingBadge(b); setFormData({ name: b.name, title: b.title, subtitle: b.subtitle, icon: b.icon, active: b.active }) }} size="sm">Éditer</Button>
                    <Button onClick={() => setDeleteModal(b.id)} size="sm" variant="secondary">Supprimer</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {(isCreating || editingBadge) && (
        <Modal isOpen={true} onClose={() => { setIsCreating(false); setEditingBadge(null) }} title={isCreating ? 'Nouveau badge' : 'Éditer badge'}>
          <div className="space-y-4">
            <input type="text" placeholder="Nom" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
            <input type="text" placeholder="Titre" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
            <input type="text" placeholder="Sous-titre" value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
            <select value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value as any })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100">
              <option value="creditcard">Carte bancaire (Paiement sécurisé)</option>
              <option value="delivery">Livraison</option>
              <option value="shield">Bouclier (Garantie)</option>
              <option value="support">Support</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button onClick={() => { setIsCreating(false); setEditingBadge(null) }} variant="secondary">Annuler</Button>
            <Button onClick={handleSave}>Sauvegarder</Button>
          </div>
        </Modal>
      )}
      <ToastContainer />
    </Layout>
  )
}
