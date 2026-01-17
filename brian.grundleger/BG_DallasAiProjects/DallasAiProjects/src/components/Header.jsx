import { useState, useEffect } from 'react'
import { Clock, User, Cog } from 'lucide-react'
import { clsx } from 'clsx'

export function Header({ onConfigClick, clientConfig }) {
  const [userName, setUserName] = useState('USER')

  useEffect(() => {
    const storedName = localStorage.getItem('user_name') || 'User'
    setUserName(storedName)
  }, [])

  const getLastSignOn = () => {
    const now = new Date()
    const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    return `${date} at ${time}`
  }

  return (
    <header className="mb-10">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: clientConfig?.primaryColor
                  ? `linear-gradient(to bottom right, ${clientConfig.primaryColor}, ${clientConfig.secondaryColor || clientConfig.primaryColor})`
                  : 'linear-gradient(to bottom right, #60a5fa, #3b82f6)',
                boxShadow: clientConfig?.primaryColor
                  ? `0 10px 15px -3px ${clientConfig.primaryColor}33`
                  : '0 10px 15px -3px rgba(59, 130, 246, 0.2)'
              }}
            >
              <User className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-white">
              Welcome back, <span
                className="text-blue-400"
                style={{ color: clientConfig?.primaryColor || '#60a5fa' }}
              >
                {userName}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-slate-400 ml-13 pl-[52px]">
            <Clock className="w-3.5 h-3.5" />
            <p className="text-sm">
              Last signed on {getLastSignOn()}
            </p>
          </div>
        </div>

        {/* Config Button */}
        <button
          onClick={onConfigClick}
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200",
            "bg-slate-800/60 border border-slate-700/50",
            "text-slate-400 hover:text-white hover:bg-slate-700/50 hover:border-slate-600/50",
            "group"
          )}
          title="Client Environment Variables"
        >
          <Cog className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-sm font-medium">Configure</span>
        </button>
      </div>
    </header>
  )
}

export default Header
