import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  Move,
  Save,
  RotateCcw,
  ExternalLink,
  MousePointer,
  FileEdit
} from 'lucide-react'
import { clsx } from 'clsx'
import { integrationConnections, getUniqueSystems, systemColors, patternColors } from '../data/integrationData'
import ConfigEditorModal from '../components/ConfigEditorModal'

const STORAGE_KEY = 'solutionDiagram_layout'

// Edge types for anchor points
const EDGES = ['top', 'right', 'bottom', 'left']

// Generate unique anchor ID
const generateAnchorId = () => `anchor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Get anchor position relative to node center based on edge and position (0-1)
const getAnchorPositionFromEdge = (edge, position, nodeWidth, nodeHeight) => {
  const hw = nodeWidth / 2
  const hh = nodeHeight / 2
  // Position is 0-1, where 0.5 is center of edge
  const offset = (position - 0.5) // -0.5 to 0.5

  switch (edge) {
    case 'top': return { x: offset * nodeWidth, y: -hh }
    case 'bottom': return { x: offset * nodeWidth, y: hh }
    case 'left': return { x: -hw, y: offset * nodeHeight }
    case 'right': return { x: hw, y: offset * nodeHeight }
    default: return { x: 0, y: 0 }
  }
}

// Get absolute anchor position for a node
const getAbsoluteAnchorPositionDynamic = (nodePos, edge, position, nodeWidth, nodeHeight) => {
  const rel = getAnchorPositionFromEdge(edge, position, nodeWidth, nodeHeight)
  return { x: nodePos.x + rel.x, y: nodePos.y + rel.y }
}

// Find nearest custom anchor or edge position
const findNearestAnchorOrEdge = (pos, nodePos, nodeWidth, nodeHeight, nodeAnchors = []) => {
  const hw = nodeWidth / 2
  const hh = nodeHeight / 2

  // First check custom anchors
  if (nodeAnchors.length > 0) {
    let nearestAnchor = null
    let nearestDist = Infinity

    nodeAnchors.forEach(anchor => {
      const anchorPos = getAbsoluteAnchorPositionDynamic(nodePos, anchor.edge, anchor.position, nodeWidth, nodeHeight)
      const dist = Math.sqrt(Math.pow(pos.x - anchorPos.x, 2) + Math.pow(pos.y - anchorPos.y, 2))
      if (dist < nearestDist) {
        nearestDist = dist
        nearestAnchor = anchor
      }
    })

    if (nearestAnchor && nearestDist < 30) {
      return { type: 'custom', anchorId: nearestAnchor.id, edge: nearestAnchor.edge, position: nearestAnchor.position }
    }
  }

  // Fall back to default edge center positions
  const defaultAnchors = [
    { edge: 'top', position: 0.5 },
    { edge: 'right', position: 0.5 },
    { edge: 'bottom', position: 0.5 },
    { edge: 'left', position: 0.5 }
  ]

  let nearestDefault = defaultAnchors[0]
  let nearestDist = Infinity

  defaultAnchors.forEach(anchor => {
    const anchorPos = getAbsoluteAnchorPositionDynamic(nodePos, anchor.edge, anchor.position, nodeWidth, nodeHeight)
    const dist = Math.sqrt(Math.pow(pos.x - anchorPos.x, 2) + Math.pow(pos.y - anchorPos.y, 2))
    if (dist < nearestDist) {
      nearestDist = dist
      nearestDefault = anchor
    }
  })

  return { type: 'default', edge: nearestDefault.edge, position: nearestDefault.position }
}

// Mapping from system names in diagram to demo app IDs
const SYSTEM_TO_APP_MAPPING = {
  'CRM Banking Simulator': 'crm-banking-simulator',
  'Debit Cards Demo': 'debitcards-demo',
  'LMS Applicant Portal': 'lms-applicant-portal',
  'Creditos - Sistema de Solicitudes': 'creditos',
  'ESB - Enterprise Service Bus': 'esb-demo',
}

export function SolutionDiagramPage({ onBack, teamDemos = [], onDemoAppClick }) {
  const [selectedSystem, setSelectedSystem] = useState(null)
  const [isManualMode, setIsManualMode] = useState(false)
  const [isConfigEditorOpen, setIsConfigEditorOpen] = useState(false)
  const [customPositions, setCustomPositions] = useState({})
  const [customWaypoints, setCustomWaypoints] = useState({})
  const [customAnchors, setCustomAnchors] = useState({}) // { connectionId: { source: { edge, position }, target: { edge, position } } }
  const [customNodeAnchors, setCustomNodeAnchors] = useState({}) // { systemName: [{ id, edge, position }] }
  const [customDimensions, setCustomDimensions] = useState({}) // { systemName: { width, height } }
  const [draggedNode, setDraggedNode] = useState(null)
  const [draggedWaypoint, setDraggedWaypoint] = useState(null)
  const [draggedEndpoint, setDraggedEndpoint] = useState(null) // { connectionId, type: 'source' | 'target' }
  const [draggedResize, setDraggedResize] = useState(null) // { system, corner: 'nw' | 'ne' | 'sw' | 'se' }
  const [draggedAnchor, setDraggedAnchor] = useState(null) // { system, anchorId, edge }
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [saveMessage, setSaveMessage] = useState('')
  const [hoveredAnchor, setHoveredAnchor] = useState(null) // { system, anchorId }
  const [hoveredEdge, setHoveredEdge] = useState(null) // { system, edge }
  const svgRef = useRef(null)

  // Check if a system is a clickable demo app
  const getSystemDemoApp = useCallback((systemName) => {
    const appId = SYSTEM_TO_APP_MAPPING[systemName]
    if (!appId) return null
    return teamDemos.find(demo => demo.id === appId) || null
  }, [teamDemos])

  // Handle click on a system node to open its app landing page
  const handleSystemClick = useCallback((system) => {
    if (isManualMode) return // Don't navigate in manual mode

    const demoApp = getSystemDemoApp(system)
    if (demoApp && onDemoAppClick) {
      onDemoAppClick(demoApp)
    } else {
      // For non-app systems, show the info panel
      setSelectedSystem(selectedSystem === system ? null : system)
    }
  }, [isManualMode, getSystemDemoApp, onDemoAppClick, selectedSystem])

  // Load saved layout from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.nodePositions) {
          setCustomPositions(parsed.nodePositions)
        }
        if (parsed.waypoints) {
          setCustomWaypoints(parsed.waypoints)
        }
        if (parsed.anchors) {
          setCustomAnchors(parsed.anchors)
        }
        if (parsed.dimensions) {
          setCustomDimensions(parsed.dimensions)
        }
        if (parsed.nodeAnchors) {
          setCustomNodeAnchors(parsed.nodeAnchors)
        }
      } catch (e) {
        console.error('Failed to load saved layout:', e)
      }
    }
  }, [])

  // Get unique systems
  const systems = useMemo(() => getUniqueSystems(), [])

  // Calculate rectangle dimensions for each system based on text length or custom dimensions
  const getNodeDimensions = useCallback((system) => {
    // Check for custom dimensions first
    if (customDimensions[system]) {
      return customDimensions[system]
    }
    // Default calculation based on text length
    const charWidth = 7 // approximate pixels per character
    const padding = 30
    const minWidth = 100
    const height = 40
    const width = Math.max(minWidth, system.length * charWidth + padding)
    return { width, height }
  }, [customDimensions])

  // Calculate default positions for systems
  const defaultPositions = useMemo(() => {
    const positions = {}
    const centerX = 500
    const centerY = 350

    // Default layout - radial arrangement
    positions['ESB - Enterprise Service Bus'] = { x: centerX, y: centerY }
    positions['Core'] = { x: centerX + 280, y: centerY }

    const leftSystems = systems.filter(s =>
      s !== 'ESB - Enterprise Service Bus' && s !== 'Core'
    )

    const startAngle = -Math.PI / 2 - Math.PI / 6
    const angleStep = Math.PI / (leftSystems.length + 1)
    const radius = 250

    leftSystems.forEach((system, index) => {
      const angle = startAngle + (index + 1) * angleStep
      positions[system] = {
        x: centerX + Math.cos(angle) * radius - 100,
        y: centerY + Math.sin(angle) * radius
      }
    })

    return positions
  }, [systems])

  // Merge custom positions with default positions
  const systemPositions = useMemo(() => {
    const positions = { ...defaultPositions }

    // Apply custom positions if in manual mode or if we have saved positions
    if (Object.keys(customPositions).length > 0) {
      Object.keys(customPositions).forEach(system => {
        if (positions[system]) {
          positions[system] = customPositions[system]
        }
      })
    }

    return positions
  }, [defaultPositions, customPositions])

  // Toggle manual mode
  const handleManualModeToggle = useCallback(() => {
    setIsManualMode(prev => !prev)
    setSaveMessage('')
  }, [])

  // Save layout to localStorage (nodes, waypoints, anchors, dimensions, and node anchors)
  const handleSaveLayout = useCallback(() => {
    const layoutData = {
      nodePositions: customPositions,
      waypoints: customWaypoints,
      anchors: customAnchors,
      dimensions: customDimensions,
      nodeAnchors: customNodeAnchors
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layoutData))
    setSaveMessage('Layout saved!')
    setTimeout(() => setSaveMessage(''), 2000)
  }, [customPositions, customWaypoints, customAnchors, customDimensions, customNodeAnchors])

  // Reset layout (nodes, waypoints, anchors, dimensions, and node anchors)
  const handleResetLayout = useCallback(() => {
    setCustomPositions({})
    setCustomWaypoints({})
    setCustomAnchors({})
    setCustomDimensions({})
    setCustomNodeAnchors({})
    localStorage.removeItem(STORAGE_KEY)
    setSaveMessage('Layout reset!')
    setTimeout(() => setSaveMessage(''), 2000)
  }, [])

  // Check if there are any customizations
  const hasCustomizations = Object.keys(customPositions).length > 0 ||
                           Object.keys(customWaypoints).length > 0 ||
                           Object.keys(customAnchors).length > 0 ||
                           Object.keys(customDimensions).length > 0 ||
                           Object.keys(customNodeAnchors).length > 0

  // Get SVG coordinates from mouse event
  const getSVGCoordinates = useCallback((e) => {
    if (!svgRef.current) return { x: 0, y: 0 }

    const svg = svgRef.current
    const rect = svg.getBoundingClientRect()
    const viewBox = svg.viewBox.baseVal

    // Convert screen coordinates to SVG coordinates
    const x = ((e.clientX - rect.left) / rect.width) * viewBox.width
    const y = ((e.clientY - rect.top) / rect.height) * viewBox.height

    return { x, y }
  }, [])

  // Handle mouse down on node
  const handleNodeMouseDown = useCallback((e, system) => {
    if (!isManualMode) return

    e.preventDefault()
    e.stopPropagation()

    const svgCoords = getSVGCoordinates(e)
    const nodePos = systemPositions[system]

    setDraggedNode(system)
    setDragOffset({
      x: svgCoords.x - nodePos.x,
      y: svgCoords.y - nodePos.y
    })
  }, [isManualMode, getSVGCoordinates, systemPositions])

  // Handle mouse down on waypoint
  const handleWaypointMouseDown = useCallback((e, connectionId, waypointIndex, currentPos) => {
    if (!isManualMode) return

    e.preventDefault()
    e.stopPropagation()

    const svgCoords = getSVGCoordinates(e)

    setDraggedWaypoint({ connectionId, waypointIndex })
    setDragOffset({
      x: svgCoords.x - currentPos.x,
      y: svgCoords.y - currentPos.y
    })
  }, [isManualMode, getSVGCoordinates])

  // Handle mouse down on connection endpoint
  const handleEndpointMouseDown = useCallback((e, connectionId, endpointType, currentPos) => {
    if (!isManualMode) return

    e.preventDefault()
    e.stopPropagation()

    const svgCoords = getSVGCoordinates(e)

    setDraggedEndpoint({ connectionId, type: endpointType })
    setDragOffset({
      x: svgCoords.x - currentPos.x,
      y: svgCoords.y - currentPos.y
    })
  }, [isManualMode, getSVGCoordinates])

  // Handle mouse down on resize handle
  const handleResizeMouseDown = useCallback((e, system, corner, currentDim) => {
    if (!isManualMode) return

    e.preventDefault()
    e.stopPropagation()

    const svgCoords = getSVGCoordinates(e)

    setDraggedResize({ system, corner, initialDim: currentDim })
    setDragOffset({
      x: svgCoords.x,
      y: svgCoords.y
    })
  }, [isManualMode, getSVGCoordinates])

  // Handle click on edge to create new anchor
  const handleEdgeClick = useCallback((e, system, edge, nodePos, nodeDim) => {
    if (!isManualMode) return

    e.preventDefault()
    e.stopPropagation()

    const svgCoords = getSVGCoordinates(e)
    const hw = nodeDim.width / 2
    const hh = nodeDim.height / 2

    // Calculate position (0-1) based on click position on the edge
    let position = 0.5
    if (edge === 'top' || edge === 'bottom') {
      // Horizontal edge - position based on X
      const relX = svgCoords.x - nodePos.x
      position = (relX / nodeDim.width) + 0.5
    } else {
      // Vertical edge - position based on Y
      const relY = svgCoords.y - nodePos.y
      position = (relY / nodeDim.height) + 0.5
    }
    // Clamp to valid range
    position = Math.max(0.1, Math.min(0.9, position))

    const newAnchor = {
      id: generateAnchorId(),
      edge,
      position
    }

    setCustomNodeAnchors(prev => ({
      ...prev,
      [system]: [...(prev[system] || []), newAnchor]
    }))
  }, [isManualMode, getSVGCoordinates])

  // Handle mouse down on custom anchor (to drag it)
  const handleAnchorMouseDown = useCallback((e, system, anchorId, edge, position) => {
    if (!isManualMode) return

    e.preventDefault()
    e.stopPropagation()

    setDraggedAnchor({ system, anchorId, edge, initialPosition: position })
  }, [isManualMode])

  // Handle double click on anchor to delete it
  const handleAnchorDoubleClick = useCallback((e, system, anchorId) => {
    if (!isManualMode) return

    e.preventDefault()
    e.stopPropagation()

    setCustomNodeAnchors(prev => ({
      ...prev,
      [system]: (prev[system] || []).filter(a => a.id !== anchorId)
    }))

    // Also clear any connection anchors that reference this anchor
    setCustomAnchors(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(connId => {
        if (updated[connId]?.source?.anchorId === anchorId) {
          delete updated[connId].source
        }
        if (updated[connId]?.target?.anchorId === anchorId) {
          delete updated[connId].target
        }
      })
      return updated
    })

    setSaveMessage('Anchor deleted')
    setTimeout(() => setSaveMessage(''), 1500)
  }, [isManualMode])

  // Handle mouse move for nodes, waypoints, endpoints, resize, and anchors
  const handleMouseMove = useCallback((e) => {
    const svgCoords = getSVGCoordinates(e)

    if (draggedNode) {
      setCustomPositions(prev => ({
        ...prev,
        [draggedNode]: {
          x: svgCoords.x - dragOffset.x,
          y: svgCoords.y - dragOffset.y
        }
      }))
    } else if (draggedWaypoint) {
      const { connectionId, waypointIndex } = draggedWaypoint
      setCustomWaypoints(prev => ({
        ...prev,
        [connectionId]: {
          ...(prev[connectionId] || {}),
          [waypointIndex]: {
            x: svgCoords.x - dragOffset.x,
            y: svgCoords.y - dragOffset.y
          }
        }
      }))
    } else if (draggedEndpoint) {
      // Find nearest anchor on the relevant node and highlight it
      const { connectionId, type } = draggedEndpoint
      const conn = integrationConnections.find(c =>
        c.patterns.some(p => `${c.source}-${c.target}-${p}` === connectionId)
      )
      if (conn) {
        const nodeName = type === 'source' ? conn.source : conn.target
        const nodePos = systemPositions[nodeName]
        const nodeDim = getNodeDimensions(nodeName)
        const nodeAnchors = customNodeAnchors[nodeName] || []
        if (nodePos && nodeDim) {
          const nearest = findNearestAnchorOrEdge(svgCoords, nodePos, nodeDim.width, nodeDim.height, nodeAnchors)
          if (nearest.type === 'custom') {
            setHoveredAnchor({ system: nodeName, anchorId: nearest.anchorId })
          } else {
            setHoveredAnchor({ system: nodeName, edge: nearest.edge, position: nearest.position })
          }
        }
      }
    } else if (draggedAnchor) {
      // Move anchor along its edge
      const { system, anchorId, edge } = draggedAnchor
      const nodePos = systemPositions[system]
      const nodeDim = getNodeDimensions(system)

      if (nodePos && nodeDim) {
        let newPosition = 0.5
        if (edge === 'top' || edge === 'bottom') {
          const relX = svgCoords.x - nodePos.x
          newPosition = (relX / nodeDim.width) + 0.5
        } else {
          const relY = svgCoords.y - nodePos.y
          newPosition = (relY / nodeDim.height) + 0.5
        }
        newPosition = Math.max(0.05, Math.min(0.95, newPosition))

        setCustomNodeAnchors(prev => ({
          ...prev,
          [system]: (prev[system] || []).map(a =>
            a.id === anchorId ? { ...a, position: newPosition } : a
          )
        }))
      }
    } else if (draggedResize) {
      // Calculate new dimensions based on corner being dragged
      const { system, corner, initialDim } = draggedResize
      const deltaX = svgCoords.x - dragOffset.x
      const deltaY = svgCoords.y - dragOffset.y

      let newWidth = initialDim.width
      let newHeight = initialDim.height

      // Adjust dimensions based on which corner is being dragged
      if (corner === 'ne' || corner === 'se') {
        newWidth = Math.max(80, initialDim.width + deltaX * 2) // *2 because node is centered
      } else {
        newWidth = Math.max(80, initialDim.width - deltaX * 2)
      }

      if (corner === 'se' || corner === 'sw') {
        newHeight = Math.max(30, initialDim.height + deltaY * 2)
      } else {
        newHeight = Math.max(30, initialDim.height - deltaY * 2)
      }

      setCustomDimensions(prev => ({
        ...prev,
        [system]: { width: newWidth, height: newHeight }
      }))
    }
  }, [draggedNode, draggedWaypoint, draggedEndpoint, draggedResize, dragOffset, getSVGCoordinates, systemPositions, getNodeDimensions])

  // Handle mouse up
  const handleMouseUp = useCallback((e) => {
    if (draggedEndpoint) {
      // Snap endpoint to nearest anchor
      const svgCoords = getSVGCoordinates(e)
      const { connectionId, type } = draggedEndpoint

      const conn = integrationConnections.find(c =>
        c.patterns.some(p => `${c.source}-${c.target}-${p}` === connectionId)
      )
      if (conn) {
        const nodeName = type === 'source' ? conn.source : conn.target
        const nodePos = systemPositions[nodeName]
        const nodeDim = getNodeDimensions(nodeName)
        const nodeAnchors = customNodeAnchors[nodeName] || []
        if (nodePos && nodeDim) {
          const nearest = findNearestAnchorOrEdge(svgCoords, nodePos, nodeDim.width, nodeDim.height, nodeAnchors)

          setCustomAnchors(prev => ({
            ...prev,
            [connectionId]: {
              ...(prev[connectionId] || {}),
              [type]: nearest
            }
          }))
        }
      }
    }

    setDraggedNode(null)
    setDraggedWaypoint(null)
    setDraggedEndpoint(null)
    setDraggedResize(null)
    setDraggedAnchor(null)
    setHoveredAnchor(null)
  }, [draggedEndpoint, getSVGCoordinates, systemPositions, getNodeDimensions, customNodeAnchors])

  // Add global mouse event listeners when dragging
  useEffect(() => {
    if (draggedNode || draggedWaypoint || draggedEndpoint || draggedResize || draggedAnchor) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [draggedNode, draggedWaypoint, draggedEndpoint, draggedResize, draggedAnchor, handleMouseMove, handleMouseUp])

  // Generate connection paths with 90-degree angles, custom waypoints, and custom anchors
  const connectionPaths = useMemo(() => {
    const paths = []

    integrationConnections.forEach((conn, connIndex) => {
      const sourcePos = systemPositions[conn.source]
      const targetPos = systemPositions[conn.target]

      if (!sourcePos || !targetPos) return

      const sourceDim = getNodeDimensions(conn.source)
      const targetDim = getNodeDimensions(conn.target)

      // Check if there's a reverse connection (target→source)
      const hasReverseConnection = integrationConnections.some(
        c => c.source === conn.target && c.target === conn.source
      )

      conn.patterns.forEach((pattern, patternIndex) => {
        const connectionId = `${conn.source}-${conn.target}-${pattern}`

        // Get custom anchors or calculate default based on position
        const customAnchor = customAnchors[connectionId]
        const dx = targetPos.x - sourcePos.x
        const dy = targetPos.y - sourcePos.y

        // Determine default anchor edge and position based on relative positions
        let sourceEdge, sourcePosition, targetEdge, targetPosition
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal: connect right-to-left or left-to-right
          sourceEdge = dx > 0 ? 'right' : 'left'
          targetEdge = dx > 0 ? 'left' : 'right'
          sourcePosition = 0.5
          targetPosition = 0.5
        } else {
          // Vertical: connect bottom-to-top or top-to-bottom
          sourceEdge = dy > 0 ? 'bottom' : 'top'
          targetEdge = dy > 0 ? 'top' : 'bottom'
          sourcePosition = 0.5
          targetPosition = 0.5
        }

        // Apply bidirectional offset
        if (hasReverseConnection && !customAnchor) {
          sourcePosition = 0.35
          targetPosition = 0.35
        }

        // Apply custom anchor if set
        if (customAnchor?.source) {
          sourceEdge = customAnchor.source.edge
          sourcePosition = customAnchor.source.position
        }
        if (customAnchor?.target) {
          targetEdge = customAnchor.target.edge
          targetPosition = customAnchor.target.position
        }

        // Get absolute positions for anchors
        const startPos = getAbsoluteAnchorPositionDynamic(sourcePos, sourceEdge, sourcePosition, sourceDim.width, sourceDim.height)
        const endPos = getAbsoluteAnchorPositionDynamic(targetPos, targetEdge, targetPosition, targetDim.width, targetDim.height)

        let startX = startPos.x
        let startY = startPos.y
        let endX = endPos.x
        let endY = endPos.y

        // Add small offset for multiple patterns from same anchors
        const patternOffset = (patternIndex - (conn.patterns.length - 1) / 2) * 8
        if (sourceEdge === 'left' || sourceEdge === 'right') {
          startY += patternOffset
        } else {
          startX += patternOffset
        }
        if (targetEdge === 'left' || targetEdge === 'right') {
          endY += patternOffset
        } else {
          endX += patternOffset
        }

        let waypoints = []
        let path, labelX, labelY

        // Determine if connection is primarily horizontal or vertical based on edge
        const isHorizontalStart = sourceEdge === 'left' || sourceEdge === 'right'
        const isHorizontalEnd = targetEdge === 'left' || targetEdge === 'right'

        const laneOffset = (connIndex % 3 - 1) * 25

        if (Math.abs(startY - endY) < 10 && isHorizontalStart && isHorizontalEnd) {
          // Straight horizontal line
          path = `M ${startX} ${startY} L ${endX} ${endY}`
          labelX = (startX + endX) / 2
          labelY = startY - 15
        } else if (Math.abs(startX - endX) < 10 && !isHorizontalStart && !isHorizontalEnd) {
          // Straight vertical line
          path = `M ${startX} ${startY} L ${endX} ${endY}`
          labelX = startX + 20
          labelY = (startY + endY) / 2
        } else {
          // Need orthogonal routing with waypoints
          const customWp = customWaypoints[connectionId]
          let midX, midY

          if (isHorizontalStart) {
            // Start horizontal, then go vertical
            midX = customWp?.[0]?.x || ((startX + endX) / 2 + laneOffset)
            waypoints = [
              { x: midX, y: startY, index: 0 },
              { x: midX, y: endY, index: 1 }
            ]
            path = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`
            labelX = midX
            labelY = (startY + endY) / 2 - 15
          } else {
            // Start vertical, then go horizontal
            midY = customWp?.[0]?.y || ((startY + endY) / 2 + laneOffset)
            waypoints = [
              { x: startX, y: midY, index: 0 },
              { x: endX, y: midY, index: 1 }
            ]
            path = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`
            labelX = (startX + endX) / 2
            labelY = midY - 15
          }
        }

        paths.push({
          id: connectionId,
          source: conn.source,
          target: conn.target,
          pattern,
          color: patternColors[pattern] || '#3B82F6',
          path,
          labelX,
          labelY,
          startX,
          startY,
          endX,
          endY,
          waypoints,
          sourceEdge,
          targetEdge,
          isHorizontal: isHorizontalStart
        })
      })
    })

    return paths
  }, [systemPositions, getNodeDimensions, customWaypoints, customAnchors, customDimensions, customNodeAnchors])

  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-3 text-white tracking-tight">
            Solution Diagram
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl">
            Integration flows between demo applications and core banking systems
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Edit Configuration Button */}
          <button
            onClick={() => setIsConfigEditorOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30"
            title="Edit Integration Configuration"
          >
            <FileEdit className="w-4 h-4" />
            <span className="text-sm font-medium">Edit Config</span>
          </button>

          {/* Manual Arrange Button */}
          <button
            onClick={handleManualModeToggle}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 rounded-xl transition-all",
              isManualMode
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/50"
            )}
            title="Manual Arrange - Drag nodes to reposition"
          >
            <Move className="w-4 h-4" />
            <span className="text-sm font-medium">Manual Arrange</span>
          </button>

          {/* Save Layout Button - Only show when manual mode is active or customizations exist */}
          {(isManualMode || hasCustomizations) && (
            <button
              onClick={handleSaveLayout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
              title="Save Layout (Nodes & Arrows)"
            >
              <Save className="w-4 h-4" />
              <span className="text-sm font-medium">Save</span>
            </button>
          )}

          {/* Reset Layout Button - Only show when customizations exist */}
          {hasCustomizations && (
            <button
              onClick={handleResetLayout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
              title="Reset Layout to Default"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm font-medium">Reset</span>
            </button>
          )}

          {/* Save Message */}
          {saveMessage && (
            <span className="text-sm text-green-400 font-medium animate-pulse">
              {saveMessage}
            </span>
          )}
        </div>
      </div>

      {/* Hint Banner - Click to view application */}
      {!isManualMode && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <MousePointer className="w-5 h-5 text-blue-400" />
          <span className="text-sm text-blue-300">
            <strong>Tip:</strong> Click on any <span className="text-emerald-400">application node</span> to view its landing page.
            Look for nodes with the <ExternalLink className="w-3.5 h-3.5 inline mx-1" /> icon.
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
        <span className="text-sm font-medium text-slate-400">Integration Patterns:</span>
        <div className="flex items-center gap-6">
          {Object.entries(patternColors).map(([pattern, color]) => (
            <div key={pattern} className="flex items-center gap-2">
              <div className="flex items-center">
                <div
                  className="w-8 h-0.5"
                  style={{ backgroundColor: color }}
                />
                <div
                  className="w-0 h-0 border-t-4 border-b-4 border-l-6"
                  style={{
                    borderLeftColor: color,
                    borderTopColor: 'transparent',
                    borderBottomColor: 'transparent',
                    borderLeftWidth: '8px',
                    borderTopWidth: '4px',
                    borderBottomWidth: '4px'
                  }}
                />
              </div>
              <span className="text-xs text-slate-300">{pattern}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Mode Indicator */}
      {isManualMode && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <Move className="w-4 h-4" />
          <span className="text-sm">
            <strong>Manual Arrange Mode:</strong> Drag <span className="text-amber-300">nodes</span> to reposition.
            Drag <span className="text-emerald-400">corner handles</span> to resize.
            <span className="text-green-400">Click edge</span> to create anchor.
            Drag <span className="text-green-400">diamond anchors</span> along edge.
            <span className="text-red-400">Double-click anchor</span> to delete.
            Drag <span className="text-cyan-400">connection endpoints</span> to reconnect.
            Drag <span className="text-violet-400">waypoints</span> to adjust routing.
          </span>
        </div>
      )}

      {/* Diagram Canvas */}
      <div
        className={clsx(
          "relative rounded-2xl bg-gradient-to-br from-slate-800/40 to-slate-900/60 border overflow-hidden",
          isManualMode ? "border-amber-500/50" : "border-slate-700/50"
        )}
        style={{ height: '650px' }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox="0 0 1000 700"
          className={clsx(
            "transition-transform duration-300",
            (draggedNode || draggedWaypoint || draggedEndpoint || draggedResize || draggedAnchor) && "cursor-grabbing"
          )}
        >
          <defs>
            {/* Glow filter */}
            <filter id="glowDiagram" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Node gradient */}
            <radialGradient id="nodeGradientDiagram" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(30, 41, 59, 0.95)" />
              <stop offset="100%" stopColor="rgba(15, 23, 42, 0.95)" />
            </radialGradient>

          </defs>

          {/* Connection Lines - Orthogonal Lines */}
          {connectionPaths.map((conn, index) => (
            <g key={conn.id}>
              {/* Background path */}
              <path
                d={conn.path}
                fill="none"
                stroke={conn.color}
                strokeWidth="2"
                strokeOpacity="0.25"
                strokeLinejoin="round"
              />

              {/* Main visible path */}
              <path
                d={conn.path}
                fill="none"
                stroke={conn.color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Animated flowing dots along path */}
              <circle
                r="4"
                fill={conn.color}
                filter="url(#glowDiagram)"
              >
                <animateMotion
                  dur={`${2.5 + index * 0.3}s`}
                  repeatCount="indefinite"
                  path={conn.path}
                />
              </circle>

              {/* Second animated dot (staggered) */}
              <circle
                r="3"
                fill={conn.color}
                opacity="0.7"
              >
                <animateMotion
                  dur={`${2.5 + index * 0.3}s`}
                  begin={`${1.25 + index * 0.15}s`}
                  repeatCount="indefinite"
                  path={conn.path}
                />
              </circle>

              {/* Pattern label on arrow */}
              <g transform={`translate(${conn.labelX}, ${conn.labelY})`}>
                <rect
                  x="-28"
                  y="-9"
                  width="56"
                  height="18"
                  rx="9"
                  fill="rgba(15, 23, 42, 0.9)"
                  stroke={conn.color}
                  strokeWidth="1"
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={conn.color}
                  fontSize="10"
                  fontWeight="600"
                >
                  {conn.pattern}
                </text>
              </g>

              {/* Draggable Waypoints - Only show in manual mode */}
              {isManualMode && conn.waypoints && conn.waypoints.length > 0 && (
                <g>
                  {/* We only need one draggable control point for the corner */}
                  <g
                    transform={`translate(${conn.waypoints[0].x}, ${conn.waypoints[0].y})`}
                    onMouseDown={(e) => handleWaypointMouseDown(e, conn.id, 0, conn.waypoints[0])}
                    style={{ cursor: draggedWaypoint?.connectionId === conn.id ? 'grabbing' : 'grab' }}
                  >
                    {/* Waypoint background circle */}
                    <circle
                      r="10"
                      fill="rgba(139, 92, 246, 0.9)"
                      stroke="white"
                      strokeWidth="2"
                      className="transition-all duration-150"
                    />
                    {/* Drag indicator arrows */}
                    <path
                      d={conn.isHorizontal
                        ? "M -4 0 L 4 0 M -4 0 L -2 -2 M -4 0 L -2 2 M 4 0 L 2 -2 M 4 0 L 2 2"  // Horizontal arrows
                        : "M 0 -4 L 0 4 M 0 -4 L -2 -2 M 0 -4 L 2 -2 M 0 4 L -2 2 M 0 4 L 2 2"  // Vertical arrows
                      }
                      stroke="white"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                    />

                    {/* Highlight when dragging */}
                    {draggedWaypoint?.connectionId === conn.id && (
                      <circle
                        r="14"
                        fill="none"
                        stroke="rgba(139, 92, 246, 0.5)"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                      >
                        <animate
                          attributeName="stroke-dashoffset"
                          from="6"
                          to="0"
                          dur="0.3s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                  </g>
                </g>
              )}

              {/* Draggable Endpoint Handles - Only show in manual mode */}
              {isManualMode && (
                <g>
                  {/* Source endpoint handle */}
                  <g
                    transform={`translate(${conn.startX}, ${conn.startY})`}
                    onMouseDown={(e) => handleEndpointMouseDown(e, conn.id, 'source', { x: conn.startX, y: conn.startY })}
                    style={{ cursor: draggedEndpoint?.connectionId === conn.id && draggedEndpoint?.type === 'source' ? 'grabbing' : 'grab' }}
                  >
                    <circle
                      r="8"
                      fill="rgba(6, 182, 212, 0.9)"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <circle r="3" fill="white" />
                  </g>

                  {/* Target endpoint handle */}
                  <g
                    transform={`translate(${conn.endX}, ${conn.endY})`}
                    onMouseDown={(e) => handleEndpointMouseDown(e, conn.id, 'target', { x: conn.endX, y: conn.endY })}
                    style={{ cursor: draggedEndpoint?.connectionId === conn.id && draggedEndpoint?.type === 'target' ? 'grabbing' : 'grab' }}
                  >
                    <circle
                      r="8"
                      fill="rgba(6, 182, 212, 0.9)"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <circle r="3" fill="white" />
                  </g>
                </g>
              )}
            </g>
          ))}

          {/* System Nodes - Rectangles */}
          {systems.map((system) => {
            const pos = systemPositions[system]
            if (!pos) return null

            const color = systemColors[system] || '#6B7280'
            const isSelected = selectedSystem === system
            const isESB = system === 'ESB - Enterprise Service Bus'
            const isDragging = draggedNode === system
            const dim = getNodeDimensions(system)
            const borderRadius = 8
            const demoApp = getSystemDemoApp(system)
            const isClickableApp = !!demoApp

            return (
              <g
                key={system}
                transform={`translate(${pos.x}, ${pos.y})`}
                onMouseDown={(e) => handleNodeMouseDown(e, system)}
                onClick={() => handleSystemClick(system)}
                style={{
                  cursor: isManualMode ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
                  opacity: isDragging ? 0.8 : 1
                }}
                className={clsx(
                  "transition-all",
                  !isDragging && "duration-300"
                )}
              >
                {/* Outer glow border for ESB */}
                {isESB && (
                  <rect
                    x={-dim.width / 2 - 8}
                    y={-dim.height / 2 - 8}
                    width={dim.width + 16}
                    height={dim.height + 16}
                    rx={borderRadius + 4}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeOpacity="0.4"
                    strokeDasharray="8 4"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="12"
                      to="0"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </rect>
                )}

                {/* Node background rectangle */}
                <rect
                  x={-dim.width / 2 - (isSelected ? 2 : 0)}
                  y={-dim.height / 2 - (isSelected ? 2 : 0)}
                  width={dim.width + (isSelected ? 4 : 0)}
                  height={dim.height + (isSelected ? 4 : 0)}
                  rx={borderRadius}
                  fill="rgba(15, 23, 42, 0.95)"
                  stroke={color}
                  strokeWidth={isSelected ? 3 : 2}
                  filter={isSelected ? "url(#glowDiagram)" : ""}
                  className="transition-all duration-300"
                />

                {/* Inner colored fill */}
                <rect
                  x={-dim.width / 2 + 3}
                  y={-dim.height / 2 + 3}
                  width={dim.width - 6}
                  height={dim.height - 6}
                  rx={borderRadius - 2}
                  fill={color}
                  fillOpacity="0.15"
                />

                {/* Pulsing animation for ESB */}
                {isESB && (
                  <rect
                    x={-dim.width / 2 + 3}
                    y={-dim.height / 2 + 3}
                    width={dim.width - 6}
                    height={dim.height - 6}
                    rx={borderRadius - 2}
                    fill={color}
                    fillOpacity="0.1"
                  >
                    <animate
                      attributeName="fill-opacity"
                      values="0.1;0.3;0.1"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </rect>
                )}

                {/* System name text inside rectangle */}
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={isESB ? 12 : 11}
                  fontWeight="600"
                >
                  {system}
                </text>

                {/* Clickable app indicator (ExternalLink icon) or colored dot */}
                {isClickableApp && !isManualMode ? (
                  <g transform={`translate(${dim.width / 2 - 12}, ${-dim.height / 2 + 12})`}>
                    {/* Background circle */}
                    <circle
                      r="9"
                      fill="rgba(16, 185, 129, 0.9)"
                      stroke="white"
                      strokeWidth="1.5"
                    >
                      <animate
                        attributeName="r"
                        values="9;10;9"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    {/* External link icon */}
                    <path
                      d="M -3 3 L 3 -3 M 0 -3 L 3 -3 L 3 0 M -3 1 L -3 3 L -1 3"
                      stroke="white"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                ) : (
                  <circle
                    cx={dim.width / 2 - 10}
                    cy={-dim.height / 2 + 10}
                    r="4"
                    fill={color}
                  >
                    <animate
                      attributeName="opacity"
                      values="1;0.5;1"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Manual mode drag indicator */}
                {isManualMode && (
                  <g transform={`translate(${-dim.width / 2 + 12}, ${-dim.height / 2 + 12})`}>
                    <circle
                      r="10"
                      fill="rgba(251, 191, 36, 0.9)"
                    />
                    {/* Move icon - 4 arrows */}
                    <path
                      d="M 0 -5 L 0 5 M -5 0 L 5 0 M 0 -5 L -2 -3 M 0 -5 L 2 -3 M 0 5 L -2 3 M 0 5 L 2 3 M -5 0 L -3 -2 M -5 0 L -3 2 M 5 0 L 3 -2 M 5 0 L 3 2"
                      stroke="rgba(15, 23, 42, 0.9)"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </g>
                )}

                {/* Drag highlight border */}
                {isDragging && (
                  <rect
                    x={-dim.width / 2 - 4}
                    y={-dim.height / 2 - 4}
                    width={dim.width + 8}
                    height={dim.height + 8}
                    rx={borderRadius + 2}
                    fill="none"
                    stroke="rgba(251, 191, 36, 0.8)"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="6"
                      to="0"
                      dur="0.3s"
                      repeatCount="indefinite"
                    />
                  </rect>
                )}

                {/* Clickable Edge Zones - Show in manual mode for creating new anchors */}
                {isManualMode && (
                  <g>
                    {/* Edge hover zones */}
                    {[
                      { edge: 'top', x: 0, y: -dim.height / 2, width: dim.width - 20, height: 10, cursor: 'crosshair' },
                      { edge: 'bottom', x: 0, y: dim.height / 2, width: dim.width - 20, height: 10, cursor: 'crosshair' },
                      { edge: 'left', x: -dim.width / 2, y: 0, width: 10, height: dim.height - 20, cursor: 'crosshair' },
                      { edge: 'right', x: dim.width / 2, y: 0, width: 10, height: dim.height - 20, cursor: 'crosshair' }
                    ].map(({ edge, x, y, width, height, cursor }) => {
                      const isEdgeHovered = hoveredEdge?.system === system && hoveredEdge?.edge === edge
                      const isVertical = edge === 'left' || edge === 'right'

                      return (
                        <g key={edge}>
                          {/* Invisible hover zone */}
                          <rect
                            x={isVertical ? x - 5 : x - width / 2}
                            y={isVertical ? y - height / 2 : y - 5}
                            width={isVertical ? 10 : width}
                            height={isVertical ? height : 10}
                            fill="transparent"
                            style={{ cursor }}
                            onClick={(e) => handleEdgeClick(e, system, edge, pos, dim)}
                            onMouseEnter={() => setHoveredEdge({ system, edge })}
                            onMouseLeave={() => setHoveredEdge(null)}
                          />
                          {/* Visual edge highlight when hovered */}
                          {isEdgeHovered && (
                            <line
                              x1={isVertical ? x : x - width / 2 + 10}
                              y1={isVertical ? y - height / 2 + 10 : y}
                              x2={isVertical ? x : x + width / 2 - 10}
                              y2={isVertical ? y + height / 2 - 10 : y}
                              stroke="rgba(34, 197, 94, 0.8)"
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeDasharray="6 4"
                            >
                              <animate
                                attributeName="stroke-dashoffset"
                                from="10"
                                to="0"
                                dur="0.5s"
                                repeatCount="indefinite"
                              />
                            </line>
                          )}
                        </g>
                      )
                    })}

                    {/* Custom Anchor Points */}
                    {(customNodeAnchors[system] || []).map((anchor) => {
                      const anchorPos = getAnchorPositionFromEdge(anchor.edge, anchor.position, dim.width, dim.height)
                      const isHovered = hoveredAnchor?.system === system && hoveredAnchor?.anchorId === anchor.id
                      const isDraggingThis = draggedAnchor?.anchorId === anchor.id
                      // Check if this anchor is a drop target for a dragged connection endpoint
                      const isDropTarget = draggedEndpoint && hoveredAnchor?.system === system && hoveredAnchor?.anchorId === anchor.id

                      return (
                        <g
                          key={anchor.id}
                          transform={`translate(${anchorPos.x}, ${anchorPos.y})`}
                          onMouseDown={(e) => handleAnchorMouseDown(e, system, anchor.id, anchor.edge, anchor.position)}
                          onDoubleClick={(e) => handleAnchorDoubleClick(e, system, anchor.id)}
                          style={{ cursor: isDraggingThis ? 'grabbing' : 'grab' }}
                        >
                          {/* Outer glow when this is a drop target */}
                          {isDropTarget && (
                            <>
                              <circle
                                r="24"
                                fill="rgba(6, 182, 212, 0.15)"
                                className="transition-all duration-150"
                              />
                              <circle
                                r="20"
                                fill="none"
                                stroke="rgba(6, 182, 212, 0.6)"
                                strokeWidth="3"
                              >
                                <animate
                                  attributeName="r"
                                  values="16;22;16"
                                  dur="0.6s"
                                  repeatCount="indefinite"
                                />
                                <animate
                                  attributeName="stroke-opacity"
                                  values="0.8;0.3;0.8"
                                  dur="0.6s"
                                  repeatCount="indefinite"
                                />
                              </circle>
                            </>
                          )}
                          {/* Anchor point diamond shape */}
                          <rect
                            x="-6"
                            y="-6"
                            width="12"
                            height="12"
                            rx="2"
                            transform="rotate(45)"
                            fill={isDropTarget ? 'rgba(6, 182, 212, 1)' : (isHovered || isDraggingThis ? 'rgba(34, 197, 94, 1)' : 'rgba(34, 197, 94, 0.9)')}
                            stroke="white"
                            strokeWidth={isDropTarget || isHovered || isDraggingThis ? 2.5 : 1.5}
                            filter={isDropTarget ? "url(#glowDiagram)" : ""}
                            className="transition-all duration-150"
                          />
                          {/* Inner dot */}
                          <circle
                            r={isDropTarget ? 4 : (isHovered || isDraggingThis ? 3 : 2)}
                            fill="white"
                          />
                          {/* Highlight ring when hovered or dragging (not drop target) */}
                          {(isHovered || isDraggingThis) && !isDropTarget && (
                            <circle
                              r="14"
                              fill="none"
                              stroke="rgba(34, 197, 94, 0.5)"
                              strokeWidth="2"
                            >
                              <animate
                                attributeName="r"
                                values="12;16;12"
                                dur="0.8s"
                                repeatCount="indefinite"
                              />
                              <animate
                                attributeName="opacity"
                                values="0.7;0.3;0.7"
                                dur="0.8s"
                                repeatCount="indefinite"
                              />
                            </circle>
                          )}
                          {/* "Drop here" text indicator when drop target */}
                          {isDropTarget && (
                            <text
                              y="-18"
                              textAnchor="middle"
                              fill="rgba(6, 182, 212, 1)"
                              fontSize="9"
                              fontWeight="600"
                            >
                              DROP
                            </text>
                          )}
                        </g>
                      )
                    })}

                    {/* Default edge center indicators (small dots) */}
                    {['top', 'right', 'bottom', 'left'].map((edge) => {
                      const defaultPos = getAnchorPositionFromEdge(edge, 0.5, dim.width, dim.height)
                      const hasCustomOnEdge = (customNodeAnchors[system] || []).some(a => a.edge === edge)
                      const isHovered = hoveredAnchor?.system === system && hoveredAnchor?.edge === edge && !hoveredAnchor?.anchorId
                      // Check if this default edge is a drop target
                      const isDropTarget = draggedEndpoint && hoveredAnchor?.system === system && hoveredAnchor?.edge === edge && !hoveredAnchor?.anchorId

                      return (
                        <g key={`default-${edge}`} transform={`translate(${defaultPos.x}, ${defaultPos.y})`}>
                          {/* Outer glow when this is a drop target */}
                          {isDropTarget && (
                            <>
                              <circle
                                r="18"
                                fill="rgba(6, 182, 212, 0.15)"
                              />
                              <circle
                                r="14"
                                fill="none"
                                stroke="rgba(6, 182, 212, 0.6)"
                                strokeWidth="2"
                              >
                                <animate
                                  attributeName="r"
                                  values="12;18;12"
                                  dur="0.6s"
                                  repeatCount="indefinite"
                                />
                                <animate
                                  attributeName="stroke-opacity"
                                  values="0.8;0.3;0.8"
                                  dur="0.6s"
                                  repeatCount="indefinite"
                                />
                              </circle>
                            </>
                          )}
                          {/* Default edge dot */}
                          <circle
                            r={isDropTarget ? 7 : (isHovered ? 5 : 3)}
                            fill={isDropTarget ? 'rgba(6, 182, 212, 1)' : (isHovered ? 'rgba(6, 182, 212, 0.9)' : 'rgba(6, 182, 212, 0.5)')}
                            stroke="white"
                            strokeWidth={isDropTarget ? 2 : 1}
                            filter={isDropTarget ? "url(#glowDiagram)" : ""}
                            style={{ opacity: hasCustomOnEdge && !isDropTarget ? 0.3 : 1 }}
                            className="transition-all duration-150"
                          />
                        </g>
                      )
                    })}
                  </g>
                )}

                {/* Resize Handles - Show in manual mode */}
                {isManualMode && (
                  <g>
                    {/* Corner resize handles: nw, ne, sw, se */}
                    {[
                      { id: 'nw', x: -dim.width / 2, y: -dim.height / 2, cursor: 'nwse-resize' },
                      { id: 'ne', x: dim.width / 2, y: -dim.height / 2, cursor: 'nesw-resize' },
                      { id: 'sw', x: -dim.width / 2, y: dim.height / 2, cursor: 'nesw-resize' },
                      { id: 'se', x: dim.width / 2, y: dim.height / 2, cursor: 'nwse-resize' }
                    ].map(({ id, x, y, cursor }) => {
                      const isResizing = draggedResize?.system === system && draggedResize?.corner === id

                      return (
                        <g
                          key={id}
                          transform={`translate(${x}, ${y})`}
                          onMouseDown={(e) => handleResizeMouseDown(e, system, id, dim)}
                          style={{ cursor: isResizing ? 'grabbing' : cursor }}
                        >
                          {/* Resize handle square */}
                          <rect
                            x="-6"
                            y="-6"
                            width="12"
                            height="12"
                            rx="2"
                            fill={isResizing ? 'rgba(16, 185, 129, 1)' : 'rgba(16, 185, 129, 0.9)'}
                            stroke="white"
                            strokeWidth="1.5"
                            className="transition-all duration-150"
                          />
                          {/* Resize indicator - diagonal lines */}
                          <path
                            d={id === 'se' || id === 'nw'
                              ? "M -3 3 L 3 -3 M 0 3 L 3 0"
                              : "M -3 -3 L 3 3 M 0 -3 L 3 0"
                            }
                            stroke="white"
                            strokeWidth="1.5"
                            fill="none"
                            strokeLinecap="round"
                          />
                          {/* Highlight when resizing */}
                          {isResizing && (
                            <rect
                              x="-10"
                              y="-10"
                              width="20"
                              height="20"
                              rx="4"
                              fill="none"
                              stroke="rgba(16, 185, 129, 0.5)"
                              strokeWidth="2"
                              strokeDasharray="4 2"
                            >
                              <animate
                                attributeName="stroke-dashoffset"
                                from="6"
                                to="0"
                                dur="0.3s"
                                repeatCount="indefinite"
                              />
                            </rect>
                          )}
                        </g>
                      )
                    })}
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Selected System Info Panel */}
      {selectedSystem && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${systemColors[selectedSystem]}25` }}
              >
                <span
                  className="font-bold text-lg"
                  style={{ color: systemColors[selectedSystem] }}
                >
                  {selectedSystem.split(/[\s-]+/).map(w => w[0]).join('').slice(0, 2)}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedSystem}</h3>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-slate-400">
                    Outgoing: {integrationConnections.filter(c => c.source === selectedSystem).length} connection(s)
                  </span>
                  <span className="text-sm text-slate-400">
                    Incoming: {integrationConnections.filter(c => c.target === selectedSystem).length} connection(s)
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedSystem(null)}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 text-sm"
            >
              Close
            </button>
          </div>

          {/* Connection details */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/50">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Sends To:</h4>
              <div className="space-y-2">
                {integrationConnections
                  .filter(c => c.source === selectedSystem)
                  .map((conn, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-white">{conn.target}</span>
                      <span className="text-slate-500">via</span>
                      {conn.patterns.map((p, pi) => (
                        <span
                          key={pi}
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{ backgroundColor: `${patternColors[p]}30`, color: patternColors[p] }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  ))}
                {integrationConnections.filter(c => c.source === selectedSystem).length === 0 && (
                  <span className="text-slate-500 text-sm">No outgoing connections</span>
                )}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/50">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Receives From:</h4>
              <div className="space-y-2">
                {integrationConnections
                  .filter(c => c.target === selectedSystem)
                  .map((conn, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-white">{conn.source}</span>
                      <span className="text-slate-500">via</span>
                      {conn.patterns.map((p, pi) => (
                        <span
                          key={pi}
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{ backgroundColor: `${patternColors[p]}30`, color: patternColors[p] }}
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  ))}
                {integrationConnections.filter(c => c.target === selectedSystem).length === 0 && (
                  <span className="text-slate-500 text-sm">No incoming connections</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Config Editor Modal */}
      <ConfigEditorModal
        isOpen={isConfigEditorOpen}
        onClose={() => setIsConfigEditorOpen(false)}
        onSaved={() => {
          // Modal will handle page reload
        }}
      />
    </div>
  )
}

export default SolutionDiagramPage
