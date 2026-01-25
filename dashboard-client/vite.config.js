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
            '/api/ecommerce': {
                target: 'http://localhost:8069',
                changeOrigin: true,
                secure: false,
                // Ne pas transmettre les cookies pour éviter les erreurs Odoo avec sessions invalides
                cookieDomainRewrite: '',
                configure: function (proxy) {
                    proxy.on('proxyReq', function (proxyReq) {
                        // Supprimer les cookies invalides pour éviter Access Denied Odoo
                        proxyReq.removeHeader('cookie');
                    });
                },
            },
            '/web': {
                target: 'http://localhost:8069',
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
