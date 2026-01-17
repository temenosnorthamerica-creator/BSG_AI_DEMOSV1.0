# TEST_NEW_APP - Help Guide

## Starting the Application

### Option 1: Start Both Frontend and Backend Together
```bash
cd TEST_NEW_APP
npm start
```
This runs both servers concurrently using the `concurrently` package.

### Option 2: Start Servers Separately

**Start Backend (Express API Server):**
```bash
cd TEST_NEW_APP
npm run backend
```
- Runs on: http://127.0.0.1:3031
- Health check: http://127.0.0.1:3031/api/health

**Start Frontend (Vite Dev Server):**
```bash
cd TEST_NEW_APP
npm run dev
```
- Runs on: http://localhost:3030 (or next available port)

---

## Stopping the Application

### If running with `npm start` (both servers):
Press `Ctrl + C` in the terminal to stop both servers.

### If running servers separately:
Press `Ctrl + C` in each terminal window to stop the respective server.

### Force Kill (if servers don't stop):

**Windows (Command Prompt/PowerShell):**
```bash
# Find process using port 3031 (backend)
netstat -ano | findstr :3031

# Kill process by PID
taskkill /PID <PID> /F

# Find process using port 3030 (frontend)
netstat -ano | findstr :3030

# Kill process by PID
taskkill /PID <PID> /F
```

**Alternative - Kill all Node processes:**
```bash
taskkill /F /IM node.exe
```

---

## Available NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm start` | `concurrently "npm run backend" "npm run dev"` | Start both servers |
| `npm run dev` | `vite` | Start frontend only |
| `npm run backend` | `node backend/server.js` | Start backend only |
| `npm run build` | `tsc && vite build` | Build for production |
| `npm run preview` | `vite preview` | Preview production build |

---

## Port Configuration

| Service | Default Port | Config File |
|---------|--------------|-------------|
| Frontend (Vite) | 3030 | `vite.config.ts` |
| Backend (Express) | 3031 | `backend/server.js` |

**Note:** If a port is in use, Vite will automatically try the next available port (e.g., 3038 if 3030-3037 are in use).

---

## API Endpoints

### Customer Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/customer` | Create customer and send event to Azure Event Hub |
| GET | `/api/customer/:customerId` | Search customer by ID (checks memory, then Event Hub) |
| GET | `/api/customers` | List all customers in memory |

### Account Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/account` | Create account and send event to Azure Event Hub |
| GET | `/api/account/:accountId` | Search account by ID (checks memory, then Event Hub) |
| GET | `/api/accounts` | List all accounts in memory |

---

## Troubleshooting

### "localhost" not resolving
Use `127.0.0.1` instead of `localhost`:
- Backend: http://127.0.0.1:3031
- Frontend: http://127.0.0.1:3030

### Port already in use
1. Check which process is using the port:
   ```bash
   netstat -ano | findstr :<PORT>
   ```
2. Kill the process or change the port in config files.

### Event Hub connection issues
- Check `backend/eventHubService.js` for connection string
- Verify Azure Event Hub credentials in `Eventhub.txt`
