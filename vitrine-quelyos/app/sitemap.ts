import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3006";
const baseUrl = BASE_URL.replace(/\/$/, "");

type Entry = Omit<MetadataRoute.Sitemap[number], "url"> & { path: string };

const addBase = (entries: Entry[], lastModified: Date): MetadataRoute.Sitemap =>
  entries.map(({ path, ...rest }) => ({
    url: `${baseUrl}${path}`,
    lastModified,
    ...rest,
  }));

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const pages: Entry[] = [
    // Homepage & Global Pages
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/tarifs", changeFrequency: "monthly", priority: 0.8 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
    { path: "/ecommerce", changeFrequency: "monthly", priority: 0.6 },

    // Finance App - Main Pages
    { path: "/finance", changeFrequency: "weekly", priority: 0.9 },
    { path: "/finance/pricing", changeFrequency: "monthly", priority: 0.8 },
    { path: "/finance/features", changeFrequency: "monthly", priority: 0.8 },
    { path: "/finance/about", changeFrequency: "monthly", priority: 0.7 },
    { path: "/finance/contact", changeFrequency: "monthly", priority: 0.7 },
    { path: "/finance/support", changeFrequency: "monthly", priority: 0.7 },
    { path: "/finance/roadmap", changeFrequency: "weekly", priority: 0.7 },
    { path: "/finance/backlog", changeFrequency: "weekly", priority: 0.6 },
    { path: "/finance/backlog-technique", changeFrequency: "weekly", priority: 0.5 },
    { path: "/finance/strategie", changeFrequency: "monthly", priority: 0.6 },

    // Finance - Features
    { path: "/finance/features/dashboard", changeFrequency: "monthly", priority: 0.7 },
    { path: "/finance/features/accounts", changeFrequency: "monthly", priority: 0.7 },
    { path: "/finance/features/comptes", changeFrequency: "monthly", priority: 0.7 },
    { path: "/finance/features/budgets", changeFrequency: "monthly", priority: 0.7 },
    { path: "/finance/features/forecast", changeFrequency: "monthly", priority: 0.7 },
    { path: "/finance/features/previsions", changeFrequency: "monthly", priority: 0.7 },
    { path: "/finance/features/reports", changeFrequency: "monthly", priority: 0.7 },
    { path: "/finance/features/charts", changeFrequency: "monthly", priority: 0.6 },
    { path: "/finance/features/security", changeFrequency: "monthly", priority: 0.6 },
    { path: "/finance/features/team", changeFrequency: "monthly", priority: 0.6 },

    // Finance - Target Audience
    { path: "/finance/tpe", changeFrequency: "monthly", priority: 0.7 },
    { path: "/finance/customers", changeFrequency: "monthly", priority: 0.6 },

    // Finance - Templates
    { path: "/finance/templates", changeFrequency: "monthly", priority: 0.6 },
    { path: "/finance/templates/agence-web", changeFrequency: "monthly", priority: 0.5 },
    { path: "/finance/templates/startup-saas", changeFrequency: "monthly", priority: 0.5 },
    { path: "/finance/templates/cabinet-conseil", changeFrequency: "monthly", priority: 0.5 },
    { path: "/finance/templates/bureau-etudes", changeFrequency: "monthly", priority: 0.5 },

    // Finance - Resources & Comparison
    { path: "/finance/docs", changeFrequency: "weekly", priority: 0.6 },
    { path: "/finance/faq", changeFrequency: "monthly", priority: 0.6 },
    { path: "/finance/compare", changeFrequency: "monthly", priority: 0.6 },
    { path: "/finance/security", changeFrequency: "monthly", priority: 0.5 },

    // Finance - Legal
    { path: "/finance/cgu", changeFrequency: "yearly", priority: 0.3 },
    { path: "/finance/cgv", changeFrequency: "yearly", priority: 0.3 },
    { path: "/finance/confidentialite", changeFrequency: "yearly", priority: 0.3 },
    { path: "/finance/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/finance/mentions-legales", changeFrequency: "yearly", priority: 0.3 },
    { path: "/finance/terms", changeFrequency: "yearly", priority: 0.3 },

    // Marketing App - Main Pages
    { path: "/marketing", changeFrequency: "weekly", priority: 0.9 },
    { path: "/marketing/tarifs", changeFrequency: "monthly", priority: 0.8 },
    { path: "/marketing/features", changeFrequency: "monthly", priority: 0.8 },
    { path: "/marketing/contact", changeFrequency: "monthly", priority: 0.7 },
    { path: "/marketing/roadmap", changeFrequency: "weekly", priority: 0.7 },
    { path: "/marketing/backlog", changeFrequency: "weekly", priority: 0.6 },
    { path: "/marketing/backlog-technique", changeFrequency: "weekly", priority: 0.5 },
    { path: "/marketing/strategie", changeFrequency: "monthly", priority: 0.6 },
    { path: "/marketing/strategie-2026", changeFrequency: "monthly", priority: 0.6 },

    // Marketing - Legal
    { path: "/marketing/cgu", changeFrequency: "yearly", priority: 0.3 },
    { path: "/marketing/confidentialite", changeFrequency: "yearly", priority: 0.3 },
    { path: "/marketing/mentions-legales", changeFrequency: "yearly", priority: 0.3 },
  ];

  return addBase(pages, now);
}
