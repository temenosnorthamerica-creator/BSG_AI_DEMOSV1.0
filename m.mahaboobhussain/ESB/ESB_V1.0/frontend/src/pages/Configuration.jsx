import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, ArrowRight, Trash2, Plus, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { sampleEventsApi, sampleApisApi, configurationsApi } from '../services/api';

export default function Configuration() {
  const [events, setEvents] = useState([]);
  const [apis, setApis] = useState([]);
  const [configurations, setConfigurations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [configName, setConfigName] = useState('');
  const [eventType, setEventType] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedApiId, setSelectedApiId] = useState('');
  const [mapping, setMapping] = useState({});
  const [editingConfigId, setEditingConfigId] = useState(null);
  const [fieldVisibility, setFieldVisibility] = useState({}); // { fieldPath: 'editable' | 'hidden' }

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    updateFlowNodes();
  }, [selectedEventId, selectedApiId]);

  async function loadData() {
    setLoading(true);
    try {
      const [eventsData, apisData, configsData] = await Promise.all([
        sampleEventsApi.getAll(),
        sampleApisApi.getAll(),
        configurationsApi.getAll()
      ]);
      setEvents(eventsData);
      setApis(apisData);
      setConfigurations(configsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  function updateFlowNodes() {
    const newNodes = [];
    const sourceFields = getSourceFields();
    const apiFields = getApiFields();

    // Source fields node
    if (sourceFields.length > 0) {
      newNodes.push({
        id: 'source',
        type: 'default',
        position: { x: 50, y: 50 },
        data: {
          label: (
            <div style={{ textAlign: 'left', padding: '0.5rem' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>
                Source Fields
              </div>
              {sourceFields.map(field => (
                <div
                  key={field}
                  style={{
                    padding: '0.25rem 0',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  {field}
                </div>
              ))}
            </div>
          )
        },
        style: { background: '#f0fdf4', border: '1px solid #86efac', minWidth: 180 }
      });
    }

    // API fields node
    if (apiFields.length > 0) {
      newNodes.push({
        id: 'api',
        type: 'default',
        position: { x: 400, y: 50 },
        data: {
          label: (
            <div style={{ textAlign: 'left', padding: '0.5rem' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>
                API Request Fields
              </div>
              {apiFields.map(field => (
                <div
                  key={field}
                  style={{
                    padding: '0.25rem 0',
                    fontSize: '0.8rem'
                  }}
                >
                  {field}
                </div>
              ))}
            </div>
          )
        },
        style: { background: '#eff6ff', border: '1px solid #93c5fd', minWidth: 180 }
      });
    }

    setNodes(newNodes);

    // Create edges from mapping
    const newEdges = Object.entries(mapping).map(([source, target], index) => ({
      id: `e-${index}`,
      source: 'source',
      target: 'api',
      label: `${source} → ${target}`,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#3b82f6' }
    }));
    setEdges(newEdges);
  }

  function getSourceFields() {
    if (selectedEventId) {
      const event = events.find(e => e.id === selectedEventId);
      return event?.fields || [];
    }
    return [];
  }

  function getApiFields() {
    if (selectedApiId) {
      const api = apis.find(a => a.id === selectedApiId);
      return api?.request?.fields || [];
    }
    return [];
  }

  // Get mapped and unmapped API fields
  const mappedApiFields = useMemo(() => {
    return Object.values(mapping);
  }, [mapping]);

  const unmappedApiFields = useMemo(() => {
    const apiFields = getApiFields();
    return apiFields.filter(field => !mappedApiFields.includes(field));
  }, [selectedApiId, mappedApiFields, apis]);

  // Toggle field visibility
  function toggleFieldVisibility(fieldPath) {
    setFieldVisibility(prev => ({
      ...prev,
      [fieldPath]: prev[fieldPath] === 'editable' ? 'hidden' : 'editable'
    }));
  }

  // Generate formConfig based on mapping and visibility settings
  function generateFormConfig() {
    const formConfig = { fields: {} };
    const apiFields = getApiFields();

    apiFields.forEach(field => {
      const isMapped = mappedApiFields.includes(field);
      const explicitVisibility = fieldVisibility[field];

      if (explicitVisibility) {
        // Use explicit visibility if set by user
        formConfig.fields[field] = { visibility: explicitVisibility };
      } else if (!isMapped) {
        // Unmapped fields are hidden by default
        formConfig.fields[field] = { visibility: 'hidden' };
      }
      // Mapped fields without explicit setting remain 'editable' (default)
    });

    return formConfig;
  }

  function addMapping(sourceField, apiField) {
    setMapping(prev => ({ ...prev, [sourceField]: apiField }));
  }

  function removeMapping(sourceField) {
    setMapping(prev => {
      const newMapping = { ...prev };
      delete newMapping[sourceField];
      return newMapping;
    });
  }

  async function handleSave() {
    if (!configName.trim()) return alert('Configuration name is required');
    if (!selectedEventId) return alert('Please select an event sample');
    if (!selectedApiId) return alert('Please select an API sample');
    if (Object.keys(mapping).length === 0) return alert('Please create at least one mapping');

    const configData = {
      name: configName,
      eventType: eventType.trim() || null,
      source: {
        type: 'event',
        eventSampleId: selectedEventId
      },
      destination: {
        apiSampleId: selectedApiId
      },
      mapping,
      formConfig: generateFormConfig()
    };

    try {
      let result;
      if (editingConfigId) {
        result = await configurationsApi.update(editingConfigId, configData);
        setConfigurations(configurations.map(c => c.id === editingConfigId ? result : c));
      } else {
        result = await configurationsApi.create(configData);
        setConfigurations([...configurations, result]);
      }
      alert('Configuration saved successfully!');
      resetForm();
    } catch (err) {
      alert('Failed to save: ' + err.message);
    }
  }

  function resetForm() {
    setConfigName('');
    setEventType('');
    setSelectedEventId('');
    setSelectedApiId('');
    setMapping({});
    setEditingConfigId(null);
    setFieldVisibility({});
  }

  function loadConfiguration(config) {
    setEditingConfigId(config.id);
    setConfigName(config.name);
    setEventType(config.eventType || '');
    setSelectedEventId(config.source.eventSampleId || '');
    setSelectedApiId(config.destination.apiSampleId);
    setMapping(config.mapping || {});

    // Load field visibility from formConfig
    const visibility = {};
    if (config.formConfig?.fields) {
      Object.entries(config.formConfig.fields).forEach(([field, fieldConfig]) => {
        if (fieldConfig.visibility) {
          visibility[field] = fieldConfig.visibility;
        }
      });
    }
    setFieldVisibility(visibility);
  }

  async function deleteConfiguration(id) {
    if (!confirm('Are you sure you want to delete this configuration?')) return;
    try {
      await configurationsApi.delete(id);
      setConfigurations(configurations.filter(c => c.id !== id));
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  }

  const sourceFields = getSourceFields();
  const apiFields = getApiFields();

  if (loading) {
    return <div className="card text-center">Loading...</div>;
  }

  return (
    <div className="configuration-page">
      <div className="page-header">
        <h1>Configuration</h1>
        <div className="flex gap-1">
          {editingConfigId && (
            <button className="btn btn-secondary" onClick={resetForm}>
              New Configuration
            </button>
          )}
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={16} />
            {editingConfigId ? 'Update' : 'Save'} Configuration
          </button>
        </div>
      </div>

      {(events.length === 0 && apis.length === 0) && (
        <div className="card" style={{ background: '#fef3c7', borderColor: '#fcd34d' }}>
          <p style={{ color: '#92400e' }}>
            <strong>No sample data found!</strong> Please upload sample event JSONs and API JSONs in the Sample Data Management page first.
          </p>
        </div>
      )}

      <div className="grid grid-2">
        {/* Left Panel - Configuration Form */}
        <div>
          <div className="card">
            <div className="form-group">
              <label>Configuration Name</label>
              <input
                type="text"
                className="form-control"
                value={configName}
                onChange={e => setConfigName(e.target.value)}
                placeholder="e.g., Customer-to-CRM Sync"
              />
            </div>

            <div className="form-group">
              <label>Event Type Filter (optional)</label>
              <input
                type="text"
                className="form-control"
                value={eventType}
                onChange={e => setEventType(e.target.value)}
                placeholder="e.g., com.bank.customer.created"
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                In live mode, only events with matching "type" field will be processed
              </small>
            </div>

            <div className="form-group">
              <label>Select Event Sample</label>
              <select
                className="form-control"
                value={selectedEventId}
                onChange={e => { setSelectedEventId(e.target.value); setMapping({}); }}
              >
                <option value="">-- Select Event Sample --</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
              {selectedEventId && (
                <div className="schema-preview mt-1" style={{ maxHeight: '150px' }}>
                  <pre>{JSON.stringify(events.find(e => e.id === selectedEventId)?.sampleData, null, 2)}</pre>
                </div>
              )}
            </div>

            <h3 className="mb-1 mt-2">API Selection</h3>
            <div className="form-group">
              <label>Select API Sample</label>
              <select
                className="form-control"
                value={selectedApiId}
                onChange={e => { setSelectedApiId(e.target.value); setMapping({}); }}
              >
                <option value="">-- Select API Sample --</option>
                {apis.map(api => (
                  <option key={api.id} value={api.id}>
                    {api.name} ({api.method} {api.endpoint})
                  </option>
                ))}
              </select>
              {selectedApiId && (
                <div className="schema-preview mt-1" style={{ maxHeight: '150px' }}>
                  <pre>{JSON.stringify(apis.find(a => a.id === selectedApiId)?.request?.sampleData, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>

          {/* Saved Configurations */}
          <div className="card">
            <div className="card-header">
              <h2>Saved Configurations</h2>
            </div>
            {configurations.length === 0 ? (
              <p className="text-muted text-center">No configurations saved yet</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Source</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {configurations.map(config => (
                    <tr key={config.id}>
                      <td><strong>{config.name}</strong></td>
                      <td>{config.source.type}</td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => loadConfiguration(config)}
                          >
                            Load
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteConfiguration(config.id)}
                          >
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
        </div>

        {/* Right Panel - Mapping */}
        <div>
          <div className="card">
            <div className="card-header">
              <h2>Parameter Mapping</h2>
            </div>

            {sourceFields.length === 0 || apiFields.length === 0 ? (
              <div className="empty-state">
                <p>Select a source and API to start mapping</p>
              </div>
            ) : (
              <>
                {/* Manual Mapping UI */}
                <div className="mapping-ui mb-2">
                  <div className="grid grid-2 gap-2">
                    <div>
                      <h4 className="mb-1">Source Fields</h4>
                      {sourceFields.map(field => (
                        <div
                          key={field}
                          className={`mapping-field ${mapping[field] ? 'mapped' : ''}`}
                          style={{
                            padding: '0.5rem',
                            margin: '0.25rem 0',
                            background: mapping[field] ? '#dcfce7' : '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.25rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <span>{field}</span>
                          {mapping[field] && (
                            <span className="badge badge-success">{mapping[field]}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="mb-1">API Fields</h4>
                      {apiFields.map(field => (
                        <div
                          key={field}
                          style={{
                            padding: '0.5rem',
                            margin: '0.25rem 0',
                            background: Object.values(mapping).includes(field) ? '#dbeafe' : '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.25rem'
                          }}
                        >
                          {field}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Mapping Controls */}
                  <div className="mt-2" style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                    <h4 className="mb-1">Create Mapping</h4>
                    <div className="flex gap-1 items-center">
                      <select id="sourceFieldSelect" className="form-control" style={{ flex: 1 }}>
                        <option value="">Select source field</option>
                        {sourceFields.filter(f => !mapping[f]).map(field => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                      <ArrowRight size={20} />
                      <select id="apiFieldSelect" className="form-control" style={{ flex: 1 }}>
                        <option value="">Select API field</option>
                        {apiFields.filter(f => !Object.values(mapping).includes(f)).map(field => (
                          <option key={field} value={field}>{field}</option>
                        ))}
                      </select>
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          const sourceField = document.getElementById('sourceFieldSelect').value;
                          const apiField = document.getElementById('apiFieldSelect').value;
                          if (sourceField && apiField) {
                            addMapping(sourceField, apiField);
                          }
                        }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Current Mappings */}
                {Object.keys(mapping).length > 0 && (
                  <div className="mt-2">
                    <h4 className="mb-1">Current Mappings ({Object.keys(mapping).length} fields)</h4>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Source Field</th>
                          <th></th>
                          <th>API Field</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(mapping).map(([source, target]) => (
                          <tr key={source}>
                            <td>{source}</td>
                            <td><ArrowRight size={16} /></td>
                            <td>{target}</td>
                            <td>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => removeMapping(source)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Unmapped Fields - Hidden by Default */}
                {unmappedApiFields.length > 0 && (
                  <div className="mt-2 unmapped-fields-section">
                    <div className="unmapped-header">
                      <div className="unmapped-title">
                        <AlertCircle size={16} />
                        <h4>Unmapped Fields ({unmappedApiFields.length})</h4>
                      </div>
                      <span className="unmapped-hint">
                        These fields will be hidden in forms by default
                      </span>
                    </div>
                    <div className="unmapped-fields-list">
                      {unmappedApiFields.map(field => {
                        const isVisible = fieldVisibility[field] === 'editable';
                        return (
                          <div key={field} className={`unmapped-field-item ${isVisible ? 'visible' : 'hidden'}`}>
                            <span className="field-name">{field}</span>
                            <button
                              type="button"
                              className={`btn btn-sm ${isVisible ? 'btn-primary' : 'btn-ghost'}`}
                              onClick={() => toggleFieldVisibility(field)}
                              title={isVisible ? 'Click to hide in form' : 'Click to show in form'}
                            >
                              {isVisible ? (
                                <>
                                  <Eye size={14} />
                                  Visible
                                </>
                              ) : (
                                <>
                                  <EyeOff size={14} />
                                  Hidden
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <p className="unmapped-note">
                      Tip: Click "Visible" to show a field in the Form Generator, even if it's not mapped.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
