import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VARIABLES_DIR = path.join(__dirname, '../../data/variables');

// Ensure directory exists
async function ensureDir() {
  try {
    await fs.access(VARIABLES_DIR);
  } catch {
    await fs.mkdir(VARIABLES_DIR, { recursive: true });
  }
}

function getFilePath(configId) {
  return path.join(VARIABLES_DIR, `${configId}.json`);
}

// Get all variables for a configuration
export async function getVariables(configId) {
  await ensureDir();
  try {
    const data = await fs.readFile(getFilePath(configId), 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      configId,
      configName: '',
      variables: {},
      updatedAt: null
    };
  }
}

// Get a single variable
export async function getVariable(configId, variableName) {
  const data = await getVariables(configId);
  return data.variables[variableName] || null;
}

// Set a single variable
export async function setVariable(configId, configName, variableName, value, metadata = {}) {
  await ensureDir();
  const data = await getVariables(configId);

  data.configId = configId;
  data.configName = configName || data.configName;
  data.variables[variableName] = {
    value,
    sourcePath: metadata.sourcePath || null,
    capturedFrom: metadata.capturedFrom || null,
    capturedAt: new Date().toISOString()
  };
  data.updatedAt = new Date().toISOString();

  await fs.writeFile(getFilePath(configId), JSON.stringify(data, null, 2));
  return data;
}

// Set multiple variables at once
export async function setVariables(configId, configName, variables) {
  await ensureDir();
  const data = await getVariables(configId);

  data.configId = configId;
  data.configName = configName || data.configName;

  for (const [name, value] of Object.entries(variables)) {
    if (typeof value === 'object' && value !== null && 'value' in value) {
      // Full variable object with metadata
      data.variables[name] = {
        value: value.value,
        sourcePath: value.sourcePath || null,
        capturedFrom: value.capturedFrom || null,
        capturedAt: new Date().toISOString()
      };
    } else {
      // Simple value
      data.variables[name] = {
        value,
        sourcePath: null,
        capturedFrom: configName,
        capturedAt: new Date().toISOString()
      };
    }
  }

  data.updatedAt = new Date().toISOString();

  await fs.writeFile(getFilePath(configId), JSON.stringify(data, null, 2));
  return data;
}

// Update a variable value (for manual edits)
export async function updateVariable(configId, variableName, newValue) {
  await ensureDir();
  const data = await getVariables(configId);

  if (!data.variables[variableName]) {
    throw new Error(`Variable "${variableName}" not found`);
  }

  data.variables[variableName].value = newValue;
  data.variables[variableName].manuallyEdited = true;
  data.variables[variableName].editedAt = new Date().toISOString();
  data.updatedAt = new Date().toISOString();

  await fs.writeFile(getFilePath(configId), JSON.stringify(data, null, 2));
  return data;
}

// Delete a single variable
export async function deleteVariable(configId, variableName) {
  await ensureDir();
  const data = await getVariables(configId);

  if (data.variables[variableName]) {
    delete data.variables[variableName];
    data.updatedAt = new Date().toISOString();
    await fs.writeFile(getFilePath(configId), JSON.stringify(data, null, 2));
  }

  return data;
}

// Clear all variables for a configuration
export async function clearVariables(configId) {
  await ensureDir();
  const data = {
    configId,
    configName: '',
    variables: {},
    updatedAt: new Date().toISOString()
  };

  await fs.writeFile(getFilePath(configId), JSON.stringify(data, null, 2));
  return data;
}

// Substitute variables in a string (handles {{variableName}} syntax)
export function substituteVariables(text, variables) {
  if (typeof text !== 'string') return text;

  const substitutions = [];
  const result = text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    if (variables[varName] !== undefined) {
      const value = typeof variables[varName] === 'object'
        ? variables[varName].value
        : variables[varName];
      substitutions.push({ variable: varName, value });
      return value;
    }
    return match; // Keep original if not found
  });

  return { result, substitutions };
}

// Recursively substitute variables in an object
export function substituteVariablesInObject(obj, variables) {
  const allSubstitutions = [];

  function processValue(value) {
    if (typeof value === 'string') {
      const { result, substitutions } = substituteVariables(value, variables);
      allSubstitutions.push(...substitutions);
      return result;
    } else if (Array.isArray(value)) {
      return value.map(item => processValue(item));
    } else if (typeof value === 'object' && value !== null) {
      const newObj = {};
      for (const [key, val] of Object.entries(value)) {
        newObj[key] = processValue(val);
      }
      return newObj;
    }
    return value;
  }

  const result = processValue(obj);
  return { result, substitutions: allSubstitutions };
}

// Extract value from response using dot notation path
export function extractValueFromResponse(response, path) {
  const parts = path.split('.');
  let current = response;

  for (const part of parts) {
    if (current === undefined || current === null) {
      return undefined;
    }

    // Handle array notation like "items[0]"
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      current = current[key]?.[parseInt(index, 10)];
    } else {
      current = current[part];
    }
  }

  return current;
}

// Capture variables from API response based on capture rules
export async function captureFromResponse(configId, configName, response, captureRules) {
  if (!captureRules || captureRules.length === 0) {
    return { captured: [], variables: {} };
  }

  const captured = [];
  const variablesToSet = {};

  for (const rule of captureRules) {
    const { variableName, responsePath } = rule;
    const value = extractValueFromResponse(response, responsePath);

    if (value !== undefined) {
      variablesToSet[variableName] = {
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        sourcePath: responsePath,
        capturedFrom: configName
      };
      captured.push({
        variableName,
        responsePath,
        value: variablesToSet[variableName].value
      });
    }
  }

  if (Object.keys(variablesToSet).length > 0) {
    await setVariables(configId, configName, variablesToSet);
  }

  return { captured, variables: variablesToSet };
}

// Get all configurations that have variables
export async function getAllVariableConfigs() {
  await ensureDir();
  try {
    const files = await fs.readdir(VARIABLES_DIR);
    const configs = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const data = await fs.readFile(path.join(VARIABLES_DIR, file), 'utf-8');
          const parsed = JSON.parse(data);
          if (Object.keys(parsed.variables || {}).length > 0) {
            configs.push({
              configId: parsed.configId,
              configName: parsed.configName,
              variableCount: Object.keys(parsed.variables).length,
              updatedAt: parsed.updatedAt
            });
          }
        } catch {
          // Skip invalid files
        }
      }
    }

    return configs;
  } catch {
    return [];
  }
}
