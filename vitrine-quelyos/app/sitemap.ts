import { MetadataRoute } from "next";
import { getAppUrl } from '@quelyos/config';

const BASE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || getAppUrl('vitrine', process.env.NODE_ENV as 'development' | 'production');
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
    { path: "/modules", changeFrequency: "monthly", priority: 0.9 },
    { path: "/tarifs", changeFrequency: "monthly", priority: 0.9 },
    { path: "/secteurs", changeFrequency: "monthly", priority: 0.7 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.7 },
    { path: "/docs", changeFrequency: "weekly", priority: 0.8 },
    { path: "/faq", changeFrequency: "monthly", priority: 0.8 },
    { path: "/about", changeFrequency: "monthly", priority: 0.7 },
    { path: "/support", changeFrequency: "monthly", priority: 0.7 },
    { path: "/security", changeFrequency: "monthly", priority: 0.6 },

    // Modules - Pages principales
    { path: "/crm", changeFrequency: "monthly", priority: 0.8 },
    { path: "/stock", changeFrequency: "monthly", priority: 0.8 },
    { path: "/hr", changeFrequency: "monthly", priority: 0.8 },
    { path: "/pos", changeFrequency: "monthly", priority: 0.8 },
    { path: "/ecommerce", changeFrequency: "monthly", priority: 0.8 },

    // Finance App - Main Pages
    { path: "/finance", changeFrequency: "weekly", priority: 0.9 },
    { path: "/finance/pricing", changeFrequency: "monthly", priority: 0.8 },
    { path: "/finance/features", changeFrequency: "monthly", priority: 0.8 },
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
    { path: "/finance/compare", changeFrequency: "monthly", priority: 0.6 },
    { path: "/finance/terms", changeFrequency: "yearly", priority: 0.3 },

    // Legal Pages (Global)
    { path: "/legal/cgu", changeFrequency: "yearly", priority: 0.3 },
    { path: "/legal/cgv", changeFrequency: "yearly", priority: 0.3 },
    { path: "/legal/confidentialite", changeFrequency: "yearly", priority: 0.3 },
    { path: "/legal/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/legal/mentions-legales", changeFrequency: "yearly", priority: 0.3 },

    // Auth Pages (Global)
    { path: "/auth/login", changeFrequency: "monthly", priority: 0.4 },
    { path: "/register", changeFrequency: "monthly", priority: 0.4 },
    { path: "/auth/forgot-password", changeFrequency: "monthly", priority: 0.3 },

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

    // Solutions par secteur
    { path: "/solutions", changeFrequency: "monthly", priority: 0.9 },
    { path: "/solutions/restaurant", changeFrequency: "monthly", priority: 0.8 },
    { path: "/solutions/commerce", changeFrequency: "monthly", priority: 0.8 },
    { path: "/solutions/ecommerce", changeFrequency: "monthly", priority: 0.8 },
    { path: "/solutions/services", changeFrequency: "monthly", priority: 0.8 },
    { path: "/solutions/sante", changeFrequency: "monthly", priority: 0.7 },
    { path: "/solutions/btp", changeFrequency: "monthly", priority: 0.7 },
    { path: "/solutions/hotellerie", changeFrequency: "monthly", priority: 0.7 },
    { path: "/solutions/associations", changeFrequency: "monthly", priority: 0.7 },
    { path: "/solutions/industrie", changeFrequency: "monthly", priority: 0.7 },
    { path: "/solutions/immobilier", changeFrequency: "monthly", priority: 0.7 },
    { path: "/solutions/education", changeFrequency: "monthly", priority: 0.7 },
    { path: "/solutions/logistique", changeFrequency: "monthly", priority: 0.7 },

    // Secteurs
    { path: "/secteurs/industrie", changeFrequency: "monthly", priority: 0.6 },
    { path: "/secteurs/immobilier", changeFrequency: "monthly", priority: 0.6 },
    { path: "/secteurs/education", changeFrequency: "monthly", priority: 0.6 },
    { path: "/secteurs/logistique", changeFrequency: "monthly", priority: 0.6 },

    // E-commerce
    { path: "/ecommerce/pricing", changeFrequency: "monthly", priority: 0.8 },
    { path: "/ecommerce/signup", changeFrequency: "monthly", priority: 0.7 },
  ];

  return addBase(pages, now);
}
