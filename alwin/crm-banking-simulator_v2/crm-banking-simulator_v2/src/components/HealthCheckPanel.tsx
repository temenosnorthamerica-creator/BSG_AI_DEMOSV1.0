/**
 * Health Check Panel Component
 * Displays Temenos API connectivity status
 */

import { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle,
  XCircle,
  RefreshCw,
  Server,
  Clock,
  Wifi,
  WifiOff,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { runHealthCheck, HealthCheckResult, EndpointHealth } from '../services/healthCheckService';

interface HealthCheckPanelProps {
  darkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function HealthCheckPanel({ darkMode, isOpen, onClose }: HealthCheckPanelProps) {
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const performHealthCheck = async () => {
    setIsLoading(true);
    try {
      const result = await runHealthCheck();
      setHealthResult(result);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthResult({
        status: 'unhealthy',
        timestamp: new Date(),
        responseTime: 0,
        endpoints: [],
        summary: 'Health check failed to execute',
      });
    }
    setIsLoading(false);
  };

  // Run health check when panel opens
  useEffect(() => {
    if (isOpen && !healthResult) {
      performHealthCheck();
    }
  }, [isOpen]);

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (autoRefresh && isOpen) {
      const interval = setInterval(performHealthCheck, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isOpen]);

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return 'text-green-500';
      case 'degraded':
        return 'text-yellow-500';
      case 'unhealthy':
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return darkMode ? 'bg-green-900/20' : 'bg-green-50';
      case 'degraded':
        return darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50';
      case 'unhealthy':
      case 'down':
        return darkMode ? 'bg-red-900/20' : 'bg-red-50';
      default:
        return darkMode ? 'bg-gray-800' : 'bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative w-full max-w-lg mx-4 rounded-xl shadow-2xl ${
          darkMode ? 'bg-surface-card-dark' : 'bg-white'
        } overflow-hidden`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          } flex items-center justify-between`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                darkMode ? 'bg-blue-900/30' : 'bg-blue-100'
              }`}
            >
              <Activity className="text-blue-500" size={24} />
            </div>
            <div>
              <h2 className="font-bold text-lg">API Health Check</h2>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Temenos Endpoint Connectivity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 ${
              darkMode ? 'hover:bg-gray-700' : ''
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Summary */}
        <div className={`p-4 ${getStatusBgColor(healthResult?.status || 'unknown')}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isLoading ? (
                <RefreshCw className="text-blue-500 animate-spin" size={32} />
              ) : (
                <div className="relative">
                  {healthResult?.status === 'healthy' ? (
                    <Wifi className="text-green-500" size={32} />
                  ) : healthResult?.status === 'unhealthy' ? (
                    <WifiOff className="text-red-500" size={32} />
                  ) : (
                    <Activity className={getStatusColor(healthResult?.status || '')} size={32} />
                  )}
                </div>
              )}
              <div>
                <h3 className={`font-bold text-xl ${getStatusColor(healthResult?.status || '')}`}>
                  {isLoading
                    ? 'Checking...'
                    : healthResult?.status === 'healthy'
                    ? 'All Systems Operational'
                    : healthResult?.status === 'degraded'
                    ? 'Partial Outage'
                    : 'Connection Issues'}
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {healthResult?.summary || 'Running health check...'}
                </p>
              </div>
            </div>
            {healthResult && (
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm">
                  <Clock size={14} />
                  <span>{healthResult.responseTime}ms</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Endpoint Details */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`w-full flex items-center justify-between p-2 rounded-lg ${
              darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
            }`}
          >
            <span className="font-medium flex items-center gap-2">
              <Server size={16} />
              Endpoint Status
            </span>
            {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showDetails && healthResult && (
            <div className="mt-3 space-y-2">
              {healthResult.endpoints.map((endpoint, index) => (
                <EndpointStatusRow
                  key={index}
                  endpoint={endpoint}
                  darkMode={darkMode}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className={`p-4 border-t ${
            darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
          } flex items-center justify-between`}
        >
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            Auto-refresh (30s)
          </label>

          <button
            onClick={performHealthCheck}
            disabled={isLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Checking...' : 'Run Check'}
          </button>
        </div>

        {/* Last Updated */}
        {healthResult && (
          <div
            className={`px-4 py-2 text-xs text-center ${
              darkMode ? 'text-gray-500' : 'text-gray-400'
            }`}
          >
            Last checked: {healthResult.timestamp.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}

interface EndpointStatusRowProps {
  endpoint: EndpointHealth;
  darkMode: boolean;
}

function EndpointStatusRow({ endpoint, darkMode }: EndpointStatusRowProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div
      className={`p-3 rounded-lg ${
        darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {endpoint.status === 'up' ? (
            <CheckCircle className="text-green-500" size={16} />
          ) : (
            <XCircle className="text-red-500" size={16} />
          )}
          <span className="font-medium text-sm">{endpoint.name}</span>
        </div>
        <div className="flex items-center gap-3">
          {endpoint.statusCode && (
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                endpoint.statusCode < 400
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {endpoint.statusCode}
            </span>
          )}
          <span className={`text-xs ${getStatusColor(endpoint.status)}`}>
            {endpoint.responseTime}ms
          </span>
        </div>
      </div>
      <p
        className={`text-xs mt-1 truncate ${
          darkMode ? 'text-gray-500' : 'text-gray-400'
        }`}
      >
        {endpoint.url}
      </p>
      {endpoint.error && (
        <p className="text-xs mt-1 text-red-500 truncate">{endpoint.error}</p>
      )}
    </div>
  );
}
