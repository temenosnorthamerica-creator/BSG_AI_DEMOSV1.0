import { useState, useEffect } from 'react'

export function CRMIntegrationDiagram({ color = '#10B981' }) {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4)
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <svg viewBox="0 0 300 400" className="w-full h-full max-h-[400px]">
      {/* Background */}
      <defs>
        <linearGradient id="crmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* User/Customer Box */}
      <g transform="translate(100, 20)">
        <rect
          x="0" y="0" width="100" height="50" rx="8"
          fill={activeStep === 0 ? color : '#374151'}
          opacity={activeStep === 0 ? 1 : 0.6}
          className="transition-all duration-500"
        />
        <text x="50" y="30" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
          Customer
        </text>
      </g>

      {/* Arrow 1 */}
      <g>
        <line
          x1="150" y1="70" x2="150" y2="110"
          stroke={activeStep === 0 ? color : '#4B5563'}
          strokeWidth="2"
          className="transition-all duration-500"
        />
        <polygon
          points="145,105 150,115 155,105"
          fill={activeStep === 0 ? color : '#4B5563'}
        />
        {activeStep === 0 && (
          <circle cx="150" cy="90" r="4" fill={color} filter="url(#glow)">
            <animate attributeName="cy" from="75" to="105" dur="1s" repeatCount="indefinite" />
          </circle>
        )}
      </g>

      {/* CRM Frontend Box */}
      <g transform="translate(75, 120)">
        <rect
          x="0" y="0" width="150" height="60" rx="8"
          fill={activeStep === 1 ? color : '#374151'}
          opacity={activeStep === 1 ? 1 : 0.6}
          className="transition-all duration-500"
        />
        <text x="75" y="25" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
          CRM Banking
        </text>
        <text x="75" y="42" textAnchor="middle" fill="white" fontSize="10" opacity="0.8">
          Simulator (React)
        </text>
      </g>

      {/* Arrow 2 */}
      <g>
        <line
          x1="150" y1="180" x2="150" y2="220"
          stroke={activeStep === 1 ? color : '#4B5563'}
          strokeWidth="2"
          className="transition-all duration-500"
        />
        <polygon
          points="145,215 150,225 155,215"
          fill={activeStep === 1 ? color : '#4B5563'}
        />
        {activeStep === 1 && (
          <circle cx="150" cy="200" r="4" fill={color} filter="url(#glow)">
            <animate attributeName="cy" from="185" to="215" dur="1s" repeatCount="indefinite" />
          </circle>
        )}
      </g>

      {/* Temenos API Box */}
      <g transform="translate(50, 230)">
        <rect
          x="0" y="0" width="200" height="60" rx="8"
          fill={activeStep === 2 ? color : '#374151'}
          opacity={activeStep === 2 ? 1 : 0.6}
          className="transition-all duration-500"
        />
        <text x="100" y="25" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
          Temenos Transact API
        </text>
        <text x="100" y="42" textAnchor="middle" fill="white" fontSize="10" opacity="0.8">
          REST/GraphQL Endpoints
        </text>
      </g>

      {/* Arrow 3 */}
      <g>
        <line
          x1="150" y1="290" x2="150" y2="330"
          stroke={activeStep === 2 ? color : '#4B5563'}
          strokeWidth="2"
          className="transition-all duration-500"
        />
        <polygon
          points="145,325 150,335 155,325"
          fill={activeStep === 2 ? color : '#4B5563'}
        />
        {activeStep === 2 && (
          <circle cx="150" cy="310" r="4" fill={color} filter="url(#glow)">
            <animate attributeName="cy" from="295" to="325" dur="1s" repeatCount="indefinite" />
          </circle>
        )}
      </g>

      {/* Core Banking Box */}
      <g transform="translate(75, 340)">
        <rect
          x="0" y="0" width="150" height="50" rx="8"
          fill={activeStep === 3 ? color : '#374151'}
          opacity={activeStep === 3 ? 1 : 0.6}
          className="transition-all duration-500"
        />
        <text x="75" y="30" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
          Core Banking
        </text>
      </g>

      {/* Step Labels */}
      <g fontSize="9" fill="#9CA3AF">
        <text x="260" y="45">1. Request</text>
        <text x="260" y="150">2. Process</text>
        <text x="260" y="260">3. API Call</text>
        <text x="260" y="365">4. Response</text>
      </g>
    </svg>
  )
}

export default CRMIntegrationDiagram
