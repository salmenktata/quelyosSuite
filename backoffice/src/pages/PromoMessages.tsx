import { useState } from 'react'
import { Layout } from '../components/Layout'
import { usePromoMessages, useCreatePromoMessage, useUpdatePromoMessage, useDeletePromoMessage, PromoMessage } from '../hooks/usePromoMessages'
import { Button, Modal, SkeletonTable } from '../components/common'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/common/Toast'

export default function PromoMessages() {
  const [editingMessage, setEditingMessage] = useState<PromoMessage | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteModal, setDeleteModal] = useState<number | null>(null)
  const { data: messages, isLoading } = usePromoMessages()
  const createMutation = useCreatePromoMessage()
  const updateMutation = useUpdatePromoMessage()
  const deleteMutation = useDeletePromoMessage()
  const toast = useToast()
  const [formData, setFormData] = useState({ 
    name: '', 
    text: '', 
    icon: 'truck' as const,
    active: true 
  })

  const handleSave = async () => {
    try {
      if (isCreating) {
        await createMutation.mutateAsync(formData)
        toast.success('Message créé')
      } else if (editingMessage) {
        await updateMutation.mutateAsync({ id: editingMessage.id, ...formData })
        toast.success('Message mis à jour')
      }
      setIsCreating(false)
      setEditingMessage(null)
    } catch (error) {
      toast.error('Erreur')
    }
  }

  return (
    <Layout>
      <div className="p-6 bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Messages PromoBar</h1>
          <Button onClick={() => { setIsCreating(true); setFormData({ name: '', text: '', icon: 'truck', active: true }) }}>Nouveau</Button>
        </div>
        {isLoading ? <SkeletonTable rows={5} columns={4} /> : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Texte</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Icône</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {messages?.map(m => (
                <tr key={m.id}>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{m.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{m.text}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{m.icon}</td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <Button onClick={() => { setEditingMessage(m); setFormData({ name: m.name, text: m.text, icon: m.icon, active: m.active }) }} size="sm">Éditer</Button>
                    <Button onClick={() => setDeleteModal(m.id)} size="sm" variant="secondary">Supprimer</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {(isCreating || editingMessage) && (
        <Modal isOpen={true} onClose={() => { setIsCreating(false); setEditingMessage(null) }} title={isCreating ? 'Nouveau message' : 'Éditer message'}>
          <div className="space-y-4">
            <input type="text" placeholder="Nom" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
            <input type="text" placeholder="Texte" value={formData.text} onChange={e => setFormData({ ...formData, text: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
            <select value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value as any })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100">
              <option value="truck">Camion (Livraison)</option>
              <option value="gift">Cadeau</option>
              <option value="star">Étoile</option>
              <option value="clock">Horloge</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button onClick={() => { setIsCreating(false); setEditingMessage(null) }} variant="secondary">Annuler</Button>
            <Button onClick={handleSave}>Sauvegarder</Button>
          </div>
        </Modal>
      )}
      <ToastContainer />
    </Layout>
  )
}
