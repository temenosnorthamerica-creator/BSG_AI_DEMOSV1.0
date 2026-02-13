import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    port: 3004,
    host: true,
    headers: {
      'X-Frame-Options': 'ALLOWALL',
      'Content-Security-Policy': "frame-ancestors *"
    },
    proxy: {
      '/api': {
        target: 'https://lmsdemo1.temenos.com/LendingAPI',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
