import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketing — Email, SMS & Réseaux Sociaux",
  description: "Marketing automation pour TPE/PME. Génération IA de contenu, publication Instagram/Facebook, inbox unifiée, analytics ROI. À partir de 9€/mois, essai gratuit 30 jours.",
  keywords: ["marketing automation", "réseaux sociaux", "Instagram", "Facebook", "email marketing", "SMS", "TPE", "PME", "IA génération contenu"],
  openGraph: {
    title: "Quelyos Marketing — Automatisez vos réseaux sociaux",
    description: "20 min/semaine, zéro expertise. L'IA gère vos réseaux sociaux pendant que vous vous concentrez sur votre métier.",
    url: "https://quelyos.com/marketing",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
