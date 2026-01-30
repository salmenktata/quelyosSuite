import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tokenService } from '@/lib/tokenService'
import type { Ticket, CreateTicketData, TicketMessage } from '@/types/support'

const API_URL = import.meta.env.VITE_API_URL || ''

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  const accessToken = tokenService.getAccessToken()
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  return headers
}

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
      const params = new URLSearchParams()
      if (filters?.state) params.append('state', filters.state)
      if (filters?.priority) params.append('priority', filters.priority)
      if (filters?.category) params.append('category', filters.category)
      if (filters?.search) params.append('search', filters.search)

      const queryString = params.toString()
      const endpoint = queryString ? `/api/tickets?${queryString}` : '/api/tickets'

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data as { success: boolean; tickets: Ticket[]; total: number }
    },
  })
}

export function useTicketDetail(ticketId: number | null) {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      if (!ticketId) return null

      const response = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data as { success: boolean; ticket: Ticket; messages: TicketMessage[] }
    },
    enabled: !!ticketId,
  })
}

export function useCreateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTicketData) => {
      const response = await fetch(`${API_URL}/api/tickets`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result as { success: boolean; ticket: Ticket }
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
      const response = await fetch(`${API_URL}/api/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result as { success: boolean; message: TicketMessage }
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
      const response = await fetch(`${API_URL}/api/tickets/${ticketId}/close`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result as { success: boolean; ticket: Ticket }
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
      const response = await fetch(`${API_URL}/api/tickets/${ticketId}/rate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result as { success: boolean; ticket: Ticket }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}
