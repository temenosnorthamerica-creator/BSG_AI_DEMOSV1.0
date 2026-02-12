import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, Globe, AlertCircle, CheckCircle, Loader, FileJson, Zap, Eye, EyeOff, Plus, Trash2, Variable, ExternalLink, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import DynamicForm from '../components/DynamicForm';
import FormSettingsModal from '../components/FormSettingsModal';
import { sampleApisApi, formGeneratorApi, environmentVariablesApi, formSettingsApi } from '../services/api';

function Digital() {
  const [apiSamples, setApiSamples] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState('');
  const [selectedSample, setSelectedSample] = useState(null);
  const [formConfig, setFormConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [showAllFields, setShowAllFields] = useState(false);
  const [apiHeaders, setApiHeaders] = useState([{ key: '', value: '' }]);
  const [showHeadersPanel, setShowHeadersPanel] = useState(false);

  // Global environment variables state
  const [variables, setVariables] = useState({});
  const [loadingVariables, setLoadingVariables] = useState(false);
  const [fieldVariables, setFieldVariables] = useState({});

  // Form settings state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [formSettings, setFormSettings] = useState(null);

  useEffect(() => {
    loadSamples();
  }, []);

  useEffect(() => {
    if (selectedSampleId) {
      loadSelectedSample();
    } else {
      setSelectedSample(null);
      setFormConfig(null);
      setResult(null);
    }
  }, [selectedSampleId]);

  const loadSamples = async () => {
    try {
      setLoading(true);
      const apis = await sampleApisApi.getAll();
      setApiSamples(apis);
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

  useEffect(() => {
    if (selectedSample) {
      detectFieldVariables();
    }
  }, [selectedSample, variables]);

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

  const getSampleDataRaw = () => {
    if (!selectedSample) return null;
    return selectedSample.request?.sampleData || {};
  };

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
      const sample = await sampleApisApi.getById(selectedSampleId);
      const defaultHeaders = sample.defaultHeaders || {};
      const headerPairs = Object.entries(defaultHeaders).map(([key, value]) => ({ key, value }));
      setApiHeaders(headerPairs.length > 0 ? headerPairs : [{ key: '', value: '' }]);
      setSelectedSample(sample);

      try {
        const configResponse = await formGeneratorApi.getFormConfig('api', selectedSampleId);
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

  const addHeader = () => {
    setApiHeaders([...apiHeaders, { key: '', value: '' }]);
  };

  const removeHeader = (index) => {
    if (apiHeaders.length === 1) {
      setApiHeaders([{ key: '', value: '' }]);
    } else {
      setApiHeaders(apiHeaders.filter((_, i) => i !== index));
    }
  };

  const updateHeader = (index, field, value) => {
    const updated = [...apiHeaders];
    updated[index][field] = value;
    setApiHeaders(updated);
  };

  const getHeadersObject = () => {
    const obj = {};
    apiHeaders.forEach(({ key, value }) => {
      if (key.trim()) {
        obj[key.trim()] = value;
      }
    });
    return obj;
  };

  const getConfiguredHeadersCount = () => {
    return apiHeaders.filter(h => h.key.trim()).length;
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

  const isHeadersSectionVisible = () => {
    if (!formSettings?.sections?.headers) return true;
    return formSettings.sections.headers.visible !== false;
  };

  const isFieldVisible = (fieldPath) => {
    if (!formSettings?.fields?.[fieldPath]) return true;
    return formSettings.fields[fieldPath].visible !== false;
  };

  const getSampleData = () => {
    const rawData = getSampleDataRaw();
    if (!rawData) return null;
    if (Object.keys(variables).length > 0) {
      return substituteVariables(rawData);
    }
    return rawData;
  };

  const getFields = () => {
    if (!selectedSample) return [];
    return selectedSample.request?.fields || [];
  };

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

    try {
      const headersObj = getHeadersObject();
      const apiConfig = {
        endpoint: selectedSample.endpoint,
        method: selectedSample.method,
        headers: headersObj,
        body: formData,
        apiSampleId: selectedSampleId
      };
      const response = await formGeneratorApi.callApi(apiConfig);
      setResult({
        success: response.success,
        type: 'api',
        message: response.success ? 'API call successful' : `API call failed: ${response.statusText}`,
        data: response,
        sentData: formData,
        sentHeaders: headersObj,
        capturedVariables: response.capturedVariables || []
      });

      // Reload environment variables if any were captured
      if (response.capturedVariables && response.capturedVariables.length > 0) {
        await loadGlobalVariables();
      }
    } catch (err) {
      setResult({
        success: false,
        type: 'api',
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
            <h4>Sent Headers</h4>
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
            <h4>Sent Data</h4>
            <pre className="json-preview-content">
              {JSON.stringify(result.sentData, null, 2)}
            </pre>
          </div>
        )}

        {result.data && result.data.response && (
          <div className="result-section">
            <h4>
              API Response
              <span className={`status-code ${result.data.status >= 200 && result.data.status < 300 ? 'success' : 'error'}`}>
                {result.data.status} {result.data.statusText}
              </span>
              {result.data.duration && <span className="duration">{result.data.duration}</span>}
            </h4>
            <pre className="json-preview-content">
              {JSON.stringify(result.data.response.data, null, 2)}
            </pre>
          </div>
        )}

        {result.capturedVariables && result.capturedVariables.length > 0 && (
          <div className="result-section captured-variables-section">
            <h4>
              <Variable size={16} />
              Captured Variables (Saved to Environment Variables)
            </h4>
            <div className="captured-variables-list">
              {result.capturedVariables.map((variable, index) => (
                <div key={index} className="captured-variable-item">
                  <span className="variable-name">{variable.variableName}</span>
                  <span className="variable-arrow">←</span>
                  <span className="variable-path">{variable.responsePath}</span>
                  <span className="variable-value">{String(variable.value)}</span>
                </div>
              ))}
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
        <p>Loading API samples...</p>
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
    <div className="form-generator-page digital-page">
      <div className="page-header">
        <h1>DIGITAL</h1>
        <p className="page-subtitle">Make HTTP calls to external APIs with dynamic forms</p>
      </div>

      {/* Sample Tabs */}
      {apiSamples.length > 0 ? (
        <div className="sample-tabs-container">
          <div className="sample-tabs">
            {apiSamples.map(sample => (
              <button
                key={sample.id}
                className={`sample-tab ${selectedSampleId === sample.id ? 'active' : ''}`}
                onClick={() => handleTabClick(sample.id)}
              >
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
          <Globe size={48} className="empty-icon" />
          <h3>No API Samples</h3>
          <p>Create API samples in the Sample Data Management page first.</p>
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

          {/* Headers Section - Inside Form Card (respects visibility settings) */}
          {isHeadersSectionVisible() && (
          <div className={`form-section headers-section ${showHeadersPanel ? 'expanded' : 'collapsed'}`}>
            <div
              className="section-header clickable"
              onClick={() => setShowHeadersPanel(!showHeadersPanel)}
            >
              <div className="section-title">
                <Globe size={16} />
                <span>Headers</span>
              </div>
              <div className="section-meta">
                <span className="field-count">
                  {getConfiguredHeadersCount() > 0
                    ? `${getConfiguredHeadersCount()} field${getConfiguredHeadersCount() !== 1 ? 's' : ''}`
                    : '0 fields'}
                </span>
                <span className="collapse-icon">
                  {showHeadersPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>
            </div>

            {showHeadersPanel && (
              <div className="section-content">
                {apiHeaders.map((header, index) => (
                  <div key={index} className="header-field-row">
                    <div className="header-inputs">
                      <div className="form-group">
                        <label>Header Name</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter header name"
                          value={header.key}
                          onChange={e => updateHeader(index, 'key', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Header Value</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter header value"
                          value={header.value}
                          onChange={e => updateHeader(index, 'value', e.target.value)}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm remove-header-btn"
                      onClick={() => removeHeader(index)}
                      title="Remove header"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm add-header-btn" onClick={addHeader}>
                  <Plus size={14} /> Add Header
                </button>
              </div>
            )}
          </div>
          )}

          <DynamicForm
            fields={getFields()}
            sampleData={getSampleData()}
            formConfig={formConfig}
            onSubmit={handleFormSubmit}
            disabled={submitting}
            showHiddenFields={showAllFields}
            fieldVariables={fieldVariables}
            formSettings={formSettings}
            submitLabel={
              submitting
                ? 'Sending...'
                : `Call ${selectedSample.method} API`
            }
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
        .digital-page .page-subtitle {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        /* Sample Tabs */
        .digital-page .sample-tabs-container {
          margin-bottom: 1.5rem;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .digital-page .settings-btn {
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

        .digital-page .settings-btn:hover {
          color: var(--primary-color);
          border-color: var(--primary-color);
          background: rgba(59, 130, 246, 0.05);
        }

        .digital-page .sample-tabs {
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

        .digital-page .sample-tab {
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

        .digital-page .sample-tab:hover {
          border-color: var(--primary-color);
          background: rgba(59, 130, 246, 0.05);
          color: var(--text-primary);
        }

        .digital-page .sample-tab.active {
          border-color: var(--primary-color);
          background: rgba(59, 130, 246, 0.1);
          color: var(--primary-color);
        }

        .digital-page .sample-tab .tab-name {
          font-size: 0.875rem;
        }

        /* Empty State */
        .digital-page .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
        }

        .digital-page .empty-state .empty-icon {
          color: var(--text-secondary);
          opacity: 0.5;
          margin-bottom: 1rem;
        }

        .digital-page .empty-state h3 {
          margin: 0 0 0.5rem;
          color: var(--text-primary);
        }

        .digital-page .empty-state p {
          color: var(--text-secondary);
          margin: 0 0 1.5rem;
        }

        /* Reuse form-generator-page styles */
        .digital-page .loading-config {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 2rem;
          color: var(--text-secondary);
        }

        /* Make FormSection and FormArray span full width */
        .digital-page .form-section-clean,
        .digital-page .form-array-clean {
          grid-column: 1 / -1;
          width: 100%;
        }

        .digital-page .section-fields-grid,
        .digital-page .array-item-fields-grid {
          grid-template-columns: repeat(4, 1fr);
        }

        @media (max-width: 1200px) {
          .digital-page .section-fields-grid,
          .digital-page .array-item-fields-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .digital-page .section-fields-grid,
          .digital-page .array-item-fields-grid {
            grid-template-columns: 1fr;
          }
        }

        .digital-page .form-card {
          padding: 0;
        }

        .digital-page .form-card .card-header {
          padding: 1rem 1.5rem;
          margin-bottom: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .digital-page .smart-form-badge {
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

        /* Headers Section Inside Form */
        .digital-page .headers-section {
          margin: 0.75rem 1rem;
          padding: 0;
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
        }

        .digital-page .headers-section .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.25rem 0.75rem;
          cursor: pointer;
          user-select: none;
          transition: background 0.2s;
          border-bottom: 1px solid var(--border-color);
        }

        .digital-page .headers-section .section-header:hover {
          background: rgba(0, 0, 0, 0.02);
        }

        .digital-page .headers-section .section-title {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-weight: 600;
          font-size: 0.8rem;
          color: var(--text-primary);
        }

        .digital-page .headers-section .section-meta {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .digital-page .headers-section .field-count {
          font-size: 0.65rem;
          color: var(--text-secondary);
          background: var(--bg-color);
          padding: 0.1rem 0.4rem;
          border-radius: 0.25rem;
        }

        .digital-page .headers-section .collapse-icon {
          color: var(--text-secondary);
          display: flex;
          align-items: center;
        }

        .digital-page .headers-section .section-content {
          padding: 0.125rem 0.5rem 0.25rem;
        }

        .digital-page .header-field-row {
          display: flex;
          align-items: flex-end;
          gap: 0.5rem;
          margin: 0;
          padding: 0.125rem 0.25rem;
          background: transparent;
          border-radius: 0.25rem;
        }

        .digital-page .header-field-row .header-inputs {
          display: flex;
          flex: 1;
          gap: 0.5rem;
        }

        .digital-page .header-field-row .form-group {
          flex: 1;
          margin: 0;
          padding: 0;
        }

        .digital-page .header-field-row .form-group label {
          display: block;
          font-size: 0.7rem;
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: 0.1rem;
          padding: 0;
        }

        .digital-page .header-field-row .remove-header-btn {
          color: var(--text-secondary);
          padding: 0.25rem;
          margin: 0;
        }

        .digital-page .header-field-row .remove-header-btn:hover {
          color: var(--error-color);
          background: rgba(239, 68, 68, 0.1);
        }

        .digital-page .headers-section .add-header-btn {
          margin: 0.125rem 0 0 0;
        }

        .digital-page .result-section h4 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
          color: var(--text-secondary);
        }

        .digital-page .status-code {
          padding: 0.125rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .digital-page .status-code.success {
          background: rgba(34, 197, 94, 0.2);
          color: var(--success-color);
        }

        .digital-page .status-code.error {
          background: rgba(239, 68, 68, 0.2);
          color: var(--error-color);
        }

        .digital-page .duration {
          font-size: 0.75rem;
          color: var(--text-secondary);
          background: var(--bg-color);
          padding: 0.125rem 0.5rem;
          border-radius: 0.25rem;
        }

        .digital-page .headers-preview {
          background: var(--bg-color);
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
        }

        .digital-page .headers-preview .header-item {
          display: flex;
          gap: 0.5rem;
          padding: 0.25rem 0;
          font-size: 0.875rem;
          font-family: 'Fira Code', monospace;
        }

        .digital-page .headers-preview .header-key {
          color: var(--primary-color);
          font-weight: 500;
        }

        .digital-page .headers-preview .header-value {
          color: var(--text-secondary);
        }

        /* Captured Variables Section */
        .digital-page .captured-variables-section {
          background: rgba(34, 197, 94, 0.05);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 0.5rem;
          padding: 1rem;
          margin-top: 1rem;
        }

        .digital-page .captured-variables-section h4 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--success-color);
          margin-bottom: 0.75rem;
        }

        .digital-page .captured-variables-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .digital-page .captured-variable-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 1rem;
          background: var(--card-bg);
          border-radius: 0.375rem;
          font-family: 'Fira Code', monospace;
          font-size: 0.8125rem;
          flex-wrap: wrap;
        }

        .digital-page .captured-variable-item .variable-name {
          color: var(--primary-color);
          font-weight: 600;
          min-width: 120px;
        }

        .digital-page .captured-variable-item .variable-arrow {
          color: var(--text-secondary);
          opacity: 0.5;
        }

        .digital-page .captured-variable-item .variable-path {
          color: var(--text-secondary);
          font-size: 0.75rem;
        }

        .digital-page .captured-variable-item .variable-value {
          margin-left: auto;
          color: var(--success-color);
          background: rgba(34, 197, 94, 0.1);
          padding: 0.25rem 0.625rem;
          border-radius: 0.25rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}

export default Digital;
