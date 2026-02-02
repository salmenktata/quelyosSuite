import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '@quelyos/logger': fileURLToPath(new URL('../shared/logger/src', import.meta.url)),
            '@quelyos/types': fileURLToPath(new URL('../shared/types/src', import.meta.url)),
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
            '/api/auth': {
                target: 'http://localhost:8069',
                changeOrigin: true,
                secure: false,
            },
            '/api/pos': {
                target: 'http://localhost:8069',
                changeOrigin: true,
                secure: false,
            },
            '/api/ecommerce': {
                target: 'http://localhost:8069',
                changeOrigin: true,
                secure: false,
                cookieDomainRewrite: '',
                configure: function (proxy) {
                    proxy.on('proxyReq', function (proxyReq) {
                        proxyReq.removeHeader('cookie');
                    });
                },
            },
            '/api/admin': {
                target: 'http://localhost:8069',
                changeOrigin: true,
                secure: false,
            },
            '/api/finance': {
                target: 'http://localhost:8069',
                changeOrigin: true,
                secure: false,
            },
            '/api/marketing': {
                target: 'http://localhost:8069',
                changeOrigin: true,
                secure: false,
            },
            '/web': {
                target: 'http://localhost:8069',
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
