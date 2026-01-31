/**
 * Hook pour la gestion des événements Live Shopping
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface LiveEvent {
  id: number
  name: string
  title: string
  description: string
  thumbnail: string | null
  thumbnailUrl: string | null
  scheduledAt: string
  durationMinutes: number
  hostName: string
  host: string
  hostAvatar: string | null
  productIds: number[]
  productCount: number
  state: 'draft' | 'scheduled' | 'live' | 'ended' | 'cancelled'
  isLive: boolean
  viewersCount: number
  viewers: number
  notifySubscribers: boolean
  reminderHours: number
  streamUrl: string | null
  chatEnabled: boolean
  active: boolean
  sequence: number
}

export interface LiveEventFormData {
  id?: number
  name: string
  description?: string
  hostName: string
  scheduledAt: string
  durationMinutes?: number
  thumbnailUrl?: string
  state?: string
  notifySubscribers?: boolean
  reminderHours?: number
  streamUrl?: string
  chatEnabled?: boolean
  productIds?: number[]
  active?: boolean
}

// Fetch all live events (admin)
export function useLiveEvents(params?: { state?: string; active?: boolean }) {
  return useQuery({
    queryKey: ['live-events', params],
    queryFn: async () => {
      const response = await api.post<{ success: boolean; error?: string; liveEvents?: LiveEvent[] }>('/api/admin/live-events', params || {})
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors du chargement')
      }
      return response.data.liveEvents as LiveEvent[]
    },
  })
}

// Create live event
export function useCreateLiveEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: LiveEventFormData) => {
      const response = await api.post<{ success: boolean; error?: string; liveEvent?: LiveEvent }>('/api/admin/live-events/save', data)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la création')
      }
      return response.data.liveEvent as LiveEvent
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-events'] })
    },
  })
}

// Update live event
export function useUpdateLiveEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: LiveEventFormData & { id: number }) => {
      const response = await api.post<{ success: boolean; error?: string; liveEvent?: LiveEvent }>('/api/admin/live-events/save', data)
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la modification')
      }
      return response.data.liveEvent as LiveEvent
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-events'] })
    },
  })
}

// Delete live event
export function useDeleteLiveEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ success: boolean; error?: string }>(`/api/admin/live-events/${id}/delete`, {})
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur lors de la suppression')
      }
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-events'] })
    },
  })
}

// Go live
export function useGoLive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ success: boolean; error?: string; liveEvent?: LiveEvent }>(`/api/admin/live-events/${id}/go-live`, {})
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }
      return response.data.liveEvent as LiveEvent
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-events'] })
    },
  })
}

// End live
export function useEndLive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ success: boolean; error?: string; liveEvent?: LiveEvent }>(`/api/admin/live-events/${id}/end`, {})
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }
      return response.data.liveEvent as LiveEvent
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-events'] })
    },
  })
}

// Schedule event
export function useScheduleLiveEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ success: boolean; error?: string; liveEvent?: LiveEvent }>(`/api/admin/live-events/${id}/schedule`, {})
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erreur')
      }
      return response.data.liveEvent as LiveEvent
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-events'] })
    },
  })
}
