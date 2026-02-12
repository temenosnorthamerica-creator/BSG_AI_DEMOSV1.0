import { Router } from 'express';
import * as offsetTrackingService from '../services/offsetTrackingService.js';

export const offsetsRouter = Router();

// Get offset info for a configuration
offsetsRouter.get('/:configId', async (req, res) => {
  try {
    const summary = await offsetTrackingService.getOffsetSummary(req.params.configId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear offsets for a configuration (reset tracking)
offsetsRouter.delete('/:configId', async (req, res) => {
  try {
    const result = await offsetTrackingService.clearOffsets(req.params.configId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get failed events for a configuration
offsetsRouter.get('/:configId/failed', async (req, res) => {
  try {
    const failedEvents = await offsetTrackingService.getFailedEvents(req.params.configId);
    res.json(failedEvents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all failed events for a configuration (allows retry)
offsetsRouter.delete('/:configId/failed', async (req, res) => {
  try {
    const result = await offsetTrackingService.clearFailedEvents(req.params.configId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove a single failed event
offsetsRouter.delete('/:configId/failed/:eventId', async (req, res) => {
  try {
    const result = await offsetTrackingService.removeFailedEvent(
      req.params.configId,
      req.params.eventId
    );
    res.json(result);
  } catch (error) {
    if (error.message === 'Failed event not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// ============ SUCCESSFUL EVENTS ============

// Get successful events for a configuration (with optional filters)
offsetsRouter.get('/:configId/successful', async (req, res) => {
  try {
    const { search, partition, from, to } = req.query;
    const filters = {};

    if (search) filters.search = search;
    if (partition) filters.partitionId = partition;
    if (from) filters.fromDate = from;
    if (to) filters.toDate = to;

    const successfulEvents = await offsetTrackingService.getSuccessfulEvents(
      req.params.configId,
      filters
    );
    res.json(successfulEvents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unique partition IDs from successful events (for filter dropdown)
offsetsRouter.get('/:configId/successful/partitions', async (req, res) => {
  try {
    const partitions = await offsetTrackingService.getSuccessfulEventPartitions(req.params.configId);
    res.json(partitions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all successful events for a configuration
offsetsRouter.delete('/:configId/successful', async (req, res) => {
  try {
    const result = await offsetTrackingService.clearSuccessfulEvents(req.params.configId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove a single successful event
offsetsRouter.delete('/:configId/successful/:eventId', async (req, res) => {
  try {
    const result = await offsetTrackingService.removeSuccessfulEvent(
      req.params.configId,
      req.params.eventId
    );
    res.json(result);
  } catch (error) {
    if (error.message === 'Successful event not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// ============ DISPLAY PREFERENCES ============

// Get display field preferences for a configuration
offsetsRouter.get('/:configId/display-prefs', async (req, res) => {
  try {
    const prefs = await offsetTrackingService.getDisplayPreferences(req.params.configId);
    res.json(prefs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save display field preferences for a configuration
offsetsRouter.put('/:configId/display-prefs', async (req, res) => {
  try {
    const { sourceFields, responseFields } = req.body;
    const prefs = await offsetTrackingService.saveDisplayPreferences(
      req.params.configId,
      sourceFields || [],
      responseFields || []
    );
    res.json(prefs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear display preferences for a configuration
offsetsRouter.delete('/:configId/display-prefs', async (req, res) => {
  try {
    const result = await offsetTrackingService.clearDisplayPreferences(req.params.configId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
