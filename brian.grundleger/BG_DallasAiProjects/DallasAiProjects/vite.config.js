import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

// Path to the integration info file (relative to project root)
// DallasAiProjects → BG_DallasAiProjects → brian.grundleger → AMRBSGSYSINTDEMO
const INTEGRATION_FILE = path.resolve(__dirname, '../../../apps_integration_info.txt')
const GENERATOR_SCRIPT = path.resolve(__dirname, 'scripts/generateIntegrationData.js')

/**
 * Custom Vite plugin to watch apps_integration_info.txt
 * and auto-regenerate integrationData.js when it changes
 */
function integrationDataWatcher() {
  let watcher = null
  let isGenerating = false
  let server = null

  const runGenerator = () => {
    if (isGenerating) return
    isGenerating = true

    console.log('\n🔄 [IntegrationWatcher] Detected change in apps_integration_info.txt')
    console.log('   Regenerating integration data...\n')

    const child = spawn('node', [GENERATOR_SCRIPT], {
      stdio: 'inherit',
      shell: true
    })

    child.on('close', (code) => {
      isGenerating = false
      if (code === 0) {
        console.log('\n✅ [IntegrationWatcher] Data regenerated successfully!')
        // Trigger a full page reload via Vite's WebSocket
        if (server) {
          server.ws.send({ type: 'full-reload' })
        }
      } else {
        console.error('\n❌ [IntegrationWatcher] Generation failed with code:', code)
      }
    })
  }

  return {
    name: 'integration-data-watcher',

    configureServer(viteServer) {
      server = viteServer

      // Check if the integration file exists
      if (!fs.existsSync(INTEGRATION_FILE)) {
        console.warn(`\n⚠️  [IntegrationWatcher] File not found: ${INTEGRATION_FILE}`)
        console.warn('   File watching disabled.\n')
        return
      }

      console.log(`\n👁️  [IntegrationWatcher] Watching: ${INTEGRATION_FILE}\n`)

      // Watch the file for changes
      watcher = fs.watch(INTEGRATION_FILE, (eventType) => {
        if (eventType === 'change') {
          // Debounce - wait a bit in case of multiple rapid saves
          setTimeout(runGenerator, 100)
        }
      })
    },

    closeBundle() {
      // Cleanup watcher when server closes
      if (watcher) {
        watcher.close()
        watcher = null
      }
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      integrationDataWatcher()
    ],
    base: env.VITE_BASE_PATH || '/',
    server: {
      port: 3000,
      host: true,
      allowedHosts: true
    }
  }
})
