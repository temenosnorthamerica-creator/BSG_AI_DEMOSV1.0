import { useState } from 'react'
import { Search, Loader2, User, Phone, Shield, MapPin, AlertCircle } from 'lucide-react'

interface CustomerData {
  customerId: string
  customerType: string
  status: string
  createdAt: string
  personalDetails: {
    firstName: string
    lastName: string
    dateOfBirth: string
    nationality: string
  }
  contactDetails: {
    email: string
    mobile: string
  }
  kyc: {
    kycStatus: string
    kycLevel: string
  }
  addresses: Array<{
    type: string
    country: string
    city: string
    postalCode: string
  }>
}

interface SearchResult {
  success: boolean
  message?: string
  customer?: CustomerData
}

function SearchCustomer() {
  const [customerId, setCustomerId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId.trim()) return

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch(`/api/customer/${customerId}`)
      const data = await response.json()

      if (data.success) {
        setResult({
          success: true,
          customer: data.customer
        })
      } else {
        setResult({
          success: false,
          message: data.message || 'Customer not found'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to connect to server. Make sure the backend is running.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Search Customer</h2>

      {/* Search Form */}
      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <label className="block text-[#94a3b8] mb-2">Customer ID</label>
            <input
              type="text"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="Enter Customer ID (e.g., 1768522528051)"
              className="input-field"
              disabled={isLoading}
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoading || !customerId.trim()}
              className="btn-primary flex items-center gap-2 px-6 h-[42px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {result && !result.success && (
        <div className="bg-red-500/20 border border-red-500 p-4 rounded-lg mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{result.message}</p>
        </div>
      )}

      {/* Customer Details */}
      {result?.success && result.customer && (
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Customer Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-[#94a3b8] text-sm">Customer ID</p>
                <p className="text-white font-mono">{result.customer.customerId}</p>
              </div>
              <div>
                <p className="text-[#94a3b8] text-sm">Customer Type</p>
                <p className="text-white">{result.customer.customerType}</p>
              </div>
              <div>
                <p className="text-[#94a3b8] text-sm">Status</p>
                <span className={`inline-block px-2 py-1 rounded text-sm ${
                  result.customer.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                  result.customer.status === 'INACTIVE' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {result.customer.status}
                </span>
              </div>
              <div>
                <p className="text-[#94a3b8] text-sm">Created At</p>
                <p className="text-white">{new Date(result.customer.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Personal Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[#94a3b8] text-sm">First Name</p>
                <p className="text-white">{result.customer.personalDetails.firstName}</p>
              </div>
              <div>
                <p className="text-[#94a3b8] text-sm">Last Name</p>
                <p className="text-white">{result.customer.personalDetails.lastName}</p>
              </div>
              <div>
                <p className="text-[#94a3b8] text-sm">Date of Birth</p>
                <p className="text-white">{result.customer.personalDetails.dateOfBirth}</p>
              </div>
              <div>
                <p className="text-[#94a3b8] text-sm">Nationality</p>
                <p className="text-white">{result.customer.personalDetails.nationality}</p>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Contact Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[#94a3b8] text-sm">Email</p>
                <p className="text-white">{result.customer.contactDetails.email}</p>
              </div>
              <div>
                <p className="text-[#94a3b8] text-sm">Mobile</p>
                <p className="text-white">{result.customer.contactDetails.mobile}</p>
              </div>
            </div>
          </div>

          {/* KYC */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">KYC Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[#94a3b8] text-sm">KYC Status</p>
                <span className={`inline-block px-2 py-1 rounded text-sm ${
                  result.customer.kyc.kycStatus === 'VERIFIED' ? 'bg-green-500/20 text-green-400' :
                  result.customer.kyc.kycStatus === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {result.customer.kyc.kycStatus}
                </span>
              </div>
              <div>
                <p className="text-[#94a3b8] text-sm">KYC Level</p>
                <p className="text-white">{result.customer.kyc.kycLevel}</p>
              </div>
            </div>
          </div>

          {/* Address */}
          {result.customer.addresses.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold text-white">Address</h3>
              </div>
              {result.customer.addresses.map((address, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[#94a3b8] text-sm">Type</p>
                    <p className="text-white">{address.type}</p>
                  </div>
                  <div>
                    <p className="text-[#94a3b8] text-sm">Country</p>
                    <p className="text-white">{address.country}</p>
                  </div>
                  <div>
                    <p className="text-[#94a3b8] text-sm">City</p>
                    <p className="text-white">{address.city}</p>
                  </div>
                  <div>
                    <p className="text-[#94a3b8] text-sm">Postal Code</p>
                    <p className="text-white">{address.postalCode}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchCustomer
