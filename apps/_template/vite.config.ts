import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const port = parseInt(process.env.VITE_PORT || '3010', 10)

export default defineConfig({
  plugins: [react()],
  appType: 'spa',
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    sourcemap: false,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react'
          }
          if (id.includes('react-router')) return 'vendor-router'
          if (id.includes('@tanstack')) return 'vendor-tanstack'
          if (id.includes('lucide-react')) return 'vendor-icons'
          if (id.includes('zod')) return 'vendor-validation'
          if (id.includes('framer-motion')) return 'vendor-motion'
          if (id.includes('node_modules')) return 'vendor-common'
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@quelyos/ui': fileURLToPath(new URL('../../packages/ui', import.meta.url)),
      '@quelyos/hooks': fileURLToPath(new URL('../../packages/hooks', import.meta.url)),
      '@quelyos/auth': fileURLToPath(new URL('../../packages/auth', import.meta.url)),
      '@quelyos/utils': fileURLToPath(new URL('../../packages/utils', import.meta.url)),
    },
  },
  server: {
    port,
    open: true,
    host: true,
    fs: {
      allow: [fileURLToPath(new URL('../..', import.meta.url))],
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
