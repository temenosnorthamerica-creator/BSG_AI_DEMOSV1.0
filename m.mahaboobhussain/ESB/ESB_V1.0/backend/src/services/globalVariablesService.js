import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const VARIABLES_FILE = path.join(DATA_DIR, 'environment-variables.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    // Directory exists
  }
}

// Load variables from file
async function loadVariables() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(VARIABLES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { variables: {}, metadata: { updatedAt: null } };
    }
    throw err;
  }
}

// Save variables to file
async function saveVariables(data) {
  await ensureDataDir();
  data.metadata = { updatedAt: new Date().toISOString() };
  await fs.writeFile(VARIABLES_FILE, JSON.stringify(data, null, 2));
}

// Get all variables
export async function getAll() {
  const data = await loadVariables();
  return data.variables || {};
}

// Get a single variable
export async function get(name) {
  const variables = await getAll();
  return variables[name];
}

// Set a variable (create or update)
export async function set(name, value, description = '') {
  const data = await loadVariables();
  if (!data.variables) {
    data.variables = {};
  }
  data.variables[name] = {
    value,
    description,
    updatedAt: new Date().toISOString()
  };
  await saveVariables(data);
  return data.variables[name];
}

// Delete a variable
export async function remove(name) {
  const data = await loadVariables();
  if (data.variables && data.variables[name]) {
    delete data.variables[name];
    await saveVariables(data);
    return true;
  }
  return false;
}

// Clear all variables
export async function clearAll() {
  await saveVariables({ variables: {}, metadata: { updatedAt: new Date().toISOString() } });
}

// Substitute variables in a string
export function substituteInString(str, variables) {
  if (typeof str !== 'string') return str;

  return str.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
    const trimmedName = varName.trim();
    if (variables[trimmedName] !== undefined) {
      return variables[trimmedName].value !== undefined
        ? variables[trimmedName].value
        : variables[trimmedName];
    }
    return match; // Keep original if variable not found
  });
}

// Substitute variables in an object (recursive)
export function substituteInObject(obj, variables) {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return substituteInString(obj, variables);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => substituteInObject(item, variables));
  }

  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = substituteInObject(value, variables);
    }
    return result;
  }

  return obj;
}

// Capture variables from an API response based on capture rules
export async function captureFromResponse(response, captureRules) {
  if (!captureRules || !Array.isArray(captureRules) || captureRules.length === 0) {
    return [];
  }

  const captured = [];

  for (const rule of captureRules) {
    const { variableName } = rule;
    // Support both 'responsePath' (frontend) and 'sourcePath' (legacy) field names
    const path = rule.responsePath || rule.sourcePath;
    if (!variableName || !path) continue;

    try {
      const value = extractValueFromResponse(response, path);
      if (value !== undefined) {
        await set(variableName, String(value), `Captured from ${path}`);
        captured.push({ variableName, value, responsePath: path });
      }
    } catch (err) {
      console.error(`Failed to capture variable ${variableName}:`, err.message);
    }
  }

  return captured;
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

// Find all variable references in an object
export function findVariableReferences(obj, path = '') {
  const references = [];

  if (obj === null || obj === undefined) return references;

  if (typeof obj === 'string') {
    const pattern = /\{\{([^}]+)\}\}/g;
    let match;
    while ((match = pattern.exec(obj)) !== null) {
      references.push({
        path,
        variableName: match[1].trim(),
        fullMatch: match[0]
      });
    }
    return references;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const itemRefs = findVariableReferences(item, `${path}[${index}]`);
      references.push(...itemRefs);
    });
    return references;
  }

  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const newPath = path ? `${path}.${key}` : key;
      const valueRefs = findVariableReferences(value, newPath);
      references.push(...valueRefs);
    }
  }

  return references;
}
