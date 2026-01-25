

import { useEffect, useMemo, useState } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Check, Loader2, Shield, WalletCards } from "lucide-react";
import { useRequireAuth } from "@/lib/finance/compat/auth";

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
  useRequireAuth();

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
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
        console.error("Impossible de lire le snapshot TVA", err);
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
    <div className="space-y-6 text-white">
      {/* Background blur orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute -right-40 top-1/3 h-[400px] w-[400px] rounded-full bg-purple-500/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-emerald-500/20 blur-[120px]" />
      </div>

      <div className="relative">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">TVA & tarification</p>
          <h1 className="bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-3xl font-semibold text-transparent">TVA et stratégie de prix</h1>
          <p className="text-sm text-indigo-100/80">
            Branche Stripe si dispo, sinon snapshot local prêt pour l&apos;API.
          </p>
        </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-xl space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Stratégie de TVA</h2>
                <p className="text-sm text-indigo-100/80">Appliquée aux devis, factures et prévisions.</p>
              </div>
              <button
                onClick={() => updateSnapshot({ enabled: !snapshot.enabled })}
                className={`rounded-full px-4 py-2 text-xs font-semibold border transition ${
                  snapshot.enabled
                    ? "border-emerald-300/60 bg-emerald-500/15 text-emerald-50"
                    : "border-white/30 bg-white/10 text-indigo-100"
                }`}
              >
                {snapshot.enabled ? "TVA activée" : "TVA désactivée"}
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="rate" className="text-sm text-indigo-100">
                  Taux de TVA (%)
                </label>
                <input
                  id="rate"
                  type="number"
                  min={0}
                  step={0.1}
                  value={snapshot.rate}
                  onChange={(e) => updateSnapshot({ rate: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="strategy" className="text-sm text-indigo-100">
                  Stratégie de prix
                </label>
                <select
                  id="strategy"
                  value={snapshot.strategy}
                  onChange={(e) => updateSnapshot({ strategy: e.target.value as VatStrategy })}
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                >
                  <option value="HT" className="text-slate-900">
                    Prix saisis en HT
                  </option>
                  <option value="TTC" className="text-slate-900">
                    Prix saisis en TTC
                  </option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-sm text-indigo-100/80">
                  <Shield className="h-4 w-4" />
                  Impact
                </div>
                <p className="mt-2 text-lg font-semibold">
                  {snapshot.enabled
                    ? snapshot.strategy === "HT"
                      ? "TVA ajoutée sur sortie"
                      : "TVA extraite sur sortie"
                    : "TVA non appliquée"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-sm text-indigo-100/80">
                  <WalletCards className="h-4 w-4" />
                  Synchronisation
                </div>
                <p className="mt-2 text-lg font-semibold">
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
                <span className="text-sm text-red-200">{error}</span>
              )}
              {saved && !error && (
                <span className="text-sm text-emerald-200">Paramètres sauvegardés.</span>
              )}
              <button
                onClick={saveSnapshot}
                disabled={saving}
                className="flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold shadow-lg transition hover:from-indigo-400 hover:to-violet-400 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="mr-2 h-5 w-5" /> Sauvegarder</>}
              </button>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Stripe</p>
              <h3 className="text-lg font-semibold">Connexion</h3>
            </div>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-indigo-100" />
            ) : stripe ? (
              <span className="rounded-full border border-emerald-300/60 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-50">
                Connecté
              </span>
            ) : (
              <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-100">
                {stripeAvailable ? "Disponible" : "Clé manquante"}
              </span>
            )}
          </div>

          <p className="text-sm text-indigo-100/80">
          {stripeAvailable
            ? "Stripe sera utilisé pour synchroniser les plans et taxes dès que l&apos;API sera câblée."
            : "Pas de clé Stripe détectée. Les paramètres restent stockés localement pour synchronisation ultérieure."}
          </p>

          {stripeAvailable && (
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={snapshot.stripeSync}
                onChange={(e) => updateSnapshot({ stripeSync: e.target.checked })}
                className="h-4 w-4 rounded border-white/30 bg-transparent"
              />
              Activer la synchro Stripe dès que disponible
            </label>
          )}

          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-indigo-100/80">
            Snapshot actuel<br />
            {JSON.stringify(snapshot, null, 2)}
          </div>
        </section>
      </div>
      </div>
    </div>
  );
}
