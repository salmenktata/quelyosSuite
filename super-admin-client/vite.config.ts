import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Recharts dans son propre chunk
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'charts';
          }
          // Lucide icons séparément
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          // React core
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          // React Router
          if (id.includes('react-router')) {
            return 'router';
          }
          // TanStack (React Query, React Table)
          if (id.includes('@tanstack')) {
            return 'tanstack';
          }
          // Date-fns
          if (id.includes('date-fns')) {
            return 'date-fns';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@quelyos/logger': fileURLToPath(new URL('../shared/logger/src', import.meta.url)),
      '@quelyos/types': fileURLToPath(new URL('../shared/types/src', import.meta.url)),
    },
  },
  server: {
    port: 9000,
    host: true,
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
