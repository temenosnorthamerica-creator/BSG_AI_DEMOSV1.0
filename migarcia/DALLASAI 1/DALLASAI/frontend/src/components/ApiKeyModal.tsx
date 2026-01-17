import { useState, useEffect } from 'react'
import { X, Save, Key, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import axios from 'axios'

interface ApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

export function ApiKeyModal({ isOpen, onClose, onSave }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load existing API key when modal opens
  useEffect(() => {
    if (isOpen) {
      loadApiKey()
    }
  }, [isOpen])

  const loadApiKey = async () => {
    setLoading(true)
    setMessage(null)

    try {
      // Load from localStorage as fallback
      const storedKey = localStorage.getItem('temenos_api_key')
      if (storedKey) {
        setApiKey(storedKey)
        setLoading(false)
        return
      }

      // Try to load from backend with short timeout
      const response = await axios.get('http://localhost:8000/api/v1/integration/api-key', {
        headers: {
          'X-User-Id': 'demo_user'
        },
        timeout: 1000 // 1 second timeout
      })

      if (response.data.has_key) {
        setApiKey(response.data.api_key)
        // Also store in localStorage
        localStorage.setItem('temenos_api_key', response.data.api_key)
      }
    } catch (error: any) {
      console.log('Using localStorage for API key storage')
      // Silently fail and use localStorage
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setMessage({
        type: 'error',
        text: 'API key cannot be empty'
      })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      // Save to localStorage immediately
      localStorage.setItem('temenos_api_key', apiKey)

      // Try to save to backend (with short timeout, fail silently)
      try {
        await axios.post(
          'http://localhost:8000/api/v1/integration/api-key',
          { api_key: apiKey },
          {
            headers: {
              'X-User-Id': 'demo_user',
              'Content-Type': 'application/json'
            },
            timeout: 2000 // 2 second timeout
          }
        )
        console.log('API key saved to backend')
      } catch (backendError) {
        console.log('Backend save failed, using localStorage only')
      }

      setMessage({
        type: 'success',
        text: 'API key saved successfully!'
      })

      // Call onSave callback if provided
      if (onSave) {
        onSave()
      }

      // Close modal after 1.5 seconds
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: 'Failed to save API key'
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Key className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-[#283054]">My API Key</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Temenos API Key
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Enter your Temenos Developer Portal API key. This will be used for all API requests.
            </p>

            <div className="relative">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key..."
                autoFocus
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`flex items-center space-x-2 p-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
