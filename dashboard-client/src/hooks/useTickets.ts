import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchApi, buildQueryString } from '@/lib/api-base'
import { tokenService } from '@/lib/tokenService'
import type { Ticket, CreateTicketData, TicketMessage } from '@/types'

interface TicketsFilters {
  state?: string
  priority?: string
  category?: string
  search?: string
}

export function useTickets(filters?: TicketsFilters) {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      const qs = buildQueryString({
        state: filters?.state,
        priority: filters?.priority,
        category: filters?.category,
        search: filters?.search,
      })
      return fetchApi<{ success: boolean; tickets: Ticket[]; total: number }>(
        `/api/tickets${qs}`,
        { method: 'GET', credentials: 'include' }
      )
    },
  })
}

export function useTicketDetail(ticketId: number | null) {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      if (!ticketId) return null
      return fetchApi<{ success: boolean; ticket: Ticket; messages: TicketMessage[] }>(
        `/api/tickets/${ticketId}`,
        { method: 'GET', credentials: 'include' }
      )
    },
    enabled: !!ticketId,
  })
}

export function useCreateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTicketData) => {
      return fetchApi<{ success: boolean; ticket: Ticket }>(
        '/api/tickets',
        { method: 'POST', credentials: 'include', body: JSON.stringify(data) }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useReplyTicket(ticketId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (content: string) => {
      return fetchApi<{ success: boolean; message: TicketMessage }>(
        `/api/tickets/${ticketId}/reply`,
        { method: 'POST', credentials: 'include', body: JSON.stringify({ content }) }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useCloseTicket(ticketId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return fetchApi<{ success: boolean; ticket: Ticket }>(
        `/api/tickets/${ticketId}/close`,
        { method: 'PATCH', credentials: 'include' }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useRateTicket(ticketId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { rating: string; comment?: string }) => {
      return fetchApi<{ success: boolean; ticket: Ticket }>(
        `/api/tickets/${ticketId}/rate`,
        { method: 'POST', credentials: 'include', body: JSON.stringify(data) }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export interface Template {
  id: number
  name: string
  content: string
  category: string
  sequence: number
  active: boolean
  created_at: string
}

export function useTemplates() {
  return useQuery({
    queryKey: ['ticket-templates'],
    queryFn: async () => {
      return fetchApi<{ success: boolean; templates: Template[] }>(
        '/api/tickets/templates',
        { method: 'GET', credentials: 'include' }
      )
    },
  })
}

export interface Attachment {
  id: number
  name: string
  mimetype: string
  file_size: number
  created_at: string
  url: string
}

export function useTicketAttachments(ticketId: number | null) {
  return useQuery({
    queryKey: ['ticket-attachments', ticketId],
    queryFn: async () => {
      if (!ticketId) return null
      return fetchApi<{ success: boolean; attachments: Attachment[] }>(
        `/api/tickets/${ticketId}/attachments`,
        { method: 'GET', credentials: 'include' }
      )
    },
    enabled: !!ticketId,
  })
}

export function useUploadAttachment(ticketId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      const accessToken = tokenService.getAccessToken()
      const headers: HeadersInit = {}
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      // FormData upload — use raw fetch (fetchApi forces Content-Type: application/json)
      const { API_BASE_URL } = await import('@/lib/api-base')
      const response = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/attachments`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `HTTP error! status: ${response.status}`)
      }

      return response.json() as Promise<{ success: boolean; attachment: Attachment }>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-attachments', ticketId] })
    },
  })
}

export function useDeleteAttachment(ticketId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (attachmentId: number) => {
      return fetchApi<{ success: boolean }>(
        `/api/attachments/${attachmentId}`,
        { method: 'DELETE', credentials: 'include' }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-attachments', ticketId] })
    },
  })
}
