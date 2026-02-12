# ESB (Enterprise Service Bus) Application - Project Plan

## Overview
Build a user-friendly ESB application that integrates file/event sources with API destinations, featuring configuration management, data mapping, and interactive demo execution.

---

## 1. Sample Data Management (Prerequisite Setup)

> **This is a SEPARATE activity/page** that must be completed BEFORE the main configuration workflow. Samples uploaded here become available for selection in the main configuration page.

### 1.1 Sample Event JSON Upload
- **Purpose**: Define event schemas and provide sample data for demo execution
- **UI**: Dedicated "Manage Sample Events" page/section
- **Features**:
  - Drag-drop or file picker interface
  - JSON syntax validation on upload
  - Automatic schema detection and preview
  - Name/label assignment for each sample
  - Edit/delete existing samples
  - List view of all uploaded event samples
- **Storage**: Persisted for use across configurations

### 1.2 Sample API JSON Upload
- **Purpose**: Define API request/response structures for mapping reference
- **UI**: Dedicated "Manage API Samples" page/section
- **Features**:
  - **Request JSON Upload**: Define expected request structure and parameters
  - **Response JSON Upload**: Define expected response structure for extraction
  - Side-by-side preview of request/response
  - Link request+response as a pair to an API name
  - JSON validation and field type detection
  - List view of all uploaded API samples
- **Storage**: Persisted and linked to API definitions

---

## 2. Core Features Understanding (Main Configuration)

> **Prerequisite**: Sample events and API JSONs must be uploaded first (Section 1)

### 2.1 Source Selection (Input)
- **File Source**: User uploads files (CSV, JSON, XML, etc.)
- **Event Source**: User selects from **pre-uploaded event samples** (dropdown/list)
  - Shows all available event samples uploaded in Section 1
  - Displays schema preview when selected
- **UI Requirement**: Radio buttons or dropdown to select source type
- **Conditional Load**: Based on selection, show file upload dialog OR event sample list

### 2.2 Destination Configuration (Output)
- **Fixed Destination**: Always API (REST endpoints)
- **API Selection**: Dropdown/list showing **pre-uploaded API samples**
  - Shows all available API samples uploaded in Section 1
  - Displays request/response schema preview when selected
- **API Details**: Display selected API metadata (method, endpoint, required parameters)

### 2.3 Parameter Mapping
- **Source → API Mapping**: Map file columns/event fields to API request parameters
- **Visual Mapping Interface**: 
  - Left side: Source fields (from uploaded file or event schema)
  - Right side: API required parameters/tags
  - Connection lines or drag-drop to establish mapping
- **Mapping Storage**: Save configurations with version control for future updates
- **Mapping Templates**: Reuse saved mappings for similar sources

### 2.4 Configuration Management
- **Save Configuration**: Store mapping + source + API selection
- **Load Configuration**: Retrieve and modify previously saved configurations
- **Configuration Persistence**: Database or file-based storage

---

## 3. Demo Execution Feature

### 3.1 Demo Panel
- **Trigger**: "Start DEMO" button on main configuration screen
- **New Pane/Modal**: Dedicated demo window opens
- **Actions**:
  - Load sample data (from pre-uploaded event samples or file)
  - Execute API calls with mapped parameters
  - Display processing progress with motion graphics

### 3.2 Processing Visualization
- **Progress Indicators**:
  - Processing animation/spinner for each record
  - Progress bar showing records processed vs total
  - Status badges (pending, processing, success, failed)
- **Motion Graphics**: Animated workflow showing:
  - Source data flowing → Mapping transformation → API call → Response

### 3.3 Response Processing & Display
- **Extract Parameters**: Parse API response and extract key parameters
- **Display Results**: Show extracted parameters for each:
  - File record (row-by-row results)
  - Event record (record-by-record results)
- **Result Format**: Table or card view with source input + API response output

---

## 4. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│            STEP 1: SAMPLE DATA MANAGEMENT (Setup Page)          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────────────────┐  ┌───────────────────────────┐   │
│  │   Sample Event JSON       │  │   Sample API JSON         │   │
│  │   Management              │  │   Management              │   │
│  │ ┌───────────────────────┐ │  │ ┌───────────────────────┐ │   │
│  │ │ + Upload Event JSON   │ │  │ │ + Upload Request JSON │ │   │
│  │ │ • customer-event.json │ │  │ │ + Upload Response JSON│ │   │
│  │ │ • order-event.json    │ │  │ │ • crm-api-samples     │ │   │
│  │ │ • payment-event.json  │ │  │ │ • billing-api-samples │ │   │
│  │ └───────────────────────┘ │  │ └───────────────────────┘ │   │
│  └───────────────────────────┘  └───────────────────────────┘   │
│                                                                   │
│         [View/Edit Samples]  [Delete]  [Preview Schema]         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    (Samples now available)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│           STEP 2: MAIN CONFIGURATION PAGE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Source Selection│  │ API Selection│  │ Parameter Mapping│   │
│  │ • File Upload   │  │ • Select from│  │ • Visual Interface   │
│  │ • Select Event  │  │   uploaded   │  │ • Save/Load Maps │   │
│  │   Sample ▼      │  │   API samples│  │                  │   │
│  └─────────────────┘  └──────────────┘  └──────────────────┘   │
│                                                                   │
│                    [Save Config] [Start DEMO]                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       DEMO EXECUTION PANEL                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Processing Animation (Motion Graphics)                   │  │
│  │ Source Data → Mapping → API Call → Response              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Results Table/View                                       │  │
│  │ ┌─────────────────┬────────────┬──────────────────────┐  │  │
│  │ │ Source Data     │ Status     │ API Response Data    │  │  │
│  │ ├─────────────────┼────────────┼──────────────────────┤  │  │
│  │ │ Record 1        │ ✓ Success  │ Response Params      │  │  │
│  │ │ Record 2        │ ⟳ Processing│ -                    │  │  │
│  │ │ Record 3        │ ✗ Failed   │ Error Message        │  │  │
│  │ └─────────────────┴────────────┴──────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Progress: 2/5 records processed | [Stop] [Download Results]   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Key User Workflows

