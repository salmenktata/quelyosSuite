"use client";

import { useState, useEffect, useCallback } from "react";
import { Cookie, X, Settings2 } from "lucide-react";
import Link from "next/link";

type CookieConsent = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
};

const CONSENT_KEY = "quelyos_cookie_consent";

function getStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as CookieConsent;
  } catch {
    return null;
  }
}

function storeConsent(consent: CookieConsent) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      return !getStoredConsent();
    }
    return false;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const handleAcceptAll = useCallback(() => {
    const consent: CookieConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    storeConsent(consent);
    setVisible(false);
  }, []);

  const handleRejectAll = useCallback(() => {
    const consent: CookieConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    storeConsent(consent);
    setVisible(false);
  }, []);

  const handleSavePreferences = useCallback(() => {
    const consent: CookieConsent = {
      necessary: true,
      analytics,
      marketing,
      timestamp: new Date().toISOString(),
    };
    storeConsent(consent);
    setVisible(false);
  }, [analytics, marketing]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[9999] p-4">
      <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 p-6">
        {!showSettings ? (
          <>
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <Cookie className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm mb-1">Gestion des cookies</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {`Nous utilisons des cookies pour améliorer votre expérience. Les cookies nécessaires
                  sont toujours actifs. Vous pouvez accepter ou refuser les cookies optionnels.`}{" "}
                  <Link href="/legal/confidentialite" className="text-indigo-400 hover:text-indigo-300 underline">
                    En savoir plus
                  </Link>
                </p>
              </div>
              <button
                onClick={handleRejectAll}
                className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Tout refuser
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Paramétrer
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
              >
                Tout accepter
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-indigo-400" />
                Paramètres des cookies
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
                aria-label="Retour"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Nécessaires */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                <div>
                  <p className="text-white text-xs font-medium">Cookies nécessaires</p>
                  <p className="text-slate-500 text-[11px]">Fonctionnement du site (session, sécurité)</p>
                </div>
                <div className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400">
                  Toujours actifs
                </div>
              </div>

              {/* Analytics */}
              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 cursor-pointer">
                <div>
                  <p className="text-white text-xs font-medium">Cookies analytiques</p>
                  <p className="text-slate-500 text-[11px]">Mesure de fréquentation anonymisée</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 rounded-full bg-slate-700 peer-checked:bg-indigo-600 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </div>
              </label>

              {/* Marketing */}
              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 cursor-pointer">
                <div>
                  <p className="text-white text-xs font-medium">Cookies marketing</p>
                  <p className="text-slate-500 text-[11px]">Personnalisation des contenus et publicités</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 rounded-full bg-slate-700 peer-checked:bg-indigo-600 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </div>
              </label>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleRejectAll}
                className="flex-1 px-4 py-2 text-xs font-medium rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Tout refuser
              </button>
              <button
                onClick={handleSavePreferences}
                className="flex-1 px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
              >
                Enregistrer mes choix
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
