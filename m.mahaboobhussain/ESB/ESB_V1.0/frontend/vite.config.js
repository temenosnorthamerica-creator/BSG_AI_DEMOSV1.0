import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3016,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8006',
        changeOrigin: true
      }
    }
  }
})
