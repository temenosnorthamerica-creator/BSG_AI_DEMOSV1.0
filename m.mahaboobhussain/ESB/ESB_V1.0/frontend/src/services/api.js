const API_BASE = '/api';

// Generic fetch wrapper
async function fetchApi(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// ============ SAMPLE EVENTS ============

export const sampleEventsApi = {
  getAll: () => fetchApi('/sample-events'),

  getById: (id) => fetchApi(`/sample-events/${id}`),

  create: (name, jsonContent) =>
    fetchApi('/sample-events', {
      method: 'POST',
      body: JSON.stringify({ name, jsonContent })
    }),

  update: (id, name, jsonContent) =>
    fetchApi(`/sample-events/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, jsonContent })
    }),

  delete: (id) =>
    fetchApi(`/sample-events/${id}`, {
      method: 'DELETE'
    })
};

// ============ SAMPLE APIS ============

export const sampleApisApi = {
  getAll: () => fetchApi('/sample-apis'),

  getById: (id) => fetchApi(`/sample-apis/${id}`),

  create: (name, endpoint, method, requestJson, responseJson, defaultHeaders = {}, responseCapture = []) =>
    fetchApi('/sample-apis', {
      method: 'POST',
      body: JSON.stringify({ name, endpoint, method, requestJson, responseJson, defaultHeaders, responseCapture })
    }),

  update: (id, name, endpoint, method, requestJson, responseJson, defaultHeaders = {}, responseCapture = []) =>
    fetchApi(`/sample-apis/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, endpoint, method, requestJson, responseJson, defaultHeaders, responseCapture })
    }),

  delete: (id) =>
    fetchApi(`/sample-apis/${id}`, {
      method: 'DELETE'
    })
};

// ============ CONFIGURATIONS ============

