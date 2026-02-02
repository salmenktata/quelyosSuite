import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'

interface UseTaxReportsParams {
  year?: number
  country?: string
}

interface TaxReport {
  id: number
  state: string
  vatCollected: number
  vatDeductible: number
  vatNet: number
  month?: string
  year?: number
}

export function useTaxReports(params: UseTaxReportsParams = {}) {
  const [reports, setReports] = useState<TaxReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiClient.post<{
        success: boolean;
        data: {
          reports: TaxReport[];
        };
        error?: string;
      }>('/finance/tax-reports', params)
      if (response.data.success && response.data.data) setReports(response.data.data.reports)
      else setError(response.data.error || null)
    } catch (_err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const generate = async (year: number, month: number, country: string) => {
    const response = await apiClient.post('/finance/tax-reports/generate', { year, month, country })
    if (response.data.success) {
      fetchReports()
      alert('Déclaration générée')
    }
  }

  const exportEdiTva = async (reportId: number) => {
    const url = `${import.meta.env.VITE_BACKEND_URL}/api/finance/tax-reports/${reportId}/export-edi-tva`
    const a = document.createElement('a')
    a.href = url
    a.download = `edi-tva-${reportId}.xml`
    a.click()
  }

  const submit = async (_reportId: number) => {
    if (confirm('Confirmer la soumission ?')) {
      // TODO: Implémenter endpoint submit
      fetchReports()
      alert('Déclaration soumise')
    }
  }

  return { reports, loading, error, generate, exportEdiTva, submit, reload: fetchReports }
}
