import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const OFFSETS_DIR = path.join(DATA_DIR, 'offsets');

// Per-file async lock to prevent concurrent read/write on Windows
const lockQueues = new Map();

async function withFileLock(lockKey, fn) {
  if (!lockQueues.has(lockKey)) {
    lockQueues.set(lockKey, Promise.resolve());
  }

  const previousLock = lockQueues.get(lockKey);

  let releaseLock;
  const currentLock = new Promise(resolve => { releaseLock = resolve; });
  lockQueues.set(lockKey, currentLock);

  // Wait for previous operation on the same file to complete
  await previousLock;

  try {
    return await fn();
  } finally {
    releaseLock();
  }
}

// Ensure directory exists
async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Get offsets file path for a config
function getOffsetsFilePath(configId) {
  return path.join(OFFSETS_DIR, `${configId}-offsets.json`);
}

// Get failed events file path for a config
function getFailedFilePath(configId) {
  return path.join(OFFSETS_DIR, `${configId}-failed.json`);
}

// Get successful/processed events file path for a config
function getProcessedFilePath(configId) {
  return path.join(OFFSETS_DIR, `${configId}-processed.json`);
}

// ============ OFFSET TRACKING ============

/**
 * Get saved offsets for a configuration
 * @param {string} configId
 * @returns {Object} Offset data with partitions
 */
export async function getOffsets(configId) {
  return withFileLock(`${configId}-offsets`, async () => {
    await ensureDir(OFFSETS_DIR);
    const filePath = getOffsetsFilePath(configId);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return {
        configId,
        partitions: {},
        lastUpdated: null,
        totalProcessed: 0
      };
    }
  });
}

/**
 * Save offset after successful processing
 * @param {string} configId
 * @param {string} configName
 * @param {string} partitionId
 * @param {string} offset
 * @param {number} sequenceNumber
 */
export async function saveOffset(configId, configName, partitionId, offset, sequenceNumber) {
  return withFileLock(`${configId}-offsets`, async () => {
    await ensureDir(OFFSETS_DIR);
    const filePath = getOffsetsFilePath(configId);

    let offsetData;
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      offsetData = JSON.parse(data);
    } catch {
      offsetData = { configId, partitions: {}, lastUpdated: null, totalProcessed: 0 };
    }

    // Update partition offset
    offsetData.partitions[partitionId] = {
      offset,
      sequenceNumber,
      lastProcessedAt: new Date().toISOString()
    };

    offsetData.configId = configId;
    offsetData.configName = configName;
    offsetData.lastUpdated = new Date().toISOString();
    offsetData.totalProcessed = (offsetData.totalProcessed || 0) + 1;

    await fs.writeFile(filePath, JSON.stringify(offsetData, null, 2));
    return offsetData;
  });
}

/**
 * Clear all offsets for a configuration (reset)
 * @param {string} configId
 */
export async function clearOffsets(configId) {
  return withFileLock(`${configId}-offsets`, async () => {
    await ensureDir(OFFSETS_DIR);
    const filePath = getOffsetsFilePath(configId);
    try {
      await fs.unlink(filePath);
    } catch {}
    return { success: true, message: 'Offsets cleared' };
  });
}

/**
 * Check if an event should be skipped (already processed or failed)
 * @param {string} configId
 * @param {string} partitionId
 * @param {string} offset
 * @param {number} sequenceNumber
 * @returns {Object} { skip: boolean, reason: string }
 */
export async function shouldSkipEvent(configId, partitionId, offset, sequenceNumber) {
  // Check if already processed via offset tracking
  const offsetData = await getOffsets(configId);
  const partitionOffset = offsetData.partitions[partitionId];

  if (partitionOffset) {
    // Skip if sequence number is less than or equal to already processed
    if (sequenceNumber <= partitionOffset.sequenceNumber) {
      return {
        skip: true,
        reason: 'already_processed',
        message: `Event already processed (seq: ${sequenceNumber} <= ${partitionOffset.sequenceNumber})`
      };
    }
  }

  // Check if in failed events archive
  const failedEvents = await getFailedEvents(configId);
  const isArchived = failedEvents.some(fe =>
    fe.partitionId === partitionId &&
    fe.sequenceNumber === sequenceNumber
  );

  if (isArchived) {
    return {
      skip: true,
      reason: 'archived_failed',
      message: `Event is in failed archive (seq: ${sequenceNumber})`
    };
  }

  return { skip: false };
}

// ============ FAILED EVENTS ARCHIVE ============

/**
 * Get all failed events for a configuration
 * @param {string} configId
 * @returns {Array} Failed events
 */
