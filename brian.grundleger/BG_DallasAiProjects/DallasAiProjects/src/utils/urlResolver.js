/**
 * URL resolver for multi-environment support.
 *
 * Local dev: Uses localhost:PORT directly (no config needed).
 * Public (behind Nginx): Auto-detects and uses path-based routing
 * through the current domain.
 */

// app.id → Nginx location path
const APP_PATHS = {
  'crm-banking-simulator': '/crm/',
  'bsg-demo-platform': '/bsg/',
  'debitcards-demo': '/debitcards/',
  'lms-applicant-portal': '/lms/',
  'creditos': '/bsg/?component=branch-loans&embed=true',
  'esb-demo': '/esb/',
}

// port → Nginx location path (for health checks)
const PORT_PATHS = {
  3000: '/',
  3001: '/crm/',
  3002: '/bsg/',
  3003: '/debitcards/',
  3004: '/lms/',
  3016: '/esb/',
  8002: '/bsg-api/',
  8003: '/debitcards-api/',
  8006: '/esb-api/',
  3010: '/config-api/',
}

function isLocal() {
  const hostname = window.location.hostname
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

/**
 * Get the public URL for a demo app.
 * @param {object} app - App object from systems.json (must have id and url fields)
 * @returns {string} URL to reach the app
 */
export function getAppUrl(app) {
  if (isLocal()) {
    return app.url
  }
  return `${window.location.origin}${APP_PATHS[app.id] || '/'}`
}

/**
 * Get the URL for a service by port (used by health checks).
 * @param {number} port - The service port
 * @param {string} [path=''] - Optional path to append (e.g. healthEndpoint)
 * @returns {string} URL to reach the service
 */
export function getServiceUrl(port, path = '') {
  if (isLocal()) {
    return `http://localhost:${port}${path}`
  }
  const basePath = PORT_PATHS[port] || '/'
  // Remove trailing slash from basePath if path starts with /
  const cleanBase = path.startsWith('/') ? basePath.replace(/\/$/, '') : basePath
  return `${window.location.origin}${cleanBase}${path}`
}

/**
 * Get the Config API base URL.
 * @returns {string} Config API URL
 */
export function getConfigApiUrl() {
  if (isLocal()) {
    return 'http://localhost:3010'
  }
  return `${window.location.origin}/config-api`
}

/**
 * Get the backend API docs URL for a given backend port.
 * @param {number} port - Backend port (e.g. 8002)
 * @param {string} [path='/docs'] - Path to append
 * @returns {string} URL to reach the backend docs
 */
export function getBackendUrl(port, path = '/docs') {
  if (isLocal()) {
    return `http://localhost:${port}${path}`
  }
  const basePath = PORT_PATHS[port] || '/'
  const cleanBase = path.startsWith('/') ? basePath.replace(/\/$/, '') : basePath
  return `${window.location.origin}${cleanBase}${path}`
}
