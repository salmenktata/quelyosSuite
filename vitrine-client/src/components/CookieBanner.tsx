"use client";

import { useState, useEffect, useCallback } from "react";

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

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const consent = getStoredConsent();
    if (!consent) {
      setVisible(true);
    }
  }, []);

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
      <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-2xl p-6">
        {!showSettings ? (
          <>
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">🍪</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 font-semibold text-sm mb-1">Gestion des cookies</h3>
                <p className="text-gray-500 text-xs leading-relaxed">
                  {`Nous utilisons des cookies pour améliorer votre expérience. Les cookies nécessaires
                  sont toujours actifs. Vous pouvez accepter ou refuser les cookies optionnels.`}{" "}
                  <a href="/privacy" className="text-primary hover:underline">
                    En savoir plus
                  </a>
                </p>
              </div>
              <button
                onClick={handleRejectAll}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                aria-label="Fermer"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Tout refuser
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Paramétrer
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-white hover:opacity-90 transition-opacity"
              >
                Tout accepter
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 font-semibold text-sm">Paramètres des cookies</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Retour"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {/* Nécessaires */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <p className="text-gray-900 text-xs font-medium">Cookies nécessaires</p>
                  <p className="text-gray-400 text-[11px]">Fonctionnement du site (session, panier)</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">
                  Toujours actifs
                </span>
              </div>

              {/* Analytics */}
              <label className="flex items-center justify-between p-3 rounded-lg bg-gray-50 cursor-pointer">
                <div>
                  <p className="text-gray-900 text-xs font-medium">Cookies analytiques</p>
                  <p className="text-gray-400 text-[11px]">Mesure de fréquentation anonymisée</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 rounded-full bg-gray-300 peer-checked:bg-primary transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </div>
              </label>

              {/* Marketing */}
              <label className="flex items-center justify-between p-3 rounded-lg bg-gray-50 cursor-pointer">
                <div>
                  <p className="text-gray-900 text-xs font-medium">Cookies marketing</p>
                  <p className="text-gray-400 text-[11px]">Personnalisation des contenus et publicités</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 rounded-full bg-gray-300 peer-checked:bg-primary transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </div>
              </label>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleRejectAll}
                className="flex-1 px-4 py-2 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Tout refuser
              </button>
              <button
                onClick={handleSavePreferences}
                className="flex-1 px-4 py-2 text-xs font-medium rounded-lg bg-primary text-white hover:opacity-90 transition-opacity"
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
