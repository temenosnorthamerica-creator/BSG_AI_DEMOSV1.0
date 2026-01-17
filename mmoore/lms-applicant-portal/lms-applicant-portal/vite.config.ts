import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3004,
    host: true,
    proxy: {
      '/api': {
        target: 'https://lmsdemo1.temenos.com/LendingAPI',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
