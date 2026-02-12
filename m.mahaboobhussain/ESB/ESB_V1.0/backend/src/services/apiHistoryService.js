import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const API_HISTORY_DIR = path.join(DATA_DIR, 'api-history');

// Ensure directory exists
async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Get history file path for an API sample
function getHistoryFilePath(apiSampleId) {
  return path.join(API_HISTORY_DIR, `${apiSampleId}-history.json`);
}

/**
 * Get all API samples that have history records
 * @returns {Array} List of API sample IDs with history
 */
export async function getApiSamplesWithHistory() {
  await ensureDir(API_HISTORY_DIR);

  try {
    const files = await fs.readdir(API_HISTORY_DIR);
    const historyFiles = files.filter(f => f.endsWith('-history.json'));

    const summaries = await Promise.all(historyFiles.map(async (file) => {
      const apiSampleId = file.replace('-history.json', '');
      const filePath = path.join(API_HISTORY_DIR, file);

      try {
        const data = await fs.readFile(filePath, 'utf-8');
        const history = JSON.parse(data);

        if (history.length === 0) return null;

        const successCount = history.filter(h => h.success).length;
        const failedCount = history.filter(h => !h.success).length;

        return {
          apiSampleId,
          apiSampleName: history[0]?.apiSampleName || 'Unknown',
          totalCount: history.length,
          successCount,
          failedCount,
          lastExecutedAt: history[history.length - 1]?.executedAt
        };
      } catch {
        return null;
      }
    }));

    return summaries.filter(s => s !== null);
  } catch {
    return [];
  }
}

/**
 * Get history for an API sample
 * @param {string} apiSampleId
 * @param {Object} filters - Optional filters { search, fromDate, toDate }
 * @returns {Array} History records
 */
export async function getHistory(apiSampleId, filters = {}) {
  await ensureDir(API_HISTORY_DIR);
  const filePath = getHistoryFilePath(apiSampleId);

  let history = [];
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    history = JSON.parse(data);
  } catch {
    return [];
  }

  // Apply filters
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    history = history.filter(h => {
      const requestStr = JSON.stringify(h.requestBody || {}).toLowerCase();
      const responseStr = JSON.stringify(h.responseBody || {}).toLowerCase();
      const endpointStr = (h.endpoint || '').toLowerCase();
      return requestStr.includes(searchLower) ||
             responseStr.includes(searchLower) ||
             endpointStr.includes(searchLower);
    });
  }

  if (filters.fromDate) {
    const fromTime = new Date(filters.fromDate).getTime();
    history = history.filter(h => new Date(h.executedAt).getTime() >= fromTime);
  }

  if (filters.toDate) {
    const toTime = new Date(filters.toDate).getTime() + (24 * 60 * 60 * 1000);
    history = history.filter(h => new Date(h.executedAt).getTime() <= toTime);
  }

  // Sort by executedAt descending (most recent first)
  history.sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt));

  return history;
}

/**
 * Get summary for an API sample history
 * @param {string} apiSampleId
 * @returns {Object} Summary with counts and last executed time
 */
export async function getHistorySummary(apiSampleId) {
  const history = await getHistory(apiSampleId);

  const successCount = history.filter(h => h.success).length;
  const failedCount = history.filter(h => !h.success).length;

  return {
    apiSampleId,
    totalCount: history.length,
    successCount,
    failedCount,
    lastExecutedAt: history.length > 0 ? history[0].executedAt : null
  };
}

/**
 * Add a history record for an API call
 * @param {Object} record - History record data
 */
export async function addHistoryRecord(record) {
  await ensureDir(API_HISTORY_DIR);
  const filePath = getHistoryFilePath(record.apiSampleId);

  let history = [];
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    history = JSON.parse(data);
  } catch {
    history = [];
  }

  const historyRecord = {
    id: uuidv4(),
    apiSampleId: record.apiSampleId,
    apiSampleName: record.apiSampleName,
    endpoint: record.endpoint,
    method: record.method,
    requestHeaders: record.requestHeaders || {},
    requestBody: record.requestBody || {},
    responseStatus: record.responseStatus,
    responseStatusText: record.responseStatusText,
    responseBody: record.responseBody,
    capturedVariables: record.capturedVariables || [],
    duration: record.duration,
    success: record.success,
    executedAt: new Date().toISOString()
  };

  history.push(historyRecord);

  await fs.writeFile(filePath, JSON.stringify(history, null, 2));

  return historyRecord;
}

/**
 * Clear all history for an API sample
 * @param {string} apiSampleId
 */
export async function clearHistory(apiSampleId) {
  await ensureDir(API_HISTORY_DIR);
  const filePath = getHistoryFilePath(apiSampleId);

  try {
    await fs.unlink(filePath);
  } catch {}

  return { success: true, message: 'API history cleared' };
}

/**
 * Remove a single history record
 * @param {string} apiSampleId
 * @param {string} historyId
 */
export async function removeHistoryRecord(apiSampleId, historyId) {
  await ensureDir(API_HISTORY_DIR);
  const filePath = getHistoryFilePath(apiSampleId);

  let history = [];
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    history = JSON.parse(data);
  } catch {
    throw new Error('No history found');
  }

  const index = history.findIndex(h => h.id === historyId);

  if (index === -1) {
    throw new Error('History record not found');
  }

  history.splice(index, 1);
  await fs.writeFile(filePath, JSON.stringify(history, null, 2));

  return { success: true, message: 'History record removed' };
}
