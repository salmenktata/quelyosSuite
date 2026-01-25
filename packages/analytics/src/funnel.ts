/**
 * Tracking du funnel de conversion
 */

import { trackEvent } from "./tracking";
import type { FunnelStep, FunnelState } from "./types";
import { STORAGE_KEYS } from "./storage";

export const FUNNEL_STEPS_ORDER: FunnelStep[] = [
  "visit_landing",
  "view_pricing",
  "click_signup",
  "start_registration",
  "complete_registration",
  "verify_email",
  "start_onboarding",
  "complete_onboarding",
  "first_transaction",
  "first_budget",
  "activation",
  "view_upgrade",
  "start_trial",
  "convert_pro",
  "convert_expert",
];

function saveFunnelState(step: FunnelStep): void {
  if (typeof window === "undefined") return;

  const currentState = getFunnelState();
  const stepIndex = FUNNEL_STEPS_ORDER.indexOf(step);

  if (stepIndex > currentState.maxStepIndex) {
    const newState: FunnelState = {
      currentStep: step,
      maxStepIndex: stepIndex,
      steps: [...currentState.steps, { step, timestamp: Date.now() }],
    };
    localStorage.setItem(STORAGE_KEYS.FUNNEL_STATE, JSON.stringify(newState));
  }
}

export function getFunnelState(): FunnelState {
  if (typeof window === "undefined") {
    return { currentStep: null, maxStepIndex: -1, steps: [] };
  }

  const stored = localStorage.getItem(STORAGE_KEYS.FUNNEL_STATE);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { currentStep: null, maxStepIndex: -1, steps: [] };
    }
  }
  return { currentStep: null, maxStepIndex: -1, steps: [] };
}

export function trackFunnelStep(
  step: FunnelStep,
  properties?: Record<string, unknown>
): void {
  const stepIndex = FUNNEL_STEPS_ORDER.indexOf(step);

  trackEvent({
    name: `funnel_${step}`,
    category: "funnel",
    properties: {
      step,
      step_index: stepIndex,
      ...properties,
    } as Record<string, string | number | boolean | null>,
  });

  saveFunnelState(step);
}
