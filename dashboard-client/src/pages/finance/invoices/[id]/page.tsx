/**
 * Page Détail Facture Client
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, Button } from '@/components/common'
import { Download, Mail, CheckCircle, Copy, FileText } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetchInvoice()
  }, [id])

  const fetchInvoice = async () => {
    const response = await apiClient.post(`/finance/invoices/${id}`)
    if (response.data.success) setInvoice(response.data.data)
    setLoading(false)
  }

  if (loading || !invoice) return <Layout><div>Chargement...</div></Layout>

  return (
    <Layout>
      <Breadcrumbs
        items={[
          { label: 'Finance', path: '/finance' },
          { label: 'Factures', path: '/finance/invoices' },
          { label: invoice.name, path: `/finance/invoices/${id}` },
        ]}
      />
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{invoice.name}</h1>
        <p className="text-gray-600 dark:text-gray-400">Client: {invoice.customer.name}</p>
        <p className="text-gray-600 dark:text-gray-400">Total: {formatCurrency(invoice.amountTotal, '€')}</p>
      </div>
    </Layout>
  )
}
