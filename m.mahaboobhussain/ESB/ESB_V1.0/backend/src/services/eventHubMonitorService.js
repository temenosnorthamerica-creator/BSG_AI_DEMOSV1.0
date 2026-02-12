import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { archiveSuccessfulEvent, archiveFailedEvent, saveOffset } from './offsetTrackingService.js';

// Lazy load Event Hub SDK to prevent startup failures
let EventHubConsumerClient = null;
let earliestEventPosition = null;
let latestEventPosition = null;

async function loadEventHubSDK() {
  if (!EventHubConsumerClient) {
    const eventHubs = await import('@azure/event-hubs');
    EventHubConsumerClient = eventHubs.EventHubConsumerClient;
    earliestEventPosition = eventHubs.earliestEventPosition;
    latestEventPosition = eventHubs.latestEventPosition;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Checkpoint file path for tracking processed event offsets
const CHECKPOINT_DIR = path.join(__dirname, '../../data/checkpoints');

// Ensure checkpoint directory exists
function ensureCheckpointDir() {
  if (!fs.existsSync(CHECKPOINT_DIR)) {
    fs.mkdirSync(CHECKPOINT_DIR, { recursive: true });
  }
}

// Get checkpoint file path for a configuration
function getCheckpointPath(configId) {
  return path.join(CHECKPOINT_DIR, `${configId}.json`);
}

// Load checkpoint for a configuration
function loadCheckpoint(configId) {
  const checkpointPath = getCheckpointPath(configId);
  if (fs.existsSync(checkpointPath)) {
    try {
      return JSON.parse(fs.readFileSync(checkpointPath, 'utf-8'));
    } catch (err) {
      console.error('Failed to load checkpoint:', err);
    }
  }
  return null;
}

// Save checkpoint for a configuration
function saveCheckpoint(configId, partitionId, sequenceNumber, offset) {
  ensureCheckpointDir();
  const checkpointPath = getCheckpointPath(configId);

  let checkpoints = {};
  if (fs.existsSync(checkpointPath)) {
    try {
      checkpoints = JSON.parse(fs.readFileSync(checkpointPath, 'utf-8'));
    } catch (err) {
      checkpoints = {};
    }
  }

  checkpoints[partitionId] = {
    sequenceNumber,
    offset,
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync(checkpointPath, JSON.stringify(checkpoints, null, 2));
}

// Reset checkpoint for a configuration (to reprocess all events)
export function resetCheckpoint(configId) {
  const checkpointPath = getCheckpointPath(configId);
  if (fs.existsSync(checkpointPath)) {
    fs.unlinkSync(checkpointPath);
    return true;
  }
  return false;
}

// Get checkpoint info for a configuration
export function getCheckpointInfo(configId) {
  return loadCheckpoint(configId);
}

// Store for SSE clients
let sseClients = [];

// Per-configuration monitor states (replaces singleton)
const monitorStates = new Map();

// Create a fresh monitor state for a configuration
function createMonitorState(configId, configName) {
  return {
    isRunning: false,
    configurationId: configId,
    configurationName: configName,
    subscription: null,
    consumerClient: null,
    stats: {
      eventsReceived: 0,
      eventsProcessed: 0,
      eventsFailed: 0,
      lastEventTime: null
    },
    recentEvents: []
  };
}

// Load Event Hub config
function getEventHubConfig() {
  const configPath = path.join(__dirname, '../../data/settings/eventhub-config.json');
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
  return null;
}

// Load configuration by ID
function getConfiguration(configId) {
  // First try individual file
  const configPath = path.join(__dirname, `../../data/configurations/${configId}.json`);
  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  // Fall back to index.json (configurations stored as array)
  const indexPath = path.join(__dirname, '../../data/configurations/index.json');
  if (fs.existsSync(indexPath)) {
    const configs = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    return configs.find(c => c.id === configId) || null;
  }

  return null;
}

// Load API sample by ID
function getApiSample(apiId) {
  // First try individual file
  const apiPath = path.join(__dirname, `../../data/samples/apis/${apiId}.json`);
  if (fs.existsSync(apiPath)) {
    return JSON.parse(fs.readFileSync(apiPath, 'utf-8'));
  }

  // Fall back to index.json (API samples stored as array)
  const indexPath = path.join(__dirname, '../../data/samples/apis/index.json');
  if (fs.existsSync(indexPath)) {
    const apis = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    return apis.find(a => a.id === apiId) || null;
  }

  return null;
}

// Broadcast event to all SSE clients
export function broadcastEvent(eventType, data, configId) {
  const message = JSON.stringify({
    type: eventType,
    data,
    configId: configId || null,
    timestamp: new Date().toISOString()
  });
  sseClients.forEach(client => {
    client.write(`data: ${message}\n\n`);
  });
}

// Add SSE client
export function addSseClient(res) {
  sseClients.push(res);
  res.on('close', () => {
    sseClients = sseClients.filter(client => client !== res);
  });
}

// Get nested value from object using dot notation
function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.replace(/\[\]/g, '[0]').split(/[.\[\]]/).filter(Boolean);
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

// Set nested value in object using dot notation
function setNestedValue(obj, path, value) {
  const parts = path.replace(/\[\]/g, '[0]').split(/[.\[\]]/).filter(Boolean);
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const nextPart = parts[i + 1];
    if (!current[part]) {
      current[part] = /^\d+$/.test(nextPart) ? [] : {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

// Apply mapping to transform event data to API format
function applyMapping(eventData, mapping, apiSample) {
  const result = {};

  // Start with API sample structure if available
  if (apiSample?.request?.sampleData) {
    Object.assign(result, JSON.parse(JSON.stringify(apiSample.request.sampleData)));
  }

  // Apply field mappings
  for (const [sourceField, targetField] of Object.entries(mapping || {})) {
    const value = getNestedValue(eventData, sourceField);
    if (value !== undefined) {
      setNestedValue(result, targetField, value);
    }
  }

  return result;
}

// Call the target API
async function callTargetApi(apiSample, mappedData, headers = {}) {
  const startTime = Date.now();

  try {
    const response = await fetch(apiSample.endpoint, {
      method: apiSample.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...apiSample.defaultHeaders,
        ...headers
      },
      body: JSON.stringify(mappedData)
    });

    const duration = Date.now() - startTime;
    const responseData = await response.json().catch(() => null);

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      duration
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      statusText: error.message,
      data: null,
      duration: Date.now() - startTime
    };
  }
}

// Process a single event
async function processEvent(eventData, configuration, apiSample, configurationId) {
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  broadcastEvent('event_received', {
    eventId,
    eventData: eventData,
    timestamp: new Date().toISOString()
  }, configurationId);

  // Apply mapping
  broadcastEvent('processing', {
    eventId,
    stage: 'mapping',
    message: 'Applying field mapping...'
  }, configurationId);

  const mappedData = applyMapping(eventData, configuration.mapping, apiSample);

  broadcastEvent('processing', {
    eventId,
    stage: 'mapped',
    message: 'Data mapped successfully',
    mappedData
  }, configurationId);

  // Call API
  broadcastEvent('processing', {
    eventId,
    stage: 'calling_api',
    message: `Calling ${apiSample.method} ${apiSample.endpoint}...`
  }, configurationId);

  const result = await callTargetApi(apiSample, mappedData);

  broadcastEvent('api_called', {
    eventId,
    success: result.success,
    status: result.status,
    statusText: result.statusText,
    duration: result.duration,
    response: result.data
  }, configurationId);

  return result;
}

// Start the monitor for a specific configuration
export async function startMonitor(configurationId) {
  // Per-config guard: check if this specific config is already running
  const existingState = monitorStates.get(configurationId);
  if (existingState && existingState.isRunning) {
    throw new Error(`Monitor for configuration "${existingState.configurationName}" is already running`);
  }

  // Load Event Hub SDK
  await loadEventHubSDK();

  const eventHubConfig = getEventHubConfig();
  if (!eventHubConfig?.connectionString || !eventHubConfig?.topicName) {
    throw new Error('Event Hub not configured. Please configure in Event Hub Config page.');
  }

  const configuration = getConfiguration(configurationId);
  if (!configuration) {
    throw new Error('Configuration not found');
  }

  const apiSample = getApiSample(configuration.destination?.apiSampleId);
  if (!apiSample) {
    throw new Error('API sample not found for this configuration');
  }

  // Create or reset state for this config
  const state = createMonitorState(configurationId, configuration.name);
  monitorStates.set(configurationId, state);

  // Load existing checkpoint for this configuration
  const existingCheckpoint = loadCheckpoint(configurationId);

  try {
    const consumerClient = new EventHubConsumerClient(
      '$Default',
      eventHubConfig.connectionString,
      eventHubConfig.topicName
    );

    state.consumerClient = consumerClient;

    broadcastEvent('monitor_started', {
      configurationId,
      configurationName: configuration.name,
      eventHub: eventHubConfig.topicName,
      hasCheckpoint: !!existingCheckpoint
    }, configurationId);

    // Determine start position based on checkpoint
    let startPosition;

    if (existingCheckpoint && Object.keys(existingCheckpoint).length > 0) {
      // Build per-partition start positions from checkpoint
      startPosition = {};
      const partitionIds = await consumerClient.getPartitionIds();

      for (const partitionId of partitionIds) {
        if (existingCheckpoint[partitionId] && existingCheckpoint[partitionId].offset) {
          startPosition[partitionId] = {
            offset: Number(existingCheckpoint[partitionId].offset),
            isInclusive: false
          };
        } else {
          startPosition[partitionId] = latestEventPosition;
        }
      }
    } else {
      startPosition = earliestEventPosition;
    }

    // Subscribe to events
    state.subscription = consumerClient.subscribe({
      processEvents: async (events, context) => {
        // Check if this config is still running (may have been stopped)
        const currentState = monitorStates.get(configurationId);
        if (!currentState || !currentState.isRunning) return;

        for (const event of events) {
          const eventData = event.body;

          // Filter by event type
          if (configuration.eventType && eventData?.type && eventData.type !== configuration.eventType) {
            saveCheckpoint(
              configurationId,
              context.partitionId,
              event.sequenceNumber,
              event.offset
            );
            continue;
          }

          currentState.stats.eventsReceived++;
          currentState.stats.lastEventTime = new Date().toISOString();

          try {
            const mappedData = applyMapping(eventData, configuration.mapping, apiSample);
            const result = await processEvent(eventData, configuration, apiSample, configurationId);

            if (result.success) {
              currentState.stats.eventsProcessed++;
              await archiveSuccessfulEvent(configurationId, configuration.name, {
                partitionId: context.partitionId,
                offset: String(event.offset),
                sequenceNumber: event.sequenceNumber,
                sourceData: eventData,
                mappedRequest: mappedData,
                apiResponse: {
                  status: result.status,
                  statusText: result.statusText,
                  duration: `${result.duration}ms`,
                  data: result.data
                }
              });
              await saveOffset(configurationId, configuration.name, context.partitionId, String(event.offset), event.sequenceNumber);
            } else {
              currentState.stats.eventsFailed++;
              await archiveFailedEvent(configurationId, configuration.name, {
                partitionId: context.partitionId,
                offset: String(event.offset),
                sequenceNumber: event.sequenceNumber,
                body: eventData,
                error: {
                  status: result.status,
                  statusText: result.statusText,
                  data: result.data,
                  duration: `${result.duration}ms`
                }
              });
            }

            // Save checkpoint after processing each event
            saveCheckpoint(
              configurationId,
              context.partitionId,
              event.sequenceNumber,
              event.offset
            );

            // Keep last 20 events
            currentState.recentEvents.unshift({
              eventId: `evt_${Date.now()}`,
              eventData,
              result,
              timestamp: new Date().toISOString(),
              sequenceNumber: event.sequenceNumber,
              partitionId: context.partitionId
            });
            if (currentState.recentEvents.length > 20) {
              currentState.recentEvents.pop();
            }

            broadcastEvent('stats_updated', currentState.stats, configurationId);
          } catch (err) {
            currentState.stats.eventsFailed++;
            await archiveFailedEvent(configurationId, configuration.name, {
              partitionId: context.partitionId,
              offset: String(event.offset),
              sequenceNumber: event.sequenceNumber,
              body: event.body,
              error: { message: err.message }
            }).catch(archiveErr => console.error('Failed to archive error:', archiveErr));
            saveCheckpoint(
              configurationId,
              context.partitionId,
              event.sequenceNumber,
              event.offset
            );
            broadcastEvent('error', {
              message: err.message,
              eventData: event.body
            }, configurationId);
          }
        }
      },
      processError: async (err, context) => {
        console.error(`Event Hub error (config ${configurationId}):`, err);
        broadcastEvent('error', {
          message: err.message,
          context: context.partitionId
        }, configurationId);
      }
    }, {
      startPosition: startPosition
    });

    state.isRunning = true;

    return {
      success: true,
      message: 'Monitor started',
      configurationName: configuration.name
    };
  } catch (err) {
    state.isRunning = false;
    throw err;
  }
}

// Stop the monitor for a specific configuration
export async function stopMonitor(configurationId) {
  const state = monitorStates.get(configurationId);
  if (!state || !state.isRunning) {
    throw new Error('Monitor is not running for this configuration');
  }

  try {
    if (state.subscription) {
      await state.subscription.close();
    }
    if (state.consumerClient) {
      await state.consumerClient.close();
    }

    state.isRunning = false;
    state.subscription = null;
    state.consumerClient = null;

    broadcastEvent('monitor_stopped', {
      configurationId: state.configurationId,
      configurationName: state.configurationName,
      stats: state.stats
    }, configurationId);

    return {
      success: true,
      message: 'Monitor stopped',
      stats: state.stats
    };
  } catch (err) {
    throw err;
  }
}

// Restart the monitor for a specific configuration
export async function restartMonitor(configurationId) {
  const state = monitorStates.get(configurationId);
  if (!state || !state.isRunning) {
    throw new Error('Monitor is not running for this configuration');
  }

  await stopMonitor(configurationId);
  // Brief delay to allow clean shutdown
  await new Promise(resolve => setTimeout(resolve, 500));
  return await startMonitor(configurationId);
}

// Get monitor status for a single configuration
export function getMonitorStatus(configurationId) {
  const state = monitorStates.get(configurationId);
  const checkpoint = loadCheckpoint(configurationId);

  if (!state) {
    return {
      isRunning: false,
      configurationId,
      configurationName: null,
      stats: { eventsReceived: 0, eventsProcessed: 0, eventsFailed: 0, lastEventTime: null },
      recentEvents: [],
      checkpoint: checkpoint,
      hasCheckpoint: !!checkpoint
    };
  }

  return {
    isRunning: state.isRunning,
    configurationId: state.configurationId,
    configurationName: state.configurationName,
    stats: state.stats,
    recentEvents: state.recentEvents.slice(0, 10),
    checkpoint: checkpoint,
    hasCheckpoint: !!checkpoint
  };
}

// Get statuses for all configurations that have been started (or are in the Map)
export function getAllMonitorStatuses() {
  const statuses = {};
  for (const [configId, state] of monitorStates) {
    const checkpoint = loadCheckpoint(configId);
    statuses[configId] = {
      isRunning: state.isRunning,
      configurationId: state.configurationId,
      configurationName: state.configurationName,
      stats: state.stats,
      recentEvents: state.recentEvents.slice(0, 10),
      checkpoint: checkpoint,
      hasCheckpoint: !!checkpoint
    };
  }
  return statuses;
}

// Check if any monitor is running for a given event sample ID
// This does the config-matching server-side so the frontend doesn't need multiple API calls
export function getMonitorStatusForSample(eventSampleId) {
  // Find all configurations whose source.eventSampleId matches
  const configsDir = path.join(__dirname, '../../data/configurations');
  let allConfigs = [];
  const indexPath = path.join(configsDir, 'index.json');
  if (fs.existsSync(indexPath)) {
    try {
      allConfigs = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    } catch (err) {
      console.error('Failed to read configurations:', err);
    }
  }

  const matchingConfigs = allConfigs.filter(
    c => c.source && c.source.eventSampleId === eventSampleId
  );

  // Check if any matching config has a running monitor
  for (const config of matchingConfigs) {
    const state = monitorStates.get(config.id);
    if (state && state.isRunning) {
      return {
        isRunning: true,
        configurationId: config.id,
        configurationName: state.configurationName,
        stats: state.stats
      };
    }
  }

  return {
    isRunning: false,
    configurationId: matchingConfigs.length > 0 ? matchingConfigs[0].id : null,
    configurationName: matchingConfigs.length > 0 ? matchingConfigs[0].name : null,
    stats: { eventsReceived: 0, eventsProcessed: 0, eventsFailed: 0, lastEventTime: null },
    matchingConfigCount: matchingConfigs.length
  };
}

// Stop all running monitors
export async function stopAllMonitors() {
  const results = [];
  for (const [configId, state] of monitorStates) {
    if (state.isRunning) {
      try {
        const result = await stopMonitor(configId);
        results.push({ configId, ...result });
      } catch (err) {
        results.push({ configId, success: false, error: err.message });
      }
    }
  }
  return results;
}
