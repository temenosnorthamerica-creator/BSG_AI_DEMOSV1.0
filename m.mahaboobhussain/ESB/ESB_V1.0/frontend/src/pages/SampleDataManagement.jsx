import { useState, useEffect, useRef } from 'react';
import { Upload, Plus, Trash2, Eye, Edit, FileJson, FileSpreadsheet, X, ArrowRight, Settings } from 'lucide-react';
import { sampleEventsApi, sampleApisApi, sampleFilesApi } from '../services/api';

export default function SampleDataManagement() {
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [apis, setApis] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingApi, setEditingApi] = useState(null);
  const [editingFile, setEditingFile] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [eventsData, apisData, filesData] = await Promise.all([
        sampleEventsApi.getAll(),
        sampleApisApi.getAll(),
        sampleFilesApi.getAll()
      ]);
      setEvents(eventsData);
      setApis(apisData);
      setFiles(filesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEvent(id) {
    if (!confirm('Are you sure you want to delete this event sample?')) return;
    try {
      await sampleEventsApi.delete(id);
      setEvents(events.filter(e => e.id !== id));
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  }

  async function handleDeleteApi(id) {
    if (!confirm('Are you sure you want to delete this API sample?')) return;
    try {
      await sampleApisApi.delete(id);
      setApis(apis.filter(a => a.id !== id));
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  }

  function handleEventSaved(event) {
    if (editingEvent) {
      setEvents(events.map(e => e.id === event.id ? event : e));
    } else {
      setEvents([...events, event]);
    }
    setShowEventModal(false);
    setEditingEvent(null);
  }

  function handleApiSaved(api) {
    if (editingApi) {
      setApis(apis.map(a => a.id === api.id ? api : a));
    } else {
      setApis([...apis, api]);
    }
    setShowApiModal(false);
    setEditingApi(null);
  }

  async function handleDeleteFile(id) {
    if (!confirm('Are you sure you want to delete this file definition?')) return;
    try {
      await sampleFilesApi.delete(id);
      setFiles(files.filter(f => f.id !== id));
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  }

  function handleFileSaved(file) {
    if (editingFile) {
      setFiles(files.map(f => f.id === file.id ? file : f));
    } else {
      setFiles([...files, file]);
    }
    setShowFileModal(false);
    setEditingFile(null);
  }

  return (
    <div className="sample-data-page">
      <div className="page-header">
        <h1>Sample Data Management</h1>
        <p className="text-muted">Upload sample event JSONs and API request/response JSONs before configuration</p>
      </div>

      <div className="tabs">
        <div
          className={`tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          <FileJson size={16} style={{ marginRight: '0.5rem' }} />
          Sample Events ({events.length})
        </div>
        <div
          className={`tab ${activeTab === 'apis' ? 'active' : ''}`}
          onClick={() => setActiveTab('apis')}
        >
          <FileJson size={16} style={{ marginRight: '0.5rem' }} />
          Sample APIs ({apis.length})
        </div>
        <div
          className={`tab ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          <FileSpreadsheet size={16} style={{ marginRight: '0.5rem' }} />
          Sample Files ({files.length})
        </div>
      </div>

      {error && (
        <div className="card" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
          <p style={{ color: '#dc2626' }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="card text-center">Loading...</div>
      ) : activeTab === 'events' ? (
        <EventsTab
          events={events}
          onAdd={() => { setEditingEvent(null); setShowEventModal(true); }}
          onEdit={(event) => { setEditingEvent(event); setShowEventModal(true); }}
          onDelete={handleDeleteEvent}
        />
      ) : activeTab === 'apis' ? (
        <ApisTab
          apis={apis}
          onAdd={() => { setEditingApi(null); setShowApiModal(true); }}
          onEdit={(api) => { setEditingApi(api); setShowApiModal(true); }}
          onDelete={handleDeleteApi}
        />
      ) : (
        <FilesTab
          files={files}
          apis={apis}
          onAdd={() => { setEditingFile(null); setShowFileModal(true); }}
          onEdit={(file) => { setEditingFile(file); setShowFileModal(true); }}
          onDelete={handleDeleteFile}
        />
      )}

      {showEventModal && (
        <EventModal
          event={editingEvent}
          onClose={() => { setShowEventModal(false); setEditingEvent(null); }}
          onSave={handleEventSaved}
        />
      )}

      {showApiModal && (
        <ApiModal
          api={editingApi}
          onClose={() => { setShowApiModal(false); setEditingApi(null); }}
          onSave={handleApiSaved}
        />
      )}

      {showFileModal && (
        <FileModal
          file={editingFile}
          apis={apis}
          onClose={() => { setShowFileModal(false); setEditingFile(null); }}
          onSave={handleFileSaved}
        />
      )}
    </div>
  );
}

function EventsTab({ events, onAdd, onEdit, onDelete }) {
  const [previewEvent, setPreviewEvent] = useState(null);

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Sample Event JSONs</h2>
          <button className="btn btn-primary" onClick={onAdd}>
            <Plus size={16} />
            Add Event Sample
          </button>
        </div>

        {events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FileJson size={48} /></div>
            <p>No event samples uploaded yet</p>
            <p className="text-sm">Upload sample event JSON files to define event schemas</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Fields</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event.id}>
                  <td><strong>{event.name}</strong></td>
                  <td>{event.fields?.length || 0} fields</td>
                  <td>{new Date(event.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-secondary btn-sm" onClick={() => setPreviewEvent(event)}>
                        <Eye size={14} />
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => onEdit(event)}>
                        <Edit size={14} />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => onDelete(event.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {previewEvent && (
        <PreviewModal
          title={`Preview: ${previewEvent.name}`}
          data={previewEvent.sampleData}
          schema={previewEvent.schema}
          onClose={() => setPreviewEvent(null)}
        />
      )}
    </div>
  );
}

function ApisTab({ apis, onAdd, onEdit, onDelete }) {
  const [previewApi, setPreviewApi] = useState(null);

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Sample API JSONs</h2>
          <button className="btn btn-primary" onClick={onAdd}>
            <Plus size={16} />
            Add API Sample
          </button>
        </div>

        {apis.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FileJson size={48} /></div>
            <p>No API samples uploaded yet</p>
            <p className="text-sm">Upload sample API request/response JSON pairs</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Method</th>
                <th>Endpoint</th>
                <th>Request Fields</th>
                <th>Response Fields</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apis.map(api => (
                <tr key={api.id}>
                  <td><strong>{api.name}</strong></td>
                  <td><span className="badge badge-info">{api.method}</span></td>
                  <td className="text-muted text-sm">{api.endpoint}</td>
                  <td>{api.request?.fields?.length || 0} fields</td>
                  <td>{api.response?.fields?.length || 0} fields</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-secondary btn-sm" onClick={() => setPreviewApi(api)}>
                        <Eye size={14} />
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => onEdit(api)}>
                        <Edit size={14} />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => onDelete(api.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {previewApi && (
        <ApiPreviewModal api={previewApi} onClose={() => setPreviewApi(null)} />
      )}
    </div>
  );
}

function EventModal({ event, onClose, onSave }) {
  const [name, setName] = useState(event?.name || '');
  const [jsonContent, setJsonContent] = useState(
    event?.sampleData ? JSON.stringify(event.sampleData, null, 2) : ''
  );
  const [jsonError, setJsonError] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef();

  function validateJson(text) {
    try {
      JSON.parse(text);
      setJsonError(null);
      return true;
    } catch (e) {
      setJsonError(e.message);
      return false;
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setJsonContent(content);
      validateJson(content);
      if (!name) setName(file.name.replace('.json', ''));
    };
    reader.readAsText(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return alert('Name is required');
    if (!jsonContent.trim()) return alert('JSON content is required');
    if (!validateJson(jsonContent)) return alert('Invalid JSON format');

    setSaving(true);
    try {
      const parsed = JSON.parse(jsonContent);
      let result;
      if (event) {
        result = await sampleEventsApi.update(event.id, name, parsed);
      } else {
        result = await sampleEventsApi.create(name, parsed);
      }
      onSave(result);
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{event ? 'Edit Event Sample' : 'Add Event Sample'}</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Sample Name</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Customer Event, Order Event"
              />
            </div>

            <div className="form-group">
              <label>Upload JSON File</label>
              <div
                className="dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={32} className="dropzone-icon" />
                <p>Click to upload or drag and drop</p>
                <p className="hint">JSON files only</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>

            <div className="form-group">
              <label>JSON Content</label>
              <textarea
                className="form-control"
                value={jsonContent}
                onChange={e => {
                  setJsonContent(e.target.value);
                  validateJson(e.target.value);
                }}
                placeholder='{"field1": "value1", "field2": "value2"}'
                style={{ minHeight: '200px' }}
              />
              {jsonError && (
                <p className="text-sm" style={{ color: 'var(--error-color)', marginTop: '0.5rem' }}>
                  {jsonError}
                </p>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (event ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ApiModal({ api, onClose, onSave }) {
  const [name, setName] = useState(api?.name || '');
  const [endpoint, setEndpoint] = useState(api?.endpoint || '/api/');
  const [method, setMethod] = useState(api?.method || 'POST');
  const [requestJson, setRequestJson] = useState(
    api?.request?.sampleData ? JSON.stringify(api.request.sampleData, null, 2) : ''
  );
  const [responseJson, setResponseJson] = useState(
    api?.response?.sampleData ? JSON.stringify(api.response.sampleData, null, 2) : ''
  );
  const [defaultHeaders, setDefaultHeaders] = useState(() => {
    // Convert object to array of key-value pairs
    const headers = api?.defaultHeaders || {};
    const pairs = Object.entries(headers).map(([key, value]) => ({ key, value }));
    return pairs.length > 0 ? pairs : [{ key: '', value: '' }];
  });
  const [responseCapture, setResponseCapture] = useState(() => {
    const captures = api?.responseCapture || [];
    return captures.length > 0 ? captures : [{ variableName: '', responsePath: '' }];
  });
  const [requestError, setRequestError] = useState(null);
  const [responseError, setResponseError] = useState(null);
  const [saving, setSaving] = useState(false);
  const requestFileRef = useRef();
  const responseFileRef = useRef();

  function addHeader() {
    setDefaultHeaders([...defaultHeaders, { key: '', value: '' }]);
  }

  function removeHeader(index) {
    if (defaultHeaders.length === 1) {
      setDefaultHeaders([{ key: '', value: '' }]);
    } else {
      setDefaultHeaders(defaultHeaders.filter((_, i) => i !== index));
    }
  }

  function updateHeader(index, field, value) {
    const updated = [...defaultHeaders];
    updated[index][field] = value;
    setDefaultHeaders(updated);
  }

  function getHeadersObject() {
    // Convert array of pairs back to object, excluding empty keys
    const obj = {};
    defaultHeaders.forEach(({ key, value }) => {
      if (key.trim()) {
        obj[key.trim()] = value;
      }
    });
    return obj;
  }

  // Response Capture functions
  function addCapture() {
    setResponseCapture([...responseCapture, { variableName: '', responsePath: '' }]);
  }

  function removeCapture(index) {
    if (responseCapture.length === 1) {
      setResponseCapture([{ variableName: '', responsePath: '' }]);
    } else {
      setResponseCapture(responseCapture.filter((_, i) => i !== index));
    }
  }

  function updateCapture(index, field, value) {
    const updated = [...responseCapture];
    updated[index][field] = value;
    setResponseCapture(updated);
  }

  function getResponseCaptureArray() {
    // Filter out empty entries
    return responseCapture.filter(c => c.variableName.trim() && c.responsePath.trim());
  }

  function validateJson(text, setError) {
    try {
      JSON.parse(text);
      setError(null);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }

  function handleFileUpload(e, setContent, setError) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setContent(content);
      validateJson(content, setError);
    };
    reader.readAsText(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return alert('Name is required');
    if (!requestJson.trim()) return alert('Request JSON is required');
    if (!responseJson.trim()) return alert('Response JSON is required');
    if (!validateJson(requestJson, setRequestError)) return alert('Invalid request JSON');
    if (!validateJson(responseJson, setResponseError)) return alert('Invalid response JSON');

    setSaving(true);
    try {
      const parsedRequest = JSON.parse(requestJson);
      const parsedResponse = JSON.parse(responseJson);
      const headersObj = getHeadersObject();
      const captureArr = getResponseCaptureArray();
      let result;
      if (api) {
        result = await sampleApisApi.update(api.id, name, endpoint, method, parsedRequest, parsedResponse, headersObj, captureArr);
      } else {
        result = await sampleApisApi.create(name, endpoint, method, parsedRequest, parsedResponse, headersObj, captureArr);
      }
      onSave(result);
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{api ? 'Edit API Sample' : 'Add API Sample'}</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="grid grid-2">
              <div className="form-group">
                <label>API Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., CRM API, Billing API"
                />
              </div>
              <div className="form-group">
                <label>HTTP Method</label>
                <select className="form-control" value={method} onChange={e => setMethod(e.target.value)}>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Endpoint</label>
              <input
                type="text"
                className="form-control"
                value={endpoint}
                onChange={e => setEndpoint(e.target.value)}
                placeholder="/api/customers/create"
              />
            </div>

            <div className="form-group">
              <label>Default Headers</label>
              <p className="text-sm text-muted mb-1">Headers that will be pre-filled when using this API</p>
              <div className="headers-list">
                {defaultHeaders.map((header, index) => (
                  <div key={index} className="header-row" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Header Name"
                      value={header.key}
                      onChange={e => updateHeader(index, 'key', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Header Value"
                      value={header.value}
                      onChange={e => updateHeader(index, 'value', e.target.value)}
                      style={{ flex: 2 }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => removeHeader(index)}
                      title="Remove header"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addHeader}>
                  <Plus size={14} /> Add Header
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Response Capture (Post-Request Variables)</label>
              <p className="text-sm text-muted mb-1">Capture response values as variables for use in subsequent API calls. Use {'{{variableName}}'} syntax.</p>
              <div className="capture-list">
                {responseCapture.map((capture, index) => (
                  <div key={index} className="capture-row" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Variable Name (e.g., CustId)"
                      value={capture.variableName}
                      onChange={e => updateCapture(index, 'variableName', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Response Path (e.g., body.customerId)"
                      value={capture.responsePath}
                      onChange={e => updateCapture(index, 'responsePath', e.target.value)}
                      style={{ flex: 2 }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => removeCapture(index)}
                      title="Remove capture"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addCapture}>
                  <Plus size={14} /> Add Capture
                </button>
              </div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label>Request JSON Sample</label>
                <div
                  className="dropzone"
                  style={{ padding: '1rem' }}
                  onClick={() => requestFileRef.current?.click()}
                >
                  <Upload size={20} />
                  <span className="text-sm" style={{ marginLeft: '0.5rem' }}>Upload Request JSON</span>
                </div>
                <input
                  ref={requestFileRef}
                  type="file"
                  accept=".json"
                  onChange={e => handleFileUpload(e, setRequestJson, setRequestError)}
                  style={{ display: 'none' }}
                />
                <textarea
                  className="form-control mt-1"
                  value={requestJson}
                  onChange={e => {
                    setRequestJson(e.target.value);
                    validateJson(e.target.value, setRequestError);
                  }}
                  placeholder='{"field": "value"}'
                  style={{ minHeight: '150px' }}
                />
                {requestError && (
                  <p className="text-sm" style={{ color: 'var(--error-color)' }}>{requestError}</p>
                )}
              </div>

              <div className="form-group">
                <label>Response JSON Sample</label>
                <div
                  className="dropzone"
                  style={{ padding: '1rem' }}
                  onClick={() => responseFileRef.current?.click()}
                >
                  <Upload size={20} />
                  <span className="text-sm" style={{ marginLeft: '0.5rem' }}>Upload Response JSON</span>
                </div>
                <input
                  ref={responseFileRef}
                  type="file"
                  accept=".json"
                  onChange={e => handleFileUpload(e, setResponseJson, setResponseError)}
                  style={{ display: 'none' }}
                />
                <textarea
                  className="form-control mt-1"
                  value={responseJson}
                  onChange={e => {
                    setResponseJson(e.target.value);
                    validateJson(e.target.value, setResponseError);
                  }}
                  placeholder='{"id": "123", "status": "success"}'
                  style={{ minHeight: '150px' }}
                />
                {responseError && (
                  <p className="text-sm" style={{ color: 'var(--error-color)' }}>{responseError}</p>
                )}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (api ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PreviewModal({ title, data, schema, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <h4 className="mb-1">Schema</h4>
          <div className="schema-preview mb-2">
            {schema && Object.entries(schema).map(([field, type]) => (
              <div key={field} className="schema-field">
                <span className="field-name">{field}</span>: <span className="field-type">{type}</span>
              </div>
            ))}
          </div>

          <h4 className="mb-1">Sample Data</h4>
          <div className="schema-preview">
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApiPreviewModal({ api, onClose }) {
  const hasHeaders = api.defaultHeaders && Object.keys(api.defaultHeaders).length > 0;
  const hasCapture = api.responseCapture && api.responseCapture.length > 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Preview: {api.name}</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <p className="mb-2">
            <span className="badge badge-info">{api.method}</span>
            <span className="text-muted" style={{ marginLeft: '0.5rem' }}>{api.endpoint}</span>
          </p>

          {hasHeaders && (
            <div className="mb-2">
              <h4 className="mb-1">Default Headers</h4>
              <div className="schema-preview">
                {Object.entries(api.defaultHeaders).map(([key, value]) => (
                  <div key={key} className="schema-field">
                    <span className="field-name">{key}</span>: <span className="field-type">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasCapture && (
            <div className="mb-2">
              <h4 className="mb-1">Response Capture</h4>
              <div className="schema-preview">
                {api.responseCapture.map((cap, index) => (
                  <div key={index} className="schema-field">
                    <span className="field-name">{`{{${cap.variableName}}}`}</span>
                    <span style={{ margin: '0 0.5rem' }}>←</span>
                    <span className="field-type">{cap.responsePath}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-2">
            <div>
              <h4 className="mb-1">Request Schema</h4>
              <div className="schema-preview mb-2">
                {api.request?.schema && Object.entries(api.request.schema).map(([field, type]) => (
                  <div key={field} className="schema-field">
                    <span className="field-name">{field}</span>: <span className="field-type">{type}</span>
                  </div>
                ))}
              </div>
              <h4 className="mb-1">Request Sample</h4>
              <div className="schema-preview">
                <pre>{JSON.stringify(api.request?.sampleData, null, 2)}</pre>
              </div>
            </div>
            <div>
              <h4 className="mb-1">Response Schema</h4>
              <div className="schema-preview mb-2">
                {api.response?.schema && Object.entries(api.response.schema).map(([field, type]) => (
                  <div key={field} className="schema-field">
                    <span className="field-name">{field}</span>: <span className="field-type">{type}</span>
                  </div>
                ))}
              </div>
              <h4 className="mb-1">Response Sample</h4>
              <div className="schema-preview">
                <pre>{JSON.stringify(api.response?.sampleData, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ FILES TAB ============

function FilesTab({ files, apis, onAdd, onEdit, onDelete }) {
  const [previewFile, setPreviewFile] = useState(null);

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Sample File Definitions (CSV)</h2>
          <button className="btn btn-primary" onClick={onAdd}>
            <Plus size={16} />
            Add File Definition
          </button>
        </div>

        {files.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FileSpreadsheet size={48} /></div>
            <p>No file definitions created yet</p>
            <p className="text-sm">Define CSV file structures and map columns to API fields</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Delimiter</th>
                <th>Columns</th>
                <th>Target API</th>
                <th>Mappings</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map(file => (
                <tr key={file.id}>
                  <td><strong>{file.name}</strong></td>
                  <td>
                    <span className="badge badge-secondary">
                      {file.fileFormat?.delimiter === ',' ? 'Comma' :
                       file.fileFormat?.delimiter === '\t' ? 'Tab' :
                       file.fileFormat?.delimiter === '|' ? 'Pipe' :
                       file.fileFormat?.delimiter || ','}
                    </span>
                  </td>
                  <td>{file.columns?.length || 0} columns</td>
                  <td>
                    {file.targetApi?.apiSampleName ? (
                      <span className="text-muted text-sm">{file.targetApi.apiSampleName}</span>
                    ) : (
                      <span className="text-muted text-sm">Not configured</span>
                    )}
                  </td>
                  <td>{Object.keys(file.fieldMapping || {}).length} mappings</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-secondary btn-sm" onClick={() => setPreviewFile(file)}>
                        <Eye size={14} />
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => onEdit(file)}>
                        <Edit size={14} />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => onDelete(file.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}

function FilePreviewModal({ file, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Preview: {file.name}</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          {file.description && (
            <p className="text-muted mb-2">{file.description}</p>
          )}

          <div className="mb-2">
            <h4 className="mb-1">File Format</h4>
            <div className="schema-preview">
              <div className="schema-field">
                <span className="field-name">Delimiter</span>: <span className="field-type">{file.fileFormat?.delimiter || ','}</span>
              </div>
              <div className="schema-field">
                <span className="field-name">Has Header</span>: <span className="field-type">{file.fileFormat?.hasHeader ? 'Yes' : 'No'}</span>
              </div>
              <div className="schema-field">
                <span className="field-name">Header Rows</span>: <span className="field-type">{file.fileFormat?.headerRowCount || 1}</span>
              </div>
              <div className="schema-field">
                <span className="field-name">Footer Rows</span>: <span className="field-type">{file.fileFormat?.footerRowCount || 0}</span>
              </div>
            </div>
          </div>

          {file.columns && file.columns.length > 0 && (
            <div className="mb-2">
              <h4 className="mb-1">Columns ({file.columns.length})</h4>
              <div className="schema-preview">
                {file.columns.map((col, index) => (
                  <div key={index} className="schema-field">
                    <span className="field-name">{col.name}</span>
                    {col.type && <span className="field-type" style={{ marginLeft: '0.5rem' }}>({col.type})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {file.targetApi?.apiSampleName && (
            <div className="mb-2">
              <h4 className="mb-1">Target API</h4>
              <div className="schema-preview">
                <div className="schema-field">
                  <span className="field-type">{file.targetApi.apiSampleName}</span>
                </div>
              </div>
            </div>
          )}

          {file.fieldMapping && Object.keys(file.fieldMapping).length > 0 && (
            <div className="mb-2">
              <h4 className="mb-1">Field Mappings</h4>
              <div className="schema-preview">
                {Object.entries(file.fieldMapping).map(([csvCol, apiField], index) => (
                  <div key={index} className="schema-field">
                    <span className="field-name">{csvCol}</span>
                    <ArrowRight size={14} style={{ margin: '0 0.5rem', opacity: 0.5 }} />
                    <span className="field-type">{apiField}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {file.staticFields && Object.keys(file.staticFields).length > 0 && (
            <div className="mb-2">
              <h4 className="mb-1">Static Fields</h4>
              <div className="schema-preview">
                {Object.entries(file.staticFields).map(([field, value], index) => (
                  <div key={index} className="schema-field">
                    <span className="field-name">{field}</span>: <span className="field-type">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {file.responseCapture && file.responseCapture.length > 0 && (
            <div className="mb-2">
              <h4 className="mb-1">Response Capture</h4>
              <div className="schema-preview">
                {file.responseCapture.map((cap, index) => (
                  <div key={index} className="schema-field">
                    <span className="field-name">{cap.displayName || cap.responsePath}</span>
                    <span style={{ margin: '0 0.5rem' }}>←</span>
                    <span className="field-type">{cap.responsePath}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FileModal({ file, apis, onClose, onSave }) {
  const [name, setName] = useState(file?.name || '');
  const [description, setDescription] = useState(file?.description || '');
  const [delimiter, setDelimiter] = useState(file?.fileFormat?.delimiter || ',');
  const [hasHeader, setHasHeader] = useState(file?.fileFormat?.hasHeader !== false);
  const [headerRowCount, setHeaderRowCount] = useState(file?.fileFormat?.headerRowCount || 1);
  const [footerRowCount, setFooterRowCount] = useState(file?.fileFormat?.footerRowCount || 0);
  const [columns, setColumns] = useState(() => {
    const cols = file?.columns || [];
    return cols.length > 0 ? cols : [{ name: '', type: 'string' }];
  });
  const [selectedApiId, setSelectedApiId] = useState(file?.targetApi?.apiSampleId || '');
  const [fieldMapping, setFieldMapping] = useState(() => {
    const mapping = file?.fieldMapping || {};
    const entries = Object.entries(mapping);
    return entries.length > 0 ? entries.map(([csv, api]) => ({ csvColumn: csv, apiField: api })) : [{ csvColumn: '', apiField: '' }];
  });
  const [staticFields, setStaticFields] = useState(() => {
    const fields = file?.staticFields || {};
    const entries = Object.entries(fields);
    return entries.length > 0 ? entries.map(([field, value]) => ({ apiField: field, value })) : [{ apiField: '', value: '' }];
  });
  const [responseCapture, setResponseCapture] = useState(() => {
    const captures = file?.responseCapture || [];
    return captures.length > 0 ? captures : [{ responsePath: '', displayName: '' }];
  });
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('format');

  const selectedApi = apis.find(a => a.id === selectedApiId);
  const apiFields = selectedApi?.request?.fields || [];

  // Column functions
  function addColumn() {
    setColumns([...columns, { name: '', type: 'string' }]);
  }

  function removeColumn(index) {
    if (columns.length === 1) {
      setColumns([{ name: '', type: 'string' }]);
    } else {
      setColumns(columns.filter((_, i) => i !== index));
    }
  }

  function updateColumn(index, field, value) {
    const updated = [...columns];
    updated[index][field] = value;
    setColumns(updated);
  }

  // Mapping functions
  function addMapping() {
    setFieldMapping([...fieldMapping, { csvColumn: '', apiField: '' }]);
  }

  function removeMapping(index) {
    if (fieldMapping.length === 1) {
      setFieldMapping([{ csvColumn: '', apiField: '' }]);
    } else {
      setFieldMapping(fieldMapping.filter((_, i) => i !== index));
    }
  }

  function updateMapping(index, field, value) {
    const updated = [...fieldMapping];
    updated[index][field] = value;
    setFieldMapping(updated);
  }

  // Static fields functions
  function addStaticField() {
    setStaticFields([...staticFields, { apiField: '', value: '' }]);
  }

  function removeStaticField(index) {
    if (staticFields.length === 1) {
      setStaticFields([{ apiField: '', value: '' }]);
    } else {
      setStaticFields(staticFields.filter((_, i) => i !== index));
    }
  }

  function updateStaticField(index, field, value) {
    const updated = [...staticFields];
    updated[index][field] = value;
    setStaticFields(updated);
  }

  // Response capture functions
  function addCapture() {
    setResponseCapture([...responseCapture, { responsePath: '', displayName: '' }]);
  }

  function removeCapture(index) {
    if (responseCapture.length === 1) {
      setResponseCapture([{ responsePath: '', displayName: '' }]);
    } else {
      setResponseCapture(responseCapture.filter((_, i) => i !== index));
    }
  }

  function updateCapture(index, field, value) {
    const updated = [...responseCapture];
    updated[index][field] = value;
    setResponseCapture(updated);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return alert('Name is required');

    setSaving(true);
    try {
      // Build data objects
      const columnsData = columns.filter(c => c.name.trim());
      const fieldMappingObj = {};
      fieldMapping.forEach(m => {
        if (m.csvColumn.trim() && m.apiField.trim()) {
          fieldMappingObj[m.csvColumn.trim()] = m.apiField.trim();
        }
      });
      const staticFieldsObj = {};
      staticFields.forEach(s => {
        if (s.apiField.trim()) {
          staticFieldsObj[s.apiField.trim()] = s.value;
        }
      });
      const responseCaptureArr = responseCapture.filter(c => c.responsePath.trim());

      const definition = {
        name,
        description,
        delimiter,
        hasHeader,
        headerRowCount: parseInt(headerRowCount) || 1,
        footerRowCount: parseInt(footerRowCount) || 0,
        columns: columnsData,
        apiSampleId: selectedApiId || null,
        apiSampleName: selectedApi?.name || '',
        fieldMapping: fieldMappingObj,
        staticFields: staticFieldsObj,
        responseCapture: responseCaptureArr
      };

      let result;
      if (file) {
        result = await sampleFilesApi.update(file.id, definition);
      } else {
        result = await sampleFilesApi.create(definition);
      }
      onSave(result);
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '900px', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{file ? 'Edit File Definition' : 'Add File Definition'}</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: 'calc(90vh - 150px)', overflowY: 'auto' }}>
            {/* Basic Info */}
            <div className="grid grid-2 mb-2">
              <div className="form-group">
                <label>Definition Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Funds Transfer CSV"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  className="form-control"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Optional description"
                />
              </div>
            </div>

            {/* Section Tabs */}
            <div className="tabs mb-2">
              <div className={`tab ${activeSection === 'format' ? 'active' : ''}`} onClick={() => setActiveSection('format')}>
                <Settings size={14} style={{ marginRight: '0.25rem' }} />
                File Format
              </div>
              <div className={`tab ${activeSection === 'columns' ? 'active' : ''}`} onClick={() => setActiveSection('columns')}>
                Columns ({columns.filter(c => c.name.trim()).length})
              </div>
              <div className={`tab ${activeSection === 'mapping' ? 'active' : ''}`} onClick={() => setActiveSection('mapping')}>
                API Mapping
              </div>
              <div className={`tab ${activeSection === 'capture' ? 'active' : ''}`} onClick={() => setActiveSection('capture')}>
                Response Capture
              </div>
            </div>

            {/* File Format Section */}
            {activeSection === 'format' && (
              <div className="card mb-2">
                <div className="grid grid-2">
                  <div className="form-group">
                    <label>Delimiter</label>
                    <select className="form-control" value={delimiter} onChange={e => setDelimiter(e.target.value)}>
                      <option value=",">Comma (,)</option>
                      <option value="	">Tab</option>
                      <option value="|">Pipe (|)</option>
                      <option value=";">Semicolon (;)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Has Header Row</label>
                    <select className="form-control" value={hasHeader ? 'yes' : 'no'} onChange={e => setHasHeader(e.target.value === 'yes')}>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Header Row Count</label>
                    <input
                      type="number"
                      className="form-control"
                      value={headerRowCount}
                      onChange={e => setHeaderRowCount(e.target.value)}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Footer Row Count</label>
                    <input
                      type="number"
                      className="form-control"
                      value={footerRowCount}
                      onChange={e => setFooterRowCount(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Columns Section */}
            {activeSection === 'columns' && (
              <div className="card mb-2">
                <p className="text-sm text-muted mb-1">Define the expected columns in your CSV file</p>
                {columns.map((col, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Column Name"
                      value={col.name}
                      onChange={e => updateColumn(index, 'name', e.target.value)}
                      style={{ flex: 2 }}
                    />
                    <select
                      className="form-control"
                      value={col.type}
                      onChange={e => updateColumn(index, 'type', e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="boolean">Boolean</option>
                    </select>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeColumn(index)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addColumn}>
                  <Plus size={14} /> Add Column
                </button>
              </div>
            )}

            {/* API Mapping Section */}
            {activeSection === 'mapping' && (
              <div className="card mb-2">
                <div className="form-group mb-2">
                  <label>Target API</label>
                  <select
                    className="form-control"
                    value={selectedApiId}
                    onChange={e => setSelectedApiId(e.target.value)}
                  >
                    <option value="">Select an API...</option>
                    {apis.map(api => (
                      <option key={api.id} value={api.id}>
                        {api.name} ({api.method} {api.endpoint})
                      </option>
                    ))}
                  </select>
                </div>

                <h4 className="mb-1">Field Mappings (CSV Column → API Field)</h4>
                <p className="text-sm text-muted mb-1">Map CSV columns to API request fields</p>
                {fieldMapping.map((mapping, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    <select
                      className="form-control"
                      value={mapping.csvColumn}
                      onChange={e => updateMapping(index, 'csvColumn', e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="">Select CSV column...</option>
                      {columns.filter(c => c.name.trim()).map((col, i) => (
                        <option key={i} value={col.name}>{col.name}</option>
                      ))}
                    </select>
                    <ArrowRight size={16} style={{ opacity: 0.5 }} />
                    <select
                      className="form-control"
                      value={mapping.apiField}
                      onChange={e => updateMapping(index, 'apiField', e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="">Select API field...</option>
                      {apiFields.map((field, i) => (
                        <option key={i} value={field}>{field}</option>
                      ))}
                    </select>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeMapping(index)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm mb-2" onClick={addMapping}>
                  <Plus size={14} /> Add Mapping
                </button>

                <h4 className="mb-1">Static Fields</h4>
                <p className="text-sm text-muted mb-1">Set constant values for API fields. Use {'{{variableName}}'} for environment variables.</p>
                {staticFields.map((sf, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <select
                      className="form-control"
                      value={sf.apiField}
                      onChange={e => updateStaticField(index, 'apiField', e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="">Select API field...</option>
                      {apiFields.map((field, i) => (
                        <option key={i} value={field}>{field}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Static value or {{variable}}"
                      value={sf.value}
                      onChange={e => updateStaticField(index, 'value', e.target.value)}
                      style={{ flex: 2 }}
                    />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeStaticField(index)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addStaticField}>
                  <Plus size={14} /> Add Static Field
                </button>
              </div>
            )}

            {/* Response Capture Section */}
            {activeSection === 'capture' && (
              <div className="card mb-2">
                <p className="text-sm text-muted mb-1">
                  Capture fields from API responses to display in execution history
                </p>
                {responseCapture.map((cap, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Response Path (e.g., body.transactionId)"
                      value={cap.responsePath}
                      onChange={e => updateCapture(index, 'responsePath', e.target.value)}
                      style={{ flex: 2 }}
                    />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Display Name (optional)"
                      value={cap.displayName}
                      onChange={e => updateCapture(index, 'displayName', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => removeCapture(index)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addCapture}>
                  <Plus size={14} /> Add Capture Field
                </button>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (file ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