export async function getFailedEvents(configId) {
  return withFileLock(`${configId}-failed`, async () => {
    await ensureDir(OFFSETS_DIR);
    const filePath = getFailedFilePath(configId);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  });
}

/**
 * Archive a failed event
 * @param {string} configId
 * @param {string} configName
 * @param {Object} eventData - { partitionId, offset, sequenceNumber, body, error }
 */
export async function archiveFailedEvent(configId, configName, eventData) {
  return withFileLock(`${configId}-failed`, async () => {
    await ensureDir(OFFSETS_DIR);
    const filePath = getFailedFilePath(configId);

    let failedEvents = [];
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      failedEvents = JSON.parse(data);
    } catch {
      failedEvents = [];
    }

    // Check if already archived (avoid duplicates)
    const exists = failedEvents.some(fe =>
      fe.partitionId === eventData.partitionId &&
      fe.sequenceNumber === eventData.sequenceNumber
    );

    if (!exists) {
      failedEvents.push({
        id: uuidv4(),
        configId,
        configName,
        partitionId: eventData.partitionId,
        offset: eventData.offset,
        sequenceNumber: eventData.sequenceNumber,
        body: eventData.body,
        error: eventData.error,
        failedAt: new Date().toISOString()
      });

      await fs.writeFile(filePath, JSON.stringify(failedEvents, null, 2));
    }

    return failedEvents;
  });
}

/**
 * Clear all failed events for a configuration (allows retry)
 * @param {string} configId
 */
export async function clearFailedEvents(configId) {
  return withFileLock(`${configId}-failed`, async () => {
    await ensureDir(OFFSETS_DIR);
    const filePath = getFailedFilePath(configId);
    try {
      await fs.unlink(filePath);
    } catch {}
    return { success: true, message: 'Failed events cleared - they will be retried on next run' };
  });
}

/**
 * Remove a single failed event from the archive
 * @param {string} configId
 * @param {string} eventId
 */
export async function removeFailedEvent(configId, eventId) {
  return withFileLock(`${configId}-failed`, async () => {
    await ensureDir(OFFSETS_DIR);
    const filePath = getFailedFilePath(configId);

    let failedEvents = [];
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      failedEvents = JSON.parse(data);
    } catch {
      throw new Error('Failed event not found');
    }

    const index = failedEvents.findIndex(fe => fe.id === eventId);

    if (index === -1) {
      throw new Error('Failed event not found');
    }

    failedEvents.splice(index, 1);
    await fs.writeFile(filePath, JSON.stringify(failedEvents, null, 2));

    return { success: true, message: 'Failed event removed - it will be retried on next run' };
  });
}

/**
 * Get summary of offset tracking for a config
 * @param {string} configId
 * @returns {Object} Summary with offsets and failed count
 */
export async function getOffsetSummary(configId) {
  const offsets = await getOffsets(configId);
  const failedEvents = await getFailedEvents(configId);
  const successfulEvents = await getSuccessfulEvents(configId);

  return {
    configId,
    configName: offsets.configName || null,
    lastUpdated: offsets.lastUpdated,
    totalProcessed: offsets.totalProcessed || 0,
    partitions: Object.entries(offsets.partitions || {}).map(([partitionId, data]) => ({
      partitionId,
      ...data
    })),
    failedCount: failedEvents.length,
    successCount: successfulEvents.length
  };
}

// ============ SUCCESSFUL EVENTS ARCHIVE ============

/**
 * Get all successful/processed events for a configuration
 * @param {string} configId
 * @param {Object} filters - Optional filters { search, partitionId, fromDate, toDate }
 * @returns {Array} Successful events
 */
export async function getSuccessfulEvents(configId, filters = {}) {
  return withFileLock(`${configId}-processed`, async () => {
    await ensureDir(OFFSETS_DIR);
    const filePath = getProcessedFilePath(configId);

    let events = [];
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      events = JSON.parse(data);
    } catch {
      return [];
    }

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      events = events.filter(e => {
        const bodyStr = JSON.stringify(e.sourceData || {}).toLowerCase();
        const mappedStr = JSON.stringify(e.mappedRequest || {}).toLowerCase();
        return bodyStr.includes(searchLower) || mappedStr.includes(searchLower);
      });
    }

    if (filters.partitionId !== undefined && filters.partitionId !== '') {
      events = events.filter(e => e.partitionId === filters.partitionId);
    }

    if (filters.fromDate) {
      const fromTime = new Date(filters.fromDate).getTime();
      events = events.filter(e => new Date(e.processedAt).getTime() >= fromTime);
    }

    if (filters.toDate) {
      const toTime = new Date(filters.toDate).getTime() + (24 * 60 * 60 * 1000); // Include full day
      events = events.filter(e => new Date(e.processedAt).getTime() <= toTime);
    }

    // Sort by processedAt descending (most recent first)
    events.sort((a, b) => new Date(b.processedAt) - new Date(a.processedAt));

    return events;
  });
}

