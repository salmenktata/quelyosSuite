

import React from "react";
import { Link } from "react-router-dom";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { api } from "@/lib/api";
import { GlassCard, GlassPanel, GlassListItem } from "@/components/ui/glass";
import { ArrowRight, PlayCircle, StopCircle, AlertTriangle } from "lucide-react";
import { ConfirmDialog } from "@/components/finance/ConfirmDialog";

const sectionsGroups = [
  {
    group: "Configuration de base",
    description: "Paramètres essentiels pour démarrer",
    icon: "⚙️",
    sections: [
      {
        title: "Devise & formats",
        desc: "Devise par défaut, thème et langue utilisateur.",
        href: "/dashboard/settings/devise",
        icon: "💰",
      },
      {
        title: "TVA & fiscalité",
        desc: "Activer la TVA, mode HT/TTC, taux disponibles.",
        href: "/dashboard/settings/tva",
        icon: "📊",
      },
    ],
  },
  {
    group: "Données métier",
    description: "Référentiels et classifications",
    icon: "🏷️",
    sections: [
      {
        title: "Catégories",
        desc: "Gérer les catégories de revenus et dépenses.",
        href: "/dashboard/settings/categories",
        icon: "🏷️",
      },
      {
        title: "Flux de paiement",
        desc: "Types de flux par défaut (CB, chèque, virement...).",
        href: "/dashboard/settings/flux",
        icon: "💳",
      },
    ],
  },
  {
    group: "Abonnement & Facturation",
    description: "Gérez votre plan et vos paiements",
    icon: "💳",
    sections: [
      {
        title: "Abonnement",
        desc: "Plan actuel, facturation, et gestion de l'abonnement.",
        href: "/dashboard/settings/billing",
        icon: "💳",
      },
    ],
  },
  {
    group: "Préférences & connexions",
    description: "Options avancées",
    icon: "🔧",
    sections: [
      {
        title: "Sécurité",
        desc: "Mot de passe, authentification à deux facteurs (2FA), sessions.",
        href: "/dashboard/settings/security",
        icon: "🔒",
      },
      {
        title: "Notifications & exports",
        desc: "Fréquence des emails, formats d'export.",
        href: "/dashboard/settings/notifications",
        icon: "🔔",
      },
      {
        title: "Intégrations",
        desc: "Connexions externes, webhooks, API.",
        href: "/dashboard/settings/integrations",
        icon: "🔌",
      },
    ],
  },
];

const oldSections = [
  {
    title: "Devise & formats",
    desc: "Devise par défaut, thème et langue utilisateur.",
    href: "/dashboard/settings/devise",
  },
  {
    title: "TVA & fiscalité",
    desc: "Activer la TVA, mode HT/TTC, taux disponibles.",
    href: "/dashboard/settings/tva",
  },
  {
    title: "Catégories",
    desc: "Gérer les catégories de revenus et dépenses.",
    href: "/dashboard/settings/categories",
  },
  {
    title: "Flux de paiement",
    desc: "Types de flux par défaut (CB, chèque, virement...).",
    href: "/dashboard/settings/flux",
  },
  {
    title: "Comptes & portefeuilles",
    desc: "Règles de visibilité et statut actif/inactif.",
    href: "/dashboard/settings/comptes",
  },
  {
    title: "Notifications & exports",
    desc: "Fréquence des emails, formats d’export.",
    href: "/dashboard/settings/notifications",
  },
  {
    title: "Intégrations",
    desc: "Connexions externes, webhooks, API.",
    href: "/dashboard/settings/integrations",
  },
];

