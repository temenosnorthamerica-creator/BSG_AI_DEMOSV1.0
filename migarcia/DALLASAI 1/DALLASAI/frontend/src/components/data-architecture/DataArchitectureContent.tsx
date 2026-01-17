import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react'

type AnimationPath = 'path-c' | 'path-a' | 'path-b'
type PlaybackState = 'idle' | 'playing' | 'paused' | 'completed'

interface ComponentItem {
  id: string
  label: string
  image: string
  position: { x: number; y: number; width: number; height: number }
  tooltip?: string
}

interface ArrowItem {
  id: string
  from: string
  to: string
  points: string // SVG path points
  label?: string
  dashArray?: string
  color?: string
}

interface AnimationStep {
  componentId: string
  delay: number
  type: 'component' | 'arrow'
}

interface DataFlowDot {
  id: string
  type: 'business' | 'data'
  pathId: string
  startTime: number
  segment: 'events-pubsub' | 'pubsub-microservices' | 'pubsub-datahub' | 'datahub-analytics' | 'pubsub-etl' | 'pubsub-fork-main' | 'fork-horizontal-left' | 'fork-horizontal-right' | 'fork-etl' | 'fork-datahub'
}

export function DataArchitectureContent() {
  const [selectedPath, setSelectedPath] = useState<AnimationPath>('path-c')
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle')
  const [currentStep, setCurrentStep] = useState(0)
  const [visibleComponents, setVisibleComponents] = useState<Set<string>>(new Set())
  const [allAnimatedComponents, setAllAnimatedComponents] = useState<Set<string>>(new Set())
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null)
  const [activeDataFlows, setActiveDataFlows] = useState<DataFlowDot[]>([])
  const [spawningTrigger, setSpawningTrigger] = useState(0) // Increment to restart spawning
  const [greyedComponents, setGreyedComponents] = useState<Set<string>>(new Set()) // Components to grey out
  const [completedPaths, setCompletedPaths] = useState<Set<AnimationPath>>(new Set()) // Track which paths have been completed
  const spawningIntervalRef = useRef<number | null>(null)

  // Static components that are always visible (common starting point for all paths)
  const staticComponents: ComponentItem[] = [
    // Core system - Left side large dark blue box (8px grid aligned) - INCREASED SIZE
    { id: 'temenos_core', label: 'Temenos Core', image: 'Temenos_Core.png', position: { x: 40, y: 40, width: 176, height: 280 }, tooltip: 'Core banking system handling commands and queries' },

    // Databases - Below core system in a row (8px grid aligned) - ALIGNED TO MATCH NVDB WIDTH
    { id: 'live', label: 'Live', image: 'Live.png', position: { x: 40, y: 336, width: 76, height: 76 }, tooltip: 'Live operational database' },
    { id: 'archive', label: 'Archive', image: 'Archive.png', position: { x: 132, y: 336, width: 76, height: 76 }, tooltip: 'Archive database for historical data' },
    { id: 'nvdb', label: 'NVDB', image: 'NVDB.png', position: { x: 40, y: 420, width: 168, height: 72 }, tooltip: 'Non-volatile database' },
  ]

  // Animated components (will appear based on selected path) - 8px grid aligned
  const animatedComponents: ComponentItem[] = [
    // Tags over/near Temenos Core - INCREASED SIZE (+10%) AND REPOSITIONED
    { id: 'events_left', label: 'Events', image: 'Events.png', position: { x: 184, y: 79, width: 104, height: 56 }, tooltip: 'Event publishing system' },
    { id: 'file_left', label: 'File (low volume)', image: 'File.png', position: { x: 184, y: 220, width: 104, height: 56 }, tooltip: 'File-based data export for low volume data' },

    // Middle tier - Build/Buy area - REPOSITIONED AND ALIGNED
    { id: 'pub_sub', label: 'Pub/Sub (e.g., Kafka)', image: 'Pub_Sub.png', position: { x: 537, y: 66, width: 139, height: 82 }, tooltip: 'Message broker for event streaming' },
    { id: 'etl', label: 'ETL', image: 'ETL.png', position: { x: 408, y: 246, width: 144, height: 64 }, tooltip: 'Extract, Transform, Load processes' },

    // Center-right - Data Hub & Analytics band - VERTICALLY CENTERED WITH ETL
    { id: 'data_hub', label: 'Data Hub', image: 'Data_Hub.png', position: { x: 656, y: 233, width: 152, height: 90 }, tooltip: 'Centralized data hub with specialized stores' },
    { id: 'analytics', label: 'Analytics (optional)', image: 'Analytics.png', position: { x: 818, y: 246, width: 120, height: 64 }, tooltip: 'Analytics and reporting platform' },

    // Cylinders overlaying bottom of Data Hub and Analytics - INCREASED SIZE (+5%)
    { id: 'ods', label: 'ODS', image: 'ODS.png', position: { x: 666, y: 290, width: 59, height: 59 }, tooltip: 'Operational Data Store' },
    { id: 'sds', label: 'SDS', image: 'SDS.png', position: { x: 742, y: 290, width: 59, height: 59 }, tooltip: 'Staging Data Store' },
    { id: 'ads', label: 'ADS', image: 'ADS.png', position: { x: 850, y: 290, width: 59, height: 59 }, tooltip: 'Analytical Data Store' },

    // Bottom - Data Warehouse bar - DECREASED SIZE (-15%), MOVED RIGHT AND UP, ALIGNED WITH ADS CENTER
    { id: 'data_warehouse', label: 'Data Warehouse', image: 'DWH.png', position: { x: 418, y: 390, width: 462, height: 54 }, tooltip: 'Centralized data repository for analytics' },

    // Right tier - Microservices panel - ALIGNED WITH PUB_SUB CENTER
    { id: 'microservices', label: 'Business Microservices (optional)', image: 'Microservices.png', position: { x: 872, y: 39, width: 240, height: 136 }, tooltip: 'Optional microservices with dedicated databases (Holdings, Party)' },
  ]

  // Define arrows/connections - updated for new layout (8px grid aligned)
  const arrows: ArrowItem[] = [
    // Path 1 arrows - Event-Driven path (RGB 41, 50, 118) - Extended into component areas
    { id: 'arrow-events-pubsub', from: 'events_left', to: 'pub_sub', points: 'M 288 107 L 552 107', dashArray: '5,5', color: '#293276' },
    { id: 'arrow-pubsub-microservices', from: 'pub_sub', to: 'microservices', points: 'M 661 107 L 887 107', dashArray: '5,5', color: '#293276' },

    // Path 2 forked arrows - From Pub/Sub down, then fork to ETL (left) and Data Hub (right)
    { id: 'arrow-pubsub-fork-main', from: 'pub_sub', to: 'fork', points: 'M 606 148 L 606 200', dashArray: '5,5', color: '#293276' },
    { id: 'arrow-fork-horizontal', from: 'fork', to: 'fork', points: 'M 480 200 L 732 200', dashArray: '5,5', color: '#293276' },
    { id: 'arrow-fork-horizontal-left', from: 'fork', to: 'etl', points: 'M 606 200 L 480 200', dashArray: '5,5', color: '#293276' },
    { id: 'arrow-fork-horizontal-right', from: 'fork', to: 'data_hub', points: 'M 606 200 L 732 200', dashArray: '5,5', color: '#293276' },
    { id: 'arrow-fork-etl', from: 'fork', to: 'etl', points: 'M 480 200 L 480 252', dashArray: '5,5', color: '#293276' },
    { id: 'arrow-fork-datahub', from: 'fork', to: 'data_hub', points: 'M 732 200 L 732 245', dashArray: '5,5', color: '#293276' },
    { id: 'arrow-datahub-analytics', from: 'data_hub', to: 'analytics', points: 'M 576 216 L 592 220', color: '#3B82F6' },

    // Path 2 data flow arrows - ETL and SDS to Data Warehouse (intermittent)
    { id: 'arrow-etl-dwh', from: 'etl', to: 'data_warehouse', points: 'M 480 310 L 480 390', dashArray: '5,5', color: '#00B0F0' },
    { id: 'arrow-sds-dwh', from: 'sds', to: 'data_warehouse', points: 'M 771 349 L 771 390', dashArray: '5,5', color: '#00B0F0' },

    // Path 3 arrows - ETL Pipeline path
    { id: 'arrow-file-etl', from: 'file_left', to: 'etl', points: 'M 172 192 L 264 220', color: '#14B8A6' },
    { id: 'arrow-etl-warehouse', from: 'etl', to: 'data_warehouse', points: 'M 328 248 L 480 296', color: '#8B5CF6' },
    { id: 'arrow-pubsub-etl', from: 'pub_sub', to: 'etl', points: 'M 376 144 L 328 192', label: 'Build', dashArray: '5,5', color: '#F59E0B' },
    { id: 'arrow-warehouse-analytics', from: 'data_warehouse', to: 'analytics', points: 'M 696 320 L 644 248', label: 'Extracts', dashArray: '5,5', color: '#6366F1' },
  ]

  // Define animation sequences for each path (static components are always visible, so not included)
  const animationSequences: Record<AnimationPath, AnimationStep[]> = {
    'path-c': [
      // Path 1 (path-c): Events → Pub/Sub → Microservices - Components appear first, then arrows
      { componentId: 'events_left', delay: 0, type: 'component' },
      { componentId: 'pub_sub', delay: 0, type: 'component' },
      { componentId: 'microservices', delay: 0, type: 'component' },
      { componentId: 'arrow-events-pubsub', delay: 1000, type: 'arrow' },
      { componentId: 'arrow-pubsub-microservices', delay: 1000, type: 'arrow' },
    ],
    'path-a': [
      // Path 2 (path-a): Events → Pub/Sub → (Microservices greyed + ETL + Data Hub + Analytics)
      { componentId: 'events_left', delay: 0, type: 'component' },
      { componentId: 'pub_sub', delay: 0, type: 'component' },
      { componentId: 'arrow-events-pubsub', delay: 1000, type: 'arrow' },
      // Show greyed out microservices path and ETL/data hub/analytics at same time
      { componentId: 'arrow-pubsub-microservices', delay: 2000, type: 'arrow' },
      { componentId: 'microservices', delay: 2000, type: 'component' },
      { componentId: 'etl', delay: 2000, type: 'component' },
      { componentId: 'data_hub', delay: 2000, type: 'component' },
      { componentId: 'analytics', delay: 2000, type: 'component' },
      // Forked arrows (main → horizontal → down to both sides) and data stores appear together
      { componentId: 'arrow-pubsub-fork-main', delay: 2500, type: 'arrow' },
      { componentId: 'arrow-fork-horizontal', delay: 2500, type: 'arrow' },
      { componentId: 'arrow-fork-etl', delay: 2500, type: 'arrow' },
      { componentId: 'arrow-fork-datahub', delay: 2500, type: 'arrow' },
      { componentId: 'ods', delay: 2500, type: 'component' },
      { componentId: 'sds', delay: 2500, type: 'component' },
      { componentId: 'ads', delay: 2500, type: 'component' },
      // Data Warehouse appears in cascade effect when bubbles reach fork
      { componentId: 'data_warehouse', delay: 2500, type: 'component' },
      // Intermittent arrows to DWH appear shortly after
      { componentId: 'arrow-etl-dwh', delay: 3000, type: 'arrow' },
      { componentId: 'arrow-sds-dwh', delay: 3000, type: 'arrow' },
    ],
    'path-b': [
      // Path 3 (path-b): File → ETL → Data Warehouse → Analytics (Core & DBs are static)
      { componentId: 'file_left', delay: 0, type: 'component' },
      { componentId: 'arrow-file-etl', delay: 2000, type: 'arrow' },
      { componentId: 'etl', delay: 4000, type: 'component' },
      { componentId: 'arrow-pubsub-etl', delay: 5000, type: 'arrow' },
      { componentId: 'arrow-etl-warehouse', delay: 6000, type: 'arrow' },
      { componentId: 'data_warehouse', delay: 8000, type: 'component' },
      { componentId: 'arrow-warehouse-analytics', delay: 10000, type: 'arrow' },
      { componentId: 'analytics', delay: 12000, type: 'component' },
    ],
  }

  // Play animation sequence
  const playSequence = useCallback(() => {
    setPlaybackState('playing')
    setCurrentStep(0)

    // Trigger spawning restart for Path 1 and Path 2
    if (selectedPath === 'path-c' || selectedPath === 'path-a') {
      setSpawningTrigger(prev => prev + 1)
    }

    const sequence = animationSequences[selectedPath]
    const timers: ReturnType<typeof setTimeout>[] = []
    sequence.forEach((step, index) => {
      const timer = setTimeout(() => {
        setVisibleComponents((prev) => new Set([...prev, step.componentId]))
        setAllAnimatedComponents((prev) => new Set([...prev, step.componentId]))
        setCurrentStep(index + 1)
        if (index === sequence.length - 1) {
          setPlaybackState('completed')
        }
      }, step.delay)
      timers.push(timer)
    })
    return () => timers.forEach(clearTimeout)
  }, [selectedPath, animationSequences])

  // Track completed paths and trigger combined mode when both Path 1 and Path 2 are done
  useEffect(() => {
    if (playbackState === 'completed' && (selectedPath === 'path-c' || selectedPath === 'path-a')) {
      // Mark this path as completed
      setCompletedPaths((prev) => new Set([...prev, selectedPath]))
    }
  }, [playbackState, selectedPath])

  // When both Path 1 and Path 2 are completed, show combined animation
  useEffect(() => {
    if (completedPaths.has('path-c') && completedPaths.has('path-a')) {
      // Ungrey everything
      setGreyedComponents(new Set())

      // Show all components from both paths
      const allPath1And2Components = new Set<string>()
      animationSequences['path-c'].forEach(step => allPath1And2Components.add(step.componentId))
      animationSequences['path-a'].forEach(step => allPath1And2Components.add(step.componentId))
      setVisibleComponents(allPath1And2Components)
      setAllAnimatedComponents(allPath1And2Components)

      // Continue spawning both business and data events
      setSpawningTrigger(prev => prev + 1)
    }
  }, [completedPaths, animationSequences])

  // Select path and automatically start playing
  const selectAndPlayPath = (path: AnimationPath) => {
    // Reset current state
    setPlaybackState('idle')
    setVisibleComponents(new Set())
    setAllAnimatedComponents(new Set())
    setCurrentStep(0)
    setActiveDataFlows([])
    setGreyedComponents(new Set())
    setCompletedPaths(new Set()) // Reset completed paths tracking when replaying
    // Clear spawning interval
    if (spawningIntervalRef.current) {
      clearInterval(spawningIntervalRef.current)
      spawningIntervalRef.current = null
    }

    // Set new path
    setSelectedPath(path)

    // Set greyed out components for Path 2
    if (path === 'path-a') {
      setGreyedComponents(new Set(['arrow-pubsub-microservices', 'microservices']))
    }

    // Trigger spawning restart for Path 1 and Path 2
    if (path === 'path-c' || path === 'path-a') {
      setSpawningTrigger(prev => prev + 1)
    }

    // Start playing after a brief delay to ensure state updates
    setTimeout(() => {
      setPlaybackState('playing')
      setCurrentStep(0)
      const sequence = animationSequences[path]
      const timers: ReturnType<typeof setTimeout>[] = []
      sequence.forEach((step, index) => {
        const timer = setTimeout(() => {
          setVisibleComponents((prev) => new Set([...prev, step.componentId]))
          setAllAnimatedComponents((prev) => new Set([...prev, step.componentId]))
          setCurrentStep(index + 1)
          if (index === sequence.length - 1) {
            setPlaybackState('completed')
          }
        }, step.delay)
        timers.push(timer)
      })
    }, 100)
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default if it's one of our keys
      if (['1', '2', '3', ' '].includes(e.key)) {
        e.preventDefault()
      }

      switch (e.key) {
        case '1':
          if (playbackState === 'idle' || playbackState === 'completed') {
            setSelectedPath('path-c')
            setTimeout(playSequence, 100)
          }
          break
        case '2':
          if (playbackState === 'idle' || playbackState === 'completed') {
            setSelectedPath('path-a')
            setTimeout(playSequence, 100)
          }
          break
        case '3':
          if (playbackState === 'idle' || playbackState === 'completed') {
            setSelectedPath('path-b')
            setTimeout(playSequence, 100)
          }
          break
        case ' ':
          if (playbackState === 'playing') {
            setPlaybackState('paused')
          } else if (playbackState === 'paused') {
            setPlaybackState('playing')
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [playbackState, playSequence])

  const handlePlayPause = () => {
    if (playbackState === 'idle' || playbackState === 'completed') {
      playSequence()
    } else if (playbackState === 'playing') {
      setPlaybackState('paused')
    } else if (playbackState === 'paused') {
      setPlaybackState('playing')
    }
  }

  const handleReset = () => {
    setPlaybackState('idle')
    setVisibleComponents(new Set())
    setAllAnimatedComponents(new Set())
    setCurrentStep(0)
    setActiveDataFlows([])
    setGreyedComponents(new Set())
    setCompletedPaths(new Set()) // Reset completed paths tracking
    // Clear spawning interval
    if (spawningIntervalRef.current) {
      clearInterval(spawningIntervalRef.current)
      spawningIntervalRef.current = null
    }
  }

  const handleStepForward = () => {
    const sequence = animationSequences[selectedPath]
    if (currentStep < sequence.length) {
      const step = sequence[currentStep]
      setVisibleComponents((prev) => new Set([...prev, step.componentId]))
      setAllAnimatedComponents((prev) => new Set([...prev, step.componentId]))
      setCurrentStep(currentStep + 1)
      if (currentStep === sequence.length - 1) {
        setPlaybackState('completed')
      }
    }
  }

  const handleStepBack = () => {
    if (currentStep > 0) {
      const sequence = animationSequences[selectedPath]
      const step = sequence[currentStep - 1]
      setVisibleComponents((prev) => {
        const newSet = new Set(prev)
        newSet.delete(step.componentId)
        return newSet
      })
      setCurrentStep(currentStep - 1)
      if (playbackState === 'completed') {
        setPlaybackState('paused')
      }
    }
  }

  // Check if a component is part of the current path
  const isComponentInPath = (componentId: string): boolean => {
    return animationSequences[selectedPath].some(step => step.componentId === componentId)
  }

  // Spawn Business Event dots for Path 1 and Path 2 (Event-Driven paths)
  useEffect(() => {
    console.log('[Spawning] useEffect triggered - selectedPath:', selectedPath, 'trigger:', spawningTrigger)

    // Only spawn for Path 1 and Path 2
    if (selectedPath !== 'path-c' && selectedPath !== 'path-a') {
      console.log('[Spawning] Not Path 1 or Path 2, cleaning up')
      if (spawningIntervalRef.current) {
        clearInterval(spawningIntervalRef.current)
        spawningIntervalRef.current = null
      }
      return
    }

    // Don't start spawning if trigger is 0 (initial state)
    if (spawningTrigger === 0) {
      console.log('[Spawning] Initial state, waiting for trigger')
      return
    }

    console.log('[Spawning] Path 1 or 2 selected, starting spawning timeout (1300ms)')
    // For Path 1/2, animation starts at 100ms, arrows appear at 1100ms, so start spawning dots at 1300ms
    const startSpawningTimeout = setTimeout(() => {
      console.log('[Spawning] Timeout fired - spawning first Business Event')
      // Spawn first Business Event immediately
      const now = Date.now()
      setActiveDataFlows([{
        id: `business-${now}`,
        type: 'business',
        pathId: 'arrow-events-pubsub',
        startTime: now,
        segment: 'events-pubsub'
      }])

      // Spawn first Data Event 1.5s after first Business Event
      setTimeout(() => {
        console.log('[Spawning] Spawning first Data Event')
        const now = Date.now()
        setActiveDataFlows((prev) => [
          ...prev,
          {
            id: `data-${now}`,
            type: 'data',
            pathId: 'arrow-events-pubsub',
            startTime: now,
            segment: 'events-pubsub'
          }
        ])
      }, 1500)

      console.log('[Spawning] Setting up interval for Business Events (every 3.5s)')
      // Then spawn a new Business Event every 3.5 seconds
      spawningIntervalRef.current = setInterval(() => {
        console.log('[Spawning] Interval firing - spawning Business Event')
        const businessNow = Date.now()
        setActiveDataFlows((prev) => [
          ...prev,
          {
            id: `business-${businessNow}`,
            type: 'business',
            pathId: 'arrow-events-pubsub',
            startTime: businessNow,
            segment: 'events-pubsub'
          }
        ])

        // Spawn Data Event 1.5s after each Business Event
        setTimeout(() => {
          console.log('[Spawning] Spawning Data Event')
          const dataNow = Date.now()
          setActiveDataFlows((prev) => [
            ...prev,
            {
              id: `data-${dataNow}`,
              type: 'data',
              pathId: 'arrow-events-pubsub',
              startTime: dataNow,
              segment: 'events-pubsub'
            }
          ])
        }, 1500)
      }, 3500)
      console.log('[Spawning] Interval set up')
    }, 1300) // Start after arrows appear (animation starts at 100ms, arrows at 1100ms, spawn at 1300ms)

    return () => {
      console.log('[Spawning] Cleanup function called')
      clearTimeout(startSpawningTimeout)
      if (spawningIntervalRef.current) {
        clearInterval(spawningIntervalRef.current)
        spawningIntervalRef.current = null
      }
    }
  }, [selectedPath, spawningTrigger]) // Depend on both path and trigger

  // Cleanup completed dots and handle transitions between segments
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setActiveDataFlows((prev) => {
        const updated: DataFlowDot[] = []
        prev.forEach((dot) => {
          const age = now - dot.startTime

          if (dot.segment === 'events-pubsub') {
            // Duration: 2 seconds for this segment
            if (age < 2000) {
              updated.push(dot)
            } else if (age >= 2000 && age < 2100) {
              if (dot.type === 'business') {
                // Business events transition to microservices (both Path 1 and Path 2)
                updated.push({
                  ...dot,
                  segment: 'pubsub-microservices',
                  pathId: 'arrow-pubsub-microservices',
                  startTime: now
                })
              } else if (dot.type === 'data' && selectedPath === 'path-a') {
                // Data events in Path 2 transition to fork vertical segment
                updated.push({
                  ...dot,
                  segment: 'pubsub-fork-main',
                  pathId: 'arrow-pubsub-fork-main',
                  startTime: now
                })
              }
              // Data events in Path 1 end at Pub/Sub (not transitioned)
            }
          } else if (dot.segment === 'pubsub-microservices') {
            // Duration: 2 seconds for this segment
            if (age < 2000) {
              updated.push(dot)
            }
            // Remove after completing this segment
          } else if (dot.segment === 'pubsub-fork-main') {
            // Vertical segment of the fork (Path 2 data events only)
            // Duration: 1 second for this short vertical segment
            if (age < 1000) {
              updated.push(dot)
            } else if (age >= 1000 && age < 1100) {
              // Split into two dots at fork center: one goes left, one goes right
              updated.push({
                ...dot,
                id: `${dot.id}-left`,
                segment: 'fork-horizontal-left',
                pathId: 'arrow-fork-horizontal-left',
                startTime: now
              })
              updated.push({
                ...dot,
                id: `${dot.id}-right`,
                segment: 'fork-horizontal-right',
                pathId: 'arrow-fork-horizontal-right',
                startTime: now
              })
            }
          } else if (dot.segment === 'fork-horizontal-left') {
            // Horizontal left segment (center to left)
            // Duration: 0.8 seconds
            if (age < 800) {
              updated.push(dot)
            } else if (age >= 800 && age < 900) {
              // Transition to vertical down to ETL
              updated.push({
                ...dot,
                segment: 'fork-etl',
                pathId: 'arrow-fork-etl',
                startTime: now
              })
            }
          } else if (dot.segment === 'fork-horizontal-right') {
            // Horizontal right segment (center to right)
            // Duration: 0.8 seconds
            if (age < 800) {
              updated.push(dot)
            } else if (age >= 800 && age < 900) {
              // Transition to vertical down to Data Hub
              updated.push({
                ...dot,
                segment: 'fork-datahub',
                pathId: 'arrow-fork-datahub',
                startTime: now
              })
            }
          } else if (dot.segment === 'fork-etl' || dot.segment === 'fork-datahub') {
            // Vertical segments to ETL and Data Hub
            // Duration: 1 second for these segments
            if (age < 1000) {
              updated.push(dot)
            }
            // Remove after completing
          }
        })
        return updated
      })
    }, 50) // Check every 50ms for smooth animation

    return () => clearInterval(interval)
  }, [selectedPath])

  const pathDescriptions = {
    'path-c': 'Event-Driven Path: Core → Events → Pub/Sub → Microservices',
    'path-a': 'Event-Driven Path: Core → Events → Pub/Sub → Data Hub + Analytics (Data Events only)',
    'path-b': 'ETL Path: Core → File → ETL → Data Warehouse → Analytics',
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col space-y-4">
      {/* Merged Controls Panel with Description */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4 flex-shrink-0">
        {/* Description at top */}
        <p className="text-gray-700 leading-relaxed text-center">
          Visualizing data flow patterns in Temenos architecture. Select a path and watch how data moves through the system.
        </p>

        {/* Path Selection and Playback Controls in one row */}
        <div className="flex items-center justify-between gap-6">
          {/* Path Selection - Left side */}
          <div className="flex flex-1 space-x-3">
            <button
              onClick={() => selectAndPlayPath('path-c')}
              disabled={playbackState === 'playing'}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                selectedPath === 'path-c'
                  ? 'border-[#283054] bg-[#283054] text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-[#283054]'
              } ${playbackState === 'playing' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-sm font-semibold">Path 1</div>
              <div className="text-xs mt-1 opacity-90">Event Driven: Business Events (only)</div>
            </button>

            <button
              onClick={() => selectAndPlayPath('path-a')}
              disabled={playbackState === 'playing'}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                selectedPath === 'path-a'
                  ? 'border-[#283054] bg-[#283054] text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-[#283054]'
              } ${playbackState === 'playing' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-sm font-semibold">Path 2</div>
              <div className="text-xs mt-1 opacity-90">Event Driven: Data Events</div>
            </button>

            <button
              onClick={() => setSelectedPath('path-b')}
              disabled={playbackState === 'playing'}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                selectedPath === 'path-b'
                  ? 'border-[#283054] bg-[#283054] text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-[#283054]'
              } ${playbackState === 'playing' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="text-sm font-semibold">Path 3 (Key: 3)</div>
              <div className="text-xs mt-1 opacity-90">ETL Pipeline</div>
            </button>
          </div>

          {/* Playback Controls - Right side */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={handleStepBack}
              disabled={currentStep === 0 || playbackState === 'playing'}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Step Back"
            >
              <SkipBack className="w-5 h-5 text-[#283054]" />
            </button>

            <button
              onClick={handlePlayPause}
              className="p-3 rounded-lg bg-[#283054] hover:bg-[#1a1f3a] text-white transition-colors"
              title={playbackState === 'playing' ? 'Pause (Space)' : 'Play (Space)'}
            >
              {playbackState === 'playing' ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={handleStepForward}
              disabled={currentStep >= animationSequences[selectedPath].length || playbackState === 'playing'}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Step Forward"
            >
              <SkipForward className="w-5 h-5 text-[#283054]" />
            </button>

            <button
              onClick={handleReset}
              disabled={playbackState === 'idle'}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium text-[#283054]"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Current Path Description */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm font-medium text-[#283054] text-center">{pathDescriptions[selectedPath]}</p>
        </div>
      </div>

      {/* Diagram Canvas - Dynamically expands to fill available space */}
      <div className="bg-white rounded-lg shadow-sm p-6 flex-1 flex flex-col min-h-0">
        {/* Responsive Container with specified styling */}
        <div className="overflow-auto flex justify-center items-center h-full">
          <div className="relative rounded-lg border-2 p-4"
               style={{
                 width: '1200px',
                 height: '520px',
                 backgroundColor: '#F4F4F6',
                 borderColor: '#3CB5A6',
                 borderRadius: '8px'
               }}>
          {/* Content area for components */}

          {/* SVG Layer for Arrows and Data Flow Dots */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
            {/* Define arrow markers */}
            <defs>
              {/* Arrow head for Path 1 and Path 2 (Event-Driven) - dark blue - refined design */}
              <marker
                id="arrowhead-path1"
                markerWidth="6"
                markerHeight="6"
                refX="5.5"
                refY="2"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,4 L5.5,2 z" fill="#293276" />
              </marker>

              {/* Generic arrow head for other paths - refined design */}
              <marker
                id="arrowhead-generic"
                markerWidth="6"
                markerHeight="6"
                refX="5.5"
                refY="2"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,4 L5.5,2 z" fill="#3B82F6" />
              </marker>

              {/* Cyan arrow head for DWH arrows - refined design */}
              <marker
                id="arrowhead-cyan"
                markerWidth="6"
                markerHeight="6"
                refX="5.5"
                refY="2"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,4 L5.5,2 z" fill="#00B0F0" />
              </marker>

              {/* CSS Animation for dashed arrows */}
              <style>
                {`
                  @keyframes dashFlow {
                    from {
                      stroke-dashoffset: 0;
                    }
                    to {
                      stroke-dashoffset: -10;
                    }
                  }
                  .animated-dash {
                    animation: dashFlow 0.8s linear infinite;
                  }
                `}
              </style>
            </defs>

            {/* Render arrows */}
            {arrows.map((arrow) => {
              const isVisible = visibleComponents.has(arrow.id)

              if (!isVisible) return null

              // Check if this arrow should be greyed out
              const isGreyed = greyedComponents.has(arrow.id)

              // Determine which marker to use
              const isDarkBlueArrow = arrow.id === 'arrow-events-pubsub' ||
                                      arrow.id === 'arrow-pubsub-microservices' ||
                                      arrow.id === 'arrow-fork-etl' ||
                                      arrow.id === 'arrow-fork-datahub'
              const isCyanArrow = arrow.id === 'arrow-etl-dwh' || arrow.id === 'arrow-sds-dwh'

              let markerEnd = undefined
              if (isDarkBlueArrow) {
                markerEnd = 'url(#arrowhead-path1)'
              } else if (isCyanArrow) {
                markerEnd = 'url(#arrowhead-cyan)'
              }

              // Add animated class for cyan DWH arrows
              const pathClassName = isCyanArrow ? 'animated-dash' : ''

              return (
                <g key={arrow.id}>
                  {/* Static dashed arrows */}
                  <path
                    d={arrow.points}
                    stroke={arrow.color || '#3B82F6'}
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={arrow.dashArray}
                    markerEnd={markerEnd}
                    opacity={isGreyed ? 0.3 : 1}
                    style={isGreyed ? { filter: 'grayscale(100%)' } : {}}
                    className={pathClassName}
                  />
                  {arrow.label && (
                    <text
                      x={parseFloat(arrow.points.split(' ')[1])}
                      y={parseFloat(arrow.points.split(' ')[2]) - 10}
                      fill={arrow.color || '#3B82F6'}
                      fontSize="12"
                      fontWeight="600"
                      opacity={isGreyed ? 0.3 : 1}
                    >
                      {arrow.label}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Render Data Flow Dots */}
            {(() => {
              if (activeDataFlows.length > 0) {
                console.log('[Rendering] Rendering', activeDataFlows.length, 'dots')
              }
              return null
            })()}
            {activeDataFlows.map((dot) => {
              const age = Date.now() - dot.startTime
              // Adjust duration based on segment
              let segmentDuration = 2000 // Default for main segments
              if (dot.segment === 'pubsub-fork-main' || dot.segment === 'fork-etl' || dot.segment === 'fork-datahub') {
                segmentDuration = 1000 // Short vertical segments
              } else if (dot.segment === 'fork-horizontal-left' || dot.segment === 'fork-horizontal-right') {
                segmentDuration = 800 // Horizontal fork segments
              }
              const progress = Math.min(age / segmentDuration, 1)

              // Get path coordinates
              const arrow = arrows.find(a => a.id === dot.pathId)
              if (!arrow) {
                console.log('[Rendering] Arrow not found for dot:', dot.pathId)
                return null
              }

              // Parse start and end points from SVG path
              const pathParts = arrow.points.split(' ')
              const startX = parseFloat(pathParts[1])
              const startY = parseFloat(pathParts[2])
              const endX = parseFloat(pathParts[4])
              const endY = parseFloat(pathParts[5])

              // Calculate current position along path
              const currentX = startX + (endX - startX) * progress
              const currentY = startY + (endY - startY) * progress

              // Set color and label based on event type
              // Business Event color: RGB(92, 184, 178) = #5CB8B2
              // Data Event color: RGB(130, 70, 175) = #8246AF
              const dotColor = dot.type === 'business' ? '#5CB8B2' : '#8246AF'
              const label = dot.type === 'business' ? 'Business Event' : 'Data Event'

              // Determine if this dot should be greyed out (Path 2 business events on microservices path)
              const isDotGreyed = selectedPath === 'path-a' &&
                                 dot.type === 'business' &&
                                 dot.segment === 'pubsub-microservices'

              return (
                <g key={dot.id}>
                  {/* Glow effect */}
                  <circle
                    cx={currentX}
                    cy={currentY}
                    r="8"
                    fill={dotColor}
                    opacity={isDotGreyed ? 0.1 : 0.3}
                    style={isDotGreyed ? { filter: 'grayscale(100%)' } : {}}
                  />
                  {/* Main dot */}
                  <circle
                    cx={currentX}
                    cy={currentY}
                    r="6"
                    fill={dotColor}
                    opacity={isDotGreyed ? 0.3 : 1}
                    style={isDotGreyed ? { filter: 'grayscale(100%)' } : {}}
                  />
                  {/* Label */}
                  <text
                    x={currentX}
                    y={currentY - 15}
                    fill="#1F2937"
                    fontSize="11"
                    fontWeight="600"
                    textAnchor="middle"
                    opacity={isDotGreyed ? 0.3 : 1}
                    style={{
                      textShadow: '0 0 3px white, 0 0 3px white'
                    }}
                  >
                    {label}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Render static components (always visible) */}
          {staticComponents.map((component) => {
            const isHovered = hoveredComponent === component.id

            return (
              <div
                key={component.id}
                className="absolute"
                style={{
                  left: `${component.position.x}px`,
                  top: `${component.position.y}px`,
                  width: `${component.position.width}px`,
                  height: `${component.position.height}px`,
                  zIndex: 2,
                }}
                onMouseEnter={() => setHoveredComponent(component.id)}
                onMouseLeave={() => setHoveredComponent(null)}
              >
                {/* Component Image */}
                <div className="w-full h-full relative">
                  <img
                    src={`/images/data-architecture/components/${component.image}`}
                    alt={component.label}
                    className="w-full h-full object-contain"
                  />

                  {/* Tooltip */}
                  <AnimatePresence>
                    {isHovered && component.tooltip && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50"
                        style={{ pointerEvents: 'none' }}
                      >
                        {component.tooltip}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}

          {/* Render animated components */}
          {animatedComponents.map((component) => {
            const isHovered = hoveredComponent === component.id
            const isVisible = visibleComponents.has(component.id)
            const wasAnimated = allAnimatedComponents.has(component.id)
            const isInCurrentPath = isComponentInPath(component.id)
            const isGreyed = greyedComponents.has(component.id)

            // Determine opacity based on animation state
            let opacity = 1
            if (!isVisible) {
              opacity = 0
            } else if (isGreyed) {
              opacity = 0.3 // Grey out specified components (e.g., microservices in Path 2)
            } else if (wasAnimated && !isInCurrentPath) {
              opacity = 0.3 // Grey out components not in current path
            }

            return (
              <motion.div
                key={component.id}
                className="absolute"
                style={{
                  left: `${component.position.x}px`,
                  top: `${component.position.y}px`,
                  width: `${component.position.width}px`,
                  height: `${component.position.height}px`,
                  zIndex: 2,
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity,
                  scale: isVisible ? 1 : 0.8,
                  filter: (isGreyed || (wasAnimated && !isInCurrentPath)) ? 'grayscale(100%)' : 'grayscale(0%)'
                }}
                transition={{ duration: 0.5 }}
                onMouseEnter={() => setHoveredComponent(component.id)}
                onMouseLeave={() => setHoveredComponent(null)}
              >
                {/* Component Image */}
                <div className="w-full h-full relative">
                  <img
                    src={`/images/data-architecture/components/${component.image}`}
                    alt={component.label}
                    className="w-full h-full object-contain"
                  />

                  {/* Tooltip */}
                  <AnimatePresence>
                    {isHovered && component.tooltip && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50"
                        style={{ pointerEvents: 'none' }}
                      >
                        {component.tooltip}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}

          {/* Legend - Bottom right */}
          <div className="absolute" style={{ bottom: '16px', right: '16px', zIndex: 10 }}>
            <div className="bg-white p-3 rounded-lg shadow-md border border-gray-200 text-xs space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: '#283054' }}></div>
                <span className="font-medium">temenos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: '#8B5CF6' }}></div>
                <span className="font-medium">Client Name</span>
              </div>
            </div>
          </div>

          </div>
        </div>
      </div>
    </div>
  )
}
