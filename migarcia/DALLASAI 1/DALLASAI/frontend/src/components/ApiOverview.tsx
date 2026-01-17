import { useState, useEffect } from 'react'
import { Info, Loader2, ExternalLink, Link } from 'lucide-react'
import { apiService } from '../services/api'
import { ApiVersioning } from './integration/ApiVersioning'

interface TooltipConfig {
  id: string
  title: string
  description: string
  position: {
    top: string
    left: string
    width: string
    height: string
  }
}

export function ApiOverview() {
  const [showApiVersioning, setShowApiVersioning] = useState(false)
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [kafkaTooltipContent, setKafkaTooltipContent] = useState<string>('')
  const [kafkaTooltipLoading, setKafkaTooltipLoading] = useState(true)
  const [showKafkaTooltip, setShowKafkaTooltip] = useState(false)
  const [kafkaTooltipPinned, setKafkaTooltipPinned] = useState(false)
  const [showDemoSettings, setShowDemoSettings] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [newKafkaContent, setNewKafkaContent] = useState<string>('')
  const [publicCatalogContent, setPublicCatalogContent] = useState<string>('')
  const [, setPublicCatalogLoading] = useState(true)
  const [showPublicCatalogApproval, setShowPublicCatalogApproval] = useState(false)
  const [newPublicCatalogContent, setNewPublicCatalogContent] = useState<string>('')
  const [isRefreshingCatalog, setIsRefreshingCatalog] = useState(false)
  const [tooltipTimeout, setTooltipTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [pinnedTooltip, setPinnedTooltip] = useState<string | null>(null)
  const [openStandardsContent, setOpenStandardsContent] = useState<string>('')
  const [, setOpenStandardsLoading] = useState(true)
  const [showOpenStandardsApproval, setShowOpenStandardsApproval] = useState(false)
  const [newOpenStandardsContent, setNewOpenStandardsContent] = useState<string>('')
  const [isRefreshingOpenStandards, setIsRefreshingOpenStandards] = useState(false)
  const [jwtInfo, setJwtInfo] = useState<{
    is_expired?: boolean
    expires_at?: string
    days_remaining?: number
    email?: string
  } | null>(null)
  const [jwtLoading, setJwtLoading] = useState(true)
  const [kafkaPrompt, setKafkaPrompt] = useState('What are the Kafka capabilities in Temenos platform for event-driven architecture and messaging, including CloudEvents support?')
  const [publicCatalogPrompt, setPublicCatalogPrompt] = useState('What is the Temenos public API catalog and what are its key capabilities for banks and developers?')
  const [openStandardsPrompt, setOpenStandardsPrompt] = useState('Elaborate about API and related open standards such as Berlin Group, OpenAPI and PSD2')

  const tooltips: TooltipConfig[] = [
    {
      id: 'expose-data',
      title: 'Expose data & business capabilities as REST APIs',
      description: 'Temenos exposes its business and data capabilities through a comprehensive set of RESTful APIs that use JSON payloads and adhere to semantic versioning and OpenAPI specifications, enabling seamless and standardized integration with external systems. These APIs cover most core banking functionalities and can be customized or extended using the Workbench low-code tool to meet specific business requirements.',
      position: { top: '12%', left: '5%', width: '40%', height: '22%' }
    },
    {
      id: 'api-catalog',
      title: 'Public API Catalog for documentation and reuse',
      description: publicCatalogContent || 'The Temenos Public API Catalog serves as a centralized, searchable repository that provides comprehensive documentation for all available banking APIs, making it easy for developers, partners, and internal teams to discover, understand, and reuse existing integrations. This catalog includes detailed API specifications using OpenAPI (Swagger) format, interactive documentation with request/response examples, authentication requirements, rate limits, and versioning information for each endpoint. Developers can explore APIs by functional domain (payments, accounts, lending, etc.), test endpoints directly through the catalog\'s sandbox environment, and access code samples in multiple programming languages. The catalog also includes best practices for API consumption, common integration patterns, error handling guidelines, and security recommendations. This self-service approach accelerates development by reducing the time needed to understand API capabilities, promotes consistency across integrations, and enables faster time-to-market for new banking products and services built on the Temenos platform.',
      position: { top: '35%', left: '5%', width: '40%', height: '22%' }
    },
    {
      id: 'open-standards',
      title: 'Open standards and tooling',
      description: openStandardsContent || 'Temenos APIs are built on industry-standard protocols and specifications, ensuring compatibility and interoperability across different systems and platforms. The platform adheres to open standards such as OpenAPI (formerly Swagger) for API documentation and design, enabling developers to easily understand, integrate, and work with Temenos banking services. Support from leading organizations like The Berlin Group ensures compliance with European banking standards, while adherence to PSD2 (Payment Services Directive 2) regulations enables secure third-party access to payment services. This commitment to open standards facilitates seamless integration with fintech ecosystems, regulatory compliance, and accelerated development through widely-adopted tooling and best practices in API design and implementation.',
      position: { top: '58%', left: '5%', width: '40%', height: '22%' }
    },
    {
      id: 'graphical-wizards',
      title: 'Graphical wizards for better productivity',
      description: 'Intuitive visual tools and wizards simplify the process of creating, testing, and managing API integrations, reducing development time and enabling both technical and business users to participate in the integration process.',
      position: { top: '12%', left: '55%', width: '40%', height: '22%' }
    },
    {
      id: 'security-standards',
      title: 'Security standards ensuring data privacy and authentication',
      description: 'Enterprise-grade security features including OAuth 2.0, JWT tokens, role-based access control (RBAC), and encryption ensure that all API communications are secure and comply with regulatory requirements for data privacy and authentication.',
      position: { top: '35%', left: '55%', width: '40%', height: '22%' }
    },
    {
      id: 'upgradability',
      title: 'Upgradability and versioning',
      description: 'Semantic versioning and backward compatibility guarantees ensure that API integrations remain stable during platform upgrades, minimizing disruption and maintenance overhead while allowing gradual adoption of new features and improvements.',
      position: { top: '58%', left: '55%', width: '40%', height: '22%' }
    }
  ]

  // Helper function to handle feature card hover
  const handleFeatureCardHover = (tooltipId: string) => {
    // Clear any existing timeout
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout)
      setTooltipTimeout(null)
    }
    // Don't change tooltip if something is pinned
    if (pinnedTooltip || kafkaTooltipPinned) {
      return
    }
    setActiveTooltip(tooltipId)
    setShowKafkaTooltip(false)
  }

  // Helper function to handle feature card leave with delay
  const handleFeatureCardLeave = () => {
    // Don't clear tooltip if something is pinned
    if (pinnedTooltip || kafkaTooltipPinned) {
      return
    }
    // Clear any existing timeout
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout)
      setTooltipTimeout(null)
    }
    // Don't clear tooltip immediately - let the next hover handle it
    // This prevents flickering when moving between boxes
  }

  // Helper function to handle feature card click (pin/unpin)
  const handleFeatureCardClick = (tooltipId: string) => {
    if (pinnedTooltip === tooltipId) {
      // Unpin if clicking the same box
      setPinnedTooltip(null)
      setActiveTooltip(null)
    } else {
      // Pin this tooltip
      setPinnedTooltip(tooltipId)
      setActiveTooltip(tooltipId)
      setKafkaTooltipPinned(false)
      setShowKafkaTooltip(false)
    }
  }

  // Fetch Kafka capabilities from cache
  useEffect(() => {
    const fetchKafkaInfo = async () => {
      try {
        const response = await apiService.getCachedContent('kafka_tooltip')
        const cacheData = response.data
        if (cacheData?.content) {
          setKafkaTooltipContent(cacheData.content)
        } else {
          setKafkaTooltipContent('Apache Kafka serves as the backbone for event-driven architecture in the Temenos platform, enabling real-time, asynchronous communication between microservices and external systems. The platform leverages Kafka\'s distributed streaming capabilities to handle high-throughput message processing, ensuring reliable delivery of banking events such as transactions, account updates, and regulatory notifications. Temenos implements CloudEvents specification for standardized event formatting, making it easier to integrate with cloud-native applications and third-party services. Kafka\'s publish-subscribe model allows multiple consumers to process the same events independently, supporting use cases like real-time analytics, audit logging, fraud detection, and downstream system synchronization. The platform\'s Kafka integration includes features for message persistence, replay capabilities, and horizontal scalability to handle growing transaction volumes while maintaining low latency and high availability for mission-critical banking operations.')
        }
      } catch (err) {
        console.error('Failed to load Kafka tooltip from cache:', err)
        setKafkaTooltipContent('Apache Kafka serves as the backbone for event-driven architecture in the Temenos platform, enabling real-time, asynchronous communication between microservices and external systems. The platform leverages Kafka\'s distributed streaming capabilities to handle high-throughput message processing, ensuring reliable delivery of banking events such as transactions, account updates, and regulatory notifications. Temenos implements CloudEvents specification for standardized event formatting, making it easier to integrate with cloud-native applications and third-party services. Kafka\'s publish-subscribe model allows multiple consumers to process the same events independently, supporting use cases like real-time analytics, audit logging, fraud detection, and downstream system synchronization. The platform\'s Kafka integration includes features for message persistence, replay capabilities, and horizontal scalability to handle growing transaction volumes while maintaining low latency and high availability for mission-critical banking operations.')
      } finally {
        setKafkaTooltipLoading(false)
      }
    }

    fetchKafkaInfo()
  }, [])

  // Fetch Public Catalog content from cache
  useEffect(() => {
    const fetchPublicCatalogInfo = async () => {
      try {
        const response = await apiService.getCachedContent('public_catalog_tooltip')
        const cacheData = response.data
        if (cacheData?.content) {
          setPublicCatalogContent(cacheData.content)
        }
      } catch (err) {
        console.error('Failed to load Public Catalog tooltip from cache:', err)
      } finally {
        setPublicCatalogLoading(false)
      }
    }

    fetchPublicCatalogInfo()
  }, [])

  // Fetch Open Standards content from cache
  useEffect(() => {
    const fetchOpenStandardsInfo = async () => {
      try {
        const response = await apiService.getCachedContent('open_standards_tooltip')
        const cacheData = response.data
        if (cacheData?.content) {
          setOpenStandardsContent(cacheData.content)
        }
      } catch (err) {
        console.error('Failed to load Open Standards tooltip from cache:', err)
      } finally {
        setOpenStandardsLoading(false)
      }
    }

    fetchOpenStandardsInfo()
  }, [])

  // Fetch JWT token information
  useEffect(() => {
    const fetchJWTInfo = async () => {
      try {
        const response = await apiService.getJWTInfo()
        const data = response.data
        setJwtInfo(data)
      } catch (err) {
        console.error('Failed to load JWT info:', err)
      } finally {
        setJwtLoading(false)
      }
    }

    fetchJWTInfo()
  }, [])

  // Refresh Kafka tooltip from RAG API - shows approval modal
  const refreshKafkaTooltip = async () => {
    setIsRefreshing(true)
    try {
      const response = await apiService.queryRAG({
        question: kafkaPrompt,
        region: 'global',
        RAGmodelId: 'TechnologyOverview, ModularBanking',
        context: 'This is about Kafka messaging capabilities and CloudEvents integration in Temenos platform for integration and event-driven architecture.'
      })

      const ragData = response.data
      if (ragData?.answer) {
        // Show the new content in approval modal
        setNewKafkaContent(ragData.answer)
        setShowApprovalModal(true)
      } else {
        alert('No content received from RAG API. Please try again.')
      }
    } catch (err) {
      console.error('Failed to refresh Kafka tooltip:', err)
      alert('Failed to fetch content from RAG API. Please try again.')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Approve and save the new Kafka content to cache
  const approveKafkaContent = async () => {
    try {
      await apiService.updateCachedContent('kafka_tooltip', newKafkaContent, 'text', {
        source: 'rag_api',
        category: 'integration',
        refreshed_at: new Date().toISOString()
      })
      setKafkaTooltipContent(newKafkaContent)
      setShowApprovalModal(false)
      setNewKafkaContent('')
    } catch (err) {
      console.error('Failed to update cache:', err)
      alert('Failed to update cache. Please try again.')
    }
  }

  // Cancel the refresh
  const cancelKafkaRefresh = () => {
    setShowApprovalModal(false)
    setNewKafkaContent('')
  }

  // Refresh Public Catalog tooltip from RAG API
  const refreshPublicCatalogTooltip = async () => {
    setIsRefreshingCatalog(true)
    try {
      const response = await apiService.queryRAG({
        question: publicCatalogPrompt,
        region: 'global',
        RAGmodelId: 'TechnologyOverview, ModularBanking',
        context: 'This is about the public API catalog, developer portal, and API documentation capabilities in Temenos platform.'
      })

      const ragData = response.data
      if (ragData?.answer) {
        setNewPublicCatalogContent(ragData.answer)
        setShowPublicCatalogApproval(true)
      } else {
        alert('No content received from RAG API. Please try again.')
      }
    } catch (err) {
      console.error('Failed to refresh Public Catalog tooltip:', err)
      alert('Failed to fetch content from RAG API. Please try again.')
    } finally {
      setIsRefreshingCatalog(false)
    }
  }

  // Approve and save the new Public Catalog content
  const approvePublicCatalogContent = async () => {
    try {
      await apiService.updateCachedContent('public_catalog_tooltip', newPublicCatalogContent, 'text', {
        source: 'rag_api',
        category: 'api_catalog',
        refreshed_at: new Date().toISOString()
      })
      setPublicCatalogContent(newPublicCatalogContent)
      setShowPublicCatalogApproval(false)
      setNewPublicCatalogContent('')
    } catch (err) {
      console.error('Failed to update cache:', err)
      alert('Failed to update cache. Please try again.')
    }
  }

  // Cancel the Public Catalog refresh
  const cancelPublicCatalogRefresh = () => {
    setShowPublicCatalogApproval(false)
    setNewPublicCatalogContent('')
  }

  // Refresh Open Standards tooltip from RAG API
  const refreshOpenStandardsTooltip = async () => {
    setIsRefreshingOpenStandards(true)
    try {
      const response = await apiService.queryRAG({
        question: openStandardsPrompt,
        region: 'global',
        RAGmodelId: 'TechnologyOverview, ModularBanking',
        context: 'This is about open standards for APIs including Berlin Group, OpenAPI specifications, and PSD2 compliance in Temenos platform.'
      })

      const ragData = response.data
      if (ragData?.answer) {
        setNewOpenStandardsContent(ragData.answer)
        setShowOpenStandardsApproval(true)
      } else {
        alert('No content received from RAG API. Please try again.')
      }
    } catch (err) {
      console.error('Failed to refresh Open Standards tooltip:', err)
      alert('Failed to fetch content from RAG API. Please try again.')
    } finally {
      setIsRefreshingOpenStandards(false)
    }
  }

  // Approve and save the new Open Standards content
  const approveOpenStandardsContent = async () => {
    try {
      await apiService.updateCachedContent('open_standards_tooltip', newOpenStandardsContent, 'text', {
        source: 'rag_api',
        category: 'api_standards',
        refreshed_at: new Date().toISOString()
      })
      setOpenStandardsContent(newOpenStandardsContent)
      setShowOpenStandardsApproval(false)
      setNewOpenStandardsContent('')
    } catch (err) {
      console.error('Failed to update cache:', err)
      alert('Failed to update cache. Please try again.')
    }
  }

  // Cancel the Open Standards refresh
  const cancelOpenStandardsRefresh = () => {
    setShowOpenStandardsApproval(false)
    setNewOpenStandardsContent('')
  }

  // Helper function to render markdown bold text
  const renderMarkdownContent = (text: string) => {
    // Split by **text** pattern and render bold
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Remove ** and render as bold
        const boldText = part.slice(2, -2)
        return <strong key={index} className="font-bold text-purple-900">{boldText}</strong>
      }
      return <span key={index}>{part}</span>
    })
  }

  // Show API Versioning page if navigated
  if (showApiVersioning) {
    return <ApiVersioning onBack={() => setShowApiVersioning(false)} />
  }

  return (
    <div className="card">
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#283054]">API Overview</h2>
      </div>

      {/* API Framework Diagram */}
      <div
        className="relative rounded-lg overflow-hidden flex"
        style={{
          minHeight: '450px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
        }}
        onMouseLeave={() => {
          if (!pinnedTooltip && !kafkaTooltipPinned) {
            setActiveTooltip(null)
          }
        }}
      >
        {/* Modern pattern overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(255,255,255,0.05) 0%, transparent 50%)
          `
        }}></div>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>

        {/* Left Panel - Features */}
        <div className="w-[30%] p-6 space-y-4 z-10 flex flex-col justify-center">
          {/* API Icon & Text */}
          <div
            className={`bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all cursor-pointer relative ${pinnedTooltip === 'expose-data' ? 'ring-2 ring-purple-500 ring-opacity-50' : ''}`}
            onMouseEnter={() => handleFeatureCardHover('expose-data')}
            onMouseLeave={handleFeatureCardLeave}
            onClick={() => handleFeatureCardClick('expose-data')}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-full h-full p-1.5" viewBox="0 0 100 100" fill="none">
                    {/* Clean symmetrical gear with 8 teeth */}
                    <path fill="white" d="M50,10 L53,10 L53,18 L58,18 L61,14 L63.5,16.5 L59.5,20.5 L65,26 L69,22 L71.5,24.5 L67.5,28.5 L73,34 L77,30 L79.5,32.5 L75.5,36.5 L82,42 L82,47 L90,47 L90,53 L82,53 L82,58 L86,61 L83.5,63.5 L79.5,59.5 L74,65 L78,69 L75.5,71.5 L71.5,67.5 L66,73 L70,77 L67.5,79.5 L63.5,75.5 L58,82 L53,82 L53,90 L47,90 L47,82 L42,82 L39,86 L36.5,83.5 L40.5,79.5 L35,74 L31,78 L28.5,75.5 L32.5,71.5 L27,66 L23,70 L20.5,67.5 L24.5,63.5 L18,58 L18,53 L10,53 L10,47 L18,47 L18,42 L14,39 L16.5,36.5 L20.5,40.5 L26,35 L22,31 L24.5,28.5 L28.5,32.5 L34,27 L30,23 L32.5,20.5 L36.5,24.5 L42,18 L47,18 L47,10 Z M50,28 A22,22 0 1,0 50,72 A22,22 0 1,0 50,28 Z"/>
                    {/* Inner circle for text - purple background */}
                    <circle cx="50" cy="50" r="16" fill="#7C3AED" />
                    {/* API text - white */}
                    <text x="50" y="56" fontSize="14" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="Arial, sans-serif">API</text>
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-[#1a1f3a] leading-tight">Expose data & business</h3>
                <p className="text-base font-bold text-purple-700 leading-tight">capabilities as REST APIs</p>
              </div>
            </div>
          </div>

          {/* Shopping Cart Icon & Text - Public API Catalog */}
          <div
            className={`bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all cursor-pointer relative group ${pinnedTooltip === 'api-catalog' ? 'ring-2 ring-purple-500 ring-opacity-50' : ''}`}
            onMouseEnter={() => handleFeatureCardHover('api-catalog')}
            onMouseLeave={handleFeatureCardLeave}
            onClick={() => handleFeatureCardClick('api-catalog')}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div
                  className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center cursor-pointer relative"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open('https://developer.temenos.com/all-product-apis', '_blank')
                  }}
                >
                  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-4 h-4 text-white bg-purple-700 rounded-full p-0.5" />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-[#1a1f3a] leading-tight">Public API Catalog</h3>
                <p className="text-base font-bold text-purple-700 leading-tight">and documentation</p>
              </div>
            </div>
          </div>

          {/* Open Standards Icon & Text */}
          <div
            className={`bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all cursor-pointer relative ${pinnedTooltip === 'open-standards' ? 'ring-2 ring-purple-500 ring-opacity-50' : ''}`}
            onMouseEnter={() => handleFeatureCardHover('open-standards')}
            onMouseLeave={handleFeatureCardLeave}
            onClick={() => handleFeatureCardClick('open-standards')}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-[#1a1f3a] leading-tight mb-2">Open standards and tooling</h3>
                <div className="flex items-center space-x-4 mt-2">
                  <img
                    src="/images/berlingroupe.jpg"
                    alt="Berlin Group"
                    className="h-6 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open('https://www.berlin-group.org/', '_blank')
                    }}
                  />
                  <img
                    src="/images/openapi.jpg"
                    alt="OpenAPI Initiative"
                    className="h-6 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open('https://www.openapis.org/', '_blank')
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Middle Panel - API Schema */}
        <div className="flex-1 p-6 z-10 flex flex-col items-center justify-center">
          {/* API Schema Diagram - Two boxes with U-shaped connection */}
          <div className="relative flex flex-col items-center justify-center" style={{ minHeight: '200px', gap: '38px' }}>
            {/* Bank's System Box - spans width of both columns */}
            <div className="bg-white rounded-lg shadow-md border-2 border-[#097BED]" style={{ width: '320px', padding: '11px 16px' }}>
              <div className="text-center text-base font-semibold text-[#283054] leading-tight">
                Bank's system<br/>
                <span className="text-xs">(channel, real-time interface, etc.)</span>
              </div>
            </div>

            {/* Command Arrow - from Bank's System to left API */}
            <div className="absolute" style={{ top: '62px', left: '50%', transform: 'translateX(-82px)' }}>
              <svg width="5" height="45" style={{ overflow: 'visible' }}>
                <defs>
                  <marker id="arrowCommand" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <polygon points="0,0 6,3 0,6" fill="#FFFFFF" />
                  </marker>
                </defs>
                <line x1="2.5" y1="0" x2="2.5" y2="43" stroke="#FFFFFF" strokeWidth="2.5" markerEnd="url(#arrowCommand)" strokeDasharray="6,3">
                  <animate attributeName="stroke-dashoffset" from="0" to="-9" dur="0.8s" repeatCount="indefinite" />
                </line>
              </svg>
              <div className="absolute text-[11px] font-semibold whitespace-nowrap" style={{ right: '10px', top: '12px', color: '#FFFFFF' }}>command</div>
            </div>

            {/* Response Arrow - from right API to Bank's System */}
            <div className="absolute" style={{ top: '72px', left: '50%', transform: 'translateX(77px)' }}>
              <svg width="5" height="44" style={{ overflow: 'visible' }}>
                <defs>
                  <marker id="arrowResponse" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
                    <polygon points="0,0 6,3 0,6" fill="#FFFFFF" />
                  </marker>
                </defs>
                <line x1="2.5" y1="42" x2="2.5" y2="1" stroke="#FFFFFF" strokeWidth="2.5" markerEnd="url(#arrowResponse)" strokeDasharray="6,3">
                  <animate attributeName="stroke-dashoffset" from="0" to="-9" dur="0.8s" repeatCount="indefinite" />
                </line>
              </svg>
              <div className="absolute text-[11px] font-semibold whitespace-nowrap" style={{ left: '10px', top: '8px', color: '#FFFFFF' }}>query</div>
            </div>

            {/* Gray Response Arrow - from Bank's System back to API (next to command arrow) */}
            <div className="absolute" style={{ top: '75px', left: '50%', transform: 'translateX(-71px)' }}>
              <svg width="5" height="41" style={{ overflow: 'visible' }}>
                <defs>
                  <marker id="arrowResponseGray" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
                    <polygon points="0,0 6,3 0,6" fill="#9CA3AF" />
                  </marker>
                </defs>
                <line x1="2.5" y1="39" x2="2.5" y2="1" stroke="#9CA3AF" strokeWidth="2.5" markerEnd="url(#arrowResponseGray)" strokeDasharray="6,3">
                  <animate attributeName="stroke-dashoffset" from="0" to="-9" dur="0.8s" repeatCount="indefinite" />
                </line>
              </svg>
            </div>

            {/* Two Boxes with U-shaped Arrow */}
            <div className="flex items-start gap-4 relative" style={{ marginTop: '11px' }}>
              {/* Temenos Business Logic Box with API label */}
              <div className="flex flex-col items-center relative" style={{ gap: '5px' }}>
                {/* Thin API Box */}
                <div className="bg-gradient-to-r from-[#097BED] to-[#0868CC] rounded px-5 py-1.5 shadow-sm" style={{ minWidth: '150px' }}>
                  <div className="text-center text-sm font-bold text-white" style={{ color: '#FFFFFF' }}>API</div>
                </div>

                {/* Temenos Business Logic Box */}
                <div className="bg-white rounded-lg p-2.5 shadow-md border-2 border-[#097BED]" style={{ minWidth: '150px' }}>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#097BED] to-[#0868CC] rounded-lg flex items-center justify-center mx-auto mb-1 shadow-sm">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                    </div>
                    <div className="text-xs font-semibold text-[#283054] leading-tight">Temenos<br/>Business Logic</div>
                  </div>
                </div>
              </div>

              {/* U-shaped arrow connecting the two boxes at the bottom with spacing */}
              <div className="absolute" style={{ bottom: '-42px', left: '50%', transform: 'translateX(-50%)', width: '204px', height: '54px' }}>
                <svg width="204" height="54" style={{ overflow: 'visible' }}>
                  <defs>
                    <marker id="arrowUShape" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
                      <polygon points="0,0 6,3 0,6" fill="#FFFFFF" />
                    </marker>
                  </defs>
                  {/* U-shaped path starting from outside the boxes */}
                  <path
                    d="M 0,7 Q 0,47 7,47 L 197,47 Q 204,47 204,7"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    markerEnd="url(#arrowUShape)"
                    strokeDasharray="6,3"
                  >
                    <animate attributeName="stroke-dashoffset" from="0" to="-9" dur="1.2s" repeatCount="indefinite" />
                  </path>
                </svg>
              </div>

              {/* Kafka Box in the middle of U-arrow */}
              <div
                className="absolute cursor-pointer"
                style={{ bottom: '-48px', left: '50%', transform: 'translateX(-50%)' }}
                onMouseEnter={() => {
                  if (!kafkaTooltipPinned && !pinnedTooltip) {
                    setShowKafkaTooltip(true)
                  }
                }}
                onMouseLeave={() => {
                  if (!kafkaTooltipPinned) {
                    setShowKafkaTooltip(false)
                  }
                }}
                onClick={() => {
                  if (kafkaTooltipPinned) {
                    // Unpin
                    setKafkaTooltipPinned(false)
                    setShowKafkaTooltip(false)
                  } else {
                    // Pin
                    setKafkaTooltipPinned(true)
                    setShowKafkaTooltip(true)
                    setActiveTooltip(null)
                    setPinnedTooltip(null)
                  }
                }}
              >
                <div className={`bg-gradient-to-r from-[#097BED] to-[#0868CC] rounded px-4 py-1 shadow-sm hover:shadow-lg transition-all ${kafkaTooltipPinned ? 'ring-2 ring-white ring-opacity-50' : ''}`}>
                  <div className="text-center text-xs font-bold text-white" style={{ color: '#FFFFFF' }}>
                    kafka
                    {kafkaTooltipLoading && <Loader2 className="w-3 h-3 animate-spin inline-block ml-1" />}
                  </div>
                </div>
              </div>

              {/* Business Microservices Box with API label */}
              <div className="flex flex-col items-center relative" style={{ gap: '5px' }}>
                {/* Thin API Box */}
                <div className="bg-gradient-to-r from-[#097BED] to-[#0868CC] rounded px-5 py-1.5 shadow-sm" style={{ minWidth: '150px' }}>
                  <div className="text-center text-sm font-bold text-white" style={{ color: '#FFFFFF' }}>API</div>
                </div>

                {/* Business Microservices Box */}
                <div className="bg-white rounded-lg p-2.5 shadow-md border-2 border-[#097BED]" style={{ minWidth: '150px' }}>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#097BED] to-[#0868CC] rounded-lg flex items-center justify-center mx-auto mb-1 shadow-sm">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                    </div>
                    <div className="text-xs font-semibold text-[#283054] leading-tight">Business<br/>Microservices</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Features */}
        <div className="w-[30%] p-6 space-y-4 z-10 flex flex-col justify-center">
          {/* Desktop/Wizard Icon & Text */}
          <div
            className={`bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all cursor-pointer relative ${pinnedTooltip === 'graphical-wizards' ? 'ring-2 ring-purple-500 ring-opacity-50' : ''}`}
            onMouseEnter={() => handleFeatureCardHover('graphical-wizards')}
            onMouseLeave={handleFeatureCardLeave}
            onClick={() => handleFeatureCardClick('graphical-wizards')}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8M12 17v4" />
                    <path d="M7 8h4M7 11h2M7 14h3" strokeWidth="1.5" />
                    <path d="M17 10l-2 2 2 2" strokeWidth="2.5" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-[#1a1f3a] leading-tight">Graphical wizards for better</h3>
                <p className="text-base font-bold text-purple-700 leading-tight">productivity</p>
              </div>
            </div>
          </div>

          {/* Security Shield Icon & Text */}
          <div
            className={`bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all cursor-pointer relative ${pinnedTooltip === 'security-standards' ? 'ring-2 ring-purple-500 ring-opacity-50' : ''}`}
            onMouseEnter={() => handleFeatureCardHover('security-standards')}
            onMouseLeave={handleFeatureCardLeave}
            onClick={() => handleFeatureCardClick('security-standards')}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-[#1a1f3a] leading-tight">Security standards for data</h3>
                <p className="text-base font-bold text-purple-700 leading-tight">privacy and authentication</p>
              </div>
            </div>
          </div>

          {/* Upgradability Icon & Text */}
          <div
            className={`bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all cursor-pointer relative ${pinnedTooltip === 'upgradability' ? 'ring-2 ring-purple-500 ring-opacity-50' : ''}`}
            onMouseEnter={() => handleFeatureCardHover('upgradability')}
            onMouseLeave={handleFeatureCardLeave}
            onClick={() => handleFeatureCardClick('upgradability')}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 6v6l4 2" strokeLinecap="round" />
                    <path d="M16 3l2 2-2 2M8 3L6 5l2 2" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0 flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1a1f3a] leading-tight">Upgradability and versioning</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowApiVersioning(true)
                  }}
                  className="text-purple-600 hover:text-purple-800 transition-colors ml-2"
                  title="View API Versioning details"
                >
                  <Link className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip Display - Below the purple background */}
      <div
        className={`mt-4 transition-opacity duration-200 ${(activeTooltip || showKafkaTooltip) ? 'opacity-100' : 'opacity-0'}`}
        onMouseEnter={() => {
          // Clear any existing timeout when hovering over tooltip
          if (tooltipTimeout) {
            clearTimeout(tooltipTimeout)
            setTooltipTimeout(null)
          }
          // Keep the tooltip visible when hovering over it
          if (activeTooltip) {
            setActiveTooltip(activeTooltip)
          }
          if (showKafkaTooltip && !kafkaTooltipPinned) {
            setShowKafkaTooltip(true)
          }
        }}
      >
        <div className="p-4 bg-white border-2 border-purple-500 rounded-lg shadow-lg text-sm">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              {showKafkaTooltip && (
                <div>
                  <h3 className="font-bold text-purple-900 mb-2">
                    Kafka - Event-Driven Architecture
                  </h3>
                  {kafkaTooltipLoading ? (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading Kafka capabilities from RAG...</span>
                    </div>
                  ) : (
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {kafkaTooltipContent}
                    </p>
                  )}
                </div>
              )}
              {activeTooltip && !showKafkaTooltip && (
                <div>
                  <h3 className="font-bold text-purple-900 mb-2">
                    {tooltips.find(t => t.id === activeTooltip)?.title}
                  </h3>
                  <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {renderMarkdownContent(tooltips.find(t => t.id === activeTooltip)?.description || '')}
                  </div>
                </div>
              )}
              {!activeTooltip && !showKafkaTooltip && (
                <p className="text-gray-600 italic">Hover over a feature card or the kafka box to see details</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-[#4A5568] mt-4">
        Integration architecture and API endpoints overview
        <span className="ml-2 text-purple-600 text-xs font-medium">(Hover over feature cards or the kafka box for more details)</span>
      </p>

      {/* Demo Settings Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setShowDemoSettings(!showDemoSettings)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6M1 12h6m6 0h6" strokeLinecap="round" />
            <path d="M4.22 4.22l4.24 4.24m7.08 0l4.24-4.24M4.22 19.78l4.24-4.24m7.08 0l4.24 4.24" strokeLinecap="round" strokeWidth="1.5" />
          </svg>
          <span className="text-sm font-medium">Demo Settings</span>
        </button>
      </div>

      {/* Demo Settings Panel */}
      {showDemoSettings && (
        <div className="mt-4 p-4 bg-white border-2 border-purple-500 rounded-lg shadow-lg">
          <h3 className="text-lg font-bold text-purple-900 mb-3">Demo Settings</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-gray-900">Refresh Kafka Tooltip</p>
                <p className="text-xs text-gray-600 mt-1">Fetch latest content from RAG API and update cache</p>
              </div>
              <button
                onClick={refreshKafkaTooltip}
                disabled={isRefreshing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg shadow-md transition-all flex items-center space-x-2"
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Refreshing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                      <path d="M15 3v6h6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-sm">Refresh</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-gray-900">Refresh Public API Catalog Tooltip</p>
                <p className="text-xs text-gray-600 mt-1">Fetch latest content from RAG API and update cache</p>
              </div>
              <button
                onClick={refreshPublicCatalogTooltip}
                disabled={isRefreshingCatalog}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg shadow-md transition-all flex items-center space-x-2"
              >
                {isRefreshingCatalog ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Refreshing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                      <path d="M15 3v6h6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-sm">Refresh</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-gray-900">Refresh Open Standards Tooltip</p>
                <p className="text-xs text-gray-600 mt-1">Fetch latest content from RAG API and update cache</p>
              </div>
              <button
                onClick={refreshOpenStandardsTooltip}
                disabled={isRefreshingOpenStandards}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg shadow-md transition-all flex items-center space-x-2"
              >
                {isRefreshingOpenStandards ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Refreshing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                      <path d="M15 3v6h6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-sm">Refresh</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* JWT Token Information - at the end with purple background */}
          <div className="mt-4 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
            <h4 className="text-sm font-bold text-purple-900 mb-3">RAG API JWT Token Status</h4>
            {jwtLoading ? (
              <div className="flex items-center space-x-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Loading JWT info...</span>
              </div>
            ) : jwtInfo ? (
              <div className="space-y-1">
                {jwtInfo.email && (
                  <p className="text-xs text-gray-700">
                    <span className="font-semibold">User:</span> {jwtInfo.email}
                  </p>
                )}
                {jwtInfo.expires_at && (
                  <p className="text-xs text-gray-700">
                    <span className="font-semibold">Expires:</span> {new Date(jwtInfo.expires_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
                {jwtInfo.is_expired !== undefined && (
                  <div className={`flex items-center space-x-2 mt-2 ${jwtInfo.is_expired ? 'text-red-600' : 'text-green-600'}`}>
                    {jwtInfo.is_expired ? (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-bold">Token Expired - A new JWT token needs to be used</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-bold">
                          Token Valid ({jwtInfo.days_remaining !== undefined ? `${jwtInfo.days_remaining} days remaining` : 'active'})
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-600">JWT token information not available</p>
            )}
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Review RAG API Response - Kafka</h2>
              <p className="text-sm text-gray-600 mt-1">Please review the content below before approving the update</p>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* RAG Prompt Section */}
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-bold text-blue-900 mb-2">RAG API Prompt Used:</h3>
                <textarea
                  value={kafkaPrompt}
                  onChange={(e) => setKafkaPrompt(e.target.value)}
                  className="w-full p-3 border border-blue-300 rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter your RAG query prompt..."
                />
                <p className="text-xs text-blue-700 mt-2">
                  <span className="font-semibold">Tip:</span> You can edit this prompt and click "Refresh" again to get a new response
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">New Kafka Tooltip Content:</h3>
                <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {newKafkaContent}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={cancelKafkaRefresh}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg shadow-md transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={approveKafkaContent}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-all font-medium flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Approve & Update Cache</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Public Catalog Approval Modal */}
      {showPublicCatalogApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Review RAG API Response - Public API Catalog</h2>
              <p className="text-sm text-gray-600 mt-1">Please review the content below before approving the update</p>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* RAG Prompt Section */}
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-bold text-blue-900 mb-2">RAG API Prompt Used:</h3>
                <textarea
                  value={publicCatalogPrompt}
                  onChange={(e) => setPublicCatalogPrompt(e.target.value)}
                  className="w-full p-3 border border-blue-300 rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter your RAG query prompt..."
                />
                <p className="text-xs text-blue-700 mt-2">
                  <span className="font-semibold">Tip:</span> You can edit this prompt and click "Refresh" again to get a new response
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">New Public API Catalog Tooltip Content:</h3>
                <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {newPublicCatalogContent}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={cancelPublicCatalogRefresh}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg shadow-md transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={approvePublicCatalogContent}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-all font-medium flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Approve & Update Cache</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open Standards Approval Modal */}
      {showOpenStandardsApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Review RAG API Response - Open Standards</h2>
              <p className="text-sm text-gray-600 mt-1">Please review the content below before approving the update</p>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* RAG Prompt Section */}
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-bold text-blue-900 mb-2">RAG API Prompt Used:</h3>
                <textarea
                  value={openStandardsPrompt}
                  onChange={(e) => setOpenStandardsPrompt(e.target.value)}
                  className="w-full p-3 border border-blue-300 rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter your RAG query prompt..."
                />
                <p className="text-xs text-blue-700 mt-2">
                  <span className="font-semibold">Tip:</span> You can edit this prompt and click "Refresh" again to get a new response
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">New Open Standards Tooltip Content:</h3>
                <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {newOpenStandardsContent}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={cancelOpenStandardsRefresh}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg shadow-md transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={approveOpenStandardsContent}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition-all font-medium flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Approve & Update Cache</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
