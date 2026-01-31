/**
 * Page Live Events - Gestion des événements Live Shopping
 *
 * Fonctionnalités :
 * - Liste des événements avec statut (brouillon, planifié, en direct, terminé)
 * - Création/édition d'événements
 * - Démarrer/Terminer un live
 * - Associer des produits à un événement
 * - Statistiques viewers
 */
import { useState } from 'react'
import { logger } from '@quelyos/logger';
import {
  Plus,
  Trash2,
  Save,
  X,
  Video,
  Calendar,
  Play,
  Square,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common'
import { storeNotices } from '@/lib/notices'
import { useToast } from '@/hooks/useToast'
  useLiveEvents,
  useCreateLiveEvent,
  useUpdateLiveEvent,
  useDeleteLiveEvent,
  useGoLive,
  useEndLive,
  useScheduleLiveEvent,
  LiveEvent,
  LiveEventFormData,
} from '@/hooks/useLiveEvents'

const STATE_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-900 dark:text-white dark:bg-gray-700 dark:text-gray-300', icon: <Clock className="h-3 w-3" /> },
  scheduled: { label: 'Planifié', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: <Calendar className="h-3 w-3" /> },
  live: { label: 'En direct', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <Video className="h-3 w-3" /> },
  ended: { label: 'Terminé', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle className="h-3 w-3" /> },
  cancelled: { label: 'Annulé', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: <AlertCircle className="h-3 w-3" /> },
}

export default function LiveEvents() {
  const [editing, setEditing] = useState<LiveEvent | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const { data: events, isLoading, error } = useLiveEvents()
  const createMutation = useCreateLiveEvent()
  const updateMutation = useUpdateLiveEvent()
  const deleteMutation = useDeleteLiveEvent()
  const goLiveMutation = useGoLive()
  const endLiveMutation = useEndLive()
  const scheduleMutation = useScheduleLiveEvent()
  const toast = useToast()

  const [formData, setFormData] = useState<LiveEventFormData>({
    name: '',
    description: '',
    hostName: '',
    scheduledAt: '',
    durationMinutes: 60,
    thumbnailUrl: '',
    notifySubscribers: true,
    reminderHours: 24,
    chatEnabled: true,
    active: true,
  })

  const handleNew = () => {
    setIsCreating(true)
    setEditing(null)
    setFormData({
      name: '',
      description: '',
      hostName: '',
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      durationMinutes: 60,
      thumbnailUrl: '',
      notifySubscribers: true,
      reminderHours: 24,
      chatEnabled: true,
      active: true,
    })
  }

  const handleEdit = (event: LiveEvent) => {
    setEditing(event)
    setIsCreating(false)
    setFormData({
      id: event.id,
      name: event.name,
      description: event.description || '',
      hostName: event.hostName || event.host,
      scheduledAt: event.scheduledAt ? event.scheduledAt.slice(0, 16) : '',
      durationMinutes: event.durationMinutes || 60,
      thumbnailUrl: event.thumbnailUrl || event.thumbnail || '',
      notifySubscribers: event.notifySubscribers,
      reminderHours: event.reminderHours || 24,
      chatEnabled: event.chatEnabled,
      active: event.active,
    })
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditing(null)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.hostName || !formData.scheduledAt) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      if (isCreating) {
        await createMutation.mutateAsync(formData)
        toast.success('Événement créé')
      } else if (editing) {
        await updateMutation.mutateAsync({ ...formData, id: editing.id })
        toast.success('Événement mis à jour')
      }
      handleCancel()
    } catch {
      logger.error("Erreur attrapée");
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet événement ?')) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Événement supprimé')
      if (editing?.id === id) handleCancel()
    } catch {
      logger.error("Erreur attrapée");
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleGoLive = async (id: number) => {
    try {
      await goLiveMutation.mutateAsync(id)
      toast.success('Live démarré !')
    } catch {
      logger.error("Erreur attrapée");
      toast.error('Erreur')
    }
  }

  const handleEndLive = async (id: number) => {
    try {
      await endLiveMutation.mutateAsync(id)
      toast.success('Live terminé')
    } catch {
      logger.error("Erreur attrapée");
      toast.error('Erreur')
    }
  }

  const handleSchedule = async (id: number) => {
    try {
      await scheduleMutation.mutateAsync(id)
      toast.success('Événement planifié')
    } catch {
      logger.error("Erreur attrapée");
      toast.error('Erreur')
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateStr))
  }

  const showForm = isCreating || editing

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Store', href: '/store' },
            { label: 'Live Shopping' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Video className="h-7 w-7 text-red-500" />
              Live Shopping
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Planifiez et gérez vos sessions de vente en direct
            </p>
          </div>
          {!showForm && (
            <Button onClick={handleNew} icon={<Plus className="h-4 w-4" />}>
              Nouveau Live
            </Button>
          )}
        </div>

        <PageNotice
          config={storeNotices.liveEvents || {
            type: 'info',
            title: 'Live Shopping',
            message: 'Créez des événements de vente en direct pour engager vos clients et booster vos ventes.',
          }}
          className="mb-6"
        />

        {error && (
          <div role="alert" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
            Erreur lors du chargement des événements
          </div>
        )}

        <div className={`grid gap-6 ${showForm ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Liste */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
            {isLoading ? (
              <div className="p-6">
                <SkeletonTable rows={5} columns={5} />
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Événement</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Statut</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {events?.map((event) => {
                    const stateInfo = STATE_LABELS[event.state] || STATE_LABELS.draft
                    return (
                      <tr
                        key={event.id}
                        className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          editing?.id === event.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                        }`}
                        onClick={() => handleEdit(event)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
                              {event.hostName?.[0] || 'L'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white dark:text-gray-100">{event.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">par {event.hostName || event.host}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(event.scheduledAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${stateInfo.color}`}>
                            {stateInfo.icon}
                            {stateInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {event.state === 'draft' && (
                              <button
                                onClick={() => handleSchedule(event.id)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                title="Planifier"
                              >
                                <Calendar className="h-4 w-4" />
                              </button>
                            )}
                            {event.state === 'scheduled' && (
                              <button
                                onClick={() => handleGoLive(event.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                title="Démarrer le live"
                              >
                                <Play className="h-4 w-4" />
                              </button>
                            )}
                            {event.state === 'live' && (
                              <button
                                onClick={() => handleEndLive(event.id)}
                                className="p-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                title="Terminer le live"
                              >
                                <Square className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(event.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {events?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                        Aucun événement live. Créez votre premier !
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Formulaire */}
          {showForm && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isCreating ? 'Nouvel événement' : 'Modifier'}
                </h2>
                <button onClick={handleCancel} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" aria-label="Fermer">
                  <X className="h-5 w-5 text-gray-500" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Titre *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ex: Nouveautés Printemps 2026"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="Décrivez votre événement..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                      Présentateur *
                    </label>
                    <input
                      type="text"
                      value={formData.hostName}
                      onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="Nom du présentateur"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                      Durée (min)
                    </label>
                    <input
                      type="number"
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 60 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      min={15}
                      max={480}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    Date et heure *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-gray-300 mb-1">
                    URL image de couverture
                  </label>
                  <input
                    type="url"
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifySubscribers}
                      onChange={(e) => setFormData({ ...formData, notifySubscribers: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-900 dark:text-white dark:text-gray-300">Notifier abonnés</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.chatEnabled}
                      onChange={(e) => setFormData({ ...formData, chatEnabled: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-900 dark:text-white dark:text-gray-300">Chat activé</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSave} icon={<Save className="h-4 w-4" />} className="flex-1">
                    {isCreating ? 'Créer' : 'Enregistrer'}
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
