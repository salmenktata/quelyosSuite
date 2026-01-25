/**
 * Helpers de conversion pré-configurés
 */

import { trackFunnelStep } from "./funnel";
import { trackEvent } from "./tracking";
import { trackABTestConversion } from "./ab-testing";

export const ConversionEvents = {
  // Signup flow
  viewSignupPage: () => trackFunnelStep("click_signup"),
  startSignup: () => trackFunnelStep("start_registration"),
  completeSignup: (method: "email" | "google" | "github") => {
    trackFunnelStep("complete_registration", { method });
  },
  verifyEmail: () => trackFunnelStep("verify_email"),

  // Onboarding
  startOnboarding: () => trackFunnelStep("start_onboarding"),
  completeOnboarding: (sector?: string) => {
    trackFunnelStep("complete_onboarding", { sector });
  },

  // Activation
  firstTransaction: () => trackFunnelStep("first_transaction"),
  firstBudget: () => trackFunnelStep("first_budget"),
  activation: () => trackFunnelStep("activation"),

  // Conversion
  viewUpgrade: () => trackFunnelStep("view_upgrade"),
  startTrial: (plan: "pro" | "expert") => {
    trackFunnelStep("start_trial", { plan });
  },
  convertToPro: () => {
    trackFunnelStep("convert_pro");
    trackABTestConversion("pricing_cta", "convert_pro");
  },
  convertToExpert: () => {
    trackFunnelStep("convert_expert");
    trackABTestConversion("pricing_cta", "convert_expert");
  },

  // Feature usage
  useFeature: (feature: string) => {
    trackEvent({
      name: "feature_used",
      category: "feature",
      properties: { feature },
    });
  },
};
