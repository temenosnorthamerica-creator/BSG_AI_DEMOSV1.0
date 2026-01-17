import { useState, useEffect } from 'react'

export function LMSDiagram({ color = '#F59E0B' }) {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <svg viewBox="0 0 300 400" className="w-full h-full max-h-[400px]">
      <defs>
        <filter id="glowLms">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Applicant */}
      <g transform="translate(100, 20)">
        <rect
          x="0" y="0" width="100" height="50" rx="8"
          fill={activeStep === 0 ? color : '#374151'}
          opacity={activeStep === 0 ? 1 : 0.6}
          className="transition-all duration-300"
        />
        <text x="50" y="22" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
          Loan
        </text>
        <text x="50" y="38" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
          Applicant
        </text>
      </g>

      {/* Arrow */}
      <g>
        <line x1="150" y1="70" x2="150" y2="110" stroke={activeStep === 0 ? color : '#4B5563'} strokeWidth="2" />
        <polygon points="145,105 150,115 155,105" fill={activeStep === 0 ? color : '#4B5563'} />
        {activeStep === 0 && (
          <circle cx="150" cy="90" r="4" fill={color} filter="url(#glowLms)">
            <animate attributeName="cy" from="75" to="105" dur="1s" repeatCount="indefinite" />
          </circle>
        )}
        <text x="170" y="95" fill="#9CA3AF" fontSize="8">Submit</text>
      </g>

      {/* LMS Portal */}
      <g transform="translate(50, 120)">
        <rect
          x="0" y="0" width="200" height="60" rx="8"
          fill={activeStep === 1 ? color : '#374151'}
          opacity={activeStep === 1 ? 1 : 0.6}
          className="transition-all duration-300"
        />
        <text x="100" y="25" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
          LMS Applicant Portal
        </text>
        <text x="100" y="45" textAnchor="middle" fill="white" fontSize="9" opacity="0.8">
          React + TanStack Query (Port 3004)
        </text>
      </g>

      {/* Arrow */}
      <g>
        <line x1="150" y1="180" x2="150" y2="220" stroke={activeStep === 1 ? color : '#4B5563'} strokeWidth="2" />
        <polygon points="145,215 150,225 155,215" fill={activeStep === 1 ? color : '#4B5563'} />
        {activeStep === 1 && (
          <circle cx="150" cy="200" r="4" fill={color} filter="url(#glowLms)">
            <animate attributeName="cy" from="185" to="215" dur="1s" repeatCount="indefinite" />
          </circle>
        )}
        <text x="170" y="200" fill="#9CA3AF" fontSize="8">API Call</text>
      </g>

      {/* Temenos LMS API */}
      <g transform="translate(40, 230)">
        <rect
          x="0" y="0" width="220" height="70" rx="8"
          fill={activeStep === 2 ? color : '#374151'}
          opacity={activeStep === 2 ? 1 : 0.6}
          className="transition-all duration-300"
        />
        <text x="110" y="25" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
          Temenos Lending API
        </text>
        <text x="110" y="45" textAnchor="middle" fill="white" fontSize="9" opacity="0.8">
          lmsdemo1.temenos.com/LendingAPI
        </text>
        <text x="110" y="60" textAnchor="middle" fill="white" fontSize="8" opacity="0.6">
          Credit Decision | Loan Origination
        </text>
      </g>

      {/* Arrow */}
      <g>
        <line x1="150" y1="300" x2="150" y2="340" stroke={activeStep === 2 ? color : '#4B5563'} strokeWidth="2" />
        <polygon points="145,335 150,345 155,335" fill={activeStep === 2 ? color : '#4B5563'} />
        {activeStep === 2 && (
          <circle cx="150" cy="320" r="4" fill={color} filter="url(#glowLms)">
            <animate attributeName="cy" from="305" to="335" dur="1s" repeatCount="indefinite" />
          </circle>
        )}
        <text x="170" y="320" fill="#9CA3AF" fontSize="8">Process</text>
      </g>

      {/* Loan Servicing */}
      <g transform="translate(60, 350)">
        <rect
          x="0" y="0" width="180" height="45" rx="8"
          fill={activeStep === 3 ? color : '#374151'}
          opacity={activeStep === 3 ? 1 : 0.6}
          className="transition-all duration-300"
        />
        <text x="90" y="28" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
          Loan Servicing System
        </text>
      </g>

      {/* Process flow icons */}
      <g transform="translate(270, 150)">
        <text fill="#6B7280" fontSize="9" fontWeight="bold">Flow:</text>
        <text y="15" fill="#9CA3AF" fontSize="8">1. Apply</text>
        <text y="30" fill="#9CA3AF" fontSize="8">2. Verify</text>
        <text y="45" fill="#9CA3AF" fontSize="8">3. Decide</text>
        <text y="60" fill="#9CA3AF" fontSize="8">4. Service</text>
      </g>
    </svg>
  )
}

export default LMSDiagram
