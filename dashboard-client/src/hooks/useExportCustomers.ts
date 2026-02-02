import { useState } from 'react'
import { api } from '../lib/api'

/**
 * Hook pour gérer l'export CSV des clients
 */
export function useExportCustomers() {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportCSV = async (search?: string) => {
    setIsExporting(true)
    setError(null)

    try {
      const response = await api.exportCustomersCSV({ search })

      if (!response.success || !response.data) {
        throw new Error("Erreur lors de l'export CSV")
      }

      const { customers, columns } = response.data
      const headers = columns.map((col: { label: string }) => col.label).join(',')
      const rows = customers.map((customer: Record<string, unknown>) =>
        columns
          .map((col: { key: string }) => {
            const value = customer[col.key as keyof typeof customer]
            const stringValue = String(value ?? '')
            // Échapper les valeurs contenant des virgules, guillemets ou retours à la ligne
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`
            }
            return stringValue
          })
          .join(',')
      )

      const csvContent = [headers, ...rows].join('\n')
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `clients_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return true
    } catch (_err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'export CSV"
      setError(errorMessage)
      return false
    } finally {
      setIsExporting(false)
    }
  }

  return {
    exportCSV,
    isExporting,
    error,
  }
}
