import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const basePath = env.VITE_BASE_PATH || '/'
  const proxyRules: Record<string, any> = {
    '/api/temenos': {
      target: 'https://americasbsgprd.temenos.com',
      changeOrigin: true,
      secure: true,
      rewrite: (path: string) => path.replace(/^\/api\/temenos/, ''),
    }
  }
  if (basePath !== '/') {
    proxyRules[`${basePath}api/temenos`] = {
      target: 'https://americasbsgprd.temenos.com',
      changeOrigin: true,
      secure: true,
      rewrite: (path: string) => path.replace(new RegExp(`^${basePath.replace(/\/$/, '')}\\/api\\/temenos`), ''),
    }
  }
  return {
    plugins: [react()],
    base: basePath,
    server: {
      port: 3001,
      host: true,
      allowedHosts: true,
      open: false,  // Disabled - Landing Page opens browser
      headers: {
        'X-Frame-Options': 'ALLOWALL',
        'Content-Security-Policy': "frame-ancestors *"
      },
      proxy: proxyRules
    },
    preview: {
      port: 3001,
      headers: {
        'X-Frame-Options': 'ALLOWALL',
        'Content-Security-Policy': "frame-ancestors *"
      }
    }
  }
})
