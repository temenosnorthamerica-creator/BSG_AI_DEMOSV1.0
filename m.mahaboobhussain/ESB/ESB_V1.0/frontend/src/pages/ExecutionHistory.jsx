import React, { useState, useEffect } from 'react';
import {
  History, CheckCircle, XCircle, Loader, Search, Filter, Calendar,
  ChevronDown, ChevronUp, Download, RefreshCw, Trash2, Variable,
  ArrowRight, Clock, Database, FileJson, ExternalLink, Settings, X, Check,
  Users, Globe, FileSpreadsheet, Eye
} from 'lucide-react';
import { configurationsApi, offsetsApi, sampleApisApi, sampleEventsApi, apiHistoryApi, sampleFilesApi } from '../services/api';

function ExecutionHistory() {
  // Tab state
  const [activeTab, setActiveTab] = useState('crm');

  // ===== CRM (Events) State =====
  const [configurations, setConfigurations] = useState([]);
  const [selectedConfigId, setSelectedConfigId] = useState('');
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [apiSample, setApiSample] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [partitions, setPartitions] = useState([]);
  const [showConfigDetails, setShowConfigDetails] = useState(false);
  const [eventSample, setEventSample] = useState(null);
  const [displayPrefs, setDisplayPrefs] = useState({ sourceFields: [], responseFields: [] });
  const [showFieldsModal, setShowFieldsModal] = useState(false);
  const [tempSelectedFields, setTempSelectedFields] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    partition: '',
    fromDate: '',
    toDate: ''
  });
  const [crmViewMode, setCrmViewMode] = useState('success');
  const [failedEvents, setFailedEvents] = useState([]);
  const [loadingFailedEvents, setLoadingFailedEvents] = useState(false);

  // ===== Digital (API) State =====
  const [apiSamples, setApiSamples] = useState([]);
  const [selectedApiSampleId, setSelectedApiSampleId] = useState('');
  const [selectedApiSample, setSelectedApiSample] = useState(null);
  const [loadingApiHistory, setLoadingApiHistory] = useState(false);
  const [apiHistory, setApiHistory] = useState([]);
  const [apiSummary, setApiSummary] = useState(null);
  const [expandedApiHistoryId, setExpandedApiHistoryId] = useState(null);
  const [apiFilters, setApiFilters] = useState({
    search: '',
    fromDate: '',
    toDate: ''
  });
  // Digital display preferences
  const [apiDisplayPrefs, setApiDisplayPrefs] = useState({ requestFields: [] });
  const [showApiFieldsModal, setShowApiFieldsModal] = useState(false);
  const [tempApiSelectedFields, setTempApiSelectedFields] = useState([]);

  // ===== CSV State =====
  const [csvFiles, setCsvFiles] = useState([]);
  const [selectedCsvFileId, setSelectedCsvFileId] = useState('');
  const [selectedCsvFile, setSelectedCsvFile] = useState(null);
  const [loadingCsvBatches, setLoadingCsvBatches] = useState(false);
  const [csvBatches, setCsvBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loadingBatchRecords, setLoadingBatchRecords] = useState(false);
  const [batchRecords, setBatchRecords] = useState([]);
  const [csvSummary, setCsvSummary] = useState(null);
  const [expandedCsvHistoryId, setExpandedCsvHistoryId] = useState(null);
  const [showBatchRecordsModal, setShowBatchRecordsModal] = useState(false);

  // ===== CRM Effects =====
  useEffect(() => {
    if (activeTab === 'crm') {
      loadConfigurations();
    } else if (activeTab === 'digital') {
      loadApiSamples();
    } else if (activeTab === 'csv') {
      loadCsvFiles();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'crm' && selectedConfigId) {
      loadConfigDetails();
      loadEvents();
      loadFailedEvents();
      loadSummary();
      loadPartitions();
      loadDisplayPreferences();
    } else if (activeTab === 'crm') {
      setSelectedConfig(null);
      setApiSample(null);
      setEventSample(null);
      setEvents([]);
      setFailedEvents([]);
      setCrmViewMode('success');
      setSummary(null);
      setDisplayPrefs({ sourceFields: [], responseFields: [] });
    }
  }, [selectedConfigId, activeTab]);

  // ===== Digital Effects =====
  useEffect(() => {
    if (activeTab === 'digital' && selectedApiSampleId) {
      loadApiSampleDetails();
      loadApiHistory();
      loadApiSummary();
      loadApiDisplayPreferences();
    } else if (activeTab === 'digital') {
      setSelectedApiSample(null);
      setApiHistory([]);
      setApiSummary(null);
      setApiDisplayPrefs({ requestFields: [] });
    }
  }, [selectedApiSampleId, activeTab]);

  // ===== CSV Effects =====
  useEffect(() => {
    if (activeTab === 'csv' && selectedCsvFileId) {
      loadCsvFileDetails();
      loadCsvBatches();
      loadCsvSummary();
      // Reset batch selection when file changes
      setSelectedBatchId(null);
      setSelectedBatch(null);
      setBatchRecords([]);
    } else if (activeTab === 'csv') {
      setSelectedCsvFile(null);
      setCsvBatches([]);
      setCsvSummary(null);
      setSelectedBatchId(null);
      setSelectedBatch(null);
      setBatchRecords([]);
    }
  }, [selectedCsvFileId, activeTab]);

  // Load batch records when a batch is selected
  useEffect(() => {
    if (activeTab === 'csv' && selectedCsvFileId && selectedBatchId) {
      loadBatchRecords();
      const batch = csvBatches.find(b => b.id === selectedBatchId);
      setSelectedBatch(batch);
    } else {
      setBatchRecords([]);
      setSelectedBatch(null);
    }
  }, [selectedBatchId, activeTab]);

  // ===== CRM Functions =====
  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const configs = await configurationsApi.getAll();
      setConfigurations(configs);
    } catch (err) {
      console.error('Failed to load configurations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadConfigDetails = async () => {
    try {
      const config = await configurationsApi.getById(selectedConfigId);
      setSelectedConfig(config);

      if (config.destination?.apiSampleId) {
        const api = await sampleApisApi.getById(config.destination.apiSampleId);
        setApiSample(api);
      }

      if (config.source?.eventSampleId) {
        const event = await sampleEventsApi.getById(config.source.eventSampleId);
        setEventSample(event);
      }
    } catch (err) {
      console.error('Failed to load configuration details:', err);
    }
  };

  const loadDisplayPreferences = async () => {
    try {
      const prefs = await offsetsApi.getDisplayPreferences(selectedConfigId);
      setDisplayPrefs(prefs);
    } catch (err) {
      console.error('Failed to load display preferences:', err);
    }
  };

  const loadEvents = async () => {
    try {
      setLoadingEvents(true);
      const eventsList = await offsetsApi.getSuccessfulEvents(selectedConfigId, filters);
      setEvents(eventsList);
    } catch (err) {
      console.error('Failed to load events:', err);
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadFailedEvents = async () => {
    try {
      setLoadingFailedEvents(true);
      const failedList = await offsetsApi.getFailedEvents(selectedConfigId);
      setFailedEvents(failedList);
    } catch (err) {
      console.error('Failed to load failed events:', err);
      setFailedEvents([]);
    } finally {
      setLoadingFailedEvents(false);
    }
  };

  const loadSummary = async () => {
    try {
      const summaryData = await offsetsApi.getOffsets(selectedConfigId);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load summary:', err);
    }
  };

  const loadPartitions = async () => {
    try {
      const partitionsList = await offsetsApi.getSuccessfulEventPartitions(selectedConfigId);
      setPartitions(partitionsList);
    } catch (err) {
      console.error('Failed to load partitions:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    loadEvents();
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      partition: '',
      fromDate: '',
      toDate: ''
    });
    setTimeout(() => loadEvents(), 0);
  };

  const handleExport = () => {
    const exportData = {
      configuration: selectedConfig?.name,
      exportedAt: new Date().toISOString(),
      summary: summary,
      events: events
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-history-${selectedConfig?.name || 'export'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearHistory = async () => {
    if (!confirm('Clear all execution history for this configuration? This cannot be undone.')) return;

    try {
      await offsetsApi.clearSuccessfulEvents(selectedConfigId);
      await offsetsApi.clearFailedEvents(selectedConfigId);
      setEvents([]);
      setFailedEvents([]);
      loadSummary();
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const toggleEventExpand = (eventId) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };

  const getAvailableSourceFields = () => {
    if (!eventSample?.fields) return [];
    return eventSample.fields;
  };

  const openFieldsModal = () => {
    setTempSelectedFields([...displayPrefs.sourceFields]);
    setShowFieldsModal(true);
  };

  const toggleFieldSelection = (field) => {
    setTempSelectedFields(prev => {
      if (prev.includes(field)) {
        return prev.filter(f => f !== field);
      } else {
        return [...prev, field];
      }
    });
  };

  const saveFieldPreferences = async () => {
    try {
      const prefs = await offsetsApi.saveDisplayPreferences(selectedConfigId, tempSelectedFields, []);
      setDisplayPrefs(prefs);
      setShowFieldsModal(false);
    } catch (err) {
      console.error('Failed to save display preferences:', err);
    }
  };

  const getDisplayFields = () => {
    if (displayPrefs.sourceFields && displayPrefs.sourceFields.length > 0) {
      return displayPrefs.sourceFields;
    }
    return Object.keys(selectedConfig?.mapping || {}).slice(0, 5);
  };

  const getMappedFields = () => {
    if (!selectedConfig?.mapping) return [];
    return Object.entries(selectedConfig.mapping).map(([source, target]) => ({
      source,
      target
    }));
  };

  const getCaptureRules = () => {
    return apiSample?.responseCapture || [];
  };

  const getKeyFieldValues = (event) => {
    const displayFields = getDisplayFields();
    const sourceData = event.sourceData || {};
    const keyFields = [];

    displayFields.forEach(fieldPath => {
      const value = getNestedValue(sourceData, fieldPath);
      if (value !== undefined) {
        keyFields.push({
          field: fieldPath,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value)
        });
      }
    });

    return keyFields;
  };

  const getCapturedVariables = (event) => {
    const captureRules = getCaptureRules();
    const response = event.apiResponse?.data || event.apiResponse || {};
    const captured = [];

    captureRules.forEach(rule => {
      const path = rule.responsePath || rule.sourcePath;
      const value = getNestedValue(response, path);
      if (value !== undefined) {
        captured.push({
          variableName: rule.variableName,
          path: path,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value)
        });
      }
    });

    return captured;
  };

  // ===== Digital Functions =====
  const loadApiSamples = async () => {
    try {
      setLoading(true);
      const samples = await sampleApisApi.getAll();
      setApiSamples(samples);
    } catch (err) {
      console.error('Failed to load API samples:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadApiSampleDetails = async () => {
    try {
      const sample = await sampleApisApi.getById(selectedApiSampleId);
      setSelectedApiSample(sample);
    } catch (err) {
      console.error('Failed to load API sample details:', err);
    }
  };

  const loadApiHistory = async () => {
    try {
      setLoadingApiHistory(true);
      const history = await apiHistoryApi.getHistory(selectedApiSampleId, apiFilters);
      setApiHistory(history);
    } catch (err) {
      console.error('Failed to load API history:', err);
      setApiHistory([]);
    } finally {
      setLoadingApiHistory(false);
    }
  };

  const loadApiSummary = async () => {
    try {
      const summaryData = await apiHistoryApi.getSummary(selectedApiSampleId);
      setApiSummary(summaryData);
    } catch (err) {
      console.error('Failed to load API summary:', err);
    }
  };

  const handleApiFilterChange = (key, value) => {
    setApiFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyApiFilters = () => {
    loadApiHistory();
  };

  const clearApiFilters = () => {
    setApiFilters({
      search: '',
      fromDate: '',
      toDate: ''
    });
    setTimeout(() => loadApiHistory(), 0);
  };

  const handleApiExport = () => {
    const exportData = {
      apiSample: selectedApiSample?.name,
      exportedAt: new Date().toISOString(),
      summary: apiSummary,
      history: apiHistory
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-history-${selectedApiSample?.name || 'export'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearApiHistory = async () => {
    if (!confirm('Clear all API history for this sample? This cannot be undone.')) return;

    try {
      await apiHistoryApi.clearHistory(selectedApiSampleId);
      setApiHistory([]);
      loadApiSummary();
    } catch (err) {
      console.error('Failed to clear API history:', err);
    }
  };

  const toggleApiHistoryExpand = (historyId) => {
    setExpandedApiHistoryId(expandedApiHistoryId === historyId ? null : historyId);
  };

  // Load API display preferences from localStorage
  const loadApiDisplayPreferences = () => {
    try {
      const stored = localStorage.getItem(`api-display-prefs-${selectedApiSampleId}`);
      if (stored) {
        setApiDisplayPrefs(JSON.parse(stored));
      } else {
        setApiDisplayPrefs({ requestFields: [] });
      }
    } catch (err) {
      console.error('Failed to load API display preferences:', err);
      setApiDisplayPrefs({ requestFields: [] });
    }
  };

  // Get available fields from API request sample
  const getAvailableApiRequestFields = () => {
    if (!selectedApiSample?.request?.fields) return [];
    return selectedApiSample.request.fields;
  };

  // Open API fields modal
  const openApiFieldsModal = () => {
    setTempApiSelectedFields([...apiDisplayPrefs.requestFields]);
    setShowApiFieldsModal(true);
  };

  // Toggle API field selection
  const toggleApiFieldSelection = (field) => {
    setTempApiSelectedFields(prev => {
      if (prev.includes(field)) {
        return prev.filter(f => f !== field);
      } else {
        return [...prev, field];
      }
    });
  };

  // Save API display field preferences to localStorage
  const saveApiFieldPreferences = () => {
    const prefs = { requestFields: tempApiSelectedFields };
    localStorage.setItem(`api-display-prefs-${selectedApiSampleId}`, JSON.stringify(prefs));
    setApiDisplayPrefs(prefs);
    setShowApiFieldsModal(false);
  };

  // Get display fields for API (use saved preferences or fall back to first 5 fields)
  const getApiDisplayFields = () => {
    if (apiDisplayPrefs.requestFields && apiDisplayPrefs.requestFields.length > 0) {
      return apiDisplayPrefs.requestFields;
    }
    // Fall back to first 5 request fields
    return getAvailableApiRequestFields().slice(0, 5);
  };

  // Extract key fields from API request body
  const getApiKeyFieldValues = (record) => {
    const displayFields = getApiDisplayFields();
    const requestBody = record.requestBody || {};
    const keyFields = [];

    displayFields.forEach(fieldPath => {
      const value = getNestedValue(requestBody, fieldPath);
      if (value !== undefined) {
        keyFields.push({
          field: fieldPath,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value)
        });
      }
    });

    return keyFields;
  };

  // ===== CSV Functions =====
  const loadCsvFiles = async () => {
    try {
      setLoading(true);
      const files = await sampleFilesApi.getAll();
      setCsvFiles(files);
    } catch (err) {
      console.error('Failed to load CSV files:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCsvFileDetails = async () => {
    try {
      const file = await sampleFilesApi.getById(selectedCsvFileId);
      setSelectedCsvFile(file);
    } catch (err) {
      console.error('Failed to load CSV file details:', err);
    }
  };

  const loadCsvBatches = async () => {
    try {
      setLoadingCsvBatches(true);
      const batches = await sampleFilesApi.getBatches(selectedCsvFileId);
      // Sort by loadedAt descending (most recent first)
      batches.sort((a, b) => new Date(b.loadedAt) - new Date(a.loadedAt));
      setCsvBatches(batches);
    } catch (err) {
      console.error('Failed to load CSV batches:', err);
      setCsvBatches([]);
    } finally {
      setLoadingCsvBatches(false);
    }
  };

  const loadBatchRecords = async () => {
    try {
      setLoadingBatchRecords(true);
      const records = await sampleFilesApi.getBatchRecords(selectedCsvFileId, selectedBatchId);
      setBatchRecords(records);
    } catch (err) {
      console.error('Failed to load batch records:', err);
      setBatchRecords([]);
    } finally {
      setLoadingBatchRecords(false);
    }
  };

  const loadCsvSummary = async () => {
    try {
      const summaryData = await sampleFilesApi.getHistorySummary(selectedCsvFileId);
      setCsvSummary(summaryData);
    } catch (err) {
      console.error('Failed to load CSV summary:', err);
    }
  };

  const handleCsvExport = () => {
    const exportData = {
      csvFile: selectedCsvFile?.name,
      exportedAt: new Date().toISOString(),
      summary: csvSummary,
      batches: csvBatches,
      selectedBatch: selectedBatch,
      batchRecords: selectedBatchId ? batchRecords : []
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `csv-history-${selectedCsvFile?.name || 'export'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearCsvHistory = async () => {
    if (!confirm('Clear all processing history for this CSV file? This cannot be undone.')) return;

    try {
      await sampleFilesApi.clearAllBatches(selectedCsvFileId);
      setCsvBatches([]);
      setSelectedBatchId(null);
      setSelectedBatch(null);
      setBatchRecords([]);
      loadCsvSummary();
    } catch (err) {
      console.error('Failed to clear CSV history:', err);
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (!confirm('Delete this batch and all its records? This cannot be undone.')) return;

    try {
      await sampleFilesApi.deleteBatch(selectedCsvFileId, batchId);
      if (selectedBatchId === batchId) {
        setSelectedBatchId(null);
        setSelectedBatch(null);
        setBatchRecords([]);
      }
      loadCsvBatches();
      loadCsvSummary();
    } catch (err) {
      console.error('Failed to delete batch:', err);
    }
  };

  const toggleCsvHistoryExpand = (historyId) => {
    setExpandedCsvHistoryId(expandedCsvHistoryId === historyId ? null : historyId);
  };

  const openBatchRecordsModal = (batch) => {
    setSelectedBatchId(batch.id);
    setSelectedBatch(batch);
    setShowBatchRecordsModal(true);
  };

  const closeBatchRecordsModal = () => {
    setShowBatchRecordsModal(false);
    setSelectedBatchId(null);
    setSelectedBatch(null);
    setBatchRecords([]);
    setExpandedCsvHistoryId(null);
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ===== Helper Functions =====
  const getNestedValue = (obj, path) => {
    if (!obj || !path) return undefined;

    if (path.includes('[]')) {
      const parts = path.split('[]');
      const arrayPath = parts[0].replace(/\.$/, '');
      const itemPath = parts[1]?.replace(/^\./, '');

      const array = arrayPath ? getNestedValue(obj, arrayPath) : obj;

      if (!Array.isArray(array)) return undefined;

      if (itemPath) {
        const values = array
          .map(item => getNestedValue(item, itemPath))
          .filter(v => v !== undefined);
        return values.length > 0 ? values.join(', ') : undefined;
      }

      return array;
    }

    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="page-loading">
        <Loader size={24} className="spin" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="execution-history-page">
      <div className="page-header">
        <div className="header-title">
          <History size={28} />
          <div>
            <h1>Execution History</h1>
            <p className="page-subtitle">View processed events and API call history</p>
          </div>
        </div>
        {activeTab === 'crm' && selectedConfigId && (
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={openFieldsModal} title="Configure Display Fields">
              <Settings size={16} />
              Display Fields
              {displayPrefs.sourceFields?.length > 0 && (
                <span className="badge-count">{displayPrefs.sourceFields.length}</span>
              )}
            </button>
            {events.length > 0 && (
              <>
                <button className="btn btn-secondary" onClick={() => { loadEvents(); loadFailedEvents(); loadSummary(); }} title="Refresh">
                  <RefreshCw size={16} />
                </button>
                <button className="btn btn-secondary" onClick={handleExport}>
                  <Download size={16} />
                  Export
                </button>
                <button className="btn btn-ghost text-danger" onClick={handleClearHistory}>
                  <Trash2 size={16} />
                  Clear History
                </button>
              </>
            )}
          </div>
        )}
        {activeTab === 'digital' && selectedApiSampleId && (
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={openApiFieldsModal} title="Configure Display Fields">
              <Settings size={16} />
              Display Fields
              {apiDisplayPrefs.requestFields?.length > 0 && (
                <span className="badge-count">{apiDisplayPrefs.requestFields.length}</span>
              )}
            </button>
            {apiHistory.length > 0 && (
              <>
                <button className="btn btn-secondary" onClick={() => { loadApiHistory(); loadApiSummary(); }} title="Refresh">
                  <RefreshCw size={16} />
                </button>
                <button className="btn btn-secondary" onClick={handleApiExport}>
                  <Download size={16} />
                  Export
                </button>
                <button className="btn btn-ghost text-danger" onClick={handleClearApiHistory}>
                  <Trash2 size={16} />
                  Clear History
                </button>
              </>
            )}
          </div>
        )}
        {activeTab === 'csv' && selectedCsvFileId && csvBatches.length > 0 && (
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => { loadCsvBatches(); loadCsvSummary(); }} title="Refresh">
              <RefreshCw size={16} />
            </button>
            <button className="btn btn-secondary" onClick={handleCsvExport}>
              <Download size={16} />
              Export
            </button>
            <button className="btn btn-ghost text-danger" onClick={handleClearCsvHistory}>
              <Trash2 size={16} />
              Clear History
            </button>
          </div>
        )}
      </div>

      {/* Tab Selector */}
      <div className="history-tabs">
        <button
          className={`history-tab ${activeTab === 'crm' ? 'active' : ''}`}
          onClick={() => setActiveTab('crm')}
        >
          <Users size={18} />
          <span>CRM</span>
          <span className="tab-desc">Event Processing History</span>
        </button>
        <button
          className={`history-tab ${activeTab === 'digital' ? 'active' : ''}`}
          onClick={() => setActiveTab('digital')}
        >
          <Globe size={18} />
          <span>Digital</span>
          <span className="tab-desc">API Call History</span>
        </button>
        <button
          className={`history-tab ${activeTab === 'csv' ? 'active' : ''}`}
          onClick={() => setActiveTab('csv')}
        >
          <FileSpreadsheet size={18} />
          <span>CSV</span>
          <span className="tab-desc">File Processing History</span>
        </button>
      </div>

      {/* CRM Tab Content */}
      {activeTab === 'crm' && (
        <>
          {/* Configuration Selector */}
          <div className="card config-selector-card">
            <div className="form-group">
              <label>Select Configuration</label>
              <select
                className="form-control"
                value={selectedConfigId}
                onChange={(e) => setSelectedConfigId(e.target.value)}
              >
                <option value="">-- Select a configuration --</option>
                {configurations.map(config => (
                  <option key={config.id} value={config.id}>
                    {config.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary Stats */}
          {selectedConfigId && summary && (
            <div className="card summary-card">
              <div className="summary-stats">
                <div className="stat">
                  <span className="stat-value">{summary.totalProcessed || 0}</span>
                  <span className="stat-label">Total Processed</span>
                </div>
                <div className="stat success">
                  <CheckCircle size={16} />
                  <span className="stat-value">{summary.successCount || 0}</span>
                  <span className="stat-label">Successful</span>
                </div>
                <div className="stat failed">
                  <XCircle size={16} />
                  <span className="stat-value">{summary.failedCount || 0}</span>
                  <span className="stat-label">Failed</span>
                </div>
                {summary.lastUpdated && (
                  <div className="stat">
                    <Clock size={16} />
                    <span className="stat-value">{formatDate(summary.lastUpdated)}</span>
                    <span className="stat-label">Last Updated</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Configuration Details - Collapsible */}
          {selectedConfig && (
            <div className={`card config-details-card ${showConfigDetails ? 'expanded' : 'collapsed'}`}>
              <div className="config-details-header" onClick={() => setShowConfigDetails(!showConfigDetails)}>
                <h3>
                  <FileJson size={18} />
                  Configuration: {selectedConfig.name}
                  <span className="header-badges">
                    <span className="badge">{getMappedFields().length} mappings</span>
                    <span className="badge">{getCaptureRules().length} capture rules</span>
                  </span>
                </h3>
                <button className="toggle-btn">
                  {showConfigDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
              {showConfigDetails && (
                <div className="config-details-content">
                  <div className="details-grid">
                    <div className="detail-section">
                      <h4>Field Mappings ({getMappedFields().length})</h4>
                      <div className="mappings-list">
                        {getMappedFields().map((m, idx) => (
                          <div key={idx} className="mapping-item">
                            <code className="source-field">{m.source}</code>
                            <ArrowRight size={14} />
                            <code className="target-field">{m.target}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="detail-section">
                      <h4>Response Capture Rules ({getCaptureRules().length})</h4>
                      {getCaptureRules().length > 0 ? (
                        <div className="capture-rules-list">
                          {getCaptureRules().map((rule, idx) => (
                            <div key={idx} className="capture-rule-item">
                              <Variable size={14} />
                              <code className="var-name">{`{{${rule.variableName}}}`}</code>
                              <span className="arrow">←</span>
                              <code className="response-path">{rule.responsePath || rule.sourcePath}</code>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-rules">No capture rules configured</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filters */}
          {selectedConfigId && (
            <div className="card filters-card">
              <div className="filters-header">
                <Filter size={16} />
                <span>Filters</span>
              </div>
              <div className="filters-content">
                <div className="filter-row">
                  <div className="filter-group">
                    <label>Search</label>
                    <div className="search-input">
                      <Search size={14} />
                      <input
                        type="text"
                        placeholder="Search in events..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="filter-group">
                    <label>Partition</label>
                    <select
                      value={filters.partition}
                      onChange={(e) => handleFilterChange('partition', e.target.value)}
                    >
                      <option value="">All Partitions</option>
                      {partitions.map(p => (
                        <option key={p} value={p}>Partition {p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>From Date</label>
                    <input
                      type="date"
                      value={filters.fromDate}
                      onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label>To Date</label>
                    <input
                      type="date"
                      value={filters.toDate}
                      onChange={(e) => handleFilterChange('toDate', e.target.value)}
                    />
                  </div>
                  <div className="filter-actions">
                    <button className="btn btn-primary btn-sm" onClick={applyFilters}>
                      Apply
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Events List */}
          {selectedConfigId && (
            <div className="events-section">
              <h3>
                <Database size={18} />
                Processed Events
              </h3>

              {/* Success/Failed Toggle */}
              <div className="crm-view-toggle">
                <button
                  className={`toggle-btn-mode ${crmViewMode === 'success' ? 'active success' : ''}`}
                  onClick={() => setCrmViewMode('success')}
                >
                  <CheckCircle size={14} />
                  Success ({events.length})
                </button>
                <button
                  className={`toggle-btn-mode ${crmViewMode === 'failed' ? 'active failed' : ''}`}
                  onClick={() => setCrmViewMode('failed')}
                >
                  <XCircle size={14} />
                  Failed ({failedEvents.length})
                </button>
              </div>

              {crmViewMode === 'success' && (
                <>
                  {loadingEvents ? (
                    <div className="loading-events">
                      <Loader size={20} className="spin" />
                      <span>Loading events...</span>
                    </div>
                  ) : events.length === 0 ? (
                    <div className="empty-state">
                      <History size={48} />
                      <h3>No Events Found</h3>
                      <p>No processed events match your criteria</p>
                    </div>
                  ) : (
                    <div className="events-list">
                      {events.map((event, index) => {
                        const isExpanded = expandedEventId === event.id;
                        const keyFields = getKeyFieldValues(event);
                        const capturedVars = getCapturedVariables(event);

                        return (
                          <div key={event.id} className="event-card">
                            <div className="event-header" onClick={() => toggleEventExpand(event.id)}>
                              <div className="event-header-left">
                                <span className="event-number">#{events.length - index}</span>
                                <CheckCircle size={16} className="success-icon" />
                                <span className="event-time">{formatDate(event.processedAt)}</span>
                                <span className="event-partition">Partition {event.partitionId}</span>
                              </div>
                              <div className="event-header-right">
                                {capturedVars.length > 0 && (
                                  <span className="captured-badge">
                                    <Variable size={12} />
                                    {capturedVars.length} captured
                                  </span>
                                )}
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </div>
                            </div>

                            <div className="event-summary">
                              <div className="key-fields">
                                <span className="section-label">Display Fields:</span>
                                {keyFields.length > 0 ? (
                                  <div className="field-tags">
                                    {keyFields.map((f, idx) => (
                                      <span key={idx} className="field-tag">
                                        <span className="field-name">{f.field.split('.').pop()}</span>
                                        <span className="field-value">{f.value.length > 30 ? f.value.substring(0, 30) + '...' : f.value}</span>
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="no-data">No display fields configured</span>
                                )}
                              </div>

                              {capturedVars.length > 0 && (
                                <div className="captured-vars">
                                  <span className="section-label">Captured Variables:</span>
                                  <div className="var-tags">
                                    {capturedVars.map((v, idx) => (
                                      <span key={idx} className="var-tag">
                                        <code>{`{{${v.variableName}}}`}</code>
                                        <span className="var-value">= {v.value.length > 20 ? v.value.substring(0, 20) + '...' : v.value}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {isExpanded && (
                              <div className="event-details">
                                <div className="details-tabs">
                                  <div className="detail-panel">
                                    <h4>Source Event Data</h4>
                                    <pre>{JSON.stringify(event.sourceData, null, 2)}</pre>
                                  </div>
                                  <div className="detail-panel">
                                    <h4>Mapped API Request</h4>
                                    <pre>{JSON.stringify(event.mappedRequest, null, 2)}</pre>
                                  </div>
                                  <div className="detail-panel">
                                    <h4>API Response</h4>
                                    <pre>{JSON.stringify(event.apiResponse, null, 2)}</pre>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {crmViewMode === 'failed' && (
                <>
                  {loadingFailedEvents ? (
                    <div className="loading-events">
                      <Loader size={20} className="spin" />
                      <span>Loading failed events...</span>
                    </div>
                  ) : failedEvents.length === 0 ? (
                    <div className="empty-state">
                      <CheckCircle size={48} style={{ color: 'var(--success-color)' }} />
                      <h3>No Failed Events</h3>
                      <p>All events were processed successfully</p>
                    </div>
                  ) : (
                    <div className="events-list">
                      {failedEvents.map((event, index) => {
                        const isExpanded = expandedEventId === event.id;

                        return (
                          <div key={event.id} className="event-card failed">
                            <div className="event-header" onClick={() => toggleEventExpand(event.id)}>
                              <div className="event-header-left">
                                <span className="event-number">#{failedEvents.length - index}</span>
                                <XCircle size={16} className="error-icon" />
                                <span className="event-time">{formatDate(event.failedAt)}</span>
                                {event.partitionId !== undefined && (
                                  <span className="event-partition">Partition {event.partitionId}</span>
                                )}
                              </div>
                              <div className="event-header-right">
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </div>
                            </div>

                            <div className="event-summary">
                              {event.error && (
                                <div className="failed-error-summary">
                                  <span className="section-label" style={{ color: '#dc2626' }}>Error:</span>
                                  <span className="error-text">{typeof event.error === 'string' ? (event.error.length > 120 ? event.error.substring(0, 120) + '...' : event.error) : JSON.stringify(event.error)}</span>
                                </div>
                              )}
                            </div>

                            {isExpanded && (
                              <div className="event-details">
                                <div className="details-tabs">
                                  <div className="detail-panel">
                                    <h4>Event Data</h4>
                                    <pre>{JSON.stringify(event.body, null, 2)}</pre>
                                  </div>
                                  <div className="detail-panel error-panel">
                                    <h4>Error Details</h4>
                                    <pre className="error-pre">{typeof event.error === 'object' ? JSON.stringify(event.error, null, 2) : event.error}</pre>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {!selectedConfigId && (
            <div className="empty-state">
              <History size={64} />
              <h2>Select a Configuration</h2>
              <p>Choose a configuration above to view its execution history</p>
            </div>
          )}
        </>
      )}

      {/* Digital Tab Content */}
      {activeTab === 'digital' && (
        <>
          {/* API Sample Selector */}
          <div className="card config-selector-card">
            <div className="form-group">
              <label>Select API Sample</label>
              <select
                className="form-control"
                value={selectedApiSampleId}
                onChange={(e) => setSelectedApiSampleId(e.target.value)}
              >
                <option value="">-- Select an API sample --</option>
                {apiSamples.map(sample => (
                  <option key={sample.id} value={sample.id}>
                    {sample.name} ({sample.method})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary Stats */}
          {selectedApiSampleId && apiSummary && (
            <div className="card summary-card">
              <div className="summary-stats">
                <div className="stat">
                  <span className="stat-value">{apiSummary.totalCount || 0}</span>
                  <span className="stat-label">Total Calls</span>
                </div>
                <div className="stat success">
                  <CheckCircle size={16} />
                  <span className="stat-value">{apiSummary.successCount || 0}</span>
                  <span className="stat-label">Successful</span>
                </div>
                <div className="stat failed">
                  <XCircle size={16} />
                  <span className="stat-value">{apiSummary.failedCount || 0}</span>
                  <span className="stat-label">Failed</span>
                </div>
                {apiSummary.lastExecutedAt && (
                  <div className="stat">
                    <Clock size={16} />
                    <span className="stat-value">{formatDate(apiSummary.lastExecutedAt)}</span>
                    <span className="stat-label">Last Executed</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* API Sample Details */}
          {selectedApiSample && (
            <div className="card api-sample-info">
              <div className="api-sample-header">
                <span className={`method-badge method-${selectedApiSample.method?.toLowerCase()}`}>
                  {selectedApiSample.method}
                </span>
                <span className="api-endpoint">{selectedApiSample.endpoint}</span>
              </div>
              {selectedApiSample.responseCapture && selectedApiSample.responseCapture.length > 0 && (
                <div className="capture-rules-summary">
                  <Variable size={14} />
                  <span>{selectedApiSample.responseCapture.length} capture rules configured</span>
                </div>
              )}
            </div>
          )}

          {/* Filters */}
          {selectedApiSampleId && (
            <div className="card filters-card">
              <div className="filters-header">
                <Filter size={16} />
                <span>Filters</span>
              </div>
              <div className="filters-content">
                <div className="filter-row">
                  <div className="filter-group">
                    <label>Search</label>
                    <div className="search-input">
                      <Search size={14} />
                      <input
                        type="text"
                        placeholder="Search in requests/responses..."
                        value={apiFilters.search}
                        onChange={(e) => handleApiFilterChange('search', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="filter-group">
                    <label>From Date</label>
                    <input
                      type="date"
                      value={apiFilters.fromDate}
                      onChange={(e) => handleApiFilterChange('fromDate', e.target.value)}
                    />
                  </div>
                  <div className="filter-group">
                    <label>To Date</label>
                    <input
                      type="date"
                      value={apiFilters.toDate}
                      onChange={(e) => handleApiFilterChange('toDate', e.target.value)}
                    />
                  </div>
                  <div className="filter-actions">
                    <button className="btn btn-primary btn-sm" onClick={applyApiFilters}>
                      Apply
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={clearApiFilters}>
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API History List */}
          {selectedApiSampleId && (
            <div className="events-section">
              <h3>
                <Globe size={18} />
                API Call History ({apiHistory.length})
              </h3>

              {loadingApiHistory ? (
                <div className="loading-events">
                  <Loader size={20} className="spin" />
                  <span>Loading API history...</span>
                </div>
              ) : apiHistory.length === 0 ? (
                <div className="empty-state">
                  <Globe size={48} />
                  <h3>No API Calls Found</h3>
                  <p>No API call history available for this sample</p>
                </div>
              ) : (
                <div className="events-list">
                  {apiHistory.map((record, index) => {
                    const isExpanded = expandedApiHistoryId === record.id;
                    const apiKeyFields = getApiKeyFieldValues(record);

                    return (
                      <div key={record.id} className={`event-card ${record.success ? '' : 'failed'}`}>
                        <div className="event-header" onClick={() => toggleApiHistoryExpand(record.id)}>
                          <div className="event-header-left">
                            <span className="event-number">#{apiHistory.length - index}</span>
                            {record.success ? (
                              <CheckCircle size={16} className="success-icon" />
                            ) : (
                              <XCircle size={16} className="error-icon" />
                            )}
                            <span className="event-time">{formatDate(record.executedAt)}</span>
                            <span className={`method-badge-sm method-${record.method?.toLowerCase()}`}>
                              {record.method}
                            </span>
                            <span className={`status-badge ${record.success ? 'success' : 'error'}`}>
                              {record.responseStatus}
                            </span>
                            <span className="duration-badge">{record.duration}</span>
                          </div>
                          <div className="event-header-right">
                            {record.capturedVariables && record.capturedVariables.length > 0 && (
                              <span className="captured-badge">
                                <Variable size={12} />
                                {record.capturedVariables.length} captured
                              </span>
                            )}
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>

                        <div className="event-summary">
                          {/* Display Fields from Request */}
                          <div className="key-fields">
                            <span className="section-label">Request Fields:</span>
                            {apiKeyFields.length > 0 ? (
                              <div className="field-tags">
                                {apiKeyFields.map((f, idx) => (
                                  <span key={idx} className="field-tag">
                                    <span className="field-name">{f.field.split('.').pop()}</span>
                                    <span className="field-value">{f.value.length > 30 ? f.value.substring(0, 30) + '...' : f.value}</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="no-data">No display fields configured</span>
                            )}
                          </div>

                          {/* Captured Variables */}
                          {record.capturedVariables && record.capturedVariables.length > 0 && (
                            <div className="captured-vars">
                              <span className="section-label">Captured Variables:</span>
                              <div className="var-tags">
                                {record.capturedVariables.map((v, idx) => (
                                  <span key={idx} className="var-tag">
                                    <code>{`{{${v.variableName}}}`}</code>
                                    <span className="var-value">= {String(v.value).length > 20 ? String(v.value).substring(0, 20) + '...' : String(v.value)}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="event-details">
                            <div className="details-tabs">
                              <div className="detail-panel">
                                <h4>Request Body</h4>
                                <pre>{JSON.stringify(record.requestBody, null, 2)}</pre>
                              </div>
                              <div className="detail-panel">
                                <h4>Request Headers</h4>
                                <pre>{JSON.stringify(record.requestHeaders, null, 2)}</pre>
                              </div>
                              <div className="detail-panel">
                                <h4>Response Body</h4>
                                <pre>{JSON.stringify(record.responseBody, null, 2)}</pre>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!selectedApiSampleId && (
            <div className="empty-state">
              <Globe size={64} />
              <h2>Select an API Sample</h2>
              <p>Choose an API sample above to view its call history</p>
            </div>
          )}
        </>
      )}

      {/* CSV Tab Content */}
      {activeTab === 'csv' && (
        <>
          {/* CSV File Selector */}
          <div className="card config-selector-card">
            <div className="form-group">
              <label>Select CSV File Definition</label>
              <select
                className="form-control"
                value={selectedCsvFileId}
                onChange={(e) => setSelectedCsvFileId(e.target.value)}
              >
                <option value="">-- Select a file definition --</option>
                {csvFiles.map(file => (
                  <option key={file.id} value={file.id}>
                    {file.name} ({file.columns?.length || 0} columns)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary Stats */}
          {selectedCsvFileId && csvSummary && (
            <div className="card summary-card">
              <div className="summary-stats">
                <div className="stat">
                  <span className="stat-value">{csvSummary.totalRecords || 0}</span>
                  <span className="stat-label">Total Processed</span>
                </div>
                <div className="stat success">
                  <CheckCircle size={16} />
                  <span className="stat-value">{csvSummary.successfulRecords || 0}</span>
                  <span className="stat-label">Successful</span>
                </div>
                <div className="stat failed">
                  <XCircle size={16} />
                  <span className="stat-value">{csvSummary.failedRecords || 0}</span>
                  <span className="stat-label">Failed</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{csvSummary.successRate || 0}%</span>
                  <span className="stat-label">Success Rate</span>
                </div>
              </div>
            </div>
          )}

          {/* CSV File Info */}
          {selectedCsvFile && (
            <div className="card api-sample-info">
              <div className="api-sample-header">
                <span className="badge badge-info">CSV</span>
                <span className="api-endpoint">{selectedCsvFile.targetApi?.apiSampleName || 'No target API'}</span>
              </div>
              <div className="capture-rules-summary">
                <FileSpreadsheet size={14} />
                <span>{selectedCsvFile.columns?.length || 0} columns, {Object.keys(selectedCsvFile.fieldMapping || {}).length} mappings</span>
              </div>
            </div>
          )}

          {/* CSV Batches List (Card Format) */}
          {selectedCsvFileId && (
            <div className="events-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <FileSpreadsheet size={18} />
                  Processed Files ({csvBatches.length})
                </h3>
              </div>

              {loadingCsvBatches ? (
                <div className="loading-events">
                  <Loader size={20} className="spin" />
                  <span>Loading file processing history...</span>
                </div>
              ) : csvBatches.length === 0 ? (
                <div className="empty-state">
                  <FileSpreadsheet size={48} />
                  <h3>No Processing History</h3>
                  <p>No CSV files have been processed for this file definition</p>
                </div>
              ) : (
                <div className="batches-list">
                  {csvBatches.map((batch) => (
                    <div
                      key={batch.id}
                      className="batch-card"
                      onClick={() => openBatchRecordsModal(batch)}
                    >
                      <div className="batch-header">
                        <div className="batch-info">
                          <span className="batch-filename">{batch.fileName || 'Unknown File'}</span>
                          <span className="batch-size">({(batch.fileSize / 1024).toFixed(1)} KB)</span>
                        </div>
                        <div className="batch-actions">
                          <button
                            className="btn btn-ghost btn-sm text-danger"
                            onClick={(e) => { e.stopPropagation(); handleDeleteBatch(batch.id); }}
                            title="Delete this batch"
                          >
                            <Trash2 size={14} />
                          </button>
                          <Eye size={18} style={{ color: 'var(--text-secondary)' }} />
                        </div>
                      </div>
                      <div className="batch-stats">
                        <div className="batch-stat">
                          <Clock size={14} />
                          <span className="stat-label">Loaded:</span>
                          <span className="stat-value">{formatDate(batch.loadedAt)}</span>
                        </div>
                        {batch.processedAt && (
                          <div className="batch-stat">
                            <CheckCircle size={14} />
                            <span className="stat-label">Processed:</span>
                            <span className="stat-value">{formatDate(batch.processedAt)}</span>
                          </div>
                        )}
                      </div>
                      <div className="batch-results">
                        <span className="result-item total">
                          <strong>{batch.totalRows || 0}</strong> Total
                        </span>
                        <span className="result-item success">
                          <CheckCircle size={12} />
                          <strong>{batch.successfulRows || 0}</strong> Passed
                        </span>
                        <span className="result-item failed">
                          <XCircle size={12} />
                          <strong>{batch.failedRows || 0}</strong> Failed
                        </span>
                        <span className={`result-item status ${batch.status === 'completed' ? 'completed' : 'processing'}`}>
                          {batch.status === 'completed' ? 'Completed' : 'Processing...'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!selectedCsvFileId && (
            <div className="empty-state">
              <FileSpreadsheet size={64} />
              <h2>Select a CSV File Definition</h2>
              <p>Choose a CSV file definition above to view its processing history</p>
            </div>
          )}
        </>
      )}

      {/* Batch Records Modal (CSV) */}
      {showBatchRecordsModal && selectedBatch && (
        <div className="modal-overlay" onClick={closeBatchRecordsModal}>
          <div className="modal-content batch-records-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Database size={20} />
                Row Records - {selectedBatch.fileName}
              </h3>
              <div className="modal-header-stats">
                <span className="stat-badge total">{selectedBatch.totalRows} Total</span>
                <span className="stat-badge success">{selectedBatch.successfulRows} Passed</span>
                <span className="stat-badge failed">{selectedBatch.failedRows} Failed</span>
              </div>
              <button className="modal-close" onClick={closeBatchRecordsModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body records-modal-body">
              {loadingBatchRecords ? (
                <div className="loading-events">
                  <Loader size={20} className="spin" />
                  <span>Loading row records...</span>
                </div>
              ) : batchRecords.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <Database size={48} />
                  <h3>No Records</h3>
                  <p>No row records found for this batch</p>
                </div>
              ) : (
                <div className="events-list">
                  {batchRecords.map((record) => {
                    const isExpanded = expandedCsvHistoryId === record.id;

                    return (
                      <div key={record.id} className={`event-card ${record.success ? '' : 'failed'}`}>
                        <div className="event-header" onClick={() => toggleCsvHistoryExpand(record.id)}>
                          <div className="event-header-left">
                            <span className="event-number">Row {record.rowIndex}</span>
                            {record.success ? (
                              <CheckCircle size={16} className="success-icon" />
                            ) : (
                              <XCircle size={16} className="error-icon" />
                            )}
                            <span className="event-time">{formatDate(record.timestamp)}</span>
                            <span className="duration-badge">{record.duration}</span>
                          </div>
                          <div className="event-header-right">
                            {record.capturedFields && Object.keys(record.capturedFields).length > 0 && (
                              <span className="captured-badge">
                                <Variable size={12} />
                                {Object.keys(record.capturedFields).length} captured
                              </span>
                            )}
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>

                        <div className="event-summary">
                          {/* Source Data Fields */}
                          <div className="key-fields">
                            <span className="section-label">Source Data:</span>
                            {record.sourceData && Object.keys(record.sourceData).length > 0 ? (
                              <div className="field-tags">
                                {Object.entries(record.sourceData).slice(0, 5).map(([key, value], idx) => (
                                  <span key={idx} className="field-tag">
                                    <span className="field-name">{key}</span>
                                    <span className="field-value">{String(value).length > 30 ? String(value).substring(0, 30) + '...' : String(value)}</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="no-data">No source data</span>
                            )}
                          </div>

                          {/* Captured Fields */}
                          {record.capturedFields && Object.keys(record.capturedFields).length > 0 && (
                            <div className="captured-vars">
                              <span className="section-label">Captured:</span>
                              <div className="var-tags">
                                {Object.entries(record.capturedFields).map(([key, value], idx) => (
                                  <span key={idx} className="var-tag">
                                    <code>{key}</code>
                                    <span className="var-value">= {String(value).length > 20 ? String(value).substring(0, 20) + '...' : String(value)}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Error */}
                          {record.error && (
                            <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.25rem' }}>
                              <span className="section-label" style={{ color: '#dc2626' }}>Error:</span>
                              <span style={{ fontSize: '0.8rem', color: '#dc2626' }}>{record.error}</span>
                            </div>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="event-details">
                            <div className="details-tabs">
                              <div className="detail-panel">
                                <h4>Source Data (CSV Row)</h4>
                                <pre>{JSON.stringify(record.sourceData, null, 2)}</pre>
                              </div>
                              <div className="detail-panel">
                                <h4>API Request</h4>
                                <pre>{JSON.stringify(record.request, null, 2)}</pre>
                              </div>
                              <div className="detail-panel">
                                <h4>API Response</h4>
                                <pre>{JSON.stringify(record.response, null, 2)}</pre>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeBatchRecordsModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Display Fields Configuration Modal */}
      {showFieldsModal && (
        <div className="modal-overlay" onClick={() => setShowFieldsModal(false)}>
          <div className="modal-content fields-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Settings size={20} />
                Configure Display Fields
              </h3>
              <button className="modal-close" onClick={() => setShowFieldsModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Select which fields from the source event to display in the execution history.
                These fields will be shown for each processed event.
              </p>
              <div className="fields-list">
                {getAvailableSourceFields().length > 0 ? (
                  getAvailableSourceFields().map((field, idx) => (
                    <label key={idx} className={`field-checkbox ${tempSelectedFields.includes(field) ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={tempSelectedFields.includes(field)}
                        onChange={() => toggleFieldSelection(field)}
                      />
                      <span className="field-path">{field}</span>
                      {tempSelectedFields.includes(field) && <Check size={16} className="check-icon" />}
                    </label>
                  ))
                ) : (
                  <p className="no-fields">No fields available. Please ensure the event sample is loaded.</p>
                )}
              </div>
              <div className="selected-count">
                {tempSelectedFields.length} field{tempSelectedFields.length !== 1 ? 's' : ''} selected
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowFieldsModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveFieldPreferences}>
                <Check size={16} />
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Display Fields Configuration Modal */}
      {showApiFieldsModal && (
        <div className="modal-overlay" onClick={() => setShowApiFieldsModal(false)}>
          <div className="modal-content fields-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Settings size={20} />
                Configure Display Fields
              </h3>
              <button className="modal-close" onClick={() => setShowApiFieldsModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Select which fields from the API request to display in the execution history.
                These fields will be shown for each API call record.
              </p>
              <div className="fields-list">
                {getAvailableApiRequestFields().length > 0 ? (
                  getAvailableApiRequestFields().map((field, idx) => (
                    <label key={idx} className={`field-checkbox ${tempApiSelectedFields.includes(field) ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={tempApiSelectedFields.includes(field)}
                        onChange={() => toggleApiFieldSelection(field)}
                      />
                      <span className="field-path">{field}</span>
                      {tempApiSelectedFields.includes(field) && <Check size={16} className="check-icon" />}
                    </label>
                  ))
                ) : (
                  <p className="no-fields">No fields available. Please ensure the API sample has request fields defined.</p>
                )}
              </div>
              <div className="selected-count">
                {tempApiSelectedFields.length} field{tempApiSelectedFields.length !== 1 ? 's' : ''} selected
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowApiFieldsModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveApiFieldPreferences}>
                <Check size={16} />
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .execution-history-page {
          width: 100%;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-title h1 {
          margin: 0;
        }

        .page-subtitle {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .text-danger {
          color: var(--error-color) !important;
        }

        /* History Tabs */
        .history-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          padding: 0.5rem;
          background: var(--card-bg);
          border-radius: 0.75rem;
          border: 1px solid var(--border-color);
        }

        .history-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 1.5rem;
          border: 2px solid transparent;
          border-radius: 0.5rem;
          background: var(--bg-color);
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
          color: var(--text-secondary);
          flex: 1;
        }

        .history-tab:hover {
          border-color: var(--primary-color);
          background: rgba(59, 130, 246, 0.05);
          color: var(--text-primary);
        }

        .history-tab.active {
          border-color: var(--primary-color);
          background: rgba(59, 130, 246, 0.1);
          color: var(--primary-color);
        }

        .history-tab .tab-desc {
          font-size: 0.75rem;
          font-weight: 400;
          color: var(--text-secondary);
          margin-left: auto;
        }

        .history-tab.active .tab-desc {
          color: var(--primary-color);
          opacity: 0.8;
        }

        /* Config Selector */
        .config-selector-card {
          padding: 1.5rem;
          margin-bottom: 1rem;
        }

        .config-selector-card .form-group {
          margin: 0;
          max-width: 400px;
        }

        .config-selector-card label {
          display: block;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        /* Summary Card */
        .summary-card {
          padding: 1.25rem 1.5rem;
          margin-bottom: 1rem;
        }

        .summary-stats {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .summary-stats .stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .summary-stats .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .summary-stats .stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .summary-stats .stat.success {
          color: var(--success-color);
        }

        .summary-stats .stat.failed {
          color: var(--error-color);
        }

        /* API Sample Info */
        .api-sample-info {
          padding: 1rem 1.5rem;
          margin-bottom: 1rem;
        }

        .api-sample-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .method-badge {
          padding: 0.25rem 0.625rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .method-badge.method-get { background: #dbeafe; color: #1d4ed8; }
        .method-badge.method-post { background: #dcfce7; color: #15803d; }
        .method-badge.method-put { background: #fef3c7; color: #b45309; }
        .method-badge.method-delete { background: #fee2e2; color: #b91c1c; }
        .method-badge.method-patch { background: #f3e8ff; color: #7c3aed; }

        .api-endpoint {
          font-family: 'Fira Code', monospace;
          font-size: 0.875rem;
          color: var(--text-secondary);
          word-break: break-all;
        }

        .capture-rules-summary {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-color);
          font-size: 0.8rem;
          color: #8b5cf6;
        }

        /* Config Details - Collapsible */
        .config-details-card {
          padding: 0;
          margin-bottom: 1rem;
          overflow: hidden;
        }

        .config-details-card.collapsed {
          background: var(--bg-color);
        }

        .config-details-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1.25rem;
          cursor: pointer;
          user-select: none;
          transition: background 0.15s;
        }

        .config-details-header:hover {
          background: #e2e8f0;
        }

        .config-details-header h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
          font-size: 0.95rem;
          flex: 1;
        }

        .config-details-header .header-badges {
          display: flex;
          gap: 0.5rem;
          margin-left: 1rem;
        }

        .config-details-header .badge {
          font-size: 0.7rem;
          font-weight: 500;
          padding: 0.2rem 0.5rem;
          background: rgba(59, 130, 246, 0.1);
          color: var(--primary-color);
          border-radius: 0.25rem;
        }

        .config-details-header .toggle-btn {
          background: none;
          border: none;
          padding: 0.25rem;
          cursor: pointer;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
        }

        .config-details-content {
          padding: 1rem 1.25rem 1.25rem;
          border-top: 1px solid var(--border-color);
        }

        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .details-grid {
            grid-template-columns: 1fr;
          }
        }

        .detail-section h4 {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0 0 0.75rem 0;
        }

        .mappings-list, .capture-rules-list {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .mapping-item, .capture-rule-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.5rem;
          background: var(--bg-color);
          border-radius: 0.25rem;
          font-size: 0.8rem;
        }

        .source-field, .target-field, .response-path {
          font-family: 'Fira Code', monospace;
          font-size: 0.75rem;
        }

        .source-field {
          color: var(--success-color);
        }

        .target-field {
          color: var(--primary-color);
        }

        .capture-rule-item .var-name {
          color: #8b5cf6;
          font-family: 'Fira Code', monospace;
          font-size: 0.75rem;
        }

        .capture-rule-item .arrow {
          color: var(--text-secondary);
        }

        .response-path {
          color: var(--text-secondary);
        }

        .no-rules {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin: 0;
        }

        /* Filters */
        .filters-card {
          padding: 1rem 1.5rem;
          margin-bottom: 1rem;
        }

        .filters-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          margin-bottom: 0.75rem;
        }

        .filter-row {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          align-items: flex-end;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .filter-group label {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .filter-group select,
        .filter-group input[type="date"] {
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }

        .search-input {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          background: white;
        }

        .search-input input {
          border: none;
          outline: none;
          width: 200px;
          font-size: 0.875rem;
        }

        .filter-actions {
          display: flex;
          gap: 0.5rem;
        }

        /* Events Section */
        .events-section {
          margin-top: 1.5rem;
        }

        .events-section > h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        /* CRM View Toggle */
        .crm-view-toggle {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding: 0.25rem;
          background: var(--bg-color);
          border-radius: 0.5rem;
          border: 1px solid var(--border-color);
          width: fit-content;
        }

        .toggle-btn-mode {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 1rem;
          border: 2px solid transparent;
          border-radius: 0.375rem;
          background: transparent;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-secondary);
          transition: all 0.2s;
        }

        .toggle-btn-mode:hover {
          background: var(--card-bg);
          color: var(--text-primary);
        }

        .toggle-btn-mode.active.success {
          background: rgba(34, 197, 94, 0.1);
          border-color: var(--success-color);
          color: var(--success-color);
        }

        .toggle-btn-mode.active.failed {
          background: rgba(239, 68, 68, 0.1);
          border-color: var(--error-color);
          color: var(--error-color);
        }

        /* Failed Event Styles */
        .failed-error-summary {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(239, 68, 68, 0.08);
          border-radius: 0.375rem;
          border-left: 3px solid var(--error-color);
        }

        .failed-error-summary .error-text {
          font-size: 0.825rem;
          color: #dc2626;
          word-break: break-word;
        }

        .error-panel h4 {
          color: #dc2626 !important;
        }

        .error-pre {
          color: #dc2626;
          background: rgba(239, 68, 68, 0.05) !important;
          border: 1px solid rgba(239, 68, 68, 0.15) !important;
        }

        .loading-events {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 3rem;
          color: var(--text-secondary);
        }

        .events-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* Event Card */
        .event-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          overflow: hidden;
        }

        .event-card.failed {
          border-color: rgba(239, 68, 68, 0.3);
        }

        .event-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.875rem 1.25rem;
          background: var(--bg-color);
          cursor: pointer;
          user-select: none;
        }

        .event-header:hover {
          background: #e2e8f0;
        }

        .event-header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .event-number {
          font-weight: 600;
          color: var(--text-secondary);
        }

        .success-icon {
          color: var(--success-color);
        }

        .error-icon {
          color: var(--error-color);
        }

        .event-time {
          font-size: 0.875rem;
        }

        .event-partition {
          font-size: 0.75rem;
          color: var(--text-secondary);
          background: white;
          padding: 0.125rem 0.5rem;
          border-radius: 0.25rem;
        }

        .method-badge-sm {
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .method-badge-sm.method-get { background: #dbeafe; color: #1d4ed8; }
        .method-badge-sm.method-post { background: #dcfce7; color: #15803d; }
        .method-badge-sm.method-put { background: #fef3c7; color: #b45309; }
        .method-badge-sm.method-delete { background: #fee2e2; color: #b91c1c; }
        .method-badge-sm.method-patch { background: #f3e8ff; color: #7c3aed; }

        .status-badge {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.125rem 0.5rem;
          border-radius: 0.25rem;
        }

        .status-badge.success {
          background: rgba(34, 197, 94, 0.15);
          color: var(--success-color);
        }

        .status-badge.error {
          background: rgba(239, 68, 68, 0.15);
          color: var(--error-color);
        }

        .duration-badge {
          font-size: 0.7rem;
          color: var(--text-secondary);
          background: white;
          padding: 0.125rem 0.5rem;
          border-radius: 0.25rem;
        }

        .event-header-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .captured-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: #8b5cf6;
          background: rgba(139, 92, 246, 0.1);
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
        }

        /* Event Summary */
        .event-summary {
          padding: 1rem 1.25rem;
          border-top: 1px solid var(--border-color);
        }

        .section-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-secondary);
          margin-right: 0.5rem;
        }

        .key-fields, .captured-vars {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .field-tags, .var-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }

        .field-tag {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.5rem;
          background: var(--bg-color);
          border-radius: 0.25rem;
          font-size: 0.75rem;
        }

        .field-tag .field-name {
          font-weight: 500;
          color: var(--primary-color);
        }

        .field-tag .field-value {
          color: var(--text-secondary);
        }

        .var-tag {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.5rem;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 0.25rem;
          font-size: 0.75rem;
        }

        .var-tag code {
          color: #8b5cf6;
          font-family: 'Fira Code', monospace;
        }

        .var-tag .var-value {
          color: var(--text-secondary);
        }

        .no-data {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-style: italic;
        }

        /* Event Details */
        .event-details {
          border-top: 1px solid var(--border-color);
          padding: 1rem 1.25rem;
          background: #fafbfc;
        }

        .details-tabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        @media (max-width: 1024px) {
          .details-tabs {
            grid-template-columns: 1fr;
          }
        }

        .detail-panel {
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .detail-panel h4 {
          margin: 0;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          background: var(--bg-color);
          border-bottom: 1px solid var(--border-color);
        }

        .detail-panel pre {
          margin: 0;
          padding: 1rem;
          font-size: 0.75rem;
          font-family: 'Fira Code', monospace;
          overflow-x: auto;
          max-height: 300px;
          background: #1e293b;
          color: #e2e8f0;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--text-secondary);
        }

        .empty-state h2, .empty-state h3 {
          margin: 1rem 0 0.5rem;
          color: var(--text-primary);
        }

        .empty-state p {
          margin: 0;
        }

        /* Badge Count */
        .badge-count {
          background: var(--primary-color);
          color: white;
          font-size: 0.65rem;
          padding: 0.125rem 0.375rem;
          border-radius: 0.75rem;
          margin-left: 0.375rem;
        }

        /* Modal Styles */
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
        }

        .modal-content {
          background: white;
          border-radius: 0.75rem;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
        }

        .modal-header h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
          font-size: 1.1rem;
        }

        .modal-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          color: var(--text-secondary);
          border-radius: 0.25rem;
        }

        .modal-close:hover {
          background: var(--bg-color);
          color: var(--text-primary);
        }

        .modal-body {
          padding: 1.25rem;
          overflow-y: auto;
          flex: 1;
        }

        .modal-description {
          margin: 0 0 1rem 0;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .fields-list {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          max-height: 350px;
          overflow-y: auto;
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          padding: 0.5rem;
        }

        .field-checkbox {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.75rem;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: background 0.15s;
        }

        .field-checkbox:hover {
          background: var(--bg-color);
        }

        .field-checkbox.selected {
          background: rgba(59, 130, 246, 0.1);
        }

        .field-checkbox input[type="checkbox"] {
          width: 1rem;
          height: 1rem;
          cursor: pointer;
        }

        .field-checkbox .field-path {
          flex: 1;
          font-family: 'Fira Code', monospace;
          font-size: 0.8rem;
          color: var(--text-primary);
        }

        .field-checkbox .check-icon {
          color: var(--primary-color);
        }

        .selected-count {
          margin-top: 0.75rem;
          font-size: 0.8rem;
          color: var(--text-secondary);
          text-align: right;
        }

        .no-fields {
          color: var(--text-secondary);
          text-align: center;
          padding: 2rem;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          border-top: 1px solid var(--border-color);
        }

        /* Batch Cards (CSV) */
        .batches-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .batch-card {
          background: var(--card-bg);
          border: 2px solid var(--border-color);
          border-radius: 0.75rem;
          padding: 1rem 1.25rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .batch-card:hover {
          border-color: var(--primary-color);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
        }

        .batch-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .batch-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .batch-filename {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .batch-size {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .batch-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .batch-stats {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
        }

        .batch-stat {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .batch-stat .stat-label {
          color: var(--text-secondary);
        }

        .batch-stat .stat-value {
          color: var(--text-primary);
          font-weight: 500;
        }

        .batch-results {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-color);
        }

        .result-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8rem;
          padding: 0.25rem 0.625rem;
          border-radius: 0.375rem;
        }

        .result-item strong {
          font-weight: 700;
        }

        .result-item.total {
          background: var(--bg-color);
          color: var(--text-primary);
        }

        .result-item.success {
          background: rgba(34, 197, 94, 0.1);
          color: var(--success-color);
        }

        .result-item.failed {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error-color);
        }

        .result-item.status {
          margin-left: auto;
          font-weight: 500;
        }

        .result-item.status.completed {
          background: rgba(34, 197, 94, 0.1);
          color: var(--success-color);
        }

        .result-item.status.processing {
          background: rgba(59, 130, 246, 0.1);
          color: var(--primary-color);
        }

        /* Batch Records Modal */
        .batch-records-modal {
          max-width: 1000px;
          width: 95%;
          max-height: 90vh;
        }

        .batch-records-modal .modal-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .batch-records-modal .modal-header h3 {
          flex: 1;
          min-width: 200px;
        }

        .modal-header-stats {
          display: flex;
          gap: 0.5rem;
        }

        .stat-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.625rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .stat-badge.total {
          background: var(--bg-color);
          color: var(--text-primary);
        }

        .stat-badge.success {
          background: rgba(34, 197, 94, 0.15);
          color: var(--success-color);
        }

        .stat-badge.failed {
          background: rgba(239, 68, 68, 0.15);
          color: var(--error-color);
        }

        .records-modal-body {
          max-height: 60vh;
          overflow-y: auto;
        }

        .records-modal-body .events-list {
          padding: 0;
        }

        .records-modal-body .event-card {
          margin-bottom: 0.75rem;
        }

        .records-modal-body .event-card:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}

export default ExecutionHistory;
