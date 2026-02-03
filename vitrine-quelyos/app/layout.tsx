import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ChatBotWrapper from "./components/ChatBotWrapper";
import { WebVitals } from "./components/WebVitals";
import { OrganizationSchema } from "./components/StructuredData";
import { getBackendUrl } from '@quelyos/config';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  weight: ["400", "500", "600", "700"],
});

// Force SSG (Static Site Generation) pour performance optimale
export const dynamic = 'force-static';

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://quelyos.com"),
  title: {
    default: "Quelyos — Suite ERP Complète | Solutions Métier Intégrées",
    template: "%s | Quelyos",
  },
  description: "Suite ERP complète pour entreprises : solutions métier intégrées (Finance, CRM, Stock, RH, POS, Marketing, E-commerce). IA native, données synchronisées, infrastructure sécurisée.",
  keywords: ["ERP complet", "logiciel gestion", "trésorerie IA", "CRM", "gestion stock", "RH", "point de vente", "marketing automation", "TPE", "PME", "SaaS", "RGPD", "solutions métier", "restaurant", "commerce", "e-commerce"],
  authors: [{ name: "Quelyos" }],
  creator: "Quelyos",
  publisher: "Quelyos",
  formatDetection: {
    email: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Quelyos — Suite ERP Complète | Solutions Métier Intégrées",
    description: "Pilotez toute votre entreprise depuis une seule plateforme. Solutions Finance, CRM, Stock, RH, POS, Marketing — tout inclus. IA intégrée, infrastructure sécurisée.",
    url: "https://quelyos.com",
    siteName: "Quelyos",
    locale: "fr",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Quelyos - Suite ERP Complète pour Entreprises",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quelyos — Suite ERP Complète | Solutions Métier Intégrées",
    description: "Solutions métier intégrées, IA native, infrastructure sécurisée. Suite ERP pensée pour les TPE/PME.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://quelyos.com",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || getBackendUrl(process.env.NODE_ENV as 'development' | 'production');

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href={backendUrl} />
        <link rel="dns-prefetch" href={backendUrl} />
        <OrganizationSchema />
      </head>
      <body
        className={`${inter.variable} antialiased bg-slate-950`}
        suppressHydrationWarning
      >
        <WebVitals />
        {children}
        <ChatBotWrapper />
      </body>
    </html>
  );
}
