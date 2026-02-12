import * as sampleFileService from './sampleFileService.js';
import * as sampleDataService from './sampleDataService.js';
import * as globalVariablesService from './globalVariablesService.js';

// Parse CSV content into rows
export function parseCSV(content, options = {}) {
  const {
    delimiter = ',',
    hasHeader = true,
    headerRowCount = 1,
    footerRowCount = 0,
    textQualifier = '"'
  } = options;

  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Remove footer rows
  const dataLines = footerRowCount > 0 ? lines.slice(0, -footerRowCount) : lines;

  // Parse a single line with text qualifier handling
  const parseLine = (line) => {
    const values = [];
    let currentValue = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === textQualifier) {
        if (inQuotes && nextChar === textQualifier) {
          // Escaped quote
          currentValue += textQualifier;
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    return values;
  };

  let headers = [];
  let dataStartIndex = 0;

  if (hasHeader && headerRowCount > 0) {
    // First header row contains the column names
    headers = parseLine(dataLines[0]);
    dataStartIndex = headerRowCount;
  }

  const rows = [];
  for (let i = dataStartIndex; i < dataLines.length; i++) {
    const values = parseLine(dataLines[i]);
    const row = {};

    if (hasHeader) {
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
    } else {
      // Use column indices as keys
      values.forEach((value, index) => {
        row[`column${index + 1}`] = value;
      });
    }

    rows.push({
      rowIndex: i - dataStartIndex + 1,
      data: row
    });
  }

  return { headers, rows };
}

// Build API request body from field mapping
export function buildRequestBody(rowData, fieldMapping, staticFields, apiFields, variables = {}) {
  const body = {};

  // Helper to set nested value using dot notation
  const setNestedValue = (obj, path, value) => {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      // Handle array notation like "items[]"
      if (part.endsWith('[]')) {
        const key = part.slice(0, -2);
        if (!current[key]) current[key] = [{}];
        current = current[key][0];
      } else {
        if (!current[part]) current[part] = {};
        current = current[part];
      }
    }

    const lastPart = parts[parts.length - 1];
    if (lastPart.endsWith('[]')) {
      const key = lastPart.slice(0, -2);
      current[key] = [value];
    } else {
      current[lastPart] = value;
    }
  };

  // Apply field mappings (CSV column -> API field)
  for (const [csvColumn, apiField] of Object.entries(fieldMapping)) {
    if (rowData[csvColumn] !== undefined) {
      let value = rowData[csvColumn];
      // Substitute variables in the value
      value = globalVariablesService.substituteInString(value, variables);
      setNestedValue(body, apiField, value);
    }
  }

  // Apply static fields
  for (const [apiField, staticValue] of Object.entries(staticFields)) {
    let value = staticValue;
    // Substitute variables in static values
    value = globalVariablesService.substituteInString(value, variables);
    setNestedValue(body, apiField, value);
  }

  return body;
}

// Extract value from response using dot notation path
function extractValueFromResponse(response, path) {
  if (!response || !path) return undefined;

  const parts = path.split('.');
  let current = response;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;

    // Handle array index notation like "items[0]"
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      current = current[key];
      if (Array.isArray(current)) {
        current = current[parseInt(index, 10)];
      } else {
        return undefined;
      }
    } else {
      current = current[part];
    }
  }

  return current;
}

// Capture response fields based on capture rules
export function captureResponseFields(response, captureRules) {
  if (!captureRules || !Array.isArray(captureRules) || captureRules.length === 0) {
    return {};
  }

  const captured = {};

  for (const rule of captureRules) {
    const { responsePath, displayName } = rule;
    if (!responsePath) continue;

    const value = extractValueFromResponse(response, responsePath);
    if (value !== undefined) {
      captured[displayName || responsePath] = value;
    }
  }

  return captured;
}

// Process a single row
export async function processRow(rowData, sampleFile, apiSample, variables) {
  const startTime = Date.now();

  try {
    // Build request body
    const requestBody = buildRequestBody(
      rowData.data,
      sampleFile.fieldMapping,
      sampleFile.staticFields,
      apiSample.request?.fields || [],
      variables
    );

    // Substitute variables in endpoint
    let endpoint = globalVariablesService.substituteInString(apiSample.endpoint, variables);

    // Substitute variables in headers
    let headers = { ...apiSample.defaultHeaders };
    headers = globalVariablesService.substituteInObject(headers, variables);

    const fetchOptions = {
      method: apiSample.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(requestBody)
    };

    const response = await fetch(endpoint, fetchOptions);
    const duration = Date.now() - startTime;

    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Capture response fields for display
    const capturedFields = captureResponseFields(responseData, sampleFile.responseCapture);

    // Also save to global variables if API sample has responseCapture rules
    if (response.ok && apiSample.responseCapture && apiSample.responseCapture.length > 0) {
      await globalVariablesService.captureFromResponse(responseData, apiSample.responseCapture);
    }

    return {
      success: response.ok,
      rowIndex: rowData.rowIndex,
      sourceData: rowData.data,
      request: {
        endpoint,
        method: apiSample.method || 'POST',
        headers: fetchOptions.headers,
        body: requestBody
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      },
      capturedFields,
      duration: `${duration}ms`
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      rowIndex: rowData.rowIndex,
      sourceData: rowData.data,
      error: error.message,
      duration: `${duration}ms`
    };
  }
}

