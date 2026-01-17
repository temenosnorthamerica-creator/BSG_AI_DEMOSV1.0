import { useState } from 'react'
import { BookOpen, Video, MessageSquare, Play } from 'lucide-react'
import { ContentViewer } from '../components/ContentViewer'
import { VideoPlayer } from '../components/VideoPlayer'
import { Chatbot } from '../components/Chatbot'
import { DemoFrame } from '../components/DemoFrame'
import { ObservabilityContent } from '../components/observability/ObservabilityContent'
import { DeploymentAnalyzer } from '../components/deployment/DeploymentAnalyzer'
import { DeploymentContentViewer } from '../components/deployment/DeploymentContentViewer'
import { DataArchitectureContent } from '../components/data-architecture/DataArchitectureContent'
import type { ComponentId } from '../types'

interface ComponentPageProps {
  componentId: ComponentId
}

type Tab = 'content' | 'video' | 'demo' | 'chatbot'

export function ComponentPage({ componentId }: ComponentPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('content')

  // For deployment component, exclude video tab and rename chatbot
  const tabs = componentId === 'deployment' 
    ? [
        { id: 'content' as Tab, label: 'Content', icon: BookOpen },
        { id: 'demo' as Tab, label: 'Demo', icon: Play },
        { id: 'chatbot' as Tab, label: 'BSG-Guru', icon: MessageSquare },
      ]
    : [
        { id: 'content' as Tab, label: 'Content', icon: BookOpen },
        { id: 'video' as Tab, label: 'Videos', icon: Video },
        { id: 'demo' as Tab, label: 'Demo', icon: Play },
        { id: 'chatbot' as Tab, label: 'Chatbot', icon: MessageSquare },
      ]

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b-2 border-gray-300 bg-white dark:bg-gray-800 rounded-t-lg px-2 pt-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors rounded-t-lg ${
                activeTab === tab.id
                  ? 'border-[#283054] text-[#283054] font-semibold bg-gray-50 dark:bg-gray-700'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-[#283054] hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'content' && (
          componentId === 'observability' ? (
            <ObservabilityContent />
          ) : componentId === 'deployment' ? (
            <DeploymentContentViewer />
          ) : componentId === 'data-architecture' ? (
            <DataArchitectureContent />
          ) : (
            <ContentViewer componentId={componentId} />
          )
        )}
        {activeTab === 'video' && <VideoPlayer componentId={componentId} />}
        {activeTab === 'demo' && (
          componentId === 'deployment' ? (
            <DeploymentAnalyzer />
          ) : (
            <DemoFrame componentId={componentId} />
          )
        )}
        {activeTab === 'chatbot' && <Chatbot componentId={componentId} />}
      </div>
    </div>
  )
}

