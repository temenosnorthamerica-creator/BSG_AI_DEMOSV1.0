# Debit Card Management Application

A banking ecosystem simulator for debit card management with Azure Event Hub integration.

## Features

- PIN authentication (4-digit)
- Multiple account support (Checking, Savings, Investment)
- Transaction operations:
  - Check Balance
  - Withdraw Cash
  - Deposit Cash
  - Deposit Check
  - Transfer Between Accounts
- Transaction history
- Real-time event publishing to Azure Event Hub

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Lucide React (icons)
- Axios

### Backend
- FastAPI (Python)
- Azure Event Hub SDK
- Pydantic

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs on http://localhost:8000

API Documentation: http://localhost:8000/api/v1/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173

## Demo Credentials

- **Card Number**: 4242424242424242
- **PIN**: 1234

## Demo Accounts

| Account | Balance |
|---------|---------|
| Checking | $5,000.00 |
| Savings | $10,000.00 |
| Investment | $25,000.00 |

## Event Hub Configuration

Events are published to:
- **Namespace**: aiprojectseventhubns.servicebus.windows.net
- **Topic**: debitcards

### Event Schema

```json
{
  "eventId": "uuid",
  "eventType": "WITHDRAWAL | CASH_DEPOSIT | CHECK_DEPOSIT | TRANSFER | BALANCE_INQUIRY",
  "timestamp": "ISO8601",
  "cardNumber": "**** **** **** 4242",
  "accountId": "1001",
  "accountName": "Checking",
  "amount": 100.00,
  "currency": "USD",
  "balanceBefore": 5000.00,
  "balanceAfter": 4900.00,
  "status": "SUCCESS",
  "metadata": {}
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/pin | Authenticate with PIN |
| GET | /api/v1/accounts | Get all accounts |
| GET | /api/v1/accounts/{id}/balance | Get account balance |
| POST | /api/v1/transactions/withdraw | Withdraw funds |
| POST | /api/v1/transactions/deposit/cash | Deposit cash |
| POST | /api/v1/transactions/deposit/check | Deposit check |
| POST | /api/v1/transactions/transfer | Transfer between accounts |
| GET | /api/v1/transactions/history | Get transaction history |
