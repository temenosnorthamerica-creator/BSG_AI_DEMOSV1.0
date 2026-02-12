import { Router } from 'express';
import * as sampleDataService from '../services/sampleDataService.js';
import { readEvents, getEventHubInfo } from '../services/eventHubConsumerService.js';
import * as offsetTrackingService from '../services/offsetTrackingService.js';
import * as globalVariablesService from '../services/globalVariablesService.js';

export const demoRouter = Router();

// Get Event Hub info (partitions, status)
demoRouter.get('/event-hub-info', async (req, res) => {
  try {
    const info = await getEventHubInfo();
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Read events from Event Hub
demoRouter.post('/read-events', async (req, res) => {
  try {
    const { maxEvents = 10, maxWaitTimeSeconds = 30, startPosition = 'earliest' } = req.body;
    const result = await readEvents({ maxEvents, maxWaitTimeSeconds, startPosition });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute demo - supports both simulated and live modes
demoRouter.post('/execute', async (req, res) => {
  try {
    const { configId, sourceData, liveMode = false, eventHubOptions = {}, endpointOverride = null, useRealApi = false, headers = {} } = req.body;

    if (!configId) {
      return res.status(400).json({ error: 'configId is required' });
    }

    // Get configuration
    const config = await sampleDataService.getConfigurationById(configId);
    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    // Get API sample for destination
    const apiSample = await sampleDataService.getSampleApiById(config.destination.apiSampleId);
    if (!apiSample) {
      return res.status(404).json({ error: 'API sample not found' });
    }

    let dataToProcess = sourceData;
    let eventHubResult = null;
    let eventsWithMetadata = []; // For live mode: events with partition/offset info

    // Live mode: Read events from Event Hub
    if (liveMode) {
      try {
        // Read more events to ensure we find matching ones after filtering by eventType
        // maxEvents here is the number to READ from Event Hub (before filtering)
        // We read more and filter, then process up to the desired count
        const { maxEventsToRead = 100, maxEventsToProcess = 10, maxWaitTimeSeconds = 30, startPosition = 'earliest' } = eventHubOptions;
        const maxEvents = maxEventsToRead;

        // Get saved offsets to start reading from where we left off
        const savedOffsets = await offsetTrackingService.getOffsets(configId);
        const startSequenceNumbers = {};

        // Build map of partitionId -> last processed sequence number
        if (savedOffsets.partitions) {
          for (const [partitionId, data] of Object.entries(savedOffsets.partitions)) {
            if (data.sequenceNumber !== undefined) {
              startSequenceNumbers[partitionId] = data.sequenceNumber;
            }
          }
        }

        console.log('Demo execute - Config:', config.name);
        console.log('Demo execute - Event Type Filter:', config.eventType || 'none');
        console.log('Demo execute - Starting Event Hub read with saved offsets:', startSequenceNumbers);

        eventHubResult = await readEvents({
          maxEvents,
          maxWaitTimeSeconds,
          startPosition,
          startSequenceNumbers
        });

        console.log('Demo execute - Event Hub result:', {
          eventsRead: eventHubResult.eventsRead,
          eventHub: eventHubResult.eventHub
        });

        if (eventHubResult.events && eventHubResult.events.length > 0) {
          let events = eventHubResult.events;

          // Log event types found for debugging
          const eventTypes = [...new Set(events.map(e => e.body?.type).filter(Boolean))];
          console.log('Demo execute - Event types found in Event Hub:', eventTypes);

          // Filter events by eventType if configured
          if (config.eventType) {
            const beforeFilter = events.length;
            events = events.filter(e => e.body && e.body.type === config.eventType);
            console.log(`Demo execute - Event type filter: ${beforeFilter} events -> ${events.length} matching "${config.eventType}"`);
            if (events.length === 0) {
              return res.json({
                configId,
                configName: config.name,
                liveMode: true,
                eventType: config.eventType,
                eventHubResult: {
                  eventHub: eventHubResult.eventHub,
                  eventsRead: eventHubResult.eventsRead,
                  eventsAfterFilter: 0
                },
                totalRecords: 0,
                processedRecords: 0,
                message: `No events matching type "${config.eventType}" found. ${eventHubResult.eventsRead} events were read but none matched the filter.`,
                results: []
              });
            }
          }

          // Filter out already-processed and archived-failed events using offset tracking
          const filteredEvents = [];
          let skippedCount = 0;
          for (const event of events) {
            const skipCheck = await offsetTrackingService.shouldSkipEvent(
              configId,
              event.partitionId || '0',
              event.offset || '0',
              event.sequenceNumber || 0
            );
            if (skipCheck.skip) {
              skippedCount++;
            } else {
              filteredEvents.push(event);
            }
          }

          if (filteredEvents.length === 0) {
            return res.json({
              configId,
              configName: config.name,
              liveMode: true,
              eventType: config.eventType || null,
              eventHubResult: {
                eventHub: eventHubResult.eventHub,
                eventsRead: eventHubResult.eventsRead,
                eventsAfterFilter: 0,
                eventsSkipped: skippedCount
              },
              totalRecords: 0,
              processedRecords: 0,
              message: `All ${skippedCount} events were already processed or in failed archive. Clear offsets to reprocess.`,
              results: []
            });
          }

          // Limit the number of events to process (after filtering)
          const eventsToProcess = filteredEvents.slice(0, maxEventsToProcess);
          console.log(`Demo execute - Processing ${eventsToProcess.length} of ${filteredEvents.length} filtered events (maxEventsToProcess: ${maxEventsToProcess})`);

          eventsWithMetadata = eventsToProcess;
          dataToProcess = eventsToProcess.map(e => e.body);
        } else {
          console.log('Demo execute - No events returned from Event Hub');
          // Include saved offsets in response for debugging
          const savedOffsets = await offsetTrackingService.getOffsets(configId);
          return res.json({
            configId,
            configName: config.name,
            liveMode: true,
            eventType: config.eventType || null,
            eventHubResult,
            savedOffsets: savedOffsets,
            totalRecords: 0,
            processedRecords: 0,
            message: 'No events found in Event Hub. Check backend console for partition details.',
            results: []
          });
        }
      } catch (ehError) {
        return res.status(500).json({
          error: 'Failed to read from Event Hub: ' + ehError.message,
          liveMode: true
        });
      }
    } else {
      // Simulated mode: Use sample data
      if (!dataToProcess && config.source.type === 'event' && config.source.eventSampleId) {
        const eventSample = await sampleDataService.getSampleEventById(config.source.eventSampleId);
        if (eventSample) {
          dataToProcess = Array.isArray(eventSample.sampleData)
            ? eventSample.sampleData
            : [eventSample.sampleData];
        }
      }
    }

    if (!dataToProcess || !Array.isArray(dataToProcess)) {
      dataToProcess = [dataToProcess || {}];
    }

    // Load global environment variables (for substitution)
    const globalVars = await globalVariablesService.getAll();
    // Convert to simple key-value map for substitution
    const variables = {};
    for (const [name, data] of Object.entries(globalVars || {})) {
      variables[name] = data.value !== undefined ? data.value : data;
    }

    // Track all substitutions and captures for the response
    const allSubstitutions = [];
    const allCaptured = [];

    // Process each record
    const results = [];
    for (let i = 0; i < dataToProcess.length; i++) {
      const record = dataToProcess[i];

      // Start with API Sample's request structure as base template
      // This preserves static sections like "header" while allowing mapped fields to be filled in
      let mappedRequest = JSON.parse(JSON.stringify(apiSample.request.sampleData || {}));

      // Apply mapping to fill in / override specific fields
      for (const [sourceField, targetField] of Object.entries(config.mapping)) {
        const value = getNestedValue(record, sourceField);
        setNestedValue(mappedRequest, targetField, value);
      }

      // Substitute {{variables}} in the mapped request
      const originalRequest = JSON.stringify(mappedRequest);
      mappedRequest = globalVariablesService.substituteInObject(mappedRequest, variables);
      // Track substitutions by comparing before/after
      const substitutedRequest = JSON.stringify(mappedRequest);
      if (originalRequest !== substitutedRequest) {
        // Find which variables were substituted
        for (const [varName, varValue] of Object.entries(variables)) {
          if (originalRequest.includes(`{{${varName}}}`)) {
            allSubstitutions.push({ variable: varName, value: varValue });
          }
        }
      }

      let apiResponse;
      let status = 'success';
      let error = null;
      let capturedVars = [];

      // Determine if we should make a real API call
      const shouldMakeRealApiCall = liveMode || useRealApi;

      // Use endpoint override if provided, otherwise use API sample's endpoint
      let targetEndpoint = endpointOverride || apiSample.endpoint;

      // Substitute {{variables}} in the endpoint
      const originalEndpoint = targetEndpoint;
      targetEndpoint = globalVariablesService.substituteInString(targetEndpoint, variables);
      if (originalEndpoint !== targetEndpoint) {
        for (const [varName, varValue] of Object.entries(variables)) {
          if (originalEndpoint.includes(`{{${varName}}}`)) {
            allSubstitutions.push({ variable: varName, value: varValue });
          }
        }
      }

      if (shouldMakeRealApiCall) {
        // Live mode or useRealApi: Make real API call
        try {
          // Extract headers from event data (if present) for auto-mapping to HTTP headers
          const eventHeaders = record.headers || {};

          // Merge headers with priority: API Sample defaults < Event headers < User-provided headers
          const defaultApiHeaders = apiSample.defaultHeaders || {};
          let mergedHeaders = {
            'Content-Type': 'application/json',
            ...defaultApiHeaders,   // API Sample default headers
            ...eventHeaders,        // Headers from event data (auto-mapped)
            ...headers              // User-provided headers (highest priority)
          };

          // Substitute {{variables}} in headers
          const originalHeaders = JSON.stringify(mergedHeaders);
          mergedHeaders = globalVariablesService.substituteInObject(mergedHeaders, variables);
          if (originalHeaders !== JSON.stringify(mergedHeaders)) {
            for (const [varName, varValue] of Object.entries(variables)) {
              if (originalHeaders.includes(`{{${varName}}}`)) {
                allSubstitutions.push({ variable: varName, value: varValue });
              }
            }
          }

          const fetchOptions = {
            method: apiSample.method || 'POST',
            headers: mergedHeaders
          };

          if (['POST', 'PUT', 'PATCH'].includes(fetchOptions.method)) {
            fetchOptions.body = JSON.stringify(mappedRequest);
          }

          const startTime = Date.now();
          const response = await fetch(targetEndpoint, fetchOptions);
          const duration = Date.now() - startTime;

          let responseData;
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
          } else {
            responseData = await response.text();
          }

          apiResponse = {
            status: response.status,
            statusText: response.statusText,
            duration: `${duration}ms`,
            data: responseData,
            isLive: true,
            endpointUsed: targetEndpoint,
            headersUsed: mergedHeaders
          };

          if (!response.ok) {
            status = 'failed';
            error = `HTTP ${response.status}: ${response.statusText}`;
          } else {
            // Capture variables from successful response based on API Sample's responseCapture config
            if (apiSample.responseCapture && apiSample.responseCapture.length > 0 && responseData) {
              capturedVars = await globalVariablesService.captureFromResponse(
                responseData,
                apiSample.responseCapture
              );
              allCaptured.push(...capturedVars);
              // Update local variables for subsequent iterations
              for (const cap of capturedVars) {
                variables[cap.variableName] = cap.value;
              }
            }
          }
        } catch (apiError) {
          status = 'failed';
          error = apiError.message;
          apiResponse = {
            error: apiError.message,
            isLive: true,
            endpointUsed: targetEndpoint
          };
        }
      } else {
        // Simulated mode: Generate simulated response
        apiResponse = generateSimulatedResponse(apiSample.response.sampleData, mappedRequest);
        apiResponse.isSimulated = true;

        // Also capture variables in simulated mode (for testing)
        if (apiSample.responseCapture && apiSample.responseCapture.length > 0 && apiResponse) {
          capturedVars = await globalVariablesService.captureFromResponse(
            apiResponse,
            apiSample.responseCapture
          );
          allCaptured.push(...capturedVars);
          // Update local variables for subsequent iterations
          for (const cap of capturedVars) {
            variables[cap.variableName] = cap.value;
          }
        }
      }

      // Get event metadata for live mode offset tracking
      const eventMeta = liveMode && eventsWithMetadata[i] ? {
        partitionId: eventsWithMetadata[i].partitionId || '0',
        offset: eventsWithMetadata[i].offset || '0',
        sequenceNumber: eventsWithMetadata[i].sequenceNumber || 0
      } : null;

      // Handle offset tracking for live mode
      if (liveMode && eventMeta) {
        if (status === 'success') {
          // Save offset for successful processing
          await offsetTrackingService.saveOffset(
            configId,
            config.name,
            eventMeta.partitionId,
            eventMeta.offset,
            eventMeta.sequenceNumber
          );
          // Archive successful event with full details
          await offsetTrackingService.archiveSuccessfulEvent(configId, config.name, {
            partitionId: eventMeta.partitionId,
            offset: eventMeta.offset,
            sequenceNumber: eventMeta.sequenceNumber,
            sourceData: record,
            mappedRequest,
            apiResponse
          });
        } else {
          // Archive failed event
          await offsetTrackingService.archiveFailedEvent(configId, config.name, {
            partitionId: eventMeta.partitionId,
            offset: eventMeta.offset,
            sequenceNumber: eventMeta.sequenceNumber,
            body: record,
            error
          });
        }
      }

      results.push({
        recordIndex: i,
        sourceData: record,
        mappedRequest,
        apiResponse,
        status,
        error,
        eventMeta,
        capturedVariables: capturedVars,
        processedAt: new Date().toISOString()
      });
    }

    // Deduplicate substitutions (same variable might be substituted multiple times)
    const uniqueSubstitutions = [];
    const seenSubstitutions = new Set();
    for (const sub of allSubstitutions) {
      const key = `${sub.variable}:${sub.value}`;
      if (!seenSubstitutions.has(key)) {
        seenSubstitutions.add(key);
        uniqueSubstitutions.push(sub);
      }
    }

    res.json({
      configId,
      configName: config.name,
      liveMode,
      useRealApi,
      eventType: config.eventType || null,
      eventHubResult: liveMode ? {
        eventHub: eventHubResult?.eventHub,
        eventsRead: eventHubResult?.eventsRead,
        eventsMatchingType: config.eventType ? eventsWithMetadata.length : eventHubResult?.eventsRead,
        eventsProcessed: dataToProcess.length
      } : null,
      apiEndpoint: endpointOverride || apiSample.endpoint,
      apiEndpointOriginal: apiSample.endpoint,
      apiEndpointOverridden: !!endpointOverride,
      apiMethod: apiSample.method,
      totalRecords: dataToProcess.length,
      processedRecords: results.length,
      successCount: results.filter(r => r.status === 'success').length,
      failedCount: results.filter(r => r.status === 'failed').length,
      variablesSubstituted: uniqueSubstitutions,
      variablesCaptured: allCaptured,
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper: Get nested value from object (supports array notation like "addresses[].city")
function getNestedValue(obj, path) {
  const parts = parsePath(path);

  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) {
      return undefined;
    }

    if (part.isArray) {
      if (Array.isArray(current[part.key])) {
        if (part.index !== undefined) {
          current = current[part.key][part.index];
        } else {
          current = current[part.key][0];
        }
      } else {
        return undefined;
      }
    } else {
      current = current[part.key];
    }
  }

  return current;
}

// Helper: Set nested value in object (supports array notation like "addresses[].city")
function setNestedValue(obj, path, value) {
  const parts = parsePath(path);

  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const nextPart = parts[i + 1];

    if (part.isArray) {
      if (!current[part.key]) current[part.key] = [];
      const index = part.index !== undefined ? part.index : 0;
      if (!current[part.key][index]) {
        current[part.key][index] = nextPart?.isArray ? [] : {};
      }
      current = current[part.key][index];
    } else {
      if (!current[part.key]) {
        current[part.key] = nextPart?.isArray ? [] : {};
      }
      current = current[part.key];
    }
  }

  const lastPart = parts[parts.length - 1];
  if (lastPart.isArray) {
    if (!current[lastPart.key]) current[lastPart.key] = [];
    const index = lastPart.index !== undefined ? lastPart.index : 0;
    current[lastPart.key][index] = value;
  } else {
    current[lastPart.key] = value;
  }
}

// Helper: Parse path string into parts (handles "addresses[].city" or "addresses[0].city")
function parsePath(path) {
  const parts = [];
  const regex = /([^.\[\]]+)(\[(\d*)\])?/g;
  let match;

  while ((match = regex.exec(path)) !== null) {
    const key = match[1];
    const hasArray = match[2] !== undefined;
    const index = match[3] !== '' ? parseInt(match[3], 10) : undefined;

    parts.push({
      key,
      isArray: hasArray,
      index: hasArray ? index : undefined
    });
  }

  return parts;
}

// Helper: Generate simulated response based on sample
function generateSimulatedResponse(sampleResponse, request) {
  const response = JSON.parse(JSON.stringify(sampleResponse));

  if (response.id !== undefined) {
    response.id = `SIM-${Date.now()}`;
  }
  if (response.timestamp !== undefined) {
    response.timestamp = new Date().toISOString();
  }
  if (response.status !== undefined) {
    response.status = 'success';
  }
  if (response.createdAt !== undefined) {
    response.createdAt = new Date().toISOString();
  }

  return response;
}

// Preview mapping transformation
demoRouter.post('/preview-mapping', async (req, res) => {
  try {
    const { sourceData, mapping } = req.body;

    if (!sourceData || !mapping) {
      return res.status(400).json({ error: 'sourceData and mapping are required' });
    }

    const mappedRequest = {};
    for (const [sourceField, targetField] of Object.entries(mapping)) {
      const value = getNestedValue(sourceData, sourceField);
      setNestedValue(mappedRequest, targetField, value);
    }

    res.json({
      original: sourceData,
      mapped: mappedRequest
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