/**
 * Archive a successful event with full details
 * @param {string} configId
 * @param {string} configName
 * @param {Object} eventData - { partitionId, offset, sequenceNumber, sourceData, mappedRequest, apiResponse }
 */
export async function archiveSuccessfulEvent(configId, configName, eventData) {
  return withFileLock(`${configId}-processed`, async () => {
    await ensureDir(OFFSETS_DIR);
    const filePath = getProcessedFilePath(configId);

    let successfulEvents = [];
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      successfulEvents = JSON.parse(data);
    } catch {
      successfulEvents = [];
    }

    // Check if already archived (avoid duplicates)
    const exists = successfulEvents.some(se =>
      se.partitionId === eventData.partitionId &&
      se.sequenceNumber === eventData.sequenceNumber
    );

    if (!exists) {
      successfulEvents.push({
        id: uuidv4(),
        configId,
        configName,
        partitionId: eventData.partitionId,
        offset: eventData.offset,
        sequenceNumber: eventData.sequenceNumber,
        sourceData: eventData.sourceData,
        mappedRequest: eventData.mappedRequest,
        apiResponse: eventData.apiResponse,
        processedAt: new Date().toISOString()
      });

      await fs.writeFile(filePath, JSON.stringify(successfulEvents, null, 2));
    }

    return successfulEvents;
  });
}

/**
 * Clear all successful events for a configuration
 * @param {string} configId
 */
export async function clearSuccessfulEvents(configId) {
  return withFileLock(`${configId}-processed`, async () => {
    await ensureDir(OFFSETS_DIR);
    const filePath = getProcessedFilePath(configId);
    try {
      await fs.unlink(filePath);
    } catch {}
    return { success: true, message: 'Successful events history cleared' };
  });
}

/**
 * Remove a single successful event from the archive
 * @param {string} configId
 * @param {string} eventId
 */
export async function removeSuccessfulEvent(configId, eventId) {
  return withFileLock(`${configId}-processed`, async () => {
    await ensureDir(OFFSETS_DIR);
    const filePath = getProcessedFilePath(configId);

    let successfulEvents = [];
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      successfulEvents = JSON.parse(data);
    } catch {
      throw new Error('No successful events found');
    }

    const index = successfulEvents.findIndex(se => se.id === eventId);

    if (index === -1) {
      throw new Error('Successful event not found');
    }

    successfulEvents.splice(index, 1);
    await fs.writeFile(filePath, JSON.stringify(successfulEvents, null, 2));

    return { success: true, message: 'Successful event removed from history' };
  });
}

/**
 * Get unique partition IDs from successful events (for filter dropdown)
 * @param {string} configId
 * @returns {Array} List of partition IDs
 */
export async function getSuccessfulEventPartitions(configId) {
  const events = await getSuccessfulEvents(configId);
  const partitions = [...new Set(events.map(e => e.partitionId))];
  return partitions.sort();
}

// ============ DISPLAY FIELD PREFERENCES ============

// Get display preferences file path for a config
function getDisplayPrefsFilePath(configId) {
  return path.join(OFFSETS_DIR, `${configId}-display-prefs.json`);
}

/**
 * Get display field preferences for a configuration
 * @param {string} configId
 * @returns {Object} Display preferences { sourceFields: [], responseFields: [] }
 */
export async function getDisplayPreferences(configId) {
  await ensureDir(OFFSETS_DIR);
  const filePath = getDisplayPrefsFilePath(configId);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      configId,
      sourceFields: [],
      responseFields: [],
      updatedAt: null
    };
  }
}

/**
 * Save display field preferences for a configuration
 * @param {string} configId
 * @param {Array} sourceFields - Fields from source event to display
 * @param {Array} responseFields - Fields from API response to display
 */
export async function saveDisplayPreferences(configId, sourceFields = [], responseFields = []) {
  await ensureDir(OFFSETS_DIR);
  const filePath = getDisplayPrefsFilePath(configId);

  const prefs = {
    configId,
    sourceFields,
    responseFields,
    updatedAt: new Date().toISOString()
  };

  await fs.writeFile(filePath, JSON.stringify(prefs, null, 2));
  return prefs;
}

/**
 * Clear display preferences for a configuration
 * @param {string} configId
 */
export async function clearDisplayPreferences(configId) {
  await ensureDir(OFFSETS_DIR);
  const filePath = getDisplayPrefsFilePath(configId);
  try {
    await fs.unlink(filePath);
  } catch {}
  return { success: true, message: 'Display preferences cleared' };
}
