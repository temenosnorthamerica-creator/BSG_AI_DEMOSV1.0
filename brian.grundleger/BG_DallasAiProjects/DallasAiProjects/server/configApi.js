/**
 * Configuration API Server
 *
 * Simple Express server to read/write apps_integration_info.txt
 * Runs on port 3010
 */

import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { exec, spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { openSync, closeSync } from 'fs'

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3010

// Path to the integration config file (project root)
const PROJECT_ROOT = path.resolve(__dirname, '../../../../')
const CONFIG_FILE = path.join(PROJECT_ROOT, 'apps_integration_info.txt')
const GENERATOR_SCRIPT = path.join(__dirname, '../scripts/generateIntegrationData.js')
const LOGS_DIR = path.join(PROJECT_ROOT, 'logs')

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true })
}

// Service definitions for control operations
const SERVICES = [
  { id: 'config-api', name: 'Config API Server', port: 3010, path: 'brian.grundleger\\BG_DallasAiProjects\\DallasAiProjects', startCmd: 'npm run config-server', runtime: 'node' },
  { id: 'bsg-backend', name: 'BSG Demo - Backend', port: 8002, path: 'migarcia\\DALLASAI 1\\DALLASAI\\backend', startCmd: 'python -m uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload', runtime: 'python' },
  { id: 'debitcards-backend', name: 'Debit Cards - Backend', port: 8003, path: 'sweekruth.somaraju\\debitcards\\debitcards\\backend', startCmd: 'python -m uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload', runtime: 'python' },
  { id: 'esb-backend', name: 'ESB - Backend', port: 8006, path: 'm.mahaboobhussain\\ESB\\ESB_V1.0\\backend', startCmd: 'npm run start', runtime: 'node' },
  { id: 'landing', name: 'Landing Page', port: 3000, path: 'brian.grundleger\\BG_DallasAiProjects\\DallasAiProjects', startCmd: 'npm run dev', runtime: 'node' },
  { id: 'crm', name: 'CRM Banking Simulator', port: 3001, path: 'alwin\\crm-banking-simulator_v2\\crm-banking-simulator_v2', startCmd: 'npm run dev', runtime: 'node' },
  { id: 'bsg-frontend', name: 'BSG Demo - Frontend', port: 3002, path: 'migarcia\\DALLASAI 1\\DALLASAI\\frontend', startCmd: 'npm run dev', runtime: 'node' },
  { id: 'debitcards-frontend', name: 'Debit Cards - Frontend', port: 3003, path: 'sweekruth.somaraju\\debitcards\\debitcards\\frontend', startCmd: 'npm run dev', runtime: 'node' },
  { id: 'lms', name: 'LMS Applicant Portal', port: 3004, path: 'mmoore\\lms-applicant-portal\\lms-applicant-portal', startCmd: 'npm run dev', runtime: 'node' },
  { id: 'esb-frontend', name: 'ESB - Frontend', port: 3016, path: 'm.mahaboobhussain\\ESB\\ESB_V1.0\\frontend', startCmd: 'npm run dev', runtime: 'node' }
]

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.text())

// Valid patterns for validation
const VALID_PATTERNS = ['Events', 'APIs', 'Files']

/**
 * Parse and validate a single line of config
 */
function validateLine(line, lineNumber) {
  const trimmed = line.trim()

  // Empty lines and comments are valid
  if (!trimmed || trimmed.startsWith('#')) {
    return { valid: true, type: 'empty', lineNumber }
  }

  // Check for basic format: Source:Target|Patterns
  const colonIndex = trimmed.lastIndexOf(':')
  if (colonIndex === -1) {
    return {
      valid: false,
      lineNumber,
      error: 'Missing ":" separator between source and target',
      line: trimmed
    }
  }

  const pipeIndex = trimmed.indexOf('|')
  if (pipeIndex === -1) {
    return {
      valid: false,
      lineNumber,
      error: 'Missing "|" separator before patterns',
      line: trimmed
    }
  }

  const source = trimmed.substring(0, colonIndex).trim()
  const targetAndPatterns = trimmed.substring(colonIndex + 1)
  const [target, patternsStr] = targetAndPatterns.split('|').map(s => s.trim())

  if (!source) {
    return { valid: false, lineNumber, error: 'Source system name is empty', line: trimmed }
  }

  if (!target) {
    return { valid: false, lineNumber, error: 'Target system name is empty', line: trimmed }
  }

  if (!patternsStr) {
    return { valid: false, lineNumber, error: 'No patterns specified', line: trimmed }
  }

  const patterns = patternsStr.split(',').map(p => p.trim()).filter(p => p)

  if (patterns.length === 0) {
    return { valid: false, lineNumber, error: 'No valid patterns specified', line: trimmed }
  }

  // Check if patterns are valid
  const invalidPatterns = patterns.filter(p => !VALID_PATTERNS.includes(p))
  if (invalidPatterns.length > 0) {
    return {
      valid: false,
      lineNumber,
      error: `Invalid pattern(s): ${invalidPatterns.join(', ')}. Valid patterns are: ${VALID_PATTERNS.join(', ')}`,
      line: trimmed
    }
  }

  return {
    valid: true,
    type: 'connection',
    lineNumber,
    source,
    target,
    patterns,
    line: trimmed
  }
}

