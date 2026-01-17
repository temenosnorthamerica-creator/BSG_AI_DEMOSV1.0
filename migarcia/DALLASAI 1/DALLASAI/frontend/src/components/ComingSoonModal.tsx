import { X, Clock } from 'lucide-react'

interface ComingSoonModalProps {
  isOpen: boolean
  featureName: string
  onClose: () => void
}

export function ComingSoonModal({ isOpen, featureName, onClose }: ComingSoonModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-[#1e293b] rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-[#283054]" />
            <h2 className="text-2xl font-bold text-[#2D3748] dark:text-white">Coming Soon</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-[#4A5568] dark:text-gray-300">
          The <strong>{featureName}</strong> feature is currently under development and will be available soon.
        </p>
      </div>
    </div>
  )
}

