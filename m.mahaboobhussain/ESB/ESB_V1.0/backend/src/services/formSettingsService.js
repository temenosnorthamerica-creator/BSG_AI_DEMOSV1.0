import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data/form-settings');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getSettingsPath(apiSampleId) {
  return path.join(DATA_DIR, `${apiSampleId}.json`);
}

export function getFormSettings(apiSampleId) {
  const filePath = getSettingsPath(apiSampleId);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }
  // Return default settings
  return {
    apiSampleId,
    sections: {
      headers: { visible: true, defaultValues: {} }
    },
    fields: {},
    updatedAt: null
  };
}

export function saveFormSettings(apiSampleId, settings) {
  const filePath = getSettingsPath(apiSampleId);
  const data = {
    apiSampleId,
    sections: settings.sections || { headers: { visible: true, defaultValues: {} } },
    fields: settings.fields || {},
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return data;
}

export function deleteFormSettings(apiSampleId) {
  const filePath = getSettingsPath(apiSampleId);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}
