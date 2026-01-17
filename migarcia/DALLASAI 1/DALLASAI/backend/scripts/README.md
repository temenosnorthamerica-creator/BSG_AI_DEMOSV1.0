# MongoDB Connection Scripts

This directory contains scripts for testing and managing MongoDB connections.

## Scripts

### 1. `test_mongodb_connection.py`

Tests the MongoDB connection and displays connection information.

**Usage:**
```bash
cd backend
python scripts/test_mongodb_connection.py
```

**What it does:**
- Tests MongoDB connection
- Displays server information
- Lists all collections
- Performs read/write operations to verify functionality

**Requirements:**
- `DATABASE_URL` environment variable must be set
- `DATABASE_NAME` environment variable (defaults to `bsg_demo`)

### 2. `mongodb_utils.py`

Provides utilities for MongoDB database operations.

**Usage:**

```bash
# List all collections
python scripts/mongodb_utils.py list

# Get collection information
python scripts/mongodb_utils.py info --collection users

# Show collection contents
python scripts/mongodb_utils.py show --collection users --limit 5

# Create a collection
python scripts/mongodb_utils.py create-collection --collection my_collection

# Create an index
python scripts/mongodb_utils.py create-index --collection users --field email --unique
```

**Available Actions:**
- `list` - List all collections with document counts
- `info` - Get detailed information about a collection
- `show` - Display collection contents
- `create-collection` - Create a new collection
- `create-index` - Create an index on a collection

## Environment Setup

Before running the scripts, ensure environment variables are set:

```bash
export DATABASE_URL="mongodb://username:password@host:port/database?ssl=true&replicaSet=globaldb"
export DATABASE_NAME="bsg_demo"
```

Or create a `.env` file in the backend directory:

```env
DATABASE_URL=mongodb://username:password@host:port/database?ssl=true&replicaSet=globaldb
DATABASE_NAME=bsg_demo
```

## Examples

### Test Connection

```bash
python scripts/test_mongodb_connection.py
```

### List Collections

```bash
python scripts/mongodb_utils.py list
```

### View Users Collection

```bash
python scripts/mongodb_utils.py show --collection users --limit 10
```

### Create Security Paragraphs Collection

```bash
python scripts/mongodb_utils.py create-collection --collection security_paragraphs
python scripts/mongodb_utils.py create-index --collection security_paragraphs --field paragraph_number --unique
```

## Troubleshooting

### ModuleNotFoundError

If you get `ModuleNotFoundError: No module named 'motor'`, install dependencies:

```bash
pip install -r requirements.txt
```

Or install motor directly:

```bash
pip install motor
```

### Connection Errors

If connection fails:
1. Verify `DATABASE_URL` is set correctly
2. Check network connectivity
3. For Azure Cosmos DB, ensure IP is whitelisted
4. Verify MongoDB server is running (for local MongoDB)

### Import Errors

If you get import errors, ensure you're running from the backend directory:

```bash
cd backend
python scripts/test_mongodb_connection.py
```

