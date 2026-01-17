import { EventHubProducerClient } from "@azure/event-hubs";

// Azure Event Hub configuration
const connectionString = process.env.AZURE_EVENTHUB_CONNECTION_STRING || "YOUR_AZURE_EVENTHUB_CONNECTION_STRING";
const eventHubName = "test";

// Sample customer creation CloudEvent
const customerCreatedEvent = {
  specversion: "1.0",
  id: crypto.randomUUID(),
  type: "com.bank.customer.created",
  source: "/core-banking/customer-service",
  subject: `customer/${Date.now()}`,
  time: new Date().toISOString(),
  datacontenttype: "application/json",
  data: {
    customerId: Date.now().toString(),
    customerType: "INDIVIDUAL",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    personalDetails: {
      firstName: "Mahaboob",
      lastName: "Hussain",
      dateOfBirth: "1990-05-10",
      nationality: "IN"
    },
    contactDetails: {
      email: "mahaboob.hussain@example.com",
      mobile: "+91-9876543210"
    },
    kyc: {
      kycStatus: "VERIFIED",
      kycLevel: "FULL"
    },
    addresses: [
      {
        type: "RESIDENTIAL",
        country: "India",
        city: "Bangalore",
        postalCode: "560001"
      }
    ]
  }
};

async function sendEvent() {
  console.log("Connecting to Azure Event Hub...");
  console.log(`Event Hub: ${eventHubName}`);

  const producer = new EventHubProducerClient(connectionString, eventHubName);

  try {
    // Create a batch
    const batch = await producer.createBatch();

    // Add the event to the batch
    const eventData = {
      body: customerCreatedEvent,
      properties: {
        eventType: customerCreatedEvent.type,
        source: customerCreatedEvent.source
      }
    };

    const wasAdded = batch.tryAdd(eventData);

    if (!wasAdded) {
      throw new Error("Event too large for batch");
    }

    console.log("\nSending event to Event Hub...");
    console.log("Event payload:");
    console.log(JSON.stringify(customerCreatedEvent, null, 2));

    // Send the batch
    await producer.sendBatch(batch);

    console.log("\n✓ Event sent successfully!");
    console.log(`Event ID: ${customerCreatedEvent.id}`);
    console.log(`Event Type: ${customerCreatedEvent.type}`);
    console.log(`Customer ID: ${customerCreatedEvent.data.customerId}`);

  } catch (error) {
    console.error("Error sending event:", error.message);
  } finally {
    await producer.close();
    console.log("\nConnection closed.");
  }
}

// Run the script
sendEvent();
