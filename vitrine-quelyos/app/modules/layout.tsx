import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solutions Intégrées — Données Synchronisées",
  description: "Découvrez les solutions Quelyos : Finance, Boutique, CRM, Stock, RH, POS, Marketing, Dashboard. Toutes interconnectées, données synchronisées automatiquement.",
  keywords: ["solutions ERP", "logiciel tout-en-un", "gestion intégrée", "Finance", "CRM", "Stock", "RH", "POS", "Marketing"],
  openGraph: {
    title: "Solutions Quelyos — Tout votre business en un seul endroit",
    description: "Une vente = stock mis à jour + revenu Finance + fiche client enrichie. Automatique.",
    url: "https://quelyos.com/modules",
  },
};

export default function ModulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
