import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Banknote } from 'lucide-react'

function PaymentsPage() {
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
          <div className="bg-red-500 w-16 h-16 rounded-lg flex items-center justify-center text-white">
            <Banknote className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">PAYMENTS</h1>
            <p className="text-[#94a3b8]">Payment processing and transactions</p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-4">Overview</h2>
          <p className="text-[#94a3b8] leading-relaxed">
            The Payments module handles all payment processing needs including domestic
            and international transfers, real-time payments, batch processing, and
            payment orchestration. Support multiple payment rails and schemes with
            comprehensive transaction management.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PaymentsPage
