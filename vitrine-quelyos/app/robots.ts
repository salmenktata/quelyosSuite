import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3006";
const baseUrl = BASE_URL.replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/_next/", "/api/", "/static/", "/*?*"],
      },
      {
        userAgent: "GPTBot",
        disallow: ["/"],
      },
      {
        userAgent: "anthropic-ai",
        disallow: ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
