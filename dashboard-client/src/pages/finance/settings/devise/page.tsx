

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/finance/compat/auth";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { useTheme } from "@/lib/ThemeContext";
import { ThemeSelector } from "@/components/ThemeToggle";
import { Check, Loader2, Moon, Sun, Monitor, Globe, Building2 } from "lucide-react";

const SETTINGS_KEY = "qyl_settings";

export default function DeviseFormatsPage() {
  useRequireAuth();
  const { currency, setCurrency, availableCurrencies, isLoading: currenciesLoading, baseCurrency } = useCurrency();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [lang, setLang] = useState("fr");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setLang(parsed.lang ?? "fr");
    } catch (err) {
      console.error("Lecture des préférences impossible", err);
    }
  }, []);

  useEffect(() => {
    // Show saved message briefly when currency changes
    if (saved) {
      const timer = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saved]);

  async function handleCurrencyChange(newCurrency: string) {
    await setCurrency(newCurrency);
    setSaved(true);
  }

  async function saveLanguage() {
    try {
      const payload = { lang };
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(SETTINGS_KEY);
        const settings = raw ? JSON.parse(raw) : {};
        settings.lang = lang;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      }
      setSaved(true);
    } catch (err) {
      console.error("Erreur sauvegarde langue:", err);
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
          <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">Paramètres</p>
          <h1 className="bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-3xl font-semibold text-transparent">Devise & formats</h1>
          <p className="text-sm text-indigo-100/80">Thème, devise et langue pour toute l&apos;équipe.</p>
        </div>

      <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-xl space-y-6">
        <h2 className="text-xl font-semibold">Préférences utilisateur</h2>

        {/* F26 - Sélecteur de thème amélioré */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-indigo-100">Apparence</label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setTheme("light")}
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                theme === "light"
                  ? "border-indigo-400 bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/20"
                  : "border-white/10 bg-white/5 text-indigo-100 hover:border-white/20 hover:bg-white/10"
              }`}
            >
              <Sun className="h-4 w-4" />
              <span>Clair</span>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                theme === "dark"
                  ? "border-indigo-400 bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/20"
                  : "border-white/10 bg-white/5 text-indigo-100 hover:border-white/20 hover:bg-white/10"
              }`}
            >
              <Moon className="h-4 w-4" />
              <span>Sombre</span>
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                theme === "system"
                  ? "border-indigo-400 bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/20"
                  : "border-white/10 bg-white/5 text-indigo-100 hover:border-white/20 hover:bg-white/10"
              }`}
            >
              <Monitor className="h-4 w-4" />
              <span>Système</span>
            </button>
          </div>
          <p className="text-xs text-indigo-100/60">
            {theme === "system" 
              ? `Mode automatique activé (actuellement : ${resolvedTheme === "dark" ? "sombre" : "clair"})`
              : theme === "dark" 
                ? "Mode sombre activé"
                : "Mode clair activé"
            }
          </p>
        </div>

        {/* Currency Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-indigo-100" htmlFor="currency">
              <Globe className="mr-2 inline-block h-4 w-4" />
              Devise d&apos;affichage
            </label>
            {baseCurrency !== currency && (
              <span className="text-xs text-indigo-300 flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Devise entreprise: {baseCurrency}
              </span>
            )}
          </div>

          {currenciesLoading ? (
            <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-8">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-300" />
            </div>
          ) : (
            <div className="space-y-2">
              <select
                id="currency"
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                disabled={currenciesLoading}
              >
                {availableCurrencies.map((c) => (
                  <option key={c.code} value={c.code} className="text-slate-900">
                    {c.symbol} {c.code} — {c.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-indigo-100/60">
                Les montants seront convertis automatiquement dans votre devise préférée
              </p>
            </div>
          )}
        </div>

        {/* Language Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-indigo-100" htmlFor="lang">Langue</label>
          <div className="flex gap-2">
            <select
              id="lang"
              className="flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
            >
              <option value="fr" className="text-slate-900">Français</option>
              <option value="en" className="text-slate-900">Anglais</option>
              <option value="es" className="text-slate-900">Espagnol</option>
              <option value="ar" className="text-slate-900">Arabe</option>
            </select>
            <button
              onClick={saveLanguage}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold shadow-lg transition hover:from-indigo-400 hover:to-violet-400"
            >
              <Check className="h-5 w-5" />
            </button>
          </div>
        </div>

        {saved && (
          <div className="rounded-lg border border-emerald-300/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 flex items-center gap-2">
            <Check className="h-4 w-4" />
            Paramètres sauvegardés avec succès
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
