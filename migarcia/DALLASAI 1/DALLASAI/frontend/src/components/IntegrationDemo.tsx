import { useState } from 'react'
import { Play, Loader2, AlertCircle, CheckCircle, Key, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react'
import axios from 'axios'
import { ApiKeyModal } from './ApiKeyModal'

interface ApiResult {
  status?: number
  data?: any
  error?: string
  loading: boolean
}

// JSON Syntax Highlighter Component
const JsonView = ({ data, rawText }: { data: any, rawText?: string }) => {
  if (!data) {
    // If JSON is invalid, show the raw text without highlighting
    if (rawText) {
      return <pre className="text-xs whitespace-pre-wrap font-mono">{rawText}</pre>
    }
    return <pre className="text-xs whitespace-pre-wrap text-gray-500">No data</pre>
  }

  const formattedJson = JSON.stringify(data, null, 2)

  const renderToken = (token: string, index: number) => {
    // Detect token type and apply appropriate styling with inline colors
    if (token.match(/^".*":$/)) {
      // Object key
      return <span key={index} style={{ color: '#BB6F62', fontWeight: 600 }}>{token}</span>
    } else if (token.match(/^".*"$/)) {
      // String value
      return <span key={index} style={{ color: '#134CA2' }}>{token}</span>
    } else if (token.match(/^-?\d+\.?\d*$/)) {
      // Number
      return <span key={index} style={{ color: '#008456' }}>{token}</span>
    } else if (token === 'true' || token === 'false') {
      // Boolean - Purple
      return <span key={index} style={{ color: '#9333ea', fontWeight: 600 }}>{token}</span>
    } else if (token === 'null') {
      // Null - Gray
      return <span key={index} style={{ color: '#6b7280', fontWeight: 600 }}>{token}</span>
    } else {
      // Default (punctuation, whitespace)
      return <span key={index}>{token}</span>
    }
  }

  // Split JSON into tokens
  const tokens = formattedJson.split(/("(?:\\.|[^"\\])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?|[{}[\],:]|\s+)/g).filter(Boolean)

  return (
    <pre className="text-xs whitespace-pre-wrap font-mono">
      {tokens.map((token, index) => renderToken(token, index))}
    </pre>
  )
}

interface BalanceInfo {
  amount?: number
  currency?: string
  lastUpdated?: string
  loading: boolean
  error?: string
}

