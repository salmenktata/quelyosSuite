import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    open: true,
    proxy: {
      '/api/ecommerce': {
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
})
