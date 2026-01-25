import React from "react";
import {
  TrendingUp,
  AlertCircle,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  Briefcase,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export type DashboardAction = {
  id: string;
  title: string;
  priority: "high" | "medium";
  dueDate?: string;
};

export type DashboardInsight = {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  trend: "up" | "down" | "neutral";
};

export type DashboardTransaction = {
  id: number;
  description: string;
  amount: number;
  type: "credit" | "debit";
  date: string;
  flowIcon: React.ReactNode;
};

// ============================================================================
// Mock Data
// ============================================================================

export const MOCK_ACTIONS: DashboardAction[] = [
  {
    id: "1",
    title: "Relancer Client ACME Corp",
    priority: "high",
    dueDate: "Aujourd'hui",
  },
  {
    id: "2",
    title: "Paiement charges sociales",
    priority: "high",
    dueDate: "15 déc",
  },
  {
    id: "3",
    title: "Valider facture #2847",
    priority: "medium",
    dueDate: "18 déc",
  },
];

export const MOCK_INSIGHTS: DashboardInsight[] = [
  {
    id: "1",
    icon: React.createElement(TrendingUp, { className: "h-5 w-5 text-emerald-400" }),
    title: "Dépenses Marketing +23%",
    description: "Vos investissements pub ont augmenté ce mois",
    trend: "up",
  },
  {
    id: "2",
    icon: React.createElement(AlertCircle, { className: "h-5 w-5 text-amber-400" }),
    title: "3 clients n'ont pas payé",
    description: "Créances en retard : 8 400€ (45+ jours)",
    trend: "down",
  },
  {
    id: "3",
    icon: React.createElement(Sparkles, { className: "h-5 w-5 text-indigo-400" }),
    title: "Vous économisez 15%",
    description: "Réduction dépenses vs mois dernier",
    trend: "up",
  },
];

export const MOCK_TRANSACTIONS: DashboardTransaction[] = [
  {
    id: 1,
    description: "Paiement client #1842",
    amount: 2400,
    type: "credit",
    date: "Il y a 2h",
    flowIcon: React.createElement(ArrowDownRight, { className: "h-4 w-4 text-emerald-400" }),
  },
  {
    id: 2,
    description: "Abonnement Figma",
    amount: 15,
    type: "debit",
    date: "Il y a 3h",
    flowIcon: React.createElement(CreditCard, { className: "h-4 w-4 text-indigo-400" }),
  },
  {
    id: 3,
    description: "Virement reçu",
    amount: 850,
    type: "credit",
    date: "Il y a 5h",
    flowIcon: React.createElement(ArrowDownRight, { className: "h-4 w-4 text-emerald-400" }),
  },
  {
    id: 4,
    description: "Salaire freelance",
    amount: 1200,
    type: "debit",
    date: "Hier",
    flowIcon: React.createElement(Briefcase, { className: "h-4 w-4 text-violet-400" }),
  },
  {
    id: 5,
    description: "Facture hébergement",
    amount: 89,
    type: "debit",
    date: "Hier",
    flowIcon: React.createElement(CreditCard, { className: "h-4 w-4 text-indigo-400" }),
  },
];

// Generate deterministic chart heights for 90 days
export const MOCK_CHART_HEIGHTS = Array.from({ length: 90 }).map(
  (_, i) => 40 + Math.sin(i / 5) * 30 + (Math.random() * 20)
);

// Hero KPIs initial values
export const MOCK_HERO_DATA = {
  currentBalance: 142650,
  yesterdayDelta: 2400,
  monthEvolution: 12.5,
};
