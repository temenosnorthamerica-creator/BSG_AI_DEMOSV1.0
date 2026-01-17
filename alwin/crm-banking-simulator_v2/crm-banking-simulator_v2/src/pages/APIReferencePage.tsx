import { useState } from 'react';
import {
  Code,
  Zap,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Server,
  ArrowRightLeft
} from 'lucide-react';
import { crmAPIs, crmEvents } from '../data/bankingApps';

interface APIReferencePageProps {
  darkMode: boolean;
}

export default function APIReferencePage({ darkMode }: APIReferencePageProps) {
  const [activeTab, setActiveTab] = useState<'apis' | 'events'>('apis');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadPostman = () => {
    const link = document.createElement('a');
    link.href = import.meta.env.BASE_URL + 'postman/CRM_Banking_APIs.postman_collection.json';
    link.download = 'CRM_Banking_APIs.postman_collection.json';
    link.click();
  };

  return (
    <div className="pt-20 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">CRM API Reference</h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Complete API documentation for CRM-Temenos integration
              </p>
            </div>
            <button
              onClick={handleDownloadPostman}
              className="btn-primary flex items-center gap-2"
            >
              <Download size={18} />
              Download Postman Collection
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} mb-6`}>
          <button
            onClick={() => setActiveTab('apis')}
            className={`px-6 py-3 font-medium flex items-center gap-2 ${
              activeTab === 'apis'
                ? 'tab-active'
                : 'tab-inactive'
            }`}
          >
            <Code size={18} />
            REST APIs ({crmAPIs.length})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-6 py-3 font-medium flex items-center gap-2 ${
              activeTab === 'events'
                ? 'tab-active'
                : 'tab-inactive'
            }`}
          >
            <Zap size={18} />
            Events ({crmEvents.length})
          </button>
        </div>

        {/* API List */}
        {activeTab === 'apis' && (
          <div className="space-y-4">
            {crmAPIs.map((api, index) => (
              <div
                key={index}
                className={`card ${darkMode ? 'bg-surface-card-dark' : ''}`}
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpand(`api-${index}`)}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-xs px-2 py-1 rounded font-mono font-bold ${
                        api.method === 'GET'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : api.method === 'POST'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : api.method === 'PUT'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {api.method}
                    </span>
                    <div>
                      <h3 className="font-semibold">{api.name}</h3>
                      <code className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {api.endpoint}
                      </code>
                    </div>
                  </div>
                  {expandedItems.has(`api-${index}`) ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>

                {expandedItems.has(`api-${index}`) && (
                  <div className="mt-6 space-y-4">
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {api.description}
                    </p>

                    {/* Request Payload */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold">Request Payload</h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(
                              JSON.stringify(api.requestPayload, null, 2),
                              `req-${index}`
                            );
                          }}
                          className="text-gray-400 hover:text-gray-600 flex items-center gap-1"
                        >
                          {copiedField === `req-${index}` ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                          <span className="text-xs">Copy</span>
                        </button>
                      </div>
                      <pre
                        className={`text-xs font-mono p-4 rounded-lg overflow-x-auto ${
                          darkMode
                            ? 'bg-gray-800 text-green-400'
                            : 'bg-gray-100 text-green-700'
                        }`}
                      >
                        {JSON.stringify(api.requestPayload, null, 2)}
                      </pre>
                    </div>

                    {/* Response Payload */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold">Response Payload</h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(
                              JSON.stringify(api.responsePayload, null, 2),
                              `res-${index}`
                            );
                          }}
                          className="text-gray-400 hover:text-gray-600 flex items-center gap-1"
                        >
                          {copiedField === `res-${index}` ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                          <span className="text-xs">Copy</span>
                        </button>
                      </div>
                      <pre
                        className={`text-xs font-mono p-4 rounded-lg overflow-x-auto ${
                          darkMode
                            ? 'bg-gray-800 text-blue-400'
                            : 'bg-gray-100 text-blue-700'
                        }`}
                      >
                        {JSON.stringify(api.responsePayload, null, 2)}
                      </pre>
                    </div>

                    {/* Temenos Integration */}
                    <div
                      className={`p-4 rounded-lg border-l-4 border-temenos-accent ${
                        darkMode ? 'bg-gray-800' : 'bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowRightLeft size={16} className="text-temenos-accent" />
                        <h4 className="text-sm font-semibold">Temenos Integration</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Server size={14} className="text-gray-500" />
                        <code className="text-sm text-temenos-accent">
                          {api.temenosIntegration.api}
                        </code>
                      </div>
                      <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {api.temenosIntegration.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Events List */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            {crmEvents.map((event, index) => (
              <div
                key={index}
                className={`card ${darkMode ? 'bg-surface-card-dark' : ''}`}
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpand(`event-${index}`)}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        event.type === 'inbound'
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                      }`}
                    >
                      {event.type === 'inbound' ? 'Inbound' : 'Outbound'}
                    </span>
                    <div>
                      <h3 className="font-semibold">{event.name}</h3>
                      <code className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {event.temenosEvent}
                      </code>
                    </div>
                  </div>
                  {expandedItems.has(`event-${index}`) ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>

                {expandedItems.has(`event-${index}`) && (
                  <div className="mt-6 space-y-4">
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {event.description}
                    </p>

                    {/* Event Payload */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold">Event Payload</h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(
                              JSON.stringify(event.payload, null, 2),
                              `event-payload-${index}`
                            );
                          }}
                          className="text-gray-400 hover:text-gray-600 flex items-center gap-1"
                        >
                          {copiedField === `event-payload-${index}` ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                          <span className="text-xs">Copy</span>
                        </button>
                      </div>
                      <pre
                        className={`text-xs font-mono p-4 rounded-lg overflow-x-auto ${
                          darkMode
                            ? 'bg-gray-800 text-purple-400'
                            : 'bg-gray-100 text-purple-700'
                        }`}
                      >
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    </div>

                    {/* Flow Direction */}
                    <div
                      className={`p-4 rounded-lg ${
                        event.type === 'inbound'
                          ? darkMode
                            ? 'bg-orange-900/20'
                            : 'bg-orange-50'
                          : darkMode
                          ? 'bg-teal-900/20'
                          : 'bg-teal-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              event.type === 'inbound'
                                ? 'bg-green-100 dark:bg-green-900/30'
                                : 'bg-blue-100 dark:bg-blue-900/30'
                            }`}
                          >
                            <Server
                              size={16}
                              className={event.type === 'inbound' ? 'text-green-600' : 'text-blue-600'}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {event.type === 'inbound' ? 'Temenos' : 'CRM'}
                          </span>
                        </div>
                        <div className="flex-1 flex items-center">
                          <div
                            className={`h-0.5 flex-1 ${
                              event.type === 'inbound'
                                ? 'bg-gradient-to-r from-green-500 to-blue-500'
                                : 'bg-gradient-to-r from-blue-500 to-green-500'
                            }`}
                          />
                          <Zap size={16} className="mx-2 text-yellow-500" />
                          <div
                            className={`h-0.5 flex-1 ${
                              event.type === 'inbound'
                                ? 'bg-gradient-to-r from-green-500 to-blue-500'
                                : 'bg-gradient-to-r from-blue-500 to-green-500'
                            }`}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {event.type === 'inbound' ? 'CRM' : 'Temenos'}
                          </span>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              event.type === 'inbound'
                                ? 'bg-blue-100 dark:bg-blue-900/30'
                                : 'bg-green-100 dark:bg-green-900/30'
                            }`}
                          >
                            <Server
                              size={16}
                              className={event.type === 'inbound' ? 'text-blue-600' : 'text-green-600'}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick Reference */}
        <div className={`mt-8 p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <h3 className="font-bold mb-4">Quick Reference</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                Base URL
              </h4>
              <code className="text-sm">https://api.crm.bank.com/v1</code>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                Authentication
              </h4>
              <code className="text-sm">Bearer Token (OAuth 2.0)</code>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                Content Type
              </h4>
              <code className="text-sm">application/json</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
