import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration images Odoo
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8069',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.odoo.com',
        pathname: '/**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development', // Désactive l'optimisation en dev pour debug
    formats: ['image/avif', 'image/webp'], // Formats modernes optimisés
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ISR (Incremental Static Regeneration)
  experimental: {
    staleTimes: {
      dynamic: 60,      // 60s ISR pages dynamiques
      static: 3600,     // 1h ISR pages statiques
    },
  },

  // Optimisation production
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true, // Compression gzip

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
