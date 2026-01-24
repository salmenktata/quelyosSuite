import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useInvoices(params?: {
  limit?: number
  offset?: number
  state?: string
  payment_state?: string
  search?: string
}) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => api.getInvoices(params),
  })
}

export function useInvoice(id: number) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.getInvoice(id),
    enabled: !!id,
  })
}

export function useCreateInvoiceFromOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: number) => api.createInvoiceFromOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function usePostInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invoiceId: number) => api.postInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice'] })
    },
  })
}

export function useSendInvoiceEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invoiceId: number) => api.sendInvoiceEmail(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice'] })
    },
  })
}

export function useDownloadInvoicePDF() {
  return useMutation({
    mutationFn: async (data: { invoiceId: number; invoiceName: string }) => {
      const blob = await api.getInvoicePDF(data.invoiceId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${data.invoiceName}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    },
  })
}
