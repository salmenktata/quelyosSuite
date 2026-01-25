# @quelyos/analytics

> Système de tracking unifié avec funnel de conversion, A/B testing et intégrations Google Analytics 4, PostHog, Mixpanel

## 🎯 Fonctionnalités

- ✅ **Tracking événements** : Events personnalisés avec propriétés
- ✅ **Funnel de conversion** : Tracking complet du parcours utilisateur
- ✅ **A/B Testing** : Tests multi-variantes avec poids configurables
- ✅ **Gestion consentement RGPD** : Opt-in/opt-out avec storage
- ✅ **Intégrations** : GA4, PostHog, Mixpanel (placeholders)
- ✅ **Session tracking** : IDs session/user automatiques
- ✅ **Page views** : Tracking automatique avec hook React
- ✅ **User identification** : Propriétés utilisateur enrichies
- ✅ **Backend analytics** : Endpoint custom pour analytics internes

## 🚀 Installation

```bash
npm install @quelyos/analytics
```

## 📚 Usage

### Configuration initiale

```typescript
import analytics, { setConfig } from "@quelyos/analytics";

// Configuration (généralement dans _app.tsx ou layout.tsx)
setConfig({
  ga4MeasurementId: process.env.NEXT_PUBLIC_GA4_ID,
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  mixpanelToken: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
  debug: process.env.NODE_ENV === "development",
  requireConsent: true, // RGPD
  customEndpoint: "/api/analytics",
});

// Initialiser après consentement
analytics.init();
```

### Gestion du consentement RGPD

```typescript
import { setAnalyticsConsent, getConsentStatus } from "@quelyos/analytics";

// Demander le consentement
const handleConsent = (accepted: boolean) => {
  setAnalyticsConsent(accepted);
  // Si accepted=true, analytics.init() est appelé automatiquement
};

// Vérifier le statut
const status = getConsentStatus(); // "granted" | "denied" | "pending"
```

### Tracking d'événements

```typescript
import { trackEvent } from "@quelyos/analytics";

// Event simple
trackEvent({
  name: "button_clicked",
  category: "engagement",
  properties: {
    button_id: "cta_signup",
    page: "/pricing",
  },
});

// Event de conversion
trackEvent({
  name: "purchase_completed",
  category: "conversion",
  properties: {
    plan: "pro",
    amount: 49.99,
    currency: "EUR",
  },
});
```

### Funnel de conversion

```typescript
import { trackFunnelStep, getFunnelState } from "@quelyos/analytics";

// Tracker une étape du funnel
trackFunnelStep("start_registration");
trackFunnelStep("complete_registration", { method: "email" });
trackFunnelStep("verify_email");

// Obtenir l'état du funnel
const state = getFunnelState();
console.log(state.currentStep); // "verify_email"
console.log(state.maxStepIndex); // 5
console.log(state.steps); // [{ step: "...", timestamp: 1234 }, ...]
```

### Conversions pré-configurées

```typescript
import { ConversionEvents } from "@quelyos/analytics";

// Signup
ConversionEvents.startSignup();
ConversionEvents.completeSignup("email");

// Onboarding
ConversionEvents.startOnboarding();
ConversionEvents.completeOnboarding("finance");

// Activation
ConversionEvents.firstTransaction();
ConversionEvents.activation();

// Upgrade
ConversionEvents.convertToPro();
```

### A/B Testing

```typescript
import { getABTestVariant, trackABTestConversion } from "@quelyos/analytics";

// Obtenir le variant assigné (auto-assigné au premier appel)
const variant = getABTestVariant("pricing_cta");

// Afficher selon le variant
if (variant === "essai_gratuit") {
  buttonText = "Essai gratuit 14 jours";
} else if (variant === "commencer_maintenant") {
  buttonText = "Commencer maintenant";
}

// Tracker la conversion
const handlePurchase = () => {
  trackABTestConversion("pricing_cta", "purchase");
};
```

### Identification utilisateur

