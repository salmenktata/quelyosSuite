import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import dynamic from "next/dynamic";

// Lazy load ChatBot (non-critique, below-the-fold)
const ConditionalChatBot = dynamic(() => import("./components/ConditionalChatBot"), {
  ssr: false,
  loading: () => null,
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Force SSG (Static Site Generation) pour performance optimale
export const dynamic = 'force-static';

export const metadata: Metadata = {
  metadataBase: new URL("https://quelyos.com"),
  title: {
    default: "Quelyos — Suite ERP française | Solutions métier intégrées",
    template: "%s | Quelyos",
  },
  description: "Suite ERP française pour TPE/PME : solutions métier complètes (Finance, CRM, Stock, RH, POS, Marketing, E-commerce). IA intégrée, données synchronisées, hébergement France.",
  keywords: ["ERP", "ERP français", "logiciel gestion", "trésorerie IA", "CRM", "gestion stock", "RH", "point de vente", "marketing automation", "TPE", "PME", "SaaS", "Made in France", "RGPD", "solutions métier", "restaurant", "commerce", "e-commerce"],
  authors: [{ name: "Quelyos" }],
  creator: "Quelyos",
  publisher: "Quelyos",
  formatDetection: {
    email: false,
    telephone: false,
  },
  openGraph: {
    title: "Quelyos — Suite ERP française | Solutions métier intégrées",
    description: "Pilotez toute votre entreprise depuis une seule plateforme. Solutions Finance, CRM, Stock, RH, POS, Marketing — tout inclus. IA intégrée, hébergement France.",
    url: "https://quelyos.com",
    siteName: "Quelyos",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Quelyos - Suite ERP française pour TPE/PME",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quelyos — Suite ERP française | Solutions métier intégrées",
    description: "Solutions métier intégrées, IA native, hébergement France. L'ERP pensé pour les TPE/PME françaises.",
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
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-slate-950`}
        suppressHydrationWarning
      >
        {children}
        <ConditionalChatBot />
      </body>
    </html>
  );
}
