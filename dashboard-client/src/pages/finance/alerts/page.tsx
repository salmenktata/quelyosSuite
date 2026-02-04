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
      <div className="![animation:none] p-4 md:p-8 space-y-6">
        <Breadcrumbs items={[
          { label: "Finance", href: "/finance" },
          { label: "Alertes" }
        ]} />

        <div className="![animation:none] flex items-center justify-between">
          <div className="![animation:none] flex items-start gap-4">
            <div className="![animation:none] rounded-lg bg-indigo-100 dark:bg-indigo-900/30 p-3">
              <Bell className="![animation:none] h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="![animation:none] text-3xl font-bold text-gray-900 dark:text-white">
                Alertes
              </h1>
              <p className="![animation:none] mt-1 text-sm text-gray-600 dark:text-gray-400">
                Configurez et gérez vos alertes financières
              </p>
            </div>
          </div>
        </div>

        <PageNotice config={financeNotices.alerts} className="![animation:none] mb-6" />

        <div className="![animation:none] bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
          <div className="![animation:none] inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
            <Bell className="![animation:none] w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="![animation:none] text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Page en cours de développement
          </h3>
          <p className="![animation:none] text-sm text-gray-600 dark:text-gray-400">
            La gestion des alertes sera bientôt disponible.
          </p>
        </div>
      </div>
    </Layout>
  );
}