// Process entire CSV file
export async function processCSVFile(sampleFileId, csvContent, options = {}) {
  const { batchSize = 10, delayBetweenBatches = 100, fileName = 'Unknown', fileSize = 0 } = options;

  // Get file definition
  const sampleFile = await sampleFileService.getSampleFileById(sampleFileId);
  if (!sampleFile) {
    throw new Error('Sample file definition not found');
  }

  // Get target API
  const apiSample = await sampleDataService.getSampleApiById(sampleFile.targetApi.apiSampleId);
  if (!apiSample) {
    throw new Error('Target API sample not found');
  }

  // Load global variables
  const globalVars = await globalVariablesService.getAll();
  const variables = {};
  for (const [name, data] of Object.entries(globalVars || {})) {
    variables[name] = data.value !== undefined ? data.value : data;
  }

  // Parse CSV
  const { headers, rows } = parseCSV(csvContent, sampleFile.fileFormat);

  if (rows.length === 0) {
    return {
      sampleFileId,
      sampleFileName: sampleFile.name,
      totalRows: 0,
      successfulRows: 0,
      failedRows: 0,
      results: []
    };
  }

  // Create a batch record for this file upload
  const batch = await sampleFileService.createBatch(sampleFileId, {
    fileName,
    fileSize,
    totalRows: rows.length
  });

  const results = [];
  let successCount = 0;
  let failCount = 0;

  // Process in batches
  for (let i = 0; i < rows.length; i += batchSize) {
    const rowBatch = rows.slice(i, i + batchSize);

    // Process batch concurrently
    const batchResults = await Promise.all(
      rowBatch.map(row => processRow(row, sampleFile, apiSample, variables))
    );

    for (const result of batchResults) {
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
      results.push(result);

      // Save to processing history with batchId
      await sampleFileService.addProcessingRecord(sampleFileId, {
        batchId: batch.id,
        success: result.success,
        rowIndex: result.rowIndex,
        sourceData: result.sourceData,
        capturedFields: result.capturedFields || {},
        request: result.request,
        response: result.response,
        error: result.error,
        duration: result.duration
      });
    }

    // Delay between batches to avoid overwhelming the API
    if (i + batchSize < rows.length && delayBetweenBatches > 0) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  // Update batch with final counts
  await sampleFileService.updateBatch(sampleFileId, batch.id, {
    successfulRows: successCount,
    failedRows: failCount,
    status: 'completed',
    processedAt: new Date().toISOString()
  });

  return {
    sampleFileId,
    sampleFileName: sampleFile.name,
    apiSampleName: apiSample.name,
    batchId: batch.id,
    totalRows: rows.length,
    successfulRows: successCount,
    failedRows: failCount,
    headers,
    results
  };
}

// Preview how a single row would be mapped
export async function previewRowMapping(sampleFileId, rowData) {
  const sampleFile = await sampleFileService.getSampleFileById(sampleFileId);
  if (!sampleFile) {
    throw new Error('Sample file definition not found');
  }

  const apiSample = await sampleDataService.getSampleApiById(sampleFile.targetApi.apiSampleId);

  // Load global variables
  const globalVars = await globalVariablesService.getAll();
  const variables = {};
  for (const [name, data] of Object.entries(globalVars || {})) {
    variables[name] = data.value !== undefined ? data.value : data;
  }

  const requestBody = buildRequestBody(
    rowData,
    sampleFile.fieldMapping,
    sampleFile.staticFields,
    apiSample?.request?.fields || [],
    variables
  );

  return {
    sourceData: rowData,
    requestBody,
    endpoint: apiSample ? globalVariablesService.substituteInString(apiSample.endpoint, variables) : null,
    method: apiSample?.method || 'POST'
  };
}

// Validate CSV columns against file definition
export function validateCSVColumns(csvHeaders, sampleFile) {
  const definedColumns = sampleFile.columns.map(c => c.name);
  const mappedColumns = Object.keys(sampleFile.fieldMapping);

  const missing = [];
  const extra = [];

  // Check for columns defined in mapping but not in CSV
  for (const col of mappedColumns) {
    if (!csvHeaders.includes(col)) {
      missing.push(col);
    }
  }

  // Check for columns in CSV but not in definition
  for (const col of csvHeaders) {
    if (!definedColumns.includes(col)) {
      extra.push(col);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    extra,
    csvHeaders,
    definedColumns
  };
}
