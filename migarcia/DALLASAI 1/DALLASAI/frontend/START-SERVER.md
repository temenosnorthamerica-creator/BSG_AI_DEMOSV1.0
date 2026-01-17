# How to Start the Dev Server

## Quick Start

Open a **new PowerShell terminal** in the `frontend` directory and run:

```powershell
npm run dev
```

Or use the batch file:
```cmd
start.bat
```

## What You Should See

When the server starts successfully, you'll see output like:

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
➜  press h + enter to show help
```

Then open your browser to: **http://localhost:3000**

## If It Doesn't Work

1. **Kill any stuck processes:**
   ```powershell
   Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
   ```

2. **Check for errors** in the terminal output

3. **Verify Node.js is installed:**
   ```powershell
   node --version
   ```
   Should show v18+ or v20+

4. **Reinstall dependencies if needed:**
   ```powershell
   npm install
   ```

## Troubleshooting

- **Port 3000 already in use:** The script will try to kill it, but if it persists, manually kill the process
- **Connection refused:** Make sure the server actually started (check terminal output)
- **Build errors:** Run `npm run build` to see compilation errors

