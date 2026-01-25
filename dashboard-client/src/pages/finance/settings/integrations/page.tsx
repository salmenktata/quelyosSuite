

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { Loader2, Zap, Check, AlertCircle } from "lucide-react";

type Integration = {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  connectedAt?: string;
};

const AVAILABLE_INTEGRATIONS: Omit<Integration, "connected" | "connectedAt">[] = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Synchronisez vos transactions et factures",
    icon: "💳",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Recevez vos alertes directement dans Slack",
    icon: "💬",
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Connectez vos outils préférés via Zapier",
    icon: "⚡",
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    description: "Exportez automatiquement vers Google Sheets",
    icon: "📊",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Intégrez vos données Notion",
    icon: "📝",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Intégration pour développeurs",
    icon: "🐙",
  },
];

const STORAGE_KEY = "qyl_integrations";

export default function IntegrationsPage() {
  useRequireAuth();

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  function loadIntegrations() {
    setLoading(true);
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(STORAGE_KEY);
        const stored = raw ? JSON.parse(raw) : {};
        const items: Integration[] = AVAILABLE_INTEGRATIONS.map((base) => ({
          ...base,
          connected: stored[base.id]?.connected ?? false,
          connectedAt: stored[base.id]?.connectedAt,
        }));
        setIntegrations(items);
      }
    } catch (err) {
      console.error("Impossible de charger les intégrations", err);
      setIntegrations(
        AVAILABLE_INTEGRATIONS.map((base) => ({
          ...base,
          connected: false,
        }))
      );
    } finally {
      setLoading(false);
    }
  }

  async function connectIntegration(id: string) {
    setConnecting(id);
    try {
      // Simulate connection delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const updated = integrations.map((int) =>
        int.id === id
          ? { ...int, connected: true, connectedAt: new Date().toISOString() }
          : int
      );
      setIntegrations(updated);

      if (typeof window !== "undefined") {
        const stored: Record<string, { connected: boolean; connectedAt?: string }> = {};
        updated.forEach((int) => {
          stored[int.id] = { connected: int.connected, connectedAt: int.connectedAt };
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      }
    } catch (err) {
      console.error("Connexion échouée", err);
    } finally {
      setConnecting(null);
    }
  }

  async function disconnectIntegration(id: string) {
    if (!confirm("Êtes-vous sûr de vouloir déconnecter cette intégration ?")) return;
    setConnecting(id);
    try {
      const updated = integrations.map((int) =>
        int.id === id ? { ...int, connected: false, connectedAt: undefined } : int
      );
      setIntegrations(updated);

      if (typeof window !== "undefined") {
        const stored: Record<string, { connected: boolean; connectedAt?: string }> = {};
        updated.forEach((int) => {
          stored[int.id] = { connected: int.connected, connectedAt: int.connectedAt };
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      }
    } finally {
      setConnecting(null);
    }
  }

  return (
    <div className="space-y-6 text-white">
      {/* Background blur orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[400px] w-[400px] rounded-full bg-purple-500/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-emerald-500/20 blur-[120px]" />
      </div>

      <div className="relative">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Écosystème</p>
          <h1 className="bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-3xl font-semibold text-transparent">Intégrations</h1>
          <p className="text-sm text-indigo-100/80">Connectez vos outils préférés pour amplifier vos capacités.</p>
        </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-300" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="text-4xl">{integration.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold">{integration.name}</h3>
                    <p className="text-sm text-indigo-100/80">{integration.description}</p>
                  </div>
                </div>
                {integration.connected && (
                  <div className="rounded-full bg-emerald-500/15 border border-emerald-300/60 p-2">
                    <Check className="h-4 w-4 text-emerald-300" />
                  </div>
                )}
              </div>

              {integration.connected && integration.connectedAt && (
                <div className="flex items-center gap-2 text-xs text-indigo-100/60 border-t border-white/10 pt-4">
                  <AlertCircle className="h-3 w-3" />
                  Connecté depuis {new Date(integration.connectedAt).toLocaleDateString("fr-FR")}
                </div>
              )}

              <button
                onClick={() =>
                  integration.connected
                    ? disconnectIntegration(integration.id)
                    : connectIntegration(integration.id)
                }
                disabled={connecting === integration.id}
                className={`w-full flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  integration.connected
                    ? "border border-white/15 bg-white/5 text-indigo-100 hover:bg-white/10"
                    : "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg hover:from-indigo-400 hover:to-violet-400"
                } disabled:opacity-60`}
              >
                {connecting === integration.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    {integration.connected ? "Déconnecter" : "Connecter"}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <h3 className="font-semibold">Vous cherchez une autre intégration ?</h3>
        <p className="text-sm text-indigo-100/80">
          Nous ajoutons régulièrement des intégrations. Votez pour celle que vous souhaitez ou{" "}
          <a href="mailto:support@example.com" className="text-indigo-300 hover:text-indigo-200 underline">
            contactez-nous
          </a>
          .
        </p>
      </div>
      </div>
    </div>
  );
}
