import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const basePath = env.VITE_BASE_PATH || '/'
  const proxyRules: Record<string, any> = {
    '/api': {
      target: 'http://localhost:8003',
      changeOrigin: true,
    }
  }
  if (basePath !== '/') {
    proxyRules[`${basePath}api`] = {
      target: 'http://localhost:8003',
      changeOrigin: true,
      rewrite: (path: string) => path.replace(new RegExp(`^${basePath.replace(/\/$/, '')}`), '')
    }
  }
  return {
    plugins: [react()],
    base: basePath,
    server: {
      port: 3003,
      host: true,
      allowedHosts: true,
      headers: {
        'X-Frame-Options': 'ALLOWALL',
        'Content-Security-Policy': "frame-ancestors *"
      },
      proxy: proxyRules,
    },
  }
})
