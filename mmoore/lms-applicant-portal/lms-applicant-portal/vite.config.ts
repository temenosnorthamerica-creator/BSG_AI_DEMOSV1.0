import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const basePath = env.VITE_BASE_PATH || '/'
  const proxyRules: Record<string, any> = {
    '/api': {
      target: 'https://lmsdemo1.temenos.com/LendingAPI',
      changeOrigin: true,
      secure: true,
    }
  }
  if (basePath !== '/') {
    proxyRules[`${basePath}api`] = {
      target: 'https://lmsdemo1.temenos.com/LendingAPI',
      changeOrigin: true,
      secure: true,
      rewrite: (path: string) => path.replace(new RegExp(`^${basePath.replace(/\/$/, '')}`), '')
    }
  }
  return {
    plugins: [react()],
    base: basePath,
    server: {
      port: 3004,
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
