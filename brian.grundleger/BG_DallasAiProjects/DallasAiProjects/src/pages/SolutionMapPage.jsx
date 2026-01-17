import { useState, useEffect, useRef, useMemo } from 'react'
import {
  ArrowLeft,
  CreditCard,
  FileCheck,
  Smartphone,
  Landmark,
  Database,
  BarChart3,
  Building,
  Shield,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Link2,
  Zap,
  Clock,
  FileInput,
  MessageSquare,
  Webhook
} from 'lucide-react'
import { clsx } from 'clsx'
import { useClientConfig, integrationOptions } from '../context/ClientConfigContext'

const systemIcons = {
  'card-services': CreditCard,
  'item-processing': FileCheck,
  'digital': Smartphone,
  'lending': Landmark,
  'core': Database,
  'backoffice': BarChart3,
  'branch': Building,
  'compliance': Shield,
}

const categoryGroups = {
  'Customer Facing': ['digital', 'branch-teller'],
  'Core Banking': ['core', 'lending'],
  'Payments & Cards': ['card-services', 'item-processing'],
  'Operations': ['backoffice-reporting', 'compliance'],
}

const integrationColors = {
  'api': '#3B82F6',
  'batch': '#F59E0B',
  'realtime': '#22C55E',
  'webhook': '#8B5CF6',
  'file': '#EC4899',
  'message': '#14B8A6',
}

