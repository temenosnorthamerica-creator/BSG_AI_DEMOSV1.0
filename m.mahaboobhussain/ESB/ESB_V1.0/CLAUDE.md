# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Enterprise Service Bus (ESB) application integrating event sources with API destinations. Two-phase workflow:
- **Phase 1 (Setup):** Load sample data and create field mappings
- **Phase 2 (Execute):** Choose between CRM path (Event Hub → Process Events), Digital path (Direct API calls), or CSV path (Bulk file processing)

All paths track execution history and support response variable capture.

## Development Commands

```bash
# Install dependencies (both frontend and backend)
install.cmd
# Or: npm run install:all

# Start both servers (opens two terminals)
start.cmd

# Stop all servers
stop.cmd

# Manual start (separate terminals):
cd backend && npm run dev    # Backend on port 3001
cd frontend && npm run dev   # Frontend on port 3000

# Frontend only commands:
cd frontend && npm run lint      # ESLint
cd frontend && npm run build     # Production build
cd frontend && npm run preview   # Preview production build
```

## Tech Stack

- **Frontend**: React 19 + Vite, React Router, React Flow (@xyflow/react), Lucide Icons
- **Backend**: Node.js + Express (ES Modules - uses `"type": "module"`), Azure Event Hubs SDK
- **Storage**: File-based JSON (no database) in `backend/data/`
- **Ports**: Frontend 3000, Backend 3001 (proxied via Vite)

## Architecture

### Data Flow

```
Phase 1: Setup
  Load Samples → Create Mappings
  Define CSV Files → Map Columns to API Fields

Phase 2: Execute (Three Paths)
  CRM Path:     CRM → Event Hub → Process Events → Execution History (CRM)
  Digital Path: Digital → External API → Capture Variables → Execution History (Digital)
  CSV Path:     CSV Processing → Upload File → Call API per Row → Execution History (CSV)
```

### Backend Structure
- `backend/src/index.js` - Express server entry point
- `backend/src/routes/` - REST endpoints:
  - `sampleEvents.js`, `sampleApis.js` - Sample data CRUD
  - `configurations.js` - Mapping configurations
  - `demo.js` - Event processing with live/simulation modes
  - `formGenerator.js` - Dynamic forms and API proxy
  - `eventHubConfig.js` - Event Hub connection settings
  - `offsets.js` - Offset tracking for processed events
  - `variables.js` - Configuration-specific variables
  - `environmentVariables.js` - Global environment variables
  - `apiHistory.js` - Digital API call history
  - `sampleFiles.js` - CSV file definitions and batch history
  - `csvProcessing.js` - CSV file processing endpoints
  - `monitor.js` - Per-config Event Hub monitor (start/stop/restart/SSE/status)
  - `formSettings.js` - Form field display settings per API sample
- `backend/src/services/`:
  - `sampleDataService.js` - Sample data persistence
  - `eventHubService.js` - Azure Event Hub producer
  - `eventHubConsumerService.js` - Azure Event Hub consumer
  - `offsetTrackingService.js` - Track processed/failed events
  - `eventHubMonitorService.js` - Per-config monitor with Map-based state, SSE broadcasting, checkpoint tracking
  - `globalVariablesService.js` - Environment variables with response capture
  - `variableStorageService.js` - File-based variable storage
  - `apiHistoryService.js` - API call history tracking
  - `formConfigService.js` - Form configuration generation
  - `formSettingsService.js` - Form settings persistence
  - `sampleFileService.js` - CSV file definitions and batch management
  - `csvProcessingService.js` - CSV parsing, validation, and row processing
- `backend/data/` - JSON file storage:
  - `samples/events/`, `samples/apis/` - Sample data files
  - `samples/files/` - CSV file definitions
  - `configurations/` - Mapping configurations
  - `offsets/` - Event processing state
  - `checkpoints/` - Monitor checkpoint offsets per config
  - `form-settings/` - Form display settings per API sample
  - `variables/` - Configuration variables
  - `api-history/` - Digital API call logs
  - `file-history/` - CSV processing batches and records
  - `environment-variables.json` - Global variables

### Frontend Structure
- `frontend/src/App.jsx` - Main app with routing, sidebar, and Home page
- `frontend/src/pages/`:
  - `SampleDataManagement.jsx` - Upload and manage samples (Events, APIs, CSV Files)
  - `Configuration.jsx` - Create field mappings
  - `FormGenerator.jsx` - CRM: Send events to Event Hub (with DataFlowDiagram and pending events tracking)
  - `Digital.jsx` - Digital: Direct API calls with response capture
  - `Demo.jsx` - Process Events from Event Hub
  - `CSVProcessing.jsx` - CSV: Upload and process CSV files row by row
  - `ExecutionHistory.jsx` - View CRM, Digital, and CSV execution history (tabbed)
  - `EnvironmentVariables.jsx` - Manage global variables
  - `EventHubConfig.jsx` - Configure Event Hub connection
  - `Monitor.jsx` - Health Check Monitor: per-config start/stop/restart with SSE real-time updates
