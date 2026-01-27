import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
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
      // Routes spécifiques AVANT les routes génériques
      '/dashboard': {
        target: 'http://127.0.0.1:8069',
        changeOrigin: true,
        secure: false,
        ws: false,
        rewrite: (path) => path.replace(/^\/dashboard/, '/api/ecommerce/dashboard'),
        configure: (proxy) => {
          proxy.on('error', (err, req) => {
            console.error('[Proxy Error] /dashboard ->', err.message);
          });
        },
      },
      '/reporting': {
        target: 'http://127.0.0.1:8069',
        changeOrigin: true,
        secure: false,
        ws: false,
        rewrite: (path) => path.replace(/^\/reporting/, '/api/ecommerce/reporting'),
      },
      // Routes API génériques APRÈS
      '/api/finance': {
        target: 'http://127.0.0.1:8069',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/finance/, '/api/ecommerce/finance'),
      },
      '/api/stock': {
        target: 'http://127.0.0.1:8069',
        changeOrigin: true,
        secure: false,
        ws: false,
        configure: (proxy) => {
          proxy.on('error', (err, req) => {
            console.error('[Proxy Error] /api/stock ->', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('[Proxy Request] /api/stock ->', req.url);
          });
        },
      },
      '/api/settings': {
        target: 'http://127.0.0.1:8069',
        changeOrigin: true,
        secure: false,
        ws: false,
      },
      '/api/ecommerce': {
        target: 'http://127.0.0.1:8069',
        changeOrigin: true,
        secure: false,
        ws: false,
      },
      '/web': {
        target: 'http://127.0.0.1:8069',
        changeOrigin: true,
        secure: false,
        ws: false,
      },
    },
  },
})
