# Debit Card Management API

FastAPI backend for the debit card management simulator.

## Setup

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Unix/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload
```

## Environment Variables

Create a `.env` file (optional):

```env
DEBUG=True
HOST=0.0.0.0
PORT=8000
```

## Project Structure

```
backend/
├── app/
│   ├── main.py           # FastAPI application
│   ├── api/              # API endpoints
│   │   ├── auth.py       # PIN authentication
│   │   ├── accounts.py   # Account operations
│   │   ├── transactions.py # Transaction operations
│   │   └── health.py     # Health checks
│   ├── models/           # Pydantic models
│   │   ├── account.py
│   │   ├── card.py
│   │   └── transaction.py
│   ├── services/         # Business logic
│   │   ├── account_service.py
│   │   ├── card_service.py
│   │   └── event_publisher.py
│   └── core/             # Configuration
│       ├── config.py
│       └── event_hub.py
└── requirements.txt
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/api/v1/docs
- ReDoc: http://localhost:8000/api/v1/redoc
