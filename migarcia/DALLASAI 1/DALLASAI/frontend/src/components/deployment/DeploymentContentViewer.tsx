import { useState, useEffect } from 'react'
import { Loader2, Cloud, RefreshCw } from 'lucide-react'
import { apiService } from '../../services/api'

const CACHE_KEY = 'deployment_rag_content_cache'
const CACHE_TIMESTAMP_KEY = 'deployment_rag_content_cache_timestamp'
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days (1 month)

export function DeploymentContentViewer() {
  const [ragContent, setRagContent] = useState<any>(null)
  const [ragLoading, setRagLoading] = useState(true)
  const [ragError, setRagError] = useState<string | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)

  useEffect(() => {
    // Check cache immediately on mount
    const cached = loadCachedContent()
    if (cached) {
      setRagContent(cached)
      setRagLoading(false)
      setIsFromCache(true)
      console.log('Loaded RAG content from cache')
    } else {
      // Only load from API if no cache
      loadRAGContent()
    }
  }, [])

  const loadCachedContent = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp, 10)
        if (age < CACHE_DURATION) {
          return JSON.parse(cached)
        }
      }
    } catch (err) {
      console.warn('Failed to load cached content:', err)
    }
    return null
  }

  const saveCachedContent = (content: any) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(content))
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
    } catch (err) {
      console.warn('Failed to save cached content:', err)
    }
  }

  const loadRAGContent = async (forceRefresh: boolean = false) => {
    try {
      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cached = loadCachedContent()
        if (cached) {
          setRagContent(cached)
          setRagLoading(false)
          setIsFromCache(true)
          console.log('Loaded RAG content from cache (30 day expiry)')
          return
        }
      }

      // Store cached content before refresh in case refresh fails
      const cachedContent = forceRefresh ? loadCachedContent() : null
      
      // Clear cache flag when forcing refresh
      if (forceRefresh) {
        setIsFromCache(false)
      }
      
      setRagLoading(true)
      setRagError(null)
      
      // Query RAG API for Temenos cloud architecture models
      const questions = [
        "What are the Temenos cloud architecture models?",
        "What are the deployment options in cloud for Temenos products?",
        "How does Temenos support cloud-native deployments?",
        "What are the best practices for deploying Temenos components on Azure?"
      ]
      
      // Query multiple questions and combine results
      const ragResults = []
      const errors: string[] = []
      
      for (const question of questions) {
        try {
          const response = await apiService.queryRAG({
            question,
            region: 'global',
            RAGmodelId: 'ModularBanking, TechnologyOverview',
            context: 'This is about Temenos cloud architecture models and deployment strategies for Temenos banking solutions.'
          })

          // Handle different response structures
          // queryRAG returns ApiResponse<{answer: string, sources?: ...}>
          // Backend returns: {status: "success", data: {answer: "...", sources: [...]}}
          // Or: {data: {answer: "...", sources: [...]}}
          const ragData = response.data && typeof response.data === 'object' && 'data' in response.data
            ? (response.data as any).data
            : response.data

          if (ragData?.answer) {
            ragResults.push({
              question,
              answer: ragData.answer,
              sources: ragData.sources || []
            })
          } else {
            errors.push(`No answer returned for: "${question}". Response structure: ${JSON.stringify(response).substring(0, 200)}`)
            console.warn(`No answer in RAG response for question: ${question}`, response)
          }
        } catch (err: any) {
          // Extract detailed error message from backend response
          let errorMsg = 'Unknown error'
          
          // Check if it's a network error (backend not reachable)
          if (err.code === 'ERR_NETWORK' || err.message === 'Network Error' || !err.response) {
            errorMsg = 'Network Error - Unable to reach the backend API. Please check if the backend service is running and accessible.'
            console.error(`Network error for question "${question}": Backend may not be reachable`, {
              apiUrl: (window as any).API_BASE_URL || 'unknown',
              error: err
            })
          } else {
            // Log full error for debugging
            console.error(`Full error object for question "${question}":`, {
              error: err,
              response: err.response,
              responseData: err.response?.data,
              responseDetail: err.response?.data?.detail,
              message: err.message,
              status: err.response?.status
            })
            
            // Try multiple ways to extract the error message
            if (err.response?.data?.detail) {
              const detail = err.response.data.detail
              if (typeof detail === 'object') {
                // Backend returns detail as object with error field
                errorMsg = detail.error || detail.message || JSON.stringify(detail)
              } else if (typeof detail === 'string') {
                // Backend returns detail as string
                errorMsg = detail
              }
            } else if (err.response?.data?.error) {
              errorMsg = err.response.data.error
            } else if (err.response?.data?.message) {
              errorMsg = err.response.data.message
            } else if (err.message) {
              errorMsg = err.message
            }
            
            // If we still have a generic message, try to get more info
            if (errorMsg === 'Request failed with status code 500' && err.response?.data) {
              errorMsg = `Server error: ${JSON.stringify(err.response.data).substring(0, 200)}`
            } else if (err.response?.status) {
              errorMsg = `HTTP ${err.response.status}: ${errorMsg}`
            }
          }
          
          errors.push(`Failed to query "${question}": ${errorMsg}`)
          console.warn(`Failed to query RAG for question: ${question}`, err)
        }
      }
      
      if (ragResults.length > 0) {
        setRagContent(ragResults)
        saveCachedContent(ragResults)
        setIsFromCache(false)
        setRagError(null)
        console.log('Loaded RAG content from API and cached')
        
        // If some queries failed, show a warning but still display successful results
        if (errors.length > 0) {
          const partialErrorMsg = `Some queries failed (${errors.length}/${questions.length}). Showing available results.`
          console.warn(partialErrorMsg, errors)
          // Don't set as error since we have some results, just log it
        }
      } else {
        // All queries failed - restore cached content if available
        if (forceRefresh && cachedContent) {
          setRagContent(cachedContent)
          setIsFromCache(true)
          setRagError(`Failed to refresh content. Showing cached data. Errors: ${errors.join('; ')}`)
          console.warn('Refresh failed, restored cached content', errors)
        } else {
          setRagError(`No content retrieved from RAG API. ${errors.length > 0 ? errors.join('; ') : 'All queries failed.'}`)
        }
      }
    } catch (err: any) {
      console.error('RAG query error:', err)
      const errorMsg = err.response?.data?.detail?.error || 
                      err.response?.data?.error || 
                      err.message || 
                      'Failed to load RAG information'
      
      // If refresh failed, try to restore cached content
      if (forceRefresh) {
        const cachedContent = loadCachedContent()
        if (cachedContent) {
          setRagContent(cachedContent)
          setIsFromCache(true)
          setRagError(`Failed to refresh content. Showing cached data. Error: ${errorMsg}`)
        } else {
          setRagError(errorMsg)
        }
      } else {
        setRagError(errorMsg)
      }
    } finally {
      setRagLoading(false)
    }
  }

  if (ragLoading) {
    return (
      <div className="bg-white dark:bg-gray-100 rounded-lg shadow-lg border border-gray-300 dark:border-gray-400 p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-[#283054] mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-900 mb-2">
            Retrieving Cloud Architecture Information
          </h3>
          <p className="text-gray-600 dark:text-gray-700 text-center max-w-md">
            Querying Temenos RAG Knowledge Base for cloud architecture models and deployment strategies. This may take a few moments...
          </p>
          <div className="mt-6 w-full max-w-md">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-[#283054] h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* RAG Content - Temenos Cloud Architecture */}
      <div className="bg-white dark:bg-gray-100 rounded-lg shadow-lg border border-gray-300 dark:border-gray-400 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Cloud className="w-8 h-8 text-[#283054]" />
            <div>
              <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-900">
                Temenos Cloud Architecture Models
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-800">
                Information from Temenos RAG Knowledge Base
                {isFromCache && (
                  <span className="ml-2 text-sm text-green-600 dark:text-green-700 font-medium">
                    (Cached - 30 day expiry)
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => loadRAGContent(true)}
            disabled={ragLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${ragLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>


        {ragError && (
          <div className={`mb-4 p-4 rounded ${
            ragError.includes('Showing cached data') 
              ? 'bg-yellow-100 dark:bg-yellow-200 border border-yellow-300 dark:border-yellow-400 text-yellow-800 dark:text-yellow-900'
              : 'bg-red-100 dark:bg-red-200 border border-red-300 dark:border-red-400 text-red-800 dark:text-red-900'
          }`}>
            <p className="font-semibold">
              {ragError.includes('Showing cached data') ? 'Warning:' : 'Error loading RAG content:'}
            </p>
            <p className="text-sm">{ragError}</p>
          </div>
        )}

        {ragContent && ragContent.length > 0 && (
          <div className="space-y-6">
            {ragContent.map((item: any, idx: number) => (
              <div 
                key={idx} 
                className="bg-gray-50 dark:bg-white rounded-lg p-6 border border-gray-300 dark:border-gray-400 shadow-sm"
              >
                <h3 className="text-xl font-bold mb-3 border-b border-gray-400 dark:border-gray-500 pb-2 text-gray-900 dark:text-gray-900">
                  {item.question}
                </h3>
                <div className="whitespace-pre-wrap leading-relaxed text-base text-gray-800 dark:text-gray-900">
                  {item.answer}
                </div>
                {item.sources && item.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-300 dark:border-gray-400">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-900 mb-2">Sources:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-800">
                      {item.sources.map((source: any, sidx: number) => (
                        <li key={sidx}>{source.title || source.url || 'Temenos Documentation'}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!ragLoading && !ragError && (!ragContent || ragContent.length === 0) && (
          <div className="text-center py-8 text-gray-700 dark:text-gray-800">
            <p>No cloud architecture information available at this time.</p>
          </div>
        )}
      </div>
    </div>
  )
}

