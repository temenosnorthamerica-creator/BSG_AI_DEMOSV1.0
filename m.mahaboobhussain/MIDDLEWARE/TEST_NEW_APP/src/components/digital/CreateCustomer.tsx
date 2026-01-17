import { useState } from 'react'
import { User, Phone, Shield, MapPin, Send, Loader2, CheckCircle, XCircle } from 'lucide-react'

interface CustomerFormData {
  customerType: string
  status: string
  firstName: string
  lastName: string
  dateOfBirth: string
  nationality: string
  email: string
  mobile: string
  kycStatus: string
  kycLevel: string
  addressType: string
  country: string
  city: string
  postalCode: string
}

interface SubmitResult {
  success: boolean
  message: string
  eventId?: string
  customerId?: string
}

const initialFormData: CustomerFormData = {
  customerType: 'INDIVIDUAL',
  status: 'ACTIVE',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  nationality: '',
  email: '',
  mobile: '',
  kycStatus: 'PENDING',
  kycLevel: 'BASIC',
  addressType: 'RESIDENTIAL',
  country: '',
  city: '',
  postalCode: ''
}

function CreateCustomer() {
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SubmitResult | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setResult({
          success: true,
          message: 'Customer created successfully! Event sent to Azure Event Hub.',
          eventId: data.eventId,
          customerId: data.customerId
        })

        setTimeout(() => {
          setFormData(initialFormData)
        }, 3000)
      } else {
        setResult({
          success: false,
          message: data.message || 'Failed to create customer'
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
      <h2 className="text-2xl font-bold text-white mb-6">Create Customer</h2>

      {/* Result Message */}
      {result && (
        <div className={`p-4 rounded-lg mb-6 flex items-start gap-3 ${
          result.success
            ? 'bg-green-500/20 border border-green-500'
            : 'bg-red-500/20 border border-red-500'
        }`}>
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
          )}
          <div>
            <p className={result.success ? 'text-green-400' : 'text-red-400'}>
              {result.message}
            </p>
            {result.success && result.eventId && (
              <div className="mt-2 text-sm text-[#94a3b8]">
                <p>Event ID: <span className="text-white font-mono">{result.eventId}</span></p>
                <p>Customer ID: <span className="text-white font-mono">{result.customerId}</span></p>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Info Section */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Customer Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#94a3b8] mb-2">Customer Type</label>
              <select name="customerType" value={formData.customerType} onChange={handleChange} className="input-field" disabled={isLoading}>
                <option value="INDIVIDUAL">Individual</option>
                <option value="CORPORATE">Corporate</option>
              </select>
            </div>
            <div>
              <label className="block text-[#94a3b8] mb-2">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="input-field" disabled={isLoading}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Personal Details Section */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Personal Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#94a3b8] mb-2">First Name *</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required placeholder="Enter first name" className="input-field" disabled={isLoading} />
            </div>
            <div>
              <label className="block text-[#94a3b8] mb-2">Last Name *</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Enter last name" className="input-field" disabled={isLoading} />
            </div>
            <div>
              <label className="block text-[#94a3b8] mb-2">Date of Birth *</label>
              <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required className="input-field" disabled={isLoading} />
            </div>
            <div>
              <label className="block text-[#94a3b8] mb-2">Nationality *</label>
              <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} required placeholder="e.g., IN, US, UK" className="input-field" disabled={isLoading} />
            </div>
          </div>
        </div>

        {/* Contact Details Section */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Contact Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#94a3b8] mb-2">Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="example@email.com" className="input-field" disabled={isLoading} />
            </div>
            <div>
              <label className="block text-[#94a3b8] mb-2">Mobile *</label>
              <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} required placeholder="+91-9876543210" className="input-field" disabled={isLoading} />
            </div>
          </div>
        </div>

        {/* KYC Section */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">KYC Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#94a3b8] mb-2">KYC Status</label>
              <select name="kycStatus" value={formData.kycStatus} onChange={handleChange} className="input-field" disabled={isLoading}>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-[#94a3b8] mb-2">KYC Level</label>
              <select name="kycLevel" value={formData.kycLevel} onChange={handleChange} className="input-field" disabled={isLoading}>
                <option value="BASIC">Basic</option>
                <option value="FULL">Full</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-semibold text-white">Address</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#94a3b8] mb-2">Address Type</label>
              <select name="addressType" value={formData.addressType} onChange={handleChange} className="input-field" disabled={isLoading}>
                <option value="RESIDENTIAL">Residential</option>
                <option value="BUSINESS">Business</option>
                <option value="MAILING">Mailing</option>
              </select>
            </div>
            <div>
              <label className="block text-[#94a3b8] mb-2">Country *</label>
              <input type="text" name="country" value={formData.country} onChange={handleChange} required placeholder="Enter country" className="input-field" disabled={isLoading} />
            </div>
            <div>
              <label className="block text-[#94a3b8] mb-2">City *</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} required placeholder="Enter city" className="input-field" disabled={isLoading} />
            </div>
            <div>
              <label className="block text-[#94a3b8] mb-2">Postal Code *</label>
              <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} required placeholder="Enter postal code" className="input-field" disabled={isLoading} />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2 px-8 disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Create Customer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateCustomer
