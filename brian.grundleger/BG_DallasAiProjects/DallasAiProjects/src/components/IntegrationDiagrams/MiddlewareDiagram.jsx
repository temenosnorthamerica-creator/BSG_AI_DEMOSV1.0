import { useState, useEffect } from 'react'

export function MiddlewareDiagram({ color = '#8B5CF6' }) {
  const [activeStep, setActiveStep] = useState(0)
  const [dataPacket, setDataPacket] = useState({ x: 150, y: 50 })

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 6)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <svg viewBox="0 0 300 400" className="w-full h-full max-h-[400px]">
      <defs>
        <filter id="glowMiddleware">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="eventGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Source System */}
      <g transform="translate(20, 20)">
        <rect
          x="0" y="0" width="110" height="45" rx="6"
          fill={activeStep === 0 ? color : '#374151'}
          opacity={activeStep === 0 ? 1 : 0.6}
          className="transition-all duration-300"
        />
        <text x="55" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
          Source System
        </text>
        <text x="55" y="35" textAnchor="middle" fill="white" fontSize="8" opacity="0.8">
          (Customer/Account)
        </text>
      </g>

      {/* Arrow to Frontend */}
      <g>
        <path
          d="M 75 65 Q 75 90 150 90 L 150 110"
          fill="none"
          stroke={activeStep === 0 ? color : '#4B5563'}
          strokeWidth="2"
        />
        <polygon points="145,105 150,115 155,105" fill={activeStep === 0 ? color : '#4B5563'} />
        {activeStep === 0 && (
          <circle r="4" fill={color} filter="url(#glowMiddleware)">
            <animateMotion dur="1s" repeatCount="indefinite" path="M 75 65 Q 75 90 150 90 L 150 110" />
          </circle>
        )}
      </g>

      {/* React Frontend */}
      <g transform="translate(60, 120)">
        <rect
          x="0" y="0" width="180" height="45" rx="6"
          fill={activeStep === 1 ? color : '#374151'}
          opacity={activeStep === 1 ? 1 : 0.6}
          className="transition-all duration-300"
        />
        <text x="90" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
          ESB UI (React)
        </text>
        <text x="90" y="35" textAnchor="middle" fill="white" fontSize="8" opacity="0.8">
          Port 3016
        </text>
      </g>

      {/* Arrow to Backend */}
      <g>
        <line x1="150" y1="165" x2="150" y2="190" stroke={activeStep === 1 ? color : '#4B5563'} strokeWidth="2" />
        <polygon points="145,185 150,195 155,185" fill={activeStep === 1 ? color : '#4B5563'} />
        {activeStep === 1 && (
          <circle cx="150" cy="177" r="4" fill={color} filter="url(#glowMiddleware)">
            <animate attributeName="cy" from="168" to="187" dur="0.8s" repeatCount="indefinite" />
          </circle>
        )}
      </g>

      {/* Express Backend */}
      <g transform="translate(60, 200)">
        <rect
          x="0" y="0" width="180" height="45" rx="6"
          fill={activeStep === 2 ? color : '#374151'}
          opacity={activeStep === 2 ? 1 : 0.6}
          className="transition-all duration-300"
        />
        <text x="90" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
          ESB API Backend
        </text>
        <text x="90" y="35" textAnchor="middle" fill="white" fontSize="8" opacity="0.8">
          Port 8006
        </text>
      </g>

      {/* Arrow to Event Hub */}
      <g>
        <line x1="150" y1="245" x2="150" y2="270" stroke={activeStep === 2 ? color : '#4B5563'} strokeWidth="2" />
        <polygon points="145,265 150,275 155,265" fill={activeStep === 2 ? color : '#4B5563'} />
        {activeStep === 2 && (
          <circle cx="150" cy="257" r="4" fill={color} filter="url(#glowMiddleware)">
            <animate attributeName="cy" from="248" to="267" dur="0.8s" repeatCount="indefinite" />
          </circle>
        )}
      </g>

      {/* Azure Event Hub - Central Component */}
      <g transform="translate(40, 280)">
        <rect
          x="0" y="0" width="220" height="50" rx="8"
          fill="url(#eventGradient)"
          opacity={activeStep === 3 ? 1 : 0.7}
          className="transition-all duration-300"
        />
        <text x="110" y="22" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
          Azure Event Hubs
        </text>
        <text x="110" y="38" textAnchor="middle" fill="white" fontSize="8" opacity="0.9">
          CloudEvents (Pub/Sub)
        </text>
        {/* Animated pulse */}
        {activeStep === 3 && (
          <>
            <rect x="5" y="5" width="210" height="40" rx="6" fill="none" stroke="white" strokeWidth="1" opacity="0.5">
              <animate attributeName="opacity" values="0.5;0.1;0.5" dur="1s" repeatCount="indefinite" />
            </rect>
          </>
        )}
      </g>

      {/* Split arrows to Transact */}
      <g>
        <line x1="100" y1="330" x2="100" y2="360" stroke={activeStep === 4 ? color : '#4B5563'} strokeWidth="2" />
        <polygon points="95,355 100,365 105,355" fill={activeStep === 4 ? color : '#4B5563'} />

        <line x1="200" y1="330" x2="200" y2="360" stroke={activeStep === 4 ? color : '#4B5563'} strokeWidth="2" />
        <polygon points="195,355 200,365 205,355" fill={activeStep === 4 ? color : '#4B5563'} />

        {activeStep === 4 && (
          <>
            <circle cx="100" cy="345" r="3" fill={color} filter="url(#glowMiddleware)">
              <animate attributeName="cy" from="335" to="357" dur="0.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="200" cy="345" r="3" fill={color} filter="url(#glowMiddleware)">
              <animate attributeName="cy" from="335" to="357" dur="0.8s" repeatCount="indefinite" />
            </circle>
          </>
        )}
      </g>

      {/* Temenos Transact */}
      <g transform="translate(25, 370)">
        <rect
          x="0" y="0" width="110" height="25" rx="4"
          fill={activeStep === 5 ? color : '#374151'}
          opacity={activeStep === 5 ? 1 : 0.6}
        />
        <text x="55" y="17" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">
          Transact API
        </text>
      </g>

      {/* Consumer System */}
      <g transform="translate(165, 370)">
        <rect
          x="0" y="0" width="110" height="25" rx="4"
          fill={activeStep === 5 ? color : '#374151'}
          opacity={activeStep === 5 ? 1 : 0.6}
        />
        <text x="55" y="17" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">
          Consumer Apps
        </text>
      </g>

      {/* Flow labels */}
      <g fontSize="7" fill="#6B7280">
        <text x="270" y="50">PULL</text>
        <text x="270" y="150">MAP</text>
        <text x="270" y="230">TRANSFORM</text>
        <text x="270" y="305">PUBLISH</text>
        <text x="270" y="385">CONSUME</text>
      </g>
    </svg>
  )
}

export default MiddlewareDiagram
