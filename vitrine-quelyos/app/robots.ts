import { MetadataRoute } from "next";
import { getAppUrl } from '@quelyos/config';

const BASE_URL = process.env.NEXT_PUBLIC_VITRINE_URL || getAppUrl('vitrine', process.env.NODE_ENV as 'development' | 'production');
const baseUrl = BASE_URL.replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/_next/static/", // Autoriser assets statiques (CSS, JS, fonts)
          "/logos/", // Autoriser logos pour rich snippets
        ],
        disallow: [
          "/_next/data/", // Bloquer données JSON Next.js
          "/api/", // Bloquer toutes les routes API
          "/auth/", // Bloquer pages authentification
          "/register", // Bloquer inscription
          "/superadmin/", // Bloquer panel admin
          "/finance/dashboard/", // Bloquer dashboard finance
          "/marketing/dashboard/", // Bloquer dashboard marketing
          "/*?*utm_*", // Bloquer URLs avec paramètres UTM (tracking)
          "/*/forgot-password", // Bloquer reset password
        ],
      },
      {
        userAgent: "GPTBot",
        disallow: ["/"],
      },
      {
        userAgent: "anthropic-ai",
        disallow: ["/"],
      },
      {
        userAgent: "CCBot",
        disallow: ["/"],
      },
      {
        userAgent: "ChatGPT-User",
        disallow: ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
