import axios, { AxiosInstance, AxiosError } from 'axios'
import type {
  ApiResponse,
  PaginatedResponse,
  Component,
  Content,
  Video,
  DemoConfig,
  DemoSession,
  ChatSession,
  ChatMessage,
  ChatHistory,
  ComponentId
} from '../types'

// Runtime configuration interface
interface RuntimeConfig {
  apiUrl: string
  environment?: string
}

// Load runtime configuration from config.json
let runtimeConfig: RuntimeConfig | null = null
let configLoadPromise: Promise<RuntimeConfig> | null = null

const loadRuntimeConfig = async (): Promise<RuntimeConfig> => {
  if (runtimeConfig) {
    return runtimeConfig
  }
  
  if (configLoadPromise) {
    return configLoadPromise
  }
  
  configLoadPromise = (async () => {
    try {
      const response = await fetch('/config.json', { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (response.ok) {
        const config = await response.json()
        runtimeConfig = config
        console.log('[API] Loaded runtime config:', config)
        return config
      } else {
        console.warn(`[API] Failed to load config.json (HTTP ${response.status}), using defaults`)
      }
    } catch (error) {
      console.warn('[API] Error loading config.json:', error)
      // If we're on Azure Static Web Apps, try to construct backend URL
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname
        if (hostname.includes('azurestaticapps.net')) {
          console.log('[API] Detected Azure Static Web Apps, using default backend URL')
          return {
            apiUrl: 'https://bsg-demo-platform-app.azurewebsites.net/api/v1',
            environment: 'production'
          }
        }
      }
    }
    
    // Default fallback configuration
    return {
      apiUrl: '/api/v1',
      environment: 'development'
    }
  })()
  
  return configLoadPromise
}

// Determine API base URL at runtime
// Priority: 1. Runtime config.json, 2. Environment detection, 3. Default relative path
const getApiBaseUrl = async (): Promise<string> => {
  // Load runtime configuration
  const config = await loadRuntimeConfig()
  
  // If config has a full URL, use it
  if (config.apiUrl && (config.apiUrl.startsWith('http://') || config.apiUrl.startsWith('https://'))) {
    console.log('[API] Using runtime config API URL:', config.apiUrl)
    return config.apiUrl
  }
  
  // If config has a relative path, use it
  if (config.apiUrl) {
    console.log('[API] Using runtime config relative API URL:', config.apiUrl)
    return config.apiUrl
  }
  
  // Fallback: Environment detection for Azure Static Web Apps
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    // If on Azure Static Web Apps domain, construct backend URL
    if (hostname.includes('azurestaticapps.net')) {
      // Use the same origin for API if backend is proxied, or construct from hostname
      // For now, default to relative path which works if backend is proxied
      const defaultUrl = '/api/v1'
      console.log('[API] Detected Azure Static Web Apps, using relative URL:', defaultUrl)
      return defaultUrl
    }
  }
  
  // Default to relative path (for local development or when backend is proxied)
  const defaultUrl = '/api/v1'
  console.log('[API] Using default relative URL:', defaultUrl)
  return defaultUrl
}

class ApiService {
  private client: AxiosInstance
  private baseUrl: string

  constructor() {
    // Initialize with default, will be updated when config loads
    this.baseUrl = '/api/v1'
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    // Setup interceptors
    this.setupInterceptors()
    
    // Load and apply runtime configuration
    this.initializeConfig()
  }
  
  private async initializeConfig() {
    if (typeof window === 'undefined') {
      return // Server-side rendering, skip
    }
    
    try {
      const url = await getApiBaseUrl()
      this.baseUrl = url
      this.client.defaults.baseURL = url
      console.log('[API] Initialized with base URL:', url)
      console.log('[API] Current hostname:', window.location.hostname)
    } catch (err) {
      console.error('[API] Failed to load runtime configuration:', err)
      console.log('[API] Using default base URL:', this.baseUrl)
    }
  }
  
  // Get current base URL (may be updated after config loads)
  getBaseUrl(): string {
    return this.baseUrl
  }