### 5.1 Sample Data Setup Workflow (One-time/Admin Activity)
1. Navigate to "Sample Data Management" page
2. **Upload Sample Event JSONs**:
   - Click "Add Event Sample"
   - Upload JSON file (drag-drop or file picker)
   - Review auto-detected schema
   - Assign a name/label (e.g., "Customer Event", "Order Event")
   - Save sample
3. **Upload Sample API JSONs**:
   - Click "Add API Sample"
   - Upload Request JSON file
   - Upload Response JSON file
   - Link them as a pair with API name (e.g., "CRM API", "Billing API")
   - Save sample
4. Repeat for all required samples

### 5.2 Configuration Workflow (Main Activity)
1. Navigate to "Configuration" page
2. **Source Selection**:
   - Choose source type (File or Event)
   - If File: Upload file
   - If Event: Select from dropdown of **pre-uploaded event samples**
3. **API Selection**: Select from dropdown of **pre-uploaded API samples**
4. **Mapping**: Map source fields to API parameters using visual interface
5. Save configuration with a name
6. Proceed to demo execution

### 5.3 Demo Execution Workflow
1. User clicks "Start DEMO"
2. Demo panel opens showing:
   - Selected source, API, and mapping summary
   - Motion graphics of data flow
   - Processing table showing each record's status
3. System processes each record:
   - Applies mapping
   - Calls API with mapped parameters
   - Extracts response parameters
   - Updates UI with results
4. User can download results or stop demo

### 5.4 Configuration Update Workflow
1. User loads existing configuration
2. Modifies source, API, or mapping as needed
3. Saves configuration (update or new version)
4. Re-runs demo with updated config

---

## 6. Technical Components

### 6.1 Frontend Components
- **Sample Data Management Page** (Separate Page):
  - Sample Event JSON Uploader with drag-drop
  - Sample API JSON Uploader (request + response pairs)
  - List/grid view of all uploaded samples
  - Preview, edit, delete functionality
- **Main Configuration Page**:
  - Source Selector: Radio/dropdown + conditional loader
  - Event Sample Dropdown: Select from pre-uploaded samples
  - API Sample Dropdown: Select from pre-uploaded API samples
  - Mapping Interface: Visual drag-drop or connect interface
- **Demo Panel**: Full-screen or side pane with progress tracking
- **Results Table**: Sortable, filterable display of results
- **Motion Graphics**: SVG/Canvas animations for data flow

### 6.2 Backend Services
- **Sample Data Manager**:
  - JSON file upload handler
  - Schema extraction and validation
  - Sample data storage and retrieval (CRUD)
  - Request/response sample linking to APIs
- **Source Handler**: File parser (CSV/JSON/XML), Event stream listener
- **API Integration**: HTTP client, request builder, response parser
- **Mapping Engine**: Apply source-to-API parameter mapping
- **Configuration Manager**: CRUD operations for saved configs
- **Demo Executor**: Orchestrate batch processing with streaming results

### 6.3 Data Storage
- **Sample Data Storage** (Prerequisite Data):
  - Sample event JSON files with metadata
  - Sample API request JSON files
  - Sample API response JSON files
  - Extracted schemas and field metadata
- **Configurations Database**: Store mapping + source + API selections
- **Execution Logs**: Track demo runs and results

---

## 7. Configuration Structure (Example)

