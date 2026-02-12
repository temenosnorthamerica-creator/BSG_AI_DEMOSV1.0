import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const EVENTS_DIR = path.join(DATA_DIR, 'samples/events');
const APIS_DIR = path.join(DATA_DIR, 'samples/apis');
const CONFIGS_DIR = path.join(DATA_DIR, 'configurations');

// Ensure directories exist
async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Extract schema from JSON sample (handles nested arrays and objects)
function extractSchema(obj, prefix = '') {
  const schema = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value === null) {
      schema[fullKey] = 'null';
    } else if (Array.isArray(value)) {
      schema[fullKey] = 'array';
      if (value.length > 0) {
        if (typeof value[0] === 'object' && value[0] !== null) {
          // Array of objects - recurse into the first element
          Object.assign(schema, extractSchema(value[0], `${fullKey}[]`));
        } else {
          // Array of primitives
          schema[`${fullKey}[]`] = typeof value[0];
        }
      }
    } else if (typeof value === 'object') {
      schema[fullKey] = 'object';
      Object.assign(schema, extractSchema(value, fullKey));
    } else {
      schema[fullKey] = typeof value;
    }
  }
  return schema;
}

// Get flat field list from JSON object (handles nested arrays and objects)
// Returns leaf fields that can be mapped (e.g., "addresses[].city", "name")
function getFields(obj, prefix = '') {
  const fields = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value === null) {
      fields.push(fullKey);
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        if (typeof value[0] === 'object' && value[0] !== null) {
          // Array of objects - recurse into first element with [] notation
          fields.push(...getFields(value[0], `${fullKey}[]`));
        } else {
          // Array of primitives - add as a single field
          fields.push(`${fullKey}[]`);
        }
      } else {
        // Empty array - add as field
        fields.push(fullKey);
      }
    } else if (typeof value === 'object') {
      // Nested object - recurse
      fields.push(...getFields(value, fullKey));
    } else {
      // Primitive value - add as leaf field
      fields.push(fullKey);
    }
  }
  return fields;
}

// ============ SAMPLE EVENTS ============