export const configurationsApi = {
  getAll: () => fetchApi('/configurations'),

  getById: (id) => fetchApi(`/configurations/${id}`),

  create: (config) =>
    fetchApi('/configurations', {
      method: 'POST',
      body: JSON.stringify(config)
    }),

  update: (id, config) =>
    fetchApi(`/configurations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(config)
    }),

  delete: (id) =>
    fetchApi(`/configurations/${id}`, {
      method: 'DELETE'
    })
};

// ============ DEMO ============

export const demoApi = {
  execute: (configId, sourceData, liveMode = false, eventHubOptions = {}, options = {}) =>
    fetchApi('/demo/execute', {
      method: 'POST',
      body: JSON.stringify({
        configId,
        sourceData,
        liveMode,
        eventHubOptions,
        endpointOverride: options.endpointOverride || null,
        useRealApi: options.useRealApi || false,
        headers: options.headers || {}
      })
    }),

  previewMapping: (sourceData, mapping) =>
    fetchApi('/demo/preview-mapping', {
      method: 'POST',
      body: JSON.stringify({ sourceData, mapping })
    }),

  getEventHubInfo: () => fetchApi('/demo/event-hub-info'),

  readEvents: (options = {}) =>
    fetchApi('/demo/read-events', {
      method: 'POST',
      body: JSON.stringify(options)
    })
};

// ============ EVENT HUB CONFIG ============

export const eventHubConfigApi = {
  get: () => fetchApi('/event-hub-config'),

  update: (config) =>
    fetchApi('/event-hub-config', {
      method: 'PUT',
      body: JSON.stringify(config)
    })
};

// ============ FORM GENERATOR ============

export const formGeneratorApi = {
  // Get form configuration for a sample
  getFormConfig: (type, sampleId) =>
    fetchApi(`/form-generator/config/${type}/${sampleId}`),

  sendEvent: (eventData, partitionKey, sampleId, applyAutoValues = true) =>
    fetchApi('/form-generator/send-event', {
      method: 'POST',
      body: JSON.stringify({ eventData, partitionKey, sampleId, applyAutoValues })
    }),

  callApi: ({ endpoint, method, headers, body, apiSampleId }) =>
    fetchApi('/form-generator/call-api', {
      method: 'POST',
      body: JSON.stringify({ endpoint, method, headers, body, apiSampleId })
    })
};

// ============ VARIABLES ============

export const variablesApi = {
  // Get all configurations that have variables
  getAllConfigs: () => fetchApi('/variables'),

  // Get all variables for a configuration
  getVariables: (configId) => fetchApi(`/variables/${configId}`),

  // Get a single variable
  getVariable: (configId, variableName) => fetchApi(`/variables/${configId}/${variableName}`),

  // Create a new variable
  createVariable: (configId, variableName, value, configName = '') =>
    fetchApi(`/variables/${configId}`, {
      method: 'POST',
      body: JSON.stringify({ variableName, value, configName })
    }),

  // Update a variable value
  updateVariable: (configId, variableName, value) =>
    fetchApi(`/variables/${configId}/${variableName}`, {
      method: 'PUT',
      body: JSON.stringify({ value })
    }),

  // Delete a single variable
  deleteVariable: (configId, variableName) =>
    fetchApi(`/variables/${configId}/${variableName}`, {
      method: 'DELETE'
    }),

  // Clear all variables for a configuration
  clearVariables: (configId) =>
    fetchApi(`/variables/${configId}`, {
      method: 'DELETE'
    })
};

// ============ ENVIRONMENT VARIABLES ============

export const environmentVariablesApi = {
  // Get all environment variables
  getAll: () => fetchApi('/environment-variables'),

  // Get a single variable
  get: (name) => fetchApi(`/environment-variables/${name}`),

  // Create or update a variable
  create: (name, value, description = '') =>
    fetchApi('/environment-variables', {
      method: 'POST',
      body: JSON.stringify({ name, value, description })
    }),

  // Update a variable
  update: (name, value, description = '') =>
    fetchApi(`/environment-variables/${name}`, {
      method: 'PUT',
      body: JSON.stringify({ value, description })
    }),

  // Delete a variable
  delete: (name) =>
    fetchApi(`/environment-variables/${name}`, {
      method: 'DELETE'
    }),

  // Clear all variables
  clearAll: () =>
    fetchApi('/environment-variables', {
      method: 'DELETE'
    }),

  // Substitute variables in data
  substitute: (data) =>
    fetchApi('/environment-variables/substitute', {
      method: 'POST',
      body: JSON.stringify({ data })
    }),

  // Find variable references in data
  findReferences: (data) =>
    fetchApi('/environment-variables/find-references', {
      method: 'POST',
      body: JSON.stringify({ data })
    })
};

// ============ API HISTORY ============

export const apiHistoryApi = {
  // Get all API samples that have history
  getApiSamplesWithHistory: () => fetchApi('/api-history'),

  // Get history for an API sample
  getHistory: (apiSampleId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.fromDate) params.append('from', filters.fromDate);
    if (filters.toDate) params.append('to', filters.toDate);
    const queryString = params.toString();
    return fetchApi(`/api-history/${apiSampleId}${queryString ? '?' + queryString : ''}`);
  },

  // Get summary for an API sample history
  getSummary: (apiSampleId) => fetchApi(`/api-history/${apiSampleId}/summary`),

  // Clear all history for an API sample
  clearHistory: (apiSampleId) =>
    fetchApi(`/api-history/${apiSampleId}`, {
      method: 'DELETE'
    }),

  // Remove a single history record
  removeRecord: (apiSampleId, historyId) =>
    fetchApi(`/api-history/${apiSampleId}/${historyId}`, {
      method: 'DELETE'
    })
};

// ============ OFFSET TRACKING ============

export const offsetsApi = {
  // Get offset info for a configuration
  getOffsets: (configId) => fetchApi(`/offsets/${configId}`),

  // Clear offsets for a configuration (reset tracking)
  clearOffsets: (configId) =>
    fetchApi(`/offsets/${configId}`, {
      method: 'DELETE'
    }),

  // Get failed events for a configuration
  getFailedEvents: (configId) => fetchApi(`/offsets/${configId}/failed`),

  // Clear all failed events (allows retry)
  clearFailedEvents: (configId) =>
    fetchApi(`/offsets/${configId}/failed`, {
      method: 'DELETE'
    }),

  // Remove a single failed event
  removeFailedEvent: (configId, eventId) =>
    fetchApi(`/offsets/${configId}/failed/${eventId}`, {
      method: 'DELETE'
    }),

  // Get successful events for a configuration (with optional filters)
  getSuccessfulEvents: (configId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.partition) params.append('partition', filters.partition);
    if (filters.fromDate) params.append('from', filters.fromDate);
    if (filters.toDate) params.append('to', filters.toDate);
    const queryString = params.toString();
    return fetchApi(`/offsets/${configId}/successful${queryString ? '?' + queryString : ''}`);
  },

  // Get partition IDs for successful events (for filter dropdown)
  getSuccessfulEventPartitions: (configId) =>
    fetchApi(`/offsets/${configId}/successful/partitions`),

  // Clear all successful events
  clearSuccessfulEvents: (configId) =>
    fetchApi(`/offsets/${configId}/successful`, {
      method: 'DELETE'
    }),

  // Remove a single successful event
  removeSuccessfulEvent: (configId, eventId) =>
    fetchApi(`/offsets/${configId}/successful/${eventId}`, {
      method: 'DELETE'
    }),

  // Get display field preferences for a configuration
  getDisplayPreferences: (configId) =>
    fetchApi(`/offsets/${configId}/display-prefs`),

  // Save display field preferences for a configuration
  saveDisplayPreferences: (configId, sourceFields, responseFields = []) =>
    fetchApi(`/offsets/${configId}/display-prefs`, {
      method: 'PUT',
      body: JSON.stringify({ sourceFields, responseFields })
    }),

  // Clear display preferences for a configuration
  clearDisplayPreferences: (configId) =>
    fetchApi(`/offsets/${configId}/display-prefs`, {
      method: 'DELETE'
    })
};

// ============ SAMPLE FILES (CSV DEFINITIONS) ============

export const sampleFilesApi = {
  // Get all sample file definitions
  getAll: () => fetchApi('/sample-files'),

  // Get a single sample file definition
  getById: (id) => fetchApi(`/sample-files/${id}`),

  // Create a new sample file definition
  create: (definition) =>
    fetchApi('/sample-files', {
      method: 'POST',
      body: JSON.stringify(definition)
    }),

  // Update a sample file definition
  update: (id, definition) =>
    fetchApi(`/sample-files/${id}`, {
      method: 'PUT',
      body: JSON.stringify(definition)
    }),

  // Delete a sample file definition
  delete: (id) =>
    fetchApi(`/sample-files/${id}`, {
      method: 'DELETE'
    }),

  // Get all files with processing history
  getFilesWithHistory: () => fetchApi('/sample-files/history/all'),

  // ============ BATCH OPERATIONS ============

  // Get all batches for a file definition
  getBatches: (sampleFileId) => fetchApi(`/sample-files/${sampleFileId}/batches`),

  // Get a specific batch
  getBatchById: (sampleFileId, batchId) => fetchApi(`/sample-files/${sampleFileId}/batches/${batchId}`),

  // Get records for a specific batch
  getBatchRecords: (sampleFileId, batchId) => fetchApi(`/sample-files/${sampleFileId}/batches/${batchId}/records`),

  // Delete a batch and its records
  deleteBatch: (sampleFileId, batchId) =>
    fetchApi(`/sample-files/${sampleFileId}/batches/${batchId}`, {
      method: 'DELETE'
    }),

  // Clear all batches for a file definition
  clearAllBatches: (sampleFileId) =>
    fetchApi(`/sample-files/${sampleFileId}/batches`, {
      method: 'DELETE'
    }),

  // ============ LEGACY HISTORY OPERATIONS ============

  // Get processing history for a file definition
  getHistory: (sampleFileId) => fetchApi(`/sample-files/${sampleFileId}/history`),

  // Get processing summary for a file definition
  getHistorySummary: (sampleFileId) => fetchApi(`/sample-files/${sampleFileId}/history/summary`),

  // Clear processing history for a file definition
  clearHistory: (sampleFileId) =>
    fetchApi(`/sample-files/${sampleFileId}/history`, {
      method: 'DELETE'
    }),

  // Delete a single processing record
  deleteHistoryRecord: (sampleFileId, recordId) =>
    fetchApi(`/sample-files/${sampleFileId}/history/${recordId}`, {
      method: 'DELETE'
    })
};

// ============ CSV PROCESSING ============

export const csvProcessingApi = {
  // Process a CSV file
  process: (sampleFileId, csvContent, options = {}) =>
    fetchApi('/csv-processing/process', {
      method: 'POST',
      body: JSON.stringify({ sampleFileId, csvContent, options })
    }),

  // Preview how rows would be mapped
  preview: (sampleFileId, rowData) =>
    fetchApi('/csv-processing/preview', {
      method: 'POST',
      body: JSON.stringify({ sampleFileId, rowData })
    }),

  // Parse CSV without processing (for validation)
  parse: (csvContent, options = {}) =>
    fetchApi('/csv-processing/parse', {
      method: 'POST',
      body: JSON.stringify({ csvContent, options })
    }),

  // Validate CSV columns against file definition
  validate: (sampleFileId, csvContent) =>
    fetchApi('/csv-processing/validate', {
      method: 'POST',
      body: JSON.stringify({ sampleFileId, csvContent })
    }),

  // Build API request body from row data
  buildRequest: (sampleFileId, rowData) =>
    fetchApi('/csv-processing/build-request', {
      method: 'POST',
      body: JSON.stringify({ sampleFileId, rowData })
    })
};

// ============ MONITOR ============

export const monitorApi = {
  // Start monitoring a specific configuration
  start: (configurationId) =>
    fetchApi('/monitor/start', {
      method: 'POST',
      body: JSON.stringify({ configurationId })
    }),

  // Stop monitoring a specific configuration
  stop: (configurationId) =>
    fetchApi('/monitor/stop', {
      method: 'POST',
      body: JSON.stringify({ configurationId })
    }),

  // Restart monitoring a specific configuration
  restart: (configurationId) =>
    fetchApi('/monitor/restart', {
      method: 'POST',
      body: JSON.stringify({ configurationId })
    }),

  // Stop all running monitors
  stopAll: () =>
    fetchApi('/monitor/stop-all', {
      method: 'POST'
    }),

  // Get all monitor statuses
  getAllStatuses: () => fetchApi('/monitor/status'),

  // Get status for a single configuration
  getStatus: (configurationId) => fetchApi(`/monitor/status/${configurationId}`),

  // Check if any monitor is running for a given event sample (server-side matching)
  getSampleStatus: (sampleId) => fetchApi(`/monitor/sample-status/${sampleId}`),

  // Get SSE events URL
  getEventsUrl: () => `${API_BASE}/monitor/events`,

  // Simulate an event (for testing)
  simulate: (eventData, configurationId) =>
    fetchApi('/monitor/simulate', {
      method: 'POST',
      body: JSON.stringify({ eventData, configurationId })
    })
};

// ============ FORM SETTINGS ============

export const formSettingsApi = {
  // Get form settings for an API sample
  get: (apiSampleId) => fetchApi(`/form-settings/${apiSampleId}`),

  // Save form settings for an API sample
  save: (apiSampleId, settings) =>
    fetchApi(`/form-settings/${apiSampleId}`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    }),

  // Delete form settings for an API sample
  delete: (apiSampleId) =>
    fetchApi(`/form-settings/${apiSampleId}`, {
      method: 'DELETE'
    })
};
