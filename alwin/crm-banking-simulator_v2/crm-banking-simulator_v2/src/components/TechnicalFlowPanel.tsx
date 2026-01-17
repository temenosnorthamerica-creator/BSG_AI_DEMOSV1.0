import { useState } from 'react';
import {
  Code,
  Zap,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Server,
  Database,
  ExternalLink,
  Play,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { CRMAction, JourneyStep } from '../types';

interface TechnicalFlowPanelProps {
  activeAction: CRMAction | null;
  currentStep: JourneyStep | null;
  darkMode: boolean;
  appColor: string;
  onExecuteAPI?: () => void;
  isExecuting?: boolean;
  lastApiResponse?: unknown;
  executionResult?: {
    success: boolean;
    error?: string;
  } | null;
}

export default function TechnicalFlowPanel({
  activeAction,
  currentStep,
  darkMode,
  appColor,
  onExecuteAPI,
  isExecuting = false,
  lastApiResponse,
  executionResult
}: TechnicalFlowPanelProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showResponse, setShowResponse] = useState(false);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Code size={20} style={{ color: appColor }} />
          Technical Flow
        </h3>
        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          CRM &lt;&gt; Temenos Integration Details
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!activeAction && !currentStep ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                darkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}
            >
              <Zap size={32} className="text-gray-400" />
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Select a banking application and click on a journey step or CRM action to view technical details
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Integration Flow Diagram */}
            <div
              className={`p-4 rounded-lg ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <h4 className="text-sm font-semibold mb-3">Integration Flow</h4>
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      darkMode ? 'bg-blue-900/30' : 'bg-blue-100'
                    }`}
                  >
                    <Server size={24} className="text-blue-500" />
                  </div>
                  <span className="text-xs mt-2 font-medium">CRM</span>
                </div>

                <div className="flex-1 flex items-center justify-center px-2">
                  {activeAction?.type === 'api' ? (
                    <div className="flex items-center">
                      <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-500 to-green-500" />
                      <ArrowRight size={16} className="text-green-500 flow-indicator" />
                    </div>
                  ) : activeAction?.eventType === 'inbound' ? (
                    <div className="flex items-center">
                      <ArrowLeft size={16} className="text-purple-500 flow-indicator" />
                      <div className="h-0.5 flex-1 bg-gradient-to-l from-purple-500 to-green-500" />
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                      <ArrowRight size={16} className="text-purple-500 flow-indicator" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      darkMode ? 'bg-green-900/30' : 'bg-green-100'
                    }`}
                  >
                    <Database size={24} className="text-green-500" />
                  </div>
                  <span className="text-xs mt-2 font-medium">Temenos</span>
                </div>
              </div>
            </div>

            {/* Action Details */}
            {activeAction && (
              <>
                {/* Action Type Badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      activeAction.type === 'api'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    }`}
                  >
                    {activeAction.type === 'api' ? 'REST API' : 'Event'}
                  </span>
                  {activeAction.type === 'api' && activeAction.method && (
                    <span
                      className={`text-xs px-2 py-1 rounded font-mono ${
                        activeAction.method === 'GET'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : activeAction.method === 'POST'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : activeAction.method === 'PUT'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {activeAction.method}
                    </span>
                  )}
                  {activeAction.type === 'event' && (
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        activeAction.eventType === 'inbound'
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                      }`}
                    >
                      {activeAction.eventType === 'inbound' ? 'From Temenos' : 'To Temenos'}
                    </span>
                  )}
                </div>

                {/* Action Name & Description */}
                <div>
                  <h4 className="font-semibold">{activeAction.name}</h4>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {activeAction.description}
                  </p>
                </div>

                {/* Endpoint */}
                {activeAction.endpoint && (
                  <div
                    className={`p-3 rounded-lg ${
                      darkMode ? 'bg-gray-800' : 'bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-500">Endpoint</span>
                      <button
                        onClick={() => handleCopy(activeAction.endpoint || '', 'endpoint')}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {copiedField === 'endpoint' ? (
                          <Check size={14} className="text-green-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                    <code className="text-xs font-mono break-all">{activeAction.endpoint}</code>
                  </div>
                )}

                {/* Payload */}
                {activeAction.payload && (
                  <div
                    className={`p-3 rounded-lg ${
                      darkMode ? 'bg-gray-800' : 'bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">
                        {activeAction.type === 'api' ? 'Request Payload' : 'Event Payload'}
                      </span>
                      <button
                        onClick={() =>
                          handleCopy(JSON.stringify(activeAction.payload, null, 2), 'payload')
                        }
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {copiedField === 'payload' ? (
                          <Check size={14} className="text-green-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                    <pre
                      className={`text-xs font-mono overflow-x-auto max-h-48 ${
                        darkMode ? 'text-green-400' : 'text-green-700'
                      }`}
                    >
                      {JSON.stringify(activeAction.payload, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Temenos Mapping */}
                {activeAction.temenosMapping && (
                  <div
                    className={`p-3 rounded-lg border-l-4 ${
                      darkMode
                        ? 'bg-gray-800 border-temenos-accent'
                        : 'bg-blue-50 border-temenos-accent'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <ExternalLink size={14} className="text-temenos-accent" />
                      <span className="text-xs font-medium">Temenos Integration</span>
                    </div>
                    <code className="text-xs font-mono text-temenos-accent">
                      {activeAction.temenosMapping}
                    </code>
                    <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Maps to Temenos Core Banking API/Event
                    </p>
                  </div>
                )}

                {/* Execute API Button */}
                {activeAction.type === 'api' && onExecuteAPI && (
                  <div className="pt-2">
                    <button
                      onClick={onExecuteAPI}
                      disabled={isExecuting}
                      className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                        isExecuting
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isExecuting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Executing API...
                        </>
                      ) : (
                        <>
                          <Play size={18} />
                          Execute API
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Execution Result */}
                {executionResult && (
                  <div
                    className={`p-3 rounded-lg border ${
                      executionResult.success
                        ? darkMode
                          ? 'bg-green-900/20 border-green-700'
                          : 'bg-green-50 border-green-200'
                        : darkMode
                        ? 'bg-red-900/20 border-red-700'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {executionResult.success ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <XCircle size={16} className="text-red-500" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          executionResult.success ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {executionResult.success ? 'API Call Successful' : 'API Call Failed'}
                      </span>
                    </div>
                    {executionResult.error && (
                      <p className="text-xs text-red-500">{executionResult.error}</p>
                    )}
                  </div>
                )}

                {/* API Response */}
                {lastApiResponse && (
                  <div
                    className={`p-3 rounded-lg ${
                      darkMode ? 'bg-gray-800' : 'bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">API Response</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowResponse(!showResponse)}
                          className={`text-xs px-2 py-1 rounded ${
                            darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                        >
                          {showResponse ? 'Hide' : 'Show'}
                        </button>
                        <button
                          onClick={() =>
                            handleCopy(JSON.stringify(lastApiResponse, null, 2), 'response')
                          }
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {copiedField === 'response' ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                    {showResponse && (
                      <pre
                        className={`text-xs font-mono overflow-x-auto max-h-64 ${
                          darkMode ? 'text-blue-400' : 'text-blue-700'
                        }`}
                      >
                        {JSON.stringify(lastApiResponse, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Current Step Summary */}
            {currentStep && !activeAction && (
              <div>
                <h4 className="font-semibold mb-3">Step: {currentStep.title}</h4>
                <div className="space-y-2">
                  {currentStep.crmActions.map((action) => (
                    <div
                      key={action.id}
                      className={`p-3 rounded-lg ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                      } border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            action.type === 'api'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          }`}
                        >
                          {action.type === 'api' ? action.method : action.eventType}
                        </span>
                        <span className="text-sm font-medium">{action.name}</span>
                      </div>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {action.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer - Quick Links */}
      <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between text-xs">
          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
            API Documentation
          </span>
          <a
            href="/api-reference"
            className="text-temenos-accent hover:underline flex items-center gap-1"
          >
            View Full Reference
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}
