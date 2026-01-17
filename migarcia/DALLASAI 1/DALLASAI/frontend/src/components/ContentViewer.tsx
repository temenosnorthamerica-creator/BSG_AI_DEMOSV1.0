import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Loader2, Info } from 'lucide-react'
import { apiService } from '../services/api'
import type { Content, ComponentId } from '../types'
import { ApiOverview } from './ApiOverview'
import { SecurityContentViewer } from './SecurityContentViewer'

interface ContentViewerProps {
  componentId: ComponentId
}

export function ContentViewer({ componentId }: ContentViewerProps) {
  // Use SecurityContentViewer for security component
  if (componentId === 'security') {
    return <SecurityContentViewer />
  }
  const [contents, setContents] = useState<Content[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(null)

  useEffect(() => {
    loadContents()
  }, [componentId])

  const loadContents = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.getContent(componentId)
      const sortedContents = (response.data || []).sort((a, b) => a.order - b.order)
      setContents(sortedContents)
      setCurrentIndex(0)
    } catch (err: any) {
      // For integration component, don't show error - just show empty state
      if (componentId !== 'integration') {
        setError(err.message || 'Failed to load content')
      }
      setContents([])
    } finally {
      setLoading(false)
    }
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : contents.length - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < contents.length - 1 ? prev + 1 : 0))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#283054]" />
      </div>
    )
  }

  if (error && componentId !== 'integration') {
    return (
      <div className="card">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (contents.length === 0) {
    // Show API Overview native HTML component for integration component
    if (componentId === 'integration') {
      return <ApiOverview />
    }

    return (
      <div className="card">
        <p className="text-[#4A5568]">No content available for this component.</p>
      </div>
    )
  }

  const currentContent = contents[currentIndex]

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{currentContent.title}</h2>
      </div>

      <div className="prose max-w-none">
        {currentContent.body?.heading && (
          <h3 className="text-xl font-semibold mb-4">{currentContent.body.heading}</h3>
        )}

        {currentContent.body?.description && (
          <p className="text-[#4A5568] mb-4">{currentContent.body.description}</p>
        )}

        {/* Image content with interactive areas */}
        {currentContent.type === 'document' && (currentContent.body as any)?.image_url && (
          <>
            {/* Use native HTML component for API Overview, otherwise use image */}
            {componentId === 'integration' && currentContent.title === 'API Overview' ? (
              <ApiOverview />
            ) : (
              <div className="relative mb-4">
                <img
                  src={(currentContent.body as any).image_url}
                  alt={currentContent.title}
                  className="w-full h-auto rounded-lg shadow-md"
                />
                {(currentContent.body as any).interactive_areas?.map((area: any, idx: number) => (
                  <div
                    key={idx}
                    className="absolute cursor-help"
                    style={{
                      top: area.position.top,
                      left: area.position.left,
                      width: area.position.width,
                      height: area.position.height,
                    }}
                    onMouseEnter={() => setActiveTooltipIndex(idx)}
                    onMouseLeave={() => setActiveTooltipIndex(null)}
                  >
                    <div className="w-full h-full hover:bg-blue-100 hover:bg-opacity-20 rounded transition-colors" />
                    {activeTooltipIndex === idx && (
                      <div className="absolute z-50 w-96 p-4 bg-white border-2 border-blue-500 rounded-lg shadow-xl text-sm left-0" style={{ bottom: '100%', marginBottom: '12px' }}>
                        <div className="flex items-start space-x-2">
                          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-bold mb-1 text-blue-600">{area.title}</h4>
                            <p className="text-gray-800 leading-relaxed">{area.description}</p>
                            {area.url && (
                              <a
                                href={area.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-2 text-blue-600 hover:text-blue-800 underline font-medium"
                              >
                                Visit Portal →
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="absolute left-8 w-4 h-4 bg-white border-b-2 border-r-2 border-blue-500 transform rotate-45" style={{ bottom: '-8px' }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {currentContent.body?.bullets && currentContent.body.bullets.length > 0 && (
          <ul className="list-disc list-inside space-y-2 mb-4 text-[#4A5568]">
            {currentContent.body.bullets.map((bullet, idx) => (
              <li key={idx}>{bullet}</li>
            ))}
          </ul>
        )}

        {currentContent.body?.code_examples && currentContent.body.code_examples.length > 0 && (
          <div className="space-y-4 mb-4">
            {currentContent.body.code_examples.map((code, idx) => (
              <pre
                key={idx}
                className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm"
              >
                <code>{code}</code>
              </pre>
            ))}
          </div>
        )}

        {currentContent.metadata && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4 text-sm text-[#4A5568]">
              {currentContent.metadata.duration_minutes && (
                <span>Duration: {currentContent.metadata.duration_minutes} min</span>
              )}
              {currentContent.metadata.difficulty && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {currentContent.metadata.difficulty}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center space-x-2 mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={goToPrevious}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          disabled={contents.length === 0}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={goToNext}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          disabled={contents.length === 0}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

