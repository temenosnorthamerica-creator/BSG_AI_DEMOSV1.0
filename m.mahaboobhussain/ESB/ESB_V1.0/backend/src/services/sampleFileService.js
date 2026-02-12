import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const FILES_DIR = path.join(DATA_DIR, 'samples/files');
const PROCESSING_DIR = path.join(DATA_DIR, 'file-processing');

// Ensure directories exist
async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// ============ SAMPLE FILE DEFINITIONS ============

export async function getAllSampleFiles() {
  await ensureDir(FILES_DIR);
  const indexFile = path.join(FILES_DIR, 'index.json');
  try {
    const data = await fs.readFile(indexFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function getSampleFileById(id) {
  const files = await getAllSampleFiles();
  return files.find(f => f.id === id);
}

export async function createSampleFile(definition) {
  await ensureDir(FILES_DIR);
  const id = uuidv4();

  const sampleFile = {
    id,
    name: definition.name,
    description: definition.description || '',
    // File format settings
    fileFormat: {
      delimiter: definition.delimiter || ',',
      hasHeader: definition.hasHeader !== false,
      headerRowCount: definition.headerRowCount || 1,
      footerRowCount: definition.footerRowCount || 0,
      textQualifier: definition.textQualifier || '"',
      encoding: definition.encoding || 'utf-8'
    },
    // Column definitions
    columns: definition.columns || [],
    // Target API configuration
    targetApi: {
      apiSampleId: definition.apiSampleId || null,
      apiSampleName: definition.apiSampleName || ''
    },
    // Field mapping: CSV column name -> API field path
    fieldMapping: definition.fieldMapping || {},
    // Static fields: API field path -> static value (supports {{variables}})
    staticFields: definition.staticFields || {},
    // Response capture: which response fields to capture for history display
    responseCapture: definition.responseCapture || [],
    // Display preferences for history view
    displayPreferences: {
      sourceFields: definition.displaySourceFields || [],
      responseFields: definition.displayResponseFields || []
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Update index
  const files = await getAllSampleFiles();
  files.push(sampleFile);
  await fs.writeFile(
    path.join(FILES_DIR, 'index.json'),
    JSON.stringify(files, null, 2)
  );

  return sampleFile;
}

export async function updateSampleFile(id, definition) {
  const files = await getAllSampleFiles();
  const index = files.findIndex(f => f.id === id);
  if (index === -1) throw new Error('Sample file definition not found');

  files[index] = {
    ...files[index],
    name: definition.name !== undefined ? definition.name : files[index].name,
    description: definition.description !== undefined ? definition.description : files[index].description,
    fileFormat: {
      ...files[index].fileFormat,
      ...(definition.delimiter !== undefined && { delimiter: definition.delimiter }),
      ...(definition.hasHeader !== undefined && { hasHeader: definition.hasHeader }),
      ...(definition.headerRowCount !== undefined && { headerRowCount: definition.headerRowCount }),
      ...(definition.footerRowCount !== undefined && { footerRowCount: definition.footerRowCount }),
      ...(definition.textQualifier !== undefined && { textQualifier: definition.textQualifier }),
      ...(definition.encoding !== undefined && { encoding: definition.encoding })
    },
    columns: definition.columns !== undefined ? definition.columns : files[index].columns,
    targetApi: {
      ...files[index].targetApi,
      ...(definition.apiSampleId !== undefined && { apiSampleId: definition.apiSampleId }),
      ...(definition.apiSampleName !== undefined && { apiSampleName: definition.apiSampleName })
    },
    fieldMapping: definition.fieldMapping !== undefined ? definition.fieldMapping : files[index].fieldMapping,
    staticFields: definition.staticFields !== undefined ? definition.staticFields : files[index].staticFields,
    responseCapture: definition.responseCapture !== undefined ? definition.responseCapture : files[index].responseCapture,
    displayPreferences: {
      sourceFields: definition.displaySourceFields !== undefined ? definition.displaySourceFields : files[index].displayPreferences?.sourceFields || [],
      responseFields: definition.displayResponseFields !== undefined ? definition.displayResponseFields : files[index].displayPreferences?.responseFields || []
    },
    updatedAt: new Date().toISOString()
  };

  await fs.writeFile(
    path.join(FILES_DIR, 'index.json'),
    JSON.stringify(files, null, 2)
  );

  return files[index];
}

export async function deleteSampleFile(id) {
  const files = await getAllSampleFiles();
  const index = files.findIndex(f => f.id === id);
  if (index === -1) throw new Error('Sample file definition not found');

  files.splice(index, 1);
  await fs.writeFile(
    path.join(FILES_DIR, 'index.json'),
    JSON.stringify(files, null, 2)
  );

  // Also delete any processing history for this file definition
  try {
    await fs.unlink(path.join(PROCESSING_DIR, `${id}.json`));
  } catch {}

  return { success: true };
}

// ============ BATCH PROCESSING ============

// Get all batches for a file definition
export async function getBatches(sampleFileId) {
  await ensureDir(PROCESSING_DIR);
  const batchesFile = path.join(PROCESSING_DIR, `${sampleFileId}-batches.json`);
  try {
    const data = await fs.readFile(batchesFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Get a single batch by ID
export async function getBatchById(sampleFileId, batchId) {
  const batches = await getBatches(sampleFileId);
  return batches.find(b => b.id === batchId);
}

// Create a new batch (called when file processing starts)
export async function createBatch(sampleFileId, batchInfo) {
  await ensureDir(PROCESSING_DIR);
  const batchesFile = path.join(PROCESSING_DIR, `${sampleFileId}-batches.json`);

  const batches = await getBatches(sampleFileId);

  const newBatch = {
    id: uuidv4(),
    fileName: batchInfo.fileName || 'Unknown',
    fileSize: batchInfo.fileSize || 0,
    totalRows: batchInfo.totalRows || 0,
    successfulRows: 0,
    failedRows: 0,
    status: 'processing',
    loadedAt: new Date().toISOString(),
    processedAt: null
  };

  batches.unshift(newBatch);

  // Keep last 100 batches
  if (batches.length > 100) {
    batches.length = 100;
  }

  await fs.writeFile(batchesFile, JSON.stringify(batches, null, 2));

  return newBatch;
}

// Update batch after processing completes
export async function updateBatch(sampleFileId, batchId, updates) {
  const batchesFile = path.join(PROCESSING_DIR, `${sampleFileId}-batches.json`);
  const batches = await getBatches(sampleFileId);

  const index = batches.findIndex(b => b.id === batchId);
  if (index === -1) throw new Error('Batch not found');

  batches[index] = {
    ...batches[index],
    ...updates
  };

  await fs.writeFile(batchesFile, JSON.stringify(batches, null, 2));

  return batches[index];
}

// Delete a batch and its records
export async function deleteBatch(sampleFileId, batchId) {
  // Delete batch from batches list
  const batchesFile = path.join(PROCESSING_DIR, `${sampleFileId}-batches.json`);
  const batches = await getBatches(sampleFileId);
  const index = batches.findIndex(b => b.id === batchId);
  if (index === -1) throw new Error('Batch not found');

  batches.splice(index, 1);
  await fs.writeFile(batchesFile, JSON.stringify(batches, null, 2));

  // Delete associated records
  const records = await getProcessingHistory(sampleFileId);
  const filteredRecords = records.filter(r => r.batchId !== batchId);
  const historyFile = path.join(PROCESSING_DIR, `${sampleFileId}.json`);
  await fs.writeFile(historyFile, JSON.stringify(filteredRecords, null, 2));

  return { success: true };
}

// Clear all batches and records for a file definition
export async function clearAllBatches(sampleFileId) {
  await ensureDir(PROCESSING_DIR);

  const batchesFile = path.join(PROCESSING_DIR, `${sampleFileId}-batches.json`);
  const historyFile = path.join(PROCESSING_DIR, `${sampleFileId}.json`);

  await fs.writeFile(batchesFile, JSON.stringify([], null, 2));
  await fs.writeFile(historyFile, JSON.stringify([], null, 2));

  return { success: true };
}

// ============ FILE PROCESSING RECORDS ============

export async function getProcessingHistory(sampleFileId) {
  await ensureDir(PROCESSING_DIR);
  const historyFile = path.join(PROCESSING_DIR, `${sampleFileId}.json`);
  try {
    const data = await fs.readFile(historyFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Get records for a specific batch
export async function getBatchRecords(sampleFileId, batchId) {
  const allRecords = await getProcessingHistory(sampleFileId);
  return allRecords.filter(r => r.batchId === batchId);
}

export async function addProcessingRecord(sampleFileId, record) {
  await ensureDir(PROCESSING_DIR);
  const historyFile = path.join(PROCESSING_DIR, `${sampleFileId}.json`);

  const history = await getProcessingHistory(sampleFileId);

  const newRecord = {
    id: uuidv4(),
    ...record,
    timestamp: new Date().toISOString()
  };

  history.unshift(newRecord); // Add to beginning (most recent first)

  // Keep last 5000 records
  if (history.length > 5000) {
    history.length = 5000;
  }

  await fs.writeFile(historyFile, JSON.stringify(history, null, 2));

  return newRecord;
}

export async function clearProcessingHistory(sampleFileId) {
  await ensureDir(PROCESSING_DIR);
  const historyFile = path.join(PROCESSING_DIR, `${sampleFileId}.json`);
  const batchesFile = path.join(PROCESSING_DIR, `${sampleFileId}-batches.json`);

  await fs.writeFile(historyFile, JSON.stringify([], null, 2));
  await fs.writeFile(batchesFile, JSON.stringify([], null, 2));

  return { success: true };
}

export async function getProcessingRecordById(sampleFileId, recordId) {
  const history = await getProcessingHistory(sampleFileId);
  return history.find(r => r.id === recordId);
}

export async function deleteProcessingRecord(sampleFileId, recordId) {
  const history = await getProcessingHistory(sampleFileId);
  const index = history.findIndex(r => r.id === recordId);
  if (index === -1) throw new Error('Processing record not found');

  history.splice(index, 1);

  const historyFile = path.join(PROCESSING_DIR, `${sampleFileId}.json`);
  await fs.writeFile(historyFile, JSON.stringify(history, null, 2));

  return { success: true };
}

// Get all file definitions that have processing history
export async function getAllFilesWithHistory() {
  await ensureDir(PROCESSING_DIR);
  const files = await getAllSampleFiles();
  const result = [];

  for (const file of files) {
    const batches = await getBatches(file.id);
    if (batches.length > 0) {
      result.push({
        ...file,
        batchCount: batches.length,
        lastProcessed: batches[0]?.processedAt || batches[0]?.loadedAt
      });
    }
  }

  return result;
}

// Get summary statistics for a file's processing history
export async function getProcessingSummary(sampleFileId) {
  const batches = await getBatches(sampleFileId);

  if (batches.length === 0) {
    return {
      totalBatches: 0,
      totalRecords: 0,
      successfulRecords: 0,
      failedRecords: 0,
      successRate: 0
    };
  }

  let totalRecords = 0;
  let successfulRecords = 0;
  let failedRecords = 0;

  for (const batch of batches) {
    totalRecords += batch.totalRows || 0;
    successfulRecords += batch.successfulRows || 0;
    failedRecords += batch.failedRows || 0;
  }

  return {
    totalBatches: batches.length,
    totalRecords,
    successfulRecords,
    failedRecords,
    successRate: totalRecords > 0 ? Math.round((successfulRecords / totalRecords) * 100) : 0
  };
}
