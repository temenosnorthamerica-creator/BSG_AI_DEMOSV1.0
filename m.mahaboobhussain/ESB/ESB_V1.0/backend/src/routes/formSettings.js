import express from 'express';
import { getFormSettings, saveFormSettings, deleteFormSettings } from '../services/formSettingsService.js';

const router = express.Router();

// Get form settings for an API sample
router.get('/:apiSampleId', (req, res) => {
  try {
    const { apiSampleId } = req.params;
    const settings = getFormSettings(apiSampleId);
    res.json(settings);
  } catch (error) {
    console.error('Error getting form settings:', error);
    res.status(500).json({ error: 'Failed to get form settings' });
  }
});

// Save form settings for an API sample
router.put('/:apiSampleId', (req, res) => {
  try {
    const { apiSampleId } = req.params;
    const settings = saveFormSettings(apiSampleId, req.body);
    res.json(settings);
  } catch (error) {
    console.error('Error saving form settings:', error);
    res.status(500).json({ error: 'Failed to save form settings' });
  }
});

// Delete form settings for an API sample
router.delete('/:apiSampleId', (req, res) => {
  try {
    const { apiSampleId } = req.params;
    const deleted = deleteFormSettings(apiSampleId);
    if (deleted) {
      res.json({ success: true, message: 'Form settings deleted' });
    } else {
      res.status(404).json({ error: 'Form settings not found' });
    }
  } catch (error) {
    console.error('Error deleting form settings:', error);
    res.status(500).json({ error: 'Failed to delete form settings' });
  }
});

export default router;
