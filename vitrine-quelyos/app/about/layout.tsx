import { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos de Quelyos — Notre mission, équipe & valeurs",
  description:
    "Découvrez Quelyos : la suite ERP complète pour TPE/PME. Notre mission, nos valeurs, notre équipe et notre histoire. Finance, CRM, Stock, RH, POS, Marketing — tout intégré.",
  openGraph: {
    title: "À propos de Quelyos — Notre mission, équipe & valeurs",
    description:
      "Découvrez Quelyos : la suite ERP complète pour TPE/PME. Notre mission, nos valeurs, notre équipe et notre histoire.",
    url: "https://quelyos.com/about",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
