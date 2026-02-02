import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarifs — Solutions métier, 1 abonnement",
  description: "Tarifs Quelyos : à partir de 9€/mois avec 1 module inclus. Ajoutez les modules dont vous avez besoin. Essai gratuit 30 jours, sans engagement.",
  keywords: ["tarifs ERP", "prix logiciel gestion", "abonnement SaaS", "ERP pas cher", "TPE", "PME", "essai gratuit", "solutions métier"],
  openGraph: {
    title: "Tarifs Quelyos — Solutions métier, 1 abonnement",
    description: "À partir de 9€/mois avec 1 module inclus. Finance, CRM, Stock, RH, POS, Marketing — composez votre suite. Essai gratuit 30 jours.",
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
