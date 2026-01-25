import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Quelyos — Suite SaaS TPE/PME | Finance & Marketing",
  description: "La Suite Quelyos pour piloter votre TPE : trésorerie IA avec Finance, marketing social automatisé avec Marketing. 2 plateformes complémentaires.",
  keywords: ["trésorerie", "marketing", "TPE", "PME", "SaaS", "IA", "Instagram", "Facebook", "prévisions"],
  authors: [{ name: "Salmen Ktata" }],
  openGraph: {
    title: "Quelyos — Suite SaaS TPE/PME",
    description: "Pilotez votre trésorerie et automatisez votre marketing digital avec la Suite Quelyos.",
    url: "https://quelyos.com",
    siteName: "Quelyos",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quelyos — Suite SaaS TPE/PME",
    description: "Pilotez votre trésorerie et automatisez votre marketing digital.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${inter.variable} antialiased bg-slate-950`}
      >
        {children}
      </body>
    </html>
  );
}
