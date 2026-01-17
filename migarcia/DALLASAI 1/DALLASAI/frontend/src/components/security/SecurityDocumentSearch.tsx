import { useState } from 'react'
import { Search, Loader2, AlertCircle, FileText } from 'lucide-react'
import { apiService } from '../../services/api'

interface DocumentData {
  document_number: number
  document_name: string
  document: {
    paragraphs?: Array<{ text?: string } | string>
    [key: string]: any
  }
}

export function SecurityDocumentSearch() {
  // Screen 1: Document Number input
  const [documentNumber, setDocumentNumber] = useState<string>('')
  const [documentNumberError, setDocumentNumberError] = useState<string>('')
  
  // Screen 2: Document loaded state
  const [documentData, setDocumentData] = useState<DocumentData | null>(null)
  const [loadingDocument, setLoadingDocument] = useState(false)
  const [documentError, setDocumentError] = useState<string>('')
  
  // Screen 3: Search results
  const [searchContext, setSearchContext] = useState<string>('')
  const [searchResults, setSearchResults] = useState<DocumentData | null>(null)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [searchError, setSearchError] = useState<string>('')

  // Handle Document Number submission
  const handleDocumentNumberSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setDocumentNumberError('')
    setDocumentError('')
    setDocumentData(null)
    setSearchResults(null)
    setSearchContext('')

    // Validate input
    const num = parseInt(documentNumber.trim())
    if (!documentNumber.trim()) {
      setDocumentNumberError('Please enter a document number')
      return
    }
    if (isNaN(num) || num < 1) {
      setDocumentNumberError('Please enter a valid positive integer')
      return
    }

    // Load document
    setLoadingDocument(true)
    try {
      const response = await apiService.getSecurityItem(num)
      if (response.success && response.data) {
        setDocumentData(response.data)
        setDocumentError('')
      } else {
        setDocumentError('Failed to load document')
      }
    } catch (err: any) {
      console.error('Error loading document:', err)
      setDocumentError(err.response?.data?.detail || err.message || 'Failed to load document')
    } finally {
      setLoadingDocument(false)
    }
  }

  // Handle Search Context submission
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSearchError('')
    setSearchResults(null)

    if (!searchContext.trim()) {
      setSearchError('Please enter a search term')
      return
    }

    if (!documentData) {
      setSearchError('Document not loaded')
      return
    }

    setLoadingSearch(true)
    try {
      const response = await apiService.searchWithinDocument(
        documentData.document_number,
        searchContext.trim()
      )
      if (response.success && response.data) {
        setSearchResults(response.data)
        setSearchError('')
      } else {
        setSearchError('No results found')
      }
    } catch (err: any) {
      console.error('Error searching document:', err)
      setSearchError(err.response?.data?.detail || err.message || 'Search failed')
    } finally {
      setLoadingSearch(false)
    }
  }

  // Reset to initial screen
  const handleReset = () => {
    setDocumentNumber('')
    setDocumentNumberError('')
    setDocumentData(null)
    setDocumentError('')
    setSearchContext('')
    setSearchResults(null)
    setSearchError('')
  }

  // Extract paragraphs from document data
  const extractParagraphs = (doc: DocumentData | null): string[] => {
    if (!doc || !doc.document) return []
    
    const paragraphs: string[] = []
    const docParagraphs = doc.document.paragraphs || []
    
    for (const para of docParagraphs) {
      if (typeof para === 'string') {
        paragraphs.push(para)
      } else if (para && typeof para === 'object' && 'text' in para) {
        const text = para.text
        if (text && typeof text === 'string') {
          paragraphs.push(text)
        }
      }
    }
    
    return paragraphs
  }

  // Render Screen 1: Document Number Input
  if (!documentData) {
    return (
      <div className="card">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#283054] mb-2">Security Document Search</h2>
          <p className="text-[#4A5568]">Enter a document number to begin</p>
        </div>

        <form onSubmit={handleDocumentNumberSubmit} className="space-y-4">
          <div>
            <label htmlFor="documentNumber" className="block text-sm font-medium text-[#283054] mb-2">
              Document Number
            </label>
            <div className="flex gap-2">
              <input
                id="documentNumber"
                type="number"
                min="1"
                step="1"
                value={documentNumber}
                onChange={(e) => {
                  setDocumentNumber(e.target.value)
                  setDocumentNumberError('')
                }}
                className={`flex-1 px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#283054] transition-colors ${
                  documentNumberError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-[#283054]'
                }`}
                placeholder="Enter document number (e.g., 1)"
                disabled={loadingDocument}
              />
              <button
                type="submit"
                disabled={loadingDocument}
                className="px-6 py-3 bg-[#283054] text-white rounded-lg hover:bg-[#1e2440] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loadingDocument ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
            {documentNumberError && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {documentNumberError}
              </p>
            )}
          </div>
        </form>

        {documentError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {documentError}
            </p>
          </div>
        )}
      </div>
    )
  }

  // Render Screen 2: Document Name and Search Context Input
  if (!searchResults) {
    return (
      <div className="card">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#283054] mb-2">Document: {documentData.document_name}</h2>
            <p className="text-[#4A5568]">Document Number: {documentData.document_number}</p>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-[#283054] border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            New Search
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div>
            <label htmlFor="searchContext" className="block text-sm font-medium text-[#283054] mb-2">
              Search Context
            </label>
            <div className="flex gap-2">
              <input
                id="searchContext"
                type="text"
                value={searchContext}
                onChange={(e) => {
                  setSearchContext(e.target.value)
                  setSearchError('')
                }}
                className={`flex-1 px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#283054] transition-colors ${
                  searchError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-[#283054]'
                }`}
                placeholder="Enter search term (alphanumeric)"
                disabled={loadingSearch}
              />
              <button
                type="submit"
                disabled={loadingSearch || !searchContext.trim()}
                className="px-6 py-3 bg-[#283054] text-white rounded-lg hover:bg-[#1e2440] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loadingSearch ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
            {searchError && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {searchError}
              </p>
            )}
          </div>
        </form>
      </div>
    )
  }

  // Render Screen 3: Search Results
  const paragraphs = extractParagraphs(searchResults)

  return (
    <div className="card">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#283054] mb-2">Search Results</h2>
          <p className="text-[#4A5568]">
            Document: {searchResults.document_name} | Found: {paragraphs.length} paragraph(s)
          </p>
        </div>
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm text-[#283054] border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          New Search
        </button>
      </div>

      {paragraphs.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-[#4A5568]">No paragraphs found matching your search.</p>
        </div>
      ) : (
        <div
          className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50"
          style={{
            maxHeight: '600px',
            overflowY: 'auto',
          }}
        >
          <div className="space-y-0">
            {paragraphs.map((paragraph, index) => (
              <div key={index}>
                <div className="p-4 bg-white border-l-4 border-[#283054] rounded-lg">
                  <p className="text-[#4A5568] leading-relaxed whitespace-pre-wrap">
                    {paragraph}
                  </p>
                </div>
                {index < paragraphs.length - 1 && (
                  <div
                    className="w-full"
                    style={{
                      height: '3px',
                      backgroundColor: '#DC2626',
                      marginTop: '16px',
                      marginBottom: '16px',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

