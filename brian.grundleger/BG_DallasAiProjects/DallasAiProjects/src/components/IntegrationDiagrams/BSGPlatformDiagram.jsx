import { useState, useEffect } from 'react'

export function BSGPlatformDiagram({ color = '#6366F1' }) {
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
        <filter id="glowBsg">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* User Box */}
      <g transform="translate(100, 10)">
        <rect
          x="0" y="0" width="100" height="40" rx="6"
          fill={activeStep === 0 ? color : '#374151'}
          opacity={activeStep === 0 ? 1 : 0.6}
          className="transition-all duration-300"
        />
        <text x="50" y="25" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
          User
        </text>
      </g>

      {/* Arrow to Frontend */}
      <g>
        <line x1="150" y1="50" x2="150" y2="75" stroke={activeStep === 0 ? color : '#4B5563'} strokeWidth="2" />
        <polygon points="145,70 150,80 155,70" fill={activeStep === 0 ? color : '#4B5563'} />
        {activeStep === 0 && (
          <circle cx="150" cy="62" r="3" fill={color} filter="url(#glowBsg)">
            <animate attributeName="cy" from="55" to="72" dur="0.8s" repeatCount="indefinite" />
          </circle>
        )}
      </g>

      {/* React Frontend Box */}
      <g transform="translate(60, 85)">
        <rect
          x="0" y="0" width="180" height="50" rx="6"
          fill={activeStep === 1 ? color : '#374151'}
          opacity={activeStep === 1 ? 1 : 0.6}
          className="transition-all duration-300"
        />
        <text x="90" y="22" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
          React Frontend
        </text>
        <text x="90" y="38" textAnchor="middle" fill="white" fontSize="9" opacity="0.8">
          Port 3002 (Vite/TypeScript)
        </text>
      </g>

      {/* Arrow to FastAPI */}
      <g>
        <line x1="150" y1="135" x2="150" y2="165" stroke={activeStep === 1 ? color : '#4B5563'} strokeWidth="2" />
        <polygon points="145,160 150,170 155,160" fill={activeStep === 1 ? color : '#4B5563'} />
        {activeStep === 1 && (
          <circle cx="150" cy="150" r="3" fill={color} filter="url(#glowBsg)">
            <animate attributeName="cy" from="140" to="162" dur="0.8s" repeatCount="indefinite" />
          </circle>
        )}
      </g>

      {/* FastAPI Backend Box */}
      <g transform="translate(60, 175)">
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
          Port 8002 (Python)
        </text>
      </g>

      {/* Arrow to MongoDB */}
      <g>
        <line x1="150" y1="225" x2="150" y2="255" stroke={activeStep === 2 ? color : '#4B5563'} strokeWidth="2" />
        <polygon points="145,250 150,260 155,250" fill={activeStep === 2 ? color : '#4B5563'} />
        {activeStep === 2 && (
          <circle cx="150" cy="240" r="3" fill={color} filter="url(#glowBsg)">
            <animate attributeName="cy" from="230" to="252" dur="0.8s" repeatCount="indefinite" />
          </circle>
        )}
      </g>

      {/* Azure Cosmos DB Box */}
      <g transform="translate(50, 265)">
        <rect
          x="0" y="0" width="200" height="50" rx="6"
          fill={activeStep === 3 ? color : '#374151'}
          opacity={activeStep === 3 ? 1 : 0.6}
          className="transition-all duration-300"
        />
        <text x="100" y="22" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
          Azure Cosmos DB
        </text>
        <text x="100" y="38" textAnchor="middle" fill="white" fontSize="9" opacity="0.8">
          MongoDB API (Cloud)
        </text>
      </g>

      {/* Arrow to Temenos */}
      <g>
        <line x1="150" y1="315" x2="150" y2="345" stroke={activeStep === 3 ? color : '#4B5563'} strokeWidth="2" />
        <polygon points="145,340 150,350 155,340" fill={activeStep === 3 ? color : '#4B5563'} />
        {activeStep === 3 && (
          <circle cx="150" cy="330" r="3" fill={color} filter="url(#glowBsg)">
            <animate attributeName="cy" from="320" to="342" dur="0.8s" repeatCount="indefinite" />
          </circle>
        )}
      </g>

      {/* Temenos Box */}
      <g transform="translate(60, 355)">
        <rect
          x="0" y="0" width="180" height="40" rx="6"
          fill={activeStep === 4 ? color : '#374151'}
          opacity={activeStep === 4 ? 1 : 0.6}
          className="transition-all duration-300"
        />
        <text x="90" y="25" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
          Temenos Integration
        </text>
      </g>

      {/* Side Labels */}
      <g fontSize="8" fill="#9CA3AF">
        <text x="5" y="30">Step 1</text>
        <text x="5" y="110">Step 2</text>
        <text x="5" y="200">Step 3</text>
        <text x="5" y="290">Step 4</text>
        <text x="5" y="375">Step 5</text>
      </g>
    </svg>
  )
}

export default BSGPlatformDiagram
