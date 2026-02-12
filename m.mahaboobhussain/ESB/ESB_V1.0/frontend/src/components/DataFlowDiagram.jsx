import React, { useState, useEffect } from 'react';
import { Users, Radio, Server, CheckCircle, XCircle, Loader, X, Clock, AlertCircle, Trash2 } from 'lucide-react';

// Flow stages: 'idle', 'sending', 'inEventHub', 'processing', 'transactSuccess', 'completed'
function DataFlowDiagram({
  isMonitorRunning = false,
  stats = { eventsReceived: 0, eventsProcessed: 0, eventsFailed: 0 },
  recentEvents = [],
  compact = false,
  flowStage = 'idle',
  pendingEvents = [], // Array of pending events in Event Hub
  successfulCount = 0, // Number of successful transactions
  eventTypeName = '', // Name of the event type (e.g., "Customer Created")
  onClearPending = null, // Function to clear pending events
  onClearSuccessful = null // Function to clear successful count
}) {
  const [blinkingNode, setBlinkingNode] = useState(null);
  const [movingDot1, setMovingDot1] = useState(false);
  const [movingDot2, setMovingDot2] = useState(false);
  const [showPendingPopup, setShowPendingPopup] = useState(false);

  // Handle flow stage changes for CRM form submission flow
  useEffect(() => {
    if (flowStage === 'sending') {
      setBlinkingNode(null);
      setMovingDot1(true);
      setMovingDot2(false);
    } else if (flowStage === 'inEventHub') {
      setBlinkingNode('eventhub');
      setMovingDot1(false);
      setMovingDot2(false);
    } else if (flowStage === 'processing') {
      setBlinkingNode(null);
      setMovingDot1(false);
      setMovingDot2(true);
    } else if (flowStage === 'transactSuccess') {
      setBlinkingNode('transact');
      setMovingDot1(false);
      setMovingDot2(false);
    } else {
      setBlinkingNode(null);
      setMovingDot1(false);
      setMovingDot2(false);
    }
  }, [flowStage]);

  const pendingCount = pendingEvents.length;

  return (
    <div className={`data-flow-diagram ${compact ? 'compact' : ''} ${flowStage !== 'idle' ? 'active' : ''}`}>
      <div className="flow-container">
        {/* CRM Node */}
        <div className={`flow-node crm-node`}>
          <div className="node-icon">
            <Users size={compact ? 20 : 28} />
          </div>
          <div className="node-label">CRM</div>
          {!compact && <div className="node-sublabel">Source</div>}
        </div>

        {/* Connection 1: CRM to Event Hub */}
        <div className="flow-connection">
          <div className="connection-line">
            <div className="line-dashed"></div>
            {movingDot1 && <div className="moving-dot dot-1"></div>}
          </div>
          <div className="connection-arrow">→</div>
        </div>

        {/* Event Hub Node */}
        <div className={`flow-node eventhub-node ${blinkingNode === 'eventhub' ? 'blinking' : ''}`}>
          <div className="node-icon">
            <Radio size={compact ? 20 : 28} />
          </div>
          <div className="node-label">Event Hub</div>
          {!compact && (
            <div className="node-sublabel">
              {isMonitorRunning ? (
                <span className="monitoring-badge">
                  <Loader size={10} className="spin" /> Monitoring
                </span>
              ) : blinkingNode === 'eventhub' ? (
                <span className="event-received-badge">
                  <CheckCircle size={10} /> Event Received
                </span>
              ) : (
                'Queue'
              )}
            </div>
          )}
          {/* Pending Events Badge */}
          {pendingCount > 0 && (
            <div
              className="pending-badge"
              onClick={() => setShowPendingPopup(true)}
              title="Click to view pending events"
            >
              <Clock size={10} />
              <span>{pendingCount} pending</span>
            </div>
          )}
        </div>

        {/* Connection 2: Event Hub to Transact */}
        <div className="flow-connection">
          <div className="connection-line">
            <div className="line-dashed"></div>
            {movingDot2 && <div className="moving-dot dot-2"></div>}
          </div>
          <div className="connection-arrow">→</div>
        </div>

        {/* Transact Node */}
        <div className={`flow-node transact-node ${blinkingNode === 'transact' ? 'blinking' : ''}`}>
          <div className="node-icon">
            <Server size={compact ? 20 : 28} />
          </div>
          <div className="node-label">Transact</div>
          {!compact && <div className="node-sublabel">API</div>}
          {/* Successful Transactions Badge */}
          {successfulCount > 0 && (
            <div className="success-badge" title="Successful transactions">
              <CheckCircle size={10} />
              <span>{successfulCount} success</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Bar - only show in non-compact mode and when there's data */}
      {!compact && (stats.eventsReceived > 0 || stats.eventsProcessed > 0 || stats.eventsFailed > 0) && (
        <div className="flow-stats">
          <div className="stat-item">
            <span className="stat-value">{stats.eventsReceived}</span>
            <span className="stat-label">Received</span>
          </div>
          <div className="stat-divider">|</div>
          <div className="stat-item success">
            <span className="stat-value">{stats.eventsProcessed}</span>
            <span className="stat-label">Processed</span>
          </div>
          <div className="stat-divider">|</div>
          <div className="stat-item error">
            <span className="stat-value">{stats.eventsFailed}</span>
            <span className="stat-label">Failed</span>
          </div>
        </div>
      )}

      {/* Pending Events Popup */}
      {showPendingPopup && (
        <div className="pending-popup-overlay" onClick={() => setShowPendingPopup(false)}>
          <div className="pending-popup" onClick={(e) => e.stopPropagation()}>
            <div className="pending-popup-header">
              <h3>
                <Clock size={18} />
                Pending Events {eventTypeName && `- ${eventTypeName}`}
              </h3>
              <button className="close-btn" onClick={() => setShowPendingPopup(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="pending-popup-content">
              {pendingEvents.length === 0 ? (
                <div className="no-events">
                  <AlertCircle size={24} />
                  <p>No pending events</p>
                </div>
              ) : (
                <div className="events-list">
                  {pendingEvents.map((event, index) => (
                    <div key={event.id || index} className="event-item">
                      <div className="event-header">
                        <span className="event-index">#{index + 1}</span>
                        <span className="event-time">
                          {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : 'N/A'}
                        </span>
                      </div>
                      <div className="event-body">
                        <pre>{JSON.stringify(event.data || event, null, 2)}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="pending-popup-footer">
              <span className="pending-info">
                {!isMonitorRunning && (
                  <>
                    <AlertCircle size={14} />
                    Monitor not running - events waiting to be processed
                  </>
                )}
              </span>
              {onClearPending && pendingEvents.length > 0 && (
                <button
                  className="clear-pending-btn"
                  onClick={() => {
                    onClearPending();
                    setShowPendingPopup(false);
                  }}
                >
                  <Trash2 size={14} />
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .data-flow-diagram {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          padding: 1.5rem;
          position: relative;
        }

        .data-flow-diagram.compact {
          padding: 1rem;
        }

        .data-flow-diagram.active {
          border-color: rgba(139, 92, 246, 0.3);
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.1);
        }

        .flow-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
        }

        /* All nodes same size */
        .flow-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: var(--bg-color);
          border: 2px solid var(--border-color);
          border-radius: 0.75rem;
          width: 100px;
          height: 100px;
          position: relative;
          transition: all 0.3s ease;
        }

        .data-flow-diagram.compact .flow-node {
          padding: 0.5rem;
          width: 80px;
          height: 80px;
        }

        /* Badges on nodes */
        .pending-badge, .success-badge {
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.2rem 0.5rem;
          border-radius: 1rem;
          font-size: 0.6rem;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pending-badge {
          background: #fef3c7;
          color: #d97706;
          border: 1px solid #fbbf24;
        }

        .pending-badge:hover {
          background: #fde68a;
          transform: translateX(-50%) scale(1.05);
        }

        .success-badge {
          background: #d1fae5;
          color: #059669;
          border: 1px solid #34d399;
          cursor: default;
        }

        /* Blinking animations for nodes */
        .eventhub-node.blinking {
          animation: eventHubBlinking 0.5s ease-in-out infinite;
          border-color: #3b82f6;
        }

        @keyframes eventHubBlinking {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
          }
          50% {
            opacity: 0.7;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.8);
          }
        }

        .transact-node.blinking {
          animation: transactBlinking 0.5s ease-in-out infinite;
          border-color: #22c55e;
        }

        @keyframes transactBlinking {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
          }
          50% {
            opacity: 0.7;
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.8);
          }
        }

        .event-received-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          color: #3b82f6;
          font-weight: 500;
          font-size: 0.65rem;
        }

        .flow-node .node-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          margin-bottom: 0.375rem;
        }

        .data-flow-diagram.compact .flow-node .node-icon {
          width: 32px;
          height: 32px;
          margin-bottom: 0.25rem;
        }

        .crm-node .node-icon {
          background: rgba(139, 92, 246, 0.15);
          color: #8b5cf6;
        }

        .eventhub-node .node-icon {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        }

        .transact-node .node-icon {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
        }

        .node-label {
          font-weight: 600;
          font-size: 0.8rem;
          color: var(--text-primary);
        }

        .data-flow-diagram.compact .node-label {
          font-size: 0.7rem;
        }

        .node-sublabel {
          font-size: 0.65rem;
          color: var(--text-secondary);
          margin-top: 0.125rem;
        }

        .monitoring-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          color: #22c55e;
        }

        /* Connection line with dashed style */
        .flow-connection {
          display: flex;
          align-items: center;
          width: 70px;
          position: relative;
        }

        .data-flow-diagram.compact .flow-connection {
          width: 50px;
        }

        .connection-line {
          flex: 1;
          height: 2px;
          position: relative;
          overflow: visible;
        }

        /* Dashed line background */
        .line-dashed {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            90deg,
            var(--border-color) 0px,
            var(--border-color) 6px,
            transparent 6px,
            transparent 12px
          );
          border-radius: 1px;
        }

        /* Moving dot animation */
        .moving-dot {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 10px;
          height: 10px;
          border-radius: 50%;
          z-index: 10;
        }

        .dot-1 {
          background: linear-gradient(135deg, #8b5cf6, #3b82f6);
          box-shadow: 0 0 8px rgba(139, 92, 246, 0.6);
          animation: moveDot1 1.2s ease-in-out infinite;
        }

        .dot-2 {
          background: linear-gradient(135deg, #3b82f6, #22c55e);
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
          animation: moveDot2 1.2s ease-in-out infinite;
        }

        @keyframes moveDot1 {
          0% {
            left: 0%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            left: calc(100% - 10px);
            opacity: 0;
          }
        }

        @keyframes moveDot2 {
          0% {
            left: 0%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            left: calc(100% - 10px);
            opacity: 0;
          }
        }

        /* Static arrow */
        .connection-arrow {
          color: var(--text-secondary);
          font-size: 1rem;
          margin-left: 0.125rem;
          opacity: 0.6;
        }

        /* Stats bar */
        .flow-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          margin-top: 1.25rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .stat-item.success .stat-value {
          color: #22c55e;
        }

        .stat-item.error .stat-value {
          color: #ef4444;
        }

        .stat-label {
          font-size: 0.7rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-divider {
          color: var(--border-color);
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Pending Events Popup */
        .pending-popup-overlay {
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

        .pending-popup {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 0.75rem;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .pending-popup-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border-color);
        }

        .pending-popup-header h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
          font-size: 1rem;
          color: var(--text-primary);
        }

        .pending-popup-header .close-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.25rem;
          transition: all 0.2s;
        }

        .pending-popup-header .close-btn:hover {
          background: var(--bg-color);
          color: var(--text-primary);
        }

        .pending-popup-content {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 1.25rem;
        }

        .no-events {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 2rem;
          color: var(--text-secondary);
        }

        .events-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .event-item {
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .event-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.75rem;
          background: rgba(251, 191, 36, 0.1);
          border-bottom: 1px solid var(--border-color);
        }

        .event-index {
          font-weight: 600;
          color: #d97706;
          font-size: 0.75rem;
        }

        .event-time {
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        .event-body {
          padding: 0.75rem;
        }

        .event-body pre {
          margin: 0;
          font-size: 0.7rem;
          line-height: 1.4;
          color: var(--text-primary);
          white-space: pre-wrap;
          word-break: break-all;
          max-height: 150px;
          overflow-y: auto;
        }

        .pending-popup-footer {
          padding: 0.75rem 1.25rem;
          border-top: 1px solid var(--border-color);
        }

        .pending-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #d97706;
        }

        .pending-popup-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .clear-pending-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.75rem;
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-pending-btn:hover {
          background: #fee2e2;
          border-color: #fca5a5;
        }
      `}</style>
    </div>
  );
}

export default DataFlowDiagram;
