import { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  CreditCard,
  Smartphone,
  ArrowLeftRight,
  UserPlus,
  UserSearch,
  Shield,
  Wallet,
  Heart,
  FileText,
  BarChart3,
  CheckCircle,
  UserCheck,
  Layers,
  MessageCircle,
  Send,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { ApplicationType, JourneyStep, CRMAction } from '../types';
import { bankingApplications } from '../data/bankingApps';
import TechnicalFlowPanel from '../components/TechnicalFlowPanel';
import { useOnboarding } from '../hooks/useOnboarding';

interface SimulatorPageProps {
  selectedApp: ApplicationType | null;
  setSelectedApp: (app: ApplicationType | null) => void;
  darkMode: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  CreditCard: <CreditCard size={24} />,
  Smartphone: <Smartphone size={24} />,
  ArrowLeftRight: <ArrowLeftRight size={24} />,
  UserPlus: <UserPlus size={24} />,
  UserSearch: <UserSearch size={20} />,
  Shield: <Shield size={20} />,
  Wallet: <Wallet size={20} />,
  Heart: <Heart size={20} />,
  FileText: <FileText size={20} />,
  BarChart3: <BarChart3 size={20} />,
  CheckCircle: <CheckCircle size={20} />,
  UserCheck: <UserCheck size={20} />,
  Layers: <Layers size={20} />,
  MessageCircle: <MessageCircle size={20} />,
  Send: <Send size={20} />,
  RefreshCw: <RefreshCw size={20} />,
  CheckCircle2: <CheckCircle2 size={20} />
};

// API Execution Result interface
interface APIExecutionResult {
  actionId: string;
  success: boolean;
  response?: unknown;
  error?: string;
  timestamp: Date;
}

export default function SimulatorPage({ selectedApp, setSelectedApp, darkMode }: SimulatorPageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeAction, setActiveAction] = useState<CRMAction | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState<Map<string, APIExecutionResult>>(new Map());
  const [lastApiResponse, setLastApiResponse] = useState<unknown>(null);

  // Onboarding hook for real API calls
  const {
    state: onboardingState,
    handleCreateCustomer,
    handleCreateAccount,
    reset: resetOnboarding,
  } = useOnboarding();

  const currentApplication = selectedApp
    ? bankingApplications.find((app) => app.id === selectedApp)
    : null;

  useEffect(() => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setActiveAction(null);
    setIsSimulating(false);
  }, [selectedApp]);

  useEffect(() => {
    if (isSimulating && currentApplication) {
      const timer = setTimeout(() => {
        if (currentStep < currentApplication.journeySteps.length - 1) {
          setCompletedSteps((prev) => new Set([...prev, currentStep]));
          setCurrentStep((prev) => prev + 1);
        } else {
          setCompletedSteps((prev) => new Set([...prev, currentStep]));
          setIsSimulating(false);
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isSimulating, currentStep, currentApplication]);

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    if (currentApplication) {
      const step = currentApplication.journeySteps[index];
      if (step.crmActions.length > 0) {
        setActiveAction(step.crmActions[0]);
      }
    }
  };

  const handleActionClick = (action: CRMAction) => {
    setActiveAction(action);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setActiveAction(null);
    setIsSimulating(false);
    setExecutionResults(new Map());
    setLastApiResponse(null);
    resetOnboarding();
  };

  // Execute API call for the active action
  const handleExecuteAPI = async () => {
    if (!activeAction || activeAction.type !== 'api') return;

    setIsExecuting(true);
    let result: APIExecutionResult;

    try {
      // Handle specific API actions
      if (activeAction.id === 'create-customer') {
        const response = await handleCreateCustomer();
        result = {
          actionId: activeAction.id,
          success: response.success,
          response: response.data,
          error: response.error,
          timestamp: new Date(),
        };
        setLastApiResponse(response.data);
      } else if (activeAction.id === 'create-account') {
        // Use the customer ID from onboarding state or a placeholder
        const customerId = onboardingState.customerId || 'DEMO_CUSTOMER';
        const response = await handleCreateAccount(customerId);
        result = {
          actionId: activeAction.id,
          success: response.success,
          response: response.data,
          error: response.error,
          timestamp: new Date(),
        };
        setLastApiResponse(response.data);
      } else {
        // For other APIs, simulate the response
        result = {
          actionId: activeAction.id,
          success: true,
          response: {
            message: 'Simulated response',
            payload: activeAction.payload,
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date(),
        };
        setLastApiResponse(result.response);
      }
    } catch (error) {
      result = {
        actionId: activeAction.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }

    setExecutionResults((prev) => new Map(prev).set(activeAction.id, result));
    setIsExecuting(false);
  };

  if (!selectedApp) {
    return (
      <div className="pt-20 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              CRM Banking Ecosystem Simulator
            </h1>
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Explore how CRM integrates with Temenos Core Banking across different banking applications
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bankingApplications.map((app) => (
              <button
                key={app.id}
                onClick={() => setSelectedApp(app.id as ApplicationType)}
                className={`card text-left hover:scale-[1.02] transition-transform ${
                  darkMode ? 'bg-surface-card-dark border-gray-700' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${app.color}20` }}
                  >
                    <span style={{ color: app.color }}>
                      {iconMap[app.icon]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{app.name}</h3>
                    <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {app.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm" style={{ color: app.color }}>
                      <span>{app.journeySteps.length} Journey Steps</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 h-screen flex">
      {/* Left Panel - Business User Journey (70%) */}
      <div className="w-[70%] p-6 overflow-y-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {currentApplication && (
                <>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${currentApplication.color}20` }}
                  >
                    <span style={{ color: currentApplication.color }}>
                      {iconMap[currentApplication.icon]}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{currentApplication.name}</h2>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Business User Journey
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="btn-secondary flex items-center gap-2"
              >
                <RotateCcw size={16} />
                Reset
              </button>
              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className="btn-primary flex items-center gap-2"
              >
                {isSimulating ? <Pause size={16} /> : <Play size={16} />}
                {isSimulating ? 'Pause' : 'Simulate'}
              </button>
            </div>
          </div>
        </div>

        {/* Journey Steps */}
        <div className="space-y-4">
          {currentApplication?.journeySteps.map((step, index) => (
            <JourneyStepCard
              key={step.id}
              step={step}
              index={index}
              isActive={currentStep === index}
              isCompleted={completedSteps.has(index)}
              onClick={() => handleStepClick(index)}
              onActionClick={handleActionClick}
              activeAction={activeAction}
              darkMode={darkMode}
              appColor={currentApplication.color}
            />
          ))}
        </div>
      </div>

      {/* Right Panel - Technical Flow (30%) */}
      <div className={`w-[30%] border-l ${darkMode ? 'border-gray-700 bg-surface-card-dark' : 'border-gray-200 bg-gray-50'}`}>
        <TechnicalFlowPanel
          activeAction={activeAction}
          currentStep={currentApplication?.journeySteps[currentStep] || null}
          darkMode={darkMode}
          appColor={currentApplication?.color || '#283054'}
          onExecuteAPI={handleExecuteAPI}
          isExecuting={isExecuting}
          lastApiResponse={lastApiResponse}
          executionResult={
            activeAction && executionResults.has(activeAction.id)
              ? {
                  success: executionResults.get(activeAction.id)!.success,
                  error: executionResults.get(activeAction.id)!.error,
                }
              : null
          }
        />
      </div>
    </div>
  );
}

interface JourneyStepCardProps {
  step: JourneyStep;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
  onActionClick: (action: CRMAction) => void;
  activeAction: CRMAction | null;
  darkMode: boolean;
  appColor: string;
}

function JourneyStepCard({
  step,
  index,
  isActive,
  isCompleted,
  onClick,
  onActionClick,
  activeAction,
  darkMode,
  appColor
}: JourneyStepCardProps) {
  return (
    <div
      className={`card cursor-pointer transition-all duration-300 ${
        isCompleted ? 'opacity-75' : ''
      } ${darkMode ? 'bg-surface-card-dark' : ''}`}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: isActive ? appColor : isCompleted ? '#10B981' : 'transparent',
        boxShadow: isActive ? `0 0 0 2px white, 0 0 0 4px ${appColor}` : undefined
      }}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isActive ? 'pulse-active' : ''
            }`}
            style={{
              backgroundColor: isCompleted ? '#10B981' : isActive ? appColor : darkMode ? '#374151' : '#E5E7EB',
              color: isCompleted || isActive ? 'white' : darkMode ? '#9CA3AF' : '#6B7280'
            }}
          >
            {isCompleted ? (
              <CheckCircle size={20} />
            ) : (
              iconMap[step.icon] || <span className="font-bold">{index + 1}</span>
            )}
          </div>
          {index < 3 && (
            <div
              className="w-0.5 h-8 mt-2"
              style={{
                background: isCompleted
                  ? 'linear-gradient(to bottom, #10B981, #10B981)'
                  : `linear-gradient(to bottom, ${darkMode ? '#374151' : '#E5E7EB'}, transparent)`
              }}
            />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">{step.title}</h3>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                isActive
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : isCompleted
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {isActive ? 'In Progress' : isCompleted ? 'Completed' : 'Pending'}
            </span>
          </div>
          <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {step.description}
          </p>

          {/* CRM Actions */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              CRM Actions ({step.crmActions.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {step.crmActions.map((action) => (
                <button
                  key={action.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onActionClick(action);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    activeAction?.id === action.id
                      ? 'bg-primary text-white'
                      : action.type === 'api'
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400'
                  }`}
                >
                  {action.type === 'api' ? (
                    <span className="font-mono">{action.method}</span>
                  ) : (
                    <span>{action.eventType === 'inbound' ? '<<' : '>>'}</span>
                  )}
                  {action.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
