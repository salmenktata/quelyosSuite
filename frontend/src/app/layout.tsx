import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToastContainer } from "@/components/common/Toast";
import { SiteConfigProvider } from "@/lib/config/SiteConfigProvider";
import { siteConfig } from "@/lib/config/site";
import { ThemeProvider } from "@/lib/theme";
import { generateOrganizationSchema } from "@/lib/utils/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
        <SiteConfigProvider>
          <ThemeProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
            </div>
            <ToastContainer />
          </ThemeProvider>
        </SiteConfigProvider>
      </body>
    </html>
  );
}
