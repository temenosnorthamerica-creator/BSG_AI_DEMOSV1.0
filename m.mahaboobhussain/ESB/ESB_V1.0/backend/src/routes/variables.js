import { Router } from 'express';
import * as variableStorageService from '../services/variableStorageService.js';

export const variablesRouter = Router();

// Get all configurations that have variables
variablesRouter.get('/', async (req, res) => {
  try {
    const configs = await variableStorageService.getAllVariableConfigs();
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all variables for a configuration
variablesRouter.get('/:configId', async (req, res) => {
  try {
    const data = await variableStorageService.getVariables(req.params.configId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single variable
variablesRouter.get('/:configId/:variableName', async (req, res) => {
  try {
    const variable = await variableStorageService.getVariable(
      req.params.configId,
      req.params.variableName
    );
    if (!variable) {
      return res.status(404).json({ error: 'Variable not found' });
    }
    res.json(variable);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set/update a single variable
variablesRouter.put('/:configId/:variableName', async (req, res) => {
  try {
    const { value, configName } = req.body;
    if (value === undefined) {
      return res.status(400).json({ error: 'value is required' });
    }

    const data = await variableStorageService.updateVariable(
      req.params.configId,
      req.params.variableName,
      value
    );
    res.json(data);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Create a new variable
variablesRouter.post('/:configId', async (req, res) => {
  try {
    const { variableName, value, configName } = req.body;
    if (!variableName || value === undefined) {
      return res.status(400).json({ error: 'variableName and value are required' });
    }

    const data = await variableStorageService.setVariable(
      req.params.configId,
      configName || '',
      variableName,
      value,
      { capturedFrom: 'Manual Entry' }
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a single variable
variablesRouter.delete('/:configId/:variableName', async (req, res) => {
  try {
    const data = await variableStorageService.deleteVariable(
      req.params.configId,
      req.params.variableName
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all variables for a configuration
variablesRouter.delete('/:configId', async (req, res) => {
  try {
    const data = await variableStorageService.clearVariables(req.params.configId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
