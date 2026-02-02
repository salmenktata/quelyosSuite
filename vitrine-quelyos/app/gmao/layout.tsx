import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GMAO — Maintenance & Gestion des Équipements",
  description: "GMAO complète pour TPE/PME. Maintenance préventive, curative et prédictive. Suivi équipements, ordres de travail, historique interventions. Essai gratuit 30 jours.",
  keywords: ["GMAO", "maintenance", "équipements", "maintenance préventive", "ordres de travail", "interventions", "TPE", "PME", "gestion maintenance"],
  openGraph: {
    title: "Quelyos GMAO — Maintenance & Gestion des Équipements",
    description: "Planifiez et suivez la maintenance de vos équipements. GMAO intégrée à votre ERP.",
    url: "https://quelyos.com/gmao",
  },
};

export default function GMAOLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
