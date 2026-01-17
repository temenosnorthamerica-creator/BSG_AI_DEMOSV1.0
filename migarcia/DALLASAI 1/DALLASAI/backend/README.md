# BSG Demo Platform - Backend API

Backend API for the BSG Demo Platform, providing authentication, video management, and common services for demonstrating Temenos products.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control (RBAC)
- **User Management**: Registration, login, logout, and session management
- **Video Storage & Streaming**: Efficient video upload, storage, and HTTP range-based streaming
- **Database Management**: MongoDB (Azure Cosmos DB) with Motor async driver
- **Structured Logging**: JSON-formatted logs with correlation IDs and audit trails
- **API Documentation**: Auto-generated OpenAPI/Swagger documentation
- **Health Checks**: Kubernetes-compatible health, readiness, and liveness probes
- **Rate Limiting**: Protection against API abuse
- **Security**: Input validation, CORS, security headers, and secret management

## Technology Stack

- **Framework**: FastAPI 0.109+
- **Database**: MongoDB (Azure Cosmos DB for MongoDB API)
- **Driver**: Motor (async MongoDB driver)
- **ODM**: Pydantic models with ObjectId
- **Authentication**: JWT (python-jose)
- **Password Hashing**: bcrypt
- **Caching**: Redis (optional)
- **Python**: 3.11+

## Project Structure

```
backend/
├── app/
│   ├── api/           # API route handlers
│   │   ├── auth.py    # Authentication endpoints
│   │   └── health.py  # Health check endpoints
│   ├── core/          # Core services
│   │   ├── config.py  # Configuration management
│   │   ├── database.py # Database connection & utilities
│   │   └── logging.py # Logging service
│   ├── middleware/    # Custom middleware
│   │   ├── auth_middleware.py    # Authentication dependencies
│   │   ├── error_handler.py      # Error handling
│   │   ├── rate_limiter.py       # Rate limiting
│   │   └── request_middleware.py # Request logging
│   ├── models/        # Database models
│   │   └── user.py    # User and session models
│   ├── services/      # Business logic services
│   │   ├── auth_service.py  # Authentication service
│   │   └── video_service.py # Video storage service
│   ├── utils/         # Utility functions
│   │   ├── datetime_utils.py # Date/time utilities
│   │   ├── security.py       # Security utilities
│   │   └── validators.py     # Validation utilities
│   └── main.py        # FastAPI application
├── tests/             # Test suites
├── uploads/           # Video uploads directory
├── Dockerfile         # Docker configuration
└── requirements.txt   # Python dependencies
```

## Quick Start

### Prerequisites

- Docker or Podman
- Python 3.11+ (for local development)
- MongoDB connection string (Azure Cosmos DB or local MongoDB)

### Using Docker/Podman (Recommended)

The platform automatically detects whether you have Docker or Podman installed.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/georgasa/bsg-demo-platform.git
   cd bsg-demo-platform
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start services** (Linux/Mac):
   ```bash
   ./start.sh up
   ```

   Or on Windows:
   ```cmd
   start.bat up
   ```

4. **Access the API**:
   - API: http://localhost:8000
   - Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/api/v1/health

### Startup Script Commands

```bash
./start.sh up        # Start all services
./start.sh down      # Stop all services
./start.sh restart   # Restart all services
./start.sh logs      # Show service logs
./start.sh status    # Show service status
./start.sh migrate   # Run database migrations
```

### Local Development (Without Docker)

1. **Create virtual environment**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up MongoDB connection**:
   - For Azure Cosmos DB: Use the connection string from Azure portal
   - For local MongoDB: Use `mongodb://localhost:27017/bsg_demo`

4. **Configure environment**:
   ```bash
   cp ../.env.example ../.env
   # Edit .env with your MongoDB connection string
   ```

5. **Seed database (optional)**:
   ```bash
   python app/db_seed.py
   ```

6. **Start the server**:
   ```bash
   uvicorn app.main:app --reload
   ```

