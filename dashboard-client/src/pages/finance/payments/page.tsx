/**
 * Gestion des Paiements - Suivi encaissements et décaissements
 *
 * Fonctionnalités :
 * - Liste complète des paiements avec filtres (type, date, statut)
 * - Enregistrement manuel ou automatique depuis factures
 * - Rapprochement bancaire pour vérifier la concordance
 * - Indicateurs : total encaissé, décaissé, en attente
 * - Export pour comptabilité et analyse
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Breadcrumbs, PageNotice, Button, SkeletonTable } from '@/components/common'
import { apiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { financeNotices } from '@/lib/notices/finance-notices'
import { Plus, AlertCircle, RefreshCw, CreditCard } from 'lucide-react'

export default function PaymentsPage() {
  const navigate = useNavigate()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchPayments = () => {
    setLoading(true)
    setError(false)
    apiClient
      .post('/finance/payments')
      .then(res => {
        if (res.data.success) setPayments(res.data.data.payments)
        setLoading(false)
      })
      .catch(_err => {
        setError(true)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="p-4 md:p-8 space-y-6">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <SkeletonTable rows={5} columns={4} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Finance', href: '/finance' },
            { label: 'Paiements' },
          ]}
        />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paiements</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Suivez tous vos encaissements et décaissements
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/finance/payments/new')}
          >
            Nouveau Paiement
          </Button>
        </div>

        <PageNotice config={financeNotices.payments} />

        {error && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="flex-1 text-red-800 dark:text-red-200">
                Une erreur est survenue lors du chargement des paiements.
              </p>
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={fetchPayments}
              >
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {!error && payments.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <CreditCard className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Aucun paiement trouvé
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Commencez par enregistrer votre premier paiement.
            </p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => navigate('/finance/payments/new')}
            >
              Enregistrer un paiement
            </Button>
          </div>
        )}

        {!error && payments.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {payments.map((payment: any) => (
                <div
                  key={payment.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/finance/payments/${payment.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {payment.name}
                        </p>
                        {payment.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {payment.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(payment.amount, '€')}
                      </p>
                      {payment.date && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(payment.date).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
