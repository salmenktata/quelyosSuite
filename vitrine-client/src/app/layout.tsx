import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import { HeaderWrapper } from "@/components/layout/HeaderWrapper";
import { ToastContainer } from "@/components/common/Toast";
import { AppProviders } from "@/components/providers";
import { siteConfig } from "@/lib/config/site";
import { generateOrganizationSchema } from "@/lib/utils/seo";

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

        {/* Organization Schema.org JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <AppProviders>
          <div className="flex flex-col min-h-screen">
            <HeaderWrapper />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
          <ToastContainer />
        </AppProviders>
      </body>
    </html>
  );
}
