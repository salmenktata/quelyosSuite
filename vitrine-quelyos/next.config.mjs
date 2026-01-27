import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  compiler: {
    styledComponents: false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "@quelyos/ui"],
    scrollRestoration: true,
  },

  async rewrites() {
    const financeTarget =
      process.env.NEXT_PUBLIC_FINANCE_APP_URL ||
      (process.env.NODE_ENV === "development"
        ? "http://localhost:5175"
        : "https://finance-internal.quelyos.com");

    return {
      beforeFiles: [
        // NOTE: /finance/login et /finance/register sont servis localement
        {
          source: "/finance/dashboard/:path*",
          destination: `${financeTarget}/dashboard/:path*`,
        },
        {
          source: "/finance/auth/:path*",
          destination: `${financeTarget}/auth/:path*`,
        },
        {
          source: "/finance/api/:path*",
          destination: `${financeTarget}/api/:path*`,
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },

  async redirects() {
    return [
      {
        source: "/templates/:path*",
        destination: "/finance/templates/:path*",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/logos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  trailingSlash: false,
};

export default withBundleAnalyzer(nextConfig);
