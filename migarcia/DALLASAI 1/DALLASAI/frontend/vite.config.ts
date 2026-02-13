import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const basePath = env.VITE_BASE_PATH || '/'
  const apiProxyConfig = {
    target: 'http://localhost:8002',
    changeOrigin: true,
    secure: false,
    ws: true,
    configure: (proxy: any, _options: any) => {
      proxy.on('error', (err: any, _req: any, _res: any) => {
        // Only log non-connection errors
        if (err.code !== 'ECONNRESET' && err.code !== 'ECONNREFUSED') {
          console.log('Proxy error:', err.code, err.message);
        }
      });
      proxy.on('proxyReq', (proxyReq: any, req: any, _res: any) => {
        proxyReq.setTimeout(900000);
      });
    },
    timeout: 900000
  }
  const proxyRules: Record<string, any> = {
    '/api': apiProxyConfig
  }
  if (basePath !== '/') {
    proxyRules[`${basePath}api`] = {
      ...apiProxyConfig,
      rewrite: (path: string) => path.replace(new RegExp(`^${basePath.replace(/\/$/, '')}`), '')
    }
  }
  return {
    plugins: [react()],
    cacheDir: '.vite',
    base: basePath,
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true
    },
    server: {
      port: 3002,
      host: true,
      allowedHosts: true,
      strictPort: false,
      headers: {
        'X-Frame-Options': 'ALLOWALL',
        'Content-Security-Policy': "frame-ancestors *"
      },
      proxy: proxyRules
    }
  }
})

