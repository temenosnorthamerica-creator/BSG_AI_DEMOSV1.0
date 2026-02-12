import { Router } from 'express';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, '../../data/settings/eventhub-config.json');
const SETTINGS_DIR = join(__dirname, '../../data/settings');

export const eventHubConfigRouter = Router();

const DEFAULT_CONFIG = {
  hostName: '',
  topicName: '',
  connectionString: ''
};

async function ensureSettingsDir() {
  try {
    await mkdir(SETTINGS_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

// GET /api/event-hub-config - Get current config
eventHubConfigRouter.get('/', async (req, res) => {
  try {
    await ensureSettingsDir();
    const data = await readFile(CONFIG_PATH, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Return default config if file doesn't exist
      await writeFile(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
      res.json(DEFAULT_CONFIG);
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// PUT /api/event-hub-config - Update config
eventHubConfigRouter.put('/', async (req, res) => {
  try {
    await ensureSettingsDir();
    const { hostName, topicName, primaryKey, connectionString } = req.body;

    const config = {
      hostName: hostName || '',
      topicName: topicName || '',
      primaryKey: primaryKey || '',
      connectionString: connectionString || ''
    };

    await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
