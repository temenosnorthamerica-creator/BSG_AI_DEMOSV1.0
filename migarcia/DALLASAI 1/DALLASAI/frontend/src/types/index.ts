// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data: T
  metadata?: {
    timestamp: string
    request_id: string
  }
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    page_size: number
    total_items: number
    total_pages: number
    has_next: boolean
    has_previous: boolean
  }
}

// Component Types
export type ComponentId =
  | 'integration'
  | 'data-architecture'
  | 'deployment'
  | 'security'
  | 'observability'
  | 'design-time'
  | 'branch-loans'

export interface Component {
  component_id: ComponentId
  name: string
  description: string
  status: 'active' | 'inactive'
}

// Content Types
export interface Content {
  content_id: string
  title: string
  type: 'slide' | 'document' | 'tutorial' | 'html'
  order: number
  body?: {
    heading?: string
    bullets?: string[]
    code_examples?: string[]
    description?: string
    html?: string
  }
  metadata?: {
    duration_minutes?: number
    difficulty?: 'beginner' | 'intermediate' | 'advanced'
  }
  created_at: string
  updated_at?: string
}

// Video Types
export interface Video {
  video_id: string
  title: string
  description: string
  duration: number
  format: string
  size: number
  thumbnail_url?: string
  file_path?: string
  resolution?: string
  chapters?: Array<{
    title: string
    timestamp: number
  }>
  created_at: string
}

// Demo Types
export interface DemoConfig {
  demo_id: string
  name: string
  external_system_url: string
  connection_type: 'websocket' | 'iframe' | 'api'
  configuration: {
    supported_scenarios?: string[]
  }
}

export interface DemoSession {
  session_id: string
  status: 'connected' | 'disconnected' | 'connecting'
  connection_url?: string
  connected_at?: string
  last_activity?: string
}

// Chatbot Types
export interface ChatSession {
  session_id: string
  kb_endpoint: string
  created_at: string
}

export interface ChatMessage {
  message_id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  sources?: Array<{
    title: string
    url: string
  }>
}

export interface ChatHistory {
  session_id: string
  messages: ChatMessage[]
  total_messages: number
}

// Auth Types
export interface User {
  user_id: string
  email: string
  name: string
  role: 'admin' | 'user' | 'guest'
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

