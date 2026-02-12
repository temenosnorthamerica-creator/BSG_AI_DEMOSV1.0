import { EventHubProducerClient } from '@azure/event-hubs';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, '../../data/settings/eventhub-config.json');

async function getConfig() {
  try {
    const data = await readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error('Event Hub configuration not found');
  }
}

export async function sendEvent(eventData, partitionKey = null) {
  const config = await getConfig();

  if (!config.connectionString || !config.topicName) {
    throw new Error('Event Hub connection string and topic name are required');
  }

  const producer = new EventHubProducerClient(config.connectionString, config.topicName);

  try {
    const batchOptions = partitionKey ? { partitionKey } : {};
    const batch = await producer.createBatch(batchOptions);

    const eventMessage = {
      body: eventData,
      properties: {
        sentAt: new Date().toISOString()
      }
    };

    if (!batch.tryAdd(eventMessage)) {
      throw new Error('Event is too large to fit in a batch');
    }

    await producer.sendBatch(batch);

    return {
      success: true,
      message: 'Event sent successfully',
      eventHub: config.topicName,
      sentAt: new Date().toISOString(),
      partitionKey: partitionKey || 'default'
    };
  } finally {
    await producer.close();
  }
}
