import express from 'express';
import * as globalVariablesService from '../services/globalVariablesService.js';

const router = express.Router();

// GET /api/environment-variables - Get all variables
router.get('/', async (req, res) => {
  try {
    const variables = await globalVariablesService.getAll();
    res.json(variables);
  } catch (err) {
    console.error('Error getting environment variables:', err);
    res.status(500).json({ error: 'Failed to get environment variables' });
  }
});

// GET /api/environment-variables/:name - Get a single variable
router.get('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const variable = await globalVariablesService.get(name);

    if (variable === undefined) {
      return res.status(404).json({ error: 'Variable not found' });
    }

    res.json({ name, ...variable });
  } catch (err) {
    console.error('Error getting variable:', err);
    res.status(500).json({ error: 'Failed to get variable' });
  }
});

// POST /api/environment-variables - Create or update a variable
router.post('/', async (req, res) => {
  try {
    const { name, value, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Variable name is required' });
    }

    if (value === undefined) {
      return res.status(400).json({ error: 'Variable value is required' });
    }

    const result = await globalVariablesService.set(name, value, description || '');
    res.json({ name, ...result });
  } catch (err) {
    console.error('Error creating variable:', err);
    res.status(500).json({ error: 'Failed to create variable' });
  }
});

// PUT /api/environment-variables/:name - Update a variable
router.put('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { value, description } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Variable value is required' });
    }

    const result = await globalVariablesService.set(name, value, description || '');
    res.json({ name, ...result });
  } catch (err) {
    console.error('Error updating variable:', err);
    res.status(500).json({ error: 'Failed to update variable' });
  }
});

// DELETE /api/environment-variables/:name - Delete a variable
router.delete('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const deleted = await globalVariablesService.remove(name);

    if (!deleted) {
      return res.status(404).json({ error: 'Variable not found' });
    }

    res.json({ success: true, message: `Variable '${name}' deleted` });
  } catch (err) {
    console.error('Error deleting variable:', err);
    res.status(500).json({ error: 'Failed to delete variable' });
  }
});

// DELETE /api/environment-variables - Clear all variables
router.delete('/', async (req, res) => {
  try {
    await globalVariablesService.clearAll();
    res.json({ success: true, message: 'All variables cleared' });
  } catch (err) {
    console.error('Error clearing variables:', err);
    res.status(500).json({ error: 'Failed to clear variables' });
  }
});

// POST /api/environment-variables/substitute - Substitute variables in data
router.post('/substitute', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }

    const variables = await globalVariablesService.getAll();
    const substituted = globalVariablesService.substituteInObject(data, variables);

    res.json({ original: data, substituted });
  } catch (err) {
    console.error('Error substituting variables:', err);
    res.status(500).json({ error: 'Failed to substitute variables' });
  }
});

// POST /api/environment-variables/find-references - Find variable references in data
router.post('/find-references', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }

    const references = globalVariablesService.findVariableReferences(data);
    const variables = await globalVariablesService.getAll();

    // Enrich references with current values
    const enrichedReferences = references.map(ref => ({
      ...ref,
      hasValue: variables[ref.variableName] !== undefined,
      currentValue: variables[ref.variableName]?.value
    }));

    res.json({ references: enrichedReferences });
  } catch (err) {
    console.error('Error finding references:', err);
    res.status(500).json({ error: 'Failed to find references' });
  }
});

export { router as environmentVariablesRouter };
