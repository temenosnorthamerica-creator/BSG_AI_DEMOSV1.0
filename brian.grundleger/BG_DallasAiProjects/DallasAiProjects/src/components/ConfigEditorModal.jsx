import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  X,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import { clsx } from 'clsx'

const CONFIG_API_URL = 'http://localhost:3010'

// Valid patterns
const VALID_PATTERNS = ['Events', 'APIs', 'Files']

/**
 * Parse and validate a single line
 */
function validateLine(line, lineNumber) {
  const trimmed = line.trim()

  if (!trimmed || trimmed.startsWith('#')) {
    return { valid: true, type: 'empty', lineNumber }
  }

  const colonIndex = trimmed.lastIndexOf(':')
  if (colonIndex === -1) {
    return { valid: false, lineNumber, error: 'Missing ":" separator', line: trimmed }
  }

  const pipeIndex = trimmed.indexOf('|')
  if (pipeIndex === -1) {
    return { valid: false, lineNumber, error: 'Missing "|" before patterns', line: trimmed }
  }

  const source = trimmed.substring(0, colonIndex).trim()
  const targetAndPatterns = trimmed.substring(colonIndex + 1)
  const [target, patternsStr] = targetAndPatterns.split('|').map(s => s.trim())

  if (!source) return { valid: false, lineNumber, error: 'Empty source name', line: trimmed }
  if (!target) return { valid: false, lineNumber, error: 'Empty target name', line: trimmed }
  if (!patternsStr) return { valid: false, lineNumber, error: 'No patterns', line: trimmed }

  const patterns = patternsStr.split(',').map(p => p.trim()).filter(p => p)
  const invalidPatterns = patterns.filter(p => !VALID_PATTERNS.includes(p))

  if (invalidPatterns.length > 0) {
    return { valid: false, lineNumber, error: `Invalid: ${invalidPatterns.join(', ')}`, line: trimmed }
  }

  return { valid: true, type: 'connection', lineNumber, source, target, patterns, line: trimmed }
}

/**
 * Validate entire content
 */
function validateContent(content) {
  const lines = content.split('\n')
  const results = lines.map((line, i) => validateLine(line, i + 1))
  const errors = results.filter(r => !r.valid)
  const connections = results.filter(r => r.valid && r.type === 'connection')

  const systems = new Set()
  connections.forEach(c => {
    systems.add(c.source)
    systems.add(c.target)
  })

  return {
    valid: errors.length === 0,
    errors,
    connections,
    systems: Array.from(systems),
    results
  }
}

