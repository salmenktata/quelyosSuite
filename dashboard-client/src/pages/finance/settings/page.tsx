/**
 * Page : Paramètres Finance - Vue d'ensemble
 *
 * Fonctionnalités :
 * - Vue d'ensemble organisée par groupes de paramètres (Configuration, Données, Abonnement, Préférences)
 * - Navigation vers sous-pages de configuration (Devise, TVA, Catégories, Flux, Sécurité, etc.)
 * - Mode Démo : activation/désactivation avec 110 transactions, 5 comptes, 3 portefeuilles fictifs
 * - Protection contre activation démo si données réelles existent
 * - Confirmation avant activation/désactivation du mode démo
 * - Toast de feedback avec détail des changements effectués
 */

import React from "react";
import { Link } from "react-router-dom";
import { Breadcrumbs, PageNotice, SkeletonTable } from "@/components/common";
import { Button } from "@/components/common/Button";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { api } from "@/lib/finance/api";
import {
  Settings,
  ArrowRight,
  PlayCircle,
  StopCircle,
  AlertTriangle,
  Receipt,
  Tag,
  CreditCard
} from "lucide-react";
import { ConfirmDialog } from "@/components/finance/ConfirmDialog";
import { financeNotices } from "@/lib/notices/finance-notices";
import { logger } from '@quelyos/logger';

const settingsGroups = [
  {
    group: "Configuration Finance",
    description: "Paramètres spécifiques au module Finance",
    icon: Settings,
    sections: [
      {
        title: "TVA & fiscalité",
        desc: "Activer la TVA, mode HT/TTC, taux disponibles.",
        href: "/finance/settings/tva",
        icon: Receipt,
      },
      {
        title: "Catégories",
        desc: "Gérer les catégories de revenus et dépenses.",
        href: "/finance/settings/categories",
        icon: Tag,
      },
      {
        title: "Flux de paiement",
        desc: "Types de flux par défaut (CB, chèque, virement...).",
        href: "/finance/settings/flux",
        icon: CreditCard,
      },
    ],
  },
];

