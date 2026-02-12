import React, { useState, useEffect } from 'react';
import { Save, Check } from 'lucide-react';
import { eventHubConfigApi } from '../services/api';

function EventHubConfig() {
  const [config, setConfig] = useState({
    hostName: '',
    topicName: '',
    primaryKey: '',
    connectionString: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await eventHubConfigApi.get();
      setConfig(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await eventHubConfigApi.update(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <p>Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Event Hub Settings</h1>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Azure Event Hub Configuration</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="hostName">Host Name</label>
            <input
              type="text"
              id="hostName"
              className="form-control"
              value={config.hostName}
              onChange={(e) => handleChange('hostName', e.target.value)}
              placeholder="e.g., namespace.servicebus.windows.net"
            />
          </div>

          <div className="form-group">
            <label htmlFor="topicName">Event Hub Name (Topic)</label>
            <input
              type="text"
              id="topicName"
              className="form-control"
              value={config.topicName}
              onChange={(e) => handleChange('topicName', e.target.value)}
              placeholder="e.g., my-event-hub"
            />
          </div>

          <div className="form-group">
            <label htmlFor="primaryKey">Primary Key</label>
            <input
              type="password"
              id="primaryKey"
              className="form-control"
              value={config.primaryKey}
              onChange={(e) => handleChange('primaryKey', e.target.value)}
              placeholder="Enter primary key"
            />
          </div>

          <div className="form-group">
            <label htmlFor="connectionString">Connection String</label>
            <textarea
              id="connectionString"
              className="form-control"
              value={config.connectionString}
              onChange={(e) => handleChange('connectionString', e.target.value)}
              placeholder="Endpoint=sb://...;SharedAccessKeyName=...;SharedAccessKey=..."
              rows={3}
            />
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className={`btn ${saved ? 'btn-success' : 'btn-primary'}`}
              disabled={saving}
            >
              {saving ? (
                'Saving...'
              ) : saved ? (
                <>
                  <Check size={16} />
                  Saved
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventHubConfig;
