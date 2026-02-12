import { Router } from 'express';
import * as sampleDataService from '../services/sampleDataService.js';

export const configurationsRouter = Router();

// Get all configurations
configurationsRouter.get('/', async (req, res) => {
  try {
    const configs = await sampleDataService.getAllConfigurations();
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single configuration
configurationsRouter.get('/:id', async (req, res) => {
  try {
    const config = await sampleDataService.getConfigurationById(req.params.id);
    if (!config) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create configuration
configurationsRouter.post('/', async (req, res) => {
  try {
    const { name, source, destination, mapping, eventType, formConfig } = req.body;
    if (!name || !source || !destination || !mapping) {
      return res.status(400).json({
        error: 'Name, source, destination, and mapping are required'
      });
    }

    const config = await sampleDataService.createConfiguration({
      name,
      source,
      destination,
      mapping,
      eventType: eventType || null,
      formConfig: formConfig || null
    });
    res.status(201).json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update configuration
configurationsRouter.put('/:id', async (req, res) => {
  try {
    const { name, source, destination, mapping, eventType, formConfig } = req.body;
    if (!name || !source || !destination || !mapping) {
      return res.status(400).json({
        error: 'Name, source, destination, and mapping are required'
      });
    }

    const config = await sampleDataService.updateConfiguration(req.params.id, {
      name,
      source,
      destination,
      mapping,
      eventType: eventType || null,
      formConfig: formConfig || null
    });
    res.json(config);
  } catch (error) {
    if (error.message === 'Configuration not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete configuration
configurationsRouter.delete('/:id', async (req, res) => {
  try {
    await sampleDataService.deleteConfiguration(req.params.id);
    res.json({ success: true });
  } catch (error) {
    if (error.message === 'Configuration not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});
