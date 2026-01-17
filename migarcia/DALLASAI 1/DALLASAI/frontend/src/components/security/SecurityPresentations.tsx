import { useState, useEffect } from 'react'
import { Loader2, Presentation, AlertCircle, RotateCcw } from 'lucide-react'
import { apiService } from '../../services/api'

interface Presentation {
  presentation_number: number
  presentation_name: string
}

interface PresentationData {
  presentation_number: number
  presentation_name: string
  presentation: Record<string, any>
}

export function SecurityPresentations() {
  const [presentations, setPresentations] = useState<Presentation[]>([])
  const [selectedPresentationName, setSelectedPresentationName] = useState<string>('')
  const [presentationData, setPresentationData] = useState<PresentationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingPresentation, setLoadingPresentation] = useState(false)
  const [error, setError] = useState<string>('')
  const [presentationError, setPresentationError] = useState<string>('')

  useEffect(() => {
    loadPresentations()
  }, [])

  const loadPresentations = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await apiService.getSecurityPresentations()
      if (response.success && response.data) {
        setPresentations(response.data.presentations || [])
      } else {
        setError('Failed to load presentations')
      }
    } catch (err: any) {
      console.error('Error loading presentations:', err)
      setError(err.response?.data?.detail || err.message || 'Failed to load presentations')
    } finally {
      setLoading(false)
    }
  }

  const handlePresentationChange = async (presentationName: string) => {
    if (!presentationName) {
      resetToInitial()
      return
    }

    setSelectedPresentationName(presentationName)
    setPresentationError('')
    setPresentationData(null)
    setLoadingPresentation(true)

    try {
      const response = await apiService.getSecurityPresentationByName(presentationName)
      if (response.success && response.data) {
        setPresentationData(response.data)
        setPresentationError('')
      } else {
        setPresentationError('Failed to load presentation content')
      }
    } catch (err: any) {
      console.error('Error loading presentation:', err)
      setPresentationError(err.response?.data?.detail || err.message || 'Failed to load presentation')
    } finally {
      setLoadingPresentation(false)
    }
  }

  const resetToInitial = () => {
    setSelectedPresentationName('')
    setPresentationData(null)
    setPresentationError('')
  }

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#283054]" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#283054] mb-2">Security Presentations</h2>
        <p className="text-[#4A5568]">Select a presentation to view its content</p>
      </div>

      {/* Combobox Section */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label htmlFor="presentationSelect" className="block text-sm font-medium text-[#283054] mb-2">
              Presentations
            </label>
            <select
              id="presentationSelect"
              value={selectedPresentationName}
              onChange={(e) => handlePresentationChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#283054] focus:border-[#283054] transition-colors bg-white"
            >
              <option value="">-- Select a presentation --</option>
              {presentations.map((presentation) => (
                <option key={presentation.presentation_number} value={presentation.presentation_name}>
                  {presentation.presentation_name}
                </option>
              ))}
            </select>
          </div>
          {selectedPresentationName && (
            <div className="flex items-end">
              <button
                onClick={resetToInitial}
                className="px-4 py-3 bg-gray-100 text-[#283054] rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 border border-gray-300"
                title="Reset to initial settings"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>

        {presentationError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {presentationError}
            </p>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loadingPresentation && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#283054]" />
        </div>
      )}

      {/* Presentation Content */}
      {presentationData && !loadingPresentation && (
        <div className="space-y-4">
          <div className="p-4 bg-[#283054]/5 border-l-4 border-[#283054] rounded-lg">
            <h3 className="text-xl font-semibold text-[#283054] mb-2">
              {presentationData.presentation_name}
            </h3>
            <p className="text-sm text-[#4A5568]">
              Presentation #{presentationData.presentation_number}
            </p>
          </div>

          <div className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50">
            <h4 className="text-lg font-semibold text-[#283054] mb-4">Presentation Content</h4>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              {presentationData.presentation && Object.keys(presentationData.presentation).length > 0 ? (
                <div className="space-y-4">
                  <pre className="whitespace-pre-wrap text-sm text-[#4A5568] font-mono bg-gray-50 p-4 rounded-lg overflow-x-auto">
                    {JSON.stringify(presentationData.presentation, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Presentation className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-[#4A5568]">No presentation content available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Initial State - No Selection */}
      {!selectedPresentationName && !loadingPresentation && (
        <div className="p-8 text-center bg-gray-50 rounded-lg">
          <Presentation className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-[#4A5568]">Select a presentation from the dropdown to view its content.</p>
        </div>
      )}
    </div>
  )
}
