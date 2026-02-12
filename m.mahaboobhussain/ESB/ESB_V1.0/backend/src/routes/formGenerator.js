import { Router } from 'express';
import { sendEvent } from '../services/eventHubService.js';
import * as sampleDataService from '../services/sampleDataService.js';
import { generateFormConfig, mergeWithAutoValues } from '../services/formConfigService.js';
import * as globalVariablesService from '../services/globalVariablesService.js';
import * as apiHistoryService from '../services/apiHistoryService.js';

export const formGeneratorRouter = Router();

// GET /api/form-generator/config/:type/:sampleId - Get form configuration for a sample
formGeneratorRouter.get('/config/:type/:sampleId', async (req, res) => {
  try {
    const { type, sampleId } = req.params;

    let sample;
    let fields;
    let sampleData;

    if (type === 'event') {
      sample = await sampleDataService.getSampleEventById(sampleId);
      if (!sample) {
        return res.status(404).json({ error: 'Event sample not found' });
      }
      fields = sample.fields || [];
      sampleData = Array.isArray(sample.sampleData) ? sample.sampleData[0] : sample.sampleData;
    } else if (type === 'api') {
      sample = await sampleDataService.getSampleApiById(sampleId);
      if (!sample) {
        return res.status(404).json({ error: 'API sample not found' });
      }
      fields = sample.request?.fields || [];
      sampleData = sample.request?.sampleData || {};
    } else {
      return res.status(400).json({ error: 'Invalid type. Must be "event" or "api"' });
    }

    const formConfig = generateFormConfig(fields, sampleData);

    res.json({
      sampleId,
      sampleName: sample.name,
      type,
      formConfig
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/form-generator/send-event - Send event to Event Hub
formGeneratorRouter.post('/send-event', async (req, res) => {
  try {
    let { eventData, partitionKey, sampleId, applyAutoValues } = req.body;

    if (!eventData) {
      return res.status(400).json({ error: 'eventData is required' });
    }

    // Load global environment variables for substitution
    const globalVars = await globalVariablesService.getAll();
    const variables = {};
    for (const [name, data] of Object.entries(globalVars || {})) {
      variables[name] = data.value !== undefined ? data.value : data;
    }

    // Substitute variables in eventData
    eventData = globalVariablesService.substituteInObject(eventData, variables);

    let finalEventData = eventData;

    // If sampleId provided and applyAutoValues is true, merge auto-generated values
    if (sampleId && applyAutoValues !== false) {
      const sample = await sampleDataService.getSampleEventById(sampleId);
      if (sample) {
        const fields = sample.fields || [];
        const sampleData = Array.isArray(sample.sampleData) ? sample.sampleData[0] : sample.sampleData;
        const formConfig = generateFormConfig(fields, sampleData);
        finalEventData = mergeWithAutoValues(eventData, formConfig);
      }
    }

    const result = await sendEvent(finalEventData, partitionKey);
    res.json({
      ...result,
      sentData: finalEventData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/form-generator/call-api - Proxy HTTP call to external API
formGeneratorRouter.post('/call-api', async (req, res) => {
  try {
    let { endpoint, method, headers, body, apiSampleId } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'endpoint is required' });
    }

    // Load global environment variables for substitution
    const globalVars = await globalVariablesService.getAll();
    const variables = {};
    for (const [name, data] of Object.entries(globalVars || {})) {
      variables[name] = data.value !== undefined ? data.value : data;
    }

    // Substitute variables in endpoint, headers, and body
    endpoint = globalVariablesService.substituteInString(endpoint, variables);
    if (headers) {
      headers = globalVariablesService.substituteInObject(headers, variables);
    }
    if (body) {
      body = globalVariablesService.substituteInObject(body, variables);
    }

    const httpMethod = (method || 'GET').toUpperCase();

    const fetchOptions = {
      method: httpMethod,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    // Only include body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(httpMethod) && body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const startTime = Date.now();
    const response = await fetch(endpoint, fetchOptions);
    const duration = Date.now() - startTime;

    let responseData;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Capture response variables if apiSampleId is provided and response was successful
    let capturedVariables = [];
    let apiSampleName = '';

    if (apiSampleId) {
      try {
        const apiSample = await sampleDataService.getSampleApiById(apiSampleId);
        if (apiSample) {
          apiSampleName = apiSample.name;
          if (response.ok && typeof responseData === 'object' && apiSample.responseCapture && Array.isArray(apiSample.responseCapture)) {
            capturedVariables = await globalVariablesService.captureFromResponse(
              responseData,
              apiSample.responseCapture
            );
          }
        }
      } catch (captureErr) {
        console.error('Error capturing response variables:', captureErr.message);
      }

      // Save to API history
      try {
        await apiHistoryService.addHistoryRecord({
          apiSampleId,
          apiSampleName,
          endpoint,
          method: httpMethod,
          requestHeaders: fetchOptions.headers,
          requestBody: body || {},
          responseStatus: response.status,
          responseStatusText: response.statusText,
          responseBody: responseData,
          capturedVariables,
          duration: `${duration}ms`,
          success: response.ok
        });
      } catch (historyErr) {
        console.error('Error saving API history:', historyErr.message);
      }
    }

    res.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      duration: `${duration}ms`,
      request: {
        endpoint,
        method: httpMethod,
        headers: fetchOptions.headers,
        body: body || null
      },
      response: {
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData
      },
      capturedVariables
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      request: {
        endpoint: req.body.endpoint,
        method: req.body.method || 'GET'
      }
    });
  }
});
