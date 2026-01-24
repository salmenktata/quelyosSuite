import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToastContainer } from "@/components/common/Toast";
import { SiteConfigProvider } from "@/lib/config/SiteConfigProvider";
import { siteConfig } from "@/lib/config/site";
import { ThemeProvider } from "@/lib/theme";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: `${siteConfig.brand.name} - ${siteConfig.brand.slogan}`,
  description: siteConfig.brand.description,
  keywords: ["e-commerce", "boutique", "produits"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
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
