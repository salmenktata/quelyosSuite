/**
 * Système A/B Testing
 */

import { trackEvent } from "./tracking";
import { getABTests, setABTests } from "./storage";
import type { ABTest } from "./types";

export const ACTIVE_TESTS: ABTest[] = [
  {
    id: "landing_hero_v2",
    name: "Landing Hero Version",
    variants: ["control", "variant_a", "variant_b"],
    weights: [0.34, 0.33, 0.33],
  },
  {
    id: "pricing_cta",
    name: "Pricing CTA Text",
    variants: ["essai_gratuit", "commencer_maintenant", "decouvrir"],
    weights: [0.34, 0.33, 0.33],
  },
  {
    id: "signup_steps",
    name: "Signup Flow Steps",
    variants: ["3_steps", "1_step"],
    weights: [0.5, 0.5],
  },
];

function selectVariant(test: ABTest): string {
  const random = Math.random();
  const weights =
    test.weights || test.variants.map(() => 1 / test.variants.length);

  let cumulative = 0;
  for (let i = 0; i < test.variants.length; i++) {
    cumulative += weights[i];
    if (random < cumulative) {
      return test.variants[i];
    }
  }
  return test.variants[0];
}

export function getABTestVariant(testId: string): string | null {
  if (typeof window === "undefined") return null;

  const assignments = getABTests();

  // Si déjà assigné, retourner le variant
  if (assignments[testId]) {
    return assignments[testId];
  }

  // Trouver le test
  const test = ACTIVE_TESTS.find((t) => t.id === testId);
  if (!test) return null;

  // Assigner un variant
  const variant = selectVariant(test);
  assignments[testId] = variant;
  setABTests(assignments);

  // Tracker l'assignment
  trackEvent({
    name: "ab_test_assigned",
    category: "engagement",
    properties: {
      test_id: testId,
      test_name: test.name,
      variant,
    },
  });

  return variant;
}

export function trackABTestConversion(
  testId: string,
  conversionEvent: string
): void {
  const variant = getABTestVariant(testId);
  if (!variant) return;

  trackEvent({
    name: "ab_test_conversion",
    category: "conversion",
    properties: {
      test_id: testId,
      variant,
      conversion_event: conversionEvent,
    },
  });
}
