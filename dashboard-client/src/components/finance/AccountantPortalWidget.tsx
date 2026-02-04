/**
 * Widget Portail Expert-Comptable - Dashboard CFO
 *
 * Affiche stats portail EC :
 * - Nombre clients EC assignés
 * - Commentaires non résolus
 * - Périodes en attente validation
 * - Dernières activités EC
 */

import { MessageSquare, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useAccountantDashboard } from '@/hooks/useAccountantPortal';
import { Button } from '@/components/common';

export function AccountantPortalWidget() {
  const { data, isLoading, error } = useAccountantDashboard();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-900 p-6">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">Erreur chargement portail EC</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const hasUnresolvedComments = data.unresolved_comments > 0;
  const hasPendingValidations = data.pending_validations > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Portail Expert-Comptable
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          Voir portail <ExternalLink className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Total Clients */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Clients EC</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.total_clients}
              </p>
            </div>
            <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
              <ExternalLink className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Factures Mois */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Factures mois</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.total_invoices_month}
              </p>
            </div>
            <div className="h-10 w-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Alertes */}
      <div className="space-y-2">
        {/* Commentaires non résolus */}
        {hasUnresolvedComments && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <MessageSquare className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                {data.unresolved_comments} commentaire{data.unresolved_comments > 1 ? 's' : ''} non résolu{data.unresolved_comments > 1 ? 's' : ''}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-yellow-700 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-200"
            >
              Voir
            </Button>
          </div>
        )}

        {/* Validations en attente */}
        {hasPendingValidations && (
          <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-orange-800 dark:text-orange-300">
                {data.pending_validations} période{data.pending_validations > 1 ? 's' : ''} en attente validation
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-orange-700 dark:text-orange-300 hover:text-orange-800 dark:hover:text-orange-200"
            >
              Valider
            </Button>
          </div>
        )}

        {/* Tout OK */}
        {!hasUnresolvedComments && !hasPendingValidations && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-800 dark:text-green-300">
              Toutes les périodes validées, aucun commentaire en attente
            </p>
          </div>
        )}
      </div>

      {/* CA Mois */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">CA mois en cours</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'EUR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(data.total_revenue_month)}
          </p>
        </div>
      </div>
    </div>
  );
}
