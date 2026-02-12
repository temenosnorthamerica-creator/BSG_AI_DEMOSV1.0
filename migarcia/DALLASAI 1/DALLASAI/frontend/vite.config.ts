import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  cacheDir: '.vite',
  base: '/', // Ensure base path is root for Azure Static Web Apps
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  },
  server: {
    port: 3002,
    host: true,
    strictPort: false,
    headers: {
      'X-Frame-Options': 'ALLOWALL',
      'Content-Security-Policy': "frame-ancestors *"
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            // Only log non-connection errors
            if (err.code !== 'ECONNRESET' && err.code !== 'ECONNREFUSED') {
              console.log('Proxy error:', err.code, err.message);
            }
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.setTimeout(900000);
          });
        },
        timeout: 900000
      }
    }
  }
})