```typescript
import { identifyUser } from "@quelyos/analytics";

// Après login
identifyUser({
  userId: user.id,
  email: user.email,
  plan: "pro",
  signupDate: user.createdAt,
  company: user.company,
  sector: "tech",
});
```

### Tracking automatique des pages (Next.js)

```typescript
"use client";

import { usePageTracking } from "@quelyos/analytics";

export default function RootLayout({ children }) {
  // Hook qui track automatiquement les changements de page
  usePageTracking();

  return <html>{children}</html>;
}
```

### Tracking manuel des pages

```typescript
import { trackPageView } from "@quelyos/analytics";

// Dans un component
useEffect(() => {
  trackPageView("/dashboard", "Mon Dashboard");
}, []);
```

## 🔧 Configuration des A/B Tests

Éditer [src/ab-testing.ts](src/ab-testing.ts) pour ajouter/modifier les tests :

```typescript
export const ACTIVE_TESTS: ABTest[] = [
  {
    id: "mon_test",
    name: "Mon Test A/B",
    variants: ["control", "variant_a", "variant_b"],
    weights: [0.34, 0.33, 0.33], // Probabilités (doivent sommer à 1)
  },
];
```

## 🔧 Étapes du Funnel

Les étapes disponibles (dans l'ordre) :

1. `visit_landing` - Visite page d'accueil
2. `view_pricing` - Vue page pricing
3. `click_signup` - Clic sur signup
4. `start_registration` - Début inscription
5. `complete_registration` - Fin inscription
6. `verify_email` - Email vérifié
7. `start_onboarding` - Début onboarding
8. `complete_onboarding` - Fin onboarding
9. `first_transaction` - Première transaction
10. `first_budget` - Premier budget
11. `activation` - Activation utilisateur
12. `view_upgrade` - Vue page upgrade
13. `start_trial` - Début essai
14. `convert_pro` - Conversion Pro
15. `convert_expert` - Conversion Expert

## 📊 Backend Analytics

Si vous voulez tracker les events dans votre propre backend, créer une route `/api/analytics` :

```typescript
// app/api/analytics/route.ts
export async function POST(req: Request) {
  const event = await req.json();

  // Sauvegarder dans votre DB
  await db.analyticsEvents.create({ data: event });

  return Response.json({ success: true });
}
```

## 🔧 API Reference

### Configuration

- `setConfig(config: Partial<AnalyticsConfig>): void`
- `getConfig(): Required<AnalyticsConfig>`
- `resetConfig(): void`

### Initialisation

- `initializeAnalytics(): void` - Initialise après consentement
- `isAnalyticsInitialized(): boolean` - Vérifie si initialisé

### Consentement

- `hasAnalyticsConsent(): boolean`
- `setAnalyticsConsent(consent: boolean): void`
- `getConsentStatus(): ConsentStatus`

### Tracking

- `trackEvent(event: AnalyticsEvent): void`
- `trackPageView(path: string, title?: string): void`

### Funnel

- `trackFunnelStep(step: FunnelStep, properties?: Record<string, unknown>): void`
- `getFunnelState(): FunnelState`

### User

- `identifyUser(properties: UserProperties): void`

### A/B Testing

- `getABTestVariant(testId: string): string | null`
- `trackABTestConversion(testId: string, conversionEvent: string): void`

### Hooks

- `usePageTracking(): void` - Hook React pour tracking auto des pages

## 📝 Changelog

### v1.0.0

- ✅ Tracking events avec enrichissement automatique (session, user, timestamp)
- ✅ Funnel de conversion avec 15 étapes
- ✅ A/B Testing avec multi-variantes et poids
- ✅ Consentement RGPD avec storage
- ✅ Intégrations GA4, PostHog, Mixpanel (placeholders)
- ✅ Backend analytics endpoint
- ✅ Conversions pré-configurées
- ✅ Hook React usePageTracking
- ✅ User identification avec propriétés enrichies
