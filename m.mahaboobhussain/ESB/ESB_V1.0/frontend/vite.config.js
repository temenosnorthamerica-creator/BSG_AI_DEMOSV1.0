import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const basePath = env.VITE_BASE_PATH || '/'
  const proxyRules = {
    '/api': {
      target: 'http://localhost:8006',
      changeOrigin: true
    }
  }
  if (basePath !== '/') {
    proxyRules[`${basePath}api`] = {
      target: 'http://localhost:8006',
      changeOrigin: true,
      rewrite: (path) => path.replace(new RegExp(`^${basePath.replace(/\/$/, '')}`), '')
    }
  }
  return {
    plugins: [react()],
    base: basePath,
    server: {
      port: 3016,
      host: '0.0.0.0',
      allowedHosts: true,
      proxy: proxyRules
    }
  }
})
