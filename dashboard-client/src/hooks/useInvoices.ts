import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

interface UseInvoicesParams {
  status?: string
  paymentState?: string
  dateFrom?: string
  dateTo?: string
}

interface InvoiceLocal {
  id: number
  name: string
  state: 'draft' | 'posted' | 'cancel'
  paymentState: string
  customer: {
    id: number
    name: string
    email: string
  }
  invoiceDate: string
  dueDate: string
  amountTotal: number
  amountResidual: number
  currency: {
    symbol: string
  }
}

interface Stats {
  totalInvoiced: number
  totalPaid: number
  totalPending: number
  totalOverdue: number
}

export function useInvoices(params: UseInvoicesParams = {}) {
  const [invoices, setInvoices] = useState<InvoiceLocal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetchInvoices()
  }, [params.status, params.paymentState, params.dateFrom, params.dateTo])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.post('/finance/invoices', params)
      
      if (response.data.success) {
        setInvoices(response.data.data.invoices)
        
        // Calculer stats
        const totalInvoiced = response.data.data.invoices.reduce(
          (sum: number, inv: InvoiceLocal) => sum + inv.amountTotal,
          0
        )
        const totalPaid = response.data.data.invoices
          .filter((inv: InvoiceLocal) => inv.paymentState === 'paid')
          .reduce((sum: number, inv: InvoiceLocal) => sum + inv.amountTotal, 0)
        const totalPending = response.data.data.invoices
          .filter((inv: InvoiceLocal) => inv.paymentState === 'not_paid')
          .reduce((sum: number, inv: InvoiceLocal) => sum + inv.amountResidual, 0)
        
        setStats({
          totalInvoiced,
          totalPaid,
          totalPending,
          totalOverdue: 0, // TODO: calculer avec date échéance
        })
      } else {
        setError(response.data.error || 'Erreur lors du chargement des factures')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur réseau'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const validate = async (invoiceId: number) => {
    try {
      const response = await apiClient.post(`/finance/invoices/${invoiceId}/validate`)
      if (response.data.success) {
        fetchInvoices() // Reload
      } else {
        throw new Error(response.data.error)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      alert(`Erreur: ${errorMessage}`)
    }
  }

  const sendEmail = async (invoiceId: number) => {
    try {
      const response = await apiClient.post(`/finance/invoices/${invoiceId}/send-email`)
      if (response.data.success) {
        alert('Email envoyé avec succès')
      } else {
        throw new Error(response.data.error)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      alert(`Erreur: ${errorMessage}`)
    }
  }

  const downloadPDF = async (invoiceId: number) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/finance/invoices/${invoiceId}/pdf`,
        {
          headers: {
            'X-Session-Id': localStorage.getItem('session_id') || '',
          },
        }
      )
      
      if (!response.ok) throw new Error('Erreur téléchargement')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      alert(`Erreur: ${errorMessage}`)
    }
  }

  return {
    invoices,
    loading,
    error,
    stats,
    validate,
    sendEmail,
    downloadPDF,
    reload: fetchInvoices,
  }
}
