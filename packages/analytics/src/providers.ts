/**
 * Initialisation des providers Analytics (GA4, PostHog, Mixpanel)
 */

import { getConfig } from "./config";

export function initGA4(): void {
  const config = getConfig();
  if (!config.ga4MeasurementId) return;

  // Script GA4 (gtag.js)
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${config.ga4MeasurementId}`;
  document.head.appendChild(script);

  // Configuration gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }
  gtag("js", new Date());
  gtag("config", config.ga4MeasurementId, {
    send_page_view: true,
    cookie_flags: "SameSite=None;Secure",
  });

  // Expose gtag globally
  (window as { gtag: typeof gtag }).gtag = gtag;

  if (config.debug) {
    console.log(
      "[Analytics] GA4 initialized with ID:",
      config.ga4MeasurementId
    );
  }
}

export function initPostHog(): void {
  const config = getConfig();
  if (!config.posthogKey) return;

  // PostHog via script externe
  // Note: Pour production, utiliser le package npm posthog-js
  if (config.debug) {
    console.log(
      "[Analytics] PostHog placeholder - configure POSTHOG_KEY for production"
    );
  }
}

export function initMixpanel(): void {
  const config = getConfig();
  if (!config.mixpanelToken) return;

  // Mixpanel via script externe
  // Note: Pour production, utiliser le package npm mixpanel-browser
  if (config.debug) {
    console.log(
      "[Analytics] Mixpanel placeholder - configure MIXPANEL_TOKEN for production"
    );
  }
}
