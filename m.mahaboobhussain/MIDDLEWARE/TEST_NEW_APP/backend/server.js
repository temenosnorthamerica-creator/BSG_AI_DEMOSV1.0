import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendCustomerCreatedEvent, fetchCustomerFromEventHub, sendAccountCreatedEvent, fetchAccountFromEventHub, fetchEventsByType, fetchAccountsByCustomerId } from './eventHubService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config files are in the parent's parent directory (ClaudeCodeExercises01)
const CONFIG_DIR = path.resolve(__dirname, '../../');

const app = express();
const PORT = 8005;

// In-memory store for customers (for quick lookup)
const customerStore = new Map();

// In-memory store for accounts (for quick lookup)
const accountStore = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve config files dynamically from source directory
app.get('/api/config/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(CONFIG_DIR, filename);

  console.log(`Loading config file: ${filePath}`);

  // Security check - only allow specific file types
  if (!filename.endsWith('.txt') && !filename.endsWith('.json') && !filename.endsWith('.properties')) {
    return res.status(400).json({ success: false, message: 'Invalid file type' });
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: `File not found: ${filename}` });
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Set appropriate content type
    if (filename.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
      res.send(content);
    } else {
      res.setHeader('Content-Type', 'text/plain');
      res.send(content);
    }
  } catch (error) {
    console.error(`Error reading file ${filename}:`, error);
    res.status(500).json({ success: false, message: 'Error reading file' });
  }
});

// List available config files
app.get('/api/config', (req, res) => {
  try {
    const files = fs.readdirSync(CONFIG_DIR);
    const configFiles = files.filter(f =>
      (f.endsWith('.json') || f.endsWith('.txt') || f.endsWith('.properties')) &&
      (f.includes('cloudevent') || f.includes('api') || f.includes('Integration'))
    );

    res.json({
      success: true,
      configDir: CONFIG_DIR,
      files: configFiles
    });
  } catch (error) {
    console.error('Error listing config files:', error);
    res.status(500).json({ success: false, message: 'Error listing files' });
  }
});

// Create customer endpoint
app.post('/api/customer', async (req, res) => {
  console.log('\n--- New Customer Creation Request ---');

  try {
    const formData = req.body;
    console.log('Received form data:', JSON.stringify(formData, null, 2));

    // Build customer data structure
    const customerData = {
      customerId: Date.now().toString(),
      customerType: formData.customerType,
      status: formData.status,
      createdAt: new Date().toISOString(),
      personalDetails: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        nationality: formData.nationality
      },
      contactDetails: {
        email: formData.email,
        mobile: formData.mobile
      },
      kyc: {
        kycStatus: formData.kycStatus,
        kycLevel: formData.kycLevel
      },
      addresses: [
        {
          type: formData.addressType,
          country: formData.country,
          city: formData.city,
          postalCode: formData.postalCode
        }
      ]
    };

    console.log(`Customer: ${customerData.personalDetails.firstName} ${customerData.personalDetails.lastName}`);
    console.log(`Email: ${customerData.contactDetails.email}`);
    console.log('Sending event to Azure Event Hub...');

    // Store customer in memory for quick lookup
    customerStore.set(customerData.customerId, customerData);

    // Send event to Azure Event Hub
    const result = await sendCustomerCreatedEvent(customerData);

    console.log('Event sent successfully!');
    console.log(`Customer stored with ID: ${customerData.customerId}`);

    res.json({
      success: true,
      message: 'Customer created and event sent to Event Hub',
      eventId: result.eventId,
      customerId: result.customerId
    });

  } catch (error) {
    console.error('Error creating customer:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer: ' + error.message,
      error: error.message
    });
  }
});

// Search customer by ID endpoint
app.get('/api/customer/:customerId', async (req, res) => {
  const { customerId } = req.params;
  console.log(`\n--- Customer Search Request ---`);
  console.log(`Searching for Customer ID: ${customerId}`);

  try {
    // First check in-memory store
    if (customerStore.has(customerId)) {
      console.log('Customer found in memory store');
      return res.json({
        success: true,
        source: 'memory',
        customer: customerStore.get(customerId)
      });
    }

    // If not in memory, try to fetch from Event Hub
    console.log('Customer not in memory, fetching from Event Hub...');
    const customer = await fetchCustomerFromEventHub(customerId);

    if (customer) {
      console.log('Customer found in Event Hub');
      // Store in memory for future lookups
      customerStore.set(customerId, customer);
      return res.json({
        success: true,
        source: 'eventhub',
        customer: customer
      });
    }

    console.log('Customer not found');
    res.status(404).json({
      success: false,
      message: `Customer with ID ${customerId} not found`
    });

  } catch (error) {
    console.error('Error searching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search customer: ' + error.message
    });
  }
});

