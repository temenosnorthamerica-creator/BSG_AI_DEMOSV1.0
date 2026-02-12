import { EventHubConsumerClient, earliestEventPosition, latestEventPosition } from '@azure/event-hubs';
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

/**
 * Read events from Event Hub
 * @param {Object} options - Options for reading events
 * @param {number} options.maxEvents - Maximum number of events to read (default: 10)
 * @param {number} options.maxWaitTimeSeconds - Maximum time to wait for events (default: 30)
 * @param {string} options.startPosition - 'earliest' or 'latest' (default: 'latest')
 * @param {string} options.consumerGroup - Consumer group name (default: '$Default')
 * @param {Object} options.startSequenceNumbers - Map of partitionId to sequence number to start from (optional)
 * @returns {Promise<Array>} Array of events
 */
export async function readEvents(options = {}) {
  const config = await getConfig();

  if (!config.connectionString || !config.topicName) {
    throw new Error('Event Hub connection string and topic name are required');
  }

  const {
    maxEvents = 10,
    maxWaitTimeSeconds = 30,
    startPosition = 'latest',
    consumerGroup = '$Default',
    startSequenceNumbers = {}
  } = options;

  const consumer = new EventHubConsumerClient(
    consumerGroup,
    config.connectionString,
    config.topicName
  );

  const events = [];
  const startTime = Date.now();
  const maxWaitMs = maxWaitTimeSeconds * 1000;

  try {
    // Get partition IDs
    const partitionIds = await consumer.getPartitionIds();
    console.log(`Event Hub: ${config.topicName}, Partitions: ${partitionIds.join(', ')}`);

    // Get partition properties to understand what's available
    for (const partitionId of partitionIds) {
      try {
        const props = await consumer.getPartitionProperties(partitionId);
        console.log(`Partition ${partitionId} info:`, {
          beginningSequenceNumber: props.beginningSequenceNumber,
          lastEnqueuedSequenceNumber: props.lastEnqueuedSequenceNumber,
          isEmpty: props.isEmpty
        });
      } catch (propErr) {
        console.log(`Could not get properties for partition ${partitionId}:`, propErr.message);
      }
    }

    // Create subscription for each partition
    const subscriptions = [];

    for (const partitionId of partitionIds) {
      // Determine start position for this partition
      let partitionStartPosition;
      const savedSequence = startSequenceNumbers[partitionId];

      if (savedSequence !== undefined && savedSequence !== null) {
        // Start from the next sequence number after the last processed
        // sequenceNumber with isInclusive: false means start AFTER this sequence number
        partitionStartPosition = {
          sequenceNumber: savedSequence,
          isInclusive: false
        };
        console.log(`Partition ${partitionId}: Starting from sequence ${savedSequence + 1} (after saved: ${savedSequence})`);
      } else if (startPosition === 'earliest') {
        partitionStartPosition = earliestEventPosition;
        console.log(`Partition ${partitionId}: Starting from earliest`);
      } else {
        partitionStartPosition = latestEventPosition;
        console.log(`Partition ${partitionId}: Starting from latest`);
      }

      const subscription = consumer.subscribe(
        partitionId,
        {
          processEvents: async (receivedEvents, context) => {
            for (const event of receivedEvents) {
              events.push({
                partitionId: context.partitionId,
                offset: event.offset,
                sequenceNumber: event.sequenceNumber,
                enqueuedTimeUtc: event.enqueuedTimeUtc,
                body: event.body,
                properties: event.properties,
                systemProperties: event.systemProperties
              });

              // Stop if we have enough events
              if (events.length >= maxEvents) {
                return;
              }
            }
          },
          processError: async (err, context) => {
            console.error(`Error in partition ${context.partitionId}:`, err);
          }
        },
        {
          startPosition: partitionStartPosition
        }
      );
      subscriptions.push(subscription);
    }

    // Wait for events or timeout
    await new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (events.length >= maxEvents || elapsed >= maxWaitMs) {
          clearInterval(checkInterval);
          console.log(`Event reading completed: ${events.length} events received in ${elapsed}ms`);
          resolve();
        }
      }, 500);
    });

    // Close all subscriptions
    for (const subscription of subscriptions) {
      await subscription.close();
    }

    return {
      success: true,
      eventHub: config.topicName,
      consumerGroup,
      eventsRead: events.length,
      events: events.slice(0, maxEvents)
    };
  } finally {
    await consumer.close();
  }
}

/**
 * Get Event Hub partition information
 */
export async function getEventHubInfo() {
  const config = await getConfig();

  if (!config.connectionString || !config.topicName) {
    throw new Error('Event Hub connection string and topic name are required');
  }

  const consumer = new EventHubConsumerClient(
    '$Default',
    config.connectionString,
    config.topicName
  );

  try {
    const partitionIds = await consumer.getPartitionIds();
    const partitionProperties = [];

    for (const partitionId of partitionIds) {
      const props = await consumer.getPartitionProperties(partitionId);
      partitionProperties.push({
        partitionId,
        beginningSequenceNumber: props.beginningSequenceNumber,
        lastEnqueuedSequenceNumber: props.lastEnqueuedSequenceNumber,
        lastEnqueuedOffset: props.lastEnqueuedOffset,
        lastEnqueuedOnUtc: props.lastEnqueuedOnUtc,
        isEmpty: props.isEmpty
      });
    }

    return {
      success: true,
      eventHub: config.topicName,
      partitionCount: partitionIds.length,
      partitions: partitionProperties
    };
  } finally {
    await consumer.close();
  }
}
