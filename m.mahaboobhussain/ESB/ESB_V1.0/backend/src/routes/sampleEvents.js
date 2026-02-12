import { Router } from 'express';
import * as sampleDataService from '../services/sampleDataService.js';

export const sampleEventsRouter = Router();

// Get all sample events
sampleEventsRouter.get('/', async (req, res) => {
  try {
    const events = await sampleDataService.getAllSampleEvents();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single sample event
sampleEventsRouter.get('/:id', async (req, res) => {
  try {
    const event = await sampleDataService.getSampleEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create sample event
sampleEventsRouter.post('/', async (req, res) => {
  try {
    const { name, jsonContent } = req.body;
    if (!name || !jsonContent) {
      return res.status(400).json({ error: 'Name and jsonContent are required' });
    }

    // Validate JSON
    let parsedJson = jsonContent;
    if (typeof jsonContent === 'string') {
      try {
        parsedJson = JSON.parse(jsonContent);
      } catch {
        return res.status(400).json({ error: 'Invalid JSON format' });
      }
    }

    const event = await sampleDataService.createSampleEvent(name, parsedJson);
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update sample event
sampleEventsRouter.put('/:id', async (req, res) => {
  try {
    const { name, jsonContent } = req.body;
    if (!name || !jsonContent) {
      return res.status(400).json({ error: 'Name and jsonContent are required' });
    }

    let parsedJson = jsonContent;
    if (typeof jsonContent === 'string') {
      try {
        parsedJson = JSON.parse(jsonContent);
      } catch {
        return res.status(400).json({ error: 'Invalid JSON format' });
      }
    }

    const event = await sampleDataService.updateSampleEvent(req.params.id, name, parsedJson);
    res.json(event);
  } catch (error) {
    if (error.message === 'Event not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete sample event
sampleEventsRouter.delete('/:id', async (req, res) => {
  try {
    await sampleDataService.deleteSampleEvent(req.params.id);
    res.json({ success: true });
  } catch (error) {
    if (error.message === 'Event not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});
