import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarifs — Solutions métier, 1 abonnement",
  description: "Tarifs Quelyos : Starter 19€/mois, Business 49€/mois, Enterprise sur devis. Solutions complètes incluses, essai gratuit 30 jours, sans engagement.",
  keywords: ["tarifs ERP", "prix logiciel gestion", "abonnement SaaS", "ERP pas cher", "TPE", "PME", "essai gratuit", "solutions métier"],
  openGraph: {
    title: "Tarifs Quelyos — Solutions métier, 1 abonnement",
    description: "À partir de 19€/mois. Solutions Finance, CRM, Stock, RH, POS, Marketing — tout inclus. Essai gratuit 30 jours.",
    url: "https://quelyos.com/tarifs",
  },
};

export default function TarifsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