// Get all customers (for debugging)
app.get('/api/customers', (req, res) => {
  const customers = Array.from(customerStore.values());
  res.json({
    success: true,
    count: customers.length,
    customers: customers
  });
});

// Create account endpoint
app.post('/api/account', async (req, res) => {
  console.log('\n--- New Account Creation Request ---');

  try {
    const formData = req.body;
    console.log('Received form data:', JSON.stringify(formData, null, 2));

    // Build account data structure
    const accountData = {
      accountId: `ACC-${Date.now()}`,
      accountNumber: formData.accountNumber,
      accountType: formData.accountType,
      currency: formData.currency,
      status: formData.status,
      customerId: formData.customerId,
      openedDate: formData.openedDate,
      branchCode: formData.branchCode,
      productCode: formData.productCode,
      createdAt: new Date().toISOString(),
      balance: {
        available: parseFloat(formData.availableBalance) || 0.00,
        ledger: parseFloat(formData.ledgerBalance) || 0.00
      },
      interest: {
        rate: parseFloat(formData.interestRate) || 0.00,
        rateType: formData.rateType
      }
    };

    console.log(`Account: ${accountData.accountId}`);
    console.log(`Account Number: ${accountData.accountNumber}`);
    console.log(`Customer ID: ${accountData.customerId}`);
    console.log('Sending event to Azure Event Hub...');

    // Store account in memory for quick lookup
    accountStore.set(accountData.accountId, accountData);

    // Send event to Azure Event Hub
    const result = await sendAccountCreatedEvent(accountData);

    console.log('Event sent successfully!');
    console.log(`Account stored with ID: ${accountData.accountId}`);

    res.json({
      success: true,
      message: 'Account created and event sent to Event Hub',
      eventId: result.eventId,
      accountId: result.accountId
    });

  } catch (error) {
    console.error('Error creating account:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to create account: ' + error.message,
      error: error.message
    });
  }
});

// Search account by ID endpoint
app.get('/api/account/:accountId', async (req, res) => {
  const { accountId } = req.params;
  console.log(`\n--- Account Search Request ---`);
  console.log(`Searching for Account ID: ${accountId}`);

  try {
    // First check in-memory store
    if (accountStore.has(accountId)) {
      console.log('Account found in memory store');
      return res.json({
        success: true,
        source: 'memory',
        account: accountStore.get(accountId)
      });
    }

    // If not in memory, try to fetch from Event Hub
    console.log('Account not in memory, fetching from Event Hub...');
    const account = await fetchAccountFromEventHub(accountId);

    if (account) {
      console.log('Account found in Event Hub');
      // Store in memory for future lookups
      accountStore.set(accountId, account);
      return res.json({
        success: true,
        source: 'eventhub',
        account: account
      });
    }

    console.log('Account not found');
    res.status(404).json({
      success: false,
      message: `Account with ID ${accountId} not found`
    });

  } catch (error) {
    console.error('Error searching account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search account: ' + error.message
    });
  }
});

// Get all accounts (for debugging)
app.get('/api/accounts', (req, res) => {
  const accounts = Array.from(accountStore.values());
  res.json({
    success: true,
    count: accounts.length,
    accounts: accounts
  });
});

// List all customers from Event Hub by event type
app.get('/api/eventhub/customers', async (req, res) => {
  console.log('\n--- List Customers from Event Hub ---');

  try {
    const events = await fetchEventsByType('com.bank.customer.created');

    res.json({
      success: true,
      count: events.length,
      customers: events.map(e => ({
        eventId: e.eventId,
        eventTime: e.time,
        ...e.data
      }))
    });

  } catch (error) {
    console.error('Error listing customers from Event Hub:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers from Event Hub: ' + error.message
    });
  }
});

// List all accounts from Event Hub by event type
app.get('/api/eventhub/accounts', async (req, res) => {
  console.log('\n--- List Accounts from Event Hub ---');

  try {
    const events = await fetchEventsByType('com.bank.account.created');

    res.json({
      success: true,
      count: events.length,
      accounts: events.map(e => ({
        eventId: e.eventId,
        eventTime: e.time,
        ...e.data
      }))
    });

  } catch (error) {
    console.error('Error listing accounts from Event Hub:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch accounts from Event Hub: ' + error.message
    });
  }
});

