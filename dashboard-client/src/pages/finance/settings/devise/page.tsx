/**
 * Page Paramètres Devise & Formats - Configuration utilisateur
 *
 * Fonctionnalités :
 * - Sélection devise d'affichage (conversion automatique)
 * - Choix du thème (clair/sombre/système)
 * - Configuration de la langue interface
 * - Affichage devise entreprise vs devise utilisateur
 * - Synchronisation temps réel avec CurrencyContext
 */

import { useEffect, useState } from "react";
import { useCurrency } from "@/lib/finance/CurrencyContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Check, Loader2, Moon, Sun, Monitor, Globe, Building2 } from "lucide-react";
import { logger } from '@quelyos/logger';
import { Layout } from '@/components/Layout';
import { Breadcrumbs, PageNotice, Button } from '@/components/common';
import { financeNotices } from '@/lib/notices/finance-notices';

const SETTINGS_KEY = "qyl_settings";

export default function DeviseFormatsPage() {
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
      logger.error("Lecture des préférences impossible", err);
    }
  }, []);

  useEffect(() => {
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
      logger.error("Erreur sauvegarde langue:", err);
    }
  }

  return (
    <Layout>
      <div className="p-4 md:p-8 space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Tableau de bord', href: '/dashboard' },
            { label: 'Finance', href: '/finance' },
            { label: 'Paramètres', href: '/finance/settings' },
            { label: 'Devise & Formats' },
          ]}
        />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Devise & Formats</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Configurez votre devise, thème et langue préférés
            </p>
          </div>
        </div>

        <PageNotice config={financeNotices.settingsDevise} className="mb-6" />

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-xl space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Préférences utilisateur</h2>

          {/* Sélecteur de thème */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900 dark:text-white">Apparence</label>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant={theme === "light" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setTheme("light")}
                icon={<Sun className="h-4 w-4" />}
              >
                Clair
              </Button>
              <Button
                variant={theme === "dark" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setTheme("dark")}
                icon={<Moon className="h-4 w-4" />}
              >
                Sombre
              </Button>
              <Button
                variant={theme === "system" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setTheme("system")}
                icon={<Monitor className="h-4 w-4" />}
              >
                Système
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
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
              <label className="block text-sm font-medium text-gray-900 dark:text-white" htmlFor="currency">
                <Globe className="mr-2 inline-block h-4 w-4" />
                Devise d&apos;affichage
              </label>
              {baseCurrency !== currency && (
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Devise entreprise: {baseCurrency}
                </span>
              )}
            </div>

            {currenciesLoading ? (
              <div className="flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-8">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  id="currency"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  disabled={currenciesLoading}
                >
                  {availableCurrencies.map((c) => (
                    <option key={c.code} value={c.code} className="bg-white dark:bg-gray-900">
                      {c.symbol} {c.code} — {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Les montants seront convertis automatiquement dans votre devise préférée
                </p>
              </div>
            )}
          </div>

          {/* Language Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white" htmlFor="lang">Langue</label>
            <div className="flex gap-2">
              <select
                id="lang"
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
              >
                <option value="fr" className="bg-white dark:bg-gray-900">Français</option>
                <option value="en" className="bg-white dark:bg-gray-900">Anglais</option>
                <option value="es" className="bg-white dark:bg-gray-900">Espagnol</option>
                <option value="ar" className="bg-white dark:bg-gray-900">Arabe</option>
              </select>
              <Button
                variant="primary"
                size="sm"
                onClick={saveLanguage}
                icon={<Check className="h-5 w-5" />}
                aria-label="Sauvegarder la langue"
              />
            </div>
          </div>

          {saved && (
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
              <Check className="h-4 w-4" />
              Paramètres sauvegardés avec succès
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
