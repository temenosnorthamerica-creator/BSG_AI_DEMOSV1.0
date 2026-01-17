import { useState, useEffect } from 'react'

export function DebitCardsDiagram({ color = '#3B82F6' }) {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 5)
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  return (
    <svg viewBox="0 0 300 400" className="w-full h-full max-h-[400px]">
      <defs>
        <filter id="glowDebit">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Card Icon at top */}
      <g transform="translate(110, 10)">
        <rect
          x="0" y="0" width="80" height="50" rx="6"
          fill={activeStep === 0 ? color : '#374151'}
          opacity={activeStep === 0 ? 1 : 0.6}
          className="transition-all duration-300"
        />
        <rect x="10" y="15" width="30" height="20" rx="2" fill="#FFD700" opacity="0.8" />
        <line x1="10" y1="40" x2="70" y2="40" stroke="white" strokeWidth="1" opacity="0.5" />
        <text x="40" y="35" textAnchor="middle" fill="white" fontSize="8">CARD</text>
      </g>

      {/* Arrow */}
      <g>
        <line x1="150" y1="60" x2="150" y2="85" stroke={activeStep === 0 ? color : '#4B5563'} strokeWidth="2" />
        <polygon points="145,80 150,90 155,80" fill={activeStep === 0 ? color : '#4B5563'} />
        {activeStep === 0 && (
          <circle cx="150" cy="72" r="3" fill={color} filter="url(#glowDebit)">
            <animate attributeName="cy" from="65" to="82" dur="0.8s" repeatCount="indefinite" />
          </circle>
        )}
      </g>

      {/* React Frontend */}
      <g transform="translate(60, 95)">
        <rect
          x="0" y="0" width="180" height="50" rx="6"
          fill={activeStep === 1 ? color : '#374151'}
          opacity={activeStep === 1 ? 1 : 0.6}
          className="transition-all duration-300"
        />
        <text x="90" y="22" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
          Debit Cards UI
        </text>
        <text x="90" y="38" textAnchor="middle" fill="white" fontSize="9" opacity="0.8">
          React + Vite (Port 3003)
        </text>
      </g>

      {/* Arrow */}
      <g>
        <line x1="150" y1="145" x2="150" y2="170" stroke={activeStep === 1 ? color : '#4B5563'} strokeWidth="2" />
        <polygon points="145,165 150,175 155,165" fill={activeStep === 1 ? color : '#4B5563'} />
        {activeStep === 1 && (
          <circle cx="150" cy="157" r="3" fill={color} filter="url(#glowDebit)">
            <animate attributeName="cy" from="150" to="167" dur="0.8s" repeatCount="indefinite" />
          </circle>
        )}
      </g>

      {/* FastAPI Backend */}
      <g transform="translate(60, 180)">
        <rect
          x="0" y="0" width="180" height="50" rx="6"
          fill={activeStep === 2 ? color : '#374151'}
          opacity={activeStep === 2 ? 1 : 0.6}
          className="transition-all duration-300"
        />
        <text x="90" y="22" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
          FastAPI Backend
        </text>
        <text x="90" y="38" textAnchor="middle" fill="white" fontSize="9" opacity="0.8">
          Python (Port 8003)
        </text>
      </g>

      {/* Split into two arrows */}
      <g>
        {/* Left arrow to Event Hub */}
        <line x1="120" y1="230" x2="80" y2="265" stroke={activeStep === 2 ? color : '#4B5563'} strokeWidth="2" />
        <polygon points="75,260 80,272 88,262" fill={activeStep === 2 ? color : '#4B5563'} />

        {/* Right arrow to Temenos */}
        <line x1="180" y1="230" x2="220" y2="265" stroke={activeStep === 2 ? color : '#4B5563'} strokeWidth="2" />
        <polygon points="212,262 220,272 225,260" fill={activeStep === 2 ? color : '#4B5563'} />

        {activeStep === 2 && (
          <>
            <circle cx="100" cy="247" r="3" fill={color} filter="url(#glowDebit)">
              <animate attributeName="cx" from="115" to="85" dur="0.8s" repeatCount="indefinite" />
              <animate attributeName="cy" from="235" to="260" dur="0.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="200" cy="247" r="3" fill={color} filter="url(#glowDebit)">
              <animate attributeName="cx" from="185" to="215" dur="0.8s" repeatCount="indefinite" />
              <animate attributeName="cy" from="235" to="260" dur="0.8s" repeatCount="indefinite" />
            </circle>
          </>
        )}
      </g>

      {/* Azure Event Hub */}
      <g transform="translate(10, 275)">
        <rect
          x="0" y="0" width="120" height="50" rx="6"
          fill={activeStep === 3 ? color : '#374151'}
          opacity={activeStep === 3 ? 1 : 0.6}
          className="transition-all duration-300"
        />
        <text x="60" y="22" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
          Azure Event Hub
        </text>
        <text x="60" y="38" textAnchor="middle" fill="white" fontSize="8" opacity="0.8">
          Event Streaming
        </text>
      </g>

      {/* Temenos API */}
      <g transform="translate(170, 275)">
        <rect
          x="0" y="0" width="120" height="50" rx="6"
          fill={activeStep === 3 ? color : '#374151'}
          opacity={activeStep === 3 ? 1 : 0.6}
          className="transition-all duration-300"
        />
        <text x="60" y="22" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
          Temenos API
        </text>
        <text x="60" y="38" textAnchor="middle" fill="white" fontSize="8" opacity="0.8">
          Card Services
        </text>
      </g>

      {/* Bottom arrows converging */}
      <g>
        <line x1="70" y1="325" x2="120" y2="355" stroke={activeStep === 3 ? color : '#4B5563'} strokeWidth="2" />
        <line x1="230" y1="325" x2="180" y2="355" stroke={activeStep === 3 ? color : '#4B5563'} strokeWidth="2" />
      </g>

      {/* Core Banking */}
      <g transform="translate(75, 360)">
        <rect
          x="0" y="0" width="150" height="35" rx="6"
          fill={activeStep === 4 ? color : '#374151'}
          opacity={activeStep === 4 ? 1 : 0.6}
          className="transition-all duration-300"
        />
        <text x="75" y="22" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
          Core Banking System
        </text>
      </g>
    </svg>
  )
}

export default DebitCardsDiagram
