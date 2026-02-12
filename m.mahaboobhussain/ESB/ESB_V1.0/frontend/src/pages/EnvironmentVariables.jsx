import React, { useState, useEffect } from 'react';
import {
  Variable, Plus, Trash2, Edit2, Save, X, AlertCircle, CheckCircle,
  Loader, Search, Download, Upload, RefreshCw, Copy, Check
} from 'lucide-react';
import { environmentVariablesApi } from '../services/api';

function EnvironmentVariables() {
  const [variables, setVariables] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingVar, setEditingVar] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [newVarDescription, setNewVarDescription] = useState('');
  const [copiedVar, setCopiedVar] = useState(null);

  useEffect(() => {
    loadVariables();
  }, []);

  const loadVariables = async () => {
    try {
      setLoading(true);
      setError(null);
      const vars = await environmentVariablesApi.getAll();
      setVariables(vars || {});
    } catch (err) {
      setError('Failed to load environment variables');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMessage = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleAddVariable = async (e) => {
    e.preventDefault();
    if (!newVarName.trim()) return;

    try {
      await environmentVariablesApi.create(newVarName.trim(), newVarValue, newVarDescription);
      showSuccessMessage(`Variable '${newVarName}' created`);
      setNewVarName('');
      setNewVarValue('');
      setNewVarDescription('');
      setShowAddForm(false);
      loadVariables();
    } catch (err) {
      setError('Failed to create variable');
    }
  };

  const handleUpdateVariable = async (name) => {
    try {
      await environmentVariablesApi.update(name, editValue, editDescription);
      showSuccessMessage(`Variable '${name}' updated`);
      setEditingVar(null);
      loadVariables();
    } catch (err) {
      setError('Failed to update variable');
    }
  };

  const handleDeleteVariable = async (name) => {
    if (!confirm(`Delete variable '${name}'?`)) return;

    try {
      await environmentVariablesApi.delete(name);
      showSuccessMessage(`Variable '${name}' deleted`);
      loadVariables();
    } catch (err) {
      setError('Failed to delete variable');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all environment variables? This cannot be undone.')) return;

    try {
      await environmentVariablesApi.clearAll();
      showSuccessMessage('All variables cleared');
      loadVariables();
    } catch (err) {
      setError('Failed to clear variables');
    }
  };

  const startEditing = (name, variable) => {
    setEditingVar(name);
    setEditValue(variable.value || '');
    setEditDescription(variable.description || '');
  };

  const cancelEditing = () => {
    setEditingVar(null);
    setEditValue('');
    setEditDescription('');
  };

  const copyToClipboard = (name) => {
    navigator.clipboard.writeText(`{{${name}}}`);
    setCopiedVar(name);
    setTimeout(() => setCopiedVar(null), 2000);
  };

  const handleExport = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      variables: variables
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `environment-variables-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const importVars = data.variables || data;

      let count = 0;
      for (const [name, varData] of Object.entries(importVars)) {
        const value = typeof varData === 'object' ? varData.value : varData;
        const description = typeof varData === 'object' ? varData.description : '';
        await environmentVariablesApi.create(name, value, description);
        count++;
      }

      showSuccessMessage(`Imported ${count} variables`);
      loadVariables();
    } catch (err) {
      setError('Failed to import variables. Check file format.');
    }

    e.target.value = '';
  };

  const filteredVariables = Object.entries(variables).filter(([name, variable]) => {
    const search = searchTerm.toLowerCase();
    return (
      name.toLowerCase().includes(search) ||
      (variable.value && variable.value.toLowerCase().includes(search)) ||
      (variable.description && variable.description.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return (
      <div className="page-loading">
        <Loader size={24} className="spin" />
        <p>Loading environment variables...</p>
      </div>
    );
  }

  return (
    <div className="environment-variables-page">
      <div className="page-header">
        <div className="header-title">
          <Variable size={28} />
          <div>
            <h1>Environment Variables</h1>
            <p className="page-subtitle">Manage global variables for use in samples and API calls</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={loadVariables} title="Refresh">
            <RefreshCw size={16} />
          </button>
          <label className="btn btn-secondary">
            <Upload size={16} />
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
          <button className="btn btn-secondary" onClick={handleExport} disabled={Object.keys(variables).length === 0}>
            <Download size={16} />
            Export
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <Plus size={16} />
            Add Variable
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={16} />
          {error}
          <button className="alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {/* Add Variable Form */}
      {showAddForm && (
        <div className="card add-variable-card">
          <h3>Add New Variable</h3>
          <form onSubmit={handleAddVariable}>
            <div className="form-row">
              <div className="form-group">
                <label>Variable Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., CustomerId"
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                  autoFocus
                />
                <span className="form-hint">Use in samples as: {`{{${newVarName || 'variableName'}}}`}</span>
              </div>
              <div className="form-group flex-2">
                <label>Value</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Variable value"
                  value={newVarValue}
                  onChange={(e) => setNewVarValue(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Description (optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="What is this variable used for?"
                value={newVarDescription}
                onChange={(e) => setNewVarDescription(e.target.value)}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                <X size={16} />
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={!newVarName.trim()}>
                <Plus size={16} />
                Add Variable
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Variables List */}
      <div className="card variables-card">
        <div className="card-header">
          <div className="header-left">
            <h3>Variables ({Object.keys(variables).length})</h3>
          </div>
          <div className="header-right">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search variables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {Object.keys(variables).length > 0 && (
              <button className="btn btn-ghost btn-sm text-danger" onClick={handleClearAll}>
                <Trash2 size={14} />
                Clear All
              </button>
            )}
          </div>
        </div>

        {Object.keys(variables).length === 0 ? (
          <div className="empty-state">
            <Variable size={48} />
            <h3>No Environment Variables</h3>
            <p>Add variables to use them in your samples with {`{{variableName}}`} syntax</p>
            <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
              <Plus size={16} />
              Add Your First Variable
            </button>
          </div>
        ) : filteredVariables.length === 0 ? (
          <div className="empty-state">
            <Search size={48} />
            <h3>No Matching Variables</h3>
            <p>Try a different search term</p>
          </div>
        ) : (
          <div className="variables-table">
            <table>
              <thead>
                <tr>
                  <th>Variable Name</th>
                  <th>Value</th>
                  <th>Description</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVariables.map(([name, variable]) => (
                  <tr key={name}>
                    <td className="var-name-cell">
                      <code className="var-name">{name}</code>
                      <button
                        className="btn btn-ghost btn-xs copy-btn"
                        onClick={() => copyToClipboard(name)}
                        title="Copy variable reference"
                      >
                        {copiedVar === name ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </td>
                    <td className="var-value-cell">
                      {editingVar === name ? (
                        <input
                          type="text"
                          className="form-control"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <span className="var-value" title={variable.value}>
                          {variable.value?.length > 50
                            ? variable.value.substring(0, 50) + '...'
                            : variable.value}
                        </span>
                      )}
                    </td>
                    <td className="var-desc-cell">
                      {editingVar === name ? (
                        <input
                          type="text"
                          className="form-control"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Description"
                        />
                      ) : (
                        <span className="var-description">
                          {variable.description || '-'}
                        </span>
                      )}
                    </td>
                    <td className="var-date-cell">
                      {variable.updatedAt
                        ? new Date(variable.updatedAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="var-actions-cell">
                      {editingVar === name ? (
                        <>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => handleUpdateVariable(name)}
                            title="Save"
                          >
                            <Save size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={cancelEditing}
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => startEditing(name, variable)}
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs text-danger"
                            onClick={() => handleDeleteVariable(name)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Usage Guide */}
      <div className="card usage-guide-card">
        <h3>How to Use Environment Variables</h3>
        <div className="usage-grid">
          <div className="usage-item">
            <h4>1. Define Variables</h4>
            <p>Add variables above with meaningful names like <code>CustomerId</code>, <code>AuthToken</code>, etc.</p>
          </div>
          <div className="usage-item">
            <h4>2. Use in Sample Data</h4>
            <p>In your sample JSON, use <code>{`{{variableName}}`}</code> syntax where you want the value substituted.</p>
            <pre>{`{
  "customerId": "{{CustomerId}}",
  "token": "{{AuthToken}}"
}`}</pre>
          </div>
          <div className="usage-item">
            <h4>3. Automatic Substitution</h4>
            <p>When you use Form Generator or Demo, variables are automatically replaced with their values.</p>
          </div>
          <div className="usage-item">
            <h4>4. Response Capture</h4>
            <p>Configure API Samples to capture response values into variables for use in subsequent calls.</p>
          </div>
        </div>
      </div>

      <style>{`
        .environment-variables-page {
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
          flex-wrap: wrap;
        }

        /* Alert Messages */
        .alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .alert-error {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error-color);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .alert-success {
          background: rgba(34, 197, 94, 0.1);
          color: var(--success-color);
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .alert-close {
          margin-left: auto;
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: inherit;
          opacity: 0.7;
        }

        .alert-close:hover {
          opacity: 1;
        }

        /* Add Variable Card */
        .add-variable-card {
          padding: 1.5rem;
          margin-bottom: 1rem;
          border: 2px solid var(--primary-color);
        }

        .add-variable-card h3 {
          margin: 0 0 1rem 0;
        }

        .form-row {
          display: flex;
          gap: 1rem;
        }

        .form-group {
          flex: 1;
          margin-bottom: 1rem;
        }

        .form-group.flex-2 {
          flex: 2;
        }

        .form-group label {
          display: block;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .form-hint {
          display: block;
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        /* Variables Card */
        .variables-card {
          padding: 0;
        }

        .variables-card .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-left h3 {
          margin: 0;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
        }

        .search-box input {
          border: none;
          background: transparent;
          outline: none;
          width: 200px;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 3rem;
          color: var(--text-secondary);
        }

        .empty-state h3 {
          margin: 1rem 0 0.5rem;
          color: var(--text-primary);
        }

        .empty-state p {
          margin-bottom: 1.5rem;
        }

        /* Variables Table */
        .variables-table {
          overflow-x: auto;
        }

        .variables-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .variables-table th,
        .variables-table td {
          padding: 0.75rem 1rem;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }

        .variables-table th {
          font-weight: 600;
          background: var(--bg-color);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }

        .var-name-cell {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .var-name {
          font-family: 'Fira Code', monospace;
          font-size: 0.875rem;
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
        }

        .copy-btn {
          opacity: 0.5;
        }

        .copy-btn:hover {
          opacity: 1;
        }

        .var-value {
          font-family: 'Fira Code', monospace;
          font-size: 0.875rem;
        }

        .var-description {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .var-date-cell {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .var-actions-cell {
          display: flex;
          gap: 0.25rem;
        }

        .btn-xs {
          padding: 0.25rem 0.5rem;
        }

        .text-danger {
          color: var(--error-color) !important;
        }

        .text-danger:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        /* Usage Guide */
        .usage-guide-card {
          padding: 1.5rem;
          margin-top: 1rem;
        }

        .usage-guide-card h3 {
          margin: 0 0 1rem 0;
        }

        .usage-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .usage-item h4 {
          margin: 0 0 0.5rem 0;
          color: var(--primary-color);
        }

        .usage-item p {
          margin: 0;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .usage-item code {
          background: var(--bg-color);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: 'Fira Code', monospace;
          font-size: 0.8rem;
        }

        .usage-item pre {
          margin-top: 0.5rem;
          padding: 0.75rem;
          background: var(--bg-color);
          border-radius: 0.5rem;
          font-size: 0.75rem;
          overflow-x: auto;
        }

        @media (max-width: 768px) {
          .form-row {
            flex-direction: column;
          }

          .header-right {
            width: 100%;
            justify-content: flex-end;
          }

          .search-box input {
            width: 150px;
          }
        }
      `}</style>
    </div>
  );
}

export default EnvironmentVariables;