/**
 * Validate entire config content
 */
function validateConfig(content) {
  const lines = content.split('\n')
  const results = lines.map((line, index) => validateLine(line, index + 1))

  const errors = results.filter(r => !r.valid)
  const connections = results.filter(r => r.valid && r.type === 'connection')

  // Extract unique systems
  const systems = new Set()
  connections.forEach(conn => {
    systems.add(conn.source)
    systems.add(conn.target)
  })

  return {
    valid: errors.length === 0,
    errors,
    connections,
    systems: Array.from(systems),
    totalLines: lines.length,
    connectionCount: connections.length
  }
}

/**
 * Run the generator script to regenerate integrationData.js
 */
function regenerateData() {
  return new Promise((resolve, reject) => {
    exec(`node "${GENERATOR_SCRIPT}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('Generator error:', stderr)
        reject(new Error(stderr || error.message))
      } else {
        console.log('Generator output:', stdout)
        resolve(stdout)
      }
    })
  })
}

// ============ API Routes ============

/**
 * GET /api/config
 * Returns the current content of the config file
 */
app.get('/api/config', (req, res) => {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return res.status(404).json({ error: 'Config file not found', path: CONFIG_FILE })
    }

    const content = fs.readFileSync(CONFIG_FILE, 'utf-8')
    const validation = validateConfig(content)

    res.json({
      content,
      validation,
      filePath: CONFIG_FILE,
      lastModified: fs.statSync(CONFIG_FILE).mtime
    })
  } catch (error) {
    console.error('Error reading config:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/config/validate
 * Validates content without saving
 */
app.post('/api/config/validate', (req, res) => {
  try {
    const content = typeof req.body === 'string' ? req.body : req.body.content

    if (content === undefined || content === null) {
      return res.status(400).json({ error: 'No content provided' })
    }

    const validation = validateConfig(content)
    res.json(validation)
  } catch (error) {
    console.error('Error validating config:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/config
 * Saves new content to the config file and triggers regeneration
 */
app.post('/api/config', async (req, res) => {
  try {
    const content = typeof req.body === 'string' ? req.body : req.body.content

    if (content === undefined || content === null) {
      return res.status(400).json({ error: 'No content provided' })
    }

    // Validate before saving
    const validation = validateConfig(content)

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        validation
      })
    }

    // Create backup
    const backupPath = CONFIG_FILE + '.backup'
    if (fs.existsSync(CONFIG_FILE)) {
      fs.copyFileSync(CONFIG_FILE, backupPath)
    }

    // Write new content
    fs.writeFileSync(CONFIG_FILE, content, 'utf-8')
    console.log('Config file saved:', CONFIG_FILE)

    // Regenerate integration data
    try {
      await regenerateData()
      console.log('Integration data regenerated successfully')
    } catch (genError) {
      console.error('Failed to regenerate data:', genError)
      // Don't fail the request, file watcher will pick it up
    }

    res.json({
      success: true,
      message: 'Configuration saved and regenerated',
      validation,
      backupPath
    })
  } catch (error) {
    console.error('Error saving config:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/config/restore
 * Restores from backup
 */
app.post('/api/config/restore', async (req, res) => {
  try {
    const backupPath = CONFIG_FILE + '.backup'

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'No backup file found' })
    }

    fs.copyFileSync(backupPath, CONFIG_FILE)

    // Regenerate
    try {
      await regenerateData()
    } catch (genError) {
      console.error('Failed to regenerate after restore:', genError)
    }

    const content = fs.readFileSync(CONFIG_FILE, 'utf-8')
    const validation = validateConfig(content)

    res.json({
      success: true,
      message: 'Backup restored',
      content,
      validation
    })
  } catch (error) {
    console.error('Error restoring backup:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    configFile: CONFIG_FILE,
    configExists: fs.existsSync(CONFIG_FILE)
  })
})

// ============ Service Control Routes ============

/**
 * Get process ID by port using netstat
 */
function getProcessByPort(port) {
  return new Promise((resolve, reject) => {
    exec(`netstat -ano | findstr :${port} | findstr LISTENING`, (error, stdout) => {
      if (error || !stdout.trim()) {
        resolve(null)
        return
      }

      const lines = stdout.trim().split('\n')
      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        if (parts.length >= 5) {
          const pid = parseInt(parts[parts.length - 1])
          if (!isNaN(pid) && pid > 0) {
            resolve(pid)
            return
          }
        }
      }
      resolve(null)
    })
  })
}

/**
 * Kill process by PID - uses multiple methods for reliability
 */
function killProcess(pid) {
  return new Promise((resolve, reject) => {
    // First try PowerShell Stop-Process (often has better permissions)
    exec(`powershell -Command "Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue"`, (psError, psStdout, psStderr) => {
      // Give it a moment then verify
      setTimeout(() => {
        // Check if process is still running
        exec(`powershell -Command "Get-Process -Id ${pid} -ErrorAction SilentlyContinue"`, (checkError, checkStdout) => {
          if (checkError || !checkStdout.trim()) {
            // Process is gone
            resolve({ success: true, message: `Process ${pid} stopped` })
          } else {
            // Try taskkill as fallback
            exec(`taskkill /F /PID ${pid} /T`, { shell: 'cmd.exe' }, (tkError, tkStdout, tkStderr) => {
              if (tkError) {
                if (tkStderr && tkStderr.includes('not found')) {
                  resolve({ success: true, message: 'Process already stopped' })
                } else {
                  reject(new Error(tkStderr || tkError.message))
                }
              } else {
                resolve({ success: true, message: tkStdout.trim() })
              }
            })
          }
        })
      }, 300)
    })
  })
}

/**
 * Start a service as a detached background process (no visible window)
 * Uses Node.js spawn with detached mode for reliable background execution
 */
function startService(service) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(PROJECT_ROOT, service.path)

    if (!fs.existsSync(fullPath)) {
      reject(new Error(`Path not found: ${fullPath}`))
      return
    }

    // Log file path
    const logFile = path.join(LOGS_DIR, `${service.id}.log`)

    // Try to add timestamp header to log file (non-blocking - don't fail if file is locked)
    try {
      const timestamp = new Date().toISOString()
      const separator = '='.repeat(60)
      const header = `\n${separator}\n[${timestamp}] Starting ${service.name} (Port ${service.port})\n${separator}\n`
      fs.appendFileSync(logFile, header)
    } catch (logError) {
      console.log(`[WARN] Could not write to log file (may be locked): ${logError.message}`)
    }

    // Determine command and args based on runtime and service type
    let command, args
    let useShell = false

    if (service.runtime === 'node') {
      // Check if this is a backend service (has src/index.js) or frontend (uses Vite)
      const hasIndexJs = fs.existsSync(path.join(fullPath, 'src', 'index.js'))
      const isConfigServer = service.startCmd.includes('config-server')

      if (isConfigServer) {
        // Config API server
        command = 'node'
        args = ['server/configApi.js']
      } else if (hasIndexJs) {
        // Backend service with src/index.js - run node directly
        command = 'node'
        args = ['src/index.js']
      } else {
        // Frontend service (Vite-based) - use cmd with npm run dev
        command = process.platform === 'win32' ? 'cmd.exe' : 'sh'
        args = process.platform === 'win32' ? ['/c', 'npm run dev'] : ['-c', 'npm run dev']
        useShell = true
      }
    } else if (service.runtime === 'python') {
      command = 'python'
      // Extract python command args
      const match = service.startCmd.match(/python\s+(.+)/)
      args = match ? match[1].trim().split(/\s+/) : ['-m', 'uvicorn', 'app.main:app']
    } else {
      // Fallback: use cmd to run the command
      command = 'cmd'
      args = ['/c', service.startCmd]
      useShell = true
    }

    // Open log file for appending (create if doesn't exist)
    let outFd, errFd
    try {
      outFd = openSync(logFile, 'a')
      errFd = openSync(logFile, 'a')
    } catch (e) {
      // If can't open log file, use 'ignore' for stdio
      outFd = 'ignore'
      errFd = 'ignore'
    }

    // Spawn the process detached with no window
    const spawnOptions = {
      cwd: fullPath,
      detached: true,
      stdio: ['ignore', outFd, errFd],
      windowsHide: true
    }

    // For shell commands (npm, etc.), use shell option
    if (useShell) {
      spawnOptions.shell = true
    }

    const child = spawn(command, args, spawnOptions)

    // Unref so parent can exit independently
    child.unref()

    // Close file descriptors if we opened them
    if (typeof outFd === 'number') {
      try { closeSync(outFd) } catch (e) { /* ignore */ }
    }
    if (typeof errFd === 'number' && errFd !== outFd) {
      try { closeSync(errFd) } catch (e) { /* ignore */ }
    }

    console.log(`Started ${service.name} (PID: ${child.pid}) - Logs: ${logFile}`)
    resolve({ success: true, message: `Started ${service.name}`, logFile, pid: child.pid })
  })
}

/**
 * GET /api/services
 * List all services
 */
app.get('/api/services', (req, res) => {
  res.json(SERVICES)
})

/**
 * GET /api/services/:id/status
 * Get service status (running/stopped)
 */
app.get('/api/services/:id/status', async (req, res) => {
  try {
    const service = SERVICES.find(s => s.id === req.params.id)
    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    const pid = await getProcessByPort(service.port)
    res.json({
      id: service.id,
      name: service.name,
      port: service.port,
      running: pid !== null,
      pid
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/services/:id/stop
 * Stop a service by killing its process
 */
app.post('/api/services/:id/stop', async (req, res) => {
  try {
    const service = SERVICES.find(s => s.id === req.params.id)
    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    // Prevent stopping Config API from itself
    if (service.id === 'config-api') {
      return res.status(400).json({
        error: 'Cannot stop Config API server from the web interface',
        message: 'The Config API must remain running to process requests'
      })
    }

    const pid = await getProcessByPort(service.port)
    if (!pid) {
      return res.json({
        success: true,
        message: `${service.name} is already stopped`,
        wasRunning: false
      })
    }

    const result = await killProcess(pid)
    console.log(`Stopped ${service.name} (PID: ${pid})`)

    res.json({
      success: true,
      message: `${service.name} stopped successfully`,
      pid,
      wasRunning: true
    })
  } catch (error) {
    console.error(`Error stopping service:`, error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/services/:id/start
 * Start a service
 */
app.post('/api/services/:id/start', async (req, res) => {
  try {
    const service = SERVICES.find(s => s.id === req.params.id)
    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    // Check if already running
    const pid = await getProcessByPort(service.port)
    if (pid) {
      return res.json({
        success: true,
        message: `${service.name} is already running`,
        alreadyRunning: true,
        pid
      })
    }

    // Start service (don't wait for completion)
    startService(service).catch(err => console.error(`Error starting ${service.name}:`, err))
    console.log(`Starting ${service.name}...`)

    // Return immediately - UI will poll for status
    res.json({
      success: true,
      message: `${service.name} starting...`,
      alreadyRunning: false,
      pid: null
    })
  } catch (error) {
    console.error(`Error starting service:`, error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/services/:id/restart
 * Restart a service (stop then start)
 */
app.post('/api/services/:id/restart', async (req, res) => {
  try {
    const service = SERVICES.find(s => s.id === req.params.id)
    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    // Prevent restarting Config API from itself
    if (service.id === 'config-api') {
      return res.status(400).json({
        error: 'Cannot restart Config API server from the web interface',
        message: 'Use the PowerShell terminal to restart the Config API'
      })
    }

    // Stop if running
    const pid = await getProcessByPort(service.port)
    if (pid) {
      await killProcess(pid)
      console.log(`Stopped ${service.name} for restart`)
      // Brief wait for process to terminate
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Start service (don't wait for completion)
    startService(service).catch(err => console.error(`Error restarting ${service.name}:`, err))
    console.log(`Restarting ${service.name}...`)

    // Return immediately - UI will poll for status
    res.json({
      success: true,
      message: `${service.name} restarting...`,
      pid: null
    })
  } catch (error) {
    console.error(`Error restarting service:`, error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/services/start-all
 * Start all stopped services
 */
app.post('/api/services/start-all', async (req, res) => {
  try {
    const results = []

    for (const service of SERVICES) {
      const pid = await getProcessByPort(service.port)
      if (pid) {
        results.push({
          id: service.id,
          name: service.name,
          success: true,
          message: 'Already running',
          alreadyRunning: true
        })
      } else {
        try {
          await startService(service)
          results.push({
            id: service.id,
            name: service.name,
            success: true,
            message: 'Started',
            alreadyRunning: false
          })
        } catch (err) {
          results.push({
            id: service.id,
            name: service.name,
            success: false,
            error: err.message
          })
        }
      }
      // Small delay between starts
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    res.json({ success: true, results })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/services/restart-all
 * Restart all services (except Config API)
 */
app.post('/api/services/restart-all', async (req, res) => {
  try {
    const results = []

    for (const service of SERVICES) {
      // Skip Config API
      if (service.id === 'config-api') {
        results.push({
          id: service.id,
          name: service.name,
          success: true,
          message: 'Skipped (cannot restart from web)',
          skipped: true
        })
        continue
      }

      try {
        // Stop if running
        const pid = await getProcessByPort(service.port)
        if (pid) {
          await killProcess(pid)
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        // Start
        await startService(service)
        results.push({
          id: service.id,
          name: service.name,
          success: true,
          message: 'Restarted'
        })
      } catch (err) {
        results.push({
          id: service.id,
          name: service.name,
          success: false,
          error: err.message
        })
      }

      await new Promise(resolve => setTimeout(resolve, 500))
    }

    res.json({ success: true, results })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/services/:id/logs
 * Get service log file content (last N lines)
 */
app.get('/api/services/:id/logs', (req, res) => {
  try {
    const service = SERVICES.find(s => s.id === req.params.id)
    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    const logFile = path.join(LOGS_DIR, `${service.id}.log`)
    const lines = parseInt(req.query.lines) || 100 // Default last 100 lines

    if (!fs.existsSync(logFile)) {
      return res.json({
        id: service.id,
        name: service.name,
        logFile,
        exists: false,
        content: '',
        lines: 0
      })
    }

    const content = fs.readFileSync(logFile, 'utf8')
    const allLines = content.split('\n')
    const lastLines = allLines.slice(-lines).join('\n')

    res.json({
      id: service.id,
      name: service.name,
      logFile,
      exists: true,
      content: lastLines,
      totalLines: allLines.length,
      returnedLines: Math.min(lines, allLines.length)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * DELETE /api/services/:id/logs
 * Clear service log file
 */
app.delete('/api/services/:id/logs', (req, res) => {
  try {
    const service = SERVICES.find(s => s.id === req.params.id)
    if (!service) {
      return res.status(404).json({ error: 'Service not found' })
    }

    const logFile = path.join(LOGS_DIR, `${service.id}.log`)

    if (fs.existsSync(logFile)) {
      fs.writeFileSync(logFile, `[${new Date().toISOString()}] Log cleared\n`)
    }

    res.json({
      success: true,
      message: `Logs cleared for ${service.name}`
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/logs
 * List all log files
 */
app.get('/api/logs', (req, res) => {
  try {
    if (!fs.existsSync(LOGS_DIR)) {
      return res.json({ logs: [] })
    }

    const files = fs.readdirSync(LOGS_DIR)
      .filter(f => f.endsWith('.log'))
      .map(f => {
        const filePath = path.join(LOGS_DIR, f)
        const stats = fs.statSync(filePath)
        const serviceId = f.replace('.log', '')
        const service = SERVICES.find(s => s.id === serviceId)
        return {
          file: f,
          serviceId,
          serviceName: service?.name || serviceId,
          size: stats.size,
          modified: stats.mtime
        }
      })

    res.json({ logsDir: LOGS_DIR, logs: files })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`\n========================================`)
  console.log(` Config API Server running on port ${PORT}`)
  console.log(`========================================`)
  console.log(` Logs Directory: ${LOGS_DIR}`)
  console.log(``)
  console.log(` Config Endpoints:`)
  console.log(`   GET  http://localhost:${PORT}/api/config`)
  console.log(`   POST http://localhost:${PORT}/api/config`)
  console.log(`   POST http://localhost:${PORT}/api/config/validate`)
  console.log(`   POST http://localhost:${PORT}/api/config/restore`)
  console.log(``)
  console.log(` Service Control Endpoints:`)
  console.log(`   GET  http://localhost:${PORT}/api/services`)
  console.log(`   GET  http://localhost:${PORT}/api/services/:id/status`)
  console.log(`   POST http://localhost:${PORT}/api/services/:id/stop`)
  console.log(`   POST http://localhost:${PORT}/api/services/:id/start`)
  console.log(`   POST http://localhost:${PORT}/api/services/:id/restart`)
  console.log(`   POST http://localhost:${PORT}/api/services/start-all`)
  console.log(`   POST http://localhost:${PORT}/api/services/restart-all`)
  console.log(``)
  console.log(` Log Endpoints:`)
  console.log(`   GET  http://localhost:${PORT}/api/logs`)
  console.log(`   GET  http://localhost:${PORT}/api/services/:id/logs`)
  console.log(`   DELETE http://localhost:${PORT}/api/services/:id/logs`)
  console.log(``)
  console.log(`   GET  http://localhost:${PORT}/health`)
  console.log(``)
  console.log(` Config file: ${CONFIG_FILE}`)
  console.log(`========================================\n`)
})
