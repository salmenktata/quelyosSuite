import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer (généré à chaque build)
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    // Minification agressive
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Supprimer console.log en production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    // Source maps pour debugging (mais pas inline)
    sourcemap: false,
    // Taille optimale des chunks
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Noms de fichiers avec hash pour cache-busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks(id) {
          // Vendor chunks (libs externes)
          // ExcelJS dans son propre chunk (heavy, lazy loaded)
          if (id.includes('exceljs')) {
            return 'vendor-exceljs';
          }
          // Recharts + D3 (heavy charting libs)
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'vendor-charts';
          }
          // Framer Motion (animations)
          if (id.includes('framer-motion')) {
            return 'vendor-motion';
          }
          // Zod (validation)
          if (id.includes('zod')) {
            return 'vendor-validation';
          }
          // Lucide icons (split per 50 icons)
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          // React core (framework)
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // React Router
          if (id.includes('react-router')) {
            return 'vendor-router';
          }
          // TanStack (React Query, etc.)
          if (id.includes('@tanstack')) {
            return 'vendor-tanstack';
          }
          // Date utilities
          if (id.includes('date-fns')) {
            return 'vendor-dates';
          }
          // DnD Kit
          if (id.includes('@dnd-kit')) {
            return 'vendor-dnd';
          }
          // Headless UI
          if (id.includes('@headlessui')) {
            return 'vendor-ui';
          }
          // Autres node_modules (regroupés)
          if (id.includes('node_modules')) {
            return 'vendor-common';
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@quelyos/logger': fileURLToPath(new URL('../shared/logger/src', import.meta.url)),
      '@quelyos/types': fileURLToPath(new URL('../shared/types/src', import.meta.url)),
      '@quelyos/api-client': fileURLToPath(new URL('../shared/api-client/src', import.meta.url)),
      '@quelyos/ui/animated': fileURLToPath(new URL('./src/lib/finance/compat/animated.tsx', import.meta.url)),
    },
  },
  server: {
    port: 5175,
    open: true,
    fs: {
      allow: [fileURLToPath(new URL('..', import.meta.url))],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8069',
        changeOrigin: true,
        secure: false,
      },
    },
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
  preview: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },
})
