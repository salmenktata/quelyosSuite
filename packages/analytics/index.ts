/**
 * @quelyos/analytics
 * Système de tracking unifié pour toutes les applications Quelyos
 */

// Config
export { setConfig, getConfig, resetConfig } from "./src/config";

// Init
export { initializeAnalytics, isAnalyticsInitialized } from "./src/init";

// Consent
export {
  hasAnalyticsConsent,
  setAnalyticsConsent,
  getConsentStatus,
} from "./src/consent";

// Tracking
export { trackEvent, trackPageView } from "./src/tracking";

// Funnel
export {
  trackFunnelStep,
  getFunnelState,
  FUNNEL_STEPS_ORDER,
} from "./src/funnel";

// User
export { identifyUser } from "./src/user";

// A/B Testing
export {
  getABTestVariant,
  trackABTestConversion,
  ACTIVE_TESTS,
} from "./src/ab-testing";

// Conversions
export { ConversionEvents } from "./src/conversions";

// Hooks
export { usePageTracking } from "./src/hooks";

// Types
export type {
  AnalyticsEvent,
  EventCategory,
  FunnelStep,
  FunnelState,
  UserProperties,
  ABTest,
  ABTestVariant,
  AnalyticsConfig,
  ConsentStatus,
} from "./src/types";

// Default export
import { initializeAnalytics } from "./src/init";
import { trackEvent, trackPageView } from "./src/tracking";
import { trackFunnelStep, getFunnelState } from "./src/funnel";
import { identifyUser } from "./src/user";
import { getABTestVariant, trackABTestConversion } from "./src/ab-testing";
import {
  hasAnalyticsConsent,
  setAnalyticsConsent,
  getConsentStatus,
} from "./src/consent";
import { ConversionEvents } from "./src/conversions";

export default {
  init: initializeAnalytics,
  track: trackEvent,
  trackPageView,
  trackFunnel: trackFunnelStep,
  identify: identifyUser,
  getABVariant: getABTestVariant,
  trackABConversion: trackABTestConversion,
  consent: {
    has: hasAnalyticsConsent,
    set: setAnalyticsConsent,
    status: getConsentStatus,
  },
  funnel: getFunnelState,
  events: ConversionEvents,
};
