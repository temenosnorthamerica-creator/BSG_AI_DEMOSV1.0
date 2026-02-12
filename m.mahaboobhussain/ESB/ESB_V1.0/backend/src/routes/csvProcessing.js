import { Router } from 'express';
import * as csvProcessingService from '../services/csvProcessingService.js';
import * as sampleFileService from '../services/sampleFileService.js';

export const csvProcessingRouter = Router();

// POST /api/csv-processing/process - Process a CSV file
csvProcessingRouter.post('/process', async (req, res) => {
  try {
    const { sampleFileId, csvContent, options } = req.body;

    if (!sampleFileId) {
      return res.status(400).json({ error: 'sampleFileId is required' });
    }

    if (!csvContent) {
      return res.status(400).json({ error: 'csvContent is required' });
    }

    const result = await csvProcessingService.processCSVFile(sampleFileId, csvContent, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/csv-processing/preview - Preview how rows would be mapped
csvProcessingRouter.post('/preview', async (req, res) => {
  try {
    const { sampleFileId, rowData } = req.body;

    if (!sampleFileId) {
      return res.status(400).json({ error: 'sampleFileId is required' });
    }

    if (!rowData) {
      return res.status(400).json({ error: 'rowData is required' });
    }

    const preview = await csvProcessingService.previewRowMapping(sampleFileId, rowData);
    res.json(preview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/csv-processing/parse - Parse CSV without processing (for validation)
csvProcessingRouter.post('/parse', async (req, res) => {
  try {
    const { csvContent, options } = req.body;

    if (!csvContent) {
      return res.status(400).json({ error: 'csvContent is required' });
    }

    const { headers, rows } = csvProcessingService.parseCSV(csvContent, options);
    res.json({
      headers,
      rowCount: rows.length,
      sampleRows: rows.slice(0, 5) // Return first 5 rows for preview
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/csv-processing/validate - Validate CSV columns against file definition
csvProcessingRouter.post('/validate', async (req, res) => {
  try {
    const { sampleFileId, csvContent } = req.body;

    if (!sampleFileId || !csvContent) {
      return res.status(400).json({ error: 'sampleFileId and csvContent are required' });
    }

    const sampleFile = await sampleFileService.getSampleFileById(sampleFileId);
    if (!sampleFile) {
      return res.status(404).json({ error: 'Sample file definition not found' });
    }

    const { headers } = csvProcessingService.parseCSV(csvContent, sampleFile.fileFormat);
    const validation = csvProcessingService.validateCSVColumns(headers, sampleFile);

    res.json(validation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/csv-processing/build-request - Build API request body from row data
csvProcessingRouter.post('/build-request', async (req, res) => {
  try {
    const { sampleFileId, rowData } = req.body;

    if (!sampleFileId || !rowData) {
      return res.status(400).json({ error: 'sampleFileId and rowData are required' });
    }

    const preview = await csvProcessingService.previewRowMapping(sampleFileId, rowData);
    res.json(preview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