export function ConfigEditorModal({ isOpen, onClose, onSaved }) {
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showHelp, setShowHelp] = useState(false)
  const [saveMessage, setSaveMessage] = useState(null)

  // Real-time validation
  const validation = useMemo(() => validateContent(content), [content])

  // Check if content has changed
  const hasChanges = content !== originalContent

  // Load config on open
  useEffect(() => {
    if (isOpen) {
      loadConfig()
    }
  }, [isOpen])

  const loadConfig = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${CONFIG_API_URL}/api/config`)
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.statusText}`)
      }
      const data = await response.json()
      setContent(data.content)
      setOriginalContent(data.content)
    } catch (err) {
      setError(`Failed to load configuration. Make sure the Config API server is running on port 3010.\n\nError: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!validation.valid) {
      setSaveMessage({ type: 'error', text: 'Please fix validation errors before saving' })
      setTimeout(() => setSaveMessage(null), 3000)
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch(`${CONFIG_API_URL}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save')
      }

      setOriginalContent(content)
      setSaveMessage({ type: 'success', text: 'Configuration saved! Diagram will refresh...' })

      // Notify parent and close after delay
      setTimeout(() => {
        setSaveMessage(null)
        if (onSaved) onSaved()
        onClose()
        // Force page reload to pick up new data
        window.location.reload()
      }, 1500)
    } catch (err) {
      setError(`Failed to save: ${err.message}`)
      setSaveMessage({ type: 'error', text: 'Failed to save configuration' })
      setTimeout(() => setSaveMessage(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setContent(originalContent)
    setSaveMessage({ type: 'info', text: 'Changes discarded' })
    setTimeout(() => setSaveMessage(null), 2000)
  }

  const handleClose = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Edit Integration Configuration</h2>
              <p className="text-sm text-slate-400">apps_integration_info.txt</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Help Toggle */}
            <button
              onClick={() => setShowHelp(!showHelp)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all",
                showHelp
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              )}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Help</span>
              {showHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Help Panel */}
        {showHelp && (
          <div className="p-4 bg-blue-500/10 border-b border-blue-500/20">
            <h3 className="text-sm font-semibold text-blue-400 mb-2">Format Guide</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-300 mb-2">
                  <strong>Syntax:</strong> <code className="px-1.5 py-0.5 rounded bg-slate-700 text-cyan-400">Source:Target|Pattern1,Pattern2</code>
                </p>
                <p className="text-slate-400 mb-2">
                  <strong>Available Patterns:</strong> <span className="text-green-400">Events</span>, <span className="text-blue-400">APIs</span>, <span className="text-purple-400">Files</span>
                </p>
                <p className="text-slate-400">
                  <strong>Comments:</strong> Lines starting with <code className="px-1 rounded bg-slate-700">#</code> are ignored
                </p>
              </div>
              <div>
                <p className="text-slate-300 mb-1"><strong>Examples:</strong></p>
                <pre className="p-2 rounded bg-slate-800 text-xs text-slate-300 overflow-x-auto">
{`CRM Banking Simulator:ESB - Enterprise Service Bus|Events
Debit Cards Demo:ESB - Enterprise Service Bus|Events,APIs
Core:Azure Event Hub|Events`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-3 bg-red-500/10 border-b border-red-500/20 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <pre className="text-sm text-red-300 whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <span className="ml-3 text-slate-400">Loading configuration...</span>
            </div>
          ) : (
            <>
              {/* Editor Section */}
              <div className="flex-1 flex flex-col border-r border-slate-700">
                <div className="p-2 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">EDITOR</span>
                  <span className="text-xs text-slate-500">
                    {content.split('\n').length} lines
                  </span>
                </div>
                <div className="flex-1 flex overflow-hidden">
                  {/* Line Numbers */}
                  <div className="p-3 bg-slate-900/50 text-right select-none border-r border-slate-700/50 overflow-hidden">
                    {content.split('\n').map((_, i) => {
                      const lineResult = validation.results[i]
                      const isError = lineResult && !lineResult.valid
                      return (
                        <div
                          key={i}
                          className={clsx(
                            "text-xs font-mono leading-6",
                            isError ? "text-red-400" : "text-slate-500"
                          )}
                        >
                          {i + 1}
                        </div>
                      )
                    })}
                  </div>
                  {/* Textarea */}
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="flex-1 p-3 bg-transparent text-slate-200 font-mono text-sm leading-6 resize-none focus:outline-none overflow-auto"
                    spellCheck={false}
                    placeholder="Enter integration configuration..."
                  />
                </div>
              </div>

              {/* Validation & Preview Section */}
              <div className="w-80 flex flex-col bg-slate-800/30">
                {/* Validation Status */}
                <div className="p-2 bg-slate-800/50 border-b border-slate-700">
                  <span className="text-xs text-slate-400 font-medium">VALIDATION</span>
                </div>
                <div className="p-3 border-b border-slate-700">
                  {validation.valid ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">All lines valid</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">{validation.errors.length} error(s)</span>
                    </div>
                  )}
                </div>

                {/* Errors List */}
                {validation.errors.length > 0 && (
                  <div className="p-3 border-b border-slate-700 max-h-32 overflow-auto">
                    <div className="space-y-2">
                      {validation.errors.map((err, i) => (
                        <div key={i} className="text-xs">
                          <span className="text-red-400 font-medium">Line {err.lineNumber}:</span>
                          <span className="text-slate-400 ml-1">{err.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview */}
                <div className="p-2 bg-slate-800/50 border-b border-slate-700">
                  <span className="text-xs text-slate-400 font-medium">PREVIEW</span>
                </div>
                <div className="flex-1 p-3 overflow-auto">
                  {/* Stats */}
                  <div className="flex gap-4 mb-3 text-xs">
                    <div className="text-slate-400">
                      <span className="text-white font-medium">{validation.systems.length}</span> systems
                    </div>
                    <div className="text-slate-400">
                      <span className="text-white font-medium">{validation.connections.length}</span> connections
                    </div>
                  </div>

                  {/* Connections Preview */}
                  <div className="space-y-1.5">
                    {validation.connections.slice(0, 10).map((conn, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-300 truncate max-w-[100px]" title={conn.source}>
                          {conn.source.length > 15 ? conn.source.substring(0, 12) + '...' : conn.source}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <span className="text-slate-300 truncate max-w-[100px]" title={conn.target}>
                          {conn.target.length > 15 ? conn.target.substring(0, 12) + '...' : conn.target}
                        </span>
                        <div className="flex gap-1 ml-auto">
                          {conn.patterns.map((p, pi) => (
                            <span
                              key={pi}
                              className={clsx(
                                "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                p === 'Events' && "bg-green-500/20 text-green-400",
                                p === 'APIs' && "bg-blue-500/20 text-blue-400",
                                p === 'Files' && "bg-purple-500/20 text-purple-400"
                              )}
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {validation.connections.length > 10 && (
                      <div className="text-xs text-slate-500 italic">
                        +{validation.connections.length - 10} more connections...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-xs text-amber-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Unsaved changes
              </span>
            )}
            {saveMessage && (
              <span className={clsx(
                "text-sm font-medium animate-pulse",
                saveMessage.type === 'success' && "text-green-400",
                saveMessage.type === 'error' && "text-red-400",
                saveMessage.type === 'info' && "text-blue-400"
              )}>
                {saveMessage.text}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Reload Button */}
            <button
              onClick={loadConfig}
              disabled={isLoading || isSaving}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all disabled:opacity-50"
              title="Reload from file"
            >
              <RefreshCw className={clsx("w-4 h-4", isLoading && "animate-spin")} />
              <span className="text-sm">Reload</span>
            </button>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              disabled={!hasChanges || isLoading || isSaving}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm">Discard</span>
            </button>

            {/* Cancel Button */}
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all"
            >
              Cancel
            </button>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={!validation.valid || !hasChanges || isLoading || isSaving}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                validation.valid && hasChanges
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-slate-700 text-slate-400 cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save & Apply</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfigEditorModal
