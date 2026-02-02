import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sécurité & Protection des Données — Quelyos",
  description: "Découvrez comment Quelyos protège vos données : chiffrement AES-256, conformité RGPD, hébergement européen, sauvegardes automatiques et monitoring 24/7.",
  keywords: ["sécurité données", "RGPD", "chiffrement", "protection données", "hébergement Europe", "sécurité ERP"],
  openGraph: {
    title: "Sécurité & Protection des Données — Quelyos",
    description: "Vos données protégées avec un chiffrement de niveau bancaire et les meilleures pratiques de sécurité.",
    url: "https://quelyos.com/security",
  },
};

export default function SecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
