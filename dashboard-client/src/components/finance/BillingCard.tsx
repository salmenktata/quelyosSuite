"use client";

import { useState, useEffect } from "react";
import { Check, ArrowRight, ExternalLink, Loader2, CreditCard, Sparkles } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "@/lib/api-base";
import { logger } from '@quelyos/logger';

type Plan = {
  id: "FREE" | "PRO" | "EXPERT";
  name: string;
  description: string;
  price: number;
  priceYearly?: number;
  interval: string;
  badge?: string;
  features: string[];
  limits: {
    users: number;
    accounts: number;
    transactionsPerMonth: number;
  };
};

type Subscription = {
  plan: "FREE" | "PRO" | "EXPERT";
  status: string;
  trial: boolean;
  trialEnd?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  amount?: number;
  currency?: string;
  interval?: string;
};

export function BillingCard() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");

  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const canceled = searchParams.get("canceled");

  // Load subscription and plans on mount
  useEffect(() => {
    loadData();
  }, []);

  // Show success message after payment
  useEffect(() => {
    if (sessionId) {
      setError(null);
      // Success message will be shown via subscription status
      // Refresh subscription data
      loadData();
    }
    if (canceled) {
      setError("Paiement annulé. Vous pouvez réessayer quand vous voulez.");
    }
  }, [sessionId, canceled]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch plans and subscription in parallel
      const [plansRes, subRes] = await Promise.all([
        fetch(`${API_BASE_URL}/billing/plans`),
        fetch(`${API_BASE_URL}/billing/subscription`, {
          credentials: "include",
        }),
      ]);

      if (!plansRes.ok || !subRes.ok) {
        throw new Error("Erreur lors du chargement des données");
      }

      const plansData = await plansRes.json();
      const subData = await subRes.json();

      setPlans(plansData);
      setSubscription(subData);
    } catch (err) {
      logger.error("Error loading billing data:", err);
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe(planId: "PRO" | "EXPERT") {
    try {
      setCheckoutLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/billing/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          plan: planId,
          interval: billingInterval,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la création du paiement");
      }

      const { url } = await res.json();

      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (err) {
      logger.error("Error creating checkout:", err);
      setError(err instanceof Error ? err.message : "Erreur lors du paiement");
      setCheckoutLoading(false);
    }
  }

  async function handleManageBilling() {
    try {
      setCheckoutLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/billing/create-portal-session`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'accès au portail");
      }

      const { url } = await res.json();

      // Redirect to Stripe customer portal
      window.location.href = url;
    } catch (err) {
      logger.error("Error opening portal:", err);
      setError(err instanceof Error ? err.message : "Erreur d'accès au portail");
      setCheckoutLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const currentPlan = subscription?.plan || "FREE";
  const isTrialing = subscription?.trial || false;
  const isCanceled = subscription?.cancelAtPeriodEnd || false;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Abonnement</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gérez votre abonnement et votre facturation
          </p>
        </div>
        {currentPlan !== "FREE" && (
          <button
            onClick={handleManageBilling}
            disabled={checkoutLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-50 disabled:opacity-50"
          >
            <CreditCard className="w-4 h-4" />
            Gérer la facturation
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Success message after payment */}
      {sessionId && subscription && subscription.plan !== "FREE" && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">
                {isTrialing ? "Essai gratuit activé !" : "Paiement réussi !"}
              </h3>
              <p className="text-sm text-green-700 mt-1">
                {isTrialing
                  ? `Votre essai gratuit de 14 jours du plan ${subscription.plan} a commencé. Profitez de toutes les fonctionnalités !`
                  : `Votre abonnement ${subscription.plan} est maintenant actif.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancelation notice */}
      {isCanceled && subscription?.currentPeriodEnd && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="text-amber-600">⚠️</div>
            <div>
              <h3 className="font-semibold text-amber-900">Abonnement annulé</h3>
              <p className="text-sm text-amber-700 mt-1">
                Votre abonnement sera annulé le{" "}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString("fr-FR")}. Vous
                conservez l&apos;accès jusqu&apos;à cette date.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current subscription status */}
      {subscription && currentPlan !== "FREE" && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-600 font-medium">Plan actuel</p>
              <p className="text-2xl font-bold text-indigo-900 mt-1">
                {currentPlan}{" "}
                {isTrialing && <span className="text-sm font-normal">(Essai gratuit)</span>}
              </p>
              {subscription.currentPeriodEnd && !isCanceled && (
                <p className="text-sm text-indigo-600 mt-1">
                  {isTrialing ? "Essai jusqu'au " : "Renouvellement le "}
                  {new Date(
                    isTrialing && subscription.trialEnd
                      ? subscription.trialEnd
                      : subscription.currentPeriodEnd
                  ).toLocaleDateString("fr-FR")}
                </p>
              )}
            </div>
            {subscription.amount && subscription.currency && (
              <div className="text-right">
                <p className="text-3xl font-bold text-indigo-900">
                  {(subscription.amount / 100).toFixed(0)}€
                </p>
                <p className="text-sm text-indigo-600">
                  /{subscription.interval === "year" ? "an" : "mois"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Billing interval toggle (only for FREE users) */}
      {currentPlan === "FREE" && (
        <div className="flex items-center justify-center gap-3">
          <span className={`text-sm ${billingInterval === "month" ? "text-gray-900 dark:text-white font-medium" : "text-gray-500"}`}>
            Mensuel
          </span>
          <button
            onClick={() => setBillingInterval(billingInterval === "month" ? "year" : "month")}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              billingInterval === "year" ? "bg-indigo-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                billingInterval === "year" ? "left-5" : "left-0.5"
              }`}
            />
          </button>
          <span className={`text-sm ${billingInterval === "year" ? "text-gray-900 dark:text-white font-medium" : "text-gray-500"}`}>
            Annuel
          </span>
          {billingInterval === "year" && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              -17%
            </span>
          )}
        </div>
      )}

      {/* Plans grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlan;
          const isPaid = plan.id !== "FREE";
          const displayPrice =
            billingInterval === "year" && plan.priceYearly
              ? plan.priceYearly
              : plan.price;

          return (
            <div
              key={plan.id}
              className={`border rounded-lg p-6 shadow-sm flex flex-col justify-between relative ${
                plan.id === "PRO"
                  ? "border-indigo-500 ring-2 ring-indigo-500 ring-opacity-50"
                  : isCurrentPlan
                  ? "border-gray-400"
                  : "border-gray-300"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                    <Sparkles className="w-3 h-3" />
                    {plan.badge}
                  </span>
                </div>
              )}

              <div>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                <div className="mt-4">
                  <p className="text-3xl font-semibold">
                    {displayPrice}€
                    <span className="text-base text-gray-600 font-normal">
                      {plan.id === "FREE"
                        ? ""
                        : billingInterval === "year"
                        ? "/an"
                        : "/mois"}
                    </span>
                  </p>
                  {billingInterval === "year" && plan.priceYearly && plan.price > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      soit {Math.round(plan.priceYearly / 12)}€/mois
                    </p>
                  )}
                </div>

                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="text-green-600 w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-medium"
                  >
                    Plan actuel
                  </button>
                ) : isPaid ? (
                  <button
                    onClick={() => handleSubscribe(plan.id as "PRO" | "EXPERT")}
                    disabled={checkoutLoading || currentPlan !== "FREE"}
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg flex items-center justify-center hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Chargement...
                      </>
                    ) : currentPlan !== "FREE" ? (
                      "Gérer via portail"
                    ) : (
                      <>
                        Essai gratuit 14 jours
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-medium"
                  >
                    Plan gratuit
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Info message */}
      {currentPlan === "FREE" && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm text-blue-700">
            💳 <strong>14 jours d&apos;essai gratuit</strong> - Aucune carte bancaire requise. Annulation
            en 1 clic à tout moment.
          </p>
        </div>
      )}
    </div>
  );
}
