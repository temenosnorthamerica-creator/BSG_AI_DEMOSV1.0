import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CreditCard } from 'lucide-react'

function CardsPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen p-8">
      <button
        onClick={() => navigate('/')}
        className="btn-secondary flex items-center gap-2 mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </button>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-blue-500 w-16 h-16 rounded-lg flex items-center justify-center text-white">
            <CreditCard className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">CARDS</h1>
            <p className="text-[#94a3b8]">Card management and processing solutions</p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">Overview</h2>
          <p className="text-[#94a3b8] leading-relaxed">
            The Cards module provides comprehensive card management capabilities including
            card issuance, lifecycle management, transaction processing, and fraud detection.
            It supports credit, debit, and prepaid card products with flexible configuration options.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CardsPage
