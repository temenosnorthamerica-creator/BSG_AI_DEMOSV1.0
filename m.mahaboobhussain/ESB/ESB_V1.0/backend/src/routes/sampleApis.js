import { Router } from 'express';
import * as sampleDataService from '../services/sampleDataService.js';

export const sampleApisRouter = Router();

// Get all sample APIs
sampleApisRouter.get('/', async (req, res) => {
  try {
    const apis = await sampleDataService.getAllSampleApis();
    res.json(apis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single sample API
sampleApisRouter.get('/:id', async (req, res) => {
  try {
    const api = await sampleDataService.getSampleApiById(req.params.id);
    if (!api) {
      return res.status(404).json({ error: 'API not found' });
    }
    res.json(api);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create sample API
sampleApisRouter.post('/', async (req, res) => {
  try {
    const { name, endpoint, method, requestJson, responseJson, defaultHeaders, responseCapture } = req.body;
    if (!name || !requestJson || !responseJson) {
      return res.status(400).json({ error: 'Name, requestJson, and responseJson are required' });
    }

    // Validate JSON
    let parsedRequest = requestJson;
    let parsedResponse = responseJson;

    if (typeof requestJson === 'string') {
      try {
        parsedRequest = JSON.parse(requestJson);
      } catch {
        return res.status(400).json({ error: 'Invalid request JSON format' });
      }
    }

    if (typeof responseJson === 'string') {
      try {
        parsedResponse = JSON.parse(responseJson);
      } catch {
        return res.status(400).json({ error: 'Invalid response JSON format' });
      }
    }

    const api = await sampleDataService.createSampleApi(
      name,
      endpoint,
      method,
      parsedRequest,
      parsedResponse,
      defaultHeaders || {},
      responseCapture || []
    );
    res.status(201).json(api);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update sample API
sampleApisRouter.put('/:id', async (req, res) => {
  try {
    const { name, endpoint, method, requestJson, responseJson, defaultHeaders, responseCapture } = req.body;
    if (!name || !requestJson || !responseJson) {
      return res.status(400).json({ error: 'Name, requestJson, and responseJson are required' });
    }

    let parsedRequest = requestJson;
    let parsedResponse = responseJson;

    if (typeof requestJson === 'string') {
      try {
        parsedRequest = JSON.parse(requestJson);
      } catch {
        return res.status(400).json({ error: 'Invalid request JSON format' });
      }
    }

    if (typeof responseJson === 'string') {
      try {
        parsedResponse = JSON.parse(responseJson);
      } catch {
        return res.status(400).json({ error: 'Invalid response JSON format' });
      }
    }

    const api = await sampleDataService.updateSampleApi(
      req.params.id,
      name,
      endpoint,
      method,
      parsedRequest,
      parsedResponse,
      defaultHeaders || {},
      responseCapture || []
    );
    res.json(api);
  } catch (error) {
    if (error.message === 'API not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete sample API
sampleApisRouter.delete('/:id', async (req, res) => {
  try {
    await sampleDataService.deleteSampleApi(req.params.id);
    res.json({ success: true });
  } catch (error) {
    if (error.message === 'API not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});
