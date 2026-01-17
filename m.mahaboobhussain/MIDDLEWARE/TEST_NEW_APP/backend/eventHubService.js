import { EventHubProducerClient, EventHubConsumerClient, earliestEventPosition } from "@azure/event-hubs";

// Azure Event Hub configuration
const connectionString = process.env.AZURE_EVENTHUB_CONNECTION_STRING || "YOUR_AZURE_EVENTHUB_CONNECTION_STRING";
const eventHubName = "test";
const consumerGroup = "$Default";

export async function sendCustomerCreatedEvent(customerData) {
  const producer = new EventHubProducerClient(connectionString, eventHubName);

  try {
    // Create CloudEvent structure
    const cloudEvent = {
      specversion: "1.0",
      id: crypto.randomUUID(),
      type: "com.bank.customer.created",
      source: "/core-banking/customer-service",
      subject: `customer/${customerData.customerId}`,
      time: new Date().toISOString(),
      datacontenttype: "application/json",
      data: customerData
    };

    // Create a batch
    const batch = await producer.createBatch();

    // Add the event to the batch
    const eventData = {
      body: cloudEvent,
      properties: {
        eventType: cloudEvent.type,
        source: cloudEvent.source,
        customerId: customerData.customerId
      }
    };

    const wasAdded = batch.tryAdd(eventData);

    if (!wasAdded) {
      throw new Error("Event too large for batch");
    }

    // Send the batch
    await producer.sendBatch(batch);

    console.log(`✓ Event sent to Event Hub: ${cloudEvent.id}`);

    return {
      success: true,
      eventId: cloudEvent.id,
      customerId: customerData.customerId,
      cloudEvent
    };

  } catch (error) {
    console.error("Error sending event to Event Hub:", error.message);
    throw error;
  } finally {
    await producer.close();
  }
}

export async function fetchCustomerFromEventHub(customerId) {
  console.log(`Fetching customer ${customerId} from Event Hub...`);

  const consumer = new EventHubConsumerClient(consumerGroup, connectionString, eventHubName);

  try {
    const partitionIds = await consumer.getPartitionIds();
    let foundCustomer = null;

    // Read events from all partitions
    for (const partitionId of partitionIds) {
      if (foundCustomer) break;

      const partitionProperties = await consumer.getPartitionProperties(partitionId);

      // Create a subscription to read events
      const events = [];
      const subscription = consumer.subscribe(
        partitionId,
        {
          processEvents: async (receivedEvents, context) => {
            for (const event of receivedEvents) {
              events.push(event);

              // Check if this is the customer we're looking for
              if (event.body && event.body.data) {
                const eventCustomerId = event.body.data.customerId;
                if (eventCustomerId === customerId) {
                  foundCustomer = event.body.data;
                  console.log(`Found customer ${customerId} in Event Hub`);
                }
              }
            }
          },
          processError: async (err, context) => {
            console.error(`Error reading from partition ${context.partitionId}:`, err.message);
          }
        },
        {
          startPosition: earliestEventPosition,
          maxWaitTimeInSeconds: 5
        }
      );

      // Wait for events to be processed (with timeout)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Close the subscription
      await subscription.close();

      if (foundCustomer) break;
    }

    return foundCustomer;

  } catch (error) {
    console.error("Error fetching from Event Hub:", error.message);
    return null;
  } finally {
    await consumer.close();
  }
}

export async function sendAccountCreatedEvent(accountData) {
  const producer = new EventHubProducerClient(connectionString, eventHubName);

  try {
    // Create CloudEvent structure
    const cloudEvent = {
      specversion: "1.0",
      id: crypto.randomUUID(),
      type: "com.bank.account.created",
      source: "/core-banking/account-service",
      subject: `account/${accountData.accountId}`,
      time: new Date().toISOString(),
      datacontenttype: "application/json",
      data: accountData
    };

    // Create a batch
    const batch = await producer.createBatch();

    // Add the event to the batch
    const eventData = {
      body: cloudEvent,
      properties: {
        eventType: cloudEvent.type,
        source: cloudEvent.source,
        accountId: accountData.accountId
      }
    };

    const wasAdded = batch.tryAdd(eventData);

    if (!wasAdded) {
      throw new Error("Event too large for batch");
    }

    // Send the batch
    await producer.sendBatch(batch);

    console.log(`✓ Account event sent to Event Hub: ${cloudEvent.id}`);

    return {
      success: true,
      eventId: cloudEvent.id,
      accountId: accountData.accountId,
      cloudEvent
    };

  } catch (error) {
    console.error("Error sending account event to Event Hub:", error.message);
    throw error;
  } finally {
    await producer.close();
  }
}