export function IntegrationDemo() {
  const [getResult, setGetResult] = useState<ApiResult>({ loading: false })
  const [postResult, setPostResult] = useState<ApiResult>({ loading: false })
  const [portfolioResult, setPortfolioResult] = useState<ApiResult>({ loading: false })
  const [customerResult, setCustomerResult] = useState<ApiResult>({ loading: false })
  const [accountsResult, setAccountsResult] = useState<ApiResult>({ loading: false })
  const [balance, setBalance] = useState<BalanceInfo>({ loading: false })
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [getResultCollapsed, setGetResultCollapsed] = useState(false)
  const [postResultCollapsed, setPostResultCollapsed] = useState(false)
  const [portfolioResultCollapsed, setPortfolioResultCollapsed] = useState(false)
  const [customerResultCollapsed, setCustomerResultCollapsed] = useState(false)
  const [accountsResultCollapsed, setAccountsResultCollapsed] = useState(false)
  const [portfolioMethod, setPortfolioMethod] = useState<'GET' | 'POST'>('POST')
  const [portfolioId, setPortfolioId] = useState('100291-3')
  const [customerId, setCustomerId] = useState('100291')
  const [currencyId, setCurrencyId] = useState('EUR')

  // POST request body
  const [postBody, setPostBody] = useState(JSON.stringify({
    "header": {
    },
    "body": {
      "beneficiaryId": "BEN2507900006",
      "debitAccountId": "11215",
      "amount": 800,
      "sourceOfFundsTR": "CASH",
      "extensionData": {
        "taxSegmentTR": "B"
      }
    }
  }, null, 2))

  // Portfolio API request body
  const [portfolioBody, setPortfolioBody] = useState(JSON.stringify({
    "header": {
    },
    "body": {
      "referenceCurrency": "USD",
      "valuationCurrency": "USD",
      "portfolioName": "Bank USD Portfolio",
      "investmentProgram": "9",
      "managedAccount": "4",
      "startDate": "2019-08-24",
      "memoAccount": "Y"
    }
  }, null, 2))

  const fetchBalance = async () => {
    setBalance({ loading: true })
    try {
      const response = await axios.get(
        'http://localhost:8000/api/v1/integration/proxy',
        {
          params: {
            url: 'https://transactwb.temenos.com/irf-extension-api/api/v1.0.0/order/accounts/11215/balances'
          },
          headers: {
            'X-User-Id': 'demo_user'
          },
          timeout: 30000
        }
      )

      const proxyData = response.data
      console.log('Balance API Response:', proxyData) // Debug log

      if (proxyData.success && proxyData.data) {
        // Extract balance information from the response
        // The balance data is nested in data.body as an array
        const balanceData = proxyData.data.body && Array.isArray(proxyData.data.body)
          ? proxyData.data.body[0]
          : proxyData.data

        console.log('Balance Data:', balanceData) // Debug log

        const amount = balanceData?.availableBalance || 0
        const currency = balanceData?.currency || 'USD'

        console.log('Extracted Amount:', amount, 'Currency:', currency) // Debug log

        setBalance({
          loading: false,
          amount: amount,
          currency: currency,
          lastUpdated: new Date().toISOString()
        })
      } else {
        setBalance({
          loading: false,
          error: 'Failed to retrieve balance'
        })
      }
    } catch (error: any) {
      console.error('Balance fetch error:', error) // Debug log
      setBalance({
        loading: false,
        error: error.response?.data?.detail || error.message || 'Failed to fetch balance'
      })
    }
  }

  const executeGetRequest = async () => {
    setGetResult({ loading: true })
    try {
      // Use backend proxy to avoid CORS issues
      const response = await axios.get(
        'http://localhost:8000/api/v1/integration/proxy',
        {
          params: {
            url: 'https://api.temenos.com/api/v4.0.0/holdings/securityTrades/trades'
          },
          headers: {
            'X-User-Id': 'demo_user'
          },
          timeout: 30000
        }
      )

      // Extract data from proxy response
      const proxyData = response.data
      setGetResult({
        loading: false,
        status: proxyData.status,
        data: proxyData.data
      })
    } catch (error: any) {
      setGetResult({
        loading: false,
        error: error.response?.data?.detail || error.message || 'Request failed'
      })
    }
  }

  const executePostRequest = async () => {
    setPostResult({ loading: true })
    // Clear previous balance when starting a new request
    setBalance({ loading: false })

    try {
      // Validate JSON
      const parsedBody = JSON.parse(postBody)

      // Use backend proxy to avoid CORS issues
      const response = await axios.post(
        'http://localhost:8000/api/v1/integration/proxy',
        parsedBody,
        {
          params: {
            url: 'https://transactwb.temenos.com/irf-extension-api/api/v1.0.0/order/paymentOrders'
          },
          headers: {
            'X-User-Id': 'demo_user',
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      )

      // Extract data from proxy response
      const proxyData = response.data
      setPostResult({
        loading: false,
        status: proxyData.status,
        data: proxyData.data
      })

      // If payment was successful, fetch the updated balance
      if (proxyData.success && proxyData.status >= 200 && proxyData.status < 300) {
        await fetchBalance()
      }
    } catch (error: any) {
      // Clear balance on error
      setBalance({ loading: false })
      setPostResult({
        loading: false,
        error: error.response?.data?.detail || error.message || 'Request failed'
      })
    }
  }

  const executePortfolioRequest = async () => {
    setPortfolioResult({ loading: true })
    try {
      const portfolioUrl = `https://transactwb.temenos.com/irf-provider-container/api/v3.3.0/holdings/cryptoPortfolios/${portfolioId}`

      if (portfolioMethod === 'POST') {
        // Validate JSON
        const parsedBody = JSON.parse(portfolioBody)

        // Use backend proxy to avoid CORS issues
        const response = await axios.post(
          'http://localhost:8000/api/v1/integration/proxy',
          parsedBody,
          {
            params: {
              url: portfolioUrl
            },
            headers: {
              'X-User-Id': 'demo_user',
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        )

        // Extract data from proxy response
        const proxyData = response.data
        setPortfolioResult({
          loading: false,
          status: proxyData.status,
          data: proxyData.data
        })
      } else {
        // GET request
        const response = await axios.get(
          'http://localhost:8000/api/v1/integration/proxy',
          {
            params: {
              url: portfolioUrl
            },
            headers: {
              'X-User-Id': 'demo_user'
            },
            timeout: 30000
          }
        )

        // Extract data from proxy response
        const proxyData = response.data
        setPortfolioResult({
          loading: false,
          status: proxyData.status,
          data: proxyData.data
        })
      }
    } catch (error: any) {
      setPortfolioResult({
        loading: false,
        error: error.response?.data?.detail || error.message || 'Request failed'
      })
    }
  }

  // Customer API call
  const executeCustomerRequest = async () => {
    setCustomerResult({ loading: true })
    try {
      const customerUrl = `https://api.temenos.com/api/v5.7.0/party/customers/${customerId}`

      const response = await axios.get(
        'http://localhost:8000/api/v1/integration/proxy',
        {
          params: {
            url: customerUrl
          },
          headers: {
            'X-User-Id': 'demo_user'
          },
          timeout: 30000
        }
      )

      const proxyData = response.data
      setCustomerResult({
        loading: false,
        status: proxyData.status,
        data: proxyData.data
      })
    } catch (error: any) {
      setCustomerResult({
        loading: false,
        error: error.response?.data?.detail || error.message || 'Request failed'
      })
    }
  }

  // Accounts API call
  const executeAccountsRequest = async () => {
    setAccountsResult({ loading: true })
    try {
      const accountsUrl = `https://transactwb.temenos.com/irf-provider-container/api/v4.9.0/holdings/accounts/balances?currencyId=${currencyId}`

      const response = await axios.get(
        'http://localhost:8000/api/v1/integration/proxy',
        {
          params: {
            url: accountsUrl
          },
          headers: {
            'X-User-Id': 'demo_user'
          },
          timeout: 30000
        }
      )

      const proxyData = response.data
      setAccountsResult({
        loading: false,
        status: proxyData.status,
        data: proxyData.data
      })
    } catch (error: any) {
      setAccountsResult({
        loading: false,
        error: error.response?.data?.detail || error.message || 'Request failed'
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Title and API Key Management */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#283054]">Useful APIs</h2>
        <button
          onClick={() => setShowApiKeyModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
        >
          <Key className="w-4 h-4" />
          <span>MyAPIKey</span>
        </button>
      </div>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
      />

      {/* POST Request - Payment Orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">POST</span>
              <h3 className="text-lg font-bold text-[#283054]">Payment Orders</h3>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              https://transactwb.temenos.com/irf-extension-api/api/v1.0.0/order/paymentOrders
            </p>
          </div>
          <button
            onClick={executePostRequest}
            disabled={postResult.loading}
            className="flex items-center space-x-2 px-4 py-2 bg-[#097BED] text-white rounded-lg hover:bg-[#0868CC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md font-medium"
          >
            {postResult.loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span style={{ color: '#FFFFFF' }}>Loading...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span style={{ color: '#FFFFFF' }}>Execute</span>
              </>
            )}
          </button>
        </div>

        {/* POST Request Body */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Request Body:
          </label>
          <div className="relative">
            <div className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg overflow-auto bg-white pointer-events-none">
              <JsonView
                data={(() => { try { return JSON.parse(postBody) } catch { return null } })()}
                rawText={postBody}
              />
            </div>
            <textarea
              value={postBody}
              onChange={(e) => setPostBody(e.target.value)}
              className="absolute top-0 left-0 w-full h-48 px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#283054] focus:border-transparent bg-transparent text-transparent caret-black resize-none z-10"
              placeholder="Enter JSON request body..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* POST Response */}
        {(postResult.data || postResult.error) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {postResult.error ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-semibold text-red-700">Error</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-semibold text-green-700">
                      Status: {postResult.status}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPostResultCollapsed(!postResultCollapsed)}
                  className="flex items-center space-x-1 px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  title={postResultCollapsed ? "Expand result" : "Collapse result"}
                >
                  <span className="text-xs font-medium">
                    {postResultCollapsed ? 'Show' : 'Hide'}
                  </span>
                  {postResultCollapsed ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            {!postResultCollapsed && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* API Response - Takes 2/3 of the width */}
                <div className="lg:col-span-2">
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
                    {postResult.error ? (
                      <pre className="text-xs text-red-700 whitespace-pre-wrap">{postResult.error}</pre>
                    ) : (
                      <JsonView data={postResult.data} />
                    )}
                  </div>
                </div>

                {/* Right column - Balance or Extensibility Framework Badge */}
                {!postResult.error && (
                  <div className="lg:col-span-1">
                    {/* Extensibility Framework Badge - Show when pythonValidationError is present */}
                    {postResult.data && JSON.stringify(postResult.data).includes('pythonValidationError') && (
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-300 rounded-lg p-4 h-full flex flex-col justify-center">
                        <div className="text-center mb-3">
                          <svg className="w-10 h-10 text-purple-600 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z"/>
                          </svg>
                          <h3 className="text-sm font-semibold text-purple-700 mb-1">Extensibility Framework</h3>
                          <p className="text-xs text-purple-600">Python validation script</p>
                        </div>
                      </div>
                    )}

                    {/* Account Balance - Show when loading or when balance is available and no pythonValidationError */}
                    {!(postResult.data && JSON.stringify(postResult.data).includes('pythonValidationError')) && (
                      <>
                        {balance.loading && (
                          <div className="bg-gray-50 rounded-lg p-4 h-full flex items-center justify-center">
                            <div className="flex flex-col items-center space-y-2">
                              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                              <span className="text-sm text-gray-600">Fetching balance...</span>
                            </div>
                          </div>
                        )}

                        {balance.amount !== undefined && !balance.loading && (
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 h-full flex flex-col justify-center">
                            <div className="text-center mb-3">
                              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                              <h3 className="text-xs font-semibold text-gray-600 mb-1">Account Balance</h3>
                              <p className="text-xs text-gray-500">(Account: 11215)</p>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-700 mb-1">
                                {balance.currency} {balance.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              {balance.lastUpdated && (
                                <p className="text-xs text-gray-500">
                                  Updated: {new Date(balance.lastUpdated).toLocaleTimeString()}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* GET Request - Security Trades */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">GET</span>
              <h3 className="text-lg font-bold text-[#283054]">Security Trades</h3>
              <a
                href="https://developer.temenos.com/service/security-trades#tag/WEALTH/operation/getSecurityTrades"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 transition-colors"
                title="View API documentation"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              https://api.temenos.com/api/v4.0.0/holdings/securityTrades/trades
            </p>
          </div>
          <button
            onClick={executeGetRequest}
            disabled={getResult.loading}
            className="flex items-center space-x-2 px-4 py-2 bg-[#097BED] text-white rounded-lg hover:bg-[#0868CC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md font-medium"
          >
            {getResult.loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span style={{ color: '#FFFFFF' }}>Loading...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span style={{ color: '#FFFFFF' }}>Execute</span>
              </>
            )}
          </button>
        </div>

        {/* GET Response */}
        {(getResult.data || getResult.error) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getResult.error ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-semibold text-red-700">Error</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-semibold text-green-700">
                      Status: {getResult.status}
                    </span>
                  </>
                )}
              </div>
              <button
                onClick={() => setGetResultCollapsed(!getResultCollapsed)}
                className="flex items-center space-x-1 px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title={getResultCollapsed ? "Expand result" : "Collapse result"}
              >
                <span className="text-xs font-medium">
                  {getResultCollapsed ? 'Show' : 'Hide'}
                </span>
                {getResultCollapsed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
            {!getResultCollapsed && (
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
                {getResult.error ? (
                  <pre className="text-xs text-red-700 whitespace-pre-wrap">{getResult.error}</pre>
                ) : (
                  <JsonView data={getResult.data} />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Portfolio API - POST and GET */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {/* Method selector styled as badge */}
              <select
                value={portfolioMethod}
                onChange={(e) => setPortfolioMethod(e.target.value as 'GET' | 'POST')}
                className={`px-2 py-1 ${portfolioMethod === 'POST' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'} text-xs font-bold rounded cursor-pointer border-none focus:outline-none focus:ring-2 focus:ring-offset-1 ${portfolioMethod === 'POST' ? 'focus:ring-blue-500' : 'focus:ring-green-500'}`}
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
              </select>
              <h3 className="text-lg font-bold text-[#283054]">Portfolio</h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                https://transactwb.temenos.com/irf-provider-container/api/v3.3.0/holdings/cryptoPortfolios/
              </span>
              <input
                type="text"
                value={portfolioId}
                onChange={(e) => setPortfolioId(e.target.value)}
                className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#283054] focus:border-transparent font-mono"
                placeholder="Portfolio ID"
              />
            </div>
          </div>
          <button
            onClick={executePortfolioRequest}
            disabled={portfolioResult.loading}
            className="flex items-center space-x-2 px-4 py-2 bg-[#097BED] text-white rounded-lg hover:bg-[#0868CC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md font-medium"
          >
            {portfolioResult.loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span style={{ color: '#FFFFFF' }}>Loading...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span style={{ color: '#FFFFFF' }}>Execute</span>
              </>
            )}
          </button>
        </div>

        {/* Request Body (only for POST) */}
        {portfolioMethod === 'POST' && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Request Body:
            </label>
            <div className="relative">
              <div className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg overflow-auto bg-white pointer-events-none">
                <JsonView
                  data={(() => { try { return JSON.parse(portfolioBody) } catch { return null } })()}
                  rawText={portfolioBody}
                />
              </div>
              <textarea
                value={portfolioBody}
                onChange={(e) => setPortfolioBody(e.target.value)}
                className="absolute top-0 left-0 w-full h-48 px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#283054] focus:border-transparent bg-transparent text-transparent caret-black resize-none z-10"
                placeholder="Enter JSON request body..."
                spellCheck={false}
              />
            </div>
          </div>
        )}

        {/* Portfolio Response */}
        {(portfolioResult.data || portfolioResult.error) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {portfolioResult.error ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-semibold text-red-700">Error</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-semibold text-green-700">
                      Status: {portfolioResult.status}
                    </span>
                  </>
                )}
              </div>
              <button
                onClick={() => setPortfolioResultCollapsed(!portfolioResultCollapsed)}
                className="flex items-center space-x-1 px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                title={portfolioResultCollapsed ? "Expand result" : "Collapse result"}
              >
                <span className="text-xs font-medium">
                  {portfolioResultCollapsed ? 'Show' : 'Hide'}
                </span>
                {portfolioResultCollapsed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
            {!portfolioResultCollapsed && (
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
                {portfolioResult.error ? (
                  <pre className="text-xs text-red-700 whitespace-pre-wrap">{portfolioResult.error}</pre>
                ) : (
                  <JsonView data={portfolioResult.data} />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customer API - GET */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">GET</span>
              <h3 className="text-lg font-bold text-[#283054]">Customer</h3>
              <a
                href="https://developer.temenos.com/service/customer-management#tag/RETAIL/operation/getCustomer"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 transition-colors"
                title="View API documentation"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-500">
                https://api.temenos.com/api/v5.7.0/party/customers/
              </p>
              <input
                type="text"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#097BED] focus:border-transparent"
                style={{ width: '100px' }}
                placeholder="100291"
              />
            </div>
          </div>
          <button
            onClick={executeCustomerRequest}
            disabled={customerResult.loading}
            className="flex items-center space-x-2 px-4 py-2 bg-[#097BED] text-white rounded-lg hover:bg-[#0868CC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md font-medium"
          >
            {customerResult.loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span style={{ color: '#FFFFFF' }}>Loading...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span style={{ color: '#FFFFFF' }}>Execute</span>
              </>
            )}
          </button>
        </div>

        {/* Customer Response */}
        {(customerResult.data || customerResult.error) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {customerResult.error ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-semibold text-red-700">Error</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-semibold text-green-700">
                      Status: {customerResult.status}
                    </span>
                  </>
                )}
              </div>
              <button
                onClick={() => setCustomerResultCollapsed(!customerResultCollapsed)}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1"
                title={customerResultCollapsed ? "Expand result" : "Collapse result"}
              >
                <span className="font-medium">
                  {customerResultCollapsed ? 'Show' : 'Hide'}
                </span>
                {customerResultCollapsed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
            {!customerResultCollapsed && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-96 overflow-auto">
                {customerResult.error ? (
                  <pre className="text-xs text-red-700 whitespace-pre-wrap">{customerResult.error}</pre>
                ) : (
                  <JsonView data={customerResult.data} />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Accounts API - GET */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">GET</span>
              <h3 className="text-lg font-bold text-[#283054]">Accounts</h3>
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-500">
                https://transactwb.temenos.com/irf-provider-container/api/v4.9.0/holdings/accounts/balances?currencyId=
              </p>
              <input
                type="text"
                value={currencyId}
                onChange={(e) => setCurrencyId(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#097BED] focus:border-transparent"
                style={{ width: '80px' }}
                placeholder="EUR"
              />
            </div>
          </div>
          <button
            onClick={executeAccountsRequest}
            disabled={accountsResult.loading}
            className="flex items-center space-x-2 px-4 py-2 bg-[#097BED] text-white rounded-lg hover:bg-[#0868CC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md font-medium"
          >
            {accountsResult.loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span style={{ color: '#FFFFFF' }}>Loading...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span style={{ color: '#FFFFFF' }}>Execute</span>
              </>
            )}
          </button>
        </div>

        {/* Accounts Response */}
        {(accountsResult.data || accountsResult.error) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {accountsResult.error ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-semibold text-red-700">Error</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-semibold text-green-700">
                      Status: {accountsResult.status}
                    </span>
                  </>
                )}
              </div>
              <button
                onClick={() => setAccountsResultCollapsed(!accountsResultCollapsed)}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1"
                title={accountsResultCollapsed ? "Expand result" : "Collapse result"}
              >
                <span className="font-medium">
                  {accountsResultCollapsed ? 'Show' : 'Hide'}
                </span>
                {accountsResultCollapsed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
            {!accountsResultCollapsed && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-96 overflow-auto">
                {accountsResult.error ? (
                  <pre className="text-xs text-red-700 whitespace-pre-wrap">{accountsResult.error}</pre>
                ) : (
                  <JsonView data={accountsResult.data} />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