export function SolutionMapPage({ systems, onBack }) {
  const { config, getEnabledSystems } = useClientConfig()
  const [zoom, setZoom] = useState(1)
  const [selectedSystem, setSelectedSystem] = useState(null)
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const enabledSystems = getEnabledSystems()

  // Calculate positions for systems in a circular layout grouped by category
  const systemPositions = useMemo(() => {
    const positions = {}
    const centerX = 500
    const centerY = 400
    const categoryRadius = 280
    const categories = Object.entries(categoryGroups)
    const categoryAngleStep = (2 * Math.PI) / categories.length

    categories.forEach(([categoryName, systemIds], categoryIndex) => {
      const categoryAngle = categoryIndex * categoryAngleStep - Math.PI / 2
      const categoryCenterX = centerX + Math.cos(categoryAngle) * categoryRadius * 0.6
      const categoryCenterY = centerY + Math.sin(categoryAngle) * categoryRadius * 0.6

      const enabledInCategory = systemIds.filter(id =>
        enabledSystems.some(s => s.id === id)
      )

      enabledInCategory.forEach((systemId, systemIndex) => {
        const systemAngle = categoryAngle + (systemIndex - (enabledInCategory.length - 1) / 2) * 0.5
        const systemRadius = 150
        positions[systemId] = {
          x: categoryCenterX + Math.cos(systemAngle) * systemRadius,
          y: categoryCenterY + Math.sin(systemAngle) * systemRadius,
          category: categoryName
        }
      })
    })

    return positions
  }, [enabledSystems])

  // Generate connections based on integration methods
  const connections = useMemo(() => {
    const conns = []

    enabledSystems.forEach(system => {
      const sourcePos = systemPositions[system.id]
      if (!sourcePos) return

      const systemConfig = config.integrationMethods[system.id]
      if (!systemConfig?.connections) return

      systemConfig.connections.forEach(conn => {
        const targetPos = systemPositions[conn.targetId]
        if (!targetPos) return

        conns.push({
          id: `${system.id}-${conn.targetId}`,
          source: system.id,
          target: conn.targetId,
          method: conn.method,
          sourcePos,
          targetPos,
          color: integrationColors[conn.method] || '#3B82F6'
        })
      })
    })

    // Add some default connections if none exist for demonstration
    if (conns.length === 0 && enabledSystems.length > 1) {
      const coreSystem = enabledSystems.find(s => s.id === 'core')
      if (coreSystem) {
        enabledSystems.forEach(system => {
          if (system.id !== 'core') {
            const sourcePos = systemPositions['core']
            const targetPos = systemPositions[system.id]
            if (sourcePos && targetPos) {
              const method = config.integrationMethods[system.id]?.method || 'api'
              conns.push({
                id: `core-${system.id}`,
                source: 'core',
                target: system.id,
                method,
                sourcePos,
                targetPos,
                color: integrationColors[method] || '#3B82F6'
              })
            }
          }
        })
      }
    }

    return conns
  }, [enabledSystems, config.integrationMethods, systemPositions])

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        })
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5))
  const handleReset = () => setZoom(1)

  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Home</span>
          </button>
          <h1 className="text-3xl font-bold mb-3 text-white tracking-tight">
            Solution Map
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl">
            Visual representation of enabled systems and their integration flows
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/60 rounded-xl p-1.5">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-3 text-sm text-slate-300 font-medium">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
        <span className="text-sm font-medium text-slate-400">Integration Types:</span>
        <div className="flex items-center gap-4 flex-wrap">
          {integrationOptions.map((option) => (
            <div key={option.id} className="flex items-center gap-2">
              <div
                className="w-8 h-1 rounded-full"
                style={{ backgroundColor: option.color }}
              />
              <span className="text-xs text-slate-300">{option.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Solution Map Canvas */}
      <div
        ref={containerRef}
        className="relative rounded-2xl bg-gradient-to-br from-slate-800/40 to-slate-900/60 border border-slate-700/50 overflow-hidden"
        style={{ height: '600px' }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1000 800"
          className="transition-transform duration-300"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          <defs>
            {/* Animated arrow markers for each color */}
            {Object.entries(integrationColors).map(([method, color]) => (
              <marker
                key={method}
                id={`arrowhead-${method}`}
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill={color}
                />
              </marker>
            ))}

            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Category Background Groups */}
          {Object.entries(categoryGroups).map(([categoryName, systemIds], index) => {
            const enabledInCategory = systemIds.filter(id =>
              enabledSystems.some(s => s.id === id)
            )
            if (enabledInCategory.length === 0) return null

            const positions = enabledInCategory
              .map(id => systemPositions[id])
              .filter(Boolean)

            if (positions.length === 0) return null

            const minX = Math.min(...positions.map(p => p.x)) - 80
            const maxX = Math.max(...positions.map(p => p.x)) + 80
            const minY = Math.min(...positions.map(p => p.y)) - 60
            const maxY = Math.max(...positions.map(p => p.y)) + 60

            return (
              <g key={categoryName}>
                <rect
                  x={minX}
                  y={minY}
                  width={maxX - minX}
                  height={maxY - minY}
                  rx="20"
                  fill="rgba(30, 41, 59, 0.3)"
                  stroke="rgba(71, 85, 105, 0.3)"
                  strokeWidth="1"
                />
                <text
                  x={minX + 15}
                  y={minY + 25}
                  fill="rgba(148, 163, 184, 0.6)"
                  fontSize="12"
                  fontWeight="600"
                >
                  {categoryName}
                </text>
              </g>
            )
          })}

          {/* Connection Lines with Animation */}
          {connections.map((conn) => {
            const dx = conn.targetPos.x - conn.sourcePos.x
            const dy = conn.targetPos.y - conn.sourcePos.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            // Calculate control point for curved line
            const midX = (conn.sourcePos.x + conn.targetPos.x) / 2
            const midY = (conn.sourcePos.y + conn.targetPos.y) / 2
            const perpX = -dy / distance * 30
            const perpY = dx / distance * 30

            const path = `M ${conn.sourcePos.x} ${conn.sourcePos.y} Q ${midX + perpX} ${midY + perpY} ${conn.targetPos.x} ${conn.targetPos.y}`

            return (
              <g key={conn.id}>
                {/* Background line */}
                <path
                  d={path}
                  fill="none"
                  stroke={conn.color}
                  strokeWidth="2"
                  strokeOpacity="0.3"
                  markerEnd={`url(#arrowhead-${conn.method})`}
                />
                {/* Animated flowing line */}
                <path
                  d={path}
                  fill="none"
                  stroke={conn.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="8 12"
                  markerEnd={`url(#arrowhead-${conn.method})`}
                  filter="url(#glow)"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="20"
                    to="0"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </path>
              </g>
            )
          })}

          {/* System Nodes */}
          {enabledSystems.map((system) => {
            const pos = systemPositions[system.id]
            if (!pos) return null

            const Icon = systemIcons[system.icon] || Database
            const isSelected = selectedSystem === system.id
            const method = config.integrationMethods[system.id]?.method || 'api'
            const nodeColor = integrationColors[method]

            return (
              <g
                key={system.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => setSelectedSystem(isSelected ? null : system.id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Node background with glow */}
                <circle
                  r={isSelected ? "55" : "50"}
                  fill="url(#nodeGradient)"
                  stroke={nodeColor}
                  strokeWidth={isSelected ? "3" : "2"}
                  filter={isSelected ? "url(#glow)" : ""}
                  className="transition-all duration-300"
                />
                <defs>
                  <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(30, 41, 59, 0.95)" />
                    <stop offset="100%" stopColor="rgba(15, 23, 42, 0.95)" />
                  </radialGradient>
                </defs>

                {/* Inner colored circle */}
                <circle
                  r="25"
                  fill={nodeColor}
                  fillOpacity="0.2"
                />

                {/* Icon placeholder - using text for simplicity */}
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="600"
                  dy="-5"
                >
                  {system.name.split(' ').map(w => w[0]).join('').slice(0, 3)}
                </text>

                {/* System name */}
                <text
                  y="65"
                  textAnchor="middle"
                  fill="white"
                  fontSize="11"
                  fontWeight="500"
                >
                  {system.name}
                </text>

                {/* Integration method badge */}
                <g transform="translate(30, -35)">
                  <rect
                    x="-20"
                    y="-8"
                    width="40"
                    height="16"
                    rx="8"
                    fill={nodeColor}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="8"
                    fontWeight="600"
                  >
                    {method.toUpperCase()}
                  </text>
                </g>
              </g>
            )
          })}
        </svg>

        {/* Empty State */}
        {enabledSystems.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Database className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No systems enabled</p>
              <p className="text-slate-500 text-sm mt-1">
                Enable systems in Client Configuration to see the solution map
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Selected System Details */}
      {selectedSystem && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {enabledSystems.find(s => s.id === selectedSystem)?.name}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Integration: {config.integrationMethods[selectedSystem]?.method || 'api'}
              </p>
            </div>
            <button
              onClick={() => setSelectedSystem(null)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50"
            >
              <span className="text-sm">Close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SolutionMapPage
