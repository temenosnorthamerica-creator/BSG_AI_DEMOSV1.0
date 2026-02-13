import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Play, Square, CheckCircle, XCircle, Clock, Loader, AlertCircle, RefreshCw, RotateCcw, ChevronDown, ChevronUp, StopCircle } from 'lucide-react';
import DataFlowDiagram from '../components/DataFlowDiagram';
import { monitorApi, configurationsApi } from '../services/api';

function Monitor() {
  const [configurations, setConfigurations] = useState([]);
  // Per-config state: { [configId]: { isRunning, stats, activityLog, showLogs, starting, stopping, restarting } }
  const [monitorStates, setMonitorStates] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const eventSourceRef = useRef(null);

  // Initialize per-config state for all configurations
  const initConfigState = useCallback((configId) => ({
    isRunning: false,
    stats: { eventsReceived: 0, eventsProcessed: 0, eventsFailed: 0, lastEventTime: null },
    activityLog: [],
    showLogs: false,
    starting: false,
    stopping: false,
    restarting: false,
    startedAt: null
  }), []);

  // Update a single config's state
  const updateConfigState = useCallback((configId, updater) => {
    setMonitorStates(prev => ({
      ...prev,
      [configId]: typeof updater === 'function'
        ? updater(prev[configId] || initConfigState(configId))
        : { ...(prev[configId] || initConfigState(configId)), ...updater }
    }));
  }, [initConfigState]);

  // Add to a config's activity log
  const addToConfigLog = useCallback((configId, type, message) => {
    updateConfigState(configId, (prev) => ({
      ...prev,
      activityLog: [{
        id: Date.now() + Math.random(),
        type,
        message,
        timestamp: new Date().toISOString()
      }, ...prev.activityLog.slice(0, 99)]
    }));
  }, [updateConfigState]);

  useEffect(() => {
    loadData();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configs, statuses] = await Promise.all([
        configurationsApi.getAll(),
        monitorApi.getAllStatuses()
      ]);

      setConfigurations(configs);

      // Build initial monitorStates from configs + server statuses
      const states = {};
      for (const config of configs) {
        const serverStatus = statuses[config.id];
        states[config.id] = {
          isRunning: serverStatus?.isRunning || false,
          stats: serverStatus?.stats || { eventsReceived: 0, eventsProcessed: 0, eventsFailed: 0, lastEventTime: null },
          activityLog: [],
          showLogs: false,
          starting: false,
          stopping: false,
          restarting: false,
          startedAt: serverStatus?.isRunning ? new Date().toISOString() : null
        };
      }
      setMonitorStates(states);

      connectToSSE();
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const connectToSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sseUrl = `${import.meta.env.BASE_URL}api/monitor/events`.replace(/\/\//g, '/');
    const eventSource = new EventSource(sseUrl);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleSSEEvent(data);
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    eventSource.onerror = () => {
      console.error('SSE connection error');
    };
  };

  const handleSSEEvent = useCallback((event) => {
    const { type, data, configId } = event;

    switch (type) {
      case 'connected':
        break;

      case 'status':
        // Initial sync — data is { [configId]: statusObj }
        if (data && typeof data === 'object') {
          setMonitorStates(prev => {
            const next = { ...prev };
            for (const [cid, status] of Object.entries(data)) {
              next[cid] = {
                ...(next[cid] || initConfigState(cid)),
                isRunning: status.isRunning,
                stats: status.stats,
                startedAt: status.isRunning ? (next[cid]?.startedAt || new Date().toISOString()) : null
              };
            }
            return next;
          });
        }
        break;

      case 'monitor_started':
        if (configId) {
          updateConfigState(configId, (prev) => ({
            ...prev,
            isRunning: true,
            starting: false,
            startedAt: new Date().toISOString()
          }));
          addToConfigLog(configId, 'success', `Monitor started for "${data.configurationName}"`);
        }
        break;

      case 'monitor_stopped':
        if (configId) {
          updateConfigState(configId, (prev) => ({
            ...prev,
            isRunning: false,
            stopping: false,
            restarting: false,
            startedAt: null
          }));
          addToConfigLog(configId, 'info', 'Monitor stopped');
        }
        break;

      case 'event_received':
        if (configId) {
          addToConfigLog(configId, 'info', `Event received`);
        }
        break;

      case 'processing':
        if (configId) {
          addToConfigLog(configId, 'info', `${data.stage}: ${data.message}`);
        }
        break;

      case 'api_called':
        if (configId) {
          if (data.success) {
            addToConfigLog(configId, 'success', `API OK (${data.status}) - ${data.duration}ms`);
          } else {
            addToConfigLog(configId, 'error', `API failed: ${data.statusText}`);
          }
        }
        break;

      case 'stats_updated':
        if (configId) {
          updateConfigState(configId, (prev) => ({
            ...prev,
            stats: data
          }));
        }
        break;

      case 'error':
        if (configId) {
          addToConfigLog(configId, 'error', data.message);
        }
        break;

      case 'ping':
        break;
    }
  }, [updateConfigState, addToConfigLog, initConfigState]);

  // Re-attach handleSSEEvent when it changes (due to state closure updates)
  useEffect(() => {
    const es = eventSourceRef.current;
    if (es) {
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleSSEEvent(data);
        } catch (err) {
          console.error('Failed to parse SSE event:', err);
        }
      };
    }
  }, [handleSSEEvent]);

  const handleStart = async (configId) => {
    try {
      updateConfigState(configId, { starting: true });
      setError(null);
      await monitorApi.start(configId);
      updateConfigState(configId, (prev) => ({ ...prev, isRunning: true, starting: false, startedAt: new Date().toISOString() }));
    } catch (err) {
      setError(err.message);
      updateConfigState(configId, { starting: false });
      addToConfigLog(configId, 'error', `Failed to start: ${err.message}`);
    }
  };

  const handleStop = async (configId) => {
    try {
      updateConfigState(configId, { stopping: true });
      await monitorApi.stop(configId);
      updateConfigState(configId, (prev) => ({ ...prev, isRunning: false, stopping: false, startedAt: null }));
    } catch (err) {
      setError(err.message);
      updateConfigState(configId, { stopping: false });
      addToConfigLog(configId, 'error', `Failed to stop: ${err.message}`);
    }
  };

  const handleRestart = async (configId) => {
    try {
      updateConfigState(configId, { restarting: true });
      await monitorApi.restart(configId);
      updateConfigState(configId, (prev) => ({ ...prev, isRunning: true, restarting: false, startedAt: new Date().toISOString() }));
    } catch (err) {
      setError(err.message);
      updateConfigState(configId, { restarting: false });
      addToConfigLog(configId, 'error', `Failed to restart: ${err.message}`);
    }
  };

  const handleStopAll = async () => {
    try {
      await monitorApi.stopAll();
      setMonitorStates(prev => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          next[key] = { ...next[key], isRunning: false, stopping: false, restarting: false, startedAt: null };
        }
        return next;
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRefresh = async () => {
    try {
      const [configs, statuses] = await Promise.all([
        configurationsApi.getAll(),
        monitorApi.getAllStatuses()
      ]);
      setConfigurations(configs);
      setMonitorStates(prev => {
        const next = { ...prev };
        for (const config of configs) {
          const serverStatus = statuses[config.id];
          next[config.id] = {
            ...(next[config.id] || initConfigState(config.id)),
            isRunning: serverStatus?.isRunning || false,
            stats: serverStatus?.stats || { eventsReceived: 0, eventsProcessed: 0, eventsFailed: 0, lastEventTime: null },
            startedAt: serverStatus?.isRunning ? (next[config.id]?.startedAt || new Date().toISOString()) : null
          };
        }
        return next;
      });
    } catch (err) {
      console.error('Failed to refresh:', err);
    }
  };

  const toggleLogs = (configId) => {
    updateConfigState(configId, (prev) => ({ ...prev, showLogs: !prev.showLogs }));
  };

  const clearLogs = (configId) => {
    updateConfigState(configId, (prev) => ({ ...prev, activityLog: [] }));
  };

  const anyRunning = Object.values(monitorStates).some(s => s.isRunning);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={12} className="activity-icon success" />;
      case 'error': return <XCircle size={12} className="activity-icon error" />;
      case 'info': return <Activity size={12} className="activity-icon info" />;
      default: return <Activity size={12} className="activity-icon" />;
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <Loader size={24} className="spin" />
        <p>Loading monitor...</p>
      </div>
    );
  }

  return (
    <div className="monitor-page">
      <div className="page-header">
        <h1>
          <Activity size={28} />
          Health Check Monitor
        </h1>
        <p className="page-subtitle">Monitor and visualize real-time event processing from CRM to Transact</p>
      </div>

      {/* Data Flow Visualization */}
      <div className="flow-section">
        <DataFlowDiagram
          isMonitorRunning={anyRunning}
          recentEvents={[]}
        />
      </div>

      {/* Top bar */}
      <div className="configs-header">
        <h2>Configurations</h2>
        <div className="configs-header-actions">
          {anyRunning && (
            <button className="btn btn-danger btn-sm" onClick={handleStopAll}>
              <StopCircle size={14} />
              Stop All
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={handleRefresh} title="Refresh statuses">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          {error}
          <button className="btn btn-ghost btn-sm" onClick={() => setError(null)} style={{ marginLeft: 'auto' }}>Dismiss</button>
        </div>
      )}

      {/* Config cards grid */}
      <div className="config-cards-grid">
        {configurations.map(config => {
          const state = monitorStates[config.id] || initConfigState(config.id);
          const { isRunning, activityLog, showLogs, starting, stopping, restarting } = state;
          const busy = starting || stopping || restarting;

          return (
            <div key={config.id} className={`config-card card ${isRunning ? 'running' : ''}`}>
              {/* Card header */}
              <div className="config-card-header">
                <div className="config-card-title">
                  <span className="config-name">{config.name}</span>
                  <span className={`status-pill ${isRunning ? 'running' : 'stopped'}`}>
                    {isRunning && <span className="status-dot-sm"></span>}
                    {isRunning ? 'Running' : 'Stopped'}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="config-card-actions">
                {!isRunning ? (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleStart(config.id)}
                    disabled={busy}
                  >
                    {starting ? <Loader size={14} className="spin" /> : <Play size={14} />}
                    {starting ? 'Starting...' : 'Start'}
                  </button>
                ) : (
                  <>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleStop(config.id)}
                      disabled={busy}
                    >
                      {stopping ? <Loader size={14} className="spin" /> : <Square size={14} />}
                      {stopping ? 'Stopping...' : 'Stop'}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleRestart(config.id)}
                      disabled={busy}
                      title="Restart"
                    >
                      {restarting ? <Loader size={14} className="spin" /> : <RotateCcw size={14} />}
                      {restarting ? 'Restarting...' : 'Restart'}
                    </button>
                  </>
                )}
                <button
                  className="btn btn-ghost btn-sm logs-toggle"
                  onClick={() => toggleLogs(config.id)}
                >
                  {showLogs ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  Logs{activityLog.length > 0 ? ` (${activityLog.length})` : ''}
                </button>
              </div>

              {/* Collapsible activity log */}
              {showLogs && (
                <div className="config-activity-log">
                  <div className="config-log-header">
                    <span>Activity Log</span>
                    {activityLog.length > 0 && (
                      <button className="btn btn-ghost btn-xs" onClick={() => clearLogs(config.id)}>Clear</button>
                    )}
                  </div>
                  <div className="config-log-entries">
                    {activityLog.length === 0 ? (
                      <div className="empty-log-sm">No activity yet</div>
                    ) : (
                      activityLog.map(item => (
                        <div key={item.id} className={`log-entry ${item.type}`}>
                          {getActivityIcon(item.type)}
                          <span className="log-msg">{item.message}</span>
                          <span className="log-time">{new Date(item.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {configurations.length === 0 && (
        <div className="empty-state card">
          <Activity size={32} />
          <p>No configurations found. Create a configuration first to start monitoring.</p>
        </div>
      )}

      <style>{`
        .monitor-page {
          max-width: 1200px;
          margin: 0 auto;
        }

        .monitor-page .page-header {
          margin-bottom: 1.5rem;
        }

        .monitor-page .page-header h1 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .monitor-page .page-subtitle {
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }

        .flow-section {
          margin-bottom: 1.5rem;
        }

        /* Top bar */
        .configs-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .configs-header h2 {
          margin: 0;
          font-size: 1.125rem;
        }

        .configs-header-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding: 0.75rem 1rem;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }

        /* Card grid */
        .config-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 1rem;
        }

        .config-card {
          padding: 1rem 1.25rem;
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          transition: border-color 0.3s, box-shadow 0.3s;
        }

        .config-card.running {
          border-color: rgba(34, 197, 94, 0.4);
          box-shadow: 0 0 12px rgba(34, 197, 94, 0.08);
        }

        .config-card-header {
          margin-bottom: 0.75rem;
        }

        .config-card-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .config-name {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .status-pill {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.2rem 0.625rem;
          border-radius: 1rem;
          font-size: 0.7rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .status-pill.running {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }

        .status-pill.stopped {
          background: var(--bg-color);
          color: var(--text-secondary);
        }

        .status-dot-sm {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Action buttons */
        .config-card-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .logs-toggle {
          margin-left: auto;
        }

        .btn-sm {
          padding: 0.375rem 0.75rem;
          font-size: 0.8rem;
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
        }

        .btn-xs {
          padding: 0.2rem 0.5rem;
          font-size: 0.7rem;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
          border: none;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        /* Activity log */
        .config-activity-log {
          margin-top: 0.75rem;
          border-top: 1px solid var(--border-color);
          padding-top: 0.625rem;
        }

        .config-log-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }

        .config-log-entries {
          max-height: 250px;
          overflow-y: auto;
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          background: var(--bg-color);
        }

        .empty-log-sm {
          padding: 1rem;
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.75rem;
        }

        .log-entry {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.625rem;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.75rem;
        }

        .log-entry:last-child {
          border-bottom: none;
        }

        .log-entry.success { background: rgba(34, 197, 94, 0.03); }
        .log-entry.error { background: rgba(239, 68, 68, 0.03); }

        .activity-icon { flex-shrink: 0; }
        .activity-icon.success { color: #22c55e; }
        .activity-icon.error { color: #ef4444; }
        .activity-icon.info { color: #3b82f6; }

        .log-msg {
          flex: 1;
          color: var(--text-primary);
          word-break: break-word;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .log-time {
          flex-shrink: 0;
          font-size: 0.65rem;
          color: var(--text-secondary);
          font-family: 'Fira Code', monospace;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: var(--text-secondary);
          text-align: center;
        }

        .empty-state p {
          margin-top: 0.75rem;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Monitor;
