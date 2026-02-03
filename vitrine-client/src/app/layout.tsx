import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import { HeaderWrapper } from "@/components/layout/HeaderWrapper";
import { ToastContainer } from "@/components/common/Toast";
import { AppProviders } from "@/components/providers";
import { siteConfig } from "@/lib/config/site";
import { generateOrganizationSchema } from "@/lib/utils/seo";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { PushNotificationPrompt } from "@/components/pwa/PushNotificationPrompt";
import { FAQChatbot } from "@/components/chat/FAQChatbot";
import { ThemeProvider } from "@/theme-engine/ThemeProvider";
import { getBackendUrlForPreload } from "@/lib/backend";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap", // Prevent FOUT/FOIT causing CLS
});

export const metadata: Metadata = {
  title: `${siteConfig.brand.name} - ${siteConfig.brand.slogan}`,
  description: siteConfig.brand.description,
  keywords: ["e-commerce", "boutique", "produits"],
};

// Preload hero image for LCP optimization
const heroImageUrl = "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=600&fit=crop";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Generate Organization schema for SEO
  const organizationSchema = generateOrganizationSchema();

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#dc2626" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Boutique" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />

        {/* Preload LCP hero image */}
        <link
          rel="preload"
          as="image"
          href={heroImageUrl}
          fetchPriority="high"
        />
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />

        {/* Preconnect to backend API for faster data fetching */}
        <link rel="preconnect" href={getBackendUrlForPreload()} />
        <link rel="dns-prefetch" href={getBackendUrlForPreload()} />

        {/* Organization Schema.org JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <AppProviders>
          <ThemeProvider tenantId={1}>
            <ServiceWorkerRegistration />
            <div className="flex flex-col min-h-screen">
              <HeaderWrapper />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
            </div>
            <ToastContainer />
            <FAQChatbot />
            <PushNotificationPrompt />
          </ThemeProvider>
        </AppProviders>
      </body>
    </html>
  );
}