export async function fetchAccountFromEventHub(accountId) {
  console.log(`Fetching account ${accountId} from Event Hub...`);

  const consumer = new EventHubConsumerClient(consumerGroup, connectionString, eventHubName);

  try {
    const partitionIds = await consumer.getPartitionIds();
    let foundAccount = null;

    // Read events from all partitions
    for (const partitionId of partitionIds) {
      if (foundAccount) break;

      const partitionProperties = await consumer.getPartitionProperties(partitionId);

      // Create a subscription to read events
      const events = [];
      const subscription = consumer.subscribe(
        partitionId,
        {
          processEvents: async (receivedEvents, context) => {
            for (const event of receivedEvents) {
              events.push(event);

              // Check if this is the account we're looking for
              if (event.body && event.body.data) {
                const eventAccountId = event.body.data.accountId;
                if (eventAccountId === accountId) {
                  foundAccount = event.body.data;
                  console.log(`Found account ${accountId} in Event Hub`);
                }
              }
            }
          },
          processError: async (err, context) => {
            console.error(`Error reading from partition ${context.partitionId}:`, err.message);
          }
        },
        {
          startPosition: earliestEventPosition,
          maxWaitTimeInSeconds: 5
        }
      );

      // Wait for events to be processed (with timeout)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Close the subscription
      await subscription.close();

      if (foundAccount) break;
    }

    return foundAccount;

  } catch (error) {
    console.error("Error fetching account from Event Hub:", error.message);
    return null;
  } finally {
    await consumer.close();
  }
}

export async function fetchEventsByType(eventType) {
  console.log(`Fetching all events of type ${eventType} from Event Hub...`);

  const consumer = new EventHubConsumerClient(consumerGroup, connectionString, eventHubName);

  try {
    const partitionIds = await consumer.getPartitionIds();
    const allEvents = [];

    // Read events from all partitions
    for (const partitionId of partitionIds) {
      const subscription = consumer.subscribe(
        partitionId,
        {
          processEvents: async (receivedEvents, context) => {
            for (const event of receivedEvents) {
              // Filter by event type
              if (event.body && event.body.type === eventType) {
                allEvents.push({
                  eventId: event.body.id,
                  type: event.body.type,
                  time: event.body.time,
                  data: event.body.data
                });
              }
            }
          },
          processError: async (err, context) => {
            console.error(`Error reading from partition ${context.partitionId}:`, err.message);
          }
        },
        {
          startPosition: earliestEventPosition,
          maxWaitTimeInSeconds: 5
        }
      );

      // Wait for events to be processed
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Close the subscription
      await subscription.close();
    }

    console.log(`Found ${allEvents.length} events of type ${eventType}`);
    return allEvents;

  } catch (error) {
    console.error("Error fetching events from Event Hub:", error.message);
    return [];
  } finally {
    await consumer.close();
  }
}

export async function fetchAccountsByCustomerId(customerId) {
  console.log(`Fetching accounts for customer ${customerId} from Event Hub...`);

  const consumer = new EventHubConsumerClient(consumerGroup, connectionString, eventHubName);

  try {
    const partitionIds = await consumer.getPartitionIds();
    const accounts = [];

    // Read events from all partitions
    for (const partitionId of partitionIds) {
      const subscription = consumer.subscribe(
        partitionId,
        {
          processEvents: async (receivedEvents, context) => {
            for (const event of receivedEvents) {
              // Filter by account.created events and customerId
              if (event.body &&
                  event.body.type === "com.bank.account.created" &&
                  event.body.data &&
                  event.body.data.customerId === customerId) {
                accounts.push({
                  eventId: event.body.id,
                  time: event.body.time,
                  ...event.body.data
                });
              }
            }
          },
          processError: async (err, context) => {
            console.error(`Error reading from partition ${context.partitionId}:`, err.message);
          }
        },
        {
          startPosition: earliestEventPosition,
          maxWaitTimeInSeconds: 5
        }
      );

      // Wait for events to be processed
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Close the subscription
      await subscription.close();
    }

    console.log(`Found ${accounts.length} accounts for customer ${customerId}`);
    return accounts;

  } catch (error) {
    console.error("Error fetching accounts from Event Hub:", error.message);
    return [];
  } finally {
    await consumer.close();
  }
}
