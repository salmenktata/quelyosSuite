/**
 * Page Paramètres TVA & Fiscalité - Configuration fiscale
 *
 * Fonctionnalités :
 * - Activation/désactivation de la TVA
 * - Configuration du taux de TVA (%)
 * - Choix stratégie HT (hors taxes) ou TTC (toutes taxes comprises)
 * - Synchronisation Stripe (plans tarifaires en ligne)
 * - Snapshot local avec aperçu de la configuration
 */

import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Check, Loader2, Shield, WalletCards } from "lucide-react";
import { logger } from '@quelyos/logger';
import { Breadcrumbs, PageNotice, Button } from '@/components/common';
import { financeNotices } from '@/lib/notices/finance-notices';

const STORAGE_KEY = "qyl_vat_strategy";

type VatStrategy = "HT" | "TTC";

type VatSnapshot = {
  enabled: boolean;
  rate: number;
  strategy: VatStrategy;
  stripeSync: boolean;
};

const DEFAULT_SNAPSHOT: VatSnapshot = {
  enabled: true,
  rate: 20,
  strategy: "HT",
  stripeSync: false,
};

export default function TvaPage() {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [snapshot, setSnapshot] = useState<VatSnapshot>(DEFAULT_SNAPSHOT);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stripeAvailable = useMemo(() => Boolean(publishableKey), [publishableKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as VatSnapshot;
        setSnapshot({ ...DEFAULT_SNAPSHOT, ...parsed });
      } catch (err) {
        logger.error("Impossible de lire le snapshot TVA", err);
      }
    }
  }, []);

  useEffect(() => {
    if (!stripeAvailable || !publishableKey) return;
    setLoading(true);
    loadStripe(publishableKey)
      .then((instance) => setStripe(instance))
      .catch((err) => setError(err instanceof Error ? err.message : "Connexion Stripe impossible"))
      .finally(() => setLoading(false));
  }, [publishableKey, stripeAvailable]);

  const updateSnapshot = (updates: Partial<VatSnapshot>) => {
    setSnapshot((prev) => ({ ...prev, ...updates }));
    setSaved(false);
  };

  const saveSnapshot = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      }
      // Future: call API/Stripe pricing sync here
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sauvegarde impossible");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Paramètres', href: '/settings' },
            { label: 'TVA & Fiscalité' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">TVA & Fiscalité</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Configurez votre stratégie fiscale et taux de TVA
            </p>
          </div>
        </div>

        <PageNotice config={financeNotices.settingsTva} className="mb-6" />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Stratégie de TVA</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Appliquée aux devis, factures et prévisions.</p>
                </div>
                <Button
                  variant={snapshot.enabled ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => updateSnapshot({ enabled: !snapshot.enabled })}
                >
                  {snapshot.enabled ? "TVA activée" : "TVA désactivée"}
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="rate" className="block text-sm font-medium text-gray-900 dark:text-white">
                    Taux de TVA (%)
                  </label>
                  <input
                    id="rate"
                    type="number"
                    min={0}
                    step={0.1}
                    value={snapshot.rate}
                    onChange={(e) => updateSnapshot({ rate: Number(e.target.value) })}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="strategy" className="block text-sm font-medium text-gray-900 dark:text-white">
                    Stratégie de prix
                  </label>
                  <select
                    id="strategy"
                    value={snapshot.strategy}
                    onChange={(e) => updateSnapshot({ strategy: e.target.value as VatStrategy })}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    <option value="HT" className="bg-white dark:bg-gray-900">
                      Prix saisis en HT
                    </option>
                    <option value="TTC" className="bg-white dark:bg-gray-900">
                      Prix saisis en TTC
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Shield className="h-4 w-4" />
                    Impact
                  </div>
                  <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                    {snapshot.enabled
                      ? snapshot.strategy === "HT"
                        ? "TVA ajoutée sur sortie"
                        : "TVA extraite sur sortie"
                      : "TVA non appliquée"}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <WalletCards className="h-4 w-4" />
                    Synchronisation
                  </div>
                  <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                    {stripeAvailable
                      ? snapshot.stripeSync
                        ? "Stripe (actif)"
                        : "Stripe disponible"
                      : "Snapshot local"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                {error && (
                  <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                )}
                {saved && !error && (
                  <span className="text-sm text-emerald-600 dark:text-emerald-400">Paramètres sauvegardés.</span>
                )}
                <Button
                  variant="primary"
                  onClick={saveSnapshot}
                  disabled={saving}
                  loading={saving}
                  icon={!saving && <Check className="h-5 w-5" />}
                >
                  Sauvegarder
                </Button>
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">Stripe</p>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Connexion</h3>
              </div>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
              ) : stripe ? (
                <span className="rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                  Connecté
                </span>
              ) : (
                <span className="rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {stripeAvailable ? "Disponible" : "Clé manquante"}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              {stripeAvailable
                ? "Stripe sera utilisé pour synchroniser les plans et taxes dès que l'API sera câblée."
                : "Pas de clé Stripe détectée. Les paramètres restent stockés localement pour synchronisation ultérieure."}
            </p>

            {stripeAvailable && (
              <label className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm text-gray-900 dark:text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={snapshot.stripeSync}
                  onChange={(e) => updateSnapshot({ stripeSync: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-600"
                />
                Activer la synchro Stripe dès que disponible
              </label>
            )}

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
              Snapshot actuel<br />
              <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(snapshot, null, 2)}</pre>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