## Database Setup

MongoDB is schema-less, so no migrations are needed. Collections are created automatically when data is inserted.

### Seed initial data

```bash
python app/db_seed.py
```

### Create indexes

Indexes are created programmatically in the code. See `app/core/database.py` and `app/db_seed.py` for index creation.

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user

### Health Checks

- `GET /api/v1/health` - Comprehensive health check
- `GET /api/v1/ready` - Readiness probe (Kubernetes)
- `GET /api/v1/live` - Liveness probe (Kubernetes)
- `GET /api/v1/metrics` - Basic metrics

## Configuration

Configuration is managed through environment variables. See [.env.example](../.env.example) for all available options.

### Key Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | MongoDB connection string | Required |
| `DATABASE_NAME` | MongoDB database name | bsg_demo |
| `JWT_SECRET_KEY` | Secret for JWT signing | Required |
| `ENVIRONMENT` | Environment (development/staging/production) | development |
| `LOG_LEVEL` | Logging level | INFO |
| `RATE_LIMIT_ENABLED` | Enable rate limiting | True |

## Security

### Authentication

- JWT-based authentication with access and refresh tokens
- Access tokens expire in 30 minutes (configurable)
- Refresh tokens expire in 7 days (configurable)
- Secure password hashing with bcrypt (12 rounds)

### Authorization

Role-based access control with three roles:
- **Admin**: Full access to all resources
- **User**: Standard user access
- **Guest**: Limited read-only access

### Security Headers

- HSTS (HTTP Strict Transport Security)
- X-Content-Type-Options
- X-Frame-Options
- Content Security Policy (CSP)

### Input Validation

- All inputs validated using Pydantic models
- SQL injection prevention via ORM
- XSS prevention via output encoding
- File upload validation (type, size)

## Logging

### Structured Logging

All logs are output in JSON format with:
- Timestamp (ISO 8601)
- Log level
- Logger name
- Message
- Request ID (correlation ID)
- Additional context

### Audit Logging

Security-relevant events are logged:
- Authentication attempts (success/failure)
- Authorization failures
- Data modifications
- Admin actions

## Testing

### Run all tests

```bash
pytest
```

### Run with coverage

```bash
pytest --cov=app --cov-report=html
```

### Run specific test file

```bash
pytest tests/unit/test_auth.py
```

## Deployment

### Docker Build

```bash
docker build -t bsg-backend:latest ./backend
```

### Environment Variables

Ensure all required environment variables are set:
- Use secret managers (AWS Secrets Manager, HashiCorp Vault) in production
- Never commit `.env` files to version control
- Rotate JWT secrets regularly

### Health Checks

Configure health checks in your orchestrator:

**Kubernetes**:
```yaml
livenessProbe:
  httpGet:
    path: /api/v1/live
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/v1/ready
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Monitoring

### Metrics

Basic metrics available at `/api/v1/metrics`:
- Database connection pool status
- Request counts and latencies
- Error rates

### Logging

Logs are written to stdout/stderr in JSON format, compatible with:
- ELK Stack (Elasticsearch, Logstash, Kibana)
- CloudWatch Logs
- Datadog
- Splunk

## Troubleshooting

### Database connection errors

```bash
# Test MongoDB connection
python -c "from motor.motor_asyncio import AsyncIOMotorClient; import asyncio; async def test(): client = AsyncIOMotorClient('YOUR_CONNECTION_STRING'); await client.admin.command('ping'); print('Connected!'); asyncio.run(test())"

# Check database collections
# Use MongoDB Compass or mongo shell to verify collections exist
```

### Index creation

```bash
# Indexes are created automatically, but you can verify them:
# Connect to MongoDB and run: db.users.getIndexes()
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests
4. Run linters: `black . && flake8 && mypy .`
5. Run tests: `pytest`
6. Submit a pull request

## License

Copyright © 2025 Temenos. All rights reserved.
