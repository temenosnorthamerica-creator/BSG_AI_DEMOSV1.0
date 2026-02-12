import { Router } from 'express';
import * as sampleFileService from '../services/sampleFileService.js';

export const sampleFilesRouter = Router();

// ============ SAMPLE FILE DEFINITIONS ============

// GET /api/sample-files - Get all sample file definitions
sampleFilesRouter.get('/', async (req, res) => {
  try {
    const files = await sampleFileService.getAllSampleFiles();
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sample-files/:id - Get a sample file definition by ID
sampleFilesRouter.get('/:id', async (req, res) => {
  try {
    const file = await sampleFileService.getSampleFileById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'Sample file definition not found' });
    }
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sample-files - Create a new sample file definition
sampleFilesRouter.post('/', async (req, res) => {
  try {
    const { name, description, delimiter, hasHeader, headerRowCount, footerRowCount,
      textQualifier, encoding, columns, apiSampleId, apiSampleName,
      fieldMapping, staticFields, responseCapture, displaySourceFields, displayResponseFields } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const file = await sampleFileService.createSampleFile({
      name,
      description,
      delimiter,
      hasHeader,
      headerRowCount,
      footerRowCount,
      textQualifier,
      encoding,
      columns,
      apiSampleId,
      apiSampleName,
      fieldMapping,
      staticFields,
      responseCapture,
      displaySourceFields,
      displayResponseFields
    });

    res.status(201).json(file);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/sample-files/:id - Update a sample file definition
sampleFilesRouter.put('/:id', async (req, res) => {
  try {
    const file = await sampleFileService.updateSampleFile(req.params.id, req.body);
    res.json(file);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/sample-files/:id - Delete a sample file definition
sampleFilesRouter.delete('/:id', async (req, res) => {
  try {
    await sampleFileService.deleteSampleFile(req.params.id);
    res.json({ success: true });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// ============ BATCH PROCESSING ============

// GET /api/sample-files/history/all - Get all files with processing history
sampleFilesRouter.get('/history/all', async (req, res) => {
  try {
    const files = await sampleFileService.getAllFilesWithHistory();
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sample-files/:id/batches - Get all batches for a file definition
sampleFilesRouter.get('/:id/batches', async (req, res) => {
  try {
    const batches = await sampleFileService.getBatches(req.params.id);
    res.json(batches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sample-files/:id/batches/:batchId - Get a specific batch
sampleFilesRouter.get('/:id/batches/:batchId', async (req, res) => {
  try {
    const batch = await sampleFileService.getBatchById(req.params.id, req.params.batchId);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    res.json(batch);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sample-files/:id/batches/:batchId/records - Get records for a specific batch
sampleFilesRouter.get('/:id/batches/:batchId/records', async (req, res) => {
  try {
    const records = await sampleFileService.getBatchRecords(req.params.id, req.params.batchId);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/sample-files/:id/batches/:batchId - Delete a batch and its records
sampleFilesRouter.delete('/:id/batches/:batchId', async (req, res) => {
  try {
    await sampleFileService.deleteBatch(req.params.id, req.params.batchId);
    res.json({ success: true });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/sample-files/:id/batches - Clear all batches for a file definition
sampleFilesRouter.delete('/:id/batches', async (req, res) => {
  try {
    await sampleFileService.clearAllBatches(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ PROCESSING HISTORY (Legacy - kept for backward compatibility) ============

// GET /api/sample-files/:id/history - Get all processing records for a file definition
sampleFilesRouter.get('/:id/history', async (req, res) => {
  try {
    const history = await sampleFileService.getProcessingHistory(req.params.id);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sample-files/:id/history/summary - Get processing summary for a file definition
sampleFilesRouter.get('/:id/history/summary', async (req, res) => {
  try {
    const summary = await sampleFileService.getProcessingSummary(req.params.id);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/sample-files/:id/history - Clear all processing history for a file definition
sampleFilesRouter.delete('/:id/history', async (req, res) => {
  try {
    await sampleFileService.clearProcessingHistory(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/sample-files/:id/history/:recordId - Delete a single processing record
sampleFilesRouter.delete('/:id/history/:recordId', async (req, res) => {
  try {
    await sampleFileService.deleteProcessingRecord(req.params.id, req.params.recordId);
    res.json({ success: true });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});