- `frontend/src/components/` - Reusable form components:
  - `DynamicForm.jsx` - Main form renderer
  - `FormField.jsx` - Individual field with auto-generation
  - `FormSection.jsx` - Nested object sections
  - `FormArray.jsx` - Array field handling
  - `DataFlowDiagram.jsx` - Animated CRM → Event Hub → Transact flow visualization
  - `FormSettingsModal.jsx` - Per-sample form field visibility/display settings
- `frontend/src/services/api.js` - API client with all endpoints
- `frontend/src/App.css` - All application styles

## API Endpoints

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/sample-events` | GET, POST, GET/:id, PUT/:id, DELETE/:id | Event sample CRUD |
| `/api/sample-apis` | GET, POST, GET/:id, PUT/:id, DELETE/:id | API sample CRUD |
| `/api/configurations` | GET, POST, GET/:id, PUT/:id, DELETE/:id | Configuration CRUD |
| `/api/demo/execute` | POST | Execute event processing |
| `/api/demo/read-events` | POST | Read events from Event Hub |
| `/api/demo/preview-mapping` | POST | Preview mapping transformation |
| `/api/demo/event-hub-info` | GET | Get Event Hub connection info |
| `/api/event-hub-config` | GET, PUT | Event Hub connection settings |
| `/api/form-generator/config/:type/:sampleId` | GET | Get form configuration |
| `/api/form-generator/send-event` | POST | Send event to Event Hub |
| `/api/form-generator/call-api` | POST | Proxy API call with history |
| `/api/offsets/:configId` | GET, DELETE | Offset tracking management |
| `/api/offsets/:configId/successful` | GET, DELETE | Successful events |
| `/api/offsets/:configId/failed` | GET, DELETE | Failed events |
| `/api/offsets/:configId/display-prefs` | GET, PUT, DELETE | Display field preferences |
| `/api/variables/:configId` | GET, POST, DELETE | Configuration variables |
| `/api/environment-variables` | GET, POST, DELETE | Global variables CRUD |
| `/api/environment-variables/:name` | GET, PUT, DELETE | Single variable operations |
| `/api/environment-variables/substitute` | POST | Substitute variables in data |
| `/api/api-history` | GET | Get API samples with history |
| `/api/api-history/:apiSampleId` | GET, DELETE | API call history |
| `/api/api-history/:apiSampleId/summary` | GET | History summary stats |
| `/api/sample-files` | GET, POST | CSV file definitions CRUD |
| `/api/sample-files/:id` | GET, PUT, DELETE | Single CSV file definition |
| `/api/sample-files/:id/batches` | GET, DELETE | File processing batches |
| `/api/sample-files/:id/batches/:batchId` | GET, DELETE | Single batch operations |
| `/api/sample-files/:id/batches/:batchId/records` | GET | Batch row records |
| `/api/csv-processing/process` | POST | Process CSV file |
| `/api/csv-processing/parse` | POST | Parse CSV without processing |
| `/api/csv-processing/validate` | POST | Validate CSV against definition |
| `/api/monitor/start` | POST | Start monitor for a configuration |
| `/api/monitor/stop` | POST | Stop monitor for a configuration |
| `/api/monitor/restart` | POST | Restart monitor for a configuration |
| `/api/monitor/stop-all` | POST | Stop all running monitors |
| `/api/monitor/status` | GET | Get all monitor statuses |
| `/api/monitor/status/:configId` | GET | Get status for a single configuration |
| `/api/monitor/sample-status/:sampleId` | GET | Check if monitor running for an event sample |
| `/api/monitor/events` | GET (SSE) | Real-time Server-Sent Events stream |
| `/api/monitor/simulate` | POST | Simulate an event for testing |
| `/api/monitor/checkpoint/:configId` | GET, DELETE | View/reset event processing checkpoint |
| `/api/form-settings/:apiSampleId` | GET, PUT, DELETE | Form display settings per API sample |

## Key Features

### Variable Substitution
Use `{{VARIABLE_NAME}}` syntax in API endpoints, headers, and request bodies. Variables are substituted from environment variables before execution.

### Response Capture
API samples can define `responseCapture` rules to extract values from API responses and save them as environment variables:
```json
{
  "responseCapture": [
    { "path": "data.id", "variableName": "CUSTOMER_ID" },
    { "path": "data.token", "variableName": "AUTH_TOKEN" }
  ]
}
```

### Execution History
- **CRM Tab**: Shows events processed from Event Hub with configurable display fields
- **Digital Tab**: Shows direct API calls with request/response details
- **CSV Tab**: Shows processed CSV files as batches; click a batch to view row records in a popup modal

### Display Field Preferences
Users can configure which fields to display in execution history summaries using the "Display Fields" button.

### Health Check Monitor (Per-Configuration)
Each configuration can be independently monitored with its own start/stop/restart controls:
- **Architecture**: `monitorStates = new Map()` in `eventHubMonitorService.js` — each config has its own Event Hub subscription, consumer client, and stats
- **SSE**: All events carry `configId` for routing to the correct config's UI state. Frontend connects to `/api/monitor/events` via `EventSource`
- **Checkpoints**: Per-config file-based checkpoints in `backend/data/checkpoints/` track processed offsets; monitor resumes from last checkpoint on restart
- **CRM Integration**: `FormGenerator.jsx` uses `GET /api/monitor/sample-status/:sampleId` (server-side matching) to detect if a monitor is running for the selected event sample. Events sent without a running monitor show as "pending" and auto-clear when the monitor starts
- **UI**: Card-based grid in `Monitor.jsx` — each config card shows running/stopped status, start/stop/restart buttons, and a collapsible activity log

### CSV File Processing
Bulk process CSV files by calling an API for each row:
1. **Define CSV File** in Sample Data Management (CSV Files tab)
2. **Map columns** to API request fields
3. **Upload CSV** in CSV Processing page
4. **Process** - each row calls the target API
5. **View results** in Execution History (CSV tab) - batches show file-level summary, click to see row details

Same-file protection: The application blocks loading the same file twice (by name+size+timestamp). Click "Clear" to reset and allow reloading.

## Nested Field Handling

JSON fields use dot notation with `[]` for arrays:
- `name` → simple field
- `contact.email` → nested object
- `addresses[].city` → array items

**Key functions:**
- `extractSchema()`, `getFields()` in `sampleDataService.js`
- `getNestedValue()`, `setNestedValue()`, `parsePath()` in `demo.js`

## Key Data Structures

### Event Sample
```json
{ "id", "name", "fileName", "schema", "fields", "sampleData", "createdAt", "updatedAt" }
```

### API Sample
```json
{
  "id", "name", "endpoint", "method",
  "request": { "fileName", "schema", "fields", "sampleData" },
  "response": { ... },
  "defaultHeaders": { },
  "responseCapture": [ { "path", "variableName" } ]
}
```

### Configuration
```json
{
  "id", "name",
  "source": { "type", "eventSampleId" },
  "destination": { "apiSampleId" },
  "mapping": { "sourceField": "apiField" }
}
```

### Environment Variable
```json
{ "name": "VAR_NAME", "value": "value", "description": "optional description" }
```

### API History Record
```json
{
  "id", "apiSampleId", "apiSampleName", "endpoint", "method",
  "requestHeaders", "requestBody", "responseStatus", "responseBody",
  "capturedVariables", "duration", "success", "executedAt"
}
```

### CSV File Definition
```json
{
  "id", "name", "description",
  "fileFormat": { "delimiter", "hasHeader", "headerRowCount", "textQualifier" },
  "columns": [ { "name", "type", "required" } ],
  "targetApi": { "apiSampleId", "apiSampleName" },
  "fieldMapping": { "csvColumn": "apiField" },
  "staticFields": { "apiField": "staticValue" },
  "responseCapture": [ { "responsePath", "displayName" } ]
}
```

### CSV Processing Batch
```json
{
  "id", "fileName", "fileSize", "totalRows",
  "successfulRows", "failedRows", "status",
  "loadedAt", "processedAt"
}
```

## Modification Patterns

**Adding a new API endpoint:**
1. Create route in `backend/src/routes/`
2. Add service functions in `backend/src/services/`
3. Register in `backend/src/index.js`
4. Add client method in `frontend/src/services/api.js`

**Adding a new page:**
1. Create component in `frontend/src/pages/`
2. Add route in `App.jsx`
3. Add nav link in sidebar (App.jsx)

**Adding response capture to an API sample:**
1. Edit API sample in Sample Data Management
2. Add `responseCapture` array with path and variableName rules
3. Captured values auto-save to Environment Variables on successful API calls

## Notes

- Backend uses ES Modules (import/export syntax)
- Frontend proxies `/api/*` to backend via `vite.config.js`
- Demo supports both simulation mode and real API execution
- Digital page always makes real API calls with response capture
- Monitor uses per-config `Map<configId, state>` — multiple configs can run simultaneously with independent Event Hub subscriptions
- Monitor SSE events carry `configId` for frontend routing; frontend reconnects automatically on disconnect
- No authentication implemented
