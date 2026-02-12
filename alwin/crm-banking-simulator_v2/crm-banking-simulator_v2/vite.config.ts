import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: true,
    open: false,  // Disabled - Landing Page opens browser
    headers: {
      'X-Frame-Options': 'ALLOWALL',
      'Content-Security-Policy': "frame-ancestors *"
    },
    proxy: {
      '/api/temenos': {
        target: 'https://americasbsgprd.temenos.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/temenos/, ''),
      }
    }
  },
  preview: {
    port: 3001,
    headers: {
      'X-Frame-Options': 'ALLOWALL',
      'Content-Security-Policy': "frame-ancestors *"
    }
  }
})