// Get accounts for a specific customer from Event Hub
app.get('/api/eventhub/customer/:customerId/accounts', async (req, res) => {
  const { customerId } = req.params;
  console.log(`\n--- Fetch Accounts for Customer ${customerId} from Event Hub ---`);

  try {
    const accounts = await fetchAccountsByCustomerId(customerId);

    res.json({
      success: true,
      customerId: customerId,
      count: accounts.length,
      accounts: accounts
    });

  } catch (error) {
    console.error('Error fetching customer accounts from Event Hub:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch accounts from Event Hub: ' + error.message
    });
  }
});

// Get events by event type for middleware processing
app.get('/api/middleware/events/:eventType', async (req, res) => {
  const { eventType } = req.params;
  console.log(`\n--- Fetch Events for Middleware: ${eventType} ---`);

  try {
    const events = await fetchEventsByType(eventType);

    res.json({
      success: true,
      eventType: eventType,
      count: events.length,
      events: events.map(e => ({
        eventId: e.eventId,
        type: e.type,
        time: e.time,
        subject: e.data?.customerId || e.data?.accountId || 'unknown',
        data: e.data,
        status: 'pending'
      }))
    });

  } catch (error) {
    console.error('Error fetching events for middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events: ' + error.message
    });
  }
});

// Process a single event - transform and send to destination API
app.post('/api/middleware/process', async (req, res) => {
  const { eventId, eventType, eventData, apiEndpoint, fieldMappings } = req.body;
  console.log(`\n--- Processing Event: ${eventId} ---`);
  console.log(`Event Type: ${eventType}`);
  console.log(`API Endpoint: ${apiEndpoint}`);

  try {
    // Step 1: Pull - Event data is already provided
    console.log('Step 1: Event pulled from Event Hub');

    // Step 2: Map - Transform event data to API format
    console.log('Step 2: Mapping event to API format...');
    const apiPayload = transformEventToApi(eventData, fieldMappings);
    console.log('Mapped API Payload:', JSON.stringify(apiPayload, null, 2));

    // Step 3: Send to destination API (simulated for now)
    console.log('Step 3: Sending to destination API...');

    // Simulate API call with delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // For demo, we'll simulate success (in real scenario, make actual HTTP call)
    const apiResponse = {
      success: true,
      transactionId: `TXN-${Date.now()}`,
      message: 'Successfully processed by Transact'
    };

    console.log('API Response:', apiResponse);

    res.json({
      success: true,
      eventId: eventId,
      steps: {
        pulled: true,
        mapped: true,
        sent: true
      },
      apiPayload: apiPayload,
      apiResponse: apiResponse
    });

  } catch (error) {
    console.error('Error processing event:', error);
    res.status(500).json({
      success: false,
      eventId: eventId,
      message: 'Failed to process event: ' + error.message,
      steps: {
        pulled: true,
        mapped: false,
        sent: false
      }
    });
  }
});

// Helper function to transform event data to API format using field mappings
function transformEventToApi(eventData, fieldMappings) {
  const apiPayload = { header: {}, body: {} };

  for (const [sourcePath, targetPath] of Object.entries(fieldMappings)) {
    const sourceValue = getNestedValue(eventData, sourcePath);
    if (sourceValue !== undefined) {
      setNestedValue(apiPayload, targetPath, sourceValue);
    }
  }

  return apiPayload;
}

// Get nested value from object using dot notation path
function getNestedValue(obj, path) {
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = current[key];
  }

  return current;
}

// Set nested value in object using dot notation path
function setNestedValue(obj, path, value) {
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = isNaN(keys[i + 1]) ? {} : [];
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Create customer: POST http://localhost:${PORT}/api/customer`);
  console.log(`   Search customer: GET http://localhost:${PORT}/api/customer/:id`);
  console.log(`   List customers: GET http://localhost:${PORT}/api/customers`);
  console.log(`   Create account: POST http://localhost:${PORT}/api/account`);
  console.log(`   Search account: GET http://localhost:${PORT}/api/account/:id`);
  console.log(`   List accounts: GET http://localhost:${PORT}/api/accounts\n`);
});
