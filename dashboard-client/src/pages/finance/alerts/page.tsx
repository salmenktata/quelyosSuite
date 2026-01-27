/**
 * Page Alertes Finance
 *
 * Fonctionnalités :
 * - Configuration des seuils d'alerte budgétaire
 * - Alertes de trésorerie critique (seuil minimal configurable)
 * - Notifications de dépassement de budget par catégorie
 * - Historique complet des alertes déclenchées
 * - Gestion des destinataires (email, SMS, notifications in-app)
 * - Tableau de bord des alertes actives vs résolues
 */
import { Layout } from "@/components/Layout";
import { Breadcrumbs, PageNotice } from "@/components/common";
import { financeNotices } from "@/lib/notices/finance-notices";
import { Bell } from "lucide-react";

export default function AlertsPage() {
  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs items={[
          { label: "Finance", href: "/finance" },
          { label: "Alertes" }
        ]} />

        <div className="flex items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-indigo-100 dark:bg-indigo-900/30 p-3">
              <Bell className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Alertes
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Configurez et gérez vos alertes financières
              </p>
            </div>
          </div>
        </div>

        <PageNotice config={financeNotices.alerts} className="mb-6" />

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
            <Bell className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Page en cours de développement
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            La gestion des alertes sera bientôt disponible.
          </p>
        </div>
      </div>
    </Layout>
  );
}
