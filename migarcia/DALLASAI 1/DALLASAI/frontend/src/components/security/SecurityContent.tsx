import { useState } from 'react'
import { FileSearch, Presentation, Shield } from 'lucide-react'
import { SecurityDocumentSearch } from './SecurityDocumentSearch'
import { SecurityPresentations } from './SecurityPresentations'
import { TrustSaaSDocuments } from './TrustSaaSDocuments'

type SecurityTab = 'document-search' | 'presentations' | 'trust-saas'

export function SecurityContent() {
  const [activeTab, setActiveTab] = useState<SecurityTab>('document-search')

  const tabs = [
    {
      id: 'document-search' as SecurityTab,
      name: 'Security Document Search',
      label: 'Security Document Search',
      icon: FileSearch,
    },
    {
      id: 'presentations' as SecurityTab,
      name: 'Security Presentations',
      label: 'Security Presentations',
      icon: Presentation,
    },
    {
      id: 'trust-saas' as SecurityTab,
      name: 'Trust SaaS Documents',
      label: 'Trust SaaS Documents',
      icon: Shield,
    },
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
        {activeTab === 'document-search' && <SecurityDocumentSearch />}
        {activeTab === 'presentations' && <SecurityPresentations />}
        {activeTab === 'trust-saas' && <TrustSaaSDocuments />}
      </div>
    </div>
  )
}

