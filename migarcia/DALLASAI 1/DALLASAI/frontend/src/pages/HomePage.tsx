import { Network, Database, Cloud, Shield, Eye, Palette } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ComponentId } from '../types'

interface ComponentCard {
  id: ComponentId
  name: string
  description: string
  icon: LucideIcon
  color: string
}

interface HomePageProps {
  onSelectComponent: (componentId: ComponentId) => void
}

const components: ComponentCard[] = [
  {
    id: 'integration',
    name: 'Integration, APIs & Events',
    description: 'Enterprise integration patterns and API design',
    icon: Network,
    color: 'bg-blue-500',
  },
  {
    id: 'data-architecture',
    name: 'Data Architecture',
    description: 'Database design and data modeling',
    icon: Database,
    color: 'bg-green-500',
  },
  {
    id: 'deployment',
    name: 'Deployment & Cloud',
    description: 'Container orchestration and cloud deployments',
    icon: Cloud,
    color: 'bg-purple-500',
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Application security and vulnerability management',
    icon: Shield,
    color: 'bg-red-500',
  },
  {
    id: 'observability',
    name: 'Observability',
    description: 'Monitoring, logging, and distributed tracing',
    icon: Eye,
    color: 'bg-yellow-500',
  },
  {
    id: 'design-time',
    name: 'Design Time',
    description: 'Software design principles and architecture patterns',
    icon: Palette,
    color: 'bg-indigo-500',
  },
]

export function HomePage({ onSelectComponent }: HomePageProps) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ color: '#FFFFFF' }}>
          BSG Demo Platform
        </h1>
        <p className="text-lg" style={{ color: '#FFFFFF' }}>
          Explore interactive demonstrations across multiple technical domains
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {components.map((component) => {
          const Icon = component.icon
          return (
            <button
              key={component.id}
              onClick={() => onSelectComponent(component.id)}
              className="card hover:shadow-lg transition-all duration-300 text-left group"
            >
              <div className={`w-12 h-12 ${component.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">{component.name}</h3>
              <p className="text-[#4A5568]">{component.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

