# MongoDB Connection Guide

This guide explains how the application connects to MongoDB and how to test/manage the connection.

## Overview

The application uses **Motor** (async MongoDB driver) to connect to MongoDB. The connection is managed through the `app.core.database` module.

## Connection Configuration

### Environment Variables

The MongoDB connection is configured via environment variables:

- `DATABASE_URL` - Full MongoDB connection string
  - Example: `mongodb://username:password@host:port/database?ssl=true&replicaSet=globaldb`
  - For Azure Cosmos DB: Includes SSL and replica set parameters
  
- `DATABASE_NAME` - Database name (default: `bsg_demo`)

- `DB_MAX_POOL_SIZE` - Maximum connection pool size (default: 50)

- `DB_MIN_POOL_SIZE` - Minimum connection pool size (default: 10)

- `DB_CONNECT_TIMEOUT` - Connection timeout in seconds (default: 30)

### Connection String Format

**Azure Cosmos DB (MongoDB API):**
```
mongodb://<username>:<password>@<account>.mongo.cosmos.azure.com:10255/<database>?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@<account>@
```

**Local MongoDB:**
```
mongodb://localhost:27017/<database>
```

## Connection Lifecycle

### Application Startup

1. When the FastAPI application starts, the `lifespan` function in `app/main.py` calls `init_db()`
2. `init_db()` creates a MongoDB client with connection pooling
3. The connection is tested with a `ping` command
4. The database instance is stored globally for reuse

### Application Shutdown

1. On application shutdown, `close_db()` is called
2. All connections are closed gracefully
3. Client and database references are cleared

## Testing the Connection

### Using the Test Script

Run the connection test script:

```bash
cd backend
python scripts/test_mongodb_connection.py
```

This script will:
- Test the MongoDB connection
- Display server information
- List all collections
- Perform read/write operations to verify functionality

### Using MongoDB Utils

The `mongodb_utils.py` script provides various utilities:

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

## Connection Pooling

The application uses connection pooling for efficient database access:

- **Min Pool Size**: Maintains a minimum number of connections
- **Max Pool Size**: Limits maximum concurrent connections
- **Connection Reuse**: Connections are reused across requests
- **Automatic Management**: Motor handles connection lifecycle

## Error Handling

### Connection Errors

If connection fails, the application will:
1. Log detailed error information
2. Raise an exception to prevent startup
3. Provide troubleshooting hints in logs

### Common Issues

**Connection Timeout:**
- Check network connectivity
- Verify firewall rules
- Increase `DB_CONNECT_TIMEOUT` if needed

**Authentication Failed:**
- Verify username and password in connection string
- Check user permissions in MongoDB

**Server Selection Timeout:**
- Ensure MongoDB server is running
- Check network connectivity
- Verify connection string format

**Azure Cosmos DB Issues:**
- Ensure IP address is whitelisted in Azure portal
- Verify connection string includes SSL parameters
- Check replica set configuration

## Health Checks

The application provides health check endpoints:

- `GET /api/v1/health` - Comprehensive health check including database
- `GET /api/v1/ready` - Readiness probe (checks database connection)
- `GET /api/v1/live` - Liveness probe

The database health check (`get_db_health()`) verifies:
- Connection is initialized
- Ping command succeeds
- Server information is accessible

## Best Practices

1. **Connection String Security**
   - Never commit connection strings with credentials to version control
   - Use environment variables or secret management
   - Rotate credentials regularly

2. **Connection Pooling**
   - Set appropriate pool sizes based on application load
   - Monitor connection pool usage
   - Adjust timeouts based on network conditions

3. **Error Handling**
   - Always handle connection errors gracefully
   - Implement retry logic for transient failures
   - Log connection issues for debugging

4. **Testing**
   - Test connection before deploying
   - Use health checks in production
   - Monitor connection metrics

## Troubleshooting

### Check Connection Status

```python
from app.core.database import get_db_health
health = await get_db_health()
print(health)
```

### Manual Connection Test

```python
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client = AsyncIOMotorClient(settings.DATABASE_URL)
await client.admin.command('ping')
print("Connection successful!")
```

### View Connection Info

```python
from app.core.database import get_client
client = get_client()
server_info = await client.server_info()
print(f"MongoDB version: {server_info['version']}")
```

## Related Files

- `app/core/database.py` - Database connection module
- `app/core/config.py` - Configuration settings
- `app/main.py` - Application startup (initializes database)
- `scripts/test_mongodb_connection.py` - Connection test script
- `scripts/mongodb_utils.py` - MongoDB utility script

## Additional Resources

- [Motor Documentation](https://motor.readthedocs.io/)
- [MongoDB Connection String Format](https://www.mongodb.com/docs/manual/reference/connection-string/)
- [Azure Cosmos DB MongoDB API](https://docs.microsoft.com/azure/cosmos-db/mongodb/)

