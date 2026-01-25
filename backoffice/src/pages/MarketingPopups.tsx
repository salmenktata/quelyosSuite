import { useState } from 'react'
import { Layout } from '../components/Layout'
import { useMarketingPopups, useCreateMarketingPopup, useUpdateMarketingPopup, useDeleteMarketingPopup, MarketingPopup } from '../hooks/useMarketingPopups'
import { Button, Modal, SkeletonTable } from '../components/common'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/common/Toast'

export default function MarketingPopupsPage() {
  const [editingPopup, setEditingPopup] = useState<MarketingPopup | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'trigger' | 'design'>('general')
  const { data: popups, isLoading } = useMarketingPopups()
  const createMutation = useCreateMarketingPopup()
  const updateMutation = useUpdateMarketingPopup()
  const deleteMutation = useDeleteMarketingPopup()
  const toast = useToast()

  const [formData, setFormData] = useState<Partial<MarketingPopup>>({
    name: '',
    popup_type: 'promotion',
    title: '',
    subtitle: '',
    content: '',
    cta_text: 'En savoir plus',
    cta_link: '/products',
    cta_color: '#01613a',
    show_close_button: true,
    close_text: 'Non merci',
    trigger_type: 'delay',
    trigger_delay: 3,
    trigger_scroll_percent: 50,
    target_pages: 'all',
    show_once_per_session: true,
    show_once_per_user: false,
    cookie_duration_days: 30,
    position: 'center',
    overlay_opacity: 0.5,
    max_width: 500,
    background_color: '#ffffff',
    text_color: '#000000',
    sequence: 10,
    active: true,
  })

  const handleSave = async () => {
    try {
      if (isCreating) {
        await createMutation.mutateAsync(formData)
        toast.success('Popup créée')
      } else if (editingPopup) {
        await updateMutation.mutateAsync({ id: editingPopup.id, ...formData })
        toast.success('Popup mise à jour')
      }
      setIsCreating(false)
      setEditingPopup(null)
      setActiveTab('general')
    } catch (error) {
      toast.error('Erreur')
    }
  }

  const getConversionColor = (rate?: number) => {
    if (!rate) return 'text-gray-400'
    if (rate >= 5) return 'text-green-600 dark:text-green-400'
    if (rate >= 2) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <Layout>
      <div className="p-6 bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Popups Marketing</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérer les popups promotionnelles et d'engagement</p>
          </div>
          <Button onClick={() => { setIsCreating(true); setFormData({ name: '', popup_type: 'promotion', title: '', subtitle: '', content: '', cta_text: 'En savoir plus', cta_link: '/products', cta_color: '#01613a', show_close_button: true, close_text: 'Non merci', trigger_type: 'delay', trigger_delay: 3, trigger_scroll_percent: 50, target_pages: 'all', show_once_per_session: true, show_once_per_user: false, cookie_duration_days: 30, position: 'center', overlay_opacity: 0.5, max_width: 500, background_color: '#ffffff', text_color: '#000000', sequence: 10, active: true }) }}>Nouveau</Button>
        </div>

        {isLoading ? <SkeletonTable rows={5} columns={7} /> : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Déclencheur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pages</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Vues</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Conv. %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {popups?.map(p => (
                <tr key={p.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{p.popup_type}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{p.trigger_type}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{p.target_pages}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{p.views_count || 0}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`font-bold ${getConversionColor(p.conversion_rate)}`}>
                      {p.conversion_rate?.toFixed(1) || 0}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <Button onClick={() => { setEditingPopup(p); setFormData(p); setActiveTab('general') }} size="sm">Éditer</Button>
                    <Button onClick={async () => { if (confirm('Supprimer cette popup ?')) { await deleteMutation.mutateAsync(p.id); toast.success('Popup supprimée') } }} size="sm" variant="secondary">Supprimer</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(isCreating || editingPopup) && (
        <Modal isOpen={true} onClose={() => { setIsCreating(false); setEditingPopup(null); setActiveTab('general') }} title={isCreating ? 'Nouvelle popup' : 'Éditer popup'} size="xl">
          <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-4">
              <button onClick={() => setActiveTab('general')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'general' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 dark:text-gray-400'}`}>Général</button>
              <button onClick={() => setActiveTab('trigger')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'trigger' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 dark:text-gray-400'}`}>Déclencheur</button>
              <button onClick={() => setActiveTab('design')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'design' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 dark:text-gray-400'}`}>Design</button>
            </nav>
          </div>

          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nom interne</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                  <select value={formData.popup_type} onChange={e => setFormData({ ...formData, popup_type: e.target.value as any })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100">
                    <option value="newsletter">Newsletter</option>
                    <option value="promotion">Promotion/Offre</option>
                    <option value="announcement">Annonce</option>
                    <option value="exit_intent">Exit Intent</option>
                    <option value="welcome">Bienvenue</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Titre</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sous-titre</label>
                <input type="text" value={formData.subtitle || ''} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contenu HTML</label>
                <textarea rows={4} value={formData.content || ''} onChange={e => setFormData({ ...formData, content: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Texte bouton CTA</label>
                  <input type="text" value={formData.cta_text} onChange={e => setFormData({ ...formData, cta_text: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lien CTA</label>
                  <input type="text" value={formData.cta_link} onChange={e => setFormData({ ...formData, cta_link: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trigger' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type de déclencheur</label>
                <select value={formData.trigger_type} onChange={e => setFormData({ ...formData, trigger_type: e.target.value as any })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100">
                  <option value="immediate">Immédiat (au chargement)</option>
                  <option value="delay">Après délai</option>
                  <option value="scroll">Après scroll %</option>
                  <option value="exit_intent">Exit Intent</option>
                </select>
              </div>
              {formData.trigger_type === 'delay' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Délai (secondes)</label>
                  <input type="number" min="0" value={formData.trigger_delay} onChange={e => setFormData({ ...formData, trigger_delay: parseInt(e.target.value) })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
                </div>
              )}
              {formData.trigger_type === 'scroll' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scroll % (0-100)</label>
                  <input type="number" min="0" max="100" value={formData.trigger_scroll_percent} onChange={e => setFormData({ ...formData, trigger_scroll_percent: parseInt(e.target.value) })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pages ciblées</label>
                <select value={formData.target_pages} onChange={e => setFormData({ ...formData, target_pages: e.target.value as any })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100">
                  <option value="all">Toutes les pages</option>
                  <option value="home">Homepage uniquement</option>
                  <option value="products">Pages produits</option>
                  <option value="cart">Panier</option>
                  <option value="custom">Pages spécifiques</option>
                </select>
              </div>
              {formData.target_pages === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pages spécifiques (séparées par virgules)</label>
                  <input type="text" placeholder="/about,/contact" value={formData.custom_pages || ''} onChange={e => setFormData({ ...formData, custom_pages: e.target.value })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
                </div>
              )}
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={formData.show_once_per_session} onChange={e => setFormData({ ...formData, show_once_per_session: e.target.checked })} className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Afficher 1 fois par session</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={formData.show_once_per_user} onChange={e => setFormData({ ...formData, show_once_per_user: e.target.checked })} className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Afficher 1 fois par utilisateur (cookie)</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'design' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Position</label>
                  <select value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value as any })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100">
                    <option value="center">Centre (modal)</option>
                    <option value="bottom_right">Bas droite</option>
                    <option value="bottom_left">Bas gauche</option>
                    <option value="top_banner">Bandeau haut</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Largeur max (px)</label>
                  <input type="number" min="300" max="800" value={formData.max_width} onChange={e => setFormData({ ...formData, max_width: parseInt(e.target.value) })} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Couleur fond</label>
                  <input type="color" value={formData.background_color} onChange={e => setFormData({ ...formData, background_color: e.target.value })} className="w-full h-10 border dark:border-gray-600 rounded cursor-pointer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Couleur texte</label>
                  <input type="color" value={formData.text_color} onChange={e => setFormData({ ...formData, text_color: e.target.value })} className="w-full h-10 border dark:border-gray-600 rounded cursor-pointer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Couleur CTA</label>
                  <input type="color" value={formData.cta_color} onChange={e => setFormData({ ...formData, cta_color: e.target.value })} className="w-full h-10 border dark:border-gray-600 rounded cursor-pointer" />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t dark:border-gray-700">
            <Button onClick={() => { setIsCreating(false); setEditingPopup(null); setActiveTab('general') }} variant="secondary">Annuler</Button>
            <Button onClick={handleSave}>Sauvegarder</Button>
          </div>
        </Modal>
      )}

      <ToastContainer />
    </Layout>
  )
}