```json
{
  "configId": "config-001",
  "name": "Customer-to-CRM Sync",
  "source": {
    "type": "file",
    "fileType": "csv",
    "fields": ["customerId", "name", "email", "phone"]
  },
  "sampleEventData": {
    "uploaded": true,
    "fileName": "customer-event-sample.json",
    "schema": {
      "customerId": "string",
      "name": "string",
      "email": "string",
      "phone": "string"
    },
    "sampleRecords": [
      {"customerId": "C001", "name": "Sample User", "email": "sample@test.com", "phone": "123-456-7890"}
    ]
  },
  "destination": {
    "type": "api",
    "apiId": "crm-api-v2",
    "endpoint": "/api/customers/create",
    "method": "POST"
  },
  "sampleApiData": {
    "request": {
      "fileName": "crm-api-request-sample.json",
      "sample": {
        "customer_id": "string",
        "customer_name": "string",
        "customer_email": "string",
        "customer_phone": "string"
      }
    },
    "response": {
      "fileName": "crm-api-response-sample.json",
      "sample": {
        "id": "string",
        "status": "string",
        "timestamp": "datetime",
        "warnings": "array"
      }
    }
  },
  "mapping": {
    "customerId": "api_field_customer_id",
    "name": "api_field_name",
    "email": "api_field_email",
    "phone": "api_field_phone"
  },
  "responseExtraction": [
    "customerId",
    "status",
    "createdAt"
  ],
  "createdAt": "2026-01-26T10:00:00Z",
  "updatedAt": "2026-01-26T10:00:00Z"
}
```

---

## 8. Expected Results Format

```
Source Record → Mapping Applied → API Call → Response Extraction → Display

Example:
Input (File Row): 
{
  "customerId": "C123",
  "name": "John Doe",
  "email": "john@example.com"
}

↓ (Mapping Applied)

API Request:
{
  "customer_id": "C123",
  "customer_name": "John Doe",
  "customer_email": "john@example.com"
}

↓ (API Response)

API Response:
{
  "id": "CRM-456",
  "status": "created",
  "timestamp": "2026-01-26T10:15:32Z",
  "warnings": []
}

↓ (Extract Parameters)

Displayed in Results:
{
  "sourceData": "C123 | John Doe | john@example.com",
  "apiResponse_id": "CRM-456",
  "apiResponse_status": "created",
  "apiResponse_timestamp": "2026-01-26T10:15:32Z"
}
```

---

## 9. Implementation Phases

### Phase 1: Foundation
- [ ] Project setup (tech stack selection)
- [ ] UI layout and navigation structure
- [ ] Database/storage setup

### Phase 2: Sample Data Management Page (Separate Page - Build First)
- [ ] Create dedicated "Sample Data Management" page
- [ ] Sample Event JSON upload interface:
  - [ ] Drag-drop component
  - [ ] JSON validation
  - [ ] Schema auto-detection and preview
  - [ ] Name/label assignment
  - [ ] List view of uploaded samples
  - [ ] Edit/delete functionality
- [ ] Sample API JSON upload interface:
  - [ ] Request JSON uploader
  - [ ] Response JSON uploader
  - [ ] Pair linking with API name
  - [ ] Side-by-side preview
  - [ ] List view of uploaded API samples
- [ ] Sample data storage backend (CRUD APIs)

### Phase 3: Main Configuration Page
- [ ] Source selection interface:
  - [ ] File upload option
  - [ ] Event sample dropdown (populated from Phase 2 uploads)
- [ ] API selection dropdown (populated from Phase 2 uploads)
- [ ] Parameter mapping interface (visual)
- [ ] Configuration save/load functionality

### Phase 4: Demo & Execution
- [ ] Demo panel creation
- [ ] File/event processing engine
- [ ] API integration and calling
- [ ] Use pre-uploaded sample data in demo mode

### Phase 5: Visualization
- [ ] Motion graphics for data flow
- [ ] Results display with extracted parameters
- [ ] Progress tracking and status indicators

### Phase 6: Polish & Enhancement
- [ ] Error handling and user feedback
- [ ] Testing and optimization
- [ ] Documentation and user guide

---

## 10. Questions for Clarification

1. **Technology Stack**: What framework/language preference? (React/Vue/Angular for frontend, Node/Python/Java for backend?)
2. **File Formats**: Which file formats to support? (CSV, JSON, XML, Excel?)
3. **Event Source**: Kafka, RabbitMQ, or custom event stream?
4. **API Authentication**: OAuth, API Key, Basic Auth, or other?
5. **Multi-Source Mapping**: Can a single API call involve data from multiple records?
6. **Error Handling**: Retry logic, partial success handling?
7. **Scalability**: Expected volume (batch size, number of parallel API calls)?
8. **Database**: Preference for storage (SQL, NoSQL, file-based)?

---

## Summary
This ESB application provides an intuitive interface for non-technical users with a **two-stage workflow**:

**Stage 1: Sample Data Management (Setup/Admin)**
- ✅ **Upload sample event JSON files** - define event schemas and demo data
- ✅ **Upload sample API JSON files** - define request/response structures as pairs

**Stage 2: Main Configuration (User Activity)**
- ✅ Select data sources (files or pre-uploaded event samples)
- ✅ Select API destinations (from pre-uploaded API samples)
- ✅ Map source parameters to API fields using visual interface
- ✅ Save and reuse configurations
- ✅ Execute demo batches with visual feedback
- ✅ Extract and display API response data
- ✅ Monitor processing with motion graphics

Ready to proceed with implementation based on your feedback!