export async function getAllSampleEvents() {
  await ensureDir(EVENTS_DIR);
  const indexFile = path.join(EVENTS_DIR, 'index.json');
  try {
    const data = await fs.readFile(indexFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function getSampleEventById(id) {
  const events = await getAllSampleEvents();
  return events.find(e => e.id === id);
}

export async function createSampleEvent(name, jsonContent) {
  await ensureDir(EVENTS_DIR);
  const id = uuidv4();
  const schema = extractSchema(jsonContent);
  const fields = getFields(jsonContent);

  const event = {
    id,
    name,
    fileName: `${id}.json`,
    schema,
    fields,
    sampleData: jsonContent,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Save the sample JSON file
  await fs.writeFile(
    path.join(EVENTS_DIR, `${id}.json`),
    JSON.stringify(jsonContent, null, 2)
  );

  // Update index
  const events = await getAllSampleEvents();
  events.push(event);
  await fs.writeFile(
    path.join(EVENTS_DIR, 'index.json'),
    JSON.stringify(events, null, 2)
  );

  return event;
}

export async function updateSampleEvent(id, name, jsonContent) {
  const events = await getAllSampleEvents();
  const index = events.findIndex(e => e.id === id);
  if (index === -1) throw new Error('Event not found');

  const schema = extractSchema(jsonContent);
  const fields = getFields(jsonContent);

  events[index] = {
    ...events[index],
    name,
    schema,
    fields,
    sampleData: jsonContent,
    updatedAt: new Date().toISOString()
  };

  await fs.writeFile(
    path.join(EVENTS_DIR, `${id}.json`),
    JSON.stringify(jsonContent, null, 2)
  );

  await fs.writeFile(
    path.join(EVENTS_DIR, 'index.json'),
    JSON.stringify(events, null, 2)
  );

  return events[index];
}

export async function deleteSampleEvent(id) {
  const events = await getAllSampleEvents();
  const index = events.findIndex(e => e.id === id);
  if (index === -1) throw new Error('Event not found');

  // Delete the file
  try {
    await fs.unlink(path.join(EVENTS_DIR, `${id}.json`));
  } catch {}

  // Update index
  events.splice(index, 1);
  await fs.writeFile(
    path.join(EVENTS_DIR, 'index.json'),
    JSON.stringify(events, null, 2)
  );

  return { success: true };
}

// ============ SAMPLE APIS ============

export async function getAllSampleApis() {
  await ensureDir(APIS_DIR);
  const indexFile = path.join(APIS_DIR, 'index.json');
  try {
    const data = await fs.readFile(indexFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function getSampleApiById(id) {
  const apis = await getAllSampleApis();
  return apis.find(a => a.id === id);
}

export async function createSampleApi(name, endpoint, method, requestJson, responseJson, defaultHeaders = {}, responseCapture = []) {
  await ensureDir(APIS_DIR);
  const id = uuidv4();

  const requestSchema = extractSchema(requestJson);
  const responseSchema = extractSchema(responseJson);
  const requestFields = getFields(requestJson);
  const responseFields = getFields(responseJson);

  const api = {
    id,
    name,
    endpoint: endpoint || '/api/endpoint',
    method: method || 'POST',
    defaultHeaders: defaultHeaders || {},
    responseCapture: responseCapture || [],
    request: {
      fileName: `${id}-request.json`,
      schema: requestSchema,
      fields: requestFields,
      sampleData: requestJson
    },
    response: {
      fileName: `${id}-response.json`,
      schema: responseSchema,
      fields: responseFields,
      sampleData: responseJson
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Save the sample JSON files
  await fs.writeFile(
    path.join(APIS_DIR, `${id}-request.json`),
    JSON.stringify(requestJson, null, 2)
  );
  await fs.writeFile(
    path.join(APIS_DIR, `${id}-response.json`),
    JSON.stringify(responseJson, null, 2)
  );

  // Update index
  const apis = await getAllSampleApis();
  apis.push(api);
  await fs.writeFile(
    path.join(APIS_DIR, 'index.json'),
    JSON.stringify(apis, null, 2)
  );

  return api;
}

export async function updateSampleApi(id, name, endpoint, method, requestJson, responseJson, defaultHeaders = {}, responseCapture = []) {
  const apis = await getAllSampleApis();
  const index = apis.findIndex(a => a.id === id);
  if (index === -1) throw new Error('API not found');

  const requestSchema = extractSchema(requestJson);
  const responseSchema = extractSchema(responseJson);
  const requestFields = getFields(requestJson);
  const responseFields = getFields(responseJson);

  apis[index] = {
    ...apis[index],
    name,
    endpoint,
    method,
    defaultHeaders: defaultHeaders || {},
    responseCapture: responseCapture || [],
    request: {
      ...apis[index].request,
      schema: requestSchema,
      fields: requestFields,
      sampleData: requestJson
    },
    response: {
      ...apis[index].response,
      schema: responseSchema,
      fields: responseFields,
      sampleData: responseJson
    },
    updatedAt: new Date().toISOString()
  };

  await fs.writeFile(
    path.join(APIS_DIR, `${id}-request.json`),
    JSON.stringify(requestJson, null, 2)
  );
  await fs.writeFile(
    path.join(APIS_DIR, `${id}-response.json`),
    JSON.stringify(responseJson, null, 2)
  );

  await fs.writeFile(
    path.join(APIS_DIR, 'index.json'),
    JSON.stringify(apis, null, 2)
  );

  return apis[index];
}

export async function deleteSampleApi(id) {
  const apis = await getAllSampleApis();
  const index = apis.findIndex(a => a.id === id);
  if (index === -1) throw new Error('API not found');

  // Delete files
  try {
    await fs.unlink(path.join(APIS_DIR, `${id}-request.json`));
    await fs.unlink(path.join(APIS_DIR, `${id}-response.json`));
  } catch {}

  // Update index
  apis.splice(index, 1);
  await fs.writeFile(
    path.join(APIS_DIR, 'index.json'),
    JSON.stringify(apis, null, 2)
  );

  return { success: true };
}

// ============ CONFIGURATIONS ============

export async function getAllConfigurations() {
  await ensureDir(CONFIGS_DIR);
  const indexFile = path.join(CONFIGS_DIR, 'index.json');
  try {
    const data = await fs.readFile(indexFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function getConfigurationById(id) {
  const configs = await getAllConfigurations();
  return configs.find(c => c.id === id);
}

export async function createConfiguration(config) {
  await ensureDir(CONFIGS_DIR);
  const id = uuidv4();

  const newConfig = {
    id,
    ...config,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const configs = await getAllConfigurations();
  configs.push(newConfig);
  await fs.writeFile(
    path.join(CONFIGS_DIR, 'index.json'),
    JSON.stringify(configs, null, 2)
  );

  return newConfig;
}

export async function updateConfiguration(id, config) {
  const configs = await getAllConfigurations();
  const index = configs.findIndex(c => c.id === id);
  if (index === -1) throw new Error('Configuration not found');

  configs[index] = {
    ...configs[index],
    ...config,
    id,
    updatedAt: new Date().toISOString()
  };

  await fs.writeFile(
    path.join(CONFIGS_DIR, 'index.json'),
    JSON.stringify(configs, null, 2)
  );

  return configs[index];
}

export async function deleteConfiguration(id) {
  const configs = await getAllConfigurations();
  const index = configs.findIndex(c => c.id === id);
  if (index === -1) throw new Error('Configuration not found');

  configs.splice(index, 1);
  await fs.writeFile(
    path.join(CONFIGS_DIR, 'index.json'),
    JSON.stringify(configs, null, 2)
  );

  return { success: true };
}