export default function SettingsOverviewPage() {
  useRequireAuth();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isDemoActive, setIsDemoActive] = React.useState(false);
  const [checkingStatus, setCheckingStatus] = React.useState(true);
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
        console.error("Erreur lors de la vérification du statut démo:", e);
      } finally {
        setCheckingStatus(false);
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
    }
  }

  return (
    <div className="relative space-y-6 text-white">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute -right-40 top-40 h-[400px] w-[400px] rounded-full bg-purple-500/20 blur-[120px]" />
      </div>

      <div className="relative space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Paramètres</p>
        <h1 className="bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-3xl font-semibold text-transparent">
          Vue d&apos;ensemble
        </h1>
        <p className="text-sm text-indigo-100/80">
          Choisissez une rubrique pour configurer votre espace.
        </p>
      </div>

      <div className="relative space-y-8">
        {/* Configuration de base */}
        <div data-guide="settings-profile">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <h2 className="text-lg font-semibold text-white">Configuration de base</h2>
              <p className="text-sm text-slate-400">Paramètres essentiels pour démarrer</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {sectionsGroups[0].sections.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:shadow-xl hover:shadow-indigo-500/5"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{s.icon}</span>
                    <p className="text-sm font-semibold text-white">{s.title}</p>
                  </div>
                  <p className="text-sm text-indigo-100/80">{s.desc}</p>
                </div>
                <div className="mt-4 flex items-center gap-2 text-indigo-200 group-hover:text-white transition">
                  <span className="text-xs font-medium">Configurer</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Données métier */}
        <div data-guide="settings-preferences">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-2xl">🏷️</span>
            <div>
              <h2 className="text-lg font-semibold text-white">Données métier</h2>
              <p className="text-sm text-slate-400">Référentiels et classifications</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {sectionsGroups[1].sections.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:shadow-xl hover:shadow-indigo-500/5"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{s.icon}</span>
                    <p className="text-sm font-semibold text-white">{s.title}</p>
                  </div>
                  <p className="text-sm text-indigo-100/80">{s.desc}</p>
                </div>
                <div className="mt-4 flex items-center gap-2 text-indigo-200 group-hover:text-white transition">
                  <span className="text-xs font-medium">Configurer</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Abonnement & Facturation */}
        <div data-guide="settings-billing">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-2xl">💳</span>
            <div>
              <h2 className="text-lg font-semibold text-white">Abonnement & Facturation</h2>
              <p className="text-sm text-slate-400">Gérez votre plan et vos paiements</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {sectionsGroups[2].sections.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:shadow-xl hover:shadow-indigo-500/5"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{s.icon}</span>
                    <p className="text-sm font-semibold text-white">{s.title}</p>
                  </div>
                  <p className="text-sm text-indigo-100/80">{s.desc}</p>
                </div>
                <div className="mt-4 flex items-center gap-2 text-indigo-200 group-hover:text-white transition">
                  <span className="text-xs font-medium">Configurer</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Préférences & connexions */}
        <div data-guide="settings-notifications">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-2xl">🔧</span>
            <div>
              <h2 className="text-lg font-semibold text-white">Préférences & connexions</h2>
              <p className="text-sm text-slate-400">Options avancées</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {sectionsGroups[3].sections.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 hover:shadow-xl hover:shadow-indigo-500/5"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{s.icon}</span>
                    <p className="text-sm font-semibold text-white">{s.title}</p>
                  </div>
                  <p className="text-sm text-indigo-100/80">{s.desc}</p>
                </div>
                <div className="mt-4 flex items-center gap-2 text-indigo-200 group-hover:text-white transition">
                  <span className="text-xs font-medium">Configurer</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Section Mode Démo */}
      <GlassPanel gradient="purple" className="mt-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              {isDemoActive ? (
                <StopCircle className="h-5 w-5 text-orange-400" />
              ) : (
                <PlayCircle className="h-5 w-5 text-green-400" />
              )}
              <h3 className="text-lg font-semibold text-white">
                Mode Démo {isDemoActive ? "Actif" : "Inactif"}
              </h3>
            </div>
            <p className="text-sm text-indigo-100/80">
              {isDemoActive 
                ? "Les données fictives sont actuellement chargées. Vous pouvez les supprimer pour revenir à vos données réelles."
                : "Activez le mode démo pour tester l'application avec 110 transactions, 5 comptes, 3 portefeuilles et 15 catégories fictives."
              }
            </p>
            {!isDemoActive && (
              <GlassCard variant="subtle" className="mt-3 flex items-start gap-2 border-amber-500/20 bg-amber-500/10 p-3">
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-200">
                  <strong>Protection active :</strong> L&apos;activation échouera si des données réelles existent déjà dans votre espace. 
                  Cela évite toute suppression accidentelle.
                </p>
              </GlassCard>
            )}
          </div>
          <button
            className={`flex items-center gap-2 rounded-xl px-6 py-3 font-bold shadow-lg transition disabled:opacity-50 ${
              isDemoActive 
                ? "bg-red-600 text-white shadow-red-500/25 hover:bg-red-700" 
                : "bg-green-600 text-white shadow-green-500/25 hover:bg-green-700"
            }`}
            onClick={handleDemoToggle}
            disabled={loading || checkingStatus}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Traitement...</span>
              </>
            ) : isDemoActive ? (
              <>
                <StopCircle className="h-4 w-4" />
                <span>Désactiver le mode démo</span>
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                <span>Activer le mode démo</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <GlassCard variant="subtle" className="mt-4 border-rose-500/30 bg-rose-500/10 p-3">
            <p className="text-sm text-rose-200">{error}</p>
          </GlassCard>
        )}

        {showToast && (
          <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 max-w-md rounded-xl border border-white/20 bg-indigo-700/90 backdrop-blur-xl px-6 py-4 text-white shadow-2xl shadow-indigo-500/25 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 mt-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold whitespace-pre-line">{toastMessage.split('\n\n')[0]}</p>
                {toastMessage.includes('\n\n') && (
                  <div className="mt-2 space-y-1">
                    {toastMessage.split('\n\n')[1]?.split('\n').map((line, i) => (
                      <p key={i} className="text-xs text-indigo-100">{line}</p>
                    ))}
                  </div>
                )}
                <p className="text-xs text-indigo-200 mt-2">Actualisation en cours...</p>
              </div>
            </div>
          </div>
        )}
      </GlassPanel>

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
