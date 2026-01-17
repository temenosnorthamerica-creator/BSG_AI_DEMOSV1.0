import { X, Sun, Moon } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentTheme: 'light' | 'dark'
  onThemeChange: (theme: 'light' | 'dark') => void
}

export function SettingsModal({ isOpen, onClose, currentTheme, onThemeChange }: SettingsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-[#1e293b] rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#2D3748] dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2D3748] dark:text-gray-300 mb-2">
              Theme
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => onThemeChange('light')}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors flex items-center justify-center space-x-2 ${
                  currentTheme === 'light'
                    ? 'border-[#283054] bg-[#283054]/10'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <Sun className="w-5 h-5" />
                <span className="text-sm font-medium text-[#2D3748] dark:text-gray-300">Light</span>
              </button>
              <button
                onClick={() => onThemeChange('dark')}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors flex items-center justify-center space-x-2 ${
                  currentTheme === 'dark'
                    ? 'border-[#283054] bg-[#283054]/10'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <Moon className="w-5 h-5" />
                <span className="text-sm font-medium text-[#2D3748] dark:text-gray-300">Dark</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

