import express from 'express';
import {
  startMonitor,
  stopMonitor,
  restartMonitor,
  getMonitorStatus,
  getMonitorStatusForSample,
  getAllMonitorStatuses,
  stopAllMonitors,
  addSseClient,
  broadcastEvent,
  resetCheckpoint,
  getCheckpointInfo
} from '../services/eventHubMonitorService.js';

const router = express.Router();

// Start monitoring a configuration
router.post('/start', async (req, res) => {
  try {
    const { configurationId } = req.body;
    if (!configurationId) {
      return res.status(400).json({ error: 'Configuration ID is required' });
    }

    const result = await startMonitor(configurationId);
    res.json(result);
  } catch (err) {
    console.error('Error starting monitor:', err);
    res.status(500).json({ error: err.message });
  }
});

// Stop monitoring a specific configuration
router.post('/stop', async (req, res) => {
  try {
    const { configurationId } = req.body;
    if (!configurationId) {
      return res.status(400).json({ error: 'Configuration ID is required' });
    }

    const result = await stopMonitor(configurationId);
    res.json(result);
  } catch (err) {
    console.error('Error stopping monitor:', err);
    res.status(500).json({ error: err.message });
  }
});

// Restart monitoring a specific configuration
router.post('/restart', async (req, res) => {
  try {
    const { configurationId } = req.body;
    if (!configurationId) {
      return res.status(400).json({ error: 'Configuration ID is required' });
    }

    const result = await restartMonitor(configurationId);
    res.json(result);
  } catch (err) {
    console.error('Error restarting monitor:', err);
    res.status(500).json({ error: err.message });
  }
});

// Stop all running monitors
router.post('/stop-all', async (req, res) => {
  try {
    const results = await stopAllMonitors();
    res.json({ success: true, results });
  } catch (err) {
    console.error('Error stopping all monitors:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all monitor statuses
router.get('/status', (req, res) => {
  try {
    const statuses = getAllMonitorStatuses();
    res.json(statuses);
  } catch (err) {
    console.error('Error getting monitor statuses:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get monitor status for a single configuration
router.get('/status/:configId', (req, res) => {
  try {
    const { configId } = req.params;
    const status = getMonitorStatus(configId);
    res.json(status);
  } catch (err) {
    console.error('Error getting monitor status:', err);
    res.status(500).json({ error: err.message });
  }
});

// Check if any monitor is running for a given event sample
router.get('/sample-status/:sampleId', (req, res) => {
  try {
    const { sampleId } = req.params;
    const status = getMonitorStatusForSample(sampleId);
    res.json(status);
  } catch (err) {
    console.error('Error getting monitor status for sample:', err);
    res.status(500).json({ error: err.message });
  }
});

// SSE endpoint for real-time events
router.get('/events', (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  // Add client to SSE list
  addSseClient(res);

  // Send all current statuses so frontend can sync
  const statuses = getAllMonitorStatuses();
  res.write(`data: ${JSON.stringify({ type: 'status', data: statuses, timestamp: new Date().toISOString() })}\n\n`);

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() })}\n\n`);
  }, 30000);

  // Cleanup on close
  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

// Simulate an event (for testing)
router.post('/simulate', async (req, res) => {
  try {
    const { eventData, configurationId } = req.body;
    broadcastEvent('simulated_event', {
      eventData,
      message: 'Simulated event received'
    }, configurationId || null);
    res.json({ success: true, message: 'Event simulated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get checkpoint info for a configuration
router.get('/checkpoint/:configId', (req, res) => {
  try {
    const { configId } = req.params;
    const checkpoint = getCheckpointInfo(configId);
    res.json({
      configId,
      checkpoint: checkpoint || null,
      hasCheckpoint: !!checkpoint
    });
  } catch (err) {
    console.error('Error getting checkpoint:', err);
    res.status(500).json({ error: err.message });
  }
});

// Reset checkpoint for a configuration (to reprocess all events)
router.delete('/checkpoint/:configId', (req, res) => {
  try {
    const { configId } = req.params;
    const wasReset = resetCheckpoint(configId);
    res.json({
      success: true,
      configId,
      wasReset,
      message: wasReset ? 'Checkpoint reset - all events will be reprocessed' : 'No checkpoint found'
    });
  } catch (err) {
    console.error('Error resetting checkpoint:', err);
    res.status(500).json({ error: err.message });
  }
});

export const monitorRouter = router;
