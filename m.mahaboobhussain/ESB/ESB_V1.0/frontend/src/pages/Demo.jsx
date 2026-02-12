import { useState, useEffect } from 'react';
import { Play, Download, CheckCircle, XCircle, Loader, ArrowRight, RefreshCw, Radio, Wifi, WifiOff, AlertTriangle, Zap, Clock, ExternalLink, Archive, Trash2, RotateCcw, X, ChevronDown, ChevronUp, Search, Filter, Calendar, Plus, Database, Edit, Save } from 'lucide-react';
import { configurationsApi, demoApi, sampleEventsApi, sampleApisApi, offsetsApi, variablesApi } from '../services/api';

export default function Demo() {
  const [configurations, setConfigurations] = useState([]);
  const [selectedConfigId, setSelectedConfigId] = useState('');
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [eventSample, setEventSample] = useState(null);
  const [apiSample, setApiSample] = useState(null);

  // Live mode state (always true - simulated mode removed)
  const [liveMode, setLiveMode] = useState(true);
  const [eventHubStatus, setEventHubStatus] = useState(null);
  const [checkingEventHub, setCheckingEventHub] = useState(false);
  const [eventHubOptions, setEventHubOptions] = useState({
    maxEventsToRead: 5,
    maxWaitTimeSeconds: 15,
    startPosition: 'earliest'
  });

  // Simulation mode enhancements
  const [editableSampleData, setEditableSampleData] = useState('');
  const [sampleDataError, setSampleDataError] = useState('');
  const [apiEndpointOverride, setApiEndpointOverride] = useState('');
  const [useRealApiCall, setUseRealApiCall] = useState(false);
  const [simulationHeaders, setSimulationHeaders] = useState([{ key: '', value: '' }]);

  // Offset tracking state
  const [offsetInfo, setOffsetInfo] = useState(null);
  const [failedEvents, setFailedEvents] = useState([]);
  const [showFailedEventsModal, setShowFailedEventsModal] = useState(false);
  const [loadingOffsets, setLoadingOffsets] = useState(false);
  const [expandedFailedEvent, setExpandedFailedEvent] = useState(null);

  // Successful events state
  const [successfulEvents, setSuccessfulEvents] = useState([]);
  const [showSuccessfulEventsModal, setShowSuccessfulEventsModal] = useState(false);
  const [loadingSuccessfulEvents, setLoadingSuccessfulEvents] = useState(false);
  const [expandedSuccessfulEvent, setExpandedSuccessfulEvent] = useState(null);
  const [successfulEventsPartitions, setSuccessfulEventsPartitions] = useState([]);
  const [successfulEventsFilters, setSuccessfulEventsFilters] = useState({
    search: '',
    partition: '',
    fromDate: '',
    toDate: ''
  });

  // Environment Variables state
  const [showVariablesModal, setShowVariablesModal] = useState(false);
  const [configVariables, setConfigVariables] = useState({ variables: {} });
  const [loadingVariables, setLoadingVariables] = useState(false);
  const [editingVariable, setEditingVariable] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  useEffect(() => {
    loadConfigurations();
  }, []);

  useEffect(() => {
    if (selectedConfigId) {
      loadConfigDetails(selectedConfigId);
    } else {
      setSelectedConfig(null);
      setEventSample(null);
      setApiSample(null);
      setResults(null);
    }
  }, [selectedConfigId]);

  useEffect(() => {
    if (liveMode) {
      checkEventHubConnection();
    }
  }, [liveMode]);

  useEffect(() => {
    if (selectedConfigId && liveMode) {
      loadOffsetInfo(selectedConfigId);
    }
  }, [selectedConfigId, liveMode]);

  async function loadConfigurations() {
    setLoading(true);
    try {
      const configs = await configurationsApi.getAll();
      setConfigurations(configs);
    } catch (err) {
      console.error('Failed to load configurations:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadConfigDetails(configId) {
    try {
      const config = await configurationsApi.getById(configId);
      setSelectedConfig(config);

      if (config.source.eventSampleId) {
        const event = await sampleEventsApi.getById(config.source.eventSampleId);
        setEventSample(event);
        // Populate editable sample data
        const sampleData = Array.isArray(event.sampleData) ? event.sampleData : [event.sampleData];
        setEditableSampleData(JSON.stringify(sampleData, null, 2));
        setSampleDataError('');
      } else if (config.source.fileData) {
        // Use file data if no event sample
        setEventSample(null);
        setEditableSampleData(JSON.stringify(config.source.fileData, null, 2));
        setSampleDataError('');
      } else {
        setEventSample(null);
        setEditableSampleData('[]');
      }

      if (config.destination.apiSampleId) {
        const api = await sampleApisApi.getById(config.destination.apiSampleId);
        setApiSample(api);
        // Set initial endpoint (can be overridden)
        setApiEndpointOverride(api.endpoint);
        // Initialize headers from API sample's defaultHeaders
        const defaultHeaders = api.defaultHeaders || {};
        const headerPairs = Object.entries(defaultHeaders).map(([key, value]) => ({ key, value }));
        setSimulationHeaders(headerPairs.length > 0 ? headerPairs : [{ key: '', value: '' }]);
      }

      // Reset real API call option when config changes
      setUseRealApiCall(false);
    } catch (err) {
      console.error('Failed to load config details:', err);
    }
  }

  async function checkEventHubConnection() {
    setCheckingEventHub(true);
    try {
      const info = await demoApi.getEventHubInfo();
      setEventHubStatus({
        connected: true,
        ...info
      });
    } catch (err) {
      setEventHubStatus({
        connected: false,
        error: err.message
      });
    } finally {
      setCheckingEventHub(false);
    }
  }

  async function loadOffsetInfo(configId) {
    setLoadingOffsets(true);
    try {
      const info = await offsetsApi.getOffsets(configId);
      setOffsetInfo(info);
      const failed = await offsetsApi.getFailedEvents(configId);
      setFailedEvents(failed);
    } catch (err) {
      console.error('Failed to load offset info:', err);
      setOffsetInfo(null);
      setFailedEvents([]);
    } finally {
      setLoadingOffsets(false);
    }
  }

  async function handleResetOffsets() {
    if (!selectedConfigId) return;
    if (!confirm('This will reset all offset tracking. Previously processed events will be reprocessed. Continue?')) return;
    try {
      await offsetsApi.clearOffsets(selectedConfigId);
      await loadOffsetInfo(selectedConfigId);
      alert('Offsets reset successfully');
    } catch (err) {
      alert('Failed to reset offsets: ' + err.message);
    }
  }

  async function handleClearFailedEvents() {
    if (!selectedConfigId) return;
    if (!confirm('This will clear all failed events. They will be retried on the next run. Continue?')) return;
    try {
      await offsetsApi.clearFailedEvents(selectedConfigId);
      await loadOffsetInfo(selectedConfigId);
      setShowFailedEventsModal(false);
      alert('Failed events cleared - they will be retried on next run');
    } catch (err) {
      alert('Failed to clear failed events: ' + err.message);
    }
  }

  async function handleRemoveFailedEvent(eventId) {
    if (!selectedConfigId) return;
    try {
      await offsetsApi.removeFailedEvent(selectedConfigId, eventId);
      await loadOffsetInfo(selectedConfigId);
    } catch (err) {
      alert('Failed to remove event: ' + err.message);
    }
  }

  async function loadSuccessfulEvents(filters = successfulEventsFilters) {
    if (!selectedConfigId) return;
    setLoadingSuccessfulEvents(true);
    try {
      const events = await offsetsApi.getSuccessfulEvents(selectedConfigId, filters);
      setSuccessfulEvents(events);
      const partitions = await offsetsApi.getSuccessfulEventPartitions(selectedConfigId);
      setSuccessfulEventsPartitions(partitions);
    } catch (err) {
      console.error('Failed to load successful events:', err);
      setSuccessfulEvents([]);
    } finally {
      setLoadingSuccessfulEvents(false);
    }
  }

  async function handleClearSuccessfulEvents() {
    if (!selectedConfigId) return;
    if (!confirm('This will clear all successful event history. This action cannot be undone. Continue?')) return;
    try {
      await offsetsApi.clearSuccessfulEvents(selectedConfigId);
      await loadSuccessfulEvents();
      await loadOffsetInfo(selectedConfigId);
      alert('Successful events history cleared');
    } catch (err) {
      alert('Failed to clear successful events: ' + err.message);
    }
  }

  async function handleRemoveSuccessfulEvent(eventId) {
    if (!selectedConfigId) return;
    try {
      await offsetsApi.removeSuccessfulEvent(selectedConfigId, eventId);
      await loadSuccessfulEvents();
      await loadOffsetInfo(selectedConfigId);
    } catch (err) {
      alert('Failed to remove event: ' + err.message);
    }
  }

  function handleOpenSuccessfulEventsModal() {
    setShowSuccessfulEventsModal(true);
    loadSuccessfulEvents();
  }

  function handleSuccessfulEventsFilterChange(key, value) {
    const newFilters = { ...successfulEventsFilters, [key]: value };
    setSuccessfulEventsFilters(newFilters);
  }

  function handleApplySuccessfulEventsFilters() {
    loadSuccessfulEvents(successfulEventsFilters);
  }

  function handleClearSuccessfulEventsFilters() {
    const clearedFilters = { search: '', partition: '', fromDate: '', toDate: '' };
    setSuccessfulEventsFilters(clearedFilters);
    loadSuccessfulEvents(clearedFilters);
  }

  // Environment Variables functions
  async function loadVariables() {
    if (!selectedConfigId) return;
    setLoadingVariables(true);
    try {
      const data = await variablesApi.getVariables(selectedConfigId);
      setConfigVariables(data);
    } catch (err) {
      console.error('Failed to load variables:', err);
      setConfigVariables({ variables: {} });
    } finally {
      setLoadingVariables(false);
    }
  }

  function handleOpenVariablesModal() {
    setShowVariablesModal(true);
    loadVariables();
  }

  async function handleClearVariables() {
    if (!selectedConfigId) return;
    if (!confirm('This will clear all stored variables for this configuration. Continue?')) return;
    try {
      await variablesApi.clearVariables(selectedConfigId);
      await loadVariables();
      alert('Variables cleared successfully');
    } catch (err) {
      alert('Failed to clear variables: ' + err.message);
    }
  }

  async function handleDeleteVariable(variableName) {
    if (!selectedConfigId) return;
    try {
      await variablesApi.deleteVariable(selectedConfigId, variableName);
      await loadVariables();
    } catch (err) {
      alert('Failed to delete variable: ' + err.message);
    }
  }

  function handleStartEditVariable(variableName, currentValue) {
    setEditingVariable(variableName);
    setEditingValue(currentValue);
  }

  async function handleSaveVariable(variableName) {
    if (!selectedConfigId) return;
    try {
      await variablesApi.updateVariable(selectedConfigId, variableName, editingValue);
      setEditingVariable(null);
      setEditingValue('');
      await loadVariables();
    } catch (err) {
      alert('Failed to update variable: ' + err.message);
    }
  }

  function handleCancelEdit() {
    setEditingVariable(null);
    setEditingValue('');
  }

  async function executeDemo() {
    if (!selectedConfigId) return alert('Please select a configuration');

    // Validate editable sample data if in simulated mode
    let parsedSourceData = null;
    if (!liveMode && editableSampleData.trim()) {
      try {
        parsedSourceData = JSON.parse(editableSampleData);
        setSampleDataError('');
      } catch (e) {
        setSampleDataError('Invalid JSON: ' + e.message);
        return;
      }
    }

    setExecuting(true);
    setResults(null);
    setCurrentStep(0);

    try {
      // Step 1: Initialize
      await delay(300);
      setCurrentStep(1);

      // Step 2: Reading source (Event Hub in live mode, sample data in simulated)
      await delay(500);
      setCurrentStep(2);

      // Step 3: Apply mapping
      await delay(400);
      setCurrentStep(3);

      // Step 4: Call API
      setCurrentStep(4);

      // Determine endpoint override (only if different from original)
      const effectiveEndpointOverride = apiEndpointOverride !== apiSample?.endpoint
        ? apiEndpointOverride
        : null;

      // Get headers for real API calls
      const headersObj = useRealApiCall ? getSimulationHeadersObject() : {};

      // Execute actual demo with live mode option and new parameters
      const result = await demoApi.execute(
        selectedConfigId,
        liveMode ? null : parsedSourceData,
        liveMode,
        eventHubOptions,
        {
          endpointOverride: effectiveEndpointOverride,
          useRealApi: useRealApiCall,
          headers: headersObj
        }
      );

      await delay(300);
      setCurrentStep(5);

      await delay(200);
      setResults(result);
      setCurrentStep(6);

      // Refresh offset info after execution in live mode
      if (liveMode && selectedConfigId) {
        await loadOffsetInfo(selectedConfigId);
      }
    } catch (err) {
      alert('Demo execution failed: ' + err.message);
      setCurrentStep(0);
    } finally {
      setExecuting(false);
    }
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function downloadResults() {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demo-results-${results.configName}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Header management functions for simulation mode
  function addSimulationHeader() {
    setSimulationHeaders([...simulationHeaders, { key: '', value: '' }]);
  }

  function removeSimulationHeader(index) {
    if (simulationHeaders.length === 1) {
      setSimulationHeaders([{ key: '', value: '' }]);
    } else {
      setSimulationHeaders(simulationHeaders.filter((_, i) => i !== index));
    }
  }

  function updateSimulationHeader(index, field, value) {
    const updated = [...simulationHeaders];
    updated[index][field] = value;
    setSimulationHeaders(updated);
  }

  function getSimulationHeadersObject() {
    const obj = {};
    simulationHeaders.forEach(({ key, value }) => {
      if (key.trim()) {
        obj[key.trim()] = value;
      }
    });
    return obj;
  }

  if (loading) {
    return <div className="card text-center">Loading configurations...</div>;
  }

  return (
    <div className="demo-page">
      <div className="page-header">
        <h1>Process Events</h1>
        <div className="flex gap-1">
          {results && (
            <button className="btn btn-secondary" onClick={downloadResults}>
              <Download size={16} />
              Download Results
            </button>
          )}
        </div>
      </div>

      {configurations.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p>No configurations found</p>
            <p className="text-sm text-muted">Create a configuration first in the Configuration page</p>
          </div>
        </div>
      ) : (
        <>
          {/* Configuration Selection */}
          <div className="card">
            <div className="form-group">
              <label>Select Configuration</label>
              <div className="flex gap-1">
                <select
                  className="form-control"
                  value={selectedConfigId}
                  onChange={e => setSelectedConfigId(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">-- Select Configuration --</option>
                  {configurations.map(config => (
                    <option key={config.id} value={config.id}>{config.name}</option>
                  ))}
                </select>
                <button
                  className="btn btn-success"
                  onClick={executeDemo}
                  disabled={!selectedConfigId || executing}
                >
                  {executing ? (
                    <>
                      <Loader size={16} className="spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      Fetch and Process Events
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Configuration Summary */}
          {selectedConfig && (
            <div className="card">
              <div className="card-header">
                <h2>Configuration Summary: {selectedConfig.name}</h2>
                {liveMode && (
                  <span className="badge badge-success">
                    <Radio size={12} />
                    Live Mode
                  </span>
                )}
              </div>
              <div className="config-summary">
                <div className="summary-item">
                  <div className="summary-icon source">
                    <Zap size={20} />
                  </div>
                  <div className="summary-content">
                    <h4>Source</h4>
                    <p className="summary-type">
                      {liveMode ? 'Azure Event Hub' : (selectedConfig.source.type === 'event' ? 'Event Sample' : 'File Upload')}
                    </p>
                    {eventSample && !liveMode && <p className="summary-detail">{eventSample.name}</p>}
                    {liveMode && eventHubStatus?.connected && (
                      <p className="summary-detail">{eventHubStatus.eventHub}</p>
                    )}
                  </div>
                </div>

                <ArrowRight size={24} className="summary-arrow" />

                <div className="summary-item">
                  <div className="summary-icon mapping">
                    <RefreshCw size={20} />
                  </div>
                  <div className="summary-content">
                    <h4>Mapping</h4>
                    <p className="summary-type">{Object.keys(selectedConfig.mapping || {}).length} field mappings</p>
                    {selectedConfig.eventType && (
                      <p className="summary-detail">
                        <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Filter: {selectedConfig.eventType}</span>
                      </p>
                    )}
                  </div>
                </div>

                <ArrowRight size={24} className="summary-arrow" />

                <div className="summary-item">
                  <div className="summary-icon api">
                    <Radio size={20} />
                  </div>
                  <div className="summary-content">
                    <h4>API Destination</h4>
                    {apiSample && (
                      <>
                        <p className="summary-type">{apiSample.name}</p>
                        <p className="summary-detail">
                          <span className="badge badge-info">{apiSample.method}</span>
                          <span className="api-url">{apiSample.endpoint}</span>
                        </p>
                        {liveMode && (
                          <p className="summary-warning">
                            <AlertTriangle size={12} />
                            Will make real HTTP calls
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Processing Animation */}
          {executing && (
            <div className="card">
              <div className="card-header">
                <h2>Processing (Live)...</h2>
              </div>
              <div className="processing-flow">
                <ProcessingStep
                  step={1}
                  currentStep={currentStep}
                  label="Initialize"
                  icon="init"
                />
                <ArrowRight size={24} className="flow-arrow" />
                <ProcessingStep
                  step={2}
                  currentStep={currentStep}
                  label="Read Event Hub"
                  icon="source"
                />
                <ArrowRight size={24} className="flow-arrow" />
                <ProcessingStep
                  step={3}
                  currentStep={currentStep}
                  label="Apply Mapping"
                  icon="mapping"
                />
                <ArrowRight size={24} className="flow-arrow" />
                <ProcessingStep
                  step={4}
                  currentStep={currentStep}
                  label="Call Real API"
                  icon="api"
                />
                <ArrowRight size={24} className="flow-arrow" />
                <ProcessingStep
                  step={5}
                  currentStep={currentStep}
                  label="Process Response"
                  icon="response"
                />
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="card results-card">
              <div className="card-header">
                <h2>Execution Results</h2>
                <div className="flex gap-1">
                  {results.liveMode && (
                    <span className="badge badge-success">
                      <Radio size={12} />
                      Live
                    </span>
                  )}
                  {!results.liveMode && results.useRealApi && (
                    <span className="badge badge-warning">
                      <ExternalLink size={12} />
                      Real API
                    </span>
                  )}
                  {results.apiEndpointOverridden && (
                    <span className="badge badge-info">
                      Endpoint Modified
                    </span>
                  )}
                  <span className="badge badge-success">
                    {results.successCount} / {results.totalRecords} success
                  </span>
                  {results.failedCount > 0 && (
                    <span className="badge badge-error">
                      {results.failedCount} failed
                    </span>
                  )}
                  <button className="btn btn-secondary btn-sm" onClick={() => { setResults(null); setCurrentStep(0); }}>
                    <RefreshCw size={14} />
                    Reset
                  </button>
                </div>
              </div>

              {/* Results Summary */}
              <div className="results-summary">
                {results.liveMode && results.eventHubResult && (
                  <div className="summary-stat">
                    <span className="stat-label">Events from Hub</span>
                    <span className="stat-value">{results.eventHubResult.eventsRead}</span>
                  </div>
                )}
                {results.eventType && (
                  <div className="summary-stat">
                    <span className="stat-label">Event Type Filter</span>
                    <span className="stat-value" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{results.eventType}</span>
                  </div>
                )}
                {results.liveMode && results.eventHubResult?.eventsAfterFilter !== undefined && (
                  <div className="summary-stat">
                    <span className="stat-label">After Filter</span>
                    <span className="stat-value">{results.eventHubResult.eventsAfterFilter}</span>
                  </div>
                )}
                <div className="summary-stat">
                  <span className="stat-label">Total Processed</span>
                  <span className="stat-value">{results.processedRecords}</span>
                </div>
                <div className="summary-stat">
                  <span className="stat-label">API Endpoint</span>
                  <span className="stat-value api-endpoint">{results.apiMethod} {results.apiEndpoint}</span>
                </div>
              </div>

              {/* Headers Used (for live mode / real API calls) */}
              {(results.liveMode || results.useRealApi) && results.results?.[0]?.apiResponse?.headersUsed && (
                <div className="headers-used-section">
                  <h4>HTTP Headers Used</h4>
                  <div className="headers-used-list">
                    {Object.entries(results.results[0].apiResponse.headersUsed).map(([key, value]) => (
                      <div key={key} className="header-used-item">
                        <span className="header-key">{key}:</span>
                        <span className="header-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Variables Substituted */}
              {results.variablesSubstituted && results.variablesSubstituted.length > 0 && (
                <div className="variables-section substituted">
                  <h4>
                    <Database size={14} />
                    Variables Substituted
                  </h4>
                  <div className="variables-list">
                    {results.variablesSubstituted.map((sub, index) => (
                      <div key={index} className="variable-item">
                        <span className="variable-name">{`{{${sub.variable}}}`}</span>
                        <span className="variable-arrow">→</span>
                        <span className="variable-value">"{sub.value}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Variables Captured */}
              {results.variablesCaptured && results.variablesCaptured.length > 0 && (
                <div className="variables-section captured">
                  <h4>
                    <Save size={14} />
                    Variables Captured
                  </h4>
                  <div className="variables-list">
                    {results.variablesCaptured.map((cap, index) => (
                      <div key={index} className="variable-item">
                        <span className="variable-name">{`{{${cap.variableName}}}`}</span>
                        <span className="variable-arrow">←</span>
                        <span className="variable-path">{cap.responsePath}</span>
                        <span className="variable-equals">=</span>
                        <span className="variable-value">"{cap.value}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.message && results.totalRecords === 0 && (
                <div className="alert alert-warning">
                  <AlertTriangle size={16} />
                  {results.message}
                </div>
              )}

              {results.results && results.results.length > 0 && (
                <div className="results-table-container">
                  <table className="table results-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Source Data</th>
                        <th>Mapped Request</th>
                        <th>Status</th>
                        <th>API Response</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.results.map((result, index) => (
                        <tr key={index} className={result.status === 'failed' ? 'row-failed' : ''}>
                          <td>
                            <span className="record-number">{index + 1}</span>
                          </td>
                          <td>
                            <div className="json-cell">
                              <pre>{JSON.stringify(result.sourceData, null, 2)}</pre>
                            </div>
                          </td>
                          <td>
                            <div className="json-cell">
                              <pre>{JSON.stringify(result.mappedRequest, null, 2)}</pre>
                            </div>
                          </td>
                          <td>
                            {result.status === 'success' ? (
                              <div className="status-badge success">
                                <CheckCircle size={14} />
                                <span>Success</span>
                                {result.apiResponse?.duration && (
                                  <span className="duration">
                                    <Clock size={10} />
                                    {result.apiResponse.duration}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="status-badge error">
                                <XCircle size={14} />
                                <span>Failed</span>
                                {result.error && (
                                  <span className="error-msg">{result.error}</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="json-cell">
                              {result.apiResponse?.isLive && (
                                <span className="response-badge live">Live Response</span>
                              )}
                              {result.apiResponse?.isSimulated && (
                                <span className="response-badge simulated">Simulated</span>
                              )}
                              <pre>{JSON.stringify(result.apiResponse?.data || result.apiResponse, null, 2)}</pre>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Successful Events Modal */}
      {showSuccessfulEventsModal && (
        <div className="modal-overlay" onClick={() => setShowSuccessfulEventsModal(false)}>
          <div className="modal-content successful-events-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header success-header">
              <h2>
                <CheckCircle size={20} />
                Successful Events ({successfulEvents.length})
              </h2>
              <button className="btn-close" onClick={() => setShowSuccessfulEventsModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {/* Filters Section */}
              <div className="successful-events-filters">
                <div className="filter-row">
                  <div className="filter-group search-group">
                    <label><Search size={14} /> Search</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search in event data..."
                      value={successfulEventsFilters.search}
                      onChange={(e) => handleSuccessfulEventsFilterChange('search', e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label><Filter size={14} /> Partition</label>
                    <select
                      className="form-control"
                      value={successfulEventsFilters.partition}
                      onChange={(e) => handleSuccessfulEventsFilterChange('partition', e.target.value)}
                    >
                      <option value="">All Partitions</option>
                      {successfulEventsPartitions.map(p => (
                        <option key={p} value={p}>Partition {p}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="filter-row">
                  <div className="filter-group">
                    <label><Calendar size={14} /> From Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={successfulEventsFilters.fromDate}
                      onChange={(e) => handleSuccessfulEventsFilterChange('fromDate', e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label><Calendar size={14} /> To Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={successfulEventsFilters.toDate}
                      onChange={(e) => handleSuccessfulEventsFilterChange('toDate', e.target.value)}
                    />
                  </div>
                  <div className="filter-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleApplySuccessfulEventsFilters}
                      disabled={loadingSuccessfulEvents}
                    >
                      {loadingSuccessfulEvents ? <Loader size={14} className="spin" /> : <Search size={14} />}
                      Apply
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleClearSuccessfulEventsFilters}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {loadingSuccessfulEvents ? (
                <div className="loading-state">
                  <Loader size={24} className="spin" />
                  Loading successful events...
                </div>
              ) : successfulEvents.length === 0 ? (
                <div className="empty-state">No successful events found</div>
              ) : (
                <>
                  <div className="successful-events-actions">
                    <button
                      className="btn btn-danger"
                      onClick={handleClearSuccessfulEvents}
                    >
                      <Trash2 size={16} />
                      Clear All History
                    </button>
                    <small>This will permanently delete all successful event records.</small>
                  </div>
                  <div className="successful-events-list">
                    {successfulEvents.map((event) => (
                      <div key={event.id} className="successful-event-item">
                        <div className="successful-event-header" onClick={() => setExpandedSuccessfulEvent(expandedSuccessfulEvent === event.id ? null : event.id)}>
                          <div className="successful-event-info">
                            <span className="partition-badge">P{event.partitionId}</span>
                            <span className="seq-badge success">Seq: {event.sequenceNumber}</span>
                            <span className="success-time">
                              <Clock size={12} />
                              {new Date(event.processedAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="successful-event-actions">
                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveSuccessfulEvent(event.id);
                              }}
                              title="Remove from history"
                            >
                              <Trash2 size={14} />
                            </button>
                            {expandedSuccessfulEvent === event.id ? (
                              <ChevronUp size={18} />
                            ) : (
                              <ChevronDown size={18} />
                            )}
                          </div>
                        </div>
                        {expandedSuccessfulEvent === event.id && (
                          <div className="successful-event-details">
                            <div className="event-detail-section">
                              <h4>Source Data:</h4>
                              <pre>{JSON.stringify(event.sourceData, null, 2)}</pre>
                            </div>
                            <div className="event-detail-section">
                              <h4>Mapped Request:</h4>
                              <pre>{JSON.stringify(event.mappedRequest, null, 2)}</pre>
                            </div>
                            <div className="event-detail-section">
                              <h4>API Response:</h4>
                              <pre>{JSON.stringify(event.apiResponse, null, 2)}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Failed Events Modal */}
      {showFailedEventsModal && (
        <div className="modal-overlay" onClick={() => setShowFailedEventsModal(false)}>
          <div className="modal-content failed-events-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <AlertTriangle size={20} />
                Failed Events ({failedEvents.length})
              </h2>
              <button className="btn-close" onClick={() => setShowFailedEventsModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {failedEvents.length === 0 ? (
                <div className="empty-state">No failed events</div>
              ) : (
                <>
                  <div className="failed-events-actions">
                    <button
                      className="btn btn-warning"
                      onClick={handleClearFailedEvents}
                    >
                      <RotateCcw size={16} />
                      Clear All (Allow Retry)
                    </button>
                    <small>Clearing failed events will allow them to be reprocessed on the next run.</small>
                  </div>
                  <div className="failed-events-list">
                    {failedEvents.map((event) => (
                      <div key={event.id} className="failed-event-item">
                        <div className="failed-event-header" onClick={() => setExpandedFailedEvent(expandedFailedEvent === event.id ? null : event.id)}>
                          <div className="failed-event-info">
                            <span className="partition-badge">P{event.partitionId}</span>
                            <span className="seq-badge">Seq: {event.sequenceNumber}</span>
                            <span className="failed-time">
                              <Clock size={12} />
                              {new Date(event.failedAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="failed-event-actions">
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFailedEvent(event.id);
                              }}
                              title="Remove (allow retry)"
                            >
                              <Trash2 size={14} />
                            </button>
                            {expandedFailedEvent === event.id ? (
                              <ChevronUp size={18} />
                            ) : (
                              <ChevronDown size={18} />
                            )}
                          </div>
                        </div>
                        <div className="failed-event-error">
                          <XCircle size={14} />
                          {event.error}
                        </div>
                        {expandedFailedEvent === event.id && (
                          <div className="failed-event-body">
                            <h4>Event Body:</h4>
                            <pre>{JSON.stringify(event.body, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Environment Variables Modal */}
      {showVariablesModal && (
        <div className="modal-overlay" onClick={() => setShowVariablesModal(false)}>
          <div className="modal-content variables-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header variables-header">
              <h2>
                <Database size={20} />
                Environment Variables
              </h2>
              <button className="btn-close" onClick={() => setShowVariablesModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {loadingVariables ? (
                <div className="loading-state">
                  <Loader size={24} className="spin" />
                  Loading variables...
                </div>
              ) : Object.keys(configVariables.variables || {}).length === 0 ? (
                <div className="empty-state">
                  <Database size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <p>No variables stored for this configuration</p>
                  <p className="text-sm text-muted">Variables are captured from API responses based on Response Capture rules defined in API Samples.</p>
                </div>
              ) : (
                <>
                  <div className="variables-modal-actions">
                    <button className="btn btn-danger" onClick={handleClearVariables}>
                      <Trash2 size={16} />
                      Clear All Variables
                    </button>
                    <button className="btn btn-secondary" onClick={loadVariables}>
                      <RefreshCw size={16} />
                      Refresh
                    </button>
                  </div>
                  <div className="variables-table-container">
                    <table className="table variables-table">
                      <thead>
                        <tr>
                          <th>Variable</th>
                          <th>Value</th>
                          <th>Source</th>
                          <th>Captured At</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(configVariables.variables).map(([name, data]) => (
                          <tr key={name}>
                            <td>
                              <code className="variable-name-cell">{`{{${name}}}`}</code>
                            </td>
                            <td>
                              {editingVariable === name ? (
                                <div className="edit-value-container">
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    autoFocus
                                  />
                                  <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleSaveVariable(name)}
                                    title="Save"
                                  >
                                    <Save size={14} />
                                  </button>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={handleCancelEdit}
                                    title="Cancel"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <span className="variable-value-cell" title={data.value}>
                                  {data.value?.length > 50 ? data.value.substring(0, 50) + '...' : data.value}
                                </span>
                              )}
                            </td>
                            <td>
                              <span className="text-muted text-sm">
                                {data.sourcePath || data.capturedFrom || '-'}
                              </span>
                            </td>
                            <td>
                              <span className="text-muted text-sm">
                                {data.capturedAt ? new Date(data.capturedAt).toLocaleString() : '-'}
                              </span>
                            </td>
                            <td>
                              <div className="variable-actions">
                                {editingVariable !== name && (
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleStartEditVariable(name, data.value)}
                                    title="Edit value"
                                  >
                                    <Edit size={14} />
                                  </button>
                                )}
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDeleteVariable(name)}
                                  title="Delete variable"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="variables-help">
                    <p className="text-sm text-muted">
                      <strong>Usage:</strong> Use <code>{`{{variableName}}`}</code> in your API request body, headers, or endpoint URL. Variables will be substituted automatically during execution.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Mode Toggle */
        .mode-toggle-card {
          padding: 1.5rem;
        }

        .mode-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid var(--success-color);
          border-radius: 0.5rem;
          color: var(--success-color);
        }

        .mode-header span {
          font-weight: 600;
          color: var(--text-primary);
        }

        .mode-header small {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-left: auto;
        }

        /* Event Hub Status */
        .event-hub-status {
          padding: 1rem;
          background: var(--bg-color);
          border-radius: 0.5rem;
          margin-top: 1rem;
        }

        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .status-header h4 {
          font-size: 0.875rem;
          font-weight: 600;
        }

        .status-checking,
        .status-connected,
        .status-disconnected {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .status-checking {
          background: rgba(59, 130, 246, 0.1);
          color: var(--primary-color);
        }

        .status-connected {
          background: rgba(34, 197, 94, 0.1);
        }

        .status-disconnected {
          background: rgba(239, 68, 68, 0.1);
        }

        .status-icon.success {
          color: var(--success-color);
        }

        .status-icon.error {
          color: var(--error-color);
        }

        .status-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .status-label {
          font-size: 0.875rem;
        }

        .status-info {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .status-error {
          font-size: 0.75rem;
          color: var(--error-color);
        }

        .event-hub-options {
          display: flex;
          gap: 1rem;
        }

        .option-group {
          flex: 1;
        }

        .option-group label {
          display: block;
          font-size: 0.75rem;
          font-weight: 500;
          margin-bottom: 0.375rem;
          color: var(--text-secondary);
        }

        .option-group .form-control {
          padding: 0.5rem;
          font-size: 0.875rem;
        }

        /* Config Summary */
        .config-summary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          padding: 1.5rem;
          flex-wrap: wrap;
        }

        .summary-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-color);
          border-radius: 0.75rem;
          min-width: 200px;
        }

        .summary-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .summary-icon.source {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        }

        .summary-icon.mapping {
          background: linear-gradient(135deg, #8b5cf6, #6d28d9);
        }

        .summary-icon.api {
          background: linear-gradient(135deg, #22c55e, #16a34a);
        }

        .summary-content h4 {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          margin-bottom: 0.25rem;
        }

        .summary-type {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .summary-detail {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .summary-detail .api-url {
          font-family: monospace;
          margin-left: 0.5rem;
        }

        .summary-warning {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.7rem;
          color: var(--warning-color);
          margin-top: 0.25rem;
        }

        .summary-arrow {
          color: var(--border-color);
        }

        /* Processing Flow */
        .processing-flow {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .flow-arrow {
          color: var(--border-color);
        }

        .processing-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .step-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-color);
          border: 2px solid var(--border-color);
          transition: all 0.3s;
        }

        .step-icon.pending {
          background: var(--bg-color);
          border-color: var(--border-color);
          color: var(--text-secondary);
        }

        .step-icon.active {
          background: #fef3c7;
          border-color: #f59e0b;
          color: #f59e0b;
          animation: pulse 1s infinite;
        }

        .step-icon.complete {
          background: #dcfce7;
          border-color: #22c55e;
          color: #22c55e;
        }

        .step-label {
          font-size: 0.75rem;
          font-weight: 500;
          text-align: center;
          max-width: 80px;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Results */
        .results-summary {
          display: flex;
          gap: 2rem;
          padding: 1rem;
          background: var(--bg-color);
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .summary-stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .stat-value {
          font-weight: 600;
        }

        .stat-value.api-endpoint {
          font-family: monospace;
          font-size: 0.875rem;
        }

        /* Headers Used Section */
        .headers-used-section {
          padding: 1rem;
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .headers-used-section h4 {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
          text-transform: uppercase;
        }

        .headers-used-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem 1.5rem;
        }

        .header-used-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8rem;
          font-family: 'Fira Code', monospace;
        }

        .header-used-item .header-key {
          color: var(--primary-color);
          font-weight: 500;
        }

        .header-used-item .header-value {
          color: var(--text-secondary);
        }

        .results-table-container {
          overflow-x: auto;
        }

        .results-table {
          font-size: 0.875rem;
        }

        .results-table th {
          white-space: nowrap;
        }

        .row-failed {
          background: rgba(239, 68, 68, 0.05);
        }

        .record-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: var(--primary-color);
          color: white;
          border-radius: 50%;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .json-cell {
          position: relative;
        }

        .json-cell pre {
          background: #1e293b;
          color: #e2e8f0;
          border-radius: 0.375rem;
          padding: 0.5rem;
          font-size: 0.7rem;
          max-height: 120px;
          overflow: auto;
          margin: 0;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .response-badge {
          display: inline-block;
          font-size: 0.625rem;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
          font-weight: 600;
        }

        .response-badge.live {
          background: rgba(34, 197, 94, 0.2);
          color: var(--success-color);
        }

        .response-badge.simulated {
          background: rgba(59, 130, 246, 0.2);
          color: var(--primary-color);
        }

        .status-badge {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.25rem;
        }

        .status-badge.success {
          color: var(--success-color);
        }

        .status-badge.error {
          color: var(--error-color);
        }

        .status-badge span {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .status-badge .duration {
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        .status-badge .error-msg {
          font-size: 0.7rem;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .alert-warning {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: 0.5rem;
          color: var(--warning-color);
          margin-bottom: 1rem;
        }

        /* Simulation Options */
        .simulation-options-card {
          border-left: 4px solid var(--primary-color);
        }

        .code-textarea {
          background: #1e293b;
          color: #e2e8f0;
          border: 1px solid var(--border-color);
        }

        .code-textarea:focus {
          border-color: var(--primary-color);
          outline: none;
        }

        .code-textarea.error {
          border-color: var(--error-color);
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          color: var(--error-color);
          font-size: 0.75rem;
          margin-top: 0.375rem;
        }

        .real-api-toggle {
          padding: 1rem;
          background: var(--bg-color);
          border-radius: 0.5rem;
          margin-top: 1rem;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
        }

        .toggle-label input[type="checkbox"] {
          width: 1.25rem;
          height: 1.25rem;
          cursor: pointer;
        }

        .toggle-text {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
        }

        .real-api-warning {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
          padding: 0.5rem 0.75rem;
          background: rgba(245, 158, 11, 0.1);
          border-radius: 0.375rem;
          font-size: 0.8rem;
          color: var(--warning-color);
        }

        /* Simulation Headers Section */
        .simulation-headers-section {
          margin-top: 1rem;
          padding: 1rem;
          background: var(--bg-color);
          border-radius: 0.5rem;
          border: 1px solid var(--border-color);
        }

        .headers-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .headers-section-header h3 {
          font-size: 0.9rem;
          font-weight: 600;
          margin: 0;
        }

        .headers-list {
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

        .badge-warning {
          background: rgba(245, 158, 11, 0.2);
          color: var(--warning-color);
        }

        /* Offset Tracking Section */
        .offset-tracking-section {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 0.5rem;
        }

        .offset-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .offset-header h4 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0;
        }

        .offset-actions {
          display: flex;
          gap: 0.5rem;
        }

        .offset-loading,
        .offset-empty {
          font-size: 0.8rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .offset-info {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .offset-stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .offset-stat .label {
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        .offset-stat .value {
          font-weight: 600;
          font-size: 0.85rem;
        }

        .partitions-list {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
        }

        .partitions-list .label {
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        .partition-badge {
          font-size: 0.7rem;
          padding: 0.125rem 0.375rem;
          background: rgba(59, 130, 246, 0.2);
          color: var(--primary-color);
          border-radius: 0.25rem;
          font-family: monospace;
        }

        .btn-warning {
          background: var(--warning-color);
          color: white;
          border: none;
        }

        .btn-warning:hover {
          background: #d97706;
        }

        /* Failed Events Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          background: var(--card-bg);
          border-radius: 0.75rem;
          max-width: 700px;
          width: 100%;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .modal-header h2 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.125rem;
          color: var(--error-color);
          margin: 0;
        }

        .btn-close {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
        }

        .btn-close:hover {
          background: var(--bg-color);
          color: var(--text-color);
        }

        .modal-body {
          padding: 1.5rem;
          overflow-y: auto;
        }

        .failed-events-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .failed-events-actions small {
          color: var(--text-secondary);
          font-size: 0.75rem;
        }

        .failed-events-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .failed-event-item {
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .failed-event-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: var(--bg-color);
          cursor: pointer;
        }

        .failed-event-header:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .failed-event-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .seq-badge {
          font-size: 0.7rem;
          padding: 0.125rem 0.375rem;
          background: rgba(139, 92, 246, 0.2);
          color: #8b5cf6;
          border-radius: 0.25rem;
          font-family: monospace;
        }

        .failed-time {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .failed-event-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .failed-event-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          color: var(--error-color);
          font-size: 0.8rem;
        }

        .failed-event-body {
          padding: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .failed-event-body h4 {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }

        .failed-event-body pre {
          background: #1e293b;
          color: #e2e8f0;
          padding: 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.7rem;
          overflow-x: auto;
          margin: 0;
        }

        /* Successful Events Modal */
        .successful-events-modal {
          max-width: 900px;
        }

        .success-header h2 {
          color: var(--success-color) !important;
        }

        .btn-success {
          background: var(--success-color);
          color: white;
          border: none;
        }

        .btn-success:hover {
          background: #16a34a;
        }

        .successful-events-filters {
          background: var(--bg-color);
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .filter-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }

        .filter-row:last-child {
          margin-bottom: 0;
        }

        .filter-group {
          flex: 1;
        }

        .filter-group.search-group {
          flex: 2;
        }

        .filter-group label {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
          margin-bottom: 0.375rem;
          color: var(--text-secondary);
        }

        .filter-group .form-control {
          padding: 0.5rem;
          font-size: 0.875rem;
        }

        .filter-actions {
          display: flex;
          align-items: flex-end;
          gap: 0.5rem;
        }

        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 2rem;
          color: var(--text-secondary);
        }

        .successful-events-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .successful-events-actions small {
          color: var(--text-secondary);
          font-size: 0.75rem;
        }

        .successful-events-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .successful-event-item {
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .successful-event-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: rgba(34, 197, 94, 0.05);
          cursor: pointer;
        }

        .successful-event-header:hover {
          background: rgba(34, 197, 94, 0.1);
        }

        .successful-event-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .seq-badge.success {
          background: rgba(34, 197, 94, 0.2);
          color: var(--success-color);
        }

        .success-time {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .successful-event-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-ghost {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 0.375rem;
          cursor: pointer;
          border-radius: 0.25rem;
        }

        .btn-ghost:hover {
          background: rgba(0, 0, 0, 0.1);
          color: var(--error-color);
        }

        .successful-event-details {
          padding: 1rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .event-detail-section h4 {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          font-weight: 600;
        }

        .event-detail-section pre {
          background: #1e293b;
          color: #e2e8f0;
          padding: 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.7rem;
          overflow-x: auto;
          margin: 0;
          max-height: 200px;
        }

        /* Variables Section in Results */
        .variables-section {
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .variables-section.substituted {
          background: rgba(139, 92, 246, 0.05);
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .variables-section.captured {
          background: rgba(34, 197, 94, 0.05);
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .variables-section h4 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
          text-transform: uppercase;
        }

        .variables-section.substituted h4 {
          color: #8b5cf6;
        }

        .variables-section.captured h4 {
          color: var(--success-color);
        }

        .variables-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .variable-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8rem;
          font-family: 'Fira Code', monospace;
          padding: 0.375rem 0.625rem;
          background: var(--card-bg);
          border-radius: 0.375rem;
          border: 1px solid var(--border-color);
        }

        .variable-name {
          color: #8b5cf6;
          font-weight: 500;
        }

        .variable-arrow {
          color: var(--text-secondary);
        }

        .variable-path {
          color: var(--text-secondary);
          font-size: 0.75rem;
        }

        .variable-equals {
          color: var(--text-secondary);
        }

        .variable-value {
          color: var(--success-color);
        }

        /* Variables Modal */
        .variables-modal {
          max-width: 900px;
        }

        .variables-header h2 {
          color: #8b5cf6 !important;
        }

        .variables-modal-actions {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .variables-table-container {
          overflow-x: auto;
        }

        .variables-table {
          width: 100%;
          font-size: 0.85rem;
        }

        .variables-table th {
          text-align: left;
          padding: 0.75rem;
          background: var(--bg-color);
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-secondary);
        }

        .variables-table td {
          padding: 0.75rem;
          border-bottom: 1px solid var(--border-color);
          vertical-align: middle;
        }

        .variable-name-cell {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.8rem;
        }

        .variable-value-cell {
          font-family: 'Fira Code', monospace;
          font-size: 0.8rem;
        }

        .edit-value-container {
          display: flex;
          gap: 0.375rem;
          align-items: center;
        }

        .edit-value-container input {
          flex: 1;
          min-width: 150px;
        }

        .variable-actions {
          display: flex;
          gap: 0.375rem;
        }

        .variables-help {
          margin-top: 1rem;
          padding: 0.75rem;
          background: var(--bg-color);
          border-radius: 0.375rem;
        }

        .variables-help code {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
        }

        @media (max-width: 768px) {
          .mode-toggle {
            flex-direction: column;
          }

          .event-hub-options {
            flex-direction: column;
          }

          .config-summary {
            flex-direction: column;
          }

          .summary-arrow {
            transform: rotate(90deg);
          }
        }
      `}</style>
    </div>
  );
}

function ProcessingStep({ step, currentStep, label, icon }) {
  let status = 'pending';
  if (currentStep > step) status = 'complete';
  else if (currentStep === step) status = 'active';

  return (
    <div className="processing-step">
      <div className={`step-icon ${status}`}>
        {status === 'complete' ? (
          <CheckCircle size={28} />
        ) : status === 'active' ? (
          <Loader size={28} className="spin" />
        ) : (
          <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{step}</span>
        )}
      </div>
      <span className="step-label">{label}</span>
    </div>
  );
}
