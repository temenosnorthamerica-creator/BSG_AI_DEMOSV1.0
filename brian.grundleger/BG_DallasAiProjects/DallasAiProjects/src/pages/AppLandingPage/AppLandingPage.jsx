import { AppLandingTemplate } from '../../components/AppLandingTemplate'
import { appLandingConfigs } from '../../data/appLandingData.jsx'
import {
  CRMIntegrationDiagram,
  BSGPlatformDiagram,
  DebitCardsDiagram,
  LMSDiagram,
  MiddlewareDiagram
} from '../../components/IntegrationDiagrams'
import {
  Users,
  Server,
  CreditCard,
  Landmark,
  Cpu
} from 'lucide-react'

// Map app IDs to their integration diagrams
const integrationDiagrams = {
  'crm-banking-simulator': CRMIntegrationDiagram,
  'bsg-demo-platform': BSGPlatformDiagram,
  'debitcards-demo': DebitCardsDiagram,
  'lms-applicant-portal': LMSDiagram,
  'middleware-demo': MiddlewareDiagram
}

// Map app IDs to their icons
const appIcons = {
  'crm-banking-simulator': Users,
  'bsg-demo-platform': Server,
  'debitcards-demo': CreditCard,
  'lms-applicant-portal': Landmark,
  'middleware-demo': Cpu
}

export function AppLandingPage({ appId, appData, onBack }) {
  const config = appLandingConfigs[appId]
  const IntegrationDiagram = integrationDiagrams[appId]
  const IconComponent = appIcons[appId]

  if (!config || !appData) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#1a2035] via-[#151b2e] to-[#0f1422]">
        <div className="text-center">
          <p className="text-white text-xl mb-4">App configuration not found</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // Enhance appData with icon component
  const enhancedAppData = {
    ...appData,
    iconComponent: IconComponent
  }

  return (
    <AppLandingTemplate
      app={enhancedAppData}
      navItems={config.navItems}
      onBack={onBack}
      IntegrationDiagram={IntegrationDiagram}
    />
  )
}

export default AppLandingPage
