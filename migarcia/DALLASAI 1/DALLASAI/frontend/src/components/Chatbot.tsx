import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, Bot, User } from 'lucide-react'
import { apiService } from '../services/api'
import type { ComponentId, ChatMessage } from '../types'
import { SecurityContent } from './security/SecurityContent'

interface ChatbotProps {
  componentId: ComponentId
}

export function Chatbot({ componentId }: ChatbotProps) {
  // Chatbot State (for non-security components)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [chatError, setChatError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize chat session only for non-security components
  useEffect(() => {
    if (componentId !== 'security') {
      initializeSession()
      return () => {
        if (sessionId) {
          apiService.deleteChatSession(componentId, sessionId).catch(console.error)
        }
      }
    } else {
      setInitializing(false)
    }
  }, [componentId])

  useEffect(() => {
    if (componentId !== 'security') {
      scrollToBottom()
    }
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeSession = async () => {
    try {
      setInitializing(true)
      setChatError(null)
      const response = await apiService.createChatSession(componentId, {
        topic: componentId,
        user_level: 'beginner',
      })
      setSessionId(response.data.session_id)
      
      if (response.data.session_id) {
        try {
          const historyResponse = await apiService.getChatHistory(componentId, response.data.session_id)
          setMessages(historyResponse.data.messages || [])
        } catch {
          // No history yet
        }
      }
    } catch (err: any) {
      setChatError(err.message || 'Failed to initialize chat session')
    } finally {
      setInitializing(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !sessionId || loading) return

    const userMessage: ChatMessage = {
      message_id: `temp-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setChatError(null)

    try {
      const response = await apiService.sendChatMessage(componentId, sessionId, input)
      setMessages((prev) => [...prev, response.data])
    } catch (err: any) {
      setChatError(err.message || 'Failed to send message')
      setMessages((prev) => prev.filter((msg) => msg.message_id !== userMessage.message_id))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // If security component, show SecurityContent component
  if (componentId === 'security') {
    return <SecurityContent />
  }

  // Regular chatbot for other components
  if (initializing) {
    return (
      <div className="card flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#283054]" />
      </div>
    )
  }

  return (
    <div className="card flex flex-col h-[600px]">
      {/* Input at the top */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask about ${componentId === 'deployment' ? 'Temenos cloud deployment and architecture' : componentId}...`}
            className="input-field flex-1"
            disabled={loading || !sessionId}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading || !sessionId}
            className="btn-primary flex items-center space-x-2 px-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Querying RAG...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Send</span>
              </>
            )}
          </button>
        </div>
        {loading && (
          <div className="mt-3 flex items-center space-x-2 text-sm text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Retrieving information from RAG knowledge base...</span>
          </div>
        )}
      </div>

      {chatError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {chatError}
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-[#4A5568] py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-[#283054]" />
            <p className="text-lg font-medium mb-2">Welcome to BSG-Guru</p>
            <p className="text-sm">Ask me anything about {componentId === 'deployment' ? 'Temenos cloud deployment, architecture, and best practices' : componentId}</p>
            <p className="text-xs text-gray-500 mt-4">Powered by Temenos RAG Knowledge Base</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.message_id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-[#283054] text-white'
                    : 'bg-gray-100 text-[#2D3748]'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.role === 'assistant' && (
                    <Bot className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  )}
                  {message.role === 'user' && (
                    <User className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-300">
                        <p className="text-xs font-semibold mb-1">Sources:</p>
                        {message.sources.map((source, idx) => (
                          <a
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline block"
                          >
                            {source.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        {loading && messages.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-4 flex items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#283054]" />
              <span className="text-sm text-gray-600">Retrieving information...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
