import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/crm-banking-simulator/',
  server: {
    port: 3001,
    host: true,
    open: true,
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
    port: 3001
  }
})