export default function SettingsOverviewPage() {
  useRequireAuth();
  const [loading, setLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDemoActive, setIsDemoActive] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<"activate" | "deactivate" | null>(null);

  // Vérifier le statut du mode démo au chargement
  React.useEffect(() => {
    async function checkDemoStatus() {
      try {
        const data = await api("/company/settings") as { isDemo?: boolean };
        setIsDemoActive(data.isDemo || false);
      } catch (e) {
        logger.error("Erreur lors de la vérification du statut démo:", e);
      } finally {
        setInitialLoading(false);
      }
    }
    checkDemoStatus();
  }, []);

  function handleDemoToggle() {
    const action = isDemoActive ? "deactivate" : "activate";
    setConfirmAction(action);
    setShowConfirm(true);
  }

  async function executeDemoToggle() {
    if (!confirmAction) return;

    setLoading(true);
    setError(null);
    try {
      const data = await api("/admin/demo-mode", {
        method: "POST",
        body: { action: confirmAction } as any,
      }) as {
        success?: boolean;
        message?: string;
        error?: string;
        warning?: string;
        changes?: {
          currency?: string;
          vat?: string;
          accounts?: string;
          transactions?: string;
        }
      };

      if (!data?.success) {
        throw new Error(data?.error || data?.warning || "Erreur lors de l'opération");
      }

      setIsDemoActive(!isDemoActive);

      // Message enrichi avec les modifications effectuées
      let message = data.message || (isDemoActive ? "Mode démo désactivé" : "Mode démo activé");
      if (data.changes && !isDemoActive) {
        message += "\n\n✓ " + Object.values(data.changes).join("\n✓ ");
      }

      setToastMessage(message);
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
        window.location.reload();
      }, 3500);
    } catch (e) {
      const error = e as Error;
      setError(error.message || "Erreur inconnue");
    } finally {
      setLoading(false);
      setConfirmAction(null);
      setShowConfirm(false);
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
          items={[
            { label: "Finance", href: "/finance" },
            { label: "Paramètres", href: "/finance/settings" },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-3">
              <Settings className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Paramètres Finance
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Choisissez une rubrique pour configurer votre espace
              </p>
            </div>
          </div>
        </div>

        <PageNotice
          config={financeNotices['settings']}
          className="mb-6"
        />

        {/* Notice redirection paramètres globaux */}
        <div className="mb-6 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
          <div className="flex items-start gap-3">
            <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Paramètres Globaux
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Les paramètres généraux de la plateforme (Devise, Abonnement, Sécurité, Notifications, Intégrations)
                ont été déplacés vers les <Link to="/dashboard/settings" className="underline font-medium hover:text-blue-600 dark:hover:text-blue-300">Paramètres Globaux</Link>.
              </p>
            </div>
          </div>
        </div>

        {initialLoading ? (
          <div className="space-y-8">
            <SkeletonTable rows={4} columns={2} />
            <SkeletonTable rows={4} columns={2} />
          </div>
        ) : (
          <div className="space-y-8">
            {settingsGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <div className="mb-4 flex items-center gap-3">
                  <group.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{group.group}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{group.description}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {group.sections.map((section) => (
                    <Link
                      key={section.href}
                      to={section.href}
                      className="group flex h-full flex-col justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm transition hover:shadow-md hover:border-emerald-500 dark:hover:border-emerald-600"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <section.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{section.title}</p>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{section.desc}</p>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 group-hover:gap-3 transition-all">
                        <span className="text-xs font-medium">Configurer</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {/* Section Mode Démo */}
            <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-6">
              <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {isDemoActive ? (
                      <StopCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    ) : (
                      <PlayCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Mode Démo {isDemoActive ? "Actif" : "Inactif"}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {isDemoActive
                      ? "Les données fictives sont actuellement chargées. Vous pouvez les supprimer pour revenir à vos données réelles."
                      : "Activez le mode démo pour tester l'application avec 110 transactions, 5 comptes, 3 portefeuilles et 15 catégories fictives."
                    }
                  </p>
                  {!isDemoActive && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        <strong>Protection active :</strong> L'activation échouera si des données réelles existent déjà dans votre espace.
                        Cela évite toute suppression accidentelle.
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  variant={isDemoActive ? "danger" : "default"}
                  onClick={handleDemoToggle}
                  disabled={loading}
                  icon={isDemoActive ? <StopCircle className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
                  className="whitespace-nowrap"
                >
                  {loading ? "Traitement..." : (isDemoActive ? "Désactiver le mode démo" : "Activer le mode démo")}
                </Button>
              </div>

              {error && (
                <div role="alert" className="mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    <Button variant="secondary" size="sm" onClick={() => setError(null)}>
                      Fermer
                    </Button>
                  </div>
                </div>
              )}

              {showToast && (
                <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 max-w-md rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/90 backdrop-blur-xl px-6 py-4 shadow-2xl animate-slide-in-right">
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 mt-1.5 rounded-full bg-green-600 dark:bg-green-400 animate-pulse flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 dark:text-white whitespace-pre-line">{toastMessage.split('\n\n')[0]}</p>
                      {toastMessage.includes('\n\n') && (
                        <div className="mt-2 space-y-1">
                          {toastMessage.split('\n\n')[1]?.split('\n').map((line, i) => (
                            <p key={i} className="text-xs text-gray-700 dark:text-gray-300">{line}</p>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Actualisation en cours...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeDemoToggle}
        title={confirmAction === "deactivate" ? "Supprimer les données démo ?" : "Activer le mode démo ?"}
        message={
          confirmAction === "deactivate"
            ? "Êtes-vous sûr de vouloir SUPPRIMER toutes les données démo ?\n\n⚠️ Cette action est irréversible."
            : "Êtes-vous sûr de vouloir activer le mode démo ?\n\n✓ Cela créera 110 transactions, 5 comptes, 3 portefeuilles et 15 catégories.\n⚠️ Cette action échouera si des données réelles existent déjà."
        }
        variant={confirmAction === "deactivate" ? "danger" : "warning"}
        confirmText={confirmAction === "deactivate" ? "Supprimer" : "Activer"}
        cancelText="Annuler"
      />
    </div>
  );
}