  private setupInterceptors() {
    // Request interceptor for auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Try to refresh token
          const refreshToken = localStorage.getItem('refresh_token')
          if (refreshToken) {
            try {
              const response = await axios.post(`${this.baseUrl}/auth/refresh`, {
                refresh_token: refreshToken,
              })
              const { access_token } = response.data.data
              localStorage.setItem('access_token', access_token)
              // Retry original request
              if (error.config) {
                error.config.headers.Authorization = `Bearer ${access_token}`
                return this.client.request(error.config)
              }
            } catch (refreshError) {
              // Refresh failed, redirect to login
              localStorage.removeItem('access_token')
              localStorage.removeItem('refresh_token')
              window.location.href = '/login'
            }
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // Health Check
  async getHealth() {
    const response = await this.client.get<ApiResponse<{ status: string; timestamp: string; checks: any }>>('/health')
    return response.data
  }

  // Components
  async getComponents() {
    const response = await this.client.get<ApiResponse<Component[]>>('/components')
    return response.data
  }

  // Content APIs
  async getContent(componentId: ComponentId, page = 1, pageSize = 20, type?: string) {
    const params = new URLSearchParams({ page: page.toString(), page_size: pageSize.toString() })
    if (type) params.append('type', type)
    const response = await this.client.get<PaginatedResponse<Content>>(
      `/components/${componentId}/content?${params.toString()}`
    )
    return response.data
  }

  async getContentItem(componentId: ComponentId, contentId: string) {
    const response = await this.client.get<ApiResponse<Content>>(
      `/components/${componentId}/content/${contentId}`
    )
    return response.data
  }

  // Video APIs
  async getVideos(componentId: ComponentId, page = 1, pageSize = 20) {
    const params = new URLSearchParams({ page: page.toString(), page_size: pageSize.toString() })
    const response = await this.client.get<PaginatedResponse<Video>>(
      `/components/${componentId}/videos?${params.toString()}`
    )
    return response.data
  }

  async getVideo(componentId: ComponentId, videoId: string) {
    const response = await this.client.get<ApiResponse<Video>>(
      `/components/${componentId}/videos/${videoId}`
    )
    return response.data
  }

  getVideoStreamUrl(componentId: ComponentId, videoId: string) {
    return `${this.baseUrl}/components/${componentId}/videos/${videoId}/stream`
  }

  // Demo APIs
  async getDemoConfig(componentId: ComponentId) {
    const response = await this.client.get<ApiResponse<DemoConfig>>(`/components/${componentId}/demo`)
    return response.data
  }

  async connectDemo(componentId: ComponentId, scenario: string, parameters?: Record<string, any>) {
    const response = await this.client.post<ApiResponse<DemoSession>>(
      `/components/${componentId}/demo/connect`,
      { scenario, parameters }
    )
    return response.data
  }

  async executeDemo(componentId: ComponentId, sessionId: string, action: string, parameters?: Record<string, any>) {
    const response = await this.client.post<ApiResponse<any>>(
      `/components/${componentId}/demo/execute`,
      { session_id: sessionId, action, parameters }
    )
    return response.data
  }

  async getDemoStatus(componentId: ComponentId, sessionId: string) {
    const response = await this.client.get<ApiResponse<DemoSession>>(
      `/components/${componentId}/demo/status?session_id=${sessionId}`
    )
    return response.data
  }

  async disconnectDemo(componentId: ComponentId, sessionId: string) {
    await this.client.post(`/components/${componentId}/demo/disconnect`, { session_id: sessionId })
  }

  // Chatbot APIs
  async createChatSession(componentId: ComponentId, context?: { topic?: string; user_level?: string }) {
    const response = await this.client.post<ApiResponse<ChatSession>>(
      `/components/${componentId}/chatbot/session`,
      { context }
    )
    return response.data
  }

  async sendChatMessage(componentId: ComponentId, sessionId: string, message: string) {
    const response = await this.client.post<ApiResponse<ChatMessage>>(
      `/components/${componentId}/chatbot/query`,
      { session_id: sessionId, message }
    )
    return response.data
  }

  async getChatHistory(componentId: ComponentId, sessionId: string) {
    const response = await this.client.get<ApiResponse<ChatHistory>>(
      `/components/${componentId}/chatbot/history/${sessionId}`
    )
    return response.data
  }

  async deleteChatSession(componentId: ComponentId, sessionId: string) {
    await this.client.delete(`/components/${componentId}/chatbot/session/${sessionId}`)
  }

  // Security Component - Slide Search APIs
  async searchSecuritySlides(query: string) {
    const response = await this.client.get<ApiResponse<{
      slides: Array<{
        slide_number: number
        slide_content: string
        content_type: string
      }>
      total_results: number
      query: string
    }>>(`/components/security/slides/search?q=${encodeURIComponent(query)}`)
    return response.data
  }

  async getSecuritySlide(slideNumber: number) {
    const response = await this.client.get<ApiResponse<{
      slide_number: number
      slide_content: string
      content_type: string
    }>>(`/components/security/slides/${slideNumber}`)
    return response.data
  }

  // Security Component - Paragraph Search APIs
  async searchSecurityParagraphs(query: string) {
    const response = await this.client.get<ApiResponse<{
      paragraphs: Array<{
        paragraph_number: number
        paragraph_content: string
      }>
      total_results: number
      query: string
    }>>(`/components/security/paragraphs/search?q=${encodeURIComponent(query)}`)
    return response.data
  }

  async getSecurityParagraph(paragraphNumber: number) {
    const response = await this.client.get<ApiResponse<{
      paragraph_number: number
      paragraph_content: string
    }>>(`/components/security/paragraphs/${paragraphNumber}`)
    return response.data
  }

  // Security Component - Get Document by Number
  async getSecurityItem(documentNumber: number) {
    const response = await this.client.get<ApiResponse<{
      document_number: number
      document_name: string
      document: Record<string, any>
    }>>(`/components/security/items/${documentNumber}`)
    return response.data
  }

  // Security Component - Search Within Document
  async searchWithinDocument(documentNumber: number, searchContext: string) {
    const params = new URLSearchParams()
    params.append('search_context', searchContext.trim())
    
    const response = await this.client.get<ApiResponse<{
      document_number: number
      document_name: string
      document: Record<string, any>
      search_context: string
      matches_found: number
    }>>(`/components/security/items/${documentNumber}/search?${params.toString()}`)
    return response.data
  }

  // Security Component - Get All Presentations
  async getSecurityPresentations() {
    const response = await this.client.get<ApiResponse<{
      presentations: Array<{
        presentation_number: number
        presentation_name: string
      }>
      total_results: number
    }>>(`/components/security/presentations`)
    return response.data
  }

  // Security Component - Get Presentation by Number
  async getSecurityPresentation(presentationNumber: number) {
    const response = await this.client.get<ApiResponse<{
      presentation_number: number
      presentation_name: string
      presentation: Record<string, any>
    }>>(`/components/security/presentations/${presentationNumber}`)
    return response.data
  }

  // Security Component - Get Presentation by Name
  async getSecurityPresentationByName(presentationName: string) {
    const encodedName = encodeURIComponent(presentationName)
    const response = await this.client.get<ApiResponse<{
      presentation_number: number
      presentation_name: string
      presentation: Record<string, any>
    }>>(`/components/security/presentations/by-name/${encodedName}`)
    return response.data
  }

  // Security Component - Get Presentation HTML5 by Name
  async getSecurityPresentationHTML5ByName(presentationName: string) {
    const encodedName = encodeURIComponent(presentationName)
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${this.baseUrl}/components/security/presentations/by-name/${encodedName}/html5`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      }
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const htmlContent = await response.text()
    return { success: true, data: { html: htmlContent } }
  }

  // Security Component - Search Document by Name and Term (HTML5)
  async searchDocumentByNameAndTermHTML5(documentName: string, searchTerm: string) {
    const encodedName = encodeURIComponent(documentName)
    const encodedTerm = encodeURIComponent(searchTerm)
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${this.baseUrl}/components/security/items/by-name/${encodedName}/search/${encodedTerm}/html5`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      }
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const htmlContent = await response.text()
    return { success: true, data: { html: htmlContent } }
  }

  // Security Component - Get Authentication HTML5 Page
  async getAuthenticationHTML5Page() {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${this.baseUrl}/components/security/items/authentication/html5`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      }
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const htmlContent = await response.text()
    return { success: true, data: { html: htmlContent } }
  }

  // Auth APIs
  async login(email: string, password: string) {
    const response = await this.client.post<ApiResponse<{ access_token: string; refresh_token: string; token_type: string; expires_in: number }>>(
      '/auth/login',
      { email, password }
    )
    return response.data
  }

  async register(email: string, password: string, name: string) {
    const response = await this.client.post<ApiResponse<any>>('/auth/register', {
      email,
      password,
      name,
    })
    return response.data
  }

  async logout() {
    await this.client.post('/auth/logout')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  // Deployment & Cloud APIs
  async connectAzureSubscription(subscriptionId: string) {
    try {
      console.log('[API] Connecting to Azure subscription:', subscriptionId)
      console.log('[API] Request URL:', `${this.baseUrl}/deployment/azure/connect`)
      const response = await this.client.post<ApiResponse<{
        status: string
        message: string
        subscriptionId: string
      }>>('/deployment/azure/connect', { subscription_id: subscriptionId })
      console.log('[API] Azure connection successful:', response.data)
      return response.data
    } catch (error: any) {
      console.error('[API] Azure connection error:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      })
      // Re-throw with better error handling
      if (error.response?.data?.detail) {
        throw error.response.data.detail
      }
      // Provide more detailed error message for network errors
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
        throw new Error(`Network Error - Unable to reach the backend API at ${this.baseUrl}. Please check if the backend service is running and accessible.`)
      }
      throw error
    }
  }

  async getAzureResourceGroups(subscriptionId: string) {
    const response = await this.client.get<ApiResponse<{
      data: Array<{
        id: string
        name: string
        location: string
        tags?: Record<string, string>
      }>
      count: number
    }>>(`/deployment/azure/resource-groups?subscriptionId=${subscriptionId}`)
    return response.data
  }

  async getAzureResources(subscriptionId: string, resourceGroupNames: string[]) {
    const response = await this.client.post<ApiResponse<{
      data: Array<{
        id: string
        name: string
        type: string
        location: string
        resourceGroup: string
        tags?: Record<string, string>
        properties?: Record<string, any>
      }>
      count: number
    }>>('/deployment/azure/resources', {
      subscription_id: subscriptionId,
      resource_group_names: resourceGroupNames
    })
    return response.data
  }

  async getAKSNamespaces(subscriptionId: string, resourceGroupNames: string[]) {
    console.log('[API] getAKSNamespaces called with:', { subscriptionId, resourceGroupNames })
    const url = '/deployment/aks/namespaces'
    const payload = {
      subscription_id: subscriptionId,
      resource_group_names: resourceGroupNames
    }
    console.log('[API] POST', url, payload)
    try {
      const response = await this.client.post<ApiResponse<{
        data: Array<{
          cluster_name: string
          resource_group: string
          namespaces: string[]
          error?: string
        }>
        count: number
      }>>(url, payload)
      console.log('[API] Response received:', response.data)
      return response.data
    } catch (error: any) {
      console.error('[API] Error in getAKSNamespaces:', error)
      console.error('[API] Error response:', error.response?.data)
      throw error
    }
  }

  async analyzeAzureServices(services: any[], analysisId?: string, selectedNamespaces?: string[], forceRefresh?: boolean) {
    const endpoint = forceRefresh ? '/deployment/temenos/analyze/refresh' : '/deployment/temenos/analyze'
    const response = await this.client.post<ApiResponse<{
      data: Array<{
        service: any
        componentInfo?: {
          componentName: string
          componentType: string
          architecturalOverview: string
          functionalOverview: string
          capabilities: string[]
          relatedServices: string[]
          relationships?: Array<{
            targetComponent: string
            relationshipType: string
            description: string
          }>
        }
        error?: string
      }>
      count: number
      processed: number
      analysisId: string
    }>>(endpoint, {
      services,
      analysis_id: analysisId,
      selected_namespaces: selectedNamespaces,
      force_refresh: forceRefresh || false
    })
    return response.data
  }

  async getDeploymentContent() {
    const response = await this.client.get<ApiResponse<any>>('/components/deployment/content')
    return response.data
  }

  async queryRAG(params: {
    question: string
    region: string
    RAGmodelId: string
    context?: string
  }) {
    try {
      console.log('[API] Querying RAG:', params.question)
      console.log('[API] Request URL:', `${this.baseUrl}/deployment/temenos/query`)
      const response = await this.client.post<ApiResponse<{
        answer: string
        sources?: Array<{ title?: string; url?: string }>
      }>>('/deployment/temenos/query', params)
      console.log('[API] RAG query successful')
      return response.data
    } catch (error: any) {
      console.error('[API] RAG query error:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      })
      // Provide more detailed error message for network errors
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
        throw new Error(`Network Error - Unable to reach the backend API at ${this.baseUrl}. Please check if the backend service is running and accessible.`)
      }
      throw error
    }
  }

  // Cache APIs
  async getCachedContent(cacheKey: string) {
    const response = await this.client.get<ApiResponse<{
      cache_key: string
      content: string
      content_type: string
      metadata?: Record<string, any>
      updated_at: string
    }>>(`/cache/${cacheKey}`)
    return response.data
  }

  async updateCachedContent(cacheKey: string, content: string, contentType: string = 'text', metadata?: Record<string, any>) {
    const response = await this.client.post<ApiResponse<{
      cache_key: string
      content: string
      content_type: string
      metadata?: Record<string, any>
      updated_at: string
    }>>(`/cache/${cacheKey}`, {
      cache_key: cacheKey,
      content,
      content_type: contentType,
      metadata
    })
    return response.data
  }

  // JWT Token Info API
  async getJWTInfo() {
    const response = await this.client.get<ApiResponse<{
      configured: boolean
      has_expiration: boolean
      is_expired?: boolean
      expires_at?: string
      issued_at?: string
      days_remaining?: number
      user_id?: string
      email?: string
      issuer?: string
      audience?: string
    }>>('/deployment/temenos/jwt-info')
    return response.data
  }
}

export const apiService = new ApiService()

