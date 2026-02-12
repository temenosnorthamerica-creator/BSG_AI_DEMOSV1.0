import { Router } from 'express';
import * as apiHistoryService from '../services/apiHistoryService.js';

export const apiHistoryRouter = Router();

// GET /api/api-history - Get all API samples that have history
apiHistoryRouter.get('/', async (req, res) => {
  try {
    const samples = await apiHistoryService.getApiSamplesWithHistory();
    res.json(samples);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/api-history/:apiSampleId - Get history for an API sample
apiHistoryRouter.get('/:apiSampleId', async (req, res) => {
  try {
    const { apiSampleId } = req.params;
    const { search, from, to } = req.query;

    const filters = {};
    if (search) filters.search = search;
    if (from) filters.fromDate = from;
    if (to) filters.toDate = to;

    const history = await apiHistoryService.getHistory(apiSampleId, filters);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/api-history/:apiSampleId/summary - Get summary for an API sample history
apiHistoryRouter.get('/:apiSampleId/summary', async (req, res) => {
  try {
    const { apiSampleId } = req.params;
    const summary = await apiHistoryService.getHistorySummary(apiSampleId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/api-history/:apiSampleId - Clear all history for an API sample
apiHistoryRouter.delete('/:apiSampleId', async (req, res) => {
  try {
    const { apiSampleId } = req.params;
    const result = await apiHistoryService.clearHistory(apiSampleId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/api-history/:apiSampleId/:historyId - Remove a single history record
apiHistoryRouter.delete('/:apiSampleId/:historyId', async (req, res) => {
  try {
    const { apiSampleId, historyId } = req.params;
    const result = await apiHistoryService.removeHistoryRecord(apiSampleId, historyId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
