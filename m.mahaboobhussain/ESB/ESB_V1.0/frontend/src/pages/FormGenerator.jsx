import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, Globe, AlertCircle, CheckCircle, Loader, FileJson, Radio, Zap, Eye, EyeOff, Plus, Trash2, Variable, ExternalLink, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import DynamicForm from '../components/DynamicForm';
import FormSettingsModal from '../components/FormSettingsModal';
import DataFlowDiagram from '../components/DataFlowDiagram';
import { sampleEventsApi, formGeneratorApi, environmentVariablesApi, formSettingsApi, monitorApi, offsetsApi } from '../services/api';

function FormGenerator() {
  const [eventSamples, setEventSamples] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState('');
  const [selectedSample, setSelectedSample] = useState(null);
  const [formConfig, setFormConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [showAllFields, setShowAllFields] = useState(false);

  // Event Headers state
  const [eventHeaders, setEventHeaders] = useState([{ key: '', value: '' }]);
  const [showHeadersPanel, setShowHeadersPanel] = useState(false);

  // Global environment variables state
  const [variables, setVariables] = useState({});
  const [loadingVariables, setLoadingVariables] = useState(false);
  const [fieldVariables, setFieldVariables] = useState({}); // Maps field path to variable info

  // Form settings state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [formSettings, setFormSettings] = useState(null);

  // Monitor state for data flow diagram
  const [monitorStatus, setMonitorStatus] = useState({
    isRunning: false,
    stats: { eventsReceived: 0, eventsProcessed: 0, eventsFailed: 0 }
  });

  // Flow stage for diagram animation: 'idle', 'sending', 'inEventHub', 'processing', 'completed'
  const [flowStage, setFlowStage] = useState('idle');

  // Pending events tracking (events sent when monitor not running for this type)
  const [pendingEvents, setPendingEvents] = useState([]);

  // Successful transactions count
  const [successfulCount, setSuccessfulCount] = useState(0);

  // LocalStorage key for pending events
  const getPendingEventsKey = (sampleId) => `esb_pending_events_${sampleId}`;
  const getSuccessfulCountKey = (sampleId) => `esb_successful_count_${sampleId}`;

  // Load pending events from localStorage
  const loadPendingEventsFromStorage = (sampleId) => {
    try {
      const stored = localStorage.getItem(getPendingEventsKey(sampleId));
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.error('Failed to load pending events from storage:', err);
      return [];
    }
  };

  // Save pending events to localStorage
  const savePendingEventsToStorage = (sampleId, events) => {
    try {
      localStorage.setItem(getPendingEventsKey(sampleId), JSON.stringify(events));
    } catch (err) {
      console.error('Failed to save pending events to storage:', err);
    }
  };

  // Load successful count from localStorage
  const loadSuccessfulCountFromStorage = (sampleId) => {
    try {
      const stored = localStorage.getItem(getSuccessfulCountKey(sampleId));
      return stored ? parseInt(stored, 10) : 0;
    } catch (err) {
      return 0;
    }
  };

  // Save successful count to localStorage
  const saveSuccessfulCountToStorage = (sampleId, count) => {
    try {
      localStorage.setItem(getSuccessfulCountKey(sampleId), count.toString());
    } catch (err) {
      console.error('Failed to save successful count to storage:', err);
    }
  };

  useEffect(() => {
    loadSamples();
    loadMonitorStatus();
  }, []);

  // Poll monitor status to detect when pending events should be cleared
  // When monitor is running for this sample, ALL pending events are cleared immediately
  // (the monitor will process them from Event Hub — "pending" just means "waiting for a monitor")
  const pollInFlightRef = React.useRef(false);

  useEffect(() => {
    if (!selectedSampleId || pendingEvents.length === 0) return;

    const pollInterval = setInterval(async () => {
      if (pollInFlightRef.current) return;
      pollInFlightRef.current = true;

      try {
        const sampleStatus = await monitorApi.getSampleStatus(selectedSampleId);

        if (sampleStatus && sampleStatus.isRunning) {
          setMonitorStatus(sampleStatus);

          // Capture count before clearing (closure has the current array)
          const clearedCount = pendingEvents.length;
          const configId = sampleStatus.configurationId;

          // Monitor is running → clear ALL pending events
          setPendingEvents([]);
          savePendingEventsToStorage(selectedSampleId, []);

          // Optimistically increment successful count by the number of cleared pending events
          setSuccessfulCount(prev => {
            const optimistic = prev + clearedCount;
            saveSuccessfulCountToStorage(selectedSampleId, optimistic);
            return optimistic;
          });

          // Animate: processing → transactSuccess → idle
          setFlowStage('processing');
          setTimeout(() => {
            setFlowStage('transactSuccess');
            setTimeout(async () => {
              setFlowStage('idle');
              // Sync with actual backend count after animation (monitor has had time to process)
              try {
                const summary = await offsetsApi.getOffsets(configId);
                const backendCount = summary.successCount || 0;
                setSuccessfulCount(backendCount);
                saveSuccessfulCountToStorage(selectedSampleId, backendCount);
              } catch (fetchErr) {
                // Optimistic count remains — will sync on next page load
              }
            }, 2000);
          }, 1500);
        }
      } catch (err) {
        console.error('Failed to poll monitor status:', err);
      } finally {
        pollInFlightRef.current = false;
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [selectedSampleId, pendingEvents.length]);

  const loadMonitorStatus = async () => {
    try {
      const allStatuses = await monitorApi.getAllStatuses();
      const anyRunning = Object.values(allStatuses).some(s => s.isRunning);
      setMonitorStatus({ isRunning: anyRunning, stats: { eventsReceived: 0, eventsProcessed: 0, eventsFailed: 0 } });
    } catch (err) {
      console.error('Failed to load monitor status:', err);
    }
  };

  useEffect(() => {
    if (selectedSampleId) {
      loadSelectedSample();
      // Load pending events from localStorage
      const storedPendingEvents = loadPendingEventsFromStorage(selectedSampleId);
      setPendingEvents(storedPendingEvents);

      // Load successful count from backend using server-side sample status
      (async () => {
        try {
          const sampleStatus = await monitorApi.getSampleStatus(selectedSampleId);
          if (sampleStatus && sampleStatus.configurationId) {
            const summary = await offsetsApi.getOffsets(sampleStatus.configurationId);
            const backendCount = summary.successCount || 0;
            setSuccessfulCount(backendCount);
            saveSuccessfulCountToStorage(selectedSampleId, backendCount);
          } else {
            setSuccessfulCount(loadSuccessfulCountFromStorage(selectedSampleId));
          }
        } catch (err) {
          setSuccessfulCount(loadSuccessfulCountFromStorage(selectedSampleId));
        }
      })();
    } else {
      setSelectedSample(null);
      setFormConfig(null);
      setResult(null);
      setPendingEvents([]);
      setSuccessfulCount(0);
    }
  }, [selectedSampleId]);

  // Function to clear pending events (for manual clearing from popup)
  const clearPendingEvents = () => {
    setPendingEvents([]);
    savePendingEventsToStorage(selectedSampleId, []);
  };

  // Function to clear successful count
  const clearSuccessfulCount = () => {
    setSuccessfulCount(0);
    saveSuccessfulCountToStorage(selectedSampleId, 0);
  };

  const loadSamples = async () => {
    try {
      setLoading(true);
      const events = await sampleEventsApi.getAll();
      setEventSamples(events);
      // Also load global environment variables
      await loadGlobalVariables();
    } catch (err) {
      console.error('Failed to load samples:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalVariables = async () => {
    try {
      setLoadingVariables(true);
      const vars = await environmentVariablesApi.getAll();
      // Convert from {name: {value, description}} to {name: value} for easy lookup
      const varsMap = {};
      for (const [name, data] of Object.entries(vars || {})) {
        varsMap[name] = data.value;
      }
      setVariables(varsMap);
    } catch (err) {
      console.error('Failed to load environment variables:', err);
      setVariables({});
    } finally {
      setLoadingVariables(false);
    }
  };

  // Detect field variables when sample data or variables change
  useEffect(() => {
    if (selectedSample) {
      detectFieldVariables();
    }
  }, [selectedSample, variables]);

  // Detect {{variableName}} patterns in sample data and map to fields
  const detectFieldVariables = () => {
    const sampleData = getSampleDataRaw();
    if (!sampleData) {
      setFieldVariables({});
      return;
    }

    const fieldVars = {};
    const variablePattern = /\{\{([^}]+)\}\}/g;

    const scanValue = (value, path) => {
      if (typeof value === 'string') {
        const matches = [...value.matchAll(variablePattern)];
        if (matches.length > 0) {
          fieldVars[path] = matches.map(m => ({
            variableName: m[1],
            hasValue: variables.hasOwnProperty(m[1]),
            value: variables[m[1]]
          }));
        }
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          scanValue(item, `${path}[${index}]`);
        });
      } else if (value && typeof value === 'object') {
        Object.entries(value).forEach(([key, val]) => {
          scanValue(val, path ? `${path}.${key}` : key);
        });
      }
    };

    scanValue(sampleData, '');
    setFieldVariables(fieldVars);
  };

  // Get raw sample data without variable substitution (for detection)
  const getSampleDataRaw = () => {
    if (!selectedSample) return null;
    return Array.isArray(selectedSample.sampleData)
      ? selectedSample.sampleData[0]
      : selectedSample.sampleData;
  };

  // Substitute variables in a value
  const substituteVariables = (value) => {
    if (typeof value === 'string') {
      return value.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
        return variables.hasOwnProperty(varName) ? variables[varName] : match;
      });
    } else if (Array.isArray(value)) {
      return value.map(item => substituteVariables(item));
    } else if (value && typeof value === 'object') {
      const result = {};
      Object.entries(value).forEach(([key, val]) => {
        result[key] = substituteVariables(val);
      });
      return result;
    }
    return value;
  };

  const loadSelectedSample = async () => {
    try {
      setLoadingConfig(true);
      const sample = await sampleEventsApi.getById(selectedSampleId);
      setSelectedSample(sample);

      // Load form configuration
      try {
        const configResponse = await formGeneratorApi.getFormConfig('event', selectedSampleId);
        setFormConfig(configResponse.formConfig);
      } catch (configErr) {
        console.error('Failed to load form config:', configErr);
        setFormConfig(null);
      }

      // Load form settings
      try {
        const settings = await formSettingsApi.get(selectedSampleId);
        setFormSettings(settings);
      } catch (settingsErr) {
        console.error('Failed to load form settings:', settingsErr);
        setFormSettings(null);
      }
    } catch (err) {
      console.error('Failed to load sample:', err);
      setSelectedSample(null);
      setFormConfig(null);
      setFormSettings(null);
    } finally {
      setLoadingConfig(false);
    }
  };

  // Header management functions
  const addHeader = () => {
    setEventHeaders([...eventHeaders, { key: '', value: '' }]);
  };

  const removeHeader = (index) => {
    if (eventHeaders.length === 1) {
      setEventHeaders([{ key: '', value: '' }]);
    } else {
      setEventHeaders(eventHeaders.filter((_, i) => i !== index));
    }
  };

  const updateHeader = (index, field, value) => {
    const updated = [...eventHeaders];
    updated[index][field] = value;
    setEventHeaders(updated);
  };

  const getHeadersObject = () => {
    const obj = {};
    eventHeaders.forEach(({ key, value }) => {
      if (key.trim()) {
        obj[key.trim()] = value;
      }
    });
    return obj;
  };

  const getConfiguredHeadersCount = () => {
    return eventHeaders.filter(h => h.key.trim()).length;
  };

  const saveFormSettings = async (settings) => {
    try {
      const saved = await formSettingsApi.save(selectedSampleId, settings);
      setFormSettings(saved);
    } catch (err) {
      console.error('Failed to save form settings:', err);
      throw err;
    }
  };

  const getSampleData = () => {
    const rawData = getSampleDataRaw();
    if (!rawData) return null;
    // Apply variable substitution if variables are loaded
    if (Object.keys(variables).length > 0) {
      return substituteVariables(rawData);
    }
    return rawData;
  };

  // Get variable info for a field path (for label display)
  const getFieldVariableInfo = (fieldPath) => {
    return fieldVariables[fieldPath] || null;
  };

  const getFields = () => {
    if (!selectedSample) return [];
    return selectedSample.fields || [];
  };

  // Count field types from config
  const getFieldStats = () => {
    if (!formConfig?.fields) return null;

    const stats = { editable: 0, auto: 0, readonly: 0, hidden: 0 };
    Object.values(formConfig.fields).forEach(field => {
      const visibility = field.visibility || 'editable';
      stats[visibility] = (stats[visibility] || 0) + 1;
    });
    return stats;
  };

  const handleFormSubmit = async (formData) => {
    setSubmitting(true);
    setResult(null);

    // Stage 1: Sending - animate arrow from CRM to Event Hub
    setFlowStage('sending');

    try {
      const headersObj = getHeadersObject();
      // Pass sampleId so backend can apply auto-generation
      const response = await formGeneratorApi.sendEvent(
        formData,
        null, // partitionKey
        selectedSampleId,
        true, // applyAutoValues
        headersObj // event properties/headers
      );

      if (response.success) {
        // Stage 2: In Event Hub - stop dot, blink Event Hub
        setFlowStage('inEventHub');

        // Single server-side call: checks all configs matching this sample and their monitor states
        let isMonitorRunningForThisEvent = false;
        try {
          const sampleStatus = await monitorApi.getSampleStatus(selectedSampleId);
          if (sampleStatus && sampleStatus.isRunning) {
            isMonitorRunningForThisEvent = true;
            setMonitorStatus(sampleStatus);
          }
        } catch (err) {
          console.error('Failed to fetch monitor status for sample:', err);
        }

        // Only proceed to processing/transact stages if monitor is running for THIS event type
        // If monitor is not running or running for a different event, event stays in Event Hub
        if (isMonitorRunningForThisEvent) {
          // After 1.5 seconds, move to processing stage
          setTimeout(() => {
            // Stage 3: Processing - move dot from Event Hub to Transact
            setFlowStage('processing');

            // After 1.5 seconds, move to transact success stage
            setTimeout(() => {
              // Stage 4: Transact Success - stop dot, only blink Transact
              setFlowStage('transactSuccess');

              // Increment successful count using functional update to avoid stale closure
              setSuccessfulCount(prevCount => {
                const newCount = prevCount + 1;
                saveSuccessfulCountToStorage(selectedSampleId, newCount);
                return newCount;
              });

              // After 3 seconds of blinking, stop all motions
              setTimeout(() => {
                // Stage 5: Completed - stop all animations and reset to idle
                setFlowStage('idle');
              }, 3000);
            }, 1500);
          }, 1500);
        } else {
          // Monitor not running for this event type - add to pending events
          const pendingEvent = {
            id: `pending_${Date.now()}`,
            timestamp: new Date().toISOString(),
            data: formData,
            sampleId: selectedSampleId,
            sampleName: selectedSample?.name || 'Unknown'
          };
          setPendingEvents(prev => {
            const updated = [...prev, pendingEvent];
            savePendingEventsToStorage(selectedSampleId, updated);
            return updated;
          });

          // Blink Event Hub for 3 seconds then stop
          setTimeout(() => {
            setFlowStage('idle');
          }, 3000);
        }
      } else {
        // On failure, reset to idle
        setFlowStage('idle');
      }

      setResult({
        success: response.success,
        type: 'event',
        message: response.message || 'Event sent successfully',
        data: response,
        sentData: response.sentData || formData,
        sentHeaders: headersObj
      });
    } catch (err) {
      // On error, reset to idle
      setFlowStage('idle');
      setResult({
        success: false,
        type: 'event',
        message: err.message,
        error: err
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderResult = () => {
    if (!result) return null;

    return (
      <div className={`result-panel ${result.success ? 'result-success' : 'result-error'}`}>
        <div className="result-header">
          {result.success ? (
            <CheckCircle size={20} className="result-icon success" />
          ) : (
            <AlertCircle size={20} className="result-icon error" />
          )}
          <span className="result-message">{result.message}</span>
        </div>

        {result.sentHeaders && Object.keys(result.sentHeaders).length > 0 && (
          <div className="result-section">
            <h4>Event Properties</h4>
            <div className="headers-preview">
              {Object.entries(result.sentHeaders).map(([key, value]) => (
                <div key={key} className="header-item">
                  <span className="header-key">{key}:</span>
                  <span className="header-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.sentData && (
          <div className="result-section">
            <h4>Sent Data (with auto-generated values)</h4>
            <pre className="json-preview-content">
              {JSON.stringify(result.sentData, null, 2)}
            </pre>
          </div>
        )}

        {result.data && (
          <div className="result-section">
            <h4>Event Hub Details</h4>
            <div className="result-details">
              <div className="detail-item">
                <span className="detail-label">Event Hub</span>
                <span className="detail-value">{result.data.eventHub}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Sent At</span>
                <span className="detail-value">{new Date(result.data.sentAt).toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Partition Key</span>
                <span className="detail-value">{result.data.partitionKey}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const fieldStats = getFieldStats();

  if (loading) {
    return (
      <div className="page-loading">
        <Loader size={24} className="spin" />
        <p>Loading samples...</p>
      </div>
    );
  }

  const handleTabClick = (sampleId) => {
    if (sampleId !== selectedSampleId) {
      setSelectedSampleId(sampleId);
      setResult(null);
    }
  };

  return (
    <div className="form-generator-page crm-page">
      <div className="page-header">
        <h1>CRM</h1>
        <p className="page-subtitle">Send events to Azure Event Hub with smart forms</p>
      </div>

      {/* Data Flow Diagram */}
      <div className="flow-diagram-section">
        <DataFlowDiagram
          isMonitorRunning={monitorStatus.isRunning}
          stats={monitorStatus.stats}
          compact={true}
          flowStage={flowStage}
          pendingEvents={pendingEvents}
          successfulCount={successfulCount}
          eventTypeName={selectedSample?.name || ''}
          onClearPending={clearPendingEvents}
          onClearSuccessful={clearSuccessfulCount}
        />
      </div>

      {/* Sample Tabs */}
      {eventSamples.length > 0 ? (
        <div className="sample-tabs-container">
          <div className="sample-tabs">
            {eventSamples.map(sample => (
              <button
                key={sample.id}
                className={`sample-tab ${selectedSampleId === sample.id ? 'active' : ''}`}
                onClick={() => handleTabClick(sample.id)}
              >
                <Radio size={16} />
                <span className="tab-name">{sample.name}</span>
              </button>
            ))}
          </div>

          {selectedSampleId && (
            <button
              className="settings-btn"
              onClick={() => setShowSettingsModal(true)}
              title="Form Settings"
            >
              <Settings size={18} />
            </button>
          )}
        </div>
      ) : (
        <div className="card empty-state">
          <Radio size={48} className="empty-icon" />
          <h3>No Event Samples</h3>
          <p>Create event samples in the Sample Data Management page first.</p>
          <Link to="/samples" className="btn btn-primary">
            Go to Sample Data
          </Link>
        </div>
      )}

      {/* Loading Config */}
      {loadingConfig && (
        <div className="card">
          <div className="loading-config">
            <Loader size={20} className="spin" />
            <span>Loading form configuration...</span>
          </div>
        </div>
      )}

      {/* Dynamic Form */}
      {selectedSample && !loadingConfig && (
        <div className="card form-card">
          <div className="card-header">
            <h2>Fill Form Data</h2>
            {formConfig?.isCloudEvent && !showAllFields && (
              <span className="smart-form-badge">
                <Zap size={14} />
                Smart Form - Technical fields auto-populated
              </span>
            )}
          </div>

          <DynamicForm
            fields={getFields()}
            sampleData={getSampleData()}
            formConfig={formConfig}
            onSubmit={handleFormSubmit}
            disabled={submitting}
            showHiddenFields={showAllFields}
            fieldVariables={fieldVariables}
            formSettings={formSettings}
            submitLabel={submitting ? 'Sending...' : 'Send to Event Hub'}
          />
        </div>
      )}

      {/* Results */}
      {renderResult()}

      {/* Form Settings Modal */}
      <FormSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        apiSampleId={selectedSampleId}
        apiSampleName={selectedSample?.name || ''}
        settings={formSettings}
        onSave={saveFormSettings}
        fields={getFields()}
      />

      <style>{`
        .crm-page .page-subtitle {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .crm-page .flow-diagram-section {
          margin-bottom: 1.5rem;
        }

        /* Loading */
        .loading-config {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 2rem;
          color: var(--text-secondary);
        }

        /* Sample Tabs */
        .sample-tabs-container {
          margin-bottom: 1.5rem;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .crm-page .settings-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          background: var(--card-bg);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .crm-page .settings-btn:hover {
          color: #8b5cf6;
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.05);
        }

        .sample-tabs {
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem;
          background: var(--card-bg);
          border-radius: 0.75rem;
          border: 1px solid var(--border-color);
          overflow-x: auto;
          flex-wrap: wrap;
          flex: 1;
        }

        .sample-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border: 2px solid transparent;
          border-radius: 0.5rem;
          background: var(--bg-color);
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
          white-space: nowrap;
          color: var(--text-secondary);
        }

        .sample-tab:hover {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.05);
          color: var(--text-primary);
        }

        .sample-tab.active {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }

        .sample-tab .tab-name {
          font-size: 0.875rem;
        }

        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
        }

        .empty-state .empty-icon {
          color: var(--text-secondary);
          opacity: 0.5;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          margin: 0 0 0.5rem;
          color: var(--text-primary);
        }

        /* Headers Section Inside Form */
        .headers-section {
          border-bottom: 1px solid var(--border-color);
          background: var(--card-bg);
        }

        .headers-section .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.25rem 0.75rem;
          cursor: pointer;
          user-select: none;
          transition: background 0.2s;
          border-bottom: 1px solid var(--border-color);
        }

        .headers-section .section-header:hover {
          background: rgba(0, 0, 0, 0.02);
        }

        .headers-section .section-title {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-weight: 600;
          font-size: 0.8rem;
          color: var(--text-primary);
        }

        .headers-section .section-meta {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .headers-section .field-count {
          font-size: 0.65rem;
          color: var(--text-secondary);
          background: var(--bg-color);
          padding: 0.1rem 0.4rem;
          border-radius: 0.25rem;
        }

        .headers-section .collapse-icon {
          color: var(--text-secondary);
          display: flex;
          align-items: center;
        }

        .headers-section .section-content {
          padding: 0.125rem 0.5rem 0.25rem;
        }

        .header-field-row {
          display: flex;
          align-items: flex-end;
          gap: 0.5rem;
          margin: 0;
          padding: 0.125rem 0.25rem;
          background: transparent;
          border-radius: 0.25rem;
        }

        .header-field-row .header-inputs {
          display: flex;
          flex: 1;
          gap: 0.5rem;
        }

        .header-field-row .form-group {
          flex: 1;
          margin: 0;
          padding: 0;
        }

        .header-field-row .form-group label {
          display: block;
          font-size: 0.7rem;
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: 0.1rem;
          padding: 0;
        }

        .header-field-row .remove-header-btn {
          color: var(--text-secondary);
          padding: 0.25rem;
          margin: 0;
        }

        .header-field-row .remove-header-btn:hover {
          color: var(--error-color);
          background: rgba(239, 68, 68, 0.1);
        }

        .headers-section .add-header-btn {
          margin: 0.125rem 0 0 0;
        }

        .header-row {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .header-row input:first-child {
          flex: 1;
        }

        .header-row input:nth-child(2) {
          flex: 2;
        }

        .add-header-btn {
          margin-top: 0.5rem;
        }

        /* Headers Preview in Results */
        .headers-preview {
          background: var(--bg-color);
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
        }

        .headers-preview .header-item {
          display: flex;
          gap: 0.5rem;
          padding: 0.25rem 0;
          font-size: 0.875rem;
          font-family: 'Fira Code', monospace;
        }

        .headers-preview .header-key {
          color: var(--primary-color);
          font-weight: 500;
        }

        .headers-preview .header-value {
          color: var(--text-secondary);
        }

        .empty-state p {
          color: var(--text-secondary);
          margin: 0 0 1.5rem;
        }

        /* Collapsible Panels */
        .collapsible .clickable {
          cursor: pointer;
          user-select: none;
        }

        .collapsible .clickable:hover {
          opacity: 0.8;
        }

        .collapse-icon {
          margin-left: auto;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
        }

        /* Environment Variables Info */
        .env-vars-info {
          padding-top: 1rem;
          margin-top: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .env-vars-info.collapsed {
          padding-bottom: 0;
        }

        .env-vars-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .env-vars-info.collapsed .env-vars-header {
          margin-bottom: 0;
        }

        .env-vars-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .env-vars-hint {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .env-vars-hint code {
          background: var(--bg-color);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: 'Fira Code', monospace;
          font-size: 0.7rem;
        }

        .vars-count {
          font-size: 0.75rem;
          color: var(--success-color);
        }

        /* Variables Panel */
        .variables-panel {
          padding: 1rem;
          background: rgba(139, 92, 246, 0.05);
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .variables-panel .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0;
          border-bottom: none;
          margin-bottom: 0.75rem;
        }

        .variables-panel .card-header h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0;
          color: #8b5cf6;
        }

        .variables-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .variable-field-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.75rem;
          background: var(--card-bg);
          border-radius: 0.375rem;
          gap: 1rem;
        }

        .field-path {
          font-family: 'Fira Code', monospace;
          font-size: 0.8rem;
          color: var(--text-primary);
        }

        .variable-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }

        .variable-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-family: 'Fira Code', monospace;
          font-size: 0.7rem;
        }

        .variable-tag.has-value {
          background: rgba(34, 197, 94, 0.15);
          color: var(--success-color);
        }

        .variable-tag.no-value {
          background: rgba(245, 158, 11, 0.15);
          color: var(--warning-color);
        }

        .variable-tag .var-value {
          color: var(--text-secondary);
          font-weight: normal;
        }

        /* Variable Badge in Field Labels */
        .variable-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: 'Fira Code', monospace;
          font-size: 0.625rem;
          font-weight: 500;
        }

        .variable-badge.has-value {
          background: rgba(34, 197, 94, 0.15);
          color: var(--success-color);
        }

        .variable-badge.no-value {
          background: rgba(245, 158, 11, 0.15);
          color: var(--warning-color);
        }

        /* Sample Info */
        .sample-info-card {
          padding: 1.25rem;
        }

        .sample-info-card.collapsed {
          padding: 0.75rem 1.25rem;
        }

        .sample-info-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .sample-info-card.collapsed .sample-info-header {
          margin-bottom: 0;
        }

        .sample-info-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
          flex: 1;
        }

        .sample-info-card.collapsed .sample-info-header h3 {
          font-size: 0.9375rem;
        }

        .cloud-event-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.625rem;
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
          border-radius: 1rem;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .api-details {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--bg-color);
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .method-badge {
          padding: 0.25rem 0.625rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .method-get { background: #dcfce7; color: #16a34a; }
        .method-post { background: #dbeafe; color: #2563eb; }
        .method-put { background: #fef3c7; color: #d97706; }
        .method-patch { background: #fce7f3; color: #db2777; }
        .method-delete { background: #fee2e2; color: #dc2626; }

        .endpoint-url {
          font-family: 'Fira Code', monospace;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .sample-stats {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .sample-stats .stat {
          display: flex;
          flex-direction: column;
        }

        .sample-stats .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--primary-color);
        }

        .sample-stats .stat.auto .stat-value {
          color: #8b5cf6;
        }

        .sample-stats .stat.hidden .stat-value {
          color: var(--text-secondary);
        }

        .sample-stats .stat.destination .stat-value {
          font-size: 0.875rem;
        }

        .sample-stats .stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        /* Show All Toggle */
        .show-all-toggle {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .toggle-hint {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        /* Headers Card */
        .headers-card {
          padding: 1.25rem;
        }

        .headers-card .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0;
          border-bottom: none;
          margin-bottom: 1rem;
        }

        .headers-card .card-header h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
        }

        .headers-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .header-row {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .header-row input:first-child {
          flex: 1;
        }

        .header-row input:nth-child(2) {
          flex: 2;
        }

        /* Form Card */
        .form-card {
          padding: 0;
        }

        .form-card .card-header {
          padding: 1rem 1.5rem;
          margin-bottom: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .smart-form-badge {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          background: rgba(34, 197, 94, 0.1);
          color: var(--success-color);
          border-radius: 1rem;
          font-size: 0.7rem;
          font-weight: 500;
        }

        /* Form Field Summary */
        .form-field-summary {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem 1.5rem;
          background: var(--bg-color);
          border-bottom: 1px solid var(--border-color);
          flex-wrap: wrap;
        }

        .form-field-summary .summary-item {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
        }

        .form-field-summary .summary-item.editable {
          background: rgba(59, 130, 246, 0.1);
          color: var(--primary-color);
        }

        .form-field-summary .summary-item.auto {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }

        .form-field-summary .summary-item.readonly {
          background: rgba(245, 158, 11, 0.1);
          color: var(--warning-color);
        }

        .form-field-summary .summary-item.hidden {
          background: var(--bg-color);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }

        /* Field Visibility Badges */
        .visibility-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.625rem;
          font-weight: 500;
        }

        .visibility-badge.readonly {
          background: rgba(245, 158, 11, 0.1);
          color: var(--warning-color);
        }

        .visibility-badge.auto {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }

        /* Field Badges */
        .field-badges {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        /* Field Styling */
        .field-readonly .form-control,
        .field-auto .form-control {
          background: var(--bg-color);
        }

        .field-readonly .form-control {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .field-auto .form-control {
          border-style: dashed;
        }

        .field-validation-hint {
          display: block;
          font-size: 0.7rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }

        /* Result Enhancements */
        .result-section h4 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
          color: var(--text-secondary);
        }

        .status-code {
          padding: 0.125rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-code.success {
          background: rgba(34, 197, 94, 0.2);
          color: var(--success-color);
        }

        .status-code.error {
          background: rgba(239, 68, 68, 0.2);
          color: var(--error-color);
        }

        .duration {
          font-size: 0.75rem;
          color: var(--text-secondary);
          background: var(--bg-color);
          padding: 0.125rem 0.5rem;
          border-radius: 0.25rem;
        }

        .result-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .detail-value {
          font-weight: 500;
        }

        /* Headers Preview in Results */
        .headers-preview {
          background: var(--bg-color);
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
        }

        .headers-preview .header-item {
          display: flex;
          gap: 0.5rem;
          padding: 0.25rem 0;
          font-size: 0.875rem;
          font-family: 'Fira Code', monospace;
        }

        .headers-preview .header-key {
          color: var(--primary-color);
          font-weight: 500;
        }

        .headers-preview .header-value {
          color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .source-type-toggle {
            flex-direction: column;
          }

          .show-all-toggle {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

export default FormGenerator;
