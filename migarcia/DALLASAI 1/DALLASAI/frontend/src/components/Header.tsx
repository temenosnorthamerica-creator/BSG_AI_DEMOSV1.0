import { useState, useEffect } from 'react'

export function Header() {
  const [userName, setUserName] = useState<string>('USER')

  useEffect(() => {
    // Try to get user name from localStorage or default
    const storedName = localStorage.getItem('user_name') || 'User'
    setUserName(storedName.toUpperCase())
  }, [])

  const getLastSignOn = () => {
    const now = new Date()
    const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    return `${date} at ${time}`
  }

  return (
    <header className="mb-8">
      <div className="flex flex-col space-y-1">
        <h1 className="text-3xl font-bold" style={{ color: '#FFFFFF' }}>Welcome Back, {userName}</h1>
        <p className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
          Last signed on {getLastSignOn()}
        </p>
      </div>
    </header>
  )
}

