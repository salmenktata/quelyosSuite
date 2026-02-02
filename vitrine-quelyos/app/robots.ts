import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000";
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
